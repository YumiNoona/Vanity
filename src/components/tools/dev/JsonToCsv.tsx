import React, { useState } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { FileSpreadsheet, Download, Copy, CheckCircle, Info, Upload, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { downloadBlob } from "@/lib/canvas"

export function JsonToCsv() {
  const [jsonInput, setJsonInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const convertToCsv = (objArray: any[]) => {
    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray
    let str = ''
    const headers = Object.keys(array[0])
    str += headers.join(',') + '\r\n'

    for (let i = 0; i < array.length; i++) {
      let line = ''
      for (const index in headers) {
        if (line !== '') line += ','
        const value = array[i][headers[index]]
        // Handle strings with commas
        const formatted = typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        line += formatted
      }
      str += line + '\r\n'
    }
    return str
  }

  const handleConvert = () => {
    if (!jsonInput.trim()) return
    setIsProcessing(true)
    try {
      const parsed = JSON.parse(jsonInput)
      if (!Array.isArray(parsed)) {
        throw new Error("Input must be a JSON array of objects")
      }
      const csv = convertToCsv(parsed)
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      downloadBlob(blob, "converted.csv")
      toast.success("JSON converted to CSV successfully!")
    } catch (error: any) {
      toast.error(error.message || "Invalid JSON format")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setJsonInput(ev.target?.result as string)
    }
    reader.readAsText(file)
  }

  return (
    <ToolLayout
      title="JSON to CSV / Excel"
      description="Convert JSON arrays into CSV format for easy import into Excel or Google Sheets."
      icon={FileSpreadsheet}
    >
      <div className="space-y-6">
        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 space-y-4">
           <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">JSON Input (Array of Objects)</label>
              <div className="flex gap-2">
                <label className="cursor-pointer px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2">
                   <Upload className="w-3 h-3" /> Upload File
                   <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>
                <button onClick={() => setJsonInput("")} className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2">
                   <Trash2 className="w-3 h-3" /> Clear
                </button>
              </div>
           </div>
           <textarea 
             value={jsonInput}
             onChange={e => setJsonInput(e.target.value)}
             className="w-full h-64 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-mono focus:border-primary/50 outline-none transition-all resize-none"
             placeholder='[{"name": "John", "age": 30}, {"name": "Jane", "age": 25}]'
           />
        </div>

        <button 
          onClick={handleConvert}
          disabled={!jsonInput.trim() || isProcessing}
          className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-xl shadow-primary/20"
        >
          {isProcessing ? <Download className="w-5 h-5 animate-bounce" /> : <FileSpreadsheet className="w-5 h-5" />}
          Convert & Download CSV
        </button>

        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4">
           <Info className="w-5 h-5 text-primary shrink-0" />
           <p className="text-sm text-muted-foreground leading-relaxed">
             The converter expects a flat array of JSON objects. Nested objects will be stringified within their cells. All processing is strictly local.
           </p>
        </div>
      </div>
    </ToolLayout>
  )
}
