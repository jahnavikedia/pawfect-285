# PawVote 🐾

A mobile-first swipe-to-vote web app. Users swipe through 100+ adoptable pets, voting **yes (adopt)** or **no (pass)** on each one. A community results view aggregates votes across all users so you can see which good boys and girls win the room, and which ones are most divisive.

**Theme: adoptable pets.** Picked because a diverse species mix (dogs, cats, rabbits, birds, small mammals, reptiles) makes the "most divisive" sort actually interesting in a way two dog breeds never would.

---

## Running it locally

Requires Node 18+ (tested on Node 23).

```bash
npm install
npm run seed     # creates data/pawvote.sqlite and inserts 103 pets (idempotent)
npm run dev      # http://localhost:3000
```

Open it on your phone or in Chrome DevTools mobile mode. Layout is portrait-first, capped at `max-w-md` on larger screens.

### Admin

Visit [http://localhost:3000/admin](http://localhost:3000/admin). Default admin token is `letmein`. To override:

```bash
ADMIN_TOKEN=your-strong-token npm run dev
```

---

## Architecture (brief)

**Stack:** Next.js 16 (App Router, TypeScript) + SQLite via `better-sqlite3` + framer-motion for gestures + Tailwind v4. Single project for both UI and API.

**Data model:**
```sql
pets  (id, name, species, breed, age, tagline, description, image_url, accent)
votes (pet_id, user_id, choice ∈ {yes,no,skip}, created_at, decision_ms,
       UNIQUE (pet_id, user_id))
users (user_id PRIMARY KEY, display_name, first_seen, last_seen)
```

**Dedup:** `UNIQUE (pet_id, user_id)` + `ON CONFLICT DO UPDATE` so a second vote on the same pet updates instead of double-counting.

**Identity:** anonymous UUID in `localStorage`, sent with every request. Optional display name upserted into `users`.

**Front-end:** `app/page.tsx` is a tab switcher (Vote / Picks / Results). The swipe deck lives in `app/components/SwipeDeck.tsx` + `SwipeCard.tsx` and uses framer-motion `drag` with `dragDirectionLock` for the swipe / pull-down detection. Detail modal, my-picks list, results polling, and identity chip are sibling components. `/admin` is a separate token-gated page.

**API:** `GET /api/pets`, `POST/DELETE /api/vote`, `GET /api/results`, `GET /api/pet/[id]`, `GET /api/my-votes`, `GET /api/meta`, `GET/POST /api/identity`, plus `/api/admin/pets` and `/api/admin/analytics` behind an `x-admin-token` header check.

---

## What's done

### Core (§3.1)

- [x] Theme picked and documented (adoptable pets).
- [x] 103 distinct items, each with an image and a short label + description.
- [x] Swipe-card UI: swipe right or tap ♥ for yes, swipe left or tap ✕ for no; tilt + green/red overlays past threshold; smooth promotion of the next card (outer wrapper animates depth, inner handles drag).
- [x] Results view reachable by pull-down **and** a visible Results tab.
- [x] Aggregate yes/no counts across all users, sortable by most-loved, least-loved, most-divisive, most-voted, most-skipped, filterable by species.
- [x] Real client–server with persistent state (SQLite on disk).
- [x] Graceful end-of-deck state ("You've voted on every pet" with a CTA to results, plus a separate "No pets in the database yet, run `npm run seed`" message for a fresh clone).

### Stretch (§3.2)

- [x] Anonymous UUID identity + optional lightweight sign-in via a display-name chip.
- [x] Undo last swipe (DELETEs the most recent vote and brings the card back).
- [x] "Matches" view in My Picks: yes-voted pets where the community yes-rate is ≥60% over ≥2 decisive votes.
- [x] Real-time updates: Results polls every 5 s while the tab is visible, with a live pulse on count change.
- [x] Admin / no-code seeding: `/admin` page with a token-gated add-pet form posting to `/api/admin/pets`.
- [x] Basic analytics: total swipes (yes/no/skip), distinct sessions, average decision time, per-species yes-rate, top 5 most-loved, recent voters.

---

## Known issues

- **Image latency on first load.** loremflickr can be slow on the first hit per `?lock=<id>`. The user briefly sees a gradient + species emoji while it loads; if the fetch fails, the gradient stays permanently (`PetImage.tsx` `onError`).
- **Partial `decision_ms` history.** The column was added mid-build, so ~50 votes cast before the migration have `decision_ms = NULL`. The admin "average decision time" correctly averages over non-null rows only.
- **No cross-device sync.** Identity is `localStorage`-only; clearing site data or switching browsers gives you a new user.
- **Admin token defaults to `letmein`.** Fine for local exam grading. For any real deployment, set `ADMIN_TOKEN`.
- **SQLite, not Postgres.** Meets the assignment's "real client–server with persistent state" bar but wouldn't scale to many concurrent writers.
- **No keyboard shortcuts on desktop.** Arrow keys could map to pass / adopt / skip / results, not implemented.

---

For the AI usage write-up required by §6, see [AI_NOTES.md](./AI_NOTES.md).
