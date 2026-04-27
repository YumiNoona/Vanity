import React, { useState, useRef, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, Loader2, ShieldAlert, Square, Circle, Info } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { usePremium } from "../../../hooks/usePremium"
import { toast } from "sonner"
import { useImageProcessor } from "../../../hooks/useImageProcessor"
import { useObjectUrl } from "../../../hooks/useObjectUrl"
import { drawToCanvas, exportCanvas, downloadBlob } from "../../../lib/canvas"

export function SmartCensor() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const { isProcessing, processImage, clearCurrent } = useImageProcessor()
  const [sourceImage, setSourceImage] = useState<ImageBitmap | HTMLImageElement | null>(null)
  const { url: previewUrl, setUrl: setPreviewUrl, clear: clearPreviewUrl } = useObjectUrl()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [rects, setRects] = useState<{x: number, y: number, w: number, h: number}[]>([])
  const [currentRect, setCurrentRect] = useState<{x: number, y: number, w: number, h: number} | null>(null)

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return
    
    setFile(uploadedFile)
    setPreviewUrl(uploadedFile)
    const result = await processImage(uploadedFile)
    if (!result) return

    setSourceImage(result.source)
    const canvas = canvasRef.current!
    await drawToCanvas(result.source, canvas, { clear: true })
  }

  useEffect(() => {
    if (sourceImage) {
      draw()
    }
  }, [sourceImage, rects, currentRect])

  const draw = async () => {
    const canvas = canvasRef.current
    if (!canvas || !sourceImage) return
    
    const ctx = await drawToCanvas(sourceImage, canvas, { clear: true })
    
    // Draw censored rects
    rects.forEach(r => censorArea(ctx, r))
    if (currentRect) censorArea(ctx, currentRect)
  }

  const censorArea = (ctx: CanvasRenderingContext2D, r: {x: number, y: number, w: number, h: number}) => {
    if (r.w === 0 || r.h === 0) return
    
    const pixelSize = 12
    const x = Math.min(r.x, r.x + r.w)
    const y = Math.min(r.y, r.y + r.h)
    const w = Math.abs(r.w)
    const h = Math.abs(r.h)

    // Optimization: Get image data for the WHOLE rectangle at once
    try {
      const imageData = ctx.getImageData(x, y, w, h)
      const data = imageData.data

      for (let py = 0; py < h; py += pixelSize) {
        for (let px = 0; px < w; px += pixelSize) {
          const i = (py * w + px) * 4
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
          ctx.fillRect(x + px, y + py, pixelSize, pixelSize)
        }
      }
    } catch (e) {
      // Handle edge cases where rect is outside canvas
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    setIsDrawing(true)
    setCurrentRect({
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      w: 0,
      h: 0
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !currentRect) return
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    
    setCurrentRect(prev => ({
      ...prev!,
      w: x - prev!.x,
      h: y - prev!.y
    }))
  }

  const handleMouseUp = () => {
    if (currentRect && Math.abs(currentRect.w) > 5 && Math.abs(currentRect.h) > 5) {
      setRects([...rects, currentRect])
    }
    setCurrentRect(null)
    setIsDrawing(false)
  }

  const handleDownload = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    try {
      const blob = await exportCanvas(canvas, file?.type || 'image/png', 1.0)
      downloadBlob(blob, `vanity-censored-${file?.name || 'image.png'}`)
      toast.success("Safe image exported!")
    } catch (error) {
      toast.error("Failed to export image")
    }
  }

  const handleBack = () => {
    setFile(null)
    clearCurrent()
    clearPreviewUrl()
    setRects([])
  }

  if (!file) {
    return (
      <ToolUploadLayout title="Smart Censor" description="Protect privacy by pixelating sensitive areas in your photos." icon={ShieldAlert}>
        <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout title="Privacy Guard" description={`Censoring: ${file.name}`} icon={ShieldAlert} centered={true} maxWidth="max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">
        <div className="lg:col-span-9">
          <div className="glass-panel p-2 rounded-2xl flex items-center justify-center bg-black/40 shadow-inner overflow-hidden relative group border border-white/5">
             <canvas 
               ref={canvasRef} 
               className="max-w-full max-h-[75vh] cursor-crosshair rounded cursor-cell shadow-2xl"
               onMouseDown={handleMouseDown}
               onMouseMove={handleMouseMove}
               onMouseUp={handleMouseUp}
             />
             {!sourceImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                   <Loader2 className="w-12 h-12 text-primary animate-spin" />
                </div>
             )}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
           <div className="glass-panel p-6 rounded-2xl space-y-8 border border-white/5">
              <div className="space-y-4">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Controls</h3>
                 <div className="space-y-3">
                    <button 
                      onClick={() => setRects([])} 
                      disabled={rects.length === 0}
                      className="w-full py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-all border border-white/5 disabled:opacity-20"
                    >
                       Reset All ({rects.length})
                    </button>
                    <button 
                      onClick={() => setRects(prev => prev.slice(0, -1))} 
                      disabled={rects.length === 0}
                      className="w-full py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-all border border-white/5 disabled:opacity-20"
                    >
                       Undo Last
                    </button>
                 </div>
              </div>

              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 space-y-3">
                 <div className="flex items-center gap-2 text-primary">
                    <Info className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">How to use</span>
                 </div>
                 <p className="text-[10px] text-muted-foreground leading-relaxed uppercase">
                   Click and drag directly on the image to draw pixelated rectangles over faces, text, or sensitive data.
                 </p>
              </div>

              <button 
                onClick={handleDownload}
                disabled={isProcessing || !sourceImage}
                className="w-full py-5 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <Download className="w-5 h-5" /> Export </button>

              <button 
                onClick={handleBack}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all"
              >
                Start New
              </button>
           </div>
        </div>
      </div>
    </ToolLayout>
  )
}
