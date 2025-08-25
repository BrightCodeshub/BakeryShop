/*
  # Bakery Application Database Schema

  1. Tables:
    - profiles (user profiles with roles)
    - menu_items (bakery products)
    - orders (customer orders)
    - order_items (items within orders)
    - payments (payment records)

  2. Security:
    - Enable RLS on all tables
    - Role-based policies for customers, employees, managers

  3. Functions & Triggers:
    - Auto-create profile on user signup
    - Update order totals automatically
*/

-- 1. Drop all tables and types for a clean start
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;

-- 2. Create types FIRST
CREATE TYPE user_role AS ENUM ('customer', 'employee', 'manager');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'preparing', 'ready', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'succeeded', 'failed', 'cancelled');

-- 3. Create tables
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
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status order_status DEFAULT 'pending',
  total decimal(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  customer_email text NOT NULL,
  payment_intent_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price decimal(10,2) NOT NULL CHECK (price > 0),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_intent_id text UNIQUE NOT NULL,
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  status payment_status DEFAULT 'pending',
  receipt_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 5. Policies

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Managers can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid() AND p.role = 'manager'
    )
  );

-- Menu items policies
CREATE POLICY "Anyone can read available menu items"
  ON menu_items FOR SELECT
  TO authenticated
  USING (available = true);

CREATE POLICY "Unauthenticated can read available menu items"
  ON menu_items FOR SELECT
  TO anon
  USING (available = true);

CREATE POLICY "Managers can manage menu items"
  ON menu_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid() AND p.role = 'manager'
    )
  );

-- Orders policies
CREATE POLICY "Users can read own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Managers and employees can read all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid() AND p.role IN ('manager', 'employee')
    )
  );

CREATE POLICY "Managers and employees can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid() AND p.role IN ('manager', 'employee')
    )
  );

-- Order items policies
CREATE POLICY "Users can read own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders AS o
      WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items for own orders"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders AS o
      WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Managers and employees can read all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid() AND p.role IN ('manager', 'employee')
    )
  );

-- Payments policies
CREATE POLICY "Users can read own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders AS o
      WHERE o.id = payments.order_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Managers can read all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid() AND p.role = 'manager'
    )
  );

-- 6. Functions and triggers

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

-- 7. Insert sample menu items
INSERT INTO menu_items (name, description, price, category, image_url, available) VALUES
  ('Classic Croissant', 'Buttery, flaky pastry perfect for breakfast', 3.50, 'pastries', 'https://images.pexels.com/photos/209196/pexels-photo-209196.jpeg', true),
  ('Chocolate Eclair', 'Light choux pastry filled with rich chocolate cream', 4.25, 'pastries', 'https://images.pexels.com/photos/1070850/pexels-photo-1070850.jpeg', true),
  ('Red Velvet Cupcake', 'Moist red velvet cake topped with cream cheese frosting', 5.00, 'cupcakes', 'https://images.pexels.com/photos/1055270/pexels-photo-1055270.jpeg', true),
  ('Artisan Sourdough', 'Handcrafted sourdough bread with a perfect crust', 6.75, 'breads', 'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg', true),
  ('Strawberry Tart', 'Fresh strawberries on vanilla custard in a crisp shell', 7.50, 'tarts', 'https://images.pexels.com/photos/1126728/pexels-photo-1126728.jpeg', true),
  ('Chocolate Chip Cookies', 'Warm, gooey cookies loaded with chocolate chips', 2.75, 'cookies', 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg', true);

-- Add the 'role' column to profiles if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'customer';
  END IF;
END
$$;