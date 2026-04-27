import React, { useState, useRef, useEffect, useCallback } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, Type, RefreshCw, Copy, CheckCircle } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { usePremium } from "@/hooks/usePremium"
import { useObjectUrl } from "@/hooks/useObjectUrl"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const CHAR_SETS = {
  standard: "@%#*+=-:. ",
  blocks: "█▓▒░ ",
  detailed: "B8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ",
}

export function AsciiArt() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [charSet, setCharSet] = useState<keyof typeof CHAR_SETS>("standard")
  const [resolution, setResolution] = useState(100)
  const [ascii, setAscii] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()
  const [copied, setCopied] = useState(false)

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return
    setFile(uploadedFile)
  }

  const generateAscii = useCallback(() => {
    if (!file) return
    setIsProcessing(true)

    const localUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(localUrl)
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!
      
      const aspect = img.height / img.width
      const w = resolution
      const h = Math.round(w * aspect * 0.5)
      
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
      setResultUrl(new Blob([result], { type: "text/plain" }))
      setIsProcessing(false)
    }
    img.onerror = () => URL.revokeObjectURL(localUrl)
    img.src = localUrl
  }, [file, charSet, resolution])

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
    if (!resultUrl) return
    const a = document.createElement("a")
    a.href = resultUrl
    a.download = `vanity-ascii-${Date.now()}.txt`
    a.click()
  }

  if (!file) {
    return (
      <ToolUploadLayout title="ASCII Art Converter" description="Turn any photograph into a text-based ASCII masterpiece for coding comments or profile art." icon={Type}>
        <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} label="Drop photo to convert to characters" />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout title="Character Studio" description="Fine-tune resolution and character sets." icon={Type} centered={true} maxWidth="max-w-7xl">

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
                   <Download className="w-4 h-4" /> Export.txt
                 </button>
              </div>
           </div>
        </div>
      </div>
    </ToolLayout>
  )
}
