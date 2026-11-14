-- ================================================================
-- Multi-Tenant QR Table Ordering Platform Schema
-- Run this complete script in your Supabase SQL Editor
-- (https://supabase.com/dashboard/project/rxwezdvxybjxnrigcdvt/sql/new)
-- ================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Restaurants Table (Tenants)
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    tagline TEXT,
    logo_url TEXT,
    banner_url TEXT,
    currency TEXT DEFAULT '₹',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tables (per Restaurant)
CREATE TABLE IF NOT EXISTS tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    table_number INTEGER NOT NULL,
    capacity INTEGER DEFAULT 4,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(restaurant_id, table_number)
);

-- 4. Categories (e.g. Starters, Main Course, Drinks, Desserts)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Menu Items (with 1-click Sold Out toggle)
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    is_veg BOOLEAN DEFAULT TRUE,
    is_available BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    table_number INTEGER NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING', 
    -- Allowed statuses: 'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED', 'REJECTED'
    notes TEXT,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    feedback_rating INTEGER,
    feedback_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    item_price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Service Calls / Table Bells Table
CREATE TABLE IF NOT EXISTS service_calls (
    id TEXT PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    table_number INTEGER NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- 'BILL', 'FOOD_INFO', 'FEEDBACK', 'DOUBT', 'WATER', 'WAITER'
    item_name TEXT,
    item_id TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'RESOLVED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enables anonymous diners & kitchen staff to read/write seamlessly
-- ================================================================

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Restaurants" ON restaurants;
DROP POLICY IF EXISTS "Public Insert Restaurants" ON restaurants;
DROP POLICY IF EXISTS "Public Update Restaurants" ON restaurants;
CREATE POLICY "Public Read Restaurants" ON restaurants FOR SELECT USING (true);
CREATE POLICY "Public Insert Restaurants" ON restaurants FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Restaurants" ON restaurants FOR UPDATE USING (true);

ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Tables" ON tables;
DROP POLICY IF EXISTS "Public Insert Tables" ON tables;
DROP POLICY IF EXISTS "Public Update Tables" ON tables;
CREATE POLICY "Public Read Tables" ON tables FOR SELECT USING (true);
CREATE POLICY "Public Insert Tables" ON tables FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Tables" ON tables FOR UPDATE USING (true);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Categories" ON categories;
DROP POLICY IF EXISTS "Public Insert Categories" ON categories;
DROP POLICY IF EXISTS "Public Update Categories" ON categories;
CREATE POLICY "Public Read Categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public Insert Categories" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Categories" ON categories FOR UPDATE USING (true);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Menu Items" ON menu_items;
DROP POLICY IF EXISTS "Public Insert Menu Items" ON menu_items;
DROP POLICY IF EXISTS "Public Update Menu Items" ON menu_items;
DROP POLICY IF EXISTS "Public Delete Menu Items" ON menu_items;
CREATE POLICY "Public Read Menu Items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Public Insert Menu Items" ON menu_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Menu Items" ON menu_items FOR UPDATE USING (true);
CREATE POLICY "Public Delete Menu Items" ON menu_items FOR DELETE USING (true);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Orders" ON orders;
DROP POLICY IF EXISTS "Public Insert Orders" ON orders;
DROP POLICY IF EXISTS "Public Update Orders" ON orders;
CREATE POLICY "Public Read Orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Public Insert Orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Orders" ON orders FOR UPDATE USING (true);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Order Items" ON order_items;
DROP POLICY IF EXISTS "Public Insert Order Items" ON order_items;
DROP POLICY IF EXISTS "Public Update Order Items" ON order_items;
CREATE POLICY "Public Read Order Items" ON order_items FOR SELECT USING (true);
CREATE POLICY "Public Insert Order Items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Order Items" ON order_items FOR UPDATE USING (true);

ALTER TABLE service_calls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Service Calls" ON service_calls;
DROP POLICY IF EXISTS "Public Insert Service Calls" ON service_calls;
DROP POLICY IF EXISTS "Public Update Service Calls" ON service_calls;
CREATE POLICY "Public Read Service Calls" ON service_calls FOR SELECT USING (true);
CREATE POLICY "Public Insert Service Calls" ON service_calls FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Service Calls" ON service_calls FOR UPDATE USING (true);

-- ================================================================
-- ENABLE SUPABASE REALTIME REPLICATION SAFELY
-- Essential for cross-device mobile-to-kitchen push notifications
-- ================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'menu_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;
  END IF;
END $$;

-- ================================================================
-- SEED DATA: Demo Restaurant (The Rustic Grill)
-- ================================================================

INSERT INTO restaurants (id, slug, name, tagline, logo_url, banner_url, currency)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'rustic-grill',
    'The Rustic Grill',
    'Wood-fired Artisan Eatery',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
    '₹'
) ON CONFLICT (slug) DO NOTHING;

-- Demo Tables (1 to 10)
INSERT INTO tables (restaurant_id, table_number)
SELECT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', generate_series(1, 10)
ON CONFLICT (restaurant_id, table_number) DO NOTHING;

-- Demo Categories
INSERT INTO categories (id, restaurant_id, name, sort_order) VALUES
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Starters & Bites', 1),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Wood-Fired Pizzas', 2),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b03', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Burgers & Mains', 3),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b04', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Beverages & Mocktails', 4),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b05', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Desserts', 5)
ON CONFLICT DO NOTHING;

-- Demo Menu Items (All matching restaurant ID a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11)
INSERT INTO menu_items (restaurant_id, category_id, name, description, price, image_url, is_veg, is_available) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b01', 'Truffle Parmesan Fries', 'Crispy hand-cut fries tossed in white truffle oil and aged parmesan.', 180.00, 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=80', TRUE, TRUE),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b01', 'Spicy Buffalo Wings', 'Tossed in signature tangy cayenne sauce with blue cheese dip.', 260.00, 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&auto=format&fit=crop&q=80', FALSE, TRUE),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b02', 'Margherita Classica', 'San Marzano tomato sauce, fresh buffalo mozzarella, and sweet basil.', 340.00, 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop&q=80', TRUE, TRUE),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b02', 'Smoked Pepperoni & Hot Honey', 'Dry-cured pepperoni, chili flakes, and hot blossom honey drizzle.', 420.00, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&auto=format&fit=crop&q=80', FALSE, TRUE),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b03', 'Prime Angus Smash Burger', 'Double smashed Angus beef, cheddar, caramelized onions, house brioche.', 360.00, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80', FALSE, TRUE),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b03', 'Crispy Paneer Brioche Burger', 'Spiced crisp paneer slab, crunchy slaw, mint mayo.', 310.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=80', TRUE, TRUE),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b04', 'Wild Berry Mojito', 'Fresh blackberries, mint leaves, lime juice, and sparkling soda.', 160.00, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80', TRUE, TRUE),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b04', 'Iced Caramel Macchiato', 'Cold-brewed espresso, whole milk, Madagascar vanilla, caramel drizzle.', 180.00, 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=80', TRUE, TRUE),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b05', 'Warm Belgian Lava Cake', 'Gooey dark chocolate center served with vanilla bean ice cream.', 220.00, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80', TRUE, TRUE)
ON CONFLICT DO NOTHING;
