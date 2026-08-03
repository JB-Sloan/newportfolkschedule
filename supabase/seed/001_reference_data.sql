-- 001_reference_data.sql
-- Reference data. Idempotent — safe to re-run.

-- ---------------------------------------------------------------
-- Instruments
-- ---------------------------------------------------------------
insert into instruments (slug, name, family) values
  ('vocals','Vocals','voice'),
  ('harmony-vocals','Harmony Vocals','voice'),
  ('acoustic-guitar','Acoustic Guitar','strings'),
  ('electric-guitar','Electric Guitar','strings'),
  ('pedal-steel','Pedal Steel','strings'),
  ('lap-steel','Lap Steel','strings'),
  ('banjo','Banjo','strings'),
  ('mandolin','Mandolin','strings'),
  ('fiddle','Fiddle','strings'),
  ('upright-bass','Upright Bass','strings'),
  ('bass','Bass Guitar','strings'),
  ('dobro','Dobro','strings'),
  ('autoharp','Autoharp','strings'),
  ('piano','Piano','keys'),
  ('organ','Organ','keys'),
  ('accordion','Accordion','keys'),
  ('drums','Drums','percussion'),
  ('percussion','Percussion','percussion'),
  ('harmonica','Harmonica','wind'),
  ('saxophone','Saxophone','wind'),
  ('trumpet','Trumpet','wind'),
  ('flute','Flute','wind')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------
-- Venue & stages
-- ---------------------------------------------------------------
insert into venues (name, slug, city, state, country, lat, lng, is_primary_site)
values ('Fort Adams State Park','fort-adams','Newport','RI','US', 41.476, -71.339, true)
on conflict (slug) do nothing;

insert into stages (venue_id, name, slug, sort_order)
select v.id, s.name, s.slug, s.ord
from venues v,
     (values
       ('Fort Stage','fort',1),
       ('Quad Stage','quad',2),
       ('Harbor Stage','harbor',3),
       ('Museum Stage','museum',4),
       ('Foundation Stage','foundation',5)
     ) as s(name, slug, ord)
where v.slug = 'fort-adams'
on conflict (venue_id, slug) do nothing;

-- Walking times between stages. Populate by hand once; powers realistic
-- conflict detection in the schedule builder. Values are placeholders —
-- replace with measured times.
insert into stage_transits (from_stage_id, to_stage_id, walk_minutes)
select a.id, b.id,
       case
         when a.slug = 'fort'  and b.slug = 'quad'   then 7
         when a.slug = 'fort'  and b.slug = 'harbor' then 9
         when a.slug = 'quad'  and b.slug = 'harbor' then 5
         when a.slug = 'museum' or b.slug = 'museum' then 6
         else 6
       end
from stages a join stages b on a.id <> b.id
on conflict do nothing;

-- ---------------------------------------------------------------
-- Forum categories
-- ---------------------------------------------------------------
insert into forum_categories (slug, name, description, default_kind, sort_order) values
  ('fort-talk','General / Fort Talk','Everything Newport.','discussion',1),
  ('set-discussion','Set Discussion','Threads for individual sets.','set_thread',2),
  ('ticket-exchange','Face-Value Ticket Exchange','Face value only. No off-platform payment advice. Read the pinned rules.','ticket_exchange',3),
  ('lodging-travel','Lodging & Travel','Where to stay, how to get there.','lodging',4),
  ('logistics','Ferry, Shuttle & Parking','The perennial thread.','logistics',5),
  ('newcomers','Newcomer FAQ','Chairs, water, sunscreen, the walk in.','newcomer',6),
  ('meetups','Meetups','Find your people.','meetup',7),
  ('wall-of-weird','The Wall of Weird','Traditions, tattoos, rituals. We are weird for this festival.','wall_of_weird',8),
  ('aftershows','Aftershows & Late Night','What happened after the Fort closed.','discussion',9),
  ('wishlist','The Wishlist','Dream sit-ins, artists we want back. Fan wishes, not official feedback.','wishlist',10),
  ('off-season','Off-Season Listening','What carries you through February.','discussion',11)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------
-- Prediction feature weights (see docs/05-prediction-model.md)
-- Starting guesses. Freeze at a published date each cycle.
-- ---------------------------------------------------------------
insert into prediction_features (key, name, weight, direction, description, is_manual) values
  ('F01_prior_history',      'Prior Newport History',        10, 'positive','Count and recency of prior appearances; non-linear.', false),
  ('F02_tour_adjacency',     'Tour Routing Adjacency',        9, 'positive','Announced dates within ~500mi / +/-10 days of fest weekend.', false),
  ('F03_availability_conflict','Hard Availability Conflict', 15, 'negative','Announced conflicting date that weekend. Near-eliminating.', false),
  ('F04_album_cycle',        'Album Cycle Position',          8, 'positive','Release 0-9 months before, or announced for just after.', false),
  ('F05_booking_agent',      'Booking Agent',                 7, 'positive','Agent roster clustering. Stronger than label.', false),
  ('F06_orbit_centrality',   'Collaborator Orbit Centrality', 7, 'positive','Degrees of separation in our own sit-in graph.', false),
  ('F07_label',              'Label',                         5, 'positive','Label roster clustering.', false),
  ('F08_producer',           'Producer',                      4, 'positive','Shared producers with Newport alumni.', false),
  ('F09_management',         'Management Company',            5, 'positive','Management roster clustering.', false),
  ('F10_opened_for',         'Opened for Newport Artist',     6, 'positive','Support slot on a Newport-adjacent tour.', false),
  ('F11_collaborated_with',  'Collaborated with Alum',        6, 'positive','Recorded or performed collaboration.', false),
  ('F12_tiny_desk',          'Tiny Desk Appearance',          5, 'positive','Recency-weighted.', false),
  ('F13_festival_circuit',   'Correlated Festival Circuit',   6, 'positive','Green River, Pickathon, Telluride, Railbird, Cambridge Folk, Green Man.', false),
  ('F14_foundation_ties',    'Newport Foundation Ties',       5, 'positive','Grants, workshops, folk school.', false),
  ('F15_jazz_overlap',       'Newport Jazz Overlap',          4, 'positive','Same org, adjacent weekend.', false),
  ('F16_geography',          'Geography Bonus',               3, 'positive','IE/UK/AU, Nashville, LA, Brooklyn, NC, Boston, Austin, Toronto.', false),
  ('F17_style_fit',          'Genre / Style Fit',             4, 'positive','Multi-label: folk, americana, political, indie-folk, gospel, blues.', false),
  ('F18_debut_breakout',     'Debut / Breakout Flag',         5, 'positive','First significant record.', false),
  ('F19_nostalgia',          'Nostalgia Score',               4, 'positive','Pre-2000 acts, once-major, still touring.', false),
  ('F20_crowd_pick_rate',    'Crowd Pick Rate',               4, 'positive','From locked bingo cards and wishlist votes.', false),
  ('F21_recency_cooldown',   'Recency Cooldown',              3, 'negative','Played last year. Suppressed for artists with 3+ appearances.', false),
  ('F22_themed_set_fit',     'Themed Set Fit',                3, 'positive','Tribute/superjam candidate.', false),
  ('F23_white_whale',        'Jay''s White Whale',           50, 'positive','Manual override. Displayed honestly, with a whale.', true)
on conflict (key) do update set
  name = excluded.name, weight = excluded.weight,
  description = excluded.description, direction = excluded.direction;

-- ---------------------------------------------------------------
-- Badges
-- ---------------------------------------------------------------
insert into badges (slug, name, description, tier, criteria) values
  ('first-timer','First Timer','Logged your first Newport.','bronze','{"type":"editions_attended","min":1}'),
  ('five-year','Five Year Fan','Attended five editions.','silver','{"type":"editions_attended","min":5}'),
  ('ten-year','Decade at the Fort','Attended ten editions.','gold','{"type":"editions_attended","min":10}'),
  ('twenty-year','Lifer','Attended twenty editions.','legendary','{"type":"editions_attended","min":20}'),
  ('century','Century Club','Logged 100 sets.','silver','{"type":"sets_seen","min":100}'),
  ('completionist','Completionist','Saw every set at an edition.','gold','{"type":"edition_completion","pct":100}'),
  ('night-owl','Night Owl','Attended five aftershows.','silver','{"type":"events_attended","kind":"aftershow","min":5}'),
  ('witness','Witness','Present for a surprise set.','gold','{"type":"saw_surprise_set","min":1}'),
  ('archivist','Archivist','Contributed 25 confirmed setlists.','silver','{"type":"setlists_contributed","min":25}'),
  ('graph-keeper','Graph Keeper','Contributed 50 confirmed sit-ins.','gold','{"type":"sitins_confirmed","min":50}'),
  ('oracle','The Oracle','Bingo card scored 15+.','gold','{"type":"bingo_score","min":15}'),
  ('contrarian','Contrarian','Correctly picked an artist under 5% crowd pick rate.','legendary','{"type":"bold_correct_pick","max_pick_rate":0.05}'),
  ('weird','Certified Weird','Posted to the Wall of Weird.','bronze','{"type":"posted_in_category","slug":"wall-of-weird","min":1}')
on conflict (slug) do nothing;
