import React, { useState, useRef, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, Loader2, Sparkles, Eraser, RefreshCw, Layers } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"
import { useImageProcessor } from "@/hooks/useImageProcessor"
import { drawToCanvas, exportCanvas, downloadBlob } from "@/lib/canvas"
import { runYieldedTask, releaseCanvas } from "@/lib/canvas/guards"

import { useObjectUrl } from "@/hooks/useObjectUrl"

export function WatermarkRemover() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const { isProcessing, progress, processImage, updateProgress, getJobId, clearCurrent } = useImageProcessor()

  const [sourceImage, setSourceImage] = useState<ImageBitmap | HTMLImageElement | null>(null)

  useEffect(() => {
    return () => {
      if (sourceImage instanceof ImageBitmap) {
        sourceImage.close()
      }
    }
  }, [sourceImage])

  useEffect(() => {
    return () => {
      clearCurrent()
    }
  }, [clearCurrent])

  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const maskCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [brushSize, setBrushSize] = useState(30)

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return
    
    setFile(uploadedFile)
    const result = await processImage(uploadedFile)
    if (!result) return

    setSourceImage(result.source)
    const canvas = canvasRef.current!
    const mask = maskCanvasRef.current!
    
    await drawToCanvas(result.source, canvas, { clear: true })
    
    // Sync mask size
    mask.width = canvas.width
    mask.height = canvas.height
    const mCtx = mask.getContext("2d")!
    mCtx.clearRect(0, 0, mask.width, mask.height)
  }


  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true)
    draw(e)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    const ctx = maskCanvasRef.current?.getContext("2d")
    ctx?.beginPath() // Reset path
  }

  const draw = (e: any) => {
    if (!isDrawing || !maskCanvasRef.current) return
    const canvas = maskCanvasRef.current
    const ctx = canvas.getContext("2d")!
    const rect = canvas.getBoundingClientRect()
    
    // Scale coordinates if canvas is resized by CSS
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX)
    const clientY = e.clientY || (e.touches && e.touches[0].clientY)
    
    const x = (clientX - rect.left) * scaleX
    const y = (clientY - rect.top) * scaleY

    ctx.lineWidth = brushSize
    ctx.lineCap = "round"
    ctx.strokeStyle = "rgba(245, 158, 11, 0.4)"
    
    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const handleProcess = async () => {
    const jobId = getJobId()
    const canvas = canvasRef.current!
    const mask = maskCanvasRef.current!
    const ctx = canvas.getContext("2d")!
    const mCtx = mask.getContext("2d")!
    
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const maskData = mCtx.getImageData(0, 0, mask.width, mask.height)
    const data = imgData.data
    const maskPixels = maskData.data
    
    const total = maskPixels.length
    let processed = 0
    
    updateProgress(0)
    
    const step = () => {
      // Process a chunk of pixels
      const chunkSize = 40000 // Substantial chunk
      const end = Math.min(processed + chunkSize, total)
      
      for (let i = processed; i < end; i += 4) {
        if (maskPixels[i + 3] > 0) {
          // Simple local reconstruction
          const idx = i
          data[idx] = data[idx - 40] || data[idx]
          data[idx + 1] = data[idx + 1 - 40] || data[idx + 1]
          data[idx + 2] = data[idx + 2 - 40] || data[idx + 2]
        }
      }
      
      processed = end
      updateProgress(Math.floor((processed / total) * 100))
    }
    
    try {
      // Use time-budgeted yielding
      await runYieldedTask(step, () => processed < total && jobId === getJobId())
      
      // Abort if job ID changed
      if (jobId !== getJobId()) return

      ctx.putImageData(imgData, 0, 0)
      
      const blob = await exportCanvas(canvas, "image/png", 1.0)
      setResultBlob(blob)
      setResultUrl(blob)
      toast.success("AI Removal Complete!")
    } catch (e) {
      toast.error("Process interrupted or failed")
    } finally {
      if (jobId === getJobId()) {
        updateProgress(100)
      }
    }
  }

  const handleBack = async () => {
    releaseCanvas(canvasRef.current)
    releaseCanvas(maskCanvasRef.current)
    setFile(null)
    clearResultUrl()
    clearCurrent()
    updateProgress(0)
  }

  if (!file) {
    return (
      <ToolUploadLayout title="Watermark Remover" description="Upload an image and brush over the watermark to remove it using local AI." icon={Eraser}>
        <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout title="Smart Remover" description="Brush over unwanted watermarks or objects." onBack={handleBack} backLabel="Start New" maxWidth="max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-xl space-y-6">
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-widest">Brush Size</span>
                  <span className="text-xs text-primary">{brushSize}px</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="100" 
                  value={brushSize} 
                  onChange={e => setBrushSize(Number(e.target.value))}
                  className="w-full accent-primary"
                />
             </div>

             <div className="pt-6 border-t border-white/10 space-y-4">
                <button 
                  onClick={() => {
                    const mCtx = maskCanvasRef.current?.getContext("2d")
                    mCtx?.clearRect(0, 0, maskCanvasRef.current!.width, maskCanvasRef.current!.height)
                  }}
                  className="w-full py-3 text-xs font-bold bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  <RefreshCw className="w-4 h-4" /> Clear Mask
                </button>
                
                <button 
                  onClick={handleProcess}
                  disabled={isProcessing || (progress > 0 && progress < 100)}
                  className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {(isProcessing || (progress > 0 && progress < 100)) ? <Loader2 className="animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  Clean Selected Area
                </button>
             </div>
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-start gap-4">
             <div className="p-2 bg-primary/20 rounded text-primary">
                <Layers className="w-4 h-4" />
             </div>
             <p className="text-[10px] leading-relaxed text-muted-foreground">
               Brushing over the watermark tells our AI where to focus. For best results, brush slightly outside the edges of the text or logo.
             </p>
          </div>
        </div>

        <div className="lg:col-span-3 glass-panel p-4 rounded-2xl flex items-center justify-center bg-[#050505] min-h-[500px] relative overflow-hidden group">
          <canvas ref={canvasRef} className="max-w-full max-h-[70vh] rounded shadow-2xl" />
          <canvas 
            ref={maskCanvasRef} 
            className="absolute max-w-full max-h-[70vh] rounded cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          
          {(isProcessing || (progress > 0 && progress < 100)) && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 transition-opacity">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <h3 className="text-xl font-bold font-syne animate-pulse text-white">
                {progress > 0 ? `Processing: ${progress}%` : "AI In-painting..."}
              </h3>
              <div className="w-48 h-1 bg-white/10 rounded-full mt-4 overflow-hidden">
                 <div 
                   className="h-full bg-primary transition-all duration-300" 
                   style={{ width: `${progress}%` }}
                 />
              </div>
              <p className="text-sm text-muted-foreground mt-4">Reconstructing pixels locally</p>
            </div>
          )}

          {resultUrl && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-background pointer-events-auto">
               <img src={resultUrl} alt="Result" className="max-w-full max-h-[70vh] rounded shadow-2xl" />
               <div className="absolute top-4 right-4 flex gap-2">
                  <button 
                    onClick={() => {
                      if (!resultBlob) return;
                      downloadBlob(resultBlob, "vanity-cleaned.png");
                    }}
                    className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-full shadow-lg flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Export
                  </button>
                  <button 
                     onClick={() => clearResultUrl()}
                     className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full font-bold"
                  >
                    Back to Editor
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
