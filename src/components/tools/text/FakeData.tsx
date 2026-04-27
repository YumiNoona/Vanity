import React, { useState } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { Download, RefreshCw, Plus, Trash2, Database, FileJson, FileSpreadsheet, Play } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type DataType = "name" | "email" | "address" | "ip" | "date" | "uuid" | "phone" | "company"

interface Column {
  id: string
  name: string
  type: DataType
}

const GENERATORS: Record<DataType, () => string> = {
  name: () => {
    const first = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth"]
    const last = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"]
    return `${first[Math.floor(Math.random() * first.length)]} ${last[Math.floor(Math.random() * last.length)]}`
  },
  email: () => {
    const names = ["john", "jane", "alex", "smith", "doe", "user", "admin"]
    const domains = ["gmail.com", "yahoo.com", "outlook.com", "example.com"]
    return `${names[Math.floor(Math.random() * names.length)]}.${Math.floor(Math.random() * 999)}@${domains[Math.floor(Math.random() * domains.length)]}`
  },
  address: () => {
    const streets = ["Main St", "Oak Ave", "Washington Blvd", "Lakeview Dr"]
    return `${Math.floor(Math.random() * 9999)} ${streets[Math.floor(Math.random() * streets.length)]}, Springfield`
  },
  ip: () => `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
  date: () => new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString().split("T")[0],
  uuid: () => crypto.randomUUID(),
  phone: () => `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
  company: () => {
    const names = ["Tech", "Global", "Next", "Quantum", "Apex"]
    const suffixes = ["Solutions", "Corp", "Inc", "Partners", "Systems"]
    return `${names[Math.floor(Math.random() * names.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`
  }
}

export function FakeData() {
  const [columns, setColumns] = useState<Column[]>([
    { id: "1", name: "full_name", type: "name" },
    { id: "2", name: "email_address", type: "email" },
  ])
  const [rowCount, setRowCount] = useState(10)
  const [results, setResults] = useState<any[]>([])

  const addColumn = () => {
    setColumns([...columns, { id: Math.random().toString(36), name: "new_column", type: "name" }])
  }

  const removeColumn = (id: string) => {
    setColumns(columns.filter(c => c.id !== id))
  }

  const updateColumn = (id: string, updates: Partial<Column>) => {
    setColumns(columns.map(c => (c.id === id ? { ...c, ...updates } : c)))
  }

  const generateData = () => {
    const data = Array.from({ length: rowCount }).map(() => {
      const row: any = {}
      columns.forEach(col => {
        row[col.name] = GENERATORS[col.type]()
      })
      return row
    })
    setResults(data)
    toast.success(`Generated ${rowCount} rows`)
  }

  const download = (format: "csv" | "json") => {
    if (results.length === 0) return
    let content = ""
    let type = ""
    let ext = ""

    if (format === "json") {
      content = JSON.stringify(results, null, 2)
      type = "application/json"
      ext = "json"
    } else {
      const headers = columns.map(c => c.name).join(",")
      const rows = results.map(row => columns.map(col => `"${row[col.name]}"`).join(",")).join("\n")
      content = `${headers}\n${rows}`
      type = "text/csv"
      ext = "csv"
    }

    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `fake-data-${Date.now()}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <ToolLayout
      title="Fake Data Generator"
      description="Synthesize realistic datasets for testing and development instantly."
      icon={Database}
      centered={true}
      maxWidth="max-w-6xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Config Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Dataset Schema</label>
                <button onClick={addColumn} className="p-1 hover:text-primary transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {columns.map(col => (
                  <div key={col.id} className="flex gap-2 items-center group">
                    <input
                      type="text"
                      value={col.name}
                      onChange={e => updateColumn(col.id, { name: e.target.value })}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono focus:border-primary/50 outline-none"
                    />
                    <select
                      value={col.type}
                      onChange={e => updateColumn(col.id, { type: e.target.value as DataType })}
                      className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50"
                    >
                      {Object.keys(GENERATORS).map(type => (
                        <option key={type} value={type} className="bg-[#121212]">{type}</option>
                      ))}
                    </select>
                    <button onClick={() => removeColumn(col.id)} className="p-2 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 space-y-4">
               <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Row Count</label>
                  <span className="font-mono text-xs text-primary">{rowCount}</span>
               </div>
               <input 
                  type="range" 
                  min="1" 
                  max="1000" 
                  value={rowCount} 
                  onChange={e => setRowCount(parseInt(e.target.value))}
                  className="w-full accent-primary"
               />
            </div>

            <button
              onClick={generateData}
              className="w-full h-12 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              Generate Dataset
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel rounded-3xl border border-white/5 bg-black/20 overflow-hidden min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between p-4 bg-white/5 border-b border-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Preview</span>
              <div className="flex gap-2">
                <button 
                  disabled={results.length === 0}
                  onClick={() => download("json")}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <FileJson className="w-3 h-3" /> JSON
                </button>
                <button 
                   disabled={results.length === 0}
                   onClick={() => download("csv")}
                   className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-3 h-3" /> CSV
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto custom-scrollbar p-0">
               {results.length > 0 ? (
                 <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-black/40 backdrop-blur-md">
                      <tr>
                        {columns.map(c => (
                          <th key={c.id} className="px-4 py-3 font-bold text-muted-foreground border-b border-white/5">{c.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {results.map((row, i) => (
                         <tr key={i} className="hover:bg-white/[0.02]">
                            {columns.map(col => (
                              <td key={col.id} className="px-4 py-2 font-mono text-white/70">{row[col.name]}</td>
                            ))}
                         </tr>
                       ))}
                    </tbody>
                 </table>
               ) : (
                 <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4 py-20">
                    <Database className="w-12 h-12 opacity-10" />
                    <p className="text-sm">Configure schema and click generate</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
