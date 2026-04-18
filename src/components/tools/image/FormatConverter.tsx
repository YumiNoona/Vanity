import React, { useState, useEffect, useRef } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, Loader2, FileText, Sparkles } from "lucide-react"
import confetti from "canvas-confetti"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"

const FORMATS = ["webp", "png", "jpeg", "gif"]

export function FormatConverter() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [targetFormat, setTargetFormat] = useState("webp")
  const [isProcessing, setIsProcessing] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl)
    }
  }, [resultUrl])

  const handleConvert = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return

    setFile(uploadedFile)
    setIsProcessing(true)
    
    try {
      const img = new Image()
      const objectUrl = URL.createObjectURL(uploadedFile)
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = objectUrl
      })

      const canvas = canvasRef.current!
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0)
      
      const mimeType = `image/${targetFormat === "jpg" ? "jpeg" : targetFormat}`
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), mimeType, 0.9)
      })

      const url = URL.createObjectURL(blob)
      setResultUrl(url)
      URL.revokeObjectURL(objectUrl)
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#F59E0B", "#FCD34D", "#FFFFFF"]
      })
      toast.success(`Converted to ${targetFormat.toUpperCase()}!`)
      
    } catch (error: any) {
      console.error(error)
      toast.error("Conversion failed")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!resultUrl) return
    const a = document.createElement("a")
    a.href = resultUrl
    a.download = `vanity-converted.${targetFormat}`
    a.click()
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
         <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6 text-primary">
            <FileText className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1">Format Converter</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Convert your images between WEBP, PNG, JPG, and GIF instantly.
        </p>
        
        <div className="glass-panel p-6 rounded-xl mb-8 flex flex-col items-center">
          <label className="text-sm font-medium mb-4">Target Format</label>
          <div className="flex gap-2">
            {FORMATS.map(f => (
              <button
                key={f}
                onClick={() => setTargetFormat(f)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${targetFormat === f ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(245,158,11,0.3)]" : "bg-white/5 hover:bg-white/10"}`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <DropZone onDrop={handleConvert} accept={{ "image/*": [] }} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-3xl font-bold font-syne mb-2">Convert Image</h1>
          <p className="text-muted-foreground text-sm">Target: {targetFormat.toUpperCase()}</p>
        </div>
        <button 
          onClick={() => { setFile(null); setResultUrl(null); }} 
          className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Start New
        </button>
      </div>

      <div className="glass-panel p-8 rounded-xl flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
        <canvas ref={canvasRef} className="hidden" />
        {isProcessing && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur flex flex-col items-center justify-center z-10">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <h3 className="text-xl font-bold font-syne animate-pulse text-white">Converting...</h3>
          </div>
        )}

        {resultUrl && !isProcessing && (
          <img src={resultUrl} alt="Result" className="max-h-[450px] object-contain shadow-2xl rounded-lg mx-auto" />
        )}
      </div>

      {resultUrl && !isProcessing && (
        <div className="flex justify-center">
          <button 
            onClick={handleDownload}
            className="px-8 py-4 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-3 hover:scale-105"
          >
            <Download className="w-6 h-6" /> Download {targetFormat.toUpperCase()}
          </button>
        </div>
      )}
    </div>
  )
}
