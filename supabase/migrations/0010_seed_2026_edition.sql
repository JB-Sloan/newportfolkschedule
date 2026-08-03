-- 0010_seed_2026_edition.sql
-- E2-08: Seed the 2026 Newport Folk edition — events, stages, sets.
-- Generated from data/{schedule,artists,stages,aftershows}-2026.json
-- (planner schedule version 2026.official.2). Idempotent for reference data
-- and the edition; guarded against double-seeding events/sets.

begin;

-- ---------------------------------------------------------------
-- Reference data the 2026 schedule needs that the seed migration lacked.
-- The 2026 lineup uses the Bike Stage (open mic / acoustic), not the Museum
-- Stage the reference seed guessed at. Add it and its walking times.
-- ---------------------------------------------------------------
insert into stages (venue_id, name, slug, sort_order)
select v.id, 'Bike Stage', 'bike', 6
from venues v where v.slug = 'fort-adams'
on conflict (venue_id, slug) do nothing;

insert into stage_transits (from_stage_id, to_stage_id, walk_minutes)
select a.id, b.id, t.min
from (values
    ('bike', 'fort', 12),
    ('fort', 'bike', 12),
    ('bike', 'harbor', 10),
    ('harbor', 'bike', 10),
    ('bike', 'quad', 10),
    ('quad', 'bike', 10),
    ('bike', 'foundation', 12),
    ('foundation', 'bike', 12)
) as t(from_slug, to_slug, min)
join stages a on a.slug = t.from_slug and a.venue_id = (select id from venues where slug = 'fort-adams')
join stages b on b.slug = t.to_slug   and b.venue_id = (select id from venues where slug = 'fort-adams')
on conflict do nothing;

-- Aftershows happen off-site at the Jane Pickens Theater downtown.
insert into venues (name, slug, city, state, country, is_primary_site)
values ('The Jane Pickens Theater & Event Center', 'jane-pickens', 'Newport', 'RI', 'US', false)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------
-- Edition
-- ---------------------------------------------------------------
insert into editions (year, name, start_date, end_date, venue_id, notes)
select 2026, 'Newport Folk Festival 2026', date '2026-07-24', date '2026-07-26', v.id,
  'Seeded from the fan planner schedule version 2026.official.2 (newportfolk.org/schedule). Artists and times subject to change.'
from venues v where v.slug = 'fort-adams'
on conflict (year) do update set
  name = excluded.name, start_date = excluded.start_date,
  end_date = excluded.end_date, venue_id = excluded.venue_id, notes = excluded.notes;

-- Guard: never double-seed events/sets for a populated edition.
do $$
begin
  if exists (select 1 from events e join editions ed on ed.id = e.edition_id where ed.year = 2026) then
    raise exception 'Events already exist for the 2026 edition; aborting to avoid duplicates.';
  end if;
end $$;

-- ---------------------------------------------------------------
-- Events: three main festival days + the announced aftershows.
-- ---------------------------------------------------------------
insert into events (edition_id, kind, name, date, venue_id, is_official)
select ed.id, 'main_stage_day', d.name, d.dt::date, fa.id, true
from editions ed
cross join (values
    ('Friday', '2026-07-24'),
    ('Saturday', '2026-07-25'),
    ('Sunday', '2026-07-26')
) as d(name, dt)
join venues fa on fa.slug = 'fort-adams'
where ed.year = 2026;

insert into events (edition_id, kind, name, date, venue_id, is_official, notes)
select ed.id, 'aftershow', a.name, a.dt::date, jpt.id, true, a.note
from editions ed
cross join (values
    ('Newport Folk Aftershow: Mister Romantic', '2026-07-24', 'Mister Romantic is John C. Reilly''s stage project, so the billed act is known.'),
    ('Newport Folk Aftershow: Felice County Fair', '2026-07-25', 'Named for the Felice Brothers tribute album announced July 17, 2026. The venue has not published a performer list, so who plays is not confirmed.')
) as a(name, dt, note)
join venues jpt on jpt.slug = 'jane-pickens'
where ed.year = 2026;

-- ---------------------------------------------------------------
-- Sets: main-stage schedule. billed_artist_id stays null until the music
-- graph (E1) is populated; billed_name preserves the printed billing.
-- ---------------------------------------------------------------
insert into sets (event_id, stage_id, billed_name, slug, set_kind, scheduled_start, scheduled_end)
select e.id, st.id, v.billed_name, v.slug, v.set_kind::set_kind, v.s_start::timestamptz, v.s_end::timestamptz
from (values
    ('2026-07-24', 'fort', 'Honest Charlie', '2026-07-24-honest-charlie', 'standard', '2026-07-24T11:30:00-04:00', '2026-07-24T12:00:00-04:00'),
    ('2026-07-24', 'fort', 'Tiny Habits', '2026-07-24-tiny-habits', 'standard', '2026-07-24T12:30:00-04:00', '2026-07-24T13:20:00-04:00'),
    ('2026-07-24', 'fort', 'Wednesday', '2026-07-24-wednesday', 'standard', '2026-07-24T13:50:00-04:00', '2026-07-24T14:45:00-04:00'),
    ('2026-07-24', 'fort', 'Courtney Barnett', '2026-07-24-courtney-barnett', 'standard', '2026-07-24T15:20:00-04:00', '2026-07-24T16:20:00-04:00'),
    ('2026-07-24', 'fort', 'Lucy Dacus', '2026-07-24-lucy-dacus', 'standard', '2026-07-24T16:55:00-04:00', '2026-07-24T17:55:00-04:00'),
    ('2026-07-24', 'fort', 'Hayley Williams', '2026-07-24-hayley-williams', 'standard', '2026-07-24T18:35:00-04:00', '2026-07-24T19:45:00-04:00'),
    ('2026-07-24', 'quad', 'Brother Wallace', '2026-07-24-brother-wallace', 'standard', '2026-07-24T11:05:00-04:00', '2026-07-24T11:50:00-04:00'),
    ('2026-07-24', 'quad', 'Hudson Freeman', '2026-07-24-hudson-freeman', 'standard', '2026-07-24T12:20:00-04:00', '2026-07-24T13:10:00-04:00'),
    ('2026-07-24', 'quad', 'Michael Shannon & Jason Narducy and Friends Play R.E.M.', '2026-07-24-shannon-narducy-rem', 'standard', '2026-07-24T13:40:00-04:00', '2026-07-24T14:30:00-04:00'),
    ('2026-07-24', 'quad', 'Fruit Bats', '2026-07-24-fruit-bats', 'standard', '2026-07-24T15:00:00-04:00', '2026-07-24T15:50:00-04:00'),
    ('2026-07-24', 'quad', 'Deer Tick', '2026-07-24-deer-tick', 'standard', '2026-07-24T16:20:00-04:00', '2026-07-24T17:15:00-04:00'),
    ('2026-07-24', 'quad', 'Ms. Lauryn Hill', '2026-07-24-ms-lauryn-hill', 'standard', '2026-07-24T17:50:00-04:00', '2026-07-24T18:50:00-04:00'),
    ('2026-07-24', 'harbor', 'Infinity Song', '2026-07-24-infinity-song', 'standard', '2026-07-24T11:00:00-04:00', '2026-07-24T11:40:00-04:00'),
    ('2026-07-24', 'harbor', 'Courtney Marie Andrews', '2026-07-24-courtney-marie-andrews', 'standard', '2026-07-24T12:05:00-04:00', '2026-07-24T12:50:00-04:00'),
    ('2026-07-24', 'harbor', 'Haley Heynderickx & Max García Conover', '2026-07-24-heynderickx-garcia-conover', 'collaborative', '2026-07-24T13:20:00-04:00', '2026-07-24T14:10:00-04:00'),
    ('2026-07-24', 'harbor', 'Amble', '2026-07-24-amble', 'standard', '2026-07-24T14:40:00-04:00', '2026-07-24T15:30:00-04:00'),
    ('2026-07-24', 'harbor', 'Hot Tuna', '2026-07-24-hot-tuna', 'standard', '2026-07-24T16:00:00-04:00', '2026-07-24T16:55:00-04:00'),
    ('2026-07-24', 'harbor', 'Matt Quinn', '2026-07-24-matt-quinn', 'standard', '2026-07-24T17:25:00-04:00', '2026-07-24T18:20:00-04:00'),
    ('2026-07-24', 'foundation', 'For Pete''s Sake', '2026-07-24-for-petes-sake', 'workshop', '2026-07-24T10:15:00-04:00', '2026-07-24T11:15:00-04:00'),
    ('2026-07-24', 'foundation', 'Taylor Hollingsworth', '2026-07-24-taylor-hollingsworth', 'standard', '2026-07-24T12:00:00-04:00', '2026-07-24T12:25:00-04:00'),
    ('2026-07-24', 'foundation', 'Jackie Evans', '2026-07-24-jackie-evans', 'standard', '2026-07-24T13:20:00-04:00', '2026-07-24T13:45:00-04:00'),
    ('2026-07-24', 'foundation', 'MET Lab Students', '2026-07-24-met-lab-students', 'workshop', '2026-07-24T14:45:00-04:00', '2026-07-24T15:15:00-04:00'),
    ('2026-07-24', 'bike', 'Open Mic', '2026-07-24-open-mic', 'workshop', '2026-07-24T10:05:00-04:00', '2026-07-24T11:05:00-04:00'),
    ('2026-07-24', 'bike', 'Belle Blue', '2026-07-24-belle-blue', 'standard', '2026-07-24T11:50:00-04:00', '2026-07-24T12:15:00-04:00'),
    ('2026-07-24', 'bike', 'Lily Fitts', '2026-07-24-lily-fitts', 'standard', '2026-07-24T13:10:00-04:00', '2026-07-24T13:35:00-04:00'),
    ('2026-07-25', 'fort', 'Princess June', '2026-07-25-princess-june', 'standard', '2026-07-25T11:30:00-04:00', '2026-07-25T12:00:00-04:00'),
    ('2026-07-25', 'fort', 'Evan Honer', '2026-07-25-evan-honer', 'standard', '2026-07-25T12:30:00-04:00', '2026-07-25T13:20:00-04:00'),
    ('2026-07-25', 'fort', 'Punch Brothers', '2026-07-25-punch-brothers', 'standard', '2026-07-25T13:50:00-04:00', '2026-07-25T14:45:00-04:00'),
    ('2026-07-25', 'fort', 'Lizzy McAlpine', '2026-07-25-lizzy-mcalpine', 'standard', '2026-07-25T15:20:00-04:00', '2026-07-25T16:20:00-04:00'),
    ('2026-07-25', 'fort', 'Gillian Welch & David Rawlings', '2026-07-25-gillian-welch-david-rawlings', 'standard', '2026-07-25T16:55:00-04:00', '2026-07-25T17:55:00-04:00'),
    ('2026-07-25', 'fort', 'The Lumineers', '2026-07-25-the-lumineers', 'standard', '2026-07-25T18:35:00-04:00', '2026-07-25T19:45:00-04:00'),
    ('2026-07-25', 'quad', 'Kirby', '2026-07-25-kirby', 'standard', '2026-07-25T11:05:00-04:00', '2026-07-25T11:50:00-04:00'),
    ('2026-07-25', 'quad', 'Leif Vollebekk', '2026-07-25-leif-vollebekk', 'standard', '2026-07-25T12:20:00-04:00', '2026-07-25T13:10:00-04:00'),
    ('2026-07-25', 'quad', 'This Is Lorelei', '2026-07-25-this-is-lorelei', 'standard', '2026-07-25T13:40:00-04:00', '2026-07-25T14:30:00-04:00'),
    ('2026-07-25', 'quad', 'Medium Build', '2026-07-25-medium-build', 'standard', '2026-07-25T15:00:00-04:00', '2026-07-25T15:50:00-04:00'),
    ('2026-07-25', 'quad', 'Cat Power', '2026-07-25-cat-power', 'standard', '2026-07-25T16:20:00-04:00', '2026-07-25T17:15:00-04:00'),
    ('2026-07-25', 'quad', 'Vulfpeck', '2026-07-25-vulfpeck', 'standard', '2026-07-25T17:50:00-04:00', '2026-07-25T18:50:00-04:00'),
    ('2026-07-25', 'harbor', 'Trousdale', '2026-07-25-trousdale', 'standard', '2026-07-25T11:00:00-04:00', '2026-07-25T11:40:00-04:00'),
    ('2026-07-25', 'harbor', 'The Olllam', '2026-07-25-the-olllam', 'standard', '2026-07-25T12:05:00-04:00', '2026-07-25T12:50:00-04:00'),
    ('2026-07-25', 'harbor', 'Yasmin Williams & William Tyler', '2026-07-25-williams-tyler', 'collaborative', '2026-07-25T13:20:00-04:00', '2026-07-25T14:10:00-04:00'),
    ('2026-07-25', 'harbor', 'Sea to Shining Sea', '2026-07-25-sea-to-shining-sea', 'standard', '2026-07-25T14:40:00-04:00', '2026-07-25T15:30:00-04:00'),
    ('2026-07-25', 'harbor', 'The Barr Brothers', '2026-07-25-the-barr-brothers', 'standard', '2026-07-25T16:00:00-04:00', '2026-07-25T16:55:00-04:00'),
    ('2026-07-25', 'harbor', 'Dawes', '2026-07-25-dawes', 'standard', '2026-07-25T17:25:00-04:00', '2026-07-25T18:20:00-04:00'),
    ('2026-07-25', 'foundation', 'Music Lab Students', '2026-07-25-music-lab-students', 'workshop', '2026-07-25T12:00:00-04:00', '2026-07-25T12:25:00-04:00'),
    ('2026-07-25', 'foundation', 'Community Chapstick', '2026-07-25-community-chapstick', 'standard', '2026-07-25T13:20:00-04:00', '2026-07-25T13:45:00-04:00'),
    ('2026-07-25', 'foundation', 'Jordan Klepper', '2026-07-25-jordan-klepper', 'standard', '2026-07-25T14:45:00-04:00', '2026-07-25T15:15:00-04:00'),
    ('2026-07-25', 'foundation', 'Jonathan Bernstein', '2026-07-25-jonathan-bernstein', 'standard', '2026-07-25T16:20:00-04:00', '2026-07-25T16:50:00-04:00'),
    ('2026-07-25', 'bike', 'Open Mic', '2026-07-25-open-mic', 'workshop', '2026-07-25T10:05:00-04:00', '2026-07-25T11:05:00-04:00'),
    ('2026-07-25', 'bike', 'Morgan Nagler', '2026-07-25-morgan-nagler', 'standard', '2026-07-25T11:50:00-04:00', '2026-07-25T12:15:00-04:00'),
    ('2026-07-25', 'bike', 'Madi Diaz', '2026-07-25-madi-diaz', 'standard', '2026-07-25T13:10:00-04:00', '2026-07-25T13:35:00-04:00'),
    ('2026-07-25', 'bike', 'John R. Miller', '2026-07-25-john-r-miller', 'standard', '2026-07-25T14:30:00-04:00', '2026-07-25T14:55:00-04:00'),
    ('2026-07-26', 'fort', 'Mark Cutler', '2026-07-26-mark-cutler', 'standard', '2026-07-26T11:25:00-04:00', '2026-07-26T11:55:00-04:00'),
    ('2026-07-26', 'fort', 'Snacktime', '2026-07-26-snacktime', 'standard', '2026-07-26T12:25:00-04:00', '2026-07-26T13:05:00-04:00'),
    ('2026-07-26', 'fort', 'CMAT', '2026-07-26-cmat', 'standard', '2026-07-26T13:35:00-04:00', '2026-07-26T14:25:00-04:00'),
    ('2026-07-26', 'fort', 'Brandi Carlile', '2026-07-26-brandi-carlile', 'standard', '2026-07-26T16:15:00-04:00', '2026-07-26T17:15:00-04:00'),
    ('2026-07-26', 'fort', 'Father John Misty', '2026-07-26-father-john-misty', 'standard', '2026-07-26T14:55:00-04:00', '2026-07-26T15:40:00-04:00'),
    ('2026-07-26', 'fort', 'Nathaniel Rateliff', '2026-07-26-nathaniel-rateliff', 'standard', '2026-07-26T17:55:00-04:00', '2026-07-26T19:45:00-04:00'),
    ('2026-07-26', 'quad', 'Ryan Davis & The Roadhouse Band', '2026-07-26-ryan-davis-roadhouse-band', 'standard', '2026-07-26T11:10:00-04:00', '2026-07-26T11:55:00-04:00'),
    ('2026-07-26', 'quad', 'Dove Ellis', '2026-07-26-dove-ellis', 'standard', '2026-07-26T12:25:00-04:00', '2026-07-26T13:15:00-04:00'),
    ('2026-07-26', 'quad', 'Searows', '2026-07-26-searows', 'standard', '2026-07-26T13:45:00-04:00', '2026-07-26T14:35:00-04:00'),
    ('2026-07-26', 'quad', 'The Fearless Flyers', '2026-07-26-the-fearless-flyers', 'standard', '2026-07-26T15:05:00-04:00', '2026-07-26T15:55:00-04:00'),
    ('2026-07-26', 'quad', 'Tom Morello', '2026-07-26-tom-morello', 'standard', '2026-07-26T16:25:00-04:00', '2026-07-26T17:25:00-04:00'),
    ('2026-07-26', 'quad', 'Brandon Flowers', '2026-07-26-brandon-flowers', 'standard', '2026-07-26T17:55:00-04:00', '2026-07-26T18:55:00-04:00'),
    ('2026-07-26', 'harbor', 'Brittany Davis', '2026-07-26-brittany-davis', 'standard', '2026-07-26T11:00:00-04:00', '2026-07-26T11:40:00-04:00'),
    ('2026-07-26', 'harbor', 'Clover County', '2026-07-26-clover-county', 'standard', '2026-07-26T12:05:00-04:00', '2026-07-26T12:50:00-04:00'),
    ('2026-07-26', 'harbor', 'Strongboi', '2026-07-26-strongboi', 'standard', '2026-07-26T13:15:00-04:00', '2026-07-26T14:05:00-04:00'),
    ('2026-07-26', 'harbor', 'Tim Bernardes', '2026-07-26-tim-bernardes', 'standard', '2026-07-26T14:30:00-04:00', '2026-07-26T15:20:00-04:00'),
    ('2026-07-26', 'harbor', 'Kathleen Edwards', '2026-07-26-kathleen-edwards', 'standard', '2026-07-26T15:50:00-04:00', '2026-07-26T16:45:00-04:00'),
    ('2026-07-26', 'harbor', 'Peter Rowan / Sam Grisman / Sierra Hull / Larry Campbell & Teresa Williams', '2026-07-26-rowan-grisman-hull-campbell-williams', 'collaborative', '2026-07-26T17:15:00-04:00', '2026-07-26T18:10:00-04:00'),
    ('2026-07-26', 'foundation', 'For Pete''s Sake', '2026-07-26-for-petes-sake', 'workshop', '2026-07-26T10:15:00-04:00', '2026-07-26T11:15:00-04:00'),
    ('2026-07-26', 'foundation', 'Stephen Covell', '2026-07-26-stephen-covell', 'standard', '2026-07-26T11:55:00-04:00', '2026-07-26T12:20:00-04:00'),
    ('2026-07-26', 'foundation', 'Gwenifer Raymond', '2026-07-26-gwenifer-raymond', 'standard', '2026-07-26T13:05:00-04:00', '2026-07-26T13:30:00-04:00'),
    ('2026-07-26', 'foundation', 'Victoria Canal', '2026-07-26-victoria-canal', 'standard', '2026-07-26T14:25:00-04:00', '2026-07-26T14:50:00-04:00'),
    ('2026-07-26', 'bike', 'Open Mic', '2026-07-26-open-mic', 'workshop', '2026-07-26T10:05:00-04:00', '2026-07-26T11:05:00-04:00'),
    ('2026-07-26', 'bike', 'Sally Rose', '2026-07-26-sally-rose', 'standard', '2026-07-26T11:55:00-04:00', '2026-07-26T12:20:00-04:00'),
    ('2026-07-26', 'bike', 'Case Oats', '2026-07-26-case-oats', 'standard', '2026-07-26T13:15:00-04:00', '2026-07-26T13:40:00-04:00'),
    ('2026-07-26', 'bike', 'Nabeel', '2026-07-26-nabeel', 'standard', '2026-07-26T14:35:00-04:00', '2026-07-26T15:00:00-04:00')
) as v(dt, stage_slug, billed_name, slug, set_kind, s_start, s_end)
join editions ed on ed.year = 2026
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day' and e.date = v.dt::date
join stages st on st.slug = v.stage_slug and st.venue_id = (select id from venues where slug = 'fort-adams');

-- Aftershow sets (no published set times; stage left null — off-site venue).
insert into sets (event_id, stage_id, billed_name, slug, set_kind, description)
select e.id, null, v.billed_name, v.slug, v.set_kind::set_kind, v.descr
from (values
    ('2026-07-24', 'Mister Romantic (John C. Reilly)', 'jpt-mister-romantic', 'standard', 'Mister Romantic is John C. Reilly''s stage project, so the billed act is known.'),
    ('2026-07-25', 'Felice County Fair', 'jpt-felice-county-fair', 'tribute', 'Named for the Felice Brothers tribute album announced July 17, 2026. The venue has not published a performer list, so who plays is not confirmed.')
) as v(dt, billed_name, slug, set_kind, descr)
join editions ed on ed.year = 2026
join events e on e.edition_id = ed.id and e.kind = 'aftershow' and e.date = v.dt::date;

commit;
