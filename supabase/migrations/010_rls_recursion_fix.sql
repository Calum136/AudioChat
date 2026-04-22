-- Fix: "infinite recursion detected in policy for relation rooms"
--
-- Migration 009 tightened rooms.SELECT to check room_members, but
-- room_members already has a SELECT policy that references rooms.
-- Postgres recurses through the two policies forever.
--
-- Standard Supabase workaround: call SECURITY DEFINER functions inside
-- the policy USING clauses. Those functions bypass RLS, so the recursion
-- chain is broken.
--
-- Run this in the Supabase SQL Editor AFTER migration 009.

-- =======================================================
-- Helper functions (bypass RLS via SECURITY DEFINER)
-- =======================================================

create or replace function public.is_room_owner(p_room_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.rooms
    where id = p_room_id and owner_id = auth.uid()
  );
$$;

create or replace function public.is_room_member(p_room_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.room_members
    where room_id = p_room_id and user_id = auth.uid()
  );
$$;

grant execute on function public.is_room_owner(uuid) to authenticated;
grant execute on function public.is_room_member(uuid) to authenticated;

-- =======================================================
-- Rewrite rooms SELECT using helpers (no more cross-table reference)
-- =======================================================

drop policy if exists "Rooms are viewable by owner or members" on public.rooms;

create policy "Rooms are viewable by owner or members"
  on public.rooms for select
  to authenticated
  using (
    auth.uid() = owner_id
    or public.is_room_member(id)
  );

-- =======================================================
-- Rewrite furniture SELECT using helpers
-- =======================================================

drop policy if exists "Furniture is viewable by room owner or members" on public.furniture;

create policy "Furniture is viewable by room owner or members"
  on public.furniture for select
  to authenticated
  using (
    public.is_room_owner(room_id)
    or public.is_room_member(room_id)
  );

-- =======================================================
-- Rewrite room_members SELECT (also had recursion risk — referenced
-- room_members inside its own policy)
-- =======================================================

drop policy if exists "Users can view room members" on public.room_members;

create policy "Users can view room members"
  on public.room_members for select
  to authenticated
  using (
    auth.uid() = user_id
    or public.is_room_owner(room_id)
    or public.is_room_member(room_id)
  );
