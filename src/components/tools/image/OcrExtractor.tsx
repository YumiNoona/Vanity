import React, { useState, useRef, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, Loader2, FileText, Copy, CheckCircle, Languages } from "lucide-react"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { safeImport } from "@/lib/utils/loader"

import { useObjectUrl } from "@/hooks/useObjectUrl"

// Module-level cache for heavy library
let tesseractModule: any = null

export function OcrExtractor() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [extractedText, setExtractedText] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [language, setLanguage] = useState("eng")
  const { url: previewUrl, setUrl: setPreviewUrl, clear: clearPreviewUrl } = useObjectUrl()
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()

  useEffect(() => {
    return () => {
      const maybeTerminate = (tesseractModule as { terminate?: () => Promise<void> } | null)?.terminate
      if (typeof maybeTerminate === "function") {
        void maybeTerminate().catch(() => {})
        tesseractModule = null
      }
    }
  }, [])

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return

    setFile(uploadedFile)
    setExtractedText(null)
    setResultUrl(null)
    setProgress(0)

    // Create preview
    setPreviewUrl(uploadedFile)

    setIsProcessing(true)

    try {
      // 1. Action-triggered dynamic import with caching
      if (!tesseractModule) {
        setProgress(5) // Starter progress
        tesseractModule = await safeImport(
          () => import("tesseract.js"),
          "OCR engine"
        )
      }

      const { recognize } = tesseractModule

      // 2. Processing with logger
      const result = await recognize(uploadedFile, language, {
        logger: (m: any) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100))
          }
        },
      })

      setExtractedText(result.data.text)
      setResultUrl(new Blob([result.data.text], { type: "text/plain" }))
      setProgress(100)
      toast.success("Text extracted successfully!")
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || "OCR failed. Check your network.")
      setFile(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCopy = () => {
    if (!extractedText) return
    navigator.clipboard.writeText(extractedText)
    setCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadText = () => {
    if (!resultUrl) return
    const a = document.createElement("a")
    a.href = resultUrl
    a.download = `vanity-ocr-${file?.name?.replace(/\.[^/.]+$/, "") || "text"}.txt`
    a.click()
  }

  const LANGUAGES = [
    { code: "eng", label: "English" },
    { code: "spa", label: "Spanish" },
    { code: "fra", label: "French" },
    { code: "deu", label: "German" },
    { code: "hin", label: "Hindi" },
    { code: "jpn", label: "Japanese" },
    { code: "kor", label: "Korean" },
    { code: "chi_sim", label: "Chinese (Simplified)" },
    { code: "ara", label: "Arabic" },
    { code: "por", label: "Portuguese" },
  ]

  if (!file) {
    return (
      <ToolUploadLayout
        title="OCR — Image to Text"
        description="Extract text from images using AI-powered OCR. Supports 100+ languages, runs 100% in your browser."
        icon={Languages}
      >
        <div className="glass-panel p-6 rounded-xl mb-8 flex flex-col items-center">
          <label className="text-sm font-medium mb-4">OCR Language</label>
          <div className="flex flex-wrap justify-center gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  language === lang.code
                    ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
        <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout
      title="OCR Result"
      description={`Extracted from ${file.name}`}
      icon={Languages}
      onBack={() => {
        setFile(null)
        setExtractedText(null)
        clearPreviewUrl()
        clearResultUrl()
      }}
      maxWidth="max-w-6xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
        {/* Preview + Progress */}
        <div className="glass-panel p-6 rounded-xl flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden bg-black/40">
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Source"
              className={`max-h-[400px] object-contain rounded shadow-lg transition-opacity duration-300 ${isProcessing ? 'opacity-40' : 'opacity-100'}`}
            />
          )}

          {isProcessing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <h3 className="text-xl font-bold font-syne text-white text-center">
                {progress < 10 ? "Loading OCR Engine..." : `Recognizing: ${progress}%`}
              </h3>
              <div className="w-64 h-1.5 bg-white/10 rounded-full mt-4 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress || 5}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center max-w-xs">
                {progress < 10 ? "First run fetches language models (~15MB from CDN)" : "Processing text locally in your browser."}
              </p>
            </div>
          )}
        </div>

        {/* Extracted Text */}
        <div className="glass-panel p-6 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Extracted Text
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                disabled={!extractedText}
                className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg flex items-center gap-1.5 hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {copied ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={handleDownloadText}
                disabled={!extractedText}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> .txt
              </button>
            </div>
          </div>

          <textarea
            readOnly
            value={extractedText || (isProcessing ? "Processing..." : "")}
            placeholder="Text will appear here after processing..."
            className="w-full h-80 bg-black/40 border border-white/10 rounded-lg p-4 text-sm leading-relaxed resize-none outline-none focus:border-primary/30"
          />

          {extractedText && (
            <div className="flex justify-between animate-in fade-in duration-500 text-xs text-muted-foreground">
              <span>{extractedText.split(/\s+/).filter(Boolean).length} words</span>
              <span>{extractedText.length} characters</span>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
