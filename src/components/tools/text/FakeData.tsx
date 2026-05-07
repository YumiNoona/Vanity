import React, { useState, useEffect, useCallback } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { Download, RefreshCw, Plus, Trash2, Database, FileJson, FileSpreadsheet, Play, Code, Save, Table, Globe, Hash, Monitor } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useDownload } from "@/hooks/useDownload"

type DataType = "id" | "name" | "email" | "address" | "ip" | "date" | "uuid" | "phone" | "company" | "price" | "bool" | "color" | "userAgent" | "paragraph"

interface Column {
  id: string
  name: string
  type: DataType
}

type Locale = "us" | "in"

const GENERATORS: Record<DataType, (locale: Locale) => any> = {
  id: () => Math.floor(Math.random() * 1000000),
  name: (locale) => {
    if (locale === "in") {
      const first = ["Aarav", "Vihaan", "Aditya", "Sai", "Arjun", "Diya", "Isha", "Riya", "Ananya", "Aarohi", "Ishaan", "Advait", "Vivaan", "Kavya"]
      const last = ["Sharma", "Patel", "Singh", "Kumar", "Gupta", "Das", "Jain", "Mehta", "Bose", "Verma", "Reddy", "Nair", "Iyer", "Chaudhary"]
      return `${first[Math.floor(Math.random() * first.length)]} ${last[Math.floor(Math.random() * last.length)]}`
    }
    const first = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan"]
    const last = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson"]
    return `${first[Math.floor(Math.random() * first.length)]} ${last[Math.floor(Math.random() * last.length)]}`
  },
  email: () => {
    const prefixes = ["info", "contact", "hello", "admin", "support", "sales", "hr", "billing", "dev", "team"]
    const domains = ["gmail.com", "yahoo.com", "outlook.com", "company.io", "tech.co", "startup.ai", "enterprise.net"]
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${Math.floor(Math.random() * 999)}@${domains[Math.floor(Math.random() * domains.length)]}`
  },
  address: (locale) => {
    const streets = locale === "in" ? ["MG Road", "Link Road", "Station Road", "Ring Road", "Main Bazar"] : ["Main St", "Oak Ave", "Washington Blvd", "Lakeview Dr", "Sunset Strip"]
    const cities = locale === "in" ? ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Pune", "Chennai"] : ["Springfield", "Riverside", "Georgetown", "Franklin", "Clinton"]
    return `${Math.floor(Math.random() * 9999)} ${streets[Math.floor(Math.random() * streets.length)]}, ${cities[Math.floor(Math.random() * cities.length)]}`
  },
  ip: () => `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
  date: () => new Date(Date.now() - Math.floor(Math.random() * 31536000000)).toISOString().split("T")[0],
  uuid: () => crypto.randomUUID(),
  phone: (locale) => locale === "in" ? `+91 ${Math.floor(Math.random() * 9000000000 + 1000000000)}` : `+1 (${Math.floor(Math.random() * 900 + 100)}) ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
  company: (locale) => {
    const base = ["Reliance", "Tata", "Global", "Quantum", "Apex", "Nova", "Cyber", "Peak"]
    const suffix = ["Systems", "Industries", "Group", "Corp", "Solutions", "Technologies"]
    return `${base[Math.floor(Math.random() * base.length)]} ${suffix[Math.floor(Math.random() * suffix.length)]}`
  },
  price: () => (Math.random() * 5000).toFixed(2),
  bool: () => Math.random() > 0.5,
  color: () => `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
  userAgent: () => {
    const uas = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1"
    ]
    return uas[Math.floor(Math.random() * uas.length)]
  },
  paragraph: () => "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
}

export function FakeData() {
  const [locale, setLocale] = useState<Locale>("us")
  const [tableName, setTableName] = useState("users")
  const [columns, setColumns] = useState<Column[]>([
    { id: "1", name: "id", type: "id" },
    { id: "2", name: "full_name", type: "name" },
    { id: "3", name: "email", type: "email" },
    { id: "4", name: "status", type: "bool" },
  ])
  const [rowCount, setRowCount] = useState(25)
  const [results, setResults] = useState<any[]>([])
  const { download: downloadBlob } = useDownload()

  useEffect(() => {
    const saved = localStorage.getItem("vanity_fake_data_schema")
    if (saved) setColumns(JSON.parse(saved))
  }, [])

  const generateData = useCallback(() => {
    const data = Array.from({ length: rowCount }).map(() => {
      const row: any = {}
      columns.forEach(col => {
        row[col.name] = GENERATORS[col.type](locale)
      })
      return row
    })
    setResults(data)
    toast.success(`Synthesized ${rowCount} unique records`)
  }, [rowCount, columns, locale])

  const exportData = (format: "csv" | "json" | "sql") => {
    if (results.length === 0) return toast.error("Generate records first")
    let content = ""
    if (format === "json") {
      content = JSON.stringify(results, null, 2)
    } else if (format === "csv") {
      const headers = columns.map(c => c.name).join(",")
      const rows = results.map(row => columns.map(col => `"${String(row[col.name]).replace(/"/g, '""')}"`).join(",")).join("\n")
      content = `${headers}\n${rows}`
    } else if (format === "sql") {
      const colNames = columns.map(c => `\`${c.name}\``).join(", ")
      content = results.map(row => {
        const vals = columns.map(col => {
          const val = row[col.name]
          return typeof val === "string" ? `'${val.replace(/'/g, "''")}'` : val
        }).join(", ")
        return `INSERT INTO \`${tableName}\` (${colNames}) VALUES (${vals});`
      }).join("\n")
    }
    downloadBlob(content, `${tableName}_export.${format}`)
    toast.success(`Exported as ${format.toUpperCase()}`)
  }

  return (
    <ToolLayout title="Data Forge" description="Generate enterprise-ready synthetic datasets with localized context and SQL exports." icon={Database} centered maxWidth="max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-black/20 space-y-8">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Architect Schema</label>
              <div className="flex gap-2">
                 <button onClick={() => { localStorage.setItem("vanity_fake_data_schema", JSON.stringify(columns)); toast.success("Schema saved locally"); }} className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground hover:text-emerald-400 transition-all"><Save className="w-4 h-4" /></button>
                 <button onClick={() => setColumns([...columns, { id: Math.random().toString(36).slice(2), name: `col_${columns.length + 1}`, type: "name" }])} className="p-2 bg-primary/20 text-primary rounded-xl hover:scale-110 transition-all"><Plus className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-auto custom-scrollbar pr-2">
               {columns.map((col, idx) => (
                 <div key={col.id} className="flex gap-2 items-center group animate-in slide-in-from-left-2">
                    <input value={col.name} onChange={e => setColumns(columns.map(c => c.id === col.id ? { ...c, name: e.target.value } : c))} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[11px] font-mono outline-none focus:border-primary/50" />
                    <select value={col.type} onChange={e => setColumns(columns.map(c => c.id === col.id ? { ...c, type: e.target.value as DataType } : c))} className="bg-white/5 border border-white/10 rounded-xl px-2 py-2.5 text-[10px] font-mono outline-none focus:border-primary/50">
                      {Object.keys(GENERATORS).map(t => <option key={t} value={t} className="bg-zinc-900">{t}</option>)}
                    </select>
                    <button onClick={() => setColumns(columns.filter(c => c.id !== col.id))} className="p-2 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                 </div>
               ))}
            </div>

            <div className="pt-6 border-t border-white/5 space-y-6">
               <div className="space-y-4">
                  <div className="flex justify-between items-center"><label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Dataset Volume</label><span className="text-sm font-mono text-primary font-black">{rowCount} rows</span></div>
                  <input type="range" min="1" max="1000" value={rowCount} onChange={e => setRowCount(parseInt(e.target.value))} className="w-full accent-primary h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer" />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Locale</label>
                    <select value={locale} onChange={e => setLocale(e.target.value as Locale)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase outline-none focus:border-primary">
                      <option value="us" className="bg-zinc-900">GLOBAL / US</option>
                      <option value="in" className="bg-zinc-900">INDIA / IN</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Table Name</label>
                    <input value={tableName} onChange={e => setTableName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-mono outline-none focus:border-primary" />
                  </div>
               </div>

               <button onClick={generateData} className="w-full py-5 bg-primary text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4">
                  <RefreshCw className="w-5 h-5" /> SYNTHESIZE DATA
               </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
           <div className="glass-panel h-full rounded-[2.5rem] border border-white/5 bg-black/20 flex flex-col overflow-hidden min-h-[650px] shadow-2xl">
              <div className="p-6 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-3"><Table className="w-5 h-5 text-primary" /><span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Synthesized Preview</span></div>
                 <div className="flex gap-2">
                    <button onClick={() => exportData("json")} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10" title="JSON"><FileJson className="w-4 h-4 text-emerald-400" /></button>
                    <button onClick={() => exportData("csv")} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10" title="CSV"><FileSpreadsheet className="w-4 h-4 text-blue-400" /></button>
                    <button onClick={() => exportData("sql")} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10" title="SQL"><Code className="w-4 h-4 text-purple-400" /></button>
                 </div>
              </div>

              <div className="flex-1 overflow-auto custom-scrollbar">
                 {results.length > 0 ? (
                   <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead className="bg-white/[0.03] sticky top-0 z-10 backdrop-blur-md">
                        <tr>{columns.map(c => <th key={c.id} className="p-5 text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b border-white/10">{c.name}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.02]">
                        {results.slice(0, 50).map((row, i) => (
                          <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                            {columns.map(col => (
                              <td key={col.id} className="p-5 font-mono text-[10px] text-white/60 whitespace-nowrap">
                                {col.type === 'color' ? <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border border-white/20" style={{backgroundColor: String(row[col.name])}} /> {String(row[col.name])}</div> : String(row[col.name])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                   </table>
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center opacity-10 space-y-6">
                      <Database className="w-24 h-24" />
                      <p className="text-xs font-black uppercase tracking-[0.5em]">System Idle</p>
                   </div>
                 )}
              </div>
              
              {results.length > 50 && <div className="p-4 bg-primary/5 text-[9px] font-black text-center text-primary/60 uppercase tracking-[0.3em] border-t border-primary/10">Truncated Preview ({results.length} rows total). Export for full dataset.</div>}
           </div>

           <div className="grid grid-cols-3 gap-4">
              <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl text-center space-y-2"><Monitor className="w-4 h-4 mx-auto text-primary" /><span className="text-[9px] font-black uppercase text-white/40 block">Deterministic</span></div>
              <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl text-center space-y-2"><Globe className="w-4 h-4 mx-auto text-emerald-400" /><span className="text-[9px] font-black uppercase text-white/40 block">Localized</span></div>
              <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl text-center space-y-2"><Hash className="w-4 h-4 mx-auto text-sky-400" /><span className="text-[9px] font-black uppercase text-white/40 block">Scalable</span></div>
           </div>
        </div>
      </div>
    </ToolLayout>
  )
}
