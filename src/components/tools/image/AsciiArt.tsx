import React, { useState, useRef, useEffect, useCallback } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, Download, Type, RefreshCw, Copy, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const CHAR_SETS = {
  standard: "@%#*+=-:. ",
  blocks: "█▓▒░ ",
  detailed: "B8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ",
}

export function AsciiArt() {
  const [file, setFile] = useState<File | null>(null)
  const [charSet, setCharSet] = useState<keyof typeof CHAR_SETS>("standard")
  const [resolution, setResolution] = useState(100)
  const [ascii, setAscii] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile) return
    setFile(uploadedFile)
    setPreviewUrl(URL.createObjectURL(uploadedFile))
  }

  const generateAscii = useCallback(() => {
    if (!file || !previewUrl) return
    setIsProcessing(true)

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!
      
      const aspect = img.height / img.width
      const w = resolution
      const h = Math.round(w * aspect * 0.5) // Characters are half as tall as they are wide roughly
      
      canvas.width = w
      canvas.height = h
      ctx.drawImage(img, 0, 0, w, h)
      
      const data = ctx.getImageData(0, 0, w, h).data
      const chars = CHAR_SETS[charSet]
      let result = ""

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const brightness = (r + g + b) / 3
          const charIdx = Math.floor((brightness / 255) * (chars.length - 1))
          result += chars[charIdx]
        }
        result += "\n"
      }
      
      setAscii(result)
      setIsProcessing(false)
    }
    img.src = previewUrl
  }, [file, charSet, resolution, previewUrl])

  useEffect(() => {
    if (file) generateAscii()
  }, [file, charSet, resolution, generateAscii])

  const handleCopy = () => {
    navigator.clipboard.writeText(ascii)
    setCopied(true)
    toast.success("ASCII copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadTxt = () => {
    const blob = new Blob([ascii], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `vanity-ascii-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center animate-in fade-in duration-500">
         <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6 text-primary">
            <Type className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1">ASCII Art Converter</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Turn any photograph into a text-based ASCII masterpiece for coding comments or profile art.
        </p>
        <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} label="Drop photo to convert to characters" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 sm:px-0 pb-12">
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
             <Type className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-syne">Character Studio</h1>
            <p className="text-muted-foreground text-sm">Fine-tune resolution and character sets.</p>
          </div>
        </div>
        <button onClick={() => setFile(null)} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Start Over
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <div className="glass-panel p-8 rounded-3xl min-h-[600px] bg-black/40 overflow-auto relative shadow-2xl border-white/5 scrollbar-thin scrollbar-thumb-white/10">
             {isProcessing ? (
                <div className="absolute inset-0 flex items-center justify-center">
                   <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                </div>
             ) : (
                <pre className="text-[6px] leading-[6px] font-mono text-white/80 whitespace-pre selection:bg-primary/30">
                   {ascii}
                </pre>
             )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="glass-panel p-8 rounded-2xl space-y-8 border-white/10">
              <div className="space-y-4">
                 <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Character Set</label>
                 <div className="grid grid-cols-1 gap-2">
                    {Object.keys(CHAR_SETS).map((key) => (
                       <button 
                         key={key}
                         onClick={() => setCharSet(key as keyof typeof CHAR_SETS)}
                         className={cn(
                           "py-3 px-4 rounded-xl text-xs font-bold border transition-all text-left flex justify-between items-center group",
                           charSet === key ? "bg-primary border-primary text-white" : "border-white/5 bg-white/5 hover:bg-white/10 text-muted-foreground"
                         )}
                       >
                         <span className="capitalize">{key}</span>
                         <span className={cn(
                           "text-[8px] font-mono",
                           charSet === key ? "text-white/50" : "text-white/20"
                         )}>
                            {CHAR_SETS[key as keyof typeof CHAR_SETS].slice(0, 5)}...
                         </span>
                       </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                 <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Resolution</label>
                    <span className="text-lg font-bold font-mono text-primary">{resolution}ch</span>
                 </div>
                 <input 
                   type="range" 
                   min="40" 
                   max="250" 
                   step="10"
                   value={resolution}
                   onChange={(e) => setResolution(parseInt(e.target.value))}
                   className="w-full relative h-1.5 bg-primary/10 rounded-lg appearance-none cursor-pointer accent-primary"
                 />
              </div>

              <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
                 <button 
                   onClick={handleCopy}
                   className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2"
                 >
                   {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                   Copy String
                 </button>
                 <button 
                   onClick={handleDownloadTxt}
                   className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                 >
                   <Download className="w-4 h-4" />
                   Download .txt
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
