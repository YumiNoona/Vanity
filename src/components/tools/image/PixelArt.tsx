import React, { useState, useRef, useEffect, useCallback } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, Binary, RefreshCw, Grid, Palette } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const PALETTES = [
  { id: "original", name: "Original", colors: [] },
  { id: "gameboy", name: "Game Boy", colors: ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"] },
  { id: "nes", name: "NES", colors: ["#7C7C7C", "#0000FC", "#0000BC", "#4428BC", "#940084", "#A80020", "#A81000", "#881400", "#503000", "#007800", "#006800", "#005800", "#004058", "#000000", "#BCBCBC", "#0078F8", "#0058F8", "#6844F8", "#D800CC", "#E40058", "#F83800", "#E45C10", "#AC7C00", "#00B800", "#00A800", "#00A844", "#008888", "#000000", "#F8F8F8", "#3CBCFC", "#6888FC", "#9878F8", "#F878F8", "#F85898", "#F87858", "#FCA044", "#F8B800", "#B8F818", "#58D854", "#58F898", "#00E8D8", "#787878", "#FCFCFC", "#A4E4FC", "#B8B8F8", "#D8B8F8", "#F8B8F8", "#F8A4C0", "#F0D0B0", "#FFE0A8", "#F8D878", "#D8F878", "#B8F8B8", "#B8F8D8", "#00FCFC", "#F8D8F8", "#000000"] },
  { id: "cga", name: "CGA", colors: ["#000000", "#0000AA", "#00AA00", "#00AAAA", "#AA0000", "#AA00AA", "#AA5500", "#AAAAAA", "#555555", "#5555FF", "#55FF55", "#55FFFF", "#FF5555", "#FF55FF", "#FFFF55", "#FFFFFF"] },
]

export function PixelArt() {
  const [file, setFile] = useState<File | null>(null)
  const [pixelSize, setPixelSize] = useState(16)
  const [paletteId, setPaletteId] = useState("original")
  const [showGrid, setShowGrid] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleDrop = async (files: File[]) => {
    if (files[0]) setFile(files[0])
  }

  const applyPixelEffect = useCallback(async () => {
    if (!file || !canvasRef.current) return
    setIsProcessing(true)

    const localUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(localUrl)
      const canvas = canvasRef.current!
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!
      
      const w = Math.ceil(img.width / pixelSize)
      const h = Math.ceil(img.height / pixelSize)
      
      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = w
      tempCanvas.height = h
      const tCtx = tempCanvas.getContext("2d")!
      tCtx.drawImage(img, 0, 0, w, h)
      
      const imgData = tCtx.getImageData(0, 0, w, h)
      const data = imgData.data
      const activePalette = PALETTES.find(p => p.id === paletteId)?.colors || []

      if (activePalette.length > 0) {
        // Convert hex palette to RGB
        const paletteRGB = activePalette.map(hex => {
          const r = parseInt(hex.slice(1, 3), 16)
          const g = parseInt(hex.slice(3, 5), 16)
          const b = parseInt(hex.slice(5, 7), 16)
          return { r, g, b }
        })

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i+1], b = data[i+2]
          let minDist = Infinity
          let bestColor = paletteRGB[0]

          for (const color of paletteRGB) {
            const dist = Math.sqrt((r - color.r)**2 + (g - color.g)**2 + (b - color.b)**2)
            if (dist < minDist) {
              minDist = dist
              bestColor = color
            }
          }
          data[i] = bestColor.r
          data[i+1] = bestColor.g
          data[i+2] = bestColor.b
        }
        tCtx.putImageData(imgData, 0, 0)
      }

      ctx.imageSmoothingEnabled = false
      ctx.drawImage(tempCanvas, 0, 0, w, h, 0, 0, canvas.width, canvas.height)

      if (showGrid) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
        ctx.lineWidth = 1
        for (let x = 0; x <= canvas.width; x += pixelSize) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke()
        }
        for (let y = 0; y <= canvas.height; y += pixelSize) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke()
        }
      }
      
      setIsProcessing(false)
    }
    img.onerror = () => { URL.revokeObjectURL(localUrl); setIsProcessing(false); }
    img.src = localUrl
  }, [file, pixelSize, paletteId, showGrid])

  useEffect(() => {
    if (file) applyPixelEffect()
  }, [file, pixelSize, paletteId, showGrid, applyPixelEffect])

  const handleDownload = () => {
    if (!canvasRef.current) return
    const url = canvasRef.current.toDataURL("image/png")
    const a = document.createElement("a")
    a.href = url
    a.download = `vanity-pixel-${Date.now()}.png`
    a.click()
    toast.success("Pixel art exported!")
  }

  if (!file) {
    return (
      <ToolUploadLayout title="Pixel Art Studio" description="Convert any image into retro pixel art." icon={Binary}>
        <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} label="Drop image to pixelate" />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout title="Pixel Studio" description="Advanced pixelation & palette control." icon={Binary} centered maxWidth="max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <div className="glass-panel p-4 rounded-3xl flex items-center justify-center min-h-[500px] bg-black/40 relative shadow-2xl border-white/5 overflow-auto">
             <canvas ref={canvasRef} className={cn("max-w-none rounded-lg shadow-inner", isProcessing && "opacity-50")} style={{ width: '100%', height: 'auto', imageRendering: 'pixelated' }} />
             {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center"><RefreshCw className="w-8 h-8 text-primary animate-spin" /></div>
             )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="glass-panel p-8 rounded-2xl space-y-8 border-white/10">
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Grid className="w-3 h-3" /> Pixel Size</label>
                    <span className="text-lg font-bold font-mono text-primary">{pixelSize}px</span>
                 </div>
                 <input type="range" min="2" max="64" step="2" value={pixelSize} onChange={(e) => setPixelSize(parseInt(e.target.value))} className="w-full h-1.5 bg-primary/10 rounded-lg appearance-none cursor-pointer accent-primary" />
              </div>

              <div className="space-y-4">
                 <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Palette className="w-3 h-3" /> Retro Palettes</label>
                 <div className="grid grid-cols-2 gap-2">
                    {PALETTES.map(p => (
                       <button key={p.id} onClick={() => setPaletteId(p.id)} className={cn("py-3 rounded-xl text-[10px] font-bold border transition-all", paletteId === p.id ? "bg-primary border-primary text-white" : "border-white/5 bg-white/5 hover:bg-white/10")}>
                          {p.name}
                       </button>
                    ))}
                 </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Show Sprite Grid</span>
                 <button onClick={() => setShowGrid(!showGrid)} className={cn("w-10 h-5 rounded-full transition-all relative", showGrid ? "bg-primary" : "bg-white/10")}>
                    <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", showGrid ? "left-6" : "left-1")} />
                 </button>
              </div>

              <button onClick={handleDownload} disabled={isProcessing} className="w-full py-5 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs">
                <Download className="w-5 h-5" /> Export Result </button>

              <button onClick={() => setFile(null)} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/50 font-bold rounded-xl border border-white/10 text-[10px] uppercase tracking-widest transition-all">
                New Image
              </button>
           </div>
        </div>
      </div>
    </ToolLayout>
  )
}
