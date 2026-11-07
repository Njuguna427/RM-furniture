-- Richy Furniture database schema (MySQL 8+)
CREATE DATABASE IF NOT EXISTS richy_furniture
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE richy_furniture;

CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(60) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  color VARCHAR(40) DEFAULT 'Brown',
  style VARCHAR(60) DEFAULT 'Modern',
  rating DECIMAL(2,1) DEFAULT 4.5,
  tag VARCHAR(60) DEFAULT '',
  image_url VARCHAR(500) DEFAULT NULL,
  description TEXT,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_enquiries (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(30) NOT NULL,
  status ENUM('new','contacted','confirmed','cancelled') NOT NULL DEFAULT 'new',
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_enquiry_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id)
    REFERENCES order_enquiries(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id)
    REFERENCES products(id)
);

INSERT INTO products (name, category, price, color, style, rating, tag, image_url, description) VALUES
('Marta Sofa','Sofas',65000,'Green','Modern',4.9,'Bestseller','https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=85','A welcoming modern sofa with generous cushions and timeless lines.'),
('Arson Accent Chair','Chairs',18500,'Pink','Modern',4.8,'New arrival','https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=800&q=85','A sculptural accent chair with a comfortable seat.'),
('Terry Lounge Chair','Chairs',22000,'Brown','Classic',4.8,'Popular','https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=85','A warm, characterful chair for a living space.'),
('Loly Two-Seater','Sofas',48000,'Yellow','Modern',4.7,'','https://images.unsplash.com/photo-1550254478-ead40cc54513?auto=format&fit=crop&w=800&q=85','A compact sofa for smaller rooms.'),
('Molly Three-Seater','Sofas',72000,'Cream','Minimal',4.8,'','https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?auto=format&fit=crop&w=800&q=85','A relaxed neutral sofa with understated styling.'),
('Nora Coffee Table','Tables',19500,'Brown','Rustic',4.6,'','https://images.unsplash.com/photo-1499933374294-4584851497cc?auto=format&fit=crop&w=800&q=85','A versatile coffee table with a natural look.'),
('Haven Storage Cabinet','Storage',38500,'Brown','Minimal',4.7,'','https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=85','Simple storage for everyday essentials.'),
('Serene Bed Frame','Beds',85000,'Grey','Modern',4.9,'Signature','https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=85','A refined bedroom centrepiece.');
