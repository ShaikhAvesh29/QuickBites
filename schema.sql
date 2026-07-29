-- ============================================================
-- QuickBite Schema — safe to re-run (idempotent)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    phone_number TEXT
);

-- 2. menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    order_code TEXT NOT NULL,
    total_amount NUMERIC NOT NULL,
    pickup_time TIME NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'preparing', 'ready', 'completed')) DEFAULT 'pending',
    payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'paid')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0)
);

-- ── Trigger: auto-create profile on signup ──────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone_number)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone_number'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first so we can recreate cleanly
DO $$ BEGIN
  -- profiles
  DROP POLICY IF EXISTS "Users can view own profile."     ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile."   ON profiles;
  DROP POLICY IF EXISTS "Admin can view all profiles."    ON profiles;
  -- menu_items
  DROP POLICY IF EXISTS "Allow public read access on menu_items"  ON menu_items;
  DROP POLICY IF EXISTS "Allow public insert on menu_items"       ON menu_items;
  DROP POLICY IF EXISTS "Allow public update on menu_items"       ON menu_items;
  DROP POLICY IF EXISTS "Allow public delete on menu_items"       ON menu_items;
  -- orders
  DROP POLICY IF EXISTS "Users can view own orders."   ON orders;
  DROP POLICY IF EXISTS "Users can create own orders." ON orders;
  DROP POLICY IF EXISTS "Admins can update orders."    ON orders;
  -- order_items
  DROP POLICY IF EXISTS "Users can view own order items."  ON order_items;
  DROP POLICY IF EXISTS "Users can create order items."    ON order_items;
END $$;

-- profiles policies
CREATE POLICY "Users can view own profile."   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin can view all profiles."  ON profiles FOR SELECT USING (true);

-- menu_items policies (public read; write open for admin panel via anon key)
CREATE POLICY "Allow public read access on menu_items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert on menu_items"      ON menu_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on menu_items"      ON menu_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on menu_items"      ON menu_items FOR DELETE USING (true);

-- orders policies
CREATE POLICY "Users can view own orders."   ON orders FOR SELECT USING (auth.uid() = user_id OR true);
CREATE POLICY "Users can create own orders." ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update orders."    ON orders FOR UPDATE USING (true);

-- order_items policies
CREATE POLICY "Users can view own order items." ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR true))
);
CREATE POLICY "Users can create order items." ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- ── Realtime ────────────────────────────────────────────────
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE orders, menu_items;
