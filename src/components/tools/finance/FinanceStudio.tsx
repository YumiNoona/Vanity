import React, { useState } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { PillToggle } from "@/components/shared/PillToggle"
import { Landmark, Coins, PieChart, Calendar, Wallet, Info, ArrowRight, TrendingUp, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

type FinanceMode = "loan" | "sip"

const CURRENCIES = ["₹", "$", "€", "£", "¥"]

export function FinanceStudio() {
  const [mode, setMode] = useState<FinanceMode>("loan")
  const [currency, setCurrency] = useState("₹")

  // Loan State
  const [principal, setPrincipal] = useState("500000")
  const [loanRate, setLoanRate] = useState("8.5")
  const [tenure, setTenure] = useState("5")

  // SIP State
  const [investment, setInvestment] = useState("5000")
  const [sipRate, setSipRate] = useState("12")
  const [years, setYears] = useState("10")

  const calculateLoan = () => {
    const p = parseFloat(principal) || 0
    const r = (parseFloat(loanRate) || 0) / 12 / 100
    const n = (parseFloat(tenure) || 0) * 12
    if (p === 0 || r === 0 || n === 0) return { emi: 0, totalInterest: 0, totalPayment: 0 }
    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    const totalPayment = emi * n
    const totalInterest = totalPayment - p
    return { emi, totalInterest, totalPayment }
  }

  const calculateSip = () => {
    const P = parseFloat(investment) || 0
    const i = (parseFloat(sipRate) || 0) / 100 / 12
    const n = (parseFloat(years) || 0) * 12
    if (P === 0 || i === 0 || n === 0) return { maturity: 0, invested: 0, wealth: 0 }
    const maturity = P * ( (Math.pow(1 + i, n) - 1) / i ) * (1 + i)
    const invested = P * n
    const wealth = maturity - invested
    return { maturity, invested, wealth }
  }

  const loanResults = calculateLoan()
  const sipResults = calculateSip()

  const formatNumber = (val: string) => {
    const num = val.replace(/,/g, "")
    if (!num || isNaN(Number(num))) return ""
    return Number(num).toLocaleString("en-IN")
  }

  return (
    <ToolLayout
      title="Finance Studio"
      description="Consolidated financial workbench for loans, investments, and retirement planning."
      icon={Landmark}
      centered={true}
      maxWidth="max-w-6xl"
    >
      <div className="space-y-8 px-4 sm:px-0 pb-12">
        <div className="flex justify-center">
          <PillToggle
            activeId={mode}
            onChange={(id) => setMode(id as FinanceMode)}
            options={[
              { id: "loan", label: "Loan EMI", icon: Landmark },
              { id: "sip", label: "SIP / Investment", icon: Coins },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-8">
              {mode === "loan" ? (
                <>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Principal Amount</label>
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
                        value={formatNumber(principal)} 
                        onChange={e => {
                          const raw = e.target.value.replace(/,/g, "")
                          if (!raw || /^\d*$/.test(raw)) setPrincipal(raw)
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-xl font-mono focus:border-primary/50 outline-none transition-all"
                      />
                    </div>
                    <input type="range" min="10000" max="10000000" step="10000" value={principal} onChange={e => setPrincipal(e.target.value)} className="w-full accent-primary" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Interest Rate (% p.a.)</label>
                    <input type="number" value={loanRate} onChange={e => setLoanRate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xl font-mono focus:border-primary/50 outline-none transition-all" />
                    <input type="range" min="1" max="30" step="0.1" value={loanRate} onChange={e => setLoanRate(e.target.value)} className="w-full accent-primary" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tenure (Years)</label>
                    <input type="number" value={tenure} onChange={e => setTenure(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xl font-mono focus:border-primary/50 outline-none transition-all" />
                    <input type="range" min="1" max="30" step="1" value={tenure} onChange={e => setTenure(e.target.value)} className="w-full accent-primary" />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Monthly Investment</label>
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
                        value={formatNumber(investment)} 
                        onChange={e => {
                          const raw = e.target.value.replace(/,/g, "")
                          if (!raw || /^\d*$/.test(raw)) setInvestment(raw)
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-xl font-mono focus:border-emerald-500/50 outline-none transition-all"
                      />
                    </div>
                    <input type="range" min="500" max="100000" step="500" value={investment} onChange={e => setInvestment(e.target.value)} className="w-full accent-emerald-500" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Expected Return (% p.a.)</label>
                    <input type="number" value={sipRate} onChange={e => setSipRate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xl font-mono focus:border-emerald-500/50 outline-none transition-all" />
                    <input type="range" min="1" max="30" step="0.5" value={sipRate} onChange={e => setSipRate(e.target.value)} className="w-full accent-emerald-500" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Time Period (Years)</label>
                    <input type="number" value={years} onChange={e => setYears(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xl font-mono focus:border-emerald-500/50 outline-none transition-all" />
                    <input type="range" min="1" max="50" step="1" value={years} onChange={e => setYears(e.target.value)} className="w-full accent-emerald-500" />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-12 h-full flex flex-col justify-center">
              {mode === "loan" ? (
                <>
                  <div className="text-center space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Monthly EMI</p>
                    <p className="text-5xl lg:text-6xl font-black font-syne text-white tracking-tight">{currency}{Math.round(loanResults.emi).toLocaleString()}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-12">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Total Interest</span>
                      <p className="text-xl font-mono font-bold text-white">{currency}{Math.round(loanResults.totalInterest).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Total Payable</span>
                      <p className="text-xl font-mono font-bold text-white">{currency}{Math.round(loanResults.totalPayment).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="pt-8">
                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden flex">
                      <div className="h-full bg-emerald-500" style={{ width: `${(parseFloat(principal) / loanResults.totalPayment) * 100}%` }} />
                      <div className="h-full bg-primary" style={{ width: `${(loanResults.totalInterest / loanResults.totalPayment) * 100}%` }} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Maturity Value</p>
                    <p className="text-5xl lg:text-6xl font-black font-syne text-emerald-400 tracking-tight">{currency}{Math.round(sipResults.maturity).toLocaleString()}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-12">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Invested Amount</span>
                      <p className="text-xl font-mono font-bold text-white">{currency}{Math.round(sipResults.invested).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Estimated Gains</span>
                      <p className="text-xl font-mono font-bold text-emerald-400">{currency}{Math.round(sipResults.wealth).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="pt-8">
                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden flex">
                      <div className="h-full bg-white/20" style={{ width: `${(sipResults.invested / sipResults.maturity) * 100}%` }} />
                      <div className="h-full bg-emerald-500" style={{ width: `${(sipResults.wealth / sipResults.maturity) * 100}%` }} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
