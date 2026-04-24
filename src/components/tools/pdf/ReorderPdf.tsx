import React, { useState, useRef } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, Loader2, ListOrdered, GripVertical, Trash2 } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { PDFDocument } from "pdf-lib"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"
import { Reorder, AnimatePresence } from "framer-motion"
import { downloadBlob } from "@/lib/canvas"

import { useObjectUrl } from "@/hooks/useObjectUrl"

interface PageItem {
  index: number
  id: string
}

export function ReorderPdf() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [pages, setPages] = useState<PageItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()
  const jobIdRef = useRef(0)

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return
    
    const jobId = ++jobIdRef.current
    setFile(uploadedFile)
    setIsProcessing(true)
    setResultUrl(null)

    try {
      const arrayBuffer = await uploadedFile.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      
      if (jobId !== jobIdRef.current) return

      const pageCount = pdfDoc.getPageCount()
      
      const pageItems: PageItem[] = Array.from({ length: pageCount }, (_, i) => ({
        index: i,
        id: `page-${i}-${Math.random()}`
      }))
      
      setPages(pageItems)
      toast.success(`PDF loaded with ${pageCount} pages`)
    } catch (error) {
      if (jobId === jobIdRef.current) {
        toast.error("Failed to load PDF structure")
        setFile(null)
      }
    } finally {
      if (jobId === jobIdRef.current) {
        setIsProcessing(false)
      }
    }
  }

  const handleApply = async () => {
    if (!file || pages.length === 0) return
    setIsProcessing(true)
    
    try {
      const arrayBuffer = await file.arrayBuffer()
      const srcDoc = await PDFDocument.load(arrayBuffer)
      const newDoc = await PDFDocument.create()
      
      const pageIndices = pages.map(p => p.index)
      const copiedPages = await newDoc.copyPages(srcDoc, pageIndices)
      
      copiedPages.forEach(p => newDoc.addPage(p))
      
      const pdfBytes = await newDoc.save()
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" })
      
      setResultUrl(blob)
      toast.success("PDF reordered successfully!")
    } catch (error) {
      toast.error("Failed to generate reordered PDF")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!resultUrl) return
    const a = document.createElement("a")
    a.href = resultUrl
    a.download = `vanity-reordered-${file?.name || "document.pdf"}`
    a.click()
  }

  const removePage = (id: string) => {
    setPages(pages.filter(p => p.id !== id))
  }

  if (!file) {
    return (
      <ToolUploadLayout title="Reorder PDF" description="Drag and drop to rearrange pages or remove unwanted ones before recompiling." icon={ListOrdered} iconColor="accent">
        <DropZone onDrop={handleDrop} accept={{ "application/pdf": [".pdf"] }} />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout title="Reorder PDF" description={file?.name} icon={ListOrdered} onBack={() => { setFile(null); clearResultUrl(); }} backLabel="Start Over">

      <div className="glass-panel p-6 rounded-xl min-h-[400px]">
        <Reorder.Group axis="y" values={pages} onReorder={setPages} className="space-y-3">
          <AnimatePresence>
            {pages.map((p, idx) => (
              <Reorder.Item 
                key={p.id} 
                value={p}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-xl cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors group"
              >
                <GripVertical className="text-muted-foreground group-hover:text-primary transition-colors" />
                <div className="w-10 h-10 rounded bg-accent/20 flex items-center justify-center font-bold text-accent">
                   {idx + 1}
                </div>
                <div className="flex-1">
                   <p className="text-sm font-medium">Original Page #{p.index + 1}</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); removePage(p.id); }}
                  className="p-2 hover:bg-destructive/20 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>

        {pages.length === 0 && !isProcessing && (
           <div className="py-20 text-center text-muted-foreground italic">
              All pages removed. Upload another PDF.
           </div>
        )}
      </div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-4">
        {!resultUrl ? (
          <button 
            onClick={handleApply}
            disabled={isProcessing || pages.length === 0}
            className="px-12 py-4 bg-accent text-accent-foreground font-bold rounded-full shadow-2xl hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="animate-spin" /> : <ListOrdered className="w-5 h-5" />}
            Compile PDF
          </button>
        ) : (
          <button 
            onClick={handleDownload}
            className="px-12 py-4 bg-primary text-primary-foreground font-bold rounded-full shadow-2xl hover:scale-105 transition-all flex items-center gap-2"
          >
            <Download className="w-5 h-5" /> Export
          </button>
        )}
      </div>
    </ToolLayout>
  )
}
