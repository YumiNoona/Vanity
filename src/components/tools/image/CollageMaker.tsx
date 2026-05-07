import React, { useState, useRef, useEffect, useCallback } from "react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { DropZone } from "@/components/shared/DropZone"
import { Layout, Download, Grid, Layers, Trash2, Plus, Move, Image as ImageIcon, MousePointer2, Type } from "lucide-react"
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
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvas = useRef<any>(null)
  const unmountedRef = useRef(false)

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unmountedRef.current = true
      // Revoke all URLs stored in images state
      // Note: This needs access to the latest images, but since it's unmount we can't easily get it without a ref
    }
  }, [])

  // Ref to track images for cleanup
  const imagesRef = useRef<CollageImage[]>([])
  useEffect(() => {
    imagesRef.current = images
    return () => {
       if (unmountedRef.current) {
          imagesRef.current.forEach(img => URL.revokeObjectURL(img.url))
       }
    }
  }, [images])

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
    }

    setImages(prev => [...prev, ...newImgs])
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

    const size = 1000
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
    const fabric = await import("fabric")
    const text = new fabric.IText(textString, {
      left: 500,
      top: 500,
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
    <ToolLayout title="Collage Maker" description="Combine multiple images." icon={Layout} centered maxWidth="max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-2xl space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Layouts</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "grid-2x2", icon: Grid, label: "2×2" },
                { id: "h-split", icon: Move, label: "H-Split" },
                { id: "v-split", icon: Move, label: "V-Split" },
                { id: "free", icon: MousePointer2, label: "Free" },
              ].map(l => (
                <button
                  key={l.id}
                  onClick={() => setLayout(l.id as CollageLayout)}
                  className={cn(
                    "p-4 rounded-xl border flex flex-col items-center gap-2",
                    layout === l.id ? "bg-primary/20 border-primary" : "border-white/5 bg-white/5"
                  )}
                >
                  <l.icon className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase">{l.label}</span>
                </button>
              ))}
            </div>
            
            <div className="space-y-4 pt-4 border-t border-white/5">
              <ColorPickerInput color={bgColor} onChange={setBgColor} label="Background" />
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Gap: {gap}px</label>
                <input type="range" min="0" max="100" value={gap} onChange={e => setGap(parseInt(e.target.value))} className="w-full accent-primary" />
              </div>
            </div>

            <button onClick={handleDownload} className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg">
              Download PNG
            </button>
            <button onClick={clearAll} className="w-full py-3 bg-white/5 text-white/50 hover:text-white rounded-xl text-xs font-bold transition-all">
              Clear Canvas
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 relative">
          <div className="glass-panel p-4 rounded-3xl bg-black/40 border-white/5 relative aspect-square overflow-hidden">
            <canvas ref={canvasRef} />
            {hasSelection && (
               <button onClick={deleteSelected} className="absolute top-6 right-6 p-4 bg-red-500 text-white rounded-full shadow-xl z-20">
                  <Trash2 className="w-6 h-6" />
               </button>
            )}
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-4 p-2 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
             <button onClick={() => addTextSticker()} className="p-3 hover:bg-white/10 rounded-xl transition-all text-white flex items-center gap-2">
                <Type className="w-5 h-5" />
             </button>
             <div className="flex gap-1">
                {STICKERS.slice(0, 6).map(s => (
                  <button key={s} onClick={() => addTextSticker(s)} className="w-10 h-10 text-xl hover:bg-white/10 rounded-lg">
                    {s}
                  </button>
                ))}
             </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
           <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                 <Layers className="w-4 h-4" /> Layers ({images.length})
              </h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                 {images.map(img => (
                   <div key={img.id} className="group relative aspect-video rounded-lg overflow-hidden border border-white/5">
                      <img src={img.url} className="w-full h-full object-cover" />
                      <button onClick={() => removeImage(img.id)} className="absolute top-1 right-1 p-1 bg-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                         <Trash2 className="w-3 h-3 text-white" />
                      </button>
                   </div>
                 ))}
              </div>
           </div>
           <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} multiple label="Add More" />
        </div>
      </div>
    </ToolLayout>
  )
}
