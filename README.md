# PSAT Sprint

A PSAT/NMSQT and SAT prep site with fresh questions every time, timed adaptive mock tests, a skill matrix, and rewards.

**Live site:** https://vinunairs.github.io/psat-sprint/

## What's in it

- **Today**: countdown to test day and a 10-day plan with tick-off tasks.
- **Practice**: pick skills (for example, weak areas from a Bluebook score report) and get new questions with an explanation after each one. Misses go to a Mistake notebook until answered correctly.
- **Mock test**: PSAT or SAT format. Two timed modules per section; Module 2 is harder or easier depending on Module 1. Mark for review, cross out choices, question navigator, calculator, reference sheet. Estimated scores and a full review at the end.
- **Skill matrix**: mastery for the 8 College Board skill domains, blending the latest test with practice accuracy, plus the narrower question types missed most.
- **Log Bluebook test**: enter official Bluebook practice test results so they feed the matrix.
- **Rewards**: XP, levels, badges, and parent-defined real-world rewards.

## Where questions come from

| Source | File | How it stays fresh |
|---|---|---|
| Math (all 4 domains) | `js/mathgen.js` | ~30 templates; random numbers every time, answers computed in code |
| Grammar, transitions, data tables | `js/rwgen.js` | Assembled from sentence banks each time |
| Words in context, purpose, main idea, inference, synthesis, paired texts | `js/rwbank.js` | Hand-written bank; items don't repeat until all have been seen |

Questions are original, written in the style of the digital PSAT/SAT. They are not College Board questions.

## Progress and sync

Progress always saves in the browser first (localStorage key `psat-sprint-v2`). When signed in, every change also uploads to Supabase (project `psat-sprint`, table `public.progress`, one row per account, protected by row-level security). On open, the newer copy wins; a replaced device copy is kept under `psat-sprint-v2-before-sync`.

Rules for future changes, so logged progress is never lost:
- Keep the storage key and the `progress` table; only add fields, never rename or remove.
- New fields must have defaults in `blank()` so older saved progress loads cleanly.
- Keep the site at the same URL.

**Back up progress** in the footer downloads a JSON copy; **Restore from backup** loads it.

## Checks

```
node test/check-math.js   # generates 37,000+ math questions and checks structure and answer consistency
node test/check-rw.js     # checks Reading and Writing generators and the bank
```

## Adding questions

Append items to `js/rwbank.js` with a unique `id`, a domain `d` (`ii`, `cs`, `eoi`, `sec`), level `lv` (1–3), passage `p`, question `q`, four options `o`, correct index `a`, and explanation `e`.
