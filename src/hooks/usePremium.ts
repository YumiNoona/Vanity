import { useState, useEffect } from "react"

const PREMIUM_KEY = "vanity_premium_status"

export function usePremium() {
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    // Check localStorage in real implementation
    const val = localStorage.getItem(PREMIUM_KEY)
    if (val === "true") setIsPremium(true)
  }, [])

  const upgrade = () => {
    localStorage.setItem(PREMIUM_KEY, "true")
    setIsPremium(true)
    // Add real Lemonsqueezy checkout popout here
  }

  const limits = {
    maxFiles: isPremium ? 50 : 5,
    maxSizeMB: isPremium ? 100 : 10,
  }

  return { isPremium, upgrade, limits }
}
