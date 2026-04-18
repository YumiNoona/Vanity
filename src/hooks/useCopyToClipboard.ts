import { useState, useCallback, useEffect, useRef } from "react"
import { toast } from "sonner"

/**
 * A hook to handle copy-to-clipboard logic with automatic state cleanup.
 */
export function useCopyToClipboard(timeout = 2000) {
  const [isCopied, setIsCopied] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const copy = useCallback(
    async (text: string, successMessage = "Copied to clipboard!") => {
      try {
        await navigator.clipboard.writeText(text)
        setIsCopied(true)
        if (successMessage) {
          toast.success(successMessage)
        }

        if (timerRef.current) clearTimeout(timerRef.current)
        
        timerRef.current = setTimeout(() => {
          setIsCopied(false)
        }, timeout)
      } catch (err) {
        console.error("Failed to copy text: ", err)
        toast.error("Failed to copy to clipboard")
        setIsCopied(false)
      }
    },
    [timeout]
  )

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { isCopied, copy }
}
