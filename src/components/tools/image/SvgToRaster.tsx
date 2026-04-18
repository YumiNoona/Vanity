import React, { useState, useRef } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, Download, FileType, Maximize2, RefreshCw } from "lucide-react"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useObjectUrl } from "@/hooks/useObjectUrl"

export function SvgToRaster() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [svgContent, setSvgContent] = useState<string | null>(null)
  const [scale, setScale] = useState(2)
  const [format, setFormat] = useState<"png" | "jpeg">("png")
  const [isProcessing, setIsProcessing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()
  const [lastConvertedScale, setLastConvertedScale] = useState<number | null>(null)
  const [lastConvertedFormat, setLastConvertedFormat] = useState<string | null>(null)

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return
    
    setFile(uploadedFile)
    const reader = new FileReader()
    reader.onload = (e) => setSvgContent(e.target?.result as string)
    reader.readAsText(uploadedFile)
  }

  const handleConvert = () => {
    if (!svgContent || !canvasRef.current) return
    setIsProcessing(true)

    const img = new Image()
    const svgBlob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(svgBlob)

    img.onload = async () => {
      const canvas = canvasRef.current!
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      
      const ctx = canvas.getContext("2d")!
      if (format === "jpeg") {
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), `image/${format}`, 0.92))
      setResultUrl(blob)
      setLastConvertedScale(scale)
      setLastConvertedFormat(format)
      
      URL.revokeObjectURL(url)
      setIsProcessing(false)
      toast.success(`Rendered at ${scale}x!`)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      setIsProcessing(false)
      toast.error("Failed to render SVG. It might be malformed.")
    }

    img.src = url
  }

  const handleDownload = () => {
    if (!resultUrl) return
    const a = document.createElement("a")
    a.href = resultUrl
    a.download = `vanity-raster-${file?.name.replace(".svg", "")}.${lastConvertedFormat === "jpeg" ? "jpg" : "png"}`
    a.click()
  }

  const handleReset = () => {
     setFile(null)
     setSvgContent(null)
     clearResultUrl()
     setLastConvertedScale(null)
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center animate-in fade-in duration-500">
         <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6 text-primary">
            <FileType className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1">SVG to Raster</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Convert vector SVGs to high-resolution PNG or JPG images flawlessly.
        </p>
        <DropZone onDrop={handleDrop} accept={{ "image/svg+xml": [".svg"] }} label="Drop SVG here" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
             <FileType className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-syne">Export SVG</h1>
            <p className="text-muted-foreground text-sm">{file.name}</p>
          </div>
        </div>
        <button onClick={handleReset} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Start New
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">
        <div className="lg:col-span-8">
          <div className="glass-panel p-8 rounded-2xl flex items-center justify-center min-h-[400px] bg-black/20 overflow-hidden relative">
             {svgContent ? (
                <div 
                  className="max-w-full max-h-full transition-transform duration-500" 
                  dangerouslySetInnerHTML={{ __html: svgContent }} 
                  style={{ transform: `scale(${Math.min(1, 300 / 100)})` }} // Preview scale
                />
             ) : (
                <RefreshCw className="w-12 h-12 text-primary animate-spin" />
             )}
             <div className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-widest text-white/30">Vector Preview</div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="glass-panel p-6 rounded-xl space-y-6">
              <div className="space-y-4">
                 <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Export Resolution</label>
                 <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 4].map(s => (
                       <button 
                         key={s}
                         onClick={() => setScale(s)}
                         className={cn(
                           "py-2 rounded-lg text-xs font-bold transition-all border",
                           scale === s ? "bg-primary text-primary-foreground border-primary" : "bg-white/5 border-transparent hover:bg-white/10"
                         )}
                       >
                         {s}x
                       </button>
                    ))}
                 </div>
                 <p className="text-[10px] text-muted-foreground">Increase scale for crystal clear high-quality prints.</p>
              </div>

              <div className="space-y-4">
                 <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Output Format</label>
                 <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setFormat("png")}
                      className={cn(
                        "py-2 rounded-lg text-xs font-bold transition-all border",
                        format === "png" ? "bg-primary text-primary-foreground border-primary" : "bg-white/5 border-transparent hover:bg-white/10"
                      )}
                    >
                      PNG (Alpha)
                    </button>
                    <button 
                      onClick={() => setFormat("jpeg")}
                      className={cn(
                        "py-2 rounded-lg text-xs font-bold transition-all border",
                        format === "jpeg" ? "bg-primary text-primary-foreground border-primary" : "bg-white/5 border-transparent hover:bg-white/10"
                      )}
                    >
                      JPEG (Solid)
                    </button>
                 </div>
              </div>

              {resultUrl ? (
                 <div className="space-y-4">
                    <button 
                      onClick={handleDownload}
                      className="w-full py-4 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download {lastConvertedFormat?.toUpperCase()} ({lastConvertedScale}x)
                    </button>
                    <button 
                      onClick={handleConvert}
                      disabled={isProcessing}
                      className="w-full text-xs font-bold text-muted-foreground hover:text-white transition-colors"
                    >
                      Re-render with current settings
                    </button>
                 </div>
               ) : (
                 <button 
                   onClick={handleConvert}
                   disabled={isProcessing}
                   className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                 >
                   {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                   Rasterize SVG
                 </button>
               )}
           </div>
           
           <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                 <Maximize2 className="w-3 h-3" /> Technical Note
              </h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Converting Vector to Raster involves pixel interpolation. High scaling (4x) might require more system memory.
              </p>
           </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
