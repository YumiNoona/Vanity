import React, { useState, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, Loader2, Lock, Unlock, FileText, ShieldCheck } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"
import { downloadBlob } from "@/lib/canvas"
import { useObjectUrl } from "@/hooks/useObjectUrl"
import { PillToggle } from "@/components/shared/PillToggle"

type Mode = "add" | "remove"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000"

export function PdfPassword() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState("")
  const [mode, setMode] = useState<Mode>("add")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()
  const [isDone, setIsDone] = useState(false)
  const [serverOnline, setServerOnline] = useState<boolean | null>(null)

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then(r => r.json())
      .then(() => setServerOnline(true))
      .catch(() => setServerOnline(false))
  }, [])

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return

    if (!uploadedFile.type.includes("pdf") && !uploadedFile.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a valid PDF file")
      return
    }

    setFile(uploadedFile)
    clearResultUrl()
    setIsDone(false)
    setProgress(0)
  }

  const applyProtection = async () => {
    if (!file || !password) return
    setIsProcessing(true)
    setProgress(20)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("password", password)

      const res = await fetch(`${API_BASE}/protect`, { method: "POST", body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Server error" }))
        throw new Error(err.error || "Failed to encrypt PDF")
      }

      const blob = await res.blob()
      setResultUrl(blob)
      setProgress(100)
      setIsDone(true)
      setPassword("")
      toast.success("PDF encrypted with AES-256!")
    } catch (error: any) {
      toast.error(error.message || "Failed to protect PDF")
      setProgress(0)
    } finally {
      setIsProcessing(false)
    }
  }

  const removeProtection = async () => {
    if (!file) return
    setIsProcessing(true)
    setProgress(20)

    try {
      const formData = new FormData()
      formData.append("file", file)
      if (password) formData.append("password", password)

      const res = await fetch(`${API_BASE}/unlock`, { method: "POST", body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Decryption failed" }))
        throw new Error(err.error || "Failed to unlock PDF")
      }

      const blob = await res.blob()
      setResultUrl(blob)
      setProgress(100)
      setIsDone(true)
      setPassword("")
      toast.success("Password removed! PDF is now unlocked.")
    } catch (error: any) {
      if (error.message?.includes("password") || error.message?.includes("Wrong")) {
        toast.error("Wrong password or unsupported encryption format")
      } else {
        toast.error(error.message || "Failed to unlock PDF")
      }
      setProgress(0)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!resultUrl) return
    const suffix = mode === "add" ? "protected" : "unlocked"
    const baseName = file?.name.replace(/\.pdf$/i, "") || "document"
    downloadBlob(resultUrl as any, `vanity-${suffix}-${baseName}.pdf`)
  }

  const handleBack = () => {
    setFile(null)
    clearResultUrl()
    setIsDone(false)
    setProgress(0)
    setPassword("")
  }

  const renderToggle = () => (
    <PillToggle
      activeId={mode}
      onChange={setMode}
      options={[
        { id: "add", label: "Add Password", icon: Lock },
        { id: "remove", label: "Remove Password", icon: Unlock }
      ]}
    />
  )

  if (!file) {
    return (
      <ToolUploadLayout title="PDF Passwords" description="Add or remove password protection from your PDF files using AES-256 encryption." icon={Lock}>
        {serverOnline === false && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
            ⚠️ PDF Password Service is offline. Run <code className="bg-white/10 px-2 py-0.5 rounded text-white">node server/server.js</code> locally to enable encryption.
          </div>
        )}
        {serverOnline === true && (
          <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs flex items-center justify-center gap-2 animate-in fade-in">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            AES-256 Encryption Engine Online (qpdf)
          </div>
        )}
        <div className="mb-8">
          {renderToggle()}
        </div>
        <DropZone onDrop={handleDrop} accept={{ "application/pdf": [] }} />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout
      title="PDF Passwords"
      description={file.name}
      icon={mode === "add" ? Lock : Unlock}
      centered={true}
      maxWidth="max-w-4xl"
    >
      <div className="glass-panel p-8 rounded-3xl space-y-8 relative overflow-hidden min-h-[400px] border-white/5 bg-black/40 flex flex-col items-center justify-center">
        {isProcessing && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur z-20 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <h3 className="text-xl font-bold font-syne text-white">
              {mode === "add" ? `Encrypting PDF: ${progress}%` : `Unlocking PDF: ${progress}%`}
            </h3>
            <div className="w-64 h-1.5 bg-white/10 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-4 uppercase tracking-widest font-black">Using AES-256 encryption via qpdf</p>
          </div>
        )}

        {!isDone && !isProcessing && (
          <div className="max-w-md w-full mx-auto space-y-8 py-8 text-center animate-in zoom-in-95 duration-500">
            <div className="p-6 bg-primary/10 rounded-full inline-block mb-2 text-primary border border-primary/20 shadow-2xl">
              {mode === "add" ? <Lock className="w-12 h-12" /> : <Unlock className="w-12 h-12" />}
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {mode === "add" ? "Set Encryption Password" : "Enter Current Password"}
              </label>
              <input
                type="password"
                placeholder={mode === "add" ? "Choose a strong password..." : "Enter password to unlock..."}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-5 focus:border-primary/50 outline-none transition-all text-center text-2xl font-bold font-syne tracking-tighter"
              />
              {mode === "remove" && (
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-relaxed">
                  Leave blank to try unlocking without a password (owner-only restrictions).
                </p>
              )}
            </div>

            <button
              onClick={mode === "add" ? applyProtection : removeProtection}
              disabled={(mode === "add" && !password) || isProcessing || serverOnline === false}
              className="w-full py-5 bg-primary text-primary-foreground font-black rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 uppercase tracking-widest text-sm"
            >
              {mode === "add" ? (
                <><ShieldCheck className="w-5 h-5" /> Encrypt Document</>
              ) : (
                <><Unlock className="w-5 h-5" /> Unlock Document</>
              )}
            </button>

            <p className="text-[9px] text-muted-foreground leading-relaxed uppercase tracking-widest">
              Processing occurs on your local instance. Files are removed immediately after encryption.
            </p>
          </div>
        )}

        {isDone && resultUrl && (
          <div className="text-center space-y-8 py-12 animate-in zoom-in-95 duration-500">
            <div className="p-8 bg-green-500/10 border border-green-500/20 rounded-3xl inline-block shadow-2xl">
              <FileText className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-3xl font-bold font-syne text-white">
                {mode === "add" ? "PDF Encrypted!" : "PDF Unlocked!"}
              </h3>
              <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
                {mode === "add"
                  ? "AES-256 password protection has been applied successfully."
                  : "Security restrictions have been removed from your document."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleDownload}
                className="px-12 py-5 bg-primary text-primary-foreground font-black rounded-2xl shadow-[0_0_40px_rgba(245,158,11,0.3)] hover:scale-105 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm active:scale-95"
              >
                <Download className="w-6 h-6" /> Export
              </button>
              <button
                onClick={handleBack}
                className="px-12 py-5 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl border border-white/10 transition-all flex items-center justify-center uppercase tracking-widest text-sm"
              >
                Start New
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
