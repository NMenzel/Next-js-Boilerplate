-- RLS allow/deny tests for public.profiles. Run with `npm run test:rls`.
begin;

create extension if not exists pgtap with schema extensions;

select plan(15);

insert into auth.users (id, email, aud, role)
values
  ('11111111-1111-4111-8111-111111111111', 'owner@example.test', 'authenticated', 'authenticated'),
  ('22222222-2222-4222-8222-222222222222', 'other@example.test', 'authenticated', 'authenticated'),
  ('33333333-3333-4333-8333-333333333333', 'third@example.test', 'authenticated', 'authenticated');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  'RLS is enabled on public.profiles'
);

-- Anonymous visitors
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select throws_ok(
  $$ select * from public.profiles $$,
  '42501', null,
  'Anonymous users cannot read profiles'
);

select throws_ok(
  $$ insert into public.profiles (id) values ('11111111-1111-4111-8111-111111111111') $$,
  '42501', null,
  'Anonymous users cannot create profiles'
);

-- Other user creates a profile
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';

select lives_ok(
  $$ insert into public.profiles (id, display_name) values ('22222222-2222-4222-8222-222222222222', 'Other') $$,
  'Users can create their own profile'
);

-- Owner
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select lives_ok(
  $$ insert into public.profiles (id, display_name) values ('11111111-1111-4111-8111-111111111111', 'Owner') $$,
  'Owner can create their own profile'
);

select throws_ok(
  $$ insert into public.profiles (id, display_name) values ('33333333-3333-4333-8333-333333333333', 'Spoofed') $$,
  '42501', null,
  'Users cannot create a profile for another user'
);

select results_eq(
  $$ select id from public.profiles $$,
  $$ values ('11111111-1111-4111-8111-111111111111'::uuid) $$,
  'Users only see their own profile'
);

select is_empty(
  $$ update public.profiles set display_name = 'Hacked' where id = '22222222-2222-4222-8222-222222222222' returning id $$,
  'Users cannot update another user''s profile'
);

select throws_ok(
  $$ update public.profiles set id = '33333333-3333-4333-8333-333333333333' where id = '11111111-1111-4111-8111-111111111111' $$,
  '42501', null,
  'Users cannot reassign their profile to another user'
);

select throws_ok(
  $$ update public.profiles set created_at = now() - interval '1 year' where id = '11111111-1111-4111-8111-111111111111' $$,
  '42501', null,
  'Users cannot change server-managed columns'
);

select throws_ok(
  $$ delete from public.profiles where id = '11111111-1111-4111-8111-111111111111' $$,
  '42501', null,
  'Users cannot delete profiles directly'
);

select lives_ok(
  $$ update public.profiles set display_name = 'Renamed' where id = '11111111-1111-4111-8111-111111111111' $$,
  'Owner can update their own profile'
);

select throws_ok(
  $$ update public.profiles set display_name = '' where id = '11111111-1111-4111-8111-111111111111' $$,
  '23514', null,
  'Empty display names are rejected'
);

select results_eq(
  $$ select display_name from public.profiles $$,
  $$ values ('Renamed'::text) $$,
  'Owner update is persisted'
);

-- Other user's row is untouched
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';

select results_eq(
  $$ select display_name from public.profiles $$,
  $$ values ('Other'::text) $$,
  'Cross-user update attempt left the other profile unchanged'
);

select * from finish();

rollback;
