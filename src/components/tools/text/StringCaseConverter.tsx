import React, { useState } from "react"
import { Type, Copy, CheckCircle, Trash2 } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"

export function StringCaseConverter() {
  const [input, setInput] = useState("hello world, make this camelCase")
  const [copied, setCopied] = useState<string | null>(null)

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  // Tokenization split logic (handles space, snake, kebab, camel splitting)
  const tokenize = (str: string): string[] => {
    if (!str.trim()) return []
    // Replace non-alphanumeric with space, split on camelCase boundaries, then split by whitespace
    const normalized = str
      .replace(/([a-z])([A-Z])/g, "$1 $2") // camelCase to spaces
      .replace(/_/g, " ") // snake to space
      .replace(/-/g, " ") // kebab to space
      .replace(/[^\w\s]/g, "") // remove punctuation
      .trim()
    return normalized.split(/\s+/)
  }

  const tokens = tokenize(input)

  const cases = [
    {
      id: "camel",
      name: "camelCase",
      value: tokens.map((t, i) => i === 0 ? t.toLowerCase() : t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).join("")
    },
    {
      id: "pascal",
      name: "PascalCase",
      value: tokens.map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).join("")
    },
    {
      id: "snake",
      name: "snake_case",
      value: tokens.map(t => t.toLowerCase()).join("_")
    },
    {
      id: "kebab",
      name: "kebab-case",
      value: tokens.map(t => t.toLowerCase()).join("-")
    },
    {
      id: "screaming",
      name: "SCREAMING_SNAKE_CASE",
      value: tokens.map(t => t.toUpperCase()).join("_")
    },
    {
      id: "title",
      name: "Title Case",
      value: tokens.map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).join(" ")
    },
    {
      id: "lower",
      name: "lowercase",
      value: tokens.map(t => t.toLowerCase()).join(" ")
    },
    {
      id: "upper",
      name: "UPPERCASE",
      value: tokens.map(t => t.toUpperCase()).join(" ")
    }
  ]

  return (
    <ToolLayout title="String Case Converter" description="Convert text to camelCase, snake_case, PascalCase, and more simultaneously." icon={Type}>

      <div className="glass-panel p-6 sm:p-8 rounded-2xl mx-4 sm:mx-0 space-y-8">
         <div className="space-y-4">
            <div className="flex items-center justify-between">
               <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Original String</label>
               <button 
                  onClick={() => setInput("")}
                  className="p-1.5 hover:bg-white/10 rounded-md text-muted-foreground hover:text-white transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
            </div>
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 font-mono text-sm resize-y min-h-[100px] outline-none focus:border-indigo-500/50 transition-colors text-white"
              placeholder="Type or paste your text here..."
              spellCheck={false}
            />
         </div>

         <div className="space-y-4 pt-6 border-t border-white/5">
            <label className="text-xs font-bold uppercase tracking-widest text-indigo-400">Converted Formats</label>
            <div className="grid gap-4">
              {cases.map(c => (
                <div key={c.id} className="group relative flex flex-col sm:flex-row items-stretch sm:items-center bg-black/30 border border-white/5 hover:border-indigo-500/30 rounded-xl overflow-hidden transition-colors">
                   <div className="w-full sm:w-64 p-4 bg-white/[0.02] border-b sm:border-b-0 sm:border-r border-white/5 flex items-center justify-between sm:justify-start shrink-0">
                     <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{c.name}</span>
                   </div>
                   <div className="flex-1 p-4 font-mono text-white break-all overflow-x-auto whitespace-nowrap custom-scrollbar">
                     {c.value || <span className="opacity-30">...</span>}
                   </div>
                   <button 
                      onClick={() => handleCopy(c.value, c.id)}
                      className="absolute top-2 right-2 sm:static sm:mr-2 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                   >
                     {copied === c.id ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                   </button>
                </div>
              ))}
            </div>
         </div>
      </div>
    </ToolLayout>
  )
}
