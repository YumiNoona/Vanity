import React, { useState, useEffect, useRef } from "react"
import { DropZone } from "@/components/shared/DropZone"
import {
  Download,
  ArrowLeft,
  Loader2,
  Type,
  PenTool,
  Highlighter,
  Trash2,
  Plus,
  FileEdit,
} from "lucide-react"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"
import { downloadBlob } from "@/lib/canvas"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"

interface TextAnnotation {
  id: string
  text: string
  x: number
  y: number
  pageIndex: number
  fontSize: number
  color: string
}

interface DrawStroke {
  id: string
  points: { x: number; y: number }[]
  pageIndex: number
  color: string
  width: number
  type: "pen" | "highlight"
}

export function PdfEditor() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [pageImages, setPageImages] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)

  // Annotations
  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([])
  const [drawStrokes, setDrawStrokes] = useState<DrawStroke[]>([])
  const [activeTool, setActiveTool] = useState<"text" | "pen" | "highlight" | null>(null)
  const [newText, setNewText] = useState("")
  const [penColor, setPenColor] = useState("#F59E0B")
  const [fontSize, setFontSize] = useState(16)

  // Drawing state
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([])

  // Cleanup page image URLs on unmount
  useEffect(() => {
    return () => {
      pageImages.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return

    setFile(uploadedFile)
    setIsProcessing(true)
    setProgress(5)
    setTextAnnotations([])
    setDrawStrokes([])
    setResultBlob(null)

    try {
      const pdfjs = await import("pdfjs-dist")
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

      const arrayBuffer = await uploadedFile.arrayBuffer()
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
      const count = pdf.numPages
      setProgress(15)

      const images: string[] = []

      for (let i = 1; i <= count; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 1.5 })
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")!
        canvas.width = viewport.width
        canvas.height = viewport.height

        await page.render({
          canvasContext: ctx,
          viewport,
          // @ts-ignore — pdfjs types require canvas but it's optional at runtime
          canvas: canvas,
        }).promise

        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), "image/png")
        )
        images.push(URL.createObjectURL(blob))

        canvas.width = 0
        canvas.height = 0
        setProgress(15 + Math.floor((i / count) * 80))
      }

      setPageImages(images)
      setProgress(100)
      toast.success(`Loaded ${count} pages for editing`)
    } catch (error: any) {
      console.error(error)
      toast.error("Failed to load PDF: " + (error?.message || "Unknown error"))
    } finally {
      setIsProcessing(false)
    }
  }

  const addTextAnnotation = () => {
    if (!newText.trim()) return
    const annotation: TextAnnotation = {
      id: Date.now().toString(),
      text: newText,
      x: 50,
      y: 50,
      pageIndex: currentPage,
      fontSize,
      color: penColor,
    }
    setTextAnnotations([...textAnnotations, annotation])
    setNewText("")
    toast.success("Text added to page " + (currentPage + 1))
  }

  const removeAnnotation = (id: string) => {
    setTextAnnotations(textAnnotations.filter((a) => a.id !== id))
  }

  // Canvas drawing
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (activeTool !== "pen" && activeTool !== "highlight") return
    setIsDrawing(true)
    const rect = canvasRef.current!.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setCurrentStroke([{ x, y }])
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setCurrentStroke((prev) => [...prev, { x, y }])

    // Draw live
    const ctx = canvasRef.current.getContext("2d")!
    const pts = currentStroke
    if (pts.length < 2) return
    ctx.beginPath()
    ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y)
    ctx.lineTo(x, y)
    ctx.strokeStyle = activeTool === "highlight" ? penColor + "66" : penColor
    ctx.lineWidth = activeTool === "highlight" ? 20 : 2
    ctx.lineCap = "round"
    ctx.stroke()
  }

  const handleCanvasMouseUp = () => {
    if (!isDrawing) return
    setIsDrawing(false)

    if (currentStroke.length > 1) {
      const stroke: DrawStroke = {
        id: Date.now().toString(),
        points: currentStroke,
        pageIndex: currentPage,
        color: penColor,
        width: activeTool === "highlight" ? 20 : 2,
        type: activeTool as "pen" | "highlight",
      }
      setDrawStrokes([...drawStrokes, stroke])
    }
    setCurrentStroke([])
  }

  // Redraw canvas overlay whenever page changes
  useEffect(() => {
    if (!canvasRef.current || !pageImages[currentPage]) return
    const canvas = canvasRef.current
    const img = new Image()
    img.src = pageImages[currentPage]
    img.onload = () => {
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext("2d")!
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Redraw strokes for this page
      drawStrokes
        .filter((s) => s.pageIndex === currentPage)
        .forEach((stroke) => {
          ctx.beginPath()
          ctx.strokeStyle =
            stroke.type === "highlight" ? stroke.color + "66" : stroke.color
          ctx.lineWidth = stroke.width
          ctx.lineCap = "round"
          stroke.points.forEach((pt, i) => {
            if (i === 0) ctx.moveTo(pt.x, pt.y)
            else ctx.lineTo(pt.x, pt.y)
          })
          ctx.stroke()
        })
    }
  }, [currentPage, pageImages, drawStrokes])

  const handleExport = async () => {
    if (!file) return
    setIsProcessing(true)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

      // Apply text annotations
      textAnnotations.forEach((ann) => {
        const page = pdfDoc.getPages()[ann.pageIndex]
        if (!page) return
        const { height } = page.getSize()
        const r = parseInt(ann.color.slice(1, 3), 16) / 255
        const g = parseInt(ann.color.slice(3, 5), 16) / 255
        const b = parseInt(ann.color.slice(5, 7), 16) / 255

        page.drawText(ann.text, {
          x: ann.x,
          y: height - ann.y - ann.fontSize,
          size: ann.fontSize,
          font,
          color: rgb(r, g, b),
        })
      })

      // Apply draw strokes as line segments
      drawStrokes.forEach((stroke) => {
        const page = pdfDoc.getPages()[stroke.pageIndex]
        if (!page) return
        const { height } = page.getSize()
        const r = parseInt(stroke.color.slice(1, 3), 16) / 255
        const g = parseInt(stroke.color.slice(3, 5), 16) / 255
        const b = parseInt(stroke.color.slice(5, 7), 16) / 255

        // Scale factor: page images were rendered at 1.5x
        const scaleFactor = 1 / 1.5

        for (let i = 1; i < stroke.points.length; i++) {
          const start = stroke.points[i - 1]
          const end = stroke.points[i]
          page.drawLine({
            start: { x: start.x * scaleFactor, y: height - start.y * scaleFactor },
            end: { x: end.x * scaleFactor, y: height - end.y * scaleFactor },
            thickness: stroke.width * scaleFactor,
            color: rgb(r, g, b),
            opacity: stroke.type === "highlight" ? 0.4 : 1,
          })
        }
      })

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" })
      setResultBlob(blob)
      toast.success("PDF exported with annotations!")
    } catch (error: any) {
      console.error(error)
      toast.error("Export failed: " + (error?.message || "Unknown error"))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!resultBlob) return
    downloadBlob(resultBlob, `vanity-edited-${file?.name || "document.pdf"}`)
  }

  if (!file) {
    return (
      <ToolUploadLayout
        title="PDF Editor Lite"
        description="Add text, signatures, and highlights to your PDFs. 100% local processing."
        icon={FileEdit}
      >
        <DropZone
          onDrop={handleDrop}
          accept={{ "application/pdf": [] }}
          label="Drop PDF here"
        />
      </ToolUploadLayout>
    )
  }

  const currentAnnotations = textAnnotations.filter(
    (a) => a.pageIndex === currentPage
  )

  return (
    <ToolLayout
      title="PDF Editor"
      description={`Editing: ${file.name} — Page ${currentPage + 1} of ${pageImages.length}`}
      icon={FileEdit}
      onBack={() => {
        pageImages.forEach((url) => URL.revokeObjectURL(url))
        setFile(null)
        setPageImages([])
        setTextAnnotations([])
        setDrawStrokes([])
        setResultBlob(null)
      }}
      maxWidth="max-w-7xl"
    >
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 pb-20">
        {/* Toolbar */}
        <div className="xl:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-xl space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Tools
            </h3>

            <div className="flex gap-2">
              {[
                { id: "text" as const, icon: Type, label: "Text" },
                { id: "pen" as const, icon: PenTool, label: "Pen" },
                { id: "highlight" as const, icon: Highlighter, label: "Highlight" },
              ].map((tool) => (
                <button
                  key={tool.id}
                  onClick={() =>
                    setActiveTool(activeTool === tool.id ? null : tool.id)
                  }
                  className={`flex-1 flex flex-col items-center py-3 rounded-lg transition-all ${
                    activeTool === tool.id
                      ? "bg-primary text-primary-foreground font-bold shadow-lg"
                      : "bg-white/5 hover:bg-white/10 text-muted-foreground"
                  }`}
                >
                  <tool.icon className="w-5 h-5 mb-1" />
                  <span className="text-[10px] uppercase font-bold tracking-tighter">
                    {tool.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Text tool options */}
            {activeTool === "text" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <input
                  type="text"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Enter text..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none"
                />
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={penColor}
                    onChange={(e) => setPenColor(e.target.value)}
                    className="w-10 h-10 bg-transparent border-none cursor-pointer"
                  />
                  <input
                    type="number"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    min={8}
                    max={72}
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 text-sm outline-none"
                  />
                </div>
                <button
                  onClick={addTextAnnotation}
                  disabled={!newText.trim()}
                  className="w-full py-3 bg-white/5 border border-dashed border-white/20 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" /> Add to Page
                </button>
              </div>
            )}

            {/* Pen/Highlight color */}
            {(activeTool === "pen" || activeTool === "highlight") && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">
                  Color
                </label>
                <div className="flex gap-2">
                  {["#F59E0B", "#EF4444", "#10B981", "#3B82F6", "#8B5CF6", "#000000"].map(
                    (c) => (
                      <button
                        key={c}
                        onClick={() => setPenColor(c)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          penColor === c
                            ? "border-white scale-110"
                            : "border-transparent"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    )
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Draw directly on the page preview. Strokes are applied to the
                  output PDF.
                </p>
              </div>
            )}

            {/* Annotations list */}
            {currentAnnotations.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-white/10">
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground">
                  Text on this page
                </h4>
                {currentAnnotations.map((ann) => (
                  <div
                    key={ann.id}
                    className="flex items-center justify-between bg-white/5 p-2 rounded-lg"
                  >
                    <span className="text-xs truncate flex-1">{ann.text}</span>
                    <button
                      onClick={() => removeAnnotation(ann.id)}
                      className="p-1 hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Export */}
          <div className="glass-panel p-6 rounded-xl space-y-4">
            {!resultBlob ? (
              <button
                onClick={handleExport}
                disabled={
                  isProcessing ||
                  (textAnnotations.length === 0 && drawStrokes.length === 0)
                }
                className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                Export Annotated PDF
              </button>
            ) : (
              <button
                onClick={handleDownload}
                className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:scale-[1.02] transition-all"
              >
                <Download className="w-5 h-5" /> Download PDF
              </button>
            )}
          </div>
        </div>

        {/* Page Preview */}
        <div className="xl:col-span-3 glass-panel p-4 rounded-2xl bg-[#050505] min-h-[650px] relative overflow-auto">
          {isProcessing && progress < 100 && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur z-30 flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <h3 className="text-xl font-bold font-syne text-white">
                {progress > 15
                  ? `Rendering Pages: ${progress}%`
                  : "Loading PDF Engine..."}
              </h3>
              <div className="w-64 h-1.5 bg-white/10 rounded-full mt-4 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {pageImages[currentPage] && (
            <div className="relative flex items-center justify-center">
              <img
                src={pageImages[currentPage]}
                alt={`Page ${currentPage + 1}`}
                className="max-w-full rounded shadow-2xl"
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full rounded"
                style={{
                  cursor:
                    activeTool === "pen" || activeTool === "highlight"
                      ? "crosshair"
                      : "default",
                }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
              />

              {/* Text annotations overlay */}
              {currentAnnotations.map((ann) => (
                <div
                  key={ann.id}
                  className="absolute cursor-move select-none"
                  style={{
                    left: ann.x,
                    top: ann.y,
                    fontSize: ann.fontSize,
                    color: ann.color,
                    fontFamily: "Helvetica, Arial, sans-serif",
                    textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                  }}
                >
                  {ann.text}
                </div>
              ))}
            </div>
          )}

          {/* Page navigation */}
          {pageImages.length > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {pageImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                    currentPage === i
                      ? "bg-primary text-primary-foreground"
                      : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
