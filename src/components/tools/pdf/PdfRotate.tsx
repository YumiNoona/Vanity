import React, { useState, useCallback } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, RotateCw, Download, RefreshCw, Layers, CheckCircle } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { PDFDocument, degrees } from "pdf-lib"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { useObjectUrl } from "@/hooks/useObjectUrl"

export function PdfRotate() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [rotation, setRotation] = useState(90)
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()

  const handleDrop = async (files: File[]) => {
    if (files[0]) {
      setFile(files[0])
      setResultUrl(null)
    }
  }

  const applyRotation = useCallback(async () => {
    if (!file) return
    setIsProcessing(true)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      const pages = pdfDoc.getPages()

      for (const page of pages) {
        const currentRotation = page.getRotation().angle
        page.setRotation(degrees((currentRotation + rotation) % 360))
      }

      const savedPdfArr = await pdfDoc.save()
      const blob = new Blob([savedPdfArr as any], { type: "application/pdf" })
      setResultUrl(blob)
      toast.success("Rotation applied successfully!")
    } catch (error) {
      console.error(error)
      toast.error("Failed to rotate PDF.")
    } finally {
      setIsProcessing(false)
    }
  }, [file, rotation])

  const handleDownload = () => {
    if (!resultUrl) return
    const a = document.createElement("a")
    a.href = resultUrl
    a.download = `vanity-rotated-${file?.name}`
    a.click()
  }

  if (!file) {
    return (
      <ToolUploadLayout title="Rotate PDF Pages" description="Quickly rotate all pages in your PDF document by 90, 180, or 270 degrees." icon={RotateCw}>
        <DropZone onDrop={handleDrop} accept={{ "application/pdf": [".pdf"] }} label="Drop PDF to rotate" />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout title="Rotate PDF Pages" description={file.name} icon={Layers} onBack={() => { setFile(null); clearResultUrl(); }} backLabel="Change File">

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
         <div className="md:col-span-12 xl:col-span-12">
            <div className="glass-panel p-12 rounded-[2.5rem] flex flex-col items-center justify-center bg-black/40 border-white/5 shadow-2xl space-y-12">
               {resultUrl ? (
                  <div className="text-center space-y-8 animate-in zoom-in-95 duration-500">
                     <div className="p-6 bg-emerald-500/10 rounded-full inline-block text-emerald-500 border border-emerald-500/20">
                        <CheckCircle className="w-12 h-12" />
                     </div>
                     <div className="space-y-2">
                        <h2 className="text-4xl font-bold font-syne text-white">Document Ready</h2>
                        <p className="text-muted-foreground">All pages have been rotated by {rotation}°.</p>
                     </div>
                     <button 
                       onClick={handleDownload}
                       className="px-12 py-5 bg-primary text-primary-foreground font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-4 mx-auto"
                     >
                       <Download className="w-6 h-6" /> Export </button>
                  </div>
               ) : (
                  <div className="space-y-10 w-full max-w-lg">
                     <div className="space-y-4">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-center block">Select Rotation Angle</label>
                        <div className="grid grid-cols-3 gap-4">
                           {[90, 180, 270].map(angle => (
                              <button 
                                 key={angle}
                                 onClick={() => setRotation(angle)}
                                 className={cn(
                                    "py-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 group",
                                    rotation === angle ? "bg-primary border-primary text-primary-foreground" : "bg-white/5 border-white/5 hover:border-white/10 text-muted-foreground"
                                 )}
                              >
                                 <RotateCw className={cn(
                                    "w-6 h-6 transition-transform duration-500",
                                    angle === 90 ? "rotate-90" : angle === 180 ? "rotate-180" : "rotate-[270deg]",
                                    rotation === angle && "scale-110"
                                 )} />
                                 <span className="text-sm font-bold font-mono">{angle}°</span>
                              </button>
                           ))}
                        </div>
                     </div>

                     <button 
                        onClick={applyRotation}
                        disabled={isProcessing}
                        className="w-full py-6 bg-primary text-primary-foreground font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                     >
                        {isProcessing ? <RefreshCw className="w-6 h-6 animate-spin" /> : <RotateCw className="w-6 h-6" />}
                        Apply Rotation to All Pages
                     </button>
                  </div>
               )}
            </div>
         </div>
      </div>
    </ToolLayout>
  )
}
