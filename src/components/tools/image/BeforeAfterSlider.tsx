import React, { useState, useRef, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, Copy, SplitSquareHorizontal, MoveHorizontal, Trash2 } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { useObjectUrl } from "@/hooks/useObjectUrl"

export function BeforeAfterSlider() {
  const [file1, setFile1] = useState<File | null>(null)
  const [file2, setFile2] = useState<File | null>(null)
  const { url: imgUrl1, setUrl: setImgUrl1, clear: clearImgUrl1 } = useObjectUrl()
  const { url: imgUrl2, setUrl: setImgUrl2, clear: clearImgUrl2 } = useObjectUrl()
  const [sliderPos, setSliderPos] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims1, setDims1] = useState<{ w: number; h: number } | null>(null)
  const [dims2, setDims2] = useState<{ w: number; h: number } | null>(null)

  const handleDrop1 = (files: File[]) => {
    if (files[0]) {
      setFile1(files[0])
      setImgUrl1(files[0])
    }
  }

  const handleDrop2 = (files: File[]) => {
    if (files[0]) {
      setFile2(files[0])
      setImgUrl2(files[0])
    }
  }

  const updateFromEvent = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    setSliderPos((x / rect.width) * 100)
  }

  const handlePointerStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true)
    updateFromEvent(e)
  }

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return
    updateFromEvent(e)
  }

  useEffect(() => {
    const onMouseUp = () => setIsDragging(false)
    window.addEventListener("mouseup", onMouseUp)
    window.addEventListener("touchend", onMouseUp)
    window.addEventListener("touchcancel", onMouseUp)
    return () => {
      window.removeEventListener("mouseup", onMouseUp)
      window.removeEventListener("touchend", onMouseUp)
      window.removeEventListener("touchcancel", onMouseUp)
    }
  }, [])

  const reset = () => {
    setFile1(null)
    setFile2(null)
    clearImgUrl1()
    clearImgUrl2()
    setSliderPos(50)
    setIsDragging(false)
    setDims1(null)
    setDims2(null)
  }

  const aspectWarning = (() => {
    if (!dims1 || !dims2) return null
    const a1 = dims1.w / dims1.h
    const a2 = dims2.w / dims2.h
    const diff = Math.abs(a1 - a2)
    if (!isFinite(diff) || diff < 0.02) return null
    return `Aspect ratio mismatch: ${dims1.w}×${dims1.h} vs ${dims2.w}×${dims2.h}. For best results, use the same resolution/aspect ratio.`
  })()

  if (!file1 || !file2) {
    return (
      <ToolUploadLayout title="Before / After Slider" description="Side-by-side visual comparison tool." icon={SplitSquareHorizontal}>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block text-center">Version A (Before)</label>
               {imgUrl1 ? (
                 <div className="relative aspect-video rounded-3xl overflow-hidden group border border-white/10">
                    <img src={imgUrl1} className="w-full h-full object-cover" />
                    <button onClick={() => { setFile1(null); clearImgUrl1(); }} className="absolute top-4 right-4 p-2 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all">
                       <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
               ) : (
                 <DropZone onDrop={handleDrop1} accept={{ "image/*": [] }} label="Drop 'Before' image" />
               )}
            </div>
            <div className="space-y-4">
               <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block text-center">Version B (After)</label>
               {imgUrl2 ? (
                 <div className="relative aspect-video rounded-3xl overflow-hidden group border border-white/10">
                    <img src={imgUrl2} className="w-full h-full object-cover" />
                    <button onClick={() => { setFile2(null); clearImgUrl2(); }} className="absolute top-4 right-4 p-2 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all">
                       <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
               ) : (
                 <DropZone onDrop={handleDrop2} accept={{ "image/*": [] }} label="Drop 'After' image" />
               )}
            </div>
         </div>
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout
      title="Comparison Deck"
      description="Drag the handle to reveal differences."
      icon={SplitSquareHorizontal}
      onBack={reset}
      backLabel="Start New"
      maxWidth="max-w-6xl"
    >
      {aspectWarning && (
        <div className="mb-8">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200/80 text-xs">
            {aspectWarning}
          </div>
        </div>
      )}

      <div 
        ref={containerRef}
        className="relative w-full aspect-video rounded-[2.5rem] overflow-hidden bg-black shadow-2xl group cursor-col-resize select-none touch-none border border-white/5"
        onMouseDown={handlePointerStart}
        onTouchStart={handlePointerStart}
        onMouseMove={handlePointerMove}
        onTouchMove={handlePointerMove}
      >
        {/* Under Image (After) */}
        <img 
          src={imgUrl2!} 
          className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
          alt="After" 
          onLoad={(e) => {
            const img = e.currentTarget
            if (img.naturalWidth && img.naturalHeight) setDims2({ w: img.naturalWidth, h: img.naturalHeight })
          }}
        />
        
        {/* Over Image (Before) */}
        <img
          src={imgUrl1!}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          alt="Before"
          style={{ clipPath: `inset(0 ${Math.max(0, Math.min(100, 100 - sliderPos))}% 0 0)` }}
          onLoad={(e) => {
            const img = e.currentTarget
            if (img.naturalWidth && img.naturalHeight) setDims1({ w: img.naturalWidth, h: img.naturalHeight })
          }}
        />

        {/* Slider Handle */}
        <div 
           className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_15px_rgba(0,0,0,0.5)] z-20"
           style={{ left: `${sliderPos}%` }}
        >
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-2xl scale-100 group-hover:scale-110 active:scale-95 transition-transform border-[6px] border-black/10">
              <MoveHorizontal className="w-5 h-5 text-black" />
           </div>
        </div>

        {/* Labels */}
        <div className="absolute top-6 left-6 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest border border-white/10 z-30 transition-opacity opacity-0 group-hover:opacity-100">Before</div>
        <div className="absolute top-6 right-6 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest border border-white/10 z-30 transition-opacity opacity-0 group-hover:opacity-100">After</div>
      </div>

      <div className="p-8 glass-panel rounded-3xl flex items-center gap-8 border-white/5 shadow-lg mt-8">
         <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500">
            <SplitSquareHorizontal className="w-8 h-8" />
         </div>
         <div className="space-y-1">
            <h4 className="text-lg font-bold text-white font-syne">Interactive Comparison</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
               Perfect for showing photo edits, color correction, or AI upscaling results. Both images are loaded locally in your browser memory and never uploaded to any server.
            </p>
         </div>
      </div>
    </ToolLayout>
  )
}
