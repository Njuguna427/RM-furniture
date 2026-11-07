const crypto = require('crypto');
const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;

// Talk to Supabase REST (PostgREST) with the service key (server side only)
async function sb(path, opts = {}) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: KEY, Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json', Prefer: 'return=representation',
      ...(opts.headers || {}),
    },
  });
  const text = await r.text();
  if (!r.ok) throw new Error(text);
  return text ? JSON.parse(text) : null;
}

const json = (statusCode, body) => ({
  statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

// 0712345678 / +254712345678 / 254712345678 -> 254712345678 (or null)
function normalizePhone(p) {
  const d = String(p || '').replace(/[\s\-+]/g, '');
  if (/^0[17]\d{8}$/.test(d)) return '254' + d.slice(1);
  if (/^254[17]\d{8}$/.test(d)) return d;
  return null;
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

module.exports = { sb, json, normalizePhone, safeEqual };
