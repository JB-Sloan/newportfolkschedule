-- 0008_fix_performance_status_cast.sql
-- BUG FIX (found by execution, not by parsing):
-- the CASE expression yields text, but performances.status is claim_status.
-- Postgres will not implicitly cast text -> enum in an UPDATE SET.
create or replace function recompute_performance_status() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  pid uuid := coalesce(new.performance_id, old.performance_id);
  c int; d int; trusted_confirm boolean; has_hard_evidence boolean;
begin
  select count(*) filter (where vote = 1), count(*) filter (where vote = -1)
    into c, d from performance_votes where performance_id = pid;

  select exists (
    select 1 from performance_votes v
    join profiles p on p.id = v.user_id
    where v.performance_id = pid and v.vote = 1 and p.role in ('trusted','moderator','admin')
  ) into trusted_confirm;

  select exists (
    select 1 from citations
    where entity_table = 'performances' and entity_id = pid and confidence = 'high'
  ) into has_hard_evidence;

  update performances set
    confirm_count = c,
    dispute_count = d,
    status = (case
      when status = 'rejected' then 'rejected'
      when has_hard_evidence or trusted_confirm or (c - d) >= 3 then 'confirmed'
      when (c - d) < 0 then 'disputed'
      else 'pending'
    end)::claim_status
  where id = pid and role not in ('billed','band_member');

  return null;
end $$;
