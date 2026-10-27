-- Minimal user-owned record that demonstrates Supabase Auth + RLS.
-- Replace or extend it with your product schema.

create extension if not exists moddatetime with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) between 1 and 50),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per auth user; readable and writable only by its owner.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure extensions.moddatetime (updated_at);

alter table public.profiles enable row level security;

-- Explicit grants: anonymous users get nothing, signed-in users get no DELETE
-- (rows are removed with the auth user via ON DELETE CASCADE).
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant insert (id, display_name), update (id, display_name) on table public.profiles to authenticated;

create policy "Owners can read their profile"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "Owners can create their profile"
  on public.profiles for insert
  to authenticated
  with check (id = (select auth.uid()));

create policy "Owners can update their profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
