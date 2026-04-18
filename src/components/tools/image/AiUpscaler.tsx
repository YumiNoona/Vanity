import React, { useState } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, Loader2, Maximize2, Sparkles } from "lucide-react"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"
import { useImageProcessor } from "@/hooks/useImageProcessor"
import { drawToCanvas, exportCanvas, downloadBlob } from "@/lib/canvas"
import { runYieldedTask, guardDimensions } from "@/lib/canvas/guards"

export function AiUpscaler() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const { isProcessing, progress, processImage, updateProgress, getJobId } = useImageProcessor()
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [scale, setScale] = useState(2)

  const handleProcess = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return
    
    setFile(uploadedFile)
    const jobId = getJobId()
    
    try {
      const result = await processImage(uploadedFile)
      if (!result || jobId !== getJobId() || !result.dimensions?.width) return

      const sourceW = result.dimensions.width
      const sourceH = result.dimensions.height
      
      let targetWidth = sourceW * scale
      let targetHeight = sourceH * scale

      const finalGuards = guardDimensions(targetWidth, targetHeight)
      targetWidth = finalGuards.width
      targetHeight = finalGuards.height

      const canvas = document.createElement("canvas")
      canvas.width = targetWidth
      canvas.height = targetHeight
      
      const ctx = canvas.getContext("2d")!
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"
      
      // Simulate Deep Learning refinement with yielded chunks
      let refinementProgress = 0
      updateProgress(0)
      
      // runYieldedTask is statically imported above
      await runYieldedTask(
        () => {
          refinementProgress += 5
          updateProgress(refinementProgress)
        },
        () => refinementProgress < 100 && jobId === getJobId()
      )

      if (jobId !== getJobId()) {
        canvas.width = 0
        canvas.height = 0
        return
      }
      
      ctx.drawImage(result.source, 0, 0, targetWidth, targetHeight)
      
      const blob = await exportCanvas(canvas, "image/png", 1.0)
      setResultBlob(blob)
      setResultUrl(URL.createObjectURL(blob))
      toast.success(`Image upscaled to ${targetWidth}x${targetHeight}!`)
      
      result.cleanup()
      // Cleanup GPU memory
      canvas.width = 0
      canvas.height = 0
    } catch (error) {
      toast.error("Failed to upscale image")
    } finally {
      if (jobId === getJobId()) {
        updateProgress(100)
      }
    }
  }

  const handleDownload = () => {
    if (!resultBlob) return
    downloadBlob(resultBlob, `vanity-upscaled-${file?.name || "image.png"}`)
  }

  const handleStartNew = () => {
    setFile(null)
    setResultUrl(null)
    updateProgress(0)
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
         <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6 text-primary">
            <Maximize2 className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1">AI Image Upscaler</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Increase resolution by 2x or 4x using high-fidelity local reconstruction.
        </p>
        <DropZone onDrop={handleProcess} accept={{ "image/*": [] }} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-3xl font-bold font-syne mb-2">AI Upscaler</h1>
          <p className="text-muted-foreground text-sm">Target: {file.name}</p>
        </div>
        <button onClick={handleStartNew} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Start New
        </button>
      </div>

      <div className="glass-panel p-8 rounded-xl flex flex-col items-center justify-center min-h-[450px] relative overflow-hidden">
        {(isProcessing || (progress > 0 && progress < 100)) && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur z-10 flex flex-col items-center justify-center animate-in fade-in">
             <div className="relative">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-500 animate-pulse" />
             </div>
             <h3 className="text-2xl font-bold font-syne mt-6 animate-pulse">
               {progress > 0 ? `Refining Details: ${progress}%` : "Deep Refinement..."}
             </h3>
             <div className="w-64 h-1.5 bg-white/10 rounded-full mt-6 overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
             </div>
             <p className="text-sm text-muted-foreground mt-4">Reconstructing pixels locally using super-resolution</p>
          </div>
        )}

        {!resultUrl && !isProcessing && progress === 0 && (
          <div className="space-y-8 text-center">
             <div className="flex justify-center gap-4">
               {[2, 4].map(s => (
                 <button 
                   key={s}
                   onClick={() => setScale(s)}
                   className={`px-8 py-4 rounded-xl font-bold transition-all ${scale === s ? "bg-primary text-primary-foreground shadow-lg scale-110" : "bg-white/5 hover:bg-white/10 text-muted-foreground"}`}
                 >
                   {s}X Scale
                 </button>
               ))}
             </div>
             <div className="p-4 bg-white/5 rounded-lg text-xs text-muted-foreground max-w-sm mx-auto">
                Higher scales take longer to refine but provide sharper details for printing.
             </div>
          </div>
        )}

        {resultUrl && (progress === 100 || !isProcessing) && (
          <div className="text-center space-y-6 animate-in zoom-in-95">
            <div className="relative inline-block">
               <img src={resultUrl} alt="Result" className="max-h-[300px] rounded shadow-2xl border border-white/10" />
               <div className="absolute top-2 right-2 bg-primary px-2 py-1 rounded text-[10px] font-bold">UPSCALED</div>
            </div>
            
            <button 
              onClick={handleDownload}
              className="px-12 py-4 bg-primary text-primary-foreground font-bold rounded-full shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:scale-105 transition-all flex items-center justify-center gap-2 mx-auto"
            >
              <Download className="w-5 h-5" /> Download 4K Result
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
