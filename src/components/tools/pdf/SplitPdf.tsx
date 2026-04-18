import React, { useState, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, Loader2, SplitSquareHorizontal, FileText } from "lucide-react"
import { PDFDocument } from "pdf-lib"
import JSZip from "jszip"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"

export function SplitPdf() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
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
    setIsProcessing(true)

    try {
      const arrayBuffer = await uploadedFile.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      const count = pdfDoc.getPageCount()
      setPageCount(count)
      
      const zip = new JSZip()
      
      for (let i = 0; i < count; i++) {
        const newPdf = await PDFDocument.create()
        const [copiedPage] = await newPdf.copyPages(pdfDoc, [i])
        newPdf.addPage(copiedPage)
        const pdfBytes = await newPdf.save()
        zip.file(`page-${i + 1}.pdf`, pdfBytes)
      }
      
      const content = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(content)
      setResultZipUrl(url)
      
      toast.success("PDF split successfully!")

    } catch (error: any) {
      console.error(error)
      toast.error("Failed to split PDF")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!resultZipUrl) return
    const a = document.createElement("a")
    a.href = resultZipUrl
    a.download = `vanity-split-pdf.zip`
    a.click()
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
         <div className="inline-flex items-center justify-center p-3 bg-accent/10 rounded-full mb-6 text-accent">
            <SplitSquareHorizontal className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1">Split PDF</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Extract every page of your PDF as a separate file.
        </p>
        <DropZone onDrop={handleDrop} accept={{ "application/pdf": [".pdf"] }} label="Drop PDF here" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-3xl font-bold font-syne mb-2">Split PDF</h1>
          <p className="text-muted-foreground text-sm">File: {file.name}</p>
        </div>
        <button 
          onClick={() => { setFile(null); setResultZipUrl(null); }} 
          className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Start New
        </button>
      </div>

      <div className="glass-panel p-8 rounded-xl flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
        {isProcessing && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur flex flex-col items-center justify-center z-10 transition-opacity">
            <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
            <h3 className="text-xl font-bold font-syne animate-pulse text-white">Splitting PDF...</h3>
            <p className="text-sm text-muted-foreground mt-2">Processing {pageCount} pages locally</p>
          </div>
        )}

        {resultZipUrl && !isProcessing && (
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center p-8 bg-white/5 rounded-2xl mb-2">
               <FileText className="w-20 h-20 text-accent opacity-50" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-syne">{pageCount} Pages Extracted</h2>
              <p className="text-muted-foreground mt-2">Your pages have been compressed into a ZIP file.</p>
            </div>
            
            <button 
              onClick={handleDownload}
              className="px-8 py-4 text-lg font-bold bg-accent text-accent-foreground hover:bg-accent/90 rounded-full shadow-[0_0_30px_rgba(252,211,77,0.3)] transition-all flex items-center justify-center gap-3 mx-auto hover:scale-105"
            >
              <Download className="w-6 h-6" /> Download ZIP Archive
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
