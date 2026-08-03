-- 0009_security_hardening.sql
-- Addresses Supabase security advisor findings.

-- 1. user_badges had RLS enabled but no policy => everyone locked out.
create policy user_badges_read on user_badges for select using (true);
create policy user_badges_write on user_badges for all
  using (is_moderator()) with check (is_moderator());

-- 2. Pin search_path on functions that lacked it.
create or replace function set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end $$;

create or replace function is_moderator() returns boolean
language sql stable set search_path = public as $$
  select current_role_level() in ('moderator','admin');
$$;

create or replace function default_performance_status() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.role in ('billed','band_member') then
    new.status := 'confirmed';
  end if;
  return new;
end $$;

create or replace function enforce_bingo_lock() returns trigger
language plpgsql set search_path = public as $$
declare locked timestamptz;
begin
  select locked_at into locked from bingo_cards
   where id = coalesce(new.card_id, old.card_id);
  if locked is not null then
    raise exception 'Card is locked; squares are immutable.';
  end if;
  return coalesce(new, old);
end $$;

-- 3. Trigger-only SECURITY DEFINER functions should not be reachable as RPC.
--    Triggers fire regardless of caller EXECUTE privilege, so this is safe.
--    NOTE: current_role_level / is_active_user / is_moderator are deliberately
--    NOT revoked -- RLS policy expressions evaluate as the CALLING role, so
--    revoking EXECUTE there breaks every policy on the site.
revoke execute on function public.handle_new_user()              from anon, authenticated;
revoke execute on function public.record_revision()              from anon, authenticated;
revoke execute on function public.mark_newport_alum()            from anon, authenticated;
revoke execute on function public.recompute_performance_status() from anon, authenticated;
revoke execute on function public.guard_profile_privileges()     from anon, authenticated;
