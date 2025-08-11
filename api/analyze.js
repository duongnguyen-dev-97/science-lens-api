// api/analyze.js
const ALLOWED_ORIGINS = [
  'https://duongnguyen-dev-97.github.io', // your GitHub Pages domain
  'http://localhost:3000',                 // optional local dev
  'http://localhost:5173'
];

function setCors(res, origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  res.setHeader('Access-Control-Allow-Origin', allow);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  setCors(res, origin);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Use POST' });

  try {
    const { imageBase64, mime = 'image/jpeg', prompt } = req.body || {};
    if (!imageBase64) return res.status(400).json({ ok: false, error: 'imageBase64 required' });

    const dataUrl = `data:${mime};base64,${imageBase64}`;

    const payload = {
      model: 'gpt-4o-mini',
      input: [{
        role: 'user',
        content: [
          { type: 'input_text', text: `${prompt || 'Explain this scientifically for a curious learner.'}
Please answer with:
1) Likely identification (with uncertainty),
2) Key scientific explanation (150–250 words),
3) One safe at-home experiment to validate,
4) Confidence (0–100) + caveats.` },
          { type: 'input_image', image_url: { url: dataUrl } }
        ]
      }]
    };

    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const out = await r.json();
    const text =
      out?.output?.[0]?.content?.[0]?.text ||
      out?.choices?.[0]?.message?.content ||
      JSON.stringify(out);

    return res.status(200).json({ ok: true, text, raw: out });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
