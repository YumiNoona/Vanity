import React, { useState, useRef, useEffect, useCallback } from "react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { DropZone } from "@/components/shared/DropZone"
import { Layout, Download, Grid, Layers, Trash2, Plus, Move, Image as ImageIcon, MousePointer2, Type, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown } from "lucide-react"
import { toast } from "sonner"
import { downloadBlob, exportCanvas } from "@/lib/canvas"
import { ColorPickerInput } from "@/components/shared/ColorPickerInput"


interface CollageImage {
  id: string
  file: File
  url: string
}

type CollageLayout = "grid-2x2" | "grid-3x3" | "v-split" | "h-split" | "masonry" | "free"

export function CollageMaker() {
  const [images, setImages] = useState<CollageImage[]>([])
  const [layout, setLayout] = useState<CollageLayout>("grid-2x2")
  const [gap, setGap] = useState(10)
  const [bgColor, setBgColor] = useState("#000000")
  const [hasSelection, setHasSelection] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvas = useRef<any>(null)

  // Initialize Canvas
  useEffect(() => {
    const initFabric = async () => {
      const fabric = await import("fabric")
      fabric.Object.prototype.set({
        transparentCorners: false,
        cornerColor: '#f97316',
        cornerStrokeColor: '#ffffff',
        borderColor: '#f97316',
        cornerSize: 10,
        padding: 0,
        cornerStyle: 'circle',
        borderDashArray: [0, 0],
        borderScaleFactor: 2.5,
        hasRotatingPoint: true
      })

      if (canvasRef.current && !fabricCanvas.current) {
        fabricCanvas.current = new fabric.Canvas(canvasRef.current, {
          width: 1000,
          height: 1000,
          backgroundColor: bgColor,
          preserveObjectStacking: true
        })
        
        const setResponsive = () => {
          if (!fabricCanvas.current) return
          const wrapper = fabricCanvas.current.getElement().parentElement
          if (wrapper) {
            wrapper.style.width = '100%'
            wrapper.style.height = 'auto'
            wrapper.style.aspectRatio = '1 / 1'
          }
          const lower = fabricCanvas.current.getElement()
          lower.style.width = '100%'
          lower.style.height = '100%'
          const upper = fabricCanvas.current.upperCanvasEl
          if (upper) {
            upper.style.width = '100%'
            upper.style.height = '100%'
          }
        }
        setResponsive()

        const onSelect = () => setHasSelection(true)
        const onDeselect = () => setHasSelection(false)
        
        fabricCanvas.current.on('selection:created', onSelect)
        fabricCanvas.current.on('selection:updated', onSelect)
        fabricCanvas.current.on('selection:cleared', onDeselect)
      }
    }
    initFabric()

    return () => {
      if (fabricCanvas.current) {
        fabricCanvas.current.off('selection:created')
        fabricCanvas.current.off('selection:updated')
        fabricCanvas.current.off('selection:cleared')
        fabricCanvas.current.dispose()
        fabricCanvas.current = null
      }
    }
  }, [images.length > 0])

  // Sync background color
  useEffect(() => {
    if (fabricCanvas.current) {
      fabricCanvas.current.backgroundColor = bgColor
      fabricCanvas.current.renderAll()
    }
  }, [bgColor])

  const handleDrop = async (files: File[]) => {
    const newImages = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      url: URL.createObjectURL(file)
    }))
    
    setImages(prev => [...prev, ...newImages])

    setTimeout(async () => {
      if (!fabricCanvas.current) return
      const fabric = await import("fabric")
      
      for (const img of newImages) {
        try {
          const htmlImg = new Image()
          htmlImg.src = img.url
          await new Promise((resolve, reject) => {
            htmlImg.onload = resolve
            htmlImg.onerror = reject
          })

          const fbImg = new fabric.Image(htmlImg, {
            customId: img.id
          } as any)

          if (layout === 'free') {
            fbImg.set({
              left: 200 + Math.random() * 200,
              top: 200 + Math.random() * 200,
              selectable: true,
              evented: true,
              originX: 'center',
              originY: 'center'
            })
            fbImg.scaleToWidth(400)
          }
          
          fabricCanvas.current.add(fbImg)
        } catch (err) {
          toast.error("Failed to load one of the images")
        }
      }
      
      applyLayout()
    }, 100)
  }

  const applyLayout = useCallback(() => {
    if (!fabricCanvas.current) return
    
    const allObjects = fabricCanvas.current.getObjects()
    const imgs = allObjects.filter(obj => obj.type === 'image') as any[]
    
    // Non-image objects (text, stickers) are always free and on top
    allObjects.filter(obj => obj.type !== 'image').forEach(obj => {
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
      const isTextEditing = activeObjects.some(obj => obj.type === 'i-text' && (obj as any).isEditing)
      if (isTextEditing) return

      activeObjects.forEach(obj => {
        fabricCanvas.current?.remove(obj)
        if (obj.type === 'image' && (obj as any).customId) {
          setImages(prev => prev.filter(img => img.id !== (obj as any).customId))
        }
      })
      fabricCanvas.current.discardActiveObject()
      fabricCanvas.current.renderAll()
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && fabricCanvas.current) {
        // Prevent deleting if typing in an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
        deleteSelected()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [deleteSelected])

  const moveLayer = (direction: 'up' | 'down' | 'front' | 'back') => {
    if (!fabricCanvas.current) return
    const activeObj = fabricCanvas.current.getActiveObject()
    if (!activeObj) return
    
    if (direction === 'up') fabricCanvas.current.bringObjectForward(activeObj)
    if (direction === 'down') fabricCanvas.current.sendObjectBackwards(activeObj)
    if (direction === 'front') fabricCanvas.current.bringObjectToFront(activeObj)
    if (direction === 'back') fabricCanvas.current.sendObjectToBack(activeObj)
    
    fabricCanvas.current.renderAll()
  }

  const handleDownload = async () => {
    if (!fabricCanvas.current) return
    fabricCanvas.current.discardActiveObject()
    fabricCanvas.current.renderAll()
    
    try {
      const fabricElement = fabricCanvas.current.toCanvasElement(2) // Export at 2x
      const blob = await exportCanvas(fabricElement, "image/png", 1.0)
      downloadBlob(blob, "vanity-collage.png")
      toast.success("Collage exported!")
    } catch (err) {
      toast.error("Export failed. Try a smaller layout.")
    }
  }

  // Empty state — show DropZone
  if (images.length === 0) {
    return (
      <ToolUploadLayout
        title="Collage Maker"
        description="Arrange multiple images into grids or masonry layouts."
        icon={Layout}
      >
        <div className="space-y-8">
          <DropZone 
            onDrop={handleDrop} 
            accept={{ "image/*": [] }} 
            label="Drop images to start your collage" 
            multiple 
          />

          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
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
                <l.icon className={cn("w-5 h-5", l.id === "h-split" && "rotate-90")} />
                <span className="text-[10px] font-bold uppercase">{l.label}</span>
              </button>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Choose a layout and drop 2–9 images to begin. You can also use <strong>Freeform</strong> mode for complete control.
          </p>
        </div>
      </ToolUploadLayout>
    )
  }

  // Active state — workspace
  return (
    <ToolLayout
      title="Collage Maker"
      description={`${images.length} image${images.length > 1 ? "s" : ""} · ${layout.replace("-", " ").toUpperCase()}`}
      icon={Layout}
      maxWidth="max-w-7xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-4 max-h-[80vh] overflow-y-auto overflow-x-hidden pr-1 custom-scrollbar">
          
          {/* Images Thumbnails */}
          <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-black/20 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Images ({images.length})</label>
              <button onClick={clearAll} className="text-[10px] font-bold uppercase text-red-400 hover:text-red-300 transition-colors">Clear</button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {images.map(img => (
                <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden group border border-white/10">
                  <img src={img.url} className="w-full h-full object-cover" />
                  <button 
                    onClick={() => removeImage(img.id)}
                    className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => document.getElementById("collage-add")?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
              <input id="collage-add" type="file" multiple accept="image/*" hidden onChange={e => e.target.files && handleDrop(Array.from(e.target.files))} />
            </div>
          </div>

          {/* Layout */}
          <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-black/20 space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Layout</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "grid-2x2", icon: Grid, label: "2×2" },
                { id: "grid-3x3", icon: Layers, label: "3×3" },
                { id: "h-split", icon: Move, label: "H-Split" },
                { id: "v-split", icon: Move, label: "V-Split" },
                { id: "masonry", icon: Layers, label: "Mix" },
                { id: "free", icon: MousePointer2, label: "Free" },
              ].map(l => (
                <button
                  key={l.id}
                  onClick={() => setLayout(l.id as CollageLayout)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all text-center",
                    layout === l.id ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                  )}
                >
                  <l.icon className={cn("w-4 h-4", l.id === "h-split" && "rotate-90")} />
                  <span className="text-[9px] font-bold uppercase">{l.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stickers & Text */}
          <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-black/20 space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stickers & Text</label>
            <div className="grid grid-cols-6 gap-1.5">
              {STICKERS.map(s => (
                <button 
                  key={s} 
                  onClick={() => addTextSticker(s)}
                  className="aspect-square bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-lg transition-all border border-white/5 hover:border-white/20 hover:scale-110 active:scale-95"
                >
                  {s}
                </button>
              ))}
            </div>
            <button 
              onClick={() => addTextSticker()}
              className="w-full h-9 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/10"
            >
              <Type className="w-3 h-3" /> Add Text
            </button>
          </div>

          {/* Controls */}
          <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-black/20 space-y-4">
            {layout !== "free" && (
              <div className="space-y-2">
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
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="lg:col-span-9">
          <div className="glass-panel rounded-2xl border border-white/5 bg-black/20 overflow-hidden flex items-center justify-center relative w-full p-4 md:p-6">
            <div 
              className="w-full relative shadow-2xl rounded-sm mx-auto flex items-center justify-center"
              style={{ maxWidth: 'min(100%, calc(100vh - 200px))', aspectRatio: '1 / 1' }}
            >
              <canvas ref={canvasRef} />
              
              {hasSelection && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/90 backdrop-blur-md border border-white/10 p-2 rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4 zoom-in-95">
                  <button onClick={() => moveLayer('back')} className="p-2.5 hover:bg-white/10 rounded-xl text-muted-foreground hover:text-white transition-colors" title="Send to Back"><ChevronsDown className="w-5 h-5" /></button>
                  <button onClick={() => moveLayer('down')} className="p-2.5 hover:bg-white/10 rounded-xl text-muted-foreground hover:text-white transition-colors" title="Send Backward"><ArrowDown className="w-5 h-5" /></button>
                  <div className="w-px h-6 bg-white/10 mx-1" />
                  <button onClick={() => moveLayer('up')} className="p-2.5 hover:bg-white/10 rounded-xl text-muted-foreground hover:text-white transition-colors" title="Bring Forward"><ArrowUp className="w-5 h-5" /></button>
                  <button onClick={() => moveLayer('front')} className="p-2.5 hover:bg-white/10 rounded-xl text-muted-foreground hover:text-white transition-colors" title="Bring to Front"><ChevronsUp className="w-5 h-5" /></button>
                  <div className="w-px h-6 bg-white/10 mx-1" />
                  <button onClick={() => deleteSelected()} className="p-2.5 hover:bg-red-500/20 rounded-xl text-red-400 hover:text-red-300 transition-colors" title="Delete"><Trash2 className="w-5 h-5" /></button>
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-[10px] text-muted-foreground mt-3 italic">
            Double-click text to edit · Press Delete to remove selected · Drag to reposition in Free mode
          </p>
        </div>
      </div>
    </ToolLayout>
  )
}
