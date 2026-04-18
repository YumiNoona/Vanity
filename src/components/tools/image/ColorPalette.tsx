import React, { useState, useEffect, useRef } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, Pipette, Copy, CheckCircle } from "lucide-react"
import { toast } from "sonner"

export function ColorPalette() {
  const [file, setFile] = useState<File | null>(null)
  const [palette, setPalette] = useState<string[]>([])
  const [preview, setPreview] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    
    const img = new Image()
    img.src = url
    img.onload = () => {
      const canvas = canvasRef.current!
      const ctx = canvas.getContext("2d")!
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      
      const colors = extractPalette(ctx, canvas.width, canvas.height)
      setPalette(colors)
      toast.success("Color palette extracted!")
    }
    return () => URL.revokeObjectURL(url)
  }, [file])

  const extractPalette = (ctx: CanvasRenderingContext2D, width: number, height: number): string[] => {
    const imageData = ctx.getImageData(0, 0, width, height).data
    const colorCount: { [key: string]: number } = {}
    const step = 20 // Jump pixels for speed
    
    for (let i = 0; i < imageData.length; i += 4 * step) {
      const r = imageData[i]
      const g = imageData[i + 1]
      const b = imageData[i + 2]
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

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex)
    toast.success(`Copied ${hex}`)
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
         <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6 text-primary">
            <Pipette className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1">Color Palette</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Extract the core color story from any image for your design projects.
        </p>
        <DropZone onDrop={(f) => setFile(f[0])} accept={{ "image/*": [] }} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-3xl font-bold font-syne mb-2">Palette Extracted</h1>
          <p className="text-muted-foreground text-sm">Derived from {file.name}</p>
        </div>
        <button onClick={() => setFile(null)} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> New Image
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-panel p-4 rounded-xl flex items-center justify-center bg-black/40">
           <img src={preview!} alt="Original" className="max-h-[400px] object-contain rounded" />
           <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="space-y-4">
           <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Dominant Colors</h3>
           <div className="grid grid-cols-2 gap-4">
              {palette.map(color => (
                <button 
                  key={color}
                  onClick={() => copyToClipboard(color)}
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
    </div>
  )
}
