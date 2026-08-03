-- 0011_seed_artists_and_history.sql
-- E1 + historical backfill: seed 74 artists, link 2026 billed performances,
-- and load all 50 historical editions (1959-2025) with 1,526 appearances as
-- text billings (billed vs guest preserved via set_kind/is_surprise).
-- Historical artist identity/linking is deferred to the MusicBrainz import
-- (E1-04) to avoid false fuzzy matches. Generated from data/*.json.

-- Chunk 1: seed 74 artists + link 2026 performances
begin;

insert into artists (name, sort_name, slug, artist_type, spotify_id, bio, genres, official_url) values
  ('Amble', 'Amble', 'amble', 'group', '5ZC7GPz5h9zkEfjZBUDNzI', 'Irish folk trio (Robbie Cunningham, Ross McNerney, Oisín McCaffrey) with soaring three-part harmonies and cinematic acoustic songs that became a fast-rising live draw.', array['folk','indie-folk']::text[], 'https://en.wikipedia.org/wiki/Amble_%28band%29'),
  ('Belle Blue', 'Belle Blue', 'belle-blue', 'person', '2HM8lglYidPbpbtfaZN9Fj', 'A rising songwriter bringing intimate, melodic folk to the Bike Stage.', array['indie-folk','singer-songwriter']::text[], null),
  ('Brandi Carlile', 'Brandi Carlile', 'brandi-carlile', 'person', '2sG4zTOLvjKG1PSoOyf5Ej', 'Nine-time Grammy winner and Newport favorite, a powerhouse Americana voice and festival curator; her ''Returning to Myself'' set spotlights new work.', array['americana','folk-rock']::text[], 'https://en.wikipedia.org/wiki/Brandi_Carlile'),
  ('Brandon Flowers', 'Brandon Flowers', 'brandon-flowers', 'person', '18Zv2g2vUcEGqJf6WnjfXN', 'Frontman of The Killers, bringing widescreen, heartland-tinged rock anthems and a commanding stage presence to his solo material.', array['rock','pop-rock']::text[], 'https://en.wikipedia.org/wiki/Brandon_Flowers'),
  ('Brittany Davis', 'Brittany Davis', 'brittany-davis', 'person', null, 'Seattle multi-instrumentalist and songwriter whose genre-fluid soul, funk and spoken word is fierce and cinematic; performing with Black Thunder.', array['soul','funk','r-and-b']::text[], null),
  ('Brother Wallace', 'Brother Wallace', 'brother-wallace', 'person', null, 'Georgia-raised soul artist who began playing piano in church, teaming with The Heavy''s Dan Taylor for heartfelt, gospel-touched soul.', array['soul','r-and-b']::text[], null),
  ('Case Oats', 'Case Oats', 'case-oats', 'group', '5Ml0QbIoj7bneIUJDCoMx8', 'A Chicago country and honky-tonk band fronted by songwriter Casey Walker, with warm, classic-leaning twang.', array['country','americana']::text[], 'https://en.wikipedia.org/wiki/Case_Oats'),
  ('Cat Power', 'Cat Power', 'cat-power', 'person', '35qUXFIuUScihB4jOHW0Kk', 'Chan Marshall''s revered indie project, spanning smoky soul, spare folk and reinventions of classic songbooks over three decades.', array['indie-rock','folk','soul']::text[], 'https://en.wikipedia.org/wiki/Cat_Power'),
  ('Clover County', 'Clover County', 'clover-county', 'group', '1vOabSI7N1elDhNGoirgU2', 'A roots and country band delivering easy, harmony-rich Americana.', array['country','americana']::text[], null),
  ('CMAT', 'CMAT', 'cmat', 'group', null, 'Irish pop sensation Ciara Mary-Alice Thompson, delivering witty, theatrical country-pop with huge hooks and bigger personality.', array['country-pop','pop']::text[], 'https://en.wikipedia.org/wiki/CMAT_%28singer%29'),
  ('Community Chapstick', 'Community Chapstick', 'community-chapstick', 'person', null, 'A collaborative Foundation Stage set from the festival''s community and education programming.', array['folk','americana']::text[], null),
  ('Courtney Barnett', 'Courtney Barnett', 'courtney-barnett', 'person', '4OOlG5eBXSkSAAEeKjJb5Y', 'Australian singer-songwriter celebrated for deadpan, stream-of-consciousness lyrics and loose garage-rock guitar. A festival favorite since her breakout ''Sometimes I Sit and Think...''', array['indie-rock','garage-rock']::text[], 'https://en.wikipedia.org/wiki/Courtney_Barnett'),
  ('Courtney Marie Andrews', 'Courtney Marie Andrews', 'courtney-marie-andrews', 'person', '1EI0B66miJj5Fl408B7E9H', 'Arizona-born songwriter with a crystalline voice and country-folk songs about longing and the American West. A Grammy-nominated storyteller.', array['country','folk','americana']::text[], 'https://en.wikipedia.org/wiki/Courtney_Marie_Andrews'),
  ('Dawes', 'Dawes', 'dawes', 'group', null, 'Los Angeles band led by brothers Taylor and Griffin Goldsmith, torchbearers of Laurel Canyon folk-rock with sharp songwriting; performing here as a duo.', array['folk-rock','americana']::text[], 'https://en.wikipedia.org/wiki/Dawes_%28band%29'),
  ('Deer Tick', 'Deer Tick', 'deer-tick', 'group', null, 'Providence, RI''s beloved ragged rock-and-roots band led by John McCauley; a Newport staple whose ''and Friends'' sets are famous for guest-packed chaos.', array['rock','americana','folk-rock']::text[], 'https://en.wikipedia.org/wiki/Deer_Tick_%28band%29'),
  ('Dove Ellis', 'Dove Ellis', 'dove-ellis', 'person', '6tGT6SMlubqjTWDxBhSgg9', 'An emerging songwriter bringing soulful folk to the Quad Stage.', array['folk','soul','singer-songwriter']::text[], 'https://en.wikipedia.org/wiki/Dove_Ellis'),
  ('Evan Honer', 'Evan Honer', 'evan-honer', 'person', null, 'Arizona-raised songwriter blending modern country and folk, who built a big audience online before hitting festival stages.', array['country','folk']::text[], 'https://en.wikipedia.org/wiki/Evan_Honer'),
  ('For Pete''s Sake', 'For Pete''s Sake', 'for-petes-sake', 'group', null, 'A morning Foundation Stage gathering in the spirit of Pete Seeger — communal singing and songs led by a rotating host.', array['folk','traditional']::text[], null),
  ('Fruit Bats', 'Fruit Bats', 'fruit-bats', 'person', null, 'Eric D. Johnson''s long-running indie-folk project, trading in bright melodies, warm keyboards and road-worn Americana. Also a member of Bonny Light Horseman.', array['indie-folk','folk-rock']::text[], 'https://en.wikipedia.org/wiki/Fruit_Bats_%28band%29'),
  ('Gillian Welch & David Rawlings', 'Gillian Welch & David Rawlings', 'gillian-welch-david-rawlings', 'group', '2H5elA2mJKrHmqkN9GSfkz', 'The revered Americana duo of Gillian Welch and David Rawlings, masters of spare Appalachian harmony, here reinterpreting the Grateful Dead''s acoustic songbook.', array['americana','folk','old-time']::text[], 'https://en.wikipedia.org/wiki/Gillian_Welch'),
  ('Gwenifer Raymond', 'Gwenifer Raymond', 'gwenifer-raymond', 'person', null, 'Welsh guitarist and banjoist working in the American Primitive tradition, spinning intense, virtuosic solo instrumentals.', array['american-primitive','folk','instrumental']::text[], 'https://en.wikipedia.org/wiki/Gwenifer_Raymond'),
  ('Haley Heynderickx & Max García Conover', 'Haley Heynderickx & Max García Conover', 'heynderickx-garcia-conover', 'group', '73MDShZzdL4vUGMkmXOG6X', 'Portland songwriter Haley Heynderickx and Maine folk artist Max García Conover, whose collaborative record trades intimate, intertwined guitar and voice.', array['indie-folk','folk']::text[], 'https://en.wikipedia.org/wiki/Haley_Heynderickx'),
  ('Hayley Williams', 'Hayley Williams', 'hayley-williams', 'person', '6Rx1JKzBrSzoKQtmbVmBnM', 'Frontwoman of Paramore and acclaimed solo artist, bringing pop-punk energy and confessional pop songwriting. Her Newport ''and Friends'' set promises collaborations.', array['pop-rock','alternative']::text[], 'https://en.wikipedia.org/wiki/Hayley_Williams'),
  ('Honest Charlie', 'Honest Charlie', 'honest-charlie', 'person', '2a3JMqry8I41WmLHEuYbMi', 'A roots and folk artist bringing warm, unhurried songs to open the Fort Stage.', array['folk','americana']::text[], null),
  ('Hot Tuna', 'Hot Tuna', 'hot-tuna', 'group', '5tOrTQaBRD5yPHqbEwsRn7', 'The long-running blues and roots duo/band of Jorma Kaukonen and Jack Casady, founding members of Jefferson Airplane, playing electric and acoustic Americana since 1969.', array['blues','folk-rock','americana']::text[], 'https://en.wikipedia.org/wiki/Hot_Tuna'),
  ('Hudson Freeman', 'Hudson Freeman', 'hudson-freeman', 'person', '6k3W2iGuRZrhUnfVZOMQo8', 'A young singer-songwriter and Newport mentee, part of the festival''s education programming, with earnest acoustic songs.', array['folk','singer-songwriter']::text[], null),
  ('Infinity Song', 'Infinity Song', 'infinity-song', 'group', '2PZThLYBW7XtcYVzQms8oM', 'New York soft-rock band of siblings Abraham, Angel, Israel and Momo Boyd, signed to Roc Nation, known for shimmering harmonies and a viral hit in ''Hater''s Anthem.''', array['soft-rock','soul','folk']::text[], 'https://en.wikipedia.org/wiki/Infinity_Song'),
  ('Jackie Evans', 'Jackie Evans', 'jackie-evans', 'person', '3hr95JCfCIlFRK9EmDFJ3R', 'An emerging songwriter featured in the festival''s Foundation Stage programming.', array['folk','singer-songwriter']::text[], null),
  ('John R. Miller', 'John R. Miller', 'john-r-miller', 'person', null, 'West Virginia songwriter and guitarist writing weathered, detail-rich country and folk in a classic honky-tonk tradition.', array['country','folk','americana']::text[], 'https://en.wikipedia.org/wiki/John_R._Miller_%28musician%29'),
  ('Jonathan Bernstein', 'Jonathan Bernstein', 'jonathan-bernstein', 'person', null, 'A songwriter featured on the Foundation Stage.', array['folk','singer-songwriter']::text[], null),
  ('Jordan Klepper', 'Jordan Klepper', 'jordan-klepper', 'person', null, 'Comedian and ''The Daily Show'' correspondent, bringing a talk-and-comedy set to the Foundation Stage.', array['comedy','spoken-word']::text[], 'https://en.wikipedia.org/wiki/Jordan_Klepper'),
  ('Kathleen Edwards', 'Kathleen Edwards', 'kathleen-edwards', 'person', '7x4So74vIUx3DaLk93JCFf', 'Canadian alt-country songwriter known for sharp, emotionally direct songs and a return to music after stepping away to run a coffee shop.', array['alt-country','americana','folk-rock']::text[], 'https://en.wikipedia.org/wiki/Kathleen_Edwards'),
  ('Kirby', 'Kirby', 'kirby', 'person', '5lcDGoJUr5WY5bCFAfYbCU', 'A soul and R&B singer-songwriter (and acclaimed hitmaker) with a rich, classic voice.', array['soul','r-and-b']::text[], 'https://en.wikipedia.org/wiki/Kirby_%28singer%29'),
  ('Leif Vollebekk', 'Leif Vollebekk', 'leif-vollebekk', 'person', null, 'Montreal songwriter crafting hushed, soulful piano-and-guitar folk with a jazz-inflected sense of space and groove.', array['folk','singer-songwriter']::text[], 'https://en.wikipedia.org/wiki/Leif_Vollebekk'),
  ('Lily Fitts', 'Lily Fitts', 'lily-fitts', 'person', '1mY66135CEOJg0KTwDIk4N', 'A young songwriter and emerging talent playing a short Bike Stage set.', array['folk','singer-songwriter']::text[], null),
  ('Lizzy McAlpine', 'Lizzy McAlpine', 'lizzy-mcalpine', 'person', '1GmsPCcpKgF9OhlNXjOsbS', 'Philadelphia singer-songwriter whose intimate, jazz-tinged folk-pop and the hit ''ceilings'' made her a streaming and touring phenomenon.', array['indie-folk','folk-pop']::text[], 'https://en.wikipedia.org/wiki/Lizzy_McAlpine'),
  ('Lucy Dacus', 'Lucy Dacus', 'lucy-dacus', 'person', '07D1Bjaof0NFlU32KXiqUP', 'Virginia-raised indie-rock songwriter and boygenius member known for literate, slow-burning songs and a warm alto. Her 2025 album ''Forever Is a Feeling'' widened her sound toward lush chamber-pop.', array['indie-rock','singer-songwriter']::text[], 'https://en.wikipedia.org/wiki/Lucy_Dacus'),
  ('Madi Diaz', 'Madi Diaz', 'madi-diaz', 'person', '7E1o9IcnpiFQDlAUk2H7Az', 'Nashville songwriter whose unflinching heartbreak songs and clear voice earned acclaim and high-profile touring with Harry Styles.', array['indie-folk','singer-songwriter']::text[], 'https://en.wikipedia.org/wiki/Madi_Diaz'),
  ('Mark Cutler', 'Mark Cutler', 'mark-cutler', 'person', '6bYy84wHed9xrSUnJT2agJ', 'A pillar of the Rhode Island music scene, singer-songwriter Mark Cutler brings decades of local roots-rock craft.', array['rock','americana','folk-rock']::text[], 'https://en.wikipedia.org/wiki/Mark_Cutler'),
  ('Matt Quinn', 'Matt Quinn', 'matt-quinn', 'person', null, 'A songwriter delivering easygoing, melodic folk-rock on the Harbor Stage.', array['folk-rock','singer-songwriter']::text[], 'https://en.wikipedia.org/wiki/Mt._Joy_(band)'),
  ('Medium Build', 'Medium Build', 'medium-build', 'person', null, 'Alaska-raised, Atlanta-based Nick Carpenter''s indie-rock project, mixing raw confessional lyrics with big, textured production.', array['indie-rock','indie-folk']::text[], 'https://en.wikipedia.org/wiki/Medium_Build'),
  ('MET Lab Students', 'MET Lab Students', 'met-lab-students', 'group', null, 'Young musicians from the Newport Festivals Foundation''s education programming, performing with mentor Hudson Freeman.', array['folk','varied']::text[], null),
  ('Michael Shannon & Jason Narducy and Friends Play R.E.M.', 'Michael Shannon & Jason Narducy and Friends Play R.E.M.', 'shannon-narducy-rem', 'group', '4KWTAlx2RvbpseOGMEmROg', 'Actor Michael Shannon and musician Jason Narducy lead a rotating band performing R.E.M. albums in full — a joyful, faithful tribute.', array['rock','alternative','tribute']::text[], 'https://en.wikipedia.org/wiki/R.E.M.'),
  ('Morgan Nagler', 'Morgan Nagler', 'morgan-nagler', 'person', '6mT5D1CUrWTMXngtqazglr', 'Songwriter and frontperson of Whispertown, writing candid, melodic indie-folk.', array['indie-folk','singer-songwriter']::text[], null),
  ('Ms. Lauryn Hill', 'Ms. Lauryn Hill', 'ms-lauryn-hill', 'person', '2Mu5NfyYm8n5iTomuKAEHl', 'Grammy-winning icon whose ''The Miseducation of Lauryn Hill'' reshaped hip-hop and soul. A rare festival appearance from one of music''s defining voices.', array['hip-hop','soul','r-and-b']::text[], 'https://en.wikipedia.org/wiki/Lauryn_Hill'),
  ('Music Lab Students', 'Music Lab Students', 'music-lab-students', 'group', null, 'Students from the festival''s music-education Lab take the Foundation Stage with mentor Taylor Goldsmith of Dawes.', array['folk','varied']::text[], null),
  ('Nabeel', 'Nabeel', 'nabeel', 'person', null, 'An emerging singer-songwriter closing out the Bike Stage lineup.', array['folk','singer-songwriter','pop']::text[], 'https://en.wikipedia.org/wiki/Nabeel_(%D9%86%D8%A8%D9%8A%D9%84)'),
  ('Nathaniel Rateliff', 'Nathaniel Rateliff', 'nathaniel-rateliff', 'person', '02seUFsFQP7TH4hLrTj77o', 'Denver soul-rock singer, with and without The Night Sweats, whose gravelly voice powers barn-burners like ''S.O.B.'' and tender solo balladry.', array['soul','rock','americana']::text[], 'https://en.wikipedia.org/wiki/Nathaniel_Rateliff'),
  ('Open Mic', 'Open Mic', 'open-mic', 'person', null, 'The Bike Stage''s daily open-mic slot, giving festivalgoers and up-and-comers a chance to play a few songs to start the day.', array['folk','varied']::text[], null),
  ('Peter Rowan / Sam Grisman / Sierra Hull / Larry Campbell & Teresa Williams', 'Peter Rowan / Sam Grisman / Sierra Hull / Larry Campbell & Teresa Williams', 'rowan-grisman-hull-campbell-williams', 'group', '6zkQCtFCqgSUUVgyotaKSg', 'A bluegrass and roots summit uniting Peter Rowan, Sam Grisman, mandolin virtuoso Sierra Hull, and the duo Larry Campbell & Teresa Williams.', array['bluegrass','folk','americana']::text[], 'https://en.wikipedia.org/wiki/Peter_Rowan'),
  ('Princess June', 'Princess June', 'princess-june', 'person', '02SHygIyTuHfTUkpD1u6FJ', 'An up-and-coming act opening the Fort Stage with bright, melodic songs.', array['indie-folk','pop']::text[], null),
  ('Punch Brothers', 'Punch Brothers', 'punch-brothers', 'group', '4gFssfOmWNY3LfIZ3zyoy4', 'Genre-bending acoustic quintet led by mandolinist Chris Thile, pushing bluegrass into classical, jazz and pop with dazzling interplay.', array['bluegrass','progressive-bluegrass']::text[], 'https://en.wikipedia.org/wiki/Punch_Brothers'),
  ('Ryan Davis & The Roadhouse Band', 'Ryan Davis & The Roadhouse Band', 'ryan-davis-roadhouse-band', 'group', '7Ah0xZVyWfAL3Vd7OVvKuo', 'Louisville songwriter Ryan Davis (State Champion) leading sprawling, wry, guitar-driven country-rock epics.', array['alt-country','indie-rock']::text[], 'https://en.wikipedia.org/wiki/Ryan_Davis_%26_the_Roadhouse_Band'),
  ('Sally Rose', 'Sally Rose', 'sally-rose', 'person', null, 'A songwriter bringing heartfelt Americana to the Bike Stage.', array['americana','folk','country']::text[], null),
  ('Sea to Shining Sea', 'Sea to Shining Sea', 'sea-to-shining-sea', 'group', null, 'A Newport special set gathering artists for a collaborative journey through American song — the kind of one-off the festival is known for.', array['folk','americana']::text[], null),
  ('Searows', 'Searows', 'searows', 'person', null, 'Alec Duckart''s project, hushed and devastating indie-folk built on fingerpicked guitar and whispered, diaristic lyrics.', array['indie-folk','singer-songwriter']::text[], 'https://en.wikipedia.org/wiki/Searows'),
  ('Snacktime', 'Snacktime', 'snacktime', 'group', '4WdKwazXyV5Hc2YtWc2IDr', 'A Philadelphia brass-and-groove collective known for joyful, danceable street-band energy.', array['funk','brass','soul']::text[], 'https://en.wikipedia.org/wiki/Snacktime_(band)'),
  ('Stephen Covell', 'Stephen Covell', 'stephen-covell', 'person', null, 'A veteran and songwriter performing through Operation Encore, the program supporting military-veteran musicians.', array['folk','singer-songwriter','americana']::text[], null),
  ('Strongboi', 'Strongboi', 'strongboi', 'group', null, 'An indie-pop duo with playful, hook-forward songs and a quirky charm.', array['indie-pop','pop']::text[], null),
  ('Taylor Hollingsworth', 'Taylor Hollingsworth', 'taylor-hollingsworth', 'person', null, 'Alabama guitarist and songwriter (a Conor Oberst collaborator) with scrappy, garage-leaning country-rock.', array['country-rock','garage-rock']::text[], null),
  ('Father John Misty', 'Father John Misty', 'father-john-misty', 'person', '2kGBy2WHvF0VdZyqiVCkDT', 'The satirical, orchestral-folk project of Josh Tillman (former Fleet Foxes drummer), whose grand, wry songwriting runs from Fear Fun and I Love You, Honeybear through 2024''s Mahashmashana.', array['indie-folk','folk-rock','chamber-pop']::text[], 'https://en.wikipedia.org/wiki/Father_John_Misty'),
  ('The Barr Brothers', 'The Barr Brothers', 'the-barr-brothers', 'group', '4OyRutd80DZC22C4pl63l7', 'Montreal band led by Brad and Andrew Barr, blending fingerstyle folk, blues and harp-driven chamber textures into atmospheric rock.', array['folk-rock','indie-folk']::text[], 'https://en.wikipedia.org/wiki/The_Barr_Brothers'),
  ('The Fearless Flyers', 'The Fearless Flyers', 'the-fearless-flyers', 'group', null, 'Instrumental funk supergroup from the Vulf family — Cory Wong, Joe Dart, Mark Lettieri and Nate Smith — locked into irresistible grooves.', array['funk','instrumental']::text[], 'https://en.wikipedia.org/wiki/The_Fearless_Flyers'),
  ('The Lumineers', 'The Lumineers', 'the-lumineers', 'group', '16oZKvXb6WkQlVAjwo2Wbg', 'Denver folk-rock band behind stadium-sized singalongs like ''Ho Hey'' and ''Ophelia,'' blending stomping acoustic anthems with intimate storytelling.', array['folk-rock','americana']::text[], 'https://en.wikipedia.org/wiki/The_Lumineers'),
  ('The Olllam', 'The Olllam', 'the-olllam', 'group', null, 'Transatlantic collective co-founded by uilleann piper John McSherry and multi-instrumentalist Tyler Duncan, weaving trance-like Celtic melodies with jazz and funk.', array['celtic','folk','instrumental']::text[], 'https://en.wikipedia.org/wiki/The_Olllam'),
  ('This Is Lorelei', 'This Is Lorelei', 'this-is-lorelei', 'person', null, 'The solo project of Nate Amos (Water From Your Eyes), swerving from lo-fi bedroom pop to warped country on the acclaimed ''Box for Buddy, Box for Star.''', array['indie-rock','bedroom-pop','alt-country']::text[], 'https://en.wikipedia.org/wiki/This_Is_Lorelei'),
  ('Tim Bernardes', 'Tim Bernardes', 'tim-bernardes', 'person', null, 'Brazilian songwriter and O Terno frontman crafting gorgeous, orchestral MPB folk with a delicate falsetto; a Fleet Foxes and Devendra Banhart collaborator.', array['mpb','folk','indie-folk']::text[], 'https://en.wikipedia.org/wiki/Tim_Bernardes'),
  ('Tiny Habits', 'Tiny Habits', 'tiny-habits', 'group', null, 'A Boston-formed trio built on tight three-part harmony and gentle acoustic arrangements, who grew a following from viral cover videos into original indie-folk.', array['indie-folk','folk']::text[], 'https://en.wikipedia.org/wiki/Tiny_Habits'),
  ('Tom Morello', 'Tom Morello', 'tom-morello', 'person', '74NBPbyyftqJ4SpDZ4c1Ed', 'Rage Against the Machine and Audioslave guitarist and activist, reinventing protest music through electrified riffs and, increasingly, acoustic folk.', array['rock','folk']::text[], 'https://en.wikipedia.org/wiki/Tom_Morello'),
  ('Trousdale', 'Trousdale', 'trousdale', 'group', null, 'Los Angeles trio prized for airtight harmonies and folk-pop songwriting, built from years of singing together.', array['folk-pop','pop']::text[], 'https://en.wikipedia.org/wiki/Trousdale_%28band%29'),
  ('Victoria Canal', 'Victoria Canal', 'victoria-canal', 'person', null, 'Spanish-American singer-songwriter and Ivor Novello winner writing soulful, piano-driven pop with candid lyricism about identity and disability.', array['pop','soul','singer-songwriter']::text[], 'https://en.wikipedia.org/wiki/Victoria_Canal'),
  ('Vulfpeck', 'Vulfpeck', 'vulfpeck', 'group', '7pXu47GoqSYRajmBCjxdD6', 'Ann Arbor funk band famous for pocket grooves, minimalist production and joyful live shows that turned a studio project into arena-fillers.', array['funk','soul']::text[], 'https://en.wikipedia.org/wiki/Vulfpeck'),
  ('Wednesday', 'Wednesday', 'wednesday', 'group', '4j7DrazfBZLLD0OrVoAtEe', 'Asheville, NC band fusing shoegaze, alt-country and 90s indie into loud, lap-steel-soaked rock. Fronted by songwriter Karly Hartzman.', array['indie-rock','shoegaze','alt-country']::text[], 'https://en.wikipedia.org/wiki/Wednesday_%28band%29'),
  ('Yasmin Williams & William Tyler', 'Yasmin Williams & William Tyler', 'williams-tyler', 'group', null, 'A meeting of two of instrumental guitar''s most inventive voices — Yasmin Williams'' percussive, lap-tapped playing and William Tyler''s cinematic fingerstyle.', array['instrumental','folk','american-primitive']::text[], 'https://en.wikipedia.org/wiki/Yasmin_Williams')
on conflict (slug) do update set
  name = excluded.name, artist_type = excluded.artist_type,
  bio = excluded.bio, genres = excluded.genres,
  spotify_id = coalesce(excluded.spotify_id, artists.spotify_id),
  official_url = coalesce(excluded.official_url, artists.official_url);

-- Link 2026 festival sets to their artist via slug (set slug = 'YYYY-MM-DD-<artistSlug>')
update sets s set billed_artist_id = a.id
from events e, editions ed, artists a
where s.event_id = e.id and e.edition_id = ed.id and ed.year = 2026
  and e.kind = 'main_stage_day'
  and a.slug = regexp_replace(s.slug, '^[0-9]{4}-[0-9]{2}-[0-9]{2}-', '');

insert into performances (set_id, artist_id, role)
select s.id, s.billed_artist_id, 'billed'
from sets s
join events e on e.id = s.event_id and e.kind = 'main_stage_day'
join editions ed on ed.id = e.edition_id and ed.year = 2026
where s.billed_artist_id is not null
on conflict (set_id, artist_id, role) do nothing;

commit;
-- Chunk 2: reset historical editions, insert editions + events
begin;

delete from editions where year <> 2026;

insert into editions (year, name, is_cancelled) values
  (1959, 'Newport Folk Festival 1959', false),
  (1960, 'Newport Folk Festival 1960', false),
  (1963, 'Newport Folk Festival 1963', false),
  (1964, 'Newport Folk Festival 1964', false),
  (1965, 'Newport Folk Festival 1965', false),
  (1966, 'Newport Folk Festival 1966', false),
  (1967, 'Newport Folk Festival 1967', false),
  (1968, 'Newport Folk Festival 1968', false),
  (1969, 'Newport Folk Festival 1969', false),
  (1985, 'Newport Folk Festival 1985', false),
  (1986, 'Newport Folk Festival 1986', false),
  (1987, 'Newport Folk Festival 1987', false),
  (1988, 'Newport Folk Festival 1988', false),
  (1989, 'Newport Folk Festival 1989', false),
  (1990, 'Newport Folk Festival 1990', false),
  (1991, 'Newport Folk Festival 1991', false),
  (1992, 'Newport Folk Festival 1992', false),
  (1993, 'Newport Folk Festival 1993', false),
  (1994, 'Newport Folk Festival 1994', false),
  (1995, 'Newport Folk Festival 1995', false),
  (1996, 'Newport Folk Festival 1996', false),
  (1997, 'Newport Folk Festival 1997', false),
  (1998, 'Newport Folk Festival 1998', false),
  (1999, 'Newport Folk Festival 1999', false),
  (2000, 'Newport Folk Festival 2000', false),
  (2001, 'Newport Folk Festival 2001', false),
  (2002, 'Newport Folk Festival 2002', false),
  (2003, 'Newport Folk Festival 2003', false),
  (2004, 'Newport Folk Festival 2004', false),
  (2005, 'Newport Folk Festival 2005', false),
  (2006, 'Newport Folk Festival 2006', false),
  (2007, 'Newport Folk Festival 2007', false),
  (2008, 'Newport Folk Festival 2008', false),
  (2009, 'Newport Folk Festival 2009', false),
  (2010, 'Newport Folk Festival 2010', false),
  (2011, 'Newport Folk Festival 2011', false),
  (2012, 'Newport Folk Festival 2012', false),
  (2013, 'Newport Folk Festival 2013', false),
  (2014, 'Newport Folk Festival 2014', false),
  (2015, 'Newport Folk Festival 2015', false),
  (2016, 'Newport Folk Festival 2016', false),
  (2017, 'Newport Folk Festival 2017', false),
  (2018, 'Newport Folk Festival 2018', false),
  (2019, 'Newport Folk Festival 2019', false),
  (2020, 'Newport Folk Festival 2020', true),
  (2021, 'Newport Folk Festival 2021', false),
  (2022, 'Newport Folk Festival 2022', false),
  (2023, 'Newport Folk Festival 2023', false),
  (2024, 'Newport Folk Festival 2024', false),
  (2025, 'Newport Folk Festival 2025', false)
on conflict (year) do update set name = excluded.name, is_cancelled = excluded.is_cancelled;

insert into events (edition_id, kind, name, date, is_official, notes)
select ed.id, 'main_stage_day', 'Historical lineup', make_date(ed.year, 7, 25), true,
  'Historical lineup imported from newport-history.json; day/stage/time not modeled at set level.'
from editions ed where ed.year <> 2026 and not ed.is_cancelled;

commit;
-- Historical sets+performances for the 1950s
begin;

-- 1959
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Leon Bibb', 'leon-bibb', 'standard', false, null),
  ('Oscar Brand', 'oscar-brand', 'standard', false, null),
  ('Hylo Brown and the Timberliners with Earl Scruggs', 'hylo-brown-and-the-timberliners-with-earl-scruggs', 'standard', false, null),
  ('Barbara Dane', 'barbara-dane', 'standard', false, null),
  ('Reverend Gary Davis', 'reverend-gary-davis', 'standard', false, null),
  ('Bo Diddley', 'bo-diddley', 'standard', false, null),
  ('Bob Gibson with Joan Baez', 'bob-gibson-with-joan-baez', 'standard', false, null),
  ('Cynthia Gooding', 'cynthia-gooding', 'standard', false, null),
  ('The Kingston Trio', 'kingston-trio', 'standard', false, null),
  ('Tommy Makem', 'tommy-makem', 'standard', false, null),
  ('Ed McCurdy', 'ed-mccurdy', 'standard', false, null),
  ('Brownie McGhee and Sonny Terry', 'brownie-mcghee-and-sonny-terry', 'standard', false, null),
  ('The New Lost City Ramblers', 'new-lost-city-ramblers', 'standard', false, null),
  ('John Jacob Niles', 'john-jacob-niles', 'standard', false, null),
  ('Odetta', 'odetta', 'standard', false, null),
  ('Martha Schlamme', 'martha-schlamme', 'standard', false, null),
  ('Jean Ritchie', 'jean-ritchie', 'standard', false, null),
  ('The Stanley Brothers with the Clinch Mountain Boys', 'stanley-brothers-with-the-clinch-mountain-boys', 'standard', false, null),
  ('Pete Seeger', 'pete-seeger', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 1959
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

commit;
-- Historical sets+performances for the 1960s
begin;

-- 1960
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Theodore Bikel', 'theodore-bikel', 'standard', false, null),
  ('Jean Carignan', 'jean-carignan', 'standard', false, null),
  ('Jimmy Driftwood', 'jimmy-driftwood', 'standard', false, null),
  ('Lester Flatt and Earl Scruggs with the Foggy Mountain Boys', 'lester-flatt-and-earl-scruggs-with-the-foggy-mountain-boys', 'standard', false, null),
  ('Bob Gibson', 'bob-gibson', 'standard', false, null),
  ('John Lee Hooker', 'john-lee-hooker', 'standard', false, null),
  ('Cisco Houston', 'cisco-houston', 'standard', false, null),
  ('Bill Lee', 'bill-lee', 'standard', false, null),
  ('Ewan MacColl', 'ewan-maccoll', 'standard', false, null),
  ('Tommy Makem', 'tommy-makem', 'standard', false, null),
  ('Ed McCurdy', 'ed-mccurdy', 'standard', false, null),
  ('Alan Mills', 'alan-mills', 'standard', false, null),
  ('The New Lost City Ramblers', 'new-lost-city-ramblers', 'standard', false, null),
  ('Peggy Seeger', 'peggy-seeger', 'standard', false, null),
  ('Pete Seeger', 'pete-seeger', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 1960
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 1963
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Clarence Ashley', 'clarence-ashley', 'standard', false, null),
  ('Joan Baez', 'joan-baez', 'standard', false, null),
  ('Judy Collins', 'judy-collins', 'standard', false, null),
  ('Reverend Gary Davis', 'reverend-gary-davis', 'standard', false, null),
  ('Bob Dylan', 'bob-dylan', 'standard', false, null),
  ('Ramblin'' Jack Elliott', 'ramblin-jack-elliott', 'standard', false, null),
  ('Freedom Singers', 'freedom-singers', 'standard', false, null),
  ('John Hammond', 'john-hammond', 'standard', false, null),
  ('John Lee Hooker', 'john-lee-hooker', 'standard', false, null),
  ('Mississippi John Hurt', 'mississippi-john-hurt', 'standard', false, null),
  ('Jim & Jesse and the Virginia Boys', 'jim-and-jesse-and-the-virginia-boys', 'standard', false, null),
  ('Bill Monroe', 'bill-monroe', 'standard', false, null),
  ('Peter, Paul & Mary', 'peter-paul-and-mary', 'standard', false, null),
  ('Pete Seeger', 'pete-seeger', 'standard', false, null),
  ('Brownie McGhee and Sonny Terry', 'brownie-mcghee-and-sonny-terry', 'standard', false, null),
  ('Dave Van Ronk', 'dave-van-ronk', 'standard', false, null),
  ('Doc Watson', 'doc-watson', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 1963
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 1964
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Theodore Bikel', 'theodore-bikel', 'standard', false, null),
  ('Joan Baez', 'joan-baez', 'standard', false, null),
  ('Johnny Cash', 'johnny-cash', 'standard', false, null),
  ('Judy Collins', 'judy-collins', 'standard', false, null),
  ('Bob Dylan', 'bob-dylan', 'standard', false, null),
  ('José Feliciano', 'jose-feliciano', 'standard', false, null),
  ('Jesse Fuller', 'jesse-fuller', 'standard', false, null),
  ('Phil Ochs', 'phil-ochs', 'standard', false, null),
  ('Peter, Paul & Mary', 'peter-paul-and-mary', 'standard', false, null),
  ('Pete Seeger', 'pete-seeger', 'standard', false, null),
  ('The Stanley Brothers', 'stanley-brothers', 'standard', false, null),
  ('The Staple Singers', 'staple-singers', 'standard', false, null),
  ('Robert Pete Williams', 'robert-pete-williams', 'standard', false, null),
  ('Hedy West', 'hedy-west', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 1964
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 1965
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Joan Baez with Donovan', 'joan-baez-with-donovan', 'standard', false, null),
  ('Oscar Brand', 'oscar-brand', 'standard', false, null),
  ('The Paul Butterfield Blues Band', 'paul-butterfield-blues-band', 'standard', false, null),
  ('Hamilton Camp', 'hamilton-camp', 'standard', false, null),
  ('Maybelle Carter', 'maybelle-carter', 'standard', false, null),
  ('The Chambers Brothers', 'chambers-brothers', 'standard', false, null),
  ('Reverend Gary Davis', 'reverend-gary-davis', 'standard', false, null),
  ('Bob Dylan', 'bob-dylan', 'standard', false, null),
  ('Richard and Mimi Fariña', 'richard-and-mimi-farina', 'standard', false, null),
  ('Kathy and Carol', 'kathy-and-carol', 'standard', false, null),
  ('Lightnin'' Hopkins', 'lightnin-hopkins', 'standard', false, null),
  ('Son House', 'son-house', 'standard', false, null),
  ('Ian & Sylvia', 'ian-and-sylvia', 'standard', false, null),
  ('Gordon Lightfoot', 'gordon-lightfoot', 'standard', false, null),
  ('Memphis Slim and Willie Dixon', 'memphis-slim-and-willie-dixon', 'standard', false, null),
  ('Bill Monroe and the Blue Grass Boys', 'bill-monroe-and-the-blue-grass-boys', 'standard', false, null),
  ('The New Lost City Ramblers', 'new-lost-city-ramblers', 'standard', false, null),
  ('Peter, Paul & Mary', 'peter-paul-and-mary', 'standard', false, null),
  ('Jean Ritchie', 'jean-ritchie', 'standard', false, null),
  ('Pete Seeger', 'pete-seeger', 'standard', false, null),
  ('Don Stover and The Lilly Brothers', 'don-stover-and-the-lilly-brothers', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 1965
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 1966
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Dorothy Love Coates & The Original Gospel Harmonettes', 'dorothy-love-coates-and-the-original-gospel-harmonettes', 'standard', false, null),
  ('Judy Collins', 'judy-collins', 'standard', false, null),
  ('Hazel Dickens and Alice Gerrard', 'hazel-dickens-and-alice-gerrard', 'standard', false, null),
  ('Tim Hardin', 'tim-hardin', 'standard', false, null),
  ('Dixie Hummingbirds', 'dixie-hummingbirds', 'standard', false, null),
  ('Ramblin'' Jack Elliott', 'ramblin-jack-elliott', 'standard', false, null),
  ('Skip James', 'skip-james', 'standard', false, null),
  ('Jim & Jessie and the Virginia Boys', 'jim-and-jessie-and-the-virginia-boys', 'standard', false, null),
  ('Lester Flatt and Earl Scruggs and the Foggy Mountain Boys', 'lester-flatt-and-earl-scruggs-and-the-foggy-mountain-boys', 'standard', false, null),
  ('Mitch Greenhill and Jeff Gutcheon', 'mitch-greenhill-and-jeff-gutcheon', 'standard', false, null),
  ('Jim Kweskin Jug Band with Geoff Muldaur', 'jim-kweskin-jug-band-with-geoff-muldaur', 'standard', false, null),
  ('Long Gone Niles', 'long-gone-niles', 'standard', false, null),
  ('Richie Havens', 'richie-havens', 'standard', false, null),
  ('Son House', 'son-house', 'standard', false, null),
  ('Howlin'' Wolf', 'howlin-wolf', 'standard', false, null),
  ('Ali Akbar Khan', 'ali-akbar-khan', 'standard', false, null),
  ('The Lovin'' Spoonful', 'lovin-spoonful', 'standard', false, null),
  ('Phil Ochs', 'phil-ochs', 'standard', false, null),
  ('Tom Paxton', 'tom-paxton', 'standard', false, null),
  ('Preservation Hall Jazz Band with Billie and De De Pierce', 'preservation-hall-jazz-band-with-billie-and-de-de-pierce', 'standard', false, null),
  ('Buffy Sainte-Marie', 'buffy-sainte-marie', 'standard', false, null),
  ('Pete Seeger', 'pete-seeger', 'standard', false, null),
  ('Joseph Spence', 'joseph-spence', 'standard', false, null),
  ('The Swan Silvertones with Claude Jeter', 'swan-silvertones-with-claude-jeter', 'standard', false, null),
  ('Yomo Toro', 'yomo-toro', 'standard', false, null),
  ('Bukka White', 'bukka-white', 'standard', false, null),
  ('Ed Young and the Southern Fife and Drum Corps', 'ed-young-and-the-southern-fife-and-drum-corps', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 1966
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 1967
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Joan Baez', 'joan-baez', 'standard', false, null),
  ('Theodore Bikel', 'theodore-bikel', 'standard', false, null),
  ('Maybelle Carter', 'maybelle-carter', 'standard', false, null),
  ('The Chambers Brothers', 'chambers-brothers', 'standard', false, null),
  ('Leonard Cohen', 'leonard-cohen', 'standard', false, null),
  ('Judy Collins', 'judy-collins', 'standard', false, null),
  ('Dave Dudley', 'dave-dudley', 'standard', false, null),
  ('Mimi Fariña', 'mimi-farina', 'standard', false, null),
  ('Arlo Guthrie', 'arlo-guthrie', 'standard', false, null),
  ('Janis Ian', 'janis-ian', 'standard', false, null),
  ('The Incredible String Band', 'incredible-string-band', 'standard', false, null),
  ('Grandpa Jones', 'grandpa-jones', 'standard', false, null),
  ('Gordon Lightfoot', 'gordon-lightfoot', 'standard', false, null),
  ('Joni Mitchell', 'joni-mitchell', 'standard', false, null),
  ('Jean Ritchie', 'jean-ritchie', 'standard', false, null),
  ('Buffy Sainte-Marie', 'buffy-sainte-marie', 'standard', false, null),
  ('The Staple Singers', 'staple-singers', 'standard', false, null),
  ('Sister Rosetta Tharpe', 'sister-rosetta-tharpe', 'standard', false, null),
  ('Merle Travis', 'merle-travis', 'standard', false, null),
  ('Muddy Waters', 'muddy-waters', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 1967
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 1968
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Roy Acuff', 'roy-acuff', 'standard', false, null),
  ('Joan Baez', 'joan-baez', 'standard', false, null),
  ('Big Brother and the Holding Company', 'big-brother-and-the-holding-company', 'standard', false, null),
  ('Theodore Bikel', 'theodore-bikel', 'standard', false, null),
  ('Bread and Puppet Theater', 'bread-and-puppet-theater', 'standard', false, null),
  ('Tim Buckley', 'tim-buckley', 'standard', false, null),
  ('Elizabeth Cotten', 'elizabeth-cotten', 'standard', false, null),
  ('Ramblin'' Jack Elliott', 'ramblin-jack-elliott', 'standard', false, null),
  ('Mimi Fariña', 'mimi-farina', 'standard', false, null),
  ('Arlo Guthrie', 'arlo-guthrie', 'standard', false, null),
  ('Buddy Guy and Junior Wells', 'buddy-guy-and-junior-wells', 'standard', false, null),
  ('George Hamilton IV', 'george-hamilton-iv', 'standard', false, null),
  ('John Hartford', 'john-hartford', 'standard', false, null),
  ('Richie Havens', 'richie-havens', 'standard', false, null),
  ('Joe Heaney', 'joe-heaney', 'standard', false, null),
  ('Janis Ian', 'janis-ian', 'standard', false, null),
  ('Buell Kazee', 'buell-kazee', 'standard', false, null),
  ('B.B. King', 'bb-king', 'standard', false, null),
  ('Frederick Douglass Kirkpatrick', 'frederick-douglass-kirkpatrick', 'standard', false, null),
  ('Jim Kweskin', 'jim-kweskin', 'standard', false, null),
  ('Taj Mahal', 'taj-mahal', 'standard', false, null),
  ('Fred McDowell', 'fred-mcdowell', 'standard', false, null),
  ('Jerry Merrick', 'jerry-merrick', 'standard', false, null),
  ('Joni Mitchell', 'joni-mitchell', 'standard', false, null),
  ('Pete Seeger', 'pete-seeger', 'standard', false, null),
  ('Eric Von Schmidt', 'eric-von-schmidt', 'standard', false, null),
  ('Doc Watson', 'doc-watson', 'standard', false, null),
  ('The Young Tradition', 'young-tradition', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 1968
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 1969
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Johnny Cash with June Carter and Kris Kristofferson', 'johnny-cash-with-june-carter-and-kris-kristofferson', 'standard', false, null),
  ('Ramblin'' Jack Elliott', 'ramblin-jack-elliott', 'standard', false, null),
  ('Sleepy John Estes', 'sleepy-john-estes', 'standard', false, null),
  ('The Everly Brothers', 'everly-brothers', 'standard', false, null),
  ('Jesse Fuller', 'jesse-fuller', 'standard', false, null),
  ('Arlo Guthrie', 'arlo-guthrie', 'standard', false, null),
  ('Son House', 'son-house', 'standard', false, null),
  ('Joni Mitchell', 'joni-mitchell', 'standard', false, null),
  ('Van Morrison', 'van-morrison', 'standard', false, null),
  ('Buddy Moss and Brownie McGhee', 'buddy-moss-and-brownie-mcghee', 'standard', false, null),
  ('Pentangle', 'pentangle', 'standard', false, null),
  ('Carl Perkins and The Tennessee Three', 'carl-perkins-and-the-tennessee-three', 'standard', false, null),
  ('Buffy Sainte-Marie', 'buffy-sainte-marie', 'standard', false, null),
  ('Pete Seeger', 'pete-seeger', 'standard', false, null),
  ('James Taylor', 'james-taylor', 'standard', false, null),
  ('Big Mama Thornton', 'big-mama-thornton', 'standard', false, null),
  ('Jerry Jeff Walker', 'jerry-jeff-walker', 'standard', false, null),
  ('Muddy Waters', 'muddy-waters', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 1969
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

commit;
-- Historical sets+performances for the 1980s
begin;

-- 1985
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Joan Baez', 'joan-baez', 'standard', false, null),
  ('Greg Brown', 'greg-brown', 'standard', false, null),
  ('Judy Collins', 'judy-collins', 'standard', false, null),
  ('Ramblin'' Jack Elliott', 'ramblin-jack-elliott', 'standard', false, null),
  ('Mimi Fariña', 'mimi-farina', 'standard', false, null),
  ('Arlo Guthrie', 'arlo-guthrie', 'standard', false, null),
  ('Bill Keith', 'bill-keith', 'standard', false, null),
  ('Taj Mahal', 'taj-mahal', 'standard', false, null),
  ('David Massengill', 'david-massengill', 'standard', false, null),
  ('David Mallett', 'david-mallett', 'standard', false, null),
  ('Bill Morrissey', 'bill-morrissey', 'standard', false, null),
  ('New Grass Revival', 'new-grass-revival', 'standard', false, null),
  ('Mark O''Connor', 'mark-oconnor', 'standard', false, null),
  ('Tom Paxton', 'tom-paxton', 'standard', false, null),
  ('Bonnie Raitt', 'bonnie-raitt', 'standard', false, null),
  ('Jim Rooney', 'jim-rooney', 'standard', false, null),
  ('Peter Rowan', 'peter-rowan', 'standard', false, null),
  ('Sweet Honey in the Rock', 'sweet-honey-in-the-rock', 'standard', false, null),
  ('Dave Van Ronk', 'dave-van-ronk', 'standard', false, null),
  ('Merle Watson', 'merle-watson', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 1985
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 1986
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('David Bromberg', 'david-bromberg', 'standard', false, null),
  ('The Chicken Chokers', 'chicken-chokers', 'standard', false, null),
  ('Nanci Griffith', 'nanci-griffith', 'standard', false, null),
  ('Richie Havens', 'richie-havens', 'standard', false, null),
  ('Hot Rize', 'hot-rize', 'standard', false, null),
  ('Si Kahn', 'si-kahn', 'standard', false, null),
  ('Alison Krauss', 'alison-krauss', 'standard', false, null),
  ('Patty Larkin', 'patty-larkin', 'standard', false, null),
  ('Christine Lavin', 'christine-lavin', 'standard', false, null),
  ('Kate & Anna McGarrigle', 'kate-and-anna-mcgarrigle', 'standard', false, null),
  ('Odetta', 'odetta', 'standard', false, null),
  ('Tom Rush', 'tom-rush', 'standard', false, null),
  ('Claudia Schmidt', 'claudia-schmidt', 'standard', false, null),
  ('Savoy-Doucet Band', 'savoy-doucet-band', 'standard', false, null),
  ('John Sebastian', 'john-sebastian', 'standard', false, null),
  ('Corky Siegel', 'corky-siegel', 'standard', false, null),
  ('Bill Staines', 'bill-staines', 'standard', false, null),
  ('Sweet Honey in the Rock', 'sweet-honey-in-the-rock', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 1986
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 1987
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Joan Baez', 'joan-baez', 'standard', false, null),
  ('The Bobs', 'bobs', 'standard', false, null),
  ('Billy Bragg', 'billy-bragg', 'standard', false, null),
  ('Johnny Copeland', 'johnny-copeland', 'standard', false, null),
  ('Judy Collins', 'judy-collins', 'standard', false, null),
  ('Folk Kaleidoscope (with George Gritzbach, Cormac McCarthy, Bill Morrissey, Northern Lights, and Moses Rascoe)', 'folk-kaleidoscope-with-george-gritzbach-cormac-mccarthy-bill', 'standard', false, null),
  ('Arlo Guthrie', 'arlo-guthrie', 'standard', false, null),
  ('John Hammond', 'john-hammond', 'standard', false, null),
  ('Patty Larkin', 'patty-larkin', 'standard', false, null),
  ('Alison Krauss', 'alison-krauss', 'standard', false, null),
  ('Jim Kweskin Jug Band (with Richard Greene, Bill Keith, Geoff Muldaur, Maria Muldaur, Fritz Richmond, and John Sebastian)', 'jim-kweskin-jug-band-with-richard-greene-bill-keith-geoff-mu', 'standard', false, null),
  ('New Grass Revival', 'new-grass-revival', 'standard', false, null),
  ('Tom Paxton', 'tom-paxton', 'standard', false, null),
  ('Bonnie Raitt', 'bonnie-raitt', 'standard', false, null),
  ('Schooner Fare', 'schooner-fare', 'standard', false, null),
  ('Eric and Caitlin Von Schmidt', 'eric-and-caitlin-von-schmidt', 'standard', false, null),
  ('Katie Webster', 'katie-webster', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 1987
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 1988
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Shawn Colvin', 'shawn-colvin', 'standard', false, null),
  ('Robert Cray', 'robert-cray', 'standard', false, null),
  ('Dr. John', 'dr-john', 'standard', false, null),
  ('Patty Larkin', 'patty-larkin', 'standard', false, null),
  ('Los Lobos', 'los-lobos', 'standard', false, null),
  ('Odadda!', 'odadda', 'standard', false, null),
  ('Taj Mahal', 'taj-mahal', 'standard', false, null),
  ('Nashville Bluegrass Band', 'nashville-bluegrass-band', 'standard', false, null),
  ('Holly Near', 'holly-near', 'standard', false, null),
  ('Tom Paxton', 'tom-paxton', 'standard', false, null),
  ('Queen Ida and the Bon Temps Zydeco Band', 'queen-ida-and-the-bon-temps-zydeco-band', 'standard', false, null),
  ('Buffy Sainte-Marie', 'buffy-sainte-marie', 'standard', false, null),
  ('Richard Thompson', 'richard-thompson', 'standard', false, null),
  ('Artie and Happy Traum', 'artie-and-happy-traum', 'standard', false, null),
  ('Doc Watson', 'doc-watson', 'standard', false, null),
  ('Cheryl Wheeler', 'cheryl-wheeler', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 1988
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 1989
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Theodore Bikel', 'theodore-bikel', 'standard', false, null),
  ('Buckwheat Zydeco', 'buckwheat-zydeco', 'standard', false, null),
  ('The Clancy Brothers with Robbie O''Connell', 'clancy-brothers-with-robbie-oconnell', 'standard', false, null),
  ('Shawn Colvin', 'shawn-colvin', 'standard', false, null),
  ('Ry Cooder', 'ry-cooder', 'standard', false, null),
  ('Emmylou Harris', 'emmylou-harris', 'standard', false, null),
  ('John Hiatt', 'john-hiatt', 'standard', false, null),
  ('John Lee Hooker', 'john-lee-hooker', 'standard', false, null),
  ('B.B. King', 'bb-king', 'standard', false, null),
  ('Laura Nyro', 'laura-nyro', 'standard', false, null),
  ('Odetta', 'odetta', 'standard', false, null),
  ('John Prine', 'john-prine', 'standard', false, null),
  ('Leon Redbone', 'leon-redbone', 'standard', false, null),
  ('Pete Seeger', 'pete-seeger', 'standard', false, null),
  ('Cheryl Wheeler', 'cheryl-wheeler', 'standard', false, null),
  ('Songwriting workshop (with Ashley Cleveland, Jack Hardy, David Massengil, Rod MacDonald, Bill Morrisey, Northern Lights, Chris Smither, and Frank Tedesso)', 'songwriting-workshop-with-ashley-cleveland-jack-hardy-david-', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 1989
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

commit;
-- Historical sets+performances for the 1990s
begin;

-- 1990
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Joan Baez', 'joan-baez', 'standard', false, null),
  ('Luka Bloom', 'luka-bloom', 'standard', false, null),
  ('Greg Brown', 'greg-brown', 'standard', false, null),
  ('Ashley Cleveland', 'ashley-cleveland', 'standard', false, null),
  ('Ry Cooder and David Lindley', 'ry-cooder-and-david-lindley', 'standard', false, null),
  ('Indigo Girls', 'indigo-girls', 'standard', false, null),
  ('Flaco Jiménez', 'flaco-jimenez', 'standard', false, null),
  ('Ladysmith Black Mambazo', 'ladysmith-black-mambazo', 'standard', false, null),
  ('Christine Lavin', 'christine-lavin', 'standard', false, null),
  ('Robert Earl Keen', 'robert-earl-keen', 'standard', false, null),
  ('David Olney', 'david-olney', 'standard', false, null),
  ('The Roches', 'roches', 'standard', false, null),
  ('Michelle Shocked with Tower of Power', 'michelle-shocked-with-tower-of-power', 'standard', false, null),
  ('Chris Smither', 'chris-smither', 'standard', false, null),
  ('Sweet Honey in the Rock', 'sweet-honey-in-the-rock', 'standard', false, null),
  ('The Subdudes', 'subdudes', 'standard', false, null),
  ('Richard Thompson', 'richard-thompson', 'standard', false, null),
  ('The Wild Magnolias with Rebirth Brass Band', 'wild-magnolias-with-rebirth-brass-band', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 1990
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 1991
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Luka Bloom', 'luka-bloom', 'standard', false, null),
  ('Mary Chapin Carpenter', 'mary-chapin-carpenter', 'standard', false, null),
  ('Boozoo Chavis', 'boozoo-chavis', 'standard', false, null),
  ('Judy Collins', 'judy-collins', 'standard', false, null),
  ('Shawn Colvin', 'shawn-colvin', 'standard', false, null),
  ('Cliff Eberhardt', 'cliff-eberhardt', 'standard', false, null),
  ('Paul Geremia', 'paul-geremia', 'standard', false, null),
  ('Indigo Girls', 'indigo-girls', 'standard', false, null),
  ('Nanci Griffith', 'nanci-griffith', 'standard', false, null),
  ('John Hiatt', 'john-hiatt', 'standard', false, null),
  ('Kate & Anna McGarrigle', 'kate-and-anna-mcgarrigle', 'standard', false, null),
  ('Bill Morrissey', 'bill-morrissey', 'standard', false, null),
  ('Randy Newman', 'randy-newman', 'standard', false, null),
  ('John Prine', 'john-prine', 'standard', false, null),
  ('The Staple Singers', 'staple-singers', 'standard', false, null),
  ('Richard Thompson', 'richard-thompson', 'standard', false, null),
  ('Suzanne Vega', 'suzanne-vega', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 1991
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 1992
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('The Band', 'band', 'standard', false, null),
  ('BeauSoleil', 'beausoleil', 'standard', false, null),
  ('Mary Chapin Carpenter', 'mary-chapin-carpenter', 'standard', false, null),
  ('Shawn Colvin', 'shawn-colvin', 'standard', false, null),
  ('Bruce Cockburn', 'bruce-cockburn', 'standard', false, null),
  ('Iris DeMent', 'iris-dement', 'standard', false, null),
  ('Pat Donohue', 'pat-donohue', 'standard', false, null),
  ('The Fairfield Four', 'fairfield-four', 'standard', false, null),
  ('Four Voices in Harmony (Joan Baez, Mary Chapin Carpenter and Indigo Girls)', 'four-voices-in-harmony-joan-baez-mary-chapin-carpenter-and-i', 'standard', false, null),
  ('Patty Larkin', 'patty-larkin', 'standard', false, null),
  ('Nashville Bluegrass Band', 'nashville-bluegrass-band', 'standard', false, null),
  ('Rachel Polisher', 'rachel-polisher', 'standard', false, null),
  ('Yomo Toro', 'yomo-toro', 'standard', false, null),
  ('Suzanne Vega', 'suzanne-vega', 'standard', false, null),
  ('Loudon Wainwright III', 'loudon-wainwright-iii', 'standard', false, null),
  ('David Wilcox', 'david-wilcox', 'standard', false, null),
  ('Cris Williamson', 'cris-williamson', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 1992
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 1993
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('The Band', 'band', 'standard', false, null),
  ('Boukman Eksperyans', 'boukman-eksperyans', 'standard', false, null),
  ('Four Voices in Harmony', 'four-voices-in-harmony', 'standard', false, null),
  ('Mary Chapin Carpenter', 'mary-chapin-carpenter', 'standard', false, null),
  ('John Gorka', 'john-gorka', 'standard', false, null),
  ('Nanci Griffith', 'nanci-griffith', 'standard', false, null),
  ('Tish Hinojosa', 'tish-hinojosa', 'standard', false, null),
  ('Peter Keane', 'peter-keane', 'standard', false, null),
  ('Alison Krauss & Union Station', 'alison-krauss-and-union-station', 'standard', false, null),
  ('Sonny Landreth', 'sonny-landreth', 'standard', false, null),
  ('Daniel Lanois', 'daniel-lanois', 'standard', false, null),
  ('Sarah McLachlan', 'sarah-mclachlan', 'standard', false, null),
  ('James McMurtry', 'james-mcmurtry', 'standard', false, null),
  ('Peter, Paul & Mary', 'peter-paul-and-mary', 'standard', false, null),
  ('John Prine', 'john-prine', 'standard', false, null),
  ('Sweet Honey in the Rock', 'sweet-honey-in-the-rock', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 1993
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 1994
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Iris Dement', 'iris-dement', 'standard', false, null),
  ('Cliff Eberhardt', 'cliff-eberhardt', 'standard', false, null),
  ('Fairport Convention', 'fairport-convention', 'standard', false, null),
  ('Ruth Gerson', 'ruth-gerson', 'standard', false, null),
  ('Indigo Girls', 'indigo-girls', 'standard', false, null),
  ('Arlo Guthrie', 'arlo-guthrie', 'standard', false, null),
  ('Sarah McLachlan', 'sarah-mclachlan', 'standard', false, null),
  ('Mighty Clouds of Joy', 'mighty-clouds-of-joy', 'standard', false, null),
  ('The Nields', 'nields', 'standard', false, null),
  ('Randy Newman', 'randy-newman', 'standard', false, null),
  ('Ellis Paul', 'ellis-paul', 'standard', false, null),
  ('Michelle Shocked', 'michelle-shocked', 'standard', false, null),
  ('Richard Shindell', 'richard-shindell', 'standard', false, null),
  ('The Story', 'story', 'standard', false, null),
  ('Richard Thompson', 'richard-thompson', 'standard', false, null),
  ('The Williams Brothers', 'williams-brothers', 'standard', false, null),
  ('Dar Williams', 'dar-williams', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 1994
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 1995
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Joan Baez', 'joan-baez', 'standard', false, null),
  ('Mary Black', 'mary-black', 'standard', false, null),
  ('Luka Bloom', 'luka-bloom', 'standard', false, null),
  ('Mary Chapin Carpenter', 'mary-chapin-carpenter', 'standard', false, null),
  ('Ani DiFranco', 'ani-difranco', 'standard', false, null),
  ('Ferron', 'ferron', 'standard', false, null),
  ('John Hiatt', 'john-hiatt', 'standard', false, null),
  ('Indigo Girls', 'indigo-girls', 'standard', false, null),
  ('Keb'' Mo''', 'keb-mo', 'standard', false, null),
  ('The Jayhawks', 'jayhawks', 'standard', false, null),
  ('Patty Larkin', 'patty-larkin', 'standard', false, null),
  ('Laura Love', 'laura-love', 'standard', false, null),
  ('Bill Morrissey', 'bill-morrissey', 'standard', false, null),
  ('Carol Noonan', 'carol-noonan', 'standard', false, null),
  ('Terrance Simien', 'terrance-simien', 'standard', false, null),
  ('Bob Weir and Rob Wasserman', 'bob-weir-and-rob-wasserman', 'standard', false, null),
  ('Cheryl Wheeler', 'cheryl-wheeler', 'standard', false, null),
  ('Victoria Williams', 'victoria-williams', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 1995
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 1996
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Joan Armatrading', 'joan-armatrading', 'standard', false, null),
  ('Clarence "Gatemouth" Brown', 'clarence-gatemouth-brown', 'standard', false, null),
  ('Bruce Cockburn', 'bruce-cockburn', 'standard', false, null),
  ('Cordelia''s Dad', 'cordelias-dad', 'standard', false, null),
  ('Ani DiFranco', 'ani-difranco', 'standard', false, null),
  ('Jerry Douglas', 'jerry-douglas', 'standard', false, null),
  ('John Gorka', 'john-gorka', 'standard', false, null),
  ('John Hiatt', 'john-hiatt', 'standard', false, null),
  ('Indigo Girls', 'indigo-girls', 'standard', false, null),
  ('Patty Larkin', 'patty-larkin', 'standard', false, null),
  ('Lisa Loeb', 'lisa-loeb', 'standard', false, null),
  ('Maura O''Connell', 'maura-oconnell', 'standard', false, null),
  ('Peter Rowan', 'peter-rowan', 'standard', false, null),
  ('Michelle Shocked', 'michelle-shocked', 'standard', false, null),
  ('Cheryl Wheeler', 'cheryl-wheeler', 'standard', false, null),
  ('Suzanne Vega', 'suzanne-vega', 'standard', false, null),
  ('David Wilcox', 'david-wilcox', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 1996
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 1997
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Joan Baez', 'joan-baez', 'standard', false, null),
  ('Mary Black', 'mary-black', 'standard', false, null),
  ('The Borrowers', 'borrowers', 'standard', false, null),
  ('Jonatha Brooke', 'jonatha-brooke', 'standard', false, null),
  ('Rosanne Cash', 'rosanne-cash', 'standard', false, null),
  ('Guy Davis', 'guy-davis', 'standard', false, null),
  ('Betty Elders', 'betty-elders', 'standard', false, null),
  ('Ramblin'' Jack Elliott', 'ramblin-jack-elliott', 'standard', false, null),
  ('John Gorka', 'john-gorka', 'standard', false, null),
  ('Hart-Rouge', 'hart-rouge', 'standard', false, null),
  ('John Hiatt', 'john-hiatt', 'standard', false, null),
  ('Janis Ian', 'janis-ian', 'standard', false, null),
  ('Lucy Kaplansky', 'lucy-kaplansky', 'standard', false, null),
  ('Little Feat', 'little-feat', 'standard', false, null),
  ('Sinéad Lohan', 'sinead-lohan', 'standard', false, null),
  ('Moxy Früvous', 'moxy-fruvous', 'standard', false, null),
  ('Peter Mulvey', 'peter-mulvey', 'standard', false, null),
  ('The Nields', 'nields', 'standard', false, null),
  ('U. Utah Phillips', 'u-utah-phillips', 'standard', false, null),
  ('Suzzy Roche', 'suzzy-roche', 'standard', false, null),
  ('Martin Sexton', 'martin-sexton', 'standard', false, null),
  ('Richard Shindell', 'richard-shindell', 'standard', false, null),
  ('Eric Taylor', 'eric-taylor', 'standard', false, null),
  ('James Taylor', 'james-taylor', 'standard', false, null),
  ('Violent Femmes', 'violent-femmes', 'standard', false, null),
  ('Gillian Welch and David Rawlings', 'gillian-welch-and-david-rawlings', 'standard', false, null),
  ('Dar Williams', 'dar-williams', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 1997
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 1998
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('David Bromberg', 'david-bromberg', 'standard', false, null),
  ('Dee Carstensen', 'dee-carstensen', 'standard', false, null),
  ('Marc Cohn', 'marc-cohn', 'standard', false, null),
  ('Rodney Crowell', 'rodney-crowell', 'standard', false, null),
  ('Ani DiFranco', 'ani-difranco', 'standard', false, null),
  ('Donna the Buffalo', 'donna-the-buffalo', 'standard', false, null),
  ('Béla Fleck', 'bela-fleck', 'standard', false, null),
  ('Vance Gilbert', 'vance-gilbert', 'standard', false, null),
  ('Nanci Griffith', 'nanci-griffith', 'standard', false, null),
  ('Trina Hamlin', 'trina-hamlin', 'standard', false, null),
  ('Janis Ian', 'janis-ian', 'standard', false, null),
  ('Indigo Girls', 'indigo-girls', 'standard', false, null),
  ('Alison Krauss', 'alison-krauss', 'standard', false, null),
  ('Lyle Lovett', 'lyle-lovett', 'standard', false, null),
  ('Raymond Myles and the Rams', 'raymond-myles-and-the-rams', 'standard', false, null),
  ('Tom Rush', 'tom-rush', 'standard', false, null),
  ('Eric Taylor', 'eric-taylor', 'standard', false, null),
  ('Violent Femmes', 'violent-femmes', 'standard', false, null),
  ('Loudon Wainwright III', 'loudon-wainwright-iii', 'standard', false, null),
  ('Susan Werner', 'susan-werner', 'standard', false, null),
  ('Cheryl Wheeler', 'cheryl-wheeler', 'standard', false, null),
  ('Brooks Williams', 'brooks-williams', 'standard', false, null),
  ('Dar Williams', 'dar-williams', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 1998
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 1999
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Joan Armatrading', 'joan-armatrading', 'standard', false, null),
  ('Mary Black', 'mary-black', 'standard', false, null),
  ('Catie Curtis', 'catie-curtis', 'standard', false, null),
  ('Cry Cry Cry', 'cry-cry-cry', 'standard', false, null),
  ('Tico Da Costa', 'tico-da-costa', 'standard', false, null),
  ('Stacey Earle', 'stacey-earle', 'standard', false, null),
  ('Steve Earle and the Dukes with Tim O''Brien', 'steve-earle-and-the-dukes-with-tim-obrien', 'standard', false, null),
  ('Seth Farber', 'seth-farber', 'standard', false, null),
  ('Melissa Ferrick', 'melissa-ferrick', 'standard', false, null),
  ('Paul Geremia', 'paul-geremia', 'standard', false, null),
  ('Indigo Girls', 'indigo-girls', 'standard', false, null),
  ('Patty Griffin', 'patty-griffin', 'standard', false, null),
  ('Alvin Youngblood Hart', 'alvin-youngblood-hart', 'standard', false, null),
  ('Ray Wylie Hubbard', 'ray-wylie-hubbard', 'standard', false, null),
  ('Robert Earl Keen', 'robert-earl-keen', 'standard', false, null),
  ('Jennifer Kimball', 'jennifer-kimball', 'standard', false, null),
  ('Dana and Karen Kletter with Merrie Amsterburg', 'dana-and-karen-kletter-with-merrie-amsterburg', 'standard', false, null),
  ('Ladysmith Black Mambazo', 'ladysmith-black-mambazo', 'standard', false, null),
  ('Pamela Means', 'pamela-means', 'standard', false, null),
  ('Lori McKenna', 'lori-mckenna', 'standard', false, null),
  ('Bill Morrissey', 'bill-morrissey', 'standard', false, null),
  ('Katryna and Nerissa Nields', 'katryna-and-nerissa-nields', 'standard', false, null),
  ('Northern Lights', 'northern-lights', 'standard', false, null),
  ('David Olney', 'david-olney', 'standard', false, null),
  ('Beth Orton', 'beth-orton', 'standard', false, null),
  ('Ellis Paul', 'ellis-paul', 'standard', false, null),
  ('Liz Queler', 'liz-queler', 'standard', false, null),
  ('Martin Sexton', 'martin-sexton', 'standard', false, null),
  ('Susan Tedeschi', 'susan-tedeschi', 'standard', false, null),
  ('Suzanne Vega', 'suzanne-vega', 'standard', false, null),
  ('Whirligig', 'whirligig', 'standard', false, null),
  ('Wilco', 'wilco', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 1999
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

commit;
-- Historical sets+performances for the 2000s
begin;

-- 2000
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Mary Chapin Carpenter', 'mary-chapin-carpenter', 'standard', false, null),
  ('Guy Clark', 'guy-clark', 'standard', false, null),
  ('Slaid Cleaves', 'slaid-cleaves', 'standard', false, null),
  ('Shawn Colvin', 'shawn-colvin', 'standard', false, null),
  ('Stacey Earle', 'stacey-earle', 'standard', false, null),
  ('Cliff Eberhardt', 'cliff-eberhardt', 'standard', false, null),
  ('Equation', 'equation', 'standard', false, null),
  ('Melissa Ferrick', 'melissa-ferrick', 'standard', false, null),
  ('Béla Fleck and the Flecktones', 'bela-fleck-and-the-flecktones', 'standard', false, null),
  ('Mary Gauthier', 'mary-gauthier', 'standard', false, null),
  ('John Gorka', 'john-gorka', 'standard', false, null),
  ('Kerry Grombacher', 'kerry-grombacher', 'standard', false, null),
  ('Terri Hendrix and Lloyd Maines', 'terri-hendrix-and-lloyd-maines', 'standard', false, null),
  ('Ray Wylie Hubbard', 'ray-wylie-hubbard', 'standard', false, null),
  ('Lucy Kaplansky', 'lucy-kaplansky', 'standard', false, null),
  ('Peter Keane', 'peter-keane', 'standard', false, null),
  ('Jess Klein', 'jess-klein', 'standard', false, null),
  ('Natalie MacMaster', 'natalie-macmaster', 'standard', false, null),
  ('Natalie Merchant', 'natalie-merchant', 'standard', false, null),
  ('Willie Nelson', 'willie-nelson', 'standard', false, null),
  ('Bob Neuwirth', 'bob-neuwirth', 'standard', false, null),
  ('Carrie Newcomer', 'carrie-newcomer', 'standard', false, null),
  ('Peter Rowan''s Texas Trio with Tony Rice', 'peter-rowans-texas-trio-with-tony-rice', 'standard', false, null),
  ('Toshi Reagon and Big Lovely', 'toshi-reagon-and-big-lovely', 'standard', false, null),
  ('Richard Shindell', 'richard-shindell', 'standard', false, null),
  ('The String Cheese Incident', 'string-cheese-incident', 'standard', false, null),
  ('Cheryl Wheeler', 'cheryl-wheeler', 'standard', false, null),
  ('Dar Williams', 'dar-williams', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 2000
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 2001
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Rory Block and Kate McDonnell', 'rory-block-and-kate-mcdonnell', 'standard', false, null),
  ('Paul Brady', 'paul-brady', 'standard', false, null),
  ('Jonatha Brooke', 'jonatha-brooke', 'standard', false, null),
  ('Sam Bush', 'sam-bush', 'standard', false, null),
  ('The Campbell Brothers', 'campbell-brothers', 'standard', false, null),
  ('Catie Curtis', 'catie-curtis', 'standard', false, null),
  ('Julian Dawson', 'julian-dawson', 'standard', false, null),
  ('Mike Doughty', 'mike-doughty', 'standard', false, null),
  ('Mark Erelli', 'mark-erelli', 'standard', false, null),
  ('The Flatlanders', 'flatlanders', 'standard', false, null),
  ('Vance Gilbert', 'vance-gilbert', 'standard', false, null),
  ('Nanci Griffith', 'nanci-griffith', 'standard', false, null),
  ('The Hackberry Ramblers', 'hackberry-ramblers', 'standard', false, null),
  ('Emmylou Harris', 'emmylou-harris', 'standard', false, null),
  ('Sara Hickman', 'sara-hickman', 'standard', false, null),
  ('Indigo Girls', 'indigo-girls', 'standard', false, null),
  ('David Johansen and the Harry Smiths', 'david-johansen-and-the-harry-smiths', 'standard', false, null),
  ('Patty Larkin', 'patty-larkin', 'standard', false, null),
  ('Mary Lou Lord', 'mary-lou-lord', 'standard', false, null),
  ('Baaba Maal', 'baaba-maal', 'standard', false, null),
  ('Susan McKeown and the Chanting House', 'susan-mckeown-and-the-chanting-house', 'standard', false, null),
  ('John Mooney', 'john-mooney', 'standard', false, null),
  ('North Mississippi Allstars with Robert Randolph and John Medeski', 'north-mississippi-allstars-with-robert-randolph-and-john-med', 'standard', false, null),
  ('Joan Osborne', 'joan-osborne', 'standard', false, null),
  ('Ellis Paul', 'ellis-paul', 'standard', false, null),
  ('Toshi Reagon and Big Lovely', 'toshi-reagon-and-big-lovely', 'standard', false, null),
  ('RIG (Sarah Lee Guthrie, Johnny Irion, and Tao Rodríguez-Seeger)', 'rig-sarah-lee-guthrie-johnny-irion-and-tao-rodriguez-seeger', 'standard', false, null),
  ('Michelle Shocked', 'michelle-shocked', 'standard', false, null),
  ('Victoria Williams and Mark Olson', 'victoria-williams-and-mark-olson', 'standard', false, null),
  ('Michael Veitch', 'michael-veitch', 'standard', false, null),
  ('The Waifs', 'waifs', 'standard', false, null),
  ('Gillian Welch and David Rawlings', 'gillian-welch-and-david-rawlings', 'standard', false, null),
  ('Kelly Willis', 'kelly-willis', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 2001
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 2002
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Rani Arbo and Daisy Mayhem', 'rani-arbo-and-daisy-mayhem', 'standard', false, null),
  ('The Blind Boys of Alabama', 'blind-boys-of-alabama', 'standard', false, null),
  ('Jonatha Brooke', 'jonatha-brooke', 'standard', false, null),
  ('Slaid Cleaves', 'slaid-cleaves', 'standard', false, null),
  ('Bruce Cockburn', 'bruce-cockburn', 'standard', false, null),
  ('Shawn Colvin', 'shawn-colvin', 'standard', false, null),
  ('Kris Delmhorst', 'kris-delmhorst', 'standard', false, null),
  ('Bob Dylan', 'bob-dylan', 'standard', false, null),
  ('Melissa Ferrick', 'melissa-ferrick', 'standard', false, null),
  ('Gigi', 'gigi', 'standard', false, null),
  ('John Gorka', 'john-gorka', 'standard', false, null),
  ('Vance Gilbert', 'vance-gilbert', 'standard', false, null),
  ('Arlo Guthrie', 'arlo-guthrie', 'standard', false, null),
  ('Caroline Herring', 'caroline-herring', 'standard', false, null),
  ('Bob Hillman', 'bob-hillman', 'standard', false, null),
  ('Rosie Ledet', 'rosie-ledet', 'standard', false, null),
  ('Laurie Lewis', 'laurie-lewis', 'standard', false, null),
  ('Dave Massengill', 'dave-massengill', 'standard', false, null),
  ('Kate & Anna McGarrigle', 'kate-and-anna-mcgarrigle', 'standard', false, null),
  ('Lynn Miles', 'lynn-miles', 'standard', false, null),
  ('Geoff Muldaur', 'geoff-muldaur', 'standard', false, null),
  ('Maura O''Connell', 'maura-oconnell', 'standard', false, null),
  ('Richard Shindell', 'richard-shindell', 'standard', false, null),
  ('Louise Taylor', 'louise-taylor', 'standard', false, null),
  ('The Waifs', 'waifs', 'standard', false, null),
  ('Dar Williams', 'dar-williams', 'standard', false, null),
  ('Jack Williams', 'jack-williams', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 2002
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 2003
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('The Amerdings (Jake Armerding, Rachel Davis, Kris Delmhorst, and Mark Erelli)', 'amerdings-jake-armerding-rachel-davis-kris-delmhorst-and-mar', 'standard', false, null),
  ('Joan Armatrading', 'joan-armatrading', 'standard', false, null),
  ('Alison Brown', 'alison-brown', 'standard', false, null),
  ('Sam Bush', 'sam-bush', 'standard', false, null),
  ('Guy Clark and Joe Ely', 'guy-clark-and-joe-ely', 'standard', false, null),
  ('Slaid Cleaves', 'slaid-cleaves', 'standard', false, null),
  ('Ani DiFranco', 'ani-difranco', 'standard', false, null),
  ('Mary Gauthier', 'mary-gauthier', 'standard', false, null),
  ('The Georgia Sea Island Singers', 'georgia-sea-island-singers', 'standard', false, null),
  ('Eliza Gilkyson', 'eliza-gilkyson', 'standard', false, null),
  ('Michael Fracasso', 'michael-fracasso', 'standard', false, null),
  ('John Hiatt', 'john-hiatt', 'standard', false, null),
  ('Sarah Lee Guthrie & Johnny Irion', 'sarah-lee-guthrie-and-johnny-irion', 'standard', false, null),
  ('Angélique Kidjo', 'angelique-kidjo', 'standard', false, null),
  ('Jimmy LaFave', 'jimmy-lafave', 'standard', false, null),
  ('Lake Effect', 'lake-effect', 'standard', false, null),
  ('Lyle Lovett', 'lyle-lovett', 'standard', false, null),
  ('The Mammals', 'mammals', 'standard', false, null),
  ('Keb'' Mo''', 'keb-mo', 'standard', false, null),
  ('Aimee Mann', 'aimee-mann', 'standard', false, null),
  ('Tift Merritt', 'tift-merritt', 'standard', false, null),
  ('Nickel Creek', 'nickel-creek', 'standard', false, null),
  ('Out of the Blue (Ray Bonneville, Precious Bryant, John Herald, and David Jacobs-Strain)', 'out-of-the-blue-ray-bonneville-precious-bryant-john-herald-a', 'standard', false, null),
  ('Ellis Paul', 'ellis-paul', 'standard', false, null),
  ('John Prine', 'john-prine', 'standard', false, null),
  ('Kim Richey', 'kim-richey', 'standard', false, null),
  ('Sol y Canto', 'sol-y-canto', 'standard', false, null),
  ('The Ben Taylor Band', 'ben-taylor-band', 'standard', false, null),
  ('Troupe Baden''ya', 'troupe-badenya', 'standard', false, null),
  ('The Waifs', 'waifs', 'standard', false, null),
  ('Dan Zanes', 'dan-zanes', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 2003
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 2004
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Laura Cantrell', 'laura-cantrell', 'standard', false, null),
  ('Slaid Cleaves', 'slaid-cleaves', 'standard', false, null),
  ('Laura Cortese and Ten Brooks', 'laura-cortese-and-ten-brooks', 'standard', false, null),
  ('Crosby, Stills & Nash', 'crosby-stills-and-nash', 'standard', false, null),
  ('Crooked Still', 'crooked-still', 'standard', false, null),
  ('The Dixie Hummingbirds with Levon Helm and Garth Hudson', 'dixie-hummingbirds-with-levon-helm-and-garth-hudson', 'standard', false, null),
  ('Lila Downs', 'lila-downs', 'standard', false, null),
  ('Steve Earle', 'steve-earle', 'standard', false, null),
  ('Corey Harris', 'corey-harris', 'standard', false, null),
  ('Mary Jane Lamond', 'mary-jane-lamond', 'standard', false, null),
  ('Vusi Mahlasela', 'vusi-mahlasela', 'standard', false, null),
  ('The Mammals', 'mammals', 'standard', false, null),
  ('Lori McKenna', 'lori-mckenna', 'standard', false, null),
  ('Old Crow Medicine Show', 'old-crow-medicine-show', 'standard', false, null),
  ('Ollabelle', 'ollabelle', 'standard', false, null),
  ('Joan Osborne', 'joan-osborne', 'standard', false, null),
  ('Rufus Wainwright with Kate McGarrigle', 'rufus-wainwright-with-kate-mcgarrigle', 'standard', false, null),
  ('Ron Sexsmith', 'ron-sexsmith', 'standard', false, null),
  ('Darden Smith', 'darden-smith', 'standard', false, null),
  ('Mindy Smith', 'mindy-smith', 'standard', false, null),
  ('Chip Taylor and Carrie Rodriguez', 'chip-taylor-and-carrie-rodriguez', 'standard', false, null),
  ('Doc Watson', 'doc-watson', 'standard', false, null),
  ('Wilco', 'wilco', 'standard', false, null),
  ('Lucinda Williams', 'lucinda-williams', 'standard', false, null),
  ('Adrienne Young and Little Sadie', 'adrienne-young-and-little-sadie', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 2004
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 2005
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Bright Eyes', 'bright-eyes', 'standard', false, null),
  ('Caitlin Cary', 'caitlin-cary', 'standard', false, null),
  ('Kasey Chambers', 'kasey-chambers', 'standard', false, null),
  ('Thad Cockrell', 'thad-cockrell', 'standard', false, null),
  ('Elvis Costello and the Imposters', 'elvis-costello-and-the-imposters', 'standard', false, null),
  ('Béla Fleck', 'bela-fleck', 'standard', false, null),
  ('Foghorn Stringband', 'foghorn-stringband', 'standard', false, null),
  ('Patty Griffin', 'patty-griffin', 'standard', false, null),
  ('Arlo Guthrie', 'arlo-guthrie', 'standard', false, null),
  ('Nanci Griffith', 'nanci-griffith', 'standard', false, null),
  ('Sarah Lee Guthrie & Johnny Irion', 'sarah-lee-guthrie-and-johnny-irion', 'standard', false, null),
  ('Emmylou Harris', 'emmylou-harris', 'standard', false, null),
  ('The Holmes Brothers', 'holmes-brothers', 'standard', false, null),
  ('Jim James', 'jim-james', 'standard', false, null),
  ('Kaki King', 'kaki-king', 'standard', false, null),
  ('The Kennedys', 'kennedys', 'standard', false, null),
  ('Ray LaMontagne', 'ray-lamontagne', 'standard', false, null),
  ('Jim Lauderdale', 'jim-lauderdale', 'standard', false, null),
  ('The Lonesome Sisters', 'lonesome-sisters', 'standard', false, null),
  ('The Mammals', 'mammals', 'standard', false, null),
  ('Buddy Miller', 'buddy-miller', 'standard', false, null),
  ('Del McCoury', 'del-mccoury', 'standard', false, null),
  ('Old Crow Medicine Show', 'old-crow-medicine-show', 'standard', false, null),
  ('Old School Freight Train', 'old-school-freight-train', 'standard', false, null),
  ('Pixies', 'pixies', 'standard', false, null),
  ('Jane Siberry', 'jane-siberry', 'standard', false, null),
  ('Richard Thompson', 'richard-thompson', 'standard', false, null),
  ('Teddy Thompson', 'teddy-thompson', 'standard', false, null),
  ('M. Ward', 'm-ward', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 2005
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 2006
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Riley Baugus', 'riley-baugus', 'standard', false, null),
  ('Beòlach', 'beolach', 'standard', false, null),
  ('Blou', 'blou', 'standard', false, null),
  ('Rosanne Cash', 'rosanne-cash', 'standard', false, null),
  ('Cherish the Ladies', 'cherish-the-ladies', 'standard', false, null),
  ('The Duhks', 'duhks', 'standard', false, null),
  ('David Gray', 'david-gray', 'standard', false, null),
  ('Tim Eriksen and Sharp Note', 'tim-eriksen-and-sharp-note', 'standard', false, null),
  ('Jeffrey Foucault', 'jeffrey-foucault', 'standard', false, null),
  ('Indigo Girls', 'indigo-girls', 'standard', false, null),
  ('Mary Gauthier', 'mary-gauthier', 'standard', false, null),
  ('Hot Toddy', 'hot-toddy', 'standard', false, null),
  ('Sonya Kitchell', 'sonya-kitchell', 'standard', false, null),
  ('Sonny Landreth', 'sonny-landreth', 'standard', false, null),
  ('Patty Larkin', 'patty-larkin', 'standard', false, null),
  ('Bettye LaVette', 'bettye-lavette', 'standard', false, null),
  ('The Meters', 'meters', 'standard', false, null),
  ('Odetta', 'odetta', 'standard', false, null),
  ('Madeleine Peyroux', 'madeleine-peyroux', 'standard', false, null),
  ('Grace Potter and the Nocturnals', 'grace-potter-and-the-nocturnals', 'standard', false, null),
  ('David Rawlings with Gillian Welch', 'david-rawlings-with-gillian-welch', 'standard', false, null),
  ('Darrell Scott', 'darrell-scott', 'standard', false, null),
  ('Chris Smither', 'chris-smither', 'standard', false, null),
  ('Rosalie Sorrels', 'rosalie-sorrels', 'standard', false, null),
  ('Ronan Tynan', 'ronan-tynan', 'standard', false, null),
  ('Keller Williams', 'keller-williams', 'standard', false, null),
  ('The Wood Brothers', 'wood-brothers', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 2006
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 2007
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('The Allman Brothers Band', 'allman-brothers-band', 'standard', false, null),
  ('Duane Andrews Trio', 'duane-andrews-trio', 'standard', false, null),
  ('Rani Arbo and Daisy Mayhem', 'rani-arbo-and-daisy-mayhem', 'standard', false, null),
  ('Assembly of Dust', 'assembly-of-dust', 'standard', false, null),
  ('John Butler Trio', 'john-butler-trio', 'standard', false, null),
  ('Carolina Chocolate Drops', 'carolina-chocolate-drops', 'standard', false, null),
  ('Dudley Connell', 'dudley-connell', 'standard', false, null),
  ('Dirty Dozen Brass Band', 'dirty-dozen-brass-band', 'standard', false, null),
  ('Alejandro Escovedo', 'alejandro-escovedo', 'standard', false, null),
  ('Emmylou Harris', 'emmylou-harris', 'standard', false, null),
  ('Sierra Hull and Highway 11', 'sierra-hull-and-highway-11', 'standard', false, null),
  ('Amos Lee', 'amos-lee', 'standard', false, null),
  ('Julie Lee', 'julie-lee', 'standard', false, null),
  ('The Lonesome Brothers', 'lonesome-brothers', 'standard', false, null),
  ('Diana Jones', 'diana-jones', 'standard', false, null),
  ('Alison Krauss & Union Station with Jerry Douglas', 'alison-krauss-and-union-station-with-jerry-douglas', 'standard', false, null),
  ('The MacKenzie Project', 'mackenzie-project', 'standard', false, null),
  ('The Nightwatchman', 'nightwatchman', 'standard', false, null),
  ('North Mississippi Allstars', 'north-mississippi-allstars', 'standard', false, null),
  ('Elvis Perkins', 'elvis-perkins', 'standard', false, null),
  ('Phonograph', 'phonograph', 'standard', false, null),
  ('Grace Potter and the Nocturnals', 'grace-potter-and-the-nocturnals', 'standard', false, null),
  ('Linda Rondstadt', 'linda-rondstadt', 'standard', false, null),
  ('Ralph Stanley and the Clinch Mountain Boys', 'ralph-stanley-and-the-clinch-mountain-boys', 'standard', false, null),
  ('Vishtèn', 'vishten', 'standard', false, null),
  ('Martha Wainwright with Sloan Wainwright and Lucy Wainwright Roche', 'martha-wainwright-with-sloan-wainwright-and-lucy-wainwright-', 'standard', false, null),
  ('Cheryl Wheeler', 'cheryl-wheeler', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 2007
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 2008
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Trey Anastasio', 'trey-anastasio', 'standard', false, null),
  ('The Avett Brothers', 'avett-brothers', 'standard', false, null),
  ('The Black Crowes', 'black-crowes', 'standard', false, null),
  ('Jimmy Buffett', 'jimmy-buffett', 'standard', false, null),
  ('Calexico', 'calexico', 'standard', false, null),
  ('Brandi Carlile', 'brandi-carlile', 'standard', false, null),
  ('Cat Power', 'cat-power', 'standard', false, null),
  ('Cowboy Junkies', 'cowboy-junkies', 'standard', false, null),
  ('Jakob Dylan', 'jakob-dylan', 'standard', false, null),
  ('Steve Earle and Allison Moorer', 'steve-earle-and-allison-moorer', 'standard', false, null),
  ('The Felice Brothers', 'felice-brothers', 'standard', false, null),
  ('Jesca Hoop', 'jesca-hoop', 'standard', false, null),
  ('Jim James', 'jim-james', 'standard', false, null),
  ('Richard Julian', 'richard-julian', 'standard', false, null),
  ('Kaki King', 'kaki-king', 'standard', false, null),
  ('Richie Havens', 'richie-havens', 'standard', false, null),
  ('Levon Helm', 'levon-helm', 'standard', false, null),
  ('Stephen and Damian Marley', 'stephen-and-damian-marley', 'standard', false, null),
  ('Willy Mason', 'willy-mason', 'standard', false, null),
  ('Over the Rhine', 'over-the-rhine', 'standard', false, null),
  ('Red Rooster', 'red-rooster', 'standard', false, null),
  ('She & Him', 'she-and-him', 'standard', false, null),
  ('Jake Shimabukuro', 'jake-shimabukuro', 'standard', false, null),
  ('Son Volt', 'son-volt', 'standard', false, null),
  ('Kate Taylor', 'kate-taylor', 'standard', false, null),
  ('Gillian Welch', 'gillian-welch', 'standard', false, null),
  ('Brian Wilson', 'brian-wilson', 'standard', false, null),
  ('Young@Heart Chorus', 'young-heart-chorus', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 2008
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 2009
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('The Avett Brothers', 'avett-brothers', 'standard', false, null),
  ('Joan Baez', 'joan-baez', 'standard', false, null),
  ('Balfa Toujours', 'balfa-toujours', 'standard', false, null),
  ('Billy Bragg', 'billy-bragg', 'standard', false, null),
  ('The Campbell Brothers', 'campbell-brothers', 'standard', false, null),
  ('Neko Case', 'neko-case', 'standard', false, null),
  ('Dala', 'dala', 'standard', false, null),
  ('The Decemberists', 'decemberists', 'standard', false, null),
  ('Deer Tick', 'deer-tick', 'standard', false, null),
  ('Brett Dennen', 'brett-dennen', 'standard', false, null),
  ('Ramblin'' Jack Elliott', 'ramblin-jack-elliott', 'standard', false, null),
  ('Tim Eriksen and Sharp Note Singers', 'tim-eriksen-and-sharp-note-singers', 'standard', false, null),
  ('Arlo Guthrie', 'arlo-guthrie', 'standard', false, null),
  ('Fleet Foxes', 'fleet-foxes', 'standard', false, null),
  ('Iron & Wine', 'iron-and-wine', 'standard', false, null),
  ('Ben Kweller', 'ben-kweller', 'standard', false, null),
  ('The Low Anthem', 'low-anthem', 'standard', false, null),
  ('Del McCoury', 'del-mccoury', 'standard', false, null),
  ('Tift Merritt', 'tift-merritt', 'standard', false, null),
  ('The Nightwatchman', 'nightwatchman', 'standard', false, null),
  ('Elvis Perkins', 'elvis-perkins', 'standard', false, null),
  ('Joe Pug', 'joe-pug', 'standard', false, null),
  ('Dave Rawlings Machine', 'dave-rawlings-machine', 'standard', false, null),
  ('Josh Ritter', 'josh-ritter', 'standard', false, null),
  ('Tao Rodriguez-Seeger', 'tao-rodriguez-seeger', 'standard', false, null),
  ('Pete Seeger with Judy Collins', 'pete-seeger-with-judy-collins', 'standard', false, null),
  ('Langhorne Slim', 'langhorne-slim', 'standard', false, null),
  ('Mavis Staples', 'mavis-staples', 'standard', false, null),
  ('Gillian Welch', 'gillian-welch', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 2009
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

commit;
-- Historical sets+performances for the 2010s
begin;

-- 2010
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('The Avett Brothers', 'avett-brothers', 'standard', false, null),
  ('Andrew Bird', 'andrew-bird', 'standard', false, null),
  ('Blitzen Trapper', 'blitzen-trapper', 'standard', false, null),
  ('A. A. Bondy', 'a-a-bondy', 'standard', false, null),
  ('Sam Bush', 'sam-bush', 'standard', false, null),
  ('Calexico', 'calexico', 'standard', false, null),
  ('Brandi Carlile', 'brandi-carlile', 'standard', false, null),
  ('Cory Chisel and The Wandering Sons', 'cory-chisel-and-the-wandering-sons', 'standard', false, null),
  ('Dawes', 'dawes', 'standard', false, null),
  ('Justin Townes Earle', 'justin-townes-earle', 'standard', false, null),
  ('The Felice Brothers', 'felice-brothers', 'standard', false, null),
  ('Richie Havens', 'richie-havens', 'standard', false, null),
  ('Levon Helm', 'levon-helm', 'standard', false, null),
  ('Horse Feathers', 'horse-feathers', 'standard', false, null),
  ('Sarah Jarosz', 'sarah-jarosz', 'standard', false, null),
  ('Jim James', 'jim-james', 'standard', false, null),
  ('Sharon Jones & the Dap-Kings', 'sharon-jones-and-the-dap-kings', 'standard', false, null),
  ('Pokey LaFarge', 'pokey-lafarge', 'standard', false, null),
  ('Liz Longley', 'liz-longley', 'standard', false, null),
  ('The Low Anthem', 'low-anthem', 'standard', false, null),
  ('Steve Martin and the Steep Canyon Rangers', 'steve-martin-and-the-steep-canyon-rangers', 'standard', false, null),
  ('Nneka', 'nneka', 'standard', false, null),
  ('Tim O''Brien', 'tim-obrien', 'standard', false, null),
  ('O''Death', 'odeath', 'standard', false, null),
  ('Preservation Hall Jazz Band', 'preservation-hall-jazz-band', 'standard', false, null),
  ('John Prine', 'john-prine', 'standard', false, null),
  ('Punch Brothers', 'punch-brothers', 'standard', false, null),
  ('Tao Seeger Band', 'tao-seeger-band', 'standard', false, null),
  ('Edward Sharpe and the Magnetic Zeroes', 'edward-sharpe-and-the-magnetic-zeroes', 'standard', false, null),
  ('Ben Sollee and Daniel Martin Moore', 'ben-sollee-and-daniel-martin-moore', 'standard', false, null),
  ('The Swell Season', 'swell-season', 'standard', false, null),
  ('Doc Watson and David Holt', 'doc-watson-and-david-holt', 'standard', false, null),
  ('Richie Havens', 'richie-havens-2', 'surprise', true, null),
  ('Jim James', 'jim-james-2', 'surprise', true, null),
  ('Lenny Goldsmith', 'lenny-goldsmith', 'surprise', true, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 2010
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 2011
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Brown Bird', 'brown-bird', 'standard', false, null),
  ('Carolina Chocolate Drops', 'carolina-chocolate-drops', 'standard', false, null),
  ('The Cave Singers', 'cave-singers', 'standard', false, null),
  ('The Civil Wars', 'civil-wars', 'standard', false, null),
  ('Elvis Costello', 'elvis-costello', 'standard', false, null),
  ('David Wax Museum', 'david-wax-museum', 'standard', false, null),
  ('The Decemberists', 'decemberists', 'standard', false, null),
  ('Delta Spirit', 'delta-spirit', 'standard', false, null),
  ('The Devil Makes Three', 'devil-makes-three', 'standard', false, null),
  ('Justin Townes Earle', 'justin-townes-earle', 'standard', false, null),
  ('The Ebony Hillbillies', 'ebony-hillbillies', 'standard', false, null),
  ('Ramblin'' Jack Elliott', 'ramblin-jack-elliott', 'standard', false, null),
  ('The Felice Brothers', 'felice-brothers', 'standard', false, null),
  ('Freelance Whales', 'freelance-whales', 'standard', false, null),
  ('Gogol Bordello', 'gogol-bordello', 'standard', false, null),
  ('John Gorka', 'john-gorka', 'standard', false, null),
  ('Emmylou Harris', 'emmylou-harris', 'standard', false, null),
  ('The Head and the Heart', 'head-and-the-heart', 'standard', false, null),
  ('Wanda Jackson', 'wanda-jackson', 'standard', false, null),
  ('Pokey LaFarge', 'pokey-lafarge', 'standard', false, null),
  ('Amos Lee', 'amos-lee', 'standard', false, null),
  ('Middle Brother', 'middle-brother', 'standard', false, null),
  ('Mountain Man', 'mountain-man', 'standard', false, null),
  ('Ellis Paul', 'ellis-paul', 'standard', false, null),
  ('PS22 Chorus', 'ps22-chorus', 'standard', false, null),
  ('Liz Queler', 'liz-queler', 'standard', false, null),
  ('River City Extension', 'river-city-extension', 'standard', false, null),
  ('The Seeger Clogging All-Stars', 'seeger-clogging-all-stars', 'standard', false, null),
  ('The Secret Sisters', 'secret-sisters', 'standard', false, null),
  ('Earl Scruggs', 'earl-scruggs', 'standard', false, null),
  ('Mavis Staples', 'mavis-staples', 'standard', false, null),
  ('Tegan and Sara', 'tegan-and-sara', 'standard', false, null),
  ('Trampled by Turtles', 'trampled-by-turtles', 'standard', false, null),
  ('Typhoon', 'typhoon', 'standard', false, null),
  ('The Wailin'' Jennys', 'wailin-jennys', 'standard', false, null),
  ('M. Ward', 'm-ward', 'standard', false, null),
  ('Gillian Welch', 'gillian-welch', 'standard', false, null),
  ('What Cheer? Brigade', 'what-cheer-brigade', 'standard', false, null),
  ('Dar Williams', 'dar-williams', 'standard', false, null),
  ('Chris Thile', 'chris-thile', 'surprise', true, null),
  ('Emmylou Harris', 'emmylou-harris-2', 'surprise', true, null),
  ('David Rawlings', 'david-rawlings', 'surprise', true, null),
  ('Gillian Welch', 'gillian-welch-2', 'surprise', true, null),
  ('Jonny Corndawg', 'jonny-corndawg', 'surprise', true, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 2011
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 2012
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Alabama Shakes', 'alabama-shakes', 'standard', false, null),
  ('The Apache Relay', 'apache-relay', 'standard', false, null),
  ('The Berklee City Music Choir', 'berklee-city-music-choir', 'standard', false, null),
  ('Blind Pilot', 'blind-pilot', 'standard', false, null),
  ('Charles Bradley', 'charles-bradley', 'standard', false, null),
  ('Carl Broemel', 'carl-broemel', 'standard', false, null),
  ('Brown Bird', 'brown-bird', 'standard', false, null),
  ('Jackson Browne', 'jackson-browne', 'standard', false, null),
  ('City and Colour', 'city-and-colour', 'standard', false, null),
  ('Gary Clark Jr', 'gary-clark-jr', 'standard', false, null),
  ('Jonny Corndawg', 'jonny-corndawg', 'standard', false, null),
  ('Dawes', 'dawes', 'standard', false, null),
  ('The Deep Dark Woods', 'deep-dark-woods', 'standard', false, null),
  ('Deer Tick', 'deer-tick', 'standard', false, null),
  ('Robert Ellis', 'robert-ellis', 'standard', false, null),
  ('Frank Fairfield', 'frank-fairfield', 'standard', false, null),
  ('First Aid Kit', 'first-aid-kit', 'standard', false, null),
  ('Joe Fletcher and the Wrong Reasons', 'joe-fletcher-and-the-wrong-reasons', 'standard', false, null),
  ('Patty Griffin', 'patty-griffin', 'standard', false, null),
  ('Guthrie Family Reunion with Arlo Guthrie', 'guthrie-family-reunion-with-arlo-guthrie', 'standard', false, null),
  ('The Head and the Heart', 'head-and-the-heart', 'standard', false, null),
  ('Honeyhoney', 'honeyhoney', 'standard', false, null),
  ('Iron & Wine', 'iron-and-wine', 'standard', false, null),
  ('Spider John Koerner and His Rag Tag Boys', 'spider-john-koerner-and-his-rag-tag-boys', 'standard', false, null),
  ('Kossoy Sisters', 'kossoy-sisters', 'standard', false, null),
  ('New Multitudes (Jay Farrar, Jim James, Will Johnson, and Anders Parker)', 'new-multitudes-jay-farrar-jim-james-will-johnson-and-anders-', 'standard', false, null),
  ('Elizabeth Mitchell', 'elizabeth-mitchell', 'standard', false, null),
  ('Tom Morello', 'tom-morello', 'standard', false, null),
  ('My Morning Jacket', 'my-morning-jacket', 'standard', false, null),
  ('Conor Oberst', 'conor-oberst', 'standard', false, null),
  ('Of Monsters and Men', 'of-monsters-and-men', 'standard', false, null),
  ('Punch Brothers', 'punch-brothers', 'standard', false, null),
  ('Preservation Hall Jazz Band', 'preservation-hall-jazz-band', 'standard', false, null),
  ('Joel Rafael', 'joel-rafael', 'standard', false, null),
  ('Sleepy Man Banjo Boys', 'sleepy-man-banjo-boys', 'standard', false, null),
  ('Spirit Family Reunion', 'spirit-family-reunion', 'standard', false, null),
  ('The Tallest Man on Earth', 'tallest-man-on-earth', 'standard', false, null),
  ('Trampled by Turtles', 'trampled-by-turtles', 'standard', false, null),
  ('Tune-Yards', 'tune-yards', 'standard', false, null),
  ('Sara Watkins', 'sara-watkins', 'standard', false, null),
  ('Jonathan Wilson', 'jonathan-wilson', 'standard', false, null),
  ('Sharon Van Etten', 'sharon-van-etten', 'standard', false, null),
  ('Jackson Browne', 'jackson-browne-2', 'surprise', true, null),
  ('Tom Morello', 'tom-morello-2', 'surprise', true, null),
  ('First Aid Kit', 'first-aid-kit-2', 'surprise', true, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 2012
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 2013
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('The Avett Brothers', 'avett-brothers', 'standard', false, null),
  ('Rayland Baxter', 'rayland-baxter', 'standard', false, null),
  ('Beck', 'beck', 'standard', false, null),
  ('Berklee Gospel and Roots Choir', 'berklee-gospel-and-roots-choir', 'standard', false, null),
  ('Andrew Bird', 'andrew-bird', 'standard', false, null),
  ('Black Prairie', 'black-prairie', 'standard', false, null),
  ('Nicki Bluhm and the Gramblers', 'nicki-bluhm-and-the-gramblers', 'standard', false, null),
  ('Bombino', 'bombino', 'standard', false, null),
  ('Bonnie "Prince" Billy and Dawn McCarthy', 'bonnie-prince-billy-and-dawn-mccarthy', 'standard', false, null),
  ('Cold Specks', 'cold-specks', 'standard', false, null),
  ('Iris DeMent', 'iris-dement', 'standard', false, null),
  ('Justin Townes Earle', 'justin-townes-earle', 'standard', false, null),
  ('Feist', 'feist', 'standard', false, null),
  ('The Felice Brothers', 'felice-brothers', 'standard', false, null),
  ('Joe Fletcher', 'joe-fletcher', 'standard', false, null),
  ('Hey Marseilles', 'hey-marseilles', 'standard', false, null),
  ('Houndmouth', 'houndmouth', 'standard', false, null),
  ('Hurray for the Riff Raff', 'hurray-for-the-riff-raff', 'standard', false, null),
  ('Michael Hurley', 'michael-hurley', 'standard', false, null),
  ('Jason Isbell', 'jason-isbell', 'standard', false, null),
  ('Kingsley Flood', 'kingsley-flood', 'standard', false, null),
  ('Michael Kiwanuka', 'michael-kiwanuka', 'standard', false, null),
  ('Sarah Jarosz', 'sarah-jarosz', 'standard', false, null),
  ('Jim James', 'jim-james', 'standard', false, null),
  ('The Last Bison', 'last-bison', 'standard', false, null),
  ('Lord Huron', 'lord-huron', 'standard', false, null),
  ('The Low Anthem', 'low-anthem', 'standard', false, null),
  ('The Lumineers', 'lumineers', 'standard', false, null),
  ('John McCauley', 'john-mccauley', 'standard', false, null),
  ('JD McPherson', 'jd-mcpherson', 'standard', false, null),
  ('Colin Meloy', 'colin-meloy', 'standard', false, null),
  ('Tift Merritt', 'tift-merritt', 'standard', false, null),
  ('The Milk Carton Kids', 'milk-carton-kids', 'standard', false, null),
  ('Blake Mills', 'blake-mills', 'standard', false, null),
  ('Father John Misty', 'father-john-misty', 'standard', false, null),
  ('Elizabeth Mitchell', 'elizabeth-mitchell', 'standard', false, null),
  ('The Mountain Goats', 'mountain-goats', 'standard', false, null),
  ('Old Crow Medicine Show', 'old-crow-medicine-show', 'standard', false, null),
  ('Beth Orton', 'beth-orton', 'standard', false, null),
  ('Amanda Palmer', 'amanda-palmer', 'standard', false, null),
  ('Phosphorescent', 'phosphorescent', 'standard', false, null),
  ('Shovels & Rope', 'shovels-and-rope', 'standard', false, null),
  ('Langhorne Slim', 'langhorne-slim', 'standard', false, null),
  ('Spirit Family Reunion', 'spirit-family-reunion', 'standard', false, null),
  ('Trombone Shorty', 'trombone-shorty', 'standard', false, null),
  ('Frank Turner', 'frank-turner', 'standard', false, null),
  ('Wheeler Brothers', 'wheeler-brothers', 'standard', false, null),
  ('Ramblin'' Jack Elliott', 'ramblin-jack-elliott', 'surprise', true, null),
  ('Andrew Bird', 'andrew-bird-2', 'surprise', true, null),
  ('Chris Funk', 'chris-funk', 'surprise', true, null),
  ('Tift Merritt', 'tift-merritt-2', 'surprise', true, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 2013
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 2014
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Ryan Adams', 'ryan-adams', 'standard', false, null),
  ('Ages and Ages', 'ages-and-ages', 'standard', false, null),
  ('Band of Horses', 'band-of-horses', 'standard', false, null),
  ('Benjamin Booker', 'benjamin-booker', 'standard', false, null),
  ('Berklee Gospel and Roots Choir', 'berklee-gospel-and-roots-choir', 'standard', false, null),
  ('Jimmy Cliff', 'jimmy-cliff', 'standard', false, null),
  ('Dawes', 'dawes', 'standard', false, null),
  ('Death Vessel', 'death-vessel', 'standard', false, null),
  ('Deer Tick', 'deer-tick', 'standard', false, null),
  ('The Deslondes', 'deslondes', 'standard', false, null),
  ('The Devil Makes Three', 'devil-makes-three', 'standard', false, null),
  ('Shakey Graves', 'shakey-graves', 'standard', false, null),
  ('Noah Gundersen', 'noah-gundersen', 'standard', false, null),
  ('The Haden Triplets', 'haden-triplets', 'standard', false, null),
  ('Houndmouth', 'houndmouth', 'standard', false, null),
  ('Hozier', 'hozier', 'standard', false, null),
  ('Robert Hunter', 'robert-hunter', 'standard', false, null),
  ('Hurray for the Riff Raff', 'hurray-for-the-riff-raff', 'standard', false, null),
  ('Gregory Alan Isakov', 'gregory-alan-isakov', 'standard', false, null),
  ('Valerie June', 'valerie-june', 'standard', false, null),
  ('Pokey LaFarge', 'pokey-lafarge', 'standard', false, null),
  ('Lake Street Dive', 'lake-street-dive', 'standard', false, null),
  ('Jenny Lewis', 'jenny-lewis', 'standard', false, null),
  ('The Lonesome Trio', 'lonesome-trio', 'standard', false, null),
  ('Lucero', 'lucero', 'standard', false, null),
  ('Lucius', 'lucius', 'standard', false, null),
  ('Mandolin Orange', 'mandolin-orange', 'standard', false, null),
  ('The Milk Carton Kids', 'milk-carton-kids', 'standard', false, null),
  ('Anaïs Mitchell and Jefferson Hamer', 'anais-mitchell-and-jefferson-hamer', 'standard', false, null),
  ('Nickel Creek', 'nickel-creek', 'standard', false, null),
  ('Conor Oberst', 'conor-oberst', 'standard', false, null),
  ('Aoife O''Donovan', 'aoife-odonovan', 'standard', false, null),
  ('The Oh Hellos', 'oh-hellos', 'standard', false, null),
  ('Phox', 'phox', 'standard', false, null),
  ('Puss n Boots', 'puss-n-boots', 'standard', false, null),
  ('John C. Reilly', 'john-c-reilly', 'standard', false, null),
  ('Reignwolf', 'reignwolf', 'standard', false, null),
  ('Rodrigo y Gabriela', 'rodrigo-y-gabriela', 'standard', false, null),
  ('Caitlin Rose', 'caitlin-rose', 'standard', false, null),
  ('Shovels & Rope', 'shovels-and-rope', 'standard', false, null),
  ('Mavis Staples', 'mavis-staples', 'standard', false, null),
  ('Sun Kil Moon', 'sun-kil-moon', 'standard', false, null),
  ('Tall Tall Trees', 'tall-tall-trees', 'standard', false, null),
  ('Thao & The Get Down Stay Down', 'thao-and-the-get-down-stay-down', 'standard', false, null),
  ('Jeff Tweedy', 'jeff-tweedy', 'standard', false, null),
  ('Kurt Vile and the Violators', 'kurt-vile-and-the-violators', 'standard', false, null),
  ('Leif Vollebekk', 'leif-vollebekk', 'standard', false, null),
  ('J Roddy Walston and the Business', 'j-roddy-walston-and-the-business', 'standard', false, null),
  ('Willie Watson', 'willie-watson', 'standard', false, null),
  ('Jack White', 'jack-white', 'standard', false, null),
  ('Pegi Young and the Survivors', 'pegi-young-and-the-survivors', 'standard', false, null),
  ('Norah Jones', 'norah-jones', 'surprise', true, null),
  ('Trampled by Turtles', 'trampled-by-turtles', 'surprise', true, null),
  ('Taylor Goldsmith', 'taylor-goldsmith', 'surprise', true, null),
  ('Spooner Oldham', 'spooner-oldham', 'surprise', true, null),
  ('Lucius', 'lucius-2', 'surprise', true, null),
  ('Jeff Tweedy', 'jeff-tweedy-2', 'surprise', true, null),
  ('Mavis Staples', 'mavis-staples-2', 'surprise', true, null),
  ('The Deslondes', 'deslondes-2', 'surprise', true, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 2014
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 2015
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Courtney Barnett', 'courtney-barnett', 'standard', false, null),
  ('Jon Batiste', 'jon-batiste', 'standard', false, null),
  ('Leon Bridges', 'leon-bridges', 'standard', false, null),
  ('Calexico', 'calexico', 'standard', false, null),
  ('Brandi Carlile', 'brandi-carlile', 'standard', false, null),
  ('The Decemberists', 'decemberists', 'standard', false, null),
  ('Brian Fallon', 'brian-fallon', 'standard', false, null),
  ('The Felice Brothers', 'felice-brothers', 'standard', false, null),
  ('First Aid Kit', 'first-aid-kit', 'standard', false, null),
  ('Béla Fleck and Abigail Washburn', 'bela-fleck-and-abigail-washburn', 'standard', false, null),
  ('José González', 'jose-gonzalez', 'standard', false, null),
  ('Shakey Graves', 'shakey-graves', 'standard', false, null),
  ('Robyn Hitchcock', 'robyn-hitchcock', 'standard', false, null),
  ('Hiss Golden Messenger', 'hiss-golden-messenger', 'standard', false, null),
  ('Hozier', 'hozier', 'standard', false, null),
  ('Lord Huron', 'lord-huron', 'standard', false, null),
  ('Jason Isbell', 'jason-isbell', 'standard', false, null),
  ('Iron & Wine and Ben Bridwell', 'iron-and-wine-and-ben-bridwell', 'standard', false, null),
  ('The Lone Bellow', 'lone-bellow', 'standard', false, null),
  ('Laura Marling', 'laura-marling', 'standard', false, null),
  ('J Mascis', 'j-mascis', 'standard', false, null),
  ('My Morning Jacket', 'my-morning-jacket', 'standard', false, null),
  ('Angel Olsen', 'angel-olsen', 'standard', false, null),
  ('Preservation Hall Jazz Band', 'preservation-hall-jazz-band', 'standard', false, null),
  ('Joe Pug', 'joe-pug', 'standard', false, null),
  ('Nathaniel Rateliff and the Night Sweats', 'nathaniel-rateliff-and-the-night-sweats', 'standard', false, null),
  ('Langhorne Slim', 'langhorne-slim', 'standard', false, null),
  ('Spirit Family Reunion', 'spirit-family-reunion', 'standard', false, null),
  ('Sturgill Simpson', 'sturgill-simpson', 'standard', false, null),
  ('Sufjan Stevens', 'sufjan-stevens', 'standard', false, null),
  ('Tommy Stinson', 'tommy-stinson', 'standard', false, null),
  ('The Tallest Man on Earth', 'tallest-man-on-earth', 'standard', false, null),
  ('James Taylor', 'james-taylor', 'standard', false, null),
  ('Madisen Ward and the Mama Bear', 'madisen-ward-and-the-mama-bear', 'standard', false, null),
  ('Roger Waters', 'roger-waters', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 2015
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 2016
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Ryan Adams', 'ryan-adams', 'standard', false, null),
  ('Alabama Shakes', 'alabama-shakes', 'standard', false, null),
  ('Ruby Amanfu', 'ruby-amanfu', 'standard', false, null),
  ('The Arcs', 'arcs', 'standard', false, null),
  ('Julien Baker', 'julien-baker', 'standard', false, null),
  ('Rayland Baxter', 'rayland-baxter', 'standard', false, null),
  ('Basia Bulat', 'basia-bulat', 'standard', false, null),
  ('case/lang/veirs', 'case-lang-veirs', 'standard', false, null),
  ('Elvis Costello', 'elvis-costello', 'standard', false, null),
  ('Brett Dennen', 'brett-dennen', 'standard', false, null),
  ('Brian Fallon', 'brian-fallon', 'standard', false, null),
  ('Flight of the Conchords', 'flight-of-the-conchords', 'standard', false, null),
  ('Frightened Rabbit', 'frightened-rabbit', 'standard', false, null),
  ('Fruit Bats', 'fruit-bats', 'standard', false, null),
  ('Glen Hansard', 'glen-hansard', 'standard', false, null),
  ('Norah Jones', 'norah-jones', 'standard', false, null),
  ('Lady Lamb', 'lady-lamb', 'standard', false, null),
  ('Ray LaMontagne', 'ray-lamontagne', 'standard', false, null),
  ('Del McCoury', 'del-mccoury', 'standard', false, null),
  ('David Grisman', 'david-grisman', 'standard', false, null),
  ('Middle Brother', 'middle-brother', 'standard', false, null),
  ('Father John Misty', 'father-john-misty', 'standard', false, null),
  ('John Moreland', 'john-moreland', 'standard', false, null),
  ('Graham Nash', 'graham-nash', 'standard', false, null),
  ('Aoife O''Donovan', 'aoife-odonovan', 'standard', false, null),
  ('Preservation Hall Jazz Band', 'preservation-hall-jazz-band', 'standard', false, null),
  ('Margo Price', 'margo-price', 'standard', false, null),
  ('Nathaniel Rateliff and the Night Sweats', 'nathaniel-rateliff-and-the-night-sweats', 'standard', false, null),
  ('Raury', 'raury', 'standard', false, null),
  ('River Whyless', 'river-whyless', 'standard', false, null),
  ('Edward Sharpe and the Magnetic Zeros', 'edward-sharpe-and-the-magnetic-zeros', 'standard', false, null),
  ('Patti Smith', 'patti-smith', 'standard', false, null),
  ('Songhoy Blues', 'songhoy-blues', 'standard', false, null),
  ('The Strumbellas', 'strumbellas', 'standard', false, null),
  ('The Texas Gentlemen', 'texas-gentlemen', 'standard', false, null),
  ('Joe Ely', 'joe-ely', 'surprise', true, null),
  ('Kris Kristofferson', 'kris-kristofferson', 'surprise', true, null),
  ('Violent Femmes', 'violent-femmes', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 2016
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 2017
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('The Avett Brothers', 'avett-brothers', 'standard', false, null),
  ('Big Thief', 'big-thief', 'standard', false, null),
  ('Billy Bragg', 'billy-bragg', 'standard', false, null),
  ('Joe Henry', 'joe-henry', 'standard', false, null),
  ('Chicano Batman', 'chicano-batman', 'standard', false, null),
  ('Dr. Dog', 'dr-dog', 'standard', false, null),
  ('Drive-By Truckers', 'drive-by-truckers', 'standard', false, null),
  ('Rhiannon Giddens', 'rhiannon-giddens', 'standard', false, null),
  ('Ben Gibbard', 'ben-gibbard', 'standard', false, null),
  ('Margaret Glaspy', 'margaret-glaspy', 'standard', false, null),
  ('Grandma''s Hands Band', 'grandmas-hands-band', 'standard', false, null),
  ('Natalie Prass', 'natalie-prass', 'surprise', true, null),
  ('Patterson Hood', 'patterson-hood', 'surprise', true, null),
  ('Hiss Golden Messenger', 'hiss-golden-messenger', 'surprise', true, null),
  ('Hurray for the Riff Raff', 'hurray-for-the-riff-raff', 'standard', false, null),
  ('I''m with Her', 'im-with-her', 'standard', false, null),
  ('Julia Jacklin', 'julia-jacklin', 'standard', false, null),
  ('Fleet Foxes', 'fleet-foxes', 'standard', false, null),
  ('Michael Kiwanuka', 'michael-kiwanuka', 'standard', false, null),
  ('Jim James', 'jim-james', 'standard', false, null),
  ('Mandolin Orange', 'mandolin-orange', 'standard', false, null),
  ('Offa Rex', 'offa-rex', 'standard', false, null),
  ('Angel Olsen', 'angel-olsen', 'standard', false, null),
  ('Pinegrove', 'pinegrove', 'standard', false, null),
  ('John Prine', 'john-prine', 'standard', false, null),
  ('Roger Waters', 'roger-waters', 'surprise', true, null),
  ('Lucius', 'lucius', 'surprise', true, null),
  ('Shovels & Rope', 'shovels-and-rope', 'standard', false, null),
  ('Regina Spektor', 'regina-spektor', 'standard', false, null),
  ('Suzanne Vega', 'suzanne-vega', 'standard', false, null),
  ('John Paul White', 'john-paul-white', 'standard', false, null),
  ('Whitney', 'whitney', 'standard', false, null),
  ('Wilco', 'wilco', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 2017
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 2018
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Nicole Atkins', 'nicole-atkins', 'standard', false, null),
  ('Courtney Barnett', 'courtney-barnett', 'standard', false, null),
  ('Jon Batiste and the Dap-Kings', 'jon-batiste-and-the-dap-kings', 'standard', false, null),
  ('Phoebe Bridgers', 'phoebe-bridgers', 'standard', false, null),
  ('Brandi Carlile', 'brandi-carlile', 'standard', false, null),
  ('Cheech & Chong', 'cheech-and-chong', 'standard', false, null),
  ('Gary Clark Jr.', 'gary-clark-jr', 'standard', false, null),
  ('Nels Cline', 'nels-cline', 'standard', false, null),
  ('Jen Cloher', 'jen-cloher', 'standard', false, null),
  ('Fantastic Negrito', 'fantastic-negrito', 'standard', false, null),
  ('Shakey Graves', 'shakey-graves', 'standard', false, null),
  ('Ben Harper', 'ben-harper', 'standard', false, null),
  ('Charlie Musselwhite', 'charlie-musselwhite', 'standard', false, null),
  ('Curtis Harding', 'curtis-harding', 'standard', false, null),
  ('Hiss Golden Messenger', 'hiss-golden-messenger', 'standard', false, null),
  ('Glen Hansard', 'glen-hansard', 'standard', false, null),
  ('Jason Isbell & The 400 Unit', 'jason-isbell-and-the-400-unit', 'standard', false, null),
  ('David Crosby', 'david-crosby', 'surprise', true, null),
  ('Valerie June', 'valerie-june', 'standard', false, null),
  ('Hamilton Leithauser', 'hamilton-leithauser', 'standard', false, null),
  ('Rostam', 'rostam', 'standard', false, null),
  ('The Lone Bellow', 'lone-bellow', 'standard', false, null),
  ('Low Cut Connie', 'low-cut-connie', 'standard', false, null),
  ('Lucius', 'lucius', 'standard', false, null),
  ('JD McPherson', 'jd-mcpherson', 'standard', false, null),
  ('Mumford & Sons', 'mumford-and-sons', 'standard', false, null),
  ('Lukas Nelson & Promise of the Real', 'lukas-nelson-and-promise-of-the-real', 'standard', false, null),
  ('Margo Price', 'margo-price', 'standard', false, null),
  ('Passenger', 'passenger', 'standard', false, null),
  ('Preservation Hall Jazz Band', 'preservation-hall-jazz-band', 'standard', false, null),
  ('Amanda Shires', 'amanda-shires', 'standard', false, null),
  ('Sturgill Simpson', 'sturgill-simpson', 'standard', false, null),
  ('Langhorne Slim', 'langhorne-slim', 'standard', false, null),
  ('St. Vincent', 'st-vincent', 'standard', false, null),
  ('Moses Sumney', 'moses-sumney', 'standard', false, null),
  ('Tank and the Bangas', 'tank-and-the-bangas', 'standard', false, null),
  ('This Is the Kit', 'this-is-the-kit', 'standard', false, null),
  ('Toots and the Maytals', 'toots-and-the-maytals', 'standard', false, null),
  ('Tuck & Patti', 'tuck-and-patti', 'standard', false, null),
  ('Mavis Staples', 'mavis-staples', 'surprise', true, null),
  ('Maggie Rogers', 'maggie-rogers', 'surprise', true, null),
  ('Jerry Douglas', 'jerry-douglas', 'surprise', true, null),
  ('Phil Cook', 'phil-cook', 'surprise', true, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 2018
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 2019
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Trey Anastasio', 'trey-anastasio', 'standard', false, null),
  ('Courtney Marie Andrews', 'courtney-marie-andrews', 'standard', false, null),
  ('Rayland Baxter', 'rayland-baxter', 'standard', false, null),
  ('Jade Bird', 'jade-bird', 'standard', false, null),
  ('Bonny Light Horseman', 'bonny-light-horseman', 'standard', false, null),
  ('Cedric Burnside', 'cedric-burnside', 'standard', false, null),
  ('John Cohen', 'john-cohen', 'standard', false, null),
  ('Judy Collins', 'judy-collins', 'standard', false, null),
  ('Liz Cooper & The Stampede', 'liz-cooper-and-the-stampede', 'standard', false, null),
  ('Charley Crockett', 'charley-crockett', 'standard', false, null),
  ('Sheryl Crow', 'sheryl-crow', 'standard', false, null),
  ('Dawes', 'dawes', 'standard', false, null),
  ('The Down Hill Strugglers', 'down-hill-strugglers', 'standard', false, null),
  ('Lucy Dacus', 'lucy-dacus', 'standard', false, null),
  ('Ramblin'' Jack Elliott', 'ramblin-jack-elliott', 'standard', false, null),
  ('Alice Gerrard', 'alice-gerrard', 'standard', false, null),
  ('Warren Haynes', 'warren-haynes', 'standard', false, null),
  ('Ari Hest', 'ari-hest', 'standard', false, null),
  ('Haley Heynderickx', 'haley-heynderickx', 'standard', false, null),
  ('The Highwomen', 'highwomen', 'standard', false, null),
  ('Hozier', 'hozier', 'standard', false, null),
  ('I''m with Her', 'im-with-her', 'standard', false, null),
  ('The Infamous Stringdusters', 'infamous-stringdusters', 'standard', false, null),
  ('Gregory Alan Isakov', 'gregory-alan-isakov', 'standard', false, null),
  ('Jupiter & Okwess', 'jupiter-and-okwess', 'standard', false, null),
  ('Lake Street Dive', 'lake-street-dive', 'standard', false, null),
  ('Phil Lesh', 'phil-lesh', 'standard', false, null),
  ('Kermit the Frog', 'kermit-the-frog', 'standard', false, null),
  ('Jim James', 'jim-james', 'surprise', true, null),
  ('Janet Weiss', 'janet-weiss', 'surprise', true, null),
  ('Stephen Marley', 'stephen-marley', 'standard', false, null),
  ('Angie McMahon', 'angie-mcmahon', 'standard', false, null),
  ('The Milk Carton Kids', 'milk-carton-kids', 'standard', false, null),
  ('Parker Millsap', 'parker-millsap', 'standard', false, null),
  ('Kevin Morby', 'kevin-morby', 'standard', false, null),
  ('Mountain Man', 'mountain-man', 'standard', false, null),
  ('Kacey Musgraves', 'kacey-musgraves', 'standard', false, null),
  ('Lukas Nelson & Promise of the Real', 'lukas-nelson-and-promise-of-the-real', 'standard', false, null),
  ('Noname', 'noname', 'standard', false, null),
  ('J.S. Ondara', 'js-ondara', 'standard', false, null),
  ('Our Native Daughters', 'our-native-daughters', 'standard', false, null),
  ('Dolly Parton', 'dolly-parton', 'surprise', true, null),
  ('Phosphorescent', 'phosphorescent', 'standard', false, null),
  ('Portugal. The Man', 'portugal-the-man', 'standard', false, null),
  ('Preservation Hall Jazz Band', 'preservation-hall-jazz-band', 'standard', false, null),
  ('Erin Rae', 'erin-rae', 'standard', false, null),
  ('Amy Ray', 'amy-ray', 'standard', false, null),
  ('Maggie Rogers', 'maggie-rogers', 'standard', false, null),
  ('Todd Snider', 'todd-snider', 'standard', false, null),
  ('Billy Strings', 'billy-strings', 'standard', false, null),
  ('Molly Tuttle', 'molly-tuttle', 'standard', false, null),
  ('Susto', 'susto', 'standard', false, null),
  ('Benmont Tench', 'benmont-tench', 'standard', false, null),
  ('Jeff Tweedy', 'jeff-tweedy', 'standard', false, null),
  ('Adia Victoria', 'adia-victoria', 'standard', false, null),
  ('Nilüfer Yanya', 'nilufer-yanya', 'standard', false, null),
  ('Yola', 'yola', 'standard', false, null),
  ('James Taylor', 'james-taylor', 'surprise', true, null),
  ('Jason Isbell', 'jason-isbell', 'surprise', true, null),
  ('Linda Perry', 'linda-perry', 'surprise', true, null),
  ('Mavis Staples', 'mavis-staples', 'surprise', true, null),
  ('Robin Pecknold', 'robin-pecknold', 'surprise', true, null),
  ('James Mercer', 'james-mercer', 'surprise', true, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 2019
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

commit;
-- Historical sets+performances for the 2020s
begin;

-- 2021
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Courtney Marie Andrews', 'courtney-marie-andrews', 'standard', false, null),
  ('Fred Armisen', 'fred-armisen', 'standard', false, null),
  ('Julien Baker', 'julien-baker', 'standard', false, null),
  ('Beck', 'beck', 'standard', false, null),
  ('Andrew Bird', 'andrew-bird', 'standard', false, null),
  ('Jimbo Mathus', 'jimbo-mathus', 'standard', false, null),
  ('Bleachers', 'bleachers', 'standard', false, null),
  ('Bonny Light Horseman', 'bonny-light-horseman', 'standard', false, null),
  ('Brothers of a Feather', 'brothers-of-a-feather', 'standard', false, null),
  ('Tré Burt', 'tre-burt', 'standard', false, null),
  ('Caamp', 'caamp', 'standard', false, null),
  ('Celisse', 'celisse', 'standard', false, null),
  ('Lucy Dacus', 'lucy-dacus', 'standard', false, null),
  ('Deer Tick', 'deer-tick', 'standard', false, null),
  ('Dimmer Twins', 'dimmer-twins', 'standard', false, null),
  ('Early James', 'early-james', 'standard', false, null),
  ('Fruit Bats', 'fruit-bats', 'standard', false, null),
  ('Ben Gibbard', 'ben-gibbard', 'standard', false, null),
  ('Devon Gilfillian', 'devon-gilfillian', 'standard', false, null),
  ('S.G. Goodman', 'sg-goodman', 'standard', false, null),
  ('Steve Gunn', 'steve-gunn', 'standard', false, null),
  ('Natalie Hemby', 'natalie-hemby', 'standard', false, null),
  ('Hiss Golden Messenger', 'hiss-golden-messenger', 'standard', false, null),
  ('Ida Mae', 'ida-mae', 'standard', false, null),
  ('The Marcus King Band', 'marcus-king-band', 'standard', false, null),
  ('Lake Street Dive', 'lake-street-dive', 'standard', false, null),
  ('Black Joe Lewis', 'black-joe-lewis', 'standard', false, null),
  ('Middle Brother', 'middle-brother', 'standard', false, null),
  ('Kevin Morby', 'kevin-morby', 'standard', false, null),
  ('Randy Newman', 'randy-newman', 'standard', false, null),
  ('Aoife O''Donovan', 'aoife-odonovan', 'standard', false, null),
  ('Joy Oladokun', 'joy-oladokun', 'standard', false, null),
  ('Grace Potter', 'grace-potter', 'standard', false, null),
  ('Margo Price', 'margo-price', 'standard', false, null),
  ('Katie Pruitt', 'katie-pruitt', 'standard', false, null),
  ('Erin Rae', 'erin-rae', 'standard', false, null),
  ('Haley Heynderickx', 'haley-heynderickx', 'surprise', true, null),
  ('MC Taylor', 'mc-taylor', 'surprise', true, null),
  ('Nathaniel Rateliff and the Night Sweats', 'nathaniel-rateliff-and-the-night-sweats', 'standard', false, null),
  ('Resistance Revival Chorus', 'resistance-revival-chorus', 'standard', false, null),
  ('Allison Russell', 'allison-russell', 'standard', false, null),
  ('Chaka Khan', 'chaka-khan', 'surprise', true, null),
  ('Amythyst Kiah', 'amythyst-kiah', 'surprise', true, null),
  ('Jonathan Russell', 'jonathan-russell', 'standard', false, null),
  ('Langhorne Slim', 'langhorne-slim', 'standard', false, null),
  ('Billy Strings', 'billy-strings', 'standard', false, null),
  ('Emma Swift', 'emma-swift', 'standard', false, null),
  ('Chris Thile', 'chris-thile', 'standard', false, null),
  ('Vagabon', 'vagabon', 'standard', false, null),
  ('Sharon Van Etten', 'sharon-van-etten', 'standard', false, null),
  ('Sunny War', 'sunny-war', 'standard', false, null),
  ('Watchhouse', 'watchhouse', 'standard', false, null),
  ('Waxahatchee', 'waxahatchee', 'standard', false, null),
  ('Yasmin Williams', 'yasmin-williams', 'standard', false, null),
  ('Yola', 'yola', 'standard', false, null),
  ('Brandi Carlile', 'brandi-carlile', 'surprise', true, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 2021
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 2022
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('The A''s', 'as', 'standard', false, null),
  ('Arooj Aftab', 'arooj-aftab', 'standard', false, null),
  ('Nathaniel Rateliff and the Night Sweats', 'nathaniel-rateliff-and-the-night-sweats', 'standard', false, null),
  ('Courtney Marie Andrews', 'courtney-marie-andrews', 'surprise', true, null),
  ('Lee Fields', 'lee-fields', 'surprise', true, null),
  ('Lucius', 'lucius', 'surprise', true, null),
  ('Natalie Merchant', 'natalie-merchant', 'surprise', true, null),
  ('Midlake', 'midlake', 'surprise', true, null),
  ('Marcus Mumford', 'marcus-mumford', 'surprise', true, null),
  ('Lukas Nelson', 'lukas-nelson', 'surprise', true, null),
  ('The Silk Road Ensemble', 'silk-road-ensemble', 'surprise', true, null),
  ('Paul Simon', 'paul-simon', 'surprise', true, null),
  ('Adia Victoria', 'adia-victoria', 'surprise', true, null),
  ('The Backseat Lovers', 'backseat-lovers', 'standard', false, null),
  ('The Ballroom Thieves', 'ballroom-thieves', 'standard', false, null),
  ('Courtney Barnett', 'courtney-barnett', 'standard', false, null),
  ('Black Opry Revue', 'black-opry-revue', 'standard', false, null),
  ('Bleachers', 'bleachers', 'standard', false, null),
  ('Carm', 'carm', 'standard', false, null),
  ('Clairo', 'clairo', 'standard', false, null),
  ('Phil Cook''s Love Will Go All the Way: A Spiritual Helpline Gospel Revue', 'phil-cooks-love-will-go-all-the-way-a-spiritual-helpline-gos', 'standard', false, null),
  ('John Craigie', 'john-craigie', 'standard', false, null),
  ('Lucy Dacus', 'lucy-dacus', 'standard', false, null),
  ('DakhaBrakha', 'dakhabrakha', 'standard', false, null),
  ('The Dead Tongues', 'dead-tongues', 'standard', false, null),
  ('Madi Diaz', 'madi-diaz', 'standard', false, null),
  ('Dinosaur Jr.', 'dinosaur-jr', 'standard', false, null),
  ('The Felice Brothers', 'felice-brothers', 'standard', false, null),
  ('Sierra Ferrell', 'sierra-ferrell', 'standard', false, null),
  ('Lee Fields', 'lee-fields-2', 'standard', false, null),
  ('Béla Fleck', 'bela-fleck', 'standard', false, null),
  ('Sam Bush', 'sam-bush', 'surprise', true, null),
  ('Jerry Douglas', 'jerry-douglas', 'surprise', true, null),
  ('Bendigo Fletcher', 'bendigo-fletcher', 'standard', false, null),
  ('Neal Francis', 'neal-francis', 'standard', false, null),
  ('Hannah Georgas', 'hannah-georgas', 'standard', false, null),
  ('Taylor Goldsmith', 'taylor-goldsmith', 'standard', false, null),
  ('Goose', 'goose', 'standard', false, null),
  ('Hermanos Gutiérrez', 'hermanos-gutierrez', 'standard', false, null),
  ('Hurray for the Riff Raff', 'hurray-for-the-riff-raff', 'standard', false, null),
  ('Japanese Breakfast', 'japanese-breakfast', 'standard', false, null),
  ('Cassandra Jenkins', 'cassandra-jenkins', 'standard', false, null),
  ('Valerie June', 'valerie-june', 'standard', false, null),
  ('The Linda Lindas', 'linda-lindas', 'standard', false, null),
  ('Lucius', 'lucius-2', 'standard', false, null),
  ('Taj Mahal', 'taj-mahal', 'standard', false, null),
  ('Árný Margrét', 'arny-margret', 'standard', false, null),
  ('Midlake', 'midlake-2', 'standard', false, null),
  ('Blake Mills', 'blake-mills', 'standard', false, null),
  ('Anaïs Mitchell', 'anais-mitchell', 'standard', false, null),
  ('Joni Mitchell', 'joni-mitchell', 'surprise', true, null),
  ('Brandi Carlile', 'brandi-carlile', 'surprise', true, null),
  ('John Moreland', 'john-moreland', 'standard', false, null),
  ('Maren Morris', 'maren-morris', 'standard', false, null),
  ('The National', 'national', 'standard', false, null),
  ('Buffalo Nichols', 'buffalo-nichols', 'standard', false, null),
  ('Joy Oladokun', 'joy-oladokun', 'standard', false, null),
  ('The Roots', 'roots', 'standard', false, null),
  ('Leith Ross', 'leith-ross', 'standard', false, null),
  ('The Silk Road Ensemble', 'silk-road-ensemble-2', 'standard', false, null),
  ('Rhiannon Giddens', 'rhiannon-giddens', 'surprise', true, null),
  ('Langhorne Slim', 'langhorne-slim', 'standard', false, null),
  ('Skullcrusher', 'skullcrusher', 'standard', false, null),
  ('Sylvan Esso', 'sylvan-esso', 'standard', false, null),
  ('Faye Webster', 'faye-webster', 'standard', false, null),
  ('Adia Victoria', 'adia-victoria-2', 'standard', false, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 2022
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 2023
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Abraham Alexander', 'abraham-alexander', 'standard', false, null),
  ('The Backseat Lovers', 'backseat-lovers', 'standard', false, null),
  ('Jon Batiste', 'jon-batiste', 'standard', false, null),
  ('The Beths', 'beths', 'standard', false, null),
  ('Black Opry Revue', 'black-opry-revue', 'standard', false, null),
  ('Dan Blakeslee', 'dan-blakeslee', 'standard', false, null),
  ('Caamp', 'caamp', 'standard', false, null),
  ('Willi Carlisle', 'willi-carlisle', 'standard', false, null),
  ('Madison Cunningham', 'madison-cunningham', 'standard', false, null),
  ('Indigo De Souza', 'indigo-de-souza', 'standard', false, null),
  ('Lana Del Rey', 'lana-del-rey', 'standard', false, null),
  ('The Earls of Leicester', 'earls-of-leicester', 'standard', false, null),
  ('Eastern Medicine Singers', 'eastern-medicine-singers', 'standard', false, null),
  ('Yonatan Gat', 'yonatan-gat', 'surprise', true, null),
  ('Lee Ranaldo', 'lee-ranaldo', 'surprise', true, null),
  ('Free Range', 'free-range', 'standard', false, null),
  ('Ron Gallo', 'ron-gallo', 'standard', false, null),
  ('Goose', 'goose', 'standard', false, null),
  ('The Harlem Gospel Travelers', 'harlem-gospel-travelers', 'standard', false, null),
  ('The Heavy Heavy', 'heavy-heavy', 'standard', false, null),
  ('The Hold Steady', 'hold-steady', 'standard', false, null),
  ('The Huntress and Holder of Hands', 'huntress-and-holder-of-hands', 'standard', false, null),
  ('Gregory Alan Isakov', 'gregory-alan-isakov', 'standard', false, null),
  ('Jason Isbell & The 400 Unit', 'jason-isbell-and-the-400-unit', 'standard', false, null),
  ('Jupiter & Okwess', 'jupiter-and-okwess', 'standard', false, null),
  ('Laden Valley', 'laden-valley', 'standard', false, null),
  ('Dawn Landes', 'dawn-landes', 'standard', false, null),
  ('Los Lobos', 'los-lobos', 'standard', false, null),
  ('Alice Phoebe Lou', 'alice-phoebe-lou', 'standard', false, null),
  ('Aimee Mann', 'aimee-mann', 'standard', false, null),
  ('Senora May', 'senora-may', 'standard', false, null),
  ('Mereba', 'mereba', 'standard', false, null),
  ('Mdou Moctar', 'mdou-moctar', 'standard', false, null),
  ('My Morning Jacket', 'my-morning-jacket', 'standard', false, null),
  ('Nanna', 'nanna', 'standard', false, null),
  ('Nickel Creek', 'nickel-creek', 'standard', false, null),
  ('John Oates', 'john-oates', 'standard', false, null),
  ('Guthrie Trapp', 'guthrie-trapp', 'standard', false, null),
  ('Angel Olsen', 'angel-olsen', 'standard', false, null),
  ('Peter One', 'peter-one', 'standard', false, null),
  ('Orchestra Gold', 'orchestra-gold', 'standard', false, null),
  ('Danielle Ponder', 'danielle-ponder', 'standard', false, null),
  ('Maggie Rogers', 'maggie-rogers', 'standard', false, null),
  ('Thee Sacred Souls', 'thee-sacred-souls', 'standard', false, null),
  ('Slaughter Beach, Dog', 'slaughter-beach-dog', 'standard', false, null),
  ('Bartees Strange', 'bartees-strange', 'standard', false, null),
  ('Billy Strings', 'billy-strings', 'standard', false, null),
  ('Sumbuck', 'sumbuck', 'standard', false, null),
  ('James Taylor', 'james-taylor', 'standard', false, null),
  ('Turnpike Troubadours', 'turnpike-troubadours', 'standard', false, null),
  ('M. Ward', 'm-ward', 'standard', false, null),
  ('Bella White', 'bella-white', 'standard', false, null),
  ('Remi Wolf', 'remi-wolf', 'standard', false, null),
  ('Jaime Wyatt', 'jaime-wyatt', 'standard', false, null),
  ('Jack Antonoff', 'jack-antonoff', 'surprise', true, null),
  ('Nikki Lane', 'nikki-lane', 'surprise', true, null),
  ('Neko Case', 'neko-case', 'surprise', true, null),
  ('Nels Cline', 'nels-cline', 'surprise', true, null),
  ('John McCauley', 'john-mccauley', 'surprise', true, null),
  ('Evan Felker', 'evan-felker', 'surprise', true, null),
  ('Craig Finn', 'craig-finn', 'surprise', true, null),
  ('Maggie Rogers', 'maggie-rogers-2', 'surprise', true, null),
  ('John Oates', 'john-oates-2', 'surprise', true, null),
  ('Animal (The Muppets)', 'animal-the-muppets', 'surprise', true, null),
  ('SistaStrings', 'sistastrings', 'surprise', true, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 2023
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 2024
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Joan Baez', 'joan-baez', 'standard', false, null),
  ('Beck', 'beck', 'standard', false, null),
  ('Bertha: Grateful Drag', 'bertha-grateful-drag', 'standard', false, null),
  ('Black Pumas', 'black-pumas', 'standard', false, null),
  ('Billy Bragg', 'billy-bragg', 'standard', false, null),
  ('Briscoe', 'briscoe', 'standard', false, null),
  ('Tré Burt', 'tre-burt', 'standard', false, null),
  ('Chaparelle', 'chaparelle', 'standard', false, null),
  ('John Craigie', 'john-craigie', 'standard', false, null),
  ('Langhorne Slim', 'langhorne-slim', 'standard', false, null),
  ('Madison Cunningham', 'madison-cunningham', 'standard', false, null),
  ('Andrew Bird', 'andrew-bird', 'standard', false, null),
  ('The Breeders', 'breeders', 'standard', false, null),
  ('De La Soul', 'de-la-soul', 'standard', false, null),
  ('Dropkick Murphys', 'dropkick-murphys', 'standard', false, null),
  ('Ocie Elliott', 'ocie-elliott', 'standard', false, null),
  ('Erin, Mat & Paul', 'erin-mat-and-paul', 'standard', false, null),
  ('Sierra Ferrell', 'sierra-ferrell', 'standard', false, null),
  ('Friko', 'friko', 'standard', false, null),
  ('Rhiannon Giddens', 'rhiannon-giddens', 'standard', false, null),
  ('Guster', 'guster', 'standard', false, null),
  ('Oliver Hazard', 'oliver-hazard', 'standard', false, null),
  ('Samm Henshaw', 'samm-henshaw', 'standard', false, null),
  ('Hermanos Gutiérrez', 'hermanos-gutierrez', 'standard', false, null),
  ('Brittany Howard', 'brittany-howard', 'standard', false, null),
  ('Hozier', 'hozier', 'standard', false, null),
  ('Killer Mike', 'killer-mike', 'standard', false, null),
  ('Number One Babe', 'number-one-babe', 'standard', false, null),
  ('Ariel Posen', 'ariel-posen', 'standard', false, null),
  ('Cory Wong', 'cory-wong', 'standard', false, null),
  ('Adrianne Lenker', 'adrianne-lenker', 'standard', false, null),
  ('Jobi Riccio', 'jobi-riccio', 'standard', false, null),
  ('La Lom', 'la-lom', 'standard', false, null),
  ('Buck Meek', 'buck-meek', 'standard', false, null),
  ('Gillian Welch & David Rawlings', 'gillian-welch-and-david-rawlings', 'standard', false, null),
  ('Mighty Poplar', 'mighty-poplar', 'standard', false, null),
  ('November Ultra', 'november-ultra', 'standard', false, null),
  ('Molly Tuttle & Golden Highway', 'molly-tuttle-and-golden-highway', 'standard', false, null),
  ('Orville Peck', 'orville-peck', 'standard', false, null),
  ('Palmyra', 'palmyra', 'standard', false, null),
  ('Sir Woman', 'sir-woman', 'standard', false, null),
  ('Reyna Tropical', 'reyna-tropical', 'standard', false, null),
  ('Shovels & Rope', 'shovels-and-rope', 'standard', false, null),
  ('Tinariwen', 'tinariwen', 'standard', false, null),
  ('Steve Poltz', 'steve-poltz', 'standard', false, null),
  ('Wednesday', 'wednesday', 'standard', false, null),
  ('Taj Mahal', 'taj-mahal', 'standard', false, null),
  ('Illiterate Light', 'illiterate-light', 'standard', false, null),
  ('Jack White', 'jack-white', 'surprise', true, null),
  ('Mavis Staples', 'mavis-staples', 'surprise', true, null),
  ('Joan Baez', 'joan-baez-2', 'surprise', true, null),
  ('Nathaniel Rateliff', 'nathaniel-rateliff', 'surprise', true, null),
  ('Nick Lowe', 'nick-lowe', 'surprise', true, null),
  ('Brittany Howard', 'brittany-howard-2', 'surprise', true, null),
  ('Langhorne Slim', 'langhorne-slim-2', 'surprise', true, null),
  ('Triumph the Insult Comic Dog', 'triumph-the-insult-comic-dog', 'surprise', true, null),
  ('Allison Russell', 'allison-russell', 'surprise', true, null),
  ('Madison Cunningham', 'madison-cunningham-2', 'surprise', true, null),
  ('Kaia Kater', 'kaia-kater', 'surprise', true, null),
  ('William Prince', 'william-prince', 'surprise', true, null),
  ('Wesley Schultz', 'wesley-schultz', 'surprise', true, null),
  ('Hozier', 'hozier-2', 'surprise', true, null),
  ('Gillian Welch', 'gillian-welch', 'surprise', true, null),
  ('John C. Reilly', 'john-c-reilly', 'surprise', true, null),
  ('Pharoahe Monch', 'pharoahe-monch', 'surprise', true, null),
  ('Craig Finn', 'craig-finn', 'surprise', true, null),
  ('Victor Wooten', 'victor-wooten', 'surprise', true, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 2024
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

-- 2025
insert into sets (event_id, billed_name, slug, set_kind, is_surprise, billed_artist_id)
select e.id, v.billed_name, v.slug, v.set_kind::set_kind, v.is_surprise, a.id
from (values
  ('Goose', 'goose', 'standard', false, null),
  ('Geese', 'geese', 'standard', false, null),
  ('Kenny Loggins', 'kenny-loggins', 'standard', false, null),
  ('MJ Lenderman', 'mj-lenderman', 'standard', false, null),
  ('Maren Morris', 'maren-morris', 'standard', false, null),
  ('Big Freedia', 'big-freedia', 'standard', false, null),
  ('Yeah Yeah Yeahs', 'yeah-yeah-yeahs', 'standard', false, null),
  ('Alex G', 'alex-g', 'standard', false, null),
  ('Kim Deal', 'kim-deal', 'standard', false, null),
  ('The Deslondes', 'deslondes', 'standard', false, null),
  ('Hannah Cohen', 'hannah-cohen', 'standard', false, null),
  ('Jessica Pratt', 'jessica-pratt', 'standard', false, null),
  ('Kevin Morby', 'kevin-morby', 'standard', false, null),
  ('Maggie Rose', 'maggie-rose', 'standard', false, null),
  ('S.G. Goodman', 'sg-goodman', 'standard', false, null),
  ('Tyler-James Kelly', 'tyler-james-kelly', 'standard', false, null),
  ('Lukas Nelson', 'lukas-nelson', 'standard', false, null),
  ('Luke Combs', 'luke-combs', 'standard', false, null),
  ('Bonny Light Horseman', 'bonny-light-horseman', 'standard', false, null),
  ('I''m With Her', 'im-with-her', 'standard', false, null),
  ('Waxahatchee', 'waxahatchee', 'standard', false, null),
  ('Dan Reeder', 'dan-reeder', 'standard', false, null),
  ('flipturn', 'flipturn', 'standard', false, null),
  ('Illiterate Light', 'illiterate-light', 'standard', false, null),
  ('Saya Gray', 'saya-gray', 'standard', false, null),
  ('Mon Rovîa', 'mon-rovia', 'standard', false, null),
  ('Mary Chapin Carpenter', 'mary-chapin-carpenter', 'standard', false, null),
  ('Jensen McRae', 'jensen-mcrae', 'standard', false, null),
  ('NOVA ONE', 'nova-one', 'standard', false, null),
  ('Phil Cook & The Union', 'phil-cook-and-the-union', 'standard', false, null),
  ('Richy Mitch & The Coal Miners', 'richy-mitch-and-the-coal-miners', 'standard', false, null),
  ('Tom Odell', 'tom-odell', 'standard', false, null),
  ('Remi Wolf', 'remi-wolf', 'standard', false, null),
  ('Obongjayar', 'obongjayar', 'standard', false, null),
  ('Tyler Ballgame', 'tyler-ballgame', 'standard', false, null),
  ('Lucius', 'lucius', 'standard', false, null),
  ('Margo Price', 'margo-price', 'standard', false, null),
  ('Jeff Tweedy', 'jeff-tweedy', 'standard', false, null),
  ('Mt. Joy', 'mt-joy', 'standard', false, null),
  ('BCUC', 'bcuc', 'standard', false, null),
  ('Dehd', 'dehd', 'standard', false, null),
  ('Hurray for the Riff Raff', 'hurray-for-the-riff-raff', 'standard', false, null),
  ('Michael Kiwanuka', 'michael-kiwanuka', 'standard', false, null),
  ('Stephen Wilson Jr.', 'stephen-wilson-jr', 'standard', false, null),
  ('Matt Berninger', 'matt-berninger', 'surprise', true, null),
  ('James Austin Johnson', 'james-austin-johnson', 'surprise', true, null),
  ('Nathaniel Rateliff', 'nathaniel-rateliff', 'surprise', true, null),
  ('Mavis Staples', 'mavis-staples', 'surprise', true, null),
  ('Tommy Prine', 'tommy-prine', 'surprise', true, null),
  ('Lukas Nelson', 'lukas-nelson-2', 'surprise', true, null),
  ('MJ Lenderman', 'mj-lenderman-2', 'surprise', true, null),
  ('Jeff Tweedy', 'jeff-tweedy-2', 'surprise', true, null),
  ('Saya Gray', 'saya-gray-2', 'surprise', true, null),
  ('Maren Morris', 'maren-morris-2', 'surprise', true, null),
  ('John C. Reilly', 'john-c-reilly', 'surprise', true, null),
  ('slimdan', 'slimdan', 'surprise', true, null),
  ('Adam Melchor', 'adam-melchor', 'surprise', true, null),
  ('Tiny Habits', 'tiny-habits', 'surprise', true, null),
  ('Jesse Welles', 'jesse-welles', 'surprise', true, null),
  ('Josh Kaufman', 'josh-kaufman', 'surprise', true, null),
  ('S.G. Goodman', 'sg-goodman-2', 'surprise', true, null),
  ('Jensen McRae', 'jensen-mcrae-2', 'surprise', true, null),
  ('Kenny Loggins', 'kenny-loggins-2', 'surprise', true, null),
  ('Waxahatchee', 'waxahatchee-2', 'surprise', true, null),
  ('Jack Antonoff', 'jack-antonoff', 'surprise', true, null),
  ('Weyes Blood', 'weyes-blood', 'surprise', true, null),
  ('Hayley Williams', 'hayley-williams', 'surprise', true, null),
  ('Rufus Wainwright', 'rufus-wainwright', 'surprise', true, null),
  ('Sammy Rae', 'sammy-rae', 'surprise', true, null),
  ('Trombone Shorty', 'trombone-shorty', 'surprise', true, null),
  ('Amy Helm', 'amy-helm', 'surprise', true, null),
  ('Matthew Logan Vasquez', 'matthew-logan-vasquez', 'surprise', true, null),
  ('The Swell Season', 'swell-season', 'surprise', true, null),
  ('Leslie Mendelson', 'leslie-mendelson', 'surprise', true, null)
) as v(billed_name, slug, set_kind, is_surprise, artist_slug)
join editions ed on ed.year = 2025
join events e on e.edition_id = ed.id and e.kind = 'main_stage_day'
left join artists a on a.slug = v.artist_slug
on conflict (event_id, slug) do nothing;

commit;
