import React, { useState } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, Copy, CheckCircle, FileCode } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
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

  const handleBack = () => {
    setFile(null)
    setBase64(null)
  }

  if (!file) {
    return (
      <ToolUploadLayout title="Image to Base64" description="Convert any image into a Base64 string for embedding in code or HTML." icon={FileCode}>
        <DropZone onDrop={handleProcess} accept={{ "image/*": [] }} />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout title="Base64 Output" description={`File: ${file.name}`} onBack={handleBack} backLabel="Convert Another">
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
    </ToolLayout>
  )
}
