import React, { useState, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, PaintBucket, Info, Loader2, FileArchive } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { useObjectUrl } from "@/hooks/useObjectUrl"
import { toast } from "sonner"
import { ModeToggle } from "@/components/shared/ModeToggle"
import { ProcessingQueue } from "@/components/shared/ProcessingQueue"
import type { QueueItem } from "@/types/bulk"
import { downloadBlob } from "@/lib/canvas/export"
import JSZip from "jszip"

import { releaseCanvas } from "@/lib/canvas/guards"

export function IccStripper() {
  const [file, setFile] = useState<File | null>(null)
  const { url: imgUrl, setUrl: setImgUrl, clear: clearImgUrl } = useObjectUrl()
  const { url: strippedUrl, setUrl: setStrippedUrl, clear: clearStrippedUrl } = useObjectUrl()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDone, setIsDone] = useState(false)

  // Bulk State
  const [processMode, setProcessMode] = useState<'single' | 'batch'>('single')
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)

  const runStrip = (inputFile: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(inputFile)
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")
        if (!ctx) { 
          URL.revokeObjectURL(objectUrl)
          reject(new Error("No canvas context"))
          return 
        }
        ctx.drawImage(img, 0, 0)
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(objectUrl)
          releaseCanvas(canvas) // Release GPU memory
          if (blob) resolve(blob)
          else reject(new Error("Blob creation failed"))
        }, inputFile.type || "image/png", 1.0)
      }
      img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Image load failed")) }
      img.src = objectUrl
    })
  }

  const handleDrop = async (files: File[]) => {
    if (files.length === 0) return

    if (processMode === 'single') {
      const f = files[0]
      setFile(f)
      setImgUrl(f)
      setIsDone(false)
      clearStrippedUrl()
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

  const handleProcess = async () => {
    if (!imgUrl) return
    setIsProcessing(true)
    try {
      const blob = await runStrip(file!)
      setStrippedUrl(blob)
      setIsDone(true)
      toast.success("ICC profile stripped!")
    } catch {
      toast.error("Failed to strip ICC profile")
    } finally {
      setIsProcessing(false)
    }
  }

  const processBatch = async () => {
    if (isBatchProcessing || queue.filter(i => i.status === 'pending').length === 0) return
    
    setIsBatchProcessing(true)
    const pendingItems = queue.filter(i => i.status === 'pending')

    for (const item of pendingItems) {
      setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'processing' } : q))
      
      try {
        const result = await runStrip(item.file)
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
          errorMessage: "Failed to strip" 
        } : q))
      }
    }
    
    setIsBatchProcessing(false)
    toast.success("Batch stripping complete!")
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
      zip.file(`srgb-${item.file.name}`, item.resultBlob!)
    })

    const content = await zip.generateAsync({ type: "blob" })
    downloadBlob(content, `vanity-icc-stripped-${Date.now()}.zip`)
    toast.success(`Downloaded ${doneItems.length} images`)
  }

  const handleDownload = () => {
    if (!strippedUrl || !file) return
    const a = document.createElement("a")
    a.href = strippedUrl
    a.download = `vanity-srgb-${file.name}`
    a.click()
  }

  const handleBack = () => {
    setFile(null)
    setQueue([])
    clearImgUrl()
    clearStrippedUrl()
    setIsDone(false)
  }

  // Landing state
  if (!file && !(processMode === 'batch' && queue.length > 0)) {
    return (
      <ToolUploadLayout title="ICC Profile Stripper" description="Remove embedded color profiles from images to guarantee consistent rendering across devices." icon={PaintBucket}>
         <ModeToggle id="icc" mode={processMode} onChange={(m) => {
           setProcessMode(m)
           setFile(null)
           setQueue([])
           clearImgUrl()
           clearStrippedUrl()
           setIsDone(false)
         }} />

         <DropZone 
           onDrop={handleDrop} 
           accept={{ "image/*": [] }} 
           multiple={processMode === 'batch'}
           label={processMode === 'batch' ? "Drop multiple images to strip ICC profiles" : "Drop image to strip"}
         />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout
      title={processMode === 'batch' ? "Batch ICC Strip" : "ICC Profile Stripper"}
      description={processMode === 'batch' ? `${queue.length} images queued` : `Target: ${file?.name}`}
      icon={PaintBucket}
      onBack={handleBack}
      backLabel="Start Over"
      maxWidth="max-w-6xl"
    >
      {processMode === 'batch' ? (
        <div className="space-y-8">
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
                   onChange={(e) => e.target.files && handleDrop(Array.from(e.target.files))}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <button className="px-8 py-4 text-lg font-bold bg-white/5 hover:bg-white/10 rounded-full transition-all flex items-center gap-3">
                   Add More Files
                </button>
             </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-8 rounded-3xl flex flex-col md:flex-row gap-8 items-center border-fuchsia-500/20 shadow-[0_0_50px_rgba(217,70,239,0.05)]">
           <div className="w-full md:w-1/2 aspect-square rounded-2xl overflow-hidden bg-black/40 border border-white/5 relative flex flex-col outline-none">
              {isProcessing ? (
                 <div className="w-full h-full flex flex-col items-center justify-center relative">
                   <div className="absolute inset-0 bg-fuchsia-500/5 transition-all animate-pulse" />
                   <Loader2 className="w-8 h-8 animate-spin text-fuchsia-400 z-10" />
                 </div>
              ) : (
                 <img src={isDone && strippedUrl ? strippedUrl : imgUrl!} className="w-full h-full object-contain" alt="Target" />
              )}
              {isDone && (
                <div className="absolute top-4 left-4 px-3 py-1 bg-green-500/20 text-green-400 font-bold text-[10px] tracking-widest uppercase rounded">
                  sRGB Profile Applied
                </div>
              )}
           </div>

           <div className="w-full md:w-1/2 space-y-6">
              <div className="space-y-4">
                 <div className="flex items-start gap-3 p-4 bg-blue-500/10 text-blue-100 rounded-xl border border-blue-500/20">
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm leading-relaxed">
                       <strong className="text-blue-300 block mb-1">What this actually does:</strong>
                       This tool draws your image onto a browser canvas and immediately exports it. This action intentionally drops custom embedded ICC profiles metadata, effectively converting and normalizing all arrays to the web-standard <strong className="text-white">sRGB</strong> color space.
                    </div>
                 </div>
                 <p className="text-xs text-muted-foreground italic px-2">
                   * You may notice a slight visual color shift. This shift represents exactly what standard web browsers and unmanaged devices would have rendered anyway.
                 </p>
              </div>

              {!isDone ? (
                 <button 
                   onClick={handleProcess}
                   disabled={isProcessing}
                   className="w-full py-4 bg-fuchsia-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:bg-fuchsia-400 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0 text-sm flex items-center justify-center gap-2"
                 >
                   {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Normalizing format...</> : "Normalize to sRGB Space"}
                 </button>
              ) : (
                 <button 
                   onClick={handleDownload}
                   className="w-full py-4 bg-green-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:bg-green-400 hover:-translate-y-1 transition-all text-sm flex items-center justify-center gap-2"
                 >
                   <Download className="w-5 h-5" /> Download sRGB Image
                 </button>
              )}
           </div>
        </div>
      )}
    </ToolLayout>
  )
}
