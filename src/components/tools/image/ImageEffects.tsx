import React, { useState, useRef, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, SlidersHorizontal, ArrowLeft, RefreshCw, Loader2 } from "lucide-react"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"

export function ImageEffects() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const origImageRef = useRef<HTMLImageElement | null>(null)

  const [settings, setSettings] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    grayscale: 0,
    sepia: 0,
    blur: 0,
  })

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    
    const img = new Image()
    img.onload = () => {
      origImageRef.current = img
      applyFilters()
    }
    img.src = url
    return () => {
      URL.revokeObjectURL(url)
      origImageRef.current = null
    }
  }, [file])

  const applyFilters = () => {
    const canvas = canvasRef.current
    const img = origImageRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = img.width
    canvas.height = img.height

    const { brightness, contrast, saturation, grayscale, sepia, blur } = settings
    ctx.filter = `
      brightness(${brightness}%) 
      contrast(${contrast}%) 
      saturate(${saturation}%) 
      grayscale(${grayscale}%) 
      sepia(${sepia}%) 
      blur(${blur}px)
    `
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  }

  useEffect(() => {
    applyFilters()
  }, [settings])

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    setIsProcessing(true)
    try {
      canvas.toBlob((blob) => {
        if (!blob) throw new Error("Export failed")
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `vanity-effects-${file?.name || "image.png"}`
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        setIsProcessing(false)
        toast.success("Image exported!")
      }, "image/png", 1.0)
    } catch (err) {
      toast.error("Export failed")
      setIsProcessing(false)
    }
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <h1 className="text-3xl font-bold font-syne mb-2">Image Effects</h1>
        <p className="text-muted-foreground mb-8">Apply beautiful filters and adjust colors directly in your browser.</p>
        <DropZone onDrop={(f) => { if (validateFiles(f)) setFile(f[0]); }} accept={{ "image/*": [] }} />
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
