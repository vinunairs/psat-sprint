/* FAST Prep — practice engine (no DOM): answer checking, adaptive levels, mastery,
   the daily mission builder, rewards math. Works in the browser and in Node tests. */
(function (root) {
  "use strict";
  const SK = root.FASTSkills, FIG = root.FASTFig;
  const BANK = () => root.FAST_BANK || {};
  const GEN = () => Object.assign({}, root.FASTMath4 || {}, root.FASTMath5 || {});

  /* ---------- state ---------- */
  function blank() {
    return {
      v: 1, owner: null, updatedAt: 0, created: null,
      skills: {},      // id → { n, c, h: [0/1 last 20], lv: 1-3, run: correct streak, miss: wrong streak, at: date }
      ir: {},          // i-Ready domain → { n, c, h }
      days: {},        // date → { q, c, sec, set, sets, sub: {math,reading,writing,stretch: [n,c]}, sk: {id: [n,c]}, essays, coins }
      seen: {},        // bank → [item ids] already served (cycle through before repeating)
      passages: {},    // passage id → { at, n, c }
      coins: 0, xp: 0,
      streak: { cur: 0, best: 0, last: null },
      owned: [], buddy: null, moves: ["bounce"], move: "bounce", forms: [],
      essays: [],      // { id, prompt, mode, text, words, at, self: {w.org, w.evid, w.conv}, checks }
      claims: [],      // { id, label, cost, at }
      fixit: [],       // skill ids missed recently, served first next time
      drafts: {},      // essay drafts by prompt id: { plan, text, at }
      run: null,       // unfinished daily mission (resumes where she left off)
      settings: { name: "", sound: true, bigText: false }
    };
  }
  function normalize(s) { const b = blank(); s = Object.assign(b, s || {}); for (const k of Object.keys(b)) if (s[k] == null) s[k] = b[k]; s.settings = Object.assign(blank().settings, s.settings || {}); return s; }
  const today = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const addDays = (date, n) => { const d = new Date(date + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

  /* ---------- answer checking ---------- */
  function parseNum(s) {
    s = String(s == null ? "" : s).trim().replace(/[−–]/g, "-").replace(/[$,]/g, "").replace(/\s+/g, " ").replace(/[a-z°]+\.?$/i, "").trim();
    let m;
    if ((m = s.match(/^(-?\d+) (\d+)\/(\d+)$/))) return +m[1] + (+m[2] / +m[3]) * (m[1].startsWith("-") ? -1 : 1);
    if ((m = s.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/))) return +m[2] === 0 ? NaN : +m[1] / +m[2];
    if (/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return +s;
    return NaN;
  }
  function parseRem(s) {
    const m = String(s || "").trim().match(/^(\d[\d,]*)\s*(?:(?:r|rem|remainder)\.?\s*(\d+))?$/i);
    return m ? [+m[1].replace(/,/g, ""), m[2] ? +m[2] : 0] : null;
  }
  // response: number index | [i, j] | { a, b } (two-part) | string (typed)
  function check(item, resp) {
    if (item.t === "num") { const x = parseNum(resp), y = parseNum(item.ans); return !isNaN(x) && Math.abs(x - y) < 1e-9; }
    if (item.t === "rem") { const x = parseRem(resp), y = parseRem(item.ans); return !!x && x[0] === y[0] && x[1] === y[1]; }
    if (item.b) { return resp && resp.a === item.a && resp.b === item.b.a; }
    if (Array.isArray(item.a)) { if (!Array.isArray(resp) || resp.length !== item.a.length) return false; const r = resp.slice().sort(); return item.a.slice().sort().every((v, i) => v === r[i]); }
    return resp === item.a;
  }
  // Partial credit for two-part (Part A right, B wrong) — FAST gives partial credit too.
  function partial(item, resp) { return !!(item.b && resp && resp.a === item.a && resp.b !== item.b.a); }

  /* ---------- items ---------- */
  let uidSeq = 0;
  function fromGen(skill, lv, R) {
    const g = GEN()[skill]; if (!g) throw new Error("no generator " + skill);
    R = R || FIG.rng();
    for (let tries = 0; tries < 8; tries++) {
      try {
        const q = g(R, lv);
        if (q && q.q && (q.t || (q.o && q.a != null))) return Object.assign({ uid: "g" + Date.now().toString(36) + (uidSeq++), src: "gen", skill, lv, stretch: !!SK.SKILLS[skill].stretch }, q);
      } catch (e) { if (tries === 7) throw e; }
    }
    throw new Error("generator failed " + skill);
  }
  // Shuffle a bank question's options (and Part B) so positions aren't memorized.
  function shuffleItem(q, R) {
    const idx = R.shuffle(q.o.map((_, i) => i)), o = idx.map((i) => q.o[i]);
    const a = Array.isArray(q.a) ? q.a.map((x) => idx.indexOf(x)).sort((x, y) => x - y) : idx.indexOf(q.a);
    const out = Object.assign({}, q, { o, a });
    if (q.b) { const j = R.shuffle(q.b.o.map((_, i) => i)); out.b = Object.assign({}, q.b, { o: j.map((i) => q.b.o[i]), a: j.indexOf(q.b.a) }); }
    return out;
  }
  function fromBank(q, R, extra) {
    return Object.assign(shuffleItem(q, R || FIG.rng()), { uid: "b" + q.id + "-" + (uidSeq++), src: "bank", bid: q.id, lv: q.lv || 4, stretch: (q.lv || 4) >= 5 }, extra || {});
  }
  function markSeen(S, bank, id) { const a = (S.seen[bank] = S.seen[bank] || []); if (!a.includes(id)) a.push(id); if (a.length > 3000) a.splice(0, a.length - 3000); }
  // Pick n unseen items from a list (resetting the cycle when everything matching has been seen).
  function pickUnseen(S, bank, list, n, R) {
    const seen = new Set(S.seen[bank] || []);
    let fresh = list.filter((x) => !seen.has(x.id));
    if (fresh.length < n) { S.seen[bank] = (S.seen[bank] || []).filter((id) => !list.some((x) => x.id === id)); fresh = list.slice(); }
    return R.sample(fresh, n);
  }

  /* ---------- mastery ---------- */
  const stat = (S, id) => (S.skills[id] = S.skills[id] || { n: 0, c: 0, h: [], lv: 2, run: 0, miss: 0, at: null });
  function score(S, id) {
    const s = S.skills[id]; if (!s || s.n < 3) return null;
    const h = s.h.slice(-10), c = h.reduce((a, b) => a + b, 0);
    return Math.round(((c + 0.5) / (h.length + 1)) * 100);
  }
  function stars(S, id) {
    const s = S.skills[id], sc = score(S, id); if (!s || sc == null || s.n < 5) return 0;
    if (sc >= 90 && s.lv >= 3 && s.n >= 10) return 3;
    if (sc >= 80 && s.lv >= 2) return 2;
    return sc >= 60 ? 1 : 0;
  }
  function band(sc) { return sc == null ? { k: "new", label: "Not started" } : sc >= 90 ? { k: "star", label: "Star" } : sc >= 80 ? { k: "strong", label: "Strong" } : sc >= 65 ? { k: "ok", label: "On track" } : { k: "grow", label: "Growing" }; }
  // Category score: practice-weighted average of skill scores (only skills with enough tries).
  function groupScore(S, ids) {
    let w = 0, t = 0, n = 0;
    for (const id of ids) { const sc = score(S, id); if (sc == null) continue; const k = Math.min(S.skills[id].n, 20); w += k; t += sc * k; n += S.skills[id].n; }
    return { score: w ? Math.round(t / w) : null, n, practiced: ids.filter((id) => score(S, id) != null).length, total: ids.length };
  }
  function catScore(S, cat, opts = {}) { return groupScore(S, SK.list((s) => s.cat === cat && (opts.stretch ? s.stretch : !s.stretch)).map((s) => s.id)); }
  function irScore(S, dom) { const s = S.ir[dom]; if (!s || s.n < 3) return { score: null, n: s ? s.n : 0 }; const h = s.h.slice(-30); return { score: Math.round(((h.reduce((a, b) => a + b, 0) + 0.5) / (h.length + 1)) * 100), n: s.n }; }

  /* ---------- recording an answer ---------- */
  const SUBJ = (item) => (item.stretch ? "stretch" : SK.SKILLS[item.skill].subj);
  function record(S, item, correct, secs, date) {
    date = date || today();
    const s = stat(S, item.skill), credit = correct === true ? 1 : correct === "half" ? 0.5 : 0, ok = credit === 1;
    s.n++; s.c += credit; s.h.push(ok ? 1 : 0); if (s.h.length > 20) s.h.shift(); s.at = date;
    let leveled = 0;
    if (item.src === "gen") {
      if (ok) { s.run++; s.miss = 0; if (s.run >= 3 && s.lv < 3 && item.lv >= s.lv) { s.lv++; s.run = 0; leveled = 1; } }
      else { s.miss++; s.run = 0; if (s.miss >= 2 && s.lv > 1) { s.lv--; s.miss = 0; leveled = -1; } }
    } else { if (ok) { s.run++; s.miss = 0; } else { s.miss++; s.run = 0; } }
    const dom = SK.iReadyOf(item.skill, item.genre);
    if (dom) { const r = (S.ir[dom] = S.ir[dom] || { n: 0, c: 0, h: [] }); r.n++; r.c += credit; r.h.push(ok ? 1 : 0); if (r.h.length > 40) r.h.shift(); }
    const d = day(S, date), sub = SUBJ(item);
    d.q++; d.c += credit; d.sec += Math.max(0, Math.min(600, Math.round(secs || 0)));
    d.sub[sub] = d.sub[sub] || [0, 0]; d.sub[sub][0]++; d.sub[sub][1] += credit;
    d.sk[item.skill] = d.sk[item.skill] || [0, 0]; d.sk[item.skill][0]++; d.sk[item.skill][1] += credit;
    if (!ok) { S.fixit = [item.skill, ...S.fixit.filter((x) => x !== item.skill)].slice(0, 8); }
    else if (s.run >= 2) S.fixit = S.fixit.filter((x) => x !== item.skill);
    if (item.bid) markSeen(S, item.bank || "items", item.bid);
    const coins = ok ? (item.stretch ? 15 : 10) : credit ? 5 : 1; // effort always earns a little
    earn(S, coins, date);
    touchStreak(S, date);
    return { coins, leveled, lv: s.lv };
  }
  function day(S, date) { return (S.days[date] = S.days[date] || { q: 0, c: 0, sec: 0, set: 0, sets: 0, sub: {}, sk: {}, essays: 0, coins: 0 }); }
  function earn(S, n, date) { S.coins += n; S.xp += n; day(S, date || today()).coins += n; }
  function touchStreak(S, date) {
    const st = S.streak; if (st.last === date) return false;
    st.cur = st.last === addDays(date, -1) ? st.cur + 1 : 1; st.last = date; st.best = Math.max(st.best, st.cur);
    return true;
  }
  function pruneDays(S, keep = 120) { const keys = Object.keys(S.days).sort(); while (keys.length > keep) delete S.days[keys.shift()]; }

  /* ---------- choosing what to practice ---------- */
  // Her school data says: math first; fractions and geometry/measurement were weakest; reading vocabulary and across-genres weakest.
  const PRIOR_WEAK = ["m.fr.equiv", "m.fr.compare", "m.fr.addsub", "m.gr.area", "m.m.convert", "v.context", "v.roots", "r.figurative", "r.summary", "r.compare"];
  function pathSkills() { return SK.list((s) => s.subj === "math" && !s.stretch); }
  // Current stop on the math path: the first skill (in order) with fewer than 2 stars.
  // After 25 tries without 2 stars the path moves on (the skill keeps coming back as a fix-it).
  function pathNext(S) { return pathSkills().find((s) => stars(S, s.id) < 2 && (!S.skills[s.id] || S.skills[s.id].n < 25)) || pathSkills().find((s) => stars(S, s.id) < 2) || pathSkills()[0]; }
  function weakList(S, subj) {
    const started = SK.list((s) => s.subj === subj && !s.stretch && score(S, s.id) != null);
    const weak = started.filter((s) => score(S, s.id) < 75).sort((a, b) => score(S, a.id) - score(S, b.id)).map((s) => s.id);
    const fix = S.fixit.filter((id) => SK.SKILLS[id] && SK.SKILLS[id].subj === subj && !SK.SKILLS[id].stretch);
    const prior = PRIOR_WEAK.filter((id) => SK.SKILLS[id].subj === subj && !S.skills[id]);
    return [...new Set([...fix, ...weak, ...prior])];
  }
  const lvFor = (S, id) => (S.skills[id] ? S.skills[id].lv : 2);
  function mathItems(S, ids, R) { return ids.map((id) => fromGen(id, lvFor(S, id), R)); }

  // Bank items for a skill (vocab / writing drills). lv: 4 or 5.
  function bankItems(S, bankName, skill, n, R, lv = 4) {
    const list = (BANK()[bankName] || []).filter((q) => (!skill || q.skill === skill) && (lv >= 5 ? (q.lv || 4) >= 5 : (q.lv || 4) < 5));
    if (!list.length) return [];
    return pickUnseen(S, bankName, list, Math.min(n, list.length), R).map((q) => fromBank(q, R, { bank: bankName }));
  }
  function wordPower(S, n, R, lv = 4) {
    const order = weakList(S, "reading").filter((id) => id.startsWith("v.") || id === "r.figurative");
    const skills = [...new Set([...order, "v.context", "v.roots", "r.figurative", "v.multi", "v.relations", "v.academic"])];
    const out = [];
    for (let i = 0; out.length < n && i < 40; i++) out.push(...bankItems(S, "vocab", skills[i % Math.min(skills.length, 4 + (i >> 2))], 1, R, lv).filter((q) => !out.some((x) => x.bid === q.bid)));
    return out.slice(0, n);
  }
  function writingDrill(S, n, R) {
    const order = weakList(S, "writing"), skills = [...new Set([...order, "w.conv", "w.evid", "w.org"])], out = [];
    for (let i = 0; out.length < n && i < 30; i++) out.push(...bankItems(S, "wdrill", skills[i % skills.length], 1, R).filter((q) => !out.some((x) => x.bid === q.bid)));
    return out.slice(0, n);
  }
  // One passage with its questions. genre: "prose" | "poetry" | "info" | "paired" | null (auto: weakest)
  function allPassages() { const B = BANK(); return [...(B.lit || []), ...(B.info || [])]; }
  function passageSet(S, genre, R, opts = {}) {
    const lv = opts.lv || 4;
    let pool = allPassages().filter((p) => (lv >= 5 ? p.lv >= 5 : (p.lv || 4) < 5));
    if (genre) pool = pool.filter((p) => p.genre === genre || (genre === "lit" && (p.genre === "prose" || p.genre === "poetry")));
    if (!pool.length) return null;
    const unread = pool.filter((p) => !S.passages[p.id]);
    const p = (unread.length ? R.pick(unread) : pool.slice().sort((a, b) => (S.passages[a.id].at < S.passages[b.id].at ? -1 : 1))[0]);
    let qs = p.qs.slice();
    if (opts.max && qs.length > opts.max) {
      const weak = new Set(weakList(S, "reading"));
      // Up to 2 weak-area questions first, then the rest, so every skill on the passage still gets practice.
      const tagged = qs.map((q, i) => ({ q, i, w: weak.has(q.skill) ? 0 : 1, r: R.f() })).sort((a, b) => a.r - b.r);
      const pick = [...tagged.filter((x) => x.w === 0).slice(0, 2)];
      for (const x of tagged) if (pick.length < opts.max && !pick.includes(x)) pick.push(x);
      qs = pick.sort((a, b) => a.i - b.i).map((x) => x.q);
    }
    return { passage: p, items: qs.map((q) => fromBank(q, R, { pid: p.id, genre: p.genre, bank: "passage", lv: p.lv || 4 })) };
  }

  /* ---------- the daily mission (10-15 minutes, weak areas first) ---------- */
  function mission(S, date, R) {
    R = R || FIG.rng();
    date = date || today();
    const dayNum = Math.round(Date.parse(date + "T12:00:00Z") / 864e5), passageDay = dayNum % 2 === 0;
    const items = [], plan = [];
    // 1) Warm-up: 2 quick wins (times facts or a fix-it skill at an easy level)
    const fixMath = weakList(S, "math");
    items.push(fromGen("m.md.facts", lvFor(S, "m.md.facts"), R));
    items.push(fixMath[0] && fixMath[0] !== "m.md.facts" ? fromGen(fixMath[0], Math.max(1, lvFor(S, fixMath[0]) - 1), R) : fromGen("m.fr.equiv", 1, R));
    items.forEach((it) => (it.tag = "Warm-up"));
    plan.push("Warm-up");
    // 2) Math: weak skills first, then the path skill, then a spaced review
    const next = pathNext(S).id, mastered = pathSkills().filter((s) => stars(S, s.id) >= 2 && s.id !== next).map((s) => s.id);
    const weak = fixMath.filter((id) => id !== next).slice(0, 2);
    const mathIds = [...weak.flatMap((id) => [id, id]).slice(0, 3)];
    while (mathIds.length < 5) mathIds.push(next);
    mathIds.push(mastered.length ? R.pick(mastered) : next);
    mathItems(S, mathIds, R).forEach((it, i) => { it.tag = i < weak.length * 2 && mathIds[i] !== next ? "Power-up" : mathIds[i] === next ? "Math path" : "Review"; items.push(it); });
    plan.push("Math");
    // 3) Reading: a passage on even days, Word Power + writing drills on odd days
    if (passageDay) {
      const r = weakList(S, "reading"), wantInfo = r.slice(0, 3).some((id) => ["r.textfeat", "r.central", "r.perspective", "r.claim"].includes(id));
      const genre = dayNum % 6 === 0 ? "paired" : wantInfo ? "info" : (dayNum % 4 === 0 ? "info" : "lit");
      const ps = passageSet(S, genre, R, { max: 4 }) || passageSet(S, null, R, { max: 4 });
      if (ps) { ps.items.forEach((it) => (it.tag = "Reading")); items.push(...ps.items); plan.push("Reading: " + ps.passage.title); }
      items.push(...wordPower(S, 1, R).map((it) => Object.assign(it, { tag: "Word Power" })));
    } else {
      items.push(...wordPower(S, 4, R).map((it) => Object.assign(it, { tag: "Word Power" })));
      items.push(...writingDrill(S, 2, R).map((it) => Object.assign(it, { tag: "Writing" })));
      plan.push("Word Power", "Writing");
    }
    // 4) Bonus Level Up question when she's on a roll (last 7 days ≥ 85%)
    const recent = Object.entries(S.days).filter(([d]) => d >= addDays(date, -7)).reduce((a, [, v]) => [a[0] + v.q, a[1] + v.c], [0, 0]);
    if (recent[0] >= 20 && recent[1] / recent[0] >= 0.85) {
      const st = SK.list((s) => s.stretch), pick = st.find((s) => stars(S, s.id) < 2) || R.pick(st);
      items.push(Object.assign(fromGen(pick.id, lvFor(S, pick.id), R), { tag: "Level Up bonus", bonus: true }));
    }
    return { date, kind: passageDay ? "passage" : "words", items, plan };
  }

  // Skill practice set (math path stop, a reading skill, a stretch skill)
  function practice(S, skill, n, R) {
    R = R || FIG.rng();
    const sk = SK.SKILLS[skill];
    if (sk.subj === "math") return Array.from({ length: n }, () => fromGen(skill, lvFor(S, skill), R));
    if (sk.subj === "writing") return bankItems(S, "wdrill", skill, n, R);
    // reading: vocab bank first, then passage questions of that skill
    let out = bankItems(S, "vocab", skill, n, R);
    if (out.length < n) {
      const ps = allPassages().filter((p) => (p.lv || 4) < 5 && p.qs.some((q) => q.skill === skill));
      for (const p of R.shuffle(ps)) { if (out.length >= n) break; const q = R.pick(p.qs.filter((x) => x.skill === skill)); out.push(fromBank(q, R, { pid: p.id, genre: p.genre, bank: "passage" })); }
    }
    return out.slice(0, n);
  }
  function stretchSet(S, n, R) {
    R = R || FIG.rng();
    const st = SK.list((s) => s.stretch), order = st.slice().sort((a, b) => (score(S, a.id) ?? -1) - (score(S, b.id) ?? -1));
    const ids = []; for (let i = 0; ids.length < n; i++) ids.push(order[i % Math.min(order.length, 3)].id);
    return ids.map((id) => fromGen(id, lvFor(S, id), R));
  }

  /* ---------- writing: quick automatic checks on an essay ---------- */
  const TRANS = ["first", "second", "third", "next", "then", "also", "another", "in addition", "for example", "for instance", "because", "however", "finally", "in conclusion", "as a result", "therefore", "on the other hand", "most importantly", "to sum up", "since"];
  function essayChecks(text, prompt) {
    const t = String(text || ""), lower = t.toLowerCase(), words = (t.match(/[A-Za-z']+/g) || []).length;
    const paras = t.split(/\n\s*\n|\n/).map((p) => p.trim()).filter((p) => p.split(/\s+/).length >= 8).length;
    const trans = TRANS.filter((w) => new RegExp("\\b" + w + "\\b", "i").test(t));
    const srcs = (prompt && prompt.sources) || [];
    const cites = srcs.filter((s) => lower.includes(s.title.toLowerCase().replace(/^["“]|["”]$/g, "").slice(0, 18)) || false).length + (/(according to|the (article|source|passage|text) (says|states|explains)|in source|source [12]|both sources)/i.test(t) ? 1 : 0);
    const kw = ((prompt && prompt.keywords) || []).filter((k) => lower.includes(String(k).toLowerCase()));
    const sentences = t.split(/[.!?]+/).filter((x) => x.trim().split(/\s+/).length >= 3);
    const capsOk = sentences.length ? sentences.filter((x) => /^\s*["“]?[A-Z]/.test(x)).length / sentences.length : 0;
    const quotes = (t.match(/["“][^"”]{6,}["”]/g) || []).length;
    return {
      words, paras, trans, cites: Math.min(cites, 2), kw, quotes, capsOk,
      list: [
        { ok: words >= 150, text: words >= 150 ? `${words} words — nice length!` : `${words} words. Aim for at least 150 (great essays are often 250+).` },
        { ok: paras >= 4, text: paras >= 4 ? `${paras} paragraphs` : `${paras} paragraph${paras === 1 ? "" : "s"}. Try 4–5: intro, 2–3 body paragraphs, conclusion.` },
        { ok: trans.length >= 3, text: trans.length >= 3 ? `Transitions: ${trans.slice(0, 5).join(", ")}` : "Add transitions like First, Another reason, For example, In conclusion." },
        { ok: cites >= 1, text: cites >= 1 ? "You named a source. 👍" : "Name your sources: \"According to the article …\"" },
        { ok: kw.length >= 3, text: kw.length >= 3 ? `You used facts from the sources (${kw.slice(0, 4).join(", ")}…)` : "Use more facts and details from the sources." },
        { ok: capsOk >= 0.9, text: capsOk >= 0.9 ? "Sentences start with capital letters." : "Check that every sentence starts with a capital letter." }
      ]
    };
  }

  /* ---------- rewards ---------- */
  const RANKS = [[0, "Trainee", "🌱"], [300, "Apprentice", "🎀"], [900, "Swift Blade", "🌀"], [2000, "Flame Guard", "🔥"], [3500, "Storm Guard", "⚡"], [5500, "Moon Guardian", "🌙"], [8000, "Sun Guardian", "☀️"], [12000, "Star Legend", "🌟"]];
  function rank(xp) { let i = 0; RANKS.forEach((r, k) => { if (xp >= r[0]) i = k; }); const nx = RANKS[i + 1]; return { i, name: RANKS[i][1], icon: RANKS[i][2], at: RANKS[i][0], next: nx ? { name: nx[1], at: nx[0], icon: nx[2] } : null }; }
  const MOVES = [["bounce", "Bounce", 0], ["wiggle", "Wiggle", 2], ["spin", "Spin", 4], ["sway", "Sway", 6], ["hop", "Bunny Hop", 9], ["twirl", "Twirl Jump", 13], ["wave", "The Wave", 20], ["moon", "Moon Glide", 30]]; // unlocked by best streak
  function unlockMoves(S) { const got = []; for (const [id, , need] of MOVES) if (S.streak.best >= need && !S.moves.includes(id)) { S.moves.push(id); got.push(id); } return got; }
  // "Forms" — badges for mastering a FAST category (every skill in it at 2+ stars)
  const FORMS = [
    ["NSOF", "Form of Flowing Fractions", "🍡"], ["GMD", "Form of the Steady Angle", "📐"], ["NSOW", "Form of Thunder Facts", "⚡"], ["AR", "Form of the Hidden Pattern", "🧩"],
    ["PROSE", "Form of the Story Wind", "📖"], ["INFO", "Form of the Clear Lantern", "🏮"], ["AGV", "Form of Whispering Words", "🌸"], ["WCONV", "Form of the Perfect Stroke", "🖌️"]];
  function checkForms(S) {
    const got = [];
    for (const [cat, name] of FORMS) {
      if (S.forms.includes(cat)) continue;
      const ids = SK.list((s) => s.cat === cat && !s.stretch).map((s) => s.id);
      if (ids.length && ids.every((id) => stars(S, id) >= 2)) { S.forms.push(cat); got.push(name); earn(S, 200); }
    }
    return got;
  }

  root.FASTEngine = { blank, normalize, today, addDays, parseNum, parseRem, check, partial, fromGen, fromBank, record, day, earn, touchStreak, pruneDays,
    score, stars, band, catScore, irScore, groupScore, pathNext, pathSkills, weakList, mission, practice, stretchSet, passageSet, wordPower, writingDrill, bankItems, allPassages,
    essayChecks, rank, RANKS, MOVES, unlockMoves, FORMS, checkForms, markSeen };
})(typeof window !== "undefined" ? window : globalThis);
