/* Test Prep Hub — Reading and Writing question bank, batch 4.
   Fresh Information and Ideas items (central ideas, inferences, textual evidence) to keep the hand-written
   bank from running dry. The correct answer is always listed first (a: 0); the app shuffles choices when shown. */
(function (root) {
  const BANK = root.RWBank || (typeof require !== "undefined" ? require("./rwbank.js") : []);
  const B = "______";
  const MAIN = "Which choice best states the main idea of the text?";
  const INF = "Which choice most logically completes the text?";
  const SUP = "Which finding, if true, would most directly support the claim?";
  const Q = (id, sk, lv, p, q, o, e, t) => ({ id, d: "ii", sk, lv, p, q, o, a: 0, e, t });
  const TM = "Main idea answers cover the whole passage, not one detail, and never go beyond what it says.";
  const TI = "The right answer follows from the evidence in the text. Don't add new facts of your own.";
  const TE = "Match the claim's exact subject and outcome. A true statement that is off-topic is still wrong.";

  const MORE = [
    /* ---------- Central ideas ---------- */
    Q("i30", "Central ideas", 1, "Lichens look like a single organism, but each one is really a partnership between a fungus and an alga or bacterium. The fungus gives the lichen its structure and absorbs water and minerals, while its partner uses sunlight to make sugars that feed them both.", MAIN,
      ["A lichen is a partnership in which a fungus and a sun-powered partner each supply what the other needs.", "Lichens grow faster than most plants because they make their own sugars.", "Fungi cannot survive anywhere without direct sunlight.", "Algae and bacteria are really the same kind of organism."],
      "Both sentences describe how the two partners share the work. The other choices are not stated or go beyond the text.", TM),
    Q("i31", "Central ideas", 2, "For decades, historians assumed that medieval peasants rarely traveled far from their villages. But court records from several English counties show peasants regularly journeying dozens of miles to attend markets, fairs, and legal hearings, suggesting that rural life was more mobile than once believed.", MAIN,
      ["Court records suggest that medieval peasants traveled more widely than historians once assumed.", "Medieval markets and fairs mattered more to peasants than legal hearings did.", "Historians have never made use of medieval court records.", "English villages were larger than historians once believed."],
      "The text contrasts an old assumption (peasants stayed put) with what the records show (they traveled). Nothing is said about market importance, historians ignoring records, or village size.", TM),
    Q("i32", "Central ideas", 2, "The Hubble Space Telescope was launched in 1990 with a flawed mirror that blurred its images. In 1993, astronauts installed corrective optics that worked like eyeglasses for the telescope. Since then, Hubble has produced sharp images that have helped astronomers measure the age of the universe.", MAIN,
      ["Although Hubble launched with a flawed mirror, a repair let it deliver clear images that advanced astronomy.", "Astronauts have repaired Hubble more often than any other spacecraft.", "Eyeglasses inspired the design of Hubble's original mirror.", "Measuring the age of the universe was the main reason Hubble was launched."],
      "The text moves from the flaw, to the fix, to the payoff. The other choices bring in claims the text never makes.", TM),
    Q("i33", "Central ideas", 3, "Monarch butterflies that migrate to Mexico can live about eight months, while monarchs born in summer live only a few weeks. Biologists have found that the long-lived migrants are born with reproductive organs that stay dormant until spring, which saves energy and may help explain their longevity.", MAIN,
      ["Migrating monarchs live far longer than summer monarchs, and delayed reproduction may be one reason.", "Monarchs migrate to Mexico because their reproductive organs are dormant.", "Summer monarchs are less numerous than migrating monarchs.", "Biologists cannot explain how monarchs find their way to Mexico."],
      "The text compares lifespans and offers a possible explanation. The second choice reverses cause and effect, and the last two are never mentioned.", TM),
    Q("i34", "Central ideas", 1, "Public libraries have changed with the times. Besides lending books, many now offer 3D printers, job-search workshops, tax-filing help, and seed libraries where gardeners can borrow seeds for free.", MAIN,
      ["Many public libraries now provide services well beyond lending books.", "Three-dimensional printers are the most popular service in public libraries.", "Fewer people borrow books from libraries than in the past.", "Gardeners prefer seed libraries to garden stores."],
      "Every example in the text is a service other than lending books. No popularity, trend, or preference claims are made.", TM),
    Q("i35", "Central ideas", 3, "Economists once treated a country's wealth as the main predictor of how happy its citizens report being. But one long study found that, beyond a moderate income, extra earnings added little to life satisfaction, whereas strong friendships and trust in neighbors continued to predict satisfaction at every income level.", MAIN,
      ["Beyond a moderate income, social ties predict how satisfied people are better than additional wealth does.", "Economists have proved that wealth has no connection to happiness.", "Trust in neighbors is higher in wealthier countries.", "Friendship is the only factor that affects life satisfaction."],
      "The text says extra income adds little past a point while social ties keep mattering. 'Proved' and 'only' go further than the text does.", TM),

    /* ---------- Inferences ---------- */
    Q("i36", "Inferences", 1, `Ecologists removed every sea star from a stretch of rocky shoreline. Within a year, mussels, which sea stars eat, had spread across the rocks and crowded out most other species. This result suggests that sea stars help keep the shoreline diverse by ${B}`, INF,
      ["preventing mussels from taking over the rocks.", "competing with other species for food.", "providing shelter for mussels.", "eating most of the other species on the rocks."],
      "Without sea stars, mussels took over and other species disappeared, so sea stars must hold the mussels in check.", TI),
    Q("i37", "Inferences", 2, `Linguists comparing two neighboring languages found dozens of grammatical structures that the languages share but that appear in neither language's known ancestors. The linguists concluded that the similarities most likely arose because ${B}`, INF,
      ["speakers of the two languages had long been in close contact and borrowed from one another.", "the two languages descended from a single recent ancestor.", "both languages are older than their known ancestors.", "neither language has changed in several centuries."],
      "Shared features that don't come from the ancestors point to borrowing through contact. A common recent ancestor would have passed the features down.", TI),
    Q("i38", "Inferences", 2, `Engineers testing a new bridge cable found that it stretched by the same small amount each time a fixed weight was added, and that it returned to its original length every time the weight was removed. These results indicate that, within the range tested, the cable ${B}`, INF,
      ["springs back to its original length after being stretched.", "becomes permanently longer under load.", "weakens a little each time it is loaded.", "cannot support more than the weight tested."],
      "Returning to its original length every time means the stretch is temporary. Nothing in the test shows weakening or a breaking point.", TI),
    Q("i39", "Inferences", 3, `Surveys show that people who keep a daily journal report lower stress than people who do not. However, the people in the surveys decided for themselves whether to journal. A researcher therefore cautions that the surveys alone cannot show that journaling lowers stress, because ${B}`, INF,
      ["people who already feel calmer may simply be more likely to keep a journal.", "journaling takes too much time to be practical for most people.", "stress is difficult to define in a survey.", "most of the people surveyed did not keep journals."],
      "Because people chose for themselves, the cause could run the other way: calmer people may be the ones who journal. The other choices don't explain the researcher's caution.", TI),
    Q("i40", "Inferences", 1, `A desert fox's large ears give off body heat, which helps the fox stay cool on hot days. Arctic foxes, which live in freezing climates, have small, rounded ears. This difference suggests that small ears help Arctic foxes ${B}`, INF,
      ["avoid losing too much body heat.", "hear prey moving beneath deep snow.", "stay cooler during the summer.", "hide from their predators."],
      "If large ears release heat, small ears release less, which helps in freezing weather.", TI),
    Q("i41", "Inferences", 3, `In a classroom experiment, students who took handwritten notes scored higher on conceptual questions a week later than students who typed their notes, even though the typists wrote down more words. One explanation is that handwriting is slower, which pushes students to ${B}`, INF,
      ["summarize ideas in their own words instead of copying what they hear.", "memorize the lecture word for word.", "skip the most difficult parts of the lecture.", "rewrite their notes later in the week."],
      "The typists wrote more words yet remembered concepts less well, so slower writing must force the writers to process and condense ideas.", TI),

    /* ---------- Textual evidence ---------- */
    Q("e11", "Textual evidence", 1, "A student claims that regular exercise improves sleep quality in teenagers.", SUP,
      ["In a six-week trial, teenagers who exercised for 30 minutes a day fell asleep faster and woke less often than a similar group who did not exercise.", "Teenagers who sleep more tend to spend more time playing video games.", "Many teenagers join sports teams in order to make friends.", "Adults who exercise regularly report feeling more energetic at work."],
      "Only the first choice compares teenagers who exercise with those who don't and measures sleep. The adult finding and the social finding are off-topic.", TE),
    Q("e12", "Textual evidence", 2, "An archaeologist hypothesizes that an ancient settlement was abandoned suddenly rather than gradually.", "Which finding, if true, would most directly support the archaeologist's hypothesis?",
      ["Tools, cooking pots, and half-finished meals were found left in place in many of the houses.", "Several houses had been rebuilt more than once over the centuries.", "The settlement was built beside a river.", "Coins found at the site came from distant regions."],
      "Belongings left behind, even unfinished meals, suggest people left in a hurry. The other findings say nothing about how the settlement ended.", TE),
    Q("e13", "Textual evidence", 2, "In an imagined short story, a young pianist is anxious about an upcoming recital. A student claims that her anxiety is disrupting her daily routine.", "Which quotation from the story would most effectively illustrate the student's claim?",
      ["\"She ate breakfast standing at the counter, fingers tapping scales on the cold granite, and left half her tea untouched.\"", "\"The recital hall, built in 1921, seated nearly four hundred.\"", "\"Her teacher had studied in Vienna but spoke little of it.\"", "\"Outside, the first leaves had begun to turn.\""],
      "Standing to eat, tapping scales, and leaving the tea untouched shows her worry changing an ordinary morning. The other quotations give background that has nothing to do with her routine.", "For quotation questions, ask which line shows the specific idea in the claim."),
    Q("e14", "Textual evidence", 3, "A researcher claims that a new fertilizer, rather than the unusually warm weather, caused a farm's higher tomato yield this year.", "Which finding, if true, would most directly undermine the researcher's claim?",
      ["Neighboring farms that did not use the fertilizer saw similar increases in yield during the same warm season.", "The new fertilizer costs more than the one the farm used before.", "This year's tomatoes were larger than last year's tomatoes.", "Some farmers prefer organic fertilizers."],
      "If farms without the fertilizer also did better, the warm weather is a likelier cause. The other findings do not separate fertilizer from weather.", "Weaken questions: look for another explanation that fits the same results."),
    Q("e15", "Textual evidence", 3, "A historian argues that a mayor's public statements show she valued economic growth over environmental protection.", "Which quotation from the mayor would best support the historian's argument?",
      ["\"A new park is pleasant, but a new factory puts four hundred families back to work, and that must come first.\"", "\"I have lived in this city all my life, and I am proud to serve it.\"", "\"The river is cleaner than it was twenty years ago, and I intend to keep it that way.\"", "\"Every budget is a compromise, and I welcome the council's advice.\""],
      "Only the first quotation ranks jobs above something environmental. The river quotation points the opposite way.", TE),
    Q("e16", "Textual evidence", 1, "A student claims that honeybees can tell flowers apart by scent.", SUP,
      ["When trained to expect sugar water near one flower scent, bees later flew mainly to flowers with that scent.", "Bees visit flowers more often in warm weather.", "A honeybee colony can contain up to 50,000 bees.", "Brightly colored flowers tend to produce more nectar."],
      "Bees choosing the trained scent shows they can tell scents apart. Weather, colony size, and color do not.", TE),
    Q("e17", "Textual evidence", 2, "In an imagined poem, the speaker describes returning to a childhood home. A student claims that the speaker feels both nostalgia and a sense of loss.", "Which quotation from the poem would most effectively support the student's claim?",
      ["\"The porch still creaks the way I remembered, though the voices that once filled it have gone quiet.\"", "\"The house, painted green in spring, sits at the end of a long gravel road.\"", "\"I noticed the new neighbors had planted a row of maples.\"", "\"We sold the house in June, and the buyers moved in by August.\""],
      "'Still creaks the way I remembered' shows nostalgia, and 'voices ... have gone quiet' shows loss. The others only describe or report.", "A claim with two parts needs a quotation that shows both."),
    Q("e18", "Textual evidence", 3, "An economist claims that the town's new bike lanes increased business for nearby shops.", "Which finding, if true, would most strongly support the economist's claim?",
      ["Shops on streets with new bike lanes reported higher sales the following year than comparable shops on streets without bike lanes.", "Cyclists in the town reported that the new lanes felt safer than the old roads.", "The town spent more on its bike lanes than on road repairs.", "Shop owners said they liked the appearance of the new lanes."],
      "A comparison of sales on streets with and without lanes ties the lanes to business. Safety, spending, and appearance say nothing about sales.", TE)
  ];

  for (const q of MORE) BANK.push(q);
  root.RWBank = BANK;
  if (typeof module !== "undefined") module.exports = BANK;
})(typeof window !== "undefined" ? window : globalThis);
