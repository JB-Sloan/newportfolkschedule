-- Pin search_path on the Oracle helper (security advisor
-- 0011_function_search_path_mutable). oracle_target_edition() is a plain SQL
-- function, so it needs an explicit, immutable search_path.
create or replace function public.oracle_target_edition()
returns uuid
language sql
stable
set search_path = public, pg_temp
as $$
  select e.id
  from editions e
  where coalesce(e.is_cancelled, false) = false
    and not exists (
      select 1 from events ev join sets s on s.event_id = ev.id
      where ev.edition_id = e.id
    )
  order by e.year asc
  limit 1
$$;
