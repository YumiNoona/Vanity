import React, { useState, useRef, useEffect, useCallback } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, Pencil, RefreshCw, SlidersHorizontal } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"

// ---------------------------------------------------------------------------
// Multi-pass pencil sketch engine
// Pass 1 – Luminance grayscale (perceptual weights)
// Pass 2 – Color-dodge base layer (classic dodge formula)
// Pass 3 – Unsharp-mask sharpening for pencil crispness
// Pass 4 – Edge-emphasis via a fast 3x3 Sobel operator
// Pass 5 – Blend dodge + edges, composite on white paper background
// Pass 6 – Intensity-driven contrast curve (low = hard lines, high = soft)
// ---------------------------------------------------------------------------

function buildLuminanceGray(src: ImageData): Float32Array {
  const gray = new Float32Array(src.width * src.height)
  for (let i = 0; i < gray.length; i++) {
    const r = src.data[i * 4]
    const g = src.data[i * 4 + 1]
    const b = src.data[i * 4 + 2]
    gray[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  return gray
}

function gaussianBlur(gray: Float32Array, w: number, h: number, radius: number): Float32Array {
  // Separable box-blur approximation (3 passes ≈ Gaussian)
  const sigma = Math.max(radius, 0.5)
  const boxR = Math.round(sigma * 1.5) | 0
  const out = new Float32Array(gray.length)
  const tmp = new Float32Array(gray.length)

  function hPass(src: Float32Array, dst: Float32Array) {
    for (let y = 0; y < h; y++) {
      let sum = 0
      for (let x = 0; x < Math.min(boxR, w); x++) sum += src[y * w + x]
      let count = Math.min(boxR + 1, w)
      for (let x = 0; x < w; x++) {
        if (x + boxR < w) { sum += src[y * w + x + boxR]; count++ }
        if (x - boxR - 1 >= 0) { sum -= src[y * w + x - boxR - 1]; count-- }
        dst[y * w + x] = sum / count
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

function colorDodge(base: Float32Array, blur: Float32Array): Float32Array {
  const result = new Float32Array(base.length)
  for (let i = 0; i < base.length; i++) {
    const b = base[i]
    const inv = 255 - blur[i]
    result[i] = inv < 1 ? 255 : Math.min(255, (b * 255) / inv)
  }
  return result
}

function sobelEdges(gray: Float32Array, w: number, h: number): Float32Array {
  const edges = new Float32Array(gray.length)
  const Kx = [-1, 0, 1, -2, 0, 2, -1, 0, 1]
  const Ky = [-1, -2, -1, 0, 0, 0, 1, 2, 1]
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let gx = 0, gy = 0
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const v = gray[(y + ky) * w + (x + kx)]
          const ki = (ky + 1) * 3 + (kx + 1)
          gx += Kx[ki] * v
          gy += Ky[ki] * v
        }
      }
      edges[y * w + x] = Math.sqrt(gx * gx + gy * gy)
    }
  }
  return edges
}

function unsharpMask(gray: Float32Array, w: number, h: number, radius: number, amount: number): Float32Array {
  const blurred = gaussianBlur(gray, w, h, radius)
  const result = new Float32Array(gray.length)
  for (let i = 0; i < gray.length; i++) {
    result[i] = Math.min(255, Math.max(0, gray[i] + amount * (gray[i] - blurred[i])))
  }
  return result
}

function applyCurve(val: number, intensity: number): number {
  // Low intensity → high contrast (hard lines); High → soft (watercolor pencil)
  const t = intensity / 100
  // Sigmoid-like curve: low t = S-curve (dark darks, bright brights), high t = near linear
  const midpoint = 0.5 - 0.3 * (1 - t)  // shift midpoint down for harder look
  const steepness = 1 + 4 * (1 - t)
  const x = val / 255
  const curved = 1 / (1 + Math.exp(-steepness * (x - midpoint)))
  return Math.min(255, Math.max(0, curved * 255))
}

function renderSketch(
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  intensity: number
) {
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const w = canvas.width
  const h = canvas.height

  const ctx = canvas.getContext("2d", { willReadFrequently: true })!

  // Draw original
  ctx.drawImage(img, 0, 0)
  const srcData = ctx.getImageData(0, 0, w, h)

  // Pass 1: perceptual grayscale
  const gray = buildLuminanceGray(srcData)

  // Pass 2: color dodge (blur radius driven by intensity: low = sharp, high = soft)
  const blurRadius = 1 + (intensity / 100) * 22
  const blurred = gaussianBlur(gray, w, h, blurRadius)
  const dodge = colorDodge(gray, blurred)

  // Pass 3: unsharp mask to restore pencil crispness
  const sharpAmount = 1.2 - (intensity / 100) * 0.7  // less sharpening at high intensity
  const sharp = unsharpMask(dodge, w, h, 1.5, sharpAmount)

  // Pass 4: Sobel edge map — darkens actual contours
  const edges = sobelEdges(gray, w, h)
  // Normalize edges
  let maxEdge = 0
  for (let i = 0; i < edges.length; i++) if (edges[i] > maxEdge) maxEdge = edges[i]
  const edgeStrength = 0.45 - (intensity / 100) * 0.25  // less edge at high intensity

  // Pass 5 + 6: compose on white, apply contrast curve, blend edges
  const out = ctx.createImageData(w, h)
  for (let i = 0; i < gray.length; i++) {
    const dodgeVal = sharp[i]
    const edgeVal = maxEdge > 0 ? (edges[i] / maxEdge) * 255 * edgeStrength : 0
    // Blend: subtract edge darkness from sketch
    let v = Math.max(0, dodgeVal - edgeVal)
    // Apply contrast curve
    v = applyCurve(v, intensity)
    // White paper: sketch is always light background
    out.data[i * 4 + 0] = v
    out.data[i * 4 + 1] = v
    out.data[i * 4 + 2] = v
    out.data[i * 4 + 3] = 255
  }

  ctx.putImageData(out, 0, 0)
}

// ---------------------------------------------------------------------------

export function ImageToSketch() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [intensity, setIntensity] = useState(65)
  const [isProcessing, setIsProcessing] = useState(false)
  const mainCanvas = useRef<HTMLCanvasElement>(null)
  const runIdRef = useRef(0)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => { isMountedRef.current = false }
  }, [])

  const handleDrop = (files: File[]) => {
    const f = files[0]
    if (!f || !validateFiles([f])) return
    setFile(f)
  }

  const applyEffect = useCallback(() => {
    if (!file || !mainCanvas.current) return
    runIdRef.current++
    const runId = runIdRef.current
    setIsProcessing(true)

    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      if (!isMountedRef.current || runId !== runIdRef.current) return
      try {
        renderSketch(img, mainCanvas.current!, intensity)
      } catch (e) {
        console.error("Sketch render error:", e)
        toast.error("Sketch failed — try a smaller image")
      }
      if (isMountedRef.current && runId === runIdRef.current) setIsProcessing(false)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      if (!isMountedRef.current || runId !== runIdRef.current) return
      setIsProcessing(false)
      toast.error("Failed to load image")
    }
    img.src = url
  }, [file, intensity])

  useEffect(() => {
    if (file) applyEffect()
  }, [file, intensity, applyEffect])

  const handleDownload = () => {
    if (!mainCanvas.current) return
    const url = mainCanvas.current.toDataURL("image/png")
    const a = document.createElement("a")
    a.href = url
    a.download = `vanity-sketch-${Date.now()}.png`
    a.click()
    toast.success("Sketch exported!")
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
          <div className="glass-panel p-4 rounded-3xl flex items-center justify-center min-h-[500px] bg-white/5 shadow-inner relative overflow-hidden group border border-white/5">
            {isProcessing && (
              <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              </div>
            )}
            <canvas
              ref={mainCanvas}
              className="max-w-full max-h-full rounded-xl shadow-lg transition-transform group-hover:scale-[1.01] duration-500"
              style={{ background: "#fff" }}
            />
            <div className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-widest text-white/20">Artistic Preview</div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-8 rounded-2xl space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <SlidersHorizontal className="w-3 h-3" /> Sketch Intensity
                </label>
                <span className="text-lg font-bold font-mono text-primary">{intensity}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="95"
                value={intensity}
                onChange={(e) => setIntensity(parseInt(e.target.value))}
                className="w-full h-1.5 bg-primary/10 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                <span>Minimal</span>
                <span>Realistic</span>
                <span>Abstract</span>
              </div>
            </div>

            <div className="space-y-3 bg-primary/5 rounded-xl p-4 border border-primary/10">
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Pro Tip</h4>
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                Higher intensity values create softer, more artistic "watercolor-pencil" looks. Lower values yield sharper "technical-drawings".
              </p>
            </div>

            <button
              onClick={handleDownload}
              disabled={isProcessing}
              className="w-full py-5 bg-primary text-primary-foreground font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" /> Export-Res Sketch
            </button>

            <button 
              onClick={() => setFile(null)}
              className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all"
            >
              Start New
            </button>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
