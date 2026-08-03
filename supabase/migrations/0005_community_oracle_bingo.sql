-- 0005_community_oracle_bingo.sql
-- Forum, Wishlist, The Wire, The Oracle, Bingo, schedules, merch.

-- ---------------------------------------------------------------
-- Forum
-- ---------------------------------------------------------------
create type topic_kind as enum
  ('discussion','set_thread','wishlist','ticket_exchange','lodging',
   'logistics','meetup','live_thread','newcomer','wall_of_weird');

create table forum_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        citext unique not null,
  name        text not null,
  description text,
  default_kind topic_kind not null default 'discussion',
  sort_order  int not null default 0,
  is_locked   boolean not null default false,
  min_role    user_role not null default 'member'
);

create table topics (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid not null references forum_categories(id) on delete cascade,
  kind          topic_kind not null default 'discussion',
  title         text not null,
  slug          citext not null,
  author_id     uuid references profiles(id) on delete set null,
  set_id        uuid references sets(id) on delete cascade,      -- set threads
  edition_id    uuid references editions(id) on delete cascade,
  artist_id     uuid references artists(id) on delete cascade,   -- wishlist targets
  is_pinned     boolean not null default false,
  is_locked     boolean not null default false,
  reply_count   int not null default 0,
  vote_score    int not null default 0,
  -- Wishlist resolution. Honest labels for a fan site with no influence.
  wishlist_status text check (wishlist_status in
                    ('still_dreaming','discussed','happened','no_longer_possible')),
  status        content_status not null default 'visible',
  created_at    timestamptz not null default now(),
  last_post_at  timestamptz not null default now(),
  unique (category_id, slug)
);
create index on topics (category_id, last_post_at desc);
create index on topics (set_id);
create index on topics (kind, vote_score desc);

create table posts (
  id             uuid primary key default gen_random_uuid(),
  topic_id       uuid not null references topics(id) on delete cascade,
  author_id      uuid references profiles(id) on delete set null,
  parent_post_id uuid references posts(id) on delete set null,
  body_md        text not null check (char_length(body_md) <= 40000),
  vote_score     int not null default 0,
  status         content_status not null default 'visible',
  created_at     timestamptz not null default now(),
  edited_at      timestamptz
);
create index on posts (topic_id, created_at);

create table votes (
  id           uuid primary key default gen_random_uuid(),
  entity_table text not null check (entity_table in ('topics','posts','set_reviews','media_embeds')),
  entity_id    uuid not null,
  user_id      uuid not null references profiles(id) on delete cascade,
  value        smallint not null check (value in (-1, 1)),
  created_at   timestamptz not null default now(),
  unique (entity_table, entity_id, user_id)
);

-- ---------------------------------------------------------------
-- The Wire
-- ---------------------------------------------------------------
create type news_kind as enum
  ('release','release_announcement','tour','festival_booking','press',
   'award','sit_in_elsewhere','obituary','other');

create table news_items (
  id           uuid primary key default gen_random_uuid(),
  kind         news_kind not null,
  artist_id    uuid references artists(id) on delete cascade,
  release_id   uuid references releases(id) on delete set null,
  title        text not null,
  summary      text,
  url          text,                    -- headline + link only; never republish bodies
  source_id    uuid references sources(id) on delete set null,
  published_at timestamptz not null,
  is_featured  boolean not null default false,
  is_suppressed boolean not null default false,
  editor_note  text,
  created_at   timestamptz not null default now()
);
create unique index on news_items (kind, artist_id, url) where url is not null;
create index on news_items (published_at desc) where not is_suppressed;

create table user_follows (
  user_id    uuid not null references profiles(id) on delete cascade,
  artist_id  uuid not null references artists(id) on delete cascade,
  notify     boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, artist_id)
);

-- ---------------------------------------------------------------
-- The Oracle
-- ---------------------------------------------------------------
create table prediction_features (
  id          uuid primary key default gen_random_uuid(),
  key         citext unique not null,       -- 'F02_tour_adjacency'
  name        text not null,
  description text,
  weight      numeric(6,2) not null,
  direction   text not null default 'positive' check (direction in ('positive','negative')),
  is_active   boolean not null default true,
  is_manual   boolean not null default false,  -- e.g. Jay's white whale
  updated_at  timestamptz not null default now()
);
create trigger trg_features_updated before update on prediction_features
  for each row execute function set_updated_at();

-- Point-in-time snapshots. Without as_of, every backtest cheats.
create table artist_feature_snapshots (
  id          uuid primary key default gen_random_uuid(),
  artist_id   uuid not null references artists(id) on delete cascade,
  edition_id  uuid not null references editions(id) on delete cascade,
  as_of       date not null,
  feature_key citext not null references prediction_features(key) on delete cascade,
  raw_value   jsonb,
  normalized  numeric(6,4) not null check (normalized between -1 and 1),
  explanation text,                        -- "Opened for Isbell, Mar 2027"
  unique (artist_id, edition_id, as_of, feature_key)
);
create index on artist_feature_snapshots (edition_id, as_of);

create table predictions (
  id            uuid primary key default gen_random_uuid(),
  artist_id     uuid not null references artists(id) on delete cascade,
  edition_id    uuid not null references editions(id) on delete cascade,
  as_of         date not null,
  model_version text not null,
  score         numeric(10,4) not null,
  rank          int not null,
  probability   numeric(5,4),              -- null until calibrated
  tier          text check (tier in ('lock','likely','longshot','dark_horse')),
  unique (artist_id, edition_id, as_of, model_version)
);
create index on predictions (edition_id, as_of, rank);

create table prediction_outcomes (
  edition_id    uuid not null references editions(id) on delete cascade,
  artist_id     uuid not null references artists(id) on delete cascade,
  did_play      boolean not null,
  announced_at  timestamptz,
  primary key (edition_id, artist_id)
);

-- ---------------------------------------------------------------
-- Announcements & Bingo
-- ---------------------------------------------------------------
create table announcement_waves (
  id            uuid primary key default gen_random_uuid(),
  edition_id    uuid not null references editions(id) on delete cascade,
  wave_number   int not null,
  announced_at  timestamptz not null,
  source_url    text,
  notes         text,
  unique (edition_id, wave_number)
);

create table lineup_announcements (
  id           uuid primary key default gen_random_uuid(),
  edition_id   uuid not null references editions(id) on delete cascade,
  wave_id      uuid references announcement_waves(id) on delete set null,
  artist_id    uuid not null references artists(id) on delete cascade,
  billed_name  text,
  announced_at timestamptz not null default now(),
  unique (edition_id, artist_id)
);

create table bingo_cards (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  edition_id  uuid not null references editions(id) on delete cascade,
  title       text,
  locked_at   timestamptz,                 -- immutable once set
  is_public   boolean not null default true,
  score       int not null default 0,
  created_at  timestamptz not null default now(),
  unique (user_id, edition_id)
);

create table bingo_squares (
  id          uuid primary key default gen_random_uuid(),
  card_id     uuid not null references bingo_cards(id) on delete cascade,
  position    int not null check (position between 0 and 24),
  artist_id   uuid references artists(id) on delete cascade,
  is_free     boolean not null default false,
  is_hit      boolean not null default false,
  resolved_at timestamptz,
  unique (card_id, position),
  constraint free_or_artist check (is_free or artist_id is not null)
);
create index on bingo_squares (artist_id);
-- One artist may not appear twice on the same card.
create unique index on bingo_squares (card_id, artist_id) where artist_id is not null;

-- Cards are frozen at lock. Enforced in the database, not just the UI.
create or replace function enforce_bingo_lock() returns trigger
language plpgsql as $$
declare locked timestamptz;
begin
  select locked_at into locked from bingo_cards
   where id = coalesce(new.card_id, old.card_id);
  if locked is not null then
    raise exception 'Card is locked; squares are immutable.';
  end if;
  return coalesce(new, old);
end $$;
create trigger trg_bingo_lock before insert or update or delete on bingo_squares
  for each row execute function enforce_bingo_lock();

-- Crowd signal: pick rate across locked cards, feeds prediction feature F20.
create view v_bingo_pick_rate
with (security_invoker = true) as
with card_totals as (
  select edition_id, count(*)::numeric as total_cards
  from bingo_cards
  where locked_at is not null
  group by edition_id
)
select
  c.edition_id,
  s.artist_id,
  count(distinct c.id)                                  as picks,
  ct.total_cards,
  count(distinct c.id)::numeric / nullif(ct.total_cards, 0) as pick_rate
from bingo_squares s
join bingo_cards c  on c.id = s.card_id
join card_totals ct on ct.edition_id = c.edition_id
where c.locked_at is not null and s.artist_id is not null
group by c.edition_id, s.artist_id, ct.total_cards;

-- ---------------------------------------------------------------
-- Schedule builder
-- ---------------------------------------------------------------
create table user_schedules (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  edition_id  uuid not null references editions(id) on delete cascade,
  name        text not null default 'My Newport',
  share_slug  citext unique,
  is_public   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_schedules_updated before update on user_schedules
  for each row execute function set_updated_at();

create table user_schedule_items (
  schedule_id uuid not null references user_schedules(id) on delete cascade,
  set_id      uuid not null references sets(id) on delete cascade,
  priority    text not null default 'want' check (priority in ('must','want','if_free')),
  note        text,
  primary key (schedule_id, set_id)
);

-- ---------------------------------------------------------------
-- Merch: archive + classifieds only. No payments. See docs/01.
-- ---------------------------------------------------------------
create table merch_items (
  id          uuid primary key default gen_random_uuid(),
  edition_id  uuid references editions(id) on delete set null,
  name        text not null,
  item_type   text check (item_type in ('poster','tee','hoodie','hat','print','vinyl','pin','tote','other')),
  year        int,
  designer    text,
  image_url   text,
  print_run_note text,
  is_official boolean not null default true,
  created_at  timestamptz not null default now()
);

create table merch_listings (
  id            uuid primary key default gen_random_uuid(),
  item_id       uuid references merch_items(id) on delete set null,
  seller_id     uuid not null references profiles(id) on delete cascade,
  title         text not null,
  condition     text check (condition in ('new','like_new','good','fair','poor')),
  size          text,
  asking_price  numeric(10,2),
  currency      text default 'USD',
  -- Listings link OUT. This site never touches money.
  external_url  text,
  contact_via   text not null default 'dm' check (contact_via in ('dm','external')),
  listing_type  text not null default 'sale' check (listing_type in ('sale','trade','wanted')),
  status        text not null default 'active' check (status in ('active','sold','withdrawn','expired')),
  expires_at    timestamptz,
  created_at    timestamptz not null default now()
);
create index on merch_listings (status, created_at desc);
