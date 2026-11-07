const { sb, json } = require('../lib/shared');

const BASE = process.env.MPESA_ENV === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';

async function token() {
  const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
  const r = await fetch(`${BASE}/oauth/v1/generate?grant_type=client_credentials`, { headers: { Authorization: `Basic ${auth}` } });
  if (!r.ok) throw new Error('M-Pesa auth failed');
  return (await r.json()).access_token;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST.' });
  try {
    const { order_id } = JSON.parse(event.body || '{}');
    const [order] = await sb(`orders?id=eq.${Number(order_id)}&select=id,customer_phone,total_amount,payment_status`);
    if (!order) return json(404, { error: 'Order not found.' });
    if (order.payment_status === 'paid') return json(409, { error: 'Order already paid.' });

    // Amount and phone come from the database, not from the browser
    const ts = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
    const shortcode = process.env.MPESA_SHORTCODE;
    const password = Buffer.from(shortcode + process.env.MPESA_PASSKEY + ts).toString('base64');
    const r = await fetch(`${BASE}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        BusinessShortCode: shortcode, Password: password, Timestamp: ts,
        TransactionType: process.env.MPESA_TYPE || 'CustomerPayBillOnline', // use CustomerBuyGoodsOnline for a Till
        Amount: Math.ceil(Number(order.total_amount)),
        PartyA: order.customer_phone, PartyB: shortcode, PhoneNumber: order.customer_phone,
        CallBackURL: `${process.env.URL}/.netlify/functions/mpesa-callback`,
        AccountReference: `RF${order.id}`, TransactionDesc: 'Richy Furniture',
      }),
    });
    const d = await r.json();
    if (d.ResponseCode !== '0') return json(502, { error: d.errorMessage || d.ResponseDescription || 'M-Pesa request failed.' });

    await sb(`orders?id=eq.${order.id}`, {
      method: 'PATCH', body: JSON.stringify({ checkout_request_id: d.CheckoutRequestID, payment_status: 'pending' }),
    });
    return json(200, { message: 'Check your phone and enter your M-Pesa PIN.' });
  } catch (e) {
    console.error(e);
    return json(500, { error: 'Could not start M-Pesa payment.' });
  }
};
