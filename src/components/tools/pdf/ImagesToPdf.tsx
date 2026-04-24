import React, { useState, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, Loader2, FileText, Trash2, ArrowUp, ArrowDown } from "lucide-react"
import { PDFDocument } from "pdf-lib"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"
import { downloadBlob } from "@/lib/canvas"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { Reorder } from "framer-motion"

import { useObjectUrls } from "@/hooks/useObjectUrl"

interface ImageFile {
  id: string
  file: File
  name: string
  previewUrl: string
}

export function ImagesToPdf() {
  const { limits, validateFiles } = usePremium()
  const { addUrl, removeUrl, clear: clearUrls } = useObjectUrls()
  const [images, setImages] = useState<ImageFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)

  const handleDrop = (files: File[]) => {
    if (!validateFiles(files, images.length)) return

    const newImages = files
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        name: file.name,
        previewUrl: addUrl(file),
      }))

    if (newImages.length === 0) {
      toast.error("Please upload image files only")
      return
    }

    setImages((prev) => [...prev, ...newImages])
  }

  const removeImage = (id: string) => {
    const img = images.find((i) => i.id === id)
    if (img) removeUrl(img.previewUrl)
    setImages((prev) => prev.filter((i) => i.id !== id))
  }

  const handleConvert = async () => {
    if (images.length === 0) return
    setIsProcessing(true)

    try {
      const pdfDoc = await PDFDocument.create()

      for (const img of images) {
        const arrayBuffer = await img.file.arrayBuffer()
        const uint8 = new Uint8Array(arrayBuffer)

        let pdfImage
        if (img.file.type === "image/png") {
          pdfImage = await pdfDoc.embedPng(uint8)
        } else {
          pdfImage = await pdfDoc.embedJpg(uint8)
        }

        const page = pdfDoc.addPage([pdfImage.width, pdfImage.height])
        page.drawImage(pdfImage, {
          x: 0,
          y: 0,
          width: pdfImage.width,
          height: pdfImage.height,
        })
      }

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" })
      setResultBlob(blob)
      toast.success(`Created PDF with ${images.length} pages!`)
    } catch (error: any) {
      console.error(error)
      toast.error("Failed to create PDF: " + (error?.message || "Unknown error"))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!resultBlob) return
    downloadBlob(resultBlob, `vanity-images-to-pdf-${Date.now()}.pdf`)
  }

  if (images.length === 0) {
    return (
      <ToolUploadLayout
        title="Images to PDF"
        description="Convert your images into a single PDF document. Supports JPG and PNG."
        icon={FileText}
      >
        <DropZone
          onDrop={handleDrop}
          accept={{ "image/jpeg": [], "image/png": [] }}
          maxFiles={limits.maxFiles}
          label="Drop images here (JPG, PNG)"
        />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout
      title="Images to PDF"
      description={`${images.length} images ready to convert`}
      icon={FileText}
      onBack={() => {
        clearUrls()
        setImages([])
        setResultBlob(null)
      }}
      maxWidth="max-w-4xl"
    >
      <DropZone
        onDrop={handleDrop}
        accept={{ "image/jpeg": [], "image/png": [] }}
        maxFiles={limits.maxFiles}
        label="Add more images"
      />

      <div className="glass-panel p-6 rounded-xl space-y-4">
        <h3 className="font-bold font-syne text-sm uppercase tracking-widest text-muted-foreground">
          Pages ({images.length})
        </h3>

        <Reorder.Group
          axis="y"
          values={images}
          onReorder={setImages}
          className="space-y-3"
        >
          {images.map((img) => (
            <Reorder.Item
              key={img.id}
              value={img}
              className="flex items-center gap-4 bg-white/5 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors cursor-grab active:cursor-grabbing group"
            >
              <img
                src={img.previewUrl}
                alt={img.name}
                className="w-12 h-12 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{img.name}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeImage(img.id)
                }}
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Reorder.Item>
          ))}
        </Reorder.Group>

        <div className="pt-4 flex justify-between items-center">
          <p className="text-xs text-muted-foreground italic">
            Drag to reorder pages
          </p>
          {!resultBlob ? (
            <button
              onClick={handleConvert}
              disabled={isProcessing}
              className="px-8 py-3 font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 rounded-lg shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all flex items-center gap-2"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
              {isProcessing ? "Converting..." : "Create PDF"}
            </button>
          ) : (
            <button
              onClick={handleDownload}
              className="px-8 py-3 font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all flex items-center gap-2"
            >
              <Download className="w-5 h-5" /> Export
            </button>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
