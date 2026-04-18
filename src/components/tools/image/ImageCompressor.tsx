import React, { useState, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, Loader2, Minimize2, CheckCircle, AlertCircle } from "lucide-react"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"
import { downloadBlob } from "@/lib/canvas/export"
import { cn } from "@/lib/utils"

export function ImageCompressor() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [phase, setPhase] = useState("")
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  
  // Settings
  const [targetSizeKB, setTargetSizeKB] = useState(100)

  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl)
    }
  }, [resultUrl])

  const runIterativeCompress = async (file: File, targetKB: number) => {
    const targetBytes = targetKB * 1024
    const MAX_ITERS = 10
    
    // Load image into canvas
    const img = new Image()
    img.src = URL.createObjectURL(file)
    await new Promise((resolve) => img.onload = resolve)
    URL.revokeObjectURL(img.src)

    let scale = 1.0
    let quality = 0.8
    let iteration = 0
    let lastBlob: Blob | null = null

    // Hard resize for small targets
    if (targetKB < 100 && (img.width > 2000 || img.height > 2000)) {
       scale = 0.7
    }

    while (iteration++ < MAX_ITERS) {
      setPhase(`Matching size (Attempt ${iteration})...`)
      
      const canvas = document.createElement("canvas")
      const targetWidth = img.width * scale
      const targetHeight = img.height * scale
      canvas.width = targetWidth
      canvas.height = targetHeight
      
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
      
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", quality))
      
      canvas.width = 0
      canvas.height = 0

      if (blob.size <= targetBytes || iteration === MAX_ITERS) {
        lastBlob = blob
        break
      }

      // Step down: resolution first, then quality
      if (scale > 0.4) {
        scale -= 0.15
      } else if (quality > 0.1) {
        quality -= 0.15
      } else {
        lastBlob = blob
        break
      }
    }

    return lastBlob!
  }

  const handleCompress = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return

    setFile(uploadedFile)
    setIsProcessing(true)
    setPhase("Initializing...")
    
    try {
      const compressedBlob = await runIterativeCompress(uploadedFile, targetSizeKB)
      const url = URL.createObjectURL(compressedBlob)
      
      setResultBlob(compressedBlob)
      setResultUrl(url)
      toast.success("Image compressed!")
      
    } catch (error: any) {
      console.error(error)
      toast.error("Compression failed")
    } finally {
      setIsProcessing(false)
      setPhase("")
    }
  }

  const handleDownload = () => {
    if (!resultBlob) return
    downloadBlob(resultBlob, `vanity-compressed-${file?.name || "image.jpg"}`)
  }

  const PRESETS = [10, 50, 100, 200, 500]

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
         <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6 text-primary">
            <Minimize2 className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1">Image Compressor</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Aggressively reduce file size of your images. Optimized for web uploads and target size requirements.
        </p>

        <div className="glass-panel p-6 rounded-xl mb-8 flex flex-col items-center">
          <h3 className="text-sm font-bold font-syne mb-4 uppercase tracking-widest text-muted-foreground">Target Size (KB)</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setTargetSizeKB(p)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all border",
                  targetSizeKB === p
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    : "bg-white/5 border-transparent hover:bg-white/10"
                )}
              >
                {p} KB
              </button>
            ))}
            <div className="relative">
               <input 
                 type="number"
                 placeholder="Custom"
                 onChange={(e) => setTargetSizeKB(Number(e.target.value))}
                 className="w-24 h-full bg-white/5 border border-transparent rounded-lg px-3 py-2 text-xs outline-none focus:border-primary transition-all"
               />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground">
             <AlertCircle className="w-3 h-3" />
             Target size is approximate. Results depend on image complexity.
          </div>
        </div>

        <DropZone onDrop={handleCompress} accept={{ "image/*": [] }} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-3xl font-bold font-syne mb-2">Compress Image</h1>
          <p className="text-muted-foreground text-sm">Original: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
        <button 
          onClick={() => { setFile(null); setResultUrl(null); }} 
          className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Start New
        </button>
      </div>

      <div className="glass-panel p-8 rounded-xl flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
        {isProcessing && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur flex flex-col items-center justify-center z-10 transition-opacity">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <h3 className="text-xl font-bold font-syne animate-pulse text-white">{phase}</h3>
          </div>
        )}

        {resultUrl && !isProcessing && (
          <div className="text-center space-y-6">
            <img src={resultUrl} alt="Result" className="max-h-[400px] object-contain drop-shadow-2xl mx-auto rounded-lg" />
            <div className="bg-white/5 p-4 rounded-lg inline-block border border-white/5">
              <p className="text-sm">
                <span className="text-muted-foreground">New Size:</span> 
                <span className="font-bold text-primary ml-2">{(resultBlob!.size / 1024).toFixed(1)} KB</span>
                <span className="ml-4 text-green-500 font-bold bg-green-500/10 px-2 py-0.5 rounded">
                  -{Math.round((1 - resultBlob!.size / file.size) * 100)}%
                </span>
              </p>
            </div>
            
            <div className="flex justify-center gap-4">
               <button 
                onClick={handleDownload}
                className="px-8 py-4 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-3 hover:scale-105"
              >
                <Download className="w-6 h-6" /> Download Image
              </button>
              <button 
                onClick={() => { setFile(null); setResultUrl(null); }}
                className="px-8 py-4 text-lg font-bold bg-white/5 hover:bg-white/10 rounded-full transition-all"
              >
                Try Different Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
