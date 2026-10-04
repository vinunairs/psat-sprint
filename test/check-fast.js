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

// 6) Simulate 30 days of missions with a student who is right ~75% of the time.
let S = E.blank(); const SR = FIG.rng(99);
for (let d = 0; d < 30; d++) {
  const date = E.addDays("2026-10-05", d), m = E.mission(S, date, SR);
  if (m.items.length < 10 || m.items.length > 16) fail(`mission size ${m.items.length} on ${date}`);
  for (const it of m.items) {
    if (!SK.SKILLS[it.skill]) fail("mission item skill " + it.skill);
    const right = SR.f() < 0.75;
    const resp = right ? (it.t ? it.ans : it.b ? { a: it.a, b: it.b.a } : it.a) : (it.t ? "-999" : it.b ? { a: (it.a + 1) % it.o.length, b: 0 } : Array.isArray(it.a) ? [9, 9] : (it.a + 1) % it.o.length);
    if (E.check(it, resp) !== right) fail(`check mismatch ${it.skill} ${JSON.stringify(resp)}`);
    E.record(S, it, right, 40, date);
  }
  E.day(S, date).set = 1;
}
if (S.streak.cur !== 30) fail("streak should be 30, got " + S.streak.cur);
const cats = Object.keys(SK.CATS).map((c) => [c, E.catScore(S, c).score]);
console.log("After 30 simulated days:", cats.map(([c, s]) => c + "=" + s).join(" "), "| coins", S.coins, "| path at", E.pathNext(S).id);
console.log("Bank sizes:", Object.entries(B).map(([k, v]) => k + "=" + (Array.isArray(v) ? v.length : "?")).join(" "));
console.log(`${total} items checked, ${fails} failures`);
process.exit(fails ? 1 : 0);
