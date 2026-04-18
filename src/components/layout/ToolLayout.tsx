import React from "react"
import { ArrowLeft, type LucideIcon } from "lucide-react"
import { Link } from "react-router-dom"

interface ToolLayoutProps {
  title: string
  description: string
  icon?: LucideIcon
  iconColor?: "primary" | "accent"
  children: React.ReactNode
  backLabel?: string
  onBack?: () => void
  maxWidth?: string
}

export function ToolLayout({
  title,
  description,
  icon: Icon,
  iconColor = "primary",
  children,
  backLabel,
  onBack,
  maxWidth = "max-w-4xl",
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
    <div className={`${maxWidth} mx-auto space-y-8`}>
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className={`inline-flex items-center justify-center p-3 ${colors.bg} rounded-full ${colors.text}`}>
              <Icon className="w-6 h-6" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold font-syne mb-1">{title}</h1>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {backLabel || "Start New"}
          </button>
        )}
      </div>

      {children}
    </div>
  )
}

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
}

export function ToolUploadLayout({
  title,
  description,
  icon: Icon,
  iconColor = "primary",
  children,
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
    <div className="max-w-2xl mx-auto py-12 text-center">
      <div className={`inline-flex items-center justify-center p-3 ${colors.bg} rounded-full mb-6 ${colors.text}`}>
        <Icon className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-bold font-syne mb-1">{title}</h1>
      <p className="text-muted-foreground text-lg mb-8">{description}</p>
      {children}
    </div>
  )
}
