import React, { useState } from "react"
import { Globe, Send, Plus, Trash2, Code, Settings2, Activity, ShieldAlert, CheckCircle, Copy } from "lucide-react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"

interface Header {
  key: string
  value: string
  enabled: boolean
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
  
  const { isCopied: copied, copy } = useCopyToClipboard()

  const addHeader = () => setHeaders([...headers, { key: "", value: "", enabled: true }])
  const removeHeader = (index: number) => setHeaders(headers.filter((_, i) => i !== index))
  const updateHeader = (index: number, updates: Partial<Header>) => {
    setHeaders(headers.map((h, i) => i === index ? { ...h, ...updates } : h))
  }

  const sendRequest = async () => {
    if (!url) return
    setLoading(true)
    setResponse(null)
    setStatus(null)
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
      setTime(Math.round(endTime - startTime))
      setStatus(res.status)
      
      const contentType = res.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const json = await res.json()
        setResponse(json)
      } else {
        const text = await res.text()
        setResponse(text)
      }
      toast.success(`Request complete: ${res.status}`)
    } catch (error: any) {
      console.error(error)
      toast.error("Request failed. Check CORS or URL.")
      setResponse({ error: error.message, hint: "This might be a CORS issue. Browsers block cross-origin requests unless the server allows them." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ToolLayout
      title="HTTP Request Builder"
      description="Compose and test API endpoints directly from your browser."
      icon={Globe}
      maxWidth="max-w-6xl"
      centered={true}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
        {/* Request Panel */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 space-y-6">
            <div className="flex gap-2">
              <select 
                value={method} 
                onChange={e => setMethod(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-primary/50"
              >
                {METHODS.map(m => <option key={m} value={m} className="bg-zinc-900">{m}</option>)}
              </select>
              <input 
                type="text" 
                value={url} 
                onChange={e => setUrl(e.target.value)}
                placeholder="https://api.example.com/v1/data"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-primary/50 transition-all"
              />
              <button 
                onClick={sendRequest}
                disabled={loading}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? <Settings2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Headers</label>
                <button onClick={addHeader} className="p-1 hover:text-primary transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-auto custom-scrollbar">
                {headers.map((h, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input 
                      type="checkbox" 
                      checked={h.enabled} 
                      onChange={e => updateHeader(i, { enabled: e.target.checked })}
                      className="accent-primary"
                    />
                    <input 
                      type="text" value={h.key} 
                      onChange={e => updateHeader(i, { key: e.target.value })}
                      placeholder="Key"
                      className="flex-1 bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs font-mono outline-none"
                    />
                    <input 
                      type="text" value={h.value} 
                      onChange={e => updateHeader(i, { value: e.target.value })}
                      placeholder="Value"
                      className="flex-1 bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs font-mono outline-none"
                    />
                    <button onClick={() => removeHeader(i)} className="p-2 text-muted-foreground hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {(method !== "GET") && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Body (JSON)</label>
                <textarea 
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-mono outline-none focus:border-primary/50 resize-none"
                  placeholder='{ "key": "value" }'
                />
              </div>
            )}
          </div>

          <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-4">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Note: Cross-Origin Resource Sharing (CORS) rules apply. Requests to APIs that don't allow web-origin requests will fail. Try using a proxy or an API that supports CORS.
            </p>
          </div>
        </div>

        {/* Response Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel h-full rounded-3xl border border-white/5 bg-black/20 flex flex-col overflow-hidden min-h-[500px]">
            <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Response</span>
              {status && (
                <div className="flex gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Activity className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-mono font-bold text-primary">{time}ms</span>
                  </div>
                  <div className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold",
                    status < 300 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                  )}>
                    {status}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex-1 p-6 font-mono text-xs overflow-auto custom-scrollbar relative">
              {response ? (
                <>
                  <button 
                    onClick={() => copy(JSON.stringify(response, null, 2))}
                    className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                  >
                    {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <pre className="text-white/80 whitespace-pre-wrap">
                    {typeof response === "string" ? response : JSON.stringify(response, null, 2)}
                  </pre>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-20 italic">
                  <Code className="w-12 h-12 mb-4" />
                  Request output will appear here
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
