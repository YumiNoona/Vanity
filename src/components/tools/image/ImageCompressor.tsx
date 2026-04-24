import React, { useState, useEffect } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { DropZone } from "@/components/shared/DropZone"
import { Download, Minimize2, Loader2, Info, ArrowLeft, Layers, Gauge } from "lucide-react"
import { usePremium } from "@/hooks/usePremium"
import { useObjectUrl } from "@/hooks/useObjectUrl"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { downloadBlob } from "@/lib/canvas/export"

export function ImageCompressor() {
  const { validateFiles } = usePremium()
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()
  
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [phase, setPhase] = useState("")
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  
  // Settings
  const [targetSizeKB, setTargetSizeKB] = useState(100)

  const loadImageFromFile = (input: File) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const objectUrl = URL.createObjectURL(input)
      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(objectUrl)
        resolve(img)
      }
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error("Failed to decode image"))
      }
      img.src = objectUrl
    })

  const runIterativeCompress = async (file: File, targetKB: number) => {
    const targetBytes = targetKB * 1024
    const MAX_ITERS = 8
    const img = await loadImageFromFile(file)

    let scale = 1.0
    let quality = 0.85
    let iteration = 0
    let lastBlob: Blob | null = null

    while (iteration++ < MAX_ITERS) {
      const canvas = document.createElement("canvas")
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext("2d")!
      ctx.imageSmoothingQuality = "high"
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", quality))
      lastBlob = blob

      if (blob.size <= targetBytes) break

      // Strategy: drop quality first, then resolution
      if (quality > 0.4) quality -= 0.15
      else scale -= 0.15
    }
    return lastBlob!
  }

  const handleFiles = async (files: File[]) => {
    if (files.length === 0 || !validateFiles(files)) return

    const uploadedFile = files[0]
    setFile(uploadedFile)
    setIsProcessing(true)
    try {
      const compressed = await runIterativeCompress(uploadedFile, targetSizeKB)
      setResultBlob(compressed)
      setResultUrl(compressed)
      toast.success("Image compressed!")
    } catch (error) {
      toast.error("Compression failed")
    } finally {
      setIsProcessing(false)
    }
  }


  const handleDownload = () => {
    if (!resultBlob) return
    downloadBlob(resultBlob, `vanity-compressed-${file?.name || "image.jpg"}`)
  }

  return (
    <ToolLayout
      title="Elite Image Compressor"
      description="Aggressively reduce file size while maintaining visual integrity via iterative smart encoding."
      icon={Minimize2}
    >
      <div className="space-y-8">
        {!file ? (
          <div className="space-y-8 animate-in fade-in duration-500">

             <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-8">
                <div className="flex flex-col items-center gap-2">
                   <Gauge className="w-5 h-5 text-primary" />
                   <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Max Size (KB)</label>
                </div>
                
                <div className="grid grid-cols-5 gap-3">
                   {[50, 100, 250, 500, 1000].map(k => (
                     <button
                       key={k}
                       onClick={() => setTargetSizeKB(k)}
                       className={cn(
                         "p-4 rounded-xl border text-center transition-all",
                         targetSizeKB === k ? "bg-primary text-primary-foreground shadow-lg" : "bg-white/5 border-white/5 hover:bg-white/10"
                       )}
                     >
                        <span className="text-sm font-bold">{k}</span>
                     </button>
                   ))}
                </div>

                <div className="relative">
                   <input 
                     type="range" min="10" max="2000" step="10" 
                     value={targetSizeKB} onChange={e => setTargetSizeKB(parseInt(e.target.value))}
                     className="w-full accent-primary"
                   />
                   <div className="flex justify-between mt-2 text-xs md:text-sm font-mono text-muted-foreground">
                      <span>10 KB</span>
                      <span>{targetSizeKB} KB</span>
                      <span>2000 KB</span>
                   </div>
                </div>
             </div>

             <DropZone onDrop={handleFiles} label="Drop image to compress" />
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-primary/20 rounded-lg text-primary">
                      <Layers className="w-5 h-5" />
                   </div>
                   <div>
                      <p className="text-sm font-bold uppercase tracking-widest">
                         {file?.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase">Targeting {targetSizeKB} KB</p>
                   </div>
                </div>
                <button onClick={() => { setFile(null); clearResultUrl(); }} className="text-xs text-muted-foreground hover:text-white flex items-center gap-2">
                   <ArrowLeft className="w-3 h-3" /> Change
                </button>
             </div>

             <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 flex flex-col items-center justify-center min-h-[400px]">
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-4">
                     <Loader2 className="w-12 h-12 text-primary animate-spin" />
                     <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Compressing...</p>
                  </div>
                ) : resultUrl ? (
                  <div className="space-y-8 w-full flex flex-col items-center">
                     <img src={resultUrl} className="max-h-[400px] rounded-xl shadow-2xl border border-white/5" />
                     <div className="flex items-center gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <div className="text-center">
                           <p className="text-[8px] font-black uppercase text-muted-foreground">Original</p>
                           <p className="text-lg font-mono font-bold text-white/50">{(file!.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <div className="w-px h-8 bg-white/5" />
                        <div className="text-center">
                           <p className="text-[8px] font-black uppercase text-primary">Compressed</p>
                           <p className="text-lg font-mono font-bold text-white">{(resultBlob!.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <div className="w-px h-8 bg-white/5" />
                        <div className="text-center">
                           <p className="text-[8px] font-black uppercase text-emerald-500">Savings</p>
                           <p className="text-lg font-mono font-bold text-emerald-500">{Math.round((1 - resultBlob!.size / file!.size) * 100)}%</p>
                        </div>
                     </div>
                     <button 
                        onClick={handleDownload}
                        className="px-10 py-4 bg-primary text-primary-foreground font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-3"
                     >
                        <Download className="w-6 h-6" /> Export
                     </button>
                  </div>
                ) : null}
             </div>
          </div>
        )}

        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4">
           <Info className="w-5 h-5 text-primary shrink-0" />
           <p className="text-sm text-muted-foreground leading-relaxed">
             Our compressor uses iterative encoding to find the optimal quality-to-size ratio for your specific target. Everything stays in your browser.
           </p>
        </div>
      </div>
    </ToolLayout>
  )
}
