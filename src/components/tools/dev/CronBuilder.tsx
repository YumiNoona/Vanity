import React, { useState, useEffect, useMemo } from "react"
import { Calendar, Clock, AlertTriangle, ArrowRight } from "lucide-react"
import { ToolLayout } from "@/components/layout/ToolLayout"

export function CronBuilder() {
  const [expression, setExpression] = useState("*/15 * * * *")
  const [nextRuns, setNextRuns] = useState<Date[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const [description, setDescription] = useState<string | null>(null)

  const parts = useMemo(() => {
    const p = expression.trim().split(/\s+/)
    return p.length >= 5 ? p : []
  }, [expression])

  useEffect(() => {
    if (!expression.trim()) {
      setNextRuns([])
      setError(null)
      return
    }

    const calculateRuns = async () => {
      try {
        const [cronParserModule, cronstrueModule] = await Promise.all([
          import("cron-parser"),
          import("cronstrue")
        ])
        
        const cronParser = (cronParserModule as any).default || cronParserModule
        const cronstrue = (cronstrueModule as any).default || cronstrueModule
        
        // Update description
        try {
          setDescription(cronstrue.toString(expression))
        } catch (e) {
          setDescription(null)
        }

        const interval = cronParser.parseExpression(expression)
        const runs = []
        for (let i = 0; i < 5; i++) {
          runs.push(interval.next().toDate())
        }
        setNextRuns(runs)
        setError(null)
      } catch (e: any) {
        setError("Invalid CRON expression format.")
        setNextRuns([])
      }
    }

    const timer = setTimeout(calculateRuns, 500)
    return () => clearTimeout(timer)
  }, [expression])

  const preSets = [
    { label: "Every 15 mins", val: "*/15 * * * *" },
    { label: "Every hour at 30 mins", val: "30 * * * *" },
    { label: "Every day at midnight", val: "0 0 * * *" },
    { label: "Every Monday at 9AM", val: "0 9 * * 1" },
    { label: "First day of month", val: "0 0 1 * *" },
  ]

  return (
    <ToolLayout title="CRON Expression Tester" description="Validate expressions and visualize the next 5 precision run times." icon={Calendar} maxWidth="max-w-5xl">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-0">
         <div className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl space-y-6">
               <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Expression</label>
               
               <input 
                 value={expression}
                 onChange={(e) => setExpression(e.target.value)}
                 className={`w-full bg-black/40 border border-white/10 rounded-xl p-6 font-mono text-3xl outline-none transition-all ${error ? "border-red-500/50 text-red-200" : "focus:border-amber-500/50 text-amber-100"}`}
                 spellCheck={false}
               />

               {error && (
                 <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 p-3 rounded-lg">
                   <AlertTriangle className="w-4 h-4" /> {error}
                 </div>
               )}

               {description && !error && (
                 <div className="text-sm text-amber-500 font-bold bg-amber-500/5 p-4 rounded-xl border border-amber-500/10 animate-in fade-in slide-in-from-top-2">
                   {description}
                 </div>
               )}

               {!error && parts.length >= 5 && (
                 <div className="grid grid-cols-5 gap-2 text-center pt-2">
                    <div className="bg-white/5 rounded-lg p-2">
                       <div className="font-mono text-xl text-white">{parts[0]}</div>
                       <div className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1">Minute</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                       <div className="font-mono text-xl text-white">{parts[1]}</div>
                       <div className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1">Hour</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                       <div className="font-mono text-xl text-white">{parts[2]}</div>
                       <div className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1">Day(Month)</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                       <div className="font-mono text-xl text-white">{parts[3]}</div>
                       <div className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1">Month</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                       <div className="font-mono text-xl text-white">{parts[4]}</div>
                       <div className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1">Day(Week)</div>
                    </div>
                 </div>
               )}
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-2">Quick Presets</label>
              <div className="flex flex-wrap gap-2">
                 {preSets.map(preset => (
                   <button 
                     key={preset.val}
                     onClick={() => setExpression(preset.val)}
                     className="px-4 py-2 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-amber-500/30 rounded-lg text-sm transition-all"
                   >
                     {preset.label}
                   </button>
                 ))}
              </div>
            </div>
         </div>

         <div className="glass-panel p-6 rounded-2xl">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-6">
               <Clock className="w-4 h-4" /> Next 5 Run Times
            </label>

            <div className="space-y-3">
              {nextRuns.length > 0 ? (
                nextRuns.map((date, idx) => (
                  <div key={idx} className="flex items-center gap-4 bg-black/30 p-4 rounded-xl border border-white/5 group">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-mono text-sm text-white/90">
                        {date.toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                      <div className="font-mono text-xl text-amber-400">
                        {date.toLocaleTimeString()}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))
              ) : (
                <div className="py-20 text-center text-muted-foreground italic">
                   Enter a valid CRON expression to view schedule.
                </div>
              )}
            </div>
         </div>
      </div>
    </ToolLayout>
  )
}
