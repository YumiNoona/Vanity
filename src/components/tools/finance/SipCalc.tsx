import React, { useState } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { Coins, TrendingUp, Calendar, Wallet, Info, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

export function SipCalc() {
  const [investment, setInvestment] = useState("5000")
  const [returnRate, setReturnRate] = useState("12")
  const [years, setYears] = useState("10")

  const calculate = () => {
    const P = parseFloat(investment) || 0
    const i = (parseFloat(returnRate) || 0) / 100 / 12
    const n = (parseFloat(years) || 0) * 12

    if (P === 0 || i === 0 || n === 0) return { maturity: 0, invested: 0, wealth: 0 }

    // FV = P × [ ( (1 + i)^n - 1 ) / i ] × (1 + i)
    const maturity = P * ( (Math.pow(1 + i, n) - 1) / i ) * (1 + i)
    const invested = P * n
    const wealth = maturity - invested

    return { maturity, invested, wealth }
  }

  const { maturity, invested, wealth } = calculate()

  const formatIndian = (val: string) => {
    const num = val.replace(/,/g, "")
    if (!num || isNaN(Number(num))) return ""
    return Number(num).toLocaleString("en-IN")
  }

  return (
    <ToolLayout
      title="SIP / Investment Calculator"
      description="Project the future value of your recurring mutual fund investments with compound growth charts."
      icon={Coins}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-8">
             <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Monthly Investment</label>
                <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">₹</span>
                   <input 
                     type="text" 
                     value={formatIndian(investment)} 
                     onChange={e => {
                       const raw = e.target.value.replace(/,/g, "")
                       if (!raw || /^\d*$/.test(raw)) setInvestment(raw)
                     }}
                     className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-4 text-xl font-mono focus:border-emerald-500/50 outline-none transition-all"
                     placeholder="0"
                   />
                </div>
                <input 
                  type="range" min="500" max="100000" step="500" 
                  value={investment} onChange={e => setInvestment(e.target.value)}
                  className="w-full accent-emerald-500"
                />
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Expected Return (p.a. %)</label>
                <div className="relative">
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">%</span>
                   <input 
                     type="number" value={returnRate} onChange={e => setReturnRate(e.target.value)}
                     className="w-full bg-white/5 border border-white/10 rounded-2xl pl-4 pr-12 py-4 text-xl font-mono focus:border-emerald-500/50 outline-none transition-all"
                     placeholder="0"
                   />
                </div>
                <input 
                  type="range" min="1" max="30" step="0.5" 
                  value={returnRate} onChange={e => setReturnRate(e.target.value)}
                  className="w-full accent-emerald-500"
                />
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Time Period (Years)</label>
                <div className="relative">
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">Yrs</span>
                   <input 
                     type="number" value={years} onChange={e => setYears(e.target.value)}
                     className="w-full bg-white/5 border border-white/10 rounded-2xl pl-4 pr-16 py-4 text-xl font-mono focus:border-emerald-500/50 outline-none transition-all"
                     placeholder="0"
                   />
                </div>
                <input 
                  type="range" min="1" max="50" step="1" 
                  value={years} onChange={e => setYears(e.target.value)}
                  className="w-full accent-emerald-500"
                />
             </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
           <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-12 h-full flex flex-col justify-center">
              <div className="text-center space-y-2">
                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estimated Maturity Amount</p>
                 <p className="text-6xl font-black font-syne text-emerald-400 tracking-tight">₹ {Math.round(maturity).toLocaleString()}</p>
              </div>

              <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-12">
                 <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                       <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Invested Amount</span>
                    </div>
                    <p className="text-xl font-mono font-bold text-white">₹ {Math.round(invested).toLocaleString()}</p>
                 </div>
                 <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                       <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Est. Returns</span>
                    </div>
                    <p className="text-xl font-mono font-bold text-emerald-400">₹ {Math.round(wealth).toLocaleString()}</p>
                 </div>
              </div>

              <div className="pt-8">
                 <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden flex">
                    <div className="h-full bg-white/20" style={{ width: `${(invested / maturity) * 100}%` }} />
                    <div className="h-full bg-emerald-500" style={{ width: `${(wealth / maturity) * 100}%` }} />
                 </div>
                 <div className="flex justify-between mt-3 text-[10px] font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-white/20" />
                       <span className="text-muted-foreground">Invested ({( (invested / maturity) * 100 ).toFixed(1)}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500" />
                       <span className="text-muted-foreground">Gains ({( (wealth / maturity) * 100 ).toFixed(1)}%)</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </ToolLayout>
  )
}
