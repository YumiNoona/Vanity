import React, { useState, useRef, useEffect, useCallback } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, Download, Binary, SlidersHorizontal, RefreshCw, Grid } from "lucide-react"
import { usePremium } from "@/hooks/usePremium"
import { useObjectUrl } from "@/hooks/useObjectUrl"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function PixelArt() {
  const [file, setFile] = useState<File | null>(null)
  const [pixelSize, setPixelSize] = useState(16)
  const [isProcessing, setIsProcessing] = useState(false)
  const { url: previewUrl, setUrl: setPreviewUrl, clear: clearPreviewUrl } = useObjectUrl()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile) return
    setFile(uploadedFile)
    setPreviewUrl(uploadedFile)
  }

  const applyPixelEffect = useCallback(() => {
    if (!file || !canvasRef.current || !previewUrl) return
    setIsProcessing(true)

    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current!
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!
      
      // 1. Scale down
      const w = Math.ceil(img.width / pixelSize)
      const h = Math.ceil(img.height / pixelSize)
      
      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = w
      tempCanvas.height = h
      const tCtx = tempCanvas.getContext("2d")!
      tCtx.drawImage(img, 0, 0, w, h)
      
      // 2. Scale back up with crisp pixels
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(tempCanvas, 0, 0, w, h, 0, 0, canvas.width, canvas.height)
      
      setIsProcessing(false)
    }
    img.src = previewUrl
  }, [file, pixelSize, previewUrl])

  useEffect(() => {
    if (file) applyPixelEffect()
  }, [file, pixelSize, applyPixelEffect])

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
      <div className="max-w-2xl mx-auto py-12 text-center animate-in fade-in duration-500">
         <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6 text-primary">
            <Binary className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1">Pixel Art Converter</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Instantly transform any photo into 8-bit or 16-bit chunky retro pixel art.
        </p>
        <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} label="Drop image to pixelate" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 sm:px-0 pb-12">
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
             <Binary className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-syne">Pixel Studio</h1>
            <p className="text-muted-foreground text-sm">Control the resolution for maximum crunch.</p>
          </div>
        </div>
        <button onClick={() => { setFile(null); clearPreviewUrl(); }} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Start Over
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
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                       <Grid className="w-3 h-3" /> Pixel Size
                    </label>
                    <span className="text-lg font-bold font-mono text-primary">{pixelSize}px</span>
                 </div>
                 <input 
                   type="range" 
                   min="4" 
                   max="64" 
                   step="2"
                   value={pixelSize}
                   onChange={(e) => setPixelSize(parseInt(e.target.value))}
                   className="w-full relative h-1.5 bg-primary/10 rounded-lg appearance-none cursor-pointer accent-primary"
                 />
                 <div className="flex justify-between text-[10px] text-muted-foreground font-bold font-mono">
                    <span>Crisp (4px)</span>
                    <span>Chunky (64px)</span>
                 </div>
              </div>

              <div className="space-y-4">
                 <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Style Guide</h4>
                 <div className="grid grid-cols-3 gap-2">
                    {[8, 16, 32].map(s => (
                       <button 
                         key={s}
                         onClick={() => setPixelSize(s)}
                         className={cn(
                           "py-2 rounded-lg text-[10px] font-bold border transition-all",
                           pixelSize === s ? "bg-primary border-primary text-white" : "border-white/5 bg-white/5 hover:bg-white/10"
                         )}
                       >
                         {s === 8 ? "8-BIT" : s === 16 ? "16-BIT" : "32-BIT"}
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
                Export Pixel Art
              </button>
           </div>
        </div>
      </div>
    </div>
  )
}
