import React, { useState, useEffect, useRef } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, Pipette, Copy, CheckCircle } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { toast } from "sonner"
import { useImageProcessor } from "@/hooks/useImageProcessor"
import { useObjectUrl } from "@/hooks/useObjectUrl"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"
import { drawToCanvas } from "@/lib/canvas"

export function ColorPalette() {
  const [file, setFile] = useState<File | null>(null)
  const [palette, setPalette] = useState<string[]>([])
  const { isProcessing, processImage } = useImageProcessor()
  const { url: preview, setUrl: setPreview, clear: clearPreview } = useObjectUrl()
  const { copy } = useCopyToClipboard()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile) return
    
    setFile(uploadedFile)
    setPalette([])
    setPreview(uploadedFile)

    try {
      const result = await processImage(uploadedFile)
      if (!result) return

      const canvas = document.createElement("canvas")
      const ctx = await drawToCanvas(result.source, canvas, { clear: true })
      
      const colors = extractPalette(ctx, canvas.width, canvas.height)
      setPalette(colors)
      toast.success("Color palette extracted!")
      
      result.cleanup()
    } catch (e) {
      toast.error("Failed to process image")
    }
  }

  const extractPalette = (ctx: CanvasRenderingContext2D, width: number, height: number): string[] => {
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    
    if (!data.length) return []
    
    const colorCount: { [key: string]: number } = {}
    const step = 16 
    
    for (let i = 0; i < data.length; i += 4 * step) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const hex = rgbToHex(r, g, b)
      colorCount[hex] = (colorCount[hex] || 0) + 1
    }
    
    return Object.entries(colorCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(e => e[0])
  }

  const rgbToHex = (r: number, g: number, b: number) => 
    "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')

  const handleBack = () => {
    setFile(null)
    clearPreview()
  }

  if (!file) {
    return (
      <ToolUploadLayout title="Color Palette" description="Extract the core color story from any image for your design projects." icon={Pipette}>
        <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout title="Palette Extracted" description={`Derived from ${file.name}`} onBack={handleBack} backLabel="New Image">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-panel p-4 rounded-xl flex items-center justify-center bg-black/40">
           {preview && <img src={preview} alt="Original" className="max-h-[400px] object-contain rounded" />}
           <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="space-y-4">
           <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Dominant Colors</h3>
           <div className="grid grid-cols-2 gap-4">
              {palette.map(color => (
                <button 
                  key={color}
                  onClick={() => copy(color)}
                  className="group relative h-24 rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 overflow-hidden"
                  style={{ backgroundColor: color }}
                >
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-black/20 backdrop-blur-md translate-y-full group-hover:translate-y-0 transition-transform flex items-center justify-between">
                     <span className="text-[10px] font-bold text-white uppercase">{color}</span>
                     <Copy className="w-3 h-3 text-white" />
                  </div>
                </button>
              ))}
           </div>
           <p className="text-[10px] text-muted-foreground pt-4 leading-relaxed">
             Click any color to copy its Hex code. These are extracted by analyzing pixel density across the image canvas.
           </p>
        </div>
      </div>
    </ToolLayout>
  )
}
