import React, { useState, useRef, useEffect, useCallback } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, Pencil, RefreshCw, SlidersHorizontal, Sparkles } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"
import { useObjectUrl } from "@/hooks/useObjectUrl"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Multi-pass pencil sketch engine - Optimized for Performance
// ---------------------------------------------------------------------------

function buildLuminanceGray(src: ImageData): Float32Array {
  const gray = new Float32Array(src.width * src.height)
  for (let i = 0; i < gray.length; i++) {
    const i4 = i * 4
    gray[i] = 0.2126 * src.data[i4] + 0.7152 * src.data[i4+1] + 0.0722 * src.data[i4+2]
  }
  return gray
}

function gaussianBlur(gray: Float32Array, w: number, h: number, radius: number): Float32Array {
  const sigma = Math.max(radius, 0.5)
  const boxR = Math.round(sigma * 1.5) | 0
  const out = new Float32Array(gray.length)
  const tmp = new Float32Array(gray.length)

  function hPass(src: Float32Array, dst: Float32Array) {
    for (let y = 0; y < h; y++) {
      let sum = 0
      const yw = y * w
      for (let x = 0; x < Math.min(boxR, w); x++) sum += src[yw + x]
      let count = Math.min(boxR + 1, w)
      for (let x = 0; x < w; x++) {
        if (x + boxR < w) { sum += src[yw + x + boxR]; count++ }
        if (x - boxR - 1 >= 0) { sum -= src[yw + x - boxR - 1]; count-- }
        dst[yw + x] = sum / count
      }
    }
  }
  
  function vPass(src: Float32Array, dst: Float32Array) {
    for (let x = 0; x < w; x++) {
      let sum = 0
      for (let y = 0; y < Math.min(boxR, h); y++) sum += src[y * w + x]
      let count = Math.min(boxR + 1, h)
      for (let y = 0; y < h; y++) {
        if (y + boxR < h) { sum += src[(y + boxR) * w + x]; count++ }
        if (y - boxR - 1 >= 0) { sum -= src[(y - boxR - 1) * w + x]; count-- }
        dst[y * w + x] = sum / count
      }
    }
  }

  for (let pass = 0; pass < 3; pass++) {
    hPass(pass === 0 ? gray : out, tmp)
    vPass(tmp, out)
  }
  return out
}

function colorDodgeAndCompose(
  base: Float32Array, 
  blur: Float32Array, 
  edges: Float32Array, 
  maxEdge: number, 
  edgeStrength: number, 
  intensity: number,
  w: number, 
  h: number,
  ctx: CanvasRenderingContext2D
): ImageData {
  const out = ctx.createImageData(w, h)
  const data = out.data
  const t = intensity / 100
  const midpoint = 0.5 - 0.3 * (1 - t)
  const steepness = 1 + 4 * (1 - t)

  for (let i = 0; i < base.length; i++) {
    const b = base[i]
    const inv = 255 - blur[i]
    let dodgeVal = inv < 1 ? 255 : Math.min(255, (b * 255) / inv)
    
    // Simple inline unsharp mask & edge blend to save memory passes
    const edgeVal = maxEdge > 0 ? (edges[i] / maxEdge) * 255 * edgeStrength : 0
    let v = Math.max(0, dodgeVal - edgeVal)
    
    // Contrast Curve
    const x = v / 255
    const curved = 1 / (1 + Math.exp(-steepness * (x - midpoint)))
    v = curved * 255

    const i4 = i * 4
    data[i4] = data[i4+1] = data[i4+2] = v
    data[i4+3] = 255
  }
  return out
}

function sobelEdges(gray: Float32Array, w: number, h: number): { edges: Float32Array, max: number } {
  const edges = new Float32Array(gray.length)
  let max = 0
  for (let y = 1; y < h - 1; y++) {
    const yw = y * w
    for (let x = 1; x < w - 1; x++) {
      const idx = yw + x
      const gx = -gray[idx - w - 1] + gray[idx - w + 1] - 2 * gray[idx - 1] + 2 * gray[idx + 1] - gray[idx + w - 1] + gray[idx + w + 1]
      const gy = -gray[idx - w - 1] - 2 * gray[idx - w] - gray[idx - w + 1] + gray[idx + w - 1] + 2 * gray[idx + w] + gray[idx + w + 1]
      const val = Math.sqrt(gx * gx + gy * gy)
      edges[idx] = val
      if (val > max) max = val
    }
  }
  return { edges, max }
}

// ---------------------------------------------------------------------------

export function ImageToSketch() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [intensity, setIntensity] = useState(65)
  const [isProcessing, setIsProcessing] = useState(false)
  const mainCanvas = useRef<HTMLCanvasElement>(null)
  const originalDataRef = useRef<ImageData | null>(null)
  const { url: previewUrl, setUrl: setPreviewUrl, clear: clearPreviewUrl } = useObjectUrl()
  const runIdRef = useRef(0)

  const handleDrop = (files: File[]) => {
    const f = files[0]
    if (!f || !validateFiles([f])) return
    setFile(f)
    setPreviewUrl(f)
    originalDataRef.current = null
  }

  const applyEffect = useCallback(() => {
    if (!originalDataRef.current || !mainCanvas.current) return
    const runId = ++runIdRef.current
    setIsProcessing(true)

    // Delay execution to allow UI update
    setTimeout(() => {
      if (runId !== runIdRef.current) return
      
      const canvas = mainCanvas.current!
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!
      const srcData = originalDataRef.current!
      const w = srcData.width
      const h = srcData.height

      // Pass 1: Gray
      const gray = buildLuminanceGray(srcData)

      // Pass 2: Blur (Dodge source)
      const blurRadius = 1 + (intensity / 100) * 22
      const blurred = gaussianBlur(gray, w, h, blurRadius)

      // Pass 3: Edges
      const { edges, max: maxEdge } = sobelEdges(gray, w, h)
      const edgeStrength = 0.45 - (intensity / 100) * 0.25

      // Pass 4: Final Compose
      const finalImageData = colorDodgeAndCompose(gray, blurred, edges, maxEdge, edgeStrength, intensity, w, h, ctx)
      
      ctx.putImageData(finalImageData, 0, 0)
      setIsProcessing(false)
    }, 100)
  }, [intensity])

  useEffect(() => {
    if (!file || !previewUrl || !mainCanvas.current) return

    const img = new Image()
    img.onload = () => {
      const canvas = mainCanvas.current!
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!
      ctx.drawImage(img, 0, 0)
      originalDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height)
      applyEffect()
    }
    img.onerror = () => toast.error("Failed to load image")
    img.src = previewUrl
  }, [file, previewUrl, applyEffect])

  const handleDownload = () => {
    if (!mainCanvas.current) return
    const url = mainCanvas.current.toDataURL("image/png")
    const a = document.createElement("a")
    a.href = url
    a.download = `vanity-sketch-${Date.now()}.png`
    a.click()
    toast.success("Sketch exported!")
  }

  const handleBack = () => {
    setFile(null)
    clearPreviewUrl()
    originalDataRef.current = null
  }

  if (!file) {
    return (
      <ToolUploadLayout
        title="Image to Sketch"
        description="Instantly turn any photo into a professional pencil-sketch illustration."
        icon={Pencil}
      >
        <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} label="Drop photo here" />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout
      title="Sketch Studio"
      description="Adjust intensity for different artistic styles."
      icon={Pencil}
      centered={true}
      maxWidth="max-w-6xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">
        <div className="lg:col-span-8">
          <div className="glass-panel p-4 rounded-[2.5rem] flex items-center justify-center min-h-[600px] bg-[#080808] shadow-inner relative overflow-hidden group border border-white/5">
            {isProcessing && (
              <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-md flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
                <RefreshCw className="w-12 h-12 text-primary animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Hand-Drawing...</span>
              </div>
            )}
            <canvas
              ref={mainCanvas}
              className={cn(
                "max-w-full max-h-[75vh] rounded-2xl shadow-2xl transition-all duration-700",
                isProcessing ? "opacity-40 scale-[0.98] blur-sm" : "opacity-100 scale-100"
              )}
              style={{ background: "#fff" }}
            />
            <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-xl rounded-full border border-white/10">
               <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
               <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Artistic Preview</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-8 rounded-[2rem] border border-white/5 bg-black/20 space-y-8">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-primary" /> Sketch Intensity
                </label>
                <span className="text-xl font-black font-mono text-primary">{intensity}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="95"
                value={intensity}
                onChange={(e) => setIntensity(parseInt(e.target.value))}
                className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[9px] text-muted-foreground font-black uppercase tracking-widest px-1">
                <span>Minimal</span>
                <span>Realistic</span>
                <span>Abstract</span>
              </div>
            </div>

            <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 flex gap-4">
              <Sparkles className="w-5 h-5 text-primary shrink-0" />
              <div className="space-y-1">
                 <h4 className="text-[11px] font-black uppercase text-white">Pro Studio Tip</h4>
                 <p className="text-[10px] leading-relaxed text-muted-foreground">
                   Higher intensity simulates softer "graphite pencil" shading, while lower values produce high-contrast "architectural" ink lines.
                 </p>
              </div>
            </div>

            <div className="space-y-3 pt-4">
               <button
                 onClick={handleDownload}
                 disabled={isProcessing}
                 className="w-full py-5 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs rounded-2xl shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
               >
                 <Download className="w-5 h-5" /> Export Resolution
               </button>

               <button 
                 onClick={handleBack}
                 className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-xl border border-white/5 transition-all"
               >
                 New Sketch
               </button>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
