import React from "react"
import { Link } from "react-router-dom"
import { usePremium } from "@/hooks/usePremium"
import { Zap } from "lucide-react"

export function Navbar() {
  const { isPremium, upgrade } = usePremium()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold font-syne text-primary">Vanity</span>
          </Link>
          <span className="hidden text-xs text-muted-foreground sm:inline-block">
            100% Free · No Signup
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {!isPremium ? (
            <button
              onClick={upgrade}
              className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors border border-primary/20 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]"
            >
              <Zap className="h-4 w-4" />
              Go Pro
            </button>
          ) : (
            <span className="flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-primary px-4 py-1.5 text-sm font-bold text-primary-foreground border border-primary/20 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              Pro Active
            </span>
          )}
        </div>
      </div>
    </header>
  )
}
