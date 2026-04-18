import React, { useState, useRef, useEffect, useCallback } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, Download, Contrast, RefreshCw, Palette } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useObjectUrl } from "@/hooks/useObjectUrl"

export function Duotone() {
  const [file, setFile] = useState<File | null>(null)
  const [shadowColor, setShadowColor] = useState("#2e1065") // Deep Purple
  const [highlightColor, setHighlightColor] = useState("#bef264") // Lime
  const [isProcessing, setIsProcessing] = useState(false)
  const { url: previewUrl, setUrl: setPreviewUrl, clear: clearPreviewUrl } = useObjectUrl()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile) return
    setFile(uploadedFile)
    setPreviewUrl(uploadedFile)
  }

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return [r, g, b]
  }

  const applyDuotone = useCallback(() => {
    if (!file || !canvasRef.current || !previewUrl) return
    setIsProcessing(true)

    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current!
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!
      
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      const [sr, sg, sb] = hexToRgb(shadowColor)
      const [hr, hg, hb] = hexToRgb(highlightColor)

      for (let i = 0; i < data.length; i += 4) {
        // 1. Get luminance (grayscale)
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
        const ratio = avg / 255
        
        // 2. Linear interpolate between shadow and highlight
        data[i] = sr + (hr - sr) * ratio
        data[i + 1] = sg + (hg - sg) * ratio
        data[i + 2] = sb + (hb - sb) * ratio
      }
      
      ctx.putImageData(imageData, 0, 0)
      setIsProcessing(false)
    }
    img.src = previewUrl
  }, [file, shadowColor, highlightColor, previewUrl])

  useEffect(() => {
    if (file) applyDuotone()
  }, [file, shadowColor, highlightColor, applyDuotone])

  const handleDownload = () => {
    if (!canvasRef.current) return
    const url = canvasRef.current.toDataURL("image/png")
    const a = document.createElement("a")
    a.href = url
    a.download = `vanity-duotone-${Date.now()}.png`
    a.click()
    toast.success("Duotone image exported!")
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center animate-in fade-in duration-500">
         <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6 text-primary">
            <Contrast className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1">Duotone Tint</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Map shadows and highlights to two custom colors for a striking Spotify-esque aesthetic.
        </p>
        <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} label="Drop photo to apply tint" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 sm:px-0 pb-12">
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
             <Contrast className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-syne">Duotone Studio</h1>
            <p className="text-muted-foreground text-sm">Create bold, high-contrast artistic styles.</p>
          </div>
        </div>
        <button onClick={() => { setFile(null); clearPreviewUrl(); }} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Change Image
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <div className="glass-panel p-4 rounded-3xl flex items-center justify-center min-h-[500px] bg-black/40 overflow-hidden relative shadow-2xl border-white/5">
             <canvas ref={canvasRef} className={cn("max-w-full max-h-[600px] rounded-lg shadow-inner", isProcessing && "opacity-50")} />
             {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center">
                   <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                </div>
             )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="glass-panel p-8 rounded-2xl space-y-8 border-white/10">
              <div className="space-y-6">
                 <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">Shadows</label>
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                       <input 
                         type="color" 
                         value={shadowColor}
                         onChange={(e) => setShadowColor(e.target.value)}
                         className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer"
                       />
                       <span className="text-sm font-mono text-white/50">{shadowColor.toUpperCase()}</span>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">Highlights</label>
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                       <input 
                         type="color" 
                         value={highlightColor}
                         onChange={(e) => setHighlightColor(e.target.value)}
                         className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer"
                       />
                       <span className="text-sm font-mono text-white/50">{highlightColor.toUpperCase()}</span>
                    </div>
                 </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Palette className="w-3 h-3" /> Popular Presets
                 </h4>
                 <div className="grid grid-cols-2 gap-2">
                    {[
                       { s: "#2e1065", h: "#bef264", label: "Midnight" },
                       { s: "#4c0519", h: "#fb7185", label: "Heat" },
                       { s: "#064e3b", h: "#6ee7b7", label: "Emerald" },
                       { s: "#1e1b4b", h: "#818cf8", label: "Cobalt" }
                    ].map(p => (
                       <button 
                         key={p.label}
                         onClick={() => { setShadowColor(p.s); setHighlightColor(p.h); }}
                         className="flex items-center gap-2 p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all group"
                       >
                          <div className="flex -space-x-1">
                             <div className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: p.s }} />
                             <div className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: p.h }} />
                          </div>
                          <span className="text-[10px] font-bold text-muted-foreground group-hover:text-white">{p.label}</span>
                       </button>
                    ))}
                 </div>
              </div>

              <button 
                onClick={handleDownload}
                disabled={isProcessing}
                className="w-full py-5 bg-primary text-primary-foreground font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <Download className="w-5 h-5" />
                Export Duotone
              </button>
           </div>
        </div>
      </div>
    </div>
  )
}
