import React, { useState, useRef, useEffect, useCallback } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, Sparkles, SlidersHorizontal, RefreshCw, ImageIcon, AlertTriangle } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { toast } from "sonner"
import { useObjectUrl } from "@/hooks/useObjectUrl"
import { cn } from "@/lib/utils"

export function NoiseGrain() {
  const [file, setFile] = useState<File | null>(null)
  const [intensity, setIntensity] = useState(20)
  const [mono, setMono] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const originalDataRef = useRef<ImageData | null>(null)
  
  const { url: previewUrl, setUrl: setPreviewUrl, clear: clearPreviewUrl } = useObjectUrl()
  const jobIdRef = useRef(0)

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile) return
    setFile(uploadedFile)
    setPreviewUrl(uploadedFile)
    originalDataRef.current = null // Reset cache
  }

  const applyNoise = useCallback(() => {
    if (!originalDataRef.current || !canvasRef.current) return
    const jobId = ++jobIdRef.current
    setIsProcessing(true)

    // Run in a slight delay to allow UI to show spinner
    setTimeout(() => {
      if (jobId !== jobIdRef.current) return

      const canvas = canvasRef.current!
      const ctx = canvas.getContext("2d")!
      const sourceData = originalDataRef.current!
      
      const imageData = new ImageData(
        new Uint8ClampedArray(sourceData.data),
        sourceData.width,
        sourceData.height
      )
      const data = imageData.data
      const amount = (intensity / 100) * 128

      // Optimization: Pre-generate a small block of noise if image is huge
      // But for now, let's just use a faster loop
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * amount
        if (mono) {
          data[i] = Math.min(255, Math.max(0, data[i] + noise))
          data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise))
          data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise))
        } else {
          data[i] = Math.min(255, Math.max(0, data[i] + noise))
          data[i+1] = Math.min(255, Math.max(0, data[i+1] + (Math.random() - 0.5) * amount))
          data[i+2] = Math.min(255, Math.max(0, data[i+2] + (Math.random() - 0.5) * amount))
        }
      }
      
      ctx.putImageData(imageData, 0, 0)
      setIsProcessing(false)
    }, 50)
  }, [intensity, mono])

  useEffect(() => {
    if (!file || !previewUrl || !canvasRef.current) return

    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current!
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0)
      originalDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height)
      applyNoise()
    }
    img.onerror = () => toast.error("Failed to load image")
    img.src = previewUrl
  }, [file, previewUrl, applyNoise])

  const handleDownload = () => {
    if (!canvasRef.current) return
    const url = canvasRef.current.toDataURL("image/jpeg", 0.9)
    const a = document.createElement("a")
    a.href = url
    a.download = `vanity-grainy-${Date.now()}.jpg`
    a.click()
    toast.success("Grainy image exported!")
  }

  const handleBack = () => {
    setFile(null)
    clearPreviewUrl()
    originalDataRef.current = null
  }

  if (!file) {
    return (
      <ToolUploadLayout title="Noise & Grain" description="Add authentic film grain, digital noise, or vintage textures to any photograph." icon={ImageIcon}>
        <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} label="Drop photo to add textures" />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout 
      title="Grain Studio" 
      description="Fine-tune the analog look and feel." 
      icon={Sparkles} 
      maxWidth="max-w-6xl"
      centered={true}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <div className="glass-panel p-4 rounded-3xl flex items-center justify-center min-h-[500px] bg-[#050505] overflow-hidden relative shadow-2xl border border-white/5">
             <canvas ref={canvasRef} className={cn("max-w-full max-h-[70vh] rounded-xl shadow-2xl transition-opacity duration-300", isProcessing ? "opacity-30 scale-[0.99]" : "opacity-100 scale-100")} />
             {isProcessing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-300">
                   <RefreshCw className="w-10 h-10 text-primary animate-spin" />
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Applying Textures...</span>
                </div>
             )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="glass-panel p-8 rounded-[2rem] border border-white/5 bg-black/20 space-y-8">
              <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                       <SlidersHorizontal className="w-3.5 h-3.5 text-primary" /> Grain Intensity
                    </label>
                    <span className="text-xl font-black font-mono text-primary">{intensity}%</span>
                 </div>
                 <input 
                   type="range" 
                   min="0" 
                   max="100" 
                   value={intensity}
                   onChange={(e) => setIntensity(parseInt(e.target.value))}
                   className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-primary"
                 />
              </div>

              <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-primary/20 transition-all group">
                 <div className="space-y-1">
                    <p className="text-[11px] font-black uppercase text-white group-hover:text-primary transition-colors">Monochrome Mode</p>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">Traditional silver halide style.</p>
                 </div>
                 <button 
                   onClick={() => setMono(!mono)}
                   className={cn(
                     "w-12 h-6 rounded-full transition-all relative",
                     mono ? "bg-primary shadow-[0_0_15px_rgba(245,158,11,0.3)]" : "bg-white/10"
                   )}
                 >
                   <div className={cn(
                     "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-lg",
                     mono ? "translate-x-7" : "translate-x-1"
                   )} />
                 </button>
              </div>

              <div className="p-5 bg-primary/5 rounded-2xl text-[10px] text-muted-foreground leading-relaxed flex gap-4 border border-primary/10">
                <Sparkles className="w-5 h-5 text-primary shrink-0" />
                <p>Our algorithm simulates randomized pixel variance locally. No data ever leaves your device.</p>
              </div>

              <div className="space-y-3 pt-4">
                <button 
                  onClick={handleDownload}
                  disabled={isProcessing}
                  className="w-full py-5 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs rounded-2xl shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                >
                  <Download className="w-5 h-5" /> Export Resolution
                </button>

                <button 
                  onClick={handleBack}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-xl border border-white/5 transition-all"
                >
                  New Artwork
                </button>
              </div>
           </div>
        </div>
      </div>
    </ToolLayout>
  )
}
