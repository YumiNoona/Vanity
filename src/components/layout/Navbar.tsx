import React from "react"
import { Link } from "react-router-dom"
import { Heart, KeyRound } from "lucide-react"

interface NavbarProps {
  onDonateOpen: () => void
}

export function Navbar({ onDonateOpen }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full px-6 flex h-16 items-center justify-between">
        <div className="flex-1 flex items-center">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold font-syne text-primary">Vanity</span>
          </Link>
        </div>

        <div className="hidden md:flex flex-1 items-center justify-center">
          <span className="text-sm font-bold font-syne text-primary tracking-tight bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10">
            100% Free · No Signup
          </span>
        </div>
        
        <div className="flex-1 flex items-center justify-end">
          <Link
            to="/tools/ai/providers"
            className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-sm font-medium text-muted-foreground hover:bg-white/10 transition-colors border border-white/10 mr-2"
          >
            <KeyRound className="h-4 w-4" />
            AI Keys
          </Link>
          <button
            onClick={onDonateOpen}
            className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors border border-primary/20 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]"
          >
            <Heart className="h-4 w-4 fill-primary/20" />
            Support us
          </button>
        </div>
      </div>
    </header>
  )
}
