import React, { useState, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, Loader2, Sparkles } from "lucide-react"
import { removeBackground } from "@imgly/background-removal"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"
import { downloadBlob } from "@/lib/canvas"

export function RemoveBg() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  
  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl)
    }
  }, [resultUrl])

  const handleProcess = async (uploadedFiles: File[]) => {
    if (isProcessing) return
    const uploadedFile = uploadedFiles[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return

    setFile(uploadedFile)
    setIsProcessing(true)
    setProgress(10)
    
    try {
      const blob = await removeBackground(uploadedFile, {
        progress: (key, current, total) => {
          setProgress(prev => Math.min(prev + 5, 95))
        }
      })
      
      setProgress(100)
      const url = URL.createObjectURL(blob)
      setResultBlob(blob)
      setResultUrl(url)
      
      toast.success("Background removed!")
      
    } catch (error: any) {
      console.error(error)
      toast.error("Failed to remove background")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!resultBlob) return
    downloadBlob(resultBlob, `vanity-nobg-${file?.name || "image.png"}`)
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
         <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6 text-primary">
            <Sparkles className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-4">Background Removal</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Upload an image and instantly remove its background. Powered by AI, perfectly free, and processes entirely in your browser.
        </p>
        <DropZone onDrop={handleProcess} accept={{ "image/*": [] }} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-3xl font-bold font-syne mb-2">Remove Background</h1>
          <p className="text-muted-foreground text-sm">File: {file.name}</p>
        </div>
        <button 
          onClick={() => { setFile(null); setResultUrl(null); }} 
          className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Start New
        </button>
      </div>

      <div className="glass-panel p-8 rounded-xl flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+Cgo8cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMzMzMiLz4KPHJlY3QgeD0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzIyMjIyMiIvPgo8cmVjdCB5PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMjIyMjIyIi8+CjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMzMzMzMzIi8+Cjwvc3ZnPg==')]">
        
        {isProcessing && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur flex flex-col items-center justify-center z-10 transition-opacity">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <h3 className="text-xl font-bold font-syne animate-pulse text-white">Removing Background...</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm text-center px-4">
              AI is processing locally. The first run loads the model (approx 50MB).
            </p>
            <div className="w-64 h-2 bg-white/10 rounded-full mt-6 overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {resultUrl && !isProcessing && (
          <img src={resultUrl} alt="Result" className="max-h-[500px] object-contain drop-shadow-2xl z-20" />
        )}
      </div>

      {resultUrl && !isProcessing && (
        <div className="flex justify-center">
          <button 
            onClick={handleDownload}
            className="px-8 py-4 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-3 hover:scale-105"
          >
            <Download className="w-6 h-6" /> Download Transparent PNG
          </button>
        </div>
      )}
    </div>
  )
}
