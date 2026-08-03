-- 0004_setlists_media_attendance.sql

-- ---------------------------------------------------------------
-- Songs & setlists
-- ---------------------------------------------------------------
create table songs (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  slug                citext not null,
  canonical_artist_id uuid references artists(id) on delete set null,
  musicbrainz_work_id uuid unique,
  is_traditional      boolean not null default false,   -- folk canon has no single author
  year_written        int,
  created_at          timestamptz not null default now(),
  unique (slug, canonical_artist_id)
);
create index on songs using gin (title gin_trgm_ops);

create table song_aliases (
  id        uuid primary key default gen_random_uuid(),
  song_id   uuid not null references songs(id) on delete cascade,
  alias     citext not null,
  unique (song_id, alias)
);

create table setlist_entries (
  id                  uuid primary key default gen_random_uuid(),
  set_id              uuid not null references sets(id) on delete cascade,
  position            int not null,
  song_id             uuid references songs(id) on delete set null,
  raw_title           text not null,          -- as submitted; preserve it
  is_cover            boolean not null default false,
  cover_of_artist_id  uuid references artists(id) on delete set null,
  is_tease            boolean not null default false,
  is_encore           boolean not null default false,
  segues_into_next    boolean not null default false,
  notes               text,
  submitted_by        uuid references profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (set_id, position)
);
create trigger trg_setlist_updated before update on setlist_entries
  for each row execute function set_updated_at();
create trigger trg_setlist_revision after insert or update or delete on setlist_entries
  for each row execute function record_revision();
create index on setlist_entries (song_id);

-- Which guest played on which song.
create table setlist_entry_performers (
  setlist_entry_id uuid not null references setlist_entries(id) on delete cascade,
  performance_id   uuid not null references performances(id) on delete cascade,
  primary key (setlist_entry_id, performance_id)
);

-- ---------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------
create table set_reviews (
  id          uuid primary key default gen_random_uuid(),
  set_id      uuid not null references sets(id) on delete cascade,
  author_id   uuid not null references profiles(id) on delete cascade,
  rating      smallint check (rating between 1 and 5),
  body_md     text check (char_length(body_md) <= 10000),
  was_present boolean not null default true,
  status      content_status not null default 'visible',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (set_id, author_id)
);
create trigger trg_reviews_updated before update on set_reviews
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------
-- Media: embeds only. No hosting. See docs/01-architecture.md.
-- ---------------------------------------------------------------
create type media_provider as enum
  ('youtube','vimeo','instagram','tiktok','bandcamp','soundcloud',
   'archive_org','nugs','flickr','x','other');

create table media_embeds (
  id                uuid primary key default gen_random_uuid(),
  set_id            uuid references sets(id) on delete cascade,
  setlist_entry_id  uuid references setlist_entries(id) on delete cascade,
  performance_id    uuid references performances(id) on delete cascade,
  provider          media_provider not null,
  provider_id       text,
  url               text not null,
  title             text,
  thumbnail_url     text,
  duration_seconds  int,
  is_official       boolean not null default false,
  submitted_by      uuid references profiles(id) on delete set null,
  status            content_status not null default 'visible',
  created_at        timestamptz not null default now(),
  constraint attached_to_something check (
    set_id is not null or setlist_entry_id is not null or performance_id is not null
  )
);
create unique index on media_embeds (url, coalesce(set_id, '00000000-0000-0000-0000-000000000000'::uuid));
create index on media_embeds (set_id);

-- ---------------------------------------------------------------
-- Attendance -> badges -> the playlist payoff
-- ---------------------------------------------------------------
create table event_attendance (
  user_id    uuid not null references profiles(id) on delete cascade,
  event_id   uuid not null references events(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

create table set_attendance (
  user_id     uuid not null references profiles(id) on delete cascade,
  set_id      uuid not null references sets(id) on delete cascade,
  saw_full    boolean not null default true,
  is_favorite boolean not null default false,
  created_at  timestamptz not null default now(),
  primary key (user_id, set_id)
);
create index on set_attendance (set_id);

create table badges (
  id          uuid primary key default gen_random_uuid(),
  slug        citext unique not null,
  name        text not null,
  description text,
  icon        text,
  tier        text check (tier in ('bronze','silver','gold','legendary')),
  criteria    jsonb not null,     -- evaluated nightly; adding a badge is a data change
  is_active   boolean not null default true
);

create table user_badges (
  user_id    uuid not null references profiles(id) on delete cascade,
  badge_id   uuid not null references badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-- ---------------------------------------------------------------
-- Views
-- ---------------------------------------------------------------

-- Every artist appearance, any role, any event type. The core archive query.
create view v_artist_appearances
with (security_invoker = true) as
select
  p.artist_id,
  a.name       as artist_name,
  a.artist_type,
  p.role,
  p.instruments,
  p.status,
  s.id         as set_id,
  s.billed_name,
  s.set_kind,
  e.kind       as event_kind,
  e.date       as event_date,
  ed.year      as edition_year,
  st.name      as stage_name
from performances p
join artists  a  on a.id = p.artist_id
join sets     s  on s.id = p.set_id
join events   e  on e.id = s.event_id
join editions ed on ed.id = e.edition_id
left join stages st on st.id = s.stage_id;

-- The sit-in graph: who has shared a stage with whom.
create view v_sit_in_graph
with (security_invoker = true) as
select
  guest.artist_id          as guest_artist_id,
  host.billed_artist_id    as host_artist_id,
  count(*)                 as times,
  min(ed.year)             as first_year,
  max(ed.year)             as last_year
from performances guest
join sets     host on host.id = guest.set_id
join events   e    on e.id = host.event_id
join editions ed   on ed.id = e.edition_id
where guest.role in ('sit_in','guest_vocal','surprise_guest')
  and guest.status = 'confirmed'
  and host.billed_artist_id is not null
group by 1, 2;

-- Every song a user has heard at the Fort -> Spotify export.
create view v_user_heard_songs
with (security_invoker = true) as
select
  sa.user_id,
  se.song_id,
  so.title,
  count(*)      as times_heard,
  min(ed.year)  as first_year,
  max(ed.year)  as last_year
from set_attendance sa
join setlist_entries se on se.set_id = sa.set_id
join songs so           on so.id = se.song_id
join sets s             on s.id = sa.set_id
join events e           on e.id = s.event_id
join editions ed        on ed.id = e.edition_id
group by 1, 2, 3;
