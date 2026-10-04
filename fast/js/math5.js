/* FAST Prep — Grade 5 "Level Up" stretch generators (Florida B.E.S.T. grade 5).
   Same shape as math4.js. i-Ready adapts upward, so these give her practice with what comes next. */
(function (root) {
  "use strict";
  const { gcd, N, F, M, mixed, simp, mc, grid, prism } = root.FASTFig;
  const G = {};
  const fs = (n, d) => { const [a, b] = simp(n, d); return b === 1 ? String(a) : a > b ? mixed(a, b) : F(a, b); };
  const fsAns = (n, d) => { const [a, b] = simp(n, d); return b === 1 ? String(a) : `${a}/${b}`; };

  G["s.dec.place"] = (R, lv) => {
    if (lv === 1) {
      const x = R.int(1000, 9999) / 1000, s = x.toFixed(3), digit = s[4], right = "thousandths";
      if (s.split("").filter((c) => c === digit).length > 1) return G["s.dec.place"](R, lv);
      const { o, a } = mc(R, right, ["tenths", "hundredths", "thousands"]);
      return { q: `In ${s}, which place is the digit ${digit} in?`, o, a, e: `After the decimal point: tenths, hundredths, **thousandths**. The ${digit} is the third digit after the point.` };
    }
    if (lv === 2) {
      const a1 = R.int(100, 999) / 1000, b1 = R.int(10, 99) / 100;
      if (a1 === b1) return G["s.dec.place"](R, 2);
      const o = ["<", ">", "="], right = a1 > b1 ? ">" : "<";
      return { q: `Which symbol makes this true?\n\n${a1.toFixed(3)} ☐ ${b1.toFixed(2)}`, o, a: o.indexOf(right), e: `Add a zero so both have 3 places: ${b1.toFixed(2)} = ${b1.toFixed(3)}. Compare ${a1.toFixed(3)} and ${b1.toFixed(3)}: **${right}**.` };
    }
    const x = R.int(10000, 99999) / 1000, place = R.pick([["tenth", 1], ["hundredth", 2]]), r = x.toFixed(place[1]);
    return { q: `Round ${x.toFixed(3)} to the nearest **${place[0]}**.`, t: "num", ans: r, e: `Look one place to the right of the ${place[0]}s place. 5 or more rounds up. Answer: **${r}**.` };
  };

  G["s.dec.ops"] = (R, lv) => {
    if (lv === 1) { const a1 = R.int(100, 2000) / 100, b1 = R.int(10, 900) / 100, ans = +(a1 + b1).toFixed(2); return { q: `${a1.toFixed(2)} + ${b1.toFixed(2)} = ?`, t: "num", ans: ans.toFixed(2), e: `Line up the decimal points and add like whole numbers: **${ans.toFixed(2)}**.` }; }
    if (lv === 2) { const a1 = R.int(500, 3000) / 100, b1 = R.int(10, 400) / 100, ans = +(a1 - b1).toFixed(2); return { q: `${a1.toFixed(2)} − ${b1.toFixed(2)} = ?`, t: "num", ans: ans.toFixed(2), e: `Line up the decimal points, then subtract (regroup if you need to): **${ans.toFixed(2)}**.` }; }
    const a1 = R.int(11, 99) / 10, b1 = R.int(2, 9), ans = +(a1 * b1).toFixed(1);
    return { q: `${a1.toFixed(1)} × ${b1} = ?`, t: "num", ans: ans.toFixed(1), e: `${Math.round(a1 * 10)} × ${b1} = ${Math.round(a1 * 10) * b1}. The factor ${a1.toFixed(1)} has 1 decimal place, so the product has 1: **${ans.toFixed(1)}**.` };
  };

  G["s.md.div2"] = (R, lv) => {
    const d = R.int(lv === 1 ? 11 : 12, lv === 1 ? 20 : 48), q = R.int(lv === 1 ? 3 : 12, lv === 1 ? 9 : 99), r = lv === 3 ? R.int(1, d - 1) : 0, n = d * q + r;
    return { q: `${N(n)} ÷ ${d} = ?${r ? "\n\nType the quotient and remainder, like 12 R3." : ""}`, t: "rem", ans: r ? `${q} R${r}` : String(q),
      e: `Estimate: ${d} is about ${Math.round(d / 10) * 10}. Then check: ${d} × ${q} = ${N(d * q)}${r ? `, and ${N(n)} − ${N(d * q)} = ${r} left over` : ""}. Answer: **${r ? q + " R" + r : q}**.` };
  };

  G["s.fr.unlike"] = (R, lv) => {
    const pairs = lv === 1 ? [[2, 4], [3, 6], [2, 8], [4, 8], [5, 10], [3, 9]] : [[2, 3], [3, 4], [2, 5], [4, 6], [3, 5], [6, 8], [4, 10], [3, 8]];
    const [d1, d2] = R.pick(pairs), L = d1 * d2 / gcd(d1, d2), n1 = R.int(1, d1 - 1), n2 = R.int(1, d2 - 1), sub = lv === 3 && n1 / d1 > n2 / d2;
    const top = sub ? n1 * (L / d1) - n2 * (L / d2) : n1 * (L / d1) + n2 * (L / d2);
    return { q: `${F(n1, d1)} ${sub ? "−" : "+"} ${F(n2, d2)} = ?`, t: "num", ans: `${top}/${L}`,
      e: `Common denominator ${L}: ${F(n1, d1)} = ${F(n1 * L / d1, L)} and ${F(n2, d2)} = ${F(n2 * L / d2, L)}.\n${n1 * L / d1} ${sub ? "−" : "+"} ${n2 * L / d2} = ${top}, so the answer is **${F(top, L)}**${gcd(top, L) > 1 || top > L ? " = " + fs(top, L) : ""}.` };
  };

  G["s.fr.mult"] = (R, lv) => {
    const d1 = R.int(2, 6), d2 = R.int(2, 8), n1 = R.int(1, d1 - 1), n2 = R.int(1, d2 - 1);
    if (lv === 3) { const w = R.int(6, 24), dd = R.pick([2, 3, 4, 6]), nn = R.int(1, dd - 1); return { q: `What is ${F(nn, dd)} of ${w}?`, t: "num", ans: fsAns(nn * w, dd), e: `${F(nn, dd)} × ${w} = ${F(nn * w, dd)} = **${fs(nn * w, dd)}**.` }; }
    return { q: `${F(n1, d1)} × ${F(n2, d2)} = ?`, t: "num", ans: `${n1 * n2}/${d1 * d2}`, e: `Top × top: ${n1} × ${n2} = ${n1 * n2}. Bottom × bottom: ${d1} × ${d2} = ${d1 * d2}. Answer: **${F(n1 * n2, d1 * d2)}**${gcd(n1 * n2, d1 * d2) > 1 ? " = " + fs(n1 * n2, d1 * d2) : ""}.` };
  };

  G["s.fr.divunit"] = (R, lv) => {
    const d = R.int(2, 8), w = R.int(2, 9);
    if (R.chance(0.5)) return { q: `${w} ÷ ${F(1, d)} = ?`, t: "num", ans: String(w * d), e: `How many ${F(1, d)}s fit in ${w}? Each whole has ${d} of them, so ${w} × ${d} = **${w * d}**.` };
    return { q: `${F(1, d)} ÷ ${w} = ?`, t: "num", ans: `1/${d * w}`, e: `Share ${F(1, d)} into ${w} equal parts. Each part is ${F(1, d * w)} — the pieces get smaller! Answer: **${F(1, d * w)}**.` };
  };

  G["s.fr.division"] = (R, lv) => {
    const a1 = R.int(2, lv === 1 ? 5 : 11), b1 = R.int(3, 8);
    if (a1 % b1 === 0) return G["s.fr.division"](R, lv);
    const right = F(a1, b1), { o, a } = mc(R, right, [F(b1, a1), F(a1, a1 + b1), F(1, b1), `${a1 * b1}`]);
    return { q: `${a1} pizzas are shared equally by ${b1} friends. How much pizza does each friend get?`, o, a, e: `${a1} ÷ ${b1} = ${right}${a1 > b1 ? " = " + mixed(a1, b1) : ""} pizza each. A fraction is a division problem!` };
  };

  G["s.ar.order"] = (R, lv) => {
    const a1 = R.int(2, 9), b1 = R.int(2, 9), c1 = R.int(2, 9), d1 = R.int(1, 9);
    if (lv === 1) return { q: `${a1} + ${b1} × ${c1} = ?`, t: "num", ans: String(a1 + b1 * c1), e: `Multiply first: ${b1} × ${c1} = ${b1 * c1}. Then add: ${a1} + ${b1 * c1} = **${a1 + b1 * c1}**.` };
    if (lv === 2) return { q: `(${a1} + ${b1}) × ${c1} − ${d1} = ?`, t: "num", ans: String((a1 + b1) * c1 - d1), e: `Parentheses: ${a1} + ${b1} = ${a1 + b1}. Multiply: × ${c1} = ${(a1 + b1) * c1}. Subtract: − ${d1} = **${(a1 + b1) * c1 - d1}**.` };
    const right = `${c1} × (${a1} + ${b1})`;
    const { o, a } = mc(R, right, [`${c1} × ${a1} + ${b1}`, `${c1} + ${a1} × ${b1}`, `(${c1} + ${a1}) × ${b1}`]);
    return { q: `Which expression means "${c1} times the sum of ${a1} and ${b1}"?`, o, a, e: `"The sum of ${a1} and ${b1}" must happen first, so it goes in parentheses: **${right}**.` };
  };

  G["s.gr.volume"] = (R, lv) => {
    const l = R.int(2, 9), w = R.int(2, 6), h = R.int(2, 8);
    if (lv < 3) return { q: `What is the volume of the box?`, t: "num", ans: String(l * w * h), unit: "cubic centimeters", fig: prism(l, w, h), e: `Volume = length × width × height = ${l} × ${w} × ${h} = **${l * w * h}** cubic cm.` };
    return { q: `A box has a volume of ${l * w * h} cubic centimeters. It is ${l} cm long and ${w} cm wide. How tall is it?`, t: "num", ans: String(h), unit: "centimeters", e: `${l} × ${w} = ${l * w}. Then ${l * w * h} ÷ ${l * w} = **${h}** cm.` };
  };

  G["s.gr.coord"] = (R, lv) => {
    const pts = []; const L = ["A", "B", "C", "D"];
    while (pts.length < 4) { const p = { x: R.int(0, 8), y: R.int(0, 8) }; if (!pts.some((q) => q.x === p.x && q.y === p.y) && !pts.some((q) => q.x === p.y && q.y === p.x)) pts.push(p); }
    pts.forEach((p, i) => (p.label = L[i]));
    const k = R.int(0, 3), t = pts[k];
    if (lv === 1 || R.chance(0.5)) return { q: `Which point is at (${t.x}, ${t.y})?`, o: L, a: k, fig: grid(8, pts), e: `Go ${t.x} across (x), then ${t.y} up (y): point **${t.label}**.` };
    const right = `(${t.x}, ${t.y})`, { o, a } = mc(R, right, [`(${t.y}, ${t.x})`, `(${t.x + 1}, ${t.y})`, `(${t.x}, ${t.y + 1})`]);
    return { q: `What are the coordinates of point ${t.label}?`, o, a, fig: grid(8, pts), e: `Across first, then up: **${right}**. Swapping them, like (${t.y}, ${t.x}), lands on a different spot!` };
  };

  G["s.dp.mean"] = (R, lv) => {
    const n = R.int(4, 6), mean = R.int(5, 20), vals = [];
    for (let i = 0; i < n - 1; i++) vals.push(mean + R.int(-4, 4));
    vals.push(mean * n - vals.reduce((a, b) => a + b, 0));
    if (vals[n - 1] <= 0) return G["s.dp.mean"](R, lv);
    const shown = R.shuffle(vals);
    return { q: `${R.pick(["Points scored in", "Minutes danced in", "Pages read in"])} ${n} days: ${shown.join(", ")}.\n\nWhat is the **mean**?`, t: "num", ans: String(mean), e: `Add them: ${shown.join(" + ")} = ${mean * n}. Divide by ${n}: ${mean * n} ÷ ${n} = **${mean}**.` };
  };

  root.FASTMath5 = G;
})(typeof window !== "undefined" ? window : globalThis);
