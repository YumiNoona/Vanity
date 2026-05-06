import React, { useState } from "react"
import { Copy, CheckCircle, Zap, RefreshCw, MoveRight } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"
import { ColorPickerInput } from "@/components/shared/ColorPickerInput"

export function CssGradient({ embedded = false }: { embedded?: boolean } = {}) {
  const [color1, setColor1] = useState("#4f46e5")
  const [color2, setColor2] = useState("#ec4899")
  const [angle, setAngle] = useState(135)
  const { isCopied: copied, copy } = useCopyToClipboard()

  const gradientSize = `linear-gradient(${angle}deg, ${color1}, ${color2})`

  const handleCopy = () => {
    const css = `background: ${color1};\nbackground: ${gradientSize};`
    copy(css, "Gradient CSS copied!")
    }

  const randomGradient = () => {
    const r1 = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    setColor1(`#${r1()}${r1()}${r1()}`)
    setColor2(`#${r1()}${r1()}${r1()}`)
    setAngle(Math.floor(Math.random() * 361))
  }

  return (
    <ToolLayout 
      title="Gradient Builder" 
      description="Visual CSS linear gradient generator." 
      icon={Zap} 
      maxWidth="max-w-6xl"
      centered={true}
      hideHeader={embedded}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 px-4 sm:px-0 pb-12">
        {/* Preview & Controls */}
        <div className="md:col-span-8 space-y-6">
          <div 
            className="w-full aspect-video rounded-[2rem] shadow-2xl border border-white/10 relative overflow-hidden group transition-all duration-700"
            style={{ backgroundImage: gradientSize }}
          >
             <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/40 to-transparent flex justify-between items-end">
                <div className="space-y-1">
                   <div className="text-[10px] font-bold uppercase tracking-widest text-white/60">CSS Value</div>
                   <div className="text-xs font-mono text-white/90 truncate max-w-md">{gradientSize}</div>
                </div>
                <button 
                  onClick={randomGradient}
                  className="p-3 bg-white/10 backdrop-blur-xl rounded-full text-white hover:bg-white/20 transition-all border border-white/10"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
             </div>
          </div>

          <div className="glass-panel p-8 rounded-2xl space-y-8">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <ColorPickerInput color={color1} onChange={setColor1} label="Start Color" className="w-full" />
                </div>
                <div className="space-y-4">
                    <ColorPickerInput color={color2} onChange={setColor2} label="End Color" className="w-full" />
                </div>
             </div>

             <div className="space-y-4">
                <div className="flex justify-between items-center">
                   <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Rotation Degree</label>
                   <span className="text-xl font-mono font-bold text-pink-500">{angle}°</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="360" 
                  value={angle}
                  onChange={(e) => setAngle(parseInt(e.target.value))}
                  className="w-full relative h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
             </div>
          </div>
        </div>

        {/* Output Panel */}
        <div className="md:col-span-4 space-y-6">
           <div className="glass-panel p-6 rounded-2xl flex flex-col h-full bg-pink-500/[0.02] border-pink-500/10">
              <h3 className="font-bold font-syne text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-6 text-white/90">
                 <Copy className="w-4 h-4" /> CSS Snippet
              </h3>
              
              <div className="flex-1 space-y-4">
                 <div className="p-4 bg-black/40 rounded-xl border border-white/10 font-mono text-[11px] leading-relaxed text-pink-200/80">
                    <span className="text-pink-500">.gradient-box</span> {"{"}
                    <div className="pl-4">
                        background: {color1};<br />
                        background: {gradientSize};
                    </div>
                    {"}"}
                 </div>
                 
                 <p className="text-[10px] text-muted-foreground leading-relaxed italic px-2">
                   This snippet includes a fallback solid color for older browsers and the modern linear-gradient property.
                 </p>
              </div>

              <button 
                onClick={handleCopy}
                className="w-full mt-6 py-4 bg-pink-500 text-white font-bold rounded-xl shadow-lg shadow-pink-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy CSS"}
              </button>
           </div>

           <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Presets</h4>
              <div className="grid grid-cols-2 gap-2 text-center">
                 <button onClick={() => { setColor1("#6366f1"); setColor2("#a855f7"); setAngle(135); }} className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg hover:ring-2 ring-pink-500 ring-offset-2 ring-offset-black transition-all" />
                 <button onClick={() => { setColor1("#f97316"); setColor2("#e11d48"); setAngle(135); }} className="p-3 bg-gradient-to-br from-orange-500 to-rose-600 rounded-lg hover:ring-2 ring-pink-500 ring-offset-2 ring-offset-black transition-all" />
                 <button onClick={() => { setColor1("#22c55e"); setColor2("#14b8a6"); setAngle(135); }} className="p-3 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg hover:ring-2 ring-pink-500 ring-offset-2 ring-offset-black transition-all" />
                 <button onClick={() => { setColor1("#3b82f6"); setColor2("#0ea5e9"); setAngle(135); }} className="p-3 bg-gradient-to-br from-blue-500 to-sky-500 rounded-lg hover:ring-2 ring-pink-500 ring-offset-2 ring-offset-black transition-all" />
              </div>
           </div>
        </div>
      </div>
    </ToolLayout>
  )
}
