import React, { useState, useCallback } from "react"
import { ArrowLeft, Copy, CheckCircle, ArrowLeftRight, Trash2, FileSpreadsheet, Download, RefreshCw } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useObjectUrl } from "@/hooks/useObjectUrl"

export function CsvJsonConverter() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [mode, setMode] = useState<"csv-to-json" | "json-to-csv">("csv-to-json")
  const [copied, setCopied] = useState(false)
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()

  const csvToJson = (csv: string) => {
    const lines = csv.trim().split("\n")
    if (lines.length < 2) return "[]"
    
    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""))
    const result = lines.slice(1).map(line => {
      const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""))
      const obj: any = {}
      headers.forEach((header, i) => {
        obj[header] = values[i] || ""
      })
      return obj
    })
    return JSON.stringify(result, null, 2)
  }

  const jsonToCsv = (jsonStr: string) => {
    try {
      const json = JSON.parse(jsonStr)
      if (!Array.isArray(json) || json.length === 0) return ""
      
      const headers = Object.keys(json[0])
      const csv = [
        headers.join(","),
        ...json.map(row => headers.map(header => {
          const val = row[header] === null || row[header] === undefined ? "" : row[header]
          const stringVal = String(val)
          return stringVal.includes(",") ? `"${stringVal}"` : stringVal
        }).join(","))
      ].join("\n")
      return csv
    } catch (e) {
      return "Error: Invalid JSON array"
    }
  }

  const handleProcess = useCallback(() => {
    if (!input.trim()) {
      setOutput("")
      return
    }

    if (mode === "csv-to-json") {
      const result = csvToJson(input)
      setOutput(result)
      setResultUrl(new Blob([result], { type: "application/json" }))
      toast.success("Converted to JSON!")
    } else {
      const result = jsonToCsv(input)
      setOutput(result)
      setResultUrl(new Blob([result], { type: "text/csv" }))
      toast.success("Converted to CSV!")
    }
  }, [input, mode, setResultUrl])

  const handleCopy = () => {
    if (!output) return
    navigator.clipboard.writeText(output)
    setCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!resultUrl) return
    const a = document.createElement("a")
    a.href = resultUrl
    a.download = `converted-${Date.now()}.${mode === "csv-to-json" ? "json" : "csv"}`
    a.click()
  }

  const toggleMode = () => {
    setMode(prev => prev === "csv-to-json" ? "json-to-csv" : "csv-to-json")
    if (output && !output.startsWith("Error")) {
        setInput(output)
        setOutput("")
        clearResultUrl()
    }
  }

  const handleBack = () => {
    window.history.back()
  }

  return (
    <ToolLayout 
      title="Data Converter" 
      description="Switch between CSV and JSON formats effortlessly." 
      icon={FileSpreadsheet} 
      onBack={handleBack} 
      backLabel="Back" 
      maxWidth="max-w-6xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 sm:px-0 pb-12">
        {/* Input Area */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              {mode === "csv-to-json" ? "CSV Content" : "JSON Content"}
            </label>
            <button 
              onClick={() => { setInput(""); setOutput(""); }}
              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-md text-muted-foreground hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === "csv-to-json" ? "Header1,Header2\nValue1,Value2" : '[{"id": 1, "name": "Tool"}]'}
            className="w-full h-96 bg-black/40 border border-white/10 rounded-xl p-6 font-mono text-sm resize-none outline-none focus:border-green-500/30 transition-all text-white/90"
          />
          <div className="flex gap-4">
            <button 
                onClick={handleProcess}
                className="flex-1 py-4 bg-green-500 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
                Preview Results
            </button>
          </div>
        </div>

        {/* Action Column */}
        <div className="lg:col-span-12 xl:col-span-2 flex flex-col items-center justify-center gap-4">
            <button 
                onClick={toggleMode}
                className="p-4 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:scale-110 active:scale-90 transition-all group"
                title="Swap Direction"
            >
                <RefreshCw className="w-6 h-6 text-green-500 group-hover:rotate-180 transition-transform duration-500" />
            </button>
            <div className="hidden xl:block h-32 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
            <div className="xl:hidden flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <ArrowLeftRight className="w-3 h-3" />
                {mode === "csv-to-json" ? "CSV TO JSON" : "JSON TO CSV"}
            </div>
        </div>

        {/* Output Area */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
               {mode === "csv-to-json" ? "JSON Export" : "CSV Export"}
            </label>
            <div className="flex gap-2">
                <button 
                onClick={handleCopy}
                disabled={!output || output.startsWith("Error")}
                className="px-4 py-2 bg-white/5 border border-white/10 text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-white/10 disabled:opacity-30 transition-all font-syne"
                >
                {copied ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                Copy
                </button>
                <button 
                onClick={handleDownload}
                disabled={!output || output.startsWith("Error")}
                className="px-4 py-2 bg-green-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-green-600 disabled:opacity-30 transition-all font-syne"
                >
                <Download className="w-3 h-3" /> Download
                </button>
            </div>
          </div>
          <textarea 
            readOnly
            value={output}
            className={cn(
              "w-full h-96 bg-black/20 border border-white/10 rounded-xl p-6 font-mono text-sm resize-none outline-none overflow-auto text-white/90",
              output.startsWith("Error") && "text-red-400 border-red-500/20"
            )}
          />
        </div>
      </div>
    </ToolLayout>
  )
}
