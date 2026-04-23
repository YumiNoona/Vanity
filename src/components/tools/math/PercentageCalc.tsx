import React, { useState } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { Percent, ArrowRightLeft, Calculator, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

export function PercentageCalc() {
  // Mode 1: What is X% of Y?
  const [m1X, setM1X] = useState("10")
  const [m1Y, setM1Y] = useState("100")
  
  // Mode 2: X is what % of Y?
  const [m2X, setM2X] = useState("20")
  const [m2Y, setM2Y] = useState("200")

  // Mode 3: % Change from X to Y
  const [m3X, setM3X] = useState("50")
  const [m3Y, setM3Y] = useState("75")

  const calcM1 = () => (parseFloat(m1X) / 100) * parseFloat(m1Y)
  const calcM2 = () => (parseFloat(m2X) / parseFloat(m2Y)) * 100
  const calcM3 = () => ((parseFloat(m3Y) - parseFloat(m3X)) / parseFloat(m3X)) * 100

  return (
    <ToolLayout
      title="Percentage Calculator"
      description="Quickly calculate percentages, ratios, and percentage changes with visual breakdowns."
      icon={Percent}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Mode 1 */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 space-y-6 flex flex-col">
           <div className="flex items-center gap-3 text-primary">
              <Calculator className="w-5 h-5" />
              <h3 className="text-[10px] font-black uppercase tracking-widest">Percentage of</h3>
           </div>
           <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3">
                 <span className="text-xs font-bold text-muted-foreground w-12">What is</span>
                 <input 
                   type="number" value={m1X} onChange={e => setM1X(e.target.value)}
                   className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono focus:border-primary/50 outline-none"
                 />
                 <span className="text-xs font-bold text-muted-foreground">%</span>
              </div>
              <div className="flex items-center gap-3">
                 <span className="text-xs font-bold text-muted-foreground w-12">of</span>
                 <input 
                   type="number" value={m1Y} onChange={e => setM1Y(e.target.value)}
                   className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono focus:border-primary/50 outline-none"
                 />
              </div>
           </div>
           <div className="pt-6 border-t border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Result</p>
              <p className="text-3xl font-black font-syne text-primary">{calcM1().toLocaleString()}</p>
           </div>
        </div>

        {/* Mode 2 */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 space-y-6 flex flex-col">
           <div className="flex items-center gap-3 text-accent">
              <ArrowRightLeft className="w-5 h-5" />
              <h3 className="text-[10px] font-black uppercase tracking-widest">Percentage is</h3>
           </div>
           <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3">
                 <input 
                   type="number" value={m2X} onChange={e => setM2X(e.target.value)}
                   className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono focus:border-accent/50 outline-none"
                 />
                 <span className="text-xs font-bold text-muted-foreground w-12 text-center">is what %</span>
              </div>
              <div className="flex items-center gap-3">
                 <span className="text-xs font-bold text-muted-foreground w-12">of</span>
                 <input 
                   type="number" value={m2Y} onChange={e => setM2Y(e.target.value)}
                   className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono focus:border-accent/50 outline-none"
                 />
              </div>
           </div>
           <div className="pt-6 border-t border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Result</p>
              <p className="text-3xl font-black font-syne text-accent">{calcM2().toFixed(2)}%</p>
           </div>
        </div>

        {/* Mode 3 */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 space-y-6 flex flex-col">
           <div className="flex items-center gap-3 text-emerald-500">
              <TrendingUp className="w-5 h-5" />
              <h3 className="text-[10px] font-black uppercase tracking-widest">Percentage Change</h3>
           </div>
           <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3">
                 <span className="text-xs font-bold text-muted-foreground w-12">From</span>
                 <input 
                   type="number" value={m3X} onChange={e => setM3X(e.target.value)}
                   className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono focus:border-emerald-500/50 outline-none"
                 />
              </div>
              <div className="flex items-center gap-3">
                 <span className="text-xs font-bold text-muted-foreground w-12">To</span>
                 <input 
                   type="number" value={m3Y} onChange={e => setM3Y(e.target.value)}
                   className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono focus:border-emerald-500/50 outline-none"
                 />
              </div>
           </div>
           <div className="pt-6 border-t border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Result</p>
              <div className="flex items-center gap-2">
                 <p className={cn(
                   "text-3xl font-black font-syne",
                   calcM3() >= 0 ? "text-emerald-500" : "text-red-500"
                 )}>
                   {calcM3() >= 0 ? "+" : ""}{calcM3().toFixed(2)}%
                 </p>
                 {calcM3() >= 0 ? <TrendingUp className="w-6 h-6 text-emerald-500" /> : <TrendingDown className="w-6 h-6 text-red-500" />}
              </div>
           </div>
        </div>
      </div>
    </ToolLayout>
  )
}
