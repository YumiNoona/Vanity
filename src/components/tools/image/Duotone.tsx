import React, { useState, useRef, useEffect, useCallback } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, Download, Contrast, RefreshCw, Palette } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { toast } from "sonner"
import { useObjectUrl } from "../../../hooks/useObjectUrl"
import { cn } from "../../../lib/utils"

export function Duotone() {
  const [file, setFile] = useState<File | null>(null)
  const [shadowColor, setShadowColor] = useState("#2e1065")
  const [highlightColor, setHighlightColor] = useState("#bef264")
  const [isProcessing, setIsProcessing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { url: previewUrl, setUrl: setPreviewUrl, clear: clearPreviewUrl } = useObjectUrl()

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile) return
    setFile(uploadedFile)
    setPreviewUrl(uploadedFile)
  }

  const hexToNormalizedRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    return [r, g, b]
  }

  const handleDownload = async () => {
    if (!file || !canvasRef.current) return
    setIsProcessing(true)

    try {
      const img = new Image()
      const url = URL.createObjectURL(file)
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = url
      })

      const canvas = canvasRef.current
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!
      
      // We apply the duotone logic manually for the export to ensure maximum quality
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      const [sr, sg, sb] = parseInt(shadowColor.slice(1), 16).toString(16).padStart(6, '0').match(/.{2}/g)!.map(x => parseInt(x, 16))
      const [hr, hg, hb] = parseInt(highlightColor.slice(1), 16).toString(16).padStart(6, '0').match(/.{2}/g)!.map(x => parseInt(x, 16))

      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
        const ratio = avg / 255
        data[i] = sr + (hr - sr) * ratio
        data[i + 1] = sg + (hg - sg) * ratio
        data[i + 2] = sb + (hb - sb) * ratio
      }
      
      ctx.putImageData(imageData, 0, 0)
      
      const resultUrl = canvas.toDataURL("image/png")
      const a = document.createElement("a")
      a.href = resultUrl
      a.download = `vanity-duotone-${Date.now()}.png`
      a.click()
      toast.success("Duotone image exported!")
    } catch (err) {
      console.error("Export failed:", err)
      toast.error("Export failed")
    } finally {
      setIsProcessing(false)
    }
  }

  const [sR, sG, sB] = hexToNormalizedRgb(shadowColor)
  const [hR, hG, hB] = hexToNormalizedRgb(highlightColor)

  if (!file) {
    return (
      <ToolUploadLayout
        title="Duotone Tint"
        description="Map shadows and highlights to two custom colors for a striking Spotify-esque aesthetic."
        icon={Contrast}
      >
        <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} label="Drop photo to apply tint" />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout
      title="Duotone Studio"
      description="Create bold, high-contrast artistic styles."
      icon={Contrast}
      onBack={() => { setFile(null); clearPreviewUrl(); }}
      backLabel="Change Image"
      maxWidth="max-w-6xl"
    >
      {/* SVG Filter Definition */}
      <svg className="hidden">
        <filter id="duotone-filter" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0 0 0 1 0" />
          <feComponentTransfer>
            <feFuncR type="table" tableValues={`${sR} ${hR}`} />
            <feFuncG type="table" tableValues={`${sG} ${hG}`} />
            <feFuncB type="table" tableValues={`${sB} ${hB}`} />
          </feComponentTransfer>
        </filter>
      </svg>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">
        <div className="lg:col-span-8">
          <div className="glass-panel p-4 rounded-3xl flex items-center justify-center min-h-[500px] bg-black/40 overflow-hidden relative shadow-2xl border-white/5">
             {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="max-w-full max-h-[600px] rounded-lg shadow-inner" 
                  style={{ filter: 'url(#duotone-filter)' }}
                />
             ) : (
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
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
                    ].map(p => {
                      const isActive = shadowColor === p.s && highlightColor === p.h
                      return (
                        <button 
                          key={p.label}
                          onClick={() => { setShadowColor(p.s); setHighlightColor(p.h); }}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-lg transition-all group border",
                            isActive ? "bg-primary/20 border-primary/30 text-primary" : "bg-white/5 border-transparent hover:bg-white/10"
                          )}
                        >
                           <div className="flex -space-x-1">
                              <div className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: p.s }} />
                              <div className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: p.h }} />
                           </div>
                           <span className={cn(
                             "text-[10px] font-bold tracking-tight",
                             isActive ? "text-primary" : "text-muted-foreground group-hover:text-white"
                           )}>
                             {p.label}
                           </span>
                        </button>
                      )
                    })}
                 </div>
              </div>

              <button 
                onClick={handleDownload}
                disabled={isProcessing || !file}
                className="w-full py-5 bg-primary text-primary-foreground font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                Export Duotone
              </button>
           </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </ToolLayout>
  )
}
