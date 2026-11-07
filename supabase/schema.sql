-- Run in Supabase: SQL Editor -> New query -> paste -> Run
create table products (
  id bigint generated always as identity primary key,
  name text not null, category text not null, price numeric(12,2) not null,
  color text default 'Brown', style text default 'Modern', rating numeric(2,1) default 4.5,
  tag text default '', image_url text, description text,
  dimensions text default '', material text default '',
  stock int not null default 10, is_active boolean not null default true,
  created_at timestamptz default now()
);
create table delivery_zones (
  id bigint generated always as identity primary key,
  name text not null unique, fee numeric(12,2) not null
);
create table orders (
  id bigint generated always as identity primary key,
  customer_name text not null, customer_phone text not null,
  zone text, address text, notes text,
  status text not null default 'new' check (status in ('new','contacted','confirmed','delivered','cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','pending','paid','failed')),
  subtotal numeric(12,2) not null, delivery_fee numeric(12,2) not null default 0, total_amount numeric(12,2) not null,
  checkout_request_id text, mpesa_receipt text,
  created_at timestamptz default now()
);
create table order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references orders(id) on delete cascade,
  product_id bigint not null references products(id),
  quantity int not null check (quantity > 0), unit_price numeric(12,2) not null
);
-- RLS on, no policies: the public (anon key) can read/write nothing.
-- Only the Netlify functions (service key) touch the data.
alter table products enable row level security;
alter table delivery_zones enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

insert into delivery_zones (name, fee) values
 ('Nairobi (within town)',500),('Nairobi (outskirts)',1500),('Kiambu / Thika / Ruiru',2000),('Other counties',5000);
insert into products (name,category,price,color,style,rating,tag,image_url,description,dimensions,material,stock) values
('Marta Sofa','Sofas',65000,'Green','Modern',4.9,'Bestseller','https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=85','A welcoming modern sofa with generous cushions and timeless lines, designed for relaxed everyday living.','210 x 90 x 85 cm','Fabric upholstery, hardwood frame',5),
('Arson Accent Chair','Chairs',18500,'Pink','Modern',4.8,'New arrival','https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=800&q=85','A sculptural accent chair that brings a soft colour note and a comfortable seat to your favourite corner.','75 x 80 x 78 cm','Velvet, wooden legs',8),
('Terry Lounge Chair','Chairs',22000,'Brown','Classic',4.8,'Popular','https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=800&q=85','A warm, characterful chair designed to add texture and an inviting feel to your living space.','80 x 85 x 90 cm','Leather-look, solid wood',6),
('Loly Two-Seater','Sofas',48000,'Yellow','Modern',4.7,'','https://images.unsplash.com/photo-1550254478-ead40cc54513?auto=format&fit=crop&w=800&q=85','A compact sofa with a bright, optimistic look, ideal for apartments, reading nooks and smaller rooms.','150 x 85 x 82 cm','Fabric, hardwood frame',4),
('Molly Three-Seater','Sofas',72000,'Cream','Minimal',4.8,'','https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?auto=format&fit=crop&w=800&q=85','A relaxed, neutral sofa with understated styling that works beautifully with natural textures.','220 x 92 x 84 cm','Linen blend, hardwood frame',3),
('Nora Coffee Table','Tables',19500,'Brown','Rustic',4.6,'','https://images.unsplash.com/photo-1499933374294-4584851497cc?auto=format&fit=crop&w=800&q=85','A versatile coffee table that brings a natural focal point to your seating arrangement.','110 x 60 x 45 cm','Solid mahogany',7),
('Haven Storage Cabinet','Storage',38500,'Brown','Minimal',4.7,'','https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=85','Simple, useful storage with a calm silhouette to help keep everyday essentials neatly organised.','120 x 40 x 150 cm','Engineered wood, oak veneer',5),
('Serene Bed Frame','Beds',85000,'Grey','Modern',4.9,'Signature','https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=85','A restful bedroom centrepiece with a refined profile and a contemporary, understated feel.','Queen: 160 x 200 cm','Upholstered headboard, hardwood slats',2);
