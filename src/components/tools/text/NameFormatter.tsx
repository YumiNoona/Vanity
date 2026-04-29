import React, { useState } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { Type, Copy, CheckCircle, ListRestart, Download, Scissors } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"
import { useDownload } from "@/hooks/useDownload"

export function NameFormatter() {
  const [input, setInput] = useState("JOHN DOE\njane smith-jones\nmcdonald o'grady\nWILLIAM III")
  const [output, setOutput] = useState("")
  const { isCopied: copied, copy } = useCopyToClipboard()
  const { download } = useDownload()

  const formatName = (name: string) => {
    return name
      .toLowerCase()
      .split(" ")
      .map(part => {
        // Handle Mc/Mac
        if (part.startsWith("mc") && part.length > 2) {
          return "Mc" + part[2].toUpperCase() + part.slice(3)
        }
        if (part.startsWith("mac") && part.length > 3) {
          return "Mac" + part[3].toUpperCase() + part.slice(4)
        }

        // Handle Hyphens
        if (part.includes("-")) {
          return part.split("-").map(sub => sub.charAt(0).toUpperCase() + sub.slice(1)).join("-")
        }

        // Handle Apostrophes (O'Grady)
        if (part.includes("'")) {
          return part.split("'").map(sub => sub.charAt(0).toUpperCase() + sub.slice(1)).join("'")
        }

        // Handle Suffixes (II, III, IV, JR, SR)
        const suffixes = ["ii", "iii", "iv", "jr", "sr"]
        if (suffixes.includes(part)) {
          return part.toUpperCase()
        }

        return part.charAt(0).toUpperCase() + part.slice(1)
      })
      .join(" ")
  }

  const process = () => {
    const lines = input.split("\n")
    const formatted = lines
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(formatName)
      .join("\n")
    setOutput(formatted)
    toast.success("Names formatted!")
  }

  const handleCopy = () => {
    copy(output)
    toast.success("Copied to clipboard")
  }

  const handleDownload = () => {
    download(output, "formatted-names.txt")
  }

  return (
    <ToolLayout
      title="Name Case Formatter"
      description="Bulk-fix capitalization in lists of names, including support for Mc/Mac prefixes and suffixes."
      icon={Type}
      centered={true}
      maxWidth="max-w-6xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="space-y-4 flex flex-col">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Original List</label>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 min-h-[400px] w-full bg-black/40 border border-white/10 rounded-2xl p-6 font-mono text-sm text-white/80 focus:border-primary/50 outline-none resize-none transition-all"
            placeholder="One name per line..."
          />
          <button
            onClick={process}
            className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
          >
            <ListRestart className="w-4 h-4" />
            Format All Names
          </button>
        </div>

        <div className="space-y-4 flex flex-col">
          <div className="flex items-center justify-between h-[15px]">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Formatted Output</label>
            {output && (
              <div className="flex gap-2">
                <button onClick={handleCopy} className="p-1.5 hover:text-white transition-colors">
                  {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button onClick={handleDownload} className="p-1.5 hover:text-white transition-colors">
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
          <pre className="flex-1 min-h-[400px] w-full bg-black/20 border border-white/5 rounded-2xl p-6 overflow-auto font-mono text-sm text-primary/90">
            {output || <span className="text-muted-foreground italic">Click format to see results...</span>}
          </pre>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-black/20 mt-8">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
           <Scissors className="w-3 h-3" /> Intelligent Casing
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Unlike simple title-casing, our algorithm correctly identifies Irish and Scottish prefixes (Mc/Mac), hyphenated last names, and Roman numeral suffixes (II, III, etc.).
        </p>
      </div>
    </ToolLayout>
  )
}
