import React, { useState, useCallback } from "react"
import { motion } from "framer-motion"
import { DropZone } from "@/components/shared/DropZone"
import { Download, PaintBucket, Info, RefreshCw, ShieldCheck } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { usePremium } from "../../../hooks/usePremium"
import { useImageProcessor } from "../../../hooks/useImageProcessor"
import { drawToCanvas, exportCanvas, downloadBlob } from "../../../lib/canvas"
import { toast } from "sonner"
import { cn } from "../../../lib/utils"
import { PillToggle } from "@/components/shared/PillToggle"
import * as ExifReader from "../../../lib/exif-reader"

interface IccMetadata {
  [key: string]: {
    value: any
    description: string
  }
}

export function IccStripper() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const { isProcessing, processImage, clearCurrent } = useImageProcessor()
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)

  // State
  const [processMode, setProcessMode] = useState<'view' | 'remove'>('view')
  const [iccData, setIccData] = useState<IccMetadata | null>(null)

  const runStrip = useCallback(async (inputFile: File): Promise<Blob> => {
    const result = await processImage(inputFile)
    if (!result) throw new Error("Failed to load image")

    try {
      const canvas = document.createElement("canvas")
      await drawToCanvas(result.source, canvas, { clear: true })
      const blob = await exportCanvas(canvas, "image/jpeg", 0.95)
      result.cleanup()
      return blob
    } catch (err) {
      result.cleanup()
      console.error("ICC Strip error:", err)
      throw err
    }
  }, [processImage])

  const handleProcess = useCallback(async (files: File[]) => {
    if (files.length === 0) return
    if (!validateFiles(files)) return
    setError(null)

    if (processMode === 'view') {
      const uploadedFile = files[0]
      setFile(uploadedFile)
      
      try {
        const tags = await ExifReader.load(uploadedFile)
        const icc: IccMetadata = {}
        
        Object.entries(tags).forEach(([name, tag]: [string, any]) => {
          if (name.startsWith("icc")) {
            icc[name] = {
              value: tag.value,
              description: tag.description
            }
          }
        })

        setIccData(Object.keys(icc).length > 0 ? icc : null)
        if (Object.keys(icc).length === 0) toast.error("No ICC profile found")
      } catch (err) {
        console.error("ExifReader error:", err)
        toast.error("Could not read profile")
      }
      return
    }

    if (processMode === 'remove') {
      const uploadedFile = files[0]
      setFile(uploadedFile)
      
      try {
        const blob = await runStrip(uploadedFile)
        setResultBlob(blob)
        toast.success("ICC Profile removed!")
      } catch (error) {
        console.error("[IccStripper] Process error:", error)
        setError("Failed to remove ICC profile.")
      }
    }
  }, [processMode, validateFiles, runStrip])

  const handleDownload = () => {
    if (!resultBlob) return
    downloadBlob(resultBlob, `srgb-${file?.name || 'image.jpg'}`)
  }

  const handleBack = () => {
    setFile(null)
    setResultBlob(null)
    setError(null)
    setIccData(null)
    clearCurrent()
  }

  if (!file) {
    return (
      <ToolUploadLayout title="ICC Profile Stripper" description="Remove embedded color profiles to ensure consistent web-standard sRGB rendering." icon={PaintBucket}>
        <div className="flex justify-center mb-10">
           <PillToggle 
             activeId={processMode}
             onChange={(mode) => { setProcessMode(mode as any); handleBack(); }}
             options={[
               { id: 'view', label: 'View Profile' },
               { id: 'remove', label: 'Remove Profile' }
             ]}
           />
        </div>

        <DropZone 
          onDrop={handleProcess} 
          accept={{ "image/*": [] }} 
          label={
            processMode === 'view' ? "Drop image to read ICC profile" :
            "Drop image to normalize colors"
          }
        />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout
      title={processMode === 'remove' ? "Color Normalizer" : "ICC Inspector"}
      description={`Target: ${file?.name}`}
      icon={PaintBucket}
      onBack={handleBack}
      maxWidth="max-w-4xl"
    >
      {processMode === 'view' ? (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="glass-panel p-8 rounded-3xl border-white/5 space-y-6 bg-white/[0.02]">
              <div className="flex items-center justify-between border-b border-white/5 pb-6">
                 <h3 className="text-xl font-black uppercase tracking-tight">ICC Profile Data</h3>
                 <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                    Inspector
                 </div>
              </div>

              {!iccData ? (
                 <div className="py-20 text-center space-y-4">
                    <Info className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                    <p className="text-sm text-muted-foreground uppercase tracking-widest">This image uses standard browser sRGB colors.</p>
                 </div>
              ) : (
                 <div className="grid grid-cols-1 gap-4">
                    {Object.entries(iccData).map(([name, tag], idx) => (
                       <div key={idx} className="flex flex-col p-4 bg-white/[0.03] rounded-xl border border-white/5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{name}</span>
                          <span className="text-sm font-bold font-mono">{tag.description || String(tag.value)}</span>
                       </div>
                    ))}
                 </div>
              )}

              <button 
                onClick={() => { setProcessMode('remove'); handleProcess([file!]) }}
                className="w-full py-5 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest rounded-2xl transition-all border border-white/5 flex items-center justify-center gap-3"
              >
                <RefreshCw className="w-5 h-5" /> Strip Profile Now
              </button>
           </div>
        </div>
      ) : (
        <div className="space-y-8 max-w-2xl mx-auto">
          <div className="glass-panel p-12 rounded-3xl flex flex-col items-center justify-center min-h-[400px] bg-white/[0.02] border-white/5 relative overflow-hidden">
            {isProcessing ? (
              <div className="flex flex-col items-center text-center space-y-6">
                 <RefreshCw className="w-16 h-16 text-primary animate-spin" />
                 <h2 className="text-xl font-black uppercase tracking-widest">Normalizing Colors...</h2>
              </div>
            ) : error ? (
              <div className="text-center space-y-6 text-red-500">
                 <ShieldCheck className="w-16 h-16 opacity-50 mx-auto" />
                 <h2 className="text-xl font-black uppercase tracking-widest">Processing Failed</h2>
                 <p className="text-xs opacity-70 uppercase">{error}</p>
              </div>
            ) : (
              <div className="text-center space-y-8 animate-in zoom-in-95 duration-500">
                 <div className="p-10 bg-emerald-500/10 rounded-full relative text-emerald-500 border border-emerald-500/20 mx-auto w-fit">
                    <PaintBucket className="w-20 h-20" />
                 </div>
                 <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 italic">Standard sRGB</h2>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
                       Your image has been normalized to the web-standard sRGB color space.
                    </p>
                 </div>
                 
                 <button 
                   onClick={handleDownload}
                   className="px-14 py-6 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-primary/30 hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-4 mx-auto"
                 >
                   <Download className="w-6 h-6" /> Export </button>
              </div>
            )}
          </div>
        </div>
      )}
    </ToolLayout>
  )
}

