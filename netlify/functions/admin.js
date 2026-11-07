const { sb, json, safeEqual } = require('../lib/shared');

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
