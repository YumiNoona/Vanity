import { useCallback } from "react"
import { downloadBlob as _downloadBlob } from "@/lib/canvas/export"

/**
 * Centralized download utility hook.
 * Wraps downloadBlob with a consistent naming pattern, and supports string payload.
 */
export function useDownload() {
  const download = useCallback((content: Blob | string, filename: string, mimeType = "text/plain") => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType })
    _downloadBlob(blob, filename)
  }, [])

  const downloadUrl = useCallback((url: string, filename: string) => {
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }, [])

  return { download, downloadUrl }
}
