-- 0023_bingo_card_builder.sql
-- E7-02 card builder + E7-03 lock enforcement.
--
-- 0005 froze a locked card's SQUARES, but left the card row itself writable by
-- its owner: they could null locked_at, set their own score, insert squares
-- with is_hit = true, or delete and rebuild after a wave. All bingo writes now
-- go through the two functions below; clients keep SELECT only.

-- Work-in-progress picks (array of 25 slots). Owner-only: bingo_cards_read
-- exposes a card publicly only once locked, and locking clears the draft.
alter table public.bingo_cards
  add column if not exists draft jsonb,
  add column if not exists updated_at timestamptz not null default now();

drop policy if exists bingo_cards_write   on public.bingo_cards;
drop policy if exists bingo_squares_write on public.bingo_squares;
revoke all on public.bingo_cards, public.bingo_squares, public.v_bingo_pick_rate from anon, authenticated;
grant select on public.bingo_cards, public.bingo_squares, public.v_bingo_pick_rate to anon, authenticated;

-- The first wave closes the game, so waves must not be writable by any member.
drop policy if exists announcement_waves_insert on public.announcement_waves;
drop policy if exists announcement_waves_update on public.announcement_waves;
create policy announcement_waves_insert on public.announcement_waves for insert
  with check (is_moderator());
create policy announcement_waves_update on public.announcement_waves for update
  using (is_moderator()) with check (is_moderator());
drop policy if exists lineup_announcements_insert on public.lineup_announcements;
drop policy if exists lineup_announcements_update on public.lineup_announcements;
create policy lineup_announcements_insert on public.lineup_announcements for insert
  with check (is_moderator());
create policy lineup_announcements_update on public.lineup_announcements for update
  using (is_moderator()) with check (is_moderator());

-- A locked card's PICKS are immutable, but scoring (is_hit / resolved_at) has
-- to be able to update them as waves land (E7-05).
create or replace function public.enforce_bingo_lock() returns trigger
language plpgsql set search_path = public as $$
declare locked timestamptz;
begin
  select locked_at into locked from bingo_cards
   where id = case when tg_op = 'INSERT' then new.card_id else old.card_id end;
  if locked is not null then
    if tg_op = 'UPDATE'
       and (new.card_id, new.position, new.artist_id, new.is_free)
           is not distinct from (old.card_id, old.position, old.artist_id, old.is_free) then
      return new;
    end if;
    raise exception 'Card is locked; squares are immutable.';
  end if;
  return coalesce(new, old);
end $$;

-- Open = upcoming, not cancelled, and no announcement wave yet.
-- Mirrored for display by isBingoOpen() in lib/bingo.ts; this is the authority.
create or replace function public.bingo_is_open(p_edition_id uuid) returns boolean
language sql stable set search_path = public as $$
  select exists (
    select 1 from editions e
    where e.id = p_edition_id
      and not e.is_cancelled
      and coalesce(e.start_date, make_date(e.year, 7, 1)) > current_date
      and not exists (
        select 1 from announcement_waves w
        where w.edition_id = e.id and w.announced_at <= now()
      )
  );
$$;

-- Shared gate: signed in, not banned, game open, card not locked. Returns the
-- caller's card id (created if needed), row-locked for the transaction.
create or replace function public.bingo_open_card(p_edition_id uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  uid  uuid := auth.uid();
  card bingo_cards%rowtype;
begin
  if uid is null or not is_active_user() then
    raise exception 'Please sign in first.';
  end if;
  if not bingo_is_open(p_edition_id) then
    raise exception 'Bingo is closed for this edition.';
  end if;
  insert into bingo_cards (user_id, edition_id) values (uid, p_edition_id)
    on conflict (user_id, edition_id) do nothing;
  select * into card from bingo_cards
   where user_id = uid and edition_id = p_edition_id for update;
  if card.locked_at is not null then
    raise exception 'Your card is already locked.';
  end if;
  return card.id;
end $$;

create or replace function public.save_bingo_draft(
  p_edition_id uuid, p_title text, p_is_public boolean, p_draft jsonb
) returns uuid
language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  if p_draft is null or jsonb_typeof(p_draft) <> 'array' then
    raise exception 'That draft is not valid.';
  end if;
  if jsonb_array_length(p_draft) <> 25 or octet_length(p_draft::text) > 16384 then
    raise exception 'That draft is not valid.';
  end if;
  cid := bingo_open_card(p_edition_id);
  update bingo_cards
     set title = nullif(left(btrim(coalesce(p_title, '')), 60), ''),
         is_public = coalesce(p_is_public, true),
         draft = p_draft,
         updated_at = now()
   where id = cid;
  return cid;
end $$;

-- p_artist_ids: the 24 picks in reading order, skipping the free center (12).
create or replace function public.lock_bingo_card(
  p_edition_id uuid, p_title text, p_is_public boolean, p_artist_ids uuid[]
) returns uuid
language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  if p_artist_ids is null or array_ndims(p_artist_ids) is distinct from 1
     or cardinality(p_artist_ids) <> 24 then
    raise exception 'A card needs exactly 24 artists.';
  end if;
  if (select count(distinct a) from unnest(p_artist_ids) a) <> 24 then
    raise exception 'Each artist can appear only once on a card.';
  end if;
  if (select count(*) from artists where id = any(p_artist_ids) and status = 'visible') <> 24 then
    raise exception 'One of those artists is no longer available.';
  end if;

  cid := bingo_open_card(p_edition_id);
  delete from bingo_squares where card_id = cid;
  insert into bingo_squares (card_id, position, artist_id)
  select cid, (case when ord <= 12 then ord - 1 else ord end)::int, a
    from unnest(p_artist_ids) with ordinality as t(a, ord);
  insert into bingo_squares (card_id, position, is_free) values (cid, 12, true);

  update bingo_cards
     set title = nullif(left(btrim(coalesce(p_title, '')), 60), ''),
         is_public = coalesce(p_is_public, true),
         draft = null,
         locked_at = now(),
         updated_at = now()
   where id = cid;
  return cid;
end $$;

revoke execute on function public.bingo_open_card(uuid) from public, anon, authenticated;
revoke execute on function public.save_bingo_draft(uuid, text, boolean, jsonb) from public, anon;
revoke execute on function public.lock_bingo_card(uuid, text, boolean, uuid[]) from public, anon;
grant  execute on function public.save_bingo_draft(uuid, text, boolean, jsonb) to authenticated;
grant  execute on function public.lock_bingo_card(uuid, text, boolean, uuid[]) to authenticated;
