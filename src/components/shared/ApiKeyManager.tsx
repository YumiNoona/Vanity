import React, { useEffect, useMemo, useState } from "react"
import { BrainCircuit, CheckCircle2, Trash2 } from "lucide-react"
import { getActiveProvider } from "@/lib/ai-providers"

type ProviderKey = {
  id: "gemini" | "anthropic" | "openai" | "groq"
  label: string
  storageKey: string
}

const PROVIDERS: ProviderKey[] = [
  { id: "gemini", label: "Gemini", storageKey: "vanity_gemini_key" },
  { id: "anthropic", label: "Anthropic", storageKey: "vanity_anthropic_key" },
  { id: "openai", label: "OpenAI", storageKey: "vanity_openai_key" },
  { id: "groq", label: "Groq", storageKey: "vanity_groq_key" }
]

const mask = (value: string) => (value.length <= 8 ? "********" : `${value.slice(0, 4)}...${value.slice(-4)}`)

export function useActiveProvider() {
  const [active, setActive] = useState(getActiveProvider().provider.label)
  useEffect(() => {
    const refresh = () => setActive(getActiveProvider().provider.label)
    window.addEventListener("storage", refresh)
    window.addEventListener("vanity-ai-provider-changed", refresh as EventListener)
    refresh()
    return () => {
      window.removeEventListener("storage", refresh)
      window.removeEventListener("vanity-ai-provider-changed", refresh as EventListener)
    }
  }, [])
  return active
}

export function ApiKeyManager() {
  const [values, setValues] = useState<Record<string, string>>(() =>
    PROVIDERS.reduce(
      (acc, item) => ({ ...acc, [item.storageKey]: localStorage.getItem(item.storageKey) || "" }),
      {} as Record<string, string>
    )
  )
  const [drafts, setDrafts] = useState<Record<string, string>>(() => values)
  const active = useMemo(() => getActiveProvider().provider.label, [values])

  const save = (storageKey: string) => {
    const value = drafts[storageKey]?.trim() || ""
    if (!value) return
    localStorage.setItem(storageKey, value)
    const next = { ...values, [storageKey]: value }
    setValues(next)
    setDrafts(next)
    window.dispatchEvent(new Event("vanity-ai-provider-changed"))
  }

  const clear = (storageKey: string) => {
    localStorage.removeItem(storageKey)
    const next = { ...values, [storageKey]: "" }
    setValues(next)
    setDrafts(next)
    window.dispatchEvent(new Event("vanity-ai-provider-changed"))
  }

  return (
    <div className="glass-panel p-6 rounded-2xl border-white/10 space-y-5">
      <div>
        <h3 className="text-lg font-bold font-syne text-white">AI Provider Keys</h3>
        <p className="text-xs text-muted-foreground">Add your own keys for unlimited use. Leave empty to use the built-in free tier.</p>
      </div>

      <div className="space-y-3">
        {PROVIDERS.map((provider) => {
          const saved = Boolean(values[provider.storageKey])
          return (
            <div key={provider.id} className="p-3 rounded-xl border border-white/10 bg-black/20 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-md bg-white/10">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                  <span className="text-sm font-semibold truncate">{provider.label}</span>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full shrink-0 ${saved ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-muted-foreground"}`}>
                  {saved ? "Saved" : "Not set"}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={drafts[provider.storageKey] || ""}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [provider.storageKey]: e.target.value }))}
                  placeholder={saved ? mask(values[provider.storageKey]) : "Paste API key"}
                  className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono"
                />
                <button onClick={() => save(provider.storageKey)} className="px-3 py-2 text-xs rounded-lg bg-emerald-600 text-white">
                  Save
                </button>
                <button onClick={() => clear(provider.storageKey)} className="px-3 py-2 text-xs rounded-lg bg-white/10">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-muted-foreground">
        No keys saved? We'll use our built-in Gemini free tier automatically.
      </div>
      <div className="flex items-center gap-2 text-xs">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <span>Active provider: <span className="font-bold text-white">{active}</span></span>
      </div>
    </div>
  )
}

export function ApiKeysPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-syne">Providers</h1>
        <p className="text-sm text-muted-foreground">Manage AI provider keys in one place.</p>
      </div>
      <ApiKeyManager />
    </div>
  )
}
