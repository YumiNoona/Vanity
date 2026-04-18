import React, { useState } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, Loader2, ListOrdered, GripVertical, Trash2 } from "lucide-react"
import { PDFDocument } from "pdf-lib"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"
import { Reorder, AnimatePresence } from "framer-motion"
import { downloadBlob } from "@/lib/canvas"

interface PageItem {
  index: number
  id: string
}

export function ReorderPdf() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [pages, setPages] = useState<PageItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return
    
    setFile(uploadedFile)
    setIsProcessing(true)
    setResultBlob(null)

    try {
      const arrayBuffer = await uploadedFile.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      const pageCount = pdfDoc.getPageCount()
      
      const pageItems: PageItem[] = Array.from({ length: pageCount }, (_, i) => ({
        index: i,
        id: `page-${i}-${Math.random()}`
      }))
      
      setPages(pageItems)
      toast.success(`PDF loaded with ${pageCount} pages`)
    } catch (error) {
      toast.error("Failed to load PDF structure")
      setFile(null)
    } finally {
      setIsProcessing(false)
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
      
      setResultBlob(blob)
      toast.success("PDF reordered successfully!")
    } catch (error) {
      toast.error("Failed to generate reordered PDF")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!resultBlob) return
    downloadBlob(resultBlob, `vanity-reordered-${file?.name || "document.pdf"}`)
  }

  const removePage = (id: string) => {
    setPages(pages.filter(p => p.id !== id))
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
         <div className="inline-flex items-center justify-center p-3 bg-accent/10 rounded-full mb-6 text-accent">
            <ListOrdered className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1">Reorder PDF</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Drag and drop to rearrange pages or remove unwanted ones before recompiling.
        </p>
        <DropZone onDrop={handleDrop} accept={{ "application/pdf": [".pdf"] }} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-accent/10 rounded-lg text-accent border border-accent/20">
             <ListOrdered className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-syne text-foreground">Reorder PDF</h1>
            <p className="text-muted-foreground text-sm">{file?.name}</p>
          </div>
        </div>
        <button onClick={() => { setFile(null); setResultBlob(null); }} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Start Over
        </button>
      </div>

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
        {!resultBlob ? (
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
            <Download className="w-5 h-5" /> Download Result
          </button>
        )}
      </div>
    </div>
  )
}
