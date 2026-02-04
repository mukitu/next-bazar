
-- ১. প্রোফাইল টেবিল (Roles: user, admin)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  full_name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ২. ক্যাটাগরি টেবিল
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ৩. প্রোডাক্ট টেবিল
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  discount_price DECIMAL(10,2),
  stock INTEGER DEFAULT 0,
  sku TEXT UNIQUE,
  images TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  is_flash_sale BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ৪. অর্ডার টেবিল
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Payment Submitted', 'Approved', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  phone TEXT NOT NULL,
  bkash_tx_id TEXT,
  bkash_charge DECIMAL(10,2) DEFAULT 0,
  cod_charge DECIMAL(10,2) DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ৫. অর্ডার আইটেম টেবিল
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  price_at_time DECIMAL(10,2) NOT NULL
);

-- ৬. সিকিউরিটি (RLS) সেটাআপ
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ৭. পলিসি (সবাই প্রোডাক্ট দেখতে পারবে, কিন্তু শুধু অ্যাডমিন এডিট করতে পারবে)
CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Users Read Own Profiles" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users Update Own Profiles" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users Read Own Orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users Create Orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ৮. অ্যাডমিন পলিসি (অ্যাডমিন সব করতে পারবে)
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admin Full Access Profiles" ON public.profiles FOR ALL USING (public.is_admin());
CREATE POLICY "Admin Full Access Categories" ON public.categories FOR ALL USING (public.is_admin());
CREATE POLICY "Admin Full Access Products" ON public.products FOR ALL USING (public.is_admin());
CREATE POLICY "Admin Full Access Orders" ON public.orders FOR ALL USING (public.is_admin());

-- ৯. অটো-প্রোফাইল ট্রিগার
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (NEW.id, NEW.email, 'user', COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
