-- ============================================================
-- MYTOWNSHIP — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- PROFILES (extends Supabase auth.users)
-- ─────────────────────────────────────────
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  avatar_url    text,
  phone         text,
  role          text not null default 'user' check (role in ('user','admin','hotel_manager','logistics_agent')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─────────────────────────────────────────
-- HOTELS
-- ─────────────────────────────────────────
create table public.hotels (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  slug          text unique not null,
  description   text,
  address       text not null,
  city          text not null,
  state         text not null,
  country       text not null default 'Nigeria',
  latitude      decimal(10,8),
  longitude     decimal(11,8),
  star_rating   int check (star_rating between 1 and 5),
  amenities     text[] default '{}',
  images        text[] default '{}',
  cover_image   text,
  is_active     boolean not null default true,
  manager_id    uuid references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.hotels enable row level security;

create policy "Anyone can view active hotels" on public.hotels for select using (is_active = true);
create policy "Managers can update own hotel" on public.hotels for update using (
  auth.uid() = manager_id or
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can insert hotels" on public.hotels for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','hotel_manager'))
);


-- ─────────────────────────────────────────
-- ROOMS
-- ─────────────────────────────────────────
create table public.rooms (
  id            uuid primary key default uuid_generate_v4(),
  hotel_id      uuid not null references public.hotels(id) on delete cascade,
  room_type     text not null, -- 'single','double','suite','deluxe'
  room_number   text,
  description   text,
  price_per_night decimal(10,2) not null,
  currency      text not null default 'NGN',
  capacity      int not null default 1,
  amenities     text[] default '{}',
  images        text[] default '{}',
  is_available  boolean not null default true,
  created_at    timestamptz not null default now()
);
alter table public.rooms enable row level security;
create policy "Anyone can view available rooms" on public.rooms for select using (is_available = true);
create policy "Managers can manage rooms" on public.rooms for all using (
  exists (select 1 from public.hotels where id = hotel_id and manager_id = auth.uid())
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);


-- ─────────────────────────────────────────
-- BOOKINGS
-- ─────────────────────────────────────────
create table public.bookings (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id),
  hotel_id        uuid not null references public.hotels(id),
  room_id         uuid not null references public.rooms(id),
  check_in        date not null,
  check_out       date not null,
  guests          int not null default 1,
  total_amount    decimal(10,2) not null,
  currency        text not null default 'NGN',
  status          text not null default 'pending' check (status in ('pending','confirmed','cancelled','completed')),
  payment_method  text check (payment_method in ('paystack','flutterwave','char_token','bank_transfer')),
  payment_ref     text,
  payment_status  text not null default 'unpaid' check (payment_status in ('unpaid','paid','refunded')),
  special_requests text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table public.bookings enable row level security;

create policy "Users can view own bookings" on public.bookings for select using (auth.uid() = user_id);
create policy "Users can create bookings" on public.bookings for insert with check (auth.uid() = user_id);
create policy "Users can cancel own bookings" on public.bookings for update using (auth.uid() = user_id);
create policy "Hotel managers can view their bookings" on public.bookings for select using (
  exists (select 1 from public.hotels where id = hotel_id and manager_id = auth.uid())
);
create policy "Admins can view all bookings" on public.bookings for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);


-- ─────────────────────────────────────────
-- REVIEWS
-- ─────────────────────────────────────────
create table public.reviews (
  id          uuid primary key default uuid_generate_v4(),
  hotel_id    uuid not null references public.hotels(id) on delete cascade,
  user_id     uuid not null references public.profiles(id),
  booking_id  uuid references public.bookings(id),
  rating      int not null check (rating between 1 and 5),
  title       text,
  body        text,
  created_at  timestamptz not null default now()
);
alter table public.reviews enable row level security;
create policy "Anyone can view reviews" on public.reviews for select using (true);
create policy "Users can create reviews for own completed bookings" on public.reviews for insert with check (auth.uid() = user_id);


-- ─────────────────────────────────────────
-- SHIPMENTS (Logistics)
-- ─────────────────────────────────────────
create table public.shipments (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id),
  agent_id        uuid references public.profiles(id),
  tracking_code   text unique not null,
  description     text,
  weight_kg       decimal(8,2),
  origin_address  text not null,
  origin_city     text not null,
  dest_address    text not null,
  dest_city       text not null,
  status          text not null default 'pending' check (
    status in ('pending','picked_up','in_transit','out_for_delivery','delivered','failed','returned')
  ),
  estimated_delivery date,
  actual_delivery    timestamptz,
  price           decimal(10,2),
  currency        text not null default 'NGN',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table public.shipments enable row level security;

create policy "Users can view own shipments" on public.shipments for select using (auth.uid() = user_id);
create policy "Users can create shipments" on public.shipments for insert with check (auth.uid() = user_id);
create policy "Agents can update assigned shipments" on public.shipments for update using (
  auth.uid() = agent_id or
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','logistics_agent'))
);


-- ─────────────────────────────────────────
-- SHIPMENT TRACKING EVENTS
-- ─────────────────────────────────────────
create table public.shipment_events (
  id           uuid primary key default uuid_generate_v4(),
  shipment_id  uuid not null references public.shipments(id) on delete cascade,
  status       text not null,
  location     text,
  notes        text,
  created_at   timestamptz not null default now()
);
alter table public.shipment_events enable row level security;
create policy "Anyone with shipment access can view events" on public.shipment_events for select using (
  exists (select 1 from public.shipments where id = shipment_id and user_id = auth.uid())
  or exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','logistics_agent'))
);


-- ─────────────────────────────────────────
-- INDEXES for performance
-- ─────────────────────────────────────────
create index on public.hotels (city, is_active);
create index on public.rooms (hotel_id, is_available);
create index on public.bookings (user_id, status);
create index on public.bookings (hotel_id, check_in, check_out);
create index on public.shipments (user_id, status);
create index on public.shipments (tracking_code);
create index on public.shipment_events (shipment_id);


-- ─────────────────────────────────────────
-- HELPER: updated_at triggers
-- ─────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger set_profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger set_hotels_updated_at before update on public.hotels for each row execute procedure public.set_updated_at();
create trigger set_bookings_updated_at before update on public.bookings for each row execute procedure public.set_updated_at();
create trigger set_shipments_updated_at before update on public.shipments for each row execute procedure public.set_updated_at();
