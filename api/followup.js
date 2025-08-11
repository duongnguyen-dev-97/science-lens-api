// api/followup.js
const ALLOWED_ORIGINS = [
  'https://duongnguyen-dev-97.github.io',
  'http://localhost:3000',
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
    const { priorText, question } = req.body || {};
    if (!priorText || !question) {
      return res.status(400).json({ ok: false, error: 'priorText & question required' });
    }

    const payload = {
      model: 'gpt-4o-mini',
      input: [
        { role: 'system', content: [{ type: 'input_text', text: 'You are a concise science explainer.' }] },
        { role: 'user', content: [{ type: 'input_text', text: `Context:\n${priorText}\n\nUser question: ${question}\nAnswer briefly and precisely.` }] }
      ]
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
