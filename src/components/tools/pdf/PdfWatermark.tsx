import React, { useState } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, Loader2, Stamp, Type, Settings2 } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"
import { downloadBlob } from "@/lib/canvas"

import { useObjectUrl } from "@/hooks/useObjectUrl"

export function PdfWatermark() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState("VANITY PROTECT")
  const [opacity, setOpacity] = useState(0.3)
  const [fontSize, setFontSize] = useState(50)
  const [color, setColor] = useState("#808080")
  const [isProcessing, setIsProcessing] = useState(false)
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return
    setFile(uploadedFile)
    clearResultUrl()
  }

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    return rgb(r, g, b)
  }

  const applyWatermark = async () => {
    if (!file || !text) return
    setIsProcessing(true)
    
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      
      const pages = pdfDoc.getPages()
      const pdfColor = hexToRgb(color)

      pages.forEach(page => {
        const { width, height } = page.getSize()
        page.drawText(text, {
          x: width / 2 - (text.length * fontSize * 0.3),
          y: height / 2,
          size: fontSize,
          font: font,
          color: pdfColor,
          opacity: opacity,
          rotate: degrees(45)
        })
      })
      
      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" })
      setResultUrl(blob)
      toast.success("PDF watermarked!")
    } catch (error) {
      toast.error("Failed to watermark PDF")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!resultUrl) return
    const a = document.createElement("a")
    a.href = resultUrl
    a.download = `vanity-watermarked-${file?.name || "document.pdf"}`
    a.click()
  }

  const handleBack = () => {
    setFile(null)
    clearResultUrl()
  }

  if (!file) {
    return (
      <ToolUploadLayout title="PDF Watermark" description="Add a persistent text stamp across all pages of your PDF." icon={Stamp}>
        <DropZone onDrop={handleDrop} accept={{ "application/pdf": [".pdf"] }} />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout 
      title="Configure Stamp" 
      description={`Target: ${file.name}`} 
      onBack={handleBack} 
      backLabel="Start Over" 
      maxWidth="max-w-6xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 glass-panel p-6 rounded-xl space-y-6">
           <div className="flex items-center gap-2 text-accent mb-4">
              <Settings2 className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Controls</h3>
           </div>

           <div className="space-y-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase text-muted-foreground">Stamp Text</label>
                 <input 
                   type="text"
                   value={text}
                   onChange={e => setText(e.target.value)}
                   className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:border-accent outline-none font-bold text-sm"
                 />
              </div>

              <div className="space-y-2">
                 <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Opacity</label>
                    <span className="text-[10px] font-bold">{Math.round(opacity * 100)}%</span>
                 </div>
                 <input 
                   type="range" min="0.1" max="1" step="0.1"
                   value={opacity}
                   onChange={e => setOpacity(Number(e.target.value))}
                   className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
                 />
              </div>

              <div className="space-y-2">
                 <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Size</label>
                    <span className="text-[10px] font-bold">{fontSize}pt</span>
                 </div>
                 <input 
                   type="range" min="10" max="150" step="5"
                   value={fontSize}
                   onChange={e => setFontSize(Number(e.target.value))}
                   className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase text-muted-foreground">Color</label>
                 <div className="flex gap-2">
                    <input 
                      type="color"
                      value={color}
                      onChange={e => setColor(e.target.value)}
                      className="w-10 h-10 bg-transparent border-none cursor-pointer"
                    />
                    <input 
                      type="text"
                      value={color.toUpperCase()}
                      readOnly
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 text-xs font-mono flex items-center"
                    />
                 </div>
              </div>
           </div>

           <div className="pt-6 border-t border-white/5">
              {!resultUrl ? (
                <button 
                  onClick={applyWatermark}
                  disabled={isProcessing || !text}
                  className="w-full py-4 bg-accent text-accent-foreground font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? <Loader2 className="animate-spin" /> : <Stamp className="w-5 h-5" />}
                  Generate Watermarked PDF
                </button>
              ) : (
                <button 
                  onClick={handleDownload}
                  className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" /> Export
                </button>
              )}
           </div>
        </div>

        <div className="md:col-span-2 glass-panel p-8 rounded-xl bg-black/50 border border-white/5 flex items-center justify-center min-h-[500px] relative">
           <div className="text-center space-y-4">
              <div className="w-24 h-32 bg-white/5 border border-white/10 rounded-md relative flex items-center justify-center overflow-hidden mx-auto">
                 <div className="absolute inset-0 flex items-center justify-center -rotate-45" style={{ color: color, opacity: opacity, fontSize: fontSize / 4 }}>
                    {text}
                 </div>
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Live Preview Stub</p>
           </div>
        </div>
      </div>
    </ToolLayout>
  )
}
