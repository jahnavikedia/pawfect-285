# PawVote 🐾

A mobile-first swipe-to-vote web app for **adoptable pets**. Users swipe through 100+ pet profiles, voting **yes (adopt)** or **no (pass)** on each one. A community results view aggregates votes across all users so you can see which good boys and girls win the room — and which ones are most divisive.

Built as the deliverable for the CSE 285 take-home exam.

---

## 1. Theme

**Adoptable pets** — a mix of dogs, cats, rabbits, birds, small mammals (hamsters, guinea pigs, ferrets, hedgehog, rat, chinchilla), and reptiles. Each pet has a name, breed, age, one-line tagline, and a short adoption-style description. 103 distinct items are seeded.

The theme was chosen because:

- It naturally produces meaningful binary votes ("would you adopt this pet?") with a strong emotional pull.
- A diverse species mix makes the **most-divisive** sort interesting — orange tabbies vs. snakes split rooms differently than two breeds of dog would.
- It's family-friendly and easy to demo with non-technical users.

---

## 2. Stack and rationale

| Concern | Choice | Why |
| --- | --- | --- |
| Framework | **Next.js 16 (App Router)** | Single project for both UI and server. Co-locates API routes with components. |
| Language | TypeScript | Catches contract drift between client, server, and DB. |
| Persistence | **SQLite** via `better-sqlite3` | Real client–server persistence with zero infra. Synchronous API plays well with Next.js route handlers. |
| Styling | Tailwind CSS v4 | Mobile-first utility classes, no CSS sprawl. |
| Animation / gestures | **framer-motion** | Production-grade pointer/touch gestures with axis lock, velocity, and spring physics — the right tool for the swipe-card UX. |
| Image source | `loremflickr.com` with seeded `?lock=<id>` | Stable, themed placeholder images per pet. Falls back to a colored gradient + species emoji on load error. |
| Anonymous identity | `crypto.randomUUID()` in `localStorage` | No login required; each browser is one voter. The user ID is sent on every request and used to dedupe votes (UNIQUE on `(pet_id, user_id)`). |

---

## 3. Running it locally

Requires Node 18+ (tested on Node 23).

```bash
npm install
npm run seed     # creates data/pawvote.sqlite and inserts 103 pets (idempotent)
npm run dev      # http://localhost:3000
```

On first run, the DB is created under `./data/pawvote.sqlite`. The folder is gitignored. Re-running `npm run seed` is safe — it upserts.

**Open the app on your phone** (or Chrome DevTools mobile mode) for the intended UX. The layout is sized for portrait mobile, capped at `max-w-md` on larger screens.

### Admin

Visit [http://localhost:3000/admin](http://localhost:3000/admin). The default admin token is `letmein`. To override, set `ADMIN_TOKEN` before starting the dev server:

```bash
ADMIN_TOKEN=your-strong-token npm run dev
```

---

## 4. Feature checklist (vs. the assignment)

### Core (must-have)

- [x] Voting theme picked and documented (adoptable pets).
- [x] **103** distinct items, each with an image (loremflickr seeded by pet id, with emoji + gradient fallback) and a short title + description.
- [x] Swipe-card UI:
  - [x] Swipe right or tap ♥ → **yes** vote
  - [x] Swipe left or tap ✕ → **no** vote
  - [x] Visual feedback: card tilts proportional to drag, green "ADOPT" / red "PASS" overlays fade in past a threshold, and a "↓ Pull to see results" hint fades in on downward drag.
  - [x] Smooth transitions: the card flies off-screen on commit, the next card animates up from the deck (two cards peek behind for depth).
- [x] Results view, reachable by either:
  - [x] **Pull down** on the active card (vertical-drag detection past 140 px), or
  - [x] The clearly visible **Results** tab in the header.
- [x] Results aggregate yes/no/skip counts across all users.
- [x] Results are sortable: **most-loved**, **least-loved**, **most-divisive**, **most-voted**, **most-skipped**. Each pet shows a yes/no bar with raw counts and yes %.
- [x] Results are filterable by **species** (chips at the top, with counts).

### Other

- [x] Real client–server app with persistent state (Next.js API routes + SQLite on disk).
- [x] Mobile-first design (portrait layout, large touch targets, no double-tap zoom).
- [x] Skip option — preserves the binary yes/no result but lets undecided users move on.
- [x] Progress bar at the top of the deck showing how far through their vote pile the user is.
- [x] "Reset my votes" button on the results screen (rotates the local user id so the user starts fresh).
- [x] **Tap-for-details modal** — tapping a card (without dragging) opens a full-screen sheet with the bigger image, full description, and live community vote stats. Vote can be cast or changed from inside the modal.
- [x] **Undo last vote** — after every swipe, a violet "↶ Undo" pill appears below the action row. Clicking it `DELETE`s the vote from the DB and brings the previous card back.
- [x] **"My Picks" tab** — third top-level view listing every pet the user has voted on, filterable by Adopted / Passed / Skipped. Tapping any row opens the same detail modal so the user can change their mind.

### Stretch (from §3.2 of the prompt)

- [x] **User identity.** Anonymous UUID in `localStorage` is the base case. On top of that, an optional **display name** (the avatar chip in the header) is upserted into a `users` table, so votes survive reloads and the admin view can show "anonymous" vs. named voters.
- [x] **Undo last swipe.** Violet pill below the action row; calls `DELETE /api/vote?petId=…&userId=…`.
- [x] **Matches view.** A "Matches ✨" filter in My Picks: pets the user voted **yes** on whose community yes-rate is ≥60% across ≥2 decisive votes. Matching pets get a violet ring and a sparkle in the list.
- [x] **Real-time updates.** The Results view polls `/api/results` every 5 s, only while the tab is visible (`document.visibilityState !== "hidden"`). A green pulse beside "Community results" flashes whenever the total-vote count changes.
- [x] **Admin / seed without code.** Visit [`/admin`](http://localhost:3000/admin), sign in with the admin token (defaults to `letmein`, override with the `ADMIN_TOKEN` env var), and use the form to add new pets — it posts to `/api/admin/pets` and the new pet shows up in the deck on the next reload. The seed script is still there for bulk loading.
- [x] **Basic analytics.** The admin page surfaces total swipes (yes/no/skip), distinct sessions, total pets, **average decision time** (each vote stores `decision_ms` measured from when the card became active), per-species yes-rate, top 5 most-loved, and a recent-voters list.

---

## 5. Architecture

### Data model (`lib/db.ts`)

```sql
pets  (id, name, species, breed, age, tagline, description, image_url, accent)
votes (id, pet_id, user_id, choice ∈ {yes,no,skip}, created_at, decision_ms,
       UNIQUE (pet_id, user_id))
users (user_id PRIMARY KEY, display_name, first_seen, last_seen)
```

The `UNIQUE (pet_id, user_id)` constraint plus an `ON CONFLICT … DO UPDATE` upsert means a user can change their vote on a pet without inflating counts. WAL mode is on so reads don't block writes.

### API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET`  | `/api/pets?userId=<id>` | All pets, with the caller's prior `user_choice` (or `null`) on each. Used to skip pets they've already voted on. |
| `GET`  | `/api/pet/[id]?userId=<id>` | Single pet with live vote counts and the caller's current choice. Powers the detail modal. |
| `POST` | `/api/vote` | Body `{ petId, userId, choice }`. Upserts the vote. |
| `DELETE` | `/api/vote?userId=<id>` | Wipes a user's vote history (used by "Reset my votes"). |
| `DELETE` | `/api/vote?userId=<id>&petId=<n>` | Removes a single vote (used by undo and "Clear my vote" in the modal). |
| `GET`  | `/api/my-votes?userId=<id>` | All pets the user has voted on, with their choice, sorted newest-first. Powers the My Picks tab. |
| `GET`  | `/api/results?sort=<key>&species=<name>` | Aggregate counts, yes-percentage, and a divisiveness score (`min(yes, no)`). Sortable; filterable by species. |
| `GET`  | `/api/meta` | Species list with per-species pet counts. Powers the filter chips. |
| `GET`  | `/api/identity?userId=<id>` | Returns the user row (`{ user_id, display_name, first_seen, last_seen }`) if present. |
| `POST` | `/api/identity` | Body `{ userId, displayName? }`. Upserts the display name. |
| `POST` | `/api/admin/pets` | **Admin.** Body `{ name, species, breed, age, tagline, description, image_url? }`. Creates a new pet. Requires `x-admin-token` header. |
| `DELETE` | `/api/admin/pets?id=<n>` | **Admin.** Removes a pet (and its votes). |
| `GET`  | `/api/admin/analytics` | **Admin.** Totals (yes/no/skip swipes, sessions, avg decision time), per-species yes-rate, top 5 most-loved, recent voters. |

### Front-end structure

```
app/
  page.tsx                    Tab switcher: Vote ↔ Picks ↔ Results
  layout.tsx                  Geist fonts, mobile viewport meta, theme color
  globals.css                 Tailwind + small CSS resets (no-select, scroll-y, no-scrollbar)
  admin/page.tsx              Token-gated admin: analytics + add-pet form
  components/
    SwipeDeck.tsx             Loads pets, holds the stack, dispatches votes, instruments decision_ms
    SwipeCard.tsx             One card. Drag, rotate, overlay text, pull-down detection, onTap
    PetImage.tsx              <img> with onError fallback to gradient + species emoji
    PetDetailModal.tsx        Full-screen sheet: pet info, live community bar, vote / change / clear
    MyPicks.tsx               My-votes list, filterable (All / Matches / Adopted / Passed / Skipped)
    Results.tsx               Sort + filter chips, ranked list, polls every 5 s with live pulse
    IdentityChip.tsx          Header avatar + display-name modal
lib/
  db.ts                       SQLite singleton with idempotent schema migration
  userId.ts                   Anonymous UUID + optional display name; posts to /api/identity
  adminAuth.ts                requireAdmin() guard for admin routes
  types.ts                    Pet, Choice, ResultRow, SortKey
scripts/
  seed.ts                     Hand-curated profile data; run via `npm run seed`
```

### Gesture details

- `framer-motion` `<motion.div>` with `drag`, `dragDirectionLock`, and an elastic value of `0.18` for the springy feel.
- `useMotionValue` for `x` and `y`; `useTransform` derives rotation (`±18°`) and the per-side overlay opacity.
- On `dragEnd`, the priority is: (a) downward swipe past `SWIPE_Y=140` → open results; (b) horizontal offset past `SWIPE_X=110` or velocity > 700 → commit a vote and animate the card to `±600 px`; (c) otherwise spring back to origin.
- Only the active (top) card is draggable. The next two cards render at `scale 0.95 / 0.90` and a `12 / 24 px` Y offset to create the deck-of-cards feel.

### Trade-offs and design decisions

- **No login.** Identity is a localStorage UUID. This keeps the demo frictionless. A real product would back this with an account so votes survive clearing site data; the schema already supports it via `user_id`.
- **`<img>` instead of `<Image>`.** Next's `Image` would require allow-listing `loremflickr.com` and would optimize images we already pull at small sizes. The plain tag keeps the seed simple and lets us handle `onError` gracefully.
- **Skip is separate from "didn't vote."** A skip is recorded as a vote with `choice='skip'`, which lets the most-skipped sort be meaningful instead of just measuring how many people haven't seen a card.
- **Divisiveness = `min(yes, no)`.** Simpler than a Wilson-interval split, but it does the right thing: rewards pets that get many votes on both sides and naturally suppresses pets with only a handful of votes.
- **SQLite, not Postgres.** The exam asked for persistent state, not multi-host scale. SQLite gives durable, ACID-compliant, file-based persistence with zero setup.

---

## 6. Known issues

Honest list of things that are imperfect or out of scope, so a grader doesn't have to discover them by accident:

- **Image latency on first load.** `loremflickr.com` is occasionally slow on first hit per `?lock=<id>`. When that happens the user briefly sees the gradient + species emoji fallback before the photo swaps in. We never show a broken image; `PetImage.tsx`'s `onError` handler keeps the gradient permanently if the fetch fails.
- **Decision-time is partial.** `decision_ms` was added to the schema mid-build, so the ~50 votes I cast on my phone before the migration have `decision_ms = NULL`. The admin analytics correctly takes the average over non-null rows, but absolute totals reflect this.
- **No cross-device sync.** Identity is a `localStorage` UUID; clearing site data or switching browsers gives you a new "user." A real product would back the UUID with an account; the schema already supports this via the `users` table.
- **Admin token defaults to `letmein` in dev.** Acceptable for a local exam build; for any real deployment set `ADMIN_TOKEN` to something strong. The `/admin` UI stores the token in `sessionStorage`, not `localStorage`, so it doesn't survive a quit.
- **SQLite, not Postgres.** Fine for this assignment's "real client–server with persistent state" bar. Wouldn't scale to many concurrent writers; WAL mode helps but isn't a real horizontal-scale answer.
- **No keyboard shortcuts on desktop.** Arrow keys could map to pass/adopt/skip/results, which would be nice for grading on a laptop. Not implemented.

---

## 7. AI-assistance disclosure

This was built with Claude Code (Anthropic) as a primary pair-programmer:

- The 103 pet profiles (names, breeds, ages, taglines, descriptions) were AI-drafted and reviewed for diversity, age range, and tone.
- The gesture math (rotation/opacity transforms, swipe thresholds, velocity tuning) and the divisiveness SQL were drafted by Claude and validated end-to-end against the running server.
- Architectural choices (Next.js + SQLite, framer-motion, no-login UUID identity, the upsert-with-unique-constraint vote model) were decided in dialogue and committed only after I confirmed the trade-offs.

Concrete things I owned rather than delegated: picking the theme, deciding what counts as a "good" sort metric, deciding to make skip a first-class vote, and verifying the API contracts work under direct `curl` calls before trusting them in the UI.

The longer reflection required by §6 of the assignment (what Claude wrote end-to-end, where I pushed back, one thing it did better/worse than expected, other tools used) lives in [`AI_NOTES.md`](./AI_NOTES.md).
