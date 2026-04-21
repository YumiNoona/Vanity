import React from "react"
import { Link } from "react-router-dom"
import { KeyRound } from "lucide-react"
import { cn } from "@/lib/utils"

export function AIProviderHint({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-xs text-muted-foreground",
        className
      )}
    >
      <div className="flex items-center justify-center gap-2 text-center">
        <KeyRound className="w-4 h-4 text-primary shrink-0" />
        <p className="leading-relaxed">
          Add your API keys in{" "}
          <Link to="/tools/ai/providers" className="text-primary hover:underline font-semibold">
            Settings / AI Keys
          </Link>{" "}
          or use the built-in free tier automatically.
        </p>
      </div>
    </div>
  )
}
