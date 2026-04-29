import React from "react"
import { ArrowLeft, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ToolLayoutProps {
  title: string
  description: string
  icon?: LucideIcon
  iconColor?: "primary" | "accent"
  children: React.ReactNode
  backLabel?: string
  onBack?: () => void
  maxWidth?: string
  hideHeader?: boolean
  centered?: boolean
}

export const ToolLayout = React.memo(function ToolLayout({
  title,
  description,
  icon: Icon,
  iconColor = "primary",
  children,
  backLabel,
  onBack,
  maxWidth = "max-w-4xl",
  hideHeader = false,
  centered = false,
}: ToolLayoutProps) {
  const colorMap = {
    primary: {
      bg: "bg-primary/10",
      text: "text-primary",
    },
    accent: {
      bg: "bg-accent/10",
      text: "text-accent",
    },
  }

  const colors = colorMap[iconColor]

  return (
    <div className={cn(maxWidth, "mx-auto space-y-8", centered && "text-center")}>
      {!hideHeader && (
        <div className={cn("mt-4 flex", centered ? "flex-col items-center gap-6" : "items-center justify-between")}>
          <div className={cn("flex items-center", centered ? "flex-col gap-4" : "gap-4")}>
            {Icon && (
              <div className={`inline-flex items-center justify-center p-3 ${colors.bg} rounded-full ${colors.text}`}>
                <Icon className={centered ? "w-8 h-8" : "w-6 h-6"} />
              </div>
            )}
            <div className={centered ? "text-center" : ""}>
              <h1 className={cn("font-bold font-syne mb-1", centered ? "text-4xl" : "text-3xl")}>{title}</h1>
              <p className="text-muted-foreground text-sm">{description}</p>
            </div>
          </div>

          {onBack && (
            <button
              onClick={onBack}
              className={cn(
                "text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors",
                centered && "mt-2"
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              {backLabel || "Start New"}
            </button>
          )}
        </div>
      )}

      {children}
    </div>
  )
})

/**
 * ToolLayout for the initial "upload" state of a tool.
 * Centered layout with icon, title, description, and a slot for DropZone.
 */
interface ToolUploadLayoutProps {
  title: string
  description: string
  icon: LucideIcon
  iconColor?: "primary" | "accent"
  children: React.ReactNode
  hideHeader?: boolean
}

export const ToolUploadLayout = React.memo(function ToolUploadLayout({
  title,
  description,
  icon: Icon,
  iconColor = "primary",
  children,
  hideHeader = false,
}: ToolUploadLayoutProps) {
  const colorMap = {
    primary: {
      bg: "bg-primary/10",
      text: "text-primary",
    },
    accent: {
      bg: "bg-accent/10",
      text: "text-accent",
    },
  }

  const colors = colorMap[iconColor]

  return (
    <div className={cn("mx-auto py-12 text-center", hideHeader ? "max-w-full" : "max-w-2xl")}>
      {!hideHeader && (
        <>
          <div className={`inline-flex items-center justify-center p-3 ${colors.bg} rounded-full mb-6 ${colors.text}`}>
            <Icon className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold font-syne mb-1">{title}</h1>
          <p className="text-muted-foreground text-lg mb-8">{description}</p>
        </>
      )}
      {children}
    </div>
  )
})
