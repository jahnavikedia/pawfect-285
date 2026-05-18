# AI usage write-up

Required by §6 of the assignment. Roughly half a page of honest reflection on how this project was built with Claude Code.

## Which parts of the system did Claude write end-to-end?

Most of the code. Claude wrote the full SQLite schema and idempotent migration, all 9 API routes, the swipe-card gesture handling (drag thresholds, rotate/opacity transforms, the pull-down-for-results detection), every React component (the deck, the results polling, the pet-detail modal, the My-Picks tab, the admin dashboard), and the 103-pet seed script with hand-curated names, breeds, and personality blurbs. What I owned were the higher-level decisions: picking the theme (pets), rejecting Claude's first warm-cream color pass in favor of lavender/plum, deciding which stretch features were worth building, and judging when something was actually ready to ship.

## Where did you have to push back, fix, or rewrite Claude's output?

The biggest one was when I opened the app on my phone over LAN and the page hung on the "Loading good boys & girls…" SSR state. Claude insisted everything was working — `curl` calls returned 200, type-check passed, the production build was clean. Only when I sent a screenshot did it dig into the dev log and find that Next.js's `allowedDevOrigins` setting was blocking the HMR/asset resources from `10.0.0.96`, which killed client hydration. The fix was three lines in `next.config.ts`, but the gap exposed Claude's "verified end-to-end" claim — `curl`-ing your own backend is not end-to-end. I also had to explicitly ask "check if we have everything" before Claude noticed it had made zero commits across the whole build and had been working on a single dirty tree for hours.

## One thing Claude did better than expected, and one thing worse

**Better:** the seed data. I expected templated filler ("Buddy is a good dog. He loves treats."). Instead I got Sir Plodsworth the Russian Tortoise ("Slow and steady. Forever."), Snickerdoodle the cockatoo ("Drama queen with a crest"), and 101 others with that level of texture. It made the "most-divisive" sort actually meaningful instead of being a SQL exercise on noise.

**Worse:** self-verification. Claude was too quick to declare things "tested" after `curl`-ing its own APIs. The phone-loading bug and a subtle 4-pixel layout shift in the progress-bar slot both slipped past Claude's confidence checks because it wasn't opening the rendered page. For anything UI-related, "I tested it" needs to mean opening a browser, and I learned to treat Claude's verification claims as a starting point, not the final word.

## Other AI tools alongside Claude

None. The whole project ran in a single Claude Code session, and the transcript captures every prompt and decision. The only AI-adjacent third-party service is `loremflickr.com`, which serves seeded placeholder photos as a stand-in for per-pet generated images.
