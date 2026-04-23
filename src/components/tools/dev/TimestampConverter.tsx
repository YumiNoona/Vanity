import React, { useState, useEffect } from "react"
import { Clock, Copy, CheckCircle, RefreshCcw, Calendar, Globe } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"

export function TimestampConverter() {
  const [epoch, setEpoch] = useState(Math.floor(Date.now() / 1000).toString())
  const [copied, setCopied] = useState<string | null>(null)

  // Determine current context time
  const [ms, setMs] = useState(Date.now())
  
  useEffect(() => {
    const val = parseInt(epoch, 10)
    if (!isNaN(val)) {
       setMs(epoch.length > 12 ? val : val * 1000)
    }
  }, [epoch])

  const dateObj = new Date(ms)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const setCurrentTime = () => {
    setEpoch(Math.floor(Date.now() / 1000).toString())
  }

  return (
    <ToolLayout title="Timestamp Converter" description="Convert Unix epoch to human-readable date and back." icon={Clock}>

      <div className="glass-panel p-8 rounded-2xl mx-4 sm:mx-0 space-y-8">
         <div className="space-y-4">
             <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Unix Epoch Timestamp
                </label>
                <button 
                  onClick={setCurrentTime}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-bold transition-colors"
                >
                  <RefreshCcw className="w-3 h-3" /> Current Time
                </button>
             </div>
             <div className="flex bg-black/40 border border-white/10 rounded-xl p-2 focus-within:border-blue-500/50 transition-colors">
               <input 
                 type="number"
                 value={epoch}
                 onChange={(e) => setEpoch(e.target.value)}
                 className="flex-1 bg-transparent border-none outline-none font-mono text-2xl px-4 py-2"
                 placeholder="1710000000"
               />
               <button 
                  onClick={() => copyToClipboard(epoch, 'epoch')}
                  className="px-4 hover:bg-white/5 rounded-lg text-muted-foreground hover:text-white transition-colors"
                >
                  {copied === 'epoch' ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                </button>
             </div>
             <div className="flex gap-2">
                <button onClick={() => setEpoch(Math.floor(ms / 1000).toString())} className="text-[10px] font-bold px-3 py-1 bg-white/5 rounded hover:bg-white/10">Seconds (s)</button>
                <button onClick={() => setEpoch(ms.toString())} className="text-[10px] font-bold px-3 py-1 bg-white/5 rounded hover:bg-white/10">Milliseconds (ms)</button>
             </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
             <div className="space-y-4">
               <label className="text-xs font-bold uppercase tracking-widest text-blue-400 flex items-center gap-2">
                 <Calendar className="w-4 h-4" /> Local Time
               </label>
               <div className="bg-black/30 border border-white/5 rounded-xl p-5 space-y-4 relative group">
                  <button 
                    onClick={() => copyToClipboard(dateObj.toString(), 'local')}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/5 rounded text-muted-foreground hover:text-white"
                  >
                    {copied === 'local' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Date</div>
                    <div className="font-mono text-lg">{!isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : "Invalid Date"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Time</div>
                    <div className="font-mono text-xl text-white">{!isNaN(dateObj.getTime()) ? dateObj.toLocaleTimeString() : "--:--:--"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Timezone</div>
                    <div className="font-mono text-sm">{!isNaN(dateObj.getTime()) ? Intl.DateTimeFormat().resolvedOptions().timeZone : "Unknown"}</div>
                  </div>
               </div>
             </div>

             <div className="space-y-4">
               <label className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                 <Globe className="w-4 h-4" /> UTC (Zulu)
               </label>
               <div className="bg-black/30 border border-white/5 rounded-xl p-5 space-y-4 relative group">
                  <button 
                    onClick={() => copyToClipboard(dateObj.toUTCString(), 'utc')}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/5 rounded text-muted-foreground hover:text-white"
                  >
                    {copied === 'utc' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Date</div>
                    <div className="font-mono text-lg">{!isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : "Invalid Date"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Time</div>
                    <div className="font-mono text-xl text-white">{!isNaN(dateObj.getTime()) ? dateObj.toLocaleTimeString('en-GB', { timeZone: 'UTC' }) : "--:--:--"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">ISO 8601</div>
                    <div className="font-mono text-sm">{!isNaN(dateObj.getTime()) ? dateObj.toISOString() : "Unknown"}</div>
                  </div>
               </div>
             </div>
         </div>
      </div>
    </ToolLayout>
  )
}
