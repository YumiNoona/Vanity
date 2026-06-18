import React, { useState } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, Images, FileText, FileSearch, ShieldCheck, RefreshCw, Copy, CheckCircle, Trash2, Layers } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"
import { extractPdfText } from "@/lib/pdf-text"
import { useObjectUrl } from "@/hooks/useObjectUrl"
import { PillToggle } from "@/components/shared/PillToggle"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"
import { setupPdfWorker } from "@/lib/pdf-worker"
import { downloadBlob } from "@/lib/canvas/export"

type ExportMode = "images" | "text" | "word"

interface PdfFile {
  id: string
  file: File
  name: string
}

export function PdfExporter() {
  const { validateFiles } = usePremium()
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single")
  
  // Single mode state
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<ExportMode>("images")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()
  const [extractedText, setExtractedText] = useState<string>("")
  const { isCopied: copied, copy } = useCopyToClipboard()
  
  // Bulk mode state
  const [bulkFiles, setBulkFiles] = useState<PdfFile[]>([])
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)
  const [bulkResults, setBulkResults] = useState<{file: File, blob: Blob, text?: string}[]>([])
  const [bulkProgress, setBulkProgress] = useState(0)
  const [bulkMode, setBulkMode] = useState<ExportMode>("images")

  const resetState = () => {
    setIsProcessing(false)
    setProgress(0)
    setExtractedText("")
    clearResultUrl()
  }

  const handleDrop = async (files: File[]) => {
    if (activeTab === "bulk") {
      if (!validateFiles(files, bulkFiles.length)) return
      const newFiles = files.map(file => ({
        id: Math.random().toString(36).substring(7),
        file,
        name: file.name
      }))
      setBulkFiles(prev => [...prev, ...newFiles])
      setBulkResults([])
      setBulkProgress(0)
      return
    }

    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return
    setFile(uploadedFile)
    resetState()
  }

  const removeBulkFile = (id: string) => {
    setBulkFiles(prev => prev.filter(f => f.id !== id))
  }

  const changeMode = (newMode: ExportMode) => {
    if (isProcessing) return
    setMode(newMode)
    resetState()
  }

  const handleStartNew = () => {
    if (activeTab === "single") {
      setFile(null)
      resetState()
    } else {
      setBulkFiles([])
      setBulkResults([])
      setBulkProgress(0)
    }
  }

  const processToImages = async () => {
    if (!file) return
    setIsProcessing(true)
    setProgress(0)
    
    try {
      const pdfjsLib = await import("pdfjs-dist")
      const JSZipModule = await import("jszip")
      const JSZip = JSZipModule.default
      
      await setupPdfWorker()

      const arrayBuffer = await file.arrayBuffer()
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise
      const count = pdf.numPages
      setProgress(10)

      const zip = new JSZip()

      for (let i = 1; i <= count; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 2.0 })

        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d")!
        canvas.height = viewport.height
        canvas.width = viewport.width

        await page.render({
          canvasContext: context,
          viewport,
          canvas: canvas as any,
        }).promise

        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), "image/png")
        })

        zip.file(`page-${i}.png`, blob)
        setProgress(Math.floor((i / count) * 85) + 10)

        canvas.width = 0
        canvas.height = 0
      }

      const content = await zip.generateAsync({ type: "blob" })
      setResultUrl(content)
      setProgress(100)
      toast.success(`Converted ${count} pages to images!`)
      await pdf.destroy()
    } catch (error: any) {
      console.error(error)
      toast.error("Failed to convert PDF: " + (error?.message || "Unknown error"))
    } finally {
      setIsProcessing(false)
    }
  }

  const processToText = async () => {
    if (!file) return
    setIsProcessing(true)
    setProgress(0)
    try {
      const { fullText } = await extractPdfText(file, {
        includePageMarkers: true,
        onProgress: setProgress,
      })

      setExtractedText(fullText)
      setResultUrl(new Blob([fullText], { type: "text/plain" }))
      toast.success("Text extraction complete!")
    } catch (error) {
      console.error(error)
      toast.error("Failed to extract text from PDF.")
    } finally {
      setIsProcessing(false)
    }
  }

  const processToWord = async () => {
    if (!file) return
    setIsProcessing(true)
    setProgress(0)
    try {
      const pdfjsLib = await import("pdfjs-dist")
      const { Document, Packer, Paragraph, TextRun } = await import("docx")
      
      await setupPdfWorker()

      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const docParagraphs: any[] = []

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        
        const lines: Record<number, string[]> = {}
        textContent.items.forEach((item: any) => {
          const y = Math.round(item.transform[5])
          if (!lines[y]) lines[y] = []
          lines[y].push(item.str)
        })

        const sortedYs = Object.keys(lines).map(Number).sort((a, b) => b - a)
        
        sortedYs.forEach(y => {
          docParagraphs.push(new Paragraph({
            children: [new TextRun(lines[y].join(" "))],
          }))
        })

        if (i < pdf.numPages) {
          docParagraphs.push(new Paragraph({
             children: [new TextRun({ text: "", break: 1 })],
          }))
        }
        setProgress(Math.round((i / pdf.numPages) * 100))
      }

      const doc = new Document({
        sections: [{ properties: {}, children: docParagraphs }],
      })

      const blob = await Packer.toBlob(doc)
      setResultUrl(blob)
      toast.success("Conversion to .docx complete!")
      await pdf.destroy()
    } catch (error) {
      console.error(error)
      toast.error("Failed to convert PDF to Word.")
    } finally {
      setIsProcessing(false)
    }
  }

  const runExport = () => {
     if (mode === "images") processToImages()
     else if (mode === "text") processToText()
     else if (mode === "word") processToWord()
  }

  const handleDownload = () => {
    if (!resultUrl || !file) return
    const a = document.createElement("a")
    a.href = resultUrl
    
    if (mode === "images") a.download = `vanity-${file.name}-images.zip`
    else if (mode === "text") a.download = `vanity-${file.name}.txt`
    else if (mode === "word") a.download = `vanity-${file.name.replace(".pdf", "")}.docx`
    
    a.click()
  }

  const handleCopyText = () => {
    copy(extractedText, "Text copied to clipboard")
  }

  const processBulk = async () => {
    if (bulkFiles.length === 0) return
    setIsBulkProcessing(true)
    setBulkProgress(0)
    setBulkResults([])

    try {
      const results: {file: File, blob: Blob, text?: string}[] = []

      if (bulkMode === "images") {
        const pdfjsLib = await import("pdfjs-dist")
        const JSZipModule = await import("jszip")
        const JSZip = JSZipModule.default
        await setupPdfWorker()

        for (let i = 0; i < bulkFiles.length; i++) {
          const pdfItem = bulkFiles[i]
          const arrayBuffer = await pdfItem.file.arrayBuffer()
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
          const pdf = await loadingTask.promise
          const baseName = pdfItem.name.replace(/\.pdf$/i, '')

          const zip = new JSZip()
          for (let j = 1; j <= pdf.numPages; j++) {
            const page = await pdf.getPage(j)
            const viewport = page.getViewport({ scale: 2.0 })
            const canvas = document.createElement("canvas")
            const context = canvas.getContext("2d")!
            canvas.height = viewport.height
            canvas.width = viewport.width

            await page.render({
              canvasContext: context,
              viewport,
              canvas: canvas as any,
            }).promise

            const blob = await new Promise<Blob>((resolve) => {
              canvas.toBlob((b) => resolve(b!), "image/png")
            })
            zip.file(`${baseName}-page-${j}.png`, blob)
          }

          const content = await zip.generateAsync({ type: "blob" })
          results.push({ file: pdfItem.file, blob: content })
          setBulkProgress(Math.round(((i + 1) / bulkFiles.length) * 100))
          await pdf.destroy()
        }
      } else if (bulkMode === "text") {
        for (let i = 0; i < bulkFiles.length; i++) {
          const pdfItem = bulkFiles[i]
          const { fullText } = await extractPdfText(pdfItem.file, {
            includePageMarkers: true
          })
          const blob = new Blob([fullText], { type: "text/plain" })
          results.push({ file: pdfItem.file, blob, text: fullText })
          setBulkProgress(Math.round(((i + 1) / bulkFiles.length) * 100))
        }
      } else if (bulkMode === "word") {
        const pdfjsLib = await import("pdfjs-dist")
        const { Document, Packer, Paragraph, TextRun } = await import("docx")
        await setupPdfWorker()

        for (let i = 0; i < bulkFiles.length; i++) {
          const pdfItem = bulkFiles[i]
          const arrayBuffer = await pdfItem.file.arrayBuffer()
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
          const docParagraphs: any[] = []

          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum)
            const textContent = await page.getTextContent()
            
            const lines: Record<number, string[]> = {}
            textContent.items.forEach((item: any) => {
              const y = Math.round(item.transform[5])
              if (!lines[y]) lines[y] = []
              lines[y].push(item.str)
            })

            const sortedYs = Object.keys(lines).map(Number).sort((a, b) => b - a)
            
            sortedYs.forEach(y => {
              docParagraphs.push(new Paragraph({
                children: [new TextRun(lines[y].join(" "))],
              }))
            })

            if (pageNum < pdf.numPages) {
              docParagraphs.push(new Paragraph({
                children: [new TextRun({ text: "", break: 1 })],
              }))
            }
          }

          const doc = new Document({
            sections: [{ properties: {}, children: docParagraphs }],
          })
          const blob = await Packer.toBlob(doc)
          results.push({ file: pdfItem.file, blob })
          setBulkProgress(Math.round(((i + 1) / bulkFiles.length) * 100))
          await pdf.destroy()
        }
      }

      setBulkResults(results)
      toast.success(`Successfully processed ${bulkFiles.length} files!`)
    } catch (error: any) {
      console.error(error)
      toast.error("Failed to process PDFs: " + (error?.message || "Unknown error"))
    } finally {
      setIsBulkProcessing(false)
    }
  }

  const handleBulkDownloadZip = async () => {
    if (bulkResults.length === 0) return
    const JSZipModule = await import("jszip")
    const JSZip = JSZipModule.default
    const zip = new JSZip()
    
    bulkResults.forEach(res => {
      const baseName = res.file.name.replace(/\.pdf$/i, '')
      if (bulkMode === "images") {
        zip.file(`${baseName}-images.zip`, res.blob)
      } else if (bulkMode === "text") {
        zip.file(`${baseName}.txt`, res.blob)
      } else if (bulkMode === "word") {
        zip.file(`${baseName}.docx`, res.blob)
      }
    })

    const content = await zip.generateAsync({ type: "blob" })
    downloadBlob(content, "vanity-pdf-exports.zip")
  }

  const renderTabSwitcher = () => (
    <div className="mb-10 flex justify-center">
      <PillToggle
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as any)}
        options={[
          { id: "single", label: "Single PDF", icon: FileSearch },
          { id: "bulk", label: "Bulk PDF", icon: Layers }
        ]}
      />
    </div>
  )

  if (activeTab === "single" && !file) {
    return (
      <ToolUploadLayout 
        title="PDF Exporter Suite" 
        description="Extract contents from your PDF document securely in your browser." 
        icon={FileSearch}
      >
        {renderTabSwitcher()}
        <DropZone onDrop={handleDrop} accept={{ "application/pdf": [".pdf"] }} label="Drop PDF here" />
      </ToolUploadLayout>
    )
  }

  if (activeTab === "bulk" && bulkFiles.length === 0) {
    return (
      <ToolUploadLayout 
        title="Bulk PDF Exporter" 
        description="Process multiple PDFs at once to images, text, or Word documents." 
        icon={Layers}
      >
        {renderTabSwitcher()}
        <DropZone onDrop={handleDrop} accept={{ "application/pdf": [".pdf"] }} label="Drop multiple PDFs" multiple />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout 
      title={activeTab === "single" ? "Export Hub" : "Bulk Export Hub"}
      description={activeTab === "single" ? (file?.name || "") : `Processing ${bulkFiles.length} files`}
      icon={activeTab === "single" ? FileSearch : Layers}
      centered={true}
      maxWidth="max-w-7xl"
    >
      <div className="mb-10 flex justify-center">
        <PillToggle
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as any)}
          options={[
            { id: "single", label: "Single PDF", icon: FileSearch },
            { id: "bulk", label: "Bulk PDF", icon: Layers }
          ]}
        />
      </div>

      {activeTab === "single" ? (
        <>
          <PillToggle
            activeId={mode}
            onChange={(id) => changeMode(id as ExportMode)}
            options={[
              { id: "images", label: "Images (ZIP)", icon: Images },
              { id: "text", label: "Text (TXT)", icon: FileText },
              { id: "word", label: "Word (DOCX)", icon: FileSearch }
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
            <div className="lg:col-span-8">
              <div className="glass-panel p-8 rounded-[2rem] flex flex-col items-center justify-center min-h-[500px] bg-black/40 border-white/5 shadow-2xl relative overflow-hidden">
                
                {!isProcessing && !resultUrl && !extractedText ? (
                  <div className="text-center space-y-4">
                    <p className="text-muted-foreground">Ready to export as <strong>{mode.toUpperCase()}</strong>.</p>
                    <button 
                      onClick={runExport}
                      className="px-8 py-5 bg-accent text-accent-foreground font-bold rounded-2xl shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all text-lg mx-auto block"
                    >
                      Start Extraction
                    </button>
                  </div>
                ) : isProcessing ? (
                  <div className="space-y-6 text-center z-10 w-full max-w-sm">
                    <div className="relative inline-block">
                      <RefreshCw className="w-20 h-20 text-accent animate-spin opacity-20 mx-auto" />
                      <div className="absolute inset-0 flex items-center justify-center font-mono text-xl font-bold text-accent">
                        {progress}%
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-lg font-bold text-white font-syne tracking-tight">
                        {mode === "images" && "Rendering Pages..."}
                        {mode === "text" && "Extracting Text..."}
                        {mode === "word" && "Mapping Layout..."}
                      </p>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-4">
                        <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>
                ) : null}

                {mode === "images" && resultUrl && !isProcessing && (
                  <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
                    <div className="inline-flex items-center justify-center p-8 bg-white/5 rounded-full mb-2">
                       <Images className="w-20 h-20 text-accent opacity-50" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold font-syne text-white">Export Complete!</h2>
                      <p className="text-muted-foreground mt-2">All pages have been compressed into a ZIP file.</p>
                    </div>
                  </div>
                )}

                {mode === "text" && extractedText && !isProcessing && (
                  <textarea 
                    value={extractedText}
                    readOnly
                    className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] bg-transparent border-none outline-none font-mono text-xs leading-relaxed text-white/70 resize-none scrollbar-thin scrollbar-thumb-white/10"
                  />
                )}

                {mode === "word" && resultUrl && !isProcessing && (
                  <div className="text-center z-10 animate-in zoom-in-95 duration-500">
                    <div className="p-6 bg-accent/10 rounded-full inline-block text-accent border border-accent/20 mb-6">
                      <ShieldCheck className="w-16 h-16" />
                    </div>
                    <h2 className="text-4xl font-bold font-syne text-white mb-2">Docx Export Ready</h2>
                    <p className="text-muted-foreground mx-auto text-sm">
                      Verification of structure complete. Download below.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="glass-panel p-8 rounded-2xl space-y-8 border-white/10">
                {mode === "text" && extractedText && (
                  <div className="space-y-4 mb-6 pb-6 border-b border-white/10">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Stats</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Characters</span>
                        <span className="text-sm font-mono text-white font-bold">{extractedText.length}</span>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Words</span>
                        <span className="text-sm font-mono text-white font-bold">{extractedText.split(/\s+/).length}</span>
                      </div>
                    </div>
                    <button 
                      onClick={handleCopyText}
                      className="w-full mt-4 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      Copy to Clipboard
                    </button>
                  </div>
                )}

                <div className="space-y-3">
                  <button 
                    onClick={handleDownload}
                    disabled={!resultUrl || isProcessing}
                    className="w-full py-5 bg-accent text-accent-foreground font-bold rounded-2xl shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                  >
                    <Download className="w-5 h-5" /> Export{mode === "text" ? ".txt File" : mode === "word" ? ".docx File" : "ZIP Bundle"}
                  </button>
                  
                  {(resultUrl || extractedText) && !isProcessing && (
                    <button 
                      onClick={handleStartNew}
                      className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all flex items-center justify-center"
                    >
                      Start New
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-accent/5 border border-accent/10 flex items-start gap-4">
                <ShieldCheck className="w-6 h-6 text-accent shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-sm text-white">100% Client-Side</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Your PDF never leaves your device. All parsing, GPU rendering, and zipping happens securely inside your browser Sandbox using Memory-Safe buffers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="glass-panel p-8 rounded-[2rem] space-y-6 bg-black/40 border-white/5 shadow-2xl">
              {isBulkProcessing && (
                <div className="p-6 bg-accent/10 border-b border-accent/20 text-accent rounded-2xl">
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <div className="flex justify-between w-full text-[10px] font-bold">
                      <span>PROCESSING PDFS...</span>
                      <span>{bulkProgress}%</span>
                    </div>
                  </div>
                </div>
              )}

              {bulkResults.length > 0 && !isBulkProcessing ? (
                <div className="text-center space-y-6">
                  <div className="inline-flex items-center justify-center p-8 bg-white/5 rounded-2xl mb-2">
                     <Images className="w-20 h-20 text-accent opacity-50" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold font-syne">{bulkFiles.length} Files Processed</h2>
                    <p className="text-muted-foreground mt-2">All files are ready for download in a single ZIP.</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button 
                      onClick={handleBulkDownloadZip}
                      className="px-8 py-4 text-lg font-bold bg-accent text-accent-foreground hover:bg-accent/90 rounded-full shadow-[0_0_30px_rgba(252,211,77,0.3)] transition-all flex items-center justify-center gap-3 hover:scale-105"
                    >
                      <Download className="w-6 h-6" /> Download All
                    </button>
                    <button 
                      onClick={handleStartNew}
                      className="px-8 py-4 text-lg font-bold bg-white/5 hover:bg-white/10 text-white rounded-full border border-white/10 transition-all flex items-center justify-center"
                    >
                      Start New
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <PillToggle
                    activeId={bulkMode}
                    onChange={(id) => setBulkMode(id as ExportMode)}
                    options={[
                      { id: "images", label: "Images", icon: Images },
                      { id: "text", label: "Text", icon: FileText },
                      { id: "word", label: "Word", icon: FileSearch }
                    ]}
                  />

                  <h3 className="font-bold font-syne flex items-center gap-2 border-b border-border/50 pb-4">
                    <FileText className="w-5 h-5 text-accent" />
                    Files to Process ({bulkFiles.length})
                  </h3>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {bulkFiles.map((pdf) => (
                      <div key={pdf.id} className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                        <span className="text-sm truncate">{pdf.name}</span>
                        {!isBulkProcessing && (
                          <button onClick={() => removeBulkFile(pdf.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={processBulk}
                    disabled={isBulkProcessing || bulkFiles.length === 0}
                    className="w-full px-8 py-4 font-bold bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-[0_0_20px_rgba(252,211,77,0.2)] transition-all flex items-center justify-center gap-2"
                  >
                    {isBulkProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                    {isBulkProcessing ? "Processing PDFs..." : "Process PDFs Now"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
