# AI usage write-up

Required by §6 of the assignment. Roughly half a page of honest reflection on how this project was built with Claude Code.

## Which parts of the system did Claude write end-to-end?

The pieces the assignment explicitly told me to own (theme, architecture, trade-offs, design judgment — §1 and §2 of the prompt), I owned:

- **Theme.** I picked adoptable pets over speed-dating profiles, restaurants, or class options, on the grounds that a diverse species mix gives the "most-divisive" sort something meaningful to find — a snake vs. a golden retriever splits a room in a way two dog breeds never would.
- **Stack and trade-offs.** I chose Next.js + SQLite + framer-motion + Tailwind from the options I considered, and the rationale lives in §2 of the README. The load-bearing calls: a single Next.js app instead of split frontend/backend (lower friction, co-located API routes), SQLite over Postgres (persistent, ACID, zero infra for the assignment's bar), plain `<img>` instead of `next/image` (no need to allow-list a CDN; clean `onError` fallback), and framer-motion for gestures because it gives me velocity + axis-lock for free instead of writing pointer math from scratch.
- **Identity and dedup model.** Anonymous UUID in `localStorage` as the source of identity, with `UNIQUE (pet_id, user_id)` + `ON CONFLICT DO UPDATE` so a second vote on the same pet *changes* the prior vote instead of double-counting. Skip is a first-class vote (`choice ∈ {yes,no,skip}`) so "most-skipped" measures real skips, not missing data.
- **Sort metrics.** I decided `min(yes, no)` was the right shape for divisiveness — high when both sides are large, naturally suppresses low-volume pets — instead of a fancier Wilson-interval calculation. I also picked the five sort modes (most-loved, least-loved, most-divisive, most-voted, most-skipped) as the meaningful axes.
- **Feature scoping.** I picked which stretch items to build (undo, detail modal, my-picks tab, matches view, real-time polling, admin + analytics, lightweight sign-in via display name), set the matches threshold (≥60% community yes-rate over ≥2 decisive votes), and chose what to skip (no keyboard shortcuts, no end-of-deck summary screen).
- **Color theme.** Rejected the first warm-cream pass; picked lavender/plum from a small set.
- **Verification and ship/no-ship calls.** I caught the LAN cross-origin bug from a phone screenshot when Claude had declared it "verified end-to-end," asked for the audit against §5 of the spec, and flagged the missing git history.

Claude was the *implementer* for the work below, executing the design decisions above:

- The framer-motion drag / rotate / opacity-transform code in `SwipeCard.tsx`.
- The 9 API route handlers — including their input validation and aggregation SQL.
- The 103 seed profiles' prose — names, breeds, taglines, descriptions — drafted to a brief I set (mixed species, adoption-listing tone, real-feeling personality).
- The React component scaffolding for the deck, modal, results, my-picks, and admin views.
- The Tailwind class soup.

Put differently: I made the decisions the assignment's Learning Goals call out — defensible architecture, trade-offs, design judgment — and Claude turned those into running code under my direction.

## Where did you have to push back, fix, or rewrite Claude's output?

The biggest one was when I opened the app on my phone over LAN and the page hung on the "Loading good boys & girls…" SSR state. Claude insisted everything was working — `curl` calls returned 200, type-check passed, the production build was clean. Only when I sent a screenshot did it dig into the dev log and find that Next.js's `allowedDevOrigins` setting was blocking the HMR/asset resources from `10.0.0.96`, which killed client hydration. The fix was three lines in `next.config.ts`, but the gap exposed Claude's "verified end-to-end" claim — `curl`-ing your own backend is not end-to-end. I also had to explicitly ask "check if we have everything" before Claude noticed it had made zero commits across the whole build and had been working on a single dirty tree for hours.

## One thing Claude did better than expected, and one thing worse

**Better:** the seed data. I expected templated filler ("Buddy is a good dog. He loves treats."). Instead I got Sir Plodsworth the Russian Tortoise ("Slow and steady. Forever."), Snickerdoodle the cockatoo ("Drama queen with a crest"), and 101 others with that level of texture. It made the "most-divisive" sort actually meaningful instead of being a SQL exercise on noise.

**Worse:** self-verification. Claude was too quick to declare things "tested" after `curl`-ing its own APIs. The phone-loading bug and a subtle 4-pixel layout shift in the progress-bar slot both slipped past Claude's confidence checks because it wasn't opening the rendered page. For anything UI-related, "I tested it" needs to mean opening a browser, and I learned to treat Claude's verification claims as a starting point, not the final word.

## Other AI tools alongside Claude

None. The whole project ran in a single Claude Code session, and the transcript captures every prompt and decision. The only AI-adjacent third-party service is `loremflickr.com`, which serves seeded placeholder photos as a stand-in for per-pet generated images.
