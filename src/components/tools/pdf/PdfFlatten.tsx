import React, { useState, useCallback, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, FileCheck, Download, RefreshCw, FileText, CheckCircle, Loader2 } from "lucide-react"
import { PDFDocument } from "pdf-lib"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { toBlob } from "@/lib/utils/blob"

// Static worker import for pdfjs
import * as pdfjsLib from "pdfjs-dist"
import pdfWorker from "pdfjs-dist/build/pdf.worker?url"

if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker
}

import { useObjectUrl } from "@/hooks/useObjectUrl"

export function PdfFlatten() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isRendering, setIsRendering] = useState(false)
  const { url: previewUrl, setUrl: setPreviewUrl, clear: clearPreviewUrl } = useObjectUrl()
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()


  const renderPreview = async (file: File) => {
    setIsRendering(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const page = await pdf.getPage(1)
      const viewport = page.getViewport({ scale: 1.2 })
      
      const canvas = document.createElement("canvas")
      const context = canvas.getContext("2d")!
      canvas.width = viewport.width
      canvas.height = viewport.height
      
      await (page.render({ canvasContext: context, viewport } as any)).promise
      
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"))
      setPreviewUrl(blob)
      
      canvas.width = 0
      canvas.height = 0
    } catch (err) {
      console.error("Preview failed:", err)
    } finally {
      setIsRendering(false)
    }
  }

  const handleDrop = async (files: File[]) => {
    if (files[0]) {
      const uploadedFile = files[0]
      setFile(uploadedFile)
      setResultUrl(null)
      renderPreview(uploadedFile)
    }
  }

  const flattenPdf = useCallback(async () => {
    if (!file) return
    setIsProcessing(true)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      
      const form = pdfDoc.getForm()
      const fieldCount = form.getFields().length
      
      if (fieldCount === 0) {
        toast.info("No interactive fields found. Document might already be flat.")
      }

      form.flatten()

      const savedPdfArr = await pdfDoc.save()
      const blob = toBlob(savedPdfArr, "application/pdf")
      setResultUrl(blob)
      toast.success("PDF flattened successfully!")
    } catch (error) {
      console.error(error)
      toast.error("Failed to flatten PDF. It might be encrypted or corrupted.")
    } finally {
      setIsProcessing(false)
    }
  }, [file])

  const handleDownload = () => {
    if (!resultUrl) return
    const a = document.createElement("a")
    a.href = resultUrl
    a.download = `vanity-flat-${file?.name}`
    a.click()
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center animate-in fade-in duration-500">
         <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-full mb-6 text-emerald-500">
            <FileCheck className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1 text-white">Flatten PDF</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Convert interactive form fields into permanent, uneditable page content.
        </p>
        <DropZone onDrop={handleDrop} accept={{ "application/pdf": [".pdf"] }} label="Drop PDF to flatten" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 sm:px-0 pb-20">
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
             <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-syne text-white">Flattening Suite</h1>
            <p className="text-muted-foreground text-sm">{file.name}</p>
          </div>
        </div>
        <button onClick={() => { setFile(null); clearPreviewUrl(); clearResultUrl(); }} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Change File
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
        <div className="glass-panel p-12 rounded-[2.5rem] flex flex-col items-center justify-center bg-black/40 border-white/5 shadow-2xl relative overflow-hidden min-h-[500px]">
           {isRendering && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center space-y-4">
                 <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                 <p className="text-xs font-bold uppercase tracking-widest text-emerald-500/80">Rendering Preview...</p>
              </div>
           )}

           {resultUrl ? (
              <div className="text-center space-y-8 animate-in zoom-in-95 duration-500">
                 <div className="p-6 bg-emerald-500/10 rounded-full inline-block text-emerald-500 border border-emerald-500/20">
                    <CheckCircle className="w-12 h-12" />
                 </div>
                 <div className="space-y-2">
                    <h2 className="text-4xl font-bold font-syne text-white">Flattening Complete</h2>
                    <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">Fields are now permanent</p>
                 </div>
                 <button 
                   onClick={handleDownload}
                   className="px-12 py-5 bg-primary text-primary-foreground font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-4 mx-auto"
                 >
                   <Download className="w-6 h-6" />
                   Download Flattened PDF
                 </button>
              </div>
           ) : previewUrl ? (
              <div className="animate-in fade-in zoom-in-95 duration-700">
                 <img 
                    src={previewUrl} 
                    alt="Document Preview" 
                    className="max-w-full max-h-[100%] rounded shadow-2xl" 
                 />
              </div>
           ) : (
              <div className="text-center space-y-6">
                 <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto text-white/20">
                    <FileText className="w-8 h-8" />
                 </div>
                 <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                    This will "burn" all text fields, checkboxes, and radio buttons into the PDF document. 
                    They will no longer be interactive but will remain perfectly legible.
                 </p>
              </div>
           )}
        </div>

        <div className="flex flex-col justify-center space-y-8">
           <div className="glass-panel p-10 rounded-3xl border-white/5 space-y-6">
              <h3 className="text-xl font-bold font-syne text-white flex items-center gap-3">
                 <RefreshCw className="w-5 h-5 text-emerald-500" />
                 Safe Flattening
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                 Flattening is the process of converting interactive elements into static page content. This is useful for:
              </p>
              <ul className="space-y-3">
                 {[
                    "Saving digitally signed documents",
                    "Preparing forms for archive or printing",
                    "Ensuring nobody can modify your form answers",
                    "Reducing file complexity for older recipients"
                 ].map(item => (
                    <li key={item} className="flex items-center gap-3 text-xs text-white/70">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                       {item}
                    </li>
                 ))}
              </ul>
              <button 
                  onClick={flattenPdf}
                  disabled={isProcessing || isRendering}
                  className="w-full py-6 bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
               >
                  {isProcessing ? <RefreshCw className="w-6 h-6 animate-spin" /> : <FileCheck className="w-6 h-6" />}
                  Flatten All Form Fields
               </button>
           </div>
        </div>
      </div>
    </div>
  )
}
