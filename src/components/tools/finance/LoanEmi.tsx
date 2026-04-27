import React, { useState } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { Landmark, PieChart, Calendar, Wallet, Info, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function LoanEmi() {
  const [principal, setPrincipal] = useState("500000")
  const [rate, setRate] = useState("8.5")
  const [tenure, setTenure] = useState("5") // Years
  const [currency, setCurrency] = useState("₹")

  const CURRENCIES = ["₹", "$", "€", "£", "¥"]

  const calculate = () => {
    const p = parseFloat(principal) || 0
    const r = (parseFloat(rate) || 0) / 12 / 100
    const n = (parseFloat(tenure) || 0) * 12

    if (p === 0 || r === 0 || n === 0) return { emi: 0, totalInterest: 0, totalPayment: 0 }

    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    const totalPayment = emi * n
    const totalInterest = totalPayment - p

    return { emi, totalInterest, totalPayment }
  }

  const { emi, totalInterest, totalPayment } = calculate()

  const formatIndian = (val: string) => {
    const num = val.replace(/,/g, "")
    if (!num || isNaN(Number(num))) return ""
    return Number(num).toLocaleString("en-IN")
  }

  return (
    <ToolLayout
      title="Loan / EMI Calculator"
      description="Calculate monthly installments and total interest payable for home, car, or personal loans."
      icon={Landmark}
      centered={true}
      maxWidth="max-w-6xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-8">
             <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Principal Amount (Loan)</label>
                <div className="relative flex">
                   <select 
                     value={currency} 
                     onChange={e => setCurrency(e.target.value)}
                     className="absolute left-4 top-1/2 -translate-y-1/2 bg-transparent text-muted-foreground font-mono font-bold outline-none cursor-pointer border-none z-10 appearance-none"
                   >
                     {CURRENCIES.map(c => <option key={c} value={c} className="bg-zinc-900">{c}</option>)}
                   </select>
                   <input 
                     type="text" 
                     value={formatIndian(principal)} 
                     onChange={e => {
                       const raw = e.target.value.replace(/,/g, "")
                       if (!raw || /^\d*$/.test(raw)) setPrincipal(raw)
                     }}
                     className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-xl font-mono focus:border-primary/50 outline-none transition-all"
                     placeholder="0"
                   />
                </div>
                <input 
                  type="range" min="10000" max="10000000" step="10000" 
                  value={principal} onChange={e => setPrincipal(e.target.value)}
                  className="w-full accent-primary"
                />
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Interest Rate (p.a. %)</label>
                <div className="relative">
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">%</span>
                   <input 
                     type="number" value={rate} onChange={e => setRate(e.target.value)}
                     className="w-full bg-white/5 border border-white/10 rounded-2xl pl-4 pr-12 py-4 text-xl font-mono focus:border-primary/50 outline-none transition-all"
                     placeholder="0"
                   />
                </div>
                <input 
                  type="range" min="1" max="30" step="0.1" 
                  value={rate} onChange={e => setRate(e.target.value)}
                  className="w-full accent-primary"
                />
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loan Tenure (Years)</label>
                <div className="relative">
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">Yrs</span>
                   <input 
                     type="number" value={tenure} onChange={e => setTenure(e.target.value)}
                     className="w-full bg-white/5 border border-white/10 rounded-2xl pl-4 pr-16 py-4 text-xl font-mono focus:border-primary/50 outline-none transition-all"
                     placeholder="0"
                   />
                </div>
                <input 
                  type="range" min="1" max="30" step="1" 
                  value={tenure} onChange={e => setTenure(e.target.value)}
                  className="w-full accent-primary"
                />
             </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
           <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-12 h-full flex flex-col justify-center">
              <div className="text-center space-y-2">
                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Monthly EMI</p>
                 <p className="text-5xl lg:text-6xl font-black font-syne text-white tracking-tight whitespace-nowrap">{currency}{Math.round(emi).toLocaleString()}</p>
              </div>

              <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-12">
                 <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                       <PieChart className="w-3.5 h-3.5 text-primary" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Interest</span>
                    </div>
                    <p className="text-xl font-mono font-bold text-white">{currency} {Math.round(totalInterest).toLocaleString()}</p>
                 </div>
                 <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                       <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Payable</span>
                    </div>
                    <p className="text-xl font-mono font-bold text-white">{currency} {Math.round(totalPayment).toLocaleString()}</p>
                 </div>
              </div>

              <div className="pt-8">
                 <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden flex">
                    <div className="h-full bg-emerald-500" style={{ width: `${(parseFloat(principal) / totalPayment) * 100}%` }} />
                    <div className="h-full bg-primary" style={{ width: `${(totalInterest / totalPayment) * 100}%` }} />
                 </div>
                 <div className="flex justify-between mt-3 text-[10px] font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500" />
                       <span className="text-muted-foreground">Principal ({( (parseFloat(principal) / totalPayment) * 100 ).toFixed(1)}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-primary" />
                       <span className="text-muted-foreground">Interest ({( (totalInterest / totalPayment) * 100 ).toFixed(1)}%)</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </ToolLayout>
  )
}
