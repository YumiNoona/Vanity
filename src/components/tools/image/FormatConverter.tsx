import React, { useState, useRef, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, Loader2, FileText, FileArchive } from "lucide-react"
import { usePremium } from "@/hooks/usePremium"
import { useImageProcessor } from "@/hooks/useImageProcessor"
import { useObjectUrl } from "@/hooks/useObjectUrl"
import { drawToCanvas, exportCanvas } from "@/lib/canvas"
import { toast } from "sonner"
import { ModeToggle } from "@/components/shared/ModeToggle"
import { ProcessingQueue } from "@/components/shared/ProcessingQueue"
import type { QueueItem } from "@/types/bulk"
import { cn } from "@/lib/utils"
import { downloadBlob } from "@/lib/canvas/export"
import JSZip from "jszip"

const FORMATS = ["webp", "png", "jpeg", "gif"]

export function FormatConverter() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [targetFormat, setTargetFormat] = useState("webp")
  const { isProcessing, processImage } = useImageProcessor()
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Bulk State
  const [processMode, setProcessMode] = useState<'single' | 'batch'>('single')
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)

  const runConversion = async (uploadedFile: File, target: string) => {
    const result = await processImage(uploadedFile)
    if (!result) throw new Error("Processing failed")

    try {
      const canvas = canvasRef.current || document.createElement("canvas")
      const mimeType = `image/${target === "jpg" ? "jpeg" : target}`
      
      await drawToCanvas(result.source, canvas, {
        fillBackground: target === "jpeg" || target === "jpg" ? "#ffffff" : undefined,
        clear: true
      })
      
      const blob = await exportCanvas(canvas, mimeType, 0.95)
      result.cleanup()
      return blob
    } catch (err) {
      result.cleanup()
      throw err
    }
  }

  const handleConvert = async (files: File[]) => {
    if (files.length === 0) return
    if (!validateFiles(files)) return

    if (processMode === 'single') {
      const uploadedFile = files[0]
      setFile(uploadedFile)
      clearResultUrl()
      
      try {
        const blob = await runConversion(uploadedFile, targetFormat)
        setResultUrl(blob)
        toast.success(`Converted to ${targetFormat.toUpperCase()}!`)
      } catch (error: any) {
        console.error(error)
        toast.error("Conversion failed")
      }
    } else {
      // Batch Mode
      const newItems: QueueItem[] = files.map(f => ({
        id: Math.random().toString(36).substr(2, 9),
        file: f,
        status: 'pending',
        originalSize: f.size
      }))
      setQueue(prev => [...prev, ...newItems])
    }
  }

  const processBatch = async () => {
    if (isBatchProcessing || queue.filter(i => i.status === 'pending').length === 0) return
    
    setIsBatchProcessing(true)
    const pendingItems = queue.filter(i => i.status === 'pending')

    for (const item of pendingItems) {
      setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'processing' } : q))
      
      try {
        const result = await runConversion(item.file, targetFormat)
        setQueue(prev => prev.map(q => q.id === item.id ? { 
          ...q, 
          status: 'done', 
          resultBlob: result, 
          resultSize: result.size 
        } : q))
      } catch (err) {
        setQueue(prev => prev.map(q => q.id === item.id ? { 
          ...q, 
          status: 'failed', 
          errorMessage: "Failed to convert" 
        } : q))
      }
    }
    
    setIsBatchProcessing(false)
    toast.success("Batch conversion complete!")
  }

  useEffect(() => {
    if (processMode === 'batch' && !isBatchProcessing && queue.some(i => i.status === 'pending')) {
      processBatch()
    }
  }, [queue, processMode, isBatchProcessing])

  const handleDownloadZip = async () => {
    const doneItems = queue.filter(i => i.status === 'done' && i.resultBlob)
    if (doneItems.length === 0) return

    const zip = new JSZip()
    doneItems.forEach(item => {
      const name = item.file.name.replace(/\.[^/.]+$/, "") + `.${targetFormat}`
      zip.file(name, item.resultBlob!)
    })

    const content = await zip.generateAsync({ type: "blob" })
    downloadBlob(content, `vanity-batch-convert-${Date.now()}.zip`)
    toast.success(`Downloaded ${doneItems.length} images`)
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
        <ModeToggle mode={processMode} onChange={(m) => {
          setProcessMode(m)
          setFile(null)
          setQueue([])
          clearResultUrl()
        }} />

        <h1 className="text-4xl font-bold font-syne mb-1">Format Converter</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Convert your images between WEBP, PNG, JPG, and GIF instantly.
        </p>
        
        <div className="glass-panel p-6 rounded-xl mb-8 flex flex-col items-center">
          <label className="text-sm font-medium mb-4 uppercase tracking-widest text-muted-foreground">Target Format</label>
          <div className="flex gap-2">
            {FORMATS.map(f => (
              <button
                key={f}
                onClick={() => {
                   setTargetFormat(f)
                   // Restart batch if changing format
                   if (processMode === 'batch') {
                      setQueue(q => q.map(i => ({...i, status: 'pending', resultBlob: undefined, resultSize: undefined})))
                   }
                }}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-bold transition-all border",
                  targetFormat === f 
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(245,158,11,0.3)]" 
                    : "bg-white/5 border-transparent hover:bg-white/10"
                )}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {processMode === 'batch' && queue.length > 0 ? (
          <div className="space-y-8 animate-in fade-in duration-500">
             <ProcessingQueue 
               items={queue} 
               onRemove={(id) => setQueue(prev => prev.filter(i => i.id !== id))}
               disabled={isBatchProcessing}
             />
             
             <div className="flex justify-center gap-4">
                <button 
                  onClick={handleDownloadZip}
                  disabled={queue.filter(i => i.status === 'done').length === 0}
                  className="px-8 py-4 text-lg font-bold bg-emerald-500 text-white hover:bg-emerald-600 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-3 hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
                >
                  <FileArchive className="w-6 h-6" /> 
                  Download ZIP ({queue.filter(i => i.status === 'done').length})
                </button>
                <div className="relative overflow-hidden inline-flex items-center justify-center">
                   <input 
                      type="file" multiple accept="image/*" 
                      onChange={(e) => e.target.files && handleConvert(Array.from(e.target.files))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                   />
                   <button className="px-8 py-4 text-lg font-bold bg-white/5 hover:bg-white/10 rounded-full transition-all flex items-center gap-3">
                      Add More Files
                   </button>
                </div>
             </div>
          </div>
        ) : (
          <DropZone 
            onDrop={handleConvert} 
            accept={{ "image/*": [] }} 
            multiple={processMode === 'batch'}
            label={processMode === 'batch' ? "Drop multiple images for batch conversion" : "Drop image to convert"}
          />
        )}
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
          onClick={() => { setFile(null); clearResultUrl(); }} 
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
