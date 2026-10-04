/* FAST Prep — skill catalog.
   Every skill maps to the FAST reporting category and the i-Ready domain it is reported under,
   so practice results line up with the school's score reports.
   FAST Grade 4 categories (Florida B.E.S.T.):
     Math:    NSOW whole numbers · NSOF fractions & decimals · AR algebraic reasoning · GMD geometry, measurement & data
     Reading: PROSE prose & poetry · INFO informational text · AGV across genres & vocabulary
     Writing: rubric domains w.org / w.evid / w.conv
   i-Ready domains:
     Math:    NO number & operations · AAT algebra & algebraic thinking · MD measurement & data · GEO geometry
     Reading: VOC vocabulary · LIT comprehension: literature · INF comprehension: informational text */
(function (root) {
  "use strict";
  const CATS = {
    NSOW: { subj: "math", name: "Whole Numbers", long: "Number Sense & Operations with Whole Numbers" },
    NSOF: { subj: "math", name: "Fractions & Decimals", long: "Number Sense & Operations with Fractions & Decimals" },
    AR: { subj: "math", name: "Algebraic Reasoning", long: "Algebraic Reasoning" },
    GMD: { subj: "math", name: "Geometry, Measurement & Data", long: "Geometric Reasoning, Measurement, and Data Analysis & Probability" },
    PROSE: { subj: "reading", name: "Prose & Poetry", long: "Reading Prose and Poetry" },
    INFO: { subj: "reading", name: "Informational Text", long: "Reading Informational Text" },
    AGV: { subj: "reading", name: "Across Genres & Vocabulary", long: "Reading Across Genres & Vocabulary" },
    WORG: { subj: "writing", name: "Purpose & Organization", long: "Purpose, Focus & Organization (4 pts)" },
    WEVID: { subj: "writing", name: "Evidence & Elaboration", long: "Evidence & Elaboration (4 pts)" },
    WCONV: { subj: "writing", name: "Conventions", long: "Conventions of Standard English (2 pts)" }
  };
  const IREADY = {
    NO: { subj: "math", name: "Number and Operations" },
    AAT: { subj: "math", name: "Algebra and Algebraic Thinking" },
    MD: { subj: "math", name: "Measurement and Data" },
    GEO: { subj: "math", name: "Geometry" },
    VOC: { subj: "reading", name: "Vocabulary" },
    LIT: { subj: "reading", name: "Comprehension: Literature" },
    INF: { subj: "reading", name: "Comprehension: Informational Text" }
  };

  // Math path, in teaching order: fractions first, then geometry & measurement, then multiplication & division, then place value.
  const UNITS = [
    { id: "u1", name: "Fraction Forest", icon: "🍡", blurb: "Fractions are the biggest part of 4th-grade FAST math. Start here!" },
    { id: "u2", name: "Shape & Measure Studio", icon: "📐", blurb: "Angles, area, units, time, money and data." },
    { id: "u3", name: "Multiply & Divide Dojo", icon: "✖️", blurb: "Facts, big multiplication, division and word problems." },
    { id: "u4", name: "Place Value Peaks", icon: "🏔️", blurb: "Big numbers up to 1,000,000: place value, comparing and rounding." }
  ];
  // [id, name, unit, FAST cat, i-Ready domain, B.E.S.T. benchmark(s), tip]
  const MATH = [
    ["m.fr.equiv", "Equivalent fractions", "u1", "NSOF", "NO", "MA.4.FR.1.3", "Multiply (or divide) the top AND the bottom by the same number. The pieces get smaller, but you have more of them — same amount!"],
    ["m.fr.compare", "Compare & order fractions", "u1", "NSOF", "NO", "MA.4.FR.1.4", "Same bottom? Bigger top wins. Same top? Smaller bottom wins (bigger pieces). Otherwise make the bottoms match, or compare to ½."],
    ["m.fr.decomp", "Break apart fractions", "u1", "NSOF", "NO", "MA.4.FR.2.1", "Split the TOP number into parts that add up to it. Keep the bottom number the same: ⁵⁄₈ = ²⁄₈ + ³⁄₈."],
    ["m.fr.addsub", "Add & subtract fractions", "u1", "NSOF", "NO", "MA.4.FR.2.2", "Same denominator? Add or subtract the numerators and keep the denominator. For mixed numbers, do wholes and fractions — trade 1 whole for ⁴⁄₄ if you need more pieces."],
    ["m.fr.word", "Fraction word problems", "u1", "AR", "NO", "MA.4.AR.1.2", "Draw it or picture a fraction bar. Ask: am I joining (add) or taking away / comparing (subtract)?"],
    ["m.fr.times", "Fraction × whole number", "u1", "NSOF", "NO", "MA.4.FR.2.4 · MA.4.AR.1.3", "3 × ²⁄₅ means three groups of ²⁄₅: multiply the top by the whole number, keep the bottom. ⁶⁄₅ = 1⅕."],
    ["m.fr.tenths", "Tenths & hundredths", "u1", "NSOF", "NO", "MA.4.FR.1.1 · MA.4.FR.2.3", "1 tenth = 10 hundredths. To add ³⁄₁₀ + ²⁵⁄₁₀₀, change ³⁄₁₀ to ³⁰⁄₁₀₀ first."],
    ["m.dec.notation", "Decimals & fractions", "u1", "NSOF", "NO", "MA.4.FR.1.2 · MA.4.NSO.1.5", "Tenths = 1 place after the dot, hundredths = 2 places. 0.5 = 0.50, so 0.5 is bigger than 0.45. Line up the dots to compare."],
    ["m.dec.ops", "Decimal steps & sums", "u1", "NSOF", "NO", "MA.4.NSO.2.6 · MA.4.NSO.2.7", "Line up the decimal points. 0.1 more changes the tenths digit; 0.01 more changes the hundredths digit."],
    ["m.gr.angles", "Types of angles", "u2", "GMD", "GEO", "MA.4.GR.1.1", "Acute < 90°, right = 90°, obtuse between 90° and 180°, straight = 180°, reflex > 180°."],
    ["m.gr.measure", "Measure angles", "u2", "GMD", "MD", "MA.4.GR.1.2", "Start at the scale that reads 0 on the angle's first side. Check: does the angle look smaller or bigger than a right angle (90°)?"],
    ["m.gr.unknown", "Find the missing angle", "u2", "GMD", "MD", "MA.4.GR.1.3", "A straight line is 180°, a right angle is 90°, all the way around is 360°. Subtract the angles you know."],
    ["m.gr.area", "Area & perimeter", "u2", "GMD", "MD", "MA.4.GR.2.1 · MA.4.GR.2.2", "Area = length × width (square units). Perimeter = add all the sides (2 × length + 2 × width)."],
    ["m.geo.shapes", "Lines & shapes", "u2", "GMD", "GEO", "MA.4.GR.1.1 (i-Ready Geometry)", "Parallel lines never meet. Perpendicular lines make square corners. Name shapes by their sides AND their angles."],
    ["m.m.convert", "Convert units", "u2", "GMD", "MD", "MA.4.M.1.2", "Big unit → small unit: MULTIPLY (1 ft = 12 in). Small → big: DIVIDE. Learn the 'magic numbers': 12, 3, 16, 4, 2, 60, 100, 1,000."],
    ["m.m.time", "Time & distance problems", "u2", "GMD", "MD", "MA.4.M.2.1", "Use a timeline: jump to the next hour, then add the rest. For two-step problems, write what you find first."],
    ["m.m.money", "Money problems", "u2", "GMD", "MD", "MA.4.M.2.2", "Line up the decimal points with dollars and cents. Count up to make change."],
    ["m.dp.lineplot", "Line plots & data", "u2", "GMD", "MD", "MA.4.DP.1.1–1.3", "Mode = most common. Range = biggest − smallest. Median = the middle value after you put them in order."],
    ["m.md.facts", "Times-table power", "u3", "NSOW", "NO", "MA.4.NSO.2.1", "Use a fact you know: 7 × 8 = 7 × 4 doubled = 28 + 28 = 56."],
    ["m.md.mult", "Multi-digit multiplication", "u3", "NSOW", "NO", "MA.4.NSO.2.2 · MA.4.NSO.2.3", "Break the numbers apart (area model) or use the standard way. Estimate first so you can check."],
    ["m.md.div", "Division with remainders", "u3", "NSOW", "NO", "MA.4.NSO.2.4", "Divide, multiply, subtract, bring down. The remainder must be smaller than the divisor. Leftover 2 out of 5 can be written as ⅖."],
    ["m.md.estimate", "Estimate products & quotients", "u3", "NSOW", "NO", "MA.4.NSO.2.5", "Round to friendly numbers first: 487 × 6 is about 500 × 6 = 3,000."],
    ["m.ar.word", "Multiply & divide stories", "u3", "AR", "AAT", "MA.4.AR.1.1", "'Times as many' means multiply. With a remainder, ask: does the leftover need its own group (round up) or is it left out (round down)?"],
    ["m.ar.equation", "Equations & unknowns", "u3", "AR", "AAT", "MA.4.AR.2.1 · MA.4.AR.2.2", "An equation is true when both sides are worth the same. Find each side, then compare."],
    ["m.ar.factors", "Factors, multiples & primes", "u3", "AR", "AAT", "MA.4.AR.3.1", "Prime = exactly 2 factors (1 and itself). Composite = more than 2. 1 is neither!"],
    ["m.ar.pattern", "Number patterns", "u3", "AR", "AAT", "MA.4.AR.3.2", "Find the rule between neighbors: + or ×? Then check it works for every step."],
    ["m.nso.place", "Place value", "u4", "NSOW", "NO", "MA.4.NSO.1.1 · MA.4.NSO.1.2", "Each place to the LEFT is worth 10 times more. Expanded form shows each digit's value."],
    ["m.nso.compare", "Compare big numbers", "u4", "NSOW", "NO", "MA.4.NSO.1.3", "Line up the places. Compare from the left: the first place that is different decides."],
    ["m.nso.round", "Rounding", "u4", "NSOW", "NO", "MA.4.NSO.1.4", "Look at the digit to the RIGHT of the rounding place: 5 or more, round up; 4 or less, stay."]
  ];
  // Grade 5 stretch skills (i-Ready adapts upward, so these push her ceiling).
  const STRETCH = [
    ["s.dec.place", "Thousandths & rounding decimals", "NSOF", "NO", "MA.5.NSO.1.1–1.5", "Thousandths are 3 places after the dot. To compare, add zeros so every number has the same number of places."],
    ["s.dec.ops", "Add, subtract & multiply decimals", "NSOF", "NO", "MA.5.NSO.2.3–2.5", "Adding: line up the dots. Multiplying: multiply like whole numbers, then count the decimal places in both factors."],
    ["s.md.div2", "Divide by 2-digit numbers", "NSOW", "NO", "MA.5.NSO.2.2", "Estimate with friendly numbers (e.g., 23 → 20), then fix up. Check by multiplying back."],
    ["s.fr.unlike", "Add & subtract unlike fractions", "NSOF", "NO", "MA.5.FR.2.1", "Find a common denominator first (a multiple of both bottoms), then add or subtract the tops."],
    ["s.fr.mult", "Fraction × fraction", "NSOF", "NO", "MA.5.FR.2.2", "Multiply top × top and bottom × bottom. ⅔ × ¾ = ⁶⁄₁₂ = ½."],
    ["s.fr.divunit", "Dividing with unit fractions", "NSOF", "NO", "MA.5.FR.2.4", "4 ÷ ⅓ asks 'how many thirds are in 4?' = 12. ⅓ ÷ 4 shares a third into 4 parts = ¹⁄₁₂."],
    ["s.fr.division", "Fractions as division", "NSOF", "NO", "MA.5.FR.1.1", "a ÷ b = ᵃ⁄ᵦ. 3 pizzas shared by 4 friends = ¾ pizza each."],
    ["s.ar.order", "Order of operations", "AR", "AAT", "MA.5.AR.2.1 · MA.5.AR.2.2", "Parentheses first, then × and ÷ left to right, then + and − left to right."],
    ["s.gr.volume", "Volume of boxes", "GMD", "MD", "MA.5.GR.3.2–3.3", "Volume = length × width × height, in cubic units."],
    ["s.gr.coord", "Coordinate plane", "GMD", "GEO", "MA.5.GR.4.1–4.2", "(x, y): go across first (x), then up (y). 'Walk before you climb.'"],
    ["s.dp.mean", "Mean, median & mode", "GMD", "MD", "MA.5.DP.1.2", "Mean = add them all, then divide by how many. It's the 'fair share' number."]
  ];
  const READING = [
    ["r.plot", "Plot, setting & characters", "PROSE", "LIT", "ELA.4.R.1.1", "Ask: Where/when? What's the problem? How does the character change it — or change because of it?"],
    ["r.theme", "Theme", "PROSE", "LIT", "ELA.4.R.1.2", "Theme = the life lesson. It's a full sentence about people in general, not just this character."],
    ["r.pov", "Point of view", "PROSE", "LIT", "ELA.4.R.1.3", "I/me/we = first person (narrator is in the story). He/she/they = third person (narrator is outside)."],
    ["r.poetry", "Poetry", "PROSE", "LIT", "ELA.4.R.1.4", "Stanzas are a poem's paragraphs. Look for rhyme, rhythm, repeated words and sounds — and ask why the poet used them."],
    ["r.textfeat", "Text features & structure", "INFO", "INF", "ELA.4.R.2.1", "Headings, captions, bold words and diagrams are clues. Structure: time order, compare/contrast, or cause → effect?"],
    ["r.central", "Central idea & details", "INFO", "INF", "ELA.4.R.2.2", "The central idea is what MOST of the text is about. Details are the proof."],
    ["r.perspective", "Author's perspective", "INFO", "INF", "ELA.4.R.2.3", "How does the author feel about the topic? Look for opinion words like 'amazing', 'should', 'sadly'."],
    ["r.claim", "Author's claim & evidence", "INFO", "INF", "ELA.4.R.2.4", "The claim is what the author wants you to believe. Evidence = facts, numbers, examples, expert quotes."],
    ["r.figurative", "Figurative language", "AGV", "VOC", "ELA.4.R.3.1", "Simile uses like/as. Metaphor says one thing IS another. Personification gives human actions to things. Ask: what does it really mean?"],
    ["r.summary", "Summarize", "AGV", "LIT|INF", "ELA.4.R.3.2", "A summary is short, in order, has only the most important ideas, and no opinions."],
    ["r.compare", "Compare texts", "AGV", "LIT|INF", "ELA.4.R.3.3", "Same topic, different texts: what does each one focus on? A firsthand account (I was there) vs. a secondhand account (learned about it)."],
    ["v.context", "Context clues", "AGV", "VOC", "ELA.4.V.1.3", "Read the sentences around the word. Look for a definition, example, synonym or opposite nearby."],
    ["v.roots", "Roots, prefixes & suffixes", "AGV", "VOC", "ELA.4.V.1.2", "Break the word apart: un-break-able = not + break + able to = can't be broken."],
    ["v.multi", "Multiple-meaning words", "AGV", "VOC", "ELA.4.V.1.3", "Words like 'bat' or 'pitch' have many meanings. Test each meaning in the sentence."],
    ["v.relations", "Word relationships", "AGV", "VOC", "ELA.4.V.1.3", "Synonyms mean the same, antonyms mean the opposite. Shades of meaning: tiny → small → big → huge → gigantic."],
    ["v.academic", "School words", "AGV", "VOC", "ELA.4.V.1.1", "Words like 'analyze', 'contrast', 'infer' tell you WHAT to do in a question. Know them!"]
  ];
  const WRITING = [
    ["w.org", "Purpose, focus & organization", "WORG", null, "ELA.4.C.1.3 · C.1.4", "Clear claim or main idea in the intro, one reason per body paragraph with a topic sentence, transitions, and a conclusion."],
    ["w.evid", "Evidence & elaboration", "WEVID", null, "ELA.4.C.1.3 · C.1.4 · C.4.1", "Use facts from BOTH sources, name the source ('According to…'), then explain the evidence in your own words."],
    ["w.conv", "Conventions", "WCONV", null, "ELA.4.C.3.1", "Capitals, end marks, commas, quotation marks, and words that agree. Reread slowly to catch mistakes."]
  ];

  const SKILLS = {};
  MATH.forEach(([id, name, unit, cat, ir, std, tip], i) => (SKILLS[id] = { id, name, subj: "math", unit, cat, ir, std, tip, order: i }));
  STRETCH.forEach(([id, name, cat, ir, std, tip], i) => (SKILLS[id] = { id, name, subj: "math", stretch: true, unit: "s", cat, ir, std, tip, order: 100 + i }));
  READING.forEach(([id, name, cat, ir, std, tip], i) => (SKILLS[id] = { id, name, subj: "reading", cat, ir, std, tip, order: 200 + i }));
  WRITING.forEach(([id, name, cat, ir, std, tip], i) => (SKILLS[id] = { id, name, subj: "writing", cat, ir, std, tip, order: 300 + i }));

  // i-Ready domain for a skill; summary/compare depend on whether the passage was literary or informational.
  function iReadyOf(skillId, genre) {
    const s = SKILLS[skillId]; if (!s || !s.ir) return null;
    if (s.ir === "LIT|INF") return genre === "info" ? "INF" : genre === "paired" ? "INF" : "LIT";
    return s.ir;
  }

  // Florida FAST achievement levels (scale score ranges, B.E.S.T. grades 3-5).
  const FAST_LEVELS = {
    math: { 3: [183, 198, 209, 225], 4: [200, 211, 221, 238], 5: [207, 222, 234, 246] },     // lower bounds of Levels 2,3,4,5
    reading: { 3: [null, null, null, null], 4: [199, 213, 224, 237], 5: [206, 222, 232, 246] }
  };
  function fastLevel(subj, grade, score) {
    const cuts = (FAST_LEVELS[subj] || {})[grade]; if (!cuts || cuts[0] == null || score == null) return null;
    let lv = 1; cuts.forEach((c, i) => { if (score >= c) lv = i + 2; }); return lv;
  }
  // Approximate i-Ready grade-level bands (Curriculum Associates placement tables; the school report gives the exact placement).
  // [start of grade-4 range, start of "above grade 4"].
  const IREADY_BANDS = { math: { 4: [465, 527] }, reading: { 4: [557, 630] } };

  root.FASTSkills = { CATS, IREADY, UNITS, SKILLS, iReadyOf, FAST_LEVELS, fastLevel, IREADY_BANDS,
    list: (pred) => Object.values(SKILLS).filter(pred || (() => true)).sort((a, b) => a.order - b.order) };
})(typeof window !== "undefined" ? window : globalThis);
