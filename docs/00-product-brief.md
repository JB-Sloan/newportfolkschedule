# Product Brief

## Thesis

The scarce resource is not content during festival weekend — it is a reason to show up in **January**.

A post-festival scrapbook has a four-to-six week half-life. A speculation engine has a six-month one. Newport fans already run lineup speculation compulsively in group chats, Reddit threads, and forum posts; the product's job is to give that behavior structure, memory, and a scoreboard.

So the roadmap is organized around the festival calendar, not around feature size:

| Window | Months | What the product is for |
|---|---|---|
| **Afterglow** | Aug (now) | Capture this year's setlists, sit-ins, and clips while memory is fresh |
| **Quiet** | Sep–Oct | Community habit-forming. The Wire gives a daily reason to open the app |
| **Speculation** | Nov–Feb | The Oracle + Bingo. Peak engagement of the off-season |
| **Reveal** | Mar–May | Announcement waves, bingo scoring, schedule builder |
| **Countdown** | Jun–Jul | Schedule finalization, meetups, logistics, live mode |

## Who this is for

The obsessive core, first. The people who remember which year Dawes backed up whom, who noticed the guitar tech change, who argue about whether the surprise set counts. They are a small fraction of attendees and they will produce essentially all of the archival content. Build for them; the casual attendee shows up in June for the schedule builder.

## What "success" looks like

- **Archive depth**: >90% of sets from the last 5 editions have a setlist; >50% going back 10.
- **Off-season retention**: non-zero DAU in December. This is the real metric.
- **Sit-in graph**: the connective tissue nobody else has. Newport's identity is collaboration; nobody has ever made that queryable.
- **Prediction calibration**: published Brier score, published post-mortem. Being wrong in public, honestly, is better content than being vaguely right.

## Explicit non-goals

- Not a ticket resale platform. A face-value exchange **board** is in scope; handling money is not.
- Not a video host. Embeds only. See `docs/07-legal-and-community-policy.md`.
- Not a replacement for the official app during festival weekend. Complement it.
- Not monetized. This constraint is load-bearing — see the Vercel Hobby ToS note in `docs/01-architecture.md`.

## The tagline

**"We are weird for this festival."**

It should show up in the product as a real feature, not just a header: the **Wall of Weird** — traditions, tattoos, rituals, the guy who brings the same flag every year, the running jokes. That is the thing that makes this a community site rather than a database with a login.

## One honest reframing

The original concept included a feedback forum where fans vote on festival improvements. As a fan-run site you cannot act on any of it — you can't change ticket pricing, capacity, or the shuttle schedule. A voting forum that implies influence it doesn't have will curdle.

Reframe it as the **Wishlist**: explicitly a fan wishlist, clearly labeled as unaffiliated, with categories for "dream sit-ins," "artists we want back," and "site improvements we'd love." That's honest, it's fun, and the dream-lineup data feeds The Oracle as a crowd signal. Status labels become `discussed` / `happened anyway` / `still dreaming` instead of `planned` / `shipped`.
