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
