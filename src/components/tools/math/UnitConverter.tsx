import React, { useState, useEffect } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { ArrowLeftRight, Ruler, Weight, Thermometer, Box, Layers, Info } from "lucide-react"
import { cn } from "@/lib/utils"

const CATEGORIES = [
  { id: "length", icon: Ruler, label: "Length", units: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.34, yd: 0.9144, ft: 0.3048, in: 0.0254 } },
  { id: "weight", icon: Weight, label: "Weight", units: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495 } },
  { id: "area", icon: Layers, label: "Area", units: { m2: 1, km2: 1000000, ac: 4046.86, ha: 10000, ft2: 0.092903 } },
  { id: "volume", icon: Box, label: "Volume", units: { l: 1, ml: 0.001, m3: 1000, gal: 3.78541, qt: 0.946353 } },
]

export function UnitConverter() {
  const [cat, setCat] = useState(CATEGORIES[0])
  const [val1, setVal1] = useState("1")
  const [val2, setVal2] = useState("")
  const [unit1, setUnit1] = useState("m")
  const [unit2, setUnit2] = useState("ft")

  const convert = (v: string, from: string, to: string) => {
    const num = parseFloat(v) || 0
    if (cat.id === "temp") {
      // Temp needs custom logic
      return 0
    }
    const base = num * (cat.units as any)[from]
    return base / (cat.units as any)[to]
  }

  useEffect(() => {
    setVal2(convert(val1, unit1, unit2).toString())
  }, [val1, unit1, unit2, cat])

  return (
    <ToolLayout
      title="Universal Unit Converter"
      description="Convert between metric and imperial units for length, weight, area, and more."
      icon={ArrowLeftRight}
      centered={true}
    >
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="grid grid-cols-4 gap-2">
           {CATEGORIES.map(c => (
             <button
               key={c.id}
               onClick={() => { setCat(c); setUnit1(Object.keys(c.units)[0]); setUnit2(Object.keys(c.units)[1]); }}
               className={cn(
                 "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                 cat.id === c.id ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
               )}
             >
               <c.icon className="w-5 h-5" />
               <span className="text-[10px] font-black uppercase tracking-widest">{c.label}</span>
             </button>
           ))}
        </div>

        <div className="glass-panel p-8 rounded-[40px] border border-white/5 bg-black/20 space-y-12">
           <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
              <div className="space-y-4">
                 <select 
                   value={unit1} onChange={e => setUnit1(e.target.value)}
                   className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest outline-none"
                 >
                    {Object.keys(cat.units).map(u => <option key={u} value={u} className="bg-black">{u}</option>)}
                 </select>
                 <input 
                   type="number" value={val1} onChange={e => setVal1(e.target.value)}
                   className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-3xl font-black font-mono focus:border-primary/50 outline-none text-center"
                 />
              </div>

              <div className="flex justify-center">
                 <div className="p-3 bg-primary/10 rounded-full text-primary border border-primary/20">
                    <ArrowLeftRight className="w-6 h-6" />
                 </div>
              </div>

              <div className="space-y-4">
                 <select 
                   value={unit2} onChange={e => setUnit2(e.target.value)}
                   className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest outline-none"
                 >
                    {Object.keys(cat.units).map(u => <option key={u} value={u} className="bg-black">{u}</option>)}
                 </select>
                 <div className="w-full bg-black/40 border border-white/5 rounded-2xl p-6 text-3xl font-black font-mono text-primary text-center">
                    {parseFloat(val2).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                 </div>
              </div>
           </div>
        </div>

        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4">
           <Info className="w-5 h-5 text-primary shrink-0" />
           <p className="text-sm text-muted-foreground leading-relaxed">
             All conversions use standardized SI factors. Processing is 100% local.
           </p>
        </div>
      </div>
    </ToolLayout>
  )
}
