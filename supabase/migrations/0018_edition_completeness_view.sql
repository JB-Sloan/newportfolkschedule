-- Per-edition data completeness for the archive's "help fill the gaps" meters.
-- "enriched" = sets carrying any community detail (a setlist entry or a
-- non-rejected guest performance beyond the billing). Sparse by design; the
-- meters recruit contributors to the submission features.
create or replace view v_edition_completeness
with (security_invoker = on) as
select
  ed.id as edition_id,
  ed.year,
  count(*) as total_sets,
  count(*) filter (where exists (
    select 1 from setlist_entries se where se.set_id = s.id
  )) as sets_with_setlist,
  count(*) filter (where exists (
    select 1 from performances p
    where p.set_id = s.id and p.role not in ('billed','band_member') and p.status <> 'rejected'
  )) as sets_with_guests,
  count(*) filter (where
    exists (select 1 from setlist_entries se where se.set_id = s.id)
    or exists (
      select 1 from performances p
      where p.set_id = s.id and p.role not in ('billed','band_member') and p.status <> 'rejected'
    )
  ) as enriched_sets
from editions ed
join events ev on ev.edition_id = ed.id
join sets s on s.event_id = ev.id
group by ed.id, ed.year;
