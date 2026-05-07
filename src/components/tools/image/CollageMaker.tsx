import React, { useState, useRef, useEffect, useCallback } from "react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { DropZone } from "@/components/shared/DropZone"
import { Layout, Download, Grid, Layers, Trash2, Plus, Move, Image as ImageIcon, MousePointer2, Type, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { downloadBlob, exportCanvas } from "@/lib/canvas"
import { cn } from "@/lib/utils"
import { ColorPickerInput } from "@/components/shared/ColorPickerInput"

interface CollageImage {
  id: string
  file: File
  url: string
}

type CollageLayout = "grid-2x2" | "h-split" | "v-split" | "grid-3x3" | "masonry" | "free"

export function CollageMaker() {
  const [images, setImages] = useState<CollageImage[]>([])
  const [layout, setLayout] = useState<CollageLayout>("grid-2x2")
  const [gap, setGap] = useState(20)
  const [bgColor, setBgColor] = useState("#000000")
  const [isProcessing, setIsProcessing] = useState(false)
  const [hasSelection, setHasSelection] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvas = useRef<any>(null)
  const unmountedRef = useRef(false)

  // Initialize fabric when entering the editor mode
  useEffect(() => {
    if (images.length === 0 || !canvasRef.current) return

    const initFabric = async () => {
      const fabricModule = await import("fabric")
      const fabric: any = fabricModule.default || fabricModule;
      if (unmountedRef.current || !canvasRef.current) return

      // Dispose existing
      if (fabricCanvas.current) {
        fabricCanvas.current.dispose()
        fabricCanvas.current = null
      }

      const canvas = new (fabric.Canvas || fabricModule.Canvas)(canvasRef.current, {
        width: 800,
        height: 800,
        backgroundColor: bgColor,
        preserveObjectStacking: true
      })

      if (unmountedRef.current) {
        canvas.dispose()
        return
      }

      fabricCanvas.current = canvas

      canvas.on('selection:created', () => setHasSelection(true))
      canvas.on('selection:updated', () => setHasSelection(true))
      canvas.on('selection:cleared', () => setHasSelection(false))

      // Add existing images to the new canvas
      for (const imgData of images) {
         if (unmountedRef.current || !fabricCanvas.current) break;
         await addImageToCanvas(imgData, fabric, fabricModule)
      }
    }

    initFabric()
    return () => {
      if (fabricCanvas.current) {
        fabricCanvas.current.dispose()
        fabricCanvas.current = null
      }
    }
  }, [images.length === 0]) // Re-init only when going from 0 to >0

  const addImageToCanvas = async (imgData: CollageImage, fabric: any, fabricModule: any) => {
    if (!fabricCanvas.current) return
    
    const ImageClass = fabric.FabricImage || fabricModule.FabricImage || fabric.Image || fabricModule.Image;
    
    let img: any;
    if (ImageClass.fromURL) {
       img = await ImageClass.fromURL(imgData.url, { crossOrigin: 'anonymous' })
    } else {
       img = new ImageClass(imgData.url, { crossOrigin: 'anonymous' })
    }

    img.set({
      cornerStyle: 'circle',
      cornerColor: '#F59E0B',
      transparentCorners: false,
      borderColor: '#F59E0B',
      padding: 10
    })
    img.customId = imgData.id
    fabricCanvas.current.add(img)
    fabricCanvas.current.renderAll()
  }

  const handleDrop = async (files: File[]) => {
    setIsLoading(true)
    const newImgs = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      url: URL.createObjectURL(file)
    }))

    // Update state first so we move to the editor view
    setImages(prev => [...prev, ...newImgs])
    
    // If fabric is already ready, add them immediately
    if (fabricCanvas.current) {
       const fabricModule = await import("fabric")
       const fabric: any = fabricModule.default || fabricModule;
       for (const imgData of newImgs) {
          await addImageToCanvas(imgData, fabric, fabricModule)
       }
    }
    setIsLoading(false)
  }

  const applyLayout = useCallback(() => {
    if (!fabricCanvas.current) return
    
    const allObjects = fabricCanvas.current.getObjects()
    const imgs = allObjects.filter((obj: any) => obj.type === 'image') as any[]
    
    if (layout === "free") {
      imgs.forEach(img => {
        img.set({ selectable: true, evented: true })
      })
      fabricCanvas.current.renderAll()
      return
    }

    const size = 800
    const g = gap
    
    const positionImage = (img: any, x: number, y: number, w: number, h: number) => {
      img.set({
        left: x,
        top: y,
        originX: 'left',
        originY: 'top',
        scaleX: w / (img.width || 1),
        scaleY: h / (img.height || 1),
        selectable: false,
        evented: false
      })
    }

    if (layout === "grid-2x2") {
      const w = (size - 3 * g) / 2
      const h = (size - 3 * g) / 2
      if (imgs[0]) positionImage(imgs[0], g, g, w, h)
      if (imgs[1]) positionImage(imgs[1], w + 2 * g, g, w, h)
      if (imgs[2]) positionImage(imgs[2], g, h + 2 * g, w, h)
      if (imgs[3]) positionImage(imgs[3], w + 2 * g, h + 2 * g, w, h)
    } else if (layout === "h-split") {
      const w = size - 2 * g
      const h = (size - 3 * g) / 2
      if (imgs[0]) positionImage(imgs[0], g, g, w, h)
      if (imgs[1]) positionImage(imgs[1], g, h + 2 * g, w, h)
    } else if (layout === "v-split") {
      const w = (size - 3 * g) / 2
      const h = size - 2 * g
      if (imgs[0]) positionImage(imgs[0], g, g, w, h)
      if (imgs[1]) positionImage(imgs[1], w + 2 * g, g, w, h)
    }

    fabricCanvas.current.renderAll()
  }, [layout, gap])

  useEffect(() => {
    if (layout !== "free") applyLayout()
  }, [layout, gap, images.length, applyLayout])

  const removeImage = (id: string) => {
    if (fabricCanvas.current) {
      const obj = fabricCanvas.current.getObjects('image').find((o: any) => o.customId === id)
      if (obj) {
        fabricCanvas.current.remove(obj)
        fabricCanvas.current.renderAll()
      }
    }
    setImages(prev => {
      const removed = prev.find(img => img.id === id)
      if (removed) URL.revokeObjectURL(removed.url)
      return prev.filter(img => img.id !== id)
    })
  }

  const clearAll = () => {
    if (fabricCanvas.current) {
      fabricCanvas.current.clear()
      fabricCanvas.current.backgroundColor = bgColor
    }
    images.forEach(img => URL.revokeObjectURL(img.url))
    setImages([])
  }

  const handleDownload = async () => {
    if (!fabricCanvas.current) return
    setIsProcessing(true)
    try {
      const blob = await exportCanvas(fabricCanvas.current)
      if (blob) {
        downloadBlob(blob, `vanity-collage-${Date.now()}.png`)
        toast.success("Collage exported!")
      }
    } catch (error) {
      toast.error("Export failed")
    } finally {
      setIsProcessing(false)
    }
  }

  const STICKERS = ["✨", "💖", "🔥", "🌈", "🦋", "🌸", "⚡️", "🎀", "💀", "👑", "🍕", "🎉"]

  const addTextSticker = async (textString = "Text") => {
    if (!fabricCanvas.current) return
    const fabricModule = await import("fabric")
    const fabric: any = fabricModule.default || fabricModule;
    const TextClass = fabric.IText || fabricModule.IText;
    const text = new TextClass(textString, {
      left: 400,
      top: 400,
      fill: "#ffffff",
      fontSize: 80,
      originX: "center",
      originY: "center"
    })
    fabricCanvas.current.add(text)
    fabricCanvas.current.setActiveObject(text)
    fabricCanvas.current.renderAll()
  }

  const deleteSelected = () => {
    if (!fabricCanvas.current) return
    const activeObjects = fabricCanvas.current.getActiveObjects()
    activeObjects.forEach((obj: any) => {
      fabricCanvas.current.remove(obj)
      if (obj.type === 'image' && obj.customId) {
        removeImage(obj.customId)
      }
    })
    fabricCanvas.current.discardActiveObject()
    fabricCanvas.current.renderAll()
  }

  if (images.length === 0) {
    return (
      <ToolUploadLayout title="Collage Maker" description="Combine multiple images into a beautiful layout." icon={Layout}>
        <div className="max-w-2xl mx-auto">
          <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} multiple />
        </div>
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout title="Collage Maker" description="Arrange images in high-res grids or free-form compositions." icon={Layout} centered maxWidth="max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-panel p-8 rounded-[2rem] space-y-8 bg-black/20 border border-white/5">
            <div className="space-y-4">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Grid className="w-3 h-3 text-primary" /> Composition Layouts
               </h3>
               <div className="grid grid-cols-2 gap-3">
                 {[
                   { id: "grid-2x2", icon: Grid, label: "2×2 Grid" },
                   { id: "h-split", icon: Move, label: "H-Split" },
                   { id: "v-split", icon: Move, label: "V-Split" },
                   { id: "free", icon: MousePointer2, label: "Freeform" },
                 ].map(l => (
                   <button
                     key={l.id}
                     onClick={() => setLayout(l.id as CollageLayout)}
                     className={cn(
                       "p-5 rounded-2xl border flex flex-col items-center gap-3 transition-all",
                       layout === l.id 
                         ? "bg-primary/10 border-primary/40 shadow-inner" 
                         : "border-white/5 bg-white/5 hover:bg-white/10"
                     )}
                   >
                     <l.icon className={cn("w-6 h-6", layout === l.id ? "text-primary" : "text-white/50")} />
                     <span className="text-[9px] font-black uppercase tracking-tighter">{l.label}</span>
                   </button>
                 ))}
               </div>
            </div>
            
            <div className="space-y-6 pt-6 border-t border-white/5">
              <ColorPickerInput color={bgColor} onChange={setBgColor} label="Workspace Color" />
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                   <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Grid Gap</label>
                   <span className="text-[10px] font-mono text-primary">{gap}px</span>
                </div>
                <input type="range" min="0" max="100" value={gap} onChange={e => setGap(parseInt(e.target.value))} className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-primary" />
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-white/5">
               <button 
                 onClick={handleDownload} 
                 disabled={isProcessing}
                 className="w-full py-5 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
               >
                 {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                 Export Collage
               </button>
               <button onClick={clearAll} className="w-full py-4 bg-white/5 text-white/50 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all">
                 Clear Canvas
               </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 flex flex-col gap-6">
           <div className="glass-panel p-4 rounded-[2.5rem] bg-[#050505] border border-white/5 relative aspect-square overflow-hidden shadow-2xl flex items-center justify-center">
             <canvas 
               ref={canvasRef} 
               width={800}
               height={800}
               className="shadow-[0_40px_100px_rgba(0,0,0,0.8)] rounded-sm"
             />
             {hasSelection && (
                <button onClick={deleteSelected} className="absolute top-8 right-8 p-5 bg-red-500 text-white rounded-full shadow-2xl z-20 hover:scale-110 active:scale-95 transition-all">
                   <Trash2 className="w-6 h-6" />
                </button>
             )}
             
             {isLoading && (
                <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center gap-4">
                   <RefreshCw className="w-12 h-12 text-primary animate-spin" />
                   <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Syncing Layers...</span>
                </div>
             )}
           </div>
           
           <div className="mx-auto flex gap-6 p-3 bg-black/60 backdrop-blur-3xl rounded-[2rem] border border-white/10 shadow-2xl">
              <button 
                onClick={() => addTextSticker()} 
                className="w-14 h-14 hover:bg-primary/10 rounded-2xl transition-all text-white flex items-center justify-center group"
              >
                 <Type className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </button>
              <div className="h-10 w-px bg-white/10 my-auto" />
              <div className="flex gap-2">
                 {STICKERS.slice(0, 8).map(s => (
                   <button 
                     key={s} 
                     onClick={() => addTextSticker(s)} 
                     className="w-14 h-14 text-2xl hover:bg-white/10 hover:scale-125 rounded-2xl transition-all flex items-center justify-center"
                   >
                     {s}
                   </button>
                 ))}
              </div>
           </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
           <div className="glass-panel p-8 rounded-[2rem] border border-white/5 bg-black/20 space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                 <Layers className="w-4 h-4 text-primary" /> Active Layers ({images.length})
              </h3>
              <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                 {images.map(img => (
                   <div key={img.id} className="group relative aspect-square rounded-2xl overflow-hidden border border-white/5 bg-black/40">
                      <img src={img.url} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <button onClick={() => removeImage(img.id)} className="p-2 bg-red-500 rounded-xl hover:scale-110 transition-all">
                            <Trash2 className="w-4 h-4 text-white" />
                         </button>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
           
           <div className="rounded-[2rem] overflow-hidden border border-white/5 bg-white/5">
              <DropZone 
                onDrop={handleDrop} 
                accept={{ "image/*": [] }} 
                multiple 
                label="Add More Elements" 
              />
           </div>
        </div>
      </div>
    </ToolLayout>
  )
}
