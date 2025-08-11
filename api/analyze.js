export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Use POST' });

  try {
    const { imageBase64, mime = 'image/jpeg', prompt } = req.body || {};
    if (!imageBase64) return res.status(400).json({ ok:false, error:'imageBase64 required' });

    const dataUrl = `data:${mime};base64,${imageBase64}`;
    const payload = {
      model: "gpt-4o-mini",
      input: [{
        role: "user",
        content: [
          { type: "input_text", text: `${prompt || 'Explain this scientifically for a curious learner.'}
Please answer with:
1) Likely identification (with uncertainty),
2) Key scientific explanation (150–250 words),
3) One safe at-home experiment to validate,
4) Confidence (0–100) + caveats.` },
          { type: "input_image", image_url: { url: dataUrl } }
        ]
      }]
    };

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const out = await r.json();
    const text =
      out?.output?.[0]?.content?.[0]?.text ||
      out?.choices?.[0]?.message?.content ||
      JSON.stringify(out);

    res.status(200).json({ ok:true, text, raw: out });
  } catch (e) {
    res.status(500).json({ ok:false, error: e.message });
  }
}
