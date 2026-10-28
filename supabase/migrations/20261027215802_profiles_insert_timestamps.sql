-- Custom migration: the server sets both timestamps on insert. The table-level INSERT grant (needed
-- because Drizzle lists every column) would otherwise let clients backdate a profile, for example
-- through the Data API. Updates cannot touch the timestamps: only `display_name` is granted, and
-- `moddatetime` sets `updated_at`.

create function public.profiles_set_insert_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_at := now();
  new.updated_at := now();

  return new;
end;
$$;

create trigger profiles_set_insert_timestamps
  before insert on public.profiles
  for each row execute function public.profiles_set_insert_timestamps();
