-- Friendships: friend requests, accepted friends, blocks
create table public.friendships (
  id uuid default gen_random_uuid() primary key,
  requester_id uuid references public.profiles(id) on delete cascade not null,
  addressee_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'blocked')),
  blocked_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique(requester_id, addressee_id)
);

alter table public.friendships enable row level security;

create index idx_friendships_requester on public.friendships(requester_id);
create index idx_friendships_addressee on public.friendships(addressee_id);
create index idx_friendships_status on public.friendships(status);

-- Users can see friendships they are part of
create policy "Users can view own friendships"
  on public.friendships for select
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Users can send friend requests (as requester, status must be pending)
create policy "Users can send friend requests"
  on public.friendships for insert
  to authenticated
  with check (auth.uid() = requester_id and status = 'pending');

-- Either party can update (accept, block)
create policy "Users can update own friendships"
  on public.friendships for update
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Either party can delete (unfriend, decline)
create policy "Users can delete own friendships"
  on public.friendships for delete
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Index for user search by display name
create index idx_profiles_display_name on public.profiles(lower(display_name));
