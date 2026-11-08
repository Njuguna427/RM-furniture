const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (n) => "KSh " + Number(n).toLocaleString("en-KE");
const STATUS = ["new", "contacted", "confirmed", "delivered", "cancelled"];
let KEY = sessionStorage.getItem("richy_admin") || "", productsCache = [];

async function api(action, extra = {}) {
  const r = await fetch("/.netlify/functions/admin", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": KEY }, body: JSON.stringify({ action, ...extra }) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Request failed");
  return d;
}
async function login() {
  try { KEY = $("key").value || KEY; await loadOrders(); sessionStorage.setItem("richy_admin", KEY); $("login").hidden = true; $("panel").hidden = false; }
  catch (e) { $("err").textContent = e.message; }
}
async function loadOrders() {
  const rows = await api("orders");
  $("ordersBody").innerHTML = rows.map((o) => `<tr>
    <td>${o.id}</td>
    <td><b>${esc(o.customer_name)}</b><br>${esc(o.customer_phone)}<br>${esc(o.zone)}: ${esc(o.address)}${o.notes ? "<br><i>" + esc(o.notes) + "</i>" : ""}</td>
    <td>${o.order_items.map((i) => `${i.quantity} x ${esc(i.products?.name)}`).join("<br>")}</td>
    <td>${money(o.total_amount)}<br><small>incl. delivery ${money(o.delivery_fee)}</small></td>
    <td>${esc(o.payment_status)}${o.mpesa_receipt ? "<br>" + esc(o.mpesa_receipt) : ""}${o.payment_status !== "paid" ? `<br><button class="outline-btn" data-paid="${o.id}">Mark paid</button>` : ""}</td>
    <td><select data-status="${o.id}">${STATUS.map((s) => `<option ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}</select></td>
    <td>${new Date(o.created_at).toLocaleString("en-KE")}</td></tr>`).join("") || '<tr><td colspan="7">No orders yet.</td></tr>';
}
async function loadProducts() {
  productsCache = await api("products");
  $("productsBody").innerHTML = productsCache.map((p) => `<tr><td>${p.id}</td><td>${esc(p.name)}</td><td>${money(p.price)}</td><td>${p.stock}</td><td>${p.is_active ? "Yes" : "No"}</td><td><button class="outline-btn" data-edit="${p.id}">Edit</button></td></tr>`).join("");
}
function setPrev(u) { $("pPrev").src = u || ""; $("pPrev").hidden = !u; }
// Shrink the photo in the browser (max 1000px, JPEG) so uploads are small and the shop stays fast
function shrink(file, max = 1000) {
  return new Promise((resolve, reject) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      const x = c.getContext("2d");
      x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
      x.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.82).split(",")[1]);
    };
    img.onerror = () => reject(new Error("Could not read that image."));
    img.src = url;
  });
}
function show(tab) {
  $("orders").hidden = tab !== "orders"; $("products").hidden = tab !== "products";
  $("tOrders").classList.toggle("on", tab === "orders"); $("tProducts").classList.toggle("on", tab === "products");
  tab === "orders" ? loadOrders() : loadProducts();
}

$("go").onclick = login;
$("logout").onclick = () => { sessionStorage.removeItem("richy_admin"); location.reload(); };
$("tOrders").onclick = () => show("orders");
$("tProducts").onclick = () => show("products");
$("ordersBody").addEventListener("change", async (e) => {
  if (e.target.dataset.status) { try { await api("setStatus", { id: +e.target.dataset.status, status: e.target.value }); } catch (x) { alert(x.message); } }
});
$("ordersBody").addEventListener("click", async (e) => {
  if (e.target.dataset.paid) { try { await api("markPaid", { id: +e.target.dataset.paid }); loadOrders(); } catch (x) { alert(x.message); } }
});
$("productsBody").addEventListener("click", (e) => {
  const p = productsCache.find((x) => x.id === +e.target.dataset.edit); if (!p) return;
  const f = $("pForm");
  Object.keys(p).forEach((k) => { if (f.elements[k]) { f.elements[k].type === "checkbox" ? (f.elements[k].checked = !!p[k]) : (f.elements[k].value = p[k] ?? ""); } });
  setPrev(f.elements.image_url.value);
  f.scrollIntoView({ behavior: "smooth" });
});
$("pReset").onclick = () => { $("pForm").reset(); $("pForm").elements.id.value = ""; setPrev(""); $("upMsg").textContent = ""; };
$("pFile").addEventListener("change", async (e) => {
  const file = e.target.files[0]; if (!file) return;
  const msg = $("upMsg");
  if (!file.type.startsWith("image/")) { msg.textContent = "Choose an image file."; return; }
  msg.textContent = "Uploading...";
  try {
    const r = await api("uploadImage", { data: await shrink(file) });
    $("pForm").elements.image_url.value = r.url; setPrev(r.url);
    msg.textContent = "Uploaded. Click SAVE PRODUCT to keep it.";
  } catch (x) { msg.textContent = x.message; }
  e.target.value = "";
});
$("pForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target.elements, p = {};
  ["name", "category", "color", "style", "tag", "image_url", "description", "dimensions", "material"].forEach((k) => (p[k] = f[k].value.trim()));
  p.price = Number(f.price.value); p.stock = Number(f.stock.value); p.is_active = f.is_active.checked;
  if (f.id.value) p.id = Number(f.id.value);
  try { await api("saveProduct", { product: p }); $("pReset").click(); loadProducts(); } catch (x) { alert(x.message); }
});
if (KEY) login();
