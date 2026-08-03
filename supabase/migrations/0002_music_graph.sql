-- 0002_music_graph.sql
-- Artists (people AND groups), membership, organizations, releases.

create type artist_type as enum ('person','group','collective');
create type org_type    as enum ('label','management','booking_agency','publisher','venue_group','foundation');

-- ---------------------------------------------------------------
-- Artists: a person and a band are both artists.
-- ---------------------------------------------------------------
create table artists (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  sort_name         text,
  slug              citext unique not null,
  artist_type       artist_type not null,

  musicbrainz_id    uuid unique,
  spotify_id        text unique,
  setlistfm_mbid    uuid,

  country           text,               -- ISO-3166 alpha-2
  home_base         text,               -- 'Nashville, TN'
  formed_year       int,
  disbanded_year    int,
  born_year         int,                -- persons only
  died_year         int,

  bio               text,
  image_url         text,               -- external URL only
  official_url      text,

  genres            text[] not null default '{}',
  is_newport_alum   boolean not null default false,   -- maintained by trigger in 0003
  status            content_status not null default 'visible',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint person_fields_only check (
    artist_type = 'person' or (born_year is null and died_year is null)
  )
);
create trigger trg_artists_updated before update on artists
  for each row execute function set_updated_at();
create trigger trg_artists_revision after insert or update or delete on artists
  for each row execute function record_revision();

create index on artists using gin (name gin_trgm_ops);
create index on artists (artist_type);
create index on artists (is_newport_alum) where is_newport_alum;

create table artist_aliases (
  id          uuid primary key default gen_random_uuid(),
  artist_id   uuid not null references artists(id) on delete cascade,
  alias       citext not null,
  alias_type  text not null default 'aka'
                check (alias_type in ('aka','former_name','misspelling','legal_name','stage_name')),
  unique (artist_id, alias)
);
create index on artist_aliases using gin (alias gin_trgm_ops);

-- ---------------------------------------------------------------
-- Membership: the Nels Cline / Wilco relationship
-- ---------------------------------------------------------------
create table instruments (
  id    uuid primary key default gen_random_uuid(),
  slug  citext unique not null,
  name  text not null,
  family text
);

create table artist_memberships (
  id            uuid primary key default gen_random_uuid(),
  person_id     uuid not null references artists(id) on delete cascade,
  group_id      uuid not null references artists(id) on delete cascade,
  roles         text[] not null default '{}',   -- {'guitar','vocals'}
  started_year  int,
  ended_year    int,
  is_current    boolean not null default true,
  is_founding   boolean not null default false,
  is_touring_only boolean not null default false,
  notes         text,
  created_at    timestamptz not null default now(),
  unique (person_id, group_id, started_year),
  constraint no_self_membership check (person_id <> group_id)
);
create index on artist_memberships (group_id);
create index on artist_memberships (person_id);

-- ---------------------------------------------------------------
-- Organizations: labels, agents, management (prediction features)
-- ---------------------------------------------------------------
create table organizations (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            citext unique not null,
  org_type        org_type not null,
  country         text,
  parent_org_id   uuid references organizations(id) on delete set null,
  created_at      timestamptz not null default now()
);

create table artist_org_links (
  id            uuid primary key default gen_random_uuid(),
  artist_id     uuid not null references artists(id) on delete cascade,
  org_id        uuid not null references organizations(id) on delete cascade,
  relationship  text not null
                  check (relationship in ('signed_to','managed_by','booked_by','published_by','affiliated')),
  started_year  int,
  ended_year    int,
  is_current    boolean not null default true,
  unique (artist_id, org_id, relationship, started_year)
);
create index on artist_org_links (org_id, relationship);

-- ---------------------------------------------------------------
-- Releases: album-cycle feature + The Wire
-- ---------------------------------------------------------------
create type release_type as enum ('album','ep','single','live','compilation','soundtrack','reissue');

create table releases (
  id                uuid primary key default gen_random_uuid(),
  primary_artist_id uuid not null references artists(id) on delete cascade,
  title             text not null,
  release_type      release_type not null default 'album',
  release_date      date,
  announced_at      date,
  label_org_id      uuid references organizations(id) on delete set null,
  musicbrainz_rg_id uuid unique,
  spotify_album_id  text unique,
  cover_url         text,
  is_debut          boolean not null default false,
  created_at        timestamptz not null default now()
);
create index on releases (primary_artist_id, release_date desc);
create index on releases (release_date desc);

create table release_credits (
  id          uuid primary key default gen_random_uuid(),
  release_id  uuid not null references releases(id) on delete cascade,
  artist_id   uuid not null references artists(id) on delete cascade,
  credit_role text not null
                check (credit_role in ('producer','engineer','mixer','featured','writer','performer')),
  unique (release_id, artist_id, credit_role)
);
create index on release_credits (artist_id, credit_role);
