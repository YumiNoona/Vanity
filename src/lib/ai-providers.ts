import { fileToBase64 } from "@/lib/anthropic"

type ErrorCode = "NO_KEY" | "RATE_LIMITED" | "INVALID_KEY" | "NETWORK_ERROR" | "UNKNOWN"
type ProviderId = "gemini" | "anthropic" | "openai" | "groq"

export class AIProviderError extends Error {
  code: ErrorCode

  constructor(message: string, code: ErrorCode) {
    super(message)
    this.name = "AIProviderError"
    this.code = code
  }
}

interface ProviderConfig {
  id: ProviderId
  name: string
  label: string
  storageKey: string
  visionSupported: boolean
  call: (apiKey: string, prompt: string, systemPrompt?: string, signal?: AbortSignal) => Promise<string>
  callVision: (apiKey: string, file: File | Blob, prompt: string, systemPrompt?: string, signal?: AbortSignal) => Promise<string>
}

const waitWithSignal = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort)
      resolve()
    }, ms)

    const onAbort = () => {
      clearTimeout(timeoutId)
      reject(new DOMException("Request aborted", "AbortError"))
    }

    if (signal?.aborted) {
      onAbort()
      return
    }
    signal?.addEventListener("abort", onAbort, { once: true })
  })

const mapStatusToError = (status: number, message: string) => {
  if (status === 401 || status === 403) {
    throw new AIProviderError("Invalid API key provided.", "INVALID_KEY")
  }
  if (status === 429) {
    throw new AIProviderError("Rate limit exceeded. Please wait and try again.", "RATE_LIMITED")
  }
  if (status >= 500) {
    throw new AIProviderError("Provider network error. Try again shortly.", "NETWORK_ERROR")
  }
  throw new AIProviderError(message || "Provider request failed.", "UNKNOWN")
}

const runWithRetry = async (runner: () => Promise<Response>, signal?: AbortSignal) => {
  const maxRetries = 2
  let response: Response | null = null
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    response = await runner()
    if (response.status !== 429 || attempt === maxRetries) {
      break
    }
    await waitWithSignal(700 * (attempt + 1), signal)
  }
  if (!response) {
    throw new AIProviderError("No response returned from provider.", "NETWORK_ERROR")
  }
  return response
}

const providers: Record<ProviderId, ProviderConfig> = {
  gemini: {
    id: "gemini",
    name: "gemini",
    label: "Gemini",
    storageKey: "vanity_gemini_key",
    visionSupported: true,
    call: async (apiKey, prompt, systemPrompt, signal) => {
      const response = await runWithRetry(
        () =>
          fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey
            },
            signal,
            body: JSON.stringify({
              systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
              contents: [{ role: "user", parts: [{ text: prompt }] }]
            })
          }),
        signal
      )
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        mapStatusToError(response.status, errData?.error?.message || response.statusText)
      }
      const data = await response.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (typeof text !== "string" || !text.trim()) {
        throw new AIProviderError("Gemini response did not contain text.", "UNKNOWN")
      }
      return text
    },
    callVision: async (apiKey, file, prompt, systemPrompt, signal) => {
      const { base64, mimeType } = await fileToBase64(file)
      const response = await runWithRetry(
        () =>
          fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey
            },
            signal,
            body: JSON.stringify({
              systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
              contents: [{ role: "user", parts: [{ inlineData: { mimeType, data: base64 } }, { text: prompt }] }]
            })
          }),
        signal
      )
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        mapStatusToError(response.status, errData?.error?.message || response.statusText)
      }
      const data = await response.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (typeof text !== "string" || !text.trim()) {
        throw new AIProviderError("Gemini vision response did not contain text.", "UNKNOWN")
      }
      return text
    }
  },
  anthropic: {
    id: "anthropic",
    name: "anthropic",
    label: "Anthropic Claude",
    storageKey: "vanity_anthropic_key",
    visionSupported: true,
    call: async (apiKey, prompt, systemPrompt, signal) => {
      const response = await runWithRetry(
        () =>
          fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
              "anthropic-dangerously-allow-browser": "true"
            },
            signal,
            body: JSON.stringify({
              model: "claude-3-5-haiku-20241022",
              max_tokens: 4096,
              temperature: 0.7,
              system: systemPrompt,
              messages: [{ role: "user", content: prompt }]
            })
          }),
        signal
      )
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        mapStatusToError(response.status, errData?.error?.message || response.statusText)
      }
      const data = await response.json()
      const first = data?.content?.[0]
      if (first?.type === "text" && typeof first.text === "string") return first.text
      throw new AIProviderError("Anthropic response did not contain text.", "UNKNOWN")
    },
    callVision: async (apiKey, file, prompt, systemPrompt, signal) => {
      const { base64, mimeType } = await fileToBase64(file)
      const response = await runWithRetry(
        () =>
          fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
              "anthropic-dangerously-allow-browser": "true"
            },
            signal,
            body: JSON.stringify({
              model: "claude-3-5-haiku-20241022",
              max_tokens: 4096,
              system: systemPrompt,
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "image", source: { type: "base64", media_type: mimeType, data: base64 } },
                    { type: "text", text: prompt }
                  ]
                }
              ]
            })
          }),
        signal
      )
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        mapStatusToError(response.status, errData?.error?.message || response.statusText)
      }
      const data = await response.json()
      const first = data?.content?.[0]
      if (first?.type === "text" && typeof first.text === "string") return first.text
      throw new AIProviderError("Anthropic vision response did not contain text.", "UNKNOWN")
    }
  },
  openai: {
    id: "openai",
    name: "openai",
    label: "OpenAI",
    storageKey: "vanity_openai_key",
    visionSupported: true,
    call: async (apiKey, prompt, systemPrompt, signal) => {
      const response = await runWithRetry(
        () =>
          fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`
            },
            signal,
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
                { role: "user", content: prompt }
              ]
            })
          }),
        signal
      )
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        mapStatusToError(response.status, errData?.error?.message || response.statusText)
      }
      const data = await response.json()
      const text = data?.choices?.[0]?.message?.content
      if (typeof text !== "string" || !text.trim()) {
        throw new AIProviderError("OpenAI response did not contain text.", "UNKNOWN")
      }
      return text
    },
    callVision: async (apiKey, file, prompt, systemPrompt, signal) => {
      const { base64, mimeType } = await fileToBase64(file)
      const response = await runWithRetry(
        () =>
          fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`
            },
            signal,
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
                {
                  role: "user",
                  content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } }
                  ]
                }
              ]
            })
          }),
        signal
      )
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        mapStatusToError(response.status, errData?.error?.message || response.statusText)
      }
      const data = await response.json()
      const text = data?.choices?.[0]?.message?.content
      if (typeof text !== "string" || !text.trim()) {
        throw new AIProviderError("OpenAI vision response did not contain text.", "UNKNOWN")
      }
      return text
    }
  },
  groq: {
    id: "groq",
    name: "groq",
    label: "Groq",
    storageKey: "vanity_groq_key",
    visionSupported: false,
    call: async (apiKey, prompt, systemPrompt, signal) => {
      const response = await runWithRetry(
        () =>
          fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`
            },
            signal,
            body: JSON.stringify({
              model: "llama-3.1-8b-instant",
              messages: [
                ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
                { role: "user", content: prompt }
              ]
            })
          }),
        signal
      )
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        mapStatusToError(response.status, errData?.error?.message || response.statusText)
      }
      const data = await response.json()
      const text = data?.choices?.[0]?.message?.content
      if (typeof text !== "string" || !text.trim()) {
        throw new AIProviderError("Groq response did not contain text.", "UNKNOWN")
      }
      return text
    },
    callVision: async () => {
      throw new AIProviderError("Groq does not support vision in browser mode.", "UNKNOWN")
    }
  }
}

type ActiveProvider = { provider: ProviderConfig; apiKey: string | null; useProxy: boolean }

let cachedProvider: ActiveProvider | null = null

export const invalidateProviderCache = () => {
  cachedProvider = null
}

export const getActiveProvider = (): ActiveProvider => {
  if (cachedProvider) return cachedProvider

  const order: ProviderId[] = ["gemini", "anthropic", "openai", "groq"]
  for (const id of order) {
    const provider = providers[id]
    const key = typeof window !== "undefined" ? localStorage.getItem(provider.storageKey)?.trim() : null
    if (key) {
      cachedProvider = { provider, apiKey: key, useProxy: false }
      return cachedProvider
    }
  }
  cachedProvider = { provider: providers.gemini, apiKey: null, useProxy: true }
  return cachedProvider
}

// Watch for storage changes from other tabs
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (Object.values(providers).some(p => p.storageKey === event.key)) {
      invalidateProviderCache()
    }
  })
}

const callProxyText = async (prompt: string, systemPrompt?: string, signal?: AbortSignal) => {
  const response = await runWithRetry(
    () =>
      fetch("/api/ai-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal,
        body: JSON.stringify({ prompt, systemPrompt })
      }),
    signal
  )
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    mapStatusToError(response.status, errData?.error || response.statusText)
  }
  const data = await response.json()
  if (!data?.text || typeof data.text !== "string") {
    throw new AIProviderError("Proxy response did not contain text.", "UNKNOWN")
  }
  return data.text
}

const callProxyVision = async (file: File | Blob, prompt: string, systemPrompt?: string, signal?: AbortSignal) => {
  const { base64, mimeType } = await fileToBase64(file)
  const response = await runWithRetry(
    () =>
      fetch("/api/ai-vision-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal,
        body: JSON.stringify({ imageBase64: base64, mimeType, prompt, systemPrompt })
      }),
    signal
  )
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    mapStatusToError(response.status, errData?.error || response.statusText)
  }
  const data = await response.json()
  if (!data?.text || typeof data.text !== "string") {
    throw new AIProviderError("Vision proxy response did not contain text.", "UNKNOWN")
  }
  return data.text
}

export async function callAI({
  prompt,
  systemPrompt,
  signal
}: {
  prompt: string
  systemPrompt?: string
  signal?: AbortSignal
}) {
  const active = getActiveProvider()
  try {
    if (active.useProxy) {
      return await callProxyText(prompt, systemPrompt, signal)
    }
    return await active.provider.call(active.apiKey!, prompt, systemPrompt, signal)
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new AIProviderError("Request was cancelled.", "NETWORK_ERROR")
    }
    if (err instanceof AIProviderError) throw err
    const message = err instanceof Error ? err.message : "AI request failed."
    throw new AIProviderError(message, "NETWORK_ERROR")
  }
}

export async function callAIVision({
  file,
  prompt,
  systemPrompt,
  signal
}: {
  file: File | Blob
  prompt: string
  systemPrompt?: string
  signal?: AbortSignal
}) {
  const active = getActiveProvider()
  try {
    if (active.useProxy) {
      return await callProxyVision(file, prompt, systemPrompt, signal)
    }
    if (!active.provider.visionSupported) {
      const geminiKey = localStorage.getItem(providers.gemini.storageKey)?.trim()
      if (geminiKey) {
        return await providers.gemini.callVision(geminiKey, file, prompt, systemPrompt, signal)
      }
      return await callProxyVision(file, prompt, systemPrompt, signal)
    }
    return await active.provider.callVision(active.apiKey!, file, prompt, systemPrompt, signal)
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new AIProviderError("Request was cancelled.", "NETWORK_ERROR")
    }
    if (err instanceof AIProviderError) throw err
    const message = err instanceof Error ? err.message : "AI vision request failed."
    throw new AIProviderError(message, "NETWORK_ERROR")
  }
}
