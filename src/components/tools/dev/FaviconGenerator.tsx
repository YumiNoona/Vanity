import React, { useState } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, Download, FileCode, RefreshCw, Layers, CheckCircle } from "lucide-react"
import JSZip from "jszip"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const SIZES = [16, 32, 48, 64, 96, 128, 144, 180, 192, 256, 384, 512]

import { useObjectUrl } from "@/hooks/useObjectUrl"

export function FaviconGenerator() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const { url: previewUrl, setUrl: setPreviewUrl, clear: clearPreviewUrl } = useObjectUrl()
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()

  const handleDrop = (files: File[]) => {
    if (files[0]) {
      setFile(files[0])
      setPreviewUrl(files[0])
    }
  }

  const generateZip = async () => {
    if (!file || !previewUrl) return
    setIsProcessing(true)

    try {
      const zip = new JSZip()
      const img = new Image()

      await new Promise((resolve) => {
        img.onload = resolve
        img.src = previewUrl
      })

      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!

      for (const size of SIZES) {
        canvas.width = size
        canvas.height = size
        ctx.clearRect(0, 0, size, size)
        
        // Use high-quality resizing
        ctx.imageSmoothingQuality = "high"
        ctx.drawImage(img, 0, 0, size, size)
        
        const blob = await new Promise<Blob>((resolve) => 
          canvas.toBlob((b) => resolve(b!), "image/png")
        )
        zip.file(`favicon-${size}x${size}.png`, blob)
      }

      // Special handling for apple-touch-icon (usually 180x180)
      const appleSize = 180
      canvas.width = appleSize
      canvas.height = appleSize
      ctx.drawImage(img, 0, 0, appleSize, appleSize)
      const appleBlob = await new Promise<Blob>((resolve) => 
        canvas.toBlob((b) => resolve(b!), "image/png")
      )
      zip.file("apple-touch-icon.png", appleBlob)

      const content = await zip.generateAsync({ type: "blob" })
      setResultUrl(content)
      toast.success("Favicon pack generated!")
    } catch (error) {
      console.error(error)
      toast.error("Failed to generate zip.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center animate-in fade-in duration-500">
         <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-full mb-6 text-blue-500">
            <FileCode className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1 text-white">Favicon Generator</h1>
        <p className="text-muted-foreground text-lg mb-8">
          One click to generate all standard website icons, including Apple Touch and multi-size PNGs.
        </p>
        <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} label="Drop image to generate icons" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 sm:px-0 pb-20">
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
             <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-syne text-white">Icon Packager</h1>
            <p className="text-muted-foreground text-sm">Reviewing {SIZES.length} output sizes.</p>
          </div>
        </div>
        <button onClick={() => { setFile(null); clearPreviewUrl(); clearResultUrl(); }} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Change Image
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4">
          <div className="glass-panel p-8 rounded-[2rem] space-y-8 border-white/10 sticky top-8">
             <div className="aspect-square w-32 mx-auto rounded-3xl overflow-hidden shadow-2xl border-4 border-white/5 bg-black">
                <img src={previewUrl!} className="w-full h-full object-cover" alt="Preview" />
             </div>
             
             <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Included in .zip</h4>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                   {SIZES.map(s => (
                      <div key={s} className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/5">
                         <CheckCircle className="w-3 h-3 text-emerald-500" />
                         <span className="text-[10px] font-mono text-white/70">{s}x{s}</span>
                      </div>
                   ))}
                   <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 col-span-2">
                       <CheckCircle className="w-3 h-3 text-emerald-500" />
                       <span className="text-[10px] font-bold text-emerald-500">apple-touch-icon.png</span>
                   </div>
                </div>
             </div>

             {resultUrl ? (
                <a 
                  href={resultUrl} 
                  download={`vanity-favicons-${Date.now()}.zip`}
                  className="w-full py-5 bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <Download className="w-5 h-5" /> Download Icon Pack
                </a>
             ) : (
                <button 
                  onClick={generateZip}
                  disabled={isProcessing}
                  className="w-full py-5 bg-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  Generate & Export ZIP
                </button>
             )}
          </div>
        </div>

        <div className="lg:col-span-8">
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {SIZES.map(s => (
                 <div key={s} className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center gap-4 bg-white/[0.02] border-white/5 hover:bg-white/[0.04] transition-colors group">
                    <div 
                       className="rounded-lg shadow-lg border border-white/10 bg-black overflow-hidden flex items-center justify-center"
                       style={{ width: Math.max(24, Math.min(64, s)), height: Math.max(24, Math.min(64, s)) }}
                    >
                       <img src={previewUrl!} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-center">
                       <p className="text-[10px] font-bold text-white mb-0.5">{s}x{s}</p>
                       <p className="text-[8px] text-muted-foreground uppercase tracking-tighter">PNG</p>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  )
}
