import React, { useState, useCallback } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Type, Download, AlertTriangle, CheckCircle, Search, RefreshCw, XCircle } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import * as pdfjsLib from "pdfjs-dist"
import { toast } from "sonner"
import { useObjectUrl } from "@/hooks/useObjectUrl"

// Set up worker
import pdfWorker from "pdfjs-dist/build/pdf.worker?url"
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

export interface PdfFont {
  id: string
  name: string
  type: string
  isEmbedded: boolean
  rawBuffer?: Uint8Array
}

export function PdfFontExtractor() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [fonts, setFonts] = useState<PdfFont[]>([])
  const [progress, setProgress] = useState(0)
  const { setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile) return
    setFile(uploadedFile)
    setFonts([])
    processPdf(uploadedFile)
  }

  const processPdf = useCallback(async (pdfFile: File) => {
    setIsProcessing(true)
    setProgress(0)
    
    try {
      const arrayBuffer = await pdfFile.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      
      const foundFonts = new Map<string, PdfFont>()

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        
        // Force PDF.js to parse the font dictionaries and cache them internally
        await page.getTextContent()
        
        // PDF.js internal object registries (casting to any safely read them)
        const commonObjs: any = page.commonObjs
        const objs: any = page.objs
        
        const extractFromRegistry = (registry: any) => {
           if (!registry || !registry._objs) return
           
           Object.keys(registry._objs).forEach(key => {
             const obj = registry._objs[key]
             // obj usually contains { name: string, type: string, data: Uint8Array, ... } if it's a font
             if (obj.data && obj.type && (obj.type.toLowerCase().includes("font") || obj.name)) {
                
                // Clean up name (PDF fonts often have 6-letter random prefixes like XBCDFG+FontName)
                const rawName = obj.name || "Unknown_Font"
                const cleanName = rawName.includes("+") ? rawName.split("+")[1] : rawName
                
                // Check if the binary stream is heavily attached (PDF.js attaches raw data to embedded fonts)
                const isEmbedded = obj.data && obj.data.length > 0 && obj.data instanceof Uint8Array
                
                if (!foundFonts.has(cleanName)) {
                   foundFonts.set(cleanName, {
                      id: key,
                      name: cleanName,
                      type: obj.type || "Unknown Type",
                      isEmbedded: !!isEmbedded,
                      rawBuffer: isEmbedded ? obj.data : undefined
                   })
                }
             }
           })
        }

        extractFromRegistry(commonObjs)
        extractFromRegistry(objs)

        setProgress(Math.round((i / pdf.numPages) * 100))
      }

      setFonts(Array.from(foundFonts.values()))
      if (foundFonts.size === 0) {
        toast.info("No text-based fonts found in this document.")
      } else {
        toast.success(`Discovered ${foundFonts.size} fonts!`)
      }

    } catch (error) {
      console.error(error)
      toast.error("Failed to parse PDF metadata.")
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const handleDownload = (font: PdfFont) => {
    if (!font.isEmbedded || !font.rawBuffer) {
       toast.error("Cannot extract binary payload. Font is not cleanly embedded.")
       return
    }

    const blob = new Blob([font.rawBuffer as any], { type: "application/x-font-truetype" })
    setResultUrl(blob)
    
    const a = document.createElement("a")
    const tempUrl = URL.createObjectURL(blob)
    a.href = tempUrl
    const extension = font.type.toLowerCase().includes("type1") ? "pfb" : "ttf"
    a.download = `${font.name.replace(/\s+/g, "_")}.${extension}`
    a.click()
    URL.revokeObjectURL(tempUrl)
  }

  if (!file) {
    return (
      <ToolUploadLayout title="PDF Font Extractor" description="Analyze PDF structures to determine font names, matrix typings, and embedded binary states." icon={Type}>
        <DropZone onDrop={handleDrop} accept={{ "application/pdf": [".pdf"] }} label="Drop PDF here" />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout title="Discovery Table" description={file.name} icon={Search} centered={true} maxWidth="max-w-6xl">

      <div className="glass-panel rounded-3xl overflow-hidden border-amber-500/10 shadow-2xl">
         {isProcessing ? (
            <div className="w-full h-[400px] flex flex-col items-center justify-center bg-black/40">
               <RefreshCw className="w-10 h-10 animate-spin text-amber-500 mb-4" />
               <p className="font-mono text-sm text-white font-bold">Scanning PDF dictionaries...</p>
               <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden mt-4">
                  <div className="h-full bg-amber-500 transition-all" style={{ width: `${progress}%` }} />
               </div>
            </div>
         ) : (
            <>
               <div className="p-6 bg-amber-500/5 border-b border-white/5 flex items-start gap-4">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amger-100/80 leading-relaxed">
                     <span className="font-bold text-amber-400 block mb-1">Extraction Constraints</span>
                     This payload analyzer maps the internal AST nodes of the PDF reliably. However, embedded binary buffers are frequently specifically <strong className="text-white decoration-amber-500/50 underline underline-offset-2">subsetted</strong> by the original author (missing characters). Complete clean payloads are only exportable if the entire stream was attached at creation.
                  </div>
               </div>

               {fonts.length > 0 ? (
                 <div className="w-full overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                       <thead>
                          <tr className="bg-black/60 text-xs uppercase tracking-widest text-muted-foreground">
                             <th className="px-6 py-4 font-bold border-b border-white/5">Font Name</th>
                             <th className="px-6 py-4 font-bold border-b border-white/5">Subtype</th>
                             <th className="px-6 py-4 font-bold border-b border-white/5">State</th>
                             <th className="px-6 py-4 font-bold border-b border-white/5 text-right flex-shrink-0">Action</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                          {fonts.map((font) => (
                             <tr key={font.name} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4">
                                   <div className="font-bold text-white mb-1">{font.name}</div>
                                   <div className="text-[10px] font-mono text-muted-foreground">ID: {font.id}</div>
                                </td>
                                <td className="px-6 py-4">
                                   <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-[10px] uppercase font-bold tracking-widest rounded border border-amber-500/20">
                                      {font.type}
                                   </span>
                                </td>
                                <td className="px-6 py-4">
                                   {font.isEmbedded ? (
                                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                                         <CheckCircle className="w-4 h-4" /> Embedded
                                      </div>
                                   ) : (
                                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                         <XCircle className="w-4 h-4" /> Referenced (System)
                                      </div>
                                   )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                   {font.isEmbedded && font.rawBuffer ? (
                                      <button 
                                        onClick={() => handleDownload(font)}
                                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-black font-bold text-xs rounded-lg hover:bg-amber-400 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                                      >
                                        <Download className="w-3 h-3" /> Binary
                                      </button>
                                   ) : (
                                      <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50 italic mr-4">
                                         Unavailable
                                      </span>
                                   )}
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
               ) : (
                 <div className="w-full h-[300px] flex flex-col items-center justify-center bg-black/40 text-muted-foreground/50">
                    <Type className="w-12 h-12 mb-4 opacity-50" />
                    <p className="font-mono text-sm">No fonts discovered.</p>
                 </div>
               )}
            </>
         )}
      </div>
    </ToolLayout>
  )
}
