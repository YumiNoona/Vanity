import { toast } from "sonner"

export function usePremium() {
  const limits = {
    maxFiles: 100,
    maxSizeMB: 500,
  }

  const validateFiles = (files: File[], existingCount: number = 0) => {
    // No limits check needed for counts anymore as everyone has the max
    const overSized = files.find(f => f.size > limits.maxSizeMB * 1024 * 1024)
    if (overSized) {
      toast.error(`File too large: ${overSized.name}`, {
        description: `Maximum file size allowed is ${limits.maxSizeMB}MB.`
      })
      return false
    }

    return true
  }

  return { limits, validateFiles }
}
