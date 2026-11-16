-- ============================================================================
-- FreshBowl Supabase PostgreSQL Schema & Seed Script
-- Project ID: uxkaxigpmgtnmmuuqstz
-- Payment Policy: Cash on Delivery Only
-- Paste and run this entire script in the Supabase SQL Editor.
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. Membership Plans
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  price numeric(10, 2) not null check (price >= 0),
  duration_days integer not null check (duration_days > 0),
  duration_label text not null,
  salads_included integer not null check (salads_included > 0),
  cadence_label text not null,
  benefits text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2. Users (Admins & Members)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  phone text default '',
  address text default '',
  status text not null default 'active' check (status in ('active', 'inactive')),
  membership_plan_id uuid references public.plans(id) on delete set null,
  joined_date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 3. Ready-Made Salads
create table if not exists public.salads (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  diet_type text not null check (diet_type in ('Vegan', 'Keto', 'Low-Carb', 'High-Protein', 'Weight Loss')),
  image text not null,
  calories integer not null check (calories >= 0),
  protein integer not null check (protein >= 0),
  carbs integer not null check (carbs >= 0),
  fat integer not null check (fat >= 0),
  price numeric(10, 2) not null check (price >= 0),
  ingredients_list text[] not null default '{}',
  in_stock boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

-- 4. Custom Salad Builder Ingredients
create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null check (category in ('base', 'topping', 'protein', 'dressing')),
  sub_category text not null default 'general',
  price numeric(10, 2) not null check (price >= 0),
  calories integer not null check (calories >= 0),
  protein integer not null check (protein >= 0),
  carbs integer not null check (carbs >= 0),
  fat integer not null check (fat >= 0),
  in_stock boolean not null default true,
  diet_tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- 5. Member Subscriptions
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete restrict,
  frequency text not null default '5_per_week' check (frequency in ('1_per_day', '5_per_week')),
  delivery_days text[] not null default array['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  time_slot text not null default '12:00 PM - 1:00 PM',
  delivery_address text not null,
  preferred_salad_id uuid references public.salads(id) on delete set null,
  custom_salad jsonb,
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled')),
  start_date timestamptz not null default now(),
  next_renewal_date timestamptz not null,
  created_at timestamptz not null default now()
);

-- 6. Orders (Cash on Delivery Only)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references public.users(id) on delete cascade,
  items jsonb not null,
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  delivery_fee numeric(10, 2) not null default 0 check (delivery_fee >= 0),
  total_amount numeric(10, 2) not null check (total_amount >= 0),
  delivery_address text not null,
  phone text not null,
  delivery_note text default '',
  payment_method text not null default 'Cash on Delivery' check (payment_method = 'Cash on Delivery'),
  status text not null default 'Placed' check (status in ('Placed', 'Preparing', 'Out for Delivery', 'Delivered')),
  created_at timestamptz not null default now()
);

-- 7. Saved Custom Favorites
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  base jsonb not null,
  toppings jsonb not null default '[]'::jsonb,
  protein jsonb,
  dressing jsonb,
  total_price numeric(10, 2) not null,
  total_calories integer not null,
  total_protein integer not null,
  total_carbs integer not null,
  total_fat integer not null,
  created_at timestamptz not null default now()
);

-- Helpful Indexes
create index if not exists idx_users_email on public.users(email);
create index if not exists idx_salads_diet on public.salads(diet_type);
create index if not exists idx_ingredients_cat on public.ingredients(category);
create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_subscriptions_user on public.subscriptions(user_id);
create index if not exists idx_favorites_user on public.favorites(user_id);

-- ============================================================================
-- Seed Data: 3 Plans, 10 Salads, 20 Ingredients, 1 Admin
-- ============================================================================

insert into public.plans (name, slug, price, duration_days, duration_label, salads_included, cadence_label, benefits, is_active)
values
  (
    'Weekly Plan',
    'weekly-plan',
    54.00,
    7,
    '7 Days',
    5,
    '5 salads / week',
    array[
      '5 chef-crafted or custom bowls delivered Monday–Friday',
      'Flexible morning or midday delivery window',
      'Full macro breakdown per bowl',
      'Pay via Cash on Delivery — pause or skip weeks anytime'
    ],
    true
  ),
  (
    'Monthly Plan',
    'monthly-plan',
    189.00,
    30,
    '30 Days',
    20,
    '5 salads / week',
    array[
      '20 fresh bowls per month (weekday schedule)',
      'Free priority chilled courier delivery',
      'Save 15% compared to single-bowl orders',
      'Swap between ready-made and custom saved bowls'
    ],
    true
  ),
  (
    'Premium Plan',
    'premium-plan',
    269.00,
    30,
    '30 Days',
    30,
    '1 salad / day',
    array[
      '30 daily bowls including weekends (1 salad per day)',
      'Complimentary extra protein & superfood toppings',
      'Priority early-morning or lunch time slots',
      'Instant 1-click pause, resume, or custom recipe swaps'
    ],
    true
  )
on conflict (slug) do nothing;

insert into public.salads (name, description, diet_type, image, calories, protein, carbs, fat, price, ingredients_list, in_stock, featured)
values
  ('Mediterranean Quinoa & Chickpea', 'Tri-color quinoa, roasted spiced chickpeas, English cucumber, heirloom cherry tomatoes, parsley, and cold-pressed lemon olive oil.', 'Vegan', '/src/assets/images/salad_mediterranean_quinoa_1794716158637.jpg', 440, 18, 52, 16, 13.50, array['Tri-Color Quinoa', 'Roasted Chickpeas', 'Cherry Tomatoes', 'English Cucumber', 'Lemon Vinaigrette'], true, true),
  ('Keto Avocado Herb Cobb', 'Crisp romaine hearts, grilled rosemary chicken breast, half Hass avocado, soft-boiled pasture egg, and extra virgin olive oil.', 'Keto', '/src/assets/images/salad_keto_avocado_cobb_1794716158856.jpg', 520, 42, 9, 35, 15.50, array['Romaine Lettuce', 'Herb Grilled Chicken', 'Hass Avocado', 'Soft-Boiled Egg', 'Extra Virgin Olive Oil'], true, true),
  ('Emerald Detox Greens', 'Massaged baby kale and spinach tossed with crisp green apple slices, shelled edamame, toasted sunflower seeds, and lemon-yogurt herb dressing.', 'Weight Loss', '/src/assets/images/salad_vegan_greens_detox_1794716160028.jpg', 320, 16, 28, 14, 12.75, array['Baby Spinach', 'Massaged Kale', 'Green Apple Slices', 'Edamame', 'Greek Yogurt Herb'], true, true),
  ('Sesame Tofu Superfood Crunch', 'Seared organic sesame tofu over quinoa, shaved purple cabbage, julienned carrots, edamame, radish, and toasted almonds.', 'High-Protein', '/src/assets/images/salad_protein_tofu_crunch_1794716160536.jpg', 495, 32, 38, 22, 14.50, array['Sesame Tofu', 'Tri-Color Quinoa', 'Purple Cabbage', 'Roasted Almonds', 'Aged Balsamic Glaze'], true, true),
  ('Harvest Chicken & Kale Power', 'Char-grilled lemon herb chicken, massaged curly kale, quinoa, cherry tomatoes, sliced avocado, and roasted pepitas.', 'High-Protein', '/src/assets/images/hero_fresh_salad_1794716157514.jpg', 540, 46, 30, 24, 15.25, array['Herb Grilled Chicken', 'Massaged Kale', 'Hass Avocado', 'Pumpkin Seeds', 'Lemon Vinaigrette'], true, false),
  ('Low-Carb Paneer & Greens', 'Charred spiced paneer cubes on baby spinach and romaine, cucumber ribbons, cherry tomatoes, pumpkin seeds, and yogurt herb drizzle.', 'Low-Carb', '/src/assets/images/salad_keto_avocado_cobb_1794716158856.jpg', 410, 28, 11, 28, 14.25, array['Marinated Paneer', 'Baby Spinach', 'English Cucumber', 'Pumpkin Seeds', 'Greek Yogurt Herb'], true, false),
  ('Garden Lean Apple & Almond', 'Light crisp romaine and baby kale paired with tart green apple, cherry tomatoes, roasted almonds, and aged balsamic glaze.', 'Weight Loss', '/src/assets/images/salad_vegan_greens_detox_1794716160028.jpg', 295, 11, 26, 15, 11.95, array['Romaine Lettuce', 'Massaged Kale', 'Green Apple Slices', 'Roasted Almonds', 'Aged Balsamic Glaze'], true, false),
  ('Plant-Powered Chickpea Crunch', 'Warm roasted chickpeas, baby spinach, Kalamata olives, cucumber, cherry tomatoes, and cold-pressed lemon dressing.', 'Vegan', '/src/assets/images/salad_mediterranean_quinoa_1794716158637.jpg', 380, 16, 42, 15, 12.95, array['Baby Spinach', 'Roasted Chickpeas', 'Kalamata Olives', 'Cherry Tomatoes', 'Lemon Vinaigrette'], true, false),
  ('Zero-Grain Keto Egg & Olive', 'Romaine and spinach base topped with double soft-boiled eggs, Hass avocado, Kalamata olives, and extra virgin olive oil.', 'Keto', '/src/assets/images/hero_fresh_salad_1794716157514.jpg', 465, 24, 7, 38, 13.95, array['Romaine Lettuce', 'Soft-Boiled Egg', 'Hass Avocado', 'Kalamata Olives', 'Extra Virgin Olive Oil'], true, false),
  ('Clean Protein Tofu & Greens', 'Low-carbohydrate seared sesame tofu over baby kale, cucumber, cherry tomatoes, pumpkin seeds, and zesty lemon vinaigrette.', 'Low-Carb', '/src/assets/images/salad_protein_tofu_crunch_1794716160536.jpg', 365, 27, 12, 21, 13.75, array['Sesame Tofu', 'Massaged Kale', 'English Cucumber', 'Pumpkin Seeds', 'Lemon Vinaigrette'], true, false)
on conflict (name) do nothing;

insert into public.ingredients (name, category, sub_category, price, calories, protein, carbs, fat, in_stock, diet_tags)
values
  ('Romaine Lettuce', 'base', 'greens', 3.50, 35, 2, 6, 0, true, array['Vegan', 'Keto', 'Low-Carb', 'Weight Loss']),
  ('Baby Spinach', 'base', 'greens', 3.75, 40, 4, 5, 0, true, array['Vegan', 'Keto', 'Low-Carb', 'Weight Loss']),
  ('Massaged Kale', 'base', 'greens', 4.00, 55, 4, 9, 1, true, array['Vegan', 'Keto', 'Low-Carb', 'Weight Loss']),
  ('Tri-Color Quinoa', 'base', 'grains', 4.50, 180, 7, 32, 3, true, array['Vegan', 'High-Protein']),
  ('Cherry Tomatoes', 'topping', 'vegetables', 1.25, 25, 1, 5, 0, true, array['Vegan', 'Keto', 'Low-Carb', 'Weight Loss']),
  ('English Cucumber', 'topping', 'vegetables', 1.00, 15, 1, 3, 0, true, array['Vegan', 'Keto', 'Low-Carb', 'Weight Loss']),
  ('Hass Avocado', 'topping', 'fruits', 2.50, 160, 2, 8, 15, true, array['Vegan', 'Keto', 'Low-Carb']),
  ('Green Apple Slices', 'topping', 'fruits', 1.50, 55, 0, 14, 0, true, array['Vegan', 'Weight Loss']),
  ('Roasted Almonds', 'topping', 'nuts', 1.75, 110, 4, 4, 9, true, array['Vegan', 'Keto', 'Low-Carb', 'High-Protein']),
  ('Pumpkin Seeds', 'topping', 'seeds', 1.50, 95, 5, 3, 8, true, array['Vegan', 'Keto', 'Low-Carb', 'High-Protein']),
  ('Kalamata Olives', 'topping', 'vegetables', 1.50, 70, 0, 2, 7, true, array['Vegan', 'Keto', 'Low-Carb']),
  ('Herb Grilled Chicken', 'protein', 'poultry', 4.50, 190, 34, 1, 5, true, array['Keto', 'Low-Carb', 'High-Protein']),
  ('Marinated Paneer', 'protein', 'dairy', 4.25, 210, 16, 3, 15, true, array['Keto', 'Low-Carb', 'High-Protein']),
  ('Sesame Tofu', 'protein', 'plant', 3.75, 165, 18, 5, 9, true, array['Vegan', 'Keto', 'Low-Carb', 'High-Protein']),
  ('Soft-Boiled Egg', 'protein', 'egg', 2.50, 140, 12, 1, 10, true, array['Keto', 'Low-Carb', 'High-Protein']),
  ('Roasted Chickpeas', 'protein', 'plant', 3.25, 175, 10, 24, 4, true, array['Vegan', 'Weight Loss']),
  ('Extra Virgin Olive Oil', 'dressing', 'oil', 1.25, 120, 0, 0, 14, true, array['Vegan', 'Keto', 'Low-Carb']),
  ('Zesty Lemon Vinaigrette', 'dressing', 'vinaigrette', 1.25, 75, 0, 3, 7, true, array['Vegan', 'Low-Carb', 'Weight Loss']),
  ('Greek Yogurt Herb', 'dressing', 'creamy', 1.50, 80, 4, 4, 5, true, array['Low-Carb', 'High-Protein', 'Weight Loss']),
  ('Aged Balsamic Glaze', 'dressing', 'vinaigrette', 1.25, 65, 0, 9, 3, true, array['Vegan', 'Weight Loss'])
on conflict (name) do nothing;

-- Demo Admin & Member Accounts (password_hash uses pgcrypto bcrypt)
insert into public.users (name, email, password_hash, role, phone, address, status)
values
  (
    'Elena Vance',
    'admin@freshbowl.com',
    crypt('Admin123!', gen_salt('bf')),
    'admin',
    '+1 (415) 555-0100',
    '740 Valencia St, San Francisco, CA',
    'active'
  ),
  (
    'Maya Lin',
    'member@freshbowl.com',
    crypt('Member123!', gen_salt('bf')),
    'member',
    '+1 (415) 555-0148',
    '2140 Market St, Apt 4B, San Francisco, CA',
    'active'
  )
on conflict (email) do nothing;

-- Enable Row Level Security (Backend accesses tables via SUPABASE_SERVICE_ROLE_KEY)
alter table public.plans enable row level security;
alter table public.users enable row level security;
alter table public.salads enable row level security;
alter table public.ingredients enable row level security;
alter table public.subscriptions enable row level security;
alter table public.orders enable row level security;
alter table public.favorites enable row level security;

-- Public read-only catalog access for menu & plans
drop policy if exists "Public read plans" on public.plans;
create policy "Public read plans" on public.plans for select using (true);

drop policy if exists "Public read salads" on public.salads;
create policy "Public read salads" on public.salads for select using (true);

drop policy if exists "Public read ingredients" on public.ingredients;
create policy "Public read ingredients" on public.ingredients for select using (true);
