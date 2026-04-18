import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- Industrial Stability Utils ---

/**
 * Ensures images fit within device memory limits.
 * Desktop: 20MP, Mobile: 10MP
 */
export function guardDimensions(w: number, h: number) {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  const MAX_PX = isMobile ? 10_000_000 : 20_000_000
  const px = w * h
  if (px <= MAX_PX) return { w, h, scale: 1 }
  const scale = Math.sqrt(MAX_PX / px)
  return { w: Math.floor(w * scale), h: Math.floor(h * scale), scale }
}

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
      if (u.startsWith("blob:")) URL.revokeObjectURL(u)
    } catch (e) {
      console.warn("Revoke failed", e)
    }
  })
}
