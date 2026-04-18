import React, { useState, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, Loader2, Lock, Unlock, FileText, ShieldCheck } from "lucide-react"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"
import { downloadBlob } from "@/lib/canvas"

type Mode = "add" | "remove"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000"

export function PdfPassword() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState("")
  const [mode, setMode] = useState<Mode>("add")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [isDone, setIsDone] = useState(false)
  const [serverOnline, setServerOnline] = useState<boolean | null>(null)

  // Check if backend is running
  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then(r => r.json())
      .then(() => setServerOnline(true))
      .catch(() => setServerOnline(false))
  }, [])

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return

    // Manual file type validation
    if (!uploadedFile.type.includes("pdf") && !uploadedFile.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a valid PDF file")
      return
    }

    setFile(uploadedFile)
    setResultBlob(null)
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

      setProgress(40)

      const res = await fetch(`${API_BASE}/protect`, {
        method: "POST",
        body: formData,
      })

      setProgress(80)

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Server error" }))
        throw new Error(err.error || "Failed to encrypt PDF")
      }

      const blob = await res.blob()
      setResultBlob(blob)
      setProgress(100)
      setIsDone(true)
      setPassword("")
      toast.success("PDF encrypted with AES-256!")
    } catch (error: any) {
      console.error(error)
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

      setProgress(40)

      const res = await fetch(`${API_BASE}/unlock`, {
        method: "POST",
        body: formData,
      })

      setProgress(80)

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Decryption failed" }))
        throw new Error(err.error || "Failed to unlock PDF")
      }

      const blob = await res.blob()
      setResultBlob(blob)
      setProgress(100)
      setIsDone(true)
      setPassword("")
      toast.success("Password removed! PDF is now unlocked.")
    } catch (error: any) {
      console.error(error)
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
    if (!resultBlob) return
    const suffix = mode === "add" ? "protected" : "unlocked"
    const baseName = file?.name.replace(/\.pdf$/i, "") || "document"
    downloadBlob(resultBlob, `vanity-${suffix}-${baseName}.pdf`)
  }

  const handleStartNew = () => {
    setFile(null)
    setResultBlob(null)
    setIsDone(false)
    setProgress(0)
    setPassword("")
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
         <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6 text-primary">
            <Lock className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1">PDF Password Manager</h1>
        <p className="text-muted-foreground text-lg mb-4">
          Add or remove password protection from your PDF files.
        </p>

        {serverOnline === false && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            ⚠️ PDF Server is offline. Run <code className="bg-white/10 px-2 py-0.5 rounded">node server/server.js</code> to enable encryption.
          </div>
        )}

        {serverOnline === true && (
          <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            AES-256 Encryption Engine Online (qpdf)
          </div>
        )}

        {/* Mode toggle */}
        <div className="flex justify-center gap-2 mb-8">
          <button
            onClick={() => setMode("add")}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
              mode === "add"
                ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                : "bg-white/5 hover:bg-white/10 text-muted-foreground"
            }`}
          >
            <Lock className="w-4 h-4" /> Add Password
          </button>
          <button
            onClick={() => setMode("remove")}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
              mode === "remove"
                ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                : "bg-white/5 hover:bg-white/10 text-muted-foreground"
            }`}
          >
            <Unlock className="w-4 h-4" /> Remove Password
          </button>
        </div>

        <DropZone onDrop={handleDrop} accept={{ "application/pdf": [] }} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-3xl font-bold font-syne mb-2">
            {mode === "add" ? "Protect PDF" : "Unlock PDF"}
          </h1>
          <p className="text-muted-foreground text-sm">File: {file.name}</p>
        </div>
        <button onClick={handleStartNew} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Start New
        </button>
      </div>

      <div className="glass-panel p-8 rounded-xl space-y-8 relative overflow-hidden min-h-[300px]">
        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur z-20 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <h3 className="text-xl font-bold font-syne text-white">
              {mode === "add" ? `Encrypting PDF: ${progress}%` : `Unlocking PDF: ${progress}%`}
            </h3>
            <div className="w-64 h-1.5 bg-white/10 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-4">Using AES-256 encryption via qpdf</p>
          </div>
        )}

        {/* Input form */}
        {!isDone && !isProcessing && (
          <div className="max-w-md mx-auto space-y-6 py-8 text-center">
            <div className="p-4 bg-white/5 rounded-2xl inline-block mb-2">
              {mode === "add" ? (
                <Lock className="w-12 h-12 text-primary opacity-60" />
              ) : (
                <Unlock className="w-12 h-12 text-primary opacity-60" />
              )}
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {mode === "add" ? "Set Encryption Password" : "Enter Current Password (if known)"}
              </label>
              <input
                type="password"
                placeholder={mode === "add" ? "Choose a strong password..." : "Enter password to unlock..."}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 focus:ring-2 focus:ring-primary outline-none transition-all text-center text-xl font-bold font-syne"
              />
              {mode === "remove" && (
                <p className="text-xs text-muted-foreground">
                  Leave blank to try unlocking without a password (works for owner-only restrictions).
                </p>
              )}
            </div>

            <button
              onClick={mode === "add" ? applyProtection : removeProtection}
              disabled={(mode === "add" && !password) || isProcessing || serverOnline === false}
              className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {mode === "add" ? (
                <><ShieldCheck className="w-5 h-5" /> Encrypt with AES-256</>
              ) : (
                <><Unlock className="w-5 h-5" /> Remove Password</>
              )}
            </button>

            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Files are sent to your local server, encrypted via qpdf, then immediately deleted.
            </p>
          </div>
        )}

        {/* Success state */}
        {isDone && resultBlob && (
          <div className="text-center space-y-8 py-12 animate-in zoom-in-95">
            <div className="p-8 bg-green-500/10 border border-green-500/20 rounded-2xl inline-block">
              <FileText className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold font-syne text-white">
                {mode === "add" ? "PDF Encrypted!" : "PDF Unlocked!"}
              </h3>
              <p className="text-muted-foreground text-sm mt-2">
                {mode === "add"
                  ? "AES-256 password protection has been applied."
                  : "Password restrictions have been removed from your PDF."}
              </p>
            </div>

            <button
              onClick={handleDownload}
              className="px-12 py-4 bg-primary text-primary-foreground font-bold rounded-full shadow-[0_0_40px_rgba(245,158,11,0.4)] hover:scale-105 transition-all flex items-center justify-center gap-2 mx-auto"
            >
              <Download className="w-6 h-6" />
              {mode === "add" ? "Download Encrypted PDF" : "Download Unlocked PDF"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
