-- Custom migration: what Drizzle cannot express (extension, trigger, comment, grants).

create extension if not exists moddatetime with schema extensions;

comment on table public.profiles is 'One row per auth user; readable and writable only by its owner.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure extensions.moddatetime (updated_at);

-- Explicit grants: anonymous users get nothing; signed-in users can insert their row (Drizzle lists
-- every column, using DEFAULT for timestamps) but only ever update `display_name`, and get no DELETE
-- (rows are removed with the auth user via ON DELETE CASCADE). RLS restricts all of it to the owner.
revoke all on table public.profiles from anon, authenticated;
grant select, insert on table public.profiles to authenticated;
grant update (display_name) on table public.profiles to authenticated;
