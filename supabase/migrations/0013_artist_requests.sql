-- 0013_artist_requests.sql
-- Community-requested acts: forum-sourced fan demand ("I wish they'd book X"),
-- distinct from bingo/wishlist. Feeds Oracle F20 crowd signal and the Wishlist.
create type request_type as enum ('wish', 'request', 'dream', 'prediction');

create table artist_requests (
  id                uuid primary key default gen_random_uuid(),
  edition_id        uuid references editions(id) on delete set null,
  festival_year     int not null,
  request_post_year int,
  artist_id         uuid references artists(id) on delete set null,
  requested_name    text not null,
  request_type      request_type not null default 'wish',
  context           text,
  source_id         uuid references sources(id) on delete set null,
  confidence        confidence_level not null default 'medium',
  status            content_status not null default 'visible',
  submitted_by      uuid references profiles(id) on delete set null,
  created_at        timestamptz not null default now()
);
create index on artist_requests (artist_id);
create index on artist_requests (edition_id);
create index on artist_requests (festival_year);
create index on artist_requests (request_type);

-- One demand row per (artist, edition); wishes/requests count as demand.
create view v_artist_demand with (security_invoker = true) as
select
  ar.artist_id, a.name as artist_name, ar.festival_year,
  count(*) as request_rows,
  count(*) filter (where ar.request_type in ('wish', 'request')) as demand_count
from artist_requests ar
join artists a on a.id = ar.artist_id
where ar.status = 'visible'
group by ar.artist_id, a.name, ar.festival_year;

alter table artist_requests enable row level security;
create policy artist_requests_read   on artist_requests for select using (true);
create policy artist_requests_insert on artist_requests for insert with check (is_active_user());
create policy artist_requests_update on artist_requests for update using (is_active_user());
create policy artist_requests_delete on artist_requests for delete using (is_moderator());
