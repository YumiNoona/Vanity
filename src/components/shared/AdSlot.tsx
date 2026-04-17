import React from "react"
import { usePremium } from "@/hooks/usePremium"

interface AdSlotProps {
  type: "sidebar" | "banner" | "in-feed"
}

export function AdSlot({ type }: AdSlotProps) {
  const { isPremium } = usePremium()

  if (isPremium) return null

  // Mock ad display since this is ad-free premium environment by default
  const baseClasses = "flex items-center justify-center bg-white/5 border border-white/10 rounded overflow-hidden relative text-muted-foreground text-xs"

  if (type === "banner") {
    return (
      <div className={`${baseClasses} w-full h-[90px] my-4`}>
        <span className="absolute top-1 left-1 text-[10px] opacity-50">Advertisement</span>
        Google AdSense Banner (728x90)
      </div>
    )
  }

  if (type === "sidebar") {
    return (
      <div className={`${baseClasses} w-[300px] h-[250px] my-4`}>
        <span className="absolute top-1 left-1 text-[10px] opacity-50">Advertisement</span>
        Google AdSense Rectangle (300x250)
      </div>
    )
  }

  return (
    <div className={`${baseClasses} w-full h-[120px] my-4`}>
      <span className="absolute top-1 left-1 text-[10px] opacity-50">Advertisement</span>
      Google AdSense In-Feed
    </div>
  )
}
