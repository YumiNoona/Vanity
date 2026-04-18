import React, { useState, useRef } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Settings2, ArrowLeft, Download, Layers, Loader2, Image as ImageIcon, Trash2, CheckCircle } from "lucide-react"

interface ProcessedImage {
  originalFile: File
  originalUrl: string
  originalWidth: number
  originalHeight: number
  resizedBlob: Blob
  resizedUrl: string
  newWidth: number
  newHeight: number
}

export function ImageResizerBulk() {
  const [files, setFiles] = useState<File[]>([])
  
  // Settings
  const [scaleMode, setScaleMode] = useState<"percentage" | "width" | "height">("width")
  const [scaleValue, setScaleValue] = useState<number>(800)
  const [quality, setQuality] = useState<number>(90)

  // Queue State
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [processed, setProcessed] = useState<ProcessedImage[]>([])
  
  const handleDrop = (newFiles: File[]) => {
    if (newFiles.length > 0) {
      // Append to queue, avoid duplicates by name
      const unique = newFiles.filter(nf => !files.some(existing => existing.name === nf.name))
      setFiles(prev => [...prev, ...unique])
      setProcessed([]) // reset output on new load
      setProgress(0)
    }
  }

  const removeFile = (name: string) => {
    setFiles(files.filter(f => f.name !== name))
  }

  const loadOriginal = async (file: File): Promise<{img: HTMLImageElement, url: string}> => {
    return new Promise((resolve, reject) => {
       const url = URL.createObjectURL(file)
       const img = new Image()
       img.onload = () => resolve({ img, url })
       img.onerror = reject
       img.src = url
    })
  }

  const processSequentially = async () => {
    if (files.length === 0) return
    setIsProcessing(true)
    setProgress(0)
    setProcessed([])
    
    const results: ProcessedImage[] = []

    // CRITICAL: Sequentially process queue directly to prevent browser thread freeze from parallel canvas contexts
    for (let i = 0; i < files.length; i++) {
       const file = files[i]
       
       try {
         const { img, url } = await loadOriginal(file)
         const canvas = document.createElement("canvas")
         
         let w = img.width
         let h = img.height

         if (scaleMode === "percentage") {
           const factor = scaleValue / 100
           w = Math.round(w * factor)
           h = Math.round(h * factor)
         } else if (scaleMode === "width") {
           const factor = scaleValue / w
           w = scaleValue
           h = Math.round(h * factor)
         } else if (scaleMode === "height") {
           const factor = scaleValue / h
           h = scaleValue
           w = Math.round(w * factor)
         }

         canvas.width = Math.max(1, w)
         canvas.height = Math.max(1, h)
         
         const ctx = canvas.getContext("2d")
         if (!ctx) throw new Error("No context")

         // High Quality Canvas Scaling
         ctx.imageSmoothingEnabled = true
         ctx.imageSmoothingQuality = "high"
         ctx.drawImage(img, 0, 0, w, h)

         // Allow UI to breathe
         await new Promise(r => setTimeout(r, 10))

         const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(b => {
              if (b) resolve(b)
              else reject(new Error("Canvas blob failed"))
            }, file.type === "image/png" ? "image/png" : "image/jpeg", quality / 100)
         })

         results.push({
            originalFile: file,
            originalUrl: url,
            originalWidth: img.width,
            originalHeight: img.height,
            resizedBlob: blob,
            resizedUrl: URL.createObjectURL(blob),
            newWidth: w,
            newHeight: h
         })

         // Update intermediate state safely so UI visibly ticks
         setProcessed([...results])
         setProgress(Math.round(((i + 1) / files.length) * 100))

       } catch (err) {
         console.error(`Failed on ${file.name}`, err)
       }
    }

    setIsProcessing(false)
  }

  const handleDownloadAll = () => {
    // If the browser prompts for multiple files permission, that's fine natively.
    processed.forEach((item, i) => {
       // Stagger anchor clicks massively to avoid chrome dropping frames entirely
       setTimeout(() => {
          const a = document.createElement("a")
          a.href = item.resizedUrl
          // prepend resized-
          a.download = `resized-${item.originalFile.name}`
          a.click()
       }, i * 300) 
    })
  }

  if (files.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center animate-in fade-in duration-500">
         <div className="inline-flex items-center justify-center p-3 bg-cyan-500/10 rounded-full mb-6 text-cyan-500">
            <Layers className="w-8 h-8" />
         </div>
         <h1 className="text-4xl font-bold font-syne mb-1 text-white">Bulk Image Resizer</h1>
         <p className="text-muted-foreground text-lg mb-8">
           Resize entire batches of images locally in a memory-safe sequential queue.
         </p>
         <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} label="Drop multiple images" multiple />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 sm:px-0 pb-20">
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-500">
             <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-syne text-white">Queue Manager</h1>
            <p className="text-muted-foreground text-sm font-mono">{files.length} items loaded</p>
          </div>
        </div>
        <button onClick={() => { setFiles([]); setProcessed([]); }} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Start Fresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-white/5 pt-6">
         
         {/* Config Panel */}
         <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel p-6 rounded-3xl space-y-6 border-cyan-500/20 bg-black/40">
               <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400 border-b border-white/5 pb-4">
                  <Settings2 className="w-4 h-4" /> Global Rules
               </div>

               <div className="space-y-4">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block">Scaling Logic</label>
                  <div className="grid grid-cols-3 gap-2 bg-black/40 border border-white/10 rounded-xl p-1 overflow-hidden">
                     <button onClick={() => setScaleMode("width")} className={`px-2 py-1.5 text-xs font-bold transition-all rounded-lg ${scaleMode === "width" ? "bg-cyan-500/20 text-cyan-400" : "text-muted-foreground hover:text-white"}`}>Width</button>
                     <button onClick={() => setScaleMode("height")} className={`px-2 py-1.5 text-xs font-bold transition-all rounded-lg ${scaleMode === "height" ? "bg-cyan-500/20 text-cyan-400" : "text-muted-foreground hover:text-white"}`}>Height</button>
                     <button onClick={() => setScaleMode("percentage")} className={`px-2 py-1.5 text-xs font-bold transition-all rounded-lg ${scaleMode === "percentage" ? "bg-cyan-500/20 text-cyan-400" : "text-muted-foreground hover:text-white"}`}>Scale %</button>
                  </div>
               </div>

               <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                     <label className="text-[10px] font-bold text-muted-foreground uppercase">{scaleMode === "percentage" ? "Percentage" : "Target Dimension (px)"}</label>
                     <span className="font-mono text-cyan-400 font-bold">{scaleValue}</span>
                  </div>
                  <input 
                     type="range"
                     min={scaleMode === "percentage" ? 10 : 100}
                     max={scaleMode === "percentage" ? 200 : 4000}
                     value={scaleValue}
                     onChange={(e) => setScaleValue(Number(e.target.value))}
                     className="w-full accent-cyan-500"
                  />
               </div>

               <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                     <label className="text-[10px] font-bold text-muted-foreground uppercase">JPEG / WebP Quality</label>
                     <span className="font-mono text-emerald-400 font-bold">{quality}%</span>
                  </div>
                  <input 
                     type="range"
                     min="10" max="100"
                     value={quality}
                     onChange={(e) => setQuality(Number(e.target.value))}
                     className="w-full accent-emerald-500"
                  />
               </div>

               <div className="pt-6">
                  {processed.length > 0 && processed.length === files.length ? (
                     <button 
                       onClick={handleDownloadAll}
                       className="w-full py-4 bg-emerald-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                     >
                        <Download className="w-5 h-5" /> Download All ({processed.length})
                     </button>
                  ) : (
                     <button 
                       onClick={processSequentially}
                       disabled={isProcessing}
                       className="w-full py-4 bg-cyan-500 text-black font-bold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:bg-cyan-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                     >
                       {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing Queue...</> : "Start Resizing Base"}
                     </button>
                  )}
               </div>
            </div>
            
            {/* Add More Dropzone */}
            <div className="h-32 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-center flex flex-col items-center justify-center overflow-hidden relative">
               <input 
                  type="file" multiple accept="image/*" 
                  onChange={(e) => e.target.files && handleDrop(Array.from(e.target.files))} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
               />
               <ImageIcon className="w-6 h-6 text-muted-foreground mb-2" />
               <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Drop more here</span>
            </div>
         </div>

         {/* Queue Area */}
         <div className="lg:col-span-8 flex flex-col h-full bg-black/40 rounded-3xl border border-white/5 overflow-hidden">
             
             {isProcessing && (
                <div className="p-4 bg-cyan-500/10 border-b border-cyan-500/20 text-cyan-400 flex flex-col gap-2 relative">
                   <div className="absolute top-0 bottom-0 left-0 bg-cyan-500/20 transition-all duration-300" style={{ width: `${progress}%` }} />
                   <div className="relative z-10 flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Sequential Processing...</span>
                      <span>{processed.length} / {files.length} Done ({progress}%)</span>
                   </div>
                </div>
             )}

             <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar max-h-[600px]">
                {files.map((f, i) => {
                   const result = processed.find(p => p.originalFile.name === f.name)
                   
                   return (
                     <div key={f.name} className={`flex items-center justify-between p-3 rounded-xl border ${result ? "bg-emerald-500/5 border-emerald-500/20" : "bg-white/5 border-white/5"} transition-colors`}>
                        <div className="flex items-center gap-4 overflow-hidden pr-4 flex-1">
                           <div className="w-8 h-8 flex items-center justify-center shrink-0">
                             {result ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <div className="text-xs font-mono text-muted-foreground">{i + 1}</div>}
                           </div>
                           <div className="flex flex-col min-w-0">
                              <span className="text-sm font-bold text-white truncate">{f.name}</span>
                              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                                 {result ? `${result.newWidth}×${result.newHeight}px` : "Pending rules"}
                              </span>
                           </div>
                        </div>

                        {!isProcessing && !result && (
                           <button onClick={() => removeFile(f.name)} className="p-2 text-muted-foreground hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors shrink-0">
                              <Trash2 className="w-4 h-4" />
                           </button>
                        )}

                        {result && (
                           <div className="flex items-center gap-4 shrink-0">
                              <a 
                                href={result.resizedUrl}
                                download={`resized-${result.originalFile.name}`}
                                className="px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black font-bold text-xs rounded-lg transition-all"
                              >
                                Download
                              </a>
                           </div>
                        )}
                     </div>
                   )
                })}
             </div>
         </div>
      </div>
    </div>
  )
}
