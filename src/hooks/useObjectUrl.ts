import { useState, useEffect, useCallback } from "react"

/**
 * Manages Object URLs with automatic cleanup to prevent memory leaks.
 * Call setUrl(blob) to create a new URL and auto-revoke the previous one.
 */
export function useObjectUrl() {
  const [url, setUrlState] = useState<string | null>(null)

  // Revoke previous URL whenever a new one is set
  const setUrl = useCallback((blobOrNull: Blob | null) => {
    setUrlState(prev => {
      if (prev) URL.revokeObjectURL(prev)
      if (!blobOrNull) return null
      return URL.createObjectURL(blobOrNull)
    })
  }, [])

  // Revoke on unmount
  useEffect(() => {
    return () => {
      setUrlState(prev => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    }
  }, [])

  const clear = useCallback(() => {
    setUrlState(prev => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
  }, [])

  return { url, setUrl, clear }
}
