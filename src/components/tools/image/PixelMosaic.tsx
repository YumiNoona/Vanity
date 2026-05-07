import React, { useState, useEffect, useRef } from "react"
import {
  Upload, Image as ImageIcon, Play, Download,
  RotateCcw, Sliders, Layers, Sparkles,
  AlertCircle, ChevronRight, CheckCircle2,
  X
} from "lucide-react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { DropZone } from "@/components/shared/DropZone"
import { PillToggle } from "@/components/shared/PillToggle"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

// Import presets
import obama from "@/assets/presets/obama.png"
import cat from "@/assets/presets/cat.png"
import sigma from "@/assets/presets/sigma.png"

// Preset thumbnails
const PRESETS = [
  { id: 'obama', name: 'Obama', url: obama },
  { id: 'cat', name: 'Cat', url: cat },
  { id: 'sigma', name: 'Sigma', url: sigma }
]

export function PixelMosaic() {
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [sourcePreview, setSourcePreview] = useState<string>("")
  const [targetFile, setTargetFile] = useState<File | null>(null)
  const [targetPreset, setTargetPreset] = useState<string>("obama")
  const [sidelen, setSidelen] = useState<number>(128)
  const [proximityImportance, setProximityImportance] = useState<number>(13)

  const [status, setStatus] = useState<'idle' | 'processing' | 'done'>('idle')
  const [progress, setProgress] = useState(0)
  const [resultUrl, setResultUrl] = useState<string>("")

  const workerRef = useRef<Worker | null>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Initialize worker with relative path for better Vite compatibility
    workerRef.current = new Worker(
      new URL('../../../workers/pixelMosaic.worker.ts', import.meta.url),
      { type: 'module' }
    )

    workerRef.current.onmessage = (e) => {
      const msg = e.data
      if (msg.type === 'progress') {
        setProgress(msg.value)
      } else if (msg.type === 'preview') {
        paintCanvas(msg.pixels)
      } else if (msg.type === 'done') {
        paintCanvas(msg.pixels)
        setStatus('done')
        setProgress(1)

        // Convert to data URL for comparison
        const canvas = previewCanvasRef.current
        if (canvas) {
          setResultUrl(canvas.toDataURL())
        }
      }
    }

    return () => {
      workerRef.current?.terminate()
    }
  }, [sidelen])

  // Initial preview paint when source image is uploaded
  useEffect(() => {
    if (sourceFile && status === 'idle') {
      extractPixels(sourceFile, sidelen).then(pixels => {
        paintCanvas(pixels)
      })
    }
  }, [sourceFile, sidelen, status])

  const paintCanvas = (pixels: Uint8ClampedArray) => {
    const canvas = previewCanvasRef.current
    if (!canvas) return
    canvas.width = sidelen
    canvas.height = sidelen
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const imageData = new ImageData(pixels as any, sidelen, sidelen)
    ctx.putImageData(imageData, 0, 0)
  }

  const handleSourceDrop = (files: File[]) => {
    if (files[0]) {
      setSourceFile(files[0])
      setSourcePreview(URL.createObjectURL(files[0]))
      setStatus('idle')
      setResultUrl("")
    }
  }

  async function extractPixels(file: File | string, sidelen: number): Promise<Uint8ClampedArray> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = sidelen
        canvas.height = sidelen
        const ctx = canvas.getContext('2d')!

        // Center crop
        const side = Math.min(img.naturalWidth, img.naturalHeight)
        const sx = (img.naturalWidth - side) / 2
        const sy = (img.naturalHeight - side) / 2

        ctx.drawImage(img, sx, sy, side, side, 0, 0, sidelen, sidelen)
        resolve(ctx.getImageData(0, 0, sidelen, sidelen).data)
      }
      img.onerror = reject
      img.src = file instanceof File ? URL.createObjectURL(file) : file
    })
  }

  const startProcessing = async () => {
    if (!sourceFile) {
      toast.error("Please upload a source image first")
      return
    }

    setStatus('processing')
    setProgress(0)
    setResultUrl("")

    try {
      const targetSrc = targetFile ?? PRESETS.find(p => p.id === targetPreset)?.url ?? PRESETS[0].url
      const [srcPixels, tgtPixels] = await Promise.all([
        extractPixels(sourceFile, sidelen),
        extractPixels(targetSrc, sidelen)
      ])

      workerRef.current?.postMessage({
        type: 'start',
        sourcePixels: srcPixels,
        targetPixels: tgtPixels,
        sidelen,
        proximityImportance
      }, [srcPixels.buffer, tgtPixels.buffer])
    } catch (error) {
      console.error(error)
      toast.error("Failed to prepare images")
      setStatus('idle')
    }
  }

  const downloadResult = () => {
    const canvas = previewCanvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'pixel-mosaic.png'
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <ToolLayout
      title="Pixel Mosaic"
      description="Genetic image scrambling algorithm that re-arranges pixels to form a new image."
      icon={Sparkles}
      maxWidth="max-w-6xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Controls */}
        <div className="lg:col-span-5 space-y-6">
          <section className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-white/50 flex items-center gap-2">
              <Layers className="w-4 h-4" /> 1. Target Style
            </h3>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Your image will be rearranged into this shape</p>
            <div className="grid grid-cols-2 gap-3">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => { setTargetPreset(preset.id); setTargetFile(null); }}
                  className={cn(
                    "relative aspect-video rounded-xl overflow-hidden border-2 transition-all group",
                    targetPreset === preset.id && !targetFile ? "border-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]" : "border-white/5 hover:border-white/20"
                  )}
                >
                  <img src={preset.url} alt={preset.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">{preset.name}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-2">
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-primary/50 transition-colors bg-white/5">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setTargetFile(file)
                      setTargetPreset("")
                    }
                  }}
                />
                <span className="text-[10px] font-black uppercase text-white/50 tracking-widest">
                  {targetFile ? targetFile.name : "Or Upload Custom Style"}
                </span>
              </label>
            </div>
          </section>

          <section className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-white/50 flex items-center gap-2">
              <Upload className="w-4 h-4" /> 2. Your Photo
            </h3>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">These pixels will be used to build the mosaic</p>
            <DropZone
              onDrop={handleSourceDrop}
              accept={{ 'image/*': [] }}
              maxFiles={1}
            />
            {sourcePreview && (
              <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/10">
                <img src={sourcePreview} alt="Source" className="w-full h-full object-cover" />
                <button
                  onClick={() => { setSourceFile(null); setSourcePreview(""); }}
                  className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-red-500 rounded-full text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </section>

          <section className="glass-panel p-6 rounded-3xl space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-white/50 flex items-center gap-2">
              <Sliders className="w-4 h-4" /> 3. Algorithm Settings
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Resolution</label>
                <span className="text-[10px] font-bold text-primary">{sidelen}px</span>
              </div>
              <div className="flex gap-2">
                {[64, 128, 256].map((res) => (
                  <button
                    key={res}
                    onClick={() => setSidelen(res)}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-xs font-bold uppercase transition-all",
                      sidelen === res ? "bg-primary text-white shadow-lg" : "bg-white/5 text-white/50 hover:bg-white/10"
                    )}
                  >
                    {res}
                  </button>
                ))}
              </div>
              {sidelen === 256 && (
                <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-[10px] animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>Warning: 256px resolution takes significantly longer to process.</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Proximity Weight</label>
                <span className="text-[10px] font-bold text-primary">{proximityImportance}</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={proximityImportance}
                onChange={(e) => setProximityImportance(parseInt(e.target.value))}
                className="w-full accent-primary bg-white/10 h-1.5 rounded-full appearance-none"
              />
              <div className="flex justify-between text-[8px] font-black uppercase tracking-tighter text-white/20">
                <span>Scrambled</span>
                <span>Balanced</span>
                <span>Subtle</span>
              </div>
            </div>

            <button
              onClick={startProcessing}
              disabled={!sourceFile || status === 'processing'}
              className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-3"
            >
              {status === 'processing' ? (
                <RotateCcw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {status === 'processing' ? 'Processing Mosaic...' : 'Start Genetic Algorithm'}
            </button>
          </section>
        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-8 rounded-[3rem] border border-white/5 bg-black/20 flex flex-col items-center justify-center min-h-[600px] relative overflow-hidden group">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

            {status === 'idle' && !sourcePreview && (
              <div className="text-center space-y-4 animate-in fade-in duration-700">
                <div className="p-8 bg-primary/5 rounded-full border border-primary/20 inline-block">
                  <ImageIcon className="w-16 h-16 text-primary/30" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black font-syne text-white uppercase tracking-tighter">Live Preview</h3>
                  <p className="text-sm text-muted-foreground">Upload an image to begin the scrambling process.</p>
                </div>
              </div>
            )}

            {(status === 'processing' || status === 'done' || (status === 'idle' && sourcePreview)) && (
              <div className="w-full max-w-lg space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="relative aspect-square bg-black/40 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl group/canvas">
                  <canvas
                    ref={previewCanvasRef}
                    className="w-full h-full object-contain"
                  />

                  {status === 'processing' && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-3">
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                            className="w-1.5 h-1.5 bg-primary rounded-full"
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Evolving...</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                    <span>Convergence Progress</span>
                    <span className="text-primary">{Math.round(progress * 100)}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {status === 'done' && (
                  <div className="flex gap-4">
                    <button
                      onClick={downloadResult}
                      className="flex-1 py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3"
                    >
                      <Download className="w-4 h-4" /> Download PNG
                    </button>
                    <button
                      onClick={() => setStatus('idle')}
                      className="flex-1 py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3"
                    >
                      <RotateCcw className="w-4 h-4" /> Reset
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>


        </div>
      </div>
    </ToolLayout>
  )
}
