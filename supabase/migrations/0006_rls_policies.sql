-- 0006_rls_policies.sql
-- RLS on every table. Pattern: public read of visible content,
-- authenticated non-banned users create, owners edit their own,
-- moderators override.

-- ---------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------
do $$
declare t text;
begin
  for t in
    select tablename from pg_tables
    where schemaname = 'public'
      and tablename not like 'pg_%'
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ---------------------------------------------------------------
-- Reference / canonical data: world-readable, contributor-writable
-- ---------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'artists','artist_aliases','artist_memberships','instruments',
    'organizations','artist_org_links','releases','release_credits',
    'venues','editions','events','stages','stage_transits','sets',
    'songs','song_aliases','badges','merch_items',
    'prediction_features','announcement_waves','lineup_announcements'
  ]
  loop
    execute format($f$
      create policy %1$I_read on public.%1$I for select using (true);
      create policy %1$I_insert on public.%1$I for insert
        with check (is_active_user());
      create policy %1$I_update on public.%1$I for update
        using (is_active_user()) with check (is_active_user());
      create policy %1$I_delete on public.%1$I for delete
        using (is_moderator());
    $f$, t);
  end loop;
end $$;

-- ---------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------
create policy profiles_read on profiles for select using (true);
create policy profiles_update_own on profiles for update
  using (id = auth.uid() or is_moderator())
  with check (id = auth.uid() or is_moderator());

-- Role escalation guard: only admins may change `role` or ban flags.
create or replace function guard_profile_privileges() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- auth.uid() is null for the service role and scheduled jobs; those are
  -- trusted backend contexts (nightly badge/reputation evaluation).
  if auth.uid() is null then
    return new;
  end if;
  if (new.role is distinct from old.role
      or new.is_banned is distinct from old.is_banned
      or new.reputation is distinct from old.reputation)
     and current_role_level() <> 'admin' then
    raise exception 'Insufficient privileges to modify role, ban status, or reputation.';
  end if;
  return new;
end $$;
create trigger trg_guard_profile before update on profiles
  for each row execute function guard_profile_privileges();

-- ---------------------------------------------------------------
-- Performances & verification
-- ---------------------------------------------------------------
create policy performances_read on performances for select
  using (status <> 'rejected' or is_moderator());
create policy performances_insert on performances for insert
  with check (is_active_user() and submitted_by = auth.uid());
create policy performances_update on performances for update
  using (is_active_user()) with check (is_active_user());
create policy performances_delete on performances for delete
  using (is_moderator());

create policy perf_votes_read on performance_votes for select using (true);
create policy perf_votes_write on performance_votes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid() and is_active_user());

-- ---------------------------------------------------------------
-- Setlists (wiki-editable, revert-protected via revisions)
-- ---------------------------------------------------------------
create policy setlist_read on setlist_entries for select using (true);
create policy setlist_write on setlist_entries for insert with check (is_active_user());
create policy setlist_update on setlist_entries for update
  using (is_active_user()) with check (is_active_user());
create policy setlist_delete on setlist_entries for delete using (is_active_user());

create policy sep_read on setlist_entry_performers for select using (true);
create policy sep_write on setlist_entry_performers for all
  using (is_active_user()) with check (is_active_user());

-- ---------------------------------------------------------------
-- Owner-authored content
-- ---------------------------------------------------------------
do $$
declare t text; owner_col text;
begin
  foreach t in array array['set_reviews','media_embeds','posts','topics'] loop
    owner_col := case when t in ('set_reviews','posts','topics') then 'author_id' else 'submitted_by' end;
    execute format($f$
      create policy %1$I_read on public.%1$I for select
        using (status = 'visible' or %2$I = auth.uid() or is_moderator());
      create policy %1$I_insert on public.%1$I for insert
        with check (is_active_user() and %2$I = auth.uid());
      create policy %1$I_update on public.%1$I for update
        using (%2$I = auth.uid() or is_moderator())
        with check (%2$I = auth.uid() or is_moderator());
      create policy %1$I_delete on public.%1$I for delete
        using (%2$I = auth.uid() or is_moderator());
    $f$, t, owner_col);
  end loop;
end $$;

create policy forum_cat_read on forum_categories for select using (true);
create policy forum_cat_write on forum_categories for all
  using (is_moderator()) with check (is_moderator());

create policy votes_read on votes for select using (true);
create policy votes_write on votes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid() and is_active_user());

-- ---------------------------------------------------------------
-- Private-to-user data
-- ---------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['set_attendance','event_attendance','user_follows',
                           'user_schedule_items'] loop
    execute format($f$
      create policy %1$I_own on public.%1$I for all
        using (user_id = auth.uid()) with check (user_id = auth.uid());
    $f$, t);
  end loop;
end $$;

-- Deliberate: set attendance is publicly readable so set pages can show
-- "412 people saw this" and profiles can show history. Permissive policies OR
-- together, so this widens SELECT on set_attendance only. Event attendance,
-- follows, and schedule items stay private to their owner.
-- If you later want attendance private, drop this policy and expose counts
-- through a security-definer aggregate function instead.
create policy set_attendance_public_read on set_attendance for select using (true);

create policy schedules_read on user_schedules for select
  using (is_public or user_id = auth.uid());
create policy schedules_write on user_schedules for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- schedule items follow their parent schedule
drop policy if exists user_schedule_items_own on user_schedule_items;
create policy schedule_items_rw on user_schedule_items for all
  using (exists (select 1 from user_schedules s
                 where s.id = schedule_id and (s.user_id = auth.uid() or s.is_public)))
  with check (exists (select 1 from user_schedules s
                 where s.id = schedule_id and s.user_id = auth.uid()));

-- ---------------------------------------------------------------
-- Bingo: cards public after lock, editable only before
-- ---------------------------------------------------------------
create policy bingo_cards_read on bingo_cards for select
  using ((is_public and locked_at is not null) or user_id = auth.uid() or is_moderator());
create policy bingo_cards_write on bingo_cards for all
  using (user_id = auth.uid()) with check (user_id = auth.uid() and is_active_user());

create policy bingo_squares_read on bingo_squares for select
  using (exists (select 1 from bingo_cards c where c.id = card_id
                 and ((c.is_public and c.locked_at is not null) or c.user_id = auth.uid())));
create policy bingo_squares_write on bingo_squares for all
  using (exists (select 1 from bingo_cards c where c.id = card_id and c.user_id = auth.uid()))
  with check (exists (select 1 from bingo_cards c where c.id = card_id and c.user_id = auth.uid()));

-- ---------------------------------------------------------------
-- Evidence, news, predictions: public read, restricted write
-- ---------------------------------------------------------------
create policy sources_read on sources for select using (true);
create policy sources_write on sources for insert with check (is_active_user());
create policy citations_read on citations for select using (true);
create policy citations_write on citations for insert with check (is_active_user());
create policy citations_delete on citations for delete using (is_moderator());

create policy revisions_read on revisions for select using (true);

create policy news_read on news_items for select using (not is_suppressed or is_moderator());
create policy news_write on news_items for all
  using (is_moderator()) with check (is_moderator());

create policy snapshots_read on artist_feature_snapshots for select using (true);
create policy predictions_read on predictions for select using (true);
create policy outcomes_read on prediction_outcomes for select using (true);

-- ---------------------------------------------------------------
-- Moderation
-- ---------------------------------------------------------------
create policy reports_insert on reports for insert
  with check (is_active_user() and reporter_id = auth.uid());
create policy reports_read on reports for select
  using (reporter_id = auth.uid() or is_moderator());
create policy reports_update on reports for update
  using (is_moderator()) with check (is_moderator());

create policy modactions_read on moderation_actions for select using (is_moderator());
create policy modactions_write on moderation_actions for insert with check (is_moderator());

-- ---------------------------------------------------------------
-- Merch listings
-- ---------------------------------------------------------------
create policy listings_read on merch_listings for select
  using (status = 'active' or seller_id = auth.uid() or is_moderator());
create policy listings_write on merch_listings for all
  using (seller_id = auth.uid() or is_moderator())
  with check (seller_id = auth.uid() and is_active_user());
