import React, { useState } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { Wallet, Copy, CheckCircle, Globe, Hash, Info, Landmark } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const LOCALES = [
  { code: "en-IN", name: "India (INR)", currency: "INR" },
  { code: "en-US", name: "United States (USD)", currency: "USD" },
  { code: "en-GB", name: "United Kingdom (GBP)", currency: "GBP" },
  { code: "de-DE", name: "Germany (EUR)", currency: "EUR" },
  { code: "ja-JP", name: "Japan (JPY)", currency: "JPY" },
  { code: "zh-CN", name: "China (CNY)", currency: "CNY" },
  { code: "fr-FR", name: "France (EUR)", currency: "EUR" },
  { code: "ru-RU", name: "Russia (RUB)", currency: "RUB" },
  { code: "en-AU", name: "Australia (AUD)", currency: "AUD" },
  { code: "en-CA", name: "Canada (CAD)", currency: "CAD" },
]

export function CurrencyFormatter() {
  const [value, setValue] = useState("1000000")
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const format = (loc: string, cur: string) => {
    try {
      return new Intl.NumberFormat(loc, {
        style: "currency",
        currency: cur,
      }).format(parseFloat(value) || 0)
    } catch (e) {
      return "N/A"
    }
  }

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
    toast.success("Formatted value copied")
  }

  return (
    <ToolLayout
      title="Currency Formatter"
      description="Instantly format numbers into major world currency locales (INR Lakhs/Crores, USD, etc.) using the Intl API."
      icon={Wallet}
    >
      <div className="space-y-8">
        <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-6">
           <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Input Number</label>
           <div className="relative">
              <Hash className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
              <input 
                 type="number" 
                 value={value} 
                 onChange={e => setValue(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-6 py-6 text-3xl font-mono font-black focus:border-primary/50 outline-none transition-all"
                 placeholder="Enter amount..."
              />
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           {LOCALES.map((loc, i) => {
             const formatted = format(loc.code, loc.currency)
             return (
               <button
                 key={loc.code}
                 onClick={() => handleCopy(formatted, i)}
                 className="group glass-panel p-6 rounded-2xl border border-white/5 bg-black/20 text-left hover:border-primary/30 transition-all space-y-2 relative"
               >
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{loc.name}</span>
                     {copiedIndex === i ? (
                       <CheckCircle className="w-4 h-4 text-emerald-500" />
                     ) : (
                       <Copy className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                     )}
                  </div>
                  <p className="text-xl font-mono font-bold text-white group-hover:text-primary transition-colors">{formatted}</p>
                  <div className="text-[8px] font-mono text-muted-foreground uppercase">{loc.code} / {loc.currency}</div>
               </button>
             )
           })}
        </div>

        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-start gap-4">
           <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
           <p className="text-[10px] text-muted-foreground leading-relaxed">
             Vanity uses the native <code>Intl.NumberFormat</code> API which correctly handles locale-specific numbering systems, such as the Indian system (1,00,000 for one lakh) versus the Western system (100,000).
           </p>
        </div>
      </div>
    </ToolLayout>
  )
}
