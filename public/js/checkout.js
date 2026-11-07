// Checkout: WhatsApp order, saved order, optional M-Pesa STK push
const $ = (id) => document.getElementById(id);
const coBox = $("checkoutBackdrop"), coForm = $("checkoutForm"), coMsg = $("coMsg");
let orderPlaced = false;

const cartRows = () => [...state.cart.values()];
function totals() {
  const sub = cartRows().reduce((s, r) => s + r.qty * r.product.price, 0);
  const z = zones.find((z) => z.name === coForm.zone.value);
  const fee = z ? Number(z.fee) : 0;
  return { sub, fee, total: sub + fee, z };
}
function renderTotals() {
  const t = totals();
  $("coSummary").innerHTML = `<div>Subtotal <b>${money(t.sub)}</b></div><div>Delivery <b>${t.z ? money(t.fee) : "Choose area"}</b></div><div class="co-total">Total <b>${money(t.total)}</b></div>`;
}
function openCheckout() {
  if (!state.cart.size) { notify("Add furniture to your bag first."); return; }
  $("cartPanel").classList.remove("open");
  coForm.zone.innerHTML = '<option value="">Choose delivery area</option>' +
    zones.map((z) => `<option value="${esc(z.name)}">${esc(z.name)} (${money(z.fee)})</option>`).join("");
  coMsg.textContent = ""; $("coSubmit").disabled = false; orderPlaced = false;
  renderTotals(); coBox.classList.add("open");
}
function closeCheckout() { coBox.classList.remove("open"); }
function formData() {
  const f = coForm;
  return { name: f.name.value.trim(), phone: f.phone.value.trim(), zone: f.zone.value, address: f.address.value.trim(), notes: f.notes.value.trim(), pay: f.pay.value, website: f.website.value };
}
function valid() {
  const d = formData();
  if (!d.name || !d.phone || !d.zone || !d.address) { coMsg.textContent = "Please fill in name, phone, delivery area and address."; return false; }
  return true;
}

$("checkoutBtn").addEventListener("click", openCheckout);
$("coClose").addEventListener("click", closeCheckout);
coBox.addEventListener("click", (e) => { if (e.target === coBox) closeCheckout(); });
coForm.zone.addEventListener("change", renderTotals);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCheckout(); });

// WhatsApp order
$("coWhatsapp").addEventListener("click", () => {
  if (!CFG.whatsapp) { notify("WhatsApp number not set yet."); return; }
  if (!valid()) return;
  const d = formData(), t = totals();
  const lines = cartRows().map((r) => `• ${r.qty} x ${r.product.name} - ${money(r.product.price * r.qty)}`);
  const text = `Hello Richy Furniture, I would like to order:\n${lines.join("\n")}\n\nSubtotal: ${money(t.sub)}\nDelivery (${d.zone}): ${money(t.fee)}\nTotal: ${money(t.total)}\n\nName: ${d.name}\nPhone: ${d.phone}\nAddress: ${d.address}${d.notes ? "\nNotes: " + d.notes : ""}`;
  window.open(`https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
});

// Place order (+ M-Pesa)
async function post(url, body) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "Request failed");
  return data;
}
coForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (orderPlaced || !valid()) return;
  const d = formData(), btn = $("coSubmit");
  btn.disabled = true; coMsg.textContent = "Placing your order...";
  try {
    const order = await post("/.netlify/functions/create-order", {
      customer_name: d.name, customer_phone: d.phone, zone: d.zone, address: d.address, notes: d.notes, website: d.website,
      items: cartRows().map((r) => ({ product_id: r.product.id, quantity: r.qty })),
    });
    orderPlaced = true;
    let msg = `Order #${order.order_id} received. We will contact you to confirm delivery.`;
    if (d.pay === "mpesa") {
      try { const p = await post("/.netlify/functions/mpesa-stk", { order_id: order.order_id }); msg = `Order #${order.order_id} received. ${p.message}`; }
      catch (err) { msg = `Order #${order.order_id} received, but M-Pesa could not start (${err.message}). We will contact you to pay.`; }
    }
    coMsg.textContent = msg;
    state.cart.clear(); renderCart(); coForm.reset();
  } catch (err) {
    btn.disabled = false;
    coMsg.textContent = err.message === "Failed to fetch" || err.message === "Request failed" || err instanceof SyntaxError
      ? "Order service not reachable. Please use WhatsApp instead." : err.message;
  }
});
