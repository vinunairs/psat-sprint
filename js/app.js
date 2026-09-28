/* Test Prep Hub — app */
(function () {
  "use strict";
  const { makeRng, checkSpr } = window.PSCore;
  const MG = window.MathGen, RW = window.RWGen, BANK = window.RWBank;

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

  const PLAN_TEMPLATE = [
    { title: "Baseline, part 1", tasks: ["Install the Bluebook app and sign in with your College Board account", "Download {TEST} Practice Test 1 in Bluebook", "Take the Reading and Writing section in Bluebook, timed (64 min, both modules)", "Warm up here: a 10-question practice set"] },
    { title: "Baseline, part 2", tasks: ["Take the Math section of Bluebook Practice Test 1, timed (70 min)", "Open the score report and count misses in each skill domain", "Enter the results in the Log Bluebook test tab"] },
    { title: "Fix the biggest leak", tasks: ["Read the explanation for every missed question in Bluebook", "Practice 20 questions on the #1 skill in the Skill matrix Focus list", "Retry the Mistake notebook"] },
    { title: "Grammar rules day", tasks: ["Practice 20 Standard English Conventions questions", "Learn the punctuation rules: period or semicolon between full sentences, colon before a list or explanation, commas in pairs around extra info, no comma between subject and verb", "Spend 20 minutes with Desmos: graph a line, find an intersection, find a vertex"] },
    { title: "Math under the clock", tasks: ["Take an in-app mock: Math section only, timed", "Review every miss in the results", "Practice 10 questions on the #2 Focus skill"] },
    { title: "Dress rehearsal", tasks: ["Take Bluebook {TEST} Practice Test 2 in one sitting, starting at the same time as the real test", "Take only the scheduled 10-minute break", "Enter the results in the Log Bluebook test tab"] },
    { title: "Review the rehearsal", tasks: ["Review every miss from Practice Test 2", "Compare the Skill matrix with Test 1 and note what improved", "Practice 20 questions on the lowest skill"] },
    { title: "Reading under the clock", tasks: ["Take an in-app mock: Reading and Writing section only, timed", "Review every miss in the results", "Retry the Mistake notebook"] },
    { title: "Light review", tasks: ["One 10-question mixed practice set, nothing more", "Charge the device, update Bluebook, and run its exam readiness check", "Pack what the school asks for: device, charger, admission info", "Lights out by 10 pm"] },
    { title: "Test day", tasks: ["Eat a real breakfast", "Take care on Module 1: it decides whether Module 2 is the harder set", "Never leave a question blank; wrong answers cost nothing", "Use Desmos and the reference sheet to check math answers"] }
  ];

  // The plan counts back from the student's own test date: day 1 is 9 days before, the last day is test day.
  function plan() {
    const end = parseYmd(S.settings.date || "2026-10-07"), label = S.settings.kind === "sat" ? "SAT" : "PSAT/NMSQT";
    return PLAN_TEMPLATE.map((d, i) => {
      const dt = new Date(end); dt.setDate(end.getDate() - (PLAN_TEMPLATE.length - 1 - i));
      return { date: ymd(dt), title: d.title, tasks: d.tasks.map((t) => t.replace("{TEST}", label)) };
    });
  }

  const BADGES = [
    { id: "first", s: "1st", name: "First Rep", how: "Finish your first practice set" },
    { id: "mock1", s: "M1", name: "Mock Debut", how: "Finish a mock test section" },
    { id: "mockfull", s: "Full", name: "Full Distance", how: "Finish a full mock test (both sections)" },
    { id: "baseline", s: "BB", name: "Baseline Set", how: "Log a Bluebook practice test" },
    { id: "rehearsal", s: "BB2", name: "Dress Rehearsal", how: "Log a second Bluebook test" },
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
    { id: "goal", s: "★", name: "Goal Reached", how: "Hit your target score on a test" }
  ];
  const LEVELS = ["Warm-Up", "Test Taker", "Module Master", "Adaptive Ace", "Score Climber", "Top Percentile", "Legend"];
  const XP_PER_LEVEL = 250;

  /* ================= State ================= */
  const KEY = "psat-sprint-v2";
  function blank() {
    return {
      v: 2, updatedAt: 0, xp: 0, streak: { count: 0, last: null }, tasks: {}, daysDone: {},
      stats: {}, sub: {}, answered: 0, tests: [], mistakes: [], fixed: 0, badges: {},
      seenBank: {}, recentKeys: [], mock: null, lastMock: null,
      prefs: { sel: [], count: 10, diff: "auto", timed: true }, samples: { practice: 0, mock: 0 },
      activity: {}, weeks: {}, planStart: null,
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
      if (raw) { const s = Object.assign(blank(), JSON.parse(raw)); s.prefs = Object.assign(blank().prefs, s.prefs); s.settings = Object.assign(blank().settings, s.settings); return s; }
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
    const all = BANK.filter((q) => q.d === domain && !used.has("bank:" + q.id));
    if (!all.length) return null;
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
    if (q.src === "bank") S.seenBank[q.id] = Date.now();
    else { S.recentKeys.push(q.key); if (S.recentKeys.length > 600) S.recentKeys.splice(0, S.recentKeys.length - 600); }
    return q;
  }
  const isRight = (q, ans) => (q.type === "spr" ? ans != null && ans !== "" && checkSpr(ans, q.spr) : ans === q.a);
  const answerText = (q) => (q.type === "spr" ? String(q.o[q.a]).replace(/^\$/, "") : LETTERS[q.a] + ") " + q.o[q.a]);

  /* ================= Skill tracking ================= */
  function record(q, ok, fromMock) {
    if (!fromMock) { const st = S.stats[q.d] || (S.stats[q.d] = { att: 0, cor: 0 }); st.att++; if (ok) st.cor++; }
    if (q.sk) { const sb = S.sub[q.sk + "|" + q.d] || (S.sub[q.sk + "|" + q.d] = { att: 0, cor: 0 }); sb.att++; if (ok) sb.cor++; }
    S.answered++; if (S.answered >= 100) award("century");
    logActivity(q.d, ok);
    const i = S.mistakes.findIndex((m) => m.key === q.key);
    if (ok && i > -1) { S.mistakes.splice(i, 1); S.fixed++; if (S.fixed >= 5) award("fixer"); }
    if (!ok && i === -1) {
      const slim = { key: q.key, d: q.d, sk: q.sk, p: q.p, q: q.q, o: q.o, a: q.a, type: q.type, spr: q.spr, e: q.e, t: q.t, table: q.table, chart: q.chart, id: q.id, src: q.src, added: today() };
      S.mistakes.unshift(slim); if (S.mistakes.length > 80) S.mistakes.length = 80;
    }
  }
  function latestTestDom(d) { for (let i = S.tests.length - 1; i >= 0; i--) { const t = S.tests[i]; if (t.dom && t.dom[d] && t.dom[d].t) return t.dom[d]; } return null; }
  function testAcc(d) { const x = latestTestDom(d); return x ? x.c / x.t : null; }
  function pracAcc(d) { const r = S.stats[d]; return r && r.att >= 3 ? r.cor / r.att : null; }
  function mastery(d) { const a = testAcc(d), b = pracAcc(d); if (a != null && b != null) return 0.6 * a + 0.4 * b; return a != null ? a : b; }
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
    $("#hScore").textContent = (t && t.total ? t.total + (t.source === "app" ? " est." : "") : "—") + (S.settings.target ? " / goal " + S.settings.target : "");
    const l = level(); $("#hLevel").textContent = "Level " + l + " · " + levelName(l);
    $("#hXpBar").style.width = ((S.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100 + "%";
    $("#hXp").textContent = S.xp + " XP · " + (XP_PER_LEVEL - (S.xp % XP_PER_LEVEL)) + " to next level";
  }
  let TAB = "today";
  document.querySelectorAll("nav.tabs button").forEach((b) => b.addEventListener("click", () => show(b.dataset.tab)));
  function show(t) {
    if (GUEST && !["today", "practice", "mock"].includes(t)) t = "today";
    TAB = t;
    document.querySelectorAll("nav.tabs button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === t)));
    document.querySelectorAll("section.panel").forEach((p) => (p.hidden = p.id !== "p-" + t));
    render();
    try { sessionStorage.setItem(KEY + "-tab", t); } catch (e) { }
    window.scrollTo({ top: 0 });
  }
  function render() {
    document.body.classList.toggle("guest", GUEST);
    document.body.classList.toggle("holding", HOLD && !GUEST);
    if (HOLD && !GUEST) {
      document.title = "Test Prep Hub";
      const hi = document.getElementById("hello"); if (hi) hi.textContent = "";
      document.querySelectorAll("section.panel").forEach((x) => (x.hidden = x.id !== "p-today"));
      const p = $("#p-today"); p.textContent = "";
      p.append(el("div", { class: "card mission" }, el("h2", { text: "Loading your progress…" }), el("p", { class: "muted", text: "This takes a moment on a device someone else used." })));
      return;
    }
    const tb = document.querySelector('nav.tabs button[data-tab="today"]'); if (tb) tb.textContent = GUEST ? "Home" : "Today";
    const pb = document.querySelector('nav.tabs button[data-tab="practice"]'); if (pb) pb.textContent = GUEST ? "Sample practice" : "Practice";
    const mb = document.querySelector('nav.tabs button[data-tab="mock"]'); if (mb) mb.textContent = GUEST ? "Sample mock" : "Mock test";
    const fn = document.getElementById("footNote"); if (fn) fn.textContent = GUEST ? "Create a free student account to save progress and unlock the full site." : "Progress saves on this device first, then to your account.";
    renderHeader(); ({ today: renderToday, practice: renderPractice, mock: renderMock, matrix: renderMatrix, log: renderLog, rewards: renderRewards })[TAB](); }

  /* ================= Today ================= */
  function taskList(day) {
    const ul = el("ul", { class: "tasks" });
    day.tasks.forEach((t, i) => {
      const id = day.date + "#" + i, on = !!S.tasks[id];
      ul.append(el("li", { class: "task" + (on ? " done" : "") },
        el("button", { class: "bubble", "aria-pressed": String(on), "aria-label": (on ? "Mark not done: " : "Mark done: ") + t, onclick: () => toggleTask(day, i) }, LETTERS[i] || String(i + 1)),
        el("span", { class: "t", text: t })));
    });
    return ul;
  }
  function toggleTask(day, i) {
    const id = day.date + "#" + i;
    if (S.tasks[id]) { delete S.tasks[id]; addXP(-15); delete S.daysDone[day.date]; }
    else {
      S.tasks[id] = true; addXP(15, "task done"); bumpStreak();
      if (day.tasks.every((_, k) => S.tasks[day.date + "#" + k])) { S.daysDone[day.date] = true; toast("Day complete: " + day.title, true); if (Object.keys(S.daysDone).length >= 3) award("keeper"); }
    }
    save(); render();
  }
  /* ================= Long-range plan ================= */
  const SPRINT_DAYS = 9; // switch to the day-by-day plan when the test is this close
  const PHASES = {
    foundations: { name: "Foundations", what: "Diagnostic mock, then practice all 8 skills" },
    build: { name: "Build", what: "Focus on the weakest skills, one mock section a week" },
    ready: { name: "Test-ready", what: "A full mock every week, timed practice" },
    sprint: { name: "Final sprint", what: "Day-by-day plan with two dress rehearsals" }
  };
  function addDays(str, n) { const d = parseYmd(str); d.setDate(d.getDate() + n); return ymd(d); }
  function weekStart(str) { const d = parseYmd(str); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return ymd(d); }
  const dayOf = () => S.activity[today()] || (S.activity[today()] = { q: 0, c: 0, dom: {}, mock: 0 });
  function logActivity(d, ok) { const a = dayOf(); a.q++; if (ok) a.c++; const x = a.dom[d] || (a.dom[d] = [0, 0]); x[0]++; if (ok) x[1]++; }
  function logMock(sections) { dayOf().mock += sections; }
  function weekTotals(ws) {
    const t = { q: 0, c: 0, dom: {}, mock: 0, days: 0 };
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
      goals.push({ id: "mock", type: "mock", target: 2, label: "Take a full diagnostic mock test (here or in Bluebook)" });
      goals.push({ id: "q", type: "q", target: 40, label: "Answer 40 practice questions" });
      goals.push({ id: "cover", type: "cover", min: 1, target: 8, label: "Try all 8 skills at least once" });
      return { phase: "foundations", diagnostic: true, goals };
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
    const nb = ph === "ready" ? 5 : 10;
    goals.push({ id: "nb", type: "notebook", target: nb, label: "Get the Mistake notebook down to " + nb + " or fewer" });
    return { phase: ph, goals };
  }
  function currentWeek() {
    const ws = weekStart(today());
    if (!S.weeks[ws]) S.weeks[ws] = makeWeekGoals(ws);
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

  function renderToday() {
    if (GUEST) return renderLanding();
    const p = $("#p-today"); p.textContent = "";
    const t = today(), mode = planMode();
    if (S.mock && S.mock.phase !== "done") {
      p.append(el("div", { class: "card mission" }, el("div", { class: "eyebrow", text: "Mock test in progress" }), el("h2", { text: FORMATS[S.mock.kind].name + " mock" }), el("div", { class: "row" }, el("button", { class: "btn primary", onclick: () => show("mock") }, "Resume the mock test"))));
    }
    if (mode === "sprint") renderSprint(p, t);
    else if (mode === "after") renderAfter(p);
    else renderLongPlan(p, mode);
    p.append(el("div", { class: "card row between", style: "padding:14px 18px" },
      el("span", {}, el("strong", { text: "Reminders on your phone" }), el("span", { class: "muted", text: mode === "sprint" ? " · a nudge each evening with the skill to work on" : " · an evening nudge with this week's goals, plus a Sunday check-in" })),
      el("button", { class: "btn small", onclick: () => { const b = document.getElementById("remindBtn"); if (b) b.click(); } }, "Set up reminders")));
    p.append(el("div", { class: "card" }, el("h3", { text: "How the digital PSAT and SAT work" }),
      el("div", { class: "grid2", style: "margin-top:12px" },
        info("Reading and Writing", "54 questions in 64 minutes, split into two 32-minute modules. Short passages with one question each. About 71 seconds per question."),
        info("Math", "44 questions in 70 minutes, split into two 35-minute modules. Calculator allowed throughout. About a quarter of questions need a typed-in answer. About 95 seconds per question."),
        info("Adaptive", "How you do on Module 1 decides whether Module 2 is the easier or the harder set. Only the harder set unlocks the top scores."),
        info("Scoring", "PSAT sections score 160–760 (total 320–1520). SAT sections score 200–800 (total 400–1600). Wrong answers cost nothing, so never leave a blank.")),
      el("p", { class: "muted", style: "font-size:13px;margin-top:14px" }, "Official practice: ", el("a", { href: "https://bluebook.collegeboard.org/", target: "_blank", rel: "noopener" }, "Bluebook app"), " · ", el("a", { href: "https://satsuitequestionbank.collegeboard.org/", target: "_blank", rel: "noopener" }, "SAT Suite Question Bank"), " · ", el("a", { href: "https://www.khanacademy.org/digital-sat", target: "_blank", rel: "noopener" }, "Khan Academy SAT prep"))));
    function info(h, b) { return el("div", {}, el("div", { class: "eyebrow", text: h }), el("p", { style: "margin-top:.3em", text: b })); }
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
    if (!tg) return el("p", { class: "muted", style: "font-size:14px" }, "No target score yet. ", el("button", { class: "btn small ghost", onclick: () => $("#settingsBtn").click() }, "Set a target score"));
    if (!lt) return el("p", { style: "font-size:14px" }, el("strong", { text: "Target " + tg }), el("span", { class: "muted", text: " · take a mock test to see how far you are from it" }));
    const gap = tg - lt.total;
    return el("p", { style: "font-size:14px" }, el("strong", { text: "Target " + tg }), el("span", { class: "muted", text: " · latest " + lt.total + (lt.source === "app" ? " (estimated)" : "") + " · " }), gap > 0 ? el("strong", { text: gap + " to go" }) : el("strong", { style: "color:var(--good)", text: "target reached" }));
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
      el("div", { class: "row" },
        el("button", { class: "btn primary", onclick: () => { S.prefs.sel = [focusId]; save(); show("practice"); startPractice([focusId], 10, "auto"); } }, "15 minutes today: " + DOM[focusId].name),
        el("button", { class: "btn", onclick: () => show("mock") }, "Take a mock test")),
      el("p", { class: "muted", style: "font-size:13px", text: "New goals every Monday, picked from your Skill matrix. Meet them all for +100 XP." })));
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
      el("p", { class: "lede", text: "Scores usually arrive a few weeks after test day. When you know your next test (the SAT, or next year's PSAT), set its date and a target score and your plan starts again: monthly phases when it's far away, weekly goals as it gets closer, and a day-by-day sprint at the end." }),
      el("div", { class: "row" }, el("button", { class: "btn primary", onclick: () => $("#settingsBtn").click() }, "Set my next test"), el("button", { class: "btn", onclick: () => show("practice") }, "Keep practicing"))));
  }

  function renderSprint(p, t) {
    const PLAN = plan();
    const cur = PLAN.find((d) => d.date === t) || (t < PLAN[0].date ? PLAN[0] : null);
    if (cur) {
      const f = fmtDay(cur.date), done = cur.tasks.filter((_, i) => S.tasks[cur.date + "#" + i]).length, top = focusList()[0];
      p.append(el("div", { class: "card mission" },
        el("div", { class: "row between" }, el("div", {}, el("div", { class: "eyebrow", text: cur.date === t ? possessive() + (who() ? "mission today" : "Today's mission") : possessive() + (who() ? "first mission" : "First mission") }), el("h2", { text: cur.title })), el("span", { class: "date", text: f.dow + " " + f.md + " · " + done + "/" + cur.tasks.length + " done" })),
        S.settings.target ? goalLine() : null,
        taskList(cur),
        el("div", { class: "row" },
          el("button", { class: "btn primary", onclick: () => { S.prefs.sel = [top.id]; save(); show("practice"); startPractice([top.id], 10, "auto"); } }, "Practice: " + top.name),
          el("button", { class: "btn", onclick: () => show("mock") }, "Take a mock test"))));
    }
    const pw = el("div", { class: "plan" });
    PLAN.forEach((day) => {
      const f = fmtDay(day.date), isT = day.date === t, dots = el("div", { class: "dots", "aria-hidden": "true" });
      day.tasks.forEach((_, i) => dots.append(el("i", { class: S.tasks[day.date + "#" + i] ? "on" : "" })));
      pw.append(el("div", { class: "pday" + (isT ? " today" : "") }, el("div", { class: "d" }, el("b", { text: f.md }), f.dow + (isT ? " · today" : "")), el("details", { open: isT }, el("summary", { text: day.title }), taskList(day)), dots));
    });
    p.append(el("div", {}, el("div", { class: "row between", style: "margin-bottom:12px" }, el("h3", { text: "Final sprint: day by day" }), el("span", { class: "muted", style: "font-size:13px", text: "Each task is worth 15 XP" })), pw));
  }

  /* ================= Shared question rendering ================= */
  function stem(q, parts) {
    const frag = document.createDocumentFragment();
    if (parts !== "prompt") {
      if (q.p) frag.append(el("div", { class: "passage", text: q.p }));
      if (q.table) frag.append(dataTable(q.table));
      if (q.chart) frag.append(chartView(q.chart));
    }
    if (parts !== "passage") frag.append(el("div", { class: "prompt", text: q.q }));
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
      const b = el("button", { class: cls, disabled: !!o.reveal, "aria-pressed": String(o.picked === k), onclick: () => o.onPick(k) }, el("span", { class: "l", text: LETTERS[k] }), el("span", { text: txt }));
      if (o.onStrike && !o.reveal) wrap.append(el("div", { class: "optw" }, b, el("button", { class: "strike", "aria-pressed": String(!!struck), title: "Cross out choice " + LETTERS[k], "aria-label": "Cross out choice " + LETTERS[k], onclick: () => o.onStrike(k) }, "✕")));
      else wrap.append(b);
    });
    return wrap;
  }
  function explainBox(q, picked) {
    const ok = isRight(q, picked);
    return el("div", { class: "explain" + (ok ? "" : " miss") },
      el("strong", { text: ok ? "Correct." : picked == null || picked === "" ? "No answer. The answer is " + answerText(q) + "." : "Not quite. The answer is " + answerText(q) + "." }),
      el("p", { text: q.e }), q.t ? el("p", { class: "tip" }, el("b", { text: "Tip: " }), q.t) : null);
  }

  /* ================= Practice ================= */
  let P = null, pTick = null;
  function startPractice(doms, count, diff, notebook) {
    if (GUEST) {
      if ((S.samples.practice || 0) >= SAMPLE_LIMIT) { renderPractice(); return; }
      S.samples.practice = (S.samples.practice || 0) + 1; count = 5; notebook = false; diff = "auto";
    }
    let qs = [];
    const used = new Set();
    if (notebook) qs = S.mistakes.slice(0, 15).map((m) => Object.assign({}, m, { uid: uid() }));
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
    P = { qs, i: 0, pick: null, done: false, results: [], start: Date.now(), timed: S.prefs.timed, notebook: !!notebook, doms, count, diff, strikes: new Set() };
    clearInterval(pTick); pTick = setInterval(tickPractice, 1000);
    if (TAB !== "practice") show("practice"); else renderPractice();
  }
  function tickPractice() {
    const e = $("#ptimer"); if (!e || !P || P.finished) return;
    const s = (Date.now() - P.start) / 1000, target = P.qs.slice(0, P.i + 1).reduce((a, q) => a + DOM[q.d].pace, 0);
    e.textContent = mmss(s) + " · target " + mmss(target); e.classList.toggle("over", s > target);
  }
  function renderPractice() {
    const p = $("#p-practice"); p.textContent = "";
    if (P && !P.finished) return practiceQuestion(p);
    if (P && P.finished) p.append(practiceSummary());
    practiceSetup(p);
  }
  function practiceSetup(p) {
    if (GUEST && (S.samples.practice || 0) >= SAMPLE_LIMIT) return guestGate(p, "sample practice sets");
    const pr = S.prefs, top3 = focusList().slice(0, 3).map((d) => d.id);
    if (!pr.sel.length) pr.sel = [top3[0]];
    p.append(el("div", {}, el("h2", { text: GUEST ? "Sample practice set" : "Practice by skill" }), el("p", { class: "muted lede", text: (GUEST ? "Try 5 questions on any skill, with the answer and a full explanation after each one. " : "") + "Pick the skills to work on (for example, the weak areas from your Bluebook score report). Every question is new: math is generated with fresh numbers each time, and reading questions don't repeat until the bank runs out. You see the answer and explanation right after each question." })));
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
      el("button", { class: "btn primary", disabled: !pr.sel.length, onclick: () => startPractice(pr.sel, pr.count, pr.diff) }, pr.sel.length ? "Start " + pr.count + " questions" : "Pick at least one skill"),
      el("button", { class: "btn", disabled: !S.mistakes.length, onclick: () => startPractice([], 0, "auto", true) }, "Mistake notebook (" + S.mistakes.length + ")")));
  }
  function practiceQuestion(p) {
    const q = P.qs[P.i], d = DOM[q.d];
    const card = el("div", { class: "card qcard" });
    card.append(el("div", { class: "q-head" },
      el("div", {}, el("div", { class: "eyebrow", text: (P.notebook ? "Mistake notebook · " : "") + d.name + (q.sk ? " · " + q.sk : "") }), el("strong", { class: "num", text: "Question " + (P.i + 1) + " of " + P.qs.length })),
      P.timed ? el("span", { class: "timer", id: "ptimer", text: "0:00" }) : null));
    card.append(stem(q));
    const submit = () => {
      if (P.done || P.pick == null || P.pick === "") return;
      P.done = true; const ok = isRight(q, P.pick);
      P.results.push({ q, ok, pick: P.pick }); record(q, ok);
      if (ok) addXP(10, "correct"); bumpStreak(); save(); renderHeader(); renderPractice();
    };
    card.append(answerArea(q, {
      picked: P.pick, reveal: P.done, strikes: P.strikes,
      onPick: (v) => { if (P.done) return; P.pick = v; if (q.type !== "spr") renderPractice(); else { const b = $("#checkBtn"); if (b) b.disabled = !v; } },
      onStrike: (k) => { P.strikes.has(k) ? P.strikes.delete(k) : P.strikes.add(k); renderPractice(); },
      onEnter: submit
    }));
    if (!P.done) {
      card.append(el("div", { class: "row" }, el("button", { class: "btn primary", id: "checkBtn", disabled: P.pick == null || P.pick === "", onclick: submit }, "Check answer"),
        el("button", { class: "btn ghost", onclick: () => { P.pick = null; P.done = true; P.results.push({ q, ok: false, pick: null, skipped: true }); record(q, false); save(); renderPractice(); } }, "Skip")));
    } else {
      card.append(explainBox(q, P.pick));
      card.append(el("div", { class: "row" }, el("button", { class: "btn primary", id: "nextBtn", onclick: nextPractice }, P.i + 1 < P.qs.length ? "Next question" : "See results")));
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
    save(); render();
  }
  function practiceSummary() {
    const n = P.results.length, c = P.results.filter((r) => r.ok).length, miss = n - c;
    const byDom = {}; P.results.forEach((r) => { const b = byDom[r.q.d] || (byDom[r.q.d] = [0, 0]); b[1]++; if (r.ok) b[0]++; });
    return el("div", { class: "card", style: "display:grid;gap:14px" },
      el("div", { class: "eyebrow", text: "Set result" }),
      el("div", { class: "row", style: "gap:24px;align-items:end" }, el("span", { class: "result-big num", text: c + "/" + n }), el("span", { class: "muted", text: "Time " + mmss(P.elapsed) })),
      el("div", { class: "row" }, Object.entries(byDom).map(([d, [cc, tt]]) => el("span", { class: "chip " + status(cc / tt)[0], text: DOM[d].name + ": " + cc + "/" + tt }))),
      el("p", { text: miss === 0 ? withName("Perfect set") + ". Try Harder difficulty next." : (c / n >= 0.8 ? withName("Nice work") + ". " : (who() ? who() + ", " : "")) + miss + (miss === 1 ? " miss went" : " misses went") + " to the Mistake notebook. Retry " + (miss === 1 ? "it" : "them") + " tomorrow." }),
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
  function mockSetup(p) {
    if (GUEST) return guestMockSetup(p);
    const fmt = S.settings.kind;
    p.append(el("div", {}, el("h2", { text: "Mock test" }), el("p", { class: "muted lede", text: "A full-length practice test in the real digital format: two timed modules per section, and Module 2 adapts to how you did on Module 1. Answers are revealed only at the end. Every mock uses new questions, and the results feed the Skill matrix automatically." })));
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
    const card = (title, desc, parts) => el("button", { class: "mode", onclick: () => startMock(pick.kind, parts, pick.timed) }, el("b", { text: title }), el("span", { text: desc }));
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
    const hasLeft = !!(q.p || q.table || q.chart);
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
      host.append(el("div", { class: "panelpop", role: "dialog", "aria-label": "Calculator" }, el("header", {}, el("strong", { text: "Calculator" }), close), out, inp, keys, el("small", { class: "muted", text: "For graphing, use Desmos (opens in a new tab)." })));
      inp.focus();
    } else {
      const rows = [["Circle", "A = πr²,  C = 2πr"], ["Rectangle", "A = ℓw"], ["Triangle", "A = ½bh"], ["Pythagorean theorem", "c² = a² + b²"], ["Special right triangles", "30°-60°-90°: x, x√3, 2x  ·  45°-45°-90°: s, s, s√2"], ["Rectangular prism", "V = ℓwh"], ["Cylinder", "V = πr²h"], ["Sphere", "V = (4/3)πr³"], ["Cone", "V = (1/3)πr²h"], ["Pyramid", "V = (1/3)ℓwh"], ["Circle facts", "360° in a circle = 2π radians"], ["Triangle angles", "Sum of angles = 180°"]];
      host.append(el("div", { class: "panelpop", role: "dialog", "aria-label": "Reference sheet" }, el("header", {}, el("strong", { text: "Reference sheet" }), close), el("div", { class: "ref" }, rows.map(([a, b]) => el("div", {}, el("b", { text: a }), el("span", { class: "num", text: b }))))));
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
    p.append(el("div", {}, el("h2", { text: "Skill matrix" }), el("p", { class: "muted lede", text: "Mastery blends the most recent test (60%) with practice accuracy (40%). Tests include Bluebook tests you log and mock tests taken here. Practice accuracy counts once a skill has at least 3 answers. Strong is 80% or better, Building is 60–79%, Focus is below 60%." })));
    const tiles = el("div", { class: "tiles" });
    const scored = S.tests.filter((t) => t.total || t.rw || t.math);
    const last = scored[scored.length - 1], first = scored[0];
    if (last) {
      if (last.total) tiles.append(tile("Latest total", last.total, (last.source === "app" ? "estimated · " : "") + last.name));
      if (last.rw) tiles.append(tile("Reading and Writing", last.rw, last.source === "app" ? "estimated" : "Bluebook"));
      if (last.math) tiles.append(tile("Math", last.math, last.source === "app" ? "estimated" : "Bluebook"));
      const withTot = scored.filter((t) => t.total);
      if (withTot.length > 1) { const dl = withTot[withTot.length - 1].total - withTot[0].total; tiles.append(tile("Change since first test", (dl >= 0 ? "+" : "") + dl, "points", dl >= 0 ? "up" : "down")); }
    } else tiles.append(el("div", { class: "tile", style: "grid-column:1/-1" }, el("strong", { text: "No test yet" }), el("span", { class: "muted", text: "Log a Bluebook test or take a mock test here to fill in scores." })));
    const ans = DOMAINS.reduce((s, d) => s + (S.stats[d.id]?.att || 0), 0), cor = DOMAINS.reduce((s, d) => s + (S.stats[d.id]?.cor || 0), 0);
    tiles.append(tile("Practice accuracy", ans ? pct(cor / ans) : "—", ans + " answered"));
    if (S.settings.target) { const lt = latestTotal(); const gap = lt ? S.settings.target - lt.total : null; tiles.append(tile("Target score", S.settings.target, lt ? (gap > 0 ? gap + " points to go" : "reached") : "take a test to compare", lt && gap <= 0 ? "up" : "")); }
    p.append(tiles);
    const fl = focusList().filter((d) => mastery(d.id) != null && mastery(d.id) < 0.8).slice(0, 3);
    p.append(el("div", { class: "card" }, el("h3", { text: "Focus next" }), fl.length ? el("div", { class: "row", style: "margin-top:12px" }, fl.map((d, i) => el("button", { class: "btn small", onclick: () => { S.prefs.sel = [d.id]; save(); show("practice"); startPractice([d.id], 10, "auto"); } }, (i + 1) + ". " + d.name + " · " + pct(mastery(d.id))))) : el("p", { class: "muted", style: "margin-top:.4em", text: "Take a test or practice a few sets and the weakest skills will show up here." })));
    const tb = el("tbody");
    for (const [sec, name] of [["rw", "Reading and Writing"], ["math", "Math"]]) {
      tb.append(el("tr", { class: "grp" }, el("td", { colspan: "6", text: name })));
      DOMAINS.filter((d) => d.sec === sec).forEach((d) => {
        const m = mastery(d.id), [c, l] = status(m), r = S.stats[d.id], td = latestTestDom(d.id);
        tb.append(el("tr", {}, el("td", {}, el("strong", { text: d.name }), el("div", { class: "muted", style: "font-size:12px", text: d.what })),
          el("td", { class: "num", text: "≈" + d.n }),
          el("td", { class: "num", text: td ? pct(td.c / td.t) + " (" + td.c + "/" + td.t + ")" : "—" }),
          el("td", { class: "num", text: r ? pct(r.cor / r.att) + " (" + r.cor + "/" + r.att + ")" : "—" }),
          el("td", {}, mbar(m, c)), el("td", {}, el("span", { class: "chip " + c, text: l }))));
      });
    }
    p.append(el("div", { class: "card", style: "padding:6px 8px" }, el("div", { class: "tablewrap" }, el("table", { class: "mx" }, el("thead", {}, el("tr", {}, ["Skill", "On the test", "Latest test", "Practice", "Mastery", "Status"].map((h) => el("th", { text: h })))), tb))));
    const subs = Object.entries(S.sub).filter(([, v]) => v.att >= 3).map(([k, v]) => ({ k: k.split("|")[0], d: k.split("|")[1], a: v.cor / v.att, n: v.att })).sort((x, y) => x.a - y.a).slice(0, 12);
    if (subs.length) p.append(el("div", { class: "card", style: "display:grid;gap:12px" }, el("h3", { text: "Question types to watch" }), el("p", { class: "muted", style: "font-size:13px", text: "The narrower question types you miss most (at least 3 attempts each)." }),
      el("div", { class: "subs" }, subs.map((s) => el("div", { class: "sub" }, el("span", {}, el("strong", { text: s.k }), el("span", { class: "muted", text: " · " + DOM[s.d].name.split(" ")[0] })), el("span", { class: "chip " + status(s.a)[0], text: pct(s.a) + " of " + s.n }))))));
    if (S.tests.length) {
      const h = el("div", { class: "card", style: "display:grid;gap:10px" }, el("h3", { text: "Test history" }));
      S.tests.slice().reverse().forEach((x) => h.append(el("div", { class: "row between", style: "border-bottom:1px solid var(--line);padding-bottom:8px" },
        el("span", {}, el("strong", { text: x.name }), el("span", { class: "muted", text: " · " + fmtDay(x.date).md + (x.source === "app" ? " · estimated" : "") })),
        el("span", { class: "num", text: [x.rw ? "RW " + x.rw : "", x.math ? "Math " + x.math : "", x.total ? "Total " + x.total : ""].filter(Boolean).join(" · ") }),
        el("button", { class: "btn small ghost", onclick: () => { S.tests = S.tests.filter((y) => y.id !== x.id); save(); render(); toast("Removed " + x.name); } }, "Remove"))));
      p.append(h);
    }
  }

  /* ================= Log a Bluebook test ================= */
  function renderLog() {
    const p = $("#p-log"); p.textContent = "";
    const bb = S.tests.filter((t) => t.source !== "app").length + 1;
    const kindSel = el("select", { id: "tKind" }, el("option", { value: "psat", text: "PSAT/NMSQT (160–760 per section)" }), el("option", { value: "sat", text: "SAT (200–800 per section)" }));
    kindSel.value = S.settings.kind;
    const nameIn = el("input", { type: "text", id: "tName", value: "Bluebook Practice Test " + bb, maxlength: "60" });
    const f = el("form", { class: "card form", novalidate: true });
    f.append(el("div", {}, el("h2", { text: "Log a Bluebook test" }), el("p", { class: "muted lede", text: "After a full test in Bluebook, open the score report in My Practice. Enter the two section scores, then count how many questions you missed in each skill domain (the report labels every question with its domain). Logging a test is worth 100 XP." })));
    f.append(el("div", { class: "fields" }, el("label", { class: "f" }, "Test name", nameIn), el("label", { class: "f" }, "Test type", kindSel), el("label", { class: "f" }, "Date taken", el("input", { type: "date", id: "tDate", value: today() })),
      el("label", { class: "f" }, "Reading and Writing score", el("input", { type: "number", id: "tRw", step: "10", inputmode: "numeric", placeholder: "e.g. 580" })),
      el("label", { class: "f" }, "Math score", el("input", { type: "number", id: "tMath", step: "10", inputmode: "numeric", placeholder: "e.g. 560" }))));
    for (const [sec, lab] of [["rw", "Reading and Writing: questions missed"], ["math", "Math: questions missed"]]) {
      f.append(el("div", { class: "eyebrow", text: lab }));
      f.append(el("div", { class: "fields" }, DOMAINS.filter((d) => d.sec === sec).map((d) => el("label", { class: "f" }, d.name, el("small", { text: "out of about " + d.n }), el("input", { type: "number", id: "m-" + d.id, min: "0", max: String(d.n + 4), value: "0", inputmode: "numeric" })))));
    }
    const err = el("p", { class: "err", role: "alert" });
    f.append(err, el("div", { class: "row" }, el("button", { class: "btn primary", type: "submit" }, "Save test")));
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const kind = kindSel.value, lo = FORMATS[kind].lo, hi = FORMATS[kind].hi, rw = +$("#tRw").value, math = +$("#tMath").value;
      if (!(rw >= lo && rw <= hi && math >= lo && math <= hi)) { err.textContent = "Enter both section scores between " + lo + " and " + hi + "."; return; }
      const dom = {};
      for (const d of DOMAINS) { const v = Math.round(+$("#m-" + d.id).value); if (!(v >= 0)) { err.textContent = "Missed counts must be 0 or more."; return; } dom[d.id] = { c: Math.max(0, d.n - v), t: d.n }; }
      S.tests.push({ id: uid(), source: "bluebook", kind, name: nameIn.value.trim() || "Bluebook test", date: $("#tDate").value || today(), rw, math, total: rw + math, dom });
      S.tests.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
      logMock(2); checkGoalScore(rw + math);
      addXP(100, "Bluebook test logged"); award("baseline"); if (S.tests.filter((t) => t.source !== "app").length >= 2) award("rehearsal"); bumpStreak(); save(); show("matrix");
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
        el("span", { class: "muted", style: "font-size:13px", text: "Earn XP: 10 per correct practice answer, 20 per finished set, 15 per plan task, 100 per mock section or logged Bluebook test, 200 for a full mock." }))));
    const bg = el("div", { class: "badges" });
    BADGES.forEach((b) => { const on = !!S.badges[b.id]; bg.append(el("div", { class: "badge" + (on ? " on" : "") }, el("div", { class: "seal", text: b.s }), el("b", { text: b.name }), el("span", { text: on ? "Earned " + fmtDay(S.badges[b.id]).md : b.how }))); });
    p.append(el("div", {}, el("div", { class: "row between", style: "margin-bottom:12px" }, el("h3", { text: "Badges" }), el("span", { class: "muted num", text: Object.keys(S.badges).length + " of " + BADGES.length })), bg));
    const list = el("div", { class: "rw-list" });
    S.rewards.slice().sort((a, b) => a.xp - b.xp).forEach((r) => {
      const ready = S.xp >= r.xp && !r.claimed;
      list.append(el("div", { class: "rwd" + (ready ? " ready" : "") + (r.claimed ? " claimed" : "") }, el("span", { class: "x", text: r.xp + " XP" }),
        el("span", {}, el("strong", { text: r.label }), el("div", { class: "muted", style: "font-size:12px", text: r.claimed ? "Claimed" : ready ? "Unlocked. Claim it with Dad." : r.xp - S.xp + " XP to go" })),
        el("div", { class: "row acts", style: "gap:6px" }, ready ? el("button", { class: "btn small primary", onclick: () => { r.claimed = true; save(); render(); toast("Enjoy it: " + r.label, true); } }, "Claim") : null,
          el("button", { class: "btn small ghost", onclick: () => { S.rewards = S.rewards.filter((x) => x.id !== r.id); save(); render(); } }, "Remove"))));
    });
    const lab = el("input", { type: "text", id: "rLabel", placeholder: "e.g. Extra hour of gaming", maxlength: "80" }), xp = el("input", { type: "number", id: "rXp", min: "50", step: "50", value: "750", inputmode: "numeric" });
    const addF = el("form", { class: "fields", style: "margin-top:14px" }, el("label", { class: "f" }, "New reward", lab), el("label", { class: "f" }, "Unlocks at XP", xp), el("div", { style: "display:flex;align-items:end" }, el("button", { class: "btn", type: "submit" }, "Add reward")));
    addF.addEventListener("submit", (e) => { e.preventDefault(); const v = lab.value.trim(), x = +xp.value; if (!v || !(x > 0)) return; S.rewards.push({ id: uid(), xp: Math.round(x), label: v, claimed: false }); save(); render(); });
    p.append(el("div", { class: "card" }, el("h3", { text: "Rewards from Dad" }), el("p", { class: "muted", style: "margin:.3em 0 14px", text: "Real rewards unlock at XP milestones. Edit them to whatever works in your house." }), list, addF));
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
    const kind = el("select", { id: "setKind" }, el("option", { value: "psat", text: "PSAT/NMSQT" }), el("option", { value: "sat", text: "SAT" })); kind.value = S.settings.kind;
    const date = el("input", { type: "date", id: "setDate", value: S.settings.date });
    const nm = el("input", { type: "text", id: "setName", value: S.settings.name || "", maxlength: "30", autocomplete: "off" });
    const tg = el("input", { type: "number", id: "setTarget", min: "320", max: "1600", step: "10", inputmode: "numeric", placeholder: "e.g. 1300", value: S.settings.target || "" });
    const f = el("form", { class: "panelpop", role: "dialog", "aria-label": "Settings" }, el("header", {}, el("strong", { text: "Settings" }), el("button", { type: "button", class: "btn small ghost", onclick: () => (host.textContent = "") }, "Close")),
      el("label", { class: "f", for: "setName" }, "Student's first name", nm), el("label", { class: "f" }, "Test", kind), el("label", { class: "f" }, "Test date", date), el("label", { class: "f", for: "setTarget" }, "Target score (optional)", tg), el("button", { class: "btn primary", type: "submit" }, "Save"));
    f.addEventListener("submit", (e) => { e.preventDefault(); if (date.value) S.settings.date = date.value; S.settings.kind = kind.value; S.settings.name = nm.value.trim(); { const v = Math.round(+tg.value / 10) * 10; S.settings.target = v >= 320 && v <= 1600 ? v : null; } save(); for (const fn of settingsHooks) { try { fn(S.settings); } catch (x) { } } host.textContent = ""; render(); toast("Settings saved"); });
    host.append(f);
  });
  function confirmPop(msg, yes, fn) {
    const host = $("#pop"); host.textContent = "";
    host.append(el("div", { class: "panelpop", role: "dialog", "aria-label": "Confirm" }, el("strong", { text: "Are you sure?" }), el("p", { text: msg }),
      el("div", { class: "row" }, el("button", { class: "btn primary", onclick: () => { host.textContent = ""; fn(); } }, yes), el("button", { class: "btn ghost", onclick: () => (host.textContent = "") }, "Cancel"))));
  }

  /* ================= Boot ================= */
  try { const t = sessionStorage.getItem(KEY + "-tab"); if (t && document.getElementById("p-" + t)) TAB = t; } catch (e) { }
  if (GUEST && !["today", "practice", "mock"].includes(TAB)) TAB = "today";
  if (S.mock && S.mock.phase !== "done") TAB = "mock";
  show(TAB);
  window.__psat = { get state() { return S; }, calc };
  window.PSApp = {
    get state() { return S; },
    blank,
    // Replace progress with a newer copy (from the cloud) without triggering another upload.
    replace(next) { if (GUEST) return; HOLD = false; S = Object.assign(blank(), next); S.prefs = Object.assign(blank().prefs, S.prefs); S.settings = Object.assign(blank().settings, S.settings); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } render(); },
    get guest() { return GUEST; },
    // Switch between the public site (signed out) and a student's own progress (signed in).
    setGuest(g) {
      g = !!g; if (g === GUEST) return;
      GUEST = g; HOLD = false; P = null; clearInterval(pTick); clearInterval(mTick); tool = null;
      const pop = document.getElementById("pop"); if (pop) pop.textContent = "";
      S = load(storeKey());
      TAB = !GUEST && S.mock && S.mock.phase !== "done" ? "mock" : "today";
      show(TAB);
    },
    onSave(fn) { saveHooks.push(fn); },
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
      if (p.kind && p.kind !== S.settings.kind) { S.settings.kind = p.kind; changed = true; }
      if (p.date && p.date !== S.settings.date) { S.settings.date = p.date; changed = true; }
      if (p.target !== undefined && p.target !== S.settings.target) { S.settings.target = p.target; changed = true; }
      if (changed) { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } render(); }
    },
    // Remove this device's copy (the account keeps its copy in the cloud).
    reset() { try { localStorage.removeItem(KEY); } catch (e) { } if (!GUEST) { P = null; S = blank(); render(); } },
    save, render, toast,
    get busy() { return !GUEST && (!!(S.mock && S.mock.phase !== "done") || !!(P && !P.finished)); }
  };
  document.dispatchEvent(new Event("psapp-ready"));
})();
