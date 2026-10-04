// Answer-length bias check: the correct option shouldn't be the giveaway "longest choice".
// Usage: node test/check-lengths.js [lit|info|vocab|wdrill]   — lists items where the correct answer is clearly longest.
global.window = global;
["bank-lit", "bank-info", "bank-vocab", "bank-writing"].forEach((f) => require("../fast/js/" + f + ".js"));
const B = FAST_BANK, groups = { lit: B.lit.flatMap((p) => p.qs), info: B.info.flatMap((p) => p.qs), vocab: B.vocab, wdrill: B.wdrill };
const only = process.argv[2]; let bad = 0;
for (const [k, qs] of Object.entries(groups)) {
  if (only && k !== only) continue;
  let single = 0, longest = 0; const flagged = [];
  const check = (id, o, a) => { single++; const L = o.map((x) => x.length), mx = Math.max(...L), others = Math.max(...L.filter((_, i) => i !== a)); if (L[a] === mx) longest++; if (L[a] > others * 1.2 && L[a] - others >= 8) flagged.push(id); };
  for (const q of qs) { if (!Array.isArray(q.a)) check(q.id, q.o, q.a); if (q.b) check(q.id + "/B", q.b.o, q.b.a); }
  const pct = Math.round((longest / single) * 100);
  console.log(`${k}: correct is longest in ${longest}/${single} (${pct}%) · clearly longest: ${flagged.length}${flagged.length ? " → " + flagged.join(", ") : ""}`);
  if (pct > 35 || flagged.length) bad++;
}
process.exit(bad ? 1 : 0);
