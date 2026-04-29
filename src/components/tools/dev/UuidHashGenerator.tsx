import React, { useState, useCallback, useEffect } from "react"
import { Key, Copy, CheckCircle, RefreshCw, ShieldCheck, Hash, List, Trash2, Layers, Binary } from "lucide-react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { PillToggle } from "@/components/shared/PillToggle"
import { toast } from "sonner"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"
import { cn } from "@/lib/utils"

type TabMode = "uuid" | "hash"

export function UuidHashGenerator() {
  const [mode, setMode] = useState<TabMode>("uuid")
  const [uuid, setUuid] = useState(crypto.randomUUID())
  const [batchCount, setBatchCount] = useState(5)
  const [batchUuids, setBatchUuids] = useState<string[]>([])
  const [history, setHistory] = useState<string[]>([])

  const [inputText, setInputText] = useState("")
  const [hashResult, setHashResult] = useState({ sha1: "", sha256: "", sha384: "", sha512: "" })
  const { copiedId, copy } = useCopyToClipboard()

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("vanity_uuid_history")
    if (saved) setHistory(JSON.parse(saved))
  }, [])

  const saveToHistory = (item: string) => {
    const newHistory = [item, ...history.slice(0, 19)]
    setHistory(newHistory)
    localStorage.setItem("vanity_uuid_history", JSON.stringify(newHistory))
  }

  const generateUuid = () => {
    const newUuid = crypto.randomUUID()
    setUuid(newUuid)
    saveToHistory(newUuid)
    toast.success("New UUID generated")
  }

  const generateBatch = () => {
    const newBatch = Array.from({ length: batchCount }, () => crypto.randomUUID())
    setBatchUuids(newBatch)
    toast.success(`Generated ${batchCount} UUIDs`)
  }

  const handleCopy = (text: string, id: string) => {
    copy(text, "Copied to clipboard")
  }

  const calculateHash = useCallback(async (text: string) => {
    if (!text) {
      setHashResult({ sha1: "", sha256: "", sha384: "", sha512: "" })
      return
    }

    const encoder = new TextEncoder()
    const data = encoder.encode(text)

    const compute = async (algo: string) => {
      const buffer = await crypto.subtle.digest(algo, data)
      return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("")
    }

    try {
      const results = await Promise.all([
        compute("SHA-1"),
        compute("SHA-256"),
        compute("SHA-384"),
        compute("SHA-512")
      ])
      setHashResult({ sha1: results[0], sha256: results[1], sha384: results[2], sha512: results[3] })
    } catch (e) {
      console.error(e)
    }
  }, [])

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem("vanity_uuid_history")
    toast.info("History cleared")
  }

  return (
    <ToolLayout 
      title="UUID & Hash Generator" 
      description="Advanced cryptographic utility for developers." 
      icon={Key} 
      maxWidth="max-w-6xl"
      centered={true}
    >
      <div className="space-y-8 pb-20">
        <div className="flex justify-center">
          <PillToggle 
            activeId={mode}
            onChange={(id) => setMode(id as TabMode)}
            options={[
              { id: "uuid", label: "UUID Generator", icon: Key },
              { id: "hash", label: "Hash Generator", icon: Hash },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            {mode === "uuid" ? (
              <div className="space-y-6">
                {/* Single Generator */}
                <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Single UUID v4</label>
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  </div>
                  <div className="p-6 bg-black/40 rounded-2xl border border-white/5 font-mono text-lg text-blue-400 text-center tracking-wider break-all">
                    {uuid}
                  </div>
                  <div className="flex gap-4">
                    <button onClick={generateUuid} className="flex-1 py-4 bg-white/5 border border-white/10 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
                      <RefreshCw className="w-4 h-4" /> Regenerate
                    </button>
                    <button onClick={() => handleCopy(uuid, 'single')} className="flex-1 py-4 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
                      {copiedId === 'single' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      Copy Result
                    </button>
                  </div>
                </div>

                {/* Batch Generator */}
                <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Batch Generation</label>
                    <Layers className="w-3 h-3 text-primary" />
                  </div>
                  <div className="flex gap-4 items-center">
                    <input 
                      type="number" 
                      min="1" max="100" 
                      value={batchCount} 
                      onChange={e => setBatchCount(parseInt(e.target.value) || 1)}
                      className="w-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-center outline-none focus:border-primary/50"
                    />
                    <button onClick={generateBatch} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-all">
                      Generate {batchCount} UUIDs
                    </button>
                    {batchUuids.length > 0 && (
                      <button onClick={() => handleCopy(batchUuids.join('\n'), 'batch')} className="p-3 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all">
                         {copiedId === 'batch' ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    )}
                  </div>
                  {batchUuids.length > 0 && (
                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5 max-h-[200px] overflow-auto custom-scrollbar space-y-2">
                      {batchUuids.map((u, i) => (
                        <div key={i} className="flex items-center justify-between group">
                          <span className="font-mono text-[10px] text-muted-foreground">{u}</span>
                          <button onClick={() => handleCopy(u, `b-${i}`)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-primary transition-all">
                             {copiedId === `b-${i}` ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Input String</label>
                  <textarea 
                    value={inputText}
                    onChange={(e) => { setInputText(e.target.value); calculateHash(e.target.value); }}
                    placeholder="Enter text to hash..."
                    className="w-full h-32 bg-black/40 border border-white/5 rounded-2xl p-4 font-mono text-sm outline-none focus:border-primary/30 transition-all text-white/90"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: "SHA-1", value: hashResult.sha1, id: "sha1" },
                    { label: "SHA-256", value: hashResult.sha256, id: "sha256" },
                    { label: "SHA-384", value: hashResult.sha384, id: "sha384" },
                    { label: "SHA-512", value: hashResult.sha512, id: "sha512" },
                  ].map(h => (
                    <div key={h.label} className="space-y-2">
                       <div className="flex items-center justify-between">
                         <span className="text-[10px] font-black text-muted-foreground uppercase">{h.label}</span>
                         <button onClick={() => handleCopy(h.value, h.id)} className="p-1 hover:text-primary transition-all">
                           {copiedId === h.id ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                         </button>
                       </div>
                       <div className="p-3 bg-black/40 border border-white/5 rounded-xl font-mono text-[9px] break-all text-muted-foreground leading-tight">
                         {h.value || "—"}
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar / History */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <List className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recent History</span>
                </div>
                <button onClick={clearHistory} className="p-1.5 hover:bg-white/5 rounded-lg text-muted-foreground hover:text-red-400 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-auto custom-scrollbar pr-2 max-h-[500px]">
                {history.length > 0 ? (
                  history.map((item, i) => (
                    <div key={i} className="group flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl hover:border-white/10 transition-all">
                      <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[200px]">{item}</span>
                      <button onClick={() => handleCopy(item, `hist-${i}`)} className="p-1 hover:text-primary transition-all">
                        {copiedId === `hist-${i}` ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="h-40 flex flex-col items-center justify-center text-muted-foreground opacity-20 italic text-xs">
                    No history yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
