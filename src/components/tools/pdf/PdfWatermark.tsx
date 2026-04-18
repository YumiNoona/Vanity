import React, { useState } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, Loader2, Stamp, Type } from "lucide-react"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"

export function PdfWatermark() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState("VANITY PROTECT")
  const [isProcessing, setIsProcessing] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)

  const handleProcess = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return
    setFile(uploadedFile)
  }

  const applyWatermark = async () => {
    if (!file || !text) return
    setIsProcessing(true)
    
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      
      const pages = pdfDoc.getPages()
      pages.forEach(page => {
        const { width, height } = page.getSize()
        page.drawText(text, {
          x: width / 2 - 100,
          y: height / 2,
          size: 50,
          font: font,
          color: rgb(0.5, 0.5, 0.5),
          opacity: 0.3,
          rotate: { type: 'degrees', angle: 45 }
        })
      })
      
      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      
      setResultUrl(url)
      toast.success("PDF watermarked!")
    } catch (error) {
      toast.error("Failed to watermark PDF")
    } finally {
      setIsProcessing(false)
    }
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
         <div className="inline-flex items-center justify-center p-3 bg-accent/10 rounded-full mb-6 text-accent">
            <Stamp className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1">PDF Watermark</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Add a persistent text stamp across all pages of your PDF.
        </p>
        <DropZone onDrop={handleProcess} accept={{ "application/pdf": [".pdf"] }} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-3xl font-bold font-syne mb-2">Apply Stamp</h1>
          <p className="text-muted-foreground text-sm">Target: {file.name}</p>
        </div>
        <button onClick={() => { setFile(null); setResultUrl(null); }} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Start Over
        </button>
      </div>

      <div className="glass-panel p-8 rounded-xl space-y-8 flex flex-col items-center">
         <div className="w-full max-w-sm space-y-4">
            <div className="space-y-2">
               <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Watermark Text</label>
               <input 
                 type="text"
                 value={text}
                 onChange={e => setText(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:border-accent outline-none font-bold"
               />
            </div>
            
            {!resultUrl ? (
              <button 
                onClick={applyWatermark}
                disabled={isProcessing || !text}
                className="w-full py-4 bg-accent text-accent-foreground font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : <Stamp className="w-5 h-5" />}
                Apply Watermark
              </button>
            ) : (
              <button 
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = resultUrl;
                  a.download = "vanity-watermarked.pdf";
                  a.click();
                }}
                className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" /> Download PDF
              </button>
            )}
         </div>

         <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-[10px] text-muted-foreground leading-relaxed max-w-sm">
           The watermark is embedded directly into the PDF bitstream. It cannot be easily removed by standard editors.
         </div>
      </div>
    </div>
  )
}
