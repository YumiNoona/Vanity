import React, { useState, useRef, useEffect, useCallback } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, Eye, EyeOff, Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { toast } from "sonner"
import { loadImage, exportCanvas, downloadBlob } from "@/lib/canvas"
import { useObjectUrl } from "@/hooks/useObjectUrl"
import { cn } from "@/lib/utils"

type Simulation = "protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia" | "original"

const MATRICES: Record<string, number[]> = {
  protanopia: [0.567, 0.433, 0.0, 0.558, 0.442, 0.0, 0.0, 0.242, 0.758],
  deuteranopia: [0.625, 0.375, 0.0, 0.700, 0.300, 0.0, 0.0, 0.300, 0.700],
  tritanopia: [0.950, 0.050, 0.0, 0.0, 0.433, 0.567, 0.0, 0.475, 0.525],
  achromatopsia: [0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114]
}

export function ColorBlindness() {
  const [file, setFile] = useState<File | null>(null)
  const { url: previewUrl, setUrl: setPreviewUrl, clear: clearPreviewUrl } = useObjectUrl()
  const [mode, setMode] = useState<Simulation>("original")
  const [isProcessing, setIsProcessing] = useState(false)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const originalDataRef = useRef<ImageData | null>(null)
  const runIdRef = useRef(0)

  const handleDrop = (files: File[]) => {
    const f = files[0]
    if (f) {
      setFile(f)
      setPreviewUrl(f)
      setMode("original")
      originalDataRef.current = null // Reset cache
    }
  }

  const applyEffect = useCallback((simMode: Simulation) => {
    if (!originalDataRef.current || !canvasRef.current) return
    const runId = ++runIdRef.current
    setIsProcessing(true)
    setMode(simMode)

    // Yield to UI to show spinner
    setTimeout(() => {
      if (runId !== runIdRef.current) return
      
      const canvas = canvasRef.current!
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!
      const source = originalDataRef.current!
      
      if (simMode === "original") {
        ctx.putImageData(source, 0, 0)
        setIsProcessing(false)
        return
      }

      const imageData = new ImageData(
        new Uint8ClampedArray(source.data),
        source.width,
        source.height
      )
      const data = imageData.data
      const matrix = MATRICES[simMode]

      // Optimized matrix transformation
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]

        data[i]     = r * matrix[0] + g * matrix[1] + b * matrix[2]
        data[i + 1] = r * matrix[3] + g * matrix[4] + b * matrix[5]
        data[i + 2] = r * matrix[6] + g * matrix[7] + b * matrix[8]
      }

      ctx.putImageData(imageData, 0, 0)
      setIsProcessing(false)
    }, 50)
  }, [])

  useEffect(() => {
    if (!file || !previewUrl || !canvasRef.current) return

    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current!
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!
      ctx.drawImage(img, 0, 0)
      originalDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height)
      setMode("original")
      setIsProcessing(false)
    }
    img.onerror = () => toast.error("Failed to load image")
    img.src = previewUrl
  }, [file, previewUrl])

  const handleDownload = () => {
    if (!canvasRef.current) return
    canvasRef.current.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, `vanity-${mode}-${file?.name || 'image.png'}`)
        toast.success("Simulation exported!")
      }
    }, "image/png")
  }

  const handleBack = () => {
    setFile(null)
    clearPreviewUrl()
    originalDataRef.current = null
  }

  if (!file) {
    return (
      <ToolUploadLayout title="Color Blindness Simulator" description="Mathematically simulate visual perception to test UI accessibility." icon={EyeOff}>
        <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} label="Drop image to start simulation" />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout 
      title="Blindness Simulator" 
      description={`Simulating ${mode.toUpperCase()} vision against 1:1 pixel matrices.`} 
      icon={Eye} 
      centered={true}
      maxWidth="max-w-6xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8">
             <div className="glass-panel p-4 rounded-3xl min-h-[600px] bg-[#050505] border border-white/5 flex items-center justify-center relative shadow-2xl overflow-hidden group">
                <canvas 
                   ref={canvasRef} 
                   className={cn(
                     "max-w-full max-h-[75vh] rounded-xl shadow-2xl transition-all duration-500",
                     isProcessing ? "opacity-30 blur-sm scale-[0.99]" : "opacity-100 scale-100"
                   )} 
                />
                
                {isProcessing && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
                      <RefreshCw className="w-12 h-12 text-primary animate-spin" />
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Simulating Vision...</span>
                   </div>
                )}
                
                <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-xl rounded-full border border-white/10">
                   <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-white/50">{mode}</span>
                </div>
             </div>
         </div>

         <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel p-8 rounded-[2rem] border border-white/5 bg-black/20 space-y-6">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-primary" /> Visual Deficiencies
               </h3>
               
               <div className="space-y-3">
                  {[
                    { id: "original", label: "Normal Vision", desc: "Standard trichromatic" },
                    { id: "protanopia", label: "Protanopia", desc: "Red-blindness (Protan)", color: "text-red-400" },
                    { id: "deuteranopia", label: "Deuteranopia", desc: "Green-blindness (Deutan)", color: "text-green-400" },
                    { id: "tritanopia", label: "Tritanopia", desc: "Blue-blindness (Tritan)", color: "text-blue-400" },
                    { id: "achromatopsia", label: "Achromatopsia", desc: "Monochromacy (Grey)", color: "text-stone-400" }
                  ].map((m) => (
                    <button 
                      key={m.id}
                      onClick={() => applyEffect(m.id as any)}
                      disabled={isProcessing}
                      className={cn(
                        "w-full p-5 rounded-2xl text-left transition-all border flex flex-col gap-1 group",
                        mode === m.id 
                          ? "bg-primary/10 border-primary/40 shadow-inner" 
                          : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                      )}
                    >
                       <h4 className={cn("text-[11px] font-black uppercase tracking-wider group-hover:translate-x-1 transition-transform", m.color || "text-white")}>
                         {m.label}
                       </h4>
                       <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight opacity-60">
                         {m.desc}
                       </p>
                    </button>
                  ))}
               </div>

               <div className="h-px bg-white/5" />

               <div className="space-y-3 pt-2">
                  <button 
                    onClick={handleDownload}
                    disabled={isProcessing}
                    className="w-full py-5 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Download className="w-5 h-5" /> Export Frame
                  </button>
                  <button 
                    onClick={handleBack}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-xl border border-white/10 transition-all"
                  >
                    New Analysis
                  </button>
               </div>
            </div>

            <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 flex gap-4">
               <AlertCircle className="w-5 h-5 text-primary shrink-0" />
               <p className="text-[10px] text-muted-foreground leading-relaxed uppercase">
                 These simulations use standard LMS matrix transformations. Use this tool to ensure high-contrast accessibility across all vision types.
               </p>
            </div>
         </div>
      </div>
    </ToolLayout>
  )
}
