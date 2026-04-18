import React, { useState, useRef, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, Copy, SplitSquareHorizontal, MoveHorizontal, Trash2, Microscope, Loader2 } from "lucide-react"
import { usePremium } from "@/hooks/usePremium"
import { useObjectUrl } from "@/hooks/useObjectUrl"
import { toast } from "sonner"

export function ImageDiff() {
  const { validateFiles } = usePremium()
  const [file1, setFile1] = useState<File | null>(null)
  const [file2, setFile2] = useState<File | null>(null)
  const { url: imgUrl1, setUrl: setImgUrl1, clear: clearImgUrl1 } = useObjectUrl()
  const { url: imgUrl2, setUrl: setImgUrl2, clear: clearImgUrl2 } = useObjectUrl()
  const { url: diffUrl, setUrl: setDiffUrl, clear: clearDiffUrl } = useObjectUrl()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [sliderPos, setSliderPos] = useState(50)
  
  const containerRef = useRef<HTMLDivElement>(null)

  const handleDrop1 = (files: File[]) => {
    if (files[0] && validateFiles([files[0]])) {
      setFile1(files[0])
      setImgUrl1(files[0])
    }
  }

  const handleDrop2 = (files: File[]) => {
    if (files[0] && validateFiles([files[0]])) {
      setFile2(files[0])
      setImgUrl2(files[0])
    }
  }

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    setSliderPos((x / rect.width) * 100)
  }

  const processDiff = async () => {
    if (!imgUrl1 || !imgUrl2) return
    setIsProcessing(true)
    
    try {
      // Load both images
      const img1 = new Image()
      const img2 = new Image()
      
      const loadImg = (img: HTMLImageElement, src: string) => new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = src
      })

      await Promise.all([loadImg(img1, imgUrl1), loadImg(img2, imgUrl2)])

      // Force to largest dimension to align maps
      const w = Math.max(img1.width, img2.width)
      const h = Math.max(img1.height, img2.height)

      const canvas1 = document.createElement("canvas")
      const canvas2 = document.createElement("canvas")
      const diffCanvas = document.createElement("canvas")
      canvas1.width = canvas2.width = diffCanvas.width = w
      canvas1.height = canvas2.height = diffCanvas.height = h

      const ctx1 = canvas1.getContext("2d", { willReadFrequently: true })!
      const ctx2 = canvas2.getContext("2d", { willReadFrequently: true })!
      const diffCtx = diffCanvas.getContext("2d")!

      // Draw cleanly
      ctx1.drawImage(img1, 0, 0, w, h)
      ctx2.drawImage(img2, 0, 0, w, h)

      const data1 = ctx1.getImageData(0, 0, w, h).data
      const data2 = ctx2.getImageData(0, 0, w, h).data
      
      // Output buffer
      const diffData = diffCtx.createImageData(w, h)
      const out = diffData.data

      for (let i = 0; i < data1.length; i += 4) {
        const r1 = data1[i], g1 = data1[i+1], b1 = data1[i+2], a1 = data1[i+3]
        const r2 = data2[i], g2 = data2[i+1], b2 = data2[i+2], a2 = data2[i+3]

        // Euclidean distance logic for detecting differences cleanly
        const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2) + Math.abs(a1 - a2)
        
        if (diff > 5) { // Threshold for anti-aliasing noise
          // Highlight Difference in Bright Neon Orange
          out[i] = 255     // R
          out[i+1] = 85    // G
          out[i+2] = 0     // B
          out[i+3] = 255   // A
        } else {
          // Greyscale the original image (Luma)
          const luma = r1 * 0.299 + g1 * 0.587 + b1 * 0.114
          // Wash it out slightly so neon pops
          out[i] = luma * 0.5
          out[i+1] = luma * 0.5
          out[i+2] = luma * 0.5
          out[i+3] = 255
        }
      }

      diffCtx.putImageData(diffData, 0, 0)
      
      diffCanvas.toBlob((blob) => {
        if (blob) setDiffUrl(blob)
      }, "image/png")

    } catch (error) {
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Auto trigger diff when both files load
  useEffect(() => {
    if (imgUrl1 && imgUrl2) {
      processDiff()
    }
  }, [imgUrl1, imgUrl2])

  const reset = () => {
    setFile1(null)
    setFile2(null)
    clearImgUrl1()
    clearImgUrl2()
    clearDiffUrl()
    setSliderPos(50)
  }

  if (!file1 || !file2) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-8 animate-in fade-in duration-500">
         <div className="text-center">
            <div className="inline-flex items-center justify-center p-3 bg-rose-500/10 rounded-full mb-6 text-rose-500">
               <Microscope className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold font-syne mb-1 text-white">Image Difference Tool</h1>
            <p className="text-muted-foreground text-lg mb-12">
               Upload two images to compute the exact pixel deviations mapped visually via neon overlay.
            </p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block text-center">Version A (Base)</label>
               {imgUrl1 ? (
                 <div className="relative aspect-video rounded-3xl overflow-hidden group border border-white/10">
                    <img src={imgUrl1} className="w-full h-full object-cover" />
                    <button onClick={() => setFile1(null)} className="absolute top-4 right-4 p-2 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all">
                       <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
               ) : (
                 <DropZone onDrop={handleDrop1} accept={{ "image/*": [] }} label="Drop Base image" />
               )}
            </div>
            <div className="space-y-4">
               <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block text-center">Version B (Comparison)</label>
               {imgUrl2 ? (
                 <div className="relative aspect-video rounded-3xl overflow-hidden group border border-white/10">
                    <img src={imgUrl2} className="w-full h-full object-cover" />
                    <button onClick={() => setFile2(null)} className="absolute top-4 right-4 p-2 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all">
                       <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
               ) : (
                 <DropZone onDrop={handleDrop2} accept={{ "image/*": [] }} label="Drop Comp image" />
               )}
            </div>
         </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 sm:px-0 pb-20">
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500">
             <SplitSquareHorizontal className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-syne text-white">Visual Differential</h1>
            <p className="text-muted-foreground text-sm">Review absolute bit-differences directly below.</p>
          </div>
        </div>
        <button onClick={reset} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Start New
        </button>
      </div>

      {isProcessing || !diffUrl ? (
        <div className="w-full aspect-video rounded-[2.5rem] bg-black/50 border border-white/5 flex flex-col items-center justify-center">
           <Loader2 className="w-8 h-8 animate-spin text-rose-500 mb-4" />
           <p className="text-muted-foreground font-mono text-sm">Computing XOR byte buffers...</p>
        </div>
      ) : (
        <div 
          ref={containerRef}
          className="relative w-full aspect-video rounded-[2.5rem] overflow-hidden bg-black shadow-2xl group cursor-col-resize select-none touch-none border border-white/5"
          onMouseMove={handleMouseMove}
          onTouchMove={handleMouseMove}
        >
          {/* Base Image Greyscaled w/ Diff highlights */}
          <img 
            src={diffUrl!} 
            className="absolute inset-0 w-full h-full object-contain pointer-events-none bg-stone-900" 
            alt="Diff Render" 
          />
          
          {/* Slider Overlay (Original Base Image Context) */}
          <div 
             className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
             style={{ width: `${sliderPos}%` }}
          >
             <img 
                src={imgUrl2!} 
                className="absolute inset-0 w-full h-full object-contain transition-none bg-stone-900" 
                style={{ width: `${100 / (sliderPos / 100)}%` }} // Counter scale
                alt="Original" 
             />
          </div>

          <div 
             className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_15px_rgba(255,85,0,0.8)] z-20"
             style={{ left: `${sliderPos}%` }}
          >
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-2xl scale-100 group-hover:scale-110 active:scale-95 transition-transform border-[6px] border-rose-500/20">
                <MoveHorizontal className="w-5 h-5 text-black" />
             </div>
          </div>

          {/* Labels */}
          <div className="absolute top-6 left-6 px-4 py-2 bg-black/80 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest border border-rose-500/30 z-30 transition-opacity opacity-0 group-hover:opacity-100 text-rose-400">Comparison Render</div>
          <div className="absolute top-6 right-6 px-4 py-2 bg-black/80 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest border border-white/10 z-30 transition-opacity opacity-0 group-hover:opacity-100">Differential Map</div>
        </div>
      )}

      <div className="p-8 glass-panel rounded-3xl flex items-center gap-8 border-white/5 shadow-lg">
         <div className="p-4 bg-rose-500/10 rounded-2xl text-rose-500">
            <Microscope className="w-8 h-8" />
         </div>
         <div className="space-y-1">
            <h4 className="text-lg font-bold text-white font-syne">How to read this diff</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
               The differential map calculates distance in RBGA space array values. Identical zones fall back to desaturated greyscale luma maps. Any pixel delta breaking Euclidean boundaries illuminates neon orange definitively highlighting visual divergences instantly. Complete privacy, executed locally.
            </p>
         </div>
      </div>
    </div>
  )
}
