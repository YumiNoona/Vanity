import React, { useState, useEffect, useRef } from "react"
import { HexColorPicker, RgbColorPicker } from "react-colorful"
import { Pipette, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { PillToggle } from "@/components/shared/PillToggle"

interface ColorPickerInputProps {
  color: string
  onChange: (color: string) => void
  label?: string
  className?: string
}

export function ColorPickerInput({ color, onChange, label, className }: ColorPickerInputProps) {
  const [show, setShow] = useState(false)
  const [mode, setMode] = useState<"hex" | "rgb">("hex")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false)
    }
    document.addEventListener("mousedown", click)
    return () => document.removeEventListener("mousedown", click)
  }, [])

  const hexToRgb = (h: string) => {
    const r = parseInt(h.slice(1, 3), 16) || 0
    const g = parseInt(h.slice(3, 5), 16) || 0
    const b = parseInt(h.slice(5, 7), 16) || 0
    return { r, g, b }
  }

  const pickColor = async () => {
    if (!('EyeDropper' in window)) {
      toast.error("EyeDropper not supported")
      return
    }
    try {
      // @ts-ignore
      const result = await new window.EyeDropper().open()
      onChange(result.sRGBHex)
    } catch (e) {}
  }

  const rgb = hexToRgb(color.startsWith('#') ? color : '#000000')

  return (
    <div className={cn("relative", className)} ref={ref}>
      {label && <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">{label}</label>}
      <div className="flex items-center gap-2">
        <div 
          onClick={() => setShow(!show)}
          className="w-10 h-10 rounded-xl border border-white/10 shadow-lg cursor-pointer transition-transform active:scale-95"
          style={{ backgroundColor: color }}
        />
        <input 
          type="text" 
          value={color.toUpperCase()} 
          onChange={(e) => onChange(e.target.value)}
          className="bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-[10px] font-mono text-white/70 w-24 outline-none focus:border-primary/50"
        />
        <button 
          onClick={pickColor}
          className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-muted-foreground hover:text-white transition-all"
        >
          <Pipette className="w-4 h-4" />
        </button>
      </div>

      {show && (
        <div className="absolute top-[110%] left-0 z-[100] glass-panel p-4 rounded-2xl border border-white/10 bg-black/90 backdrop-blur-2xl shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 w-[240px]">
          <div className="flex justify-between items-center mb-2">
            <PillToggle
              activeId={mode}
              onChange={(id) => setMode(id as "hex" | "rgb")}
              options={[
                { id: "hex", label: "HEX" },
                { id: "rgb", label: "RGB" }
              ]}
            />
            <button onClick={() => setShow(false)} className="text-muted-foreground hover:text-white"><X className="w-4 h-4" /></button>
          </div>

          <div className="custom-colorful compact">
            <style>{`
              .custom-colorful.compact .react-colorful { width: 100%; height: 160px; }
              .custom-colorful.compact .react-colorful__hue { height: 12px; margin-top: 8px; }
            `}</style>
            {mode === "hex" ? (
              <HexColorPicker color={color} onChange={onChange} />
            ) : (
              <RgbColorPicker color={rgb} onChange={(n) => {
                const h = `#${n.r.toString(16).padStart(2, '0')}${n.g.toString(16).padStart(2, '0')}${n.b.toString(16).padStart(2, '0')}`
                onChange(h)
              }} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
