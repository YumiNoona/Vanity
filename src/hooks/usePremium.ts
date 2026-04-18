import { useState, useEffect } from "react"
import { toast } from "sonner"

const PREMIUM_KEY = "vanity_premium_status"

export function usePremium() {
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    const val = localStorage.getItem(PREMIUM_KEY)
    if (val === "true") setIsPremium(true)
  }, [])

  const upgrade = () => {
    localStorage.setItem(PREMIUM_KEY, "true")
    setIsPremium(true)
    toast.success("Welcome to Vanity Pro!")
  }

  const limits = {
    maxFiles: isPremium ? 100 : 5,
    maxSizeMB: isPremium ? 500 : 25,
  }

  const validateFiles = (files: File[], existingCount: number = 0) => {
    if (!isPremium && existingCount + files.length > limits.maxFiles) {
      toast.error(`Free limit reached. Max ${limits.maxFiles} files allowed.`, {
        description: "Upgrade to Pro for up to 100 files at once.",
        action: {
          label: "Upgrade",
          onClick: upgrade
        }
      })
      return false
    }

    const overSized = files.find(f => f.size > limits.maxSizeMB * 1024 * 1024)
    if (overSized) {
      toast.error(`File too large: ${overSized.name}`, {
        description: `Free users are limited to ${limits.maxSizeMB}MB per file.`
      })
      return false
    }

    return true
  }

  return { isPremium, upgrade, limits, validateFiles }
}
