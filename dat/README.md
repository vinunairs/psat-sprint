# DAT Prep

Dental Admission Test prep at https://vinunairs.github.io/psat-sprint/dat/ — kept entirely inside this folder, separate from Test Prep Hub.

- **Blueprint:** `js/syllabus.js`, from the ADA 2026 DAT Candidate Guide (updated 08/04/2026), including the updated Organic Chemistry outline.
- **Plan:** built backward from the test date: Learn → Practice → Full-length tests → Final days. Science topics are spread evenly across the learning weeks, new and shaky topics first.
- **Progress:** saved in the browser (localStorage key `dat-prep-v1`), with Back up / Restore under Me. Keep the key and only add fields (with defaults in `blank()`), so saved progress always loads.
- **Lessons:** `js/lessons.js` is the engine (Explore → Rule → Walk through it → Your turn, like the Geometry Lab); each lesson is a file in `js/lessons/` registered with `DATLessons.add`. Prototype lessons: stoichiometry, cellular respiration, PAT angle discrimination. Your turn questions are generated fresh and feed the skill matrix. Check generators with `node dat/test/check-lessons.js`.
- **Notes:** a Notes button on every screen opens the note for the current lesson (or a general notebook); key points can be added with one tap; Learn → My notes lists, searches, downloads and prints them.
- **Next:** Perceptual Ability and Quantitative Reasoning practice, then science lessons with practice, then Reading and full-length tests. Accounts can be added later (separate `dat_*` tables).

Questions and lessons are original. DAT is a registered trademark of the ADA, which is not affiliated with this site.
