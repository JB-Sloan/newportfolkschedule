-- E6-04 — The Oracle's weekly feature-snapshot job.
--
-- WHY THIS EXISTS / WHY NOW: predictions are scored off point-in-time feature
-- snapshots (artist_feature_snapshots, 0005). The time-varying inputs — tour
-- routing, album cycles, fan demand — cannot be reconstructed after the fact,
-- so the weekly cadence has to start capturing a baseline *now*, well before
-- the full feature-computer set (E6-05) and external ingestion (E5) land. This
-- migration stands up the pipeline with the features that are already
-- computable from data in this database, and wires the weekly cron. New
-- feature computers get appended to take_oracle_snapshot() as they arrive.
--
-- NORMALIZATION CONVENTION (followed here and by E6-05/E6-06):
--   artist_feature_snapshots.normalized is the [0,1] *magnitude* of the signal.
--   The feature's own `direction` (positive/negative) and `weight` supply the
--   sign and scale at scoring time. So a negative feature like F21 stores a
--   positive magnitude, not a negative number.

-- ---------------------------------------------------------------------------
-- 1. Prediction target: the next upcoming edition.
--    2026 has happened, so the Oracle predicts 2027. Insert a placeholder
--    edition (lineup TBA); the archive UI renders it as "Upcoming".
-- ---------------------------------------------------------------------------
insert into editions (year, name, is_cancelled)
values (2027, 'Newport Folk Festival 2027', false)
on conflict (year) do nothing;

-- Resolve the edition currently being predicted: the nearest non-cancelled
-- edition whose festival has not happened yet. Rolls forward automatically once
-- 2027 gets a start_date in the past and 2028 is added.
create or replace function public.oracle_target_edition()
returns uuid
language sql
stable
as $$
  select id
  from editions
  where coalesce(is_cancelled, false) = false
    and (start_date is null or start_date >= current_date)
  order by year asc
  limit 1
$$;

-- ---------------------------------------------------------------------------
-- 2. The snapshot writer. Idempotent per (artist, edition, as_of, feature):
--    re-running on the same day refreshes values rather than duplicating.
--    SECURITY DEFINER so the cron (and a manual dashboard call) can write
--    through RLS; EXECUTE is locked down to the owner below.
-- ---------------------------------------------------------------------------
create or replace function public.take_oracle_snapshot(p_as_of date default current_date)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_edition uuid;
  v_year    int;
  v_written int;
begin
  -- Same rule as oracle_target_edition(), but we need the year too.
  select e.id, e.year into v_edition, v_year
  from editions e
  where coalesce(e.is_cancelled, false) = false
    and (e.start_date is null or e.start_date >= current_date)
  order by e.year asc
  limit 1;

  if v_edition is null then
    raise notice 'take_oracle_snapshot: no upcoming edition to predict; nothing written';
    return 0;
  end if;

  insert into artist_feature_snapshots
    (artist_id, edition_id, as_of, feature_key, raw_value, normalized, explanation)
  with
  -- F01 Prior Newport History: distinct prior editions the artist appeared in
  -- (any role), saturating so ~15 appearances ≈ 1.0 (Joan Baez territory).
  f01 as (
    select a.artist_id,
           count(distinct a.edition_year) as n_prior,
           max(a.edition_year)            as last_year
    from v_artist_appearances a
    where a.edition_year < v_year
    group by a.artist_id
  ),
  -- F21 Recency Cooldown: played the immediately-prior edition. Suppressed for
  -- veterans (3+ appearances), who cycle back regardless.
  f21 as (
    select f01.artist_id,
           f01.n_prior,
           bool_or(a.edition_year = v_year - 1) as played_last
    from f01
    join v_artist_appearances a on a.artist_id = f01.artist_id
    group by f01.artist_id, f01.n_prior
  ),
  -- F06 Collaborator Orbit Centrality: degree in our own sit-in graph
  -- (distinct documented stage-mates, either direction). Deer Tick ~25 ≈ 1.0.
  f06 as (
    select artist_id, count(distinct partner) as degree
    from (
      select guest_artist_id as artist_id, host_artist_id as partner from v_sit_in_graph
      union
      select host_artist_id  as artist_id, guest_artist_id as partner from v_sit_in_graph
    ) e
    group by artist_id
  ),
  -- F20 Crowd Pick Rate: forum wishlist demand, a stand-in until locked bingo
  -- cards and wishlist votes (E7/E8) feed the real signal. Linear to the max.
  f20 as (
    select artist_id, sum(demand_count)::numeric as demand
    from v_artist_demand
    group by artist_id
  ),
  f20max as (select max(demand) as m from f20)
  select artist_id, v_edition, p_as_of, feature_key, raw_value, normalized, explanation
  from (
    select f01.artist_id,
           'F01_prior_history'::citext as feature_key,
           jsonb_build_object('appearances', n_prior, 'last_year', last_year) as raw_value,
           round(least(1.0, ln((1 + n_prior)::numeric) / ln(16::numeric)), 4) as normalized,
           n_prior::text || ' prior appearance' || case when n_prior = 1 then '' else 's' end
             || ', last ' || last_year::text as explanation
    from f01
    where n_prior > 0

    union all
    select f21.artist_id,
           'F21_recency_cooldown'::citext,
           jsonb_build_object('played_last_year', true, 'appearances', n_prior),
           case when n_prior >= 3 then 0.2000 else 1.0000 end,
           'Played ' || (v_year - 1)::text
             || case when n_prior >= 3 then ' — cooldown suppressed (3+ appearances)'
                     else ' — recency cooldown' end
    from f21
    where played_last

    union all
    select f06.artist_id,
           'F06_orbit_centrality'::citext,
           jsonb_build_object('degree', degree),
           round(least(1.0, ln((1 + degree)::numeric) / ln(26::numeric)), 4),
           'Shared a stage with ' || degree::text || ' documented collaborator'
             || case when degree = 1 then '' else 's' end
    from f06
    where degree > 0

    union all
    select f20.artist_id,
           'F20_crowd_pick_rate'::citext,
           jsonb_build_object('demand', demand),
           round(least(1.0, demand / nullif((select m from f20max), 0)), 4),
           'Fan demand: ' || demand::bigint::text || ' request'
             || case when demand = 1 then '' else 's' end || ' logged'
    from f20
    where demand > 0
  ) rows
  on conflict (artist_id, edition_id, as_of, feature_key)
  do update set raw_value   = excluded.raw_value,
                normalized  = excluded.normalized,
                explanation = excluded.explanation;

  get diagnostics v_written = row_count;
  return v_written;
end;
$$;

-- The writer must not be callable by site visitors; the cron runs it as owner.
revoke all on function public.take_oracle_snapshot(date) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Weekly cron. Mondays 09:07 UTC (early week, off the top of the hour).
--    Wrapped so the migration still lands the functions + baseline even if this
--    role can't enable pg_cron — schedule it from the dashboard in that case.
-- ---------------------------------------------------------------------------
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule(
    'oracle-weekly-snapshot',
    '7 9 * * 1',
    $cmd$select public.take_oracle_snapshot();$cmd$
  );
exception
  when insufficient_privilege or feature_not_supported then
    raise warning 'pg_cron not enabled (%). Schedule take_oracle_snapshot() weekly from the Supabase dashboard.', sqlerrm;
end $$;

-- 4. Capture the first snapshot now so the baseline is not a week away.
select public.take_oracle_snapshot();
