import React, { useState, useMemo } from "react"
import { Clock, Copy, CheckCircle, RefreshCcw, Calendar, Globe, Zap, History, Calculator, Briefcase } from "lucide-react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"
import { cn } from "@/lib/utils"

export function TimestampConverter() {
  const [epoch, setEpoch] = useState(Math.floor(Date.now() / 1000).toString())
  const { copiedId, copy } = useCopyToClipboard()

  // Business Days Calculator State
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0])

  const dateObj = useMemo(() => {
    const val = parseInt(epoch, 10)
    if (isNaN(val)) return new Date(NaN)
    const factor = epoch.length > 12 ? 1 : epoch.length > 10 ? 1 : 1000
    return new Date(val * factor)
  }, [epoch])

  const businessDays = useMemo(() => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0
    
    let count = 0
    const cur = new Date(start)
    while (cur <= end) {
      const day = cur.getDay()
      if (day !== 0 && day !== 6) count++
      cur.setDate(cur.getDate() + 1)
    }
    return count
  }, [startDate, endDate])

  const formatRelative = (date: Date) => {
    if (isNaN(date.getTime())) return ""
    const diff = (Date.now() - date.getTime()) / 1000
    const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" })
    
    if (Math.abs(diff) < 60) return formatter.format(-Math.round(diff), "second")
    if (Math.abs(diff) < 3600) return formatter.format(-Math.round(diff / 60), "minute")
    if (Math.abs(diff) < 86400) return formatter.format(-Math.round(diff / 3600), "hour")
    if (Math.abs(diff) < 2592000) return formatter.format(-Math.round(diff / 86400), "day")
    if (Math.abs(diff) < 31536000) return formatter.format(-Math.round(diff / 2592000), "month")
    return formatter.format(-Math.round(diff / 31536000), "year")
  }

  return (
    <ToolLayout title="Chronos Studio" description="Advanced epoch converter, relative time engine, and business day architect." icon={Clock} centered maxWidth="max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Unix Epoch Timestamp</label>
                 <button onClick={() => setEpoch(Math.floor(Date.now() / 1000).toString())} className="text-[10px] font-black uppercase text-primary hover:scale-105 transition-all flex items-center gap-2">
                   <RefreshCcw className="w-3.5 h-3.5" /> Now
                 </button>
              </div>
              <div className="relative group">
                <input type="text" value={epoch} onChange={(e) => setEpoch(e.target.value.replace(/[^0-9]/g, ''))} className="w-full bg-black/40 border border-white/10 rounded-2xl p-8 font-mono text-4xl text-white outline-none focus:border-primary/50 transition-all text-center" />
                <button onClick={() => copy(epoch, 'epoch')} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                  {copiedId === 'epoch' ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex gap-2 justify-center">
                 <button onClick={() => setEpoch(Math.floor(dateObj.getTime() / 1000).toString())} className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 hover:text-primary transition-all">Seconds</button>
                 <button onClick={() => setEpoch(dateObj.getTime().toString())} className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 hover:text-primary transition-all">Milliseconds</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-white/5">
               <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date Picker (Local)</label>
                  <input type="datetime-local" value={!isNaN(dateObj.getTime()) ? new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""} onChange={(e) => setEpoch(Math.floor(new Date(e.target.value).getTime() / 1000).toString())} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 font-mono text-sm text-white outline-none focus:border-primary" />
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">ISO String</label>
                  <input type="text" value={!isNaN(dateObj.getTime()) ? dateObj.toISOString() : ""} readOnly className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 font-mono text-sm text-white/50 outline-none" />
               </div>
            </div>
          </div>

          <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-6">
             <div className="flex items-center gap-3"><Briefcase className="w-4 h-4 text-primary" /><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Business Days Calculator</span></div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-muted-foreground uppercase">Start Date</label>
                   <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs outline-none" />
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-muted-foreground uppercase">End Date</label>
                   <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs outline-none" />
                </div>
             </div>
             <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between">
                <div>
                   <p className="text-[10px] font-black text-primary uppercase">Total Business Days</p>
                   <p className="text-3xl font-black text-white mt-1">{businessDays} <span className="text-xs text-muted-foreground font-bold uppercase">Days</span></p>
                </div>
                <Calculator className="w-8 h-8 text-primary/40" />
             </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
           <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-8 flex flex-col justify-center text-center">
              <div className="space-y-2">
                 <p className="text-[10px] font-black uppercase tracking-widest text-primary">Live Relative View</p>
                 <p className="text-4xl font-black text-white tracking-tighter">{formatRelative(dateObj) || "Invalid Date"}</p>
              </div>
              <div className="space-y-4">
                 {[
                   { label: "Local Format", icon: Clock, value: !isNaN(dateObj.getTime()) ? dateObj.toLocaleString() : "--", id: "local" },
                   { label: "UTC Format", icon: Globe, value: !isNaN(dateObj.getTime()) ? dateObj.toUTCString() : "--", id: "utc" },
                 ].map(item => (
                   <div key={item.id} className="group p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between hover:border-primary/30 transition-all">
                     <div className="flex items-center gap-3 text-left">
                        <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <div><p className="text-[9px] font-black uppercase text-muted-foreground">{item.label}</p><p className="text-xs font-mono text-white mt-0.5">{item.value}</p></div>
                     </div>
                     <button onClick={() => copy(item.value, item.id)} className="p-2 opacity-0 group-hover:opacity-100 transition-all">{copiedId === item.id ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}</button>
                   </div>
                 ))}
              </div>
              <div className="p-4 bg-white/5 rounded-2xl flex items-center gap-3 text-left">
                 <History className="w-5 h-5 text-muted-foreground" />
                 <div><p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">System Timezone</p><p className="text-[10px] font-mono text-primary">{Intl.DateTimeFormat().resolvedOptions().timeZone}</p></div>
              </div>
           </div>
        </div>
      </div>
    </ToolLayout>
  )
}
