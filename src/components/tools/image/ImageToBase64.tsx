import React, { useState } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, Copy, CheckCircle, FileCode } from "lucide-react"
import { toast } from "sonner"

export function ImageToBase64() {
  const [file, setFile] = useState<File | null>(null)
  const [base64, setBase64] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleProcess = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile) return
    setFile(uploadedFile)
    
    const reader = new FileReader()
    reader.onload = () => {
      setBase64(reader.result as string)
      toast.success("Converted to Base64!")
    }
    reader.readAsDataURL(uploadedFile)
  }

  const handleCopy = () => {
    if (!base64) return
    navigator.clipboard.writeText(base64)
    setCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
         <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6 text-primary">
            <FileCode className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1">Image to Base64</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Convert any image into a Base64 string for embedding in code or HTML.
        </p>
        <DropZone onDrop={handleProcess} accept={{ "image/*": [] }} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-3xl font-bold font-syne mb-2">Base64 Output</h1>
          <p className="text-muted-foreground text-sm">File: {file.name}</p>
        </div>
        <button onClick={() => { setFile(null); setBase64(null); }} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Convert Another
        </button>
      </div>

      <div className="glass-panel p-6 rounded-xl space-y-4">
        <div className="flex justify-between items-center mb-2">
           <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Encoded String</span>
           <button 
             onClick={handleCopy}
             className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-all"
           >
             {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
             {copied ? "Copied" : "Copy to Clipboard"}
           </button>
        </div>
        <div className="relative">
          <textarea 
            readOnly 
            value={base64 || ""} 
            className="w-full h-64 bg-black/40 border border-white/10 rounded-lg p-4 font-mono text-[10px] text-primary/80 break-all resize-none outline-none focus:border-primary/30"
          />
        </div>
      </div>
    </div>
  )
}
