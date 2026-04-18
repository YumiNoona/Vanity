import React, { useState, useCallback, useRef } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ModeToggle } from "@/components/shared/ModeToggle"
import { ProcessingQueue } from "@/components/shared/ProcessingQueue"
import { ArrowLeft, Image as ImageIcon, Download, Settings2, ShieldCheck } from "lucide-react"
import { useObjectUrl } from "@/hooks/useObjectUrl"
import type { QueueItem } from "@/types/bulk"
import heic2any from "heic2any"
import { toast } from "sonner"
import JSZip from "jszip"
import { downloadBlob } from "@/lib/canvas"

export function HeicToJpg() {
  // Modes: "single" or "batch"
  const [mode, setMode] = useState<"single" | "batch">("single")
  const [outputFormat, setOutputFormat] = useState<"jpeg" | "png">("jpeg")

  // Single Mode State
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()
  const resultBlobRef = useRef<Blob | null>(null)

  // Bulk Mode State
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)
  const isCancelledRef = useRef(false)

  // -- SINGLE MODE -------------------------------------------------------------
  const processSingle = async (uploadedFile: File) => {
    setIsProcessing(true)
    try {
      const resultBlob = await heic2any({
        blob: uploadedFile,
        toType: `image/${outputFormat}`,
        quality: 0.9,
      })

      const finalBlob = Array.isArray(resultBlob) ? resultBlob[0] : resultBlob;
      resultBlobRef.current = finalBlob;
      setResultUrl(finalBlob)
      toast.success("HEIC converted successfully!")
    } catch (e) {
      console.error(e)
      toast.error("Failed to parse HEIC file.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownloadSingle = () => {
    if (!resultBlobRef.current || !file) return
    const newName = file.name.replace(/\.heic$/i, `.${outputFormat}`)
    downloadBlob(resultBlobRef.current, newName)
  }

  // -- BULK MODE ---------------------------------------------------------------
  const processBatchQueue = useCallback(async (currentQueue: QueueItem[]) => {
    setIsBatchProcessing(true)
    isCancelledRef.current = false

    for (const item of currentQueue) {
      if (isCancelledRef.current) break
      if (item.status !== "pending") continue

      setQueue(prev => prev.map(q => 
        q.id === item.id ? { ...q, status: "processing" } : q
      ))

      try {
         const result = await heic2any({
           blob: item.file,
           toType: `image/${outputFormat}`,
           quality: 0.9
         })
         const finalBlob = Array.isArray(result) ? result[0] : result;
         
         const origSize = item.file.size
         const newSize = finalBlob.size
         const saved = Math.round((1 - newSize / origSize) * 100)
         const savingsStr = saved > 0 ? `-${saved}%` : `+${Math.abs(saved)}%`

         setQueue(prev => prev.map(q => 
           q.id === item.id ? { 
             ...q, 
             status: "done",
             resultBlob: finalBlob,
             savings: savingsStr
           } : q
         ))
      } catch (e) {
        setQueue(prev => prev.map(q => 
          q.id === item.id ? { ...q, status: "failed" } : q
        ))
      }
    }

    setIsBatchProcessing(false)
    if (!isCancelledRef.current) {
      toast.success("Batch conversion finished!")
    }
  }, [outputFormat])

  const handleDownloadZip = async () => {
    const doneItems = queue.filter(q => q.status === "done" && q.resultBlob)
    if (doneItems.length === 0) {
      toast.error("No finished items to download")
      return
    }

    const zip = new JSZip()
    doneItems.forEach(item => {
      const baseName = item.file.name.replace(/\.[^/.]+$/, "")
      zip.file(`${baseName}.${outputFormat}`, item.resultBlob!)
    })

    const content = await zip.generateAsync({ type: "blob" })
    downloadBlob(content, "Vanity-Converted-HEIC-Files.zip")
  }

  // -- BINDINGS ----------------------------------------------------------------
  const handleDrop = (newFiles: File[]) => {
     if (mode === "single") {
       if (newFiles[0]) {
         setFile(newFiles[0])
         clearResultUrl()
         resultBlobRef.current = null
         processSingle(newFiles[0])
       }
     } else {
       const newItems: QueueItem[] = newFiles.map(f => ({
         id: crypto.randomUUID() as string,
         file: f,
         originalSize: f.size,
         status: "pending"
       }))
       
       setQueue(prev => {
         const updated = [...prev, ...newItems]
         if (!isBatchProcessing) {
           processBatchQueue(updated)
         }
         return updated
       })
     }
  }

  // -- RENDER ------------------------------------------------------------------
  // State 1: Active Batch Processing Queue
  if (mode === "batch" && queue.length > 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 sm:px-0 pb-20">
         <div className="flex items-center justify-between mt-4">
           <div className="flex items-center gap-4">
             <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
               <ImageIcon className="w-6 h-6" />
             </div>
             <div>
               <h1 className="text-3xl font-bold font-syne text-white">HEIC Batch Converter</h1>
               <p className="text-muted-foreground text-sm">Converting iOS photos locally</p>
             </div>
           </div>
           
           <button 
             onClick={() => {
               isCancelledRef.current = true
               setQueue([])
             }} 
             className="text-sm font-medium text-muted-foreground hover:text-white flex items-center gap-2"
           >
             <ArrowLeft className="w-4 h-4" /> Start Over
           </button>
         </div>

         <DropZone 
           onDrop={handleDrop} 
           accept={{ "image/heic": [".heic", ".HEIC"] }}
           multiple={true}
           label="Add more HEIC files"
         />

         <ProcessingQueue 
           items={queue}
           disabled={isBatchProcessing}
           onRemove={(id) => setQueue(q => q.filter(i => i.id !== id))}
         />

         {queue.filter(q => q.status === "done").length > 0 && (
            <div className="flex justify-center mt-8">
              <button onClick={handleDownloadZip} className="px-8 py-4 bg-emerald-500 text-white font-bold rounded-xl hover:scale-105 transition-transform flex items-center justify-center gap-3">
                <Download className="w-5 h-5" /> Download ZIP
              </button>
            </div>
         )}
      </div>
    )
  }

  // State 2: Active Single Processing / Result
  if (mode === "single" && file) {
     return (
       <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
         <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold font-syne mb-2">HEIC Converter</h1>
              <p className="text-muted-foreground text-sm">{file.name}</p>
            </div>
            <button 
              onClick={() => { setFile(null); clearResultUrl(); resultBlobRef.current = null; }} 
              className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Start New
            </button>
         </div>

         <div className="glass-panel p-12 rounded-[2.5rem] flex flex-col items-center justify-center min-h-[400px] border-emerald-500/10 shadow-2xl relative overflow-hidden bg-black/40">
            {isProcessing ? (
               <div className="space-y-6 text-center z-10 animate-pulse">
                  <ImageIcon className="w-20 h-20 text-emerald-500 mx-auto opacity-50" />
                  <p className="text-lg font-bold text-white font-syne">Unpacking Container...</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest text-[10px]">WASM Heic Decoder</p>
               </div>
            ) : resultUrl ? (
               <div className="space-y-8 text-center animate-in zoom-in-95 duration-500 w-full max-w-sm">
                  <img src={resultUrl} alt="Converted Raster" className="w-full h-auto rounded-xl drop-shadow-2xl border border-emerald-500/20 max-h-[300px] object-contain mx-auto bg-black/50" />
                  <button 
                    onClick={handleDownloadSingle}
                    className="w-full py-5 bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
                  >
                    <Download className="w-6 h-6" /> Save via Browser
                  </button>
               </div>
            ) : null}
         </div>
       </div>
     )
  }

  // State 3: Landing Area
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
       <div className="text-center space-y-4 py-8">
         <div className="flex justify-center mb-6">
           <div className="p-4 bg-emerald-500/10 rounded-full inline-block">
             <ImageIcon className="w-10 h-10 text-emerald-500" />
           </div>
         </div>
         <h1 className="text-4xl md:text-5xl font-bold font-syne tracking-tight">
           HEIC to JPG Converter
         </h1>
         <p className="text-lg text-muted-foreground max-w-xl mx-auto">
           Instantly extract standard rasters from Apple HEIC containers natively within the browser using WebAssembly.
         </p>
         
         <div className="flex justify-center mt-6">
           <ModeToggle mode={mode} onChange={setMode} />
         </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <DropZone 
              onDrop={handleDrop} 
              accept={{ "image/heic": [".heic", ".HEIC"] }}
              multiple={mode === "batch"}
              label={mode === "batch" ? "Drop HEIC batch here" : "Drop an HEIC file here"}
            />
          </div>

          <div className="lg:col-span-4 space-y-6">
             <div className="p-8 glass-panel rounded-3xl space-y-6">
               <div className="flex items-center gap-3 text-emerald-400 mb-2">
                 <Settings2 className="w-5 h-5" />
                 <h3 className="font-bold font-syne">Params</h3>
               </div>
               
               <div className="space-y-3">
                 <label className="text-sm font-medium text-muted-foreground">Output Format</label>
                 <select 
                   value={outputFormat}
                   onChange={(e) => setOutputFormat(e.target.value as any)}
                   className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/50 outline-none transition-all"
                 >
                   <option value="jpeg">JPEG (Lossy, Smaller)</option>
                   <option value="png">PNG (Lossless, Transparent)</option>
                 </select>
                 <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                   Both pipelines extract original sensor data, but JPEG applies 90% compression scaling locally.
                 </p>
               </div>
             </div>

             <div className="p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/10 flex items-start gap-4">
                <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-sm text-white">Apple Privacy Guard</h4>
                  <p className="text-xs text-muted-foreground mt-1">HEIC decodes on your CPU directly. Photos are never uploaded to the cloud.</p>
                </div>
             </div>
          </div>
       </div>
    </div>
  )
}
