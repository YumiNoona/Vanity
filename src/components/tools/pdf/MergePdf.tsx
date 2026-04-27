import React, { useState, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, Layers, FileText, Trash2, ArrowUp, ArrowDown, Loader2, CheckCircle } from "lucide-react"
import { PDFDocument } from "pdf-lib"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"

import { motion, Reorder } from "framer-motion"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"

import { useObjectUrl } from "@/hooks/useObjectUrl"

interface PdfFile {
  id: string
  file: File
  name: string
  size: number
}

export function MergePdf() {
  const { limits, validateFiles } = usePremium()
  const [pdfs, setPdfs] = useState<PdfFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()

  const handleDrop = (files: File[]) => {
    if (!validateFiles(files, pdfs.length)) return

    const newPdfs = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      name: file.name,
      size: file.size
    }))
    setPdfs(prev => [...prev, ...newPdfs])
  }

  const removePdf = (id: string) => {
    setPdfs(prev => prev.filter(p => p.id !== id))
  }

  const movePdf = (index: number, direction: 'up' | 'down') => {
    const newPdfs = [...pdfs]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newPdfs.length) return
    
    [newPdfs[index], newPdfs[targetIndex]] = [newPdfs[targetIndex], newPdfs[index]]
    setPdfs(newPdfs)
  }

  const handleMerge = async () => {
    if (pdfs.length < 2) return
    setIsProcessing(true)
    
    try {
      const mergedPdf = await PDFDocument.create()
      
      for (const pdf of pdfs) {
        const arrayBuffer = await pdf.file.arrayBuffer()
        const loadedPdf = await PDFDocument.load(arrayBuffer)
        const copiedPages = await mergedPdf.copyPages(loadedPdf, loadedPdf.getPageIndices())
        copiedPages.forEach(page => mergedPdf.addPage(page))
      }
      
      const mergedPdfBytes = await mergedPdf.save()
      const blob = new Blob([mergedPdfBytes as any], { type: "application/pdf" })
      setResultUrl(blob)
      
      toast.success("PDFs merged successfully!")
      
    } catch (error: any) {
      console.error(error)
      toast.error("Failed to merge PDFs", {
        description: error?.message || "An unexpected error occurred."
      })
    } finally {
      setIsProcessing(false)
      // Help GC
      // @ts-ignore
      if (typeof mergedPdfBytes !== 'undefined') mergedPdfBytes = null
    }
  }

  const handleDownload = () => {
    if (!resultUrl) return
    const a = document.createElement("a")
    a.href = resultUrl
    a.download = `vanity-merged-${Date.now()}.pdf`
    a.click()
  }

  if (resultUrl && !isProcessing) {
    return (
      <ToolLayout
        title="Merge PDFs"
        description="Your new PDF is ready to download."
        icon={CheckCircle}
        centered={true}
      >
        <div className="max-w-2xl mx-auto py-8 text-center flex flex-col items-center animate-in zoom-in-95 duration-500">
          <div className="inline-flex items-center justify-center p-8 bg-accent/10 rounded-full mb-8 text-accent shadow-2xl border border-accent/20">
            <CheckCircle className="w-16 h-16" />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <button 
              onClick={handleDownload}
              className="px-12 py-5 text-lg font-black uppercase tracking-widest bg-accent text-accent-foreground hover:bg-accent/90 rounded-2xl shadow-[0_0_40px_rgba(252,211,77,0.3)] transition-all flex items-center gap-3 hover:scale-[1.02] active:scale-95 w-full md:w-auto justify-center"
            >
              <Download className="w-6 h-6" /> Export
            </button>
            <button 
              onClick={() => { setPdfs([]); clearResultUrl(); }}
              className="px-12 py-5 text-lg font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all w-full md:w-auto justify-center"
            >
              Start New
            </button>
          </div>
        </div>
      </ToolLayout>
    )
  }

  if (pdfs.length === 0) {
    return (
      <ToolUploadLayout
        title="Merge PDFs"
        description="Combine multiple PDF files into one. 100% locally on your machine."
        icon={Layers}
      >
        <DropZone 
          onDrop={handleDrop} 
          accept={{ "application/pdf": [".pdf"] }} 
          maxFiles={limits.maxFiles} 
          label="Drop PDF files here" 
        />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout
      title="Merge PDFs"
      description="Combine multiple PDF files into one. 100% locally on your machine."
      icon={Layers}
      centered={true}
    >
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">


        <div className="glass-panel p-6 rounded-xl space-y-6">
          <h3 className="font-bold font-syne flex items-center gap-2 border-b border-border/50 pb-4">
            <FileText className="w-5 h-5 text-accent" />
            Files to Merge ({pdfs.length} / {limits.maxFiles})
          </h3>
          
          <Reorder.Group axis="y" values={pdfs} onReorder={setPdfs} className="space-y-3">
            {pdfs.map((pdf, index) => (
              <Reorder.Item 
                key={pdf.id} 
                value={pdf}
                className="flex items-center gap-4 bg-white/5 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors cursor-grab active:cursor-grabbing group"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{pdf.name}</p>
                  <p className="text-xs text-muted-foreground">{(pdf.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); movePdf(index, 'up'); }}
                    disabled={index === 0}
                    className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); movePdf(index, 'down'); }}
                    disabled={index === pdfs.length - 1}
                    className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); removePdf(pdf.id); }}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>

          <div className="pt-4 flex justify-between items-center">
            <p className="text-xs text-muted-foreground italic">Drag files to reorder merge sequence</p>
            <button 
              onClick={handleMerge}
              disabled={pdfs.length < 2 || isProcessing}
              className="px-8 py-3 font-bold bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-[0_0_20px_rgba(252,211,77,0.2)] transition-all flex items-center gap-2"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Layers className="w-5 h-5" />}
              {isProcessing ? "Merging PDFs..." : "Merge PDFs now"}
            </button>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
