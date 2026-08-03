-- 0003_festival_and_performances.sql
-- Editions -> events (incl. aftershows) -> sets -> performances.

create type event_kind as enum
  ('main_stage_day','aftershow','late_night','preshow','satellite','workshop');

create type set_kind as enum
  ('standard','tribute','collaborative','superjam','workshop','surprise','dj','spoken');

create type performance_role as enum
  ('billed','band_member','sit_in','guest_vocal','host','curator','surprise_guest');

-- ---------------------------------------------------------------
-- Venues, editions, events, stages
-- ---------------------------------------------------------------
create table venues (
  id        uuid primary key default gen_random_uuid(),
  name      text not null,
  slug      citext unique not null,
  city      text, state text, country text default 'US',
  lat       numeric(9,6), lng numeric(9,6),
  capacity  int,
  is_primary_site boolean not null default false   -- Fort Adams
);

create table editions (
  id            uuid primary key default gen_random_uuid(),
  year          int unique not null,
  name          text,                       -- 'Newport Folk Festival 2026'
  start_date    date, end_date date,
  venue_id      uuid references venues(id) on delete set null,
  poster_url    text,
  notes         text,
  is_cancelled  boolean not null default false,
  created_at    timestamptz not null default now()
);

create table events (
  id            uuid primary key default gen_random_uuid(),
  edition_id    uuid not null references editions(id) on delete cascade,
  kind          event_kind not null default 'main_stage_day',
  name          text,
  date          date not null,
  venue_id      uuid references venues(id) on delete set null,
  -- Aftershows are frequently unofficial; keep them, but flag them.
  is_official   boolean not null default true,
  notes         text,
  created_at    timestamptz not null default now()
);
create index on events (edition_id, date);
create index on events (kind);

create table stages (
  id          uuid primary key default gen_random_uuid(),
  venue_id    uuid not null references venues(id) on delete cascade,
  name        text not null,
  slug        citext not null,
  capacity_est int,
  sort_order  int not null default 0,
  active_from int, active_to int,
  unique (venue_id, slug)
);

-- The "better than Clashfinder" table: walking time between stages.
create table stage_transits (
  from_stage_id uuid not null references stages(id) on delete cascade,
  to_stage_id   uuid not null references stages(id) on delete cascade,
  walk_minutes  int not null check (walk_minutes >= 0),
  notes         text,
  primary key (from_stage_id, to_stage_id)
);

-- ---------------------------------------------------------------
-- Sets
-- ---------------------------------------------------------------
create table sets (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references events(id) on delete cascade,
  stage_id          uuid references stages(id) on delete set null,

  -- Exactly as printed. Themed sets have no single billed artist.
  billed_name       text not null,
  billed_artist_id  uuid references artists(id) on delete set null,
  slug              citext not null,

  set_kind          set_kind not null default 'standard',
  scheduled_start   timestamptz,
  scheduled_end     timestamptz,
  actual_start      timestamptz,     -- from the archive; powers realistic conflicts
  actual_end        timestamptz,

  is_surprise       boolean not null default false,
  description       text,
  status            content_status not null default 'visible',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (event_id, slug)
);
create trigger trg_sets_updated before update on sets
  for each row execute function set_updated_at();
create index on sets (billed_artist_id);
create index on sets (event_id, scheduled_start);

-- ---------------------------------------------------------------
-- Performances: WHO played, in WHAT capacity.
--
--   Wilco's own set   -> (set, Wilco,      'billed')
--                        (set, Nels Cline, 'band_member')
--   R.E.M. tribute    -> (set, Nels Cline, 'sit_in', instruments={guitar})
-- ---------------------------------------------------------------
create table performances (
  id              uuid primary key default gen_random_uuid(),
  set_id          uuid not null references sets(id) on delete cascade,
  artist_id       uuid not null references artists(id) on delete cascade,
  role            performance_role not null,
  instruments     text[] not null default '{}',
  notes           text,

  status          claim_status not null default 'pending',
  confirm_count   int not null default 0,
  dispute_count   int not null default 0,

  submitted_by    uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (set_id, artist_id, role)
);
create trigger trg_performances_updated before update on performances
  for each row execute function set_updated_at();
create trigger trg_performances_revision after insert or update or delete on performances
  for each row execute function record_revision();
create index on performances (artist_id, role);
create index on performances (set_id);
create index on performances (status) where status in ('pending','disputed');

-- Billed and band_member roles are self-evident; sit-ins must be earned.
create or replace function default_performance_status() returns trigger
language plpgsql as $$
begin
  if new.role in ('billed','band_member') then
    new.status := 'confirmed';
  end if;
  return new;
end $$;
create trigger trg_performance_default_status before insert on performances
  for each row execute function default_performance_status();

-- ---------------------------------------------------------------
-- Community verification of sit-ins
-- ---------------------------------------------------------------
create table performance_votes (
  performance_id uuid not null references performances(id) on delete cascade,
  user_id        uuid not null references profiles(id) on delete cascade,
  vote           smallint not null check (vote in (-1, 1)),
  created_at     timestamptz not null default now(),
  primary key (performance_id, user_id)
);

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
    status = case
      when status = 'rejected' then 'rejected'
      when has_hard_evidence or trusted_confirm or (c - d) >= 3 then 'confirmed'
      when (c - d) < 0 then 'disputed'
      else 'pending'
    end
  where id = pid and role not in ('billed','band_member');

  return null;
end $$;

create trigger trg_performance_vote_recount
  after insert or update or delete on performance_votes
  for each row execute function recompute_performance_status();

-- Maintain artists.is_newport_alum for the prediction candidate universe.
create or replace function mark_newport_alum() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update artists set is_newport_alum = true where id = new.artist_id;
  return new;
end $$;
create trigger trg_mark_alum after insert on performances
  for each row execute function mark_newport_alum();
