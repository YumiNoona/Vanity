import React, { useState, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, Loader2, SplitSquareHorizontal, FileText } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { PDFDocument } from "pdf-lib"
import JSZip from "jszip"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"

import { useObjectUrl } from "@/hooks/useObjectUrl"

export function SplitPdf() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const { url: resultZipUrl, setUrl: setResultZipUrl, clear: clearResultZipUrl } = useObjectUrl()
  const [pageCount, setPageCount] = useState(0)

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return
    
    setFile(uploadedFile)
    setIsProcessing(true)
    clearResultZipUrl()

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
      setResultZipUrl(content)
      
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

  const handleBack = () => {
    setFile(null)
    clearResultZipUrl()
  }

  if (!file) {
    return (
      <ToolUploadLayout title="Split PDF" description="Extract every page of your PDF as a separate file." icon={SplitSquareHorizontal}>
        <DropZone onDrop={handleDrop} accept={{ "application/pdf": [".pdf"] }} label="Drop PDF here" />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout title="Split PDF" description={`File: ${file.name}`} icon={SplitSquareHorizontal} centered={true}>
      <div className="glass-panel p-8 rounded-xl flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
        {isProcessing && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur flex flex-col items-center justify-center z-10 transition-opacity">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <h3 className="text-xl font-bold font-syne animate-pulse text-white">Splitting PDF...</h3>
            <p className="text-sm text-muted-foreground mt-2">Processing {pageCount} pages locally</p>
          </div>
        )}

        {resultZipUrl && !isProcessing && (
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center p-8 bg-white/5 rounded-2xl mb-2">
               <FileText className="w-20 h-20 text-primary opacity-50" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-syne">{pageCount} Pages Extracted</h2>
              <p className="text-muted-foreground mt-2">Your pages have been compressed into a ZIP file.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handleDownload}
                className="px-8 py-4 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-[0_0_30px_rgba(252,211,77,0.3)] transition-all flex items-center justify-center gap-3 hover:scale-105"
              >
                <Download className="w-6 h-6" /> Export </button>
              <button 
                onClick={handleBack}
                className="px-8 py-4 text-lg font-bold bg-white/5 hover:bg-white/10 text-white rounded-full border border-white/10 transition-all flex items-center justify-center"
              >
                Start New
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
