-- Auto-create a profile row when a new auth user signs up.
-- Uses raw_user_meta_data passed from supabase.auth.signUp({ options: { data: {...} } })
-- Runs as table owner, so RLS doesn't block it.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', 'Player'),
    coalesce(new.raw_user_meta_data ->> 'color', '#4ecdc4')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
