import React, { useState, useEffect, useMemo } from "react"
import { Clock, Copy, CheckCircle, RefreshCcw, Calendar, Globe, Zap, History } from "lucide-react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"
import { cn } from "@/lib/utils"

export function TimestampConverter() {
  const [epoch, setEpoch] = useState(Math.floor(Date.now() / 1000).toString())
  const { copiedId, copy } = useCopyToClipboard()

  // Computed state for Date Object
  const dateObj = useMemo(() => {
    const val = parseInt(epoch, 10)
    if (isNaN(val)) return new Date(NaN)
    // Heuristic: if > 13 digits, assume microseconds; if > 11 assume ms; else s
    const factor = epoch.length > 12 ? 1 : epoch.length > 10 ? 1 : 1000
    return new Date(val * factor)
  }, [epoch])

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = new Date(e.target.value)
    if (!isNaN(d.getTime())) {
      setEpoch(Math.floor(d.getTime() / 1000).toString())
    }
  }

  const setCurrentTime = () => {
    setEpoch(Math.floor(Date.now() / 1000).toString())
  }

  const formatRelative = (date: Date) => {
    if (isNaN(date.getTime())) return ""
    const diff = (Date.now() - date.getTime()) / 1000
    const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" })
    
    if (Math.abs(diff) < 60) return formatter.format(-Math.round(diff), "second")
    if (Math.abs(diff) < 3600) return formatter.format(-Math.round(diff / 60), "minute")
    if (Math.abs(diff) < 86400) return formatter.format(-Math.round(diff / 3600), "hour")
    return formatter.format(-Math.round(diff / 86400), "day")
  }

  return (
    <ToolLayout 
      title="Timestamp Converter" 
      description="Advanced epoch converter with visual picking and timezone inspection." 
      icon={Clock}
      centered={true}
      maxWidth="max-w-5xl"
    >
      <div className="space-y-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Unix Epoch Timestamp</label>
                 <button onClick={setCurrentTime} className="text-[10px] font-black uppercase text-primary hover:text-primary/80 flex items-center gap-2 transition-all">
                   <RefreshCcw className="w-3.5 h-3.5" /> Current Time
                 </button>
              </div>
              <div className="relative group">
                <input 
                  type="text" 
                  value={epoch}
                  onChange={(e) => setEpoch(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 font-mono text-3xl text-white outline-none focus:border-primary/50 transition-all text-center"
                />
                <button 
                  onClick={() => copy(epoch, 'epoch')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                >
                  {copiedId === 'epoch' ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex gap-2 justify-center">
                 <button onClick={() => setEpoch(Math.floor(dateObj.getTime() / 1000).toString())} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Seconds (s)</button>
                 <button onClick={() => setEpoch(dateObj.getTime().toString())} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Millis (ms)</button>
              </div>
            </div>

            <div className="space-y-4 pt-8 border-t border-white/5">
               <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Visual Date Picker</label>
               <input 
                 type="datetime-local"
                 value={!isNaN(dateObj.getTime()) ? new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                 onChange={handleDatePickerChange}
                 className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 font-mono text-sm text-white outline-none focus:border-primary/50 transition-all cursor-pointer"
               />
               <p className="text-[10px] text-muted-foreground italic flex items-center gap-2">
                 <Zap className="w-3 h-3 text-primary" />
                 Picking a date will automatically update the epoch above.
               </p>
            </div>
          </div>

          {/* Result Panel */}
          <div className="space-y-6">
            <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-8 h-full flex flex-col justify-center">
              <div className="text-center space-y-2">
                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-2">
                   <Calendar className="w-3.5 h-3.5" /> Relative Time
                 </p>
                 <p className="text-4xl font-black font-syne text-white tracking-tight">
                   {formatRelative(dateObj) || "Invalid Date"}
                 </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                 {[
                   { label: "Local Time", icon: Clock, value: !isNaN(dateObj.getTime()) ? dateObj.toLocaleString() : "--", id: "local" },
                   { label: "UTC Time", icon: Globe, value: !isNaN(dateObj.getTime()) ? dateObj.toUTCString() : "--", id: "utc" },
                   { label: "ISO 8601", icon: Zap, value: !isNaN(dateObj.getTime()) ? dateObj.toISOString() : "--", id: "iso" },
                 ].map(item => (
                   <div key={item.id} className="group p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-primary/30 transition-all flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                           <item.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</p>
                          <p className="text-sm font-mono text-white mt-1">{item.value}</p>
                        </div>
                     </div>
                     <button onClick={() => copy(item.value, item.id)} className="p-2 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/5 rounded-lg">
                        {copiedId === item.id ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                     </button>
                   </div>
                 ))}
              </div>

              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-4">
                <History className="w-5 h-5 text-primary shrink-0" />
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white">Timezone Aware</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Browser Timezone: <span className="text-primary font-mono">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
