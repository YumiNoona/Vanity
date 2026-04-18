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

/**
 * Manages Multiple Object URLs with automatic cleanup.
 */
export function useObjectUrls() {
  const [urls, setUrlsState] = useState<string[]>([])

  const setUrls = useCallback((blobs: (Blob | File)[]) => {
    setUrlsState(prev => {
      prev.forEach(u => URL.revokeObjectURL(u))
      return blobs.map(b => URL.createObjectURL(b))
    })
  }, [])

  const clear = useCallback(() => {
    setUrlsState(prev => {
      prev.forEach(u => URL.revokeObjectURL(u))
      return []
    })
  }, [])

  const addUrl = useCallback((blob: Blob | File) => {
    const url = URL.createObjectURL(blob)
    setUrlsState(prev => [...prev, url])
    return url
  }, [])

  const removeUrl = useCallback((url: string) => {
    URL.revokeObjectURL(url)
    setUrlsState(prev => prev.filter(u => u !== url))
  }, [])

  // Revoke on unmount
  useEffect(() => {
    return () => {
      setUrlsState(prev => {
        prev.forEach(u => URL.revokeObjectURL(u))
        return []
      })
    }
  }, [])

  return { urls, setUrls, addUrl, removeUrl, clear }
}
