import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Re-export common logic from the core canvas guards for backward compatibility if needed, 
// though we aim to use the direct imports now.
export { guardDimensions } from "./canvas/guards"

/**
 * Time-budgeted yielding (8-12ms) to keep UI responsive at 60fps.
 */
let lastYield = performance.now()
export async function maybeYield(budget = 10) {
  const now = performance.now()
  if (now - lastYield > budget) {
    lastYield = now
    await new Promise(requestAnimationFrame)
  }
}

/**
 * Bulletproof Object URL revocation.
 */
export function safeRevoke(urls: string[]) {
  urls.forEach(u => {
    try {
      if (u && u.startsWith("blob:")) URL.revokeObjectURL(u)
    } catch (e) {
      console.warn("Revoke failed", e)
    }
  })
}

export function formatSize(bytes: number) {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}
