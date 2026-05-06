import React, { useState, useEffect, useRef } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, Loader2, CheckCircle, Type, Image as ImageIcon, Trash2, Plus, Sparkles, Palette, ALargeSmall, Bold, Italic, ChevronDown } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { toast } from "sonner"
import { usePremium } from "@/hooks/usePremium"
import { downloadBlob, exportCanvas, loadImage } from "@/lib/canvas"
import { cn } from "@/lib/utils"
import { PillToggle } from "@/components/shared/PillToggle"
import { ColorPickerInput } from "@/components/shared/ColorPickerInput"


export function ImageWatermark({ embedded = false }: { embedded?: boolean }) {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvas = useRef<any>(null)
  const [activeTab, setActiveTab] = useState<"text" | "image">("text")

  const sourceCleanupRef = useRef<(() => void) | null>(null)
  const watermarkCleanupsRef = useRef<(() => void)[]>([])
  const [selectedObject, setSelectedObject] = useState<any>(null)
  
  // Text Properties State
  const [textColor, setTextColor] = useState("#ffffff")
  const [fontFamily, setFontFamily] = useState("Syne")
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false)
  const fontDropdownRef = useRef<HTMLDivElement>(null)

  const FONTS = [
    "Syne", "Inter", "Montserrat", "Bebas Neue", "Roboto", 
    "Outfit", "Space Grotesk", "Dancing Script", "Playfair Display",
    "Righteous", "Permanent Marker", "Oswald", "Raleway", "Poppins",
    "Lato", "Open Sans", "Merriweather", "Kanit", "Ubuntu", "Anton",
    "Pacifico", "Lobster"
  ]
  const COLORS = ["#ffffff", "#000000", "#f59e0b", "#ef4444", "#3b82f6", "#10b981", "#8b5cf6", "#fb7185"]

  const unmountedRef = useRef(false)
  
  useEffect(() => {
    const setupFabric = async () => {
      const fabric = await import("fabric")
      fabric.Object.prototype.set({
        transparentCorners: false,
        cornerColor: '#f97316',
        cornerStrokeColor: '#ffffff',
        borderColor: '#f97316',
        cornerSize: 10,
        padding: 0,
        cornerStyle: 'circle',
        borderDashArray: [0, 0],
        borderScaleFactor: 2.5,
        hasRotatingPoint: false
      });
    }
    setupFabric()

    return () => {
      unmountedRef.current = true
      if (sourceCleanupRef.current) sourceCleanupRef.current()
      watermarkCleanupsRef.current.forEach(c => c())
      if (fabricCanvas.current) {
        fabricCanvas.current.dispose()
        fabricCanvas.current = null
      }
    }
  }, [])

  const [sourceData, setSourceData] = useState<{source: any, width: number, height: number} | null>(null)

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return
    setFile(uploadedFile)
  }

  useEffect(() => {
    if (!file) return
    let isMounted = true
    const loadSource = async () => {
      try {
        const result = await loadImage(file)
        if (!isMounted) {
          result.cleanup()
          return
        }
        if (sourceCleanupRef.current) sourceCleanupRef.current()
        sourceCleanupRef.current = result.cleanup
        setSourceData({ source: result.source, width: result.width, height: result.height })
        if (fabricCanvas.current) {
          fabricCanvas.current.dispose()
          fabricCanvas.current = null
        }
      } catch (e) {
        if (isMounted) toast.error("Failed to load image")
      }
    }
    loadSource()
    return () => { isMounted = false }
  }, [file])

  useEffect(() => {
    if (sourceData && canvasRef.current) {
      const initFabric = async () => {
        const fabric = await import("fabric")
        if (unmountedRef.current) return

        const canvas = new fabric.Canvas(canvasRef.current!, {
          width: 800,
          height: 600,
          backgroundColor: "#000"
        })
        fabricCanvas.current = canvas

        const fbImg = new fabric.Image(sourceData.source as HTMLImageElement)
        const scale = Math.min(800 / sourceData.width, 600 / sourceData.height)
        fbImg.scale(scale)
        fbImg.set({
          selectable: false,
          evented: false,
          left: (800 - sourceData.width * scale) / 2,
          top: (600 - sourceData.height * scale) / 2
        })
        canvas.add(fbImg)
        canvas.centerObject(fbImg)
        canvas.renderAll()

        const handleSelection = () => {
          const active = canvas.getActiveObject()
          setSelectedObject(active || null)
          if (active && active.type === 'i-text') {
            setTextColor(active.fill as string)
            setFontFamily((active as any).fontFamily || "Syne")
            setIsBold((active as any).fontWeight === "bold")
            setIsItalic((active as any).fontStyle === "italic")
          }
        }

        canvas.on('selection:created', handleSelection)
        canvas.on('selection:updated', handleSelection)
        canvas.on('selection:cleared', () => setSelectedObject(null))
      }
      initFabric()
    }
  }, [sourceData])

  const addTextWatermark = async () => {
    if (!fabricCanvas.current) return
    const fabric = await import("fabric")
    const text = new fabric.IText("WATERMARK", {
      left: 100,
      top: 100,
      fontFamily: fontFamily,
      fontSize: 40,
      fill: textColor,
      opacity: 0.8,
      fontWeight: isBold ? "bold" : "normal",
      fontStyle: isItalic ? "italic" : "normal"
    })
    fabricCanvas.current.add(text)
    text.setControlsVisibility({
      mt: false, mb: false, ml: false, mr: false,
      mtr: true // keep rotation
    })
    fabricCanvas.current.setActiveObject(text)
    fabricCanvas.current.renderAll()
  }

  const updateTextProperty = (prop: string, value: any) => {
    const active = fabricCanvas.current?.getActiveObject()
    if (active && active.type === 'i-text') {
      active.set(prop as any, value)
      fabricCanvas.current?.renderAll()
      if (prop === 'fill') setTextColor(value)
      if (prop === 'fontFamily') setFontFamily(value)
      if (prop === 'fontWeight') setIsBold(value === "bold")
      if (prop === 'fontStyle') setIsItalic(value === "italic")
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(event.target as Node)) {
        setIsFontDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const addImageWatermark = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = (e.target.files as FileList)?.[0]
    if (!file || !fabricCanvas.current) return
    try {
      const fabric = await import("fabric")
      const result = await loadImage(file)
      
      if (unmountedRef.current) {
        result.cleanup()
        return
      }

      watermarkCleanupsRef.current.push(result.cleanup)
      if (!fabricCanvas.current) return
      const img = new fabric.Image(result.source as HTMLImageElement)
      img.scale(0.2)
      fabricCanvas.current.add(img)
      img.setControlsVisibility({
        mt: false, mb: false, ml: false, mr: false,
        mtr: true
      })
      fabricCanvas.current.centerObject(img)
      fabricCanvas.current.setActiveObject(img)
    } catch (e) {
      toast.error("Failed to load watermark image")
    }
  }

  const deleteSelected = () => {
    const active = fabricCanvas.current?.getActiveObject()
    if (active) {
      fabricCanvas.current?.remove(active)
      fabricCanvas.current?.discardActiveObject()
      fabricCanvas.current?.renderAll()
    }
  }

  const handleDownload = async () => {
    if (!fabricCanvas.current) return
    setIsProcessing(true)
    try {
      const fabricElement = fabricCanvas.current.toCanvasElement(1)
      const blob = await exportCanvas(fabricElement, "image/png", 1.0)
      downloadBlob(blob, `vanity-watermarked-${Date.now()}.png`)
      toast.success("Watermarked image exported!")
    } catch (error) {
      toast.error("Export failed")
    } finally {
      setIsProcessing(false)
    }
  }

  if (!file) {
    return (
      <ToolUploadLayout title="Deep Watermark" description="Add interactive text, images, or branded watermarks with full control." icon={Sparkles} hideHeader={embedded}>
        <div className="max-w-2xl mx-auto">
          <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} />
        </div>
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout 
      title="Watermark Editor" 
      description="Rotate, scale, and place watermarks anywhere." 
      maxWidth="max-w-7xl"
      centered={true}
      hideHeader={embedded}
    >

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Editor sidebar */}
        <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-8">
          <div className="glass-panel p-6 rounded-3xl space-y-6 border-white/10 bg-black/40 shadow-2xl">
            <PillToggle 
              activeId={activeTab}
              onChange={setActiveTab}
              options={[
                { id: "text", label: "Text", icon: Type },
                { id: "image", label: "Image", icon: ImageIcon }
              ]}
            />

            {activeTab === "text" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <button 
                  onClick={addTextWatermark}
                  className="w-full py-6 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center hover:bg-white/10 hover:border-primary/50 transition-all group"
                >
                  <Plus className="w-6 h-6 mb-2 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold">New Text Layer</span>
                </button>
              </div>
            )}

            {activeTab === "image" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <label className="w-full py-6 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center hover:bg-white/10 hover:border-primary/50 transition-all cursor-pointer group text-center px-4">
                  <ImageIcon className="w-6 h-6 mb-2 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold">Upload Overlay</span>
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">PNG recommended</p>
                  <input type="file" className="hidden" accept="image/png" onChange={addImageWatermark} />
                </label>
              </div>
            )}

            {selectedObject && selectedObject.type === 'i-text' && (
              <div className="pt-6 border-t border-white/10 space-y-6 animate-in fade-in zoom-in-95 duration-300">
                {/* Modern Color Picker UI */}
                <div className="space-y-4">
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex flex-wrap gap-2.5">
                      {COLORS.map(c => (
                        <button 
                          key={c}
                          onClick={() => updateTextProperty('fill', c)}
                          className={cn(
                            "w-7 h-7 rounded-full border-2 transition-all hover:scale-110",
                            textColor === c ? "border-white ring-2 ring-primary scale-110" : "border-transparent"
                          )}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <ColorPickerInput color={textColor} onChange={(c) => updateTextProperty('fill', c)} label="Custom Color" />
                  </div>
                </div>

                {/* Modern Font Dropdown and Toggles */}
                  <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <ALargeSmall className="w-3 h-3" /> Typography
                  </label>
                  <div className="space-y-3">
                     <div className="relative" ref={fontDropdownRef}>
                        <button 
                          onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
                          className={cn(
                            "w-full h-12 pl-4 pr-10 bg-black/40 border border-white/10 rounded-xl text-sm font-bold flex items-center justify-between hover:border-primary/50 transition-all",
                            isFontDropdownOpen && "border-primary/50 ring-1 ring-primary/20"
                          )}
                        >
                           <span style={{ fontFamily }}>{fontFamily}</span>
                           <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", isFontDropdownOpen && "rotate-180 text-primary")} />
                        </button>
                        
                        {isFontDropdownOpen && (
                          <div className="absolute z-50 bottom-full mb-2 left-0 right-0 bg-[#121212] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-200">
                             <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1.5">
                                {FONTS.map(f => (
                                  <button
                                    key={f}
                                    onClick={() => {
                                      updateTextProperty('fontFamily', f)
                                      setIsFontDropdownOpen(false)
                                    }}
                                    className={cn(
                                      "w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center justify-between group",
                                      fontFamily === f ? "bg-primary/20 text-primary font-black" : "text-muted-foreground hover:bg-white/5 hover:text-white"
                                    )}
                                    style={{ fontFamily: f }}
                                  >
                                    {f}
                                    {fontFamily === f && <CheckCircle className="w-3 h-3" />}
                                  </button>
                                ))}
                             </div>
                          </div>
                        )}
                     </div>

                     <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => updateTextProperty('fontWeight', isBold ? 'normal' : 'bold')}
                          className={cn(
                            "py-3 rounded-xl flex items-center justify-center gap-2 border transition-all",
                            isBold ? "bg-primary/20 border-primary/40 text-primary" : "bg-white/5 border-transparent text-muted-foreground hover:text-white"
                          )}
                        >
                           <Bold className="w-4 h-4" /> <span className="text-[10px] font-bold uppercase">Bold</span>
                        </button>
                        <button 
                          onClick={() => updateTextProperty('fontStyle', isItalic ? 'normal' : 'italic')}
                          className={cn(
                            "py-3 rounded-xl flex items-center justify-center gap-2 border transition-all",
                            isItalic ? "bg-primary/20 border-primary/40 text-primary" : "bg-white/5 border-transparent text-muted-foreground hover:text-white"
                          )}
                        >
                           <Italic className="w-4 h-4" /> <span className="text-[10px] font-bold uppercase">Italic</span>
                        </button>
                     </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-white/10 space-y-4">
              {selectedObject && (
                <button 
                  onClick={deleteSelected}
                  className="w-full py-4 text-xs font-bold text-red-400 bg-red-400/5 hover:bg-red-400/10 border border-red-400/20 rounded-xl flex items-center justify-center gap-2 transition-all group"
                >
                  <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" /> Delete Layer
                </button>
              )}
              
              <button 
                onClick={handleDownload}
                disabled={isProcessing}
                className="w-full py-5 bg-primary text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : <Download className="w-5 h-5" />}
                Export Watermarked
              </button>

              <button 
                onClick={() => setFile(null)}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all"
              >
                Start New Project
              </button>
            </div>
          </div>
          
          <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-black/20">
             <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
               <Sparkles className="w-3 h-3" /> Designer Tip
             </h4>
             <p className="text-[10px] leading-relaxed text-muted-foreground">
               Adjust the opacity of your text for a subtle, professional look. Double-click layers to edit content directly.
             </p>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="lg:col-span-9 glass-panel p-8 rounded-[40px] flex items-center justify-center bg-[#050505] min-h-[700px] overflow-auto shadow-2xl relative border-white/5">
          <div className="shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-lg overflow-hidden">
             <canvas ref={canvasRef} />
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
