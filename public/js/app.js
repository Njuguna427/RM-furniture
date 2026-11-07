const products = [
 {id:1,name:"Marta Sofa",category:"Sofas",price:65000,color:"Green",style:"Modern",rating:4.9,tag:"Bestseller",image:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=85",desc:"A welcoming modern sofa with generous cushions and timeless lines, designed for relaxed everyday living."},
 {id:2,name:"Arson Accent Chair",category:"Chairs",price:18500,color:"Pink",style:"Modern",rating:4.8,tag:"New arrival",image:"https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=800&q=85",desc:"A sculptural accent chair that brings a soft colour note and a comfortable seat to your favourite corner."},
 {id:3,name:"Terry Lounge Chair",category:"Chairs",price:22000,color:"Brown",style:"Classic",rating:4.8,tag:"Popular",image:"https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=800&q=85",desc:"A warm, characterful chair designed to add texture and an inviting feel to your living space."},
 {id:4,name:"Loly Two-Seater",category:"Sofas",price:48000,color:"Yellow",style:"Modern",rating:4.7,tag:"",image:"https://images.unsplash.com/photo-1550254478-ead40cc54513?auto=format&fit=crop&w=800&q=85",desc:"A compact sofa with a bright, optimistic look, ideal for apartments, reading nooks and smaller rooms."},
 {id:5,name:"Molly Three-Seater",category:"Sofas",price:72000,color:"Cream",style:"Minimal",rating:4.8,tag:"",image:"https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?auto=format&fit=crop&w=800&q=85",desc:"A relaxed, neutral sofa with understated styling that works beautifully with natural textures."},
 {id:6,name:"Nora Coffee Table",category:"Tables",price:19500,color:"Brown",style:"Rustic",rating:4.6,tag:"",image:"https://images.unsplash.com/photo-1499933374294-4584851497cc?auto=format&fit=crop&w=800&q=85",desc:"A versatile coffee table that brings a natural focal point to your seating arrangement."},
 {id:7,name:"Haven Storage Cabinet",category:"Storage",price:38500,color:"Brown",style:"Minimal",rating:4.7,tag:"",image:"https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=85",desc:"Simple, useful storage with a calm silhouette to help keep everyday essentials neatly organised."},
 {id:8,name:"Serene Bed Frame",category:"Beds",price:85000,color:"Grey",style:"Modern",rating:4.9,tag:"Signature",image:"https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=85",desc:"A restful bedroom centrepiece with a refined profile and a contemporary, understated feel."}
];
let zones=[{name:"Nairobi (within town)",fee:500},{name:"Nairobi (outskirts)",fee:1500},{name:"Kiambu / Thika / Ruiru",fee:2000},{name:"Other counties",fee:5000}];
let cartReady=false;
const CFG=window.RICHY||{};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money = n => "KSh " + Number(n).toLocaleString("en-KE");
const state = {category:"All",color:"",styles:[],maxPrice:100000,search:"",sort:"featured",favorites:new Set(),showFavorites:false,cart:new Map(),modalProduct:null};
const grid=document.getElementById("productGrid"), toast=document.getElementById("toast");
function notify(msg){toast.textContent=msg;toast.classList.add("show");clearTimeout(notify.timer);notify.timer=setTimeout(()=>toast.classList.remove("show"),2300)}
function filteredProducts(){
 let list=products.filter(p=>(state.category==="All"||p.category===state.category)&&p.price<=state.maxPrice&&(!state.color||p.color===state.color)&&(!state.styles.length||state.styles.includes(p.style))&&(!state.search||(p.name+" "+p.category+" "+p.color+" "+p.style).toLowerCase().includes(state.search.toLowerCase()))&&(!state.showFavorites||state.favorites.has(p.id)));
 if(state.sort==="low")list.sort((a,b)=>a.price-b.price);if(state.sort==="high")list.sort((a,b)=>b.price-a.price);if(state.sort==="name")list.sort((a,b)=>a.name.localeCompare(b.name));return list;
}

async function loadProducts(){
  // Loads from the Netlify function (Supabase). Falls back to the sample list above.
  try {
    const response = await fetch("/.netlify/functions/products");
    if (!response.ok) throw new Error("Product API unavailable");
    const data = await response.json();
    if (Array.isArray(data.zones) && data.zones.length) zones = data.zones.map(z=>({name:z.name,fee:Number(z.fee)}));
    if (Array.isArray(data.products) && data.products.length) {
      products.splice(0, products.length, ...data.products.map(p => ({
        id:Number(p.id), name:p.name, category:p.category, price:Number(p.price),
        color:p.color || "Brown", style:p.style || "Modern", rating:Number(p.rating || 4.7),
        tag:p.tag || "", image:p.image_url || "https://placehold.co/600x450/f4f0eb/76513c?text=Richy+Furniture",
        desc:p.description || "", dimensions:p.dimensions || "", material:p.material || "", stock:Number(p.stock ?? 0)
      })));
    }
  } catch (err) {
    console.info("Using sample products (backend not connected).");
  }
  restoreCart();
  buildCategoryCounts();
  renderProducts();
}
function saveCart(){try{localStorage.setItem("richy_cart",JSON.stringify([...state.cart.values()].map(r=>[r.product.id,r.qty])))}catch(e){}}
function restoreCart(){
  try{(JSON.parse(localStorage.getItem("richy_cart")||"[]")).forEach(([id,qty])=>{const p=products.find(x=>x.id===id);if(p&&(p.stock??99)>0)state.cart.set(id,{product:p,qty:Math.min(qty,p.stock??99)})})}catch(e){}
  cartReady=true;renderCart();
}
function buildCategoryCounts(){
  document.querySelectorAll(".category").forEach(el=>{const c=el.dataset.category,n=c==="All"?products.length:products.filter(p=>p.category===c).length;const s=el.querySelector("small");if(s)s.textContent=String(n).padStart(2,"0")});
}

function renderProducts(){
 const list=filteredProducts();document.getElementById("resultsCount").textContent=`${list.length} product${list.length===1?"":"s"}`;
 grid.innerHTML=list.length?list.map(p=>`<article class="product-card">
  <div class="product-image" data-detail="${p.id}"><img loading="lazy" src="${p.image}" alt="${p.name}" onerror="this.onerror=null;this.src='https://placehold.co/600x450/f4f0eb/76513c?text=Richy+Furniture'"/>
  ${p.tag?`<span style="position:absolute;left:7px;top:7px;background:#fff;padding:5px 7px;border-radius:7px;font-size:8px;color:#76513c">${p.tag}</span>`:""}
  <button class="fav ${state.favorites.has(p.id)?"active":""}" data-fav="${p.id}" aria-label="Add ${p.name} to favorites">${state.favorites.has(p.id)?"♥":"♡"}</button></div>
  <div class="product-name">${p.name}</div><div class="product-sub">${p.category} · ${p.color}</div>
  <div class="product-foot"><span class="product-price">${money(p.price)}</span><span class="card-rating">★ ${p.rating}</span></div>
  ${(p.stock??99)>0?`<button class="add-small" data-add="${p.id}">ADD TO CART +</button>`:`<button class="add-small" disabled>OUT OF STOCK</button>`}</article>`).join(""):`<div class="empty">No furniture matches these filters.<br/><button class="clear-btn" style="margin-top:12px" id="emptyClear">Clear filters and show all products</button></div>`;
}
function toggleFavorite(id){state.favorites.has(id)?state.favorites.delete(id):state.favorites.add(id);renderProducts();notify(state.favorites.has(id)?"Added to favourites":"Removed from favourites")}
function addToCart(id){const p=products.find(x=>x.id===id);if(!p)return;if((p.stock??99)<1){notify("Out of stock");return}const row=state.cart.get(id)||{product:p,qty:0};if(row.qty>=(p.stock??99)){notify("Only "+(p.stock??99)+" in stock");return}row.qty++;state.cart.set(id,row);renderCart();notify(p.name+" added to cart")}
function renderCart(){
 if(cartReady)saveCart();
 const rows=[...state.cart.values()];const qty=rows.reduce((s,r)=>s+r.qty,0),total=rows.reduce((s,r)=>s+r.qty*r.product.price,0);
 document.getElementById("cartCount").textContent=qty;document.getElementById("cartSubtotal").textContent=money(total);
 document.getElementById("cartItems").innerHTML=rows.length?rows.map(({product:p,qty})=>`<div class="cart-line"><img src="${p.image}" alt="${p.name}"/><div><strong>${p.name}</strong><small>${money(p.price)}</small><div class="qty"><button data-qty="${p.id}" data-delta="-1" aria-label="Decrease quantity">−</button><span>${qty}</span><button data-qty="${p.id}" data-delta="1" aria-label="Increase quantity">+</button></div></div><div><strong>${money(p.price*qty)}</strong><button class="remove" data-remove="${p.id}">Remove</button></div></div>`).join(""):`<div class="cart-empty">Your bag is empty.<br/>Find something you love.</div>`;
}
function openDetails(id){const p=products.find(x=>x.id===id);if(!p)return;state.modalProduct=id;document.getElementById("modalImage").src=p.image;document.getElementById("modalImage").alt=p.name;document.getElementById("modalName").textContent=p.name;document.getElementById("modalCategory").textContent=p.category+" · "+p.color+" · ★ "+p.rating;document.getElementById("modalDescription").textContent=p.desc;document.getElementById("modalPrice").textContent=money(p.price);document.getElementById("modalTags").innerHTML=`<span class="meta-chip">${p.style}</span>${p.dimensions?`<span class="meta-chip">${esc(p.dimensions)}</span>`:""}${p.material?`<span class="meta-chip">${esc(p.material)}</span>`:""}<span class="meta-chip">${(p.stock??99)>0?((p.stock??99)<=3?"Only "+p.stock+" left":"In stock"):"Out of stock"}</span>`;document.getElementById("modalBackdrop").classList.add("open")}
function setCategory(cat){state.category=cat;state.showFavorites=false;document.querySelectorAll(".category").forEach(el=>el.classList.toggle("selected",el.dataset.category===cat));renderProducts()}
document.getElementById("categoryList").addEventListener("click",e=>{const el=e.target.closest("[data-category]");if(el)setCategory(el.dataset.category)});
document.getElementById("priceRange").addEventListener("input",e=>{state.maxPrice=+e.target.value;document.getElementById("priceValue").textContent=money(state.maxPrice);renderProducts()});
document.getElementById("swatches").addEventListener("click",e=>{const el=e.target.closest("[data-color]");if(!el)return;state.color=state.color===el.dataset.color?"":el.dataset.color;document.querySelectorAll(".swatch").forEach(s=>s.classList.toggle("active",s.dataset.color===state.color));renderProducts()});
document.querySelectorAll(".styleCheck").forEach(el=>el.addEventListener("change",()=>{state.styles=[...document.querySelectorAll(".styleCheck:checked")].map(x=>x.value);renderProducts()}));
document.getElementById("searchInput").addEventListener("input",e=>{state.search=e.target.value;renderProducts()});
document.getElementById("sortSelect").addEventListener("change",e=>{state.sort=e.target.value;renderProducts()});
document.getElementById("clearFilters").addEventListener("click",clearFilters);
function clearFilters(){state.category="All";state.color="";state.styles=[];state.maxPrice=100000;state.search="";state.showFavorites=false;document.getElementById("priceRange").value=100000;document.getElementById("priceValue").textContent=money(100000);document.getElementById("searchInput").value="";document.querySelectorAll(".styleCheck").forEach(x=>x.checked=false);document.querySelectorAll(".swatch").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".category").forEach(x=>x.classList.toggle("selected",x.dataset.category==="All"));renderProducts()}
grid.addEventListener("click",e=>{const fav=e.target.closest("[data-fav]"),add=e.target.closest("[data-add]"),detail=e.target.closest("[data-detail]");if(fav){e.stopPropagation();toggleFavorite(+fav.dataset.fav)}else if(add)addToCart(+add.dataset.add);else if(detail)openDetails(+detail.dataset.detail);if(e.target.id==="emptyClear")clearFilters()});
document.getElementById("favoritesTop").addEventListener("click",()=>{state.showFavorites=!state.showFavorites;document.getElementById("favoritesTop").textContent=state.showFavorites?"♥":"♡";state.category="All";document.querySelectorAll(".category").forEach(x=>x.classList.toggle("selected",x.dataset.category==="All"));renderProducts();document.getElementById("products").scrollIntoView({behavior:"smooth"});notify(state.showFavorites?"Showing your favourites":"Showing all furniture")});
document.getElementById("shopCollection").addEventListener("click",()=>document.getElementById("products").scrollIntoView({behavior:"smooth"}));
document.getElementById("featuredAdd").addEventListener("click",()=>addToCart(1));
document.getElementById("modalAdd").addEventListener("click",()=>{if(state.modalProduct)addToCart(state.modalProduct);document.getElementById("modalBackdrop").classList.remove("open")});
document.getElementById("modalClose").addEventListener("click",()=>document.getElementById("modalBackdrop").classList.remove("open"));
document.getElementById("modalBackdrop").addEventListener("click",e=>{if(e.target.id==="modalBackdrop")e.currentTarget.classList.remove("open")});
document.getElementById("cartOpen").addEventListener("click",()=>document.getElementById("cartPanel").classList.add("open"));
document.getElementById("cartClose").addEventListener("click",()=>document.getElementById("cartPanel").classList.remove("open"));
document.getElementById("cartItems").addEventListener("click",e=>{const qty=e.target.closest("[data-qty]"),remove=e.target.closest("[data-remove]");if(qty){const id=+qty.dataset.qty,delta=+qty.dataset.delta,row=state.cart.get(id);if(row){row.qty=Math.min(row.qty+delta,row.product.stock??99);if(row.qty<=0)state.cart.delete(id);else state.cart.set(id,row)}renderCart()}if(remove){state.cart.delete(+remove.dataset.remove);renderCart()}});
document.getElementById("menuToggle").addEventListener("click",()=>document.getElementById("sidebar").classList.toggle("open"));
document.addEventListener("keydown",e=>{if(e.key==="Escape"){document.getElementById("modalBackdrop").classList.remove("open");document.getElementById("cartPanel").classList.remove("open")}});
document.getElementById("year").textContent=new Date().getFullYear();
(function(){const w=document.getElementById("ctWhatsapp"),p=document.getElementById("ctPhone"),m=document.getElementById("ctEmail");
 if(CFG.whatsapp)w.href="https://wa.me/"+CFG.whatsapp;else w.remove();
 if(CFG.phone)p.href="tel:"+CFG.phone;else p.remove();
 if(CFG.email)m.href="mailto:"+CFG.email;else m.remove();
 document.getElementById("ctLocation").textContent=CFG.location||"";document.getElementById("ctHours").textContent=CFG.hours||""})();
loadProducts();
