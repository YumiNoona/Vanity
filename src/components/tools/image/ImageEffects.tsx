import React, { useState, useRef, useEffect, useCallback } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, SlidersHorizontal, RefreshCw, Loader2, Layers } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"
import { useImageProcessor } from "@/hooks/useImageProcessor"
import { useObjectUrl } from "@/hooks/useObjectUrl"
import { drawToCanvas, exportCanvas, downloadBlob } from "@/lib/canvas"
import { guardDimensions } from "@/lib/utils"

export function ImageEffects() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const { isProcessing, processImage, clearCurrent } = useImageProcessor()
  const [sourceImage, setSourceImage] = useState<ImageBitmap | HTMLImageElement | null>(null)
  const { url: previewUrl, setUrl: setPreviewUrl, clear: clearPreviewUrl } = useObjectUrl()

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [settings, setSettings] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    grayscale: 0,
    sepia: 0,
    blur: 0,
  })

  const filterString = [
    `brightness(${settings.brightness}%)`,
    `contrast(${settings.contrast}%)`,
    `saturate(${settings.saturation}%)`,
    `grayscale(${settings.grayscale}%)`,
    `sepia(${settings.sepia}%)`,
    `blur(${settings.blur}px)`
  ].join(' ')

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return
    
    setFile(uploadedFile)
    setPreviewUrl(uploadedFile)
    
    const result = await processImage(uploadedFile)
    if (!result) return
    setSourceImage(result.source)
  }

  const handleDownload = async () => {
    const source = sourceImage
    const canvas = canvasRef.current
    if (!canvas || !source) {
      toast.error("Image not ready for export")
      return
    }
    
    try {
      await drawToCanvas(source, canvas, { filter: filterString, clear: true })
      const blob = await exportCanvas(canvas, "image/png", 1.0)
      downloadBlob(blob, `vanity-effects-${file?.name || "image.png"}`)
      toast.success("Image exported!")
    } catch (err) {
      console.error("Export failed:", err)
      toast.error("Export failed")
    }
  }

  const handleBack = () => {
    setFile(null)
    setSourceImage(null)
    clearPreviewUrl()
    clearCurrent()
  }

  if (!file) {
    return (
      <ToolUploadLayout title="Image Effects" description="Apply filters, adjustments, and effects to any photograph." icon={Layers}>
        <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout 
      title="Image Effects" 
      description={`Editing: ${file.name}`} 
      icon={Layers}
      centered={true}
      maxWidth="max-w-7xl"
    >
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
                  min={0}
                  max={key === "blur" ? 20 : 200}
                  value={value}
                  onChange={(e) => setSettings(s => ({ ...s, [key]: Number(e.target.value) }))}
                  className="w-full accent-primary h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            ))}
          </div>

          <div className="pt-4 flex flex-col gap-3">
             <div className="flex gap-4">
                <button 
                  onClick={() => setSettings({ brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0, blur: 0 })}
                  className="px-4 py-2 text-sm font-medium bg-white/5 hover:bg-white/10 text-white rounded-lg flex-1 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Reset
                </button>
                <button 
                  onClick={handleDownload}
                  disabled={isProcessing || !sourceImage}
                  className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg flex-1 shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Export
                </button>
             </div>
             <button 
               onClick={handleBack}
               className="w-full py-3 text-xs font-bold bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all"
             >
               Start New Extraction
             </button>
          </div>
        </div>

        <div className="lg:col-span-2 glass-panel p-6 rounded-xl min-h-[500px] flex items-center justify-center relative overflow-hidden bg-white/[0.01]">
          {previewUrl ? (
             <img 
               src={previewUrl} 
               alt="Preview" 
               className="max-w-full max-h-[600px] object-contain shadow-2xl rounded-lg"
               style={{ filter: filterString }}
             />
          ) : (
             <Loader2 className="w-8 h-8 text-primary animate-spin" />
          )}
          
          {/* Hidden canvas for export */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </ToolLayout>
  )
}
