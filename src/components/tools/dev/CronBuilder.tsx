import React, { useState, useEffect, useMemo } from "react"
import { Calendar, Clock, AlertTriangle, ArrowRight, RefreshCw, Info } from "lucide-react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function CronBuilder() {
  const [expression, setExpression] = useState("*/15 * * * *")
  const [nextRuns, setNextRuns] = useState<Date[]>([])
  const [error, setError] = useState<string | null>(null)
  const [description, setDescription] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  const parts = useMemo(() => {
    const p = expression.trim().split(/\s+/)
    return p.length >= 5 ? p : []
  }, [expression])

  useEffect(() => {
    const calculateRuns = async () => {
      if (!expression.trim()) {
        setNextRuns([])
        setError(null)
        setDescription(null)
        return
      }

      try {
        const [cronParserModule, cronstrueModule] = await Promise.all([
          import("cron-parser"),
          import("cronstrue")
        ])
        
        // Robust module detection for different build targets
        const cronParser = (cronParserModule as any).parseExpression ? (cronParserModule as any) : ((cronParserModule as any).default || cronParserModule);
        const cronstrue = (cronstrueModule as any).toString ? (cronstrueModule as any) : ((cronstrueModule as any).default || cronstrueModule);
        
        if (typeof cronParser.parseExpression !== 'function') {
           throw new Error("Parser engine not found. Please try a different expression or refresh.");
        }

        // 1. Try to get human readable description
        try {
          const desc = cronstrue.toString(expression)
          setDescription(desc)
        } catch (e) {
          setDescription(null)
          throw new Error("Invalid sequence for description. Ensure crontab (5 fields) or Quartz (6 fields) format.");
        }

        // 2. Try to calculate next runs
        const interval = cronParser.parseExpression(expression)
        const runs = []
        for (let i = 0; i < 5; i++) {
          runs.push(interval.next().toDate())
        }
        
        setNextRuns(runs)
        setError(null)
      } catch (e: any) {
        console.error("CRON Error:", e)
        setError(e.message || "Invalid CRON expression format.")
        setNextRuns([])
        setDescription(null)
      } finally {
        setIsInitializing(false)
      }
    }

    const timer = setTimeout(calculateRuns, 300)
    return () => clearTimeout(timer)
  }, [expression])

  const preSets = [
    { label: "Every 15 mins", val: "*/15 * * * *" },
    { label: "Every hour at 30 mins", val: "30 * * * *" },
    { label: "Every day at midnight", val: "0 0 * * *" },
    { label: "Every Monday at 9AM", val: "0 9 * * 1" },
    { label: "First day of month", val: "0 0 1 * *" },
    { label: "Every 5 seconds", val: "*/5 * * * * *" },
  ]

  return (
    <ToolLayout 
      title="CRON Expression Tester" 
      description="Validate schedules and visualize precision run times for automation tasks." 
      icon={Calendar} 
      maxWidth="max-w-6xl"
      centered={true}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 sm:px-0 pb-12">
         <div className="lg:col-span-7 space-y-8">
            <div className="glass-panel p-8 rounded-[2rem] space-y-8 bg-black/20 border border-white/5 shadow-2xl">
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-primary" /> Input Expression
                     </label>
                     <span className="text-[9px] font-mono text-primary/50 uppercase">{parts.length} Fields Detected</span>
                  </div>
                  
                  <div className="relative group">
                     <input 
                       value={expression}
                       onChange={(e) => setExpression(e.target.value)}
                       placeholder="e.g. 0 0 * * *"
                       className={cn(
                         "w-full bg-black/40 border rounded-2xl p-8 font-mono text-4xl outline-none transition-all",
                         error ? "border-red-500/50 text-red-200 ring-4 ring-red-500/5" : "border-white/10 focus:border-primary/50 text-primary-foreground focus:ring-4 focus:ring-primary/5 shadow-inner"
                       )}
                       spellCheck={false}
                     />
                     {isInitializing && (
                        <div className="absolute right-6 top-1/2 -translate-y-1/2">
                           <RefreshCw className="w-6 h-6 text-primary/30 animate-spin" />
                        </div>
                     )}
                  </div>
               </div>

               {error && (
                 <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4 text-red-400 animate-in slide-in-from-top-2">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                       <p className="text-[11px] font-black uppercase tracking-tight">Format Error</p>
                       <p className="text-[10px] opacity-80 leading-relaxed font-medium">{error}</p>
                    </div>
                 </div>
               )}

               {description && !error && (
                 <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 flex items-center gap-5 group animate-in zoom-in-95 duration-300">
                    <div className="p-3 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
                       <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Human Description</p>
                       <p className="text-lg font-bold text-white leading-tight">
                         {description}
                       </p>
                    </div>
                 </div>
               )}

               {!error && parts.length >= 5 && (
                 <div className="grid grid-cols-5 sm:grid-cols-6 gap-3">
                    {[
                      { label: "Min", val: parts[0] },
                      { label: "Hour", val: parts[1] },
                      { label: "DOM", val: parts[2] },
                      { label: "Month", val: parts[3] },
                      { label: "DOW", val: parts[4] },
                      { label: "Sec", val: parts[5] || "-" }
                    ].map((p, i) => (
                      <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center group hover:bg-white/10 transition-colors">
                         <div className="font-mono text-2xl font-black text-white group-hover:scale-110 transition-transform">{p.val}</div>
                         <div className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-2 opacity-50">{p.label}</div>
                      </div>
                    ))}
                 </div>
               )}
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                 <RefreshCw className="w-3 h-3" /> Industry Standard Presets
              </label>
              <div className="flex flex-wrap gap-2">
                 {preSets.map(preset => (
                   <button 
                     key={preset.val}
                     onClick={() => {
                        setExpression(preset.val)
                        toast.info(`Applied: ${preset.label}`)
                     }}
                     className={cn(
                        "px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                        expression === preset.val 
                          ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                          : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 text-muted-foreground hover:text-white"
                     )}
                   >
                     {preset.label}
                   </button>
                 ))}
              </div>
            </div>
         </div>

         <div className="lg:col-span-5 flex flex-col gap-8">
            <div className="glass-panel p-8 rounded-[2.5rem] bg-[#050505] border border-white/5 shadow-2xl flex-1 flex flex-col">
               <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-primary" /> Execution Schedule</div>
                  <div className="flex gap-1">
                     {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-primary/20" />)}
                  </div>
               </label>

               <div className="space-y-4 flex-1">
                 {nextRuns.length > 0 ? (
                   nextRuns.map((date, idx) => (
                     <div key={idx} className="flex items-center gap-6 bg-white/5 p-5 rounded-[1.5rem] border border-white/5 group hover:bg-white/10 transition-all cursor-default">
                       <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-xs font-black text-primary group-hover:scale-110 transition-transform">
                         {idx + 1}
                       </div>
                       <div className="flex-1 space-y-1">
                         <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                           {date.toLocaleString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                         </div>
                         <div className="font-mono text-2xl font-black text-white/90">
                           {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                         </div>
                       </div>
                       <ArrowRight className="w-5 h-5 text-primary/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                     </div>
                   ))
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-20 py-20">
                      <Clock className="w-20 h-20 mb-6" />
                      <p className="text-[10px] font-black uppercase tracking-[0.4em]">Awaiting Valid Pattern</p>
                   </div>
                 )}
               </div>
            </div>

            <div className="p-6 bg-primary/5 rounded-[1.5rem] border border-primary/10 flex gap-4">
               <div className="p-2 bg-primary/10 rounded-xl h-fit">
                  <Info className="w-4 h-4 text-primary" />
               </div>
               <p className="text-[10px] text-muted-foreground leading-relaxed font-bold uppercase">
                 CRON expressions are processed locally using high-precision parser engines. Supports standard crontab, Quartz (6 fields), and AWS formats.
               </p>
            </div>
         </div>
      </div>
    </ToolLayout>
  )
}
