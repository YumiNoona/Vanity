import React, { useState } from "react"

import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, Loader2, Maximize2, Sparkles } from "lucide-react"
import { usePremium } from "@/hooks/usePremium"
import { useObjectUrl } from "@/hooks/useObjectUrl"
import { toast } from "sonner"
import { useImageProcessor } from "@/hooks/useImageProcessor"
import { drawToCanvas, exportCanvas, downloadBlob } from "@/lib/canvas"
import { runYieldedTask, guardDimensions } from "@/lib/canvas/guards"

export function AiUpscaler() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const { isProcessing, progress, processImage, updateProgress, getJobId, clearCurrent } = useImageProcessor()
  const isMountedRef = React.useRef(true)

  React.useEffect(() => {
    return () => { isMountedRef.current = false }
  }, [])

  const initUpscaler = async () => {
    if (!upscalerRef.current) {
      const Upscaler = (await import("upscaler")).default
      upscalerRef.current = new Upscaler()
    }
  }
  
  const upscalerRef = React.useRef<any>(null)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()
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
      
      updateProgress(1) // Show activity immediately
      
      try {
        await initUpscaler()

        const upscaledDataUrl = await upscalerRef.current.upscale(result.source, {
          patchSize: 64,
          padding: 2,
          progress: (percent: number) => {
            if (jobId === getJobId()) {
              updateProgress(Math.max(1, Math.round(percent * 100)))
            }
          }
        })

        if (jobId !== getJobId() || !isMountedRef.current) {
          result.cleanup()
          return
        }
        
        // Convert Data URL to Blob for download consistency
        const response = await fetch(upscaledDataUrl)
        const blob = await response.blob()
        
        if (!isMountedRef.current || jobId !== getJobId()) {
          result.cleanup()
          return
        }

        setResultBlob(blob)
        setResultUrl(blob)
        toast.success(`Image upscaled successfully!`)
      } catch (err: any) {
        console.error("Upscale error:", err)
        toast.error(`Upscale failed: ${err.message || "Unknown error"}. Check your connection.`)
        updateProgress(0)
      } finally {
        result.cleanup()
      }
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
    clearCurrent()
    setFile(null)
    clearResultUrl()
    updateProgress(0)
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
         <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6 text-primary">
            <Maximize2 className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1">Image Upscaler</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Increase resolution by 2x or 4x using actual AI super-resolution.
        </p>
        <DropZone onDrop={handleProcess} accept={{ "image/*": [] }} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-3xl font-bold font-syne mb-2">Image Upscaler</h1>
          <p className="text-muted-foreground text-sm">Target: {file.name}</p>
        </div>
        <button onClick={handleStartNew} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Start New
        </button>
      </div>

      <div className="glass-panel p-8 rounded-xl flex flex-col items-center justify-center min-h-[450px] relative overflow-hidden">
        {(isProcessing || (progress > 0 && progress < 100)) && (
          <div className="absolute inset-0 bg-[#030303]/90 backdrop-blur-xl z-20 flex flex-col items-center justify-center animate-in fade-in duration-500">
             <div className="w-full max-w-md px-8 space-y-8 text-center">
                <div className="relative inline-block">
                   <div className="w-24 h-24 rounded-full border-4 border-white/5 border-t-primary animate-spin" />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-black font-mono text-primary">{progress}%</span>
                   </div>
                </div>
                
                <div className="space-y-2">
                   <h3 className="text-2xl font-bold font-syne mt-6 animate-pulse">
                {progress > 1 ? "AI Reconstruction..." : progress === 1 ? "Downloading AI Model..." : "Waking AI Model..."}
              </h3>
                   <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] font-medium">
                     Neural Network Processing • Local GPU
                   </p>
                </div>

                <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                   <div 
                     className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-orange-400 transition-all duration-500 ease-out shadow-[0_0_15px_rgba(245,158,11,0.5)]" 
                     style={{ width: `${progress}%` }}
                   />
                </div>
                
                <div className="pt-4 flex items-center justify-center gap-2 text-[10px] text-muted-foreground bg-white/5 py-2 px-4 rounded-full border border-white/10 w-fit mx-auto">
                   <Sparkles className="w-3 h-3 text-yellow-500" />
                   <span>ESRGAN x4 Active • Browser Instance</span>
                </div>
             </div>
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
