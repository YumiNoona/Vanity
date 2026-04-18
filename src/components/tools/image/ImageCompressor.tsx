import React, { useState, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, Loader2, Minimize2, Sparkles } from "lucide-react"
import imageCompression from "browser-image-compression"
import confetti from "canvas-confetti"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"

export function ImageCompressor() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [quality, setQuality] = useState(0.8)

  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl)
    }
  }, [resultUrl])

  const handleCompress = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return

    setFile(uploadedFile)
    setIsProcessing(true)
    
    try {
      const options = {
        maxSizeMB: quality > 0.8 ? 5 : quality > 0.5 ? 2 : 1, // Simple mapping
        maxWidthOrHeight: 4096,
        useWebWorker: true,
        initialQuality: quality
      }

      const compressedFile = await imageCompression(uploadedFile, options)
      const url = URL.createObjectURL(compressedFile)
      
      setResultBlob(compressedFile)
      setResultUrl(url)
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#F59E0B", "#FCD34D", "#FFFFFF"]
      })
      toast.success("Image compressed!")
      
    } catch (error: any) {
      console.error(error)
      toast.error("Compression failed")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!resultUrl) return
    const a = document.createElement("a")
    a.href = resultUrl
    a.download = `vanity-compressed-${file?.name || "image.png"}`
    a.click()
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
         <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6 text-primary">
            <Minimize2 className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1">Image Compressor</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Reduce file size of your images without losing quality. 
        </p>
        <div className="glass-panel p-6 rounded-xl mb-8 flex flex-col items-center">
          <label className="text-sm font-medium mb-4">Compression Strength: {Math.round((1 - quality) * 100)}%</label>
          <input 
            type="range" 
            min="0.1" 
            max="0.9" 
            step="0.1" 
            value={quality} 
            onChange={(e) => setQuality(Number(e.target.value))}
            className="w-full max-w-xs accent-primary"
          />
          <div className="flex justify-between w-full max-w-xs text-xs text-muted-foreground mt-2">
            <span>Better Quality</span>
            <span>Smaller File</span>
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
            <h3 className="text-xl font-bold font-syne animate-pulse text-white">Compressing...</h3>
          </div>
        )}

        {resultUrl && !isProcessing && (
          <div className="text-center space-y-6">
            <img src={resultUrl} alt="Result" className="max-h-[400px] object-contain drop-shadow-2xl mx-auto rounded-lg" />
            <div className="bg-white/5 p-4 rounded-lg inline-block">
              <p className="text-sm">
                <span className="text-muted-foreground">New Size:</span> 
                <span className="font-bold text-primary ml-2">{(resultBlob!.size / 1024 / 1024).toFixed(2)} MB</span>
                <span className="ml-4 text-green-500 font-bold">
                  -{Math.round((1 - resultBlob!.size / file.size) * 100)}%
                </span>
              </p>
            </div>
          </div>
        )}
      </div>

      {resultUrl && !isProcessing && (
        <div className="flex justify-center">
          <button 
            onClick={handleDownload}
            className="px-8 py-4 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-3 hover:scale-105"
          >
            <Download className="w-6 h-6" /> Download Compressed Image
          </button>
        </div>
      )}
    </div>
  )
}
