import React, { useState, useRef, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { downloadBlob } from "@/lib/canvas"

type Simulation = "protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia" | "original"

const MATRICES: Record<string, number[]> = {
  protanopia: [0.567, 0.433, 0.0, 0.558, 0.442, 0.0, 0.0, 0.242, 0.758], // Red blind
  deuteranopia: [0.625, 0.375, 0.0, 0.700, 0.300, 0.0, 0.0, 0.300, 0.700], // Green blind
  tritanopia: [0.950, 0.050, 0.0, 0.0, 0.433, 0.567, 0.0, 0.475, 0.525], // Blue blind
  achromatopsia: [0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114] // Monochromacy
}

export function ColorBlindness() {
  const [file, setFile] = useState<File | null>(null)
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [mode, setMode] = useState<Simulation>("original")
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const handleDrop = (files: File[]) => {
    if (files[0]) {
      setFile(files[0])
      setImgUrl(URL.createObjectURL(files[0]))
      setMode("original")
      setOutputUrl(null)
    }
  }

  const applyMatrix = async (simMode: Simulation) => {
    setMode(simMode)
    if (simMode === "original") {
      setOutputUrl(imgUrl)
      return
    }

    if (!imgRef.current || !canvasRef.current || !imgUrl) return
    setIsProcessing(true)

    // Using setTimeout to yield main thread briefly so UI doesn't completely lock instantly before loader renders
    setTimeout(() => {
      try {
        const img = imgRef.current!
        const canvas = canvasRef.current!
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) throw new Error("Failed to get 2d context")

        ctx.drawImage(img, 0, 0)
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        const matrix = MATRICES[simMode]

        // Strict matrix multiplication over flat Uint8ClampedArray
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]

          data[i]     = r * matrix[0] + g * matrix[1] + b * matrix[2]
          data[i + 1] = r * matrix[3] + g * matrix[4] + b * matrix[5]
          data[i + 2] = r * matrix[6] + g * matrix[7] + b * matrix[8]
        }

        ctx.putImageData(imageData, 0, 0)
        setOutputUrl(canvas.toDataURL("image/png"))
      } catch (err) {
        toast.error("Failed to process image matrix")
      } finally {
        setIsProcessing(false)
      }
    }, 50)
  }

  const handleDownload = () => {
    if (!outputUrl || !file) return
    const a = document.createElement("a")
    a.href = outputUrl
    a.download = `vanity-${mode}-${file.name}`
    a.click()
  }

  if (!file || !imgUrl) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center animate-in fade-in duration-500">
         <div className="inline-flex items-center justify-center p-3 bg-purple-500/10 rounded-full mb-6 text-purple-500">
            <EyeOff className="w-8 h-8" />
         </div>
         <h1 className="text-4xl font-bold font-syne mb-1 text-white">Color Blindness Simulator</h1>
         <p className="text-muted-foreground text-lg mb-8">
           Apply mathematically precise pixel matrices to rigorously test UI/UX color accessibility.
         </p>
         <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 sm:px-0 pb-20">
      {/* Hidden processing resources */}
      <img ref={imgRef} src={imgUrl} className="hidden" crossOrigin="anonymous" alt="Original" />
      <canvas ref={canvasRef} className="hidden" />

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
             <Eye className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-syne text-white">Accessibility Preview</h1>
            <p className="text-muted-foreground text-sm">Visualizing {mode.toUpperCase()} matrices directly against RGB pipelines locally.</p>
          </div>
        </div>
        <button onClick={() => setFile(null)} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         <div className="lg:col-span-3">
             <div className="relative aspect-video rounded-3xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center shadow-2xl">
                {isProcessing ? (
                   <div className="flex flex-col items-center">
                     <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
                     <p className="font-mono text-sm text-muted-foreground">Applying matrix transformation...</p>
                   </div>
                ) : (
                   outputUrl && <img src={outputUrl} className="max-w-full max-h-full object-contain pointer-events-none" alt="Simulated" />
                )}
                <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur rounded text-xs font-bold text-white uppercase tracking-widest border border-white/5">
                   {mode}
                </div>
             </div>
         </div>

         <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 block">Simulation Modes</label>
            
            <button 
              onClick={() => applyMatrix("original")}
              className={`w-full p-4 rounded-xl text-left transition-all border ${mode === "original" ? "bg-white/10 border-purple-500/50" : "bg-black/30 border-white/5 hover:bg-white/5"}`}
            >
               <h4 className="font-bold text-white mb-1">Standard / Original</h4>
               <p className="text-xs text-muted-foreground">Normal trichromatic vision</p>
            </button>

            <button 
              onClick={() => applyMatrix("protanopia")}
              className={`w-full p-4 rounded-xl text-left transition-all border ${mode === "protanopia" ? "bg-white/10 border-purple-500/50" : "bg-black/30 border-white/5 hover:bg-white/5"}`}
            >
               <h4 className="font-bold text-white mb-1 text-red-300">Protanopia</h4>
               <p className="text-xs text-muted-foreground">Red-blindness / Red anomaly</p>
            </button>

            <button 
              onClick={() => applyMatrix("deuteranopia")}
              className={`w-full p-4 rounded-xl text-left transition-all border ${mode === "deuteranopia" ? "bg-white/10 border-purple-500/50" : "bg-black/30 border-white/5 hover:bg-white/5"}`}
            >
               <h4 className="font-bold text-white mb-1 text-green-300">Deuteranopia</h4>
               <p className="text-xs text-muted-foreground">Green-blindness / Most common</p>
            </button>

            <button 
              onClick={() => applyMatrix("tritanopia")}
              className={`w-full p-4 rounded-xl text-left transition-all border ${mode === "tritanopia" ? "bg-white/10 border-purple-500/50" : "bg-black/30 border-white/5 hover:bg-white/5"}`}
            >
               <h4 className="font-bold text-white mb-1 text-blue-300">Tritanopia</h4>
               <p className="text-xs text-muted-foreground">Blue-blindness / Very rare</p>
            </button>
            
            <button 
              onClick={() => applyMatrix("achromatopsia")}
              className={`w-full p-4 rounded-xl text-left transition-all border ${mode === "achromatopsia" ? "bg-white/10 border-purple-500/50" : "bg-black/30 border-white/5 hover:bg-white/5"}`}
            >
               <h4 className="font-bold text-white mb-1 text-stone-300">Achromatopsia</h4>
               <p className="text-xs text-muted-foreground">Complete color blindness</p>
            </button>

            <button 
              onClick={handleDownload}
              disabled={isProcessing || !outputUrl}
              className="w-full py-4 mt-8 bg-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-purple-600 transition-colors disabled:opacity-50"
            >
               <Download className="w-5 h-5" /> Download Render
            </button>
         </div>
      </div>
    </div>
  )
}
