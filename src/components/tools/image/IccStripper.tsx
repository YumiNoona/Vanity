import React, { useState, useRef, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, PaintBucket, Info, Loader2 } from "lucide-react"

export function IccStripper() {
  const [file, setFile] = useState<File | null>(null)
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [strippedUrl, setStrippedUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const handleDrop = (files: File[]) => {
    if (files[0]) {
       setFile(files[0])
       setImgUrl(URL.createObjectURL(files[0]))
       setIsDone(false)
       setStrippedUrl(null)
    }
  }

  const handleProcess = () => {
    if (!imgUrl) return
    setIsProcessing(true)

    const img = new Image()
    img.onload = () => {
       const canvas = document.createElement("canvas")
       canvas.width = img.width
       canvas.height = img.height
       
       const ctx = canvas.getContext("2d")
       if (!ctx) return
       
       // Drawing to a canvas natively normalizes the color space to sRGB and completely unhooks the original ICC metadata payload attached to the raw file buffer.
       ctx.drawImage(img, 0, 0)
       
       canvas.toBlob((blob) => {
          if (blob) {
             setStrippedUrl(URL.createObjectURL(blob))
             setIsDone(true)
          }
          setIsProcessing(false)
       }, file?.type || "image/png", 1.0)
    }
    img.src = imgUrl
  }

  const handleDownload = () => {
    if (!strippedUrl || !file) return
    const a = document.createElement("a")
    a.href = strippedUrl
    a.download = `vanity-srgb-${file.name}`
    a.click()
  }

  if (!file || !imgUrl) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center animate-in fade-in duration-500">
         <div className="inline-flex items-center justify-center p-3 bg-fuchsia-500/10 rounded-full mb-6 text-fuchsia-500">
            <PaintBucket className="w-8 h-8" />
         </div>
         <h1 className="text-4xl font-bold font-syne mb-1 text-white">ICC Profile Stripper</h1>
         <p className="text-muted-foreground text-lg mb-8">
           Remove embedded color profiles from images to guarantee consistent rendering across devices.
         </p>
         <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 sm:px-0 pb-20 mt-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-syne text-white mb-2">Color Space Normalizer</h1>
          <p className="text-muted-foreground text-sm">Target File: <span className="text-white font-mono">{file.name}</span></p>
        </div>
        <button onClick={() => setFile(null)} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Try Another
        </button>
      </div>

      <div className="glass-panel p-8 rounded-3xl flex flex-col md:flex-row gap-8 items-center border-fuchsia-500/20 shadow-[0_0_50px_rgba(217,70,239,0.05)]">
         <div className="w-full md:w-1/2 aspect-square rounded-2xl overflow-hidden bg-black/40 border border-white/5 relative flex flex-col outline-none">
            {isProcessing ? (
               <div className="w-full h-full flex flex-col items-center justify-center relative">
                 <div className="absolute inset-0 bg-fuchsia-500/5 transition-all animate-pulse" />
                 <Loader2 className="w-8 h-8 animate-spin text-fuchsia-400 z-10" />
               </div>
            ) : (
               <img src={isDone && strippedUrl ? strippedUrl : imgUrl} className="w-full h-full object-contain" alt="Target" />
            )}
            {isDone && (
              <div className="absolute top-4 left-4 px-3 py-1 bg-green-500/20 text-green-400 font-bold text-[10px] tracking-widest uppercase rounded">
                sRGB Profile Applied
              </div>
            )}
         </div>

         <div className="w-full md:w-1/2 space-y-6">
            <div className="space-y-4">
               <div className="flex items-start gap-3 p-4 bg-blue-500/10 text-blue-100 rounded-xl border border-blue-500/20">
                  <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm leading-relaxed">
                     <strong className="text-blue-300 block mb-1">What this actually does:</strong>
                     This tool draws your image onto a browser canvas and immediately exports it. This action intentionally drops custom embedded ICC profiles metadata, effectively converting and normalizing all arrays to the web-standard <strong className="text-white">sRGB</strong> color space.
                  </div>
               </div>
               <p className="text-xs text-muted-foreground italic px-2">
                 * You may notice a slight visual color shift. This shift represents exactly what standard web browsers and unmanaged devices would have rendered anyway.
               </p>
            </div>

            {!isDone ? (
               <button 
                 onClick={handleProcess}
                 disabled={isProcessing}
                 className="w-full py-4 bg-fuchsia-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:bg-fuchsia-400 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0 text-sm flex items-center justify-center gap-2"
               >
                 {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Normalizing format...</> : "Normalize to sRGB Space"}
               </button>
            ) : (
               <button 
                 onClick={handleDownload}
                 className="w-full py-4 bg-green-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:bg-green-400 hover:-translate-y-1 transition-all text-sm flex items-center justify-center gap-2"
               >
                 <Download className="w-5 h-5" /> Download sRGB Image
               </button>
            )}
         </div>
      </div>
    </div>
  )
}
