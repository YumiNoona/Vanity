import { useState, useCallback, useEffect, useRef } from "react"
import { toast } from "sonner"

/**
 * A hook to handle copy-to-clipboard logic with automatic state cleanup.
 */
export function useCopyToClipboard(timeout = 2000) {
  const [copiedId, setCopiedId] = useState<string | boolean>(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const copy = useCallback(
    async (text: string, idOrMessage: string | boolean = "Copied to clipboard!", successMessage?: string) => {
      try {
        await navigator.clipboard.writeText(text)
        
        // If second arg is a string but not the default success message, it might be an ID
        const isId = typeof idOrMessage === "string" && idOrMessage !== "Copied to clipboard!" && !successMessage
        
        setCopiedId(isId ? idOrMessage : true)
        
        const messageToShow = successMessage || (typeof idOrMessage === "string" ? idOrMessage : "Copied to clipboard!")
        
        if (messageToShow !== "none" && !isId) {
          toast.success(messageToShow)
        } else if (isId && successMessage) {
           toast.success(successMessage)
        } else if (!isId && typeof idOrMessage === "string") {
           toast.success(idOrMessage)
        }

        if (timerRef.current) clearTimeout(timerRef.current)
        
        timerRef.current = setTimeout(() => {
          setCopiedId(false)
        }, timeout)
      } catch (err) {
        console.error("Failed to copy text: ", err)
        toast.error("Failed to copy to clipboard")
        setCopiedId(false)
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

  return { isCopied: copiedId, copiedId, copy }
}
