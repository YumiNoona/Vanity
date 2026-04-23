import React, { useState, useRef, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, Loader2, ShieldAlert, Square, Circle } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"
import { useImageProcessor } from "@/hooks/useImageProcessor"
import { drawToCanvas, exportCanvas, downloadBlob } from "@/lib/canvas"

export function SmartCensor() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const { isProcessing, processImage, clearCurrent } = useImageProcessor()
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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [rects, setRects] = useState<{x: number, y: number, w: number, h: number}[]>([])
  const [currentRect, setCurrentRect] = useState<{x: number, y: number, w: number, h: number} | null>(null)

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return
    
    setFile(uploadedFile)
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
    
    // Draw blurred rects
    rects.forEach(r => censorArea(ctx, r))
    if (currentRect) censorArea(ctx, currentRect)
  }

  const censorArea = (ctx: CanvasRenderingContext2D, r: {x: number, y: number, w: number, h: number}) => {
    // Pixelation effect
    const size = 10
    const w = r.w, h = r.h
    for (let y = r.y; y < r.y + h; y += size) {
      for (let x = r.x; x < r.x + w; x += size) {
        const pixel = ctx.getImageData(x, y, 1, 1).data
        ctx.fillStyle = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`
        ctx.fillRect(x, y, size, size)
      }
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!
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
    if (currentRect) {
      setRects([...rects, currentRect])
      setCurrentRect(null)
    }
    setIsDrawing(false)
  }

  const handleDownload = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    try {
      const blob = await exportCanvas(canvas, file?.type || 'image/png', 1.0)
      downloadBlob(blob, `vanity-censored-${file?.name || 'image.png'}`)
      toast.success("Censored image saved!")
    } catch (error) {
      toast.error("Failed to export image")
    }
  }

  const handleBack = () => {
    setFile(null)
    clearCurrent()
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
    <ToolLayout
      title="Smart Censor"
      description="Drag to draw pixelated boxes over sensitive info."
      icon={ShieldAlert}
      onBack={handleBack}
      backLabel="Start Over"
      maxWidth="max-w-6xl"
    >
      <div className="flex gap-4 mb-6">
        <button onClick={() => setRects([])} className="text-sm font-medium text-muted-foreground hover:text-foreground">Reset All</button>
      </div>

      <div className="glass-panel p-4 rounded-2xl flex flex-col items-center bg-black/50">
          <canvas 
            ref={canvasRef} 
            className="max-w-full max-h-[70vh] cursor-crosshair rounded cursor-cell"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />
          
          <button 
            onClick={handleDownload}
            className="mt-8 px-12 py-4 bg-primary text-primary-foreground font-bold rounded-full shadow-lg hover:scale-105 transition-all flex items-center gap-2"
          >
            <Download className="w-5 h-5" /> Export Safe Image
          </button>
      </div>
    </ToolLayout>
  )
}
