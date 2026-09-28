/* PSAT Sprint — Reading and Writing generators.
   Grammar (boundaries, extra-info punctuation, agreement, possessives), transitions,
   and data-table evidence questions are assembled fresh from sentence banks each time. */
(function (root) {
  const C = root.PSCore || (typeof require !== "undefined" ? require("./core.js") : null);
  const { mc } = C;
  const BLANK = "______";
  const SEC_Q = "Which choice completes the text so that it conforms to the conventions of Standard English?";
  const TRANS_Q = "Which choice completes the text with the most logical transition?";
  const lastWord = (s) => { const i = s.lastIndexOf(" "); return [s.slice(0, i), s.slice(i + 1)]; };
  const firstWord = (s) => { const i = s.indexOf(" "); return [s.slice(0, i), s.slice(i + 1)]; };
  const lc = (w, pn) => (pn ? w : w[0].toLowerCase() + w.slice(1));

  /* ---------- Sentence boundaries: two independent clauses ---------- */
  const PAIRS = [
    ["Marine biologist Sylvia Earle has logged thousands of hours underwater", "She also led the first team of women aquanauts in 1970."],
    ["The city's first public library opened in 1895 with only a few hundred books", "Today its collection includes more than two million items."],
    ["Honeybees can recognize individual human faces in laboratory tests", "Researchers think the bees treat faces as patterns of shapes."],
    ["The Atacama Desert receives almost no rain in most years", "Some weather stations there have never recorded measurable rainfall."],
    ["Architect Maya Lin was still a college student when she designed a national memorial", "Her design was chosen from more than 1,400 entries."],
    ["Octopuses have three hearts and blue blood", "Two of the hearts pump blood through the gills."],
    ["The composer revised the symphony many times over twenty years", "The final version is nearly twice as long as the first."],
    ["Many desert plants store water in thick, waxy leaves", "This adaptation helps them survive long dry seasons."],
    ["The town replaced its streetlights with LED bulbs last spring", "Its electricity costs dropped by almost a third."],
    ["Mount Everest grows slightly taller each year", "The collision of two tectonic plates keeps pushing it upward."],
    ["Author Octavia Butler wrote her early stories before dawn", "She then went to work at a series of temporary jobs."],
    ["The school's robotics team built its first robot from spare parts", "That robot won second place at the state competition."],
    ["Coral reefs cover less than one percent of the ocean floor", "They support roughly a quarter of all marine species."],
    ["The painter mixed crushed minerals into her paints", "The pigments gave her canvases an unusual shimmer."],
    ["Ancient Roman concrete has lasted for about two thousand years", "Engineers are studying its chemistry to design stronger modern materials."],
    ["The migratory arctic tern travels farther than any other bird", "Its yearly round trip can exceed 70,000 kilometers."],
    ["The novelist spent a decade researching the history of her hometown", "Much of that research appears in the book's detailed setting."],
    ["Some species of bamboo can grow almost a meter in a single day", "Few other plants grow nearly as fast."],
    ["The orchestra performed the piece without a conductor", "The musicians followed cues from the first violinist instead."],
    ["Volunteers counted more than 300 bird species during the survey", "The count was the highest in the event's history."],
    ["The inventor tested hundreds of materials for the light bulb's filament", "Carbonized bamboo worked best in his early experiments."],
    ["The glacier has retreated nearly two kilometers since 1950", "Scientists use old photographs to track the change."],
    ["Sea otters often wrap themselves in kelp while they sleep", "The kelp keeps them from drifting away."],
    ["The museum redesigned its main gallery last year", "Visitors can now see twice as many artworks as before."],
    ["The poet published her first collection at age nineteen", "It sold out within a month."],
    ["The rover landed safely in a large crater", "It began sending images back to Earth within hours."],
    ["Tomatoes were once considered poisonous in parts of Europe", "Many people grew them only as decorative plants."],
    ["The bridge was designed to sway slightly in strong winds", "This flexibility prevents the structure from cracking."],
    ["The farmers planted clover between rows of corn", "The clover added nitrogen to the soil."],
    ["The documentary took six years to film", "Its crew followed a single wolf pack through every season."],
    ["Emperor penguins huddle together during Antarctic winters", "Each bird takes turns moving from the cold edge to the warm center."],
    ["The mathematician solved the problem in an unexpected way", "Her proof used geometry instead of algebra."],
    ["The festival began as a small neighborhood gathering", "It now attracts visitors from around the world."],
    ["Lightning heats the air around it to about 30,000 degrees Celsius", "That temperature is several times hotter than the sun's surface."],
    ["The chef grows most of her restaurant's herbs on its rooftop", "She harvests them just hours before each dinner service."],
    ["The ancient city was buried by volcanic ash", "The ash preserved buildings, tools, and even loaves of bread."]
  ];
  function sec_boundary(r) {
    const [A, B] = r.pick(PAIRS);
    const [aHead, aLast] = lastWord(A);
    const bRaw = B.replace(/\.$/, "");
    const [bFirst, bRest] = firstWord(bRaw);
    const pn = false; // no sentence in PAIRS starts with a proper noun
    const low = lc(bFirst, pn);
    const usePeriod = r.f() < 0.5;
    const right = usePeriod ? `${aLast}. ${bFirst}` : `${aLast}; ${low}`;
    const { o, a } = mc(r, right, [`${aLast}, ${low}`, `${aLast} ${low}`, `${aLast} ${low},`], String);
    return { d: "sec", sk: "Boundaries", lv: 2, p: `${aHead} ${BLANK} ${bRest}.`, q: SEC_Q, o, a,
      e: `Both parts are complete sentences ("${A}" and "${B}"). They must be separated by a period or a semicolon. A comma alone makes a comma splice, and no punctuation makes a run-on.`,
      t: "Test each side of the blank. If both could stand alone as sentences, you need a period or a semicolon (or a comma plus and/but/so).", key: `bnd:${aLast}:${usePeriod}` };
  }

  /* ---------- Extra information set off by a matching pair of commas or dashes ---------- */
  const APPOS = [
    ["The Great Barrier Reef", "the world's largest coral reef system", "stretches more than 2,300 kilometers along the coast of Australia."],
    ["Katherine Johnson", "a mathematician whose calculations guided early spaceflights", "received the Presidential Medal of Freedom in 2015."],
    ["The axolotl", "a salamander native to lakes near Mexico City", "can regrow entire limbs."],
    ["The Rosetta Stone", "a slab inscribed with the same decree in three scripts", "helped scholars decode Egyptian hieroglyphs."],
    ["Jazz pianist Mary Lou Williams", "who arranged music for some of the era's best-known bands", "also mentored many younger musicians."],
    ["The city's oldest bridge", "built entirely of hand-cut stone", "has carried traffic for more than 150 years."],
    ["Photosynthesis", "the process plants use to turn light into chemical energy", "also releases the oxygen most animals breathe."],
    ["The documentary", "filmed over six years in the Alaskan wilderness", "won several international awards."],
    ["Chef Edna Lewis", "author of a celebrated book on Southern cooking", "championed fresh, seasonal ingredients."],
    ["The monarch butterfly", "one of the few insects that migrates thousands of kilometers", "relies on milkweed plants to raise its young."],
    ["Mount Kilimanjaro", "the tallest mountain in Africa", "has glaciers near its summit despite being close to the equator."],
    ["The committee's final report", "which took two years to complete", "recommended building three new parks."],
    ["Physicist Chien-Shiung Wu", "whose experiments overturned a long-accepted law of physics", "was nicknamed the First Lady of Physics."],
    ["The Silk Road", "a network of trade routes linking East Asia and the Mediterranean", "carried ideas as well as goods."],
    ["The school's new greenhouse", "funded entirely by student fundraising", "will supply vegetables to the cafeteria."],
    ["Tardigrades", "tiny animals often called water bears", "can survive extreme heat, cold, and even the vacuum of space."],
    ["The novel's narrator", "an elderly lighthouse keeper", "tells the story through a series of letters."],
    ["Painter Jacob Lawrence", "known for his series about the Great Migration", "used bold colors and simple shapes."],
    ["The Mariana Trench", "the deepest known point in Earth's oceans", "is deeper than Mount Everest is tall."],
    ["The town's annual science fair", "first held in a church basement in 1962", "now fills the entire convention center."]
  ];
  function sec_extra(r) {
    const [S, ap, rest] = r.pick(APPOS);
    const [apHead, apLast] = lastWord(ap);
    const dash = r.f() < 0.35;
    const open = dash ? "—" : ", ";
    const right = dash ? `${apLast}—` : `${apLast},`;
    const wrong = dash ? [`${apLast},`, `${apLast};`, `${apLast}`] : [`${apLast};`, `${apLast}:`, `${apLast}`];
    const { o, a } = mc(r, right, wrong, String);
    return { d: "sec", sk: "Punctuation", lv: 2, p: `${S}${open}${apHead} ${BLANK} ${rest}`, q: SEC_Q, o, a,
      e: `"${ap}" is extra information inserted into the sentence. It opens with ${dash ? "a dash" : "a comma"}, so it must close with a matching ${dash ? "dash" : "comma"}. Read the sentence without it: "${S} ${rest}" still works.`,
      t: "Extra information needs matching punctuation on both sides: two commas or two dashes, never one of each.", key: `app:${apLast}:${dash}` };
  }

  /* ---------- Subject-verb agreement with a distracting phrase ---------- */
  const BE = { s: "is", p: "are", sw: ["are", "were", "have been"], pw: ["is", "was", "has been"] };
  const V = (base, s, pp, ing) => ({ s, p: base, sw: [base, "have " + pp, "were " + ing], pw: [s, "has " + pp, "was " + ing] });
  const AGREE = [
    ["The collection of letters written by the explorer's crew members", "s", BE, "now housed in the national archive."],
    ["The paintings in the museum's newest gallery", "p", BE, "arranged by the year they were created."],
    ["A group of students from three local high schools", "s", V("meet", "meets", "met", "meeting"), "every Saturday to clean the riverbank."],
    ["The results of the long-term study on sleep and memory", "p", V("suggest", "suggests", "suggested", "suggesting"), "that naps can improve learning."],
    ["The flock of migrating geese", "s", V("stop", "stops", "stopped", "stopping"), "at the same lake every autumn."],
    ["Each of the new solar panels on the school roof", "s", V("produce", "produces", "produced", "producing"), "enough power to run several classrooms."],
    ["The bright colors of the coral reef", "p", V("attract", "attracts", "attracted", "attracting"), "thousands of divers each year."],
    ["The owner of the three bakeries on Main Street", "s", BE, "planning to open a fourth location."],
    ["The seeds of this desert plant", "p", BE, "able to survive for decades without water."],
    ["A series of powerful storms", "s", V("threaten", "threatens", "threatened", "threatening"), "the coastal town every hurricane season."],
    ["The instructions for assembling the telescope", "p", V("include", "includes", "included", "including"), "detailed diagrams of every part."],
    ["The history of the city's railways", "s", BE, "the subject of a new museum exhibit."],
    ["The members of the city council", "p", V("vote", "votes", "voted", "voting"), "on the budget each June."],
    ["The main source of the river's pollution", "s", BE, "runoff from nearby farms."],
    ["The tracks left by the dinosaurs", "p", V("reveal", "reveals", "revealed", "revealing"), "how fast the animals could walk."],
    ["The quality of the photographs in these old newspapers", "s", V("surprise", "surprises", "surprised", "surprising"), "many modern readers."],
    ["The ancient maps displayed in the library's rare book room", "p", V("show", "shows", "showed", "showing"), "coastlines that no longer exist."],
    ["One of the scientists on the research team", "s", V("study", "studies", "studied", "studying"), "how octopuses change color."],
    ["The songs on the band's latest album", "p", V("blend", "blends", "blended", "blending"), "folk and electronic music."],
    ["The team of engineers who designed the bridge", "s", BE, "known for its innovative use of recycled steel."]
  ];
  function sec_agree(r) {
    const [subj, num, v, rest] = r.pick(AGREE);
    const right = v[num], wrongs = num === "s" ? v.sw : v.pw;
    const { o, a } = mc(r, right, wrongs, String);
    const head = subj.split(" ").slice(0, 3).join(" ");
    return { d: "sec", sk: "Agreement", lv: 2, p: `${subj} ${BLANK} ${rest}`, q: SEC_Q, o, a,
      e: `The subject is ${num === "s" ? "singular" : "plural"} ("${head}${subj.split(" ").length > 3 ? "…" : ""}"), so the verb must be ${num === "s" ? "singular" : "plural"}: "${right}." Ignore the phrase between the subject and the verb.`,
      t: "Cross out prepositional phrases (of…, in…, from…) to find the real subject.", key: `agr:${subj.slice(0, 20)}` };
  }

  /* ---------- Possessives ---------- */
  const NOUNS = ["scientist", "farmer", "artist", "engineer", "architect", "historian", "researcher", "volunteer", "photographer", "biologist"];
  const HEADS_P = ["findings were published in a leading journal.", "proposal was approved by the city council.", "designs were displayed at the regional fair.", "report surprised many local residents.", "survey results led to a new study."];
  const HEADS_S = ["findings were published in a leading journal.", "proposal was approved by the city council.", "design was displayed at the regional fair.", "report surprised many local residents.", "notebooks were donated to the museum."];
  function sec_poss(r) {
    const n = r.pick(NOUNS), plural = r.f() < 0.55;
    const num = r.pick(["two", "three", "four", "five"]);
    const right = plural ? `${n}s'` : `${n}'s`;
    const wrongs = plural ? [`${n}'s`, `${n}s`, `${n}s's`] : [`${n}s'`, `${n}s`, `${n}s's`];
    const { o, a } = mc(r, right, wrongs, String);
    const head = plural ? r.pick(HEADS_P) : r.pick(HEADS_S);
    const p = plural ? `After months of fieldwork, the ${num} ${BLANK} ${head}` : `After months of fieldwork, the lead ${BLANK} ${head}`;
    return { d: "sec", sk: "Possessives", lv: 1, p, q: SEC_Q, o, a,
      e: plural ? `There are ${num} ${n}s (plural), and the ${head.split(" ")[0]} belong to them, so you need a plural possessive: "${n}s'."` : `There is one lead ${n} (singular), and the ${head.split(" ")[0]} belong to that person, so you need a singular possessive: "${n}'s."`,
      t: "Singular possessive: 's. Plural possessive (ending in s): s'. No apostrophe if nothing is owned.", key: `poss:${n}:${plural}` };
  }

  /* ---------- Transitions ---------- */
  const TRANS = {
    contrast: ["However,", "Nevertheless,", "In contrast,", "Even so,", "Still,"],
    result: ["Therefore,", "As a result,", "Consequently,", "Thus,"],
    addition: ["Moreover,", "In addition,", "Furthermore,", "Additionally,"],
    example: ["For example,", "For instance,"],
    similarity: ["Similarly,", "Likewise,"]
  };
  const CLASH = { contrast: [], result: [], addition: ["similarity", "example"], example: ["addition"], similarity: ["addition"] };
  const TPAIRS = [
    ["contrast", "Many early critics dismissed the novel as overly sentimental.", "today it is widely taught as an American classic."],
    ["contrast", "The new stadium was expected to boost business in the neighborhood.", "several nearby shops closed within a year of its opening."],
    ["contrast", "Most frogs lay their eggs in water.", "the coqui frog of Puerto Rico lays its eggs on land."],
    ["contrast", "The experiment's first trials produced promising results.", "later trials failed to repeat them."],
    ["contrast", "Tickets for the concert sold out within minutes.", "the hall was only half full on the night of the show because of a snowstorm."],
    ["contrast", "Bats are often thought of as blind.", "most bat species can see quite well."],
    ["contrast", "The author's first two novels received little attention.", "her third became an international bestseller."],
    ["contrast", "Mercury is the planet closest to the sun.", "Venus, not Mercury, is the hottest planet in the solar system."],
    ["result", "The bridge's steel cables had begun to corrode.", "engineers closed it to traffic until repairs were complete."],
    ["result", "The town received twice its normal rainfall in April.", "the reservoir was full for the first time in a decade."],
    ["result", "Honeybees pollinate many food crops.", "a decline in bee populations could affect food supplies."],
    ["result", "The library extended its evening hours.", "the number of students using its study rooms nearly doubled."],
    ["result", "Cheetahs have lightweight bodies and long legs.", "they can reach top speeds of more than 100 kilometers per hour."],
    ["result", "The factory switched to solar power.", "its monthly energy costs fell sharply."],
    ["result", "Glass is made mostly of sand, which is abundant.", "it is relatively inexpensive to produce."],
    ["result", "The team had practiced the routine hundreds of times.", "they performed it flawlessly at the championship."],
    ["addition", "Walking daily can strengthen the heart.", "it has been shown to improve mood and sleep."],
    ["addition", "The new bus line will shorten commute times for thousands of residents.", "it will reduce traffic on the city's busiest avenue."],
    ["addition", "The museum's renovation added three new galleries.", "it created a hands-on learning center for children."],
    ["addition", "The recipe calls for only five ingredients.", "it can be prepared in under twenty minutes."],
    ["addition", "Mangrove forests protect coastlines from storm surges.", "they provide nurseries for many species of fish."],
    ["addition", "The author wrote twelve novels during her career.", "she published more than forty short stories."],
    ["addition", "Recycling aluminum saves energy.", "it reduces the need to mine new ore."],
    ["example", "Some animals use tools to find food.", "sea otters use rocks to crack open shellfish."],
    ["example", "Many everyday words come from other languages.", "the English word \"kindergarten\" comes from German."],
    ["example", "The artist often reused everyday objects in her sculptures.", "one of her best-known works is made from old bicycle wheels."],
    ["example", "Several planets have rings.", "Saturn's rings are made mostly of ice particles."],
    ["example", "Plants have developed clever ways to spread their seeds.", "burdock seeds cling to the fur of passing animals."],
    ["example", "Some early inventions were discovered by accident.", "a scientist noticed that a melted candy bar in his pocket had been heated by a radar device, which led to the microwave oven."],
    ["similarity", "Wolves live and hunt in packs led by dominant individuals.", "African wild dogs hunt in cooperative groups with clear leaders."],
    ["similarity", "The first poem in the collection describes a childhood home in vivid detail.", "the final poem returns to that house, now seen through an adult's eyes."],
    ["similarity", "Elephants mourn members of their herd that have died.", "some whale species have been observed staying beside dead companions for days."],
    ["similarity", "The city of Venice was built on wooden pilings driven into mud.", "parts of Amsterdam rest on millions of wooden poles."],
    ["similarity", "Octopuses can change their skin color to blend into their surroundings.", "chameleons can shift color in response to light and temperature."]
  ];
  function eoi_trans(r) {
    const [rel, s1, s2] = r.pick(TPAIRS);
    const right = r.pick(TRANS[rel]);
    const others = Object.keys(TRANS).filter((k) => k !== rel && !CLASH[rel].includes(k));
    const wrongs = r.shuffle(others).slice(0, 3).map((k) => r.pick(TRANS[k]));
    const { o, a } = mc(r, right, wrongs, String);
    const why = { contrast: "The second sentence contrasts with or goes against what the first sentence sets up.", result: "The second sentence is a result or consequence of the first.", addition: "The second sentence adds another point in the same direction as the first.", example: "The second sentence gives a specific example of the general idea in the first.", similarity: "The second sentence describes something similar to the first." }[rel];
    return { d: "eoi", sk: "Transitions", lv: 2, p: `${s1} ${BLANK} ${s2}`, q: TRANS_Q, o, a,
      e: `${why} "${right.replace(",", "")}" signals that relationship.`,
      t: "Before looking at the choices, name the relationship between the sentences: contrast, result, addition, example, or similarity.", key: `tr:${s1.slice(0, 24)}` };
  }

  /* ---------- Conjunctive adverbs between two sentences (harder) ---------- */
  function sec_conjadv(r) {
    const [rel, s1, s2] = r.pick(TPAIRS);
    const adv = r.pick(TRANS[rel]).replace(",", "");
    const advLow = adv[0].toLowerCase() + adv.slice(1);
    const [aHead, aLast] = lastWord(s1.replace(/\.$/, ""));
    const [bFirst, bRest] = firstWord(s2);
    const right = `${aLast}; ${advLow}, ${bFirst}`;
    const { o, a } = mc(r, right, [`${aLast}, ${advLow}, ${bFirst}`, `${aLast}; ${advLow} ${bFirst}`, `${aLast}, ${advLow} ${bFirst}`], String);
    return { d: "sec", sk: "Boundaries", lv: 3, p: `${aHead} ${BLANK} ${bRest}`, q: SEC_Q, o, a,
      e: `Both sides are complete sentences, and "${advLow}" is not a joining word like "and" or "but." So the sentences need a semicolon (or period) before "${advLow}," and "${advLow}" needs a comma after it.`,
      t: "However, therefore, moreover, and for example can't join sentences on their own: use \"; however,\" between two complete sentences.", key: `cadv:${s1.slice(0, 24)}:${adv}` };
  }

  /* ---------- Quantitative evidence ---------- */
  const TIMELINE = [
    { intro: "A student surveyed classmates about their average daily screen time.", measure: "average daily screen time", unit: "hours", cats: ["Grade 9", "Grade 10", "Grade 11", "Grade 12"], period: "grade", base: [4, 6] },
    { intro: "A town tracked the number of visitors to its public library.", measure: "the number of library visitors", unit: "thousand visitors", cats: ["2021", "2022", "2023", "2024"], period: "year", base: [30, 50] },
    { intro: "A researcher measured the average height of seedlings grown in a greenhouse.", measure: "average seedling height", unit: "centimeters", cats: ["Week 1", "Week 2", "Week 3", "Week 4"], period: "week", base: [3, 8] },
    { intro: "A farmers market recorded its average weekly sales.", measure: "average weekly sales", unit: "thousand dollars", cats: ["Spring", "Summer", "Fall", "Winter"], period: "season", base: [8, 15] }
  ];
  const GROUPS = [
    { intro: "Researchers compared how far different species of songbird migrate each year.", measure: "average migration distance", unit: "kilometers", cats: ["Blackpoll warbler", "Wood thrush", "Barn swallow", "Ruby-throated hummingbird"], base: [1500, 5000], int: true },
    { intro: "A student compared the average number of daily visitors at four city parks.", measure: "average daily visitors", unit: "visitors", cats: ["Riverside Park", "Oak Hill Park", "Harbor Green", "Maple Commons"], base: [300, 900], int: true },
    { intro: "An agricultural study compared tomato yields using four fertilizers.", measure: "average yield per plant", unit: "kilograms", cats: ["Fertilizer A", "Fertilizer B", "Fertilizer C", "Fertilizer D"], base: [2, 6] }
  ];
  const fx = (v, int) => (int ? Math.round(v).toLocaleString("en-US") : v.toFixed(1));
  function ii_quant(r) {
    if (r.f() < 0.5) {
      const T = r.pick(TIMELINE), step = () => (T.base[1] - T.base[0]) * (0.08 + r.f() * 0.12);
      const v1 = T.base[0] + r.f() * (T.base[1] - T.base[0]) * 0.4, v2 = v1 + step(), v3 = v2 + step(), v4 = v3 - (v3 - v2) * (0.25 + r.f() * 0.4);
      const vals = [v1, v2, v3, v4].map((v) => Math.round(v * 10) / 10);
      const [c1, c2, c3, c4] = T.cats, [a1, a2, a3, a4] = vals.map((v) => fx(v));
      const right = `${cap(T.measure)} rose from ${a1} ${T.unit} in ${c1} to ${a3} ${T.unit} in ${c3}, then dipped slightly to ${a4} ${T.unit} in ${c4}.`;
      const { o, a } = mc(r, right, [`${cap(T.measure)} was highest in ${c4}, at ${a4} ${T.unit}.`, `${cap(T.measure)} was ${a2} ${T.unit} in ${c2}.`, `${cap(T.measure)} fell from ${a1} ${T.unit} in ${c1} to ${a2} ${T.unit} in ${c2}.`], String);
      return { d: "ii", sk: "Quantitative evidence", lv: 2, p: `${T.intro}\n\nThe student claims that ${T.measure} generally increased from ${c1} to ${c4}, though it did not rise every ${T.period}.`,
        table: { head: ["", `${cap(T.measure)} (${T.unit})`], rows: T.cats.map((c, i) => [c, fx(vals[i])]) },
        q: "Which choice most effectively uses data from the table to support the claim?", o, a,
        e: `The claim has two parts: an overall increase AND at least one ${T.period} without an increase. Only this choice shows both. Check the others against the table: some are false, and some are true but don't address the claim.`,
        t: "Data questions: every word of the claim must be supported. Eliminate choices that misread the table first.", key: `qt:${T.measure}:${a1}` };
    }
    const Gp = r.pick(GROUPS), idx = r.int(0, 3);
    let vals = Gp.cats.map(() => Gp.base[0] + r.f() * (Gp.base[1] - Gp.base[0]) * 0.8);
    vals[idx] = Math.max(...vals) * (1.08 + r.f() * 0.15);
    vals = vals.map((v) => (Gp.int ? Math.round(v) : Math.round(v * 10) / 10));
    const order = vals.map((v, i) => i).sort((x, y) => vals[y] - vals[x]);
    const top = order[0], second = order[1], low1 = order[2], low2 = order[3];
    const cats = Gp.cats;
    const right = `${cats[top]} had the highest ${Gp.measure}, ${fx(vals[top], Gp.int)} ${Gp.unit}, compared with ${fx(vals[second], Gp.int)} ${Gp.unit} for ${cats[second]}, the next highest.`;
    const { o, a } = mc(r, right, [`${cats[second]} had the highest ${Gp.measure}, ${fx(vals[second], Gp.int)} ${Gp.unit}.`, `${cats[low1]} had a higher ${Gp.measure} than ${cats[low2]}.`, `The ${Gp.measure} of ${cats[top]} was lower than that of ${cats[low1]}.`], String);
    return { d: "ii", sk: "Quantitative evidence", lv: 2, p: `${Gp.intro}\n\nThey claim that ${cats[top]} had the highest ${Gp.measure} of the four.`,
      table: { head: ["", `${cap(Gp.measure)} (${Gp.unit})`], rows: cats.map((c, i) => [c, fx(vals[i], Gp.int)]) },
      q: "Which choice most effectively uses data from the table to support the claim?", o, a,
      e: `The claim is about which group is highest, so the best evidence compares ${cats[top]} with the others. Choices about other groups may be true but don't support this claim, and one misreads the table.`,
      t: "Match the claim first, then check the numbers.", key: `qg:${Gp.measure}:${vals[top]}` };
  }
  function cap(s) { return s[0].toUpperCase() + s.slice(1); }

  const GENS = { sec: [sec_boundary, sec_boundary, sec_extra, sec_agree, sec_poss, sec_conjadv], eoi: [eoi_trans], ii: [ii_quant] };
  const GENS_BY_LEVEL = { sec: { 1: [sec_poss, sec_boundary, sec_agree], 3: [sec_conjadv, sec_conjadv, sec_extra, sec_agree] } };
  function build(fn, r) {
    for (let i = 0; i < 30; i++) { try { const q = fn(r); q.gen = fn.name; return q; } catch (e) { if (!e || !e.retry) throw e; } }
    return null;
  }
  function generate(domain, rng, avoid, lv) {
    const byLv = GENS_BY_LEVEL[domain];
    const list = (byLv && byLv[lv]) || GENS[domain];
    if (!list) return null;
    let last = null;
    for (let t = 0; t < 25; t++) { const q = build(rng.pick(list), rng); if (!q) continue; last = q; if (!avoid || !avoid.has(q.key)) return q; }
    return last;
  }

  root.RWGen = { generate, build, fns: { sec_boundary, sec_extra, sec_agree, sec_poss, sec_conjadv, eoi_trans, ii_quant }, counts: { PAIRS: PAIRS.length, APPOS: APPOS.length, AGREE: AGREE.length, TPAIRS: TPAIRS.length } };
  if (typeof module !== "undefined") module.exports = root.RWGen;
})(typeof window !== "undefined" ? window : globalThis);
