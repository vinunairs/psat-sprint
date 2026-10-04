# Test Prep Hub

A PSAT/NMSQT and SAT prep site with fresh questions every time, timed adaptive mock tests, a skill matrix, and rewards.

**Live site:** https://vinunairs.github.io/psat-sprint/

## What's in it

- **Today**: countdown to test day and a 10-day plan with tick-off tasks.
- **Practice**: pick skills (for example, weak areas from a Bluebook score report) and get new questions with an explanation after each one. Misses go to a Mistake notebook until answered correctly.
- **Mock test**: PSAT or SAT format. Two timed modules per section; Module 2 is harder or easier depending on Module 1. Mark for review, cross out choices, question navigator, calculator, reference sheet. Estimated scores and a full review at the end.
- **Skill matrix**: mastery for the 8 College Board skill domains, blending the latest test with practice accuracy, plus the narrower question types missed most.
- **Log a test**: enter Bluebook practice test scores (from mypractice.collegeboard.org) or Khan Academy / other results as number right (converted to an estimate), with misses by skill area, so they feed the matrix, Focus list and weekly goals. Step-by-step instructions are on the tab. Official tests are built into the sprint plan and the weekly goals (every week when test-ready, every other week while building).
- **Rewards**: XP, levels, badges, and parent-defined real-world rewards.

## Where questions come from

| Source | File | How it stays fresh |
|---|---|---|
| Math (all 4 domains) | `js/mathgen.js`, `js/mathgen2.js` | ~40 templates, including drawn scatterplots, bar charts and graphs; random numbers every time, answers computed in code |
| Grammar (incl. harder "; however," items), transitions, data tables | `js/rwgen.js` | Assembled from sentence banks each time |
| Words in context, purpose, main idea, inference, evidence, synthesis, paired texts | `js/rwbank.js`, `js/rwbank2.js` | 159 hand-written items; don't repeat until all have been seen |

Questions are original, written in the style of the digital PSAT/SAT. They are not College Board questions.

Math generators live in `js/mathgen.js`, `js/mathgen2.js` and `js/mathgen3.js`. Batch 3 adds rearranging formulas, systems of inequalities, polynomial and rational expressions, measures of spread, area and percent scaling, and parallel lines and polygons. `MathGen.HARD` holds multi-step items (function composition, circle equations in expanded form, perpendicular lines, two-way tables, growth models, quadratic–constant systems) that make up about 40% of level-3 questions. Reading bank batch 3 (`js/rwbank3.js`) adds purpose, structure and cross-text items. Craft and Structure picks are weighted about 55% words in context, 30% purpose and structure, and 15% cross-text.

## Feedback that sticks
Every question type maps to a strategy card in `js/strategies.js` (the name of the question type, how to spot it, a one-line rule, the steps, a Desmos shortcut where it helps, and the usual trap). After each answer the explanation shows Spot it, Solve it, The trap and Remember. After each set or mock, "3 things to remember" lists the most-missed strategies. The Review tab has spaced-repetition flashcards built from missed strategies, a printable night-before sheet, and the full strategy library. When you add a question generator or bank skill, map it in `BY_GEN` or `BY_SKILL`.

## My tests
`settings.exams` holds every PSAT or SAT the student plans to take. The next upcoming test is mirrored into `settings.kind/date/target`, so the plan, reminders and profile follow it automatically. When a test day passes, the plan moves on to the next test and Today asks for the official score.

## Progress and sync

Progress always saves in the browser first (localStorage key `psat-sprint-v2`). When signed in, every change also uploads to Supabase (project `psat-sprint`, table `public.progress`, one row per account, protected by row-level security). On open, the newer copy wins; a replaced device copy is kept under `psat-sprint-v2-before-sync`.

Rules for future changes, so logged progress is never lost:
- Keep the storage key and the `progress` table; only add fields, never rename or remove.
- New fields must have defaults in `blank()` so older saved progress loads cleanly.
- Keep the site at the same URL.

**Back up progress** in the footer downloads a JSON copy; **Restore from backup** loads it.

## Public site vs. signed in

- Signed out: an intro page (what the site does, test format, Bluebook setup steps, Khan Academy and College Board links), plus 2 short sample practice sets (5 questions) and 2 sample mocks (10 timed questions) per device. Visitors' sample activity is kept separately (`psat-sprint-guest`) and never mixes with a student's progress.
- Signed in: the full app. A student's progress (`psat-sprint-v2`) loads only after sign-in and is hidden again on sign-out.
- Note: the question files are public in this repository, so the sample limits are a courtesy gate, not a security boundary. Student data is protected by Supabase row-level security.

## Student accounts

- Sign-up asks for the student's first name, test (PSAT/SAT), test date, grade, email, password, and a **single-use invite code**. Codes live in `public.invite_codes`; each creates one account and expires after 30 days. The admin creates, copies and revokes codes from the dashboard.
- The greeting, countdown, and 10-day plan follow each student's own profile.
- Device progress is tagged with its owner. Signing in as a different student never uploads the previous student's progress; that copy is set aside on the device. "Sign out and clear this device" is for shared computers.
- Reminders: `supabase/functions/send-reminders` (deployed to Supabase), run hourly by `pg_cron`.

## Checks

```
node test/check-math.js   # generates 37,000+ math questions and checks structure and answer consistency
node test/check-rw.js     # checks Reading and Writing generators and the bank
```

## Adding questions

Append items to `js/rwbank.js` with a unique `id`, a domain `d` (`ii`, `cs`, `eoi`, `sec`), level `lv` (1–3), passage `p`, question `q`, four options `o`, correct index `a`, and explanation `e`.

## Admin dashboard
Accounts whose confirmed email is in `public.admins` (currently one) see a read-only Students dashboard instead of the student app: activity, streak, weekly questions and accuracy, latest score, weakest skills, reminders, plus per-student details (14-day activity, skills table, tests, plan). Data comes from the `admin_dashboard()` database function, which refuses any non-admin caller; `is_admin()` only tells the signed-in account whether it is an admin. To add or remove an admin, edit `public.admins` in Supabase.

## Friends
Friends tab (signed-in students): each student has a friend code (`my_friend_code()`); adding a code sends a request, and nothing is shared until the other student accepts. Friends see first name, league points, streak, level, answered count, latest score and strongest/weakest practice skill (`friends_board()`). No free-text messages.
- **Weekly league**: 10 points per correct answer + 100 per mock section, Monday–Sunday. Last week's winner gets +150 XP and the League Champ badge.
- **Head-to-head challenges**: the challenger answers 10 questions (Math, Reading & Writing, or Mixed); the friend gets the exact same questions. Most correct wins; ties go to the faster time. The challenger's score is hidden until the friend has played. Winner +50 XP and the Duel Winner badge. Challenges expire after 7 days.
- **Cheers**: four fixed reactions (🔥 👏 💪 🎯), one of each per friend per day.
All reads and writes go through security-definer functions that check friendship server-side; the tables have RLS on with no client policies.

## Question freshness
Every question served is tracked per question type in the student's progress (`fresh`: served and exact-repeat counts per generator or bank domain, a daily tally for 60 days, and hashes of the last 2,500 questions). The admin dashboard's **Question freshness** card shows each student's repeat rate over 30 days, how much of the hand-written reading bank the most active student has used, and the question types repeating most. Rule of thumb: under 7% repeats is fine; over 15%, or a bank domain more than 85% used, means it's time to add questions for the listed types. Known small templates (fewest variations): some geometry (angles, Pythagorean, trig, radians, special triangles), rearranging-formula levels 2–3, and generated transitions.

## Design
`css/theme.css` (loaded after `css/app.css`) holds the visual design: indigo→violet brand, Plus Jakarta Sans for the interface and Source Serif 4 for passages (like the real test), rounded cards, full dark mode, WCAG-AA contrast, 44px touch targets and reduced-motion support. Navigation follows mobile standards: five destinations (Home, Practice, Tests, Progress, Friends) as a bottom tab bar on phones and a side rail on larger screens; related views sit under one destination with a segmented sub-nav (Practice/Review, Mock test/Log a test, Skill matrix/Rewards). Home opens with a gradient progress card (countdown, streak, score, level).

## Navigation (Oct 2026 redesign)
Bottom menu (side rail on wide screens): **Today** (the plan) · **Learn** (Geometry Lab, flashcards, strategy cards, night-before sheet) · **Practice** (focus set, Mistake notebook, a folded "Build your own set") · **Tests** (mock tests, Log a test, official Bluebook/Khan links, how the test works) · **Me** (Progress, Rewards, Friends, Account). Account holds test dates, name, reminders, sign-in and backups; the footer keeps only the legal note. The 🔥 and Lv chips open Rewards. Today shows a slim countdown band, an **Up next** task with a Start button, time estimates (`estMin`), the rest of the list, and finished tasks folded. While a question is on screen on a phone, the bottom menu hides and the main button sticks to the bottom. Explanations lead with a short verdict, the diagram, why, and the rule; Spot it, method, Desmos, trap and tip fold under "Learn the pattern". Progress is a ranked list of the 8 skills (tap for numbers). Students can claim rewards but not edit them; parents set them in the admin view (`reward_config` table + `admin_get_rewards` / `admin_set_rewards`). Question diagrams use the Lab's color code (coral opposite, teal adjacent, amber hypotenuse).

## Geometry Lab in the plan
`geometry.html` (the Lab) stores progress in this browser under `gtlab-v2` (`{1: {g, r, w, s}, ...}`, `s` = mission finished). The sprint plan schedules it as `lab` tasks (Missions 1–2 Fri, 3–4 Sun, 5–6 Mon, 7 on the light-review day). `labSync()` runs when Home renders and when the window regains focus: it merges finished missions into the synced `S.lab = {done, stars, starList, log, at}` (union across devices, `log` = date each mission was first seen finished) and ticks any Lab task, on any plan day, whose missions are all done, so Lab work done outside the plan still counts. The admin detail and the Telegram summary show Lab progress. In the final sprint Home no longer shows the separate Lab card; the Lab lives in the plan list (it's still on the Practice tab).

## Telegram reports
Edge function `telegram-report` (deployed without JWT; it checks Telegram's secret header or the cron secret). The bot token is the function secret `TELEGRAM_BOT_TOKEN`, set in the Supabase dashboard. A chat links itself by sending `/link CODE` (code in `app_secrets.telegram_link_code`); linked chats live in `telegram_chats` (no client access). Commands: `/report` (short summary), `/details` (full report), `/brief` (latest Daily Brief coach reports), `/stop`. The 9 pm message is the short version: per student one status line (tasks, focused minutes, questions right, Daily Brief) plus at most 3 flags (weak area under 60%, slow pace, left the app 3+ times, high idle, mocks, Lab missions); other family members share one Daily Brief line. The evening summary adds each Daily Brief learner's day (cards read, checks right, points) from the `brief_*` tables. The hourly job `telegram-report-hourly` (minute 10) sends each linked chat a summary of every student at 9 pm New York time (tasks ticked, focused/idle/away time, questions and accuracy by area, pace, Mistake notebook) and an alert when a new test is logged. After setting the token, call `{mode:"setup"}` with the cron secret once to register the webhook.

## Geometry figures
`js/figures.js` draws inline SVG from plain data on a question: `q.fig` is shown with the question (only what the question gives, with "?" for the unknown), `q.efig` in the explanation's **See it** row next to `q.steps` (numbered steps). Types: `rtri` (right triangle, sides colored by role: opposite / adjacent / hypotenuse), `parallel` (transversal; the explanation draws the angle to scale), `tri` (angles, ticks for equal sides, exterior angle; `deg` draws to scale), `angles` (supplementary/complementary), `similar` (matching sides share a color), `circle` (on a grid), `sector`, `rect`. Colors are CSS tokens `--fig-a/b/c` with dark-mode values. Used by the trig, Pythagorean, special-triangle, angle, triangle, parallel-line, exterior-angle, similar-figure, circle, arc and rectangle generators.

## Study time
`S.time[date] = {f, i, a, n, by}` (kept 30 days): seconds focused (page visible, touched in the last 90 s), idle on screen, away (switched app/tab 15 s–30 min mid-activity) and the number of times away, plus focused seconds per activity. Only counts while a study activity is open. After 2 minutes untouched on a question the student gets a nudge to guess and move on; on returning from away, a "Welcome back" note. `S.qtime[domain] = [n, sec]` is time per practice question (away time excluded). Home shows today's focused minutes; set results show time per question vs. test pace; the admin detail shows a 7-day table, time by activity, and pace per section.

## Home in the final sprint
Home shows one card for today: the date, the day's title, a progress bar, and a single numbered list of today's tasks plus up to 3 carried-over ones (tagged "from Wed"); older unfinished tasks stay in the whole plan. The day-by-day plan and everything else (official tests, my tests, reminders, how the test works) sit in two closed sections below.

## Plan tasks that link and tick themselves
Each sprint task in `PLAN_TEMPLATE` is text or `[text, action]`. Tapping the text opens the activity: a practice set (`practice`, optional `doms`, `n`, `timed`), the focus set (`focus`), the Mistake notebook (`notebook`), flashcards (`deck`, optionally `area` or `top`), a mock section (`mock`, with `alt: "khan"` so logging a Khan Academy section also counts), mock results (`mockreview`), Log a test (`log`), or a tab (`visit`). `planEvent()` runs when a set, mock, log, or flashcard run finishes and ticks one matching task (the one just opened, else today's, else a carried one). `ext` tasks (Bluebook, College Board, Desmos) open the outside site and are ticked by hand. From today on, every non-light day also gets two adaptive tasks: today's flashcards (capped at 12 cards) and, when one practice area is under 50% after 8+ tries, 10 questions in that area (chosen once per day, stored in `planWeak`).

## Tips before practice, warm-ups, and carry-over
- **Tip cards:** the first time a question type comes up in a practice set, its strategy card (with a one-line `say` rule) is shown first; types answered right 3 times in a row (`strat[id].run`) skip the tip. Focus sets are grouped by strategy so each tip is followed by its questions. Tip time doesn't count against the pacing timer.
- **Deck seeding:** every `focus_targets` type puts its strategy card into the flashcard deck once (`seeded`), so the deck is ready before any practice. Home offers a "5-minute warm-up" of due cards.
- **Mock warm-up:** before a full mock, a 2-minute screen shows the student's top 5 rules; nothing is shown during the test.
- **Carry-over:** in the final sprint, unfinished tasks from earlier days appear under today's mission ("Carried over from …") and are marked "Moved to today" in the day list. Ticking one checks off the original task. Night-before and test-morning items don't carry.

## Focus set (automatic)
Home and Practice show **Your focus set**: 20 questions weighted toward the question types a student actually misses. Two inputs, no manual picking: (1) `public.focus_targets` — question types written after a test review (for example, from a Bluebook score report); students can read only their own row and nothing on the client can write it; (2) the student's own results per question type (`tstat`: attempts, misses), which add weight to types they keep missing and lower it once they're mostly right. Types are generator names (`gen:sec_fanboys`) or hand-written bank skills (`bank:Textual evidence`); an item can set a starting level (`lv`), which climbs automatically once the student gets that type right.

## Concept Lab (concepts.html)

A second guided Lab, built after Bluebook Practice Test 2, for question types the student hadn't been taught yet. Same format as the Geometry Lab (play → rule → walk-through → your turn), progress in localStorage `cxlab-v1`, synced to `S.lab2` and shown in the admin view and the Telegram report.

1. How many solutions (discriminant, "exactly one solution, find k")
2. One, none or infinitely many (linear equations and systems)
3. Line meets parabola (systems with a quadratic)
4. Factors and zeros (factor theorem, remainder)
5. Shifting graphs, exponentials included
6. Equations with fractions (clear denominators, extraneous answers)
7. Notes → goal (rhetorical synthesis method)

Plan tasks use `{ k: "lab", p: "cx", m: [...] }`; `p` omitted means the Geometry Lab. The Geometry Lab's Mission 2 now also covers polygon angle sums.

## Test review (Tests → Test review)

After an official practice test, the parent's question-by-question review shows up here for the student to confirm. Each miss is sorted into Knew it / New type / Repeat gap / Hit or miss, with the answers, what we think happened, and a link to the matching Lab mission. The student taps what really happened (careless, rushed, lost focus, guessed, forgot how, never learned it), can add a sentence, marks where focus slipped, and finishes the review (ticks the plan task, +25 XP).

- Review data lives in the student's `focus_targets.items` as one entry `{ type: "review:<id>", review: { title, date, summary: { line, len, finding }, items: [{ q, mod, n, type, his, cor, cat, what, ty, lab, labText }] } }`, so no extra table is needed. `setFocus` splits these out into `REVIEWS`.
- Answers are saved in the synced state: `S.treview[id] = { r: { [q]: { c, note, at } }, focus: [...], note, done }`.
- Two steps: the review itself has no practice links. After **Submit my review**, the screen becomes a fix-it list of every miss, grouped by the student's own answers (Learn first: never learned / forgot how · Practice until it sticks: guessed · Quick fixes: careless, rushed, lost focus). Each row has a lesson (Lab mission, or the tip card for that type, which returns to the list) and "Practice 5". Opening either marks the row started (`S.treview[id].fix`). "See or change my answers" reopens the review.
- "Never learned it" and "forgot how" add weight to that question type (`ty`) in the focus set. The admin view lists each student's answers and notes.
