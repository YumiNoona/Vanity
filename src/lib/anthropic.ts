const STORAGE_KEY = "vanity_anthropic_key"

const PRIMARY_MODEL = "claude-sonnet-4-20250514"
const FALLBACK_MODEL = "claude-3-5-sonnet-20240620"

export async function callAnthropic(messages: any[], system?: string) {
  const key = localStorage.getItem(STORAGE_KEY)
  if (!key) throw new Error("No Anthropic API key found.")

  const tryCall = async (model: string) => {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "dangerously-allow-browser": "true"
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system,
        messages
      })
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error?.message || `API call failed with model ${model}`)
    }
    return await response.json()
  }

  try {
    return await tryCall(PRIMARY_MODEL)
  } catch (error) {
    console.warn(`Primary model ${PRIMARY_MODEL} failed, trying fallback...`, error)
    try {
      return await tryCall(FALLBACK_MODEL)
    } catch (fallbackError) {
      console.error("All Anthropic models failed.", fallbackError)
      throw new Error("AI processing failed. Please check your API key or try again later.")
    }
  }
}
