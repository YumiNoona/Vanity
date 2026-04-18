import React, { useState, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, Loader2, ShieldCheck, Info, FileArchive } from "lucide-react"
import { usePremium } from "@/hooks/usePremium"
import { useImageProcessor } from "@/hooks/useImageProcessor"
import { drawToCanvas, exportCanvas, downloadBlob } from "@/lib/canvas"
import { toast } from "sonner"
import { ModeToggle } from "@/components/shared/ModeToggle"
import { ProcessingQueue } from "@/components/shared/ProcessingQueue"
import type { QueueItem } from "@/types/bulk"
import JSZip from "jszip"

export function ExifSanitizer() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const { isProcessing, processImage } = useImageProcessor()
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)

  // Bulk State
  const [processMode, setProcessMode] = useState<'single' | 'batch'>('single')
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)

  const runSanitize = async (inputFile: File): Promise<Blob> => {
    const result = await processImage(inputFile)
    if (!result) throw new Error("Failed to load image")

    try {
      const canvas = document.createElement("canvas")
      await drawToCanvas(result.source, canvas, { clear: true })
      const blob = await exportCanvas(canvas, inputFile.type, 1.0)
      result.cleanup()
      return blob
    } catch (err) {
      result.cleanup()
      throw err
    }
  }

  const handleProcess = async (files: File[]) => {
    if (files.length === 0) return
    if (!validateFiles(files)) return

    if (processMode === 'single') {
      const uploadedFile = files[0]
      setFile(uploadedFile)
      
      try {
        const blob = await runSanitize(uploadedFile)
        setResultBlob(blob)
        toast.success("Metadata sanitized successfully!")
      } catch (error) {
        toast.error("Failed to sanitize metadata")
      }
    } else {
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
        const result = await runSanitize(item.file)
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
          errorMessage: "Failed to sanitize" 
        } : q))
      }
    }
    
    setIsBatchProcessing(false)
    toast.success("Batch sanitization complete!")
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
      zip.file(`sanitized-${item.file.name}`, item.resultBlob!)
    })

    const content = await zip.generateAsync({ type: "blob" })
    downloadBlob(content, `vanity-sanitized-batch-${Date.now()}.zip`)
    toast.success(`Downloaded ${doneItems.length} sanitized images`)
  }

  const handleDownload = () => {
    if (!resultBlob) return
    downloadBlob(resultBlob, `vanity-sanitized-${file?.name}`)
  }

  // Landing state
  if (!file && !(processMode === 'batch' && queue.length > 0)) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
         <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6 text-primary">
            <ShieldCheck className="w-8 h-8" />
         </div>
        <h1 className="text-3xl font-bold font-syne mb-1">EXIF Sanitizer</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Protect your privacy by removing hidden GPS and device metadata from photos.
        </p>

        <ModeToggle mode={processMode} onChange={(m) => {
          setProcessMode(m)
          setFile(null)
          setQueue([])
          setResultBlob(null)
        }} />

        <DropZone 
          onDrop={handleProcess} 
          accept={{ "image/*": [] }} 
          multiple={processMode === 'batch'}
          label={processMode === 'batch' ? "Drop multiple images to sanitize" : "Drop image to sanitize"}
        />
      </div>
    )
  }

  // Batch queue view
  if (processMode === 'batch' && queue.length > 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
               <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-syne text-white">Batch Sanitize</h1>
              <p className="text-muted-foreground text-sm font-mono">{queue.length} images queued</p>
            </div>
          </div>
          <button onClick={() => { setQueue([]); }} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Start Fresh
          </button>
        </div>

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
                 onChange={(e) => e.target.files && handleProcess(Array.from(e.target.files))}
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <button className="px-8 py-4 text-lg font-bold bg-white/5 hover:bg-white/10 rounded-full transition-all flex items-center gap-3">
                 Add More Files
              </button>
           </div>
        </div>
      </div>
    )
  }

  // Single result view
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-3xl font-bold font-syne mb-2">Privacy Shield</h1>
          <p className="text-muted-foreground text-sm">Target: {file?.name}</p>
        </div>
        <button onClick={() => { setFile(null); setResultBlob(null); }} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Start Over
        </button>
      </div>

      <div className="glass-panel p-12 rounded-xl flex flex-col items-center justify-center min-h-[400px]">
        {isProcessing ? (
          <div className="flex flex-col items-center animate-in fade-in">
             <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
             <p className="text-lg font-syne font-bold">Removing Metadata...</p>
          </div>
        ) : (
          <div className="text-center space-y-8 animate-in zoom-in-95">
             <div className="p-8 bg-primary/10 rounded-full inline-block text-primary">
                <ShieldCheck className="w-16 h-16" />
             </div>
             <div>
               <h2 className="text-2xl font-bold font-syne mb-2">Image Sanitized!</h2>
               <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                 All GPS location data, camera settings, and unique device IDs have been stripped. Your image is now safe to share.
               </p>
             </div>
             
             <button 
               onClick={handleDownload}
               className="px-12 py-4 bg-primary text-primary-foreground font-bold rounded-full shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 mx-auto"
             >
               <Download className="w-5 h-5" /> Download Safe Image
             </button>
          </div>
        )}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4">
         <Info className="w-5 h-5 text-primary shrink-0 mt-1" />
         <div className="space-y-1">
            <h4 className="text-sm font-bold">Why sanitize?</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Most smartphones embed your exact location (latitude/longitude) into every photo you take. 
              Vanity creates a fresh pixel-for-pixel copy of your image while leaving the metadata behind.
            </p>
         </div>
      </div>
    </div>
  )
}
