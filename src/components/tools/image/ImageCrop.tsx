import React, { useState, useEffect, useRef } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, Loader2, Crop, RefreshCcw } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { usePremium } from "@/hooks/usePremium"
import { useObjectUrl } from "@/hooks/useObjectUrl"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useImageProcessor } from "@/hooks/useImageProcessor"
import { exportCanvas, downloadBlob } from "@/lib/canvas"
import { releaseCanvas } from "@/lib/canvas/guards"

export function ImageCrop() {
  const { validateFiles } = usePremium()
  
  // Single Mode State
  const [singleFile, setSingleFile] = useState<File | null>(null)
  const { isProcessing: isSingleProcessing, processImage, clearCurrent } = useImageProcessor()
  const { url: preview, setUrl: setPreview, clear: clearPreview } = useObjectUrl()
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

  const containerRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState({ x: 10, y: 10, width: 80, height: 80 }) 
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState<string | null>(null)
  const [startPos, setStartPos] = useState({ x: 0, y: 0, cropX: 0, cropY: 0, cropW: 0, cropH: 0 })
  const [isExporting, setIsExporting] = useState(false)

  const handleSingleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return
    
    setSingleFile(uploadedFile)
    setPreview(uploadedFile)
    
    const result = await processImage(uploadedFile)
    if (!result) return
    setSourceImage(result.source)
  }

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
        if (isResizing.includes('e')) newCrop.width = Math.max(5, Math.min(100 - startPos.cropX, startPos.cropW + deltaX))
        if (isResizing.includes('s')) newCrop.height = Math.max(5, Math.min(100 - startPos.cropY, startPos.cropH + deltaY))
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
    const handleMouseUp = () => { setIsDragging(false); setIsResizing(null); }
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, startPos, crop])

  const handleSingleDownload = async () => {
    const imgElement = previewRef.current
    if (!imgElement) return

    setIsExporting(true)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")!
    
    const source = sourceImage || imgElement
    const w = (source as any).naturalWidth || (source as any).width
    const h = (source as any).naturalHeight || (source as any).height
    const realX = Math.floor((crop.x / 100) * w)
    const realY = Math.floor((crop.y / 100) * h)
    const realW = Math.floor((crop.width / 100) * w)
    const realH = Math.floor((crop.height / 100) * h)
    
    if (realW <= 0 || realH <= 0) {
      setIsExporting(false)
      return
    }
    
    canvas.width = realW
    canvas.height = realH
    await new Promise(requestAnimationFrame)
    ctx.drawImage(source, realX, realY, realW, realH, 0, 0, realW, realH)
    
    try {
      const blob = await exportCanvas(canvas, 'image/png', 1.0)
      downloadBlob(blob, `vanity-cropped-${singleFile?.name || "image.png"}`)
      toast.success("Image cropped successfully!")
      releaseCanvas(canvas)
    } catch (error) { 
      toast.error("Failed to generate image") 
    } finally {
      setIsExporting(false)
    }
  }

  const handleBack = () => {
    setSingleFile(null)
    clearPreview()
    clearCurrent()
    setSourceImage(null)
  }

  if (!singleFile) {
    return (
      <ToolUploadLayout title="Crop Image" description="Select an image to start cropping." icon={Crop}>
        <DropZone onDrop={handleSingleDrop} accept={{ "image/*": [] }} label="Drop image to crop" />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout
      title="Crop Image"
      description={`Editing: ${singleFile?.name}`}
      icon={Crop}
      maxWidth="max-w-6xl"
      centered={true}
    >
      <div className="glass-panel p-8 rounded-3xl flex flex-col items-center overflow-hidden border-white/10 bg-black/40 min-h-[500px] justify-center">
        <div ref={containerRef} className="relative inline-flex max-w-full select-none rounded-xl overflow-hidden shadow-2xl bg-black/20">
          {preview && (
            <img 
              ref={previewRef}
              src={preview} 
              alt="Preview" 
              className="max-h-[60vh] w-auto object-contain pointer-events-none animate-in fade-in zoom-in duration-300" 
            />
          )}
          <div 
            className="absolute border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] cursor-move transition-shadow"
            style={{ left: `${crop.x}%`, top: `${crop.y}%`, width: `${crop.width}%`, height: `${crop.height}%` }}
            onMouseDown={(e) => handleMouseDown(e, 'move')}
          >
            {/* Handles */}
            <div onMouseDown={(e) => handleMouseDown(e, 'nw')} className="absolute top-0 left-0 w-4 h-4 bg-primary -translate-x-1/2 -translate-y-1/2 cursor-nw-resize rounded-full border-2 border-white z-20" />
            <div onMouseDown={(e) => handleMouseDown(e, 'ne')} className="absolute top-0 right-0 w-4 h-4 bg-primary translate-x-1/2 -translate-y-1/2 cursor-ne-resize rounded-full border-2 border-white z-20" />
            <div onMouseDown={(e) => handleMouseDown(e, 'sw')} className="absolute bottom-0 left-0 w-4 h-4 bg-primary -translate-x-1/2 translate-y-1/2 cursor-sw-resize rounded-full border-2 border-white z-20" />
            <div onMouseDown={(e) => handleMouseDown(e, 'se')} className="absolute bottom-0 right-0 w-4 h-4 bg-primary translate-x-1/2 translate-y-1/2 cursor-se-resize rounded-full border-2 border-white z-20" />
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20">
              <div className="border-r border-b border-white" /><div className="border-r border-b border-white" /><div className="border-b border-white" />
              <div className="border-r border-b border-white" /><div className="border-r border-b border-white" /><div className="border-b border-white" />
              <div className="border-r border-white" /><div className="border-r border-white" /><div />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-12 w-full mt-8 pt-6 border-t border-white/5">
            <div className="space-y-1"><span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest block">Position</span><div className="text-sm font-mono text-white">X: {Math.round(crop.x)}% Y: {Math.round(crop.y)}%</div></div>
            <div className="space-y-1"><span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest block">Size</span><div className="text-sm font-mono text-white">W: {Math.round(crop.width)}% H: {Math.round(crop.height)}%</div></div>
        </div>
        <div className="flex gap-4 mt-8 w-full justify-center">
          <button 
            onClick={handleSingleDownload} 
            disabled={isExporting} 
            className="px-12 py-5 bg-primary text-primary-foreground font-bold rounded-2xl flex items-center gap-3 hover:scale-105 hover:shadow-[0_0_40px_rgba(245,158,11,0.3)] transition-all disabled:opacity-50 shadow-lg active:scale-95"
          >
            {isExporting ? <Loader2 className="animate-spin w-6 h-6" /> : <Download className="w-6 h-6" />}
            Export
          </button>
          <button 
            onClick={handleBack}
            className="px-12 py-5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all"
          >
            Start Over
          </button>
        </div>
      </div>
    </ToolLayout>
  )
}
