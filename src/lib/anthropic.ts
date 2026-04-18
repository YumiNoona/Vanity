const STORAGE_KEY = "vanity_anthropic_key"

export async function callAnthropic(messages: any[], system?: string) {
  const key = localStorage.getItem(STORAGE_KEY)
  if (!key) throw new Error("No Anthropic API key found.")

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "dangerously-allow-browser": "true" // Note: Normally this is done via proxy, but for 100% local vanity we use direct browser call
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 4096,
      system,
      messages
    })
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || "Anthropic API call failed.")
  }

  return await response.json()
}
