import { useCallback } from "react"
import { downloadBlob } from "@/lib/canvas/export"

/**
 * Centralized download utility hook.
 * Wraps downloadBlob with a consistent naming pattern.
 */
export function useDownload() {
  const download = useCallback((blob: Blob, filename: string) => {
    downloadBlob(blob, filename)
  }, [])

  const downloadUrl = useCallback((url: string, filename: string) => {
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [])

  return { download, downloadUrl }
}
