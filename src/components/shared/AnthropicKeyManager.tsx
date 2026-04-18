import React, { useState, useEffect } from "react"
import { Key, ShieldCheck, X, Eye, EyeOff } from "lucide-react"

const STORAGE_KEY = "vanity_anthropic_key"

export function useAnthropicKey() {
  const [key, setKey] = useState<string | null>(localStorage.getItem(STORAGE_KEY))

  const saveKey = (newKey: string) => {
    localStorage.setItem(STORAGE_KEY, newKey)
    setKey(newKey)
  }

  const removeKey = () => {
    localStorage.removeItem(STORAGE_KEY)
    setKey(null)
  }

  return { key, saveKey, removeKey }
}

export function AnthropicKeyManager() {
  const { key, saveKey, removeKey } = useAnthropicKey()
  const [input, setInput] = useState("")
  const [isVisible, setIsVisible] = useState(false)

  if (key) {
    return (
      <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 animate-in fade-in slide-in-from-top-2">
        <ShieldCheck className="w-5 h-5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">Anthropic API Key active</p>
          <p className="text-[10px] opacity-70">Saved locally in your browser.</p>
        </div>
        <button 
          onClick={removeKey}
          className="p-1.5 hover:bg-emerald-500/20 rounded-md transition-colors"
          title="Remove Key"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-6 rounded-2xl bg-white/5 border border-white/10 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
          <Key className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold font-syne">AI Tools Activation</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Enter your Anthropic API Key to enable AI features. We never see your key; it's stored locally and calls the API directly from your browser.
          </p>
        </div>
      </div>

      <div className="relative group">
        <input 
          type={isVisible ? "text" : "password"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="sk-ant-..."
          className="w-full bg-black/40 border border-white/10 rounded-xl p-4 pr-12 font-mono text-xs outline-none focus:border-emerald-500/30 transition-all"
        />
        <button 
          onClick={() => setIsVisible(!isVisible)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
        >
          {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      <button 
        onClick={() => input.trim() && saveKey(input.trim())}
        disabled={!input.trim()}
        className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:hover:scale-100 transition-all font-syne"
      >
        Save Key to Browser
      </button>

      <div className="text-[10px] text-center text-muted-foreground/50">
        <p>Grab your key from <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-500 transition-colors">Anthropic Console</a></p>
      </div>
    </div>
  )
}
