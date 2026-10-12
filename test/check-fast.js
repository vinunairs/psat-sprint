// FAST Prep checks: run with `node test/check-fast.js`.
// Generates thousands of math questions per skill and level, checks structure and answers,
// validates the hand-written banks, and simulates daily missions and answer recording.
global.window = global;
const path = require("path");
const load = (f) => require(path.join(__dirname, "..", "fast", "js", f));
["skills.js", "figs.js", "math4.js", "math5.js", "engine.js"].forEach(load);
for (const f of ["bank-lit.js", "bank-info.js", "bank-vocab.js", "bank-writing.js"]) { try { load(f); } catch (e) { if (e.code !== "MODULE_NOT_FOUND") throw e; console.log("(missing " + f + ")"); } }
const SK = FASTSkills, E = FASTEngine, FIG = FASTFig;
let fails = 0, total = 0;
const fail = (msg) => { if (fails++ < 40) console.log("FAIL", msg); };

// 1) Every math skill has a generator and every generator has a skill.
const G = Object.assign({}, FASTMath4, FASTMath5);
for (const s of SK.list((s) => s.subj === "math")) if (!G[s.id]) fail("no generator for " + s.id);
for (const id of Object.keys(G)) if (!SK.SKILLS[id]) fail("generator without skill " + id);

// 2) Generators: structure, distinct options, answer checks, no NaN/undefined text.
const R = FIG.rng(12345);
for (const id of Object.keys(G)) for (const lv of [1, 2, 3]) for (let i = 0; i < 1500; i++) {
  total++;
  let q;
  try { q = E.fromGen(id, lv, R); } catch (e) { fail(`${id} lv${lv} threw ${e.message}`); break; }
  const txt = JSON.stringify([q.q, q.o, q.e, q.ans]);
  if (/NaN|undefined|Infinity|\[object/.test(txt)) { fail(`${id} lv${lv} bad text: ${txt.slice(0, 200)}`); continue; }
  if (q.t === "num") { if (isNaN(E.parseNum(q.ans))) fail(`${id} lv${lv} unparseable ans ${q.ans}`); if (!E.check(q, q.ans)) fail(`${id} self-check ${q.ans}`); continue; }
  if (q.t === "rem") { if (!E.check(q, q.ans)) fail(`${id} rem self-check ${q.ans}`); continue; }
  if (!Array.isArray(q.o) || q.o.length < 2) { fail(`${id} lv${lv} options ${q.o}`); continue; }
  if (new Set(q.o).size !== q.o.length) fail(`${id} lv${lv} duplicate options ${q.o.join(" | ")}`);
  const as = Array.isArray(q.a) ? q.a : [q.a];
  if (as.some((a) => !(a >= 0 && a < q.o.length))) fail(`${id} lv${lv} answer index ${q.a} of ${q.o.length}: ${q.q}`);
  if (Array.isArray(q.a) && (q.a.length !== 2 || q.a[0] === q.a[1])) fail(`${id} choose-two ${q.a}`);
}

// 3) Spot-check computed answers for a few generators (independent recomputation).
const frac = (s) => E.parseNum(s.replace(/\[\[|\]\]/g, ""));
for (let i = 0; i < 2000; i++) {
  const q = E.fromGen("m.fr.addsub", 1, R), m = q.q.match(/\[\[(\d+)\/(\d+)\]\] \+ \[\[(\d+)\/(\d+)\]\]/);
  if (Math.abs(+m[1] / +m[2] + +m[3] / +m[4] - E.parseNum(q.ans)) > 1e-9) fail("addsub value " + q.q);
  const c = E.fromGen("m.fr.compare", 2, R), cm = c.q.match(/\[\[(\d+)\/(\d+)\]\] ☐ \[\[(\d+)\/(\d+)\]\]/), x = +cm[1] / +cm[2], y = +cm[3] / +cm[4];
  if (c.o[c.a] !== (x > y ? ">" : x < y ? "<" : "=")) fail("compare " + c.q + " → " + c.o[c.a]);
  const g = E.fromGen("m.gr.unknown", 2, R); if (+g.ans <= 0 || +g.ans >= 180) fail("unknown angle " + g.ans);
  const f = E.fromGen("m.md.facts", 2, R), fm = f.q.match(/(\d+) ([×÷]) (\d+)/); if ((fm[2] === "×" ? +fm[1] * +fm[3] : +fm[1] / +fm[3]) !== +f.ans) fail("facts " + f.q);
  const r = E.fromGen("m.nso.round", 2, R); void frac;
  if (r.t === "num") { const rm = r.q.match(/Round ([\d,]+) to the nearest \*\*(\w+)\*\*/), n = +rm[1].replace(/,/g, ""), p = { ten: 10, hundred: 100, thousand: 1000 }[rm[2]]; if (Math.round(n / p) * p !== +r.ans) fail("round " + r.q); }
}

// 4) Answer parsing.
const P = [["3/4", 0.75], ["1 3/4", 1.75], ["7/4", 1.75], ["2.50", 2.5], ["$12.05", 12.05], ["1,250", 1250], [" 45 ", 45], ["90°", 90], ["12 feet", 12], ["abc", NaN]];
for (const [s, v] of P) { const x = E.parseNum(s); if (!(isNaN(v) ? isNaN(x) : Math.abs(x - v) < 1e-9)) fail(`parseNum ${s} → ${x}`); }
if (!E.check({ t: "num", ans: "6/8" }, "3/4")) fail("equivalent fraction should be accepted");
if (!E.check({ t: "rem", ans: "12 R3" }, "12r3") || E.check({ t: "rem", ans: "12 R3" }, "12")) fail("remainder parsing");

// 5) Banks.
const B = global.FAST_BANK || {}, ids = new Set();
const VALID = new Set(Object.keys(SK.SKILLS));
function checkQ(q, where, text) {
  total++;
  if (!q.id || ids.has(q.id)) fail(`${where} missing/duplicate id ${q.id}`); ids.add(q.id);
  if (!VALID.has(q.skill)) fail(`${where} ${q.id} unknown skill ${q.skill}`);
  const multi = Array.isArray(q.a);
  if (!Array.isArray(q.o) || q.o.length !== (multi ? 5 : 4)) fail(`${where} ${q.id} option count`);
  if (multi ? q.a.length !== 2 || q.a.some((a) => a < 0 || a > 4) : !(q.a >= 0 && q.a < 4)) fail(`${where} ${q.id} answer ${q.a}`);
  if (new Set(q.o).size !== q.o.length) fail(`${where} ${q.id} duplicate options`);
  if (!q.e || !q.q) fail(`${where} ${q.id} missing q/e`);
  if (q.b) { if (!(q.b.o && q.b.o.length === 4 && q.b.a >= 0 && q.b.a < 4)) fail(`${where} ${q.id} part B shape`); if (text != null) for (const s of q.b.o) if (!text.includes(s)) fail(`${where} ${q.id} part B not in text: ${s.slice(0, 60)}`); }
}
for (const key of ["lit", "info"]) for (const p of B[key] || []) {
  const text = (p.text || "") + (p.texts || []).map((t) => t.text).join("\n");
  if (!p.id || !p.title || !text || !["prose", "poetry", "info", "paired"].includes(p.genre)) fail(`${key} passage shape ${p.id}`);
  if (p.genre === "paired" && (!p.texts || p.texts.length !== 2)) fail(`${p.id} paired needs 2 texts`);
  for (const q of p.qs) checkQ(q, key, text);
}
for (const key of ["vocab", "wdrill"]) for (const q of B[key] || []) checkQ(q, key, null);
for (const p of B.prompts || []) if (!p.id || !p.sources || p.sources.length < 2 || !p.prompt || !p.plan || !p.keywords) fail("prompt shape " + p.id);
if (B.rubric && B.rubric.reduce((a, r) => a + r.max, 0) !== 10) fail("rubric should total 10 points");

// 5b) Essay conventions: catch common mistakes, never flag well-written text.
{
  const kinds = (t) => E.conventions(t).map((c) => c.kind);
  const bad = "i think recess is to much fun becuase your going to love it. Their is a reason the the kids smile. Its a good idea and my dog wagged it's tail. Me to!\n\nIn conclusion recess rocks";
  const got = E.conventions(bad), want = ["spelling", "mixup", "caps", "double", "end"];
  for (const k of want) if (!got.some((c) => c.kind === k)) fail("conventions should catch " + k);
  if (got.filter((c) => c.kind === "mixup").length < 6) fail("conventions should catch your/there/to/too/its/it's mix-ups, got " + got.filter((c) => c.kind === "mixup").length);
  const fine = "I had had enough. I know that that is true. It's raining, so the turtle hid its head in its shell. They're going to their house over there. Manatees are sensitive to cold. It was one of the greatest bridges of its time. You're right that your idea is too good to skip. We went to school, too.";
  if (kinds(fine).length) fail("conventions false positives: " + E.conventions(fine).map((c) => c.hint).join(" | "));
  const texts = [...(B.lit || []), ...(B.info || [])].flatMap((p) => (p.texts ? p.texts.map((t) => t.text) : [p.text])).concat((B.prompts || []).flatMap((p) => p.sources.map((x) => x.text)));
  const fp = texts.flatMap((t) => E.conventions(t).filter((c) => c.kind !== "end").map((c) => c.hint));
  if (fp.length) fail(`conventions flagged ${fp.length} hints in well-written bank texts: ${fp.slice(0, 3).join(" | ")}`);
  const ck = E.essayChecks(bad, (B.prompts || [])[0]); if (ck.ready || ck.conv.length < 8) fail("essay with mistakes must not be ready");
  if (!E.essayChecks("I think so. We agree.", null).ready) fail("clean essay should be ready");
  total += texts.length;
}
// 5c) Every grade-4 math skill has a grade-5 "Too easy? Try Level Up" skill.
for (const s of SK.list((x) => x.subj === "math" && !x.stretch)) { const up = SK.STRETCH_FOR[s.id]; if (!up || !SK.SKILLS[up] || !SK.SKILLS[up].stretch) fail("no stretch skill for " + s.id); }

// 5d) Mission lessons: before a math-path skill under 2 stars or a never-tried skill; not again within 7 days unless 2+ misses last time.
{
  const D = "2026-10-12", T = E.blank();
  if (!E.needsLesson(T, "m.fr.addsub", D)) fail("never-tried skill needs a lesson");
  T.lessons = { "m.fr.addsub": E.addDays(D, -3) }; T.skills["m.fr.addsub"] = { n: 4, c: 3, h: [1, 1, 0, 1], lv: 2, at: "2026-10-10" }; T.days["2026-10-10"] = { q: 4, c: 3, sk: { "m.fr.addsub": [4, 3] }, sub: {} };
  if (E.needsLesson(T, "m.fr.addsub", D)) fail("lesson seen 3 days ago (1 miss last time) should not repeat");
  T.days["2026-10-10"].sk["m.fr.addsub"] = [4, 2];
  if (!E.needsLesson(T, "m.fr.addsub", D)) fail("lesson should repeat after 2+ misses last time");
  T.days["2026-10-10"].sk["m.fr.addsub"] = [4, 3]; T.lessons["m.fr.addsub"] = E.addDays(D, -8);
  if (!E.needsLesson(T, "m.fr.addsub", D)) fail("lesson older than 7 days repeats while under 2 stars");
  T.skills["m.fr.equiv"] = { n: 12, c: 12, h: Array(10).fill(1), lv: 3, at: "2026-10-10" };
  if (E.needsLesson(T, "m.fr.equiv", D)) fail("no lesson for a 2+ star skill already tried");
  const m = E.mission(E.blank(), D, FIG.rng(5)), first = m.items.findIndex((x) => x.skill === "m.md.facts" && !x.kind);
  if (!(first > 0 && m.items[first - 1].kind === "lesson" && m.items[first - 1].skill === "m.md.facts")) fail("lesson card should come right before a new skill's first question");
  if (m.items.filter((x) => x.kind === "lesson").length > 3) fail("at most 3 lessons per mission");
}
// 5e) Essay day: due after 7 days without an essay; resume a draft; day 1 plan, day 2 write.
{
  const D = "2026-10-12", T = E.blank();
  T.essays = [{ pid: "wp03", at: "2026-10-04" }];
  T.drafts = { wp02: { at: "2026-10-12", plan: {}, text: "Five six seven eight! ".repeat(25) } };
  const ep = E.essayPlan(T); if (ep.pid !== "wp02" || ep.stage !== "write") fail("should resume the wp02 draft at the write step, got " + JSON.stringify(ep));
  const m = E.mission(T, D, FIG.rng(6)), last = m.items[m.items.length - 1];
  if (!(last.kind === "essay" && last.pid === "wp02" && last.stage === "write")) fail("essay step should be last on an essay day");
  if (m.minutes > 21) fail(`essay day too long: ~${m.minutes} min`);
  T.essays.push({ pid: "wp02", at: "2026-10-11" }); T.drafts = {};
  if (E.mission(T, D, FIG.rng(6)).items.some((x) => x.kind === "essay")) fail("no essay step within 7 days of the last essay");
  const F = E.blank(), p1 = E.essayPlan(F);
  if (p1.stage !== "plan") fail("first essay starts with read & plan");
  F.drafts[p1.pid] = { plan: { claim: "I think this is a good idea", r1: "First, it helps kids learn", r2: "Also, it is fun for everyone" }, text: "", at: D };
  if (E.essayPlan(F).stage !== "write") fail("after planning, the next day is write");
}

// 6) Simulate 30 days of missions with a student who is right ~75% of the time.
let S = E.blank(); const SR = FIG.rng(99); let essays = 0, lessons = 0;
for (let d = 0; d < 30; d++) {
  const date = E.addDays("2026-10-05", d), m = E.mission(S, date, SR), qs = m.items.filter((x) => !x.kind);
  if (qs.length < 5 || qs.length > 16) fail(`mission has ${qs.length} questions on ${date}`);
  if (m.minutes > 21) fail(`mission ~${m.minutes} min on ${date}`);
  for (const it of m.items) {
    if (it.kind === "lesson") { if (!SK.SKILLS[it.skill]) fail("lesson skill " + it.skill); S.lessons[it.skill] = date; lessons++; continue; }
    if (it.kind === "essay") {
      if (it.stage === "plan") S.drafts[it.pid] = { plan: { claim: "My claim is clear here", r1: "Reason one with evidence", r2: "Reason two with evidence" }, text: "", at: date };
      else { S.essays.push({ pid: it.pid, at: date }); delete S.drafts[it.pid]; essays++; }
      continue;
    }
    if (!SK.SKILLS[it.skill]) fail("mission item skill " + it.skill);
    const right = SR.f() < 0.75;
    const resp = right ? (it.t ? it.ans : it.b ? { a: it.a, b: it.b.a } : it.a) : (it.t ? "-999" : it.b ? { a: (it.a + 1) % it.o.length, b: 0 } : Array.isArray(it.a) ? [9, 9] : (it.a + 1) % it.o.length);
    if (E.check(it, resp) !== right) fail(`check mismatch ${it.skill} ${JSON.stringify(resp)}`);
    E.record(S, it, right, 40, date);
  }
  E.day(S, date).set = 1;
}
if (essays < 3) fail(`expected a weekly essay over 30 days, got ${essays}`);
console.log(`30-day simulation: ${essays} essays written, ${lessons} lesson cards`);
if (S.streak.cur !== 30) fail("streak should be 30, got " + S.streak.cur);
const cats = Object.keys(SK.CATS).map((c) => [c, E.catScore(S, c).score]);
console.log("After 30 simulated days:", cats.map(([c, s]) => c + "=" + s).join(" "), "| coins", S.coins, "| path at", E.pathNext(S).id);
console.log("Bank sizes:", Object.entries(B).map(([k, v]) => k + "=" + (Array.isArray(v) ? v.length : "?")).join(" "));
console.log(`${total} items checked, ${fails} failures`);
process.exit(fails ? 1 : 0);
