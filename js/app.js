/* Test Prep Hub — app */
(function () {
  "use strict";
  const { makeRng, checkSpr } = window.PSCore;
  const MG = window.MathGen, RW = window.RWGen, BANK = window.RWBank, STRAT = window.Strategies;

  /* ================= Reference data ================= */
  const DOMAINS = [
    { id: "ii", sec: "rw", name: "Information and Ideas", n: 14, pace: 71, what: "Central ideas, evidence from text and data tables, inferences" },
    { id: "cs", sec: "rw", name: "Craft and Structure", n: 14, pace: 71, what: "Words in context, text purpose and structure, paired texts" },
    { id: "eoi", sec: "rw", name: "Expression of Ideas", n: 11, pace: 71, what: "Transitions and rhetorical synthesis from student notes" },
    { id: "sec", sec: "rw", name: "Standard English Conventions", n: 15, pace: 71, what: "Punctuation between clauses, agreement, verb forms, possessives" },
    { id: "alg", sec: "math", name: "Algebra", n: 15, pace: 95, what: "Linear equations, systems, inequalities, linear functions and models" },
    { id: "adv", sec: "math", name: "Advanced Math", n: 14, pace: 95, what: "Quadratics, exponentials, nonlinear functions, equivalent expressions" },
    { id: "psda", sec: "math", name: "Problem-Solving and Data Analysis", n: 9, pace: 95, what: "Percentages, rates, ratios, statistics, probability" },
    { id: "geo", sec: "math", name: "Geometry and Trigonometry", n: 6, pace: 95, what: "Triangles, angles, circles, area and volume, right-triangle trig" }
  ];
  const DOM = Object.fromEntries(DOMAINS.map((d) => [d.id, d]));
  const FORMATS = { psat: { name: "PSAT/NMSQT", lo: 160, hi: 760 }, sat: { name: "SAT", lo: 200, hi: 800 } };
  const MOD = { rw: { n: 27, min: 32, name: "Reading and Writing" }, math: { n: 22, min: 35, name: "Math" } };
  const lvList = (a, b, c) => [...Array(a).fill(1), ...Array(b).fill(2), ...Array(c).fill(3)];
  const MATH_LV = { psat: { std: lvList(6, 10, 6), hard: lvList(0, 8, 14), easy: lvList(12, 10, 0) }, sat: { std: lvList(4, 10, 8), hard: lvList(0, 6, 16), easy: lvList(8, 12, 2) } };
  const RW_MIX = [["cs", 7], ["ii", 7], ["sec", 7], ["eoi", 6]];
  // Per 22-question module. PSAT/NMSQT ≈ 35/32.5/20/12.5%; SAT ≈ 35/35/15/15% (College Board test specifications).
  const MATH_MIXES = { psat: { alg: 8, adv: 7, psda: 4, geo: 3 }, sat: { alg: 8, adv: 8, psda: 3, geo: 3 } };
  const RW_LV = { std: [1, 2, 2, 2, 2, 3, 3], hard: [2, 2, 3, 3, 3, 3, 3], easy: [1, 1, 1, 2, 2, 2, 2] };

  // Each plan task is text, or [text, action]. Actions open the right place in the app and tick the task
  // automatically when it's finished; "ext" links open an outside site and are ticked by hand.
  const BB = { k: "ext", url: "https://bluebook.collegeboard.org/" }, MYP = { k: "ext", url: "https://mypractice.collegeboard.org/" };
  const PLAN_TEMPLATE = [
    { title: "Baseline, part 1", tasks: [["Install the Bluebook app and sign in with your College Board account", BB], ["Download {TEST} Practice Test 1 in Bluebook", BB], ["Take the Reading and Writing section in Bluebook, timed (64 min, both modules)", BB], ["Warm up here: a 10-question practice set", { k: "practice", n: 10 }]] },
    { title: "Baseline, part 2", tasks: [["Take the Math section of Bluebook Practice Test 1, timed (70 min)", BB], ["Open your scores at mypractice.collegeboard.org and count misses in each skill domain", MYP], ["Enter the results in the Log a test tab", { k: "log" }]] },
    { title: "Fix the biggest leak", tasks: [["Read the explanation for every missed question in Bluebook", MYP], ["Your focus set: 20 questions picked from your misses", { k: "focus", n: 20 }], ["Retry the Mistake notebook", { k: "notebook" }]] },
    { title: "Grammar rules day", tasks: [["Practice 20 Standard English Conventions questions", { k: "practice", doms: ["sec"], n: 20 }], ["Learn the grammar rules: flip through the rule cards", { k: "deck", area: "Grammar" }], ["Spend 20 minutes with Desmos: graph a line, find an intersection, find a vertex", { k: "ext", url: "https://www.desmos.com/calculator" }]] },
    { title: "Math under the clock", tasks: [["Take a timed Math section: an in-app mock, or a Khan Academy practice test Math section (log it in Log a test)", { k: "mock", parts: ["math"], alt: "khan" }], ["Review every miss in the results", { k: "mockreview" }], ["Pacing drill: 10 math questions with the timer on (about 1½ minutes each)", { k: "practice", doms: ["alg", "adv", "psda", "geo"], n: 10, timed: true }], ["Geometry Lab: Missions 1 and 2 (parallel lines, triangle angles)", { k: "lab", m: [1, 2] }]] },
    { title: "Dress rehearsal", heavy: true, tasks: [["2-minute warm-up first: your top 5 rules", { k: "deck", top: 5 }], ["Take Bluebook {TEST} Practice Test 2 in one sitting, starting at the same time as the real test", BB], ["Take only the scheduled 10-minute break"], ["Enter the results in the Log a test tab", { k: "log", src: "bluebook" }]] },
    { title: "Review the rehearsal", tasks: [["Test review: go through your Practice Test 2 misses and say what really happened", { k: "treview" }], ["Compare your Progress page with Test 1 and note what improved", { k: "visit", tab: "matrix" }], ["Your focus set: 20 questions picked from your misses", { k: "focus", n: 20 }], ["Geometry Lab: Missions 3 and 4 (Pythagoras, SOH CAH TOA)", { k: "lab", m: [3, 4] }]] },
    { title: "Refresh what you forgot", tasks: ["Open your fix-it list (card on Today) and finish the 8 in Learn first: the lesson, then Practice 5 for each", ["Concept Lab: Missions 1, 4 and 5 (how many solutions, factors, shifting graphs: the ones you forgot or guessed)", { k: "lab", p: "cx", m: [1, 4, 5] }], ["Timed focus drill: 10 math questions at test pace. Halfway through, stop for 3 slow breaths, then keep going", { k: "practice", doms: ["adv", "alg"], n: 10, timed: true }], ["Your focus set: 15 questions", { k: "focus", n: 15 }], ["If you have time: Concept Lab Missions 2, 3, 6 and 7", { k: "lab", p: "cx", m: [2, 3, 6, 7] }]] },
    { title: "Light review", light: true, tasks: [["Flip through your strategy cards and read your night-before sheet (Learn tab)", { k: "visit", tab: "review" }], ["One 10-question mixed practice set, nothing more", { k: "practice", n: 10 }], ["Charge the device, update Bluebook, and run its exam readiness check", BB], "Pack what the school asks for: device, charger, admission info", "Lay out light, comfortable layers (you felt hot during the practice test) and a water bottle for the break", "Shower tonight, 2 minutes of slow breathing, lights out by 10 pm", ["Geometry Lab: Missions 5 to 7 (similar triangles, area and volume, shortcuts) and the cheat sheet", { k: "lab", m: [5, 6, 7] }]] },
    { title: "Test day", light: true, tasks: ["Eat a real breakfast and wear light layers", "Before each module: 3 slow breaths and roll your shoulders. Do it again any time you feel hot or rushed", "Take care on Module 1: it decides whether Module 2 is the harder set", "Math: check the clock at question 11. Over 90 seconds on one question? Guess, flag it, move on", "Stuck between two answers? Pick the one the text fully supports, flag it, move on", "Never leave a question blank; wrong answers cost nothing", "Use Desmos and the reference sheet to check math answers"] }
  ];

  // The plan counts back from the student's own test date: day 1 is 9 days before, the last day is test day.
  // From today on, two tasks adapt to the student: daily flashcards, and extra work on their weakest practice area.
  function plan() {
    const end = parseYmd(S.settings.date || "2026-10-07"), label = S.settings.kind === "sat" ? "SAT" : "PSAT/NMSQT", t = today();
    const weak = weakArea();
    return PLAN_TEMPLATE.map((d, i) => {
      const dt = new Date(end); dt.setDate(end.getDate() - (PLAN_TEMPLATE.length - 1 - i));
      const date = ymd(dt), tasks = [], go = [];
      d.tasks.forEach((x) => { const [txt, g] = Array.isArray(x) ? x : [x, null]; tasks.push(txt.replace("{TEST}", label)); go.push(g); });
      if (date >= t && !d.light && !GUEST) {
        tasks.push("Flip today's flashcards"); go.push({ k: "deck" });
        // Today's weak area is fixed once chosen, so the task doesn't change under the student mid-day.
        const pw = S.planWeak || (S.planWeak = {});
        if (date === t && !pw[date] && weak) pw[date] = { d: weak.d, c: weak.c, t: weak.t };
        const wk = pw[date] || weak;
        if (wk && DOM[wk.d] && !d.heavy) { tasks.push("10 " + DOM[wk.d].name + " questions, starting easy (your lowest area in practice: " + wk.c + " of " + wk.t + " right)"); go.push({ k: "practice", doms: [wk.d], n: 10 }); }
      }
      return { date, title: d.title, tasks, go };
    });
  }
  // The practice area with the lowest accuracy (at least 8 tries, under 50%), if any.
  function weakArea() {
    let best = null;
    for (const [d, st] of Object.entries(S.stats || {})) {
      if (!DOM[d] || st.att < 8) continue; const a = st.cor / st.att;
      if (a < 0.5 && (!best || a < best.a)) best = { d, a, c: st.cor, t: st.att };
    }
    return best;
  }

  const BADGES = [
    { id: "first", s: "1st", name: "First Rep", how: "Finish your first practice set" },
    { id: "mock1", s: "M1", name: "Mock Debut", how: "Finish a mock test section" },
    { id: "mockfull", s: "Full", name: "Full Distance", how: "Finish a full mock test (both sections)" },
    { id: "baseline", s: "BB", name: "Baseline Set", how: "Log a Bluebook or Khan Academy practice test" },
    { id: "rehearsal", s: "BB2", name: "Dress Rehearsal", how: "Log a second full Bluebook test" },
    { id: "hardroute", s: "M2+", name: "Harder Module", how: "Reach the harder Module 2 in a mock" },
    { id: "streak3", s: "3d", name: "Three-Day Streak", how: "Practice 3 days in a row" },
    { id: "streak5", s: "5d", name: "Five-Day Streak", how: "Practice 5 days in a row" },
    { id: "clean", s: "10/10", name: "Clean Sheet", how: "Get every question right in a set of 10+" },
    { id: "comma", s: ";", name: "Comma Commander", how: "10+ grammar questions, all correct" },
    { id: "math", s: "π", name: "Math Machine", how: "10+ math questions, all correct" },
    { id: "fixer", s: "×5", name: "Mistake Fixer", how: "Fix 5 questions from the Mistake notebook" },
    { id: "cover", s: "8/8", name: "Full Coverage", how: "Practice all 8 skill domains" },
    { id: "century", s: "100", name: "Century", how: "Answer 100 questions" },
    { id: "keeper", s: "✓✓✓", name: "Plan Keeper", how: "Complete every task on 3 plan days" },
    { id: "weekwon", s: "W", name: "Week Won", how: "Meet every weekly goal" },
    { id: "goal", s: "★", name: "Goal Reached", how: "Hit your target score on a test" },
    { id: "champ", s: "🏆", name: "League Champ", how: "Win a weekly friends league" },
    { id: "duel", s: "⚔", name: "Duel Winner", how: "Win a head-to-head challenge" }
  ];
  const LEVELS = ["Warm-Up", "Test Taker", "Module Master", "Adaptive Ace", "Score Climber", "Top Percentile", "Legend"];
  const XP_PER_LEVEL = 250;
  const OFFICIAL_SRC = ["bluebook", "khan", "other"]; // practice tests taken outside this app and logged here
  const srcLabel = (t) => ({ app: "estimated", khan: "Khan Academy · estimated", other: "estimated", official: "official", bluebook: "Bluebook" }[t.source] || "");
  const isEst = (t) => t && (t.source === "app" || t.source === "khan" || t.source === "other");

  /* ================= My tests: several PSAT/SAT dates ================= */
  // settings.exams holds every test the student plans to take. The next upcoming one is the "active" test;
  // it is mirrored into settings.kind/date/target so the plan, reminders and profile keep working unchanged.
  const exId = () => Math.random().toString(36).slice(2, 9);
  const ymdNow = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  function syncExams(st8) {
    const st = st8.settings;
    if (!Array.isArray(st.exams)) st.exams = [];
    if (!st.exams.length && st.date) st.exams.push({ id: exId(), kind: st.kind || "psat", date: st.date, target: st.target || null });
    st.exams = st.exams.filter((e) => e && /^\d{4}-\d{2}-\d{2}$/.test(e.date || ""));
    st.exams.sort((a, b) => a.date.localeCompare(b.date));
    const t = ymdNow();
    const act = st.exams.find((e) => e.date >= t) || st.exams[st.exams.length - 1];
    if (!act) return false;
    const changed = st.activeExam !== act.id || st.kind !== act.kind || st.date !== act.date || (st.target || null) !== (act.target || null);
    if (st.activeExam && st.activeExam !== act.id) {
      // A new test is now the focus: restart the long-range plan from today (past weeks stay in the log).
      st8.planStart = t;
      const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const ws = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      for (const k of Object.keys(st8.weeks || {})) if (k >= ws) delete st8.weeks[k];
    }
    st.activeExam = act.id; st.kind = act.kind; st.date = act.date; st.target = act.target || null;
    return changed;
  }

  /* ================= State ================= */
  const KEY = "psat-sprint-v2";
  function blank() {
    return {
      v: 2, updatedAt: 0, xp: 0, streak: { count: 0, last: null }, tasks: {}, daysDone: {},
      stats: {}, sub: {}, answered: 0, tests: [], mistakes: [], fixed: 0, badges: {},
      seenBank: {}, recentKeys: [], mock: null, lastMock: null,
      prefs: { sel: [], count: 10, diff: "auto", timed: true }, samples: { practice: 0, mock: 0 },
      activity: {}, weeks: {}, planStart: null, strat: {}, deck: {}, leagueWins: {}, duels: {},
      settings: { kind: "psat", date: "2026-10-07", name: "", target: null },
      rewards: [
        { id: "r1", xp: 500, label: "Choose Friday dinner", claimed: false },
        { id: "r2", xp: 1000, label: "Pick the family movie night", claimed: false },
        { id: "r3", xp: 1750, label: "A bigger reward of your choice (ask Dad)", claimed: false }
      ]
    };
  }
  const GKEY = "psat-sprint-guest";
  function hasSession() {
    try { for (let i = 0; i < localStorage.length; i++) if (/^sb-.+-auth-token$/.test(localStorage.key(i) || "")) return true; } catch (e) { }
    return false;
  }
  // Signed-out visitors use a separate guest copy; a student's saved progress is only loaded after sign-in.
  let GUEST = !hasSession();
  let HOLD = false; // true while this device holds another student's copy and the right one is loading
  const storeKey = () => (GUEST ? GKEY : KEY);
  function load(key) {
    try {
      const raw = localStorage.getItem(key || storeKey());
      if (raw) { const s = Object.assign(blank(), JSON.parse(raw)); s.prefs = Object.assign(blank().prefs, s.prefs); s.settings = Object.assign(blank().settings, s.settings); syncExams(s); return s; }
    } catch (e) { /* storage unavailable */ }
    return blank();
  }
  let S = load();
  let storageOK = true;
  function save() {
    try { planBookkeeping(); } catch (e) { }
    S.updatedAt = Date.now();
    try { localStorage.setItem(storeKey(), JSON.stringify(S)); storageOK = true; }
    catch (e) { if (storageOK) toast("This browser isn't saving progress. Use Back up progress to keep a copy."); storageOK = false; }
    notifySaved();
  }
  const saveHooks = [], settingsHooks = [];
  function notifySaved() { for (const fn of saveHooks) { try { fn(S); } catch (e) { } } }

  /* ================= Helpers ================= */
  const $ = (s) => document.querySelector(s);
  function el(tag, attrs = {}, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === false || v == null) continue;
      if (k === "class") e.className = v;
      else if (k === "text") e.textContent = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? "" : v);
    }
    for (const k of kids.flat()) { if (k == null || k === false) continue; e.append(k instanceof Node ? k : document.createTextNode(String(k))); }
    return e;
  }
  const ymd = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const today = () => ymd(new Date());
  const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return ymd(d); };
  function parseYmd(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
  function daysLeft() { const n = new Date(); const a = new Date(n.getFullYear(), n.getMonth(), n.getDate()); return Math.round((parseYmd(S.settings.date) - a) / 864e5); }
  function fmtDay(s) { const dt = parseYmd(s); return { dow: dt.toLocaleDateString("en-US", { weekday: "short" }), md: dt.toLocaleDateString("en-US", { month: "short", day: "numeric" }), long: dt.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) }; }
  const pct = (x) => (x == null ? "—" : Math.round(x * 100) + "%");
  const mmss = (s) => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  const LETTERS = "ABCD";
  const level = () => Math.floor(S.xp / XP_PER_LEVEL) + 1;
  const levelName = (l) => LEVELS[Math.min(l - 1, LEVELS.length - 1)];
  const uid = () => Math.random().toString(36).slice(2, 10);
  const who = () => (S.settings.name || "").trim();
  const withName = (msg, sep) => (who() ? msg + (sep ?? ", ") + who() : msg);
  const possessive = () => (who() ? who() + (/s$/i.test(who()) ? "'" : "'s") + " " : "");
  function greeting() { const h = new Date().getHours(); const part = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; return withName(part); }

  function toast(msg, gold) { const t = el("div", { class: "toast" + (gold ? " gold" : ""), text: msg }); $("#toasts").append(t); setTimeout(() => t.remove(), 2600); }
  function addXP(n, why) {
    if (GUEST) return;
    const before = level(); S.xp = Math.max(0, S.xp + n);
    if (n > 0 && why) toast("+" + n + " XP · " + why);
    const after = level(); if (after > before) toast(withName("Level up") + "! Level " + after + " · " + levelName(after), true);
    for (const r of S.rewards) if (!r.claimed && !r.notified && S.xp >= r.xp) { r.notified = true; toast("Reward unlocked: " + r.label, true); }
  }
  function award(id) { if (GUEST || S.badges[id]) return; S.badges[id] = today(); const b = BADGES.find((x) => x.id === id); if (b) toast((who() ? who() + " earned a badge: " : "Badge earned: ") + b.name, true); }
  function bumpStreak() {
    const t = today(); if (S.streak.last === t) return;
    S.streak.count = S.streak.last === yesterday() ? S.streak.count + 1 : 1; S.streak.last = t;
    if (S.streak.count >= 3) award("streak3"); if (S.streak.count >= 5) award("streak5");
  }
  const liveStreak = () => (S.streak.last === today() || S.streak.last === yesterday() ? S.streak.count : 0);

  /* ================= Question supply ================= */
  const rng = makeRng();
  function shuffledCopy(q) {
    const idx = rng.shuffle([0, 1, 2, 3]);
    return Object.assign({}, q, { o: idx.map((i) => q.o[i]), a: idx.indexOf(q.a) });
  }
  function fromBank(domain, lv, used) {
    let all = BANK.filter((q) => q.d === domain && !used.has("bank:" + q.id));
    if (!all.length) return null;
    // Craft and Structure on the real test is roughly 55% words in context, 30% purpose and structure, 15% cross-text.
    if (domain === "cs") {
      const x = rng.f(), grp = x < 0.55 ? /Words in context/ : x < 0.85 ? /Text purpose|Text structure/ : /Cross-text/;
      const sub = all.filter((q) => grp.test(q.sk));
      if (sub.length) all = sub;
    }
    const unseen = all.filter((q) => !S.seenBank[q.id]);
    let pool = unseen.length ? unseen : all.slice().sort((x, y) => (S.seenBank[x.id] || 0) - (S.seenBank[y.id] || 0)).slice(0, Math.max(3, Math.ceil(all.length / 4)));
    const best = Math.min(...pool.map((q) => Math.abs((q.lv || 2) - lv)));
    pool = pool.filter((q) => Math.abs((q.lv || 2) - lv) === best);
    const q = shuffledCopy(rng.pick(pool));
    q.key = "bank:" + q.id; q.src = "bank";
    return q;
  }
  function bankHasUnseen(domain, used) { return BANK.some((q) => q.d === domain && !S.seenBank[q.id] && !used.has("bank:" + q.id)); }
  function nextQuestion(domain, lv, used, allowSpr) {
    let q = null;
    const avoid = new Set([...S.recentKeys, ...used]);
    if (DOM[domain].sec === "math") {
      q = MG.generate(domain, lv, rng, avoid);
      if (q && allowSpr && q.spr != null && rng.f() < allowSpr) q.type = "spr";
    } else {
      const r = rng.f();
      if (domain === "cs") q = fromBank("cs", lv, used);
      else if (domain === "ii") q = (r < (lv === 3 ? 0.2 : 0.35) || !bankHasUnseen("ii", used)) && r < 0.8 ? RW.generate("ii", rng, avoid, lv) : fromBank("ii", lv, used);
      else if (domain === "eoi") q = r < (lv === 3 ? 0.35 : 0.6) || !bankHasUnseen("eoi", used) ? RW.generate("eoi", rng, avoid, lv) : fromBank("eoi", lv, used);
      else q = r < 0.2 && bankHasUnseen("sec", used) ? fromBank("sec", lv, used) : RW.generate("sec", rng, avoid, lv);
      if (!q) q = RW.generate(domain, rng, avoid, lv) || fromBank(domain, lv, new Set());
    }
    q = Object.assign({}, q, { uid: uid(), d: q.d || domain });
    if (!q.type) q.type = "mc";
    used.add(q.key);
    if (!GUEST) trackFresh(q);
    if (q.src === "bank") S.seenBank[q.id] = Date.now();
    else { S.recentKeys.push(q.key); if (S.recentKeys.length > 600) S.recentKeys.splice(0, S.recentKeys.length - 600); }
    return q;
  }
  // Freshness: per question type, how many were served and how many were exact repeats
  // (same question seen within the student's last 2,500). Shown on the admin dashboard.
  const hash32 = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
  const tplOf = (q) => q.gen || (q.src === "bank" ? "bank:" + q.d : "rw:" + q.d + ":" + (q.sk || ""));
  function trackFresh(q) {
    const F = S.fresh || (S.fresh = { t: {}, h: [], d: {} });
    const hk = hash32(String(q.key)), rep = F.h.includes(hk), tpl = tplOf(q), day = today();
    const t = F.t[tpl] || (F.t[tpl] = [0, 0]); t[0]++; if (rep) t[1]++;
    if (q.sk) (F.s || (F.s = {}))[tpl] = q.sk;
    const dd = F.d[day] || (F.d[day] = [0, 0]); dd[0]++; if (rep) dd[1]++;
    F.h.push(hk); if (F.h.length > 2500) F.h.splice(0, F.h.length - 2500);
    const cut = addDays(day, -60); for (const k of Object.keys(F.d)) if (k < cut) delete F.d[k];
  }
  // Question "type": a generator name or a hand-written bank skill. Used for focus sets.
  const typeOf = (q) => (q.gen ? "gen:" + q.gen : q.src === "bank" && q.sk ? "bank:" + q.sk : null);
  // Focus set = question types chosen automatically: from test reviews (FOCUS, set on the server
  // after a Bluebook review) plus the student's own misses in the app (S.tstat).
  let FOCUS = null; // { items: [{type, w, why}], source, updated }
  let REVIEWS = []; // test reviews written after an official practice test: [{id, title, date, summary, items}]
  function focusWeights() {
    const W = {};
    for (const it of (FOCUS && FOCUS.items) || []) W[it.type] = { w: it.w || 3, lv: it.lv || null, why: it.why || (FOCUS.source || "Test review") };
    for (const rv of REVIEWS) {
      const mine = ((S.treview || {})[rv.id] || {}).r || {};
      for (const it of rv.items || []) {
        const a = mine[it.q]; if (!it.ty || !a || !["new", "forgot"].includes(a.c)) continue;
        if (W[it.ty]) { W[it.ty].w += 2; W[it.ty].why += " · you said you " + (a.c === "new" ? "never learned it" : "forgot how"); }
        else W[it.ty] = { w: 4, lv: 1, why: rv.title + " " + it.q + ": you said you " + (a.c === "new" ? "never learned it" : "forgot how") };
      }
    }
    for (const [ty, [att, miss, last]] of Object.entries(S.tstat || {})) {
      if (att < 3) continue;
      const rate = miss / att;
      if (W[ty] && W[ty].lv) W[ty].lv = Math.min(3, W[ty].lv + (rate <= 0.25 ? 1 : 0) + (att >= 8 && rate <= 0.2 ? 1 : 0)); // a starting level climbs as he gets them right
      if (W[ty]) { if (att >= 8 && rate < 0.2) { W[ty].w = 1; W[ty].why += " · now mostly right in practice"; } else W[ty].w += rate * 3; }
      else if (rate >= 0.34 && miss >= 2) W[ty] = { w: 1 + rate * 4, why: "Missed " + miss + " of " + att + " in practice" };
    }
    return Object.entries(W).map(([type, v]) => Object.assign({ type }, v)).filter((x) => canMake(x.type)).sort((a, b) => b.w - a.w);
  }
  function canMake(ty) {
    if (ty.startsWith("gen:")) { const n = ty.slice(4); return !!(MG.G[n] || (RW.fns && RW.fns[n])); }
    if (ty.startsWith("bank:")) return BANK.some((q) => q.sk === ty.slice(5));
    return false;
  }
  function qFromType(ty, used, lvFix) {
    let q = null;
    if (ty.startsWith("gen:")) {
      const n = ty.slice(4);
      if (MG.G[n]) { const dom = n.startsWith("hard_") ? null : n.split("_")[0]; const lv = lvFix || (dom && DOM[dom] ? rng.pick([2, 2, 3]) : 3); for (let t = 0; t < 8 && (!q || used.has(q.key)); t++) q = MG.build(n, rng, lv); }
      else if (RW.fns[n]) { for (let t = 0; t < 8 && (!q || used.has(q.key)); t++) q = RW.build(RW.fns[n], rng); }
    } else {
      const sk = ty.slice(5), pool = BANK.filter((b) => b.sk === sk && !used.has("bank:" + b.id));
      const fresh = pool.filter((b) => !S.seenBank[b.id]), pick = (fresh.length ? fresh : pool);
      if (pick.length) { q = shuffledCopy(rng.pick(pick)); q.key = "bank:" + q.id; q.src = "bank"; S.seenBank[q.id] = Date.now(); }
    }
    if (!q) return null;
    q = Object.assign({}, q, { uid: uid() }); if (!q.type) q.type = "mc";
    if (q.spr != null && rng.f() < 0.25 && DOM[q.d] && DOM[q.d].sec === "math") q.type = "spr";
    used.add(q.key); if (!GUEST) trackFresh(q);
    return q;
  }
  // Strategies behind a test review go straight into the flashcard deck, once per question type.
  function seedDeck() {
    if (GUEST || !FOCUS) return;
    const seeded = S.seeded || (S.seeded = {}); let added = 0;
    for (const it of FOCUS.items) {
      if (seeded[it.type]) continue; seeded[it.type] = today();
      const sid = STRAT.strategyFor(it.type.startsWith("bank:") ? { sk: it.type.slice(5) } : { gen: it.type.slice(4) });
      if (sid !== "general" && STRAT.cards[sid] && !S.deck[sid]) { S.deck[sid] = { box: 0, due: today(), added: today() }; added++; }
    }
    if (added) save();
  }
  function buildFocusSet(n) {
    const ws = focusWeights(); if (!ws.length) return [];
    const total = ws.reduce((a, x) => a + x.w, 0), cnt = {}, used = new Set(), qs = [];
    for (let i = 0; i < n * 3 && qs.length < n; i++) {
      let r = rng.f() * total, pick = ws[0];
      for (const x of ws) { r -= x.w; if (r <= 0) { pick = x; break; } }
      if ((cnt[pick.type] || 0) >= Math.max(2, Math.ceil(n / Math.min(ws.length, 6)))) continue;
      const q = qFromType(pick.type, used, pick.lv); if (!q) continue;
      cnt[pick.type] = (cnt[pick.type] || 0) + 1; qs.push(q);
    }
    const order = [], groups = {};
    rng.shuffle(qs).forEach((q) => { const k = STRAT.strategyFor(q); if (!groups[k]) { groups[k] = []; order.push(k); } groups[k].push(q); });
    return order.flatMap((k) => groups[k]);
  }
  const typeLabel = (ty) => {
    if (ty.startsWith("bank:")) return ty.slice(5);
    const c = STRAT.cards[STRAT.strategyFor({ gen: ty.slice(4) })];
    const nm = { sec_fanboys: "Comma + and between sentences", sec_semiphrase: "Semicolon vs. comma before a phrase", sec_listsemi: "Semicolons in complex lists", sec_gerund: "Agreement with an -ing subject", sec_extra: "Matching commas and dashes", sec_boundary: "Joining sentences", sec_agree: "Subject-verb agreement", ii_quant: "Tables and claims", geo_trig: "Right-triangle trig", geo_polygon: "Parallel lines and angles", geo_similar: "Similar figures", psda_ratio: "Ratios", psda_sample: "Margin of error", psda_aroc: "Average rate of change", alg_interp: "Meaning of a linear model", alg_lineq: "Solving linear equations", adv_roots: "Solving quadratics", adv_shift: "Shifting a graph", adv_vieta: "Sum and product of roots" }[ty.slice(4)];
    return nm || (c ? c.name : ty.slice(4));
  };
  function focusCard() {
    if (GUEST) return null;
    const ws = focusWeights(); if (!ws.length) return null;
    const top = ws.slice(0, 4);
    return el("div", { class: "card focus", style: "display:grid;gap:12px" },
      el("div", {}, el("div", { class: "eyebrow", text: "Picked for you" }), el("h3", { text: "Your focus set" })),
      el("p", { class: "muted", style: "font-size:14px", text: "20 questions on what you miss most. It updates as you improve." }),
      el("ul", { class: "focus-list" }, top.map((x) => el("li", {}, el("strong", { text: typeLabel(x.type) })))),
      ws.length > top.length ? el("p", { class: "muted", style: "font-size:13px", text: "+ " + (ws.length - top.length) + " more types in the mix" }) : null,
      el("div", { class: "row" }, el("button", { class: "btn primary", onclick: () => startPractice(null, 20, "auto", false, true) }, "Start my focus set")));
  }
  const isRight = (q, ans) => (q.type === "spr" ? ans != null && ans !== "" && checkSpr(ans, q.spr) : ans === q.a);
  const answerText = (q) => (q.type === "spr" ? String(q.o[q.a]).replace(/^\$/, "") : LETTERS[q.a] + ") " + q.o[q.a]);

  /* ================= Skill tracking ================= */
  function record(q, ok, fromMock) {
    if (!fromMock) { const st = S.stats[q.d] || (S.stats[q.d] = { att: 0, cor: 0 }); st.att++; if (ok) st.cor++; }
    if (q.sk) { const sb = S.sub[q.sk + "|" + q.d] || (S.sub[q.sk + "|" + q.d] = { att: 0, cor: 0 }); sb.att++; if (ok) sb.cor++; }
    S.answered++; if (S.answered >= 100) award("century");
    if (!GUEST) { const ty = typeOf(q); if (ty) { const ts = (S.tstat || (S.tstat = {}))[ty] || (S.tstat[ty] = [0, 0, null]); ts[0]++; if (!ok) { ts[1]++; ts[2] = today(); } } }
    logActivity(q.d, ok);
    if (!GUEST) {
      const sid = STRAT.strategyFor(q), st2 = S.strat[sid] || (S.strat[sid] = { att: 0, miss: 0, last: null });
      st2.att++; st2.run = ok ? (st2.run || 0) + 1 : 0;
      if (!ok) { st2.miss++; st2.last = today(); S.deck[sid] = Object.assign(S.deck[sid] || { added: today() }, { box: 0, due: today() }); }
    }
    const i = S.mistakes.findIndex((m) => m.key === q.key);
    if (ok && i > -1) { S.mistakes.splice(i, 1); S.fixed++; if (S.fixed >= 5) award("fixer"); }
    if (!ok && i === -1) {
      const slim = { key: q.key, d: q.d, sk: q.sk, gen: q.gen, p: q.p, q: q.q, o: q.o, a: q.a, type: q.type, spr: q.spr, e: q.e, t: q.t, table: q.table, chart: q.chart, fig: q.fig, efig: q.efig, steps: q.steps, id: q.id, src: q.src, added: today() };
      S.mistakes.unshift(slim); if (S.mistakes.length > 80) S.mistakes.length = 80;
    }
  }
  function latestTestDom(d) { for (let i = S.tests.length - 1; i >= 0; i--) { const t = S.tests[i]; if (t.dom && t.dom[d] && t.dom[d].t) return t.dom[d]; } return null; }
  function testAcc(d) { const x = latestTestDom(d); return x ? x.c / x.t : null; }
  function pracAcc(d) { const r = S.stats[d]; return r && r.att >= 3 ? r.cor / r.att : null; }
  // Blend the latest test (weight 0.6) with practice (up to 0.4). Practice earns its full weight only
  // after ~30 questions, so a handful of easy practice answers can't hide a weak test result.
  const blend = (ta, pa, att) => { if (ta == null) return pa; if (pa == null) return ta; const w = 0.4 * Math.min(1, att / 30); return (0.6 * ta + w * pa) / (0.6 + w); };
  function mastery(d) { const r = S.stats[d]; return blend(testAcc(d), pracAcc(d), r ? r.att : 0); }
  function status(m) { if (m == null) return ["none", "No data"]; if (m >= 0.8) return ["good", "Strong"]; if (m >= 0.6) return ["warn", "Building"]; return ["bad", "Focus"]; }
  function focusList() { return DOMAINS.map((d) => ({ d, m: mastery(d.id) })).sort((x, y) => (x.m ?? 0.62) - (y.m ?? 0.62)).map((x) => x.d); }
  function autoLevel(d) { const m = mastery(d); const pick = m == null ? [1, 2, 2] : m < 0.6 ? [1, 1, 2] : m < 0.8 ? [2, 2, 3] : [2, 3, 3]; return rng.pick(pick); }

  /* ================= Header & tabs ================= */
  function renderHeader() {
    if (GUEST) { document.title = "Test Prep Hub"; const hi = document.getElementById("hello"); if (hi) hi.textContent = ""; return; }
    const n = daysLeft(), fmt = FORMATS[S.settings.kind];
    const hi = document.getElementById("hello"); if (hi) hi.textContent = greeting();
    document.title = who() ? "Test Prep Hub · " + who() : "Test Prep Hub";
    $("#testLabel").textContent = fmt.name + " · " + fmtDay(S.settings.date).long;
    const weeks = n > 60 ? Math.round(n / 7) : null;
    $("#daysLeft").textContent = weeks ? weeks : n > 0 ? n : n === 0 ? "0" : "✓";
    const lab = $("#daysLabel"); lab.textContent = "";
    lab.append(weeks ? "weeks" : n > 1 ? "days" : n === 1 ? "day" : n === 0 ? "today" : "done", el("em", { text: n > 0 ? "to test day" : n === 0 ? "test day, good luck" : "test complete" }));
    const s = liveStreak(); $("#hStreak").textContent = s + (s === 1 ? " day" : " days");
    const t = S.tests.filter((x) => x.total).pop();
    $("#hScore").textContent = (t && t.total ? t.total + (isEst(t) ? " est." : "") : "—") + (S.settings.target ? " / goal " + S.settings.target : "");
    const l = level(); $("#hLevel").textContent = "Level " + l + " · " + levelName(l);
    const as = document.getElementById("aStreak"); if (as) { as.textContent = "🔥 " + s; as.title = s + "-day streak"; }
    const al = document.getElementById("aLevel"); if (al) { al.textContent = "Lv " + l; al.title = "Level " + l + " · " + S.xp + " XP"; }
    $("#hXpBar").style.width = ((S.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100 + "%";
    $("#hXp").textContent = S.xp + " XP · " + (XP_PER_LEVEL - (S.xp % XP_PER_LEVEL)) + " to next level";
  }
  let TAB = "today";
  // Five destinations, one place per job: Today (the plan), Learn (Lab, flashcards, rules), Practice (questions),
  // Tests (mocks, logging, official tests), Me (progress, rewards, friends, account). Related views share a sub-nav.
  const GROUP = { today: "today", review: "review", practice: "practice", mock: "mock", log: "mock", treview: "mock", matrix: "matrix", rewards: "matrix", friends: "matrix", account: "matrix" };
  const SUBS = { mock: [["mock", "Mock test"], ["log", "Log a test"], ["treview", "Test review"]], matrix: [["matrix", "Progress"], ["rewards", "Rewards"], ["friends", "Friends"], ["account", "Account"]] };
  function renderSubnav(t) {
    const sn = document.querySelector("nav.subnav"); if (!sn) return;
    const subs = !GUEST && !ADMIN && SUBS[GROUP[t]];
    sn.hidden = !subs; sn.textContent = "";
    if (subs) subs.forEach(([k, label]) => { const b = el("button", { type: "button", "data-tab": k, "aria-current": k === t ? "page" : false, onclick: () => show(k) }, label); sn.append(b); });
  }
  const RENDERERS_OK = (t) => ["today", "practice", "mock", "review", "matrix", "log", "treview", "rewards", "friends", "account"].includes(t);
  document.querySelectorAll("nav.tabs button").forEach((b) => b.addEventListener("click", () => show(b.dataset.tab)));
  ["aStreak", "aLevel"].forEach((id) => { const b = document.getElementById(id); if (b) b.addEventListener("click", () => { if (!GUEST && !ADMIN) show("rewards"); }); });
  function show(t) {
    if (GUEST && !["today", "practice", "mock"].includes(t)) t = "today";
    if (ADMIN && !GUEST) t = "admin";
    TAB = t;
    document.querySelectorAll("nav.tabs button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === GROUP[t])));
    renderSubnav(t);
    const ab = document.querySelector('nav.tabs button[data-tab="' + GROUP[t] + '"]'); if (ab && ab.scrollIntoView) try { ab.scrollIntoView({ inline: "center", block: "nearest" }); } catch (e) { }
    document.querySelectorAll("section.panel").forEach((p) => (p.hidden = p.id !== "p-" + t));
    document.body.dataset.tab = t; document.body.dataset.group = GROUP[t] || t;
    render(); setInq();
    try { sessionStorage.setItem(KEY + "-tab", t); } catch (e) { }
    window.scrollTo({ top: 0 });
  }
  function render() {
    document.body.classList.toggle("guest", GUEST);
    document.body.classList.toggle("admin", !!ADMIN && !GUEST);
    if (ADMIN && !GUEST) {
      document.body.classList.remove("holding");
      document.querySelectorAll("section.panel").forEach((x) => (x.hidden = x.id !== "p-admin"));
      const fnA = document.getElementById("footNote"); if (fnA) fnA.textContent = "Admin view: read-only. Sign out from the Account button at the top.";
      return renderAdmin();
    }
    document.body.classList.toggle("holding", HOLD && !GUEST);
    if (HOLD && !GUEST) {
      document.title = "Test Prep Hub";
      const hi = document.getElementById("hello"); if (hi) hi.textContent = "";
      document.querySelectorAll("section.panel").forEach((x) => (x.hidden = x.id !== "p-today"));
      const p = $("#p-today"); p.textContent = "";
      p.append(el("div", { class: "card mission" }, el("h2", { text: "Loading your progress…" }), el("p", { class: "muted", text: "This takes a moment on a device someone else used." })));
      return;
    }
    if (!GUEST && syncExams(S)) { save(); for (const fn of settingsHooks) { try { fn(S.settings); } catch (x) { } } }
    const setLbl = (tab, txt) => { const b = document.querySelector('nav.tabs button[data-tab="' + tab + '"] .lbl'); if (b) b.textContent = txt; };
    setLbl("practice", GUEST ? "Try practice" : "Practice"); setLbl("mock", GUEST ? "Try a test" : "Tests");
    const fn = document.getElementById("footNote"); if (fn) fn.textContent = GUEST ? "Create a free student account to save progress and unlock the full site." : "Progress saves on this device first, then to your account.";
    if (!RENDERERS_OK(TAB)) { TAB = "today"; document.querySelectorAll("section.panel").forEach((x) => (x.hidden = x.id !== "p-today")); }
    renderHeader(); ({ today: renderToday, practice: renderPractice, mock: renderMock, review: renderReview, matrix: renderMatrix, log: renderLog, treview: renderTReview, rewards: renderRewards, friends: renderFriends, account: renderAccount })[TAB](); }

  /* ================= Today ================= */
  function taskList(day, only, moved) {
    const ul = el("ul", { class: "tasks" });
    day.tasks.forEach((t, i) => { if (!only || only.includes(i)) ul.append(taskRow(day, i, i, null, moved && canCarry(t))); });
    return ul;
  }
  // One checklist row: a tick circle, then the task (tappable when the app can open it).
  function taskRow(day, i, n, from, moved, mins) {
    const t = day.tasks[i], id = day.date + "#" + i, on = !!S.tasks[id], mv = moved && !on;
    return el("li", { class: "task" + (on ? " done" : "") + (mv ? " moved" : "") },
      el("button", { class: "bubble", "aria-pressed": String(on), "aria-label": (on ? "Mark not done: " : "Mark done: ") + t, onclick: () => toggleTask(day, i) }, on ? "✓" : ""),
      el("span", { class: "t" }, taskText(day, i, t), mins && !on ? el("span", { class: "tmin", text: minLabel(mins) }) : null, from ? el("span", { class: "moved-tag", text: "from " + from.dow }) : null, mv ? el("span", { class: "moved-tag", text: "Moved to today" }) : null,
        /Log a test/.test(t) && !on ? howBox(/Khan/.test(t) ? "khan" : "bluebook", /Khan/.test(t) ? "How to log a Khan Academy section" : "How to log it: step by step") : null));
  }
  // Task text: a link that opens the right place (and ticks itself when finished), or plain text.
  function taskText(day, i, t) {
    const g = day.go && day.go[i];
    if (!g) return t;
    if (g.k === "ext") return el("a", { class: "tlink", href: g.url, target: "_blank", rel: "noopener" }, el("span", { class: "tl-text", text: t }), el("span", { class: "tgo", text: " ↗" }));
    const done = !!S.tasks[day.date + "#" + i];
    return el("button", { class: "tlink", onclick: () => runTask(day, i) }, el("span", { class: "tl-text", text: t }), el("span", { class: "tgo", text: done ? "" : " →" }));
  }
  function runTask(day, i) {
    const g = day.go[i];
    PT = { date: day.date, i };
    if (g.k === "practice") { startPractice(g.doms || DOMAINS.map((d) => d.id), g.n, "auto"); if (P && g.timed) { P.timed = true; renderPractice(); } }
    else if (g.k === "focus") { if (focusWeights().length) startPractice(null, g.n, "auto", false, true); else { const top = focusList()[0]; startPractice([top.id], g.n, "auto"); } }
    else if (g.k === "notebook") { if (!S.mistakes.length) { completeTask(day, i); toast("Your Mistake notebook is empty. Nothing to retry.", true); save(); render(); } else startPractice([], 0, "auto", true); }
    else if (g.k === "deck") {
      let q = g.top ? topCards(g.top) : g.area ? Object.keys(STRAT.cards).filter((k) => STRAT.cards[k].area === g.area && (S.deck[k] || STRAT.cards[k].say)) : dueCards().slice(0, 12);
      if (!q.length) { completeTask(day, i); toast("No flashcards due today. Nice.", true); save(); render(); return; }
      RV = { queue: q, i: 0, flipped: false, plan: g }; show("review");
    }
    else if (g.k === "mock") { S.lastMock && (S.lastMock.showResults = false); show("mock"); }
    else if (g.k === "mockreview") { completeTask(day, i); save(); if (S.lastMock && S.lastMock.result) S.lastMock.showResults = true; show("mock"); }
    else if (g.k === "log") show("log");
    else if (g.k === "treview") show("treview");
    else if (g.k === "visit") { completeTask(day, i); save(); show(g.tab); }
    else if (g.k === "lab") { const lab = labState(g.p), next = g.m.find((n) => !(lab[n] && lab[n].s)) || g.m[0]; location.href = LABS[g.p || "geo"].page + "#l" + next; return; }
    window.scrollTo({ top: 0 });
  }
  // Geometry Lab (geometry.html) keeps its own progress in this browser: {1: {g, r, w, s}, ...}; s = mission finished.
  // Two Labs: geometry.html (Geometry & Trig, synced to S.lab) and concepts.html (Concept Lab, synced to S.lab2).
  const LABS = { geo: { key: "gtlab-v2", field: "lab", page: "geometry.html", n: 7 }, cx: { key: "cxlab-v1", field: "lab2", page: "concepts.html", n: 7 } };
  function labState(p) { try { return JSON.parse(localStorage.getItem(LABS[p || "geo"].key) || "{}") || {}; } catch (e) { return {}; } }
  // Copy Lab progress into the synced state (admin view, Telegram) and tick Lab plan tasks that are finished.
  // Missions done on any device add up (the account keeps the union), and a finished mission ticks its plan
  // task even if the plan schedules it for a later day, so doing the Lab outside the plan still counts.
  function labSync() {
    if (GUEST) return;
    let changed = false;
    const doneBy = {};
    for (const [p, L] of Object.entries(LABS)) {
      const lab = labState(p), cur = S[L.field] || {}, log = Object.assign({}, cur.log || {});
      const local = Array.from({ length: L.n }, (_, i) => i + 1).filter((n) => lab[n] && lab[n].s);
      local.forEach((n) => { if (!log[n]) log[n] = today(); });
      const done = [...new Set([...(cur.done || []), ...local])].sort((a, b) => a - b);
      const starSet = new Set([...(cur.starList || []), ...local.filter((n) => lab[n].s === 2)]);
      if ((cur.done || []).join() !== done.join() || (cur.starList || []).length !== starSet.size) { S[L.field] = { done, stars: starSet.size, starList: [...starSet], log, at: today() }; changed = true; }
      doneBy[p] = done;
    }
    if (planMode() === "sprint") {
      plan().forEach((d) => d.go.forEach((g, i) => {
        if (g && g.k === "lab" && !S.tasks[d.date + "#" + i] && g.m.every((n) => doneBy[g.p || "geo"].includes(n))) { completeTask(d, i); changed = true; }
      }));
    }
    if (changed) save();
  }
  window.addEventListener("focus", () => { try { labSync(); if (TAB === "today") render(); } catch (e) { } });
  let PT = null; // the plan task the student opened most recently
  function completeTask(day, i) {
    const id = day.date + "#" + i; if (S.tasks[id]) return false;
    S.tasks[id] = true; addXP(15, "task done"); bumpStreak();
    if (day.tasks.every((_, k) => S.tasks[day.date + "#" + k])) { S.daysDone[day.date] = true; toast("Day complete: " + day.title, true); if (Object.keys(S.daysDone).length >= 3) award("keeper"); }
    else toast("Plan task done ✓ " + day.tasks[i].replace(/:.*$/, ""), true);
    return true;
  }
  // Called when something finishes; ticks at most one matching plan task (the one just opened, else today's, else a carried one).
  function planEvent(ev) {
    if (GUEST || planMode() !== "sprint") return;
    const PLAN = plan(), t = today(), cands = [];
    PLAN.filter((d) => d.date <= t).sort((a, b) => (a.date === t ? -1 : b.date === t ? 1 : b.date.localeCompare(a.date)))
      .forEach((d) => d.go.forEach((g, i) => { if (g && !S.tasks[d.date + "#" + i] && taskMatches(g, ev)) cands.push([d, i]); }));
    if (!cands.length) return;
    const pick = cands.find(([d, i]) => PT && PT.date === d.date && PT.i === i) || cands[0];
    completeTask(pick[0], pick[1]); PT = null; save();
  }
  function taskMatches(g, ev) {
    if (ev.k === "practice") {
      const ans = ev.res.filter((r) => !r.skipped);
      if (g.k === "notebook") return ev.notebook && ans.length >= Math.min(5, ev.res.length);
      if (g.k === "focus") return ev.focus && ans.length >= Math.ceil(g.n * 0.75);
      if (g.k === "practice") return ans.filter((r) => !g.doms || g.doms.includes(r.q.d)).length >= g.n && (!g.timed || ev.timed);
    }
    if (ev.k === "mock") return g.k === "mock" && g.parts.every((x) => ev.parts.includes(x));
    if (ev.k === "log") return (g.k === "log" && (!g.src || g.src === ev.src)) || (g.k === "mock" && g.alt && g.alt === ev.src);
    if (ev.k === "treview") return g.k === "treview";
    if (ev.k === "deck") return g.k === "deck" && (g.area || "") === (ev.spec.area || "") && !!g.top === !!ev.spec.top;
    return false;
  }
  // Unfinished tasks from earlier plan days roll forward to today (except ones tied to a specific night or morning).
  const canCarry = (t) => !/Lights out|breakfast|Module 1|Never leave|Use Desmos and the reference/.test(t);
  function carriedTasks(PLAN, t) {
    return PLAN.filter((d) => d.date < t).map((d) => ({ day: d, idx: d.tasks.map((x, i) => i).filter((i) => !S.tasks[d.date + "#" + i] && canCarry(d.tasks[i])) })).filter((x) => x.idx.length).reverse();
  }
  function toggleTask(day, i) {
    const id = day.date + "#" + i;
    if (S.tasks[id]) { delete S.tasks[id]; addXP(-15); delete S.daysDone[day.date]; }
    else completeTask(day, i);
    save(); render();
  }
  /* ================= Long-range plan ================= */
  const SPRINT_DAYS = 9; // switch to the day-by-day plan when the test is this close
  const PHASES = {
    foundations: { name: "Foundations", what: "A full Bluebook diagnostic, then practice all 8 skills" },
    build: { name: "Build", what: "Weakest skills first, a mock section weekly, a Bluebook or Khan Academy test every other week" },
    ready: { name: "Test-ready", what: "A full Bluebook practice test every week, timed practice" },
    sprint: { name: "Final sprint", what: "Day-by-day plan with two dress rehearsals" }
  };
  function addDays(str, n) { const d = parseYmd(str); d.setDate(d.getDate() + n); return ymd(d); }
  function weekStart(str) { const d = parseYmd(str); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return ymd(d); }
  const dayOf = () => S.activity[today()] || (S.activity[today()] = { q: 0, c: 0, dom: {}, mock: 0 });
  function logActivity(d, ok) { const a = dayOf(); a.q++; if (ok) a.c++; const x = a.dom[d] || (a.dom[d] = [0, 0]); x[0]++; if (ok) x[1]++; }
  function logMock(sections) { dayOf().mock += sections; }
  function weekTotals(ws) {
    const t = { ws, q: 0, c: 0, dom: {}, mock: 0, days: 0 };
    for (let i = 0; i < 7; i++) {
      const a = S.activity[addDays(ws, i)]; if (!a) continue;
      if (a.q || a.mock) t.days++;
      t.q += a.q || 0; t.c += a.c || 0; t.mock += a.mock || 0;
      for (const [d, [n, c]] of Object.entries(a.dom || {})) { const x = t.dom[d] || (t.dom[d] = [0, 0]); x[0] += n; x[1] += c; }
    }
    return t;
  }
  function planMode() { const n = daysLeft(); if (n < 0) return "after"; if (n <= SPRINT_DAYS) return "sprint"; return n > 90 ? "monthly" : "weekly"; }
  function phaseAt(dateStr) {
    const left = Math.round((parseYmd(S.settings.date) - parseYmd(dateStr)) / 864e5);
    const since = Math.round((parseYmd(dateStr) - parseYmd(S.planStart || today())) / 864e5);
    if (left <= SPRINT_DAYS) return "sprint";
    if (left <= 35) return "ready";
    if (since < 28 && left > 56) return "foundations";
    return "build";
  }
  function makeWeekGoals(ws) {
    const ph = phaseAt(weekStart(today()) === ws ? today() : ws);
    const hasData = S.tests.length > 0 || S.answered >= 20;
    const goals = [];
    if (!hasData) {
      goals.push({ id: "official", type: "official", orMock: true, target: 1, label: "Take a full Bluebook practice test and log it (or a full mock here)" });
      goals.push({ id: "q", type: "q", target: 40, label: "Answer 40 practice questions" });
      goals.push({ id: "cover", type: "cover", min: 1, target: 8, label: "Try all 8 skills at least once" });
      return { phase: "foundations", diagnostic: true, goals, v: 2 };
    }
    const qT = ph === "foundations" ? 60 : ph === "build" ? 80 : 100, per = ph === "ready" ? 25 : 20;
    goals.push({ id: "q", type: "q", target: qT, label: "Answer " + qT + " practice questions" });
    if (ph === "foundations") goals.push({ id: "cover", type: "cover", min: 5, target: 8, label: "Practice all 8 skills (5+ questions each)" });
    const focus = focusList().filter((d) => mastery(d.id) == null || mastery(d.id) < 0.9).slice(0, ph === "ready" ? 1 : 2);
    for (const d of focus) {
      const m = mastery(d.id);
      const acc = Math.min(90, Math.max(60, Math.round(((m ?? 0.55) * 100) / 5) * 5 + 10));
      goals.push({ id: "dom-" + d.id, type: "dom", d: d.id, target: per, label: per + " questions on " + d.name });
      goals.push({ id: "acc-" + d.id, type: "acc", d: d.id, target: acc, label: acc + "% accuracy on " + d.name });
    }
    goals.push(ph === "ready" ? { id: "mock", type: "mock", target: 2, label: "Take a full mock test (here or in Bluebook)" } : { id: "mock", type: "mock", target: 1, label: "Take one mock test section" });
    // Official practice tests: every week when test-ready, every other week while building.
    const wkNo = Math.round((parseYmd(ws) - parseYmd(weekStart(S.planStart || today()))) / (7 * 864e5));
    if (ph === "ready") goals.push({ id: "official", type: "official", target: 1, label: "Take a full Bluebook practice test and log it" });
    else if (ph === "build" && wkNo % 2 === 0) goals.push({ id: "official", type: "official", target: 1, label: "Take a Bluebook or Khan Academy practice test (a full test or one section) and log it" });
    const nb = ph === "ready" ? 5 : 10;
    goals.push({ id: "nb", type: "notebook", target: nb, label: "Get the Mistake notebook down to " + nb + " or fewer" });
    return { phase: ph, goals, v: 2 };
  }
  function currentWeek() {
    const ws = weekStart(today());
    if (!S.weeks[ws] || ((S.weeks[ws].v || 1) < 2 && !S.weeks[ws].won)) S.weeks[ws] = makeWeekGoals(ws); // v2 adds official-test goals
    return { ws, w: S.weeks[ws] };
  }
  // Returns [done, target, note]
  function goalProgress(g, tot) {
    if (g.type === "q") return [tot.q, g.target];
    if (g.type === "mock") return [tot.mock, g.target, tot.mock + " of " + g.target + " sections"];
    if (g.type === "cover") return [DOMAINS.filter((d) => ((tot.dom[d.id] || [0])[0]) >= g.min).length, g.target, "skills"];
    if (g.type === "dom") return [(tot.dom[g.d] || [0])[0], g.target];
    if (g.type === "acc") {
      const x = tot.dom[g.d];
      if (!x || x[0] < 10) return [0, 1, (x ? x[0] : 0) + " of 10 answers needed"];
      const a = Math.round((x[1] / x[0]) * 100);
      return [a >= g.target ? 1 : a / g.target, 1, a + "% this week"];
    }
    if (g.type === "official") {
      const end = addDays(tot.ws, 7), inWk = (t) => t.date >= tot.ws && t.date < end;
      const n = S.tests.filter((t) => inWk(t) && (OFFICIAL_SRC.includes(t.source) || (g.orMock && t.source === "app" && t.total))).length;
      return [n, g.target, n ? "logged" : "not yet"];
    }
    if (g.type === "notebook") { const n = S.mistakes.length; return [n <= g.target ? 1 : g.target / n, 1, n + " in the notebook"]; }
    return [0, 1];
  }
  const goalDone = (g, tot) => { const [a, b] = goalProgress(g, tot); return a >= b; };
  function planBookkeeping() {
    if (!S.planStart) S.planStart = today();
    const cut = addDays(today(), -400);
    for (const k of Object.keys(S.activity)) if (k < cut) delete S.activity[k];
    for (const k of Object.keys(S.weeks)) if (k < cut) delete S.weeks[k];
    const m = planMode();
    if (m === "sprint" || m === "after") { S.weekStatus = null; return; }
    const { ws, w } = currentWeek(), tot = weekTotals(ws);
    if (!w.won && w.goals.every((g) => goalDone(g, tot))) { w.won = true; S.xp += 100; toast("+100 XP · " + withName("week won") + "! Every goal is done.", true); award("weekwon"); }
    const qg = w.goals.find((g) => g.type === "q");
    S.weekStatus = { ws, q: tot.q, qTarget: qg ? qg.target : 0, focus: w.goals.filter((g) => g.type === "dom").map((g) => DOM[g.d].name), done: w.goals.filter((g) => goalDone(g, tot)).length, total: w.goals.length, phase: w.phase };
  }
  function checkGoalScore(total) { if (total && S.settings.target && total >= S.settings.target) award("goal"); }
  function latestTotal() { const t = S.tests.filter((x) => x.total).pop(); return t ? t : null; }

  /* Geometry & Trig Lab: a separate guided page (geometry.html), shown to signed-in students only. */
  function labCard() {
    const cx = ((S.lab2 && S.lab2.done) || []).length;
    return el("div", null, el("div", { class: "card mission" },
      el("div", { class: "eyebrow", text: "Interactive lessons · New question types" }),
      el("h2", { text: "Concept Lab" }),
      el("p", { class: "muted", style: "margin-top:.3em", text: "Learn the Advanced Math types from Practice Test 2 (how many solutions, factors, shifts, fraction equations) and the notes-question method, before practicing them." }),
      el("div", { class: "row", style: "margin-top:12px;align-items:center" }, el("a", { class: "btn primary", href: "concepts.html" }, cx ? (cx >= 7 ? "Review the Concept Lab" : "Continue the Concept Lab") : "Open the Concept Lab"), el("span", { class: "muted", style: "font-size:13.5px", text: cx + " of 7 missions done" }))),
      el("div", { class: "card mission" },
      el("div", { class: "eyebrow", text: "Interactive lessons · Geometry & Trig" }),
      el("h2", { text: "Geometry & Trig Lab" }),
      el("p", { class: "muted", style: "margin-top:.3em", text: "Seven short missions with moving figures, each ending in a real PSAT-style problem." }),
      (() => { const n = ((S.lab && S.lab.done) || []).length; return el("div", { class: "row", style: "margin-top:12px;align-items:center" }, el("a", { class: "btn primary", href: "geometry.html" }, n ? (n >= 7 ? "Review the Lab" : "Continue the Lab") : "Open the Lab"), el("span", { class: "muted", style: "font-size:13.5px", text: n + " of 7 missions done" })); })()));
  }
  function renderToday() {
    if (GUEST) return renderLanding();
    const p = $("#p-today"); p.textContent = "";
    const t = today(), mode = planMode();
    if (S.mock && S.mock.phase !== "done") {
      p.append(el("div", { class: "card mission" }, el("div", { class: "eyebrow", text: "Mock test in progress" }), el("h2", { text: FORMATS[S.mock.kind].name + " mock" }), el("div", { class: "row" }, el("button", { class: "btn primary", onclick: () => show("mock") }, "Resume the mock test"))));
    }
    const ic = installCard(); if (ic) p.append(ic);
    const sprint = mode === "sprint";
    const fc0 = sprint ? null : focusCard(); if (fc0 && mode !== "after") p.append(fc0);
    scorePrompt(p);
    try { labSync(); } catch (e) { }
    const fxc = fixCard(); if (fxc) p.append(fxc);
    if (sprint) renderSprint(p, t);
    else if (mode === "after") renderAfter(p);
    else renderLongPlan(p, mode);
  }
  // How the digital tests work (shown on the Tests tab).
  function howTestCard() {
    const info = (h, b) => el("div", {}, el("div", { class: "eyebrow", text: h }), el("p", { style: "margin-top:.3em", text: b }));
    return el("details", { class: "card fold" }, el("summary", { text: "How the digital PSAT and SAT work" }),
      el("div", { class: "grid2", style: "margin-top:12px" },
        info("Reading and Writing", "54 questions in 64 minutes, split into two 32-minute modules. Short passages with one question each. About 71 seconds per question."),
        info("Math", "44 questions in 70 minutes, split into two 35-minute modules. Calculator allowed throughout. About a quarter of questions need a typed-in answer. About 95 seconds per question."),
        info("Adaptive", "How you do on Module 1 decides whether Module 2 is the easier or the harder set. Only the harder set unlocks the top scores."),
        info("Scoring", "PSAT sections score 160–760 (total 320–1520). SAT sections score 200–800 (total 400–1600). Wrong answers cost nothing, so never leave a blank.")),
      el("p", { class: "muted", style: "font-size:13px;margin-top:14px" }, "Official practice: ", el("a", { href: "https://bluebook.collegeboard.org/", target: "_blank", rel: "noopener" }, "Bluebook app"), " · ", el("a", { href: "https://satsuitequestionbank.collegeboard.org/", target: "_blank", rel: "noopener" }, "SAT Suite Question Bank"), " · ", el("a", { href: "https://www.khanacademy.org/digital-sat", target: "_blank", rel: "noopener" }, "Khan Academy SAT prep")));
  }

  /* ================= Me > Account: tests, name, reminders, sign-in, backups (one place) ================= */
  function renderAccount() {
    const p = $("#p-account"); p.textContent = "";
    const click = (id) => () => { const b = document.getElementById(id); if (b) b.click(); };
    p.append(el("div", {}, el("h2", { text: "Account" })));
    p.append(myTestsCard());
    p.append(el("div", { class: "card acct-list" },
      row("Your name", S.settings.name || "Not set", "Edit", click("settingsBtn")),
      row("Reminders", "A nudge on your phone each evening", "Set up", click("remindBtn")),
      row("Sign-in", (document.getElementById("syncBtn") || {}).textContent || "", "Open", click("syncBtn")),
      row("Backup file", "Your progress already saves to your account. A file copy is optional.", "Download", click("exportBtn")),
      row("Restore", "Load progress from a backup file", "Choose file", click("importFile"))));
    function row(h, sub, btn, fn) { return el("div", { class: "acct-row" }, el("div", {}, el("strong", { text: h }), el("div", { class: "muted", style: "font-size:13.5px", text: sub })), el("button", { class: "btn small", onclick: fn }, btn)); }
  }

  /* ================= Public home page (signed out) ================= */
  const acct = (m) => document.dispatchEvent(new CustomEvent("psapp-account", { detail: m }));
  const SAMPLE_LIMIT = 2;
  function renderLanding() {
    const p = $("#p-today"); p.textContent = "";
    const link = (href, text) => el("a", { href, target: "_blank", rel: "noopener" }, text);
    p.append(el("div", { class: "card mission hero" },
      el("div", { class: "eyebrow", text: "Free practice for the digital PSAT and SAT" }),
      el("h2", { class: "hero-h", text: "Practice smarter, one skill at a time" }),
      el("p", { class: "lede", text: "Test Prep Hub gives students fresh practice questions every time, full-length mock tests in the real adaptive format, a skill matrix that shows exactly what to work on, and a study plan built around their own test date." }),
      el("div", { class: "row" },
        el("button", { class: "btn primary", onclick: () => acct("up") }, "Create a student account"),
        el("button", { class: "btn", onclick: () => acct("in") }, "Sign in"),
        el("button", { class: "btn ghost", onclick: () => show("practice") }, "Try a sample")),
      el("p", { class: "muted", style: "font-size:13px", text: "Accounts are free and need an invite code from the person who shared this site." })));

    const feat = (h, b) => el("div", { class: "feat" }, el("strong", { text: h }), el("p", { class: "muted", text: b }));
    p.append(el("div", {}, el("h3", { style: "margin-bottom:12px", text: "What students get with an account" }), el("div", { class: "feats" },
      feat("Fresh questions, every time", "Math questions are generated with new numbers on every try, including graphs and charts. Reading and writing questions don't repeat until the bank runs out."),
      feat("Real-format mock tests", "Timed PSAT or SAT mocks with two modules per section. Module 2 gets harder or easier based on Module 1, just like the real test."),
      feat("A skill matrix", "Accuracy across all 8 College Board skill areas from mocks, practice, and Bluebook scores, with the weakest skills flagged."),
      feat("A plan that fits the test date", "Monthly phases when the test is far away, weekly goals as it gets closer, and a day-by-day sprint in the final stretch."),
      feat("Mistake notebook", "Every missed question comes back until it's answered correctly, with a clear explanation."),
      feat("Reminders and rewards", "Optional phone reminders, streaks, badges, and rewards a parent can set."))));

    p.append(el("div", { class: "card" }, el("h3", { text: "How the digital PSAT and SAT work" }),
      el("div", { class: "grid2", style: "margin-top:12px" },
        info("Reading and Writing", "54 questions in 64 minutes, split into two 32-minute modules. Short passages with one question each."),
        info("Math", "44 questions in 70 minutes, split into two 35-minute modules. A calculator (Desmos) is built in, and about a quarter of the questions need a typed-in answer."),
        info("Adaptive", "How you do on Module 1 decides whether Module 2 is the easier or harder set. Only the harder set unlocks the top scores."),
        info("Scoring", "PSAT: 320–1520. SAT: 400–1600. There's no penalty for wrong answers, so never leave a question blank."))));

    const steps = [
      ["Create a College Board account", el("span", {}, "It's free at ", link("https://www.collegeboard.org/", "collegeboard.org"), ". Use the same account for Bluebook and for your scores.")],
      ["Install Bluebook", el("span", {}, "Download it from ", link("https://bluebook.collegeboard.org/students/download-bluebook", "College Board's Bluebook page"), " on a Windows or Mac laptop, an iPad, or a school-managed Chromebook (phones aren't supported). On a school-managed device, your school's IT team may install it for you.")],
      ["Download a full-length practice test", el("span", {}, "In Bluebook, sign in, choose your test (PSAT/NMSQT or SAT), and download a practice test. It works like the real thing, including the adaptive modules and Desmos.")],
      ["Take it timed, in one sitting", el("span", {}, "Then open your score report in My Practice to see every question, which ones you missed, and the skill area of each.")],
      ["Before test day", el("span", {}, "Your school or test center explains device setup. Update Bluebook and run its exam readiness check a few days before the test.")]
    ];
    p.append(el("div", { class: "card" }, el("h3", { text: "Set up Bluebook, the official test app" }),
      el("p", { class: "muted", style: "margin:.3em 0 12px", text: "The real PSAT and SAT are taken in Bluebook, so practice there too." }),
      el("ol", { class: "steps" }, steps.map(([h, b]) => el("li", {}, el("strong", { text: h }), b)))));

    const res = [
      ["Bluebook practice tests", "https://satsuite.collegeboard.org/practice/practice-tests/bluebook", "Official full-length adaptive practice tests from College Board."],
      ["Official Digital SAT Prep on Khan Academy", "https://www.khanacademy.org/digital-sat", "Free lessons and practice by skill, built with College Board."],
      ["Khan Academy PSAT practice tests", "https://www.khanacademy.org/test-prep/dpsat-practice-test-01-22", "Official PSAT practice questions you can work through online."],
      ["SAT Suite Question Bank", "https://satsuitequestionbank.collegeboard.org/", "Thousands of official questions, filterable by skill and difficulty."],
      ["PSAT/NMSQT from College Board", "https://satsuite.collegeboard.org/psat-nmsqt", "Test dates, what's on the test, and score information."],
      ["National Merit Scholarship Program", "https://www.nationalmerit.org/", "How junior-year PSAT/NMSQT scores lead to National Merit recognition."],
      ["Desmos graphing calculator", "https://www.desmos.com/calculator", "The same calculator built into Bluebook. Practice with it before test day."]
    ];
    p.append(el("div", { class: "card" }, el("h3", { text: "Free official resources" }),
      el("div", { class: "reslist" }, res.map(([t, href, d]) => el("div", { class: "res" }, link(href, t + " ↗"), el("span", { class: "muted", text: d }))))));

    const left = (k) => Math.max(0, SAMPLE_LIMIT - (S.samples[k] || 0));
    p.append(el("div", { class: "card mission" }, el("h3", { text: "Try it without an account" }),
      el("p", { class: "muted", text: "Get a feel for the site with " + left("practice") + " short practice set" + (left("practice") === 1 ? "" : "s") + " (5 questions each) and " + left("mock") + " sample mock test" + (left("mock") === 1 ? "" : "s") + " (10 questions, timed). Full-length mocks, the study plan, and progress tracking come with a free account." }),
      el("div", { class: "row" },
        el("button", { class: "btn", disabled: !left("practice"), onclick: () => show("practice") }, "Sample practice set"),
        el("button", { class: "btn", disabled: !left("mock"), onclick: () => show("mock") }, "Sample mock test"),
        el("button", { class: "btn primary", onclick: () => acct("up") }, "Create a student account"))));
    function info(h, b) { return el("div", {}, el("div", { class: "eyebrow", text: h }), el("p", { style: "margin-top:.3em", text: b })); }
  }
  function guestGate(p, what) {
    p.append(el("div", { class: "card mission" }, el("div", { class: "eyebrow", text: "Samples used" }),
      el("h2", { text: "Ready for the full site?" }),
      el("p", { class: "lede", text: "You've used the free " + what + ". Create a free student account to get unlimited practice, full-length mock tests, a study plan for your test date, and progress that follows you to every device." }),
      el("div", { class: "row" }, el("button", { class: "btn primary", onclick: () => acct("up") }, "Create a student account"), el("button", { class: "btn", onclick: () => acct("in") }, "Sign in"))));
  }

  function goalLine(p) {
    const tg = S.settings.target, lt = latestTotal(), fmt = FORMATS[S.settings.kind];
    if (!tg) return el("p", { class: "muted", style: "font-size:14px" }, "No target score yet. ", el("button", { class: "btn small ghost", onclick: () => examsPop() }, "Set a target score"));
    if (!lt) return el("p", { style: "font-size:14px" }, el("strong", { text: "Target " + tg }), el("span", { class: "muted", text: " · take a mock test to see how far you are from it" }));
    const gap = tg - lt.total;
    return el("p", { style: "font-size:14px" }, el("strong", { text: "Target " + tg }), el("span", { class: "muted", text: " · latest " + lt.total + (isEst(lt) ? " (estimated)" : "") + " · " }), gap > 0 ? el("strong", { text: gap + " to go" }) : el("strong", { style: "color:var(--good)", text: "target reached" }));
  }

  function renderLongPlan(p, mode) {
    const { ws, w } = currentWeek(), tot = weekTotals(ws), n = daysLeft(), fmt = FORMATS[S.settings.kind];
    const top = w.goals.find((g) => g.type === "dom");
    const focusId = top ? top.d : focusList()[0].id;
    const done = w.goals.filter((g) => goalDone(g, tot)).length;
    const list = el("div", { class: "goals" });
    w.goals.forEach((g) => {
      const [a, b, note] = goalProgress(g, tot), ok = a >= b, pct = Math.max(0, Math.min(1, a / b));
      list.append(el("div", { class: "goal" + (ok ? " done" : "") },
        el("span", { class: "bubble", "aria-hidden": "true", "aria-pressed": String(ok) }, ok ? "✓" : ""),
        el("span", {}, el("span", { class: "gl", text: g.label }), el("div", { class: "track", style: "margin-top:6px;height:7px" }, el("i", { style: "width:" + Math.round(pct * 100) + "%" }))),
        el("span", { class: "num muted", style: "font-size:13px;text-align:right", text: note || Math.min(a, b) + " / " + b })));
    });
    p.append(el("div", { class: "card mission" },
      el("div", { class: "row between" }, el("div", {}, el("div", { class: "eyebrow", text: possessive() + (who() ? "goals this week" : "This week's goals") }), el("h2", { text: w.diagnostic ? "Find your starting point" : PHASES[w.phase].name + " week" })),
        el("span", { class: "date", text: fmtDay(ws).md + " – " + fmtDay(addDays(ws, 6)).md + " · " + done + "/" + w.goals.length + " done" + (w.won ? " · won" : "") })),
      goalLine(),
      list,
      w.goals.some((g) => g.type === "official") ? howBox("bluebook", "How to log a Bluebook or Khan Academy test") : null,
      el("div", { class: "row" },
        el("button", { class: "btn primary", onclick: () => { S.prefs.sel = [focusId]; save(); show("practice"); startPractice([focusId], 10, "auto"); } }, "15 minutes today: " + DOM[focusId].name),
        el("button", { class: "btn", onclick: () => show("mock") }, "Take a mock test")),
      el("p", { class: "muted", style: "font-size:13px", text: "New goals every Monday, picked from your Progress page. Meet them all for +100 XP." })));
    // last week
    const lw = addDays(ws, -7), lt = weekTotals(lw), lwGoals = S.weeks[lw];
    if (lt.q || lt.mock) {
      const bits = [lt.q + " questions", lt.q ? Math.round((lt.c / lt.q) * 100) + "% correct" : null, lt.mock ? lt.mock + " mock section" + (lt.mock === 1 ? "" : "s") : null, lt.days + " day" + (lt.days === 1 ? "" : "s") + " practiced"].filter(Boolean);
      const met = lwGoals ? lwGoals.goals.filter((g) => goalDone(g, lt)).length : null;
      p.append(el("div", { class: "card", style: "display:grid;gap:6px" }, el("div", { class: "eyebrow", text: "Last week's check-in" }), el("p", { style: "font-size:15px", text: bits.join(" · ") + (lwGoals ? " · " + met + " of " + lwGoals.goals.length + " goals met" : "") })));
    }
    // roadmap
    const rows = el("div", { class: "plan" });
    if (mode === "monthly") {
      const end = parseYmd(S.settings.date), cur = new Date(parseYmd(today()).getFullYear(), parseYmd(today()).getMonth(), 1);
      for (let m = new Date(cur); m <= end; m.setMonth(m.getMonth() + 1)) {
        const first = ymd(m), probe = first < today() ? today() : first, ph = phaseAt(probe), isCur = m.getTime() === cur.getTime();
        rows.append(el("div", { class: "pday" + (isCur ? " today" : "") }, el("div", { class: "d" }, el("b", { text: m.toLocaleDateString("en-US", { month: "short" }) }), String(m.getFullYear()) + (isCur ? " · now" : "")),
          el("div", {}, el("strong", { text: PHASES[ph].name }), el("div", { class: "muted", style: "font-size:13px", text: PHASES[ph].what })), el("span")));
      }
    } else {
      for (let k = weekStart(today()); k <= S.settings.date; k = addDays(k, 7)) {
        const probe = k < today() ? today() : k, ph = phaseAt(probe), isCur = k === ws;
        rows.append(el("div", { class: "pday" + (isCur ? " today" : "") }, el("div", { class: "d" }, el("b", { text: fmtDay(k).md }), "week" + (isCur ? " · now" : "")),
          el("div", {}, el("strong", { text: PHASES[ph].name }), el("div", { class: "muted", style: "font-size:13px", text: PHASES[ph].what })), el("span")));
      }
    }
    p.append(el("div", {}, el("div", { class: "row between", style: "margin-bottom:12px" }, el("h3", { text: "Road to " + fmt.name + " · " + fmtDay(S.settings.date).md + ", " + parseYmd(S.settings.date).getFullYear() }), el("span", { class: "muted", style: "font-size:13px", text: n + " days · " + (mode === "monthly" ? "month by month" : "week by week") + " · final " + (SPRINT_DAYS + 1) + " days are day by day" })), rows));
  }

  function renderAfter(p) {
    const fmt = FORMATS[S.settings.kind];
    p.append(el("div", { class: "card mission" }, el("div", { class: "eyebrow", text: fmt.name + " · " + fmtDay(S.settings.date).md }),
      el("h2", { text: withName("Test's done. Nice work") + "." }),
      el("p", { class: "lede", text: "Scores usually arrive a few weeks after test day. Add your next test (the SAT, or next year's PSAT) with its date and a target score, and your plan starts again: monthly phases when it's far away, weekly goals as it gets closer, and a day-by-day sprint at the end." }),
      el("div", { class: "row" }, el("button", { class: "btn primary", onclick: () => examsPop(true) }, "Add my next test"), el("button", { class: "btn", onclick: () => show("practice") }, "Keep practicing"))));
  }

  function officialCard() {
    const off = S.tests.filter((t) => OFFICIAL_SRC.includes(t.source)), bb = off.filter((t) => t.source === "bluebook"), kh = off.filter((t) => t.source === "khan");
    const last = off[off.length - 1];
    const link = (href, text) => el("a", { href, target: "_blank", rel: "noopener" }, text);
    return el("div", { class: "card", style: "display:grid;gap:10px" },
      el("div", { class: "row between" }, el("h3", { text: "Official practice tests" }), el("button", { class: "btn small primary", onclick: () => show("log") }, "Log a test")),
      el("p", { style: "font-size:15px" }, "Logged so far: ", el("strong", { text: bb.length + " Bluebook" }), ", ", el("strong", { text: kh.length + " Khan Academy" }), (last ? " · last: " + last.name + ", " + fmtDay(last.date).md + (last.total ? " (" + last.total + (isEst(last) ? " est." : "") + ")" : "") : "") + "."),
      el("p", { class: "muted", style: "font-size:13px" }, "Take full tests in ", link(LINKS.bluebook, "Bluebook"), " (the real test app, with official scoring) and extra practice sections on ", link(LINKS.khanPsat, "Khan Academy"), ". Log each one here."),
      howBox("bluebook"), howBox("khan"));
  }
  const CB_DATES = { psat: "https://satsuite.collegeboard.org/psat-nmsqt", sat: "https://satsuite.collegeboard.org/sat/dates-deadlines" };
  const examLabel = (e) => FORMATS[e.kind].name + " · " + fmtDay(e.date).dow + " " + fmtDay(e.date).md + ", " + parseYmd(e.date).getFullYear();
  function daysTo(dateStr) { const n = new Date(); return Math.round((parseYmd(dateStr) - new Date(n.getFullYear(), n.getMonth(), n.getDate())) / 864e5); }
  function myTestsCard() {
    const ex = S.settings.exams || [], t = today();
    const up = ex.filter((e) => e.date >= t), past = ex.filter((e) => e.date < t);
    const list = el("div", { class: "exlist" });
    up.forEach((e) => { const n = daysTo(e.date), on = e.id === S.settings.activeExam;
      list.append(el("div", { class: "exrow" + (on ? " on" : "") }, el("div", {}, el("strong", { text: examLabel(e) }), el("span", { class: "muted", text: " · " + (n === 0 ? "today" : n === 1 ? "tomorrow" : "in " + n + " days") + (e.target ? " · target " + e.target : "") })), on ? el("span", { class: "chip good", text: "Plan follows this one" }) : null)); });
    past.slice(-2).reverse().forEach((e) => list.append(el("div", { class: "exrow past" }, el("div", {}, el("span", { text: examLabel(e) }), el("span", { class: "muted", text: e.score ? " · scored " + e.score : " · done" })))));
    if (!up.length) list.append(el("p", { class: "muted", style: "font-size:14px", text: "No upcoming test yet." }));
    return el("div", { class: "card", style: "display:grid;gap:10px" },
      el("div", { class: "row between" }, el("h3", { text: "My tests" }), el("button", { class: "btn small", onclick: () => examsPop() }, up.length ? "Add or change dates" : "Add a test")),
      list,
      el("p", { class: "muted", style: "font-size:13px" }, "Your plan always counts down to the next test on this list. Official dates: ", el("a", { href: CB_DATES.psat, target: "_blank", rel: "noopener" }, "PSAT/NMSQT"), " · ", el("a", { href: CB_DATES.sat, target: "_blank", rel: "noopener" }, "SAT")));
  }
  // After a test day passes, ask once for the official score (optional).
  function scorePrompt(p) {
    const t = today(), e = (S.settings.exams || []).filter((x) => x.date < t && !x.score && !x.noScore && daysTo(x.date) >= -120).pop();
    if (!e) return;
    const lo = e.kind === "sat" ? 200 : 160, hi = e.kind === "sat" ? 800 : 760;
    const rw = el("input", { type: "number", min: lo, max: hi, step: "10", inputmode: "numeric", placeholder: "R&W", "aria-label": "Reading and Writing score" });
    const ma = el("input", { type: "number", min: lo, max: hi, step: "10", inputmode: "numeric", placeholder: "Math", "aria-label": "Math score" });
    const f = el("form", { class: "row", style: "gap:8px" }, rw, ma, el("button", { class: "btn primary small", type: "submit" }, "Save score"),
      el("button", { class: "btn small ghost", type: "button", onclick: () => { e.noScore = true; save(); render(); } }, "Not yet / skip"));
    f.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const r = Math.round(+rw.value / 10) * 10, m = Math.round(+ma.value / 10) * 10;
      if (!(r >= lo && r <= hi && m >= lo && m <= hi)) { toast("Enter both section scores (" + lo + "–" + hi + ")."); return; }
      e.score = r + m;
      S.tests.push({ id: uid(), source: "official", kind: e.kind, name: "Official " + FORMATS[e.kind].name, date: e.date, rw: r, math: m, total: r + m, dom: {} });
      addXP(100, "Official score logged"); checkGoalScore(r + m); save(); render(); toast("Score saved: " + (r + m), true);
    });
    p.append(el("div", { class: "card", style: "display:grid;gap:10px" }, el("div", { class: "eyebrow", text: "Your " + FORMATS[e.kind].name + " on " + fmtDay(e.date).md }),
      el("h3", { text: "Got your score? Log it here" }), el("p", { class: "muted", style: "font-size:14px", text: "Scores usually post in the College Board account a few weeks after test day. Your score becomes the starting point for the next test's plan." }), f));
  }
  function examsPop(adding) {
    const host = $("#pop"); host.textContent = ""; tool = null;
    const box = el("div", { class: "panelpop wide", role: "dialog", "aria-label": "My tests" });
    const t = today();
    function draw(editId) {
      box.textContent = "";
      box.append(el("header", {}, el("strong", { text: "My tests" }), el("button", { type: "button", class: "btn small ghost", onclick: () => { host.textContent = ""; render(); } }, "Done")));
      box.append(el("p", { class: "muted", style: "font-size:14px", text: "Add every PSAT or SAT you plan to take. Your plan and reminders count down to the next one; when it's over, they move to the one after." }));
      const ex = S.settings.exams;
      ex.forEach((e) => {
        if (e.id === editId) { box.append(form(e)); return; }
        box.append(el("div", { class: "exrow" + (e.date < t ? " past" : "") + (e.id === S.settings.activeExam && e.date >= t ? " on" : "") },
          el("div", {}, el("strong", { text: examLabel(e) }), el("span", { class: "muted", text: (e.target ? " · target " + e.target : "") + (e.score ? " · scored " + e.score : e.date < t ? " · done" : "") })),
          el("div", { class: "row", style: "gap:6px" },
            el("button", { class: "btn small ghost", onclick: () => draw(e.id) }, "Edit"),
            el("button", { class: "btn small ghost", onclick: () => { if (ex.length === 1) { toast("Keep at least one test on the list. Edit it instead."); return; } S.settings.exams = ex.filter((x) => x.id !== e.id); commit(); draw(); } }, "Remove"))));
      });
      if (editId === "new") box.append(form(null)); else box.append(el("button", { class: "btn", onclick: () => draw("new") }, "+ Add a test"));
      box.append(el("p", { class: "muted", style: "font-size:13px" }, "Official dates: ", el("a", { href: CB_DATES.psat, target: "_blank", rel: "noopener" }, "PSAT/NMSQT (usually October, through school)"), " · ", el("a", { href: CB_DATES.sat, target: "_blank", rel: "noopener" }, "SAT dates and registration")));
    }
    function form(e) {
      const last = S.settings.exams[S.settings.exams.length - 1];
      const kind = el("select", {}, el("option", { value: "psat", text: "PSAT/NMSQT" }), el("option", { value: "sat", text: "SAT" })); kind.value = e ? e.kind : last && last.kind === "psat" ? "sat" : "psat";
      const date = el("input", { type: "date", required: true, value: e ? e.date : "" , min: e ? "" : t });
      const tg = el("input", { type: "number", min: "320", max: "1600", step: "10", inputmode: "numeric", placeholder: "e.g. 1300", value: e && e.target ? e.target : "" });
      // Published 2026–27 national SAT Saturdays (College Board). PSAT/NMSQT dates are set by each school in October.
      const SAT_DATES = ["2026-10-03", "2026-11-07", "2026-12-05", "2027-03-06", "2027-05-01", "2027-06-05"];
      const picks = el("div", { class: "row", style: "gap:6px" });
      const drawPicks = () => { picks.textContent = ""; if (kind.value !== "sat") { picks.append(el("span", { class: "muted", style: "font-size:13px", text: "PSAT/NMSQT is given at school in October; ask the school for its date." })); return; }
        const fut = SAT_DATES.filter((d) => d > t); if (!fut.length) return;
        picks.append(el("span", { class: "muted", style: "font-size:13px", text: "SAT dates:" }), ...fut.map((d) => el("button", { type: "button", class: "btn small ghost", onclick: () => { date.value = d; } }, fmtDay(d).md + (d.slice(0, 4) !== t.slice(0, 4) ? " " + d.slice(0, 4) : "")))); };
      kind.addEventListener("change", drawPicks); drawPicks();
      const f = el("form", { class: "exform" }, el("div", { class: "fields" }, el("label", { class: "f" }, "Test", kind), el("label", { class: "f" }, "Date", date), el("label", { class: "f" }, "Target (optional)", tg)), picks,
        el("div", { class: "row" }, el("button", { class: "btn primary small", type: "submit" }, e ? "Save" : "Add test"), el("button", { class: "btn small ghost", type: "button", onclick: () => draw() }, "Cancel")));
      f.addEventListener("submit", (ev) => {
        ev.preventDefault(); if (!date.value) return;
        const v = Math.round(+tg.value / 10) * 10, target = v >= 320 && v <= 1600 ? v : null;
        if (S.settings.exams.some((x) => x.date === date.value && (!e || x.id !== e.id))) { toast("There's already a test on that date."); return; }
        if (e) Object.assign(e, { kind: kind.value, date: date.value, target }); else S.settings.exams.push({ id: exId(), kind: kind.value, date: date.value, target });
        commit(); draw(); toast(e ? "Test updated" : "Test added", true);
      });
      return f;
    }
    function commit() { syncExams(S); save(); for (const fn of settingsHooks) { try { fn(S.settings); } catch (x) { } } render(); }
    draw(adding ? "new" : null); host.append(box);
  }

  // Rough minutes for a task, so the student can see how long the day is. Explicit numbers in the text win.
  function estMin(day, i) {
    const g = day.go && day.go[i], t = day.tasks[i];
    const m = /(\d+)\s*(?:min|minutes)\b/.exec(t); if (m && !/1½/.test(t)) return +m[1];
    if (!g) return /breakfast|Lights out|Pack|Take care|Never leave|Use Desmos and|break/.test(t) ? 0 : 5;
    if (g.k === "practice") return Math.round(g.n * (g.timed ? 1.5 : 1.3));
    if (g.k === "focus") return 25;
    if (g.k === "notebook") return 15;
    if (g.k === "deck") return g.top ? 2 : g.area ? 8 : 5;
    if (g.k === "mock") return g.parts.includes("rw") && g.parts.includes("math") ? 145 : g.parts.includes("rw") ? 64 : 70;
    if (g.k === "mockreview") return 15;
    if (g.k === "log") return 5;
    if (g.k === "treview") return 20;
    if (g.k === "visit") return 10;
    if (g.k === "lab") return 8 * g.m.length;
    if (g.k === "ext") return /Practice Test 2 in one sitting/.test(t) ? 135 : /Read the explanation|Review every miss/.test(t) ? 20 : /Install|Download|Charge/.test(t) ? 10 : 15;
    return 5;
  }
  const minLabel = (n) => (n >= 60 ? Math.floor(n / 60) + " h" + (n % 60 ? " " + (n % 60) + " min" : "") : n + " min");
  function renderSprint(p, t) {
    const PLAN = plan();
    const cur = PLAN.find((d) => d.date === t) || (t < PLAN[0].date ? PLAN[0] : null);
    if (cur) {
      // Everything for today in one list: today's tasks, then up to 3 carried over from earlier days.
      const rows = cur.tasks.map((_, i) => ({ day: cur, i }));
      const carry = []; if (cur.date === t) carriedTasks(PLAN, t).forEach((x) => x.idx.forEach((i) => carry.push({ day: x.day, i, from: fmtDay(x.day.date) })));
      carry.slice(0, 3).forEach((r) => rows.push(r)); const older = carry.length - 3;
      const isDone = (r) => !!S.tasks[r.day.date + "#" + r.i];
      const todo = rows.filter((r) => !isDone(r)), done = rows.filter(isDone);
      const left = todo.reduce((a, r) => a + estMin(r.day, r.i), 0);
      const when = parseYmd(cur.date).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
      const card = el("div", { class: "card mission today-card" },
        el("div", { class: "eyebrow", text: (cur.date === t ? "Today · " : "Starts ") + when }),
        el("h2", { text: cur.title }),
        el("div", { class: "today-meta" }, el("span", { text: done.length + " of " + rows.length + " done" }), todo.length && left ? el("span", { text: "about " + minLabel(left) + " left" }) : null),
        el("div", { class: "tmeter", "aria-hidden": "true" }, el("i", { style: "width:" + Math.round((100 * done.length) / Math.max(1, rows.length)) + "%" })),
        S.settings.target ? goalLine() : null,
        todayTimeLine());
      if (todo.length) {
        const up = todo[0], g = up.day.go[up.i], txt = up.day.tasks[up.i], ext = g && g.k === "ext", est = estMin(up.day, up.i);
        card.append(el("div", { class: "upnext" },
          el("div", { class: "eyebrow", text: "Up next" + (est ? " · about " + minLabel(est) : "") + (up.from ? " · from " + up.from.dow : "") }),
          el("div", { class: "upnext-t", text: txt }),
          el("div", { class: "row" },
            !g ? el("button", { class: "btn primary", onclick: () => toggleTask(up.day, up.i) }, "Mark done")
              : ext ? el("a", { class: "btn primary", href: g.url, target: "_blank", rel: "noopener" }, "Open ↗") : el("button", { class: "btn primary", onclick: () => runTask(up.day, up.i) }, "Start"),
            ext ? el("button", { class: "btn", onclick: () => toggleTask(up.day, up.i) }, "Mark done") : null)));
        if (todo.length > 1) {
          const ul = el("ul", { class: "tasks today-list" });
          todo.slice(1).forEach((r, k) => ul.append(taskRow(r.day, r.i, k + 1, r.from, false, estMin(r.day, r.i))));
          card.append(el("div", { class: "eyebrow", style: "margin-top:4px", text: "Then" }), ul);
        }
      } else card.append(el("div", { class: "row" }, el("strong", { text: "All done for today. Nice work." }), focusWeights().length ? el("button", { class: "btn small", onclick: () => startPractice(null, 20, "auto", false, true) }, "Want more? Your focus set") : null));
      if (done.length) {
        const ul = el("ul", { class: "tasks today-list" }); done.forEach((r) => ul.append(taskRow(r.day, r.i, 0, r.from)));
        card.append(el("details", { class: "done-fold" }, el("summary", { text: "✓ " + done.length + " done" }), ul));
      }
      if (todo.length) card.append(el("p", { class: "muted hint", text: "Most tasks tick themselves when you finish. ↗ opens another site, so tick that one yourself." + (older > 0 ? " " + older + " older unfinished task" + (older === 1 ? " is" : "s are") + " in the whole plan." : "") }));
      p.append(card);
    }
    const pw = el("div", { class: "plan" });
    PLAN.forEach((day) => {
      const f = fmtDay(day.date), isT = day.date === t, dots = el("div", { class: "dots", "aria-hidden": "true" });
      day.tasks.forEach((_, i) => dots.append(el("i", { class: S.tasks[day.date + "#" + i] ? "on" : "" })));
      pw.append(el("div", { class: "pday" + (isT ? " today" : "") }, el("div", { class: "d" }, el("b", { text: f.md }), f.dow + (isT ? " · today" : "")), el("details", {}, el("summary", { text: day.title }), taskList(day, null, day.date < t)), dots));
    });
    const wide = window.innerWidth >= 1100;
    p.append(el("details", Object.assign({ class: "card week-plan" }, wide ? { open: "" } : {}), el("summary", { text: "The whole plan, day by day" }), el("div", { style: "margin-top:12px" }, pw)));
  }

  /* ================= Shared question rendering ================= */
  const SUPS = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹", "-": "⁻", "−": "⁻" };
  // x^3 → x³ (fractional exponents like ^(t/3) stay as written, the way the test shows them)
  const supify = (t) => (typeof t === "string" ? t.replace(/\^\(?([−-]?\d+)\)?(?![\w/])/g, (m, d) => [...d].map((ch) => SUPS[ch] || ch).join("")) : t);
  // Passages may mark one sentence with <u>…</u> ("the underlined sentence"); everything else stays plain text.
  function passageEl(t) {
    const d = el("div", { class: "passage" });
    String(t).split(/(<u>[\s\S]*?<\/u>)/).forEach((part) => { const m = /^<u>([\s\S]*)<\/u>$/.exec(part); d.append(m ? el("u", { text: m[1] }) : document.createTextNode(part)); });
    return d;
  }
  // Geometry and trig figures (drawn by js/figures.js from plain data on the question).
  function figView(f) { const d = el("div", { class: "fig" }); d.innerHTML = window.Figures ? Figures.svg(f) : ""; return d; }
  function stem(q, parts) {
    const frag = document.createDocumentFragment();
    if (parts !== "prompt") {
      if (q.p) frag.append(passageEl(q.p));
      if (q.table) frag.append(dataTable(q.table));
      if (q.chart) frag.append(chartView(q.chart));
      if (q.fig) frag.append(figView(q.fig));
    }
    if (parts !== "passage") frag.append(el("div", { class: "prompt", text: supify(q.q) }));
    return frag;
  }
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const MINUS_SIGN = "\u2212";
  const tickTxt = (v) => (v < 0 ? MINUS_SIGN + Math.abs(+v.toFixed(2)) : String(+v.toFixed(2)));
  function chartView(c) {
    const W = 400, H = 310, L = 54, R = 16, T = 14, B = 50, pw = W - L - R, ph = H - T - B;
    const y0 = c.y.min, y1 = c.y.max, sy = (v) => T + ph - ((v - y0) / (y1 - y0)) * ph;
    let out = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc((c.type === "bar" ? "Bar graph of " : "Graph of ") + c.y.label + " versus " + c.x.label)}" style="width:100%;max-width:440px;height:auto;display:block">`;
    out += `<defs><clipPath id="clipPlot"><rect x="${L}" y="${T}" width="${pw}" height="${ph}"/></clipPath></defs>`;
    out += `<rect x="${L}" y="${T}" width="${pw}" height="${ph}" fill="var(--surface)" stroke="var(--line)"/>`;
    const yTicks = []; for (let v = y0; v <= y1 + 1e-9; v += c.y.step) yTicks.push(+v.toFixed(6));
    const yEvery = yTicks.length > 13 ? 2 : 1;
    yTicks.forEach((v, i) => {
      out += `<line x1="${L}" x2="${L + pw}" y1="${sy(v)}" y2="${sy(v)}" stroke="var(--line)" stroke-width="${v === 0 && c.type === "graph" ? 0 : 1}"/>`;
      if (i % yEvery === 0) out += `<text x="${L - 7}" y="${sy(v) + 4}" text-anchor="end" font-size="11" fill="var(--graphite)" font-family="var(--mono)">${tickTxt(v)}</text>`;
    });
    if (c.type === "bar") {
      const n = c.bars.length, bw = pw / n;
      c.bars.forEach(([lab, val], i) => {
        const x = L + i * bw;
        out += `<rect x="${x + bw * 0.18}" y="${sy(val)}" width="${bw * 0.64}" height="${sy(y0) - sy(val)}" fill="var(--ink)" opacity="0.85"/>`;
        out += `<text x="${x + bw / 2}" y="${T + ph + 16}" text-anchor="middle" font-size="12" fill="var(--ink)" font-family="var(--mono)">${esc(lab)}</text>`;
      });
    } else {
      const x0 = c.x.min, x1 = c.x.max, sx = (v) => L + ((v - x0) / (x1 - x0)) * pw;
      const xTicks = []; for (let v = x0; v <= x1 + 1e-9; v += c.x.step) xTicks.push(+v.toFixed(6));
      const xEvery = xTicks.length > 13 ? 2 : 1;
      xTicks.forEach((v, i) => {
        out += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${T}" y2="${T + ph}" stroke="var(--line)" stroke-width="${v === 0 && c.type === "graph" ? 0 : 1}"/>`;
        if (i % xEvery === 0) out += `<text x="${sx(v)}" y="${T + ph + 16}" text-anchor="middle" font-size="11" fill="var(--graphite)" font-family="var(--mono)">${tickTxt(v)}</text>`;
      });
      if (c.type === "graph") {
        if (x0 < 0 && x1 > 0) out += `<line x1="${sx(0)}" x2="${sx(0)}" y1="${T}" y2="${T + ph}" stroke="var(--ink)" stroke-width="1.5"/>`;
        if (y0 < 0 && y1 > 0) out += `<line x1="${L}" x2="${L + pw}" y1="${sy(0)}" y2="${sy(0)}" stroke="var(--ink)" stroke-width="1.5"/>`;
      }
      out += `<g clip-path="url(#clipPlot)">`;
      (c.lines || []).forEach(({ m, b }) => { out += `<line x1="${sx(x0)}" y1="${sy(m * x0 + b)}" x2="${sx(x1)}" y2="${sy(m * x1 + b)}" stroke="var(--pencil)" stroke-width="2.5"/>`; });
      (c.curves || []).forEach((pts) => { out += `<polyline fill="none" stroke="var(--pencil)" stroke-width="2.5" points="${pts.map(([x, y]) => sx(x).toFixed(1) + "," + sy(y).toFixed(1)).join(" ")}"/>`; });
      out += `</g>`;
      (c.points || []).forEach(([x, y]) => { out += `<circle cx="${sx(x)}" cy="${sy(y)}" r="4.5" fill="var(--ink)" stroke="var(--surface)" stroke-width="1.5"/>`; });
    }
    out += `<text x="${L + pw / 2}" y="${H - 10}" text-anchor="middle" font-size="12" font-weight="600" fill="var(--ink)">${esc(c.x.label)}</text>`;
    out += `<text transform="translate(14 ${T + ph / 2}) rotate(-90)" text-anchor="middle" font-size="12" font-weight="600" fill="var(--ink)">${esc(c.y.label)}</text>`;
    out += `</svg>`;
    const box = el("div", { class: "chartbox" }); box.innerHTML = out; return box;
  }
  function dataTable(t) {
    return el("div", { class: "tscroll" }, el("table", { class: "dtable" }, el("thead", {}, el("tr", {}, t.head.map((h) => el("th", { text: String(h) })))), el("tbody", {}, t.rows.map((r) => el("tr", {}, r.map((c, i) => el(i === 0 ? "th" : "td", { text: String(c) })))))));
  }
  // options: {picked, reveal, strikes:Set, onPick(i|str), onStrike(i)}
  function answerArea(q, o) {
    if (q.type === "spr") {
      const inp = el("input", { type: "text", id: "spr-" + q.uid, inputmode: "text", autocomplete: "off", value: o.picked ?? "", "aria-label": "Your answer", placeholder: "e.g. 12, −3, 3/4, 0.75", disabled: !!o.reveal });
      inp.addEventListener("input", () => o.onPick(inp.value.trim()));
      const box = el("div", { class: "spr" }, el("label", { for: "spr-" + q.uid, class: "eyebrow", text: "Type your answer" }), inp, el("small", { text: "Fractions (3/4) and decimals (0.75) both work. Use − or - for negatives." }));
      if (o.reveal) box.append(el("div", { class: isRight(q, o.picked) ? "chip good" : "chip bad", text: isRight(q, o.picked) ? "Correct" : "Correct answer: " + answerText(q) }));
      if (o.onEnter) inp.addEventListener("keydown", (e) => { if (e.key === "Enter") o.onEnter(); });
      return box;
    }
    const wrap = el("div", { class: "opts", role: "group", "aria-label": "Answer choices" });
    q.o.forEach((txt, k) => {
      let cls = "opt";
      if (o.reveal) { if (k === q.a) cls += " right"; else if (k === o.picked) cls += " wrong"; }
      else if (o.picked === k) cls += " sel";
      const struck = o.strikes && o.strikes.has(k);
      if (struck) cls += " struck";
      const b = el("button", { class: cls, disabled: !!o.reveal, "aria-pressed": String(o.picked === k), onclick: () => o.onPick(k) }, el("span", { class: "l", text: LETTERS[k] }), el("span", { text: supify(txt) }));
      if (o.onStrike && !o.reveal) wrap.append(el("div", { class: "optw" }, b, el("button", { class: "strike", "aria-pressed": String(!!struck), title: "Cross out choice " + LETTERS[k], "aria-label": "Cross out choice " + LETTERS[k], onclick: () => o.onStrike(k) }, "✕")));
      else wrap.append(b);
    });
    return wrap;
  }
  // Feedback in the same shape every time, so the method sticks: spot it, solve it, watch for the trap, remember the rule.
  function explainBox(q, picked) {
    const ok = isRight(q, picked), blank = picked == null || picked === "";
    const sid = STRAT.strategyFor(q), c = STRAT.cards[sid], isMath = DOM[q.d] && DOM[q.d].sec === "math";
    const chose = !ok && !blank ? (q.type === "spr" ? String(picked) : LETTERS[picked] + ") " + q.o[picked]) : null;
    const row = (label, ...kids) => el("div", { class: "fb-row" }, el("span", { class: "fb-label", text: label }), el("div", { class: "fb-body" }, ...kids));
    const inDeck = !!S.deck[sid];
    const verdict = ok ? "Correct." : (blank ? "No answer. " : "Not quite. ") + (q.type === "spr" ? "The answer is " + answerText(q).replace(/[.!?]$/, "") + "." : "The answer is " + LETTERS[q.a] + ".");
    // Calm layout: a short verdict, the picture, the explanation and the one rule to remember. The rest folds away.
    return el("div", { class: "explain fb" + (ok ? " ok" : " miss") },
      el("div", { class: "fb-head" }, el("strong", { class: "fb-verdict", text: verdict }), chose ? el("span", { class: "muted", text: "You chose " + (q.type === "spr" ? supify(chose) : LETTERS[picked]) + "." }) : null),
      q.efig || q.steps ? row("See it", el("div", { class: "seeit" }, q.efig || q.fig ? figView(q.efig || q.fig) : null, q.steps ? el("ol", { class: "seeit-steps" }, q.steps.map((x) => el("li", { text: supify(x) }))) : null)) : null,
      row("Why", el("p", { text: supify(q.e) })),
      el("div", { class: "fb-remember" }, el("span", { class: "eyebrow", text: "Remember · " + c.name }), el("p", { text: c.say || c.rule }),
        GUEST ? null : el("button", { class: "btn small" + (inDeck ? " ghost" : ""), onclick: (e) => {
          if (S.deck[sid]) { delete S.deck[sid]; e.target.textContent = "Save to my flashcards"; e.target.classList.remove("ghost"); }
          else { S.deck[sid] = { box: 0, due: today(), added: today() }; e.target.textContent = "In my flashcards ✓"; e.target.classList.add("ghost"); }
          save();
        } }, inDeck ? "In my flashcards ✓" : "Save to my flashcards")),
      el("details", { class: "fb-more" }, el("summary", { text: "Learn the pattern" }),
        el("div", { class: "fb-more-body" },
          row("Spot it", el("p", { text: c.spot })),
          row("Method", el("ol", { class: "fb-ol" }, c.steps.map((x) => el("li", { text: x })))),
          isMath && c.desmos ? row("Desmos", el("p", { text: c.desmos })) : null,
          row(ok ? "Watch for" : "The trap", el("p", { text: c.trap })),
          q.t ? row("Tip", el("p", { text: supify(q.t) })) : null,
          c.say && c.say !== c.rule ? row("Full rule", el("p", { text: c.rule })) : null)));
  }
  // The top strategies behind this set's misses: the "3 things to remember" after every set and mock.
  function takeaways(results, title) {
    const miss = {};
    results.filter((r) => !r.ok).forEach((r) => { const id = STRAT.strategyFor(r.q); miss[id] = (miss[id] || 0) + 1; });
    const top = Object.entries(miss).sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (!top.length) return null;
    return el("div", { class: "card takeaways" },
      el("div", { class: "eyebrow", text: title || "3 things to remember" }),
      el("div", { class: "tk-list" }, top.map(([id, n], i) => {
        const c = STRAT.cards[id];
        return el("div", { class: "tk" }, el("span", { class: "tk-n num", text: String(i + 1) }),
          el("div", {}, el("strong", { text: c.name }), el("span", { class: "muted", style: "font-size:13px", text: " · missed " + n + (n === 1 ? " time" : " times") }),
            el("p", { text: c.rule }), el("p", { class: "muted", style: "font-size:13px" }, el("b", { text: "Trap: " }), c.trap)));
      })),
      GUEST ? null : el("div", { class: "row" }, el("button", { class: "btn small primary", onclick: () => show("review") }, "Flip through your flashcards"), el("span", { class: "muted", style: "font-size:13px", text: "These strategies were added to your deck." })));
  }

  /* ================= Review: strategy flashcards and night-before sheet ================= */
  const BOX_DAYS = [1, 2, 4, 7, 14];
  let RV = null; // { queue: [ids], i, flipped }
  function dueCards() { const t = today(); return Object.entries(S.deck).filter(([, d]) => !d.due || d.due <= t).sort((a, b) => (a[1].box || 0) - (b[1].box || 0)).map(([id]) => id); }
  function renderReview() {
    const p = $("#p-review"); p.textContent = "";
    const deckIds = Object.keys(S.deck), due = dueCards();
    p.append(el("div", {}, el("h2", { text: "Learn" }), el("p", { class: "muted lede", text: "Learn the rule first, then practice it." })));
    if (!RV || RV.i >= RV.queue.length) p.append(labCard());
    // Flashcards
    const fc = el("div", { class: "card", style: "display:grid;gap:14px" });
    if (RV && RV.i < RV.queue.length) {
      const id = RV.queue[RV.i], c = STRAT.cards[id];
      fc.append(el("div", { class: "row between" }, el("span", { class: "eyebrow", text: c.area + " · card " + (RV.i + 1) + " of " + RV.queue.length }), RV.back ? el("button", { class: "btn small ghost", onclick: () => { RV = null; show("treview"); } }, "← Back to Test review") : el("button", { class: "btn small ghost", onclick: () => { RV = null; renderReview(); } }, "Stop")));
      fc.append(el("div", { class: "flash" + (RV.flipped ? " flipped" : "") },
        el("h3", { class: "flash-name", text: c.name }),
        el("p", { class: "muted" }, el("b", { text: "When you see: " }), c.spot),
        RV.flipped ? el("div", { class: "flash-back" },
          c.say ? el("p", { class: "flash-say", text: c.say }) : null,
          el("p", { class: "flash-rule", text: c.rule }),
          el("ol", {}, c.steps.map((x) => el("li", { text: x }))),
          c.desmos ? el("p", {}, el("b", { text: "Desmos way: " }), c.desmos) : null,
          el("p", {}, el("b", { text: "Trap: " }), c.trap)) : null));
      if (!RV.flipped) fc.append(el("div", { class: "row" }, el("button", { class: "btn primary", onclick: () => { RV.flipped = true; renderReview(); } }, "Say the rule, then flip")));
      else fc.append(el("div", { class: "row" },
        el("button", { class: "btn primary", onclick: () => grade(id, true) }, "Got it"),
        el("button", { class: "btn", onclick: () => grade(id, false) }, "Review again")));
    } else if (!deckIds.length) {
      fc.append(el("h3", { text: "Your deck is empty" }), el("p", { class: "muted", text: "Finish a practice set or a mock test. The strategy behind every miss is added here, or save any strategy yourself from an explanation." }));
    } else {
      const done = RV && RV.i >= RV.queue.length;
      fc.append(el("h3", { text: done ? "Nice. That's the deck for today." : due.length ? due.length + " card" + (due.length === 1 ? "" : "s") + " to review today" : "All caught up for today" }),
        el("p", { class: "muted", text: "About 5 minutes. Cards you know come back less often; cards you miss come back tomorrow." }),
        el("div", { class: "row" },
          due.length ? el("button", { class: "btn primary", onclick: () => { RV = { queue: due, i: 0, flipped: false }; renderReview(); } }, "Start today's cards") : null,
          el("button", { class: "btn" + (due.length ? "" : " primary"), onclick: () => { RV = { queue: deckIds.slice().sort(() => Math.random() - 0.5), i: 0, flipped: false }; renderReview(); } }, "Review the whole deck")));
    }
    p.append(fc);
    // Night-before sheet
    const ranked = Object.entries(S.strat).filter(([, v]) => v.miss > 0).sort((a, b) => b[1].miss - a[1].miss || (b[1].last || "").localeCompare(a[1].last || "")).slice(0, 8);
    const sheet = el("div", { class: "card sheet", id: "sheet" },
      el("div", { class: "row between" }, el("div", {}, el("div", { class: "eyebrow", text: "One page · read it the night before" }), el("h3", { text: (who() ? who() + "'s " : "Your ") + "night-before sheet" })),
        ranked.length ? el("button", { class: "btn small ghost noprint", onclick: () => { document.body.classList.add("print-sheet"); window.print(); setTimeout(() => document.body.classList.remove("print-sheet"), 500); } }, "Print") : null));
    if (!ranked.length) sheet.append(el("p", { class: "muted", text: "Your most-missed strategies will appear here once you've practiced a bit." }));
    else {
      sheet.append(el("div", { class: "sheet-grid" }, ranked.map(([id, v]) => { const c = STRAT.cards[id]; return el("div", { class: "sheet-item" }, el("strong", { text: c.name }), el("span", { class: "muted", style: "font-size:12px", text: " · " + c.area + " · missed " + v.miss + "×" }), el("p", { text: c.rule }), el("p", { class: "muted", style: "font-size:13px" }, el("b", { text: "Trap: " }), c.trap)); })));
      sheet.append(el("div", { class: "sheet-foot" }, el("strong", { text: "Test-day basics: " }), "Take care on Module 1 (it decides Module 2). Use Desmos and the reference sheet. Never leave a question blank. Flag and move on if you're stuck for more than a minute."));
    }
    p.append(sheet);
    // Library
    const areas = ["Grammar", "Writing", "Reading", "Math"];
    const lib = el("div", { class: "card", style: "display:grid;gap:10px" }, el("h3", { text: "All strategies" }), el("p", { class: "muted", style: "font-size:14px", text: "Every question type on the digital PSAT and SAT, with its rule. Add any of them to your deck." }));
    areas.forEach((ar) => {
      const ids = Object.keys(STRAT.cards).filter((k) => STRAT.cards[k].area === ar);
      lib.append(el("details", { class: "lib" }, el("summary", { text: ar + " (" + ids.length + ")" }),
        el("div", { class: "lib-list" }, ids.map((id) => { const c = STRAT.cards[id], has = !!S.deck[id]; return el("div", { class: "lib-item" },
          el("div", {}, el("strong", { text: c.name }), el("p", { class: "muted", style: "font-size:14px", text: c.rule })),
          el("button", { class: "btn small" + (has ? " ghost" : ""), disabled: has, onclick: () => { S.deck[id] = { box: 0, due: today(), added: today() }; save(); renderReview(); } }, has ? "In deck" : "Add")); }))));
    });
    p.append(lib);
    function grade(id, ok) {
      const d = S.deck[id] || (S.deck[id] = { box: 0, added: today() });
      d.box = ok ? Math.min(BOX_DAYS.length - 1, (d.box || 0) + 1) : 0;
      d.due = addDays(today(), ok ? BOX_DAYS[d.box] : 1);
      if (ok) addXP(2); bumpStreak();
      RV.i++; RV.flipped = false;
      if (RV.i >= RV.queue.length && RV.plan) planEvent({ k: "deck", spec: RV.plan });
      if (RV.i >= RV.queue.length && RV.back) { const back = RV.back; RV = null; save(); toast("Card added to your deck. Now try 5 like it."); show(back); return; }
      save(); renderReview();
    }
  }

  /* ================= Practice ================= */
  let P = null, pTick = null;
  // A short set of one question type (used by Test review's "Practice 5 like this").
  function startTypePractice(ty, n) {
    const used = new Set(), qs = [];
    for (let i = 0; i < n * 3 && qs.length < n; i++) { const q = qFromType(ty, used, null); if (q) qs.push(q); }
    if (!qs.length) { toast("No practice questions for this type yet."); return; }
    save();
    P = { qs, i: 0, pick: null, done: false, results: [], start: Date.now(), timed: S.prefs.timed, notebook: false, focus: false, doms: [...new Set(qs.map((q) => q.d))], count: qs.length, diff: "auto", strikes: new Set() };
    clearInterval(pTick); pTick = setInterval(tickPractice, 1000);
    if (TAB !== "practice") show("practice"); else renderPractice();
  }
  function startPractice(doms, count, diff, notebook, focus) {
    if (GUEST) {
      if ((S.samples.practice || 0) >= SAMPLE_LIMIT) { renderPractice(); return; }
      S.samples.practice = (S.samples.practice || 0) + 1; count = 5; notebook = false; diff = "auto";
    }
    let qs = [];
    const used = new Set();
    if (notebook) qs = S.mistakes.slice(0, 15).map((m) => Object.assign({}, m, { uid: uid() }));
    else if (focus) { qs = buildFocusSet(count || 20); doms = [...new Set(qs.map((q) => q.d))]; save(); }
    else {
      const order = [];
      for (let i = 0; i < count; i++) order.push(doms[i % doms.length]);
      rng.shuffle(order).forEach((d) => {
        const lv = diff === "easier" ? rng.pick([1, 1, 2]) : diff === "harder" ? rng.pick([2, 3, 3]) : autoLevel(d);
        qs.push(nextQuestion(d, lv, used, 0.3));
      });
      save();
    }
    if (!qs.length) { toast("Nothing to practice here yet."); return; }
    P = { qs, i: 0, pick: null, done: false, results: [], start: Date.now(), timed: S.prefs.timed, notebook: !!notebook, focus: !!focus, doms, count, diff, strikes: new Set() };
    clearInterval(pTick); pTick = setInterval(tickPractice, 1000);
    if (TAB !== "practice") show("practice"); else renderPractice();
  }
  function tickPractice() {
    const e = $("#ptimer"); if (!e || !P || P.finished) return;
    const s = (Date.now() - P.start) / 1000, target = P.qs.slice(0, P.i + 1).reduce((a, q) => a + DOM[q.d].pace, 0);
    e.textContent = mmss(s) + " · target " + mmss(target); e.classList.toggle("over", s > target);
  }
  // While a question is on screen, phones get a compact focus layout (see body.inq in the CSS).
  function setInq() {
    const q = (TAB === "practice" && P && !P.finished) || (TAB === "mock" && S.mock && (S.mock.phase === "module" || S.mock.phase === "check")) || (TAB === "friends" && CH && !CH.done);
    document.body.classList.toggle("inq", !!q && !ADMIN);
  }
  // A tip is shown the first time a question type comes up in a set, until it's been answered right 3 times in a row.
  function needsTip(sid) { if (sid === "general" || !STRAT.cards[sid]) return false; const st = S.strat[sid]; return !(st && (st.run || 0) >= 3); }
  function tipCard(c, onGo, onSkip) {
    return el("div", { class: "card tipcard", style: "display:grid;gap:12px" },
      el("div", { class: "eyebrow", text: "Quick tip · " + c.area }),
      el("h2", { text: c.name }),
      c.say ? el("p", { class: "tip-say", text: c.say }) : null,
      el("p", {}, el("b", { text: "When you see: " }), c.spot),
      el("p", { text: c.rule }),
      el("ol", {}, c.steps.map((x) => el("li", { text: x }))),
      c.desmos ? el("p", {}, el("b", { text: "Desmos way: " }), c.desmos) : null,
      el("p", {}, el("b", { text: "Trap: " }), c.trap),
      el("div", { class: "row" }, el("button", { class: "btn primary", id: "tipGo", onclick: onGo }, "Got it. Show me one"),
        onSkip ? el("button", { class: "btn ghost", onclick: onSkip }, "Skip tips this set") : null));
  }
  function renderPractice() {
    setTimeout(setInq, 0);
    const p = $("#p-practice"); p.textContent = "";
    if (P && !P.finished && !P.done && !P.noTips) {
      const q = P.qs[P.i], sid = STRAT.strategyFor(q);
      P.tipped = P.tipped || [];
      if (!P.tipped.includes(sid) && needsTip(sid)) {
        if (!P.tipAt) P.tipAt = Date.now();
        const go = () => { P.tipped.push(sid); P.start += Date.now() - P.tipAt; P.tipAt = null; renderPractice(); window.scrollTo({ top: 0 }); };
        p.append(el("div", { class: "row between" }, el("span", { class: "muted", text: "Question " + (P.i + 1) + " of " + P.qs.length + " is next" })),
          tipCard(STRAT.cards[sid], go, () => { P.noTips = true; go(); }));
        const b = $("#tipGo"); if (b) b.focus();
        return;
      }
    }
    if (P && !P.finished) return practiceQuestion(p);
    if (P && P.finished) p.append(practiceSummary());
    if (GUEST) return practiceSetup(p);
    if (!P || !P.finished) p.append(el("div", {}, el("h2", { text: "Practice" })));
    const top = el("div", { class: "practice-top" });
    { const fc = focusCard(); if (fc) top.append(fc); }
    const nb = S.mistakes.length;
    top.append(el("div", { class: "card nbcard", style: "display:grid;gap:10px" },
      el("div", {}, el("div", { class: "eyebrow", text: "Your misses" }), el("h3", { text: "Mistake notebook" })),
      el("p", { class: "muted", style: "font-size:14px", text: nb ? nb + " question" + (nb === 1 ? "" : "s") + " you missed. Get one right and it leaves the notebook." : "Empty. Every question you miss will wait here until you get it right." }),
      el("div", { class: "row" }, el("button", { class: "btn" + (focusWeights().length ? "" : " primary"), disabled: !nb, onclick: () => startPractice([], 0, "auto", true) }, nb ? "Retry " + Math.min(15, nb) + " now" : "Nothing to retry"))));
    p.append(top);
    const body = el("div", { style: "display:grid;gap:16px;margin-top:14px" });
    practiceSetup(body);
    p.append(el("details", { class: "card fold build" }, el("summary", { text: "Build your own set" }), body));
  }
  function practiceSetup(p) {
    if (GUEST && (S.samples.practice || 0) >= SAMPLE_LIMIT) return guestGate(p, "sample practice sets");
    const pr = S.prefs, top3 = focusList().slice(0, 3).map((d) => d.id);
    if (!pr.sel.length) pr.sel = [top3[0]];
    p.append(el("div", {}, GUEST ? el("h2", { text: "Sample practice set" }) : null, el("p", { class: "muted lede", text: GUEST ? "Try 5 questions on any skill, with the answer and a full explanation after each one." : "Pick skills, how many questions, and the difficulty." })));
    const grid = (sec) => {
      const g = el("div", { class: "skills" });
      DOMAINS.filter((d) => d.sec === sec).forEach((d) => {
        const m = mastery(d.id), [c, l] = status(m), id = "sk-" + d.id;
        const cb = el("input", { type: "checkbox", id, checked: pr.sel.includes(d.id) });
        cb.addEventListener("change", () => { pr.sel = cb.checked ? [...new Set([...pr.sel, d.id])] : pr.sel.filter((x) => x !== d.id); save(); });
        g.append(el("label", { class: "skill", for: id }, cb, el("span", { style: "display:grid;gap:4px" }, el("span", { class: "n" }, d.name, el("span", { class: "chip " + c, text: l })), el("span", { class: "w", text: d.what }))));
      });
      return g;
    };
    const setSel = (ids) => { pr.sel = ids; save(); renderPractice(); };
    p.append(el("div", { class: "row" },
      el("button", { class: "btn small", onclick: () => setSel(top3) }, "Select my 3 Focus skills"),
      el("button", { class: "btn small", onclick: () => setSel(["ii", "cs", "eoi", "sec"]) }, "All Reading & Writing"),
      el("button", { class: "btn small", onclick: () => setSel(["alg", "adv", "psda", "geo"]) }, "All Math"),
      el("button", { class: "btn small ghost", onclick: () => setSel([]) }, "Clear")));
    p.append(el("div", { style: "display:grid;gap:8px" }, el("div", { class: "eyebrow", text: "Reading and Writing" }), grid("rw")));
    p.append(el("div", { style: "display:grid;gap:8px" }, el("div", { class: "eyebrow", text: "Math" }), grid("math")));
    const seg = (label, key, opts) => el("div", { class: "opts-row" }, el("div", { class: "eyebrow", text: label }),
      el("div", { class: "seg", role: "group", "aria-label": label }, opts.map(([v, t]) => el("button", { "aria-pressed": String(pr[key] === v), onclick: () => { pr[key] = v; save(); renderPractice(); } }, t))));
    if (GUEST) {
      const left = Math.max(0, SAMPLE_LIMIT - (S.samples.practice || 0));
      p.append(el("div", { class: "row" },
        el("button", { class: "btn primary", disabled: !pr.sel.length, onclick: () => startPractice(pr.sel, 5, "auto") }, pr.sel.length ? "Start a 5-question sample" : "Pick at least one skill"),
        el("span", { class: "muted", style: "font-size:13px", text: left + " sample set" + (left === 1 ? "" : "s") + " left on this device" })));
      return;
    }
    p.append(el("div", { class: "row", style: "gap:22px;align-items:end" },
      seg("Questions", "count", [[5, "5"], [10, "10"], [20, "20"], [30, "30"]]),
      seg("Difficulty", "diff", [["auto", "Match my level"], ["easier", "Easier"], ["harder", "Harder"]]),
      seg("Pace timer", "timed", [[true, "On"], [false, "Off"]])));
    p.append(el("div", { class: "row" },
      el("button", { class: "btn primary", disabled: !pr.sel.length, onclick: () => startPractice(pr.sel, pr.count, pr.diff) }, pr.sel.length ? "Start " + pr.count + " questions" : "Pick at least one skill")));
  }
  function practiceQuestion(p) {
    const q = P.qs[P.i], d = DOM[q.d];
    if (P.qIdx !== P.i) { P.qIdx = P.i; P.qAt = Date.now(); P.qAway = 0; }
    const card = el("div", { class: "card qcard" });
    card.append(el("div", { class: "q-head" },
      el("div", {}, el("div", { class: "eyebrow", text: (P.notebook ? "Mistake notebook · " : "") + d.name + (q.sk ? " · " + q.sk : "") }), el("strong", { class: "num", text: "Question " + (P.i + 1) + " of " + P.qs.length }),
        el("div", { class: "qprog", "aria-hidden": "true" }, el("i", { style: "width:" + Math.round((100 * (P.i + (P.done ? 1 : 0))) / P.qs.length) + "%" }))),
      P.timed ? el("span", { class: "timer", id: "ptimer", text: "0:00" }) : null));
    card.append(stem(q));
    const submit = () => {
      if (P.done || P.pick == null || P.pick === "") return;
      P.done = true; const ok = isRight(q, P.pick);
      const sec = Math.min(600, Math.max(0, (Date.now() - P.qAt - (P.qAway || 0)) / 1000));
      if (!GUEST) { const qt = (S.qtime || (S.qtime = {}))[q.d] || (S.qtime[q.d] = [0, 0]); qt[0]++; qt[1] += sec; }
      P.results.push({ q, ok, pick: P.pick, sec }); record(q, ok);
      if (ok) addXP(10, "correct"); bumpStreak(); save(); renderHeader(); renderPractice();
    };
    card.append(answerArea(q, {
      picked: P.pick, reveal: P.done, strikes: P.strikes,
      onPick: (v) => { if (P.done) return; P.pick = v; if (q.type !== "spr") renderPractice(); else { const b = $("#checkBtn"); if (b) b.disabled = !v; } },
      onStrike: (k) => { P.strikes.has(k) ? P.strikes.delete(k) : P.strikes.add(k); renderPractice(); },
      onEnter: submit
    }));
    if (!P.done) {
      card.append(el("div", { class: "row qactions" }, el("button", { class: "btn primary", id: "checkBtn", disabled: P.pick == null || P.pick === "", onclick: submit }, "Check answer"),
        el("button", { class: "btn ghost", onclick: () => { P.pick = null; P.done = true; P.results.push({ q, ok: false, pick: null, skipped: true }); record(q, false); save(); renderPractice(); } }, "Skip")));
    } else {
      card.append(explainBox(q, P.pick));
      card.append(el("div", { class: "row qactions" }, el("button", { class: "btn primary", id: "nextBtn", onclick: nextPractice }, P.i + 1 < P.qs.length ? "Next question" : "See results")));
    }
    card.append(el("div", { class: "row" }, el("button", { class: "btn small ghost", onclick: () => { if (P.results.length) finishPractice(); else { P = null; clearInterval(pTick); renderPractice(); } } }, "End set")));
    p.append(card);
    tickPractice();
    const nb = $("#nextBtn"); if (nb) nb.focus();
  }
  function nextPractice() { P.i++; P.pick = null; P.done = false; P.strikes = new Set(); if (P.i >= P.qs.length) finishPractice(); else { renderPractice(); window.scrollTo({ top: 0 }); } }
  function finishPractice() {
    P.finished = true; P.elapsed = (Date.now() - P.start) / 1000; clearInterval(pTick);
    const n = P.results.length, c = P.results.filter((r) => r.ok).length;
    if (n >= 5) {
      addXP(20, "set complete"); award("first"); bumpStreak();
      if (c === n && n >= 10) { award("clean"); const ds = [...new Set(P.results.map((r) => r.q.d))]; if (ds.every((x) => x === "sec")) award("comma"); if (ds.every((x) => DOM[x].sec === "math")) award("math"); }
      if (DOMAINS.every((d) => S.stats[d.id] && S.stats[d.id].att > 0)) award("cover");
    }
    planEvent({ k: "practice", res: P.results, notebook: P.notebook, focus: P.focus, timed: P.timed });
    save(); render();
  }
  // "· 1:20 per question (test pace 1:35)" for a finished set.
  function paceText(res) {
    const r = res.filter((x) => x.sec != null && !x.skipped); if (r.length < 3) return "";
    const avg = r.reduce((a, x) => a + x.sec, 0) / r.length, tgt = r.reduce((a, x) => a + DOM[x.q.d].pace, 0) / r.length;
    return " · " + mmss(avg) + " per question (test pace " + mmss(tgt) + ")";
  }
  function practiceSummary() {
    const n = P.results.length, c = P.results.filter((r) => r.ok).length, miss = n - c;
    const byDom = {}; P.results.forEach((r) => { const b = byDom[r.q.d] || (byDom[r.q.d] = [0, 0]); b[1]++; if (r.ok) b[0]++; });
    return el("div", { class: "card", style: "display:grid;gap:14px" },
      el("div", { class: "eyebrow", text: "Set result" }),
      el("div", { class: "row", style: "gap:24px;align-items:end" }, el("span", { class: "result-big num", text: c + "/" + n }), el("span", { class: "muted", text: "Time " + mmss(P.elapsed) + paceText(P.results) })),
      el("div", { class: "row" }, Object.entries(byDom).map(([d, [cc, tt]]) => el("span", { class: "chip " + status(cc / tt)[0], text: DOM[d].name + ": " + cc + "/" + tt }))),
      el("p", { text: miss === 0 ? withName("Perfect set") + ". Try Harder difficulty next." : (c / n >= 0.8 ? withName("Nice work") + ". " : (who() ? who() + ", " : "")) + miss + (miss === 1 ? " miss went" : " misses went") + " to the Mistake notebook. Retry " + (miss === 1 ? "it" : "them") + " tomorrow." }),
      takeaways(P.results),
      el("div", { class: "row" },
        el("button", { class: "btn primary", onclick: () => (P.notebook ? startPractice([], 0, "auto", true) : startPractice(P.doms, P.count, P.diff)) }, "Another set"),
        el("button", { class: "btn", onclick: () => { P = null; renderPractice(); } }, "Change skills")));
  }

  /* ================= Mock test ================= */
  let mTick = null;
  function buildModule(kind, sec, route, used) {
    const qs = [];
    if (sec === "rw") {
      for (const [d, n] of RW_MIX) { const lvs = RW_LV[route].slice(0, n).sort(); lvs.forEach((lv) => qs.push(nextQuestion(d, lv, used, 0))); }
    } else {
      const doms = rng.shuffle(Object.entries(MATH_MIXES[kind] || MATH_MIXES.psat).flatMap(([d, n]) => Array(n).fill(d)));
      const lvs = MATH_LV[kind][route];
      doms.forEach((d, i) => qs.push(nextQuestion(d, lvs[i], used, 0)));
      const sprIdx = rng.shuffle(qs.map((q, i) => (q.spr != null ? i : -1)).filter((i) => i >= 0)).slice(0, 5);
      sprIdx.forEach((i) => (qs[i].type = "spr"));
    }
    return { sec, route, qs, ans: qs.map(() => null), flag: qs.map(() => false), strikes: qs.map(() => []), deadline: null, left: MOD[sec].min * 60 };
  }
  const SAMPLE_MOCK = { rw: { n: 10, min: 12 }, math: { n: 10, min: 16 } };
  function startMock(kind, parts, timed, sample) {
    if (GUEST) {
      if ((S.samples.mock || 0) >= SAMPLE_LIMIT) { renderMock(); return; }
      S.samples.mock = (S.samples.mock || 0) + 1; sample = true; parts = parts.slice(0, 1); timed = true;
    }
    const used = new Set();
    const M = { id: uid(), kind, parts, timed, pi: 0, mi: 0, modules: [], phase: "module", cur: 0, started: Date.now(), used: [], sample: !!sample };
    const m = buildModule(kind, parts[0], "std", used);
    if (sample) {
      const cfg = SAMPLE_MOCK[parts[0]], keep = new Set(rng.shuffle(m.qs.map((_, i) => i)).slice(0, cfg.n));
      const idx = m.qs.map((_, i) => i).filter((i) => keep.has(i));
      m.qs = idx.map((i) => m.qs[i]); m.ans = m.qs.map(() => null); m.flag = m.qs.map(() => false); m.strikes = m.qs.map(() => []);
      m.deadline = Date.now() + cfg.min * 60000;
    } else if (timed) m.deadline = Date.now() + MOD[parts[0]].min * 60000;
    M.modules.push(m); M.used = [...used];
    S.mock = M; save(); renderMock();
  }
  const curMod = () => S.mock.modules[S.mock.modules.length - 1];
  function submitModule() {
    const M = S.mock, m = curMod();
    m.submitted = true;
    if (M.sample) { finishMock(); return; }
    if (M.mi === 0) {
      const acc = m.qs.filter((q, i) => isRight(q, m.ans[i])).length / m.qs.length;
      const route = acc >= 0.6 ? "hard" : "easy";
      if (route === "hard") award("hardroute");
      const used = new Set(M.used);
      const m2 = buildModule(M.kind, m.sec, route, used); M.used = [...used];
      if (M.timed) m2.deadline = Date.now() + MOD[m.sec].min * 60000;
      M.modules.push(m2); M.mi = 1; M.cur = 0; M.phase = "module";
      toast("Module 1 submitted. Module 2 starts now.");
    } else if (M.pi + 1 < M.parts.length) {
      M.pi++; M.mi = 0; M.cur = 0; M.phase = "break"; M.breakEnd = Date.now() + 10 * 60000;
    } else { finishMock(); return; }
    save(); renderMock(); window.scrollTo({ top: 0 });
  }
  function startNextPart() {
    const M = S.mock, used = new Set(M.used), sec = M.parts[M.pi];
    const m = buildModule(M.kind, sec, "std", used); M.used = [...used];
    if (M.timed) m.deadline = Date.now() + MOD[sec].min * 60000;
    M.modules.push(m); M.phase = "module"; M.cur = 0; save(); renderMock();
  }
  function estimate(kind, correct, total, route) {
    const f = correct / total;
    const [lo, hi] = kind === "psat" ? (route === "hard" ? [250, 760] : [160, 620]) : route === "hard" ? [280, 800] : [200, 660];
    return Math.round((lo + f * (hi - lo)) / 10) * 10;
  }
  function finishMock() {
    const M = S.mock; clearInterval(mTick);
    if (M.sample) {
      const res = { kind: M.kind, parts: {}, dom: {}, date: today(), sample: true };
      const m = M.modules[0]; let c = 0;
      m.qs.forEach((q, i) => { const ok = isRight(q, m.ans[i]); if (ok) c++; const dd = res.dom[q.d] || (res.dom[q.d] = { c: 0, t: 0 }); dd.t++; if (ok) dd.c++; });
      res.parts[m.sec] = { c, t: m.qs.length };
      M.phase = "done"; M.result = res; M.showResults = true; delete M.used; S.lastMock = M; S.mock = null;
      save(); reviewFilter = "all"; renderMock(); return;
    }
    const res = { kind: M.kind, parts: {}, dom: {}, date: today() };
    for (const sec of M.parts) {
      const mods = M.modules.filter((m) => m.sec === sec);
      let c = 0, t = 0;
      mods.forEach((m) => m.qs.forEach((q, i) => {
        const ok = isRight(q, m.ans[i]); t++; if (ok) c++;
        const dd = res.dom[q.d] || (res.dom[q.d] = { c: 0, t: 0 }); dd.t++; if (ok) dd.c++;
        record(q, ok, true);
      }));
      const route = mods[1] ? mods[1].route : "easy";
      res.parts[sec] = { c, t, route, score: estimate(M.kind, c, t, route) };
    }
    const rec = { id: M.id, source: "app", kind: M.kind, name: FORMATS[M.kind].name + " mock" + (M.parts.length === 1 ? " (" + MOD[M.parts[0]].name + ")" : ""), date: today(), dom: res.dom };
    if (res.parts.rw) rec.rw = res.parts.rw.score;
    if (res.parts.math) rec.math = res.parts.math.score;
    if (rec.rw && rec.math) rec.total = rec.rw + rec.math;
    S.tests.push(rec);
    M.phase = "done"; M.result = res; M.showResults = true; delete M.used; S.lastMock = M; S.mock = null;
    logMock(M.parts.length); checkGoalScore(rec.total);
    addXP(M.parts.length === 2 ? 200 : 100, withName("mock test finished", " · great job, ")); award("mock1"); if (M.parts.length === 2) award("mockfull"); bumpStreak();
    planEvent({ k: "mock", parts: M.parts });
    save(); reviewFilter = "all"; renderMock();
  }
  function tickMock() {
    const M = S.mock; if (!M) { clearInterval(mTick); return; }
    if (M.phase === "break") {
      const left = (M.breakEnd - Date.now()) / 1000, e = $("#breakT");
      if (e) e.textContent = mmss(left);
      if (left <= 0) startNextPart();
      return;
    }
    const m = curMod(); if (!m.deadline) return;
    const left = (m.deadline - Date.now()) / 1000, e = $("#mtimer");
    if (e) { e.textContent = M.hideTimer ? "Timer hidden" : mmss(left); e.classList.toggle("low", left < 300); }
    if (left <= 0) { toast("Time's up. Module submitted."); submitModule(); }
  }
  let reviewFilter = "all", tool = null;
  function renderMock() {
    setTimeout(setInq, 0);
    renderHeader();
    const p = $("#p-mock"); p.textContent = "";
    clearInterval(mTick);
    const M = S.mock;
    if (M && M.phase !== "done") { mTick = setInterval(tickMock, 1000); if (M.phase === "break") return mockBreak(p); if (M.phase === "check") return mockCheck(p); return mockQuestion(p); }
    if (S.lastMock && S.lastMock.showResults) { mockResults(p); return; }
    mockSetup(p);
  }
  function guestMockSetup(p) {
    if ((S.samples.mock || 0) >= SAMPLE_LIMIT) return guestGate(p, "sample mock tests");
    const left = SAMPLE_LIMIT - (S.samples.mock || 0), pick = { kind: "psat" };
    p.append(el("div", {}, el("h2", { text: "Sample mock test" }), el("p", { class: "muted lede", text: "A short, timed taste of the real digital format: 10 questions, answers revealed at the end, with a full explanation for each. Accounts get complete two-module adaptive mocks." })));
    const kindSeg = el("div", { class: "seg", role: "group", "aria-label": "Test format" });
    const paint = () => { kindSeg.textContent = ""; [["psat", "PSAT/NMSQT"], ["sat", "SAT"]].forEach(([v, t]) => kindSeg.append(el("button", { "aria-pressed": String(pick.kind === v), onclick: () => { pick.kind = v; paint(); } }, t))); };
    paint();
    p.append(el("div", { class: "opts-row" }, el("div", { class: "eyebrow", text: "Format" }), kindSeg));
    const card = (title, desc, sec) => el("button", { class: "mode", onclick: () => startMock(pick.kind, [sec], true, true) }, el("b", { text: title }), el("span", { text: desc }));
    p.append(el("div", { class: "mode-cards" },
      card("Reading and Writing sample", "10 questions in 12 minutes.", "rw"),
      card("Math sample", "10 questions in 16 minutes, including graphs and typed-in answers.", "math")));
    p.append(el("p", { class: "muted", style: "font-size:13px", text: left + " sample mock" + (left === 1 ? "" : "s") + " left on this device." }));
    if (S.lastMock && S.lastMock.result) p.append(el("div", { class: "row" }, el("button", { class: "btn", onclick: () => { S.lastMock.showResults = true; renderMock(); } }, "Review your last sample")));
  }
  // Top strategies for a pre-test warm-up: from the focus set (test reviews + misses here), then most-missed.
  function topCards(n) {
    const ids = [];
    const add = (id) => { if (id && id !== "general" && STRAT.cards[id] && !ids.includes(id)) ids.push(id); };
    focusWeights().forEach((x) => add(STRAT.strategyFor(x.type.startsWith("bank:") ? { sk: x.type.slice(5) } : { gen: x.type.slice(4) })));
    Object.entries(S.strat).filter(([, v]) => v.miss > 0).sort((a, b) => b[1].miss - a[1].miss).forEach(([id]) => add(id));
    return ids.slice(0, n);
  }
  let WU = null; // pending mock start, shown after the warm-up screen
  function mockWarmup(p) {
    const w = WU, ids = topCards(5), go = () => { WU = null; startMock(w.kind, w.parts, w.timed); };
    if (!ids.length) { go(); return; }
    p.append(el("div", {}, el("div", { class: "eyebrow", text: "2-minute warm-up" }), el("h2", { text: "Five rules to have in your head" }),
      el("p", { class: "muted lede", text: "Say each one out loud. During the test there are no hints, just like the real thing. This is the same routine to use on test morning." })));
    p.append(el("div", { class: "warm-list" }, ids.map((id, k) => { const c = STRAT.cards[id]; return el("div", { class: "card warm" },
      el("div", { class: "eyebrow", text: (k + 1) + " · " + c.area }), el("h3", { text: c.name }), el("p", { class: "tip-say", text: c.say || c.rule }), el("p", { class: "muted", style: "font-size:14px" }, el("b", { text: "Trap: " }), c.trap)); })));
    p.append(el("div", { class: "row" }, el("button", { class: "btn primary", id: "wuGo", onclick: go }, "I'm ready. Start the test"), el("button", { class: "btn ghost", onclick: () => { WU = null; renderMock(); } }, "Back")));
    window.scrollTo({ top: 0 });
  }
  function mockSetup(p) {
    if (GUEST) return guestMockSetup(p);
    if (WU) return mockWarmup(p);
    const fmt = S.settings.kind;
    p.append(el("div", {}, el("h2", { text: "Mock test" }), el("p", { class: "muted lede", text: "Timed, two modules per section, and Module 2 adapts like the real test. Answers come at the end." })));
    const pick = { kind: fmt, timed: true };
    const kindSeg = el("div", { class: "seg", role: "group", "aria-label": "Test format" });
    const timeSeg = el("div", { class: "seg", role: "group", "aria-label": "Timing" });
    const paint = () => {
      kindSeg.textContent = ""; timeSeg.textContent = "";
      [["psat", "PSAT/NMSQT"], ["sat", "SAT"]].forEach(([v, t]) => kindSeg.append(el("button", { "aria-pressed": String(pick.kind === v), onclick: () => { pick.kind = v; paint(); } }, t)));
      [[true, "Timed (real test)"], [false, "Untimed"]].forEach(([v, t]) => timeSeg.append(el("button", { "aria-pressed": String(pick.timed === v), onclick: () => { pick.timed = v; paint(); } }, t)));
    };
    paint();
    p.append(el("div", { class: "row", style: "gap:22px" }, el("div", { class: "opts-row" }, el("div", { class: "eyebrow", text: "Format" }), kindSeg), el("div", { class: "opts-row" }, el("div", { class: "eyebrow", text: "Timing" }), timeSeg)));
    const card = (title, desc, parts) => el("button", { class: "mode", onclick: () => { WU = { kind: pick.kind, parts, timed: pick.timed }; renderMock(); } }, el("b", { text: title }), el("span", { text: desc }));
    p.append(el("div", { class: "mode-cards" },
      card("Full test", "Reading and Writing (2 × 32 min), a 10-minute break, then Math (2 × 35 min). About 2 hours 25 minutes.", ["rw", "math"]),
      card("Reading and Writing only", "54 questions in two 32-minute modules. Good for a weeknight.", ["rw"]),
      card("Math only", "44 questions in two 35-minute modules, including typed-in answers.", ["math"])));
    p.append(el("div", { class: "card" }, el("h3", { text: "Good to know" }),
      el("ul", { style: "margin:10px 0 0;padding-left:20px;display:grid;gap:6px" },
        el("li", { text: "Scores here are estimates. College Board's exact scoring isn't public, so treat them as a trend line and trust Bluebook for the official picture." }),
        el("li", { text: "The built-in calculator is basic. Bluebook has Desmos, so practice with Desmos too (there's a link in the test toolbar)." }),
        el("li", { text: "Leaving the page is fine: the test and timer pick up where you left off." }))));
    if (S.lastMock && S.lastMock.result) p.append(el("div", { class: "row" }, el("button", { class: "btn", onclick: () => { S.lastMock.showResults = true; renderMock(); } }, "Review the last mock test")));
    p.append(officialCard());
    p.append(howTestCard());
  }
  function mockToolbar(M, m) {
    const secName = MOD[m.sec].name, mn = M.mi + 1;
    return el("div", { class: "testbar" },
      el("div", {}, el("div", { class: "eyebrow", text: FORMATS[M.kind].name + " mock" }), el("strong", { text: M.sample ? "Sample mock: " + secName : "Section " + (M.pi + 1) + ", Module " + mn + ": " + secName })),
      m.deadline ? el("button", { class: "btn small ghost", onclick: () => { M.hideTimer = !M.hideTimer; save(); tickMock(); }, "aria-label": "Show or hide timer" }, el("span", { class: "t num", id: "mtimer", text: "" })) : el("span", { class: "muted", text: "Untimed" }),
      el("div", { class: "row", style: "gap:6px" },
        m.sec === "math" ? el("button", { class: "btn small", onclick: () => openTool("calc") }, "Calculator") : null,
        m.sec === "math" ? el("a", { class: "btn small", href: "https://www.desmos.com/calculator", target: "_blank", rel: "noopener" }, "Desmos ↗") : null,
        m.sec === "math" ? el("button", { class: "btn small", onclick: () => openTool("ref") }, "Reference") : null));
  }
  function mockQuestion(p) {
    const M = S.mock, m = curMod(), i = M.cur, q = m.qs[i];
    p.append(mockToolbar(M, m));
    const strikes = new Set(m.strikes[i]);
    const head = el("div", { class: "row between" }, el("div", { class: "row", style: "gap:10px" }, el("span", { class: "qnum", text: String(i + 1) }),
      el("button", { class: "flagbtn", "aria-pressed": String(m.flag[i]), onclick: () => { m.flag[i] = !m.flag[i]; save(); renderMock(); } }, m.flag[i] ? "Flagged for review" : "Mark for review")),
      el("span", { class: "muted", style: "font-size:13px", text: DOM[q.d].name }));
    const ans = answerArea(q, {
      picked: m.ans[i], reveal: false, strikes,
      onPick: (v) => { m.ans[i] = v === "" ? null : v; save(); if (q.type !== "spr") renderMock(); },
      onStrike: (k) => { const s = new Set(m.strikes[i]); s.has(k) ? s.delete(k) : s.add(k); m.strikes[i] = [...s]; save(); renderMock(); }
    });
    const hasLeft = !!(q.p || q.table || q.chart || q.fig);
    const split = el("div", { class: "split" + (hasLeft ? "" : " single") });
    if (hasLeft) split.append(el("div", { style: "display:grid;gap:12px" }, stem(q, "passage")));
    split.append(el("div", { style: "display:grid;gap:16px" }, head, stem(q, "prompt"), ans));
    p.append(el("div", { class: "card qcard" }, split,
      el("div", { class: "bottombar" },
        el("button", { class: "btn small ghost", onclick: () => { M.showNav = !M.showNav; save(); renderMock(); } }, "Question " + (i + 1) + " of " + m.qs.length + (M.showNav ? " ▴" : " ▾")),
        el("div", { class: "row", style: "gap:8px" },
          el("button", { class: "btn", disabled: i === 0, onclick: () => { M.cur--; save(); renderMock(); } }, "Back"),
          el("button", { class: "btn primary", onclick: () => { if (i + 1 < m.qs.length) M.cur++; else M.phase = "check"; save(); renderMock(); window.scrollTo({ top: 0 }); } }, i + 1 < m.qs.length ? "Next" : "Review module"))),
      M.showNav ? navGrid(m, i) : null));
    tickMock();
  }
  function navGrid(m, cur) {
    const M = S.mock;
    return el("div", { class: "navgrid", style: "margin-top:14px" }, m.qs.map((q, k) => {
      const a = m.ans[k] != null && m.ans[k] !== "";
      return el("button", { class: (a ? "ans" : "") + (k === cur ? " cur" : "") + (m.flag[k] ? " flag" : ""), "aria-label": "Question " + (k + 1) + (a ? ", answered" : ", unanswered") + (m.flag[k] ? ", flagged" : ""), onclick: () => { M.cur = k; M.phase = "module"; M.showNav = false; save(); renderMock(); } }, String(k + 1));
    }));
  }
  function mockCheck(p) {
    const M = S.mock, m = curMod();
    p.append(mockToolbar(M, m));
    const unans = m.ans.filter((a) => a == null || a === "").length, flagged = m.flag.filter(Boolean).length;
    p.append(el("div", { class: "card", style: "display:grid;gap:16px" },
      el("h2", { text: "Check your work" }),
      el("p", { class: "muted", text: (unans ? unans + " unanswered" : "Every question answered") + (flagged ? " · " + flagged + " flagged for review" : "") + ". Pick a question to go back, or submit the module when you're ready." + (unans ? " Guess on the blanks first: wrong answers cost nothing." : "") }),
      navGrid(m, -1),
      el("div", { class: "row" }, el("button", { class: "btn", onclick: () => { M.phase = "module"; M.cur = m.qs.length - 1; save(); renderMock(); } }, "Back to questions"),
        el("button", { class: "btn primary", onclick: submitModule }, M.sample ? "Submit and see results" : M.mi === 0 ? "Submit Module 1" : "Submit Module 2"))));
    tickMock();
  }
  function mockBreak(p) {
    p.append(el("div", { class: "card mission", style: "text-align:center;justify-items:center" },
      el("div", { class: "eyebrow", text: "Scheduled break" }), el("span", { class: "result-big num", id: "breakT", text: mmss((S.mock.breakEnd - Date.now()) / 1000) }),
      el("p", { class: "muted", text: "Stand up, drink some water, and rest your eyes. Math starts automatically when the break ends." }),
      el("button", { class: "btn primary", onclick: startNextPart }, "Start Math now")));
  }
  function mockResults(p) {
    const M = S.lastMock, R = M.result, fmt = FORMATS[M.kind];
    const rw = R.parts.rw, ma = R.parts.math;
    p.append(el("div", { class: "row between" }, el("div", {}, el("div", { class: "eyebrow", text: "Mock test results · " + fmtDay(R.date).md }), el("h2", { text: possessive() + fmt.name + " mock" })), el("button", { class: "btn", onclick: () => { M.showResults = false; save(); renderMock(); } }, "New mock test")));
    const tiles = el("div", { class: "tiles" });
    if (R.sample) {
      const x = rw || ma;
      tiles.append(tile("Sample result", x.c + "/" + x.t, "questions correct"));
      p.append(tiles);
      if (GUEST) p.append(el("div", { class: "card mission" }, el("h3", { text: "Want the full-length version?" }),
        el("p", { text: "With a free account you get complete adaptive mock tests (both modules, real timing, an estimated score), unlimited practice, and a study plan for your test date." }),
        el("div", { class: "row" }, el("button", { class: "btn primary", onclick: () => acct("up") }, "Create a student account"), el("button", { class: "btn", onclick: () => acct("in") }, "Sign in"))));
    }
    if (rw && ma) tiles.append(tile("Estimated total", rw.score + ma.score, "of " + fmt.hi * 2));
    if (rw && !R.sample) tiles.append(tile("Reading and Writing", rw.score, rw.c + "/" + rw.t + " correct · " + (rw.route === "hard" ? "harder" : "easier") + " Module 2"));
    if (ma && !R.sample) tiles.append(tile("Math", ma.score, ma.c + "/" + ma.t + " correct · " + (ma.route === "hard" ? "harder" : "easier") + " Module 2"));
    if (!R.sample) p.append(tiles);
    if (!R.sample) p.append(el("p", { class: "muted", style: "font-size:13px", text: "Estimated scores based on questions correct and which Module 2 you reached. Use them to track the trend." }));
    const tb = el("tbody");
    DOMAINS.filter((d) => R.dom[d.id]).forEach((d) => { const x = R.dom[d.id], a = x.c / x.t, [c, l] = status(a); tb.append(el("tr", {}, el("td", { text: d.name }), el("td", { class: "num", text: x.c + "/" + x.t }), el("td", {}, mbar(a, c)), el("td", {}, el("span", { class: "chip " + c, text: l })))); });
    p.append(el("div", { class: "card", style: "padding:6px 8px" }, el("div", { class: "tablewrap" }, el("table", { class: "mx" }, el("thead", {}, el("tr", {}, ["Skill", "Correct", "Accuracy", "Status"].map((h) => el("th", { text: h })))), tb))));
    const items = [];
    M.modules.forEach((m, mi) => m.qs.forEach((q, i) => items.push({ q, a: m.ans[i], flag: m.flag[i], label: MOD[m.sec].name + " · Module " + ((mi % 2) + 1) + " · Q" + (i + 1) })));
    const tk = takeaways(items.map((x) => ({ q: x.q, ok: isRight(x.q, x.a) })), "3 things to remember from this test");
    if (tk) p.append(tk);
    const shown = items.filter((x) => reviewFilter === "all" || (reviewFilter === "wrong" ? !isRight(x.q, x.a) : x.flag));
    const fseg = el("div", { class: "seg" }, [["all", "All"], ["wrong", "Incorrect (" + items.filter((x) => !isRight(x.q, x.a)).length + ")"], ["flag", "Flagged"]].map(([v, t]) => el("button", { "aria-pressed": String(reviewFilter === v), onclick: () => { reviewFilter = v; renderMock(); } }, t)));
    const list = el("div", { style: "display:grid;gap:10px" }, shown.map((x) => {
      const ok = isRight(x.q, x.a);
      return el("details", { class: "card", style: "padding:14px 16px" },
        el("summary", { style: "cursor:pointer;display:flex;gap:10px;align-items:center;flex-wrap:wrap" }, el("span", { class: "chip " + (ok ? "good" : "bad"), text: ok ? "Correct" : x.a == null || x.a === "" ? "Blank" : "Missed" }), el("span", { style: "font-weight:600", text: x.label }), el("span", { class: "muted", style: "font-size:13px", text: DOM[x.q.d].name + (x.q.sk ? " · " + x.q.sk : "") })),
        el("div", { class: "qcard", style: "margin-top:14px" }, stem(x.q), answerArea(x.q, { picked: x.a, reveal: true }), explainBox(x.q, x.a)));
    }));
    p.append(el("div", { style: "display:grid;gap:12px" }, el("div", { class: "row between" }, el("h3", { text: "Review questions" }), fseg), shown.length ? list : el("p", { class: "muted", text: "Nothing here." })));
  }
  function tile(k, v, s, cls) { return el("div", { class: "tile" }, el("span", { class: "eyebrow", text: k }), el("strong", { class: "num delta " + (cls || ""), text: String(v) }), el("span", { class: "muted", style: "font-size:13px", text: s })); }
  function mbar(a, c) { return el("div", { class: "mbar" }, el("div", { class: "track" }, el("i", { class: c, style: "width:" + (a == null ? 0 : Math.round(a * 100)) + "%" })), el("span", { class: "num", style: "font-size:13px", text: pct(a) })); }

  /* ---------- Tools: calculator and reference sheet ---------- */
  function openTool(which) { tool = tool === which ? null : which; paintTool(); }
  function paintTool() {
    const host = $("#pop"); host.textContent = "";
    if (!tool) return;
    const close = el("button", { class: "btn small ghost", onclick: () => { tool = null; paintTool(); } }, "Close");
    if (tool === "calc") {
      const out = el("div", { class: "calc-out num", text: "0" });
      const inp = el("input", { class: "calc-in", id: "calcIn", type: "text", placeholder: "e.g. (3+4)^2/7 or sqrt(50)", autocomplete: "off", "aria-label": "Calculator expression" });
      const run = () => { try { const v = calc(inp.value); out.textContent = Number.isFinite(v) ? String(Math.round(v * 1e10) / 1e10) : "Error"; } catch (e) { out.textContent = "Check the expression"; } };
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter") run(); });
      const key = (t, ins, cls) => el("button", { class: cls || "", onclick: () => { if (t === "=") return run(); if (t === "C") { inp.value = ""; out.textContent = "0"; return; } if (t === "⌫") { inp.value = inp.value.slice(0, -1); return; } inp.value += ins ?? t; inp.focus(); } }, t);
      const keys = el("div", { class: "keys" }, ["7", "8", "9", "÷", "C", "4", "5", "6", "×", "⌫", "1", "2", "3", "−", "(", "0", ".", "^", "+", ")", "√", "π", "x²", "±", "="].map((t) => {
        const map = { "÷": "/", "×": "*", "−": "-", "√": "sqrt(", "π": "pi", "x²": "^2", "±": "-" };
        return key(t, map[t], /[÷×−+^=C⌫]/.test(t) ? "op" : "");
      }));
      host.append(el("div", { class: "panelpop toolpop", role: "dialog", "aria-label": "Calculator" }, el("header", {}, el("strong", { text: "Calculator" }), close), out, inp, keys, el("small", { class: "muted", text: "For graphing, use Desmos (opens in a new tab)." })));
      inp.focus();
    } else {
      const rows = [["Circle", "A = πr²,  C = 2πr"], ["Rectangle", "A = ℓw"], ["Triangle", "A = ½bh"], ["Pythagorean theorem", "c² = a² + b²"], ["Special right triangles", "30°-60°-90°: x, x√3, 2x  ·  45°-45°-90°: s, s, s√2"], ["Rectangular prism", "V = ℓwh"], ["Cylinder", "V = πr²h"], ["Sphere", "V = (4/3)πr³"], ["Cone", "V = (1/3)πr²h"], ["Pyramid", "V = (1/3)ℓwh"], ["Circle facts", "360° in a circle = 2π radians"], ["Triangle angles", "Sum of angles = 180°"]];
      host.append(el("div", { class: "panelpop toolpop", role: "dialog", "aria-label": "Reference sheet" }, el("header", {}, el("strong", { text: "Reference sheet" }), close), el("div", { class: "ref" }, rows.map(([a, b]) => el("div", {}, el("b", { text: a }), el("span", { class: "num", text: b }))))));
    }
  }
  function calc(expr) {
    let s = String(expr).replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/π/g, "pi").replace(/√/g, "sqrt").toLowerCase();
    if (!/^(\s|\d|\.|\+|-|\*|\/|\^|\(|\)|sqrt|pi)*$/.test(s) || !s.trim()) throw new Error("bad");
    s = s.replace(/\^/g, "**").replace(/(\d|\))\s*(\(|pi|sqrt)/g, "$1*$2").replace(/pi/g, "Math.PI").replace(/sqrt/g, "Math.sqrt");
    return Function('"use strict";return (' + s + ")")();
  }

  /* ================= Skill matrix ================= */
  function renderMatrix() {
    const p = $("#p-matrix"); p.textContent = "";
    p.append(el("div", {}, el("h2", { text: "Progress" }), el("p", { class: "muted lede", text: "Your scores and how strong each skill is, weakest first." })));
    const tiles = el("div", { class: "tiles" });
    const scored = S.tests.filter((t) => t.total || t.rw || t.math);
    const last = scored[scored.length - 1], first = scored[0];
    if (last) {
      if (last.total) tiles.append(tile("Latest total", last.total, (isEst(last) ? "estimated · " : "") + last.name));
      if (last.rw) tiles.append(tile("Reading and Writing", last.rw, srcLabel(last)));
      if (last.math) tiles.append(tile("Math", last.math, srcLabel(last)));
      const withTot = scored.filter((t) => t.total);
      if (withTot.length > 1) { const dl = withTot[withTot.length - 1].total - withTot[0].total; tiles.append(tile("Change since first test", (dl >= 0 ? "+" : "") + dl, "points", dl >= 0 ? "up" : "down")); }
    } else tiles.append(el("div", { class: "tile", style: "grid-column:1/-1" }, el("strong", { text: "No test yet" }), el("span", { class: "muted", text: "Log a Bluebook or Khan Academy test, or take a mock test here, to fill in scores." })));
    const ans = DOMAINS.reduce((s, d) => s + (S.stats[d.id]?.att || 0), 0), cor = DOMAINS.reduce((s, d) => s + (S.stats[d.id]?.cor || 0), 0);
    tiles.append(tile("Practice accuracy", ans ? pct(cor / ans) : "—", ans + " answered"));
    if (S.settings.target) { const lt = latestTotal(); const gap = lt ? S.settings.target - lt.total : null; tiles.append(tile("Target score", S.settings.target, lt ? (gap > 0 ? gap + " points to go" : "reached") : "take a test to compare", lt && gap <= 0 ? "up" : "")); }
    p.append(tiles);
    // Eight skills as compact bars, weakest first; tap one for the numbers behind it.
    const ranked = DOMAINS.map((d) => ({ d, m: mastery(d.id) })).sort((a, b) => (a.m == null) - (b.m == null) || (a.m ?? 1) - (b.m ?? 1));
    const sk = el("div", { class: "card sklist" }, el("h3", { text: "Skills" }));
    ranked.forEach(({ d, m }) => {
      const [c, l] = status(m), r = S.stats[d.id], td = latestTestDom(d.id);
      sk.append(el("details", { class: "skrow" },
        el("summary", {}, el("span", { class: "sk-name" }, d.name, el("small", { text: d.sec === "rw" ? "Reading and Writing" : "Math" })), el("span", { class: "sk-bar" }, el("div", { class: "track" }, el("i", { class: c, style: "width:" + (m == null ? 0 : Math.round(m * 100)) + "%" }))), el("span", { class: "chip " + c, text: m == null ? l : pct(m) })),
        el("div", { class: "sk-more" },
          el("p", { class: "muted", text: d.what }),
          el("div", { class: "sk-nums" },
            el("span", {}, el("b", { text: "≈" + d.n }), " questions on the test"),
            el("span", {}, el("b", { text: td ? pct(td.c / td.t) : "—" }), " latest test" + (td ? " (" + td.c + "/" + td.t + ")" : "")),
            el("span", {}, el("b", { text: r ? pct(r.cor / r.att) : "—" }), " practice" + (r ? " (" + r.cor + "/" + r.att + ")" : ""))),
          m != null && m < 0.8 ? el("button", { class: "btn small", onclick: () => { S.prefs.sel = [d.id]; save(); show("practice"); startPractice([d.id], 10, "auto"); } }, "Practice 10 " + d.name + " questions") : null)));
    });
    sk.append(el("details", { class: "fold", style: "margin-top:10px" }, el("summary", { class: "muted", style: "font-size:13px;font-weight:650", text: "How is this calculated?" }),
      el("p", { class: "muted", style: "font-size:13px;margin-top:6px", text: "Mastery blends your most recent test (Bluebook, Khan Academy or a mock here) with practice accuracy; practice counts fully once a skill has about 30 answers. Strong is 80% or better, Building is 60–79%, Focus is below 60%." })));
    p.append(sk);
    const subs = Object.entries(S.sub).filter(([, v]) => v.att >= 3).map(([k, v]) => ({ k: k.split("|")[0], d: k.split("|")[1], a: v.cor / v.att, n: v.att })).sort((x, y) => x.a - y.a).slice(0, 12);
    if (subs.length) p.append(el("div", { class: "card", style: "display:grid;gap:12px" }, el("h3", { text: "Question types to watch" }), el("p", { class: "muted", style: "font-size:13px", text: "The narrower question types you miss most (at least 3 attempts each)." }),
      el("div", { class: "subs" }, subs.map((s) => el("div", { class: "sub" }, el("span", {}, el("strong", { text: s.k }), el("span", { class: "muted", text: " · " + DOM[s.d].name.split(" ")[0] })), el("span", { class: "chip " + status(s.a)[0], text: pct(s.a) + " of " + s.n }))))));
    if (S.tests.length) {
      const h = el("div", { class: "card", style: "display:grid;gap:10px" }, el("h3", { text: "Test history" }));
      S.tests.slice().reverse().forEach((x) => h.append(el("div", { class: "row between", style: "border-bottom:1px solid var(--line);padding-bottom:8px" },
        el("span", {}, el("strong", { text: x.name }), el("span", { class: "muted", text: " · " + fmtDay(x.date).md + (isEst(x) ? " · estimated" : "") })),
        el("span", { class: "num", text: [x.rw ? "RW " + x.rw : "", x.math ? "Math " + x.math : "", x.total ? "Total " + x.total : ""].filter(Boolean).join(" · ") }),
        el("button", { class: "btn small ghost", onclick: () => { S.tests = S.tests.filter((y) => y.id !== x.id); save(); render(); toast("Removed " + x.name); } }, "Remove"))));
      p.append(h);
    }
  }

  /* ================= Log a practice test (Bluebook, Khan Academy, other) ================= */
  const LINKS = { mypractice: "https://mypractice.collegeboard.org/", bluebook: "https://satsuite.collegeboard.org/practice/practice-tests/bluebook", khan: "https://www.khanacademy.org/digital-sat", khanPsat: "https://www.khanacademy.org/test-prep/dpsat-practice-test-01-22" };
  let LOGSRC = "bluebook";
  function howSteps(src) {
    const link = (href, text) => el("a", { href, target: "_blank", rel: "noopener" }, text);
    return {
      bluebook: [
        ["Finish and submit the test in Bluebook", "Stay online for a minute afterward so the results upload."],
        ["Open My Practice", el("span", {}, "Go to ", link(LINKS.mypractice, "mypractice.collegeboard.org"), " (or use the score link Bluebook shows after you submit). Sign in with the same College Board account you use in Bluebook, then open the test.")],
        ["Enter the two section scores", "Your score report shows a Reading and Writing score and a Math score. Type them into the Log a test form."],
        ["Count your misses by skill area", "Open the question review and look at the questions you got wrong. Each one is labeled with its content domain (Information and Ideas, Craft and Structure, Algebra, and so on). Count the misses in each domain and enter them in the form. It takes about 5 minutes."],
        ["Then learn from them", "Read the explanation for every miss in My Practice. Back here, your Focus list and weekly goals update to target the weakest areas."]
      ],
      khan: [
        ["Take a Khan Academy practice test or section", el("span", {}, "Start from ", link(LINKS.khanPsat, "Khan Academy's digital PSAT practice test"), " or the ", link(LINKS.khan, "digital SAT course"), ". Time yourself: 32 minutes per Reading and Writing module, 35 per Math module.")],
        ["Note your number right", "When you finish, the results page shows how many questions you got right out of the total. Enter them in the Log a test form for each section you took."],
        ["Tag your misses (optional, but worth it)", "For each question you missed, note which skill it tested and add it to the matching skill area in the form. Khan Academy labels its questions by skill."],
        ["About the score", "Khan Academy practice doesn't give an official College Board score, so this app shows an estimate from your number right. Use Bluebook tests for your most accurate score."]
      ],
      other: [
        ["Enter the number right for each section", "Any full-length or section practice test works, such as a paper test or a prep book. Enter how many you got right out of the total."],
        ["Add misses by skill if the test labels them", "That way your Progress page can use it too."]
      ]
    }[src];
  }
  // Numbered "how to log it" steps, shown in the Log tab, on plan tasks, and on the Today card.
  function stepsEl(src) { return el("ol", { class: "howto" }, howSteps(src).map(([h, b]) => el("li", {}, el("strong", { text: h }), el("div", { class: "muted", style: "font-size:14px;margin-top:2px" }, b)))); }
  function howBox(src, label) {
    return el("details", { class: "howinline" }, el("summary", { text: label || (src === "khan" ? "How to log a Khan Academy test" : "How to log a Bluebook test") }), stepsEl(src),
      el("button", { class: "btn small primary", type: "button", onclick: () => { LOGSRC = src; show("log"); } }, "Open Log a test"));
  }

  /* ================= Test review =================
     After an official practice test, the parent's review of every miss (sorted into knew it / new type /
     repeat gap / hit or miss) shows up here. The student says what really happened on each one, plus when
     focus slipped. Answers live in S.treview[id] = { r: { [q]: { c, note, at } }, focus: [...], note, done }.
     "Never learned it" and "forgot how" raise that question type in the focus set (focusWeights). */
  const TR_CAT = { knew: ["Knew it", "You got this type right elsewhere"], new: ["New type", "Not on Test 1, or only an easy version"], repeat: ["Repeat gap", "Missed on both tests"], mixed: ["Hit or miss", "Right about half the time"] };
  const TR_WHY = [["careless", "Careless slip"], ["time", "Rushed or ran out of time"], ["focus", "Lost focus"], ["guess", "Guessed"], ["forgot", "Learned it, forgot how"], ["new", "Never learned it"]];
  const TR_MODS = [["rw1", "Reading & Writing, Module 1"], ["rw2", "Reading & Writing, Module 2"], ["m1", "Math, Module 1"], ["m2", "Math, Module 2"]];
  let TR_FILTER = "all", TR_EDIT = false;
  function trState(id) { const all = S.treview || (S.treview = {}); return all[id] || (all[id] = { r: {}, focus: [], note: "" }); }
  function renderTReview() {
    const p = $("#p-treview"); p.textContent = "";
    if (!REVIEWS.length) {
      p.append(el("div", { class: "card" }, el("h2", { text: "Test review" }), el("p", { class: "muted", style: "margin-top:.4em", text: "After you take a Bluebook practice test, a review of every question you missed shows up here. You'll go through each one and say what really happened." })));
      return;
    }
    const rv = REVIEWS[REVIEWS.length - 1], st = trState(rv.id), items = rv.items || [];
    if (st.done && !TR_EDIT) { trFixList(p, rv, st); return; }
    const answered = items.filter((it) => st.r[it.q] && st.r[it.q].c).length;
    const sm = rv.summary || {};
    p.append(el("div", { class: "card tr-head" },
      el("div", { class: "eyebrow", text: "Test review" }),
      el("h2", { text: rv.title }),
      el("p", { class: "muted", text: sm.line || "" }),
      el("div", { class: "tr-prog" }, el("div", { class: "tr-bar" }, el("i", { style: "width:" + Math.round((answered / Math.max(1, items.length)) * 100) + "%" })), el("span", { text: answered + " of " + items.length + " reviewed" })),
      el("p", { class: "tr-how", text: "Step 1: for each miss, read what we think happened, then tap what really happened and add a sentence if you want. Step 2: submit. Then you get a fix-it list with a lesson and practice for every miss, sorted by your answers." })));
    // the four groups
    const counts = {}; items.forEach((it) => (counts[it.cat] = (counts[it.cat] || 0) + 1));
    p.append(el("div", { class: "tr-tiles" }, Object.entries(TR_CAT).filter(([k]) => counts[k]).map(([k, [name, desc]]) =>
      el("button", { class: "tr-tile c-" + k + (TR_FILTER === k ? " on" : ""), "aria-pressed": String(TR_FILTER === k), onclick: () => { TR_FILTER = TR_FILTER === k ? "all" : k; renderTReview(); } },
        el("b", { text: String(counts[k]) }), el("span", { class: "n", text: name }), el("span", { class: "d", text: desc })))));
    // where the misses fell, question by question
    if (sm.len) p.append(el("div", { class: "card tr-strips" }, el("h3", { text: "Where the misses fell" }),
      TR_MODS.filter(([m]) => sm.len[m]).map(([m, name]) => el("div", { class: "tr-strip" }, el("span", { class: "l", text: name.replace("Reading & Writing", "R&W") }),
        el("span", { class: "sq", style: "grid-template-columns:repeat(" + sm.len[m] + ",minmax(0,1fr))" }, Array.from({ length: sm.len[m] }, (_, i) => { const it = items.find((x) => x.mod === m && x.n === i + 1); return el("i", { class: it ? "x c-" + it.cat : "", title: "Question " + (i + 1) + (it ? ": " + it.type : "") }); })),
        el("span", { class: "v", text: items.filter((x) => x.mod === m).length + " missed" }))),
      sm.finding ? el("p", { class: "tr-find", text: sm.finding }) : null));
    if (TR_FILTER !== "all") p.append(el("div", { class: "row", style: "align-items:center;gap:10px" }, el("span", { class: "muted", text: "Showing: " + TR_CAT[TR_FILTER][0] }), el("button", { class: "btn small ghost", onclick: () => { TR_FILTER = "all"; renderTReview(); } }, "Show all")));
    // each miss, grouped by module
    TR_MODS.forEach(([m, name]) => {
      const list = items.filter((it) => it.mod === m && (TR_FILTER === "all" || it.cat === TR_FILTER)); if (!list.length) return;
      p.append(el("h3", { class: "tr-mod", text: name }));
      list.forEach((it) => p.append(trItem(rv, st, it)));
    });
    // overall reflection
    const fx = el("div", { class: "card tr-wrap" }, el("h3", { text: "Last two questions" }),
      el("p", { text: "When did you lose focus? Tap every part where it happened." }),
      el("div", { class: "tr-why" }, [...TR_MODS, ["none", "I didn't lose focus"]].map(([k, name]) => el("button", { class: "chipbtn" + (st.focus.includes(k) ? " on" : ""), "aria-pressed": String(st.focus.includes(k)), onclick: () => {
        if (k === "none") st.focus = st.focus.includes("none") ? [] : ["none"]; else { st.focus = st.focus.filter((x) => x !== "none"); st.focus = st.focus.includes(k) ? st.focus.filter((x) => x !== k) : [...st.focus, k]; }
        save(); renderTReview(); } }, name))),
      el("label", { class: "tr-lbl", for: "trNote" }, "What made it hard to focus, and what would help on test day?"),
      (() => { const ta = el("textarea", { id: "trNote", rows: "3", placeholder: "For example: I got tired after the break, or I spent too long on one question" }); ta.value = st.note || ""; ta.addEventListener("input", () => { st.note = ta.value; save(); }); return ta; })());
    p.append(fx);
    const complete = answered === items.length && st.focus.length > 0;
    p.append(el("div", { class: "card tr-done" + (st.done ? " ok" : "") },
      st.done ? el("p", { text: "Your review is submitted. Change any answer above, then go back to your fix-it list." }) :
        el("p", { text: complete ? "All done. Submit to get your fix-it list." : "Answer all " + items.length + " misses and the focus question, then submit." }),
      st.done ? el("button", { class: "btn primary", onclick: () => { TR_EDIT = false; save(); renderTReview(); window.scrollTo({ top: 0 }); } }, "Back to my fix-it list")
        : el("button", { class: "btn primary", disabled: !complete, onclick: () => { st.done = today(); TR_EDIT = false; addXP(25, "test review"); planEvent({ k: "treview" }); save(); toast("Review submitted. Here's your fix-it list."); renderTReview(); window.scrollTo({ top: 0 }); } }, "Submit my review")));
  }
  function trItem(rv, st, it) {
    const a = st.r[it.q] || {};
    const card = el("div", { class: "card tr-item c-" + it.cat + (a.c ? " answered" : "") },
      el("div", { class: "tr-top" }, el("span", { class: "tr-q", text: it.q }), el("span", { class: "tr-cat c-" + it.cat, text: TR_CAT[it.cat][0] })),
      el("div", { class: "tr-type", text: it.type }),
      it.ask ? el("p", { class: "tr-qtext" }, el("b", { text: "The question: " }), it.ask) : null,
      rv.link ? el("a", { class: "tr-open", href: rv.link, target: "_blank", rel: "noopener" }, "See the full question: My Practice → " + (rv.linkName || "Score Details") + " → " + it.q.replace(/^(R&W|Math) M(\d) Q(\d+)$/, (m, sec, mod, n) => (sec === "Math" ? "Math" : "Reading and Writing") + ", module " + mod + ", question " + n) + " ↗") : null,
      el("div", { class: "tr-ans" }, el("span", { text: "You: " }), el("b", { class: "bad", text: it.his }), el("span", { text: "  ·  Correct: " }), el("b", { class: "good", text: it.cor })),
      el("p", { class: "tr-what" }, el("b", { text: "What we think happened: " }), it.what),
      el("p", { class: "tr-ask", text: "What really happened?" }),
      el("div", { class: "tr-why" }, TR_WHY.map(([k, name]) => el("button", { class: "chipbtn" + (a.c === k ? " on" : ""), "aria-pressed": String(a.c === k), onclick: () => { st.r[it.q] = Object.assign({}, st.r[it.q], { c: k, at: today() }); save(); const nc = trItem(rv, st, it); card.replaceWith(nc); refreshTRProg(rv, st); } }, name))));
    const ta = el("textarea", { rows: "2", "aria-label": "Your explanation for " + it.q, placeholder: "Your explanation (optional)" }); ta.value = a.note || "";
    ta.addEventListener("input", () => { st.r[it.q] = Object.assign({}, st.r[it.q], { note: ta.value }); save(); });
    card.append(ta);
    return card;
  }
  /* After the review is submitted: a fix-it list of every miss, ordered by what the student said happened.
     Each row has a lesson (a Lab mission, or the tip card for that type) and a 5-question practice set.
     Opening either marks the row started: S.treview[id].fix[q] = date. */
  const TR_GROUPS = [
    ["learn", "Learn first", "You said you never learned these or forgot how. Do the lesson, then the 5 practice questions."],
    ["practice", "Practice until it sticks", "Gaps and guesses. Practice each one, and do the lesson if the practice goes badly."],
    ["quick", "Quick fixes", "You know these. You said they were slips, rushing or lost focus. One quick practice set each, and slow down on these in the real test."]];
  function trGroup(a) { const c = a && a.c; return c === "new" || c === "forgot" ? "learn" : c === "careless" || c === "time" || c === "focus" ? "quick" : "practice"; }
  function trLearn(it, st) {
    const mark = () => { st.fix = st.fix || {}; if (!st.fix[it.q]) { st.fix[it.q] = today(); save(); } };
    if (it.lab) return el("a", { class: "btn small primary", href: it.lab, onclick: mark }, "Learn: " + (it.labText || "Lab"));
    const sid = it.ty ? STRAT.strategyFor(it.ty.startsWith("bank:") ? { sk: it.ty.slice(5) } : { gen: it.ty.slice(4) }) : null, sc = sid && sid !== "general" && STRAT.cards[sid];
    return sc ? el("button", { class: "btn small primary", type: "button", onclick: () => { mark(); RV = { queue: [sid], i: 0, flipped: false, back: "treview" }; show("review"); window.scrollTo({ top: 0 }); } }, "Learn: " + sc.name + " (tip card)") : null;
  }
  // Today card: the latest test review, until it's submitted and every miss on the fix-it list is started.
  function fixCard() {
    if (GUEST || !REVIEWS.length) return null;
    const rv = REVIEWS[REVIEWS.length - 1], st = (S.treview || {})[rv.id] || {}, items = rv.items || [];
    const started = items.filter((it) => (st.fix || {})[it.q]).length;
    if (st.done && started >= items.length) return null;
    return el("div", { class: "card tr-today" },
      el("div", { class: "eyebrow", text: st.done ? "Your fix-it list" : "Test review" }),
      el("h3", { text: st.done ? rv.title + ": " + started + " of " + items.length + " misses started" : "Review your " + rv.title + " misses" }),
      el("p", { class: "muted", style: "font-size:14px", text: st.done ? "Pick up where you left off: a lesson and 5 practice questions for each miss." : "Say what really happened on each miss. Then you get a fix-it list." }),
      el("div", { class: "row" }, el("button", { class: "btn primary", onclick: () => show("treview") }, st.done ? "Open my fix-it list" : "Start the review")));
  }
  function trFixList(p, rv, st) {
    const items = rv.items || [], fix = st.fix || {}, started = items.filter((it) => fix[it.q]).length;
    const WHY = Object.fromEntries(TR_WHY);
    p.append(el("div", { class: "card tr-head" },
      el("div", { class: "eyebrow", text: "Your fix-it list" }),
      el("h2", { text: rv.title + ": " + items.length + " to fix" }),
      el("p", { class: "muted", text: "Sorted by what you told us in your review. Start at the top." }),
      el("div", { class: "tr-prog" }, el("div", { class: "tr-bar" }, el("i", { style: "width:" + Math.round((started / Math.max(1, items.length)) * 100) + "%" })), el("span", { text: started + " of " + items.length + " started" }))));
    TR_GROUPS.forEach(([g, name, desc]) => {
      const list = items.filter((it) => trGroup(st.r[it.q]) === g); if (!list.length) return;
      p.append(el("div", { class: "tr-fixhead" }, el("h3", { text: name + " · " + list.length }), el("p", { class: "muted", text: desc })));
      p.append(el("div", { class: "card tr-fix" }, list.map((it) => {
        const a = st.r[it.q] || {}, done = !!fix[it.q];
        return el("div", { class: "tr-frow" + (done ? " started" : "") },
          el("div", { class: "tr-fmeta" }, el("span", { class: "tr-q", text: (done ? "✓ " : "") + it.q }), el("span", { class: "tr-fty", text: it.type }), el("span", { class: "tr-fsaid", text: "You said: " + (WHY[a.c] || "—").toLowerCase() })),
          el("div", { class: "tr-go" }, trLearn(it, st), it.ty ? el("button", { class: "btn small", type: "button", onclick: () => { st.fix = st.fix || {}; if (!st.fix[it.q]) st.fix[it.q] = today(); save(); startTypePractice(it.ty, 5); } }, "Practice 5") : null));
      })));
    });
    p.append(el("div", { class: "card tr-done ok" }, el("p", { text: "✓ Review submitted " + st.done + ". Your answers also shape your focus set." }),
      el("button", { class: "btn small ghost", onclick: () => { TR_EDIT = true; renderTReview(); window.scrollTo({ top: 0 }); } }, "See or change my answers")));
  }
  function refreshTRProg(rv, st) {
    const items = rv.items || [], answered = items.filter((it) => st.r[it.q] && st.r[it.q].c).length;
    const bar = document.querySelector("#p-treview .tr-bar i"), txt = document.querySelector("#p-treview .tr-prog span");
    if (bar) bar.style.width = Math.round((answered / Math.max(1, items.length)) * 100) + "%"; if (txt) txt.textContent = answered + " of " + items.length + " reviewed";
    const fin = document.querySelector("#p-treview .tr-done button"); if (fin) fin.disabled = !(answered === items.length && st.focus.length > 0);
  }
  // Admin view: what the student said in each review.
  function treviewAdmin(D) {
    const out = [];
    for (const [id, st] of Object.entries(D.treview || {})) {
      const r = Object.values(st.r || {}), cnt = {}; r.forEach((a) => a.c && (cnt[a.c] = (cnt[a.c] || 0) + 1));
      const why = TR_WHY.filter(([k]) => cnt[k]).map(([k, n]) => n.toLowerCase() + " " + cnt[k]).join(", ");
      out.push(el("li", { text: "Test review (" + id + "): " + r.filter((a) => a.c).length + " answered" + (st.done ? ", finished" : "") + (why ? " · " + why : "") + (st.focus && st.focus.length ? " · lost focus: " + st.focus.join(", ") : "") + (st.note ? " · “" + st.note + "”" : "") }));
      const notes = Object.entries(st.r || {}).filter(([, a]) => a.note).map(([q, a]) => q + ": " + a.note);
      if (notes.length) out.push(el("li", { class: "muted", text: "Notes: " + notes.join(" | ") }));
    }
    return out;
  }
  function renderLog() {
    const p = $("#p-log"); p.textContent = "";
    const link = (href, text) => el("a", { href, target: "_blank", rel: "noopener" }, text);
    const n = (src) => S.tests.filter((t) => t.source === src).length + 1;
    p.append(el("div", {}, el("h2", { text: "Log a practice test" }), el("p", { class: "muted lede", text: "Took a Bluebook or Khan Academy test? Enter the results here (worth 100 XP). They update your Progress and focus set." })));
    const seg = el("div", { class: "srcpick", role: "group", "aria-label": "Where you took the test" });
    [["bluebook", "Bluebook (official)"], ["khan", "Khan Academy"], ["other", "Other"]].forEach(([id, lab]) => seg.append(el("button", { type: "button", class: "btn small" + (LOGSRC === id ? " primary" : ""), "aria-pressed": String(LOGSRC === id), onclick: () => { LOGSRC = id; renderLog(); } }, lab)));
    p.append(seg);
    const src = LOGSRC, kind0 = S.settings.kind;
    const how = howSteps(src);
    const ol = stepsEl(src); void how;
    p.append(el("details", { class: "card howcard", open: true }, el("summary", { text: src === "bluebook" ? "Where to find your Bluebook results" : src === "khan" ? "How to log a Khan Academy test" : "How to log another practice test" }), ol));

    const kindSel = el("select", { id: "tKind" }, el("option", { value: "psat", text: "PSAT/NMSQT" }), el("option", { value: "sat", text: "SAT" })); kindSel.value = kind0;
    const secSel = el("select", { id: "tSec" }, el("option", { value: "both", text: "Full test (both sections)" }), el("option", { value: "rw", text: "Reading and Writing only" }), el("option", { value: "math", text: "Math only" }));
    const defName = src === "bluebook" ? "Bluebook Practice Test " + n("bluebook") : src === "khan" ? "Khan Academy practice test " + n("khan") : "Practice test";
    const nameIn = el("input", { type: "text", id: "tName", value: defName, maxlength: "60" });
    const f = el("form", { class: "card form", novalidate: true });
    f.append(el("div", { class: "fields" }, el("label", { class: "f" }, "Test name", nameIn), el("label", { class: "f" }, "Test type", kindSel), el("label", { class: "f" }, "Sections taken", secSel), el("label", { class: "f" }, "Date taken", el("input", { type: "date", id: "tDate", value: today() }))));
    const scoreBox = el("div", {});
    f.append(scoreBox);
    const est = el("p", { class: "muted", style: "font-size:14px" });
    const missBox = el("div", {});
    f.append(missBox);
    function drawScores() {
      scoreBox.textContent = ""; missBox.textContent = "";
      const k = kindSel.value, sec = secSel.value, show = (x) => sec === "both" || sec === x;
      const lo = FORMATS[k].lo, hi = FORMATS[k].hi;
      if (src === "bluebook") {
        scoreBox.append(el("div", { class: "eyebrow", text: "Section scores (" + lo + "–" + hi + " each)" }),
          el("div", { class: "fields" }, show("rw") ? el("label", { class: "f" }, "Reading and Writing score", el("input", { type: "number", id: "tRw", step: "10", min: lo, max: hi, inputmode: "numeric", placeholder: "e.g. 580" })) : null,
            show("math") ? el("label", { class: "f" }, "Math score", el("input", { type: "number", id: "tMath", step: "10", min: lo, max: hi, inputmode: "numeric", placeholder: "e.g. 560" })) : null));
      } else {
        const numIn = (id, ph) => el("input", { type: "number", id, min: "0", inputmode: "numeric", placeholder: ph, oninput: upd });
        scoreBox.append(el("div", { class: "eyebrow", text: "Number right" }),
          el("div", { class: "fields" },
            show("rw") ? el("label", { class: "f" }, "Reading and Writing: right", numIn("tRwC", "e.g. 40")) : null, show("rw") ? el("label", { class: "f" }, "out of", numIn("tRwT", "54")) : null,
            show("math") ? el("label", { class: "f" }, "Math: right", numIn("tMathC", "e.g. 30")) : null, show("math") ? el("label", { class: "f" }, "out of", numIn("tMathT", "44")) : null), est);
        const rwT = scoreBox.querySelector("#tRwT"), mT = scoreBox.querySelector("#tMathT"); if (rwT) rwT.value = 54; if (mT) mT.value = 44;
        upd();
      }
      missBox.append(el("p", { class: "muted", style: "font-size:14px;margin-top:6px", text: "Questions missed in each skill area. Leave a box blank if you didn't count it." }));
      for (const [sc, lab] of [["rw", "Reading and Writing: questions missed"], ["math", "Math: questions missed"]]) {
        if (!show(sc)) continue;
        missBox.append(el("div", { class: "eyebrow", text: lab }));
        missBox.append(el("div", { class: "fields" }, DOMAINS.filter((d) => d.sec === sc).map((d) => el("label", { class: "f" }, d.name, el("small", { text: "out of about " + d.n }), el("input", { type: "number", id: "m-" + d.id, min: "0", max: String(d.n + 4), inputmode: "numeric", placeholder: "—" })))));
      }
    }
    const $v = (id) => { const x = f.querySelector("#" + id); return x && x.value !== "" ? +x.value : null; };
    function scaleFrom(c, t, k) { const lo = FORMATS[k].lo, hi = FORMATS[k].hi; return Math.round((lo + (c / t) * (hi - lo)) / 10) * 10; }
    function upd() {
      const k = kindSel.value, bits = [];
      const rc = $v("tRwC"), rt = $v("tRwT"), mc2 = $v("tMathC"), mt = $v("tMathT");
      if (rc != null && rt > 0 && rc <= rt) bits.push("Reading and Writing ≈ " + scaleFrom(rc, rt, k));
      if (mc2 != null && mt > 0 && mc2 <= mt) bits.push("Math ≈ " + scaleFrom(mc2, mt, k));
      est.textContent = bits.length ? "Estimated score: " + bits.join(" · ") + ". A rough guide only; Bluebook gives the real scale." : "";
    }
    kindSel.addEventListener("change", drawScores); secSel.addEventListener("change", drawScores);
    drawScores();
    const err = el("p", { class: "err", role: "alert" });
    f.append(err, el("div", { class: "row" }, el("button", { class: "btn primary", type: "submit" }, "Save test")));
    f.addEventListener("submit", (e) => {
      e.preventDefault(); err.textContent = "";
      const kind = kindSel.value, sec = secSel.value, lo = FORMATS[kind].lo, hi = FORMATS[kind].hi, want = (x) => sec === "both" || sec === x;
      let rw = null, math = null;
      const raw = {};
      if (src === "bluebook") {
        if (want("rw")) { rw = $v("tRw"); if (!(rw >= lo && rw <= hi)) { err.textContent = "Enter the Reading and Writing score (" + lo + "–" + hi + ")."; return; } rw = Math.round(rw / 10) * 10; }
        if (want("math")) { math = $v("tMath"); if (!(math >= lo && math <= hi)) { err.textContent = "Enter the Math score (" + lo + "–" + hi + ")."; return; } math = Math.round(math / 10) * 10; }
      } else {
        for (const [x, cId, tId, label] of [["rw", "tRwC", "tRwT", "Reading and Writing"], ["math", "tMathC", "tMathT", "Math"]]) {
          if (!want(x)) continue;
          const c = $v(cId), t = $v(tId);
          if (!(t > 0 && c != null && c >= 0 && c <= t)) { err.textContent = "Enter the number right and the total for " + label + "."; return; }
          raw[x] = { c, t };
          if (x === "rw") rw = scaleFrom(c, t, kind); else math = scaleFrom(c, t, kind);
        }
      }
      const dom = {};
      for (const d of DOMAINS) { if (!want(d.sec)) continue; const v = $v("m-" + d.id); if (v == null) continue; if (!(v >= 0)) { err.textContent = "Missed counts must be 0 or more."; return; } dom[d.id] = { c: Math.max(0, d.n - Math.round(v)), t: d.n }; }
      const rec = { id: uid(), source: src, kind, name: nameIn.value.trim() || defName, date: f.querySelector("#tDate").value || today(), rw, math, total: rw != null && math != null ? rw + math : null, dom };
      if (Object.keys(raw).length) rec.raw = raw;
      S.tests.push(rec);
      S.tests.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
      logMock(sec === "both" ? 2 : 1); if (rec.total && src === "bluebook") checkGoalScore(rec.total);
      addXP(100, (src === "bluebook" ? "Bluebook" : src === "khan" ? "Khan Academy" : "Practice") + " test logged"); award("baseline");
      if (S.tests.filter((t) => t.source === "bluebook" && t.total).length >= 2) award("rehearsal");
      bumpStreak(); planEvent({ k: "log", src }); save(); toast("Test saved. Your Progress page is updated.", true); show("matrix");
    });
    p.append(f);
  }

  /* ================= Rewards ================= */
  function renderRewards() {
    const p = $("#p-rewards"); p.textContent = "";
    const l = level(), into = S.xp % XP_PER_LEVEL;
    p.append(el("div", { class: "card lvl" }, el("div", { class: "ring" }, el("div", {}, el("b", { class: "num", text: String(l) }), el("small", { text: "Level" }))),
      el("div", { style: "display:grid;gap:8px" }, el("h2", { text: levelName(l) }), el("div", { class: "track" }, el("i", { style: "width:" + (into / XP_PER_LEVEL) * 100 + "%" })),
        el("span", { class: "num muted", style: "font-size:13px", text: S.xp + " XP total · " + (XP_PER_LEVEL - into) + " XP to " + levelName(l + 1) }),
        el("span", { class: "muted", style: "font-size:13px", text: "Earn XP for correct answers, finished sets, plan tasks and tests." }))));
    // Rewards first (set by the parent in the admin view; students can only claim), then badges, earned first.
    const list = el("div", { class: "rw-list" });
    S.rewards.slice().sort((a, b) => a.xp - b.xp).forEach((r) => {
      const ready = S.xp >= r.xp && !r.claimed;
      list.append(el("div", { class: "rwd" + (ready ? " ready" : "") + (r.claimed ? " claimed" : "") }, el("span", { class: "x", text: r.xp + " XP" }),
        el("span", {}, el("strong", { text: r.label }), el("div", { class: "muted", style: "font-size:12px", text: r.claimed ? "Claimed" : ready ? "Unlocked. Claim it with your parent." : r.xp - S.xp + " XP to go" })),
        el("div", { class: "row acts", style: "gap:6px" }, ready ? el("button", { class: "btn small primary", onclick: () => { r.claimed = true; save(); render(); toast("Enjoy it: " + r.label, true); } }, "Claim") : null)));
    });
    p.append(el("div", { class: "card" }, el("h3", { text: "Rewards" }), el("p", { class: "muted", style: "margin:.3em 0 14px", text: S.rewards.length ? "Real rewards that unlock as you earn XP. Your parent sets them." : "Your parent hasn't set any rewards yet." }), list));
    const earned = BADGES.filter((b) => S.badges[b.id]), locked = BADGES.filter((b) => !S.badges[b.id]);
    const bg = el("div", { class: "badges" });
    [...earned, ...locked].forEach((b) => { const on = !!S.badges[b.id]; bg.append(el("div", { class: "badge" + (on ? " on" : " locked") }, el("div", { class: "seal", text: b.s }), el("b", { text: b.name }), el("span", { text: on ? "Earned " + fmtDay(S.badges[b.id]).md : b.how }))); });
    p.append(el("div", {}, el("div", { class: "row between", style: "margin-bottom:12px" }, el("h3", { text: "Badges" }), el("span", { class: "muted num", text: earned.length + " of " + BADGES.length + " earned" })), bg));
  }

  /* ================= Backup, restore, settings ================= */
  $("#exportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(S, null, 1)], { type: "application/json" });
    const a = el("a", { href: URL.createObjectURL(blob), download: "test-prep-hub-backup-" + today() + ".json" });
    document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast("Backup file saved to Downloads");
  });
  $("#importFile").addEventListener("change", (e) => {
    const file = e.target.files[0]; if (!file) return;
    const fr = new FileReader();
    fr.onload = () => {
      let data; try { data = JSON.parse(fr.result); } catch (x) { toast("That file isn't a Test Prep Hub backup."); return; }
      if (!data || data.v !== 2 || typeof data.xp !== "number") { toast("That file isn't a Test Prep Hub backup."); return; }
      confirmPop("Replace the progress on this device with the backup from " + (data.updatedAt ? new Date(data.updatedAt).toLocaleString() : "the file") + "? (" + data.xp + " XP, " + (data.tests || []).length + " tests)", "Replace my progress", () => { S = Object.assign(blank(), data); save(); render(); toast("Progress restored", true); });
    };
    fr.readAsText(file); e.target.value = "";
  });
  $("#settingsBtn").addEventListener("click", () => {
    const host = $("#pop"); host.textContent = ""; tool = null;
    const nm = el("input", { type: "text", id: "setName", value: S.settings.name || "", maxlength: "30", autocomplete: "off" });
    const f = el("form", { class: "panelpop", role: "dialog", "aria-label": "Settings" }, el("header", {}, el("strong", { text: "Settings" }), el("button", { type: "button", class: "btn small ghost", onclick: () => (host.textContent = "") }, "Close")),
      el("label", { class: "f", for: "setName" }, "Student's first name", nm),
      el("div", { class: "f" }, "Tests and target scores", el("span", { class: "muted", style: "font-size:14px;font-weight:400", text: (S.settings.exams || []).filter((e) => e.date >= today()).map(examLabel).join("; ") || "No upcoming test" }), el("button", { type: "button", class: "btn small", style: "justify-self:start", onclick: () => examsPop() }, "Manage my tests")),
      el("button", { class: "btn primary", type: "submit" }, "Save"));
    f.addEventListener("submit", (e) => { e.preventDefault(); S.settings.name = nm.value.trim(); save(); for (const fn of settingsHooks) { try { fn(S.settings); } catch (x) { } } host.textContent = ""; render(); toast("Settings saved"); });
    host.append(f);
  });
  function confirmPop(msg, yes, fn) {
    const host = $("#pop"); host.textContent = "";
    host.append(el("div", { class: "panelpop", role: "dialog", "aria-label": "Confirm" }, el("strong", { text: "Are you sure?" }), el("p", { text: msg }),
      el("div", { class: "row" }, el("button", { class: "btn primary", onclick: () => { host.textContent = ""; fn(); } }, yes), el("button", { class: "btn ghost", onclick: () => (host.textContent = "") }, "Cancel"))));
  }

  /* ================= "Add to Home Screen" prompt for phones ================= */
  const UA = navigator.userAgent || "";
  const IS_IOS = /iPad|iPhone|iPod/.test(UA) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const IS_ANDROID = /Android/i.test(UA);
  const IOS_OTHER = IS_IOS && /CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(UA); // Chrome, Firefox, Edge, Google app on iPhone
  const INSTALLED = () => (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  const IKEY = "tph-install";
  let deferredInstall = null;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredInstall = e; if (!GUEST) render(); });
  window.addEventListener("appinstalled", () => { deferredInstall = null; try { localStorage.setItem(IKEY, JSON.stringify({ done: true })); } catch (e) { } render(); });
  function installState() { try { return JSON.parse(localStorage.getItem(IKEY) || "{}"); } catch (e) { return {}; } }
  function setInstall(v) { try { localStorage.setItem(IKEY, JSON.stringify(v)); } catch (e) { } render(); }
  const SHARE_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" style="vertical-align:-3px"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 11H6a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  function shareIcon() { const s2 = document.createElement("span"); s2.innerHTML = SHARE_SVG; return s2; }
  function installCard() {
    if (INSTALLED() || !(IS_IOS || IS_ANDROID)) return null;
    const st = installState();
    if (st.done || (st.snooze && Date.now() < st.snooze)) return null;
    const b = (t) => el("strong", { text: t });
    let steps, action = null;
    if (IS_IOS && IOS_OTHER) {
      steps = [el("span", {}, "Open this page in ", b("Safari"), " (copy the address, or tap the browser menu → Open in Safari)."), el("span", {}, "Then follow the steps shown there to add it to your Home Screen.")];
    } else if (IS_IOS) {
      steps = [
        el("span", {}, "Tap the ", b("Share"), " button ", shareIcon(), " in Safari's toolbar. On newer iPhones, tap ", b("⋯"), " first, then ", b("Share"), "."),
        el("span", {}, "Scroll down and tap ", b("Add to Home Screen"), "."),
        el("span", {}, "Tap ", b("Add"), ". Then close Safari and open ", b("Test Prep Hub"), " from its new icon, and sign in once more if asked.")];
    } else {
      if (deferredInstall) action = el("button", { class: "btn primary", onclick: async () => { const e = deferredInstall; deferredInstall = null; try { e.prompt(); const r = await e.userChoice; if (r && r.outcome === "accepted") setInstall({ done: true }); else render(); } catch (x) { render(); } } }, "Install the app");
      steps = [el("span", {}, action ? "Tap Install the app above, then Install." : el("span", {}, "In Chrome, tap the ", b("⋮"), " menu, then ", b("Add to Home screen"), " (or ", b("Install app"), ").")),
        el("span", {}, "Open ", b("Test Prep Hub"), " from its new icon.")];
    }
    return el("div", { class: "card install" },
      el("div", { style: "display:flex;justify-content:space-between;align-items:flex-start;gap:10px" },
        el("div", { style: "min-width:0" }, el("div", { class: "eyebrow", text: IS_IOS ? "iPhone and iPad" : "Android" }), el("h3", { text: "Add Test Prep Hub to your Home Screen" })),
        el("button", { class: "btn small ghost", "aria-label": "Hide for now", onclick: () => setInstall({ snooze: Date.now() + 7 * 864e5 }) }, "✕")),
      el("p", { class: "muted", style: "font-size:14px", text: "It opens full screen like an app, keeps you signed in, and" + (IS_IOS ? " is required on iPhone for" : " makes it easy to get") + " daily study reminders. It takes 20 seconds:" }),
      action,
      el("ol", { class: "phsteps" }, steps.map((x) => el("li", {}, x))),
      el("div", { class: "row", style: "gap:8px" },
        el("button", { class: "btn small", onclick: () => setInstall({ done: true }) }, "I've added it"),
        el("button", { class: "btn small ghost", onclick: () => setInstall({ snooze: Date.now() + 7 * 864e5 }) }, "Remind me next week")));
  }

  /* ================= Friends: weekly league, head-to-head challenges, cheers ================= */
  // SOC.api is provided by sync.js after sign-in. The server checks every call (friends only, first names only).
  let SOC = null; // { api, friends, board, challenges, code, err, loading }
  let CH = null;  // active challenge run
  const CHEERS = { fire: ["🔥", "Keep it up!"], clap: ["👏", "Nice work!"], strong: ["💪", "You've got this!"], target: ["🎯", "Challenge me!"] };
  const TOPICS = { math: ["Math", ["alg", "alg", "alg", "adv", "adv", "adv", "psda", "psda", "geo", "geo"]], rw: ["Reading & Writing", ["cs", "cs", "cs", "ii", "ii", "ii", "sec", "sec", "eoi", "eoi"]], mixed: ["Mixed", ["alg", "adv", "psda", "geo", "alg", "cs", "ii", "sec", "eoi", "cs"]] };
  const weekPts = (act, ws) => { let pts = 0, q = 0, c = 0; for (let i = 0; i < 7; i++) { const a = (act || {})[addDays(ws, i)]; if (a) { pts += 10 * (a.c || 0) + 100 * (a.mock || 0); q += a.q || 0; c += a.c || 0; } } return { pts, q, c }; };
  const liveStreak2 = (st) => (st && (st.last === today() || st.last === addDays(today(), -1)) ? st.count || 0 : 0);
  const fmtMs = (ms) => { const sec = Math.round((ms || 0) / 1000); return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0"); };
  function socialBadge() {
    const b = document.querySelector('nav.tabs button[data-tab="matrix"]'); if (!b) return;
    const n = SOC ? (SOC.friends || []).filter((f) => f.status === "incoming").length + (SOC.challenges || []).filter((c) => c.mine_to_play).length : 0;
    const dot = b.querySelector(".dot"); if (dot) { dot.hidden = !n; dot.textContent = n ? String(n) : ""; }
    b.setAttribute("aria-label", n ? "Friends, " + n + " waiting" : "Friends");
  }
  async function socialLoad(full) {
    if (!SOC) return;
    SOC.loading = true; SOC.err = null;
    try {
      const api = SOC.api;
      const [friends, challenges, cheers] = await Promise.all([api.friendsList(), api.challengesList(), api.myCheers()]);
      SOC.friends = friends || []; SOC.challenges = challenges || [];
      (cheers || []).slice(-3).forEach((c) => { const k = CHEERS[c.kind] || ["👋", ""]; toast(c.from_name + " sent you " + k[0] + " " + k[1], true); });
      if (full || TAB === "friends") { SOC.code = SOC.code || (await api.myCode()); SOC.board = (await api.board()) || []; leagueBookkeeping(); duelBookkeeping(); }
    } catch (e) { SOC.err = (e && e.message) || "Couldn't reach the server."; }
    SOC.loading = false; socialBadge();
    if (TAB === "friends" && !CH) renderFriends();
  }
  // Last week's league winner gets a one-time bonus.
  function leagueBookkeeping() {
    const board = SOC.board || []; if (board.length < 2) return;
    const lw = addDays(weekStart(today()), -7); if (S.leagueWins[lw] != null) return;
    const scores = board.map((r) => ({ me: r.is_me, pts: weekPts(r.activity, lw).pts }));
    const top = Math.max(...scores.map((x) => x.pts)), mine = scores.find((x) => x.me);
    if (!mine || top <= 0) return;
    S.leagueWins[lw] = mine.pts === top;
    if (mine.pts === top) { addXP(150, "League champion"); award("champ"); toast("🏆 You won last week's friends league! +150 XP", true); }
    save();
  }
  // Credit a challenge win once, whether you sent it or played it.
  function duelBookkeeping() {
    let changed = false;
    for (const c of SOC.challenges || []) {
      if (!c.played_at || S.duels[c.id]) continue;
      const iAmFrom = !c.mine_to_play && c.from_correct != null && c.to_user && !isToMe(c);
      const r = duelResult(c); S.duels[c.id] = r; changed = true;
      if (r === "win") { addXP(50, "Challenge won"); award("duel"); toast("⚔ You beat " + (isToMe(c) ? c.from_name : c.to_name) + " in a challenge! +50 XP", true); }
      void iAmFrom;
    }
    if (changed) save();
  }
  function isToMe(c) { const me = (SOC.board || []).find((r) => r.is_me); return me ? c.to_user === me.user_id : false; }
  function duelResult(c) {
    const mineC = isToMe(c) ? c.to_correct : c.from_correct, theirC = isToMe(c) ? c.from_correct : c.to_correct;
    const mineT = isToMe(c) ? c.to_ms : c.from_ms, theirT = isToMe(c) ? c.from_ms : c.to_ms;
    if (mineC !== theirC) return mineC > theirC ? "win" : "loss";
    if (Math.abs(mineT - theirT) >= 1000) return mineT < theirT ? "win" : "loss";
    return "tie";
  }
  function renderFriends() {
    const p = $("#p-friends"); p.textContent = "";
    if (CH) return renderChallengeRun(p);
    p.append(el("div", {}, el("h2", { text: "Friends" }), el("p", { class: "muted lede", text: "A weekly league, head-to-head challenges and cheers. Friends see only your first name, points, streak, score and skills." })));
    if (!SOC) { p.append(el("div", { class: "card" }, el("p", { class: "muted", text: "Sign in to use Friends." }))); return; }
    if (!SOC.board && !SOC.loading) { socialLoad(true); }
    if (SOC.err) p.append(el("div", { class: "card" }, el("p", { class: "err", text: SOC.err }), el("button", { class: "btn small", onclick: () => socialLoad(true) }, "Try again")));
    // Your code + add a friend
    const codeIn = el("input", { type: "text", placeholder: "Friend code", maxlength: "12", autocomplete: "off", "aria-label": "Friend's code", style: "text-transform:uppercase" });
    const msg = el("p", { class: "muted", role: "status", style: "font-size:13px" });
    const addBtn = el("button", { class: "btn primary", onclick: async () => {
      const v = codeIn.value.trim(); if (!v) return; addBtn.disabled = true;
      try {
        const r = await SOC.api.addFriend(v);
        const said = { requested: "Request sent. You'll be friends once they accept.", accepted: "You're now friends!", already: "You're already friends.", pending: "Your request is still waiting for them to accept.", self: "That's your own code.", not_found: "No one has that code. Check it and try again." }[r] || r;
        toast(said, r === "accepted" || r === "requested"); codeIn.value = ""; await socialLoad(true);
      } catch (e) { msg.textContent = "Couldn't add: " + (e.message || e); }
      addBtn.disabled = false;
    } }, "Add friend");
    const code = SOC.code;
    p.append(el("div", { class: "card", style: "display:grid;gap:10px" },
      el("div", { class: "row between" }, el("div", {}, el("div", { class: "eyebrow", text: "Your friend code" }), el("strong", { class: "num fcode", text: code || "…" })),
        code ? el("button", { class: "btn small", onclick: () => copyText("Add me on Test Prep Hub! My friend code is " + code + ". Open Me → Friends and enter it.", "Friend code copied") }, "Copy to share") : null),
      el("div", { class: "row", style: "gap:8px;flex-wrap:nowrap" }, codeIn, addBtn), msg));
    // Requests
    const inc = (SOC.friends || []).filter((f) => f.status === "incoming"), out = (SOC.friends || []).filter((f) => f.status === "outgoing");
    if (inc.length || out.length) p.append(el("div", { class: "card", style: "display:grid;gap:8px" }, el("h3", { text: "Friend requests" }),
      inc.map((f) => el("div", { class: "inv-row" }, el("span", {}, el("strong", { text: f.first_name }), " wants to be friends"), el("div", { class: "row", style: "gap:6px" },
        el("button", { class: "btn small primary", onclick: async () => { await SOC.api.respond(f.user_id, true); toast("You and " + f.first_name + " are now friends", true); socialLoad(true); } }, "Accept"),
        el("button", { class: "btn small ghost", onclick: async () => { await SOC.api.respond(f.user_id, false); socialLoad(true); } }, "Decline")))),
      out.map((f) => el("div", { class: "inv-row" }, el("span", { class: "muted" }, "Waiting for ", el("strong", { text: f.first_name }), " to accept"), el("button", { class: "btn small ghost", onclick: async () => { await SOC.api.remove(f.user_id); socialLoad(true); } }, "Cancel")))));
    // Challenges to play / results
    const chs = SOC.challenges || [];
    const toPlay = chs.filter((c) => c.mine_to_play), rest = chs.filter((c) => !c.mine_to_play).slice(0, 8);
    if (toPlay.length) p.append(el("div", { class: "card install", style: "display:grid;gap:8px" }, el("h3", { text: "Your turn" }),
      toPlay.map((c) => el("div", { class: "inv-row" }, el("span", {}, el("strong", { text: c.from_name }), " challenged you: " + c.n + " " + c.topic + " questions"), el("button", { class: "btn small primary", onclick: () => startChallengeRun({ mode: "play", c }) }, "Play now")))));
    // League
    const board = SOC.board || [], ws = weekStart(today());
    const friendsOnly = board.filter((r) => !r.is_me);
    if (board.length) {
      const rows = board.map((r) => Object.assign({ r }, weekPts(r.activity, ws))).sort((a, b) => b.pts - a.pts || b.q - a.q);
      const lw = addDays(ws, -7), lrows = board.map((r) => ({ r, pts: weekPts(r.activity, lw).pts })).sort((a, b) => b.pts - a.pts);
      const champ = lrows.length > 1 && lrows[0].pts > 0 ? lrows[0] : null;
      p.append(el("div", { class: "card", style: "display:grid;gap:10px" },
        el("div", { class: "row between" }, el("h3", { text: "This week's league" }), el("span", { class: "muted", style: "font-size:13px", text: fmtDay(ws).md + " – " + fmtDay(addDays(ws, 6)).md })),
        el("p", { class: "muted", style: "font-size:13px", text: "10 points per correct answer, 100 per mock test section. Resets every Monday; the winner gets +150 XP and the League Champ badge." }),
        el("ol", { class: "league" }, rows.map((x, i) => el("li", { class: x.r.is_me ? "me" : "" },
          el("span", { class: "lg-rank", text: i === 0 && x.pts > 0 ? "🏆" : String(i + 1) }),
          el("span", { class: "lg-name" }, el("strong", { text: x.r.is_me ? "You" : x.r.first_name }), el("small", { class: "muted", text: x.q + " questions" + (x.q ? " · " + Math.round((x.c / x.q) * 100) + "% right" : "") + " · 🔥 " + liveStreak2(x.r.streak) })),
          el("strong", { class: "num lg-pts", text: String(x.pts) })))),
        champ ? el("p", { class: "muted", style: "font-size:13px", text: "Last week's champion: " + (champ.r.is_me ? "you" : champ.r.first_name) + " (" + champ.pts + " points)" }) : null,
        !friendsOnly.length ? el("p", { style: "font-size:14px", text: "Add a friend to start competing." }) : null));
    }
    // Friend cards
    friendsOnly.forEach((r) => {
      const st = r.stats || {}, skills = DOMAINS.map((d) => ({ d, x: st[d.id] })).filter((o) => o.x && o.x.att >= 5).map((o) => ({ n: o.d.name, a: o.x.cor / o.x.att })).sort((a, b) => b.a - a.a);
      const lt = r.latest, left = r.test_date ? Math.round((parseYmd(r.test_date) - parseYmd(today())) / 864e5) : null;
      p.append(el("div", { class: "card friend", style: "display:grid;gap:10px" },
        el("div", { class: "row between" }, el("h3", { text: r.first_name }), el("span", { class: "muted", style: "font-size:13px", text: (FORMATS[r.test_kind] || FORMATS.psat).name + (left != null && left >= 0 ? " in " + left + " days" : "") })),
        el("div", { class: "adm-stats" },
          fstat("Latest score", lt && lt.total ? String(lt.total) : "—", lt && lt.total ? (isEst(lt) ? "estimated" : lt.source === "official" ? "official" : "Bluebook") : "no test yet"),
          fstat("Streak", String(liveStreak2(r.streak)), "days"),
          fstat("Level", String(Math.floor((r.xp || 0) / XP_PER_LEVEL) + 1), (r.xp || 0) + " XP"),
          fstat("Answered", String(r.answered || 0), "questions")),
        skills.length ? el("p", { style: "font-size:14px" }, el("strong", { text: "Strongest: " }), skills[0].n + " " + Math.round(skills[0].a * 100) + "%", skills.length > 1 ? el("span", {}, " · ", el("strong", { text: "Working on: " }), skills[skills.length - 1].n + " " + Math.round(skills[skills.length - 1].a * 100) + "%") : null) : null,
        el("div", { class: "row", style: "gap:6px;flex-wrap:wrap" },
          el("button", { class: "btn primary small", onclick: () => pickTopic(r) }, "⚔ Challenge"),
          Object.entries(CHEERS).map(([k, [e2, label]]) => el("button", { class: "btn small ghost cheer", title: label, "aria-label": "Send " + label, onclick: async (ev) => {
            try { const ok = await SOC.api.cheer(r.user_id, k); toast(ok ? "Sent " + e2 + " to " + r.first_name : "You already sent that one today", ok); ev.target.disabled = true; } catch (x) { toast("Couldn't send: " + (x.message || x)); }
          } }, e2))),
        el("details", { class: "fb-steps" }, el("summary", { text: "More" }), el("button", { class: "btn small ghost", style: "margin-top:8px", onclick: () => confirmPop("Remove " + r.first_name + " from your friends? You'll both disappear from each other's league.", "Remove", async () => { await SOC.api.remove(r.user_id); socialLoad(true); }) }, "Remove friend"))));
    });
    // Challenge history
    if (rest.length) p.append(el("div", { class: "card", style: "display:grid;gap:8px" }, el("h3", { text: "Challenges" }),
      rest.map((c) => {
        const mineFrom = !isToMe(c), other = mineFrom ? c.to_name : c.from_name;
        let status;
        if (!c.played_at) status = new Date(c.expires_at) < new Date() ? ["none", "Expired"] : ["warn", "Waiting for " + other];
        else { const r2 = duelResult(c), mc2 = mineFrom ? c.from_correct : c.to_correct, tc = mineFrom ? c.to_correct : c.from_correct; status = [r2 === "win" ? "good" : r2 === "loss" ? "bad" : "none", (r2 === "win" ? "Won " : r2 === "loss" ? "Lost " : "Tied ") + mc2 + "–" + tc]; }
        return el("div", { class: "inv-row" }, el("span", {}, (mineFrom ? "You vs " : "") + (mineFrom ? "" : other + " vs you"), mineFrom ? el("strong", { text: other }) : null, el("small", { class: "muted", text: " · " + c.topic + " · " + fmtDay(c.created_at.slice(0, 10)).md })), el("span", { class: "chip " + status[0], text: status[1] }));
      })));
    function fstat(h, v, sub) { return el("div", { class: "adm-stat" }, el("span", { class: "eyebrow", text: h }), el("strong", { class: "num", text: v }), el("span", { class: "muted", style: "font-size:12px", text: sub })); }
  }
  function copyText(msg, ok) {
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(msg).then(() => toast(ok, true), () => prompt("Copy this:", msg)); return; } } catch (e) { }
    prompt("Copy this:", msg);
  }
  function pickTopic(friend) {
    const host = $("#pop"); host.textContent = ""; tool = null;
    host.append(el("div", { class: "panelpop", role: "dialog", "aria-label": "New challenge" },
      el("header", {}, el("strong", { text: "Challenge " + friend.first_name }), el("button", { class: "btn small ghost", onclick: () => (host.textContent = "") }, "Close")),
      el("p", { class: "muted", style: "font-size:14px", text: "You answer 10 questions first; " + friend.first_name + " then gets the exact same 10. Most correct wins; if it's a tie, the faster time wins." }),
      Object.entries(TOPICS).map(([k, [label]]) => el("button", { class: "btn", onclick: () => { host.textContent = ""; startChallengeRun({ mode: "create", friend, topic: k }); } }, label))));
  }
  function startChallengeRun(o) {
    let qs;
    if (o.mode === "create") {
      const used = new Set(); qs = [];
      for (const d of rng.shuffle(TOPICS[o.topic][1])) { const q = nextQuestion(d, 2, used, 0); used.add(q.key); q.type = "mc"; qs.push(q); }
    } else qs = (o.c.questions || []).map((q) => Object.assign({}, q, { uid: uid(), type: "mc" }));
    CH = { mode: o.mode, friend: o.friend, c: o.c, topic: o.mode === "create" ? TOPICS[o.topic][0] : o.c.topic, qs, i: 0, picks: [], t0: Date.now(), done: false };
    show("friends"); window.scrollTo({ top: 0 });
  }
  function renderChallengeRun(p) {
    const vs = CH.mode === "create" ? CH.friend.first_name : CH.c.from_name;
    if (!CH.done) {
      const q = CH.qs[CH.i];
      const card = el("div", { class: "card", style: "display:grid;gap:14px" },
        el("div", { class: "row between" }, el("div", {}, el("div", { class: "eyebrow", text: "⚔ Challenge vs " + vs + " · " + CH.topic }), el("strong", { class: "num", text: "Question " + (CH.i + 1) + " of " + CH.qs.length })),
          el("button", { class: "btn small ghost", onclick: () => confirmPop("Quit this challenge? " + (CH.mode === "create" ? "Nothing will be sent." : "You can play it later."), "Quit", () => { CH = null; renderFriends(); setInq(); }) }, "Quit")),
        stem(q),
        answerArea(q, { picked: CH.picks[CH.i], onPick: (k) => { CH.picks[CH.i] = k; renderFriends(); } }),
        el("div", { class: "row" }, el("button", { class: "btn primary", disabled: CH.picks[CH.i] == null, onclick: () => { if (CH.i + 1 < CH.qs.length) { CH.i++; renderFriends(); window.scrollTo({ top: 0 }); } else finishChallengeRun(); } }, CH.i + 1 < CH.qs.length ? "Next" : "Finish")));
      p.append(card); setInq(); return;
    }
    const R2 = CH.result;
    p.append(el("div", { class: "card mission", style: "display:grid;gap:10px" },
      el("div", { class: "eyebrow", text: "⚔ Challenge vs " + vs }),
      el("h2", { text: R2.headline }),
      el("p", { class: "lede", text: R2.detail }),
      el("div", { class: "row" }, el("button", { class: "btn primary", onclick: () => { CH = null; socialLoad(true); renderFriends(); setInq(); } }, "Back to Friends"))));
    const misses = CH.qs.map((q, k) => ({ q, k })).filter((x) => !isRight(x.q, CH.picks[x.k]));
    if (misses.length) p.append(el("div", {}, el("h3", { text: "Review your misses" }), misses.map((x) => el("div", { class: "card", style: "display:grid;gap:10px;margin-top:12px" }, stem(x.q), answerArea(x.q, { picked: CH.picks[x.k], reveal: true, onPick: () => { } }), explainBox(x.q, CH.picks[x.k])))));
    setInq();
  }
  async function finishChallengeRun() {
    const ms = Date.now() - CH.t0;
    let correct = 0;
    CH.qs.forEach((q, k) => { const ok = isRight(q, CH.picks[k]); if (ok) correct++; record(q, ok); });
    addXP(10 * correct + 20, "challenge"); bumpStreak(); save();
    CH.done = true; CH.result = { headline: "Sending…", detail: "" }; renderFriends();
    const slim = (q) => ({ key: q.key, d: q.d, sk: q.sk, gen: q.gen, p: q.p, q: q.q, o: q.o, a: q.a, e: q.e, t: q.t, table: q.table, chart: q.chart, fig: q.fig, efig: q.efig, steps: q.steps, id: q.id, src: q.src });
    try {
      if (CH.mode === "create") {
        await SOC.api.createChallenge(CH.friend.user_id, CH.topic, CH.qs.map(slim), correct, ms);
        CH.result = { headline: correct + " of " + CH.qs.length + " in " + fmtMs(ms), detail: "Challenge sent to " + CH.friend.first_name + ". They'll get the same questions; you'll see who won on the Friends tab." };
      } else {
        await SOC.api.submitChallenge(CH.c.id, correct, ms);
        const c = Object.assign({}, CH.c, { played_at: new Date().toISOString(), to_correct: correct, to_ms: ms });
        const list = await SOC.api.challengesList(); const fresh = (list || []).find((x) => x.id === CH.c.id) || c;
        const r = duelResult(fresh); S.duels[CH.c.id] = r;
        if (r === "win") { addXP(50, "Challenge won"); award("duel"); }
        save();
        CH.result = { headline: r === "win" ? "You won! +50 XP" : r === "loss" ? CH.c.from_name + " won this one" : "It's a tie!", detail: "You: " + correct + "/" + CH.qs.length + " in " + fmtMs(ms) + " · " + CH.c.from_name + ": " + fresh.from_correct + "/" + CH.qs.length + " in " + fmtMs(fresh.from_ms) + "." };
      }
    } catch (e) { CH.result = { headline: correct + " of " + CH.qs.length, detail: "Couldn't reach the server: " + (e.message || e) + ". Your practice still counts." }; }
    renderFriends();
  }

  /* ================= Admin: read-only dashboard of every student ================= */
  // ADMIN is set by sync.js only when the server confirms this account is the site admin.
  // The data comes from a server function that refuses any other account.
  let ADMIN = null; // { load, rows, at, err, open }
  const agoDays = (ymdStr) => (ymdStr ? Math.round((parseYmd(today()) - parseYmd(ymdStr)) / 864e5) : null);
  const agoText = (n) => (n == null ? "never" : n <= 0 ? "today" : n === 1 ? "yesterday" : n + " days ago");
  function studentSummary(row) {
    const D = Object.assign(blank(), row.data || {}), st = D.settings || {};
    const name = (row.first_name || st.name || "").trim() || (row.email || "Student").split("@")[0];
    const actDays = Object.keys(D.activity || {}).filter((k) => (D.activity[k].q || D.activity[k].mock)).sort();
    const lastAct = actDays[actDays.length - 1] || (D.updatedAt ? ymd(new Date(D.updatedAt)) : null);
    const wk = { q: 0, c: 0, mock: 0, days: 0 };
    for (let i = 0; i < 7; i++) { const a = (D.activity || {})[addDays(today(), -i)]; if (a) { wk.q += a.q || 0; wk.c += a.c || 0; wk.mock += a.mock || 0; if (a.q || a.mock) wk.days++; } }
    const streak = D.streak && (D.streak.last === today() || D.streak.last === addDays(today(), -1)) ? D.streak.count : 0;
    const tests = (D.tests || []).filter((t) => t.total || t.rw || t.math);
    const latest = tests.filter((t) => t.total).pop() || null;
    const testDom = (d) => { for (let i = (D.tests || []).length - 1; i >= 0; i--) { const t = D.tests[i]; if (t.dom && t.dom[d] && t.dom[d].t) return t.dom[d]; } return null; };
    const dom = DOMAINS.map((d) => {
      const r = (D.stats || {})[d.id], pa = r && r.att >= 3 ? r.cor / r.att : null, td = testDom(d.id), ta = td ? td.c / td.t : null;
      const m = blend(ta, pa, r ? r.att : 0);
      return { d, att: r ? r.att : 0, cor: r ? r.cor : 0, pa, ta, m };
    });
    const weakest = dom.filter((x) => x.m != null).sort((a, b) => a.m - b.m).slice(0, 2);
    const kind = st.kind || row.test_kind || "psat", date = st.date || row.test_date;
    const left = date ? Math.round((parseYmd(date) - parseYmd(today())) / 864e5) : null;
    const lvl = Math.floor((D.xp || 0) / XP_PER_LEVEL) + 1;
    wk.f = 0; for (let i = 0; i < 7; i++) { const tm = (D.time || {})[addDays(today(), -i)]; if (tm) wk.f += tm.f || 0; }
    return { row, D, st, name, lastAct, idle: agoDays(lastAct), wk, streak, tests, latest, dom, weakest, kind, date, left, target: st.target || row.target_score, lvl };
  }
  async function adminLoad() {
    if (!ADMIN) return;
    ADMIN.err = null; ADMIN.loading = true; renderAdmin();
    try { ADMIN.rows = await ADMIN.load(); ADMIN.at = new Date(); if (ADMIN.api) ADMIN.invites = await ADMIN.api.listInvites(); } catch (e) { ADMIN.err = (e && e.message) || "Couldn't load students."; }
    ADMIN.loading = false; if (ADMIN) render();
  }
  function renderAdmin() {
    const p = $("#p-admin"); p.textContent = "";
    document.title = "Test Prep Hub · Admin";
    $("#hello").textContent = "Admin dashboard";
    $("#testLabel").textContent = "Read-only view of every student";
    p.append(el("div", { class: "row between" }, el("div", {}, el("h2", { text: "Students" }), el("p", { class: "muted", style: "font-size:14px", text: ADMIN.loading ? "Loading…" : ADMIN.at ? "Updated " + ADMIN.at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) + ". Progress syncs whenever a student uses the app." : "" })),
      el("div", { class: "row" }, el("a", { class: "btn small", href: "fast/" }, "FAST Prep (grade 4) →"), el("button", { class: "btn small", onclick: adminLoad, disabled: !!ADMIN.loading }, "Refresh"))));
    { const ic = installCard(); if (ic) p.append(ic); }
    if (ADMIN.err) { p.append(el("div", { class: "card" }, el("p", { class: "err", text: ADMIN.err }))); return; }
    if (!ADMIN.rows) return;
    if (!ADMIN.rows.length) { p.append(el("div", { class: "card" }, el("h3", { text: "No students yet" }), el("p", { class: "muted", text: "Students appear here after they create an account with the invite code." }))); return; }
    const list = ADMIN.rows.map(studentSummary);
    const grid = el("div", { class: "adm-grid" });
    for (const x of list) {
      const idleCls = x.idle == null || x.idle > 3 ? "bad" : x.idle > 1 ? "warn" : "good";
      const fmt = FORMATS[x.kind] || FORMATS.psat;
      const open = ADMIN.open === x.row.user_id;
      const card = el("div", { class: "card adm-card" + (open ? " open" : "") },
        el("div", { class: "row between" }, el("div", {}, el("h3", { text: x.name }), el("div", { class: "muted", style: "font-size:13px", text: fmt.name + (x.date ? " · " + fmtDay(x.date).md + ", " + parseYmd(x.date).getFullYear() + (x.left != null ? (x.left > 0 ? " · " + x.left + " days away" : x.left === 0 ? " · today" : " · done") : "") : "") + (x.target ? " · target " + x.target : "") })),
          el("span", { class: "chip " + idleCls, text: "Active " + agoText(x.idle) })),
        el("div", { class: "adm-stats" },
          stat("This week", String(x.wk.q), "questions" + (x.wk.q ? " · " + Math.round((x.wk.c / x.wk.q) * 100) + "% right" : "") + " · " + x.wk.days + " day" + (x.wk.days === 1 ? "" : "s") + (x.wk.f >= 60 ? " · " + minText(x.wk.f) + " focused" : "")),
          stat("Streak", String(x.streak), "day" + (x.streak === 1 ? "" : "s") + " · level " + x.lvl),
          stat("Latest score", x.latest ? String(x.latest.total) : "—", x.latest ? (isEst(x.latest) ? "estimated · " : "") + x.latest.name : "no test yet"),
          stat("All time", String(x.D.answered || 0), "answered · " + (x.mistakes = (x.D.mistakes || []).length) + " to redo")),
        x.weakest.length ? el("p", { style: "font-size:14px" }, el("strong", { text: "Weakest: " }), x.weakest.map((w) => w.d.name + " (" + Math.round(w.m * 100) + "%)").join(", ")) : el("p", { class: "muted", style: "font-size:14px", text: "Not enough practice yet to rank skills." }),
        el("p", { class: "muted", style: "font-size:13px" }, (x.row.reminders ? "Reminders on (" + x.row.reminders + " device" + (x.row.reminders === 1 ? "" : "s") + (x.row.remind_hour != null ? ", " + ((x.row.remind_hour % 12) || 12) + (x.row.remind_hour < 12 ? " am" : " pm") : "") + ")" : "Reminders off") + " · " + (x.row.email || "") + (x.row.grade ? " · grade " + x.row.grade : "")),
        el("button", { class: "btn small" + (open ? "" : " primary"), onclick: () => { ADMIN.open = open ? null : x.row.user_id; renderAdmin(); } }, open ? "Hide details" : "See details"),
        open ? adminDetail(x) : null);
      grid.append(card);
    }
    p.append(grid);
    p.append(freshnessCard(list));
    if (ADMIN.api) p.append(invitesCard());
    function stat(h, v, sub) { return el("div", { class: "adm-stat" }, el("span", { class: "eyebrow", text: h }), el("strong", { class: "num", text: v }), el("span", { class: "muted", style: "font-size:12px", text: sub })); }
  }
  // Question freshness across all students: repeat rate, question types running out, reading bank coverage.
  function tplLabel(tpl, names) {
    if (names && names[tpl] && !tpl.startsWith("bank:")) { const d = DOM[tpl.split("_")[0]]; return names[tpl] + (tpl.startsWith("hard_") ? " (harder set)" : d ? " · " + d.name : "") + " · " + tpl; }
    if (tpl.startsWith("bank:")) return "Reading bank · " + (DOM[tpl.slice(5)] || { name: tpl.slice(5) }).name;
    if (tpl.startsWith("rw:")) { const [, d, sk] = tpl.split(":"); return (sk || (DOM[d] || {}).name || d) + " (generated)"; }
    const c = STRAT.cards[STRAT.strategyFor({ gen: tpl })]; const d = DOM[tpl.split("_")[0]];
    return (c ? c.name : tpl) + (d ? " · " + d.name : tpl.startsWith("hard_") ? " · hard set" : "");
  }
  function freshnessCard(list) {
    const now30 = addDays(today(), -30), agg = {}, names = {};
    const per = list.map((x) => {
      const F = x.D.fresh || { t: {}, d: {} };
      let n = 0, r = 0; for (const [k, v] of Object.entries(F.d || {})) if (k >= now30) { n += v[0]; r += v[1]; }
      for (const [tpl, v] of Object.entries(F.t || {})) { const a = agg[tpl] || (agg[tpl] = [0, 0]); a[0] += v[0]; a[1] += v[1]; }
      Object.assign(names, F.s || {});
      return { x, n, r, pct: n ? r / n : 0 };
    });
    const hot = Object.entries(agg).filter(([, v]) => v[0] >= 12 && v[1] / v[0] >= 0.15).map(([tpl, v]) => ({ tpl, n: v[0], pct: v[1] / v[0] })).sort((a, b) => b.pct - a.pct).slice(0, 8);
    const bank = window.RWBank || [], cov = ["cs", "ii", "eoi", "sec"].map((d) => {
      const ids = bank.filter((q) => q.d === d).map((q) => q.id), tot = ids.length;
      const best = Math.max(0, ...list.map((x) => ids.filter((id) => (x.D.seenBank || {})[id]).length));
      return { d, tot, best, pct: tot ? best / tot : 0 };
    });
    const worstRep = Math.max(0, ...per.filter((o) => o.n >= 30).map((o) => o.pct)), worstCov = Math.max(0, ...cov.map((c) => c.pct));
    const level = hot.length || worstRep >= 0.15 || worstCov >= 0.85 ? "bad" : worstRep >= 0.07 || worstCov >= 0.6 ? "warn" : "good";
    const verdict = { good: "Questions are fresh. No action needed.", warn: "Getting familiar. Plan to add new questions in the next few weeks.", bad: "Time to add new questions for the types listed below." }[level];
    const bar = (pct, cls) => el("div", { class: "track", style: "height:7px" }, el("i", { class: cls, style: "width:" + Math.round(pct * 100) + "%" }));
    return el("div", { class: "card", style: "display:grid;gap:12px" },
      el("div", { class: "row between" }, el("h3", { text: "Question freshness" }), el("span", { class: "chip " + level, text: { good: "Fresh", warn: "Watch", bad: "Refresh due" }[level] })),
      el("p", { style: "font-size:14px", text: verdict }),
      el("p", { class: "muted", style: "font-size:13px", text: "A repeat is an exact question a student has already seen (among their last 2,500). Under 7% repeats is fine; over 15%, or a reading bank more than 85% used, means it's time for new questions." }),
      el("div", { class: "eyebrow", text: "Repeats in the last 30 days" }),
      el("div", { class: "adm-skills" }, per.map((o) => el("div", { class: "adm-skill" },
        el("div", { class: "adm-skill-top" }, el("span", { class: "adm-skill-name", text: o.x.name }), el("span", { class: "muted", style: "font-size:13px", text: o.n ? Math.round(o.pct * 100) + "% of " + o.n : "no questions yet" })),
        bar(Math.min(1, o.pct / 0.3), o.pct >= 0.15 ? "bad" : o.pct >= 0.07 ? "warn" : "good")))),
      el("div", { class: "eyebrow", text: "Hand-written reading bank used (most-used student)" }),
      el("div", { class: "adm-skills" }, cov.map((c) => el("div", { class: "adm-skill" },
        el("div", { class: "adm-skill-top" }, el("span", { class: "adm-skill-name", text: DOM[c.d].name }), el("span", { class: "muted", style: "font-size:13px", text: c.best + " of " + c.tot })),
        bar(c.pct, c.pct >= 0.85 ? "bad" : c.pct >= 0.6 ? "warn" : "good")))),
      el("div", { class: "eyebrow", text: "Question types repeating most" }),
      hot.length ? el("ul", { class: "adm-list" }, hot.map((h) => el("li", {}, el("strong", { text: tplLabel(h.tpl, names) }), " · " + Math.round(h.pct * 100) + "% repeats of " + h.n))) : el("p", { class: "muted", style: "font-size:14px", text: "None yet. A type shows up here once it has 12+ questions served and 15%+ repeats." }));
  }
  // Single-use invite codes: create, copy, see who used them, revoke unused ones.
  function invitesCard() {
    const api = ADMIN.api, now = new Date();
    const note = el("input", { type: "text", maxlength: "60", placeholder: "Who is it for? (optional)", "aria-label": "Who the code is for" });
    const out = el("div", {});
    if (ADMIN.newCode) { const code = ADMIN.newCode; out.append(el("div", { class: "inv-new" }, el("span", { class: "eyebrow", text: "New code, works once" }), el("strong", { class: "num", text: code }), el("button", { class: "btn small primary", onclick: () => copyInvite(code) }, "Copy invite message"))); }
    const list = el("div", { class: "inv-list" });
    const stateOf = (c) => (c.used_at ? ["good", "Used by " + (c.used_email || "a student") + " · " + new Date(c.used_at).toLocaleDateString()] : c.revoked ? ["none", "Revoked"] : new Date(c.expires_at) < now ? ["none", "Expired"] : ["warn", "Unused · expires " + new Date(c.expires_at).toLocaleDateString()]);
    (ADMIN.invites || []).forEach((c) => {
      const [cls, txt] = stateOf(c), open = !c.used_at && !c.revoked && new Date(c.expires_at) >= now;
      list.append(el("div", { class: "inv-row" },
        el("div", {}, el("strong", { class: "num", text: c.code }), c.note ? el("span", { class: "muted", text: " · " + c.note }) : null, el("div", {}, el("span", { class: "chip " + cls, text: txt }))),
        open ? el("div", { class: "row", style: "gap:6px" },
          el("button", { class: "btn small", onclick: () => copyInvite(c.code) }, "Copy"),
          el("button", { class: "btn small ghost", onclick: async () => { try { await api.revokeInvite(c.code); toast("Code revoked"); adminLoad(); } catch (e) { toast("Couldn't revoke: " + (e.message || e)); } } }, "Revoke")) : null));
    });
    const make = el("button", { class: "btn primary", onclick: async () => {
      make.disabled = true;
      try {
        ADMIN.newCode = await api.createInvite(note.value.trim());
        ADMIN.invites = await api.listInvites();
        renderAdmin(); return;
      } catch (e) { toast("Couldn't create a code: " + (e.message || e)); }
      make.disabled = false;
    } }, "Create invite code");
    return el("div", { class: "card", style: "display:grid;gap:12px" },
      el("h3", { text: "Invite codes" }),
      el("p", { class: "muted", style: "font-size:14px", text: "Each code creates exactly one student account and expires after 30 days, so a shared code can't be reused." }),
      el("div", { class: "row", style: "gap:8px;flex-wrap:wrap" }, note, make), out,
      (ADMIN.invites || []).length ? list : el("p", { class: "muted", style: "font-size:14px", text: "No codes yet." }));
  }
  function copyInvite(code) {
    const url = location.origin + location.pathname.replace(/index\.html$/, "");
    const msg = "You're invited to Test Prep Hub for PSAT/SAT practice.\n1. Open " + url + "\n2. Tap \"Create a student account\"\n3. Use this one-time invite code: " + code + "\nIt works once and expires in 30 days.";
    const done = () => toast("Invite copied. Paste it into a text or email.", true);
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(msg).then(done, () => prompt("Copy this invite:", msg)); return; } } catch (e) { }
    prompt("Copy this invite:", msg);
  }
  // Parent-set rewards: edited here, read by the student's app (they can only claim).
  function adminRewards(x) {
    const host = el("div", { style: "display:grid;gap:8px" });
    const uidv = x.row.user_id;
    const draw = (list) => {
      host.textContent = "";
      const rows = list.map((r) => ({ id: r.id || uid(), label: r.label || "", xp: r.xp || 500 }));
      const tbl = el("div", { style: "display:grid;gap:6px" });
      const paint = () => { tbl.textContent = ""; rows.forEach((r, k) => {
        const lab = el("input", { type: "text", value: r.label, maxlength: "80", "aria-label": "Reward" }), xp = el("input", { type: "number", value: String(r.xp), min: "50", step: "50", style: "max-width:100px", "aria-label": "XP" });
        lab.addEventListener("input", () => (r.label = lab.value)); xp.addEventListener("input", () => (r.xp = +xp.value));
        tbl.append(el("div", { class: "row", style: "gap:6px;flex-wrap:nowrap" }, lab, xp, el("span", { class: "muted", style: "font-size:12px", text: "XP" }), el("button", { class: "btn small ghost", type: "button", onclick: () => { rows.splice(k, 1); paint(); } }, "Remove")));
      }); };
      paint();
      const msg = el("span", { class: "muted", style: "font-size:13px" });
      host.append(tbl, el("div", { class: "row" },
        el("button", { class: "btn small", type: "button", onclick: () => { rows.push({ id: uid(), label: "", xp: 750 }); paint(); } }, "Add a reward"),
        el("button", { class: "btn small primary", type: "button", onclick: async () => {
          const clean = rows.filter((r) => r.label.trim() && r.xp > 0).map((r) => ({ id: String(r.id), label: r.label.trim(), xp: Math.round(r.xp) }));
          msg.textContent = "Saving…";
          try { await ADMIN.api.setRewards(uidv, clean); msg.textContent = "Saved. " + x.name + " sees them next time the app opens."; } catch (e) { msg.textContent = "Couldn't save: " + ((e && e.message) || "error"); }
        } }, "Save rewards"), msg));
    };
    if (ADMIN && ADMIN.api && ADMIN.api.getRewards) {
      host.append(el("p", { class: "muted", style: "font-size:14px", text: "Loading…" }));
      ADMIN.api.getRewards(uidv).then((r) => draw(Array.isArray(r) ? r : [])).catch(() => { host.textContent = ""; host.append(el("p", { class: "muted", style: "font-size:14px", text: "Rewards editing isn't available yet." })); });
    } else draw(x.D.rewards || []);
    return host;
  }
  function adminDetail(x) {
    const box = el("div", { class: "adm-detail" });
    // Last 14 days of activity
    const bars = el("div", { class: "adm-bars", role: "img", "aria-label": "Questions answered per day, last 14 days" });
    let mx = 1; const days = [];
    for (let i = 13; i >= 0; i--) { const d = addDays(today(), -i), a = (x.D.activity || {})[d] || {}; days.push([d, a.q || 0, a.mock || 0]); mx = Math.max(mx, a.q || 0); }
    days.forEach(([d, q, mk]) => bars.append(el("div", { class: "adm-bar", title: fmtDay(d).md + ": " + q + " questions" + (mk ? ", " + mk + " mock section(s)" : "") }, el("i", { style: "height:" + Math.round((q / mx) * 100) + "%" + (mk ? ";background:var(--pencil)" : "") }), el("span", { text: fmtDay(d).dow[0] }))));
    box.append(el("div", { class: "eyebrow", text: "Last 14 days (questions per day; gold = mock test day)" }), bars);
    box.append(el("div", { class: "eyebrow", text: "Study time (last 7 days)" }), adminTime(x.D));
    box.append(el("div", { class: "eyebrow", text: "Rewards (only you can change these)" }), adminRewards(x));
    // Skills as a stacked list: reads well on a phone and on a desktop.
    const sk = el("div", { class: "adm-skills" });
    x.dom.forEach((r) => {
      const [c, l] = status(r.m);
      sk.append(el("div", { class: "adm-skill" },
        el("div", { class: "adm-skill-top" }, el("span", { class: "adm-skill-name", text: r.d.name }), el("span", { class: "chip " + c, text: l })),
        el("div", { class: "track", style: "height:6px" }, el("i", { class: c, style: "width:" + (r.m != null ? Math.round(r.m * 100) : 0) + "%" })),
        el("div", { class: "muted", style: "font-size:12px", text: "Practice " + (r.att ? r.cor + "/" + r.att + " (" + Math.round((r.cor / r.att) * 100) + "%)" : "none yet") + " · Latest test " + (r.ta != null ? Math.round(r.ta * 100) + "%" : "—") })));
    });
    box.append(el("div", { class: "eyebrow", text: "Skills (weakest first in the Focus list)" }), sk);
    // Tests
    const tl = x.tests.slice(-8).reverse();
    box.append(el("div", { class: "eyebrow", text: "Tests (" + x.tests.length + ")" }), tl.length ? el("ul", { class: "adm-list" }, tl.map((t) => el("li", {}, el("strong", { text: t.name }), " · " + fmtDay(t.date).md + " · " + [t.rw ? "R&W " + t.rw : null, t.math ? "Math " + t.math : null, t.total ? "total " + t.total : null].filter(Boolean).join(", ") + (isEst(t) ? " (est.)" : "")))) : el("p", { class: "muted", style: "font-size:14px", text: "No tests yet." }));
    // Plan & goals
    const tasksDone = Object.keys(x.D.tasks || {}).length, ws = x.D.weekStatus;
    const exams = ((x.st.exams) || []).map((e) => FORMATS[e.kind].name + " " + fmtDay(e.date).md + ", " + parseYmd(e.date).getFullYear() + (e.score ? " (scored " + e.score + ")" : ""));
    box.append(el("div", { class: "eyebrow", text: "Plan" }), el("ul", { class: "adm-list" },
      el("li", { text: "Plan tasks checked off: " + tasksDone }),
      ws ? el("li", { text: "This week's goals: " + ws.done + " of " + ws.total + " done (" + ws.q + " of " + ws.qTarget + " questions)" }) : null,
      el("li", { text: "Review deck: " + Object.keys(x.D.deck || {}).length + " strategy cards · badges earned: " + Object.keys(x.D.badges || {}).length }),
      ...treviewAdmin(x.D),
      el("li", { text: "Concept Lab: " + ((x.D.lab2 && x.D.lab2.done) || []).length + " of 7 missions" + (x.D.lab2 && x.D.lab2.done && x.D.lab2.done.length ? " (" + x.D.lab2.done.join(", ") + ")" : "") }),
      el("li", { text: "Geometry Lab: " + ((x.D.lab && x.D.lab.done) || []).length + " of 7 missions" + (x.D.lab && x.D.lab.done && x.D.lab.done.length ? " (" + x.D.lab.done.join(", ") + ")" + (x.D.lab.stars ? ", " + x.D.lab.stars + " first try" : "") : "") }),
      exams.length ? el("li", { text: "Tests planned: " + exams.join("; ") }) : null,
      el("li", { text: "Joined " + (x.row.joined ? new Date(x.row.joined).toLocaleDateString() : "—") + " · last sign-in " + (x.row.last_sign_in ? new Date(x.row.last_sign_in).toLocaleDateString() : "—") })));
    return box;
  }

  /* ================= Study time =================
     Counts time only while a study activity is open (practice, focus set, notebook, mock, flashcards, challenge):
     focused = page visible and touched in the last 90 s; idle = visible but untouched; away = switched to another
     app or tab mid-activity (15 s to 30 min). The student sees their own numbers; the admin sees the history. */
  const IDLE_MS = 90000, AWAY_MIN = 15, AWAY_MAX = 1800;
  const TT = { last: Date.now(), input: Date.now(), hidAt: null, hidAct: null, saved: Date.now(), nudged: null };
  function curAct() {
    if (GUEST || ADMIN) return null;
    if (TAB === "practice" && P && !P.finished) return P.focus ? "focus" : P.notebook ? "notebook" : "practice";
    if (TAB === "mock" && S.mock && S.mock.phase !== "done") return "mock";
    if (TAB === "review" && RV && RV.i < RV.queue.length) return "cards";
    if (TAB === "friends" && CH && !CH.done) return "challenge";
    return null;
  }
  const ACT_NAMES = { practice: "Practice sets", focus: "Focus set", notebook: "Mistake notebook", mock: "Mock tests", cards: "Flashcards", challenge: "Friend challenges" };
  function ttDay(d) {
    const T = S.time || (S.time = {}), k = d || today();
    if (!T[k]) { T[k] = { f: 0, i: 0, a: 0, n: 0, by: {} }; const ks = Object.keys(T).sort(); while (ks.length > 30) delete T[ks.shift()]; }
    return T[k];
  }
  function ttTick() {
    const now = Date.now(), dt = Math.min(10, (now - TT.last) / 1000); TT.last = now;
    if (document.hidden) return;
    const act = curAct(); if (!act) return;
    const d = ttDay();
    if (now - TT.input < IDLE_MS) { d.f += dt; d.by[act] = (d.by[act] || 0) + dt; }
    else {
      d.i += dt;
      // A gentle nudge after 2 minutes untouched on a question.
      const qk = act === "mock" ? "m" + (S.mock && S.mock.cur) : P ? "p" + P.i : act;
      if (now - TT.input > 120000 && TT.nudged !== qk && (act === "practice" || act === "focus" || act === "notebook" || act === "mock")) { TT.nudged = qk; toast("Still on this one? Pick your best guess and keep moving."); }
    }
    if (now - TT.saved > 60000) { TT.saved = now; save(); }
  }
  function ttVisibility() {
    const now = Date.now();
    if (document.hidden) { const act = curAct(); if (act) { TT.hidAt = now; TT.hidAct = act; } return; }
    TT.last = now; TT.input = now;
    if (!TT.hidAt) return;
    const sec = (now - TT.hidAt) / 1000; TT.hidAt = null;
    if (P && !P.finished && P.qAt) P.qAway = (P.qAway || 0) + sec * 1000; // away time doesn't count against the question
    if (sec < AWAY_MIN || sec > AWAY_MAX || !curAct()) return;
    const d = ttDay(); d.a += sec; d.n++;
    toast("Welcome back. You were away " + (sec < 90 ? Math.round(sec) + " seconds" : Math.round(sec / 60) + " minutes") + ".");
    save();
  }
  const ttInput = () => { TT.input = Date.now(); };
  ["pointerdown", "keydown", "scroll", "touchstart", "input"].forEach((e) => document.addEventListener(e, ttInput, { passive: true, capture: true }));
  let ttMove = 0; document.addEventListener("mousemove", () => { const n = Date.now(); if (n - ttMove > 2000) { ttMove = n; ttInput(); } }, { passive: true });
  document.addEventListener("visibilitychange", ttVisibility);
  setInterval(ttTick, 5000);
  const mins = (sec) => Math.round(sec / 60);
  const minText = (sec) => (sec < 60 ? (sec > 0 ? "under a minute" : "0 min") : mins(sec) >= 60 ? Math.floor(mins(sec) / 60) + " h " + (mins(sec) % 60) + " min" : mins(sec) + " min");
  function todayTimeLine() {
    const d = (S.time || {})[today()]; if (!d || d.f < 30) return null;
    return el("p", { class: "muted time-line" }, el("strong", { text: "Study time today: " + minText(d.f) + " focused" }),
      d.n ? " · stepped away " + d.n + " time" + (d.n === 1 ? "" : "s") + " (" + minText(d.a) + ")" : " · no breaks away");
  }
  // Admin view: last 7 days of study time plus time per question against test pace.
  function adminTime(D) {
    const T = D.time || {}, box = el("div", { style: "display:grid;gap:8px" });
    const rows = []; for (let k = 6; k >= 0; k--) { const day = addDays(today(), -k); rows.push([day, T[day]]); }
    if (!rows.some(([, x]) => x)) return el("p", { class: "muted", style: "font-size:14px", text: "No study time recorded yet (tracking started Oct 1, 2026)." });
    const tb = el("table", { class: "adm-time" }, el("thead", {}, el("tr", {}, ["Day", "Focused", "Idle on screen", "Stepped away"].map((h) => el("th", { text: h })))));
    const body = el("tbody"); const by = {};
    rows.forEach(([day, x]) => {
      if (x) for (const [a, v] of Object.entries(x.by || {})) by[a] = (by[a] || 0) + v;
      body.append(el("tr", {}, el("td", { text: fmtDay(day).dow + " " + fmtDay(day).md }), el("td", { text: x ? minText(x.f) : "—" }), el("td", { text: x ? minText(x.i) : "—" }), el("td", { text: x ? (x.n ? x.n + "× · " + minText(x.a) : "0") : "—" })));
    });
    tb.append(body); box.append(tb);
    const parts = Object.entries(by).sort((a, b) => b[1] - a[1]).map(([a, v]) => (ACT_NAMES[a] || a) + " " + minText(v));
    if (parts.length) box.append(el("p", { style: "font-size:14px" }, el("strong", { text: "Where the time went (7 days): " }), parts.join(" · ")));
    const qt = D.qtime || {}, pace = [];
    for (const sec of ["rw", "math"]) {
      let n = 0, sum = 0; DOMAINS.filter((x) => x.sec === sec).forEach((x) => { const v = qt[x.id]; if (v) { n += v[0]; sum += v[1]; } });
      if (n >= 5) { const avg = sum / n, tgt = sec === "rw" ? 71 : 95; pace.push((sec === "rw" ? "Reading and Writing " : "Math ") + mmss(avg) + " per question (test pace " + mmss(tgt) + ")" + (avg > tgt * 1.25 ? ", slower than test pace" : "")); }
    }
    if (pace.length) box.append(el("p", { style: "font-size:14px" }, el("strong", { text: "Time per question in practice: " }), pace.join(" · ")));
    return box;
  }

  /* ================= Boot ================= */
  try { const t = sessionStorage.getItem(KEY + "-tab"); if (t && t !== "admin" && document.getElementById("p-" + t)) TAB = t; } catch (e) { }
  if (GUEST && !["today", "practice", "mock"].includes(TAB)) TAB = "today";
  if (S.mock && S.mock.phase !== "done") TAB = "mock";
  show(TAB);
  window.__psat = { get state() { return S; }, calc };
  window.PSApp = {
    get state() { return S; },
    blank,
    // Replace progress with a newer copy (from the cloud) without triggering another upload.
    replace(next) { if (GUEST) return; HOLD = false; S = Object.assign(blank(), next); S.prefs = Object.assign(blank().prefs, S.prefs); S.settings = Object.assign(blank().settings, S.settings); syncExams(S); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } render(); },
    get guest() { return GUEST; },
    // Switch between the public site (signed out) and a student's own progress (signed in).
    setGuest(g) {
      g = !!g; if (g === GUEST) return;
      GUEST = g; HOLD = false; P = null; ADMIN = null; SOC = null; CH = null; FOCUS = null; REVIEWS = []; clearInterval(pTick); clearInterval(mTick); tool = null;
      const pop = document.getElementById("pop"); if (pop) pop.textContent = "";
      S = load(storeKey());
      TAB = !GUEST && S.mock && S.mock.phase !== "done" ? "mock" : "today";
      show(TAB);
    },
    onSave(fn) { saveHooks.push(fn); },
    // Called by sync.js after the server confirms admin status (load = fetches the dashboard rows), or with null.
    setAdmin(load, api) { const was = !!ADMIN; ADMIN = load && !GUEST ? { load, api: api || null, rows: null } : null; if (ADMIN) { show("admin"); adminLoad(); } else if (was) show("today"); },
    get admin() { return !!ADMIN; },
    setRewardCfg(row) {
      if (!row || !Array.isArray(row.rewards) || GUEST) return;
      const old = Object.fromEntries((S.rewards || []).map((r) => [r.id, r]));
      S.rewards = row.rewards.filter((r) => r && r.label && r.xp > 0).map((r) => Object.assign({ claimed: false }, old[r.id] ? { claimed: old[r.id].claimed, notified: old[r.id].notified } : {}, { id: String(r.id), label: String(r.label), xp: Math.round(+r.xp) }));
      save(); if (TAB === "rewards") render();
    },
    setFocus(row) {
      const all = row && Array.isArray(row.items) ? row.items : [];
      REVIEWS = all.filter((x) => x && typeof x.type === "string" && x.type.startsWith("review:") && x.review).map((x) => Object.assign({ id: x.type.slice(7) }, x.review));
      // Official practice test results read from the student's College Board account arrive as {type:"log:<id>", log:{...test}}
      // and are added to the student's tests once, the same way the Log a test form would.
      if (!GUEST) all.filter((x) => x && typeof x.type === "string" && x.type.startsWith("log:") && x.log && x.log.id).forEach((x) => {
        if (S.tests.some((t) => t.id === x.log.id)) return;
        const rec = Object.assign({ source: "bluebook", kind: "psat", dom: {} }, x.log);
        S.tests.push(rec); S.tests.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
        addXP(100, "Bluebook test added"); award("baseline");
        if (S.tests.filter((t) => t.source === "bluebook" && t.total).length >= 2) award("rehearsal");
        if (rec.total) checkGoalScore(rec.total);
        planEvent({ k: "log", src: rec.source }); save(); toast(rec.name + " added to your tests", true);
      });
      FOCUS = row && all.length ? { items: all.filter((x) => !(typeof x.type === "string" && (x.type.startsWith("review:") || x.type.startsWith("log:")))), source: row.source, updated: row.updated_at } : null;
      if (TAB === "treview") render(); seedDeck(); if (!GUEST && (TAB === "today" || TAB === "practice")) render(); },
    setSocial(api) { SOC = api && !GUEST ? { api } : null; CH = null; socialBadge(); if (SOC) socialLoad(TAB === "friends"); },
    onSettings(fn) { settingsHooks.push(fn); },
    // Record which account this device's progress belongs to (does not count as a change).
    // Hide another student's copy until the signed-in student's progress arrives.
    expect(uid) { if (!GUEST && uid && S.owner && S.owner !== uid) { HOLD = true; render(); } },
    setOwner(id) { if (GUEST) return; HOLD = false; S.owner = id; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } },
    // Apply the signed-in student's profile (name, test, date) without counting as a change.
    applyProfile(p) {
      if (GUEST) return;
      let changed = false;
      if (p.name != null && p.name !== S.settings.name) { S.settings.name = p.name; changed = true; }
      syncExams(S);
      if (p.date) {
        const ex = S.settings.exams.find((e) => e.date === p.date);
        if (ex) {
          if (p.kind && ex.kind !== p.kind) { ex.kind = p.kind; changed = true; }
          if (p.target !== undefined && (ex.target || null) !== (p.target || null)) { ex.target = p.target || null; changed = true; }
        } else if (p.date >= today()) { S.settings.exams.push({ id: exId(), kind: p.kind || "psat", date: p.date, target: p.target || null }); changed = true; }
        if (syncExams(S)) changed = true;
      }
      if (changed) { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } render(); }
    },
    // Remove this device's copy (the account keeps its copy in the cloud).
    reset() { try { localStorage.removeItem(KEY); } catch (e) { } if (!GUEST) { P = null; S = blank(); render(); } },
    save, render, toast, show: (t) => show(t),
    get busy() { return !GUEST && (!!(S.mock && S.mock.phase !== "done") || !!(P && !P.finished)); }
  };
  document.dispatchEvent(new Event("psapp-ready"));
})();
