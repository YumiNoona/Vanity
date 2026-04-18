import React, { useState } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, Loader2, ShieldCheck, Info } from "lucide-react"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"

export function ExifSanitizer() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)

  const handleProcess = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return
    
    setFile(uploadedFile)
    setIsProcessing(true)

    try {
      // Modern way to strip EXIF is to draw it to a canvas and export to blob
      // This effectively "sanitizes" it as canvas.toBlob creates a new image bitstream without metadata
      const img = new Image()
      img.src = URL.createObjectURL(uploadedFile)
      await img.decode()
      
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0)
      
      canvas.toBlob((blob) => {
        if (!blob) throw new Error("Processing failed")
        setResultBlob(blob)
        setIsProcessing(false)
        toast.success("Metadata sanitized successfully!")
      }, uploadedFile.type, 1.0)
      
      URL.revokeObjectURL(img.src)
    } catch (error) {
      toast.error("Failed to sanitize metadata")
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!resultBlob) return
    const url = URL.createObjectURL(resultBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = `vanity-sanitized-${file?.name}`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
         <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6 text-primary">
            <ShieldCheck className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1">EXIF Sanitizer</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Protect your privacy by removing hidden GPS and device metadata from photos.
        </p>
        <DropZone onDrop={handleProcess} accept={{ "image/*": [] }} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-3xl font-bold font-syne mb-2">Privacy Shield</h1>
          <p className="text-muted-foreground text-sm">Target: {file.name}</p>
        </div>
        <button onClick={() => { setFile(null); setResultBlob(null); }} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Start Over
        </button>
      </div>

      <div className="glass-panel p-12 rounded-xl flex flex-col items-center justify-center min-h-[400px]">
        {isProcessing ? (
          <div className="flex flex-col items-center animate-in fade-in">
             <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
             <p className="text-lg font-syne font-bold">Removing Metadata...</p>
          </div>
        ) : (
          <div className="text-center space-y-8 animate-in zoom-in-95">
             <div className="p-8 bg-primary/10 rounded-full inline-block text-primary">
                <ShieldCheck className="w-16 h-16" />
             </div>
             <div>
               <h2 className="text-2xl font-bold font-syne mb-2">Image Sanitized!</h2>
               <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                 All GPS location data, camera settings, and unique device IDs have been stripped. Your image is now safe to share.
               </p>
             </div>
             
             <button 
               onClick={handleDownload}
               className="px-12 py-4 bg-primary text-primary-foreground font-bold rounded-full shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 mx-auto"
             >
               <Download className="w-5 h-5" /> Download Safe Image
             </button>
          </div>
        )}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4">
         <Info className="w-5 h-5 text-primary shrink-0 mt-1" />
         <div className="space-y-1">
            <h4 className="text-sm font-bold">Why sanitize?</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Most smartphones embed your exact location (latitude/longitude) into every photo you take. 
              Vanity creates a fresh pixel-for-pixel copy of your image while leaving the metadata behind.
            </p>
         </div>
      </div>
    </div>
  )
}
