import React, { useState, useMemo } from "react"
import { Layers, Copy, CheckCircle, Zap } from "lucide-react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"
import { ColorPickerInput } from "@/components/shared/ColorPickerInput"

export function CssEffectsBuilder() {
  const [mode, setMode] = useState<"shadow" | "filter">("shadow")
  const { isCopied, copy } = useCopyToClipboard()

  // Shadow State
  const [hOffset, setHOffset] = useState(10)
  const [vOffset, setVOffset] = useState(10)
  const [blur, setBlur] = useState(15)
  const [spread, setSpread] = useState(0)
  const [color, setColor] = useState("#000000")
  const [opacity, setOpacity] = useState(50)
  const [inset, setInset] = useState(false)

  // Filter State
  const [fBlur, setFBlur] = useState(0)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [grayscale, setGrayscale] = useState(0)
  const [hueRotate, setHueRotate] = useState(0)
  const [invert, setInvert] = useState(0)
  const [saturate, setSaturate] = useState(100)
  const [sepia, setSepia] = useState(0)

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`
  }

  const boxShadow = useMemo(() => {
    const c = hexToRgba(color, opacity)
    return `${inset ? 'inset ' : ''}${hOffset}px ${vOffset}px ${blur}px ${spread}px ${c}`
  }, [hOffset, vOffset, blur, spread, color, opacity, inset])

  const cssFilter = useMemo(() => {
    const filters = []
    if (fBlur > 0) filters.push(`blur(${fBlur}px)`)
    if (brightness !== 100) filters.push(`brightness(${brightness}%)`)
    if (contrast !== 100) filters.push(`contrast(${contrast}%)`)
    if (grayscale > 0) filters.push(`grayscale(${grayscale}%)`)
    if (hueRotate > 0) filters.push(`hue-rotate(${hueRotate}deg)`)
    if (invert > 0) filters.push(`invert(${invert}%)`)
    if (saturate !== 100) filters.push(`saturate(${saturate}%)`)
    if (sepia > 0) filters.push(`sepia(${sepia}%)`)
    return filters.length > 0 ? filters.join(' ') : 'none'
  }, [fBlur, brightness, contrast, grayscale, hueRotate, invert, saturate, sepia])

  const cssSnippet = mode === "shadow" 
    ? `box-shadow: ${boxShadow};`
    : `filter: ${cssFilter};`

  return (
    <ToolLayout title="CSS Effects Builder" description="Visual editor for box-shadows and CSS filters." icon={Layers} centered={true} maxWidth="max-w-6xl">
      <div className="flex justify-center mb-8">
        <div className="bg-black/40 p-1 rounded-full border border-white/10 flex">
          <button 
            onClick={() => setMode("shadow")}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${mode === "shadow" ? "bg-primary text-white" : "text-muted-foreground hover:text-white"}`}
          >
            Box Shadow
          </button>
          <button 
            onClick={() => setMode("filter")}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${mode === "filter" ? "bg-primary text-white" : "text-muted-foreground hover:text-white"}`}
          >
            CSS Filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-6 bg-black/20">
            {mode === "shadow" ? (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Horizontal Offset</label>
                    <span className="text-xs font-mono text-white">{hOffset}px</span>
                  </div>
                  <input type="range" min="-50" max="50" value={hOffset} onChange={e => setHOffset(Number(e.target.value))} className="w-full accent-primary" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vertical Offset</label>
                    <span className="text-xs font-mono text-white">{vOffset}px</span>
                  </div>
                  <input type="range" min="-50" max="50" value={vOffset} onChange={e => setVOffset(Number(e.target.value))} className="w-full accent-primary" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Blur Radius</label>
                    <span className="text-xs font-mono text-white">{blur}px</span>
                  </div>
                  <input type="range" min="0" max="100" value={blur} onChange={e => setBlur(Number(e.target.value))} className="w-full accent-primary" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Spread Radius</label>
                    <span className="text-xs font-mono text-white">{spread}px</span>
                  </div>
                  <input type="range" min="-50" max="50" value={spread} onChange={e => setSpread(Number(e.target.value))} className="w-full accent-primary" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Opacity</label>
                    <span className="text-xs font-mono text-white">{opacity}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={opacity} onChange={e => setOpacity(Number(e.target.value))} className="w-full accent-primary" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <ColorPickerInput color={color} onChange={setColor} />
                  </div>
                  <div className="flex-1 flex items-center justify-end h-full pt-6">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-bold">
                      <input type="checkbox" checked={inset} onChange={e => setInset(e.target.checked)} className="w-4 h-4 accent-primary" />
                      Inset Shadow
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Blur</label>
                    <span className="text-xs font-mono text-white">{fBlur}px</span>
                  </div>
                  <input type="range" min="0" max="50" value={fBlur} onChange={e => setFBlur(Number(e.target.value))} className="w-full accent-primary" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Brightness</label>
                    <span className="text-xs font-mono text-white">{brightness}%</span>
                  </div>
                  <input type="range" min="0" max="200" value={brightness} onChange={e => setBrightness(Number(e.target.value))} className="w-full accent-primary" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contrast</label>
                    <span className="text-xs font-mono text-white">{contrast}%</span>
                  </div>
                  <input type="range" min="0" max="200" value={contrast} onChange={e => setContrast(Number(e.target.value))} className="w-full accent-primary" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Grayscale</label>
                    <span className="text-xs font-mono text-white">{grayscale}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={grayscale} onChange={e => setGrayscale(Number(e.target.value))} className="w-full accent-primary" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hue Rotate</label>
                    <span className="text-xs font-mono text-white">{hueRotate}deg</span>
                  </div>
                  <input type="range" min="0" max="360" value={hueRotate} onChange={e => setHueRotate(Number(e.target.value))} className="w-full accent-primary" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Invert</label>
                    <span className="text-xs font-mono text-white">{invert}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={invert} onChange={e => setInvert(Number(e.target.value))} className="w-full accent-primary" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Saturate</label>
                    <span className="text-xs font-mono text-white">{saturate}%</span>
                  </div>
                  <input type="range" min="0" max="200" value={saturate} onChange={e => setSaturate(Number(e.target.value))} className="w-full accent-primary" />
                </div>
              </div>
            )}
          </div>

          <div className="glass-panel p-4 rounded-2xl relative group bg-black/20 border border-white/5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">CSS Snippet</label>
            <textarea readOnly value={cssSnippet} className="w-full h-16 bg-transparent resize-none outline-none font-mono text-sm text-sky-400" />
            <button onClick={() => copy(cssSnippet)} className="absolute top-4 right-4 p-2 bg-white/5 rounded-lg hover:bg-white/10">
              {isCopied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center bg-white/5 border border-white/10 rounded-3xl overflow-hidden min-h-[400px]">
           {mode === "shadow" ? (
             <div 
               className="w-48 h-48 bg-primary rounded-xl transition-all duration-300 ease-out" 
               style={{ boxShadow: boxShadow }} 
             />
           ) : (
             <img 
               src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1000&auto=format&fit=crop" 
               alt="Filter preview" 
               className="w-full h-full object-cover transition-all duration-300 ease-out"
               style={{ filter: cssFilter }}
             />
           )}
        </div>
      </div>
    </ToolLayout>
  )
}
