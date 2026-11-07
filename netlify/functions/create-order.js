const { sb, json, normalizePhone } = require('../lib/shared');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST.' });
  let b;
  try { b = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Bad request.' }); }

  if (b.website) return json(200, { order_id: 0 }); // honeypot: bots fill this hidden field

  const name = String(b.customer_name || '').trim();
  const phone = normalizePhone(b.customer_phone);
  const address = String(b.address || '').trim().slice(0, 300);
  const notes = String(b.notes || '').trim().slice(0, 500);
  const items = Array.isArray(b.items) ? b.items : [];

  if (!name || name.length > 150) return json(422, { error: 'Enter your name.' });
  if (!phone) return json(422, { error: 'Enter a valid Kenyan phone number, e.g. 0712345678.' });
  if (!address) return json(422, { error: 'Enter your delivery address.' });
  if (!items.length || items.length > 30) return json(422, { error: 'Your cart is empty.' });

  try {
    // Merge duplicate lines, validate quantities
    const qtyById = new Map();
    for (const it of items) {
      const id = Number(it.product_id), q = Number(it.quantity);
      if (!Number.isInteger(id) || !Number.isInteger(q) || q < 1 || q > 50) return json(422, { error: 'Invalid item.' });
      qtyById.set(id, (qtyById.get(id) || 0) + q);
    }
    const ids = [...qtyById.keys()];
    const products = await sb(`products?id=in.(${ids.join(',')})&is_active=eq.true&select=id,name,price,stock`);
    if (products.length !== ids.length) return json(422, { error: 'An item is no longer available.' });

    let subtotal = 0;
    const lines = products.map((p) => {
      const q = qtyById.get(p.id);
      if (q > p.stock) throw Object.assign(new Error(`Only ${p.stock} left of ${p.name}.`), { client: true });
      subtotal += Number(p.price) * q;
      return { product_id: p.id, quantity: q, unit_price: Number(p.price), stock: p.stock };
    });

    // Delivery fee comes from the database, never from the browser
    const zones = await sb(`delivery_zones?name=eq.${encodeURIComponent(String(b.zone || ''))}&select=name,fee`);
    if (!zones.length) return json(422, { error: 'Choose a delivery area.' });
    const fee = Number(zones[0].fee);

    const [order] = await sb('orders', {
      method: 'POST',
      body: JSON.stringify({
        customer_name: name, customer_phone: phone, zone: zones[0].name, address, notes,
        subtotal, delivery_fee: fee, total_amount: subtotal + fee,
      }),
    });
    await sb('order_items', {
      method: 'POST',
      body: JSON.stringify(lines.map((l) => ({ order_id: order.id, product_id: l.product_id, quantity: l.quantity, unit_price: l.unit_price }))),
    });
    // Reduce stock (small shop: fine; for heavy traffic use a Postgres function)
    await Promise.all(lines.map((l) => sb(`products?id=eq.${l.product_id}`, {
      method: 'PATCH', body: JSON.stringify({ stock: Math.max(0, l.stock - l.quantity) }),
    })));

    return json(201, { order_id: order.id, total_amount: order.total_amount });
  } catch (e) {
    if (e.client) return json(422, { error: e.message });
    console.error(e);
    return json(500, { error: 'Could not save your order. Please try again.' });
  }
};
