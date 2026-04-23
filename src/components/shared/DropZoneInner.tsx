import React from "react"
import { useDropzone } from "react-dropzone"
import { UploadCloud } from "lucide-react"
import { cn } from "@/lib/utils"

interface DropZoneProps {
  onDrop: (files: File[]) => void
  accept?: Record<string, string[]>
  maxFiles?: number
  multiple?: boolean
  label?: string
}

export default function DropZoneInner({ onDrop, accept, maxFiles = 1, multiple = false, label = "Drop files here or click to browse" }: DropZoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: multiple ? undefined : maxFiles,
    multiple
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-all duration-200 mt-4",
        isDragActive
          ? "border-primary bg-primary/5 shadow-[0_0_30px_rgba(245,158,11,0.1)]"
          : "border-border/50 bg-card/50 hover:bg-white/[0.02] hover:border-primary/50"
      )}
    >
      <input {...getInputProps()} />
      <div className={cn("rounded-full p-4 mb-4 transition-colors", isDragActive ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground")}>
        <UploadCloud className="h-8 w-8" />
      </div>
      <p className="text-lg font-medium text-foreground mb-1 text-center">{label}</p>
      <p className="text-sm text-muted-foreground mb-4 text-center">
        {multiple ? "No limit · processed sequentially" : maxFiles > 1 ? `Up to ${maxFiles} files` : "Single file only"}
      </p>
      
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          Your files never leave your browser 🔒
        </span>
      </div>
    </div>
  )
}
