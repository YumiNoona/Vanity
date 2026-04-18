import React, { useState, useCallback } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, FileMinus, Download, RefreshCw, Layers, ShieldCheck } from "lucide-react"
import * as pdfjsLib from "pdfjs-dist"
import { PDFDocument } from "pdf-lib"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Set up worker
import pdfWorker from "pdfjs-dist/build/pdf.worker?url"
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

export function RemoveBlankPages() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [resultPdf, setResultPdf] = useState<Uint8Array | null>(null)
  const [removedCount, setRemovedCount] = useState(0)

  const handleDrop = async (files: File[]) => {
    if (files[0]) {
      setFile(files[0])
      processPdf(files[0])
    }
  }

  const isPageBlank = async (page: any) => {
    const viewport = page.getViewport({ scale: 0.5 })
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!
    canvas.width = viewport.width
    canvas.height = viewport.height

    await page.render({ canvasContext: ctx, viewport }).promise

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    // Check pixel density
    let nonWhitePixels = 0
    const threshold = 250 // Almost white
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2]
      if (r < threshold || g < threshold || b < threshold) {
        nonWhitePixels++
      }
    }

    const density = nonWhitePixels / (canvas.width * canvas.height)
    return density < 0.001 // Threshold for "blank" (0.1% of pixels)
  }

  const processPdf = useCallback(async (pdfFile: File) => {
    setIsProcessing(true)
    setProgress(0)
    setRemovedCount(0)

    try {
      const arrayBuffer = await pdfFile.arrayBuffer()
      
      // 1. Scan for blank pages using pdfjs-dist
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise
      const blankPages: number[] = []

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const blank = await isPageBlank(page)
        if (blank) blankPages.push(i - 1) // 0-indexed for pdf-lib
        setProgress(Math.round((i / pdf.numPages) * 50))
      }

      // 2. Remove discovered pages using pdf-lib
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      
      // Remove in reverse order to keep indices valid
      for (let i = blankPages.length - 1; i >= 0; i--) {
        pdfDoc.removePage(blankPages[i])
        setProgress(50 + Math.round(((blankPages.length - i) / blankPages.length) * 50))
      }

      const savedPdf = await pdfDoc.save()
      setResultPdf(savedPdf)
      setRemovedCount(blankPages.length)
      
      if (blankPages.length > 0) {
        toast.success(`Stripped ${blankPages.length} blank pages!`)
      } else {
        toast.info("No blank pages detected.")
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to process PDF.")
    } finally {
      setIsProcessing(false)
      setProgress(100)
    }
  }, [])

  const handleDownload = () => {
    if (!resultPdf) return
    const blob = new Blob([new Uint8Array(resultPdf) as any], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `vanity-stripped-${file?.name}`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center animate-in fade-in duration-500">
         <div className="inline-flex items-center justify-center p-3 bg-red-500/10 rounded-full mb-6 text-red-500">
            <FileMinus className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1 text-white">Remove Blank Pages</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Auto-detect and strip fully white or empty pages from your PDF documents.
        </p>
        <DropZone onDrop={handleDrop} accept={{ "application/pdf": [".pdf"] }} label="Drop PDF to sanitize" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 sm:px-0 pb-20">
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
             <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-syne text-white">Sanitization Hub</h1>
            <p className="text-muted-foreground text-sm">{file.name}</p>
          </div>
        </div>
        <button onClick={() => setFile(null)} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Start New
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8">
           <div className="glass-panel p-12 rounded-[2.5rem] flex flex-col items-center justify-center min-h-[400px] bg-black/40 border-white/5 shadow-2xl relative overflow-hidden">
              {isProcessing ? (
                <div className="space-y-6 text-center z-10">
                   <div className="relative inline-block">
                      <RefreshCw className="w-20 h-20 text-red-500 animate-spin opacity-20" />
                      <div className="absolute inset-0 flex items-center justify-center font-mono text-xl font-bold text-red-500">
                         {progress}%
                      </div>
                   </div>
                   <div className="space-y-1">
                      <p className="text-lg font-bold text-white font-syne tracking-tight">Detecting Empty Pixels...</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">Scanning all pages in browser memory</p>
                   </div>
                </div>
              ) : (
                <div className="space-y-8 text-center z-10 animate-in zoom-in-95 duration-500">
                   <div className="p-6 bg-emerald-500/10 rounded-full inline-block text-emerald-500 border border-emerald-500/20">
                      <ShieldCheck className="w-12 h-12" />
                   </div>
                   <div className="space-y-2">
                      <h2 className="text-4xl font-bold font-syne text-white">Cleaned PDF Ready</h2>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Verification complete. We identified and removed <strong>{removedCount}</strong> blank pages from your document.
                      </p>
                   </div>
                   <button 
                     onClick={handleDownload}
                     className="px-12 py-5 bg-red-500 text-white font-bold rounded-2xl shadow-xl shadow-red-500/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-4 mx-auto"
                   >
                     <Download className="w-6 h-6" />
                     Download Sanitized PDF
                   </button>
                </div>
              )}
           </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="p-8 glass-panel rounded-3xl space-y-6 border-white/10">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                 Detection Engine
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                 Our <strong>Sparse Pixel Density</strong> algorithm renders each page onto a hidden canvas at 50% scale and performs a bitwise analysis of RGB values. 
              </p>
              <div className="space-y-3">
                 <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-tight">Threshold: 0.1% ink coverage</span>
                 </div>
                 <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-tight">Engine: PDF-Lib + Canvas API</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
