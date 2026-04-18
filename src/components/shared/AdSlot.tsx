import React from "react"
import { Heart } from "lucide-react"

interface AdSlotProps {
  type: "sidebar" | "banner" | "in-feed"
  onDonateOpen?: () => void
}

export function AdSlot({ type, onDonateOpen }: AdSlotProps) {
  // If type is not banner, we don't show anything for now to keep the UI clean
  if (type !== "banner") return null

  return (
    <div className="flex items-center justify-center bg-white/5 border border-white/10 rounded overflow-hidden relative text-muted-foreground text-xs w-full h-[60px] md:h-[90px] mt-0 border-x-0 border-b-0 border-t">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
          <Heart className="h-4 w-4 fill-primary/20" />
        </div>
        <div className="flex flex-col text-left">
          <span className="font-bold text-foreground">Support Our Service</span>
          <span className="text-[10px]">If you like Vanity, please consider donating to keep it forever free.</span>
        </div>
        <button 
          onClick={onDonateOpen}
          className="ml-4 px-4 py-1.5 bg-primary text-primary-foreground rounded-full text-[10px] font-bold hover:scale-105 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
        >
          DONATE
        </button>
      </div>
      <span className="absolute top-1 right-3 text-[8px] opacity-30 uppercase tracking-[0.2em] font-bold">Support us</span>
    </div>
  )
}
