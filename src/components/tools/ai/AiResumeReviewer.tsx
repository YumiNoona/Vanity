import React, { useEffect, useRef, useState } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, FileText, Loader2, Award, Zap, AlertCircle, Sparkles, Target, CheckCircle2 } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { toast } from "sonner"
import * as pdfjsLib from "pdfjs-dist"

// Re-using the local worker
import pdfWorker from "pdfjs-dist/build/pdf.worker?url"
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

import { useActiveProvider } from "@/components/shared/ApiKeyManager"
import { AIProviderHint } from "@/components/shared/AIProviderHint"
import { AIProviderError, callAI } from "@/lib/ai-providers"

interface ReviewResult {
  score: number // 0-100
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
}

export function AiResumeReviewer() {
  const activeProvider = useActiveProvider()
  const [file, setFile] = useState<File | null>(null)
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [loadingStep, setLoadingStep] = useState<string>("Waiting...")
  
  const [result, setResult] = useState<ReviewResult | null>(null)
  const requestControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      requestControllerRef.current?.abort()
    }
  }, [])
  
  const handleDrop = async (files: File[]) => {
    if (files[0]) {
      setFile(files[0])
      setResult(null)
    }
  }

  const extractPdfText = async (pdfFile: File): Promise<string> => {
     setLoadingStep("Extracting textual vectors from resume...")
     const arrayBuffer = await pdfFile.arrayBuffer()
     const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
     let fullText = ""

     for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        fullText += textContent.items.map((item: any) => item.str).join(" ") + "\n"
     }
     return fullText
  }

  const handleReview = async () => {
    if (!file) return
    setIsProcessing(true)
    setResult(null)
    requestControllerRef.current?.abort()
    const controller = new AbortController()
    requestControllerRef.current = controller

    try {
      let rawText = ""
      if (file.type === "application/pdf") {
         rawText = await extractPdfText(file)
      } else {
         setLoadingStep("Reading plain text contents...")
         rawText = await file.text()
      }

      setLoadingStep("Analyzing semantics...")
      
      const systemPrompt = `You are an elite recruiter and resume evaluator. 
Analyze the provided resume text thoroughly. 
You MUST return ONLY a strictly valid JSON object representing your review, with NO markdown formatting, NO markdown code blocks (do not wrap in \`\`\`json), and NO explanatory text before or after.
Your response must exactly match this JSON structure:
{
  "score": <integer from 0 to 100 representing overall impact and hireability>,
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<critical gap 1>", "<issue 2>"],
  "suggestions": ["<actionable advice 1>", "<actionable advice 2>"]
}`

      const responseText = await callAI({
         prompt: `Here is the resume text to evaluate:\n\n${rawText}`,
         systemPrompt,
         signal: controller.signal
      })

      const cleaned = responseText.replace(/```json/gi, "").replace(/```/gi, "").trim()
      
      const parsed = JSON.parse(cleaned) as ReviewResult
      
      if (typeof parsed.score !== "number" || !Array.isArray(parsed.strengths)) {
         throw new Error("Invalid structure returned.")
      }

      setResult(parsed)

    } catch (err: any) {
      if (err?.name === "AbortError" || err?.message === "Request was cancelled.") {
        return
      }
      if (err instanceof AIProviderError) {
         toast.error(err.message)
      } else if (err instanceof SyntaxError) {
         toast.error("Failed to parse the AI's response properly. Please try again.")
      } else {
         toast.error(err.message || "An unknown error occurred during analysis.")
      }
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null
      }
      setIsProcessing(false)
      setLoadingStep("Waiting...")
    }
  }

  const getScoreColor = (score: number) => {
     if (score >= 80) return "text-emerald-400"
     if (score >= 60) return "text-amber-400"
     return "text-red-400"
  }

  const handleBack = () => {
    setFile(null)
    setResult(null)
  }

  if (!file) {
    return (
       <ToolUploadLayout 
        title="Resume Reviewer" 
        description="Get an elite recruiter's actionable breakdown completely privately without uploading to third-party databases." 
        icon={Sparkles}
      >
         <AIProviderHint />
         <DropZone onDrop={handleDrop} accept={{ "application/pdf": [".pdf"], "text/plain": [".txt"] }} label="Drop PDF/TXT Resume" />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout 
      title="Executive Scorecard" 
      description={`${file.name} · ${activeProvider}`} 
      icon={Award} 
      onBack={handleBack} 
      backLabel="Analyze Another" 
      maxWidth="max-w-6xl"
    >
      {!result && !isProcessing && (
         <div className="glass-panel p-12 rounded-3xl text-center border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.05)] text-white flex flex-col items-center">
            <Sparkles className="w-12 h-12 text-blue-400 mb-6" />
            <h2 className="text-2xl font-black font-syne mb-2">Ready to Evaluate</h2>
            <p className="text-muted-foreground mb-8 max-w-md">AI will read your resume locally and extract strategic insights across impact, syntax, and hiring frameworks.</p>
            <button 
              onClick={handleReview}
              className="py-4 px-8 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all transform hover:-translate-y-1 active:scale-95"
            >
              Begin Comprehensive Review
            </button>
         </div>
      )}

      {isProcessing && (
         <div className="glass-panel p-16 rounded-3xl text-center border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.05)] text-white flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-blue-500 mb-6 animate-spin" />
            <p className="font-mono text-sm tracking-widest uppercase text-blue-300 font-bold">{loadingStep}</p>
            <p className="text-xs text-muted-foreground mt-4">Running full semantic pass via API securely...</p>
         </div>
      )}

      {result && (
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-8 duration-700">
            {/* Main Score & Details */}
            <div className="lg:col-span-8 space-y-8">
               <div className="glass-panel p-8 rounded-3xl border-white/5 relative overflow-hidden bg-black/40">
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                     <Target className="w-40 h-40" />
                  </div>
                  <h3 className="text-xl font-bold font-syne text-white mb-6 flex items-center gap-3">
                     <Target className="w-5 h-5 text-blue-400" /> Executive Summary
                  </h3>
                  
                  <div className="flex items-center gap-8 border-b border-white/5 pb-8 mb-8">
                     <div className="relative">
                        <svg className="w-32 h-32 transform -rotate-90">
                           <circle cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-white/5" />
                           <circle 
                             cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="12" 
                             className={`${getScoreColor(result.score)} transition-all duration-1000 ease-out`}
                             strokeDasharray={351.8} 
                             strokeDashoffset={351.8 - (351.8 * result.score) / 100}
                             strokeLinecap="round"
                           />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                           <span className={`text-3xl font-black font-syne ${getScoreColor(result.score)}`}>{result.score}</span>
                           <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">/ 100</span>
                        </div>
                     </div>
                     <div className="flex-1">
                        <p className="text-muted-foreground text-sm leading-relaxed">
                           A score above 80 indicates high tier structural readiness for ATS platforms and elite recruiter scans. 60-79 indicates strong potential but lacking narrative impact. Under 60 means fundamental formatting or metric issues need immediate attention.
                        </p>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Core Strengths
                     </h4>
                     <ul className="space-y-3">
                        {result.strengths.map((str, i) => (
                           <li key={i} className="flex items-start gap-3 text-sm text-white/90 bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10 leading-relaxed shadow-sm">
                              <span className="text-emerald-500 font-bold">•</span> {str}
                           </li>
                        ))}
                     </ul>
                  </div>
               </div>
            </div>

            {/* Sidebar Weaknesses & Suggestions */}
            <div className="lg:col-span-4 space-y-8">
               <div className="glass-panel p-8 rounded-3xl border-red-500/20 bg-gradient-to-b from-red-500/10 to-transparent">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-red-400 flex items-center gap-2 mb-6 text-white/90">
                     <AlertCircle className="w-4 h-4" /> Critical Gaps
                  </h4>
                  <ul className="space-y-4">
                     {result.weaknesses.map((weak, i) => (
                        <li key={i} className="text-sm text-white/90 leading-relaxed pl-4 border-l-2 border-red-500/50">
                           {weak}
                        </li>
                     ))}
                  </ul>
               </div>

               <div className="glass-panel p-8 rounded-3xl border-amber-500/20 bg-gradient-to-b from-amber-500/10 to-transparent">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2 mb-6 text-white/90">
                     <Zap className="w-4 h-4" /> Action Items
                  </h4>
                  <ul className="space-y-4">
                     {result.suggestions.map((sug, i) => (
                        <li key={i} className="text-sm text-white/90 leading-relaxed pl-4 border-l-2 border-amber-500/50">
                           {sug}
                        </li>
                     ))}
                  </ul>
               </div>
            </div>
         </div>
      )}
    </ToolLayout>
  )
}
