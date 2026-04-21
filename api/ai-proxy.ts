export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" })
    return
  }

  const { prompt, systemPrompt, model, maxTokens } = req.body || {}
  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "Missing prompt" })
    return
  }

  const geminiKey = process.env.GEMINI_API_KEY
  const groqKey = process.env.GROQ_API_KEY

  try {
    if (geminiKey) {
      const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
        body: JSON.stringify({
          systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
          contents: [{ role: "user", parts: [{ text: prompt }] }]
        })
      })
      if (r.ok) {
        const data = await r.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (typeof text === "string" && text.trim()) {
          res.status(200).json({ text })
          return
        }
      }
    }

    if (!groqKey) {
      res.status(500).json({ error: "No server AI providers configured" })
      return
    }

    const gr = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`
      },
      body: JSON.stringify({
        model: model || "llama-3.1-8b-instant",
        max_tokens: maxTokens || 2048,
        messages: [
          ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
          { role: "user", content: prompt }
        ]
      })
    })
    if (!gr.ok) {
      const err = await gr.json().catch(() => ({}))
      res.status(gr.status).json({ error: err?.error?.message || "Groq request failed" })
      return
    }
    const groqData = await gr.json()
    const text = groqData?.choices?.[0]?.message?.content
    if (!text || typeof text !== "string") {
      res.status(500).json({ error: "Groq returned empty text" })
      return
    }
    res.status(200).json({ text })
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "AI proxy failed" })
  }
}
