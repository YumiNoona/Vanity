import React, { useState } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { Database, Copy, CheckCircle, Info, Trash2 } from "lucide-react"
import { toast } from "sonner"

export function SqlFormatter() {
  const [input, setInput] = useState("")

  const formatSql = (sql: string) => {
    // Simple heuristic formatter for SQL
    const keywords = ["SELECT", "FROM", "WHERE", "AND", "OR", "GROUP BY", "ORDER BY", "INSERT INTO", "UPDATE", "DELETE", "JOIN", "LEFT JOIN", "RIGHT JOIN", "ON", "LIMIT", "VALUES"]
    let formatted = sql
    
    // Uppercase keywords
    keywords.forEach(k => {
      const regex = new RegExp(`\\b${k}\\b`, "gi")
      formatted = formatted.replace(regex, k)
    })

    // Add newlines before major keywords
    const majorKeywords = ["SELECT", "FROM", "WHERE", "GROUP BY", "ORDER BY", "INSERT INTO", "UPDATE", "DELETE", "JOIN"]
    majorKeywords.forEach(k => {
      const regex = new RegExp(`\\s+${k}\\b`, "g")
      formatted = formatted.replace(regex, `\n${k}`)
    })

    // Add indentation for AND/OR
    formatted = formatted.replace(/\s+AND\b/g, "\n  AND")
    formatted = formatted.replace(/\s+OR\b/g, "\n  OR")

    return formatted.trim()
  }

  const handleFormat = () => {
    if (!input.trim()) return
    setInput(formatSql(input))
    toast.success("SQL formatted!")
  }

  const handleMinify = () => {
    const minified = input.replace(/\s+/g, " ").trim()
    setInput(minified)
    toast.success("SQL compressed!")
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(input)
    toast.success("Copied to clipboard")
  }

  return (
    <ToolLayout
      title="SQL Formatter"
      description="Prettify and indent raw SQL queries with keyword casing enhancement."
      icon={Database}
    >
      <div className="space-y-6">
        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 space-y-4">
           <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">SQL Query</label>
              <button onClick={() => setInput("")} className="text-red-400 hover:text-red-300 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
           </div>
           <textarea 
             value={input}
             onChange={e => setInput(e.target.value)}
             className="w-full h-80 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-mono focus:border-primary/50 outline-none transition-all resize-none"
             placeholder="SELECT * FROM users WHERE id = 1 AND active = true"
           />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <button 
             onClick={handleFormat}
             className="py-4 bg-primary text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
           >
             Format SQL
           </button>
           <button 
             onClick={handleMinify}
             className="py-4 bg-white/10 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-white/20 hover:scale-[1.02] active:scale-95 transition-all"
           >
             Minify SQL
           </button>
           <button 
             onClick={copyToClipboard}
             className="py-4 bg-white/10 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-white/20 hover:scale-[1.02] active:scale-95 transition-all"
           >
             <Copy className="w-4 h-4" /> Copy Result
           </button>
        </div>

        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4">
           <Info className="w-5 h-5 text-primary shrink-0" />
           <p className="text-sm text-muted-foreground leading-relaxed">
             This is a heuristic formatter designed for quick readability. It handles keyword casing and basic indentation for most common SQL dialects.
           </p>
        </div>
      </div>
    </ToolLayout>
  )
}
