import React, { useState, useEffect, useCallback } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { Download, RefreshCw, Plus, Trash2, Database, FileJson, FileSpreadsheet, Play, Code, Save, Table } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useDownload } from "@/hooks/useDownload"

type DataType = "id" | "name" | "email" | "address" | "ip" | "date" | "uuid" | "phone" | "company" | "price" | "bool"

interface Column {
  id: string
  name: string
  type: DataType
}

type Locale = "us" | "in"

const GENERATORS: Record<DataType, (locale: Locale) => any> = {
  id: () => Math.floor(Math.random() * 100000),
  name: (locale) => {
    if (locale === "in") {
      const first = ["Aarav", "Vihaan", "Aditya", "Sai", "Arjun", "Diya", "Isha", "Riya", "Ananya", "Aarohi"]
      const last = ["Sharma", "Patel", "Singh", "Kumar", "Gupta", "Das", "Jain", "Mehta", "Bose", "Verma"]
      return `${first[Math.floor(Math.random() * first.length)]} ${last[Math.floor(Math.random() * last.length)]}`
    }
    const first = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth"]
    const last = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"]
    return `${first[Math.floor(Math.random() * first.length)]} ${last[Math.floor(Math.random() * last.length)]}`
  },
  email: () => {
    const names = ["john", "jane", "alex", "smith", "doe", "user", "admin", "dev", "raj", "priya"]
    const domains = ["gmail.com", "yahoo.com", "outlook.com", "example.com", "test.io"]
    return `${names[Math.floor(Math.random() * names.length)]}.${Math.floor(Math.random() * 999)}@${domains[Math.floor(Math.random() * domains.length)]}`
  },
  address: (locale) => {
    if (locale === "in") {
      const streets = ["MG Road", "Link Road", "Station Road", "Ring Road", "Main Bazar"]
      const cities = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Pune", "Jaipur", "Surat"]
      return `${Math.floor(Math.random() * 999)} ${streets[Math.floor(Math.random() * streets.length)]}, ${cities[Math.floor(Math.random() * cities.length)]}`
    }
    const streets = ["Main St", "Oak Ave", "Washington Blvd", "Lakeview Dr", "Sunset Strip"]
    const cities = ["Springfield", "Riverside", "Georgetown", "Franklin", "Clinton"]
    return `${Math.floor(Math.random() * 9999)} ${streets[Math.floor(Math.random() * streets.length)]}, ${cities[Math.floor(Math.random() * cities.length)]}`
  },
  ip: () => `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
  date: () => new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString().split("T")[0],
  uuid: () => crypto.randomUUID(),
  phone: (locale) => {
    if (locale === "in") {
      return `+91 ${Math.floor(Math.random() * 40000 + 60000)}${Math.floor(Math.random() * 90000 + 10000)}`
    }
    return `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`
  },
  company: (locale) => {
    if (locale === "in") {
      const names = ["Reliance", "Tata", "Infosys", "Wipro", "Mahindra", "Aditya Birla", "Godrej"]
      const suffixes = ["Industries", "Consulting", "Technologies", "Group", "Enterprises"]
      return `${names[Math.floor(Math.random() * names.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`
    }
    const names = ["Tech", "Global", "Next", "Quantum", "Apex", "Nova", "Starlight"]
    const suffixes = ["Solutions", "Corp", "Inc", "Partners", "Systems", "Group"]
    return `${names[Math.floor(Math.random() * names.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`
  },
  price: () => (Math.random() * 1000).toFixed(2),
  bool: () => Math.random() > 0.5
}

export function FakeData() {
  const [locale, setLocale] = useState<Locale>("us")
  const [tableName, setTableName] = useState("users")
  const [columns, setColumns] = useState<Column[]>([
    { id: "1", name: "id", type: "id" },
    { id: "2", name: "full_name", type: "name" },
    { id: "3", name: "email", type: "email" },
  ])
  const [rowCount, setRowCount] = useState(10)
  const [results, setResults] = useState<any[]>([])
  const { download: downloadBlob } = useDownload()

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem("vanity_fake_data_schema")
    if (saved) setColumns(JSON.parse(saved))
  }, [])

  const saveSchema = () => {
    localStorage.setItem("vanity_fake_data_schema", JSON.stringify(columns))
    toast.success("Schema saved to local storage")
  }

  const addColumn = () => {
    setColumns([...columns, { id: Math.random().toString(36).slice(2), name: "new_column", type: "name" }])
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
        row[col.name] = GENERATORS[col.type](locale)
      })
      return row
    })
    setResults(data)
    toast.success(`Generated ${rowCount} rows`)
  }

  const exportData = (format: "csv" | "json" | "sql") => {
    if (results.length === 0) {
      toast.error("Generate data first")
      return
    }
    
    let content = ""
    let ext = format

    if (format === "json") {
      content = JSON.stringify(results, null, 2)
    } else if (format === "csv") {
      const headers = columns.map(c => c.name).join(",")
      const rows = results.map(row => columns.map(col => `"${row[col.name]}"`).join(",")).join("\n")
      content = `${headers}\n${rows}`
    } else if (format === "sql") {
      const colNames = columns.map(c => `\`${c.name}\``).join(", ")
      const rows = results.map(row => {
        const vals = columns.map(col => {
          const val = row[col.name]
          return typeof val === "string" ? `'${val.replace(/'/g, "''")}'` : val
        }).join(", ")
        return `INSERT INTO \`${tableName}\` (${colNames}) VALUES (${vals});`
      }).join("\n")
      content = rows
    }

    downloadBlob(content, `${tableName}-${Date.now()}.${ext}`)
  }

  return (
    <ToolLayout
      title="Fake Data Studio"
      description="Professional data synthesis with custom schemas and database-ready exports."
      icon={Database}
      centered={true}
      maxWidth="max-w-7xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20 px-4 sm:px-0">
        {/* Config Sidebar */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-8">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Schema Configuration</label>
              <div className="flex gap-2">
                 <button onClick={saveSchema} className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground hover:text-emerald-400 transition-all" title="Save Schema">
                    <Save className="w-4 h-4" />
                 </button>
                 <button onClick={addColumn} className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all">
                    <Plus className="w-4 h-4" />
                 </button>
              </div>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-auto custom-scrollbar pr-2">
               {columns.map((col, idx) => (
                 <div key={col.id} className="flex gap-2 items-center group animate-in slide-in-from-left-2" style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="w-6 text-[10px] font-mono text-muted-foreground">{idx + 1}.</div>
                    <input 
                      value={col.name} 
                      onChange={e => updateColumn(col.id, { name: e.target.value })}
                      placeholder="Column Name"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-mono outline-none focus:border-primary/50"
                    />
                    <select 
                      value={col.type} 
                      onChange={e => updateColumn(col.id, { type: e.target.value as DataType })}
                      className="bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-xs font-mono outline-none focus:border-primary/50"
                    >
                      {Object.keys(GENERATORS).map(t => <option key={t} value={t} className="bg-zinc-900">{t}</option>)}
                    </select>
                    <button onClick={() => removeColumn(col.id)} className="p-2 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                       <Trash2 className="w-3.5 h-3.5" />
                    </button>
                 </div>
               ))}
            </div>

            <div className="pt-6 border-t border-white/5 space-y-6">
               <div className="space-y-4">
                  <div className="flex justify-between">
                    <label className="text-[10px] font-black uppercase text-muted-foreground">Row Count</label>
                    <span className="text-xs font-mono text-primary font-bold">{rowCount}</span>
                  </div>
                  <input type="range" min="1" max="1000" step="1" value={rowCount} onChange={e => setRowCount(parseInt(e.target.value))} className="w-full accent-primary" />
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-muted-foreground">Table Name (for SQL)</label>
                  <input value={tableName} onChange={e => setTableName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-mono outline-none focus:border-primary/50" />
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-muted-foreground">Locale Context</label>
                  <select 
                    value={locale} 
                    onChange={e => setLocale(e.target.value as Locale)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest outline-none focus:border-primary/50"
                  >
                    <option value="us" className="bg-zinc-900">United States (US)</option>
                    <option value="in" className="bg-zinc-900">India (IN)</option>
                  </select>
               </div>

               <button onClick={generateData} className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                  <Play className="w-5 h-5 fill-current" /> Generate Data
               </button>
            </div>
          </div>
        </div>

        {/* Results Preview */}
        <div className="lg:col-span-7 space-y-6">
           <div className="glass-panel h-full rounded-3xl border border-white/5 bg-black/20 flex flex-col overflow-hidden min-h-[600px]">
              <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <Table className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Preview (Top 20)</span>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => exportData("json")} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all" title="Download JSON">
                       <FileJson className="w-4 h-4" />
                    </button>
                    <button onClick={() => exportData("csv")} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all" title="Download CSV">
                       <FileSpreadsheet className="w-4 h-4" />
                    </button>
                    <button onClick={() => exportData("sql")} className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-all" title="Download SQL">
                       <Code className="w-4 h-4" />
                    </button>
                 </div>
              </div>

              <div className="flex-1 overflow-auto custom-scrollbar">
                 {results.length > 0 ? (
                   <table className="w-full text-left border-collapse">
                      <thead className="bg-white/5 sticky top-0 z-10">
                        <tr>
                          {columns.map(c => (
                            <th key={c.id} className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-white/10">
                               {c.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.03]">
                        {results.slice(0, 20).map((row, i) => (
                          <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                            {columns.map(col => (
                              <td key={col.id} className="p-4 font-mono text-xs text-white/80 whitespace-nowrap">
                                {String(row[col.name])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                   </table>
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center opacity-20 italic text-sm space-y-4">
                      <Database className="w-16 h-16" />
                      <p>Click "Generate Data" to populate the table</p>
                   </div>
                 )}
              </div>
              
              {results.length > 20 && (
                <div className="p-3 bg-white/5 text-[9px] font-bold text-center text-muted-foreground uppercase tracking-widest border-t border-white/5">
                   Showing top 20 of {results.length} rows. Download to see full dataset.
                </div>
              )}
           </div>
        </div>
      </div>
    </ToolLayout>
  )
}
