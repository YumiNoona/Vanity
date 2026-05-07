import React, { useState, useRef, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, Loader2, Sparkles, Eraser, RefreshCw, Layers } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"
import { useImageProcessor } from "@/hooks/useImageProcessor"
import { drawToCanvas, exportCanvas, downloadBlob } from "@/lib/canvas"
import { runYieldedTask } from "@/lib/canvas/guards"
import { useObjectUrl } from "@/hooks/useObjectUrl"

export function ObjectEraser({ embedded = false }: { embedded?: boolean }) {
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
    ctx?.beginPath()
  }

  const draw = (e: any) => {
    if (!isDrawing || !maskCanvasRef.current) return
    const canvas = maskCanvasRef.current
    const ctx = canvas.getContext("2d")!
    const rect = canvas.getBoundingClientRect()
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
    const width = canvas.width
    const height = canvas.height
    
    updateProgress(0)
    
    const step = () => {
      const chunkSize = 20000 
      const end = Math.min(processed + chunkSize, total)
      const searchRadius = 12

      for (let i = processed; i < end; i += 4) {
        if (maskPixels[i + 3] > 128) {
          const pxIdx = i / 4
          const x = pxIdx % width
          const y = Math.floor(pxIdx / width)

          let found = false
          // Search spirals out to find nearest non-masked pixel
          for (let r = 1; r < searchRadius && !found; r++) {
            for (let dx = -r; dx <= r && !found; dx++) {
              for (let dy = -r; dy <= r && !found; dy++) {
                if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue
                const nx = x + dx
                const ny = y + dy
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                  const nIdx = (ny * width + nx) * 4
                  if (maskPixels[nIdx + 3] < 20) {
                    data[i] = data[nIdx]
                    data[i + 1] = data[nIdx + 1]
                    data[i + 2] = data[nIdx + 2]
                    found = true
                  }
                }
              }
            }
          }
        }
      }
      
      processed = end
      updateProgress(Math.floor((processed / total) * 100))
    }
    
    try {
      await runYieldedTask(step, () => processed < total && jobId === getJobId())
      if (jobId !== getJobId()) return
      ctx.putImageData(imgData, 0, 0)
      const blob = await exportCanvas(canvas, "image/png", 1.0)
      setResultBlob(blob)
      setResultUrl(blob)
      toast.success("Object removal complete!")
    } catch (e) {
      toast.error("Processing failed")
    } finally {
      if (jobId === getJobId()) updateProgress(100)
    }
  }

  if (!file) {
    return (
      <ToolUploadLayout title="Object Eraser" description="Precision removal of watermarks, people, or objects." icon={Eraser} hideHeader={embedded}>
        <div className="max-w-2xl mx-auto">
          <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} />
        </div>
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout title="Object Eraser" description="Brush over unwanted elements." centered maxWidth="max-w-6xl" hideHeader={embedded}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-xl space-y-6">
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                   <span className="text-xs font-bold uppercase tracking-widest text-white/50">Brush Size</span>
                   <span className="text-xs text-primary font-mono">{brushSize}px</span>
                </div>
                <input type="range" min="5" max="100" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-full accent-primary" />
             </div>
             <div className="pt-6 border-t border-white/5 space-y-4">
                <button onClick={() => {
                    const mCtx = maskCanvasRef.current?.getContext("2d")
                    mCtx?.clearRect(0, 0, maskCanvasRef.current!.width, maskCanvasRef.current!.height)
                  }} className="w-full py-3 text-xs font-bold bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center gap-2 transition-all">
                  <RefreshCw className="w-4 h-4" /> Clear Mask
                </button>
                <button onClick={handleProcess} disabled={isProcessing} className="w-full py-4 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                  {isProcessing ? <Loader2 className="animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  Erase Selection
                </button>
             </div>
          </div>
          <div className="glass-panel p-4 rounded-xl flex items-start gap-4 border-white/5">
             <div className="p-2 bg-primary/10 rounded text-primary"><Layers className="w-4 h-4" /></div>
             <p className="text-[10px] leading-relaxed text-muted-foreground uppercase font-bold tracking-tight">
               Our synthesis algorithm uses surrounding pixels to reconstruct the background. Brush slightly wider than the object for the best blend.
             </p>
          </div>
        </div>

        <div className="lg:col-span-3 glass-panel p-4 rounded-3xl flex items-center justify-center bg-black/40 min-h-[500px] relative overflow-hidden">
          <canvas ref={canvasRef} className="max-w-full max-h-[70vh] rounded shadow-2xl" />
          <canvas ref={maskCanvasRef} className="absolute max-w-full max-h-[70vh] rounded cursor-crosshair touch-none" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
          
          {isProcessing && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <h3 className="text-xl font-black font-syne text-white uppercase tracking-tighter">Synthesizing...</h3>
              <div className="w-48 h-1.5 bg-white/5 rounded-full mt-6 overflow-hidden">
                 <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {resultUrl && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-black pointer-events-auto">
               <img src={resultUrl} className="max-w-full max-h-[70vh] rounded shadow-2xl" />
               <div className="absolute top-6 right-6 flex gap-3">
                  <button onClick={() => resultBlob && downloadBlob(resultBlob, "erased.png")} className="px-8 py-3 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-full shadow-xl shadow-primary/20">
                    <Download className="w-4 h-4 mr-2 inline" /> Export
                  </button>
                  <button onClick={() => clearResultUrl()} className="px-8 py-3 bg-white/5 text-white border border-white/10 rounded-full text-xs font-black uppercase tracking-widest hover:bg-white/10">
                    Back
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
