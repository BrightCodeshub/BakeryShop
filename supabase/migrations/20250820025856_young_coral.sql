-- ========================================================
-- Bakery Application Database - Complete Schema Script
-- ========================================================

-- 1. Drop all tables and types for clean slate
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;

-- 2. Create ENUM Types
CREATE TYPE user_role AS ENUM ('customer', 'employee', 'manager');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'preparing', 'ready', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'succeeded', 'failed', 'cancelled');

-- 3. Create Tables
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role user_role DEFAULT 'customer',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL CHECK (price > 0),
  image_url text,
  category text DEFAULT 'other',
  available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status order_status DEFAULT 'pending',
  total decimal(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  customer_email text NOT NULL,
  payment_intent_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  price decimal(10,2) NOT NULL CHECK (price > 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(order_id, menu_item_id)
);

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  stripe_payment_intent_id text NOT NULL UNIQUE,
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  status payment_status DEFAULT 'pending',
  receipt_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Add Indexes for performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_menu_id ON order_items(menu_item_id);
CREATE INDEX idx_payments_order_id ON payments(order_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 6. Helper Functions

-- Helper to check if user has a role in a specified list
CREATE OR REPLACE FUNCTION has_role(uid uuid, allowed_roles user_role[])
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid
      AND p.role = ANY(allowed_roles)
  );
$$;

-- Helper to check ownership of data row by user
CREATE OR REPLACE FUNCTION is_owner(resource_user_id uuid)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT resource_user_id = auth.uid();
$$;

-- 7. RLS Policies (simplified with explicit enum element casts)

-- Profiles: customers can access their own profile, managers can access all
CREATE POLICY profiles_select
  ON profiles FOR SELECT USING (
    is_owner(id) OR has_role(auth.uid(), ARRAY['manager'::user_role])
  );

CREATE POLICY profiles_update
  ON profiles FOR UPDATE USING (
    is_owner(id) OR has_role(auth.uid(), ARRAY['manager'::user_role])
  );

-- Menu Items: everyone can read available items, managers can manage all
CREATE POLICY menu_items_read
  ON menu_items FOR SELECT USING (available = true);

CREATE POLICY menu_items_manage
  ON menu_items FOR ALL USING (
    has_role(auth.uid(), ARRAY['manager'::user_role])
  );

-- Orders: customers only own orders, staff (manager and employee) all access
CREATE POLICY orders_customer_access
  ON orders FOR ALL USING (is_owner(user_id))
  WITH CHECK (is_owner(user_id));

CREATE POLICY orders_staff_access
  ON orders FOR ALL USING (
    has_role(auth.uid(), ARRAY['manager'::user_role, 'employee'::user_role])
  );

-- Order Items: customers only their orders, staff can read all
CREATE POLICY order_items_customer
  ON order_items FOR ALL USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id AND is_owner(o.user_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id AND is_owner(o.user_id)
    )
  );

CREATE POLICY order_items_staff
  ON order_items FOR SELECT USING (
    has_role(auth.uid(), ARRAY['manager'::user_role, 'employee'::user_role])
  );

-- Payments: customers only their payments, managers can see all
CREATE POLICY payments_customer
  ON payments FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = payments.order_id AND is_owner(o.user_id)
    )
  );

CREATE POLICY payments_manager
  ON payments FOR SELECT USING (
    has_role(auth.uid(), ARRAY['manager'::user_role])
  );

CREATE POLICY payments_system_insert
  ON payments FOR INSERT TO authenticated WITH CHECK (true);

-- 8. Triggers and Utilities

-- Auto update updated_at on update
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_profiles
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_timestamp_orders
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_timestamp_payments
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-create profile on new auth.user insertion
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'customer')::user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update orders total on order_items change
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS trigger AS $$
BEGIN
  UPDATE orders
  SET total = (
    SELECT COALESCE(SUM(quantity * price), 0)
    FROM order_items
    WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
  )
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_item_change ON order_items;

CREATE TRIGGER on_order_item_change
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW EXECUTE FUNCTION update_order_total();

-- 9. Seed menu items
INSERT INTO menu_items (name, description, price, category, image_url, available) VALUES
  ('Classic Croissant', 'Buttery, flaky pastry perfect for breakfast', 3.50, 'pastries', 'https://images.pexels.com/photos/209196/pexels-photo-209196.jpeg', true),
  ('Chocolate Eclair', 'Light choux pastry filled with rich chocolate cream', 4.25, 'pastries', 'https://images.pexels.com/photos/1070850/pexels-photo-1070850.jpeg', true),
  ('Red Velvet Cupcake', 'Moist red velvet cake topped with cream cheese frosting', 5.00, 'cupcakes', 'https://images.pexels.com/photos/1055270/pexels-photo-1055270.jpeg', true),
  ('Artisan Sourdough', 'Handcrafted sourdough bread with a perfect crust', 6.75, 'breads', 'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg', true),
  ('Strawberry Tart', 'Fresh strawberries on vanilla custard in a crisp shell', 7.50, 'tarts', 'https://images.pexels.com/photos/1126728/pexels-photo-1126728.jpeg', true),
  ('Chocolate Chip Cookies', 'Warm, gooey cookies loaded with chocolate chips', 2.75, 'cookies', 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg', true);

-- 10. Seed demo users & assign roles (For testing/dev only)
INSERT INTO auth.users (id, email, encrypted_password)
VALUES
  (gen_random_uuid(), 'customer1@example.com', crypt('password', gen_salt('bf'))),
  (gen_random_uuid(), 'employee1@example.com', crypt('password', gen_salt('bf'))),
  (gen_random_uuid(), 'manager1@example.com', crypt('password', gen_salt('bf')));

-- Update auto-created profiles roles
UPDATE profiles SET role = 'customer' WHERE email = 'customer1@example.com';
UPDATE profiles SET role = 'employee' WHERE email = 'employee1@example.com';
UPDATE profiles SET role = 'manager'  WHERE email = 'manager1@example.com';

-- 11. Seed demo orders, order_items, and payments

-- Insert orders matching demo users
INSERT INTO orders (id, user_id, customer_email, status)
SELECT gen_random_uuid(), id, email, 'pending'
FROM profiles WHERE email = 'customer1@example.com';

INSERT INTO orders (id, user_id, customer_email, status)
SELECT gen_random_uuid(), id, email, 'preparing'
FROM profiles WHERE email = 'employee1@example.com';

INSERT INTO orders (id, user_id, customer_email, status)
SELECT gen_random_uuid(), id, email, 'completed'
FROM profiles WHERE email = 'manager1@example.com';

-- Insert order items

INSERT INTO order_items (order_id, menu_item_id, quantity, price)
SELECT o.id, mi.id, 2, mi.price
FROM orders o, menu_items mi
WHERE o.customer_email = 'customer1@example.com' AND mi.name = 'Classic Croissant';

INSERT INTO order_items (order_id, menu_item_id, quantity, price)
SELECT o.id, mi.id, 1, mi.price
FROM orders o, menu_items mi
WHERE o.customer_email = 'customer1@example.com' AND mi.name = 'Red Velvet Cupcake';

INSERT INTO order_items (order_id, menu_item_id, quantity, price)
SELECT o.id, mi.id, 3, mi.price
FROM orders o, menu_items mi
WHERE o.customer_email = 'employee1@example.com' AND mi.name = 'Chocolate Chip Cookies';

INSERT INTO order_items (order_id, menu_item_id, quantity, price)
SELECT o.id, mi.id, 1, mi.price
FROM orders o, menu_items mi
WHERE o.customer_email = 'manager1@example.com' AND mi.name = 'Artisan Sourdough';

INSERT INTO order_items (order_id, menu_item_id, quantity, price)
SELECT o.id, mi.id, 1, mi.price
FROM orders o, menu_items mi
WHERE o.customer_email = 'manager1@example.com' AND mi.name = 'Strawberry Tart';

-- Insert payments

INSERT INTO payments (order_id, stripe_payment_intent_id, amount, status)
SELECT o.id, 'pi_demo_manager', o.total, 'succeeded'
FROM orders o WHERE o.customer_email = 'manager1@example.com';

INSERT INTO payments (order_id, stripe_payment_intent_id, amount, status)
SELECT o.id, 'pi_demo_employee', o.total, 'pending'
FROM orders o WHERE o.customer_email = 'employee1@example.com';

-- Totals will be auto-updated by the trigger on order_items
