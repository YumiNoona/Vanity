import React, { useState, useRef, useEffect, useCallback } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, Pencil, RefreshCw, SlidersHorizontal } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function ImageToSketch() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [intensity, setIntensity] = useState(50)
  const [isProcessing, setIsProcessing] = useState(false)
  const mainCanvas = useRef<HTMLCanvasElement>(null)
  const processingTimeoutRef = useRef<number | null>(null)
  const runIdRef = useRef(0)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (processingTimeoutRef.current !== null) {
        window.clearTimeout(processingTimeoutRef.current)
      }
    }
  }, [])

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return
    setFile(uploadedFile)
  }

  const applyEffect = useCallback(() => {
    if (!file || !mainCanvas.current) return
    runIdRef.current += 1
    const runId = runIdRef.current
    if (processingTimeoutRef.current !== null) {
      window.clearTimeout(processingTimeoutRef.current)
      processingTimeoutRef.current = null
    }
    setIsProcessing(true)

    // Load directly from File — no dependency on previewUrl state
    const localUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(localUrl)
      if (!isMountedRef.current || runId !== runIdRef.current) return
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
      processingTimeoutRef.current = window.setTimeout(() => {
        if (!isMountedRef.current || runId !== runIdRef.current) return
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
        tempCanvas.width = 0
        tempCanvas.height = 0
        setIsProcessing(false)
        processingTimeoutRef.current = null
      }, 50)
    }
    img.onerror = () => {
      URL.revokeObjectURL(localUrl)
      if (!isMountedRef.current || runId !== runIdRef.current) return
      setIsProcessing(false)
      toast.error("Failed to decode image")
    }
    img.src = localUrl
  }, [file, intensity])

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
      <ToolUploadLayout
        title="Image to Sketch"
        description="Instantly turn any photo into a professional pencil-sketch illustration."
        icon={Pencil}
      >
        <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} label="Drop photo here" />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout
      title="Sketch Studio"
      description="Adjust intensity for different artistic styles."
      icon={Pencil}
      onBack={() => setFile(null)}
      maxWidth="max-w-6xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">
        <div className="lg:col-span-8">
          <div className="glass-panel p-4 rounded-3xl flex items-center justify-center min-h-[500px] bg-black/40 shadow-inner relative overflow-hidden group border border-white/5">
             {isProcessing && (
                <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                   <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                </div>
             )}
             <canvas ref={mainCanvas} className="max-w-full max-h-full rounded-xl shadow-lg transition-transform group-hover:scale-[1.01] duration-500" />
             <div className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-widest text-white/20">Canvas Output</div>
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
    </ToolLayout>
  )
}
