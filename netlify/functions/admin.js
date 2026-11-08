const crypto = require('crypto');
const { sb, json, safeEqual } = require('../lib/shared');

const BASE = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;

// Save a JPEG in the public "products" bucket and return its public address
async function uploadToStorage(name, buf) {
  const put = () => fetch(`${BASE}/storage/v1/object/products/${name}`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'image/jpeg', 'Cache-Control': 'max-age=31536000' },
    body: buf,
  });
  let r = await put();
  if (!r.ok) {
    // First upload: create the public bucket, then try again
    await fetch(`${BASE}/storage/v1/bucket`, {
      method: 'POST',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'products', name: 'products', public: true }),
    });
    r = await put();
    if (!r.ok) throw new Error(await r.text());
  }
  return `${BASE}/storage/v1/object/public/products/${name}`;
}

const STATUS = ['new', 'contacted', 'confirmed', 'delivered', 'cancelled'];
const FIELDS = ['name', 'category', 'price', 'color', 'style', 'rating', 'tag', 'image_url', 'description', 'dimensions', 'material', 'stock', 'is_active'];

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST.' });
  const key = event.headers['x-admin-key'] || '';
  if (!process.env.ADMIN_KEY || !safeEqual(key, process.env.ADMIN_KEY)) return json(401, { error: 'Wrong admin key.' });

  try {
    const b = JSON.parse(event.body || '{}');
    switch (b.action) {
      case 'orders':
        return json(200, await sb('orders?order=id.desc&limit=100&select=*,order_items(quantity,unit_price,products(name))'));
      case 'setStatus':
        if (!STATUS.includes(b.status)) return json(422, { error: 'Bad status.' });
        return json(200, await sb(`orders?id=eq.${Number(b.id)}`, { method: 'PATCH', body: JSON.stringify({ status: b.status }) }));
      case 'markPaid':
        return json(200, await sb(`orders?id=eq.${Number(b.id)}`, { method: 'PATCH', body: JSON.stringify({ payment_status: 'paid' }) }));
      case 'uploadImage': {
        const buf = Buffer.from(String(b.data || ''), 'base64');
        if (!buf.length || buf.length > 2 * 1024 * 1024) return json(422, { error: 'Image must be under 2 MB.' });
        if (!(buf[0] === 0xff && buf[1] === 0xd8)) return json(422, { error: 'Only JPEG images are accepted.' });
        const name = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.jpg`;
        return json(200, { url: await uploadToStorage(name, buf) });
      }
      case 'products':
        return json(200, await sb('products?order=id.asc&select=*'));
      case 'saveProduct': {
        const p = Object.fromEntries(FIELDS.filter((f) => f in (b.product || {})).map((f) => [f, b.product[f]]));
        if (b.product.id) return json(200, await sb(`products?id=eq.${Number(b.product.id)}`, { method: 'PATCH', body: JSON.stringify(p) }));
        return json(201, await sb('products', { method: 'POST', body: JSON.stringify(p) }));
      }
      default:
        return json(400, { error: 'Unknown action.' });
    }
  } catch (e) {
    console.error(e);
    return json(500, { error: 'Server error.' });
  }
};
