# AI usage write-up

Required by section 6 of the assignment. About half a page on how I built this with Claude Code.

## Which parts of the system did Claude write end-to-end?

Most of the implementation was written by Claude. It generated the SQLite schema and idempotent migration flow, all nine API routes, the swipe-card gesture system (including drag thresholds, rotation/opacity transforms, and the pull-down-to-view-results interaction), and all of the React UI components: the card deck, polling/results flow, pet-detail modal, My Picks tab, and admin dashboard. Claude also produced the 103-pet seed dataset with unique names, breeds, and personality blurbs. My role was more architectural and editorial: choosing the project direction, deciding which features were worth building, refining the visual identity, and determining when the product quality was actually acceptable. For example, I rejected Claude's original warm cream palette in favor of the lavender/plum styling used in the final version.

## Where did you have to push back, fix, or rewrite Claude's output?

The biggest issue came when I tested the app on my phone over LAN and the page remained stuck on the "Loading good boys & girls…" SSR state. Claude repeatedly claimed the app was fully tested because the APIs returned 200 responses, the production build passed, and type-checking succeeded. Only after I shared a screenshot did it inspect the development logs closely enough to discover that Next.js's allowedDevOrigins setting was blocking HMR and asset requests from my local network IP, which prevented hydration entirely. The actual fix was only a few lines in next.config.ts, but the problem exposed a weakness in Claude's verification process: successful API calls and builds are not the same thing as testing the real user experience. I also had to explicitly ask Claude to review the repository state before it realized it had made zero git commits during the entire build process and had been working in a single dirty tree for hours.

## One thing Claude did better than expected, and one thing worse

Claude performed much better than expected on the seed data. I expected repetitive placeholder descriptions, but many pets had genuinely distinct personalities and humor, such as "Sir Plodsworth the Russian Tortoise, Slow and steady. Forever." and "Snickerdoodle the cockatoo, Drama queen with a crest." That extra creativity made features like the "most divisive pets" ranking feel meaningful instead of looking like demo filler.

The weakest area was self-verification. Claude frequently declared features "tested" after checking backend responses or build output without actually validating the rendered interface. Both the mobile hydration issue and even a subtle layout shift in the progress-bar slot passed its confidence checks because no real browser-based validation happened. By the end of the project, I learned to treat Claude's testing claims as useful indicators rather than proof, especially for UI-heavy work.

## Other AI tools alongside Claude

None. The entire project was built in a single Claude Code session, and the transcript captures the full iteration process from scaffolding through debugging and polish. The only external service involved was loremflickr.com, which supplied seeded placeholder pet photos instead of generated images.
