import React, { useState, useRef, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, Maximize2, Sparkles } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { usePremium } from "@/hooks/usePremium"
import { useObjectUrl } from "@/hooks/useObjectUrl"
import { toast } from "sonner"
import { downloadBlob } from "@/lib/canvas"

/**
 * Lanczos3 kernel — self-contained, no remote model fetch.
 * Produces high-quality upscaling comparable to Photoshop's bicubic sharper.
 */
function lanczos3(x: number): number {
  if (x === 0) return 1
  if (x < -3 || x > 3) return 0
  const px = Math.PI * x
  return (3 * Math.sin(px) * Math.sin(px / 3)) / (px * px)
}

function lanczosResample(
  srcData: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  onProgress?: (p: number) => void
): ImageData {
  const dst = new ImageData(dstW, dstH)
  const ratioX = srcW / dstW
  const ratioY = srcH / dstH
  const totalRows = dstH

  for (let dy = 0; dy < dstH; dy++) {
    for (let dx = 0; dx < dstW; dx++) {
      const srcX = (dx + 0.5) * ratioX - 0.5
      const srcY = (dy + 0.5) * ratioY - 0.5

      let r = 0, g = 0, b = 0, a = 0, weightSum = 0

      const x0 = Math.max(0, Math.floor(srcX) - 2)
      const x1 = Math.min(srcW - 1, Math.floor(srcX) + 3)
      const y0 = Math.max(0, Math.floor(srcY) - 2)
      const y1 = Math.min(srcH - 1, Math.floor(srcY) + 3)

      for (let sy = y0; sy <= y1; sy++) {
        for (let sx = x0; sx <= x1; sx++) {
          const weight = lanczos3(srcX - sx) * lanczos3(srcY - sy)
          const idx = (sy * srcW + sx) * 4
          r += srcData[idx] * weight
          g += srcData[idx + 1] * weight
          b += srcData[idx + 2] * weight
          a += srcData[idx + 3] * weight
          weightSum += weight
        }
      }

      const dIdx = (dy * dstW + dx) * 4
      if (weightSum > 0) {
        dst.data[dIdx] = Math.max(0, Math.min(255, r / weightSum))
        dst.data[dIdx + 1] = Math.max(0, Math.min(255, g / weightSum))
        dst.data[dIdx + 2] = Math.max(0, Math.min(255, b / weightSum))
        dst.data[dIdx + 3] = Math.max(0, Math.min(255, a / weightSum))
      }
    }

    if (onProgress && dy % 20 === 0) {
      onProgress(Math.round((dy / totalRows) * 100))
    }
  }

  return dst
}

export function AiUpscaler() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [scale, setScale] = useState(2)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()
  const [originalDims, setOriginalDims] = useState<{ w: number; h: number } | null>(null)
  const isMountedRef = useRef(true)
  const jobIdRef = useRef(0)

  useEffect(() => {
    return () => { isMountedRef.current = false }
  }, [])

  const handleProcess = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return

    setFile(uploadedFile)
    setIsProcessing(true)
    setProgress(0)
    clearResultUrl()
    setResultBlob(null)

    const jobId = ++jobIdRef.current

    try {
      // Load image from File directly
      const localUrl = URL.createObjectURL(uploadedFile)
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image()
        el.onload = () => resolve(el)
        el.onerror = () => reject(new Error("Failed to load image"))
        el.src = localUrl
      })
      URL.revokeObjectURL(localUrl)

      if (jobId !== jobIdRef.current || !isMountedRef.current) return

      const srcW = img.naturalWidth
      const srcH = img.naturalHeight
      setOriginalDims({ w: srcW, h: srcH })

      // Draw source to canvas to get pixel data
      const srcCanvas = document.createElement("canvas")
      srcCanvas.width = srcW
      srcCanvas.height = srcH
      const srcCtx = srcCanvas.getContext("2d", { willReadFrequently: true })!
      srcCtx.drawImage(img, 0, 0)
      const srcData = srcCtx.getImageData(0, 0, srcW, srcH)

      setProgress(5)

      const dstW = srcW * scale
      const dstH = srcH * scale

      // Run Lanczos in a yielded manner so UI stays responsive
      const resultData = await new Promise<ImageData>((resolve) => {
        // Use setTimeout to yield to the browser before heavy compute
        setTimeout(() => {
          const data = lanczosResample(
            srcData.data, srcW, srcH, dstW, dstH,
            (p) => {
              if (jobId === jobIdRef.current && isMountedRef.current) {
                setProgress(5 + Math.round(p * 0.9)) // 5% to 95%
              }
            }
          )
          resolve(data)
        }, 50)
      })

      if (jobId !== jobIdRef.current || !isMountedRef.current) return

      // Write result to output canvas
      const outCanvas = document.createElement("canvas")
      outCanvas.width = dstW
      outCanvas.height = dstH
      const outCtx = outCanvas.getContext("2d")!
      outCtx.putImageData(resultData, 0, 0)

      setProgress(97)

      const blob = await new Promise<Blob>((resolve, reject) => {
        outCanvas.toBlob(
          (b) => b ? resolve(b) : reject(new Error("Canvas export failed")),
          "image/png"
        )
      })

      // Cleanup temp canvases
      srcCanvas.width = 0
      srcCanvas.height = 0
      outCanvas.width = 0
      outCanvas.height = 0

      if (jobId !== jobIdRef.current || !isMountedRef.current) return

      setResultBlob(blob)
      setResultUrl(blob)
      setProgress(100)
      toast.success(`Image upscaled to ${dstW}×${dstH}!`)
    } catch (error: any) {
      console.error("Upscale error:", error)
      if (jobId === jobIdRef.current) {
        toast.error(`Upscale failed: ${error.message || "Unknown error"}`)
      }
    } finally {
      if (jobId === jobIdRef.current) {
        setIsProcessing(false)
      }
    }
  }

  const handleDownload = () => {
    if (!resultBlob) return
    downloadBlob(resultBlob, `vanity-upscaled-${scale}x-${file?.name || "image.png"}`)
  }

  const handleStartNew = () => {
    setFile(null)
    clearResultUrl()
    setResultBlob(null)
    setProgress(0)
    setOriginalDims(null)
  }

  if (!file) {
    return (
      <ToolUploadLayout
        title="Image Upscaler"
        description="Increase resolution by 2x or 4x using high-quality Lanczos3 resampling — instant, offline, no model download."
        icon={Maximize2}
      >
        <div className="flex justify-center gap-4 mb-6">
          {[2, 4].map(s => (
            <button
              key={s}
              onClick={() => setScale(s)}
              className={`px-8 py-4 rounded-xl font-bold transition-all ${scale === s ? "bg-primary text-primary-foreground shadow-lg scale-110" : "bg-white/5 hover:bg-white/10 text-muted-foreground"}`}
            >
              {s}X Scale
            </button>
          ))}
        </div>
        <DropZone onDrop={handleProcess} accept={{ "image/*": [] }} />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout
      title="Image Upscaler"
      description={`Processing: ${file.name}`}
      icon={Maximize2}
      onBack={handleStartNew}
    >
      <div className="glass-panel p-8 rounded-xl flex flex-col items-center justify-center min-h-[450px] relative overflow-hidden">
        {isProcessing && (
          <div className="absolute inset-0 bg-[#030303]/90 backdrop-blur-xl z-20 flex flex-col items-center justify-center animate-in fade-in duration-500">
             <div className="w-full max-w-md px-8 space-y-8 text-center">
                <div className="relative inline-block">
                   <div className="w-24 h-24 rounded-full border-4 border-white/5 border-t-primary animate-spin" />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-black font-mono text-primary">{progress}%</span>
                   </div>
                </div>
                
                <div className="space-y-2">
                   <h3 className="text-2xl font-bold font-syne mt-6 animate-pulse">
                     {progress < 5 ? "Loading Image..." : progress < 95 ? `Lanczos ${scale}x Upscaling...` : "Encoding PNG..."}
                   </h3>
                   <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] font-medium">
                     {scale}x Scale • {originalDims ? `${originalDims.w * scale}×${originalDims.h * scale}px` : "Calculating..."}
                   </p>
                </div>

                <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                   <div 
                     className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-orange-400 transition-all duration-500 ease-out shadow-[0_0_15px_rgba(245,158,11,0.5)]" 
                     style={{ width: `${progress}%` }}
                   />
                </div>
                
                <div className="pt-4 flex items-center justify-center gap-2 text-[10px] text-muted-foreground bg-white/5 py-2 px-4 rounded-full border border-white/10 w-fit mx-auto">
                   <Sparkles className="w-3 h-3 text-yellow-500" />
                   <span>Lanczos3 Kernel • 100% Offline</span>
                </div>
             </div>
          </div>
        )}

        {resultUrl && !isProcessing && (
          <div className="text-center space-y-6 animate-in zoom-in-95">
            <div className="relative inline-block">
               <img src={resultUrl} alt="Result" className="max-h-[300px] rounded shadow-2xl border border-white/10" />
               <div className="absolute top-2 right-2 bg-primary px-2 py-1 rounded text-[10px] font-bold">{scale}X UPSCALED</div>
            </div>
            
            {originalDims && (
              <p className="text-xs text-muted-foreground">
                {originalDims.w}×{originalDims.h} → <span className="text-primary font-bold">{originalDims.w * scale}×{originalDims.h * scale}</span>
              </p>
            )}

            <button 
              onClick={handleDownload}
              className="px-12 py-4 bg-primary text-primary-foreground font-bold rounded-full shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:scale-105 transition-all flex items-center justify-center gap-2 mx-auto"
            >
              <Download className="w-5 h-5" /> Download {scale}x Result
            </button>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
