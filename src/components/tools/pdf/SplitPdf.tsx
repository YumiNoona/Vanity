import React, { useState, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, Loader2, SplitSquareHorizontal, FileText, Trash2, Layers } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"
import { prewarmPdf } from "@/lib/pdf-text"
import { useObjectUrl } from "@/hooks/useObjectUrl"
import { PillToggle } from "@/components/shared/PillToggle"
import { downloadBlob } from "@/lib/canvas/export"

interface PdfFile {
  id: string
  file: File
  name: string
}

export function SplitPdf() {
  const { validateFiles } = usePremium()
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single")
  
  // Single mode state
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()
  const [pageCount, setPageCount] = useState(0)
  
  // Bulk mode state
  const [bulkFiles, setBulkFiles] = useState<PdfFile[]>([])
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)
  const [bulkResults, setBulkResults] = useState<{file: File, blob: Blob}[]>([])
  const [bulkProgress, setBulkProgress] = useState(0)

  useEffect(() => {
    prewarmPdf()
  }, [])

  const handleDrop = async (files: File[]) => {
    if (activeTab === "bulk") {
      if (!validateFiles(files, bulkFiles.length)) return
      const newFiles = files.map(file => ({
        id: Math.random().toString(36).substring(7),
        file,
        name: file.name
      }))
      setBulkFiles(prev => [...prev, ...newFiles])
      setBulkResults([])
      setBulkProgress(0)
      return
    }

    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return
    
    setFile(uploadedFile)
    setIsProcessing(true)
    clearResultUrl()

    try {
      const { PDFDocument } = await import("pdf-lib")
      const JSZipModule = await import("jszip")
      const JSZip = JSZipModule.default

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
      setResultUrl(content)
      
      toast.success("PDF split successfully!")

    } catch (error: any) {
      console.error(error)
      toast.error("Failed to split PDF")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkProcess = async () => {
    if (bulkFiles.length === 0) return
    setIsBulkProcessing(true)
    setBulkProgress(0)
    setBulkResults([])

    try {
      const { PDFDocument } = await import("pdf-lib")
      const JSZipModule = await import("jszip")
      const JSZip = JSZipModule.default

      const results: {file: File, blob: Blob}[] = []

      for (let i = 0; i < bulkFiles.length; i++) {
        const pdfItem = bulkFiles[i]
        const arrayBuffer = await pdfItem.file.arrayBuffer()
        const pdfDoc = await PDFDocument.load(arrayBuffer)
        const count = pdfDoc.getPageCount()
        const zip = new JSZip()
        const baseName = pdfItem.name.replace(/\.pdf$/i, '')
        
        for (let j = 0; j < count; j++) {
          const newPdf = await PDFDocument.create()
          const [copiedPage] = await newPdf.copyPages(pdfDoc, [j])
          newPdf.addPage(copiedPage)
          const pdfBytes = await newPdf.save()
          zip.file(`${baseName}-page-${j + 1}.pdf`, pdfBytes)
        }
        
        const content = await zip.generateAsync({ type: "blob" })
        results.push({ file: pdfItem.file, blob: content })
        setBulkProgress(Math.round(((i + 1) / bulkFiles.length) * 100))
      }

      setBulkResults(results)
      toast.success(`Successfully split ${bulkFiles.length} files!`)

    } catch (error: any) {
      console.error(error)
      toast.error("Failed to split PDFs")
    } finally {
      setIsBulkProcessing(false)
    }
  }

  const handleDownloadZip = async () => {
    if (bulkResults.length === 0) return
    const JSZipModule = await import("jszip")
    const JSZip = JSZipModule.default
    const zip = new JSZip()
    
    bulkResults.forEach(res => {
      const baseName = res.file.name.replace(/\.pdf$/i, '')
      zip.file(`${baseName}-split.zip`, res.blob)
    })

    const content = await zip.generateAsync({ type: "blob" })
    downloadBlob(content, "vanity-split-pdfs.zip")
  }

  const removeBulkFile = (id: string) => {
    setBulkFiles(prev => prev.filter(f => f.id !== id))
  }

  const handleBack = () => {
    if (activeTab === "single") {
      setFile(null)
      clearResultUrl()
    } else {
      setBulkFiles([])
      setBulkResults([])
      setBulkProgress(0)
    }
  }

  const renderTabSwitcher = () => (
    <div className="mb-10 flex justify-center">
      <PillToggle
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as any)}
        options={[
          { id: "single", label: "Single PDF", icon: SplitSquareHorizontal },
          { id: "bulk", label: "Bulk PDF", icon: Layers }
        ]}
      />
    </div>
  )

  if (activeTab === "single" && !file) {
    return (
      <ToolUploadLayout title="Split PDF" description="Extract every page of your PDF as separate files." icon={SplitSquareHorizontal}>
        {renderTabSwitcher()}
        <DropZone onDrop={handleDrop} accept={{ "application/pdf": [".pdf"] }} label="Drop PDF here" />
      </ToolUploadLayout>
    )
  }

  if (activeTab === "bulk" && bulkFiles.length === 0) {
    return (
      <ToolUploadLayout title="Bulk Split PDF" description="Extract pages from multiple PDFs at once." icon={Layers}>
        {renderTabSwitcher()}
        <DropZone onDrop={handleDrop} accept={{ "application/pdf": [".pdf"] }} label="Drop multiple PDFs" multiple />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout
      title={activeTab === "single" ? "Split PDF" : "Bulk Split PDF"}
      description={activeTab === "single" ? `File: ${file?.name}` : `Processing: ${bulkFiles.length} files`}
      icon={activeTab === "single" ? SplitSquareHorizontal : Layers}
      centered={true}
      maxWidth="max-w-4xl"
    >
      <div className="mb-10 flex justify-center">
        <PillToggle
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as any)}
          options={[
            { id: "single", label: "Single PDF", icon: SplitSquareHorizontal },
            { id: "bulk", label: "Bulk PDF", icon: Layers }
          ]}
        />
      </div>

      {activeTab === "single" ? (
        <div className="glass-panel p-8 rounded-xl flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
          {isProcessing && (
            <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center z-20 text-center">
              <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
              <h3 className="text-xl font-bold font-syne animate-pulse text-white">Splitting PDF...</h3>
              <p className="text-sm text-muted-foreground mt-2">Processing {pageCount} pages locally</p>
            </div>
          )}

          {resultUrl && !isProcessing && (
            <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
              <div className="inline-flex items-center justify-center p-8 bg-white/5 rounded-2xl mb-2">
                 <FileText className="w-20 h-20 text-accent opacity-50" />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-syne">{pageCount} Pages Extracted</h2>
                <p className="text-muted-foreground mt-2">Your pages have been compressed into a ZIP file.</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => {
                    if (!resultUrl) return
                    const a = document.createElement("a")
                    a.href = resultUrl
                    a.download = "vanity-split-pdf.zip"
                    a.click()
                  }}
                  className="px-8 py-4 text-lg font-bold bg-accent text-accent-foreground hover:bg-accent/90 rounded-full shadow-[0_0_30px_rgba(252,211,77,0.3)] transition-all flex items-center justify-center gap-3 hover:scale-105"
                >
                  <Download className="w-6 h-6" /> Export
                </button>
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
      ) : (
        <div className="glass-panel p-8 rounded-xl space-y-6">
          {isBulkProcessing && (
            <div className="p-6 bg-accent/10 border-b border-accent/20 text-accent rounded-2xl">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <div className="flex justify-between w-full text-[10px] font-bold">
                  <span>SPLITTING PDFS...</span>
                  <span>{bulkProgress}%</span>
                </div>
              </div>
            </div>
          )}

          {bulkResults.length > 0 && !isBulkProcessing ? (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center p-8 bg-white/5 rounded-2xl mb-2">
                 <FileText className="w-20 h-20 text-accent opacity-50" />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-syne">{bulkFiles.length} Files Split</h2>
                <p className="text-muted-foreground mt-2">All files processed and ready for download.</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={handleDownloadZip}
                  className="px-8 py-4 text-lg font-bold bg-accent text-accent-foreground hover:bg-accent/90 rounded-full shadow-[0_0_30px_rgba(252,211,77,0.3)] transition-all flex items-center justify-center gap-3 hover:scale-105"
                >
                  <Download className="w-6 h-6" /> Download All
                </button>
                <button 
                  onClick={handleBack}
                  className="px-8 py-4 text-lg font-bold bg-white/5 hover:bg-white/10 text-white rounded-full border border-white/10 transition-all flex items-center justify-center"
                >
                  Start New
                </button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="font-bold font-syne flex items-center gap-2 border-b border-border/50 pb-4">
                <FileText className="w-5 h-5 text-accent" />
                Files to Split ({bulkFiles.length})
              </h3>

              <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                {bulkFiles.map((pdf) => (
                  <div key={pdf.id} className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                    <span className="text-sm truncate">{pdf.name}</span>
                    {!isBulkProcessing && (
                      <button onClick={() => removeBulkFile(pdf.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button 
                onClick={handleBulkProcess}
                disabled={isBulkProcessing || bulkFiles.length === 0}
                className="w-full px-8 py-4 font-bold bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-[0_0_20px_rgba(252,211,77,0.2)] transition-all flex items-center justify-center gap-2"
              >
                {isBulkProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <SplitSquareHorizontal className="w-5 h-5" />}
                {isBulkProcessing ? "Splitting PDFs..." : "Split PDFs Now"}
              </button>
            </>
          )}
        </div>
      )}
    </ToolLayout>
  )
}
