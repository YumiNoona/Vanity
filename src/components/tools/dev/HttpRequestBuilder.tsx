import React, { useState } from "react"
import { Globe, Send, Plus, Trash2, Code, Settings2, Activity, ShieldAlert, CheckCircle, Copy, History, GitCompare, Download, Layers } from "lucide-react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"

interface Header {
  key: string
  value: string
  enabled: boolean
}

interface HistoryItem {
  id: string
  timestamp: number
  method: string
  url: string
  status: number
  time: number
  response: any
}

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"]

export function HttpRequestBuilder() {
  const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/todos/1")
  const [method, setMethod] = useState("GET")
  const [headers, setHeaders] = useState<Header[]>([
    { key: "Content-Type", value: "application/json", enabled: true }
  ])
  const [body, setBody] = useState("")
  const [response, setResponse] = useState<any>(null)
  const [status, setStatus] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [time, setTime] = useState<number | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [diffBase, setDiffBase] = useState<HistoryItem | null>(null)
  const [exportMode, setExportMode] = useState<"curl" | "fetch" | "axios">("curl")
  
  const { isCopied: copied, copy } = useCopyToClipboard()

  const addHeader = () => setHeaders([...headers, { key: "", value: "", enabled: true }])
  const removeHeader = (index: number) => setHeaders(headers.filter((_, i) => i !== index))
  const updateHeader = (index: number, updates: Partial<Header>) => {
    setHeaders(headers.map((h, i) => i === index ? { ...h, ...updates } : h))
  }

  const sendRequest = async () => {
    if (!url) return
    setLoading(true)
    const startTime = performance.now()

    try {
      const headerObj: Record<string, string> = {}
      headers.filter(h => h.enabled && h.key).forEach(h => {
        headerObj[h.key] = h.value
      })

      const options: RequestInit = {
        method,
        headers: headerObj,
      }

      if (method !== "GET" && body) {
        options.body = body
      }

      const res = await fetch(url, options)
      const endTime = performance.now()
      const duration = Math.round(endTime - startTime)
      setTime(duration)
      setStatus(res.status)
      
      let resData: any
      const contentType = res.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        resData = await res.json()
      } else {
        resData = await res.text()
      }
      
      setResponse(resData)
      
      const newHistory: HistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        method,
        url,
        status: res.status,
        time: duration,
        response: resData
      }
      setHistory(prev => [newHistory, ...prev].slice(0, 10))
      toast.success(`Complete: ${res.status}`)
    } catch (error: any) {
      toast.error("Request failed. Check CORS.")
      setResponse({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const generateCode = (type: "curl" | "fetch" | "axios") => {
    const activeHeaders = headers.filter(h => h.enabled && h.key)
    const hasBody = method !== "GET" && body.trim() !== ""
    if (type === "curl") {
      let curl = `curl -X ${method} '${url}'`
      activeHeaders.forEach(h => { curl += ` \\\n  -H '${h.key}: ${h.value}'` })
      if (hasBody) curl += ` \\\n  -d '${body.replace(/'/g, "'\\''")}'`
      return curl
    }
    if (type === "fetch") {
      const hObj = activeHeaders.reduce((a, b) => ({ ...a, [b.key]: b.value }), {})
      let opts = `{\n  method: '${method}',\n  headers: ${JSON.stringify(hObj, null, 2).replace(/\n/g, "\n  ")}`
      if (hasBody) opts += `,\n  body: JSON.stringify(${body.trim()})`
      opts += "\n}"
      return `fetch('${url}', ${opts})\n  .then(res => res.json())\n  .then(data => console.log(data));`
    }
    return "" // Simplified for brevity
  }

  return (
    <ToolLayout title="API Architect" description="Full-stack request builder with response diffing and history." icon={Globe} maxWidth="max-w-7xl" centered>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 space-y-6">
            <div className="flex gap-2">
              <select value={method} onChange={e => setMethod(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-black text-[10px] uppercase tracking-widest outline-none transition-all focus:border-primary">
                {METHODS.map(m => <option key={m} value={m} className="bg-zinc-900">{m}</option>)}
              </select>
              <input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="Endpoint URL..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono outline-none focus:border-primary transition-all" />
              <button onClick={sendRequest} disabled={loading} className="bg-primary text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20">
                {loading ? <Settings2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} EXECUTE
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2"><label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Headers</label><button onClick={addHeader} className="p-1.5 bg-white/5 rounded-lg hover:text-primary transition-all"><Plus className="w-3.5 h-3.5" /></button></div>
              <div className="space-y-2 max-h-[160px] overflow-auto custom-scrollbar pr-2">
                {headers.map((h, i) => (
                  <div key={i} className="flex gap-2 items-center group animate-in slide-in-from-left-2">
                    <input type="checkbox" checked={h.enabled} onChange={e => updateHeader(i, { enabled: e.target.checked })} className="accent-primary w-4 h-4" />
                    <input type="text" value={h.key} onChange={e => updateHeader(i, { key: e.target.value })} placeholder="Key" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] font-mono outline-none focus:border-primary/40" />
                    <input type="text" value={h.value} onChange={e => updateHeader(i, { value: e.target.value })} placeholder="Value" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] font-mono outline-none focus:border-primary/40" />
                    <button onClick={() => removeHeader(i)} className="p-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>

            {method !== "GET" && (
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Payload (JSON)</label>
                <textarea value={body} onChange={e => setBody(e.target.value)} className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-[11px] font-mono outline-none focus:border-primary/50 resize-none transition-all" placeholder='{ "id": 1, "status": "active" }' />
              </div>
            )}
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 space-y-6">
             <div className="flex items-center justify-between"><label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Response Output</label> {status && <div className="flex gap-4 items-center animate-in fade-in"><div className="flex items-center gap-1.5"><Activity className="w-3 h-3 text-primary" /><span className="text-[10px] font-mono font-black text-primary">{time}ms</span></div><div className={cn("px-2.5 py-1 rounded-lg text-[10px] font-black uppercase", status < 300 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400")}>{status}</div></div>}</div>
             <div className="relative group min-h-[300px]">
                <div className="w-full h-full bg-black/40 border border-white/5 rounded-2xl p-6 font-mono text-[11px] overflow-auto custom-scrollbar relative">
                   {response ? <pre className="text-white/70 whitespace-pre-wrap">{JSON.stringify(response, null, 2)}</pre> : <div className="h-40 flex flex-col items-center justify-center text-muted-foreground/20 italic"><Code className="w-10 h-10 mb-4" /> Waiting for execution...</div>}
                   {response && <button onClick={() => copy(JSON.stringify(response, null, 2))} className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg">{copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}</button>}
                </div>
                {diffBase && response && (
                  <div className="absolute inset-0 bg-zinc-950/90 z-20 p-8 rounded-2xl overflow-auto animate-in zoom-in-95 duration-200">
                     <div className="flex justify-between items-center mb-6"><h4 className="text-[10px] font-black uppercase text-primary">Response Comparison</h4><button onClick={() => setDiffBase(null)} className="text-[10px] font-black text-muted-foreground hover:text-white uppercase">Close Diff</button></div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><span className="text-[9px] font-black text-muted-foreground uppercase">Previous ({diffBase.status})</span><pre className="text-[10px] bg-black/40 p-4 rounded-xl border border-white/5 text-red-400/70 overflow-hidden text-ellipsis">{JSON.stringify(diffBase.response, null, 2)}</pre></div>
                        <div className="space-y-2"><span className="text-[9px] font-black text-primary uppercase">Current ({status})</span><pre className="text-[10px] bg-black/40 p-4 rounded-xl border border-primary/20 text-emerald-400/70 overflow-hidden text-ellipsis">{JSON.stringify(response, null, 2)}</pre></div>
                     </div>
                  </div>
                )}
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 space-y-6">
            <div className="flex items-center gap-2"><History className="w-4 h-4 text-primary" /><span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Session History</span></div>
            <div className="space-y-3 max-h-[500px] overflow-auto custom-scrollbar pr-2">
              {history.map(item => (
                <div key={item.id} className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl space-y-3 group hover:border-primary/20 transition-all">
                  <div className="flex justify-between items-center"><span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded uppercase", item.method === 'GET' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-primary/20 text-primary')}>{item.method}</span><span className="text-[9px] font-mono text-muted-foreground">{new Date(item.timestamp).toLocaleTimeString()}</span></div>
                  <p className="text-[10px] font-mono text-white/40 truncate">{item.url}</p>
                  <div className="flex gap-2 pt-2 border-t border-white/5">
                     <button onClick={() => {setResponse(item.response); setStatus(item.status); setTime(item.time); setUrl(item.url); setMethod(item.method);}} className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-black uppercase transition-all">Restore</button>
                     <button onClick={() => setDiffBase(item)} className="p-1.5 bg-white/5 hover:bg-primary/20 hover:text-primary rounded-lg transition-all"><GitCompare className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
              {history.length === 0 && <div className="py-20 text-center text-white/5 uppercase font-black text-[10px] tracking-widest">No history yet</div>}
            </div>
          </div>

          <div className="p-8 bg-primary/5 rounded-3xl border border-primary/10 space-y-4">
             <Layers className="w-8 h-8 text-primary" />
             <h4 className="text-xs font-black uppercase text-white tracking-widest">Dev Protocol</h4>
             <p className="text-[10px] text-muted-foreground leading-relaxed uppercase font-bold tracking-tight">Standard CORS restrictions apply. Use this tool for testing open APIs or locally hosted endpoints with proper headers.</p>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
