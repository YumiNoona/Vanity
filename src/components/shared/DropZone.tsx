import React, { lazy, Suspense } from "react"
import { UploadCloud } from "lucide-react"

const DropZoneInner = lazy(() => import("./DropZoneInner"))

interface DropZoneProps {
  onDrop: (files: File[]) => void
  accept?: Record<string, string[]>
  maxFiles?: number
  multiple?: boolean
  label?: string
}

export function DropZone(props: DropZoneProps) {
  return (
    <Suspense fallback={
      <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 mt-4 border-border/50 bg-card/50">
        <div className="rounded-full p-4 mb-4 bg-white/5 text-muted-foreground animate-pulse">
          <UploadCloud className="h-8 w-8" />
        </div>
        <div className="h-6 w-48 bg-white/5 rounded mb-1 animate-pulse" />
        <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
      </div>
    }>
      <DropZoneInner {...props} />
    </Suspense>
  )
}
