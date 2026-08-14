-- Fix E6-04 target-edition resolution.
--
-- 0019 defined "the edition being predicted" as the nearest non-cancelled
-- edition with a null/future start_date. But historical editions carry NO
-- start_date (only 2026 has real dates), so that rule matched 1959 — the
-- earliest date-less edition — and the baseline snapshot was written against
-- the wrong edition (and F01/F21 produced nothing, since no edition precedes
-- 1959).
--
-- Correct signal: the prediction target is the non-cancelled edition that has
-- no sets yet. Every past edition has its billings loaded; only the upcoming
-- placeholder (2027) is empty. Predict the nearest such edition (min year).

create or replace function public.oracle_target_edition()
returns uuid
language sql
stable
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
  -- Nearest upcoming edition = non-cancelled, no sets loaded yet.
  select e.id, e.year into v_edition, v_year
  from editions e
  where coalesce(e.is_cancelled, false) = false
    and not exists (
      select 1 from events ev join sets s on s.event_id = ev.id
      where ev.edition_id = e.id
    )
  order by e.year asc
  limit 1;

  if v_edition is null then
    raise notice 'take_oracle_snapshot: no upcoming edition to predict; nothing written';
    return 0;
  end if;

  insert into artist_feature_snapshots
    (artist_id, edition_id, as_of, feature_key, raw_value, normalized, explanation)
  with
  f01 as (
    select a.artist_id,
           count(distinct a.edition_year) as n_prior,
           max(a.edition_year)            as last_year
    from v_artist_appearances a
    where a.edition_year < v_year
    group by a.artist_id
  ),
  f21 as (
    select f01.artist_id,
           f01.n_prior,
           bool_or(a.edition_year = v_year - 1) as played_last
    from f01
    join v_artist_appearances a on a.artist_id = f01.artist_id
    group by f01.artist_id, f01.n_prior
  ),
  f06 as (
    select artist_id, count(distinct partner) as degree
    from (
      select guest_artist_id as artist_id, host_artist_id as partner from v_sit_in_graph
      union
      select host_artist_id  as artist_id, guest_artist_id as partner from v_sit_in_graph
    ) e
    group by artist_id
  ),
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

revoke all on function public.take_oracle_snapshot(date) from public, anon, authenticated;

-- Clear the mis-targeted baseline (written against 1959) and recapture.
delete from artist_feature_snapshots
where edition_id <> public.oracle_target_edition();

select public.take_oracle_snapshot();
