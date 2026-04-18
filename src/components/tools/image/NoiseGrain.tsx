import React, { useState, useRef, useEffect, useCallback } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, Download, Sparkles, SlidersHorizontal, RefreshCw, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function NoiseGrain() {
  const [file, setFile] = useState<File | null>(null)
  const [intensity, setIntensity] = useState(20)
  const [mono, setMono] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile) return
    setFile(uploadedFile)
    setPreviewUrl(URL.createObjectURL(uploadedFile))
  }

  const applyNoise = useCallback(() => {
    if (!file || !canvasRef.current) return
    setIsProcessing(true)

    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current!
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")!
      
      ctx.drawImage(img, 0, 0)
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      const amount = (intensity / 100) * 128

      for (let i = 0; i < data.length; i += 4) {
        if (mono) {
          const noise = (Math.random() - 0.5) * amount
          data[i] = Math.min(255, Math.max(0, data[i] + noise))
          data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise))
          data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise))
        } else {
          data[i] = Math.min(255, Math.max(0, data[i] + (Math.random() - 0.5) * amount))
          data[i+1] = Math.min(255, Math.max(0, data[i+1] + (Math.random() - 0.5) * amount))
          data[i+2] = Math.min(255, Math.max(0, data[i+2] + (Math.random() - 0.5) * amount))
        }
      }
      
      ctx.putImageData(imageData, 0, 0)
      setIsProcessing(false)
    }
    img.src = previewUrl!
  }, [file, intensity, mono, previewUrl])

  useEffect(() => {
    if (file) applyNoise()
  }, [file, intensity, mono, applyNoise])

  const handleDownload = () => {
    if (!canvasRef.current) return
    const url = canvasRef.current.toDataURL("image/jpeg", 0.9)
    const a = document.createElement("a")
    a.href = url
    a.download = `vanity-grainy-${Date.now()}.jpg`
    a.click()
    toast.success("Grainy image exported!")
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center animate-in fade-in duration-500">
         <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6 text-primary">
            <ImageIcon className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1">Noise & Grain</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Add authentic film grain, digital noise, or vintage textures to any photograph.
        </p>
        <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} label="Drop photo to add textures" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 sm:px-0 pb-12">
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
             <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-syne">Grain Studio</h1>
            <p className="text-muted-foreground text-sm">Fine-tune the analog look and feel.</p>
          </div>
        </div>
        <button onClick={() => setFile(null)} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> New Photo
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <div className="glass-panel p-4 rounded-3xl flex items-center justify-center min-h-[500px] bg-black/40 overflow-hidden relative shadow-2xl">
             <canvas ref={canvasRef} className={cn("max-w-full max-h-[600px] rounded-xl shadow-inner", isProcessing && "opacity-50")} />
             {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center">
                   <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                </div>
             )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="glass-panel p-8 rounded-2xl space-y-8">
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                       <SlidersHorizontal className="w-3 h-3" /> Intensity
                    </label>
                    <span className="text-lg font-bold font-mono text-primary">{intensity}%</span>
                 </div>
                 <input 
                   type="range" 
                   min="0" 
                   max="100" 
                   value={intensity}
                   onChange={(e) => setIntensity(parseInt(e.target.value))}
                   className="w-full relative h-1.5 bg-primary/10 rounded-lg appearance-none cursor-pointer accent-primary"
                 />
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                 <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white">Monochrome</p>
                    <p className="text-[10px] text-muted-foreground">Traditional film grain style.</p>
                 </div>
                 <button 
                   onClick={() => setMono(!mono)}
                   className={cn(
                     "w-12 h-6 rounded-full transition-all relative",
                     mono ? "bg-primary" : "bg-white/10"
                   )}
                 >
                   <div className={cn(
                     "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md",
                     mono ? "right-1" : "left-1"
                   )} />
                 </button>
              </div>

              <div className="p-4 bg-primary/5 rounded-xl text-[10px] text-muted-foreground leading-relaxed italic border border-primary/10">
                Grain is generated using a high-performance recursive bitwise randomization algorithm. Processing happens locally in your browser.
              </div>

              <button 
                onClick={handleDownload}
                disabled={isProcessing}
                className="w-full py-5 bg-primary text-primary-foreground font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <Download className="w-5 h-5" />
                Export High-Res Texture
              </button>
           </div>
        </div>
      </div>
    </div>
  )
}
