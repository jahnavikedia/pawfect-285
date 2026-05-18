# AI usage write-up

Required by section 6 of the assignment. About half a page on how I built this with Claude Code.

## Which parts of the system did Claude write end-to-end?

Honestly, Claude did most of the typing. But the decisions the assignment actually cares about (theme, stack, trade-offs, design calls) I made myself.

I picked adoptable pets as the theme because I wanted the "most divisive" sort to find something interesting. With pets you've got dogs, snakes, hedgehogs, parrots, and all of that splits people way more than two dog breeds ever would.

For the stack I went with Next.js plus SQLite plus framer-motion plus Tailwind. I wanted one project instead of a separate frontend and backend repo, I wanted real server persistence without setting up Postgres, and I didn't want to write touch gesture handlers from scratch. Tailwind because it's fast and I already know it. I used a plain `<img>` tag instead of `next/image` so I wouldn't have to configure remote patterns for the image CDN.

I designed the vote dedup model. Each user gets a UUID stored in localStorage. The votes table has a UNIQUE constraint on (pet_id, user_id) plus an ON CONFLICT update, so voting twice on the same pet just changes your prior vote instead of adding a new row. Skip is a real value in the database, not just the absence of a vote, otherwise the most-skipped sort would just be measuring missing data.

I picked the divisiveness metric as min(yes, no). It's simple and does what I want (high when both sides have loud opinions, low when there aren't many votes either way).

I picked which stretch features to actually build (undo, detail modal, my-picks tab, matches view, real-time polling, admin page, sign-in via display name) and what to skip (keyboard shortcuts, end-of-deck summary screen). I set the matches threshold at 60% community approval over at least 2 decisive votes. I also picked the color theme, since the first attempt Claude did was a warm cream that looked generic, and I asked for something else and went with lavender.

Verification calls were also mine. I caught the bug where the page hung on my phone over the LAN (Claude had said it was working). I asked for the section 5 audit. I'm the one who noticed Claude had not made any git commits across the entire build.

What Claude actually wrote: the framer-motion drag and rotate code in SwipeCard, the 9 API routes with their validation and SQL, the 103 pet profiles (taglines and personalities, working from a brief I set), all the React components, and the Tailwind classes. I told it what I wanted, it built it.

## Where did you have to push back, fix, or rewrite Claude's output?

The biggest one was the phone bug. I opened the app on my phone over wifi and the page just sat there saying "Loading good boys and girls" and never finished. Claude was convinced everything was fine, because the curl tests came back 200 and the production build was clean. I had to actually send a screenshot before it dug into the dev server log and found that Next.js was blocking cross-origin asset requests from 10.0.0.96 (my phone on the LAN), which was killing client hydration. The fix was three lines in `next.config.ts`. The lesson was that when Claude says "tested end to end" it does not mean "opened the page in a real browser."

The other big one was git. Claude had been working for hours and made zero commits. I had to ask "did we actually do everything" before it noticed and offered to split the work into logical chunks. For a real codebase, that's the kind of thing that would get flagged in a code review.

Smaller stuff: the first color theme was too plain so I asked for a redo. Claude wanted to ask before adding extra features instead of dumping a kitchen sink, which was actually fine, but it meant I had to specifically pick from menus each time.

## One thing Claude did better than expected, and one thing worse

Better than expected: the seed data. I was bracing for filler ("Buddy is a good dog. He likes treats."). What I got instead was Sir Plodsworth the Russian Tortoise ("Slow and steady. Forever."), Snickerdoodle the cockatoo ("Drama queen with a crest."), Cheese Puff the hamster ("Hoards. Schemes. Wheels."), and 100 others at the same level. That actually mattered for the project, because the divisiveness sort only feels meaningful when the pets are distinct enough to provoke real disagreement.

Worse than expected: Claude does not actually verify UI. Every time it told me something was "verified end to end" it meant it had run curl against its own API. The phone hanging bug and a small layout shift in the progress bar both got past Claude's self-checks because it was never opening a browser to look. After a while I just stopped trusting "verified" as a complete answer and started checking on the phone myself.

## Other AI tools alongside Claude

None. The whole project was one Claude Code session and the conversation transcript has every prompt and decision. The only AI-adjacent third-party service is loremflickr.com, which serves the seeded placeholder pet photos.
