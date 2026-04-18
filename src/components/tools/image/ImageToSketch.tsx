import React, { useState, useRef, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, Download, Pencil, RefreshCw, SlidersHorizontal } from "lucide-react"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function ImageToSketch() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [intensity, setIntensity] = useState(50)
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const mainCanvas = useRef<HTMLCanvasElement>(null)

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return
    setFile(uploadedFile)
    setPreviewUrl(URL.createObjectURL(uploadedFile))
  }

  const applyEffect = useCallback(() => {
    if (!file || !mainCanvas.current) return
    setIsProcessing(true)

    const img = new Image()
    img.onload = () => {
      const canvas = mainCanvas.current!
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!
      
      // 1. Draw original as Grayscale
      ctx.filter = "grayscale(100%)"
      ctx.drawImage(img, 0, 0)
      
      // 2. Get grayscale data
      const grayData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      
      // 3. Create an inverted & blurred version on a temp canvas
      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      const tCtx = tempCanvas.getContext("2d")!
      
      // Invert and Blur
      const blurAmount = (intensity / 100) * 20
      tCtx.filter = `grayscale(100%) invert(100%) blur(${blurAmount}px)`
      tCtx.drawImage(img, 0, 0)
      
      const invData = tCtx.getImageData(0, 0, canvas.width, canvas.height)
      
      // 4. Color Dodge Blend (Yield to browser to render loading state)
      setTimeout(() => {
        const result = ctx.createImageData(canvas.width, canvas.height)
        for (let i = 0; i < grayData.data.length; i += 4) {
          // Color Dodge formula: result = base / (1 - blend)
          for (let j = 0; j < 3; j++) {
              const base = grayData.data[i + j]
              const blend = invData.data[i + j]
              const val = blend === 255 ? 255 : Math.min(255, (base * 255) / (255 - blend))
              result.data[i + j] = val
          }
          result.data[i + 3] = 255 // Alpha
        }
        
        ctx.filter = "none"
        ctx.putImageData(result, 0, 0)
        setIsProcessing(false)
      }, 50)
    }
    img.src = previewUrl!
  }, [file, intensity, previewUrl])

  useEffect(() => {
    if (file) applyEffect()
  }, [file, intensity, applyEffect])

  const handleDownload = () => {
    if (!mainCanvas.current) return
    const url = mainCanvas.current.toDataURL("image/png")
    const a = document.createElement("a")
    a.href = url
    a.download = `vanity-sketch-${Date.now()}.png`
    a.click()
    toast.success("Sketch exported!")
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center animate-in fade-in duration-500">
         <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6 text-primary">
            <Pencil className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1">Image to Sketch</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Instantly turn any photo into a professional pencil-sketch illustration.
        </p>
        <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} label="Drop photo here" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
             <Pencil className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-syne">Sketch Studio</h1>
            <p className="text-muted-foreground text-sm">Adjust intensity for different artistic styles.</p>
          </div>
        </div>
        <button onClick={() => setFile(null)} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Start New
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">
        <div className="lg:col-span-8">
          <div className="glass-panel p-4 rounded-3xl flex items-center justify-center min-h-[500px] bg-[#f8f9fa] shadow-inner relative overflow-hidden group">
             {isProcessing && (
                <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-sm flex items-center justify-center">
                   <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                </div>
             )}
             <canvas ref={mainCanvas} className="max-w-full max-h-full rounded-xl shadow-lg transition-transform group-hover:scale-[1.01] duration-500" />
             <div className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-widest text-black/20">Canvas Output</div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="glass-panel p-8 rounded-2xl space-y-8">
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                       <SlidersHorizontal className="w-3 h-3" /> Sketch Intensity
                    </label>
                    <span className="text-lg font-bold font-mono text-primary">{intensity}%</span>
                 </div>
                 <input 
                   type="range" 
                   min="5" 
                   max="95" 
                   value={intensity}
                   onChange={(e) => setIntensity(parseInt(e.target.value))}
                   className="w-full relative h-1.5 bg-primary/10 rounded-lg appearance-none cursor-pointer accent-primary"
                 />
                 <div className="flex justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                    <span>Minimal</span>
                    <span>Realistic</span>
                    <span>Abstract</span>
                 </div>
              </div>

              <div className="space-y-4">
                 <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pro Tip</h4>
                 <p className="text-[10px] leading-relaxed text-muted-foreground">
                   Higher intensity values create softer, more artistic "watercolor-pencil" looks. Lower values yield sharper "technical-drawings".
                 </p>
              </div>

              <button 
                onClick={handleDownload}
                disabled={isProcessing}
                className="w-full py-5 bg-primary text-primary-foreground font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <Download className="w-5 h-5" />
                Export High-Res Sketch
              </button>
           </div>
        </div>
      </div>
    </div>
  )
}

function useCallback(arg0: () => void, arg1: (File | null | number | string | null)[]) {
    return React.useCallback(arg0, arg1)
}
