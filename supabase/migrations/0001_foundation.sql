-- 0001_foundation.sql
-- Extensions, shared enums, identity, moderation, revision infrastructure.

create extension if not exists "pgcrypto";
create extension if not exists "citext";
create extension if not exists "pg_trgm";

-- ---------------------------------------------------------------
-- Shared enums
-- ---------------------------------------------------------------
create type user_role        as enum ('member','trusted','moderator','admin');
create type content_status   as enum ('visible','pending','hidden','removed');
create type claim_status     as enum ('pending','confirmed','disputed','rejected');
create type confidence_level as enum ('low','medium','high');

-- ---------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------
-- Profiles (extends Supabase auth.users)
-- ---------------------------------------------------------------
create table profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  handle            citext unique not null check (handle ~ '^[a-zA-Z0-9_]{3,24}$'),
  display_name      text,
  bio               text check (char_length(bio) <= 500),
  avatar_url        text,
  first_fest_year   int  check (first_fest_year between 1959 and 2100),
  home_city         text,
  role              user_role not null default 'member',
  reputation        int not null default 0,
  contributions     int not null default 0,
  is_banned         boolean not null default false,
  banned_reason     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

-- Auto-create a profile row on signup with a provisional handle.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, handle, display_name)
  values (
    new.id,
    'user_' || substr(replace(new.id::text,'-',''), 1, 12),
    coalesce(new.raw_user_meta_data->>'full_name', null)
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Convenience helpers used throughout RLS policies.
create or replace function current_role_level() returns user_role
language sql stable security definer set search_path = public as $$
  select coalesce((select role from profiles where id = auth.uid()), 'member'::user_role);
$$;

create or replace function is_moderator() returns boolean
language sql stable as $$
  select current_role_level() in ('moderator','admin');
$$;

create or replace function is_active_user() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and not is_banned);
$$;

-- ---------------------------------------------------------------
-- Revisions: generic wiki-style history for any table
-- ---------------------------------------------------------------
create table revisions (
  id            uuid primary key default gen_random_uuid(),
  entity_table  text not null,
  entity_id     uuid not null,
  edited_by     uuid references profiles(id) on delete set null,
  operation     text not null check (operation in ('insert','update','delete')),
  previous      jsonb,
  current       jsonb,
  comment       text,
  created_at    timestamptz not null default now()
);
create index on revisions (entity_table, entity_id, created_at desc);
create index on revisions (edited_by, created_at desc);

create or replace function record_revision() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into revisions (entity_table, entity_id, edited_by, operation, previous, current)
  values (
    tg_table_name,
    coalesce(new.id, old.id),
    auth.uid(),
    lower(tg_op),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;

-- ---------------------------------------------------------------
-- Moderation
-- ---------------------------------------------------------------
create table reports (
  id            uuid primary key default gen_random_uuid(),
  entity_table  text not null,
  entity_id     uuid not null,
  reporter_id   uuid references profiles(id) on delete set null,
  reason        text not null check (reason in
                  ('spam','harassment','misinformation','copyright','off_topic','scam','other')),
  details       text,
  status        text not null default 'open'
                  check (status in ('open','reviewing','actioned','dismissed')),
  resolved_by   uuid references profiles(id) on delete set null,
  resolved_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index on reports (status, created_at desc);

create table moderation_actions (
  id            uuid primary key default gen_random_uuid(),
  moderator_id  uuid references profiles(id) on delete set null,
  action        text not null check (action in
                  ('hide','remove','restore','ban','unban','promote','demote','merge','revert')),
  entity_table  text,
  entity_id     uuid,
  target_user   uuid references profiles(id) on delete set null,
  reason        text,
  created_at    timestamptz not null default now()
);
create index on moderation_actions (created_at desc);

-- ---------------------------------------------------------------
-- Sources & citations: evidence for any claim in the archive
-- ---------------------------------------------------------------
create type source_kind as enum (
  'inforoo','setlistfm','youtube','instagram','tiktok','press','official',
  'photo','user_testimony','reddit','archive_org','nugs','wikipedia','other'
);

create table sources (
  id            uuid primary key default gen_random_uuid(),
  kind          source_kind not null,
  url           text,
  title         text,
  author_handle text,
  published_at  timestamptz,
  retrieved_at  timestamptz not null default now(),
  -- Short excerpt only. See docs/06-data-sourcing.md.
  excerpt       text check (char_length(excerpt) <= 400),
  added_by      uuid references profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);
create unique index on sources (url) where url is not null;

create table citations (
  id            uuid primary key default gen_random_uuid(),
  source_id     uuid not null references sources(id) on delete cascade,
  entity_table  text not null,
  entity_id     uuid not null,
  note          text check (char_length(note) <= 400),
  confidence    confidence_level not null default 'medium',
  added_by      uuid references profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index on citations (entity_table, entity_id);
