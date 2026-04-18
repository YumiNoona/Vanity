import React, { useState, useRef, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, Loader2, ShieldAlert, Square, Circle } from "lucide-react"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"

export function SmartCensor() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [rects, setRects] = useState<{x: number, y: number, w: number, h: number}[]>([])
  const [currentRect, setCurrentRect] = useState<{x: number, y: number, w: number, h: number} | null>(null)

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    const img = new Image()
    img.src = url
    img.onload = () => {
      const canvas = canvasRef.current!
      canvas.width = img.width
      canvas.height = img.height
      draw(img)
    }
    return () => URL.revokeObjectURL(url)
  }, [file, rects, currentRect])

  const draw = (img: HTMLImageElement) => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(img, 0, 0)
    
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

  const handleDownload = () => {
    const canvas = canvasRef.current!
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `vanity-censored-${file?.name}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Censored image saved!")
    })
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
         <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6 text-primary">
            <ShieldAlert className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1">Smart Censor</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Protect privacy by pixelating sensitive areas in your photos.
        </p>
        <DropZone onDrop={(f) => { if (validateFiles(f)) setFile(f[0]); }} accept={{ "image/*": [] }} />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-3xl font-bold font-syne mb-2">Smart Censor</h1>
          <p className="text-muted-foreground text-sm">Drag to draw pixelated boxes over sensitive info.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setRects([])} className="text-sm font-medium text-muted-foreground hover:text-foreground">Reset All</button>
          <button onClick={() => setFile(null)} className="text-sm font-medium text-muted-foreground hover:text-foreground">New Image</button>
        </div>
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
    </div>
  )
}
