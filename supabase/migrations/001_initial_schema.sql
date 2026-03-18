-- Sidequest Initial Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/kxbqypmmbankrkyczmak/sql

-- Profiles: extends auth.users with app-specific data
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text not null check (char_length(display_name) between 1 and 20),
  color text not null default '#4ecdc4',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);


-- Rooms
create table public.rooms (
  id uuid default gen_random_uuid() primary key,
  name text not null check (char_length(name) between 1 and 40),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  theme text not null default 'gaming-den',
  join_code text unique not null default substr(replace(gen_random_uuid()::text, '-', ''), 1, 6),
  created_at timestamptz not null default now()
);

alter table public.rooms enable row level security;

create policy "Rooms are viewable by authenticated users"
  on public.rooms for select
  to authenticated
  using (true);

create policy "Room owners can update their rooms"
  on public.rooms for update
  to authenticated
  using (auth.uid() = owner_id);

create policy "Authenticated users can create rooms"
  on public.rooms for insert
  to authenticated
  with check (auth.uid() = owner_id);


-- Furniture: persistent layout for each room
create table public.furniture (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.rooms(id) on delete cascade not null,
  type text not null,
  x real not null default 0,
  y real not null default 0,
  created_at timestamptz not null default now()
);

alter table public.furniture enable row level security;

create policy "Furniture is viewable by authenticated users"
  on public.furniture for select
  to authenticated
  using (true);

create policy "Room owners can add furniture"
  on public.furniture for insert
  to authenticated
  with check (
    auth.uid() = (select owner_id from public.rooms where id = room_id)
  );

create policy "Room owners can update furniture"
  on public.furniture for update
  to authenticated
  using (
    auth.uid() = (select owner_id from public.rooms where id = room_id)
  );

create policy "Room owners can delete furniture"
  on public.furniture for delete
  to authenticated
  using (
    auth.uid() = (select owner_id from public.rooms where id = room_id)
  );

-- Indexes
create index idx_furniture_room_id on public.furniture(room_id);
create index idx_rooms_join_code on public.rooms(join_code);
