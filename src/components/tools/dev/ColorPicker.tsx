import React, { useState, useEffect } from "react"
import { ArrowLeft, Copy, CheckCircle, Palette, RefreshCw } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function ColorPicker() {
  const [hex, setHex] = useState("#f59e0b")
  const [rgb, setRgb] = useState({ r: 245, g: 158, b: 11 })
  const [hsl, setHsl] = useState({ h: 38, s: 91, l: 50 })
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null)

  // Conversions
  const hexToRgb = (h: string) => {
    const r = parseInt(h.slice(1, 3), 16)
    const g = parseInt(h.slice(3, 5), 16)
    const b = parseInt(h.slice(5, 7), 16)
    return { r: isNaN(r) ? 0 : r, g: isNaN(g) ? 0 : g, b: isNaN(b) ? 0 : b }
  }

  const rgbToHsl = (r: number, g: number, b: number) => {
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
  }

  const updateFromHex = (newHex: string) => {
    if (!/^#[0-9A-F]{6}$/i.test(newHex)) return
    setHex(newHex)
    const newRgb = hexToRgb(newHex)
    setRgb(newRgb)
    setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b))
  }

  const handleCopy = (text: string, format: string) => {
    navigator.clipboard.writeText(text)
    setCopiedFormat(format)
    toast.success(`Copied ${format} value`)
    setTimeout(() => setCopiedFormat(null), 2000)
  }

  const randomColor = () => {
    const r = Math.floor(Math.random() * 256)
    const g = Math.floor(Math.random() * 256)
    const b = Math.floor(Math.random() * 256)
    const newHex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    updateFromHex(newHex)
  }

  const handleBack = () => {
    window.history.back()
  }

  return (
    <ToolLayout title="Color Picker" description="Convert between HEX, RGB, and HSL." icon={Palette} onBack={handleBack} backLabel="Back">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4 sm:px-0 pb-12">
        {/* Visual Picker */}
        <div className="space-y-6">
          <div className="aspect-video rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden group transition-all duration-500 hover:scale-[1.01]" style={{ backgroundColor: hex }}>
             <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
             <div className="absolute bottom-6 left-6 text-white font-mono font-bold text-2xl drop-shadow-md">
                {hex.toUpperCase()}
             </div>
             <button 
               onClick={randomColor}
               className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white/70 hover:text-white transition-colors border border-white/10"
               title="Random Color"
             >
               <RefreshCw className="w-4 h-4" />
             </button>
          </div>
          
          <div className="glass-panel p-8 rounded-2xl space-y-6">
             <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Select Color</label>
                <input 
                  type="color" 
                  value={hex}
                  onChange={(e) => updateFromHex(e.target.value)}
                  className="w-full h-16 bg-transparent border-none cursor-pointer rounded-xl overflow-hidden"
                />
             </div>
             <p className="text-xs text-muted-foreground leading-relaxed italic">
               Use the native picker above to find your perfect shade. Values update in real-time.
             </p>
          </div>
        </div>

        {/* Formats */}
        <div className="space-y-4">
           {/* HEX */}
           <div className="glass-panel p-6 rounded-2xl space-y-3 border-white/5 transition-all hover:border-white/10">
              <div className="flex justify-between items-center">
                 <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">HEX</span>
                 <button onClick={() => handleCopy(hex, "HEX")} className="text-muted-foreground hover:text-primary transition-colors">
                    {copiedFormat === "HEX" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                 </button>
              </div>
              <input 
                type="text" 
                value={hex.toUpperCase()} 
                onChange={(e) => updateFromHex(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 font-mono text-sm outline-none focus:border-primary/40 text-white/90"
              />
           </div>

           {/* RGB */}
           <div className="glass-panel p-6 rounded-2xl space-y-3 border-white/5 transition-all hover:border-white/10">
              <div className="flex justify-between items-center">
                 <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">RGB</span>
                 <button onClick={() => handleCopy(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, "RGB")} className="text-muted-foreground hover:text-primary transition-colors">
                    {copiedFormat === "RGB" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                 </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                 <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground font-mono">R</span>
                    <div className="bg-black/40 border border-white/10 rounded-lg p-2 text-center font-mono text-sm text-white/90">{rgb.r}</div>
                 </div>
                 <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground font-mono">G</span>
                    <div className="bg-black/40 border border-white/10 rounded-lg p-2 text-center font-mono text-sm text-white/90">{rgb.g}</div>
                 </div>
                 <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground font-mono">B</span>
                    <div className="bg-black/40 border border-white/10 rounded-lg p-2 text-center font-mono text-sm text-white/90">{rgb.b}</div>
                 </div>
              </div>
           </div>

           {/* HSL */}
           <div className="glass-panel p-6 rounded-2xl space-y-3 border-white/5 transition-all hover:border-white/10">
              <div className="flex justify-between items-center">
                 <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">HSL</span>
                 <button onClick={() => handleCopy(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, "HSL")} className="text-muted-foreground hover:text-primary transition-colors">
                    {copiedFormat === "HSL" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                 </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                 <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground font-mono">H</span>
                    <div className="bg-black/40 border border-white/10 rounded-lg p-2 text-center font-mono text-sm text-white/90">{hsl.h}°</div>
                 </div>
                 <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground font-mono">S</span>
                    <div className="bg-black/40 border border-white/10 rounded-lg p-2 text-center font-mono text-sm text-white/90">{hsl.s}%</div>
                 </div>
                 <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground font-mono">L</span>
                    <div className="bg-black/40 border border-white/10 rounded-lg p-2 text-center font-mono text-sm text-white/90">{hsl.l}%</div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </ToolLayout>
  )
}
