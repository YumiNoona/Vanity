import React, { useState, useRef, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, SlidersHorizontal, ArrowLeft, RefreshCw, Loader2 } from "lucide-react"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"
import { useImageProcessor } from "@/hooks/useImageProcessor"
import { drawToCanvas, exportCanvas, downloadBlob } from "@/lib/canvas"
import { guardDimensions } from "@/lib/utils"

export function ImageEffects() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const { isProcessing, processImage } = useImageProcessor()
  const [sourceImage, setSourceImage] = useState<ImageBitmap | HTMLImageElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [settings, setSettings] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    grayscale: 0,
    sepia: 0,
    blur: 0,
  })

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return
    
    setFile(uploadedFile)
    const result = await processImage(uploadedFile)
    if (!result) return

    setSourceImage(result.source)
    const canvas = canvasRef.current!
    applyFilters(result.source, canvas)
  }

  const applyFilters = async (source = sourceImage, canvas = canvasRef.current) => {
    if (!canvas || !source) return

    const { brightness, contrast, saturation, grayscale, sepia, blur } = settings
    const filter = `
      brightness(${brightness}%) 
      contrast(${contrast}%) 
      saturate(${saturation}%) 
      grayscale(${grayscale}%) 
      sepia(${sepia}%) 
      blur(${blur}px)
    `
    await drawToCanvas(source, canvas, { filter, clear: true })
  }

  useEffect(() => {
    if (sourceImage && canvasRef.current) {
      applyFilters()
    }

    return () => {
      if (canvasRef.current) {
        canvasRef.current.width = 0
        canvasRef.current.height = 0
      }
    }
  }, [settings, sourceImage])

  const handleDownload = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    try {
      const blob = await exportCanvas(canvas, "image/png", 1.0)
      downloadBlob(blob, `vanity-effects-${file?.name || "image.png"}`)
      toast.success("Image exported!")
    } catch (err) {
      toast.error("Export failed")
    }
  }
  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <h1 className="text-3xl font-bold font-syne mb-2">Image Effects</h1>
        <p className="text-muted-foreground mb-8">Apply beautiful filters and adjust colors directly in your browser.</p>
        <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-3xl font-bold font-syne mb-2">Edit Image</h1>
          <p className="text-muted-foreground text-sm">Editing: {file.name}</p>
        </div>
        <button onClick={() => setFile(null)} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Try another image
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
        <div className="glass-panel p-6 rounded-xl space-y-6">
          <div className="flex items-center gap-2 font-bold font-syne text-lg border-b border-border/50 pb-4">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            Adjustments
          </div>
          
          <div className="space-y-4">
            {Object.entries(settings).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between text-sm mb-2">
                  <label className="capitalize font-medium text-foreground/80">{key}</label>
                  <span className="text-muted-foreground text-xs">{value}</span>
                </div>
                <input 
                  type="range"
                  min={key === "blur" ? 0 : 0}
                  max={key === "blur" ? 20 : 200}
                  value={value}
                  onChange={(e) => setSettings(s => ({ ...s, [key]: Number(e.target.value) }))}
                  className="w-full accent-primary h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            ))}
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              onClick={() => setSettings({ brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0, blur: 0 })}
              className="px-4 py-2 text-sm font-medium bg-white/5 hover:bg-white/10 text-white rounded-lg flex-1 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Reset
            </button>
            <button 
              onClick={handleDownload}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg flex-1 shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Export
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 glass-panel p-6 rounded-xl min-h-[500px] flex items-center justify-center relative overflow-hidden bg-white/[0.01]">
          <canvas 
            ref={canvasRef} 
            className="max-w-full max-h-[600px] object-contain shadow-2xl rounded"
          />
        </div>
      </div>
    </div>
  )
}
