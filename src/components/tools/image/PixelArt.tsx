import React, { useState, useRef, useEffect, useCallback } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, Binary, RefreshCw, Grid } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function PixelArt() {
  const [file, setFile] = useState<File | null>(null)
  const [pixelSize, setPixelSize] = useState(16)
  const [isProcessing, setIsProcessing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile) return
    setFile(uploadedFile)
  }

  const applyPixelEffect = useCallback(() => {
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
      
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(tempCanvas, 0, 0, w, h, 0, 0, canvas.width, canvas.height)
      
      setIsProcessing(false)
    }
    img.onerror = () => URL.revokeObjectURL(localUrl)
    img.src = localUrl
  }, [file, pixelSize])

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
      <ToolUploadLayout
        title="Pixel Art Converter"
        description="Instantly transform any photo into 8-bit or 16-bit chunky retro pixel art."
        icon={Binary}
      >
        <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} label="Drop image to pixelate" />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout
      title="Pixel Studio"
      description="Control the resolution for maximum crunch."
      icon={Binary}
      centered={true}
      maxWidth="max-w-6xl"
    >

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
                <Download className="w-5 h-5" /> Export </button>

              <button 
                onClick={() => setFile(null)}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all"
              >
                Start New
              </button>
           </div>
        </div>
      </div>
    </ToolLayout>
  )
}
