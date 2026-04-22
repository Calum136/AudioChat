-- RLS hardening: tighten over-permissive policies (SEC-6, SEC-7, SEC-8)
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
--
-- Before this migration:
--   • any authenticated user could SELECT every room (leaks join_codes)
--   • any authenticated user could SELECT every piece of furniture
--   • any authenticated user could INSERT/UPDATE any file in room-images
--     (not just their own folder)
--
-- After this migration only people who own or have joined a room can read
-- its metadata and furniture. Public join-by-code still works via a
-- SECURITY DEFINER RPC that returns a single row by code.

-- =======================================================
-- 1. Rooms: tighten SELECT to owner + members only.
-- =======================================================

drop policy if exists "Rooms are viewable by authenticated users" on public.rooms;

create policy "Rooms are viewable by owner or members"
  on public.rooms for select
  to authenticated
  using (
    auth.uid() = owner_id
    or exists (
      select 1 from public.room_members rm
      where rm.room_id = rooms.id and rm.user_id = auth.uid()
    )
  );

-- RPC used by join-by-code flow. Bypasses RLS so users can discover a
-- room by its code before they are a member. Returns at most one row and
-- never exposes rooms that don't match the provided code.
create or replace function public.find_room_by_code(code text)
returns setof public.rooms
language sql
security definer
set search_path = public
as $$
  select * from public.rooms
  where lower(join_code) = lower(trim(code))
  limit 1;
$$;

grant execute on function public.find_room_by_code(text) to authenticated;

-- =======================================================
-- 2. Furniture: tighten SELECT to room owner + members only.
-- =======================================================

drop policy if exists "Furniture is viewable by authenticated users" on public.furniture;

create policy "Furniture is viewable by room owner or members"
  on public.furniture for select
  to authenticated
  using (
    exists (
      select 1 from public.rooms r
      where r.id = furniture.room_id and r.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.room_members rm
      where rm.room_id = furniture.room_id and rm.user_id = auth.uid()
    )
  );

-- =======================================================
-- 3. room-images storage: restrict writes to the user's own folder.
-- =======================================================
--
-- Previously any authenticated user could upload to (or overwrite) any
-- path in the bucket. Tighten so writes only land under `<auth.uid>/…`.

drop policy if exists "Authenticated users can upload room images" on storage.objects;
drop policy if exists "Authenticated users can update room images" on storage.objects;

create policy "Users can upload room images to their own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'room-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update room images in their own folder"
  on storage.objects for update
  using (
    bucket_id = 'room-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
