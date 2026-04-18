const STORAGE_KEY = "vanity_anthropic_key"
const PRIMARY_MODEL = "claude-sonnet-4-20250514"
const FALLBACK_MODEL = "claude-3-5-sonnet-20241022"

export class ClaudeError extends Error {
  code: "NO_KEY" | "RATE_LIMITED" | "INVALID_KEY" | "NETWORK_ERROR" | "UNKNOWN"

  constructor(message: string, code: ClaudeError["code"]) {
    super(message)
    this.name = "ClaudeError"
    this.code = code
  }
}

export interface ClaudeMessage {
  role: "user" | "assistant"
  content: any
}

const getApiKey = (): string => {
  const key = localStorage.getItem(STORAGE_KEY)
  if (!key || key.trim() === "") {
    throw new ClaudeError("Anthropic API Key is missing. Please add it to continue.", "NO_KEY")
  }
  return key.trim()
}

const handleApiError = (status: number, message: string) => {
  if (status === 401) {
    throw new ClaudeError("Invalid API key provided. Please check your Anthropic key.", "INVALID_KEY")
  }
  if (status === 429) {
    throw new ClaudeError("Rate limit exceeded or out of credits. Please wait and try again.", "RATE_LIMITED")
  }
  if (status >= 500) {
    throw new ClaudeError("Anthropic network error. The service might be temporarily down.", "NETWORK_ERROR")
  }
  throw new ClaudeError(`Anthropic API error: ${message}`, "UNKNOWN")
}

export async function callClaude({
  messages,
  systemPrompt,
  maxTokens = 4096,
  temperature = 0.7
}: {
  messages: ClaudeMessage[]
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
}) {
  const apiKey = getApiKey()
  
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerously-allow-browser": "true"
      },
      body: JSON.stringify({
        model: PRIMARY_MODEL || FALLBACK_MODEL,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      handleApiError(response.status, errorData?.error?.message || response.statusText)
    }

    const data = await response.json()
    return data.content[0].text
  } catch (err: any) {
    if (err instanceof ClaudeError) throw err
    throw new ClaudeError(err.message || "Failed to make request to Anthropic.", "NETWORK_ERROR")
  }
}

const fileToBase64 = (file: File | Blob): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(",")[1]
      let mimeType = file.type
      if (!mimeType) {
         mimeType = "image/jpeg"
      }
      resolve({ base64, mimeType })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function callClaudeVision({
  file,
  prompt,
  systemPrompt,
  maxTokens = 4096
}: {
  file: File | Blob
  prompt: string
  systemPrompt?: string
  maxTokens?: number
}) {
  const { base64, mimeType } = await fileToBase64(file)

  const messages: ClaudeMessage[] = [
    {
      role: "user",
      content: [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: mimeType,
            data: base64
          }
        },
        {
          type: "text",
          text: prompt
        }
      ]
    }
  ]

  return callClaude({ messages, systemPrompt, maxTokens })
}
