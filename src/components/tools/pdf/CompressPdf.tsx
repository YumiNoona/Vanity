import React, { useState, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, Loader2, Minimize2, Sparkles } from "lucide-react"
import { PDFDocument } from "pdf-lib"
import confetti from "canvas-confetti"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"

export function CompressPdf() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)

  // Cleanup Object URL on unmount
  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl)
    }
  }, [resultUrl])

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return
    
    setFile(uploadedFile)
    setIsProcessing(true)

    try {
      const arrayBuffer = await uploadedFile.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      
      // Basic compression by re-saving. pdf-lib defaults are somewhat optimized.
      // True compression usually involves downscaling images inside PDF.
      const pdfBytes = await pdfDoc.save({ useObjectStreams: true })
      
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      
      setResultBlob(blob)
      setResultUrl(url)
      
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ["#F59E0B", "#FCD34D", "#FFFFFF"]
      })
      toast.success("PDF optimized!")

    } catch (error: any) {
      console.error(error)
      toast.error("Failed to compress PDF")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!resultUrl) return
    const a = document.createElement("a")
    a.href = resultUrl
    a.download = `vanity-compressed-${file?.name}`
    a.click()
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
         <div className="inline-flex items-center justify-center p-3 bg-accent/10 rounded-full mb-6 text-accent">
            <Minimize2 className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1">Compress PDF</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Reduce the file size of your PDF while maintaining quality.
        </p>
        <DropZone onDrop={handleDrop} accept={{ "application/pdf": [".pdf"] }} label="Drop PDF here" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-3xl font-bold font-syne mb-2">Compress PDF</h1>
          <p className="text-muted-foreground text-sm">Original: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
        <button 
          onClick={() => { setFile(null); setResultUrl(null); }} 
          className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Start New
        </button>
      </div>

      <div className="glass-panel p-8 rounded-xl flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
        {isProcessing && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur flex flex-col items-center justify-center z-10 transition-opacity">
            <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
            <h3 className="text-xl font-bold font-syne animate-pulse text-white">Compressing PDF...</h3>
          </div>
        )}

        {resultUrl && !isProcessing && (
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center p-8 bg-white/5 rounded-2xl mb-2 text-accent">
               <Sparkles className="w-20 h-20" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-syne">PDF Optimized!</h2>
              {resultBlob && (
                <p className="text-muted-foreground mt-2">
                  New size: <span className="text-accent font-bold">{(resultBlob.size / 1024 / 1024).toFixed(2)} MB</span>
                </p>
              )}
            </div>
            
            <button 
              onClick={handleDownload}
              className="px-8 py-4 text-lg font-bold bg-accent text-accent-foreground hover:bg-accent/90 rounded-full shadow-[0_0_30px_rgba(252,211,77,0.3)] transition-all flex items-center justify-center gap-3 mx-auto hover:scale-105"
            >
              <Download className="w-6 h-6" /> Download Compressed PDF
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
