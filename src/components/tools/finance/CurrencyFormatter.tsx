import React, { useState, useEffect } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { Wallet, CheckCircle, Hash, Info, ArrowRightLeft, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
]

export function CurrencyFormatter() {
  const [amount, setAmount] = useState("1")
  const [baseCurrency, setBaseCurrency] = useState("USD")
  const [rates, setRates] = useState<Record<string, number> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  useEffect(() => {
    fetchRates(baseCurrency)
  }, [baseCurrency])

  const fetchRates = async (base: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${base}`)
      if (!res.ok) throw new Error("Failed to fetch rates")
      const data = await res.json()
      setRates(data.rates)
      setLastUpdated(new Date(data.time_last_update_unix * 1000).toLocaleString())
    } catch (err) {
      console.error(err)
      toast.error("Could not load live exchange rates. Using fallbacks.")
      // Hardcoded fallbacks relative to USD roughly
      const fallback: Record<string, number> = {
        USD: 1, EUR: 0.92, GBP: 0.79, JPY: 150, INR: 83.2, CNY: 7.2, AUD: 1.52, CAD: 1.35, CHF: 0.9, HKD: 7.8, SGD: 1.34, NZD: 1.66
      }
      if (base !== "USD") {
        const baseRate = fallback[base] || 1
        Object.keys(fallback).forEach(k => fallback[k] = fallback[k] / baseRate)
      }
      setRates(fallback)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = (val: string) => {
    navigator.clipboard.writeText(val)
    toast.success("Amount copied to clipboard")
  }

  const numericAmount = parseFloat(amount) || 0

  return (
    <ToolLayout
      title="Currency Converter"
      description="Real-time exchange rates for the world's 12 most traded currencies."
      icon={ArrowRightLeft}
    >
      <div className="space-y-8">
        <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-6">
           <div className="flex flex-col md:flex-row gap-6">
             <div className="flex-1 space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount</label>
                <div className="relative">
                   <Hash className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
                   <input 
                      type="number" 
                      value={amount} 
                      onChange={e => setAmount(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-6 py-6 text-3xl font-mono font-black focus:border-primary/50 outline-none transition-all"
                      placeholder="Enter amount..."
                   />
                </div>
             </div>
             
             <div className="md:w-64 space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">From Currency</label>
                <select
                  value={baseCurrency}
                  onChange={(e) => setBaseCurrency(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-6 text-xl font-bold focus:border-primary/50 outline-none transition-all appearance-none cursor-pointer"
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code} className="bg-zinc-900 text-white">
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
             </div>
           </div>
           
           {lastUpdated && (
             <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
               <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin text-primary")} />
               <span>Rates updated: {lastUpdated}</span>
             </div>
           )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           {CURRENCIES.filter(c => c.code !== baseCurrency).map((c, i) => {
             const rate = rates?.[c.code] || 0
             const converted = numericAmount * rate
             const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: c.code }).format(converted)
             
             return (
               <button
                 key={c.code}
                 onClick={() => handleCopy(converted.toFixed(2))}
                 className="group glass-panel p-6 rounded-2xl border border-white/5 bg-black/20 text-left hover:border-primary/30 transition-all space-y-2 relative"
               >
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{c.name}</span>
                  </div>
                  <div className="flex items-end gap-2">
                     <p className="text-2xl font-mono font-bold text-white group-hover:text-primary transition-colors">{formatted}</p>
                  </div>
                  <div className="text-[9px] font-mono text-muted-foreground uppercase flex justify-between">
                     <span>1 {baseCurrency} = {rate.toFixed(4)} {c.code}</span>
                  </div>
               </button>
             )
           })}
        </div>

        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4">
           <Info className="w-5 h-5 text-primary shrink-0" />
           <p className="text-sm text-muted-foreground leading-relaxed">
             Exchange rates are updated daily. Conversions are approximations intended for informational purposes and may not match exact market trading rates.
           </p>
        </div>
      </div>
    </ToolLayout>
  )
}
