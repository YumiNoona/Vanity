import React, { useState, useEffect, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import { DropZone } from "@/components/shared/DropZone"
import { Download, Loader2, ShieldCheck, Info, FileArchive, RefreshCw } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { usePremium } from "@/hooks/usePremium"
import { useImageProcessor } from "@/hooks/useImageProcessor"
import { drawToCanvas, exportCanvas, downloadBlob } from "@/lib/canvas"
import { toast } from "sonner"
import { PillToggle } from "@/components/shared/PillToggle"
import { cn } from "@/lib/utils"

// exifr is now used inside a worker

interface ExifTag {
  value: any
  description: string
}

interface ExifGroup {
  [key: string]: ExifTag
}

interface ExifReport {
  [group: string]: ExifGroup
}

export function ExifSanitizer({ embedded = false }: { embedded?: boolean }) {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const { isProcessing, processImage, clearCurrent } = useImageProcessor()
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)

  // State
  const [processMode, setProcessMode] = useState<'view' | 'remove'>('view')
  const [exifReport, setExifReport] = useState<ExifReport | null>(null)
  
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
      }
    }
  }, [])

  const runSanitize = useCallback(async (inputFile: File): Promise<Blob> => {
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
      console.error("Sanitize error:", err)
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
        const arrayBuffer = await uploadedFile.arrayBuffer()
        
        // Offload heavy binary parsing to worker
        const groups = await new Promise<ExifReport>((resolve, reject) => {
          const worker = new Worker(new URL("@/workers/exifr.worker.ts", import.meta.url), { type: 'module' });
          workerRef.current = worker;
          
          worker.onmessage = (e) => {
            if (e.data.type === 'done') {
              worker.terminate()
              resolve(e.data.data)
            } else if (e.data.type === 'error') {
              worker.terminate()
              reject(new Error(e.data.error))
            }
          }
          
          worker.onerror = (err) => {
            worker.terminate()
            reject(err)
          }
          
          worker.postMessage({ 
            file: arrayBuffer, 
            options: {
              pick: [
                'Make', 'Model', 'Software', 'DateTimeOriginal', 'ModifyDate',
                'ExposureTime', 'FNumber', 'ISO', 'FocalLength', 'LensModel',
                'GPSLatitude', 'GPSLongitude', 'GPSAltitude', 'GPSImgDirection',
                'ImageWidth', 'ImageHeight', 'XResolution', 'YResolution',
                'Orientation', 'Copyright', 'Artist', 'UserComment'
              ],
              xmp: true,
              icc: true,
              iptc: true,
            }
          }, [arrayBuffer]) // Use transferable objects to avoid memory duplication
        })

        if (!groups || Object.keys(groups).length === 0) {
          setExifReport({})
          toast.error("No metadata found")
          return
        }

        setExifReport(groups)
      } catch (err) {
        console.error("Worker error:", err)
        toast.error("Could not parse image metadata")
      }
      return
    }


    if (processMode === 'remove') {
      const uploadedFile = files[0]
      setFile(uploadedFile)
      
      try {
        const blob = await runSanitize(uploadedFile)
        setResultBlob(blob)
        toast.success("Metadata sanitized!")
      } catch (error) {
        console.error("[ExifSanitizer] Single process error:", error)
        setError("Failed to sanitize metadata. The image might be too large or corrupted.")
      }
    }
  }, [processMode, validateFiles, runSanitize])

  const handleDownload = () => {
    if (!resultBlob) return
    downloadBlob(resultBlob, `sanitized-${file?.name || 'image.jpg'}`)
  }

  const handleBack = () => {
    setFile(null)
    setResultBlob(null)
    setError(null)
    setExifReport(null)
    clearCurrent()
  }

  if (!file) {
    return (
      <ToolUploadLayout title="Image Privacy" description="Protect your identity by managing hidden GPS and device metadata." icon={ShieldCheck} hideHeader={embedded}>
        <div className={cn("flex justify-center", embedded ? "mt-2 mb-4" : "mb-10")}>
           <PillToggle 
             activeId={processMode}
             onChange={(mode) => { setProcessMode(mode); handleBack(); }}
             options={[
               { id: 'view', label: 'View Data' },
               { id: 'remove', label: 'Remove Data' }
             ]}
           />
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          <DropZone 
            onDrop={handleProcess} 
            accept={{ "image/*": [] }} 
            label={
              processMode === 'view' ? "Drop image to read metadata" :
              "Drop image to sanitize"
            }
          />
        </div>
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout
      title={processMode === 'remove' ? "Privacy Shield" : "Metadata Viewer"}
      description={`Target: ${file?.name}`}
      icon={ShieldCheck}
      centered={true}
      maxWidth="max-w-6xl"
      hideHeader={embedded}
    >
      {processMode === 'view' ? (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="glass-panel p-8 rounded-3xl border-white/5 space-y-8 bg-white/[0.02]">
              <div className="flex items-center justify-between border-b border-white/5 pb-6">
                 <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">Metadata Report</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Found {Object.keys(exifReport || {}).length} data segments</p>
                 </div>
                 <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                    Read Only
                 </div>
              </div>

              {!exifReport || Object.keys(exifReport).length === 0 ? (
                 <div className="py-20 text-center space-y-4">
                    <Info className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                    <p className="text-sm text-muted-foreground uppercase tracking-widest">No metadata tags detected in this file.</p>
                 </div>
              ) : (
                 <div className="space-y-10">
                    {/* Prioritize certain groups */}
                    {["File", "GPS", "EXIF", "IPTC", "XMP", "Photoshop", "ICC_Profile", "Other"].map(groupName => {
                       const group = exifReport[groupName];
                       if (!group || Object.keys(group).length === 0) return null;
                       
                       return (
                          <div key={groupName} className="space-y-4">
                             <div className="flex items-center gap-3 px-2">
                                <div className="h-px flex-1 bg-white/5" />
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">{groupName}</h4>
                                <div className="h-px flex-1 bg-white/5" />
                             </div>
                             
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.entries(group).map(([name, tag], idx) => (
                                   <div key={idx} className="flex flex-col p-4 bg-white/[0.03] rounded-xl border border-white/5 hover:bg-white/[0.05] transition-colors group">
                                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1 group-hover:text-primary/60 transition-colors">{name}</span>
                                      <span className="text-sm font-bold font-mono break-words leading-relaxed">{tag.description || String(tag.value)}</span>
                                   </div>
                                ))}
                             </div>
                          </div>
                       );
                    })}
                 </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => { setProcessMode('remove'); handleProcess([file!]) }}
                  className="flex-1 py-5 bg-white text-black font-black uppercase tracking-widest rounded-2xl transition-all hover:bg-primary hover:text-white flex items-center justify-center gap-3"
                >
                  <ShieldCheck className="w-5 h-5" /> Sanitize Now
                </button>
                <button 
                  onClick={handleBack}
                  className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest rounded-2xl transition-all border border-white/5 flex items-center justify-center gap-3"
                >
                  <RefreshCw className="w-5 h-5" /> Load Different
                </button>
              </div>
           </div>

           <div className="glass-panel p-6 rounded-2xl border border-white/5 flex gap-5 bg-white/[0.01]">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                 <Info className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-1">
                 <h4 className="text-[10px] font-black uppercase tracking-widest">About this data</h4>
                 <p className="text-[10px] text-muted-foreground leading-relaxed uppercase">
                   This information is extracted locally in your browser. It reveals technical details that are often used to track your location or identify your hardware.
                 </p>
              </div>
           </div>
        </div>
      ) : (

        <div className="space-y-8 max-w-2xl mx-auto">
          <div className="glass-panel p-12 rounded-3xl flex flex-col items-center justify-center min-h-[450px] bg-white/[0.02] border-white/5 relative overflow-hidden">
            {isProcessing ? (
              <div className="flex flex-col items-center text-center space-y-6">
                 <div className="relative">
                    <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full animate-pulse" />
                    <RefreshCw className="w-16 h-16 text-primary animate-spin relative" />
                 </div>
                 <h2 className="text-xl font-black uppercase tracking-widest">Stripping Metadata...</h2>
                 <p className="text-[10px] text-muted-foreground uppercase max-w-[200px]">Rebuilding image pixels to ensure 100% privacy.</p>
              </div>
            ) : error ? (
              <div className="text-center space-y-6">
                 <div className="p-8 bg-red-500/10 rounded-full inline-block text-red-500">
                    <ShieldCheck className="w-16 h-16 opacity-50" />
                 </div>
                 <h2 className="text-xl font-black uppercase tracking-widest text-red-500">Sanitization Failed</h2>
                 <p className="text-xs text-muted-foreground max-w-xs mx-auto uppercase">{error}</p>
                 <button onClick={handleBack} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Try another image</button>
              </div>
            ) : (
              <div className="text-center space-y-8 animate-in zoom-in-95 duration-500">
                 <div className="relative inline-block">
                    <div className="absolute inset-0 blur-3xl bg-emerald-500/20 rounded-full" />
                    <div className="p-10 bg-emerald-500/10 rounded-full relative text-emerald-500 border border-emerald-500/20">
                       <ShieldCheck className="w-20 h-20" />
                    </div>
                 </div>
                 <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 italic">Image Purified</h2>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
                       All GPS coordinates, device fingerprints, and hidden headers have been permanently deleted.
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

          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex gap-5 bg-white/[0.01]">
             <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                <Info className="w-5 h-5 text-primary" />
             </div>
             <div className="space-y-1">
                <h4 className="text-[10px] font-black uppercase tracking-widest">Privacy Protocol</h4>
                <p className="text-[10px] text-muted-foreground leading-relaxed uppercase">
                  Vanity doesn't just "edit" tags. It performs a **Pixel Reconstruction**—reading the original pixels and writing them to a fresh container, making it mathematically impossible for any original metadata to remain.
                </p>
             </div>
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
