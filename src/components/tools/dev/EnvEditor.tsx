import React, { useState, useRef } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { DropZone } from "@/components/shared/DropZone"
import { Plus, Trash2, Download, RefreshCw, FileCode, Search, Save } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface EnvRow {
  id: string
  key: string
  value: string
  comment?: string
}

export function EnvEditor() {
  const [rows, setRows] = useState<EnvRow[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [fileName, setFileName] = useState(".env")

  const handleDrop = async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setFileName(file.name)

    const text = await file.text()
    const parsedRows: EnvRow[] = text
      .split("\n")
      .map((line, index) => {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith("#")) {
          return { id: Math.random().toString(36), key: "", value: "", comment: trimmed }
        }
        const [key, ...rest] = trimmed.split("=")
        return {
          id: Math.random().toString(36),
          key: key.trim(),
          value: rest.join("=").trim(),
        }
      })
      .filter(row => row.key || row.comment)

    setRows(parsedRows)
    toast.success("File parsed successfully")
  }

  const addRow = () => {
    setRows([...rows, { id: Math.random().toString(36), key: "", value: "" }])
  }

  const removeRow = (id: string) => {
    setRows(rows.filter(r => r.id !== id))
  }

  const updateRow = (id: string, updates: Partial<EnvRow>) => {
    setRows(rows.map(r => (r.id === id ? { ...r, ...updates } : r)))
  }

  const downloadFile = () => {
    const content = rows
      .map(r => {
        if (r.comment) return r.comment
        return `${r.key}=${r.value}`
      })
      .join("\n")

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
    toast.success("File downloaded")
  }

  const filteredRows = rows.filter(
    r => r.key.toLowerCase().includes(searchTerm.toLowerCase()) || 
         r.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
         r.comment?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <ToolLayout
      title="ENV File Editor"
      description="Securely edit environment variables locally in your browser."
      icon={FileCode}
    >
      <div className="space-y-6">
        {rows.length === 0 ? (
          <DropZone onDrop={handleDrop} accept={{ "text/plain": [".env"] }} label="Drop your .env file here" />
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between glass-panel p-4 rounded-2xl border-white/5 bg-black/20">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search variables..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button
                  onClick={addRow}
                  className="flex-1 md:flex-none px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Row
                </button>
                <button
                  onClick={() => { setRows([]); setFileName(".env"); }}
                  className="flex-1 md:flex-none px-4 py-2 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/50 rounded-xl text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-red-400 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Reset
                </button>
              </div>
            </div>

            <div className="glass-panel rounded-3xl border border-white/5 bg-black/20 overflow-hidden shadow-2xl">
              <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-black/40 backdrop-blur-md z-10">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-white/5">Key</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-white/5">Value</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-white/5 w-16 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredRows.map(row => (
                      <tr key={row.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-2">
                          {row.comment ? (
                             <input
                             type="text"
                             value={row.comment}
                             onChange={e => updateRow(row.id, { comment: e.target.value })}
                             className="w-full bg-transparent border-none text-muted-foreground text-xs italic font-mono focus:ring-0"
                             placeholder="# Comment..."
                           />
                          ) : (
                            <input
                              type="text"
                              value={row.key}
                              onChange={e => updateRow(row.id, { key: e.target.value })}
                              className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/30 transition-all"
                              placeholder="VARIABLE_NAME"
                            />
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {!row.comment && (
                            <input
                              type="text"
                              value={row.value}
                              onChange={e => updateRow(row.id, { value: e.target.value })}
                              className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/30 transition-all"
                              placeholder="value"
                            />
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => removeRow(row.id)}
                            className="p-2 text-muted-foreground hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              onClick={downloadFile}
              className="w-full h-14 bg-primary text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <Download className="w-5 h-5" />
              Download {fileName}
            </button>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
