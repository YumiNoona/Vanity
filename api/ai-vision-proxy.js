export default async function handler(req, res) {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }
    const { imageBase64, mimeType, prompt, systemPrompt } = req.body || {};
    if (!imageBase64 || !mimeType || !prompt) {
        res.status(400).json({ error: "Missing required fields" });
        return;
    }
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
        res.status(500).json({ error: "Gemini API key is not configured on server" });
        return;
    }
    try {
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": geminiKey
            },
            body: JSON.stringify({
                systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
                contents: [
                    {
                        role: "user",
                        parts: [
                            { inlineData: { mimeType, data: imageBase64 } },
                            { text: prompt }
                        ]
                    }
                ]
            })
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            res.status(response.status).json({ error: err?.error?.message || "Gemini vision request failed" });
            return;
        }
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text || typeof text !== "string") {
            res.status(500).json({ error: "Gemini vision returned empty text" });
            return;
        }
        res.status(200).json({ text });
    }
    catch (error) {
        res.status(500).json({ error: error?.message || "AI vision proxy failed" });
    }
}
