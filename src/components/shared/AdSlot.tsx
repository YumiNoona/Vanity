import React from "react"
import { usePremium } from "@/hooks/usePremium"

interface AdSlotProps {
  type: "sidebar" | "banner" | "in-feed"
}

export function AdSlot({ type }: AdSlotProps) {
  const { isPremium, upgrade } = usePremium()

  if (isPremium) return null

  // Mock ad display since this is ad-free premium environment by default
  const baseClasses = "flex items-center justify-center bg-white/5 border border-white/10 rounded overflow-hidden relative text-muted-foreground text-xs"

  if (type === "banner") {
    return (
      <div className={`${baseClasses} w-full h-[60px] md:h-[90px] mt-0 border-x-0 border-b-0 border-t`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary/20 animate-pulse" />
          <div className="flex flex-col text-left">
            <span className="font-bold text-foreground">Vanity Pro</span>
            <span className="text-[10px]">Remove ads and unlock 100+ file merging.</span>
          </div>
          <button onClick={upgrade} className="ml-4 px-3 py-1 bg-primary text-primary-foreground rounded text-[10px] font-bold">UPGRADE</button>
        </div>
        <span className="absolute top-1 left-3 text-[8px] opacity-30 uppercase tracking-widest font-bold">Promoted</span>
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
