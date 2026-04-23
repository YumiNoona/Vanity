import React, { useState, useRef, useEffect } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { DropZone } from "@/components/shared/DropZone"
import { Layout, Download, Grid, Layers, Trash2, Plus, Move, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CollageImage {
  id: string
  file: File
  url: string
  aspectRatio: number
}

type CollageLayout = "grid-2x2" | "grid-3x3" | "v-split" | "h-split" | "masonry"

export function CollageMaker() {
  const [images, setImages] = useState<CollageImage[]>([])
  const [layout, setLayout] = useState<CollageLayout>("grid-2x2")
  const [gap, setGap] = useState(10)
  const [bgColor, setBgColor] = useState("#000000")
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleDrop = (files: File[]) => {
    const newImages = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      url: URL.createObjectURL(file),
      aspectRatio: 1 // Default, will update once loaded
    }))
    setImages(prev => [...prev, ...newImages])
  }

  const removeImage = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id)
      // Revoke URL of the removed image
      const removed = prev.find(img => img.id === id)
      if (removed) URL.revokeObjectURL(removed.url)
      return filtered
    })
  }

  const renderCollage = async (isMounted: () => boolean) => {
    const canvas = canvasRef.current
    if (!canvas || images.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set high-res canvas size (e.g., 2000px)
    const size = 2000
    canvas.width = size
    canvas.height = size

    // Background
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, size, size)

    // Load images
    const loadedImages = await Promise.all(images.map(img => {
      return new Promise<HTMLImageElement>((resolve) => {
        const i = new Image()
        i.onload = () => resolve(i)
        i.src = img.url
      })
    }))
    
    if (!isMounted()) return

    const drawImageInRect = (img: HTMLImageElement, x: number, y: number, w: number, h: number) => {
      const imgAspect = img.width / img.height
      const rectAspect = w / h
      let sx, sy, sw, sh

      if (imgAspect > rectAspect) {
        sh = img.height
        sw = sh * rectAspect
        sy = 0
        sx = (img.width - sw) / 2
      } else {
        sw = img.width
        sh = sw / rectAspect
        sx = 0
        sy = (img.height - sh) / 2
      }
      ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
    }

    // Layout Logics
    const innerSize = size - (gap * 2) // Simple padding
    const g = gap

    if (layout === "grid-2x2") {
      const w = (size - 3 * g) / 2
      const h = (size - 3 * g) / 2
      if (loadedImages[0]) drawImageInRect(loadedImages[0], g, g, w, h)
      if (loadedImages[1]) drawImageInRect(loadedImages[1], w + 2 * g, g, w, h)
      if (loadedImages[2]) drawImageInRect(loadedImages[2], g, h + 2 * g, w, h)
      if (loadedImages[3]) drawImageInRect(loadedImages[3], w + 2 * g, h + 2 * g, w, h)
    } else if (layout === "h-split") {
      const w = size - 2 * g
      const h = (size - 3 * g) / 2
      if (loadedImages[0]) drawImageInRect(loadedImages[0], g, g, w, h)
      if (loadedImages[1]) drawImageInRect(loadedImages[1], g, h + 2 * g, w, h)
    } else if (layout === "v-split") {
      const w = (size - 3 * g) / 2
      const h = size - 2 * g
      if (loadedImages[0]) drawImageInRect(loadedImages[0], g, g, w, h)
      if (loadedImages[1]) drawImageInRect(loadedImages[1], w + 2 * g, g, w, h)
    } else if (layout === "grid-3x3") {
      const w = (size - 4 * g) / 3
      const h = (size - 4 * g) / 3
      loadedImages.slice(0, 9).forEach((img, i) => {
        const r = Math.floor(i / 3)
        const c = i % 3
        drawImageInRect(img, g + c * (w + g), g + r * (h + g), w, h)
      })
    } else if (layout === "masonry") {
      // Simple 3-column masonry
      const colW = (size - 4 * g) / 3
      if (loadedImages[0]) drawImageInRect(loadedImages[0], g, g, colW, (size - 3 * g) * 0.6)
      if (loadedImages[1]) drawImageInRect(loadedImages[1], colW + 2 * g, g, colW, (size - 3 * g) * 0.4)
      if (loadedImages[2]) drawImageInRect(loadedImages[2], 2 * colW + 3 * g, g, colW, (size - 3 * g) * 0.5)
      // Bottom row...
      if (loadedImages[3]) drawImageInRect(loadedImages[3], g, (size - 3 * g) * 0.6 + 2 * g, colW, (size - 3 * g) * 0.4 - g)
    }
  }

  useEffect(() => {
    let mounted = true
    if (images.length > 0) renderCollage(() => mounted)
    return () => { mounted = false }
  }, [images, layout, gap, bgColor])

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const url = canvas.toDataURL("image/png")
    const a = document.createElement("a")
    a.href = url
    a.download = "collage.png"
    a.click()
  }

  return (
    <ToolLayout
      title="Photo Collage Maker"
      description="Arrange multiple images into professional grid or masonry layouts instantly."
      icon={Layout}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Grid Layout</label>
              <div className="grid grid-cols-3 gap-2">
                 {[
                   { id: "grid-2x2", icon: Grid, label: "2x2" },
                   { id: "grid-3x3", icon: Layers, label: "3x3" },
                   { id: "h-split", icon: Move, label: "Split H" },
                   { id: "v-split", icon: Move, label: "Split V" },
                   { id: "masonry", icon: Layers, label: "Mix" },
                 ].map(l => (
                   <button
                     key={l.id}
                     onClick={() => setLayout(l.id as CollageLayout)}
                     className={cn(
                       "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                       layout === l.id ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                     )}
                   >
                     <l.icon className={cn("w-5 h-5", l.id === "h-split" && "rotate-90")} />
                     <span className="text-[10px] font-bold uppercase">{l.label}</span>
                   </button>
                 ))}
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Gap Size</label>
                  <span className="text-xs font-mono text-primary">{gap}px</span>
               </div>
               <input 
                 type="range" min="0" max="100" value={gap} 
                 onChange={e => setGap(parseInt(e.target.value))}
                 className="w-full accent-primary"
               />
            </div>

            <div className="space-y-4">
               <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Background Color</label>
               <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={bgColor} 
                    onChange={e => setBgColor(e.target.value)}
                    className="w-12 h-10 bg-transparent border-none cursor-pointer"
                  />
                  <input 
                    type="text" 
                    value={bgColor} 
                    onChange={e => setBgColor(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-mono uppercase focus:border-primary/50 outline-none"
                  />
               </div>
            </div>

            <button
              onClick={handleDownload}
              disabled={images.length === 0}
              className="w-full h-12 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> Export Collage
            </button>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 space-y-4">
             <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Images ({images.length})</label>
                <button onClick={() => setImages([])} className="text-[10px] font-bold uppercase text-red-400 hover:text-red-300 transition-colors">Clear All</button>
             </div>
             <div className="grid grid-cols-4 gap-2">
                {images.map(img => (
                  <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden group border border-white/10">
                     <img src={img.url} className="w-full h-full object-cover" />
                     <button 
                       onClick={() => removeImage(img.id)}
                       className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                        <Trash2 className="w-4 h-4 text-white" />
                     </button>
                  </div>
                ))}
                <button 
                  onClick={() => document.getElementById("collage-add")?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-all"
                >
                   <Plus className="w-5 h-5" />
                </button>
                <input id="collage-add" type="file" multiple hidden onChange={e => e.target.files && handleDrop(Array.from(e.target.files))} />
             </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
           <div className="glass-panel rounded-3xl border border-white/5 bg-black/20 overflow-hidden aspect-square flex items-center justify-center p-8 relative">
              <canvas ref={canvasRef} className="max-w-full max-h-full shadow-2xl rounded-sm object-contain" />
              {images.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 text-muted-foreground pointer-events-none">
                   <ImageIcon className="w-16 h-16 opacity-10" />
                   <p className="text-sm font-medium">Add images to start building your collage</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </ToolLayout>
  )
}
