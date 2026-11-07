const { sb, json } = require('../lib/shared');

exports.handler = async (event) => {
  const ack = json(200, { ResultCode: 0, ResultDesc: 'Accepted' });
  try {
    const cb = JSON.parse(event.body || '{}').Body?.stkCallback;
    if (!cb?.CheckoutRequestID) return ack;
    const [order] = await sb(`orders?checkout_request_id=eq.${encodeURIComponent(cb.CheckoutRequestID)}&select=id,total_amount`);
    if (!order) return ack;

    if (cb.ResultCode === 0) {
      const meta = Object.fromEntries((cb.CallbackMetadata?.Item || []).map((i) => [i.Name, i.Value]));
      // Only mark paid if the amount matches what we asked for
      const ok = Number(meta.Amount) >= Math.ceil(Number(order.total_amount));
      await sb(`orders?id=eq.${order.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ payment_status: ok ? 'paid' : 'failed', mpesa_receipt: meta.MpesaReceiptNumber || null }),
      });
    } else {
      await sb(`orders?id=eq.${order.id}`, { method: 'PATCH', body: JSON.stringify({ payment_status: 'failed' }) });
    }
  } catch (e) { console.error(e); }
  return ack;
};
