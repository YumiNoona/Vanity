import { useCallback, useEffect, useRef, useState } from "react"
import { callAIVision } from "@/lib/ai-providers"

interface RunVisionTaskArgs {
  file: File
  prompt: string
  systemPrompt: string
}

export function useAIVisionTask() {
  const [isRunning, setIsRunning] = useState(false)
  const controllerRef = useRef<AbortController | null>(null)
  const runIdRef = useRef(0)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
      controllerRef.current?.abort()
    }
  }, [])

  const cancel = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
    if (isMountedRef.current) {
      setIsRunning(false)
    }
  }, [])

  const run = useCallback(async ({ file, prompt, systemPrompt }: RunVisionTaskArgs) => {
    runIdRef.current += 1
    const runId = runIdRef.current
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setIsRunning(true)

    try {
      const response = await callAIVision({
        file,
        prompt,
        systemPrompt,
        signal: controller.signal,
      })
      if (!isMountedRef.current || runId !== runIdRef.current) {
        throw new DOMException("Stale request", "AbortError")
      }
      return response
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null
      }
      if (isMountedRef.current && runId === runIdRef.current) {
        setIsRunning(false)
      }
    }
  }, [])

  return { isRunning, run, cancel }
}
