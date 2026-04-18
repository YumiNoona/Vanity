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
