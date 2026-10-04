/* FAST Prep — Grade 4 math question generators (Florida B.E.S.T.).
   Each generator: (R, lv) => { q, o, a, e, fig?, efig?, t?, ans?, unit? }
   - multiple choice: o = options, a = correct index (or [i, j] for "choose two")
   - typed answer: t = "num", ans = canonical answer string (fractions "7/4", mixed "1 3/4", decimals "2.35")
   lv 1 = warm-up, 2 = on grade level, 3 = FAST-hard. Numbers are random each time; answers are computed. */
(function (root) {
  "use strict";
  const { gcd, N, F, M, mixed, mc, mc2, bars, numberLine, angle, angleParts, rect, linePlot, lines, money } = root.FASTFig;
  const NAMES = ["Maya", "Leo", "Aanya", "Sofia", "Kenji", "Zoe", "Ravi", "Lila", "Mateo", "Hana", "Nia", "Omar", "Ivy", "Arjun", "Emma", "Diego", "Mei", "Tariq"];
  const nm = (R) => R.pick(NAMES);
  const two = (R) => { const a = R.pick(NAMES); let b; do b = R.pick(NAMES); while (b === a); return [a, b]; };
  const DENS = [2, 3, 4, 5, 6, 8, 10, 12];

  const G = {};

  /* ---------------- Unit 1: Fraction Forest ---------------- */
  G["m.fr.equiv"] = (R, lv) => {
    const d = R.pick(lv === 1 ? [2, 3, 4, 5] : [2, 3, 4, 5, 6, 8]), n = R.int(1, d - 1), k = R.int(2, lv === 1 ? 3 : 5);
    if (lv === 1) {
      const right = F(n * k, d * k);
      const { o, a } = mc(R, right, [F(n + k, d + k), F(n * k, d + k), F(n, d * k), F(n * k + 1, d * k)]);
      return { q: `Which fraction is **equivalent** to ${F(n, d)}?`, o, a, fig: bars([{ parts: d, shaded: n, label: `${n}/${d}` }, { parts: d * k, shaded: n * k, label: "?" }]),
        e: `Multiply the top and bottom by ${k}: ${F(n, d)} = ${F(n + " × " + k, d + " × " + k)} = ${right}.\nThe bars show the same amount is shaded — just cut into smaller pieces.` };
    }
    if (lv === 2) {
      const big = R.chance(0.3), nn = big ? R.int(d + 1, 2 * d - 1) : n;
      return { q: `Find the missing number.\n\n${F(nn, d)} = ${F("?", d * k)}`, t: "num", ans: String(nn * k),
        e: `The denominator went from ${d} to ${d * k} — that's × ${k}. Do the same to the numerator: ${nn} × ${k} = **${nn * k}**.` };
    }
    // lv3: choose two, or "how did the numerator and denominator change"
    if (R.chance(0.5)) {
      const k2 = k === 2 ? 3 : 2, rights = [F(n * k, d * k), F(n * k2, d * k2)];
      const wrongs = [F(n + 1, d + 1), F(n * k, d * k + 1), F(n + k, d * k), F(d, n), F(n * k + 1, d * k2)].filter((w) => !rights.includes(w));
      const { o, a } = mc2(R, rights, R.shuffle(wrongs));
      return { q: `Which **two** fractions are equivalent to ${F(n, d)}? Choose **two** answers.`, o, a,
        e: `${F(n, d)} = ${rights[0]} (× ${k}) and ${F(n, d)} = ${rights[1]} (× ${k2}). Adding the same number to the top and bottom does NOT make an equivalent fraction.` };
    }
    const right = `Multiply the denominator by ${k} too, so the pieces are ${k} times smaller.`;
    const { o, a } = mc(R, right, [`Add ${k} to the denominator.`, `Keep the denominator the same.`, `Divide the denominator by ${k}.`]);
    return { q: `${nm(R)} wants a fraction equivalent to ${F(n, d)}. She multiplies the numerator by ${k}. What must she do to the denominator?`, o, a,
      e: `To keep the same amount, both parts change the same way: ${F(n, d)} = ${F(n * k, d * k)}. More pieces, but each piece is smaller.` };
  };

  G["m.fr.compare"] = (R, lv) => {
    const sym = (x, y) => (x > y ? ">" : x < y ? "<" : "=");
    if (lv === 1) {
      let a, b, n1, n2, d1, d2;
      if (R.chance(0.5)) { d1 = d2 = R.pick([5, 6, 8, 10, 12]); do { n1 = R.int(1, d1 - 1); n2 = R.int(1, d1 - 1); } while (n1 === n2); }
      else { n1 = n2 = R.int(1, 3); do { d1 = R.pick([4, 5, 6, 8, 10]); d2 = R.pick([3, 4, 5, 6, 8, 12]); } while (d1 === d2 || n1 >= Math.min(d1, d2)); }
      a = n1 / d1; b = n2 / d2;
      const right = sym(a, b), o = ["<", ">", "="];
      return { q: `Which symbol makes this true?\n\n${F(n1, d1)} ☐ ${F(n2, d2)}`, o, a: o.indexOf(right), fig: bars([{ parts: d1, shaded: n1, label: `${n1}/${d1}` }, { parts: d2, shaded: n2, label: `${n2}/${d2}`, color: "var(--fb)" }]),
        e: d1 === d2 ? `Same-size pieces (${d1}ths), so compare the tops: ${n1} ${sym(n1, n2)} ${n2}. So ${F(n1, d1)} **${right}** ${F(n2, d2)}.` : `Same number of pieces (${n1}), so the one with BIGGER pieces wins. ${d1 < d2 ? d1 + "ths are bigger than " + d2 + "ths" : d2 + "ths are bigger than " + d1 + "ths"}. So ${F(n1, d1)} **${right}** ${F(n2, d2)}.` };
    }
    if (lv === 2) {
      const d1 = R.pick([2, 3, 4, 5, 6]), m = R.pick([2, 3, 4]), d2 = d1 * m;
      if (d2 > 12) return G["m.fr.compare"](R, 2);
      let n1 = R.int(1, d1 - 1), n2; do n2 = R.int(1, d2 - 1); while (n2 === n1 * m && R.chance(0.8));
      const right = sym(n1 / d1, n2 / d2), o = ["<", ">", "="];
      return { q: `Compare. Which symbol makes this true?\n\n${F(n1, d1)} ☐ ${F(n2, d2)}`, o, a: o.indexOf(right),
        e: `Make the denominators match: ${F(n1, d1)} = ${F(n1 * m, d2)}. Now compare ${F(n1 * m, d2)} and ${F(n2, d2)}: ${n1 * m} ${sym(n1 * m, n2)} ${n2}.\nSo ${F(n1, d1)} **${right}** ${F(n2, d2)}.` };
    }
    // lv3: order 3 fractions incl. > 1, or locate on a number line
    if (R.chance(0.5)) {
      const d = R.pick([3, 4, 5, 6, 8]), v = R.int(d + 1, 2 * d - 1), letters = ["A", "B", "C", "D"];
      const vals = R.shuffle([v, ...R.sample([...Array(2 * d - 1).keys()].map((x) => x + 1).filter((x) => x !== v && x !== d), 3)]);
      const pts = vals.map((x, i) => ({ v: x / d, label: letters[i] }));
      const o = letters.slice(), a = vals.indexOf(v);
      return { q: `Which point is at ${F(v, d)} on the number line?`, o, a, fig: numberLine(0, 2, d, pts),
        e: `${F(v, d)} = ${mixed(v, d)}. Go past 1 by ${v - d} more jump${v - d > 1 ? "s" : ""} of ${F(1, d)}. That's point **${letters[a]}**.` };
    }
    const L = 12, fr = R.sample([[1, 2], [2, 3], [3, 4], [5, 6], [3, 8], [5, 4], [7, 6], [1, 3], [5, 12], [7, 4], [3, 2]], 3);
    const val = (f) => f[0] / f[1];
    if (new Set(fr.map(val)).size < 3) return G["m.fr.compare"](R, 3);
    const sorted = fr.slice().sort((x, y) => val(x) - val(y)), show = (arr) => arr.map((f) => F(f[0], f[1])).join(", ");
    const right = show(sorted);
    const { o, a } = mc(R, right, [show(sorted.slice().reverse()), show([sorted[1], sorted[0], sorted[2]]), show([sorted[0], sorted[2], sorted[1]]), show(fr.slice().sort((x, y) => x[1] - y[1]))]);
    return { q: `Which list shows the fractions in order from **least to greatest**?`, o, a,
      e: `Change each to twelfths: ${sorted.map((f) => `${F(f[0], f[1])} = ${F(f[0] * L / f[1], L)}`).join(", ")}.\nLeast to greatest: ${right}. Tip: anything greater than 1 (top bigger than bottom) goes last.` };
  };

  G["m.fr.decomp"] = (R, lv) => {
    const d = R.pick([4, 5, 6, 8, 10]), n = lv === 3 ? R.int(d + 1, 2 * d - 1) : R.int(3, d - 1), p = R.int(1, n - 1);
    if (lv === 3 && R.chance(0.5)) {
      const w = R.int(1, 2), r = R.int(1, d - 1), tot = w * d + r;
      const right = `${F(d, d)} + ${w === 2 ? F(d, d) + " + " : ""}${F(r, d)}`;
      const { o, a } = mc(R, right, [`${w} + ${F(r, d + w)}`, `${F(w, d)} + ${F(r, d)}`, `${F(d, r)} + ${F(w, d)}`, `${F(tot, d)} + ${F(1, d)}`]);
      return { q: `Which shows a way to decompose ${M(w, r, d)}?`, o, a,
        e: `Each whole = ${F(d, d)}. So ${M(w, r, d)} = ${right} = ${F(tot, d)}.` };
    }
    if (lv === 3) {
      const r1 = [F(p, d) + " + " + F(n - p, d)];
      const q2 = p === 1 ? 2 : 1; r1.push(F(q2, d) + " + " + F(n - q2, d));
      if (r1[0] === r1[1]) return G["m.fr.decomp"](R, 2);
      const wrongs = [F(p, d) + " + " + F(n - p, 2 * d), F(p, d) + " + " + F(n - p + 1, d), F(p, Math.ceil(d / 2)) + " + " + F(n - p, Math.floor(d / 2)), F(n, d) + " + " + F(1, d)];
      const { o, a } = mc2(R, r1, wrongs);
      return { q: `Which **two** expressions are equal to ${F(n, d)}? Choose **two** answers.`, o, a, e: `Split the numerator ${n} into two parts and keep the denominator ${d}: ${r1.join(" and ")}. Both have tops that add to ${n}.` };
    }
    const right = `${F(p, d)} + ${F(n - p, d)}`;
    const { o, a } = mc(R, right, [`${F(p, d)} + ${F(n - p, 2 * d)}`, `${F(p, d)} + ${F(n - p + 1, d)}`, `${F(p, d - 2 > 1 ? d - 2 : d + 2)} + ${F(n - p, 2)}`, `${F(1, d)} + ${F(n, d)}`]);
    return { q: `Which shows ${F(n, d)} broken into a sum of fractions?`, o, a, fig: lv === 1 ? bars([{ parts: d, shaded: n }]) : undefined,
      e: `Keep the denominator ${d}. The numerators must add to ${n}: ${p} + ${n - p} = ${n}. So ${F(n, d)} = ${right}.` };
  };

  G["m.fr.addsub"] = (R, lv) => {
    const d = R.pick([3, 4, 5, 6, 8, 10, 12]);
    if (lv === 1) {
      const a1 = R.int(1, d - 2), b1 = R.int(1, d - 1 - a1);
      return { q: `${F(a1, d)} + ${F(b1, d)} = ?`, t: "num", ans: `${a1 + b1}/${d}`, fig: bars([{ parts: d, shaded: a1 + b1 }]),
        e: `Same denominator: add the tops, keep the bottom. ${a1} + ${b1} = ${a1 + b1}, so the answer is **${F(a1 + b1, d)}**.` };
    }
    if (lv === 2) {
      if (R.chance(0.5)) {
        const a1 = R.int(2, 2 * d - 1), b1 = R.int(1, a1 - 1);
        return { q: `${F(a1, d)} − ${F(b1, d)} = ?`, t: "num", ans: `${a1 - b1}/${d}`, e: `Subtract the tops, keep the bottom: ${a1} − ${b1} = ${a1 - b1}. Answer: **${F(a1 - b1, d)}**${a1 - b1 > d ? " = " + mixed(a1 - b1, d) : ""}.` };
      }
      const w1 = R.int(1, 4), w2 = R.int(1, 3), n1 = R.int(1, d - 1), n2 = R.int(1, d - 1), tot = (w1 + w2) * d + n1 + n2;
      return { q: `${M(w1, n1, d)} + ${M(w2, n2, d)} = ?\n\nWrite your answer as a mixed number or a fraction.`, t: "num", ans: `${Math.floor(tot / d)} ${tot % d}/${d}`.replace(/ 0\/\d+$/, ""),
        e: `Wholes: ${w1} + ${w2} = ${w1 + w2}. Fractions: ${F(n1, d)} + ${F(n2, d)} = ${F(n1 + n2, d)}${n1 + n2 >= d ? " = " + mixed(n1 + n2, d) : ""}.\nTotal: **${mixed(tot, d)}**.` };
    }
    // lv3: subtract mixed numbers with regrouping
    const w1 = R.int(3, 6), w2 = R.int(1, w1 - 1), n1 = R.int(1, d - 2), n2 = R.int(n1 + 1, d - 1), t1 = w1 * d + n1, t2 = w2 * d + n2, diff = t1 - t2;
    const right = mixed(diff, d);
    const { o, a } = mc(R, right, [M(w1 - w2, n2 - n1, d), M(w1 - w2 - 1, n2 - n1, d), M(w1 - w2, Math.abs(d - n2 + n1 - 1) || 1, d), mixed(diff + d, d)]);
    return { q: `${M(w1, n1, d)} − ${M(w2, n2, d)} = ?`, o, a,
      e: `${F(n1, d)} is less than ${F(n2, d)}, so trade 1 whole for ${F(d, d)}: ${M(w1, n1, d)} = ${M(w1 - 1, n1 + d, d)}.\nNow subtract: ${w1 - 1} − ${w2} = ${w1 - 1 - w2} and ${F(n1 + d, d)} − ${F(n2, d)} = ${F(n1 + d - n2, d)}.\nAnswer: **${right}**.` };
  };

  G["m.fr.word"] = (R, lv) => {
    const d = R.pick([4, 6, 8, 10, 12]), name = nm(R);
    const ctx = R.pick([
      { item: "ribbon for a dance costume", unit: "yard", verb: "used" },
      { item: "foam for a homemade squishy", unit: "cup", verb: "used" },
      { item: "trail at Lettuce Lake Park", unit: "mile", verb: "walked" },
      { item: "lemonade", unit: "gallon", verb: "poured" },
      { item: "practice time", unit: "hour", verb: "spent" }]);
    if (lv === 1) {
      const a1 = R.int(1, d - 2), b1 = R.int(1, d - 1 - a1);
      return { q: `${name} ${ctx.verb} ${F(a1, d)} ${ctx.unit} of ${ctx.item} in the morning and ${F(b1, d)} ${ctx.unit} in the afternoon. How much did ${name} use in all?`, t: "num", ans: `${a1 + b1}/${d}`, unit: ctx.unit + "s",
        e: `"In all" means add: ${F(a1, d)} + ${F(b1, d)} = **${F(a1 + b1, d)}** ${ctx.unit}.` };
    }
    if (lv === 2) {
      const w = R.int(2, 5), n1 = R.int(1, d - 1), u = R.int(1, w * d + n1 - 1), left = w * d + n1 - u;
      return { q: `${name} had ${M(w, n1, d)} ${ctx.unit}s of ${ctx.item}. ${name} ${ctx.verb} ${mixed(u, d)} ${ctx.unit}${u > d ? "s" : ""}. How much is left?`, t: "num", ans: `${Math.floor(left / d)} ${left % d}/${d}`.replace(/^0 /, "").replace(/ 0\/\d+$/, ""), unit: ctx.unit + "s",
        e: `"Left" means subtract: ${M(w, n1, d)} − ${mixed(u, d)}.\nAs fractions: ${F(w * d + n1, d)} − ${F(u, d)} = ${F(left, d)} = **${mixed(left, d)}** ${ctx.unit}s.` };
    }
    const [a, b] = two(R), x = R.int(d + 1, 3 * d), y = R.int(1, x - 1), diff = x - y;
    const right = mixed(diff, d);
    const { o, a: ai } = mc(R, right, [mixed(x + y, d), F(diff, 2 * d), mixed(diff + d, d), mixed(Math.abs(diff - 1) || 2, d)]);
    return { q: `${a} danced for ${mixed(x, d)} hours this week. ${b} danced for ${mixed(y, d)} hours. **How much longer** did ${a} dance than ${b}?`, o, a: ai,
      e: `"How much longer" means compare by subtracting: ${F(x, d)} − ${F(y, d)} = ${F(diff, d)} = **${right}** hours.` };
  };

  G["m.fr.times"] = (R, lv) => {
    const d = R.pick([3, 4, 5, 6, 8, 10]), w = R.int(2, lv === 1 ? 5 : 9), n = lv === 1 ? 1 : R.int(2, d - 1), tot = w * n;
    if (lv === 1) return { q: `${w} × ${F(1, d)} = ?`, t: "num", ans: `${w}/${d}`, fig: bars([{ parts: d, shaded: Math.min(w, d) }]),
      e: `${w} groups of ${F(1, d)} is ${w} pieces that are each ${F(1, d)}: **${F(w, d)}**.` };
    if (lv === 2) {
      const right = F(tot, d);
      const { o, a } = mc(R, right, [F(tot, w * d), F(n, w * d), F(w + n, d), F(tot, d * n)]);
      return { q: `What is ${w} × ${F(n, d)}?`, o, a, e: `Multiply the numerator by the whole number: ${w} × ${n} = ${tot}. Keep the denominator: **${right}**${tot > d ? " (= " + mixed(tot, d) + ")" : ""}.` };
    }
    const name = nm(R), item = R.pick(["costume needs", "squishy recipe needs", "smoothie needs", "bracelet uses"]);
    const [what, stuff, units] = { "costume needs": ["yard of sequin trim", "sequin trim", "yards"], "squishy recipe needs": ["cup of glue", "glue", "cups"], "smoothie needs": ["cup of mango", "mango", "cups"], "bracelet uses": ["foot of string", "string", "feet"] }[item];
    return { q: `Each ${item} ${F(n, d)} ${what}. ${name} makes ${w} of them. How much ${stuff} does ${name} need?\n\nWrite your answer as a fraction or mixed number.`, t: "num", ans: `${tot}/${d}`, unit: units,
      e: `${w} groups of ${F(n, d)}: ${w} × ${F(n, d)} = ${F(tot, d)}${tot >= d ? " = **" + mixed(tot, d) + "**" : ""}.` };
  };

  G["m.fr.tenths"] = (R, lv) => {
    if (lv === 1) { const n = R.int(1, 9); return { q: `${F(n, 10)} = ${F("?", 100)}`, t: "num", ans: String(n * 10), e: `1 tenth = 10 hundredths. So ${n} tenths = **${n * 10}** hundredths.` }; }
    if (lv === 2) {
      const a1 = R.int(1, 8), b1 = R.int(1, 99 - a1 * 10);
      return { q: `${F(a1, 10)} + ${F(b1, 100)} = ${F("?", 100)}`, t: "num", ans: String(a1 * 10 + b1),
        e: `Change tenths to hundredths first: ${F(a1, 10)} = ${F(a1 * 10, 100)}.\nThen add: ${a1 * 10} + ${b1} = **${a1 * 10 + b1}**, so the sum is ${F(a1 * 10 + b1, 100)}.` };
    }
    const w = R.int(1, 5), n = R.int(1, 9), right = M(w, n * 10, 100);
    const { o, a } = mc(R, right, [M(w, n, 100), M(w * 10, n * 10, 100), M(w, n + 10, 100), M(w, n * 100, 1000)]);
    return { q: `Which is equivalent to ${M(w, n, 10)}?`, o, a, e: `The whole number stays ${w}. Change ${F(n, 10)} to hundredths: ${F(n * 10, 100)}. So ${M(w, n, 10)} = **${right}**.` };
  };

  G["m.dec.notation"] = (R, lv) => {
    if (lv === 1) {
      const n = R.int(1, 99), right = (n / 100).toFixed(2);
      const { o, a } = mc(R, right, [(n / 10).toFixed(1), String(n), "0.0" + (n % 10 || 1), (n / 1000).toFixed(3)]);
      return { q: `Which decimal is equal to ${F(n, 100)}?`, o, a, e: `Hundredths use 2 places after the decimal point: ${F(n, 100)} = **${right}**.` };
    }
    if (lv === 2) {
      const t = R.int(1, 9), h = R.int(10, 99), A = t / 10, B = h / 100;
      if (A === B) return G["m.dec.notation"](R, 2);
      const o = ["<", ">", "="], right = A > B ? ">" : "<";
      return { q: `Which symbol makes this true?\n\n${A.toFixed(1)} ☐ ${B.toFixed(2)}`, o, a: o.indexOf(right),
        e: `Give them the same number of places: ${A.toFixed(1)} = ${A.toFixed(2)}. Compare ${A.toFixed(2)} and ${B.toFixed(2)}: ${Math.round(A * 100)} hundredths ${right} ${h} hundredths. So ${A.toFixed(1)} **${right}** ${B.toFixed(2)}.\nA longer decimal is NOT always bigger!` };
    }
    // lv3: order decimals / plot
    const vals = [], w = R.int(0, 3);
    while (vals.length < 4) { const v = +(w + R.int(1, 99) / 100).toFixed(2); if (!vals.includes(v)) vals.push(v); }
    vals[1] = +(w + Math.floor(vals[1] * 10 % 10) / 10).toFixed(1) || vals[1];
    const uniq = [...new Set(vals)]; if (uniq.length < 4) return G["m.dec.notation"](R, 3);
    const sorted = uniq.slice().sort((x, y) => x - y), show = (arr) => arr.map((v) => String(v)).join(", ");
    const { o, a } = mc(R, show(sorted.slice().reverse()), [show(sorted), show(uniq.slice().sort((x, y) => String(x).length - String(y).length || x - y).reverse()), show([sorted[3], sorted[1], sorted[2], sorted[0]])]);
    return { q: `Which list shows these decimals from **greatest to least**?\n\n${R.shuffle(uniq).join("   ")}`, o, a,
      e: `Write them all with 2 places: ${sorted.map((v) => v.toFixed(2)).join(", ")}. Greatest to least: **${show(sorted.slice().reverse())}**.` };
  };

  G["m.dec.ops"] = (R, lv) => {
    if (lv === 1) {
      const x = +(R.int(1, 9) + R.int(1, 98) / 100).toFixed(2), kind = R.pick(["0.1 more", "0.1 less", "0.01 more", "0.01 less"]);
      const delta = kind.startsWith("0.1 ") ? 0.1 : 0.01, ans = +(x + (kind.endsWith("more") ? delta : -delta)).toFixed(2);
      return { q: `What number is **${kind}** than ${x.toFixed(2)}?`, t: "num", ans: ans.toFixed(2),
        e: `${delta === 0.1 ? "0.1 is one tenth — change the tenths digit" : "0.01 is one hundredth — change the hundredths digit"}: ${x.toFixed(2)} ${kind.endsWith("more") ? "+" : "−"} ${delta} = **${ans.toFixed(2)}**.` };
    }
    const a1 = +(R.int(1, 20) + R.int(1, 99) / 100).toFixed(2), b1 = +(R.int(1, 9) + R.int(1, 9) / 10).toFixed(1), sub = lv === 3 && a1 > b1;
    const ans = +(sub ? a1 - b1 : a1 + b1).toFixed(2);
    return { q: `${a1.toFixed(2)} ${sub ? "−" : "+"} ${b1.toFixed(1)} = ?`, t: "num", ans: ans.toFixed(2),
      e: `Line up the decimal points (write ${b1.toFixed(1)} as ${b1.toFixed(2)}):\n${a1.toFixed(2)} ${sub ? "−" : "+"} ${b1.toFixed(2)} = **${ans.toFixed(2)}**.` };
  };

  /* ---------------- Unit 2: Shape & Measure Studio ---------------- */
  const angleType = (d) => (d < 90 ? "acute" : d === 90 ? "right" : d < 180 ? "obtuse" : d === 180 ? "straight" : "reflex");
  G["m.gr.angles"] = (R, lv) => {
    const pool = lv === 1 ? [R.int(20, 70), 90, R.int(110, 160)] : [R.int(15, 80), 90, R.int(100, 170), 180, R.int(200, 330)];
    const deg = R.pick(pool), right = angleType(deg);
    const o = lv === 1 ? ["acute", "right", "obtuse"] : ["acute", "right", "obtuse", "straight", "reflex"];
    if (lv === 3 && R.chance(0.5)) {
      const m = R.int(91, 179);
      return { q: `An angle measures ${m}°. Which **two** statements are true? Choose **two** answers.`, ...mc2(R, ["It is an obtuse angle.", "It is greater than a right angle."], ["It is an acute angle.", "It is greater than a straight angle.", "It is a reflex angle."]),
        e: `${m}° is more than 90° (a right angle) but less than 180° (a straight angle), so it is **obtuse**.` };
    }
    return { q: `Which word best describes this angle?`, o, a: o.indexOf(right), fig: angle(deg, { rot: R.pick([0, 0, 15, 30]) }),
      e: `This angle is ${right === "right" ? "exactly 90° — a square corner" : right === "straight" ? "exactly 180° — a straight line" : right === "acute" ? "smaller than a square corner (90°)" : right === "obtuse" ? "bigger than a square corner but smaller than a straight line" : "bigger than a straight line (more than 180°)"}. It is **${right}**.` };
  };

  G["m.gr.measure"] = (R, lv) => {
    if (lv < 3 || R.chance(0.5)) {
      const deg = R.int(2, 17) * 10 + (lv === 1 ? 0 : R.pick([0, 5]));
      return { q: `What is the measure of the angle shown on the protractor?`, t: "num", ans: String(deg), unit: "degrees", fig: angle(deg, { protractor: true, noSquare: true }),
        e: `The angle's first side is on 0° of the **inner** scale (the one that starts at the right). Follow that scale to the other side: **${deg}°**.\nCheck: it ${deg < 90 ? "looks smaller than a right angle, so it must be less than 90°" : deg > 90 ? "looks bigger than a right angle, so it must be more than 90°" : "is a square corner"} — not ${180 - deg}°.` };
    }
    const a1 = R.int(2, 8) * 10 + R.pick([0, 5]), b1 = R.int(2, 9) * 10;
    if (a1 + b1 >= 180) return G["m.gr.measure"](R, 3);
    return { q: `Angle ABC is made of two smaller angles that do not overlap. One measures ${a1}° and the other measures ${b1}°. What is the measure of angle ABC?`, t: "num", ans: String(a1 + b1), unit: "degrees",
      fig: angleParts([{ deg: a1, label: a1 + "°" }, { deg: b1, label: b1 + "°" }]), e: `Angle measures are additive: ${a1}° + ${b1}° = **${a1 + b1}°**.` };
  };

  G["m.gr.unknown"] = (R, lv) => {
    const kind = lv === 1 ? R.pick(["right", "straight"]) : lv === 2 ? R.pick(["straight", "right", "straight3"]) : R.pick(["around", "straight3", "around"]);
    if (kind === "right") { const a1 = R.int(15, 75); return { q: `The angle shown is a right angle. What is the value of x?`, t: "num", ans: String(90 - a1), unit: "degrees", fig: angleParts([{ deg: a1, label: a1 + "°" }, { deg: 90 - a1, label: "x" }], { right: true }), e: `A right angle is 90°. x = 90° − ${a1}° = **${90 - a1}°**.` }; }
    if (kind === "straight") { const a1 = R.int(25, 155); return { q: `The angles are on a straight line. What is the value of x?`, t: "num", ans: String(180 - a1), unit: "degrees", fig: angleParts([{ deg: a1, label: a1 + "°" }, { deg: 180 - a1, label: "x" }], { straight: true }), e: `A straight line makes 180°. x = 180° − ${a1}° = **${180 - a1}°**.` }; }
    if (kind === "straight3") { const a1 = R.int(30, 70), b1 = R.int(30, 70), x = 180 - a1 - b1; return { q: `Three angles sit together on a straight line. What is the value of x?`, t: "num", ans: String(x), unit: "degrees", fig: angleParts([{ deg: a1, label: a1 + "°" }, { deg: x, label: "x" }, { deg: b1, label: b1 + "°" }], { straight: true }), e: `All three add to 180°. x = 180° − ${a1}° − ${b1}° = **${x}°**.` }; }
    const a1 = R.int(80, 140), b1 = R.int(60, 120), x = 360 - a1 - b1;
    return { q: `Three angles go all the way around a point. Two of them measure ${a1}° and ${b1}°. What does the third angle measure?`, t: "num", ans: String(x), unit: "degrees", e: `All the way around a point is 360°. 360° − ${a1}° − ${b1}° = **${x}°**.` };
  };

  G["m.gr.area"] = (R, lv) => {
    const ctx = R.pick(["dance floor", "garden bed", "poster", "rug", "art canvas", "playground"]);
    if (lv === 1) {
      const w = R.int(3, 9), h = R.int(2, 7), area = R.chance(0.5);
      return { q: `What is the ${area ? "**area**" : "**perimeter**"} of the rectangle?`, t: "num", ans: String(area ? w * h : 2 * (w + h)), unit: area ? "square units" : "units", fig: rect(w, h, w + " units", h + " units", { grid: area }),
        e: area ? `Area = length × width = ${w} × ${h} = **${w * h}** square units.` : `Perimeter = add all 4 sides: ${w} + ${h} + ${w} + ${h} = **${2 * (w + h)}** units.` };
    }
    if (lv === 2) {
      const w = R.int(4, 15), h = R.int(3, 12), byArea = R.chance(0.5);
      if (byArea) return { q: `A rectangular ${ctx} has an area of ${w * h} square feet. One side is ${w} feet long. How long is the other side?`, t: "num", ans: String(h), unit: "feet", fig: rect(w, h, w + " ft", "? ft"), e: `Area = length × width, so ${w} × ? = ${w * h}. Divide: ${w * h} ÷ ${w} = **${h}** feet.` };
      return { q: `A rectangular ${ctx} has a perimeter of ${2 * (w + h)} feet. Its length is ${w} feet. What is its width?`, t: "num", ans: String(h), unit: "feet", fig: rect(w, h, w + " ft", "? ft"), e: `Two lengths: ${w} + ${w} = ${2 * w}. The two widths are ${2 * (w + h)} − ${2 * w} = ${2 * h}, so one width is ${2 * h} ÷ 2 = **${h}** feet.` };
    }
    const P = R.pick([16, 20, 24, 28]), half = P / 2, opts = [];
    for (let l = 1; l < half; l++) if (l <= half - l) opts.push([l, half - l]);
    const best = opts[opts.length - 1], right = `${best[0]} ft by ${best[1]} ft`;
    const { o, a } = mc(R, right, opts.slice(0, -1).map((x) => `${x[0]} ft by ${x[1]} ft`).reverse());
    return { q: `${nm(R)} has ${P} feet of fence for a rectangular ${ctx}. Which size gives the **greatest area**? (Sides are whole numbers.)`, o, a,
      e: `Every choice has perimeter ${P} ft. Areas: ${opts.map((x) => `${x[0]} × ${x[1]} = ${x[0] * x[1]}`).join(", ")}. The closest to a square wins: **${right}** (${best[0] * best[1]} sq ft).` };
  };

  G["m.geo.shapes"] = (R, lv) => {
    const items = [
      () => { const k = R.pick(["parallel", "perpendicular", "intersecting"]), o = ["parallel", "perpendicular", "intersecting but not perpendicular"]; return { q: `Which word best describes these two lines?`, o, a: k === "intersecting" ? 2 : o.indexOf(k), fig: lines(k), e: k === "parallel" ? "They go the same direction and never meet: **parallel**." : k === "perpendicular" ? "They cross and make square corners (right angles): **perpendicular**." : "They cross, but not at square corners: **intersecting**." }; },
      () => { const s = R.pick([["a square", "4 equal sides and 4 right angles"], ["a rectangle", "4 right angles, with opposite sides equal"], ["a rhombus", "4 equal sides, but its angles are not right angles"], ["a trapezoid", "exactly one pair of parallel sides"]]); const { o, a } = mc(R, s[0], ["a square", "a rectangle", "a rhombus", "a trapezoid", "a pentagon"].filter((x) => x !== s[0])); return { q: `A quadrilateral has ${s[1]}. What is the best name for it?`, o, a, e: `${s[0][0].toUpperCase() + s[0].slice(1)} has ${s[1]}.` }; },
      () => { const t = R.pick([["right", "one angle that measures exactly 90°"], ["obtuse", "one angle greater than 90°"], ["acute", "three angles that are all less than 90°"]]); const o = ["right triangle", "obtuse triangle", "acute triangle"]; return { q: `A triangle has ${t[1]}. What kind of triangle is it?`, o, a: o.indexOf(t[0] + " triangle"), e: `Name triangles by their biggest angle: ${t[1]} → **${t[0]} triangle**.` }; },
      () => { const s = R.pick([["square", 4], ["rectangle (not a square)", 2], ["equilateral triangle", 3], ["regular hexagon", 6]]); return { q: `How many lines of symmetry does a ${s[0]} have?`, t: "num", ans: String(s[1]), e: `A line of symmetry folds the shape into two matching halves. A ${s[0]} has **${s[1]}**.` }; }
    ];
    return items[lv === 1 ? R.int(0, 1) : R.int(0, 3)]();
  };

  const CONV = [["feet", "inches", 12], ["yards", "feet", 3], ["yards", "inches", 36], ["meters", "centimeters", 100], ["kilometers", "meters", 1000], ["centimeters", "millimeters", 10], ["pounds", "ounces", 16], ["kilograms", "grams", 1000], ["gallons", "quarts", 4], ["quarts", "pints", 2], ["pints", "cups", 2], ["gallons", "cups", 16], ["liters", "milliliters", 1000], ["hours", "minutes", 60], ["minutes", "seconds", 60]];
  G["m.m.convert"] = (R, lv) => {
    const [big, small, k] = R.pick(lv === 1 ? CONV.filter((c) => c[2] <= 60) : CONV);
    if (lv === 1) { const n = R.int(2, 9); return { q: `${n} ${big} = ? ${small}`, t: "num", ans: String(n * k), unit: small, e: `1 ${big.replace(/s$/, "")} = ${k} ${small}. Big → small means multiply: ${n} × ${k} = **${N(n * k)}** ${small}.` }; }
    if (lv === 2) {
      const n = R.int(2, 8), r = R.int(1, k > 100 ? 999 : k - 1);
      return { q: `${N(n)} ${big} ${N(r)} ${small} = ? ${small}`, t: "num", ans: String(n * k + r), unit: small, e: `${n} ${big} = ${n} × ${k} = ${N(n * k)} ${small}. Add the extra ${N(r)}: **${N(n * k + r)}** ${small}.` };
    }
    const n = R.int(2, 6), rows = [1, 2, 3, n + 2].map((x) => [x, x * k]), hide = 3;
    return { q: `The table shows how ${big} and ${small} are related. What number goes in the empty box?\n\n| ${big} | ${small} |\n|---|---|\n${rows.map((rw, i) => `| ${rw[0]} | ${i === hide ? "?" : N(rw[1])} |`).join("\n")}`, t: "num", ans: String(rows[hide][1]), unit: small,
      e: `Each row: ${small} = ${big} × ${k}. So ${rows[hide][0]} × ${k} = **${N(rows[hide][1])}**.` };
  };

  const clock = (m) => { const h = Math.floor(m / 60) % 12 || 12; return `${h}:${String(m % 60).padStart(2, "0")} ${Math.floor(m / 60) % 24 >= 12 ? "p.m." : "a.m."}`; };
  G["m.m.time"] = (R, lv) => {
    if (lv < 3 || R.chance(0.5)) {
      const start = R.int(14, 18) * 60 + R.pick([0, 5, 10, 15, 20, 30, 40, 45, 50]), dur = lv === 1 ? R.pick([30, 45, 60, 90]) : R.int(1, 2) * 60 + R.pick([10, 15, 25, 35, 40, 50]);
      const name = nm(R), act = R.pick(["dance practice", "swim lessons", "a soccer game", "art club", "a piano lesson"]);
      if (R.chance(0.5)) {
        const right = clock(start + dur);
        const { o, a } = mc(R, right, [clock(start + dur - 60), clock(start + dur + 10), clock(start + (dur % 60) + 100 * Math.floor(dur / 60) % 60), clock(start + dur + 60)]);
        return { q: `${name}'s ${act} starts at ${clock(start)} and lasts ${Math.floor(dur / 60) ? Math.floor(dur / 60) + " hour" + (dur >= 120 ? "s" : "") + (dur % 60 ? " " + (dur % 60) + " minutes" : "") : dur + " minutes"}. What time does it end?`, o, a,
          e: `Start at ${clock(start)}. Add ${Math.floor(dur / 60)} hour(s), then ${dur % 60} minutes. It ends at **${right}**.` };
      }
      return { q: `${name}'s ${act} started at ${clock(start)} and ended at ${clock(start + dur)}. How many minutes long was it?`, t: "num", ans: String(dur), unit: "minutes", e: `Count up from ${clock(start)} to ${clock(start + dur)}: that's **${dur} minutes**${dur >= 60 ? ` (${Math.floor(dur / 60)} h ${dur % 60} min)` : ""}.` };
    }
    const lap = R.pick([200, 250, 400, 500]), laps = R.int(2, 6), days = R.int(3, 5), m = lap * laps * days;
    if (m % 1000 !== 0) return { q: `${nm(R)} runs ${laps} laps around a ${lap}-meter track each day for ${days} days. How many meters does she run in all?`, t: "num", ans: String(m), unit: "meters", e: `One day: ${laps} × ${lap} = ${N(laps * lap)} m. ${days} days: ${N(laps * lap)} × ${days} = **${N(m)}** meters.` };
    return { q: `${nm(R)} runs ${laps} laps around a ${lap}-meter track each day for ${days} days. How many **kilometers** does she run in all?`, t: "num", ans: String(m / 1000), unit: "kilometers", e: `Meters: ${laps} × ${lap} × ${days} = ${N(m)} m. 1 km = 1,000 m, so ${N(m)} ÷ 1,000 = **${m / 1000}** km.` };
  };

  G["m.m.money"] = (R, lv) => {
    const items = [["a squishy toy", 350, 899], ["dance tights", 800, 1599], ["a hair bow", 150, 499], ["a smoothie", 300, 650], ["a sketchbook", 400, 1099], ["a water bottle", 500, 1299]];
    const [i1, i2] = R.sample(items, 2), p1 = R.int(i1[1] / 5, i1[2] / 5) * 5, p2 = R.int(i2[1] / 5, i2[2] / 5) * 5;
    if (lv === 1) return { q: `${nm(R)} buys ${i1[0]} for ${money(p1)} and ${i2[0]} for ${money(p2)}. How much does she spend?`, t: "num", ans: (p1 + p2) / 100 % 1 ? ((p1 + p2) / 100).toFixed(2) : String((p1 + p2) / 100), unit: "dollars", e: `Line up the decimal points: ${money(p1)} + ${money(p2)} = **${money(p1 + p2)}**.` };
    const pay = (p1 + p2) < 1000 ? 1000 : 2000;
    if (lv === 2) { const ch = pay - p1 - p2; return { q: `${nm(R)} buys ${i1[0]} for ${money(p1)} and ${i2[0]} for ${money(p2)}. She pays with a ${money(pay)} bill. How much change does she get?`, t: "num", ans: (ch / 100).toFixed(2), unit: "dollars", e: `Total: ${money(p1)} + ${money(p2)} = ${money(p1 + p2)}. Change: ${money(pay)} − ${money(p1 + p2)} = **${money(ch)}**.` }; }
    const n = R.int(3, 5), tot = n * p1, right = money(tot);
    const { o, a } = mc(R, right, [money(tot + 100), money(p1 * (n - 1)), money(tot - 10), money(p1 + n * 100)]);
    return { q: `${i1[0][0].toUpperCase() + i1[0].slice(1)} costs ${money(p1)}. ${nm(R)} buys ${n} of them for her friends. How much does she spend?`, o, a, e: `${n} × ${money(p1)}: ${n} × ${p1} cents = ${tot} cents = **${right}**.` };
  };

  G["m.dp.lineplot"] = (R, lv) => {
    const den = lv === 1 ? 2 : R.pick([4, 8]), lo = den, hi = 3 * den, n = R.int(8, 12), vals = [];
    for (let i = 0; i < n; i++) vals.push(R.int(lo, hi));
    const title = R.pick(["Lengths of ribbons (inches)", "Heights of seedlings (inches)", "Lengths of squishy toys (inches)", "Rain each day (inches)"]);
    const fig = linePlot(vals, lo, hi, den, title), sorted = vals.slice().sort((x, y) => x - y), c = {}; vals.forEach((v) => (c[v] = (c[v] || 0) + 1));
    const maxc = Math.max(...Object.values(c)), modes = Object.keys(c).filter((k) => c[k] === maxc).map(Number);
    const kind = lv === 1 ? R.pick(["count", "mode"]) : lv === 2 ? R.pick(["range", "mode", "count"]) : R.pick(["range", "median"]);
    if (kind === "mode" && modes.length > 1) return G["m.dp.lineplot"](R, lv);
    if (kind === "count") { const v = R.pick(vals); return { q: `How many items measured ${mixed(v, den)} inches?`, t: "num", ans: String(c[v]), fig, e: `Count the ✕ marks above ${mixed(v, den)}: **${c[v]}**.` }; }
    if (kind === "mode") return { q: `What is the **mode** of the data? (Write it as a fraction or mixed number.)`, t: "num", ans: `${Math.floor(modes[0] / den)} ${modes[0] % den}/${den}`.replace(/^0 /, "").replace(/ 0\/\d+$/, ""), fig, e: `The mode is the value with the most ✕ marks: **${mixed(modes[0], den)}** inches (${maxc} marks).` };
    if (kind === "range") { const r = sorted[n - 1] - sorted[0]; return { q: `What is the **range** of the data, in inches?`, t: "num", ans: `${Math.floor(r / den)} ${r % den}/${den}`.replace(/^0 /, "").replace(/ 0\/\d+$/, ""), fig, e: `Range = greatest − least = ${mixed(sorted[n - 1], den)} − ${mixed(sorted[0], den)} = **${mixed(r, den)}** inches.` }; }
    if (n % 2 === 0) vals.push(R.int(lo, hi));
    const s2 = vals.slice().sort((x, y) => x - y), med = s2[(s2.length - 1) / 2];
    return { q: `What is the **median** of the data?`, t: "num", ans: `${Math.floor(med / den)} ${med % den}/${den}`.replace(/^0 /, "").replace(/ 0\/\d+$/, ""), fig: linePlot(vals, lo, hi, den, title),
      e: `There are ${s2.length} ✕ marks. The middle one is number ${(s2.length + 1) / 2} counting from the left: **${mixed(med, den)}** inches.` };
  };

  /* ---------------- Unit 3: Multiply & Divide Dojo ---------------- */
  G["m.md.facts"] = (R, lv) => {
    const a1 = R.int(lv === 1 ? 2 : 3, lv === 1 ? 9 : 12), b1 = R.int(lv === 1 ? 2 : 6, 12);
    if (R.chance(lv === 3 ? 0.6 : 0.35)) return { q: `${a1 * b1} ÷ ${a1} = ?`, t: "num", ans: String(b1), e: `Think: ${a1} × ? = ${a1 * b1}. Since ${a1} × ${b1} = ${a1 * b1}, the answer is **${b1}**.` };
    return { q: `${a1} × ${b1} = ?`, t: "num", ans: String(a1 * b1), e: `${a1} × ${b1} = **${a1 * b1}**.${b1 > 5 ? ` Helper: ${a1} × ${b1 - 1} = ${a1 * (b1 - 1)}, plus one more ${a1} = ${a1 * b1}.` : ""}` };
  };

  G["m.md.mult"] = (R, lv) => {
    let a1, b1;
    if (lv === 1) { a1 = R.int(12, 99); b1 = R.int(3, 9); }
    else if (lv === 2) { a1 = R.int(101, 999); b1 = R.int(3, 9); if (R.chance(0.5)) { a1 = R.int(11, 99); b1 = R.int(11, 99); } }
    else { a1 = R.int(101, 999); b1 = R.int(11, 99); }
    const p = a1 * b1;
    const steps = b1 >= 10 ? `${N(a1)} × ${Math.floor(b1 / 10) * 10} = ${N(a1 * Math.floor(b1 / 10) * 10)}\n${N(a1)} × ${b1 % 10} = ${N(a1 * (b1 % 10))}\nAdd: **${N(p)}**` : `${Math.floor(a1 / 100) ? `${Math.floor(a1 / 100) * 100} × ${b1} = ${N(Math.floor(a1 / 100) * 100 * b1)}\n` : ""}${Math.floor((a1 % 100) / 10) * 10} × ${b1} = ${Math.floor((a1 % 100) / 10) * 10 * b1}\n${a1 % 10} × ${b1} = ${(a1 % 10) * b1}\nAdd: **${N(p)}**`;
    return { q: `${N(a1)} × ${b1} = ?`, t: "num", ans: String(p), e: `Break it apart (area model):\n${steps}` };
  };

  G["m.md.div"] = (R, lv) => {
    const d = R.int(lv === 1 ? 2 : 3, 9), q = lv === 1 ? R.int(11, 40) : lv === 2 ? R.int(51, 300) : R.int(150, 1100), r = lv === 1 ? 0 : R.int(lv === 3 ? 1 : 0, d - 1), n = d * q + r;
    if (lv === 3 && R.chance(0.5)) {
      const right = M(q, r, d);
      const { o, a } = mc(R, right, [`${q} R${r}`.replace(/ R0$/, "") === right ? M(q, r, 10) : M(q, r, 10), M(q + 1, r, d), M(q, d - r, d), M(q, r, d + 1)]);
      return { q: `Which shows ${N(n)} ÷ ${d} with the remainder written as a **fraction**?`, o, a, e: `${N(n)} ÷ ${d} = ${q} R${r}. The remainder ${r} out of the divisor ${d} is ${F(r, d)}, so the answer is **${right}**.` };
    }
    return { q: `${N(n)} ÷ ${d} = ?${r ? "\n\nType the quotient and the remainder, like 12 R3." : ""}`, t: "rem", ans: r ? `${q} R${r}` : String(q),
      e: `${d} × ${q} = ${N(d * q)}.${r ? ` ${N(n)} − ${N(d * q)} = ${r} left over.` : ""} Answer: **${r ? q + " R" + r : q}**.${r ? ` Check: ${d} × ${q} + ${r} = ${N(n)}.` : ""}` };
  };

  G["m.md.estimate"] = (R, lv) => {
    if (lv < 3 || R.chance(0.5)) {
      const a1 = R.int(lv === 1 ? 21 : 120, lv === 1 ? 98 : 980), b1 = R.int(3, 9), ra = lv === 1 ? Math.round(a1 / 10) * 10 : Math.round(a1 / 100) * 100, right = N(ra * b1);
      const { o, a } = mc(R, right, [N(ra * b1 * 10), N((ra + (lv === 1 ? 10 : 100)) * b1), N(ra + b1), N(Math.round(ra / 10) * b1)]);
      return { q: `Which is the **best estimate** of ${N(a1)} × ${b1}?`, o, a, e: `Round ${N(a1)} to ${N(ra)}. Then ${N(ra)} × ${b1} = **${right}**.` };
    }
    const d = R.int(3, 9), q = R.int(40, 200) * 10, n = d * q + R.int(-d * 4, d * 4), right = N(q);
    const { o, a } = mc(R, right, [N(q * 10), N(q / 10), N(q + 100), N(Math.round(n / 10))]);
    return { q: `Which is the best estimate of ${N(n)} ÷ ${d}?`, o, a, e: `${N(n)} is close to ${N(d * q)}, which divides evenly by ${d}: ${N(d * q)} ÷ ${d} = **${right}**.` };
  };

  G["m.ar.word"] = (R, lv) => {
    const [a1, b1] = two(R);
    if (lv === 1) { const n = R.int(3, 12), k = R.int(2, 9); return { q: `${b1} has ${n} squishies. ${a1} has ${k} times as many squishies as ${b1}. How many squishies does ${a1} have?`, t: "num", ans: String(n * k), e: `"${k} times as many" means multiply: ${k} × ${n} = **${n * k}**.` }; }
    if (lv === 2) {
      const per = R.int(4, 9), groups = R.int(6, 25), extra = R.int(1, per - 1), total = per * groups + extra, kind = R.pick(["up", "down"]);
      if (kind === "up") return { q: `${total} dancers are going to a competition. Each van holds ${per} dancers. What is the **fewest** vans needed so every dancer gets a ride?`, t: "num", ans: String(groups + 1), unit: "vans", e: `${total} ÷ ${per} = ${groups} R${extra}. The ${extra} leftover dancer${extra > 1 ? "s" : ""} still need${extra > 1 ? "" : "s"} a ride, so add one more van: **${groups + 1}** vans.` };
      return { q: `${a1} has ${total} beads. Each bracelet needs ${per} beads. How many bracelets can ${a1} **finish**?`, t: "num", ans: String(groups), unit: "bracelets", e: `${total} ÷ ${per} = ${groups} R${extra}. The ${extra} leftover beads aren't enough for another bracelet, so **${groups}** bracelets.` };
    }
    const n = R.int(4, 15), k = R.int(3, 8), cost = R.int(2, 9);
    return { q: `${b1} practiced ${n} minutes. ${a1} practiced ${k} times as long as ${b1}. Then ${a1} practiced ${cost * 5} more minutes. How many minutes did ${a1} practice in all?`, t: "num", ans: String(n * k + cost * 5), unit: "minutes",
      e: `Step 1: ${k} × ${n} = ${n * k} minutes. Step 2: ${n * k} + ${cost * 5} = **${n * k + cost * 5}** minutes.` };
  };

  G["m.ar.equation"] = (R, lv) => {
    if (lv === 1) {
      const a1 = R.int(3, 9), b1 = R.int(3, 12), p = a1 * b1, pos = R.pick(["a", "b", "p"]);
      if (pos === "p") return { q: `${a1} × ${b1} = ?`, t: "num", ans: String(p), e: `${a1} × ${b1} = **${p}**.` };
      return pos === "a" ? { q: `? × ${b1} = ${p}`, t: "num", ans: String(a1), e: `Think division: ${p} ÷ ${b1} = **${a1}**.` } : { q: `${p} ÷ ? = ${a1}`, t: "num", ans: String(b1), e: `${p} ÷ ${b1} = ${a1}, so the missing number is **${b1}**.` };
    }
    if (lv === 2) {
      const a1 = R.int(3, 9), b1 = R.int(4, 12), p = a1 * b1, fact = [...Array(12).keys()].map((x) => x + 1).filter((x) => p % x === 0 && x !== a1 && x !== b1 && p / x <= 20);
      const truth = R.chance(0.5) && fact.length;
      const c = truth ? R.pick(fact) : R.int(2, 9), dd = truth ? p / c : Math.round(p / c) + (Math.round(p / c) * c === p ? 1 : 0);
      const o = ["True", "False"];
      return { q: `Is this equation true or false?\n\n${a1} × ${b1} = ${c} × ${dd}`, o, a: a1 * b1 === c * dd ? 0 : 1, e: `Left side: ${a1} × ${b1} = ${p}. Right side: ${c} × ${dd} = ${c * dd}. ${p === c * dd ? "Both are " + p + ", so it is **true**." : p + " ≠ " + c * dd + ", so it is **false**."}` };
    }
    const name = nm(R), n = R.int(4, 9), each = R.int(6, 12), tot = n * each;
    const right = `${tot} ÷ ${n} = s`;
    const { o, a } = mc(R, right, [`${n} × ${tot} = s`, `${tot} − ${n} = s`, `s ÷ ${n} = ${tot}`]);
    return { q: `${name} shares ${tot} stickers equally among ${n} friends. Which equation can be used to find **s**, the number of stickers each friend gets?`, o, a, e: `Sharing equally is division: ${tot} ÷ ${n} = s. (So s = ${each}.) You could also write ${n} × s = ${tot}.` };
  };

  const factors = (n) => { const f = []; for (let i = 1; i <= n; i++) if (n % i === 0) f.push(i); return f; };
  G["m.ar.factors"] = (R, lv) => {
    if (lv === 1) {
      const n = R.pick([12, 16, 18, 20, 24, 30, 36, 40, 42, 48]), f = factors(n), nf = [...Array(12).keys()].map((x) => x + 2).filter((x) => n % x !== 0);
      const right = R.pick(f.filter((x) => x > 1 && x < n));
      const { o, a } = mc(R, String(right), R.sample(nf, 4).map(String));
      return { q: `Which number is a **factor** of ${n}?`, o, a, e: `${n} ÷ ${right} = ${n / right} with no remainder, so **${right}** is a factor. Factor pairs of ${n}: ${f.filter((x) => x * x <= n).map((x) => x + " × " + n / x).join(", ")}.` };
    }
    if (lv === 2) {
      const n = R.pick([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 1, 9, 15, 21, 25, 27, 33, 35, 39, 49, 51, 57, 63, 91]), f = factors(n);
      const o = ["prime", "composite", "neither prime nor composite"], right = n === 1 ? 2 : f.length === 2 ? 0 : 1;
      return { q: `Is ${n} prime, composite, or neither?`, o, a: right, e: n === 1 ? "1 has only one factor (itself), so it is **neither** prime nor composite." : `Factors of ${n}: ${f.join(", ")}. ${f.length === 2 ? "Exactly two factors → **prime**." : "More than two factors → **composite**."}` };
    }
    const k = R.int(6, 9), mults = [k * R.int(3, 12), k * R.int(3, 12)];
    if (mults[0] === mults[1]) mults[1] += k;
    const wrongs = []; while (wrongs.length < 3) { const w = R.int(20, 110); if (w % k && !wrongs.includes(w)) wrongs.push(w); }
    const { o, a } = mc2(R, mults, wrongs);
    return { q: `Which **two** numbers are multiples of ${k}? Choose **two** answers.`, o, a, e: `A multiple of ${k} is in the ${k} times table: ${mults[0]} = ${k} × ${mults[0] / k} and ${mults[1]} = ${k} × ${mults[1] / k}.` };
  };

  G["m.ar.pattern"] = (R, lv) => {
    const start = R.int(1, 12), step = R.int(2, 9), mult = lv === 3 && R.chance(0.5);
    const seq = [start]; for (let i = 1; i < 6; i++) seq.push(mult ? seq[i - 1] * 2 : seq[i - 1] + step);
    if (lv < 3) {
      return { q: `The rule is "${mult ? "multiply by 2" : "add " + step}." The pattern starts at ${start}.\n\n${seq.slice(0, 4).join(", ")}, ?\n\nWhat is the next number?`, t: "num", ans: String(seq[4]), e: `${seq[3]} ${mult ? "× 2" : "+ " + step} = **${seq[4]}**.` };
    }
    const odd = seq.slice(0, 5).every((x) => x % 2 === 1), even = seq.slice(0, 5).every((x) => x % 2 === 0);
    const right = mult ? "Each number is double the number before it." : `Each number is ${step} more than the number before it.`;
    const { o, a } = mc(R, right, [mult ? "Each number is 2 more than the number before it." : `Each number is ${step} times the number before it.`, mult ? `Each number is ${seq[1] - seq[0]} more than the number before it.` : `Each number is ${step + 1} more than the number before it.`, odd ? "All of the numbers are even." : even ? "All of the numbers are odd." : "Every number is a multiple of " + step + "."]);
    return { q: `Look at the pattern.\n\n${seq.slice(0, 5).join(", ")}, …\n\nWhich statement describes the pattern?`, o, a, e: `Check neighbors: ${seq[0]} → ${seq[1]} → ${seq[2]}. ${right}` };
  };

  /* ---------------- Unit 4: Place Value Peaks ---------------- */
  const PLACES = ["ones", "tens", "hundreds", "thousands", "ten thousands", "hundred thousands"];
  G["m.nso.place"] = (R, lv) => {
    if (lv === 1) {
      const n = R.int(10000, 999999), s = String(n), i = R.int(0, s.length - 1), dgt = +s[s.length - 1 - i] || 5;
      const m = +(s.slice(0, s.length - 1 - i) + dgt + s.slice(s.length - i)), val = dgt * 10 ** i;
      if (String(m).split("").filter((c) => +c === dgt).length > 1) return G["m.nso.place"](R, lv);
      const { o, a } = mc(R, N(val), [N(dgt * 10 ** (i + 1)), N(dgt * 10 ** Math.max(0, i - 1)), String(dgt), N(dgt * 10 ** (i + 2))]);
      return { q: `What is the **value** of the digit ${dgt} in ${N(m)}?`, o, a, e: `The ${dgt} is in the **${PLACES[i]}** place, so its value is ${dgt} × ${N(10 ** i)} = **${N(val)}**.`, };
    }
    if (lv === 2) {
      const n = R.int(1000, 99999), s = String(n), parts = s.split("").map((c, i) => +c * 10 ** (s.length - 1 - i)).filter((x) => x), right = parts.map(N).join(" + ");
      const swap = parts.slice(); if (swap.length > 1) swap[swap.length - 1] = swap[swap.length - 1] * 10;
      const { o, a } = mc(R, right, [s.split("").filter((c) => c !== "0").join(" + "), swap.map(N).join(" + "), parts.map((x) => N(x / 10 >= 1 ? x / 10 : x)).join(" + "), parts.slice(0, -1).map(N).join(" + ")]);
      return { q: `Which shows ${N(n)} in **expanded form**?`, o, a, e: `Write each digit times its place value: **${right}**.` };
    }
    const dgt = R.int(2, 9), i = R.int(1, 3), from = dgt * 10 ** i, to = from * 10;
    const o = ["10 times as great", "100 times as great", "1/10 as great", "The value stays the same"];
    const left = R.chance(0.6);
    return { q: `In the number ${N(R.int(1, 9) * 10 ** (i + 2) + from + R.int(0, 9))}, the digit ${dgt} has a value of ${N(from)}. If the ${dgt} moves **one place to the ${left ? "left" : "right"}**, how does its value change?`, o, a: left ? 0 : 2,
      e: left ? `One place left = ×10. ${N(from)} becomes ${N(to)}, which is **10 times as great**.` : `One place right = ÷10. ${N(from)} becomes ${N(from / 10)}, which is **1/10 as great**.` };
  };

  G["m.nso.compare"] = (R, lv) => {
    if (lv < 3) {
      const a1 = R.int(lv === 1 ? 1000 : 100000, lv === 1 ? 99999 : 999999), dIdx = R.int(0, String(a1).length - 2), s = String(a1).split(""), j = dIdx;
      s[j] = String((+s[j] + R.int(1, 8)) % 10); if (s[0] === "0") s[0] = "1";
      const b1 = +s.join(""); if (a1 === b1) return G["m.nso.compare"](R, lv);
      const o = ["<", ">", "="], right = a1 > b1 ? ">" : "<";
      return { q: `Which symbol makes this true?\n\n${N(a1)} ☐ ${N(b1)}`, o, a: o.indexOf(right), e: `Line up the places and compare from the left. The first different digit is in the ${PLACES[String(a1).length - 1 - j]} place: ${String(a1)[j]} ${right} ${String(b1)[j]}. So ${N(a1)} **${right}** ${N(b1)}.` };
    }
    const base = R.int(100, 999) * 1000, vals = R.shuffle([base + R.int(100, 999), base + R.int(10, 99) * 1000 % 1000 + R.int(1, 99), base - R.int(1000, 9000), base + 10000 + R.int(0, 999)]);
    if (new Set(vals).size < 4) return G["m.nso.compare"](R, 3);
    const sorted = vals.slice().sort((x, y) => x - y), show = (arr) => arr.map(N).join(", ");
    const { o, a } = mc(R, show(sorted), [show(sorted.slice().reverse()), show([sorted[1], sorted[0], sorted[2], sorted[3]]), show([sorted[0], sorted[2], sorted[1], sorted[3]])]);
    return { q: `Which list is ordered from **least to greatest**?`, o, a, e: `Compare place by place from the left. Least to greatest: **${show(sorted)}**.` };
  };

  G["m.nso.round"] = (R, lv) => {
    const n = R.int(lv === 1 ? 100 : 1000, 9999), place = lv === 1 ? R.pick([10, 100]) : R.pick([10, 100, 1000]), r = Math.round(n / place) * place;
    if (lv === 3 && R.chance(0.5)) {
      const t = R.int(11, 89) * 100, rights = [t - 50 + R.int(0, 49), t + R.int(1, 49)], wrongs = [t - 50 - R.int(1, 40), t + 50 + R.int(0, 40), t + 150 + R.int(0, 40)];
      const { o, a } = mc2(R, rights.map(N), wrongs.map(N));
      return { q: `Which **two** numbers round to ${N(t)} when rounded to the nearest hundred? Choose **two** answers.`, o, a, e: `Numbers from ${N(t - 50)} up to ${N(t + 49)} round to ${N(t)}. ${N(rights[0])} and ${N(rights[1])} are in that range.` };
    }
    const word = { 10: "ten", 100: "hundred", 1000: "thousand" }[place], look = Math.floor((n % place) / (place / 10));
    return { q: `Round ${N(n)} to the nearest **${word}**.`, t: "num", ans: String(r), e: `Look at the digit to the right of the ${word}s place: ${look}. ${look >= 5 ? "5 or more → round up" : "4 or less → stay"}. Answer: **${N(r)}**.` };
  };

  root.FASTMath4 = G;
})(typeof window !== "undefined" ? window : globalThis);
