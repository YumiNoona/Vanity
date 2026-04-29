import React, { useState, useRef, useEffect, useCallback } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Grid3X3, Download, RefreshCw, Scissors, AlertCircle, FileArchive, Play, Pause, Trash2, ZoomIn, ZoomOut, Eye, SkipForward, SkipBack, X } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { toast } from "sonner"
import { guardDimensions, maybeYield } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { useObjectUrl } from "@/hooks/useObjectUrl"

const MAX_PIXELS = 20_000_000
const EMPTY_THRESHOLD = 0.01 // 1% non-transparent pixels = considered empty

interface SpriteFrame {
  id: string
  row: number
  col: number
  url: string
  blob: Blob
  isEmpty: boolean
  width: number
  height: number
}

function checkIfEmpty(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return true
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  let nonTransparent = 0
  const total = canvas.width * canvas.height
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 10) nonTransparent++
  }
  return (nonTransparent / total) < EMPTY_THRESHOLD
}

export function SpriteSlicer() {
  const [file, setFile] = useState<File | null>(null)
  const [imgData, setImgData] = useState<HTMLImageElement | null>(null)
  const [rows, setRows] = useState(4)
  const [cols, setCols] = useState(4)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSliced, setIsSliced] = useState(false)
  const [frames, setFrames] = useState<SpriteFrame[]>([])
  const [zoom, setZoom] = useState(1)
  const [hasRemainder, setHasRemainder] = useState(false)

  // Animation state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [fps, setFps] = useState(12)
  const [animZoom, setAnimZoom] = useState(2)
  const animIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const { url: zipUrl, setUrl: setZipUrl, clear: clearZipUrl } = useObjectUrl()

  // Cleanup frame URLs on unmount
  useEffect(() => {
    return () => {
      frames.forEach(f => URL.revokeObjectURL(f.url))
    }
  }, [])

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile) return

    setIsProcessing(true)
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const { width, height } = guardDimensions(img.width, img.height)

          const tempCanvas = document.createElement("canvas")
          tempCanvas.width = width
          tempCanvas.height = height
          const ctx = tempCanvas.getContext("2d")
          if (ctx) {
            ctx.imageSmoothingEnabled = false
            ctx.drawImage(img, 0, 0, width, height)
          }

          const scaledImg = new Image()
          scaledImg.onload = () => {
            setImgData(scaledImg)
            setFile(uploadedFile)
            setIsProcessing(false)
            setIsSliced(false)
            setFrames([])
            clearZipUrl()
          }
          const dataUrl = tempCanvas.toDataURL()
          scaledImg.src = dataUrl

          tempCanvas.width = 0
          tempCanvas.height = 0
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(uploadedFile)
    } catch (err) {
      toast.error("Failed to load image")
      setIsProcessing(false)
    }
  }

  // Draw Main Canvas & Overlay
  useEffect(() => {
    if (!imgData || !canvasRef.current || !overlayRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = imgData.width
    canvas.height = imgData.height

    ctx.imageSmoothingEnabled = false
    ctx.drawImage(imgData, 0, 0, canvas.width, canvas.height)

    const oCanvas = overlayRef.current
    oCanvas.width = canvas.width
    oCanvas.height = canvas.height
    const oCtx = oCanvas.getContext("2d")
    if (!oCtx) return

    oCtx.setLineDash([5, 5])
    oCtx.strokeStyle = "rgba(245, 158, 11, 0.8)"
    oCtx.lineWidth = 1

    const stepX = canvas.width / cols
    const stepY = canvas.height / rows

    for (let i = 1; i < cols; i++) {
      oCtx.beginPath()
      oCtx.moveTo(i * stepX, 0)
      oCtx.lineTo(i * stepX, canvas.height)
      oCtx.stroke()
    }
    for (let j = 1; j < rows; j++) {
      oCtx.beginPath()
      oCtx.moveTo(0, j * stepY)
      oCtx.lineTo(canvas.width, j * stepY)
      oCtx.stroke()
    }

    setHasRemainder(imgData.width % cols !== 0 || imgData.height % rows !== 0)
  }, [imgData, rows, cols])

  // Slice into frames
  const sliceFrames = useCallback(async () => {
    if (!imgData) return
    setIsProcessing(true)

    // Cleanup old frame URLs
    frames.forEach(f => URL.revokeObjectURL(f.url))

    const tileW = Math.floor(imgData.width / cols)
    const tileH = Math.floor(imgData.height / rows)
    if (tileW <= 0 || tileH <= 0) {
      toast.error("Grid too fine — tiles would be 0px")
      setIsProcessing(false)
      return
    }

    const newFrames: SpriteFrame[] = []

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const canvas = document.createElement("canvas")
        canvas.width = tileW
        canvas.height = tileH
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (ctx) {
          ctx.imageSmoothingEnabled = false
          ctx.drawImage(imgData, c * tileW, r * tileH, tileW, tileH, 0, 0, tileW, tileH)
        }

        const isEmpty = checkIfEmpty(canvas)
        const blob = await new Promise<Blob>(resolve =>
          canvas.toBlob(b => resolve(b!), "image/png")
        )
        const url = URL.createObjectURL(blob)

        newFrames.push({
          id: `${r}-${c}`,
          row: r,
          col: c,
          url,
          blob,
          isEmpty,
          width: tileW,
          height: tileH
        })

        canvas.width = 0
        canvas.height = 0

        if ((r * cols + c) % 8 === 0) await maybeYield()
      }
    }

    setFrames(newFrames)
    setIsSliced(true)
    setCurrentFrame(0)
    setIsProcessing(false)
    toast.success(`Extracted ${newFrames.length} frames (${newFrames.filter(f => f.isEmpty).length} empty detected)`)
  }, [imgData, rows, cols, frames])

  // Remove a frame
  const removeFrame = (id: string) => {
    setFrames(prev => {
      const target = prev.find(f => f.id === id)
      if (target) URL.revokeObjectURL(target.url)
      return prev.filter(f => f.id !== id)
    })
  }

  // Remove all empty frames
  const removeAllEmpty = () => {
    const empties = frames.filter(f => f.isEmpty)
    empties.forEach(f => URL.revokeObjectURL(f.url))
    setFrames(prev => prev.filter(f => !f.isEmpty))
    toast.success(`Removed ${empties.length} empty frames`)
  }

  // Animation playback
  useEffect(() => {
    if (isPlaying && frames.length > 0) {
      animIntervalRef.current = setInterval(() => {
        setCurrentFrame(prev => (prev + 1) % frames.length)
      }, 1000 / fps)
    }
    return () => {
      if (animIntervalRef.current) clearInterval(animIntervalRef.current)
    }
  }, [isPlaying, fps, frames.length])

  const activeFrames = frames.filter(f => !f.isEmpty)

  const stepFrame = (dir: -1 | 1) => {
    setIsPlaying(false)
    setCurrentFrame(prev => {
      const next = prev + dir
      if (next < 0) return frames.length - 1
      if (next >= frames.length) return 0
      return next
    })
  }

  // Export ZIP
  const exportZip = async () => {
    if (frames.length === 0) return
    setIsProcessing(true)

    try {
      const JSZipModule = await import("jszip")
      const JSZip = JSZipModule.default
      const zip = new JSZip()

      frames.forEach((frame, i) => {
        zip.file(`frame_${String(i + 1).padStart(3, '0')}_r${frame.row + 1}_c${frame.col + 1}.png`, frame.blob)
      })

      const content = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      })
      setZipUrl(content)
      toast.success(`Archive ready — ${frames.length} frames`)
    } catch (err: any) {
      toast.error(err.message || "Failed to generate zip")
    } finally {
      setIsProcessing(false)
    }
  }

  // Zoom controls
  const zoomIn = () => setZoom(prev => Math.min(prev + 0.25, 4))
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.25))
  const resetZoom = () => setZoom(1)

  if (!file) {
    return (
      <ToolUploadLayout title="Sprite Slicer" description="Upload a sprite sheet to extract individual frames, preview animations, and export." icon={Scissors}>
        <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} label="Drop sprite sheet here" />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout title="Sprite Studio" description={`${file.name} — ${imgData?.width}×${imgData?.height}px`} icon={Grid3X3} centered={true} maxWidth="max-w-[1600px]">

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Controls */}
        <div className="xl:col-span-3 space-y-4">
          {/* Grid Config */}
          <div className="glass-panel p-5 rounded-2xl space-y-5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Grid3X3 className="w-3 h-3 text-primary" /> Grid Configuration
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <span className="text-[10px] text-white/40 uppercase font-bold">Rows</span>
                <input
                  type="number"
                  value={rows}
                  onChange={(e) => { setRows(Math.max(1, parseInt(e.target.value) || 1)); setIsSliced(false); clearZipUrl() }}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] text-white/40 uppercase font-bold">Cols</span>
                <input
                  type="number"
                  value={cols}
                  onChange={(e) => { setCols(Math.max(1, parseInt(e.target.value) || 1)); setIsSliced(false); clearZipUrl() }}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none transition-all"
                />
              </div>
            </div>

            {hasRemainder && (
              <div className="px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="text-[9px] font-bold text-amber-500 uppercase">Grid doesn't divide evenly — edge tiles may be clipped</span>
              </div>
            )}

            <div className="text-[10px] text-muted-foreground font-mono text-center">
              {rows} × {cols} = {rows * cols} tiles
              {imgData && <> · {Math.floor(imgData.width / cols)}×{Math.floor(imgData.height / rows)}px each</>}
            </div>

            <button
              onClick={sliceFrames}
              disabled={isProcessing}
              className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
              {isSliced ? "Re-Slice" : "Slice Frames"}
            </button>
          </div>

          {/* Animation Player (only after slicing) */}
          {isSliced && frames.length > 0 && (
            <div className="glass-panel p-5 rounded-2xl space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Play className="w-3 h-3 text-emerald-400" /> Animation Preview
              </label>

              {/* Preview */}
              <div className="aspect-square bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzIyMjIyMiIvPgo8cmVjdCB4PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMWExYTFhIi8+CjxyZWN0IHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMxYTFhMWEiLz4KPHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMyMjIyMjIiLz4KPC9zdmc+')] rounded-xl border border-white/10 flex items-center justify-center overflow-hidden relative">
                {frames[currentFrame] && (
                  <img
                    src={frames[currentFrame].url}
                    className="object-contain pixelated transition-none"
                    style={{ width: `${animZoom * 100}%`, height: `${animZoom * 100}%`, imageRendering: 'pixelated' }}
                    alt={`Frame ${currentFrame + 1}`}
                  />
                )}
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 rounded text-[9px] font-mono text-white/60">
                  {currentFrame + 1}/{frames.length}
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-1">
                <button onClick={() => stepFrame(-1)} className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors">
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={cn(
                    "p-3 rounded-xl font-bold transition-all",
                    isPlaying ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                  )}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button onClick={() => stepFrame(1)} className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors">
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* FPS */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-white/40 uppercase font-bold">Speed</span>
                  <span className="text-[10px] font-mono text-primary font-bold">{fps} FPS</span>
                </div>
                <input
                  type="range" min="1" max="60" value={fps}
                  onChange={(e) => setFps(parseInt(e.target.value))}
                  className="w-full accent-primary h-1 appearance-none bg-white/10 rounded-full cursor-pointer"
                />
              </div>

              {/* Anim Zoom */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-white/40 uppercase font-bold">Preview Zoom</span>
                  <span className="text-[10px] font-mono text-primary font-bold">{animZoom}x</span>
                </div>
                <input
                  type="range" min="1" max="6" step="0.5" value={animZoom}
                  onChange={(e) => setAnimZoom(parseFloat(e.target.value))}
                  className="w-full accent-primary h-1 appearance-none bg-white/10 rounded-full cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Export */}
          {isSliced && frames.length > 0 && (
            <div className="glass-panel p-5 rounded-2xl space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <FileArchive className="w-3 h-3 text-cyan-400" /> Export
              </label>

              {frames.some(f => f.isEmpty) && (
                <button
                  onClick={removeAllEmpty}
                  className="w-full py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase rounded-xl hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-3 h-3" /> Remove {frames.filter(f => f.isEmpty).length} Empty Frames
                </button>
              )}

              {zipUrl ? (
                <a
                  href={zipUrl}
                  download={`vanity-sprites-${Date.now()}.zip`}
                  className="w-full py-3.5 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download ZIP ({frames.length} frames)
                </a>
              ) : (
                <button
                  onClick={exportZip}
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-cyan-500 text-black font-bold rounded-xl shadow-lg shadow-cyan-500/20 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileArchive className="w-4 h-4" />}
                  Export ZIP
                </button>
              )}
            </div>
          )}
        </div>

        {/* Main Workspace */}
        <div className="xl:col-span-9 space-y-4">
          {/* Canvas with Zoom */}
          <div className="glass-panel rounded-2xl bg-[#050505] overflow-hidden shadow-inner relative">
            {/* Zoom toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-b border-white/5">
              <div className="flex items-center gap-1">
                <button onClick={zoomOut} className="p-1.5 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors" title="Zoom Out">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button onClick={resetZoom} className="px-3 py-1 text-[10px] font-mono font-bold text-muted-foreground hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  {Math.round(zoom * 100)}%
                </button>
                <button onClick={zoomIn} className="p-1.5 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors" title="Zoom In">
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
              <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
                {imgData?.width}×{imgData?.height}px · {rows}×{cols} grid
              </div>
            </div>

            <div className="overflow-auto custom-scrollbar" style={{ maxHeight: isSliced ? '350px' : '550px' }}>
              <div
                className="p-4 flex items-center justify-center min-h-[300px]"
                style={{ minWidth: imgData ? imgData.width * zoom + 32 : 'auto' }}
              >
                <div className="relative" style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}>
                  <canvas ref={canvasRef} className="rounded-lg shadow-2xl shadow-primary/5" style={{ imageRendering: 'pixelated' }} />
                  <canvas ref={overlayRef} className="absolute inset-0 rounded-lg pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Frame Grid (after slicing) */}
          {isSliced && frames.length > 0 && (
            <div className="glass-panel rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-b border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Extracted Frames
                  </span>
                  <span className="text-[10px] font-mono text-primary font-bold">
                    {frames.length} total · {frames.filter(f => !f.isEmpty).length} valid · {frames.filter(f => f.isEmpty).length} empty
                  </span>
                </div>
              </div>

              <div className="p-4 overflow-y-auto custom-scrollbar" style={{ maxHeight: '320px' }}>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
                  {frames.map((frame, idx) => (
                    <div
                      key={frame.id}
                      className={cn(
                        "relative group rounded-lg border overflow-hidden transition-all cursor-pointer",
                        frame.isEmpty
                          ? "border-red-500/30 bg-red-500/5 opacity-50 hover:opacity-100"
                          : "border-white/10 bg-black/40 hover:border-primary/50",
                        currentFrame === idx && "ring-2 ring-primary ring-offset-1 ring-offset-black"
                      )}
                      onClick={() => { setCurrentFrame(idx); setIsPlaying(false) }}
                    >
                      <div className="aspect-square flex items-center justify-center p-1 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+CjxyZWN0IHdpZHRoPSI1IiBoZWlnaHQ9IjUiIGZpbGw9IiMxODE4MTgiLz4KPHJlY3QgeD0iNSIgd2lkdGg9IjUiIGhlaWdodD0iNSIgZmlsbD0iIzEyMTIxMiIvPgo8cmVjdCB5PSI1IiB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjMTIxMjEyIi8+CjxyZWN0IHg9IjUiIHk9IjUiIHdpZHRoPSI1IiBoZWlnaHQ9IjUiIGZpbGw9IiMxODE4MTgiLz4KPC9zdmc+')]">
                        <img
                          src={frame.url}
                          className="max-w-full max-h-full object-contain"
                          style={{ imageRendering: 'pixelated' }}
                          alt={`Frame ${idx + 1}`}
                        />
                      </div>

                      {/* Frame number badge */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-center py-0.5">
                        <span className="text-[7px] font-mono font-bold text-white/60">{idx + 1}</span>
                      </div>

                      {/* Empty badge */}
                      {frame.isEmpty && (
                        <div className="absolute top-0.5 left-0.5 px-1 bg-red-500/80 rounded text-[6px] font-bold text-white uppercase">
                          Empty
                        </div>
                      )}

                      {/* Delete on hover */}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFrame(frame.id) }}
                        className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove frame"
                      >
                        <X className="w-2.5 h-2.5 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
