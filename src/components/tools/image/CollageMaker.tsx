import React, { useState, useRef, useEffect, useCallback } from "react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { DropZone } from "@/components/shared/DropZone"
import { Layout, Download, Grid, Layers, Trash2, Plus, Move, Image as ImageIcon, MousePointer2, Type, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown } from "lucide-react"
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
  const [isRecording, setIsRecording] = useState(false)
  const [hasSelection, setHasSelection] = useState(false)
  const [hasLockedObjects, setHasLockedObjects] = useState(false)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvas = useRef<any>(null)
  const unmountedRef = useRef(false)

  useEffect(() => {
    return () => { unmountedRef.current = true }
  }, [])

  // Initialize fabric
  useEffect(() => {
    if (!canvasRef.current) return

    let isMounted = true
    const initFabric = async () => {
      const fabric = await import("fabric")
      if (!isMounted || !canvasRef.current) return

      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 1000,
        height: 1000,
        backgroundColor: bgColor,
        preserveObjectStacking: true
      })

      canvas.on('selection:created', () => setHasSelection(true))
      canvas.on('selection:updated', () => setHasSelection(true))
      canvas.on('selection:cleared', () => setHasSelection(false))

      fabricCanvas.current = canvas
    }

    initFabric()
    return () => {
      isMounted = false
      if (fabricCanvas.current) {
        fabricCanvas.current.dispose()
        fabricCanvas.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (fabricCanvas.current) {
      fabricCanvas.current.backgroundColor = bgColor
      fabricCanvas.current.renderAll()
    }
  }, [bgColor])

  const handleDrop = async (files: File[]) => {
    const fabric = await import("fabric")
    
    const newImgs = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      url: URL.createObjectURL(file)
    }))

    for (const imgData of newImgs) {
      const img = await fabric.Image.fromURL(imgData.url) as any
      if (unmountedRef.current || !fabricCanvas.current) return
      img.set({
        cornerStyle: 'circle',
        cornerColor: '#F59E0B',
        transparentCorners: false,
        borderColor: '#F59E0B',
        padding: 10
      })
      img.customId = imgData.id
      fabricCanvas.current.add(img)
      if (layout !== "free") applyLayout()
    }

    setImages(prev => [...prev, ...newImgs])
  }

  const applyLayout = useCallback(() => {
    if (!fabricCanvas.current) return
    
    const allObjects = fabricCanvas.current.getObjects()
    const imgs = allObjects.filter((obj: any) => obj.type === 'image') as any[]
    
    // Non-image objects (text, stickers) are always free and on top
    allObjects.filter((obj: any) => obj.type !== 'image').forEach((obj: any) => {
      obj.set({ selectable: true, evented: true })
      fabricCanvas.current?.bringObjectToFront(obj)
    })

    if (layout === "free") {
      imgs.forEach(img => {
        img.set({ selectable: true, evented: true })
      })
      fabricCanvas.current.renderAll()
      return
    }

    // Grid Auto-Layout logic
    const size = 1000
    const g = gap
    
    const positionImage = (img: any, x: number, y: number, w: number, h: number) => {
      img.set({
        scaleX: 1, scaleY: 1, angle: 0, cropX: 0, cropY: 0, width: img.getOriginalSize().width, height: img.getOriginalSize().height
      })

      const imgW = img.width || 1
      const imgH = img.height || 1
      const imgAspect = imgW / imgH
      const rectAspect = w / h
      let sx, sy, sw, sh

      if (imgAspect > rectAspect) {
        sh = imgH
        sw = sh * rectAspect
        sy = 0
        sx = (imgW - sw) / 2
      } else {
        sw = imgW
        sh = sw / rectAspect
        sx = 0
        sy = (imgH - sh) / 2
      }
      
      img.set({
        left: x,
        top: y,
        originX: 'left',
        originY: 'top',
        cropX: sx,
        cropY: sy,
        width: sw,
        height: sh,
        scaleX: w / sw,
        scaleY: h / sh,
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
    } else if (layout === "grid-3x3") {
      const w = (size - 4 * g) / 3
      const h = (size - 4 * g) / 3
      imgs.slice(0, 9).forEach((img, i) => {
        const r = Math.floor(i / 3)
        const c = i % 3
        positionImage(img, g + c * (w + g), g + r * (h + g), w, h)
      })
    } else if (layout === "masonry") {
      const colW = (size - 4 * g) / 3
      if (imgs[0]) positionImage(imgs[0], g, g, colW, (size - 3 * g) * 0.6)
      if (imgs[1]) positionImage(imgs[1], colW + 2 * g, g, colW, (size - 3 * g) * 0.4)
      if (imgs[2]) positionImage(imgs[2], 2 * colW + 3 * g, g, colW, (size - 3 * g) * 0.5)
      if (imgs[3]) positionImage(imgs[3], g, (size - 3 * g) * 0.6 + 2 * g, colW, (size - 3 * g) * 0.4 - g)
    }

    fabricCanvas.current.renderAll()
  }, [layout, gap])

  useEffect(() => {
    applyLayout()
  }, [applyLayout, images.length])

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

  const addTextSticker = async (textString = "Your Text Here") => {
    if (!fabricCanvas.current) return
    const fabric = await import("fabric")
    const text = new fabric.IText(textString, {
      left: 500,
      top: 500,
      fontFamily: "Inter, sans-serif",
      fontSize: textString.length <= 2 ? 150 : 80,
      fill: "#ffffff",
      originX: "center",
      originY: "center",
      selectable: true,
      evented: true,
      shadow: new fabric.Shadow({
        color: 'rgba(0,0,0,0.5)',
        blur: 10,
        offsetX: 2,
        offsetY: 2
      })
    })
    fabricCanvas.current.add(text)
    fabricCanvas.current.setActiveObject(text)
    fabricCanvas.current.bringObjectToFront(text)
    fabricCanvas.current.renderAll()
  }

  const STICKERS = ["✨", "💖", "🔥", "🌈", "🦋", "🌸", "⚡️", "🎀", "💀", "👑", "🍕", "🎉"]

  const deleteSelected = useCallback(() => {
    if (!fabricCanvas.current) return
    const activeObjects = fabricCanvas.current.getActiveObjects()
    if (activeObjects.length > 0) {
      const isTextEditing = activeObjects.some((obj: any) => obj.type === 'i-text' && (obj as any).isEditing)
      if (isTextEditing) return

      activeObjects.forEach((obj: any) => {
        fabricCanvas.current?.remove(obj)
        if (obj.type === 'image' && (obj as any).customId) {
          setImages(prev => prev.filter(img => img.id !== (obj as any).customId))
        }
      })
      fabricCanvas.current.discardActiveObject()
      fabricCanvas.current.renderAll()
    }
  }, [])

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

  return (
    <ToolLayout 
      title="Collage Maker" 
      description="Create stunning photo collages with interactive layouts and stickers." 
      icon={Layout}
      centered={true}
      maxWidth="max-w-7xl"
    >
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 pb-20">
        <div className="xl:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-2xl space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Layouts</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "grid-2x2", icon: Grid, label: "2×2 Grid" },
                { id: "grid-3x3", icon: Layers, label: "3×3 Grid" },
                { id: "h-split", icon: Move, label: "Horizontal" },
                { id: "v-split", icon: Move, label: "Vertical" },
                { id: "masonry", icon: Layers, label: "Masonry" },
                { id: "free", icon: MousePointer2, label: "Freeform" },
              ].map(l => (
                <button
                  key={l.id}
                  onClick={() => setLayout(l.id as CollageLayout)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                    layout === l.id ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                  )}
                >
                  <l.icon className={cn("w-5 h-5", l.id === "v-split" && "rotate-90")} />
                  <span className="text-[10px] font-bold uppercase">{l.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Controls</h3>
            
            {layout !== "free" && (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Gap</label>
                  <span className="text-[10px] font-mono text-primary">{gap}px</span>
                </div>
                <input 
                  type="range" min="0" max="100" value={gap} 
                  onChange={e => setGap(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            )}

            <ColorPickerInput color={bgColor} onChange={setBgColor} label="Background Color" />

            <button
              onClick={handleDownload}
              className="w-full h-11 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" /> Export Collage
            </button>
            <button
              onClick={clearAll}
              className="w-full h-11 bg-white/5 text-white/50 hover:text-white border border-white/5 rounded-xl text-xs font-bold transition-all"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="xl:col-span-2 space-y-6">
          <div className="glass-panel p-4 rounded-[2.5rem] bg-[#050505] shadow-2xl relative">
            <div className="aspect-square w-full rounded-[2rem] overflow-hidden border border-white/5 relative">
               <canvas ref={canvasRef} />
               
               {images.length === 0 && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-white/10 mb-4" />
                    <p className="text-sm font-bold text-white/30 uppercase tracking-widest">Drop images here</p>
                 </div>
               )}

               {hasSelection && (
                 <button 
                   onClick={deleteSelected}
                   className="absolute top-6 right-6 p-4 bg-destructive text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all z-20"
                 >
                   <Trash2 className="w-6 h-6" />
                 </button>
               )}
            </div>
            
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-4 p-2 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
               <button onClick={() => addTextSticker()} className="p-3 hover:bg-white/10 rounded-xl transition-all text-white flex items-center gap-2">
                  <Type className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Text</span>
               </button>
               <div className="w-[1px] bg-white/10" />
               <div className="flex gap-1">
                  {STICKERS.slice(0, 6).map(s => (
                    <button 
                      key={s} 
                      onClick={() => addTextSticker(s)}
                      className="w-10 h-10 text-xl hover:bg-white/10 rounded-lg transition-all flex items-center justify-center"
                    >
                      {s}
                    </button>
                  ))}
               </div>
            </div>
          </div>
          
          <div className="flex justify-center gap-4 w-full">
             <DropZone 
               onDrop={handleDrop} 
               accept={{"image/*": []}} 
               multiple={true}
               label="Add more images"
             />
          </div>
        </div>

        <div className="xl:col-span-1">
          <div className="glass-panel p-6 rounded-2xl h-full space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
               <Layers className="w-4 h-4" /> Layers ({images.length})
            </h3>
            <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
              {images.map(img => (
                <div key={img.id} className="group relative aspect-video rounded-xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                     <button 
                       onClick={() => removeImage(img.id)}
                       className="p-2 bg-destructive/20 text-destructive rounded-lg border border-destructive/20 hover:bg-destructive hover:text-white transition-all"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                </div>
              ))}
              {images.length === 0 && (
                <div className="py-20 text-center space-y-4">
                   <ImageIcon className="w-8 h-8 text-white/5 mx-auto" />
                   <p className="text-[10px] text-white/20 uppercase font-black tracking-widest leading-relaxed">No layers yet.<br/>Upload images to start.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
