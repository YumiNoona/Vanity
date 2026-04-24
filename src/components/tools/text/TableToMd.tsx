import React, { useState, useEffect } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { Table, Copy, CheckCircle, Download, FileCode, ArrowLeftRight, Braces, ClipboardList } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { PillToggle } from "@/components/shared/PillToggle"

export function TableToMd() {
  const [input, setInput] = useState("Name\tRole\tDepartment\nJohn Doe\tDesigner\tCreative\nJane Smith\tEngineer\tProduct")
  const [output, setOutput] = useState("")
  const [format, setFormat] = useState<"markdown" | "html">("markdown")
  const [copied, setCopied] = useState(false)

  const convert = () => {
    if (!input.trim()) {
      setOutput("")
      return
    }

    const lines = input.split("\n").map(l => l.trim()).filter(l => l.length > 0)
    if (lines.length === 0) return

    const data = lines.map(line => {
      if (line.includes("\t")) return line.split("\t")
      if (line.includes(",")) return line.split(",").map(s => s.trim().replace(/^"|"$/g, ""))
      return [line]
    })

    const headers = data[0]
    const rows = data.slice(1)

    if (format === "markdown") {
      const mdHeaders = `| ${headers.join(" | ")} |`
      const mdSeparator = `| ${headers.map(() => "---").join(" | ")} |`
      const mdRows = rows.map(row => `| ${row.join(" | ")} |`).join("\n")
      setOutput(`${mdHeaders}\n${mdSeparator}\n${mdRows}`)
    } else {
      const htmlHeaders = headers.map(h => `    <th>${h}</th>`).join("\n")
      const htmlRows = rows.map(row => {
        const cells = row.map(c => `    <td>${c}</td>`).join("\n")
        return `  <tr>\n${cells}\n  </tr>`
      }).join("\n")
      setOutput(`<table>\n  <thead>\n  <tr>\n${htmlHeaders}\n  </tr>\n  </thead>\n  <tbody>\n${htmlRows}\n  </tbody>\n</table>`)
    }
  }

  useEffect(() => {
    convert()
  }, [input, format])

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Copied to clipboard")
  }

  return (
    <ToolLayout
      title="Table to Markdown / HTML"
      description="Convert spreadsheet selections, TSV, or CSV into perfectly formatted Markdown or HTML tables."
      icon={Table}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="space-y-4 flex flex-col">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Input (TSV/CSV/Excel)</label>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 min-h-[400px] w-full bg-black/40 border border-white/10 rounded-2xl p-6 font-mono text-sm text-white/80 focus:border-primary/50 outline-none resize-none transition-all"
            placeholder="Paste cells from Excel or CSV here..."
          />
        </div>

        <div className="space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <PillToggle
              activeId={format}
              onChange={(id) => setFormat(id as any)}
              options={[
                { id: "markdown", label: "Markdown" },
                { id: "html", label: "HTML" }
              ]}
            />
            {output && (
              <button onClick={handleCopy} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all text-muted-foreground hover:text-white">
                {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>
          <pre className="flex-1 min-h-[400px] w-full bg-black/20 border border-white/5 rounded-2xl p-6 overflow-auto font-mono text-sm text-primary/90">
            {output || <span className="text-muted-foreground italic">Paste data to see result...</span>}
          </pre>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-black/20 mt-8">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
           <ClipboardList className="w-3 h-3" /> Designer Tip
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          You can copy directly from Excel, Google Sheets, or Numbers and paste it here. The tool automatically detects tabs or commas and generates the correct syntax for your documentation.
        </p>
      </div>
    </ToolLayout>
  )
}
