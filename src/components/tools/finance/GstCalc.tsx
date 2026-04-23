import React, { useState } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { Receipt, Plus, Minus, Info, Landmark } from "lucide-react"
import { cn } from "@/lib/utils"
import { AnimatedTabs } from "@/components/shared/AnimatedTabs"

const GST_RATES = [5, 12, 18, 28]

export function GstCalc() {
  const [amount, setAmount] = useState("1000")
  const [rate, setRate] = useState(18)
  const [mode, setMode] = useState<"exclusive" | "inclusive">("exclusive")

  const calculate = () => {
    const val = parseFloat(amount) || 0
    if (mode === "exclusive") {
      const gstAmount = (val * rate) / 100
      const total = val + gstAmount
      return { base: val, gst: gstAmount, total }
    } else {
      const base = val / (1 + rate / 100)
      const gstAmount = val - base
      const total = val
      return { base, gst: gstAmount, total }
    }
  }

  const { base, gst, total } = calculate()

  const formatIndian = (val: string) => {
    const num = val.replace(/,/g, "")
    if (!num || isNaN(Number(num))) return ""
    return Number(num).toLocaleString("en-IN")
  }

  return (
    <ToolLayout
      title="GST Calculator"
      description="Quickly compute tax-inclusive and tax-exclusive prices with standard GST rate breakdowns."
      icon={Receipt}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-8">
             <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Calculation Mode</label>
                <AnimatedTabs
                  tabs={[
                    { id: "exclusive", label: "Add GST", icon: Plus },
                    { id: "inclusive", label: "Remove GST", icon: Minus }
                  ]}
                  activeTab={mode}
                  onChange={setMode}
                  className="w-full"
                />
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount</label>
                <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">₹</span>
                   <input 
                     type="text" 
                     value={formatIndian(amount)} 
                     onChange={e => {
                       const raw = e.target.value.replace(/,/g, "")
                       if (!raw || /^\d*$/.test(raw)) setAmount(raw)
                     }}
                     className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-4 text-xl font-mono focus:border-primary/50 outline-none transition-all"
                     placeholder="0.00"
                   />
                </div>
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">GST Rate (%)</label>
                <div className="grid grid-cols-4 gap-2">
                   {GST_RATES.map(r => (
                     <button
                       key={r}
                       onClick={() => setRate(r)}
                       className={cn(
                         "py-3 rounded-xl border text-xs font-bold transition-all",
                         rate === r ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/5 hover:bg-white/10"
                       )}
                     >
                       {r}%
                     </button>
                   ))}
                </div>
                <input 
                  type="range" min="0" max="50" step="1" 
                  value={rate} 
                  onChange={e => setRate(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                   <span>Custom: {rate}%</span>
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
           <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-8 h-full flex flex-col justify-center">
              <div className="space-y-8">
                 <div className="flex justify-between items-end border-b border-white/5 pb-4">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Net Amount (Base)</p>
                       <p className="text-2xl font-mono font-bold text-white/90">₹ {base.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-right space-y-1">
                       <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">GST ({rate}%)</p>
                       <p className="text-2xl font-mono font-bold text-primary">₹ {gst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                 </div>

                 <div className="space-y-2 text-center pt-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Price</p>
                    <p className="text-6xl font-black font-syne text-white tracking-tight">₹ {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                 </div>
              </div>

              <div className="pt-8 grid grid-cols-2 gap-4">
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">CGST ({(rate/2).toFixed(1)}%)</p>
                    <p className="text-sm font-mono font-bold text-center">₹ {(gst/2).toLocaleString()}</p>
                 </div>
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">SGST ({(rate/2).toFixed(1)}%)</p>
                    <p className="text-sm font-mono font-bold text-center">₹ {(gst/2).toLocaleString()}</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-start gap-4 mt-8">
         <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
         <p className="text-[10px] text-muted-foreground leading-relaxed">
           In India, GST is usually split equally between Central (CGST) and State (SGST) for intra-state transactions. For inter-state, the full amount is Integrated GST (IGST). All calculations are done locally in your browser.
         </p>
      </div>
    </ToolLayout>
  )
}
