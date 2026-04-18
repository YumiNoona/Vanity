import React, { useState, useEffect, useRef } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, Loader2, Crop, RefreshCcw } from "lucide-react"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useImageProcessor } from "@/hooks/useImageProcessor"
import { exportCanvas, downloadBlob } from "@/lib/canvas"
import { releaseCanvas } from "@/lib/canvas/guards"

export function ImageCrop() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const { isProcessing, processImage, getJobId } = useImageProcessor()
  const [preview, setPreview] = useState<string | null>(null)
  const [sourceImage, setSourceImage] = useState<ImageBitmap | HTMLImageElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [crop, setCrop] = useState({ x: 10, y: 10, width: 80, height: 80 }) 
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState<string | null>(null)
  const [startPos, setStartPos] = useState({ x: 0, y: 0, cropX: 0, cropY: 0, cropW: 0, cropH: 0 })

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return
    
    setFile(uploadedFile)
    const result = await processImage(uploadedFile)
    if (!result) return

    setSourceImage(result.source)
    const url = URL.createObjectURL(uploadedFile)
    setPreview(url)
  }

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const handleMouseDown = (e: React.MouseEvent, type: string) => {
    e.stopPropagation()
    e.preventDefault()
    if (type === 'move') setIsDragging(true)
    else setIsResizing(type)
    
    setStartPos({
      x: e.clientX,
      y: e.clientY,
      cropX: crop.x,
      cropY: crop.y,
      cropW: crop.width,
      cropH: crop.height
    })
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging && !isResizing) return
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const deltaX = ((e.clientX - startPos.x) / rect.width) * 100
      const deltaY = ((e.clientY - startPos.y) / rect.height) * 100

      if (isDragging) {
        setCrop(prev => ({
          ...prev,
          x: Math.max(0, Math.min(100 - prev.width, startPos.cropX + deltaX)),
          y: Math.max(0, Math.min(100 - prev.height, startPos.cropY + deltaY))
        }))
      } else if (isResizing) {
        let newCrop = { ...crop }
        
        if (isResizing.includes('e')) {
          newCrop.width = Math.max(5, Math.min(100 - startPos.cropX, startPos.cropW + deltaX))
        }
        if (isResizing.includes('s')) {
          newCrop.height = Math.max(5, Math.min(100 - startPos.cropY, startPos.cropH + deltaY))
        }
        if (isResizing.includes('w')) {
          const maxWidth = startPos.cropX + startPos.cropW
          const newX = Math.max(0, Math.min(maxWidth - 5, startPos.cropX + deltaX))
          newCrop.x = newX
          newCrop.width = maxWidth - newX
        }
        if (isResizing.includes('n')) {
          const maxHeight = startPos.cropY + startPos.cropH
          const newY = Math.max(0, Math.min(maxHeight - 5, startPos.cropY + deltaY))
          newCrop.y = newY
          newCrop.height = maxHeight - newY
        }
        setCrop(newCrop)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(null)
    }

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, startPos, crop])

  const handleDownload = async () => {
    if (!sourceImage) return

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")!
    
    const w = (sourceImage as HTMLImageElement).naturalWidth || (sourceImage as ImageBitmap).width || (sourceImage as any).width;
    const h = (sourceImage as HTMLImageElement).naturalHeight || (sourceImage as ImageBitmap).height || (sourceImage as any).height;

    const realX = Math.floor((crop.x / 100) * w)
    const realY = Math.floor((crop.y / 100) * h)
    const realW = Math.floor((crop.width / 100) * w)
    const realH = Math.floor((crop.height / 100) * h)
    
    if (realW <= 0 || realH <= 0) return

    canvas.width = realW
    canvas.height = realH
    
    // RAF sync for safety
    await new Promise(requestAnimationFrame)
    ctx.drawImage(sourceImage, realX, realY, realW, realH, 0, 0, realW, realH)
    
    try {
      const blob = await exportCanvas(canvas, 'image/png', 1.0)
      downloadBlob(blob, `vanity-cropped-${file?.name || "image.png"}`)
      toast.success("Image cropped successfully!")
      
      releaseCanvas(canvas)
    } catch (error) {
      toast.error("Failed to generate image")
    }
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
         <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6 text-primary">
            <Crop className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1">Crop & Resize</h1>
        <p className="text-muted-foreground text-lg mb-8">Precisely crop your images entirely in your browser.</p>
        <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-3xl font-bold font-syne mb-2">Crop Image</h1>
          <p className="text-muted-foreground text-sm">Drag to move, pull corners to resize.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setCrop({ x: 10, y: 10, width: 80, height: 80 })} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
            <RefreshCcw className="w-4 h-4" /> Reset
          </button>
          <button onClick={() => setFile(null)} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> New Image
          </button>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-xl flex flex-col items-center overflow-hidden">
        <div 
          ref={containerRef}
          className="relative inline-block max-w-full select-none"
        >
          <img 
            src={preview!} 
            alt="Preview" 
            className="max-h-[60vh] object-contain rounded shadow-lg pointer-events-none" 
          />
          
          <div 
            className="absolute border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] cursor-move transition-shadow"
            style={{
              left: `${crop.x}%`,
              top: `${crop.y}%`,
              width: `${crop.width}%`,
              height: `${crop.height}%`
            }}
            onMouseDown={(e) => handleMouseDown(e, 'move')}
          >
            {/* Resizing handles */}
            <div onMouseDown={(e) => handleMouseDown(e, 'nw')} className="absolute top-0 left-0 w-4 h-4 bg-primary -translate-x-1/2 -translate-y-1/2 cursor-nw-resize rounded-full border-2 border-white z-20" />
            <div onMouseDown={(e) => handleMouseDown(e, 'ne')} className="absolute top-0 right-0 w-4 h-4 bg-primary translate-x-1/2 -translate-y-1/2 cursor-ne-resize rounded-full border-2 border-white z-20" />
            <div onMouseDown={(e) => handleMouseDown(e, 'sw')} className="absolute bottom-0 left-0 w-4 h-4 bg-primary -translate-x-1/2 translate-y-1/2 cursor-sw-resize rounded-full border-2 border-white z-20" />
            <div onMouseDown={(e) => handleMouseDown(e, 'se')} className="absolute bottom-0 right-0 w-4 h-4 bg-primary translate-x-1/2 translate-y-1/2 cursor-se-resize rounded-full border-2 border-white z-20" />
            
            <div onMouseDown={(e) => handleMouseDown(e, 'n')} className="absolute top-0 left-1/2 w-8 h-1 bg-primary/50 -translate-x-1/2 -translate-y-1/2 cursor-n-resize hover:bg-primary z-20" />
            <div onMouseDown={(e) => handleMouseDown(e, 's')} className="absolute bottom-0 left-1/2 w-8 h-1 bg-primary/50 -translate-x-1/2 translate-y-1/2 cursor-s-resize hover:bg-primary z-20" />
            <div onMouseDown={(e) => handleMouseDown(e, 'w')} className="absolute top-1/2 left-0 w-1 h-8 bg-primary/50 -translate-x-1/2 -translate-y-1/2 cursor-w-resize hover:bg-primary z-20" />
            <div onMouseDown={(e) => handleMouseDown(e, 'e')} className="absolute top-1/2 right-0 w-1 h-8 bg-primary/50 translate-x-1/2 -translate-y-1/2 cursor-e-resize hover:bg-primary z-20" />

            {/* Grid overlay */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20">
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-white" />
              <div className="border-r border-white" />
              <div />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-6 w-full mt-8 pt-6 border-t border-white/5">
           <div className="flex items-center gap-3">
             <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Position</span>
             <div className="flex gap-2 bg-white/5 p-1 rounded-lg">
                <div className="px-3 py-1 text-xs bg-white/5 rounded">X: {Math.round(crop.x)}%</div>
                <div className="px-3 py-1 text-xs bg-white/5 rounded">Y: {Math.round(crop.y)}%</div>
             </div>
           </div>
           <div className="flex items-center gap-3">
             <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Size</span>
             <div className="flex gap-2 bg-white/5 p-1 rounded-lg">
                <div className="px-3 py-1 text-xs bg-white/5 rounded">W: {Math.round(crop.width)}%</div>
                <div className="px-3 py-1 text-xs bg-white/5 rounded">H: {Math.round(crop.height)}%</div>
             </div>
           </div>
        </div>

        <button 
          onClick={handleDownload}
          disabled={isProcessing}
          className="mt-8 px-12 py-4 bg-primary text-primary-foreground font-bold rounded-full flex items-center gap-3 hover:scale-105 hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all disabled:opacity-50"
        >
          {isProcessing ? <Loader2 className="animate-spin w-6 h-6" /> : <Download className="w-6 h-6" />}
          Download Cropped Result
        </button>
      </div>
    </div>
  )
}
