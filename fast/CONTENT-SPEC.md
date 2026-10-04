# FAST Prep content spec (for content authors)

Audience: Prayaga, 4th grade, Hillsborough County, Florida. Strong reader (FAST Reading Level 4, i-Ready 607).
Weakest reading areas: **Vocabulary** and **Reading Across Genres** (figurative language, summarizing,
comparing texts). Tone: warm, fun, encouraging. Never scary or test-anxious.

All content must be ORIGINAL (written by you). No copyrighted characters, no real test items, no song lyrics,
no quoting published books. Florida settings, dancing, cute collectibles, Japanese folk-tale flavors,
animals, science, inventors, kids solving problems are all welcome. No violence beyond mild adventure.
No brand names. Keep facts in informational texts accurate and checkable (manatees, hurricanes, Everglades,
Ybor City cigar factories, Gasparilla is ok, moon phases, bees, origami, etc.).

Standards: Florida B.E.S.T. ELA grade 4 (stretch items: grade 5).

## File format

Plain browser JavaScript, no modules, no build step. Each file appends to a global:

```js
window.FAST_BANK = window.FAST_BANK || {};
FAST_BANK.lit = [ /* items */ ];
```

Use double-quoted strings or template literals. Must parse with `node -e "require('./file.js')"` after
defining `global.window = global` (the test does exactly that). No trailing junk.

## Skill IDs (use exactly these)

Reading Prose & Poetry (FAST category PROSE)
- `r.plot`     setting, events, conflict, characterization and how they shape the plot (ELA.4.R.1.1)
- `r.theme`    stated or implied theme and how it develops (R.1.2)
- `r.pov`      narrator's point of view, first vs third person, narrator vs character (R.1.3)
- `r.poetry`   poetry elements: stanza, line break, rhyme, rhythm, repetition, alliteration, how they add meaning (R.1.4)

Reading Informational Text (FAST category INFO)
- `r.textfeat`    text features (headings, captions, diagrams, bold words, sidebars, timelines) and text structures
                  (chronology, comparison, cause/effect) (R.2.1)
- `r.central`     central idea and relevant details (R.2.2)
- `r.perspective` author's perspective toward a topic (R.2.3)
- `r.claim`       author's claim and the evidence used to support it (R.2.4)

Reading Across Genres & Vocabulary (FAST category AGV)
- `r.figurative` figurative language (simile, metaphor, personification, hyperbole, idiom) and how it adds meaning (R.3.1)
- `r.summary`    best summary / what belongs in a summary (R.3.2)
- `r.compare`    compare and contrast two texts or two accounts of the same topic/event, primary vs secondary source (R.3.3)
- `v.context`    context clues for unknown words (V.1.3)
- `v.roots`      Greek and Latin roots and affixes (V.1.2)
- `v.multi`      multiple-meaning words (V.1.3)
- `v.relations`  synonyms, antonyms, shades of meaning (V.1.3)
- `v.academic`   grade-level academic words (analyze, contrast, evidence, infer, sequence, ...) (V.1.1)

Writing (FAST Writing rubric domains)
- `w.org`   Purpose, Focus and Organization (claim/controlling idea, topic sentences, transitions, intro/conclusion)
- `w.evid`  Evidence and Elaboration (choosing relevant evidence from sources, explaining it, citing sources)
- `w.conv`  Conventions (capitalization, punctuation, commas, quotation marks, agreement, verb tense,
            pronouns, commonly confused words, fragments and run-ons, spelling)

## Question object

```js
{
  id: "lit03-2",            // unique across ALL files: <passageId>-<n> or <bank>-<n>
  skill: "r.theme",         // one skill ID from above
  q: "Which sentence best states a theme of the story?",
  o: ["…", "…", "…", "…"],  // exactly 4 options, similar length, all plausible; no "all of the above"
  a: 2,                     // index of correct option (0-3). Vary the position across items!
  e: "Kid-friendly why (1-3 short sentences). Name the clue in the text. Encouraging, never shaming."
}
```

FAST formats we also want (use in about 1 of every 4 passage questions):

- Two-part (Part A / Part B evidence): add `b: { q: "Which sentence from the story best supports the answer to Part A?", o: [4 quotes], a: n }`.
  Part B options must be exact sentences from the passage.
- Choose two: `a: [i, j]` (array of two indexes) and `o` has 5 options; q ends with "Choose **two** answers."

Never put the answer pattern in the wording (avoid the correct option being the longest every time).

## Passage object

```js
{
  id: "lit03",
  genre: "prose" | "poetry" | "info" | "paired",
  lv: 4,                    // 4 = on grade, 5 = stretch (grade 5 difficulty)
  title: "The Dumpling Dance-Off",
  text: "Paragraph one.\n\nParagraph two.",   // for prose/info/poetry. Poetry: lines separated by \n, stanzas by \n\n
  // paired only: instead of `text`, use texts: [{ title, text }, { title, text }]
  // optional for info: features: [{ kind: "caption"|"sidebar"|"heading"|"diagram-label"|"timeline", text: "..." }]
  //   headings may also be written inside the text as a line starting with "## " (the app renders it as a heading)
  qs: [ question, ... ]     // 4-6 questions
}
```

Lengths: grade 4 prose 350-650 words; poems 12-28 lines; informational 350-650 words; paired texts 200-400 each.
Stretch (lv 5) a bit longer and with harder vocabulary.
Paragraph numbers: the app numbers paragraphs automatically, so questions may say "in paragraph 3".
