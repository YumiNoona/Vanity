import React, { useState } from "react"
import { Scissors, Settings2, Replace } from "lucide-react"
import { ToolLayout } from "@/components/layout/ToolLayout"

type CssUnit = "px" | "rem" | "em" | "vw" | "vh"

export function CssUnitConverter({ embedded = false }: { embedded?: boolean } = {}) {
  const [value, setValue] = useState<string>("16")
  const [fromUnit, setFromUnit] = useState<CssUnit>("px")
  
  const [baseFontSize, setBaseFontSize] = useState<number>(16)
  const [viewportWidth, setViewportWidth] = useState<number>(1920)
  const [viewportHeight, setViewportHeight] = useState<number>(1080)

  // Math core
  const computeToPx = (val: number, unit: CssUnit): number => {
    switch (unit) {
      case "px": return val
      case "rem":
      case "em": return val * baseFontSize
      case "vw": return (val / 100) * viewportWidth
      case "vh": return (val / 100) * viewportHeight
    }
  }

  const computeFromPx = (pxVal: number, targetUnit: CssUnit): number => {
    switch (targetUnit) {
      case "px": return pxVal
      case "rem":
      case "em": return pxVal / baseFontSize
      case "vw": return (pxVal / viewportWidth) * 100
      case "vh": return (pxVal / viewportHeight) * 100
    }
  }

  const numVal = parseFloat(value) || 0
  const pxValue = computeToPx(numVal, fromUnit)

  const units: CssUnit[] = ["px", "rem", "em", "vw", "vh"]

  return (
    <ToolLayout 
      title="CSS Unit Converter" 
      description="Instantly translate pixels to relative and viewport units." 
      icon={Scissors}
      maxWidth="max-w-6xl"
      centered={true}
      hideHeader={embedded}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-8 rounded-2xl space-y-8">
            
            <div className="flex flex-col md:flex-row items-stretch gap-4">
               <div className="flex-1 space-y-2">
                 <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Input Value</label>
                 <div className="flex bg-black/40 border border-white/10 rounded-xl focus-within:border-pink-500/50 transition-all overflow-hidden p-1">
                   <input 
                     type="number"
                     value={value}
                     onChange={(e) => setValue(e.target.value)}
                     className="flex-1 bg-transparent border-none outline-none font-mono text-3xl px-4 text-white"
                   />
                   <select 
                     value={fromUnit}
                     onChange={(e) => setFromUnit(e.target.value as CssUnit)}
                     className="bg-white/5 border-none outline-none font-bold px-4 rounded-lg text-pink-400 appearance-none text-center cursor-pointer hover:bg-white/10 transition-colors"
                   >
                     {units.map(u => <option key={u} value={u} className="bg-background">{u}</option>)}
                   </select>
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/5">
                {units.filter(u => u !== fromUnit).map(target => {
                  const result = computeFromPx(pxValue, target)
                  // Formatting to avoid crazy decimals, max 4 decimal places
                  const displayStr = Number.isInteger(result) ? result.toString() : result.toFixed(4).replace(/\.?0+$/, "")
                  
                  return (
                    <div key={target} className="bg-black/30 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center group active:scale-95 cursor-pointer transition-transform" onClick={() => {
                      setFromUnit(target)
                      setValue(displayStr)
                    }}>
                       <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 group-hover:text-pink-400 transition-colors">{target}</div>
                       <div className="font-mono text-xl text-white truncate w-full" title={displayStr}>{displayStr}</div>
                    </div>
                  )
                })}
            </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl h-fit space-y-6">
           <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground pb-4 border-b border-white/5">
             <Settings2 className="w-4 h-4" /> Context Settings
           </div>
           
           <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-2 block">Base Font Size (px)</label>
                <input 
                  type="number"
                  value={baseFontSize}
                  onChange={(e) => setBaseFontSize(Number(e.target.value) || 16)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 font-mono text-sm outline-none focus:border-pink-500/50"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Used for REM and EM resolution.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-2 block">Viewport Width (px)</label>
                <input 
                  type="number"
                  value={viewportWidth}
                  onChange={(e) => setViewportWidth(Number(e.target.value) || 1920)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 font-mono text-sm outline-none focus:border-pink-500/50"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Used for VW resolution.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-2 block">Viewport Height (px)</label>
                <input 
                  type="number"
                  value={viewportHeight}
                  onChange={(e) => setViewportHeight(Number(e.target.value) || 1080)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 font-mono text-sm outline-none focus:border-pink-500/50"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Used for VH resolution.</p>
              </div>
           </div>
        </div>
      </div>
    </ToolLayout>
  )
}
