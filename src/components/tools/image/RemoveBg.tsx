import React, { useState, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, Loader2, Sparkles, Image } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { usePremium } from "@/hooks/usePremium"
import { useObjectUrl } from "@/hooks/useObjectUrl"
import { toast } from "sonner"
import { downloadBlob } from "@/lib/canvas"
import { safeImport } from "@/lib/utils/loader"

// Module-level cache for heavy library
let removeBgModule: any = null

export function RemoveBg() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()

  const handleProcess = async (uploadedFiles: File[]) => {
    if (isProcessing) return
    const uploadedFile = uploadedFiles[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return

    setFile(uploadedFile)
    setIsProcessing(true)
    setProgress(5)
    
    // Local scope for memory cleanup
    let blob: Blob | null = null
    
    try {
      // 1. Action-triggered dynamic import with caching
      if (!removeBgModule) {
        setProgress(10) // Show we've started loading engine
        removeBgModule = await safeImport(
          () => import("@imgly/background-removal"),
          "AI background removal engine"
        )
      }
      
      const { removeBackground } = removeBgModule
      
      // 2. Processing with progress
      blob = await removeBackground(uploadedFile, {
        progress: (key: string, current: number, total: number) => {
          // Progress reported by library can be noisy, we smooth it
          setProgress(prev => Math.min(prev + 2, 98))
        }
      })
      
      if (!blob) throw new Error("Processing failed to produce result")

      setProgress(100)
      setResultBlob(blob)
      setResultUrl(blob)
      
      toast.success("Background removed!")
      
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || "Failed to remove background")
      setFile(null) // Reset on error
    } finally {
      setIsProcessing(false)
      // 3. Clean up reference pointers to help GC
      blob = null
    }
  }

  const handleDownload = () => {
    if (!resultBlob) return
    downloadBlob(resultBlob, `vanity-nobg-${file?.name || "image.png"}`)
  }

  const handleStartNew = () => {
    setFile(null)
    clearResultUrl()
    setResultBlob(null)
    setProgress(0)
  }

  if (!file) {
    return (
      <ToolUploadLayout
        title="Background Removal"
        description="Upload an image and instantly remove its background. Powered by AI, perfectly free, and processes entirely in your browser."
        icon={Image}
      >
        <DropZone onDrop={handleProcess} accept={{ "image/*": [] }} />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout
      title="Remove Background"
      description={`File: ${file.name}`}
      icon={Image}
      onBack={handleStartNew}
    >

      <div className="glass-panel p-8 rounded-xl flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+Cgo8cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMzMzMiLz4KPHJlY3QgeD0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzIyMjIyMiIvPgo8cmVjdCB5PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMjIyMjIyIi8+CjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMzMzMzMzIi8+Cjwvc3ZnPg==')]">
        
        {isProcessing && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur flex flex-col items-center justify-center z-10 transition-opacity">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <h3 className="text-xl font-bold font-syne animate-pulse text-white">
              {progress < 15 ? "Loading AI Engine..." : "Removing Background..."}
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm text-center px-4">
              {progress < 15 
                ? "Fetching neural models (approx. 50MB)..." 
                : "AI is processing locally. Your image never leaves your device."}
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
        <div className="flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button 
            onClick={handleDownload}
            className="px-8 py-4 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-3 hover:scale-105"
          >
            <Download className="w-6 h-6" /> Download Transparent PNG
          </button>
        </div>
      )}
    </ToolLayout>
  )
}
