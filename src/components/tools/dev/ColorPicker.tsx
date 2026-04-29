import React, { useState, useEffect, useCallback } from "react"
import { Copy, CheckCircle, Palette, RefreshCw, Plus, Trash2, Download, ShieldCheck, AlertTriangle, X } from "lucide-react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"

export function ColorPicker() {
  const [hex, setHex] = useState("#f59e0b")
  const [palette, setPalette] = useState<string[]>(() => {
    const saved = localStorage.getItem("colorPalette")
    return saved ? JSON.parse(saved) : []
  })
  const { copiedId, copy } = useCopyToClipboard()

  useEffect(() => {
    localStorage.setItem("colorPalette", JSON.stringify(palette))
  }, [palette])

  // Conversions
  const hexToRgb = useCallback((h: string) => {
    const r = parseInt(h.slice(1, 3), 16) || 0
    const g = parseInt(h.slice(3, 5), 16) || 0
    const b = parseInt(h.slice(5, 7), 16) || 0
    return { r, g, b }
  }, [])

  const rgbToHsl = useCallback((r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    let h = 0, s = 0, l = (max + min) / 2
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
  }, [])

  const rgbToCmyk = useCallback((r: number, g: number, b: number) => {
    let k = 1 - Math.max(r/255, g/255, b/255)
    let c = (1 - r/255 - k) / (1 - k) || 0
    let m = (1 - g/255 - k) / (1 - k) || 0
    let y = (1 - b/255 - k) / (1 - k) || 0
    return {
      c: Math.round(c * 100),
      m: Math.round(m * 100),
      y: Math.round(y * 100),
      k: Math.round(k * 100)
    }
  }, [])

  const rgb = hexToRgb(hex)
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b)

  // Contrast Calculation
  const getLuminance = (r: number, g: number, b: number) => {
    const a = [r, g, b].map(v => {
      v /= 255
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    })
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722
  }

  const contrastAgainstBlack = (getLuminance(rgb.r, rgb.g, rgb.b) + 0.05) / (0 + 0.05)
  const contrastAgainstWhite = (1 + 0.05) / (getLuminance(rgb.r, rgb.g, rgb.b) + 0.05)
  
  const bestContrast = contrastAgainstBlack > contrastAgainstWhite ? "black" : "white"
  const ratio = Math.max(contrastAgainstBlack, contrastAgainstWhite).toFixed(2)

  const addToPalette = () => {
    if (palette.length >= 8) {
      toast.error("Palette full (max 8 colors)")
      return
    }
    if (palette.includes(hex)) {
      toast.info("Color already in palette")
      return
    }
    setPalette([...palette, hex])
    toast.success("Added to palette")
  }

  const removeFromPalette = (index: number) => {
    setPalette(palette.filter((_, i) => i !== index))
  }

  const clearPalette = () => {
    if (palette.length === 0) return
    if (confirm("Clear all colors from palette?")) {
      setPalette([])
    }
  }

  const exportPalette = (format: "css" | "tailwind" | "json") => {
    if (palette.length === 0) {
      toast.error("Add some colors to your palette first!")
      return
    }
    
    let content = ""
    if (format === "css") {
      content = ":root {\n" + palette.map((c, i) => `  --color-${i + 1}: ${c};`).join("\n") + "\n}"
    } else if (format === "tailwind") {
      content = "colors: {\n" + palette.map((c, i) => `  'custom-${i + 1}': '${c}',`).join("\n") + "\n}"
    } else {
      content = JSON.stringify(palette, null, 2)
    }
    copy(content, `${format.toUpperCase()} copied to clipboard`)
  }

  const randomColor = () => {
    const r = Math.floor(Math.random() * 256)
    const g = Math.floor(Math.random() * 256)
    const b = Math.floor(Math.random() * 256)
    const newHex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    setHex(newHex)
  }

  return (
    <ToolLayout 
      title="Color Studio" 
      description="Professional color picker, palette builder, and contrast inspector." 
      icon={Palette} 
      maxWidth="max-w-6xl"
      centered={true}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20 px-4 sm:px-0">
        {/* Left Column: Picker & Accessibility */}
        <div className="lg:col-span-5 space-y-6">
           <div 
             className="aspect-[4/3] rounded-[2rem] shadow-2xl border border-white/10 relative overflow-hidden group transition-all duration-500 hover:scale-[1.01]" 
             style={{ backgroundColor: hex }}
           >
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                  <p className={cn("text-3xl sm:text-4xl md:text-5xl font-black font-syne drop-shadow-2xl transition-colors duration-300 tracking-tighter text-center px-4 max-w-full break-all", bestContrast === "white" ? "text-white" : "text-black")}>
                    {hex.toUpperCase()}
                  </p>
                 <div className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-300", bestContrast === "white" ? "bg-white/10 border-white/20 text-white" : "bg-black/10 border-black/20 text-black")}>
                   Contrast: {ratio}:1
                 </div>
              </div>
              <button 
                onClick={randomColor} 
                className="absolute top-6 right-6 p-3 bg-black/20 backdrop-blur-xl rounded-2xl text-white hover:bg-black/40 transition-all border border-white/10 group-hover:rotate-180 duration-700"
                title="Random Color"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
           </div>

           <div className="glass-panel p-8 rounded-[2rem] border border-white/5 bg-black/20 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Selection Engine</label>
                  <span className="text-[10px] font-bold text-primary/60">HEX / RGB / HSL</span>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="relative group shrink-0 w-24 h-24">
                    <input 
                      type="color" 
                      value={hex} 
                      onChange={(e) => setHex(e.target.value)} 
                      className="w-full h-full block bg-transparent border-none cursor-pointer rounded-3xl overflow-hidden appearance-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-moz-color-swatch]:border-none shadow-2xl" 
                    />
                    <div className="absolute inset-0 pointer-events-none rounded-3xl border-2 border-white/10 group-hover:border-primary/50 transition-colors" />
                  </div>
                  <div className="flex-1 flex flex-col gap-3">
                    <input 
                      type="text" 
                      value={hex.toUpperCase()} 
                      onChange={(e) => {
                        const val = e.target.value
                        if (val.startsWith('#') && val.length <= 7) setHex(val)
                        else if (val.length <= 6) setHex(`#${val}`)
                      }} 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 font-mono text-2xl text-white outline-none focus:border-primary/50 transition-all shadow-inner" 
                    />
                    <button 
                      onClick={addToPalette} 
                      className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-3 hover:shadow-[0_0_30px_rgba(var(--primary),0.3)] hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      <Plus className="w-4 h-4" /> Add to Palette
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-white/5">
                 <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Accessibility Audit</span>
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className={cn("p-4 rounded-2xl border transition-all", parseFloat(ratio) >= 4.5 ? "bg-emerald-500/5 border-emerald-500/20" : "bg-orange-500/5 border-orange-500/20")}>
                       <span className="text-[9px] font-black uppercase text-muted-foreground block mb-2">WCAG AA</span>
                       <div className="flex items-center gap-3">
                          {parseFloat(ratio) >= 4.5 ? <ShieldCheck className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-orange-400" />}
                          <span className="text-sm font-black text-white">{parseFloat(ratio) >= 4.5 ? "Pass" : "Fail"}</span>
                       </div>
                    </div>
                    <div className={cn("p-4 rounded-2xl border transition-all", parseFloat(ratio) >= 7 ? "bg-emerald-500/5 border-emerald-500/20" : "bg-orange-500/5 border-orange-500/20")}>
                       <span className="text-[9px] font-black uppercase text-muted-foreground block mb-2">WCAG AAA</span>
                       <div className="flex items-center gap-3">
                          {parseFloat(ratio) >= 7 ? <ShieldCheck className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-orange-400" />}
                          <span className="text-sm font-black text-white">{parseFloat(ratio) >= 7 ? "Pass" : "Fail"}</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Column: Palette & Formats */}
        <div className="lg:col-span-7 space-y-6">
           <div className="glass-panel p-8 rounded-[2rem] border border-white/5 bg-black/20 space-y-8">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Current Palette ({palette.length}/8)</label>
                {palette.length > 0 && (
                  <button onClick={clearPalette} className="text-[9px] font-black uppercase tracking-[0.2em] text-red-400/60 hover:text-red-400 transition-colors flex items-center gap-1.5">
                    <X className="w-3 h-3" /> Clear All
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
                 {palette.map((c, i) => (
                   <div 
                     key={i} 
                     className="group relative aspect-square rounded-2xl border border-white/10 shadow-xl cursor-pointer transition-all hover:scale-110 active:scale-90" 
                     style={{ backgroundColor: c }} 
                     onClick={() => setHex(c)}
                   >
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeFromPalette(i); }} 
                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-600"
                        title="Remove Color"
                      >
                         <Trash2 className="w-3 h-3" />
                      </button>
                   </div>
                 ))}
                 {Array.from({ length: 8 - palette.length }).map((_, i) => (
                   <div key={i} className="aspect-square rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.01]" />
                 ))}
              </div>

              <div className="space-y-4 pt-8 border-t border-white/5">
                 {[
                   { label: "RGB", value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, id: "rgb" },
                   { label: "HSL", value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, id: "hsl" },
                   { label: "CMYK", value: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`, id: "cmyk" },
                 ].map(item => (
                   <div key={item.id} className="flex items-center justify-between group">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground w-12">{item.label}</span>
                      <div className="flex-1 mx-4 h-12 bg-black/40 border border-white/5 rounded-xl px-4 flex items-center font-mono text-sm text-white/80 group-hover:border-primary/30 transition-all overflow-x-auto whitespace-nowrap scrollbar-hide">
                         {item.value}
                      </div>
                      <button 
                        onClick={() => copy(item.value, item.id)} 
                        className="p-3 bg-white/5 hover:bg-primary/20 hover:text-primary rounded-xl transition-all border border-white/5"
                        title={`Copy ${item.label}`}
                      >
                         {copiedId === item.id ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                      </button>
                   </div>
                 ))}
              </div>
           </div>

           {/* Dynamic Export Panel */}
           <div className="glass-panel p-8 rounded-[2rem] bg-primary/5 border border-primary/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity pointer-events-none">
                <Download className="w-32 h-32 text-primary" />
              </div>
              
              <div className="flex items-start gap-6 relative">
                 <div className="p-4 bg-primary/10 rounded-2xl">
                    <Download className="w-8 h-8 text-primary" />
                 </div>
                 <div className="flex-1 space-y-6">
                    <div className="space-y-1">
                       <h4 className="text-xl font-black font-syne text-white uppercase tracking-tighter">Export Intelligence</h4>
                       <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                         Convert your curated palette into production-ready code snippets for your design system.
                       </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                       {[
                         { id: "css", label: "CSS Variables" },
                         { id: "tailwind", label: "Tailwind Config" },
                         { id: "json", label: "JSON Data" },
                       ].map((fmt) => (
                         <button 
                           key={fmt.id}
                           disabled={palette.length === 0}
                           onClick={() => exportPalette(fmt.id as any)}
                           className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-white hover:bg-primary hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
                         >
                           {fmt.label}
                         </button>
                       ))}
                    </div>

                    {palette.length === 0 && (
                      <div className="flex items-center gap-2 text-[10px] font-bold text-primary/40 uppercase tracking-widest animate-pulse">
                         <AlertTriangle className="w-3 h-3" /> Add colors to enable export
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </ToolLayout>
  )
}
