import React, { useState, useRef, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, Download, Maximize, Smartphone, Share2, Share, Briefcase, ImageIcon, RefreshCw, AlertCircle } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { guardDimensions } from "@/lib/canvas/guards"
import * as fabric from "fabric"
import { useObjectUrl } from "@/hooks/useObjectUrl"

const PRESETS = [
  { id: "ig-post", name: "Instagram Post", ratio: 1, icon: Share2, dims: "1080 x 1080" },
  { id: "ig-story", name: "Instagram Story", ratio: 9/16, icon: Smartphone, dims: "1080 x 1920" },
  { id: "ig-reel", name: "Instagram Reel", ratio: 9/16, icon: Smartphone, dims: "1080 x 1920" },
  { id: "yt-thumb", name: "YouTube Thumbnail", ratio: 16/9, icon: Share2, dims: "1280 x 720" },
  { id: "yt-art", name: "YouTube Channel Art", ratio: 16/9, icon: Maximize, dims: "2560 x 1440" },
  { id: "tiktok", name: "TikTok Video", ratio: 9/16, icon: Smartphone, dims: "1080 x 1920" },
  { id: "pin", name: "Pinterest Pin", ratio: 2/3, icon: Briefcase, dims: "1000 x 1500" },
  { id: "tw-post", name: "Twitter/X Post", ratio: 16/9, icon: Share, dims: "1200 x 675" },
  { id: "tw-header", name: "Twitter/X Header", ratio: 3/1, icon: Maximize, dims: "1500 x 500" },
  { id: "li-post", name: "LinkedIn Post", ratio: 1.91/1, icon: Briefcase, dims: "1200 x 627" },
  { id: "discord", name: "Discord Banner", ratio: 16/9, icon: Smartphone, dims: "960 x 540" },
  { id: "og-preview", name: "Open Graph (Meta)", ratio: 1.91/1, icon: Share2, dims: "1200 x 630" },
  { id: "fb-cover", name: "FB Cover", ratio: 2.63/1, icon: Maximize, dims: "820 x 312" },
]

export function SocialResizer() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const { url: imgPreviewUrl, setUrl: setImgPreviewUrl, clear: clearImgPreviewUrl } = useObjectUrl()
  const [activePreset, setActivePreset] = useState(PRESETS[0])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSafeAreas, setShowSafeAreas] = useState(false)
  const [lockAspect, setLockAspect] = useState(true)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvas = useRef<fabric.Canvas | null>(null)
  const fabricImgRef = useRef<fabric.FabricImage | null>(null)

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return
    setFile(uploadedFile)
    setImgPreviewUrl(uploadedFile)
  }

  useEffect(() => {
    if (!file || !imgPreviewUrl || !canvasRef.current) return

    let isMounted = true
    const img = new Image()
    img.onload = () => {
      if (!isMounted) return
      if (fabricCanvas.current) fabricCanvas.current.dispose()
      
      const canvas = new fabric.Canvas(canvasRef.current!, {
        width: 600,
        height: 600,
        backgroundColor: "#000"
      })
      fabricCanvas.current = canvas

      if (!img.width) return
      const { width, height } = guardDimensions(img.width, img.height)
      const fabricImg = new fabric.FabricImage(img)
      fabricImgRef.current = fabricImg
      
      // Fit image initially
      const scale = Math.min(canvas.width / width, canvas.height / height)
      fabricImg.scale(scale)
      
      canvas.add(fabricImg)
      canvas.centerObject(fabricImg)
      canvas.renderAll()
      
      // Ensure preset matches
      handlePresetChange(activePreset)
    }
    img.src = imgPreviewUrl

    return () => {
        isMounted = false
        if (fabricCanvas.current) {
          fabricCanvas.current.dispose()
          fabricCanvas.current = null
        }
    }
  }, [file, imgPreviewUrl])

  const handlePresetChange = (preset: typeof PRESETS[0]) => {
    setActivePreset(preset)
    if (!fabricCanvas.current) return
    const canvas = fabricCanvas.current
    
    // Calculate display dimensions
    const containerSize = 600
    let newWidth = containerSize
    let newHeight = containerSize / preset.ratio

    if (newHeight > containerSize) {
      newHeight = containerSize
      newWidth = containerSize * preset.ratio
    }

    canvas.setDimensions({ width: newWidth, height: newHeight })
    
    if (fabricImgRef.current && lockAspect) {
       const img = fabricImgRef.current
       const canvasRatio = newWidth / newHeight
       const imgRatio = (img.width || 1) / (img.height || 1)
       
       if (imgRatio > canvasRatio) {
          img.scaleToHeight(newHeight)
       } else {
          img.scaleToWidth(newWidth)
       }
       canvas.centerObject(img)
    }
    canvas.renderAll()
  }

  const handleExport = async () => {
    if (!fabricCanvas.current) return
    setIsProcessing(true)
    
    try {
      const dataUrl = fabricCanvas.current.toDataURL({
        format: "png",
        multiplier: 2
      })
      
      const a = document.createElement("a")
      a.href = dataUrl
      a.download = `vanity-social-${activePreset.id}-${Date.now()}.png`
      a.click()
      toast.success(`${activePreset.name} exported!`)
    } catch (e) {
      toast.error("Export failed")
    } finally {
      setIsProcessing(false)
    }
  }

  const isRatioMismatched = fabricImgRef.current && 
    Math.abs(((fabricImgRef.current.width || 1) / (fabricImgRef.current.height || 1)) - activePreset.ratio) > 0.15

  if (!file) {
    return (
      <ToolUploadLayout title="Social Media Resizer" description="One-click resize for Instagram, Twitter, LinkedIn, and more." icon={Smartphone}>
        <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} label="Drop image here" />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout title="Social Media Resizer" description="Drag to reposition. Export at target resolution." icon={Smartphone} onBack={() => { setFile(null); clearImgPreviewUrl(); }} backLabel="Start New" maxWidth="max-w-6xl">

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Column 1: Platform Selection */}
        <div className="xl:col-span-1 space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
           <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Select Platform</label>
           <div className="grid grid-cols-1 gap-2">
              {PRESETS.map(p => (
                 <button 
                   key={p.id}
                   onClick={() => handlePresetChange(p)}
                   className={cn(
                     "flex items-center justify-between p-4 rounded-xl border transition-all text-left group",
                     activePreset.id === p.id ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-white/5 border-transparent hover:bg-white/10"
                   )}
                 >
                    <div className="flex items-center gap-3">
                       <p.icon className="w-5 h-5" />
                       <div>
                          <p className="text-sm font-bold leading-tight">{p.name}</p>
                          <p className={cn("text-[10px] font-mono", activePreset.id === p.id ? "text-primary-foreground/60" : "text-muted-foreground")}>{p.dims}</p>
                       </div>
                    </div>
                 </button>
              ))}
           </div>
        </div>

        {/* Column 2: Canvas Workspace */}
        <div className="xl:col-span-2 space-y-6">
           <div className="glass-panel p-8 rounded-2xl flex items-center justify-center bg-[#030303] min-h-[600px] shadow-inner relative overflow-hidden group/canvas">
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-white/5 backdrop-blur-md rounded-full border border-white/10 z-20">
                 <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50">Production Workspace</span>
              </div>
              
              <div className="relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:scale-[1.01]">
                 <canvas ref={canvasRef} className="rounded-sm" />
                 
                 {showSafeAreas && (
                    <div className="absolute inset-x-12 inset-y-16 pointer-events-none border-[1.5px] border-dashed border-primary/30 rounded-lg flex items-center justify-center animate-in zoom-in-95 duration-300">
                       <div className="px-2 py-0.5 bg-primary/10 backdrop-blur-sm rounded border border-primary/20">
                          <span className="text-[7px] font-black text-primary/60 uppercase tracking-widest">Safe Composite Zone</span>
                       </div>
                    </div>
                 )}
              </div>

              {isRatioMismatched && (
                <div className="absolute top-4 right-4 px-3 py-2 bg-amber-500/10 border border-amber-500/20 backdrop-blur-md rounded-2xl flex items-center gap-2 animate-in slide-in-from-top-4 duration-500 z-20">
                   <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black text-amber-500 uppercase tracking-tighter leading-none">Ratio Alert</span>
                      <span className="text-[8px] text-amber-500/70 font-medium">Auto-fitted to frame</span>
                   </div>
                </div>
              )}
           </div>

           <div className="p-5 bg-white/[0.02] rounded-2xl border border-white/5 text-[10px] text-muted-foreground leading-relaxed flex items-center gap-4 group hover:bg-white/[0.04] transition-colors">
              <div className="p-2 bg-white/5 rounded-lg group-hover:bg-primary/10 transition-colors">
                 <RefreshCw className="w-3 h-3 text-primary" />
              </div>
              <p>
                 <span className="font-bold text-white uppercase tracking-tighter mr-2">Interactive Guide:</span>
                 Drag the source image to adjust focal points. Multi-threaded browser scaling ensures the result is crisp and production-ready.
              </p>
           </div>
        </div>

        {/* Column 3: Export Controls */}
        <div className="xl:col-span-1 space-y-6">
           <div className="glass-panel p-6 rounded-2xl space-y-6 pt-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-white border-b border-white/5 pb-4">Export Settings</h3>
              
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Aspect Lock</span>
                    <button 
                      onClick={() => {
                        const next = !lockAspect
                        setLockAspect(next)
                        handlePresetChange(activePreset)
                      }}
                      className={cn("w-8 h-4 rounded-full relative transition-colors", lockAspect ? "bg-primary" : "bg-white/10")}
                    >
                       <div className={cn("absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all", lockAspect ? "left-4.5" : "left-0.5")} />
                    </button>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Safe Areas</span>
                    <button 
                      onClick={() => setShowSafeAreas(!showSafeAreas)}
                      className={cn("w-8 h-4 rounded-full relative transition-colors", showSafeAreas ? "bg-primary" : "bg-white/10")}
                    >
                       <div className={cn("absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all", showSafeAreas ? "left-4.5" : "left-0.5")} />
                    </button>
                 </div>
              </div>

              <button 
                onClick={handleExport}
                disabled={isProcessing}
                className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-3 whitespace-nowrap"
              >
                {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                Export for {activePreset.name.split(' ')[0]}
              </button>
           </div>
           
           <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 border-dashed">
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                 Resizing occurs 100% in-browser. Your image is never uploaded to any server. High-resolution export enabled.
              </p>
           </div>
        </div>
      </div>
    </ToolLayout>
  )
}
