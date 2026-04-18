import React, { useState, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, Loader2, Images } from "lucide-react"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"

// Static imports (Isolated within this lazy-loaded tool chunk)
import * as pdfjsLib from "pdfjs-dist"
import JSZip from "jszip"


// Vite worker URL pattern
import pdfWorker from "pdfjs-dist/build/pdf.worker?url"

// Set worker source reliably
if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker
}

export function PdfToImages() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [resultZipUrl, setResultZipUrl] = useState<string | null>(null)
  const [pageCount, setPageCount] = useState(0)

  useEffect(() => {
    return () => {
      if (resultZipUrl) URL.revokeObjectURL(resultZipUrl)
    }
  }, [resultZipUrl])

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return

    setFile(uploadedFile)
    setResultZipUrl(null)
    setIsProcessing(true)
    setProgress(5)

    try {
      const arrayBuffer = await uploadedFile.arrayBuffer()
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise
      const count = pdf.numPages
      setPageCount(count)
      setProgress(10)

      const zip = new JSZip()

      for (let i = 1; i <= count; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 2.0 })

        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d")!
        canvas.height = viewport.height
        canvas.width = viewport.width

        await page.render({
          canvasContext: context,
          viewport,
          // @ts-ignore — pdfjs types require canvas but it's optional at runtime
          canvas: canvas,
        }).promise

        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), "image/png")
        })

        zip.file(`page-${i}.png`, blob)
        setProgress(Math.floor((i / count) * 85) + 10)

        // Release GPU memory immediately
        canvas.width = 0
        canvas.height = 0
      }

      const content = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(content)
      setResultZipUrl(url)
      setProgress(100)


      toast.success(`Converted ${count} pages to images!`)
    } catch (error: any) {
      console.error(error)
      toast.error("Failed to convert PDF: " + (error?.message || "Unknown error"))
      setProgress(0)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleStartNew = () => {
    if (resultZipUrl) URL.revokeObjectURL(resultZipUrl)
    setFile(null)
    setResultZipUrl(null)
    setProgress(0)
    setPageCount(0)
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
         <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6 text-primary">
            <Images className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1">PDF to Images</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Convert each page of your PDF into high-quality PNG images.
        </p>
        <DropZone onDrop={handleDrop} accept={{ "application/pdf": [] }} label="Drop PDF here" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-3xl font-bold font-syne mb-2">PDF to Images</h1>
          <p className="text-muted-foreground text-sm">File: {file.name}</p>
        </div>
        <button
          onClick={handleStartNew}
          className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Start New
        </button>
      </div>

      <div className="glass-panel p-8 rounded-xl flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
        {isProcessing && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur flex flex-col items-center justify-center z-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <h3 className="text-xl font-bold font-syne text-white">
              {progress > 10 ? `Converting Pages: ${progress}%` : "Loading PDF Engine..."}
            </h3>
            <div className="w-64 h-1.5 bg-white/10 rounded-full mt-4 overflow-hidden">
               <div
                 className="h-full bg-primary transition-all duration-300"
                 style={{ width: `${progress}%` }}
               />
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center max-w-xs">
              Processing {pageCount || "..."} pages locally in your browser.
            </p>
          </div>
        )}

        {resultZipUrl && !isProcessing && (
          <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
            <div className="inline-flex items-center justify-center p-8 bg-white/5 rounded-2xl mb-2">
               <Images className="w-20 h-20 text-primary opacity-50" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-syne">{pageCount} Images Generated</h2>
              <p className="text-muted-foreground mt-2">All pages have been converted to high-quality PNGs.</p>
            </div>

            <button
              onClick={() => {
                if (!resultZipUrl) return
                const a = document.createElement("a")
                a.href = resultZipUrl
                a.download = `vanity-pdf-images.zip`
                a.click()
              }}
              className="px-8 py-4 text-lg font-bold bg-primary text-primary-foreground rounded-full shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-3 mx-auto hover:scale-105"
            >
              <Download className="w-6 h-6" /> Download All Images (ZIP)
            </button>
          </div>
        )}

        {!isProcessing && !resultZipUrl && (
          <div className="text-center text-muted-foreground py-12">
            <Loader2 className="w-8 h-8 mx-auto mb-4 opacity-30" />
            <p>Processing will begin automatically...</p>
          </div>
        )}
      </div>
    </div>
  )
}
