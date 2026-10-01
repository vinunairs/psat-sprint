/* Test Prep Hub — math question types added in batch 3.
   Fills the gaps from the question review: rearranging formulas, systems of inequalities,
   polynomial and rational expressions, measures of spread, area and scale, polygons and
   parallel lines. Also adds genuinely harder multi-step items that appear only at level 3
   (MathGen.HARD): function composition, circle equations in expanded form, perpendicular
   lines, two-way tables, percent growth models, and quadratic–constant systems. */
(function (root) {
  const C = root.PSCore || (typeof require !== "undefined" ? require("./core.js") : null);
  const MG = root.MathGen || (typeof require !== "undefined" ? require("./mathgen.js") : null);
  const { fmtN, frac, poly, lin, mc, gcd, MINUS } = C;
  const M = MINUS;
  const G = MG.G;
  const sgn = (n) => (n === 0 ? "" : n < 0 ? " " + M + " " + fmtN(Math.abs(n)) : " + " + fmtN(n));
  const retry = () => { throw { retry: true }; };
  const pr = (s) => (/[ +−-]/.test(s.slice(1)) ? "(" + s + ")" : s); // (x + 3) but plain x

  /* ---------- Rearranging formulas (literal equations) ---------- */
  const LIT2 = [
    { f: "A = ½bh", v: "h", ctx: "The formula gives the area A of a triangle with base b and height h.", ans: "h = 2A/b", d: ["h = A/(2b)", "h = 2Ab", "h = 2b/A"], how: "Multiply both sides by 2 to get 2A = bh, then divide by b." },
    { f: "P = 2l + 2w", v: "w", ctx: "The formula gives the perimeter P of a rectangle with length l and width w.", ans: "w = (P − 2l)/2", d: ["w = P − 2l", "w = (P − l)/2", "w = P/2 − 2l"], how: "Subtract 2l from both sides to get P − 2l = 2w, then divide by 2." },
    { f: "V = πr²h", v: "h", ctx: "The formula gives the volume V of a cylinder with radius r and height h.", ans: "h = V/(πr²)", d: ["h = Vπr²", "h = V − πr²", "h = πr²/V"], how: "h is multiplied by πr², so divide both sides by πr²." },
    { f: "F = (9/5)C + 32", v: "C", ctx: "The formula converts a temperature C in degrees Celsius to F in degrees Fahrenheit.", ans: "C = (5/9)(F − 32)", d: ["C = (9/5)(F − 32)", "C = (5/9)F − 32", "C = (5/9)(F + 32)"], how: "Subtract 32 first, then multiply by 5/9 (the reciprocal of 9/5)." },
    { f: "I = Prt", v: "r", ctx: "The formula gives the simple interest I earned on principal P at annual rate r for t years.", ans: "r = I/(Pt)", d: ["r = IPt", "r = Pt/I", "r = I − Pt"], how: "r is multiplied by Pt, so divide both sides by Pt." },
    { f: "E = ½mv²", v: "v", ctx: "The formula gives the kinetic energy E of an object with mass m moving at speed v, where v > 0.", ans: "v = √(2E/m)", d: ["v = 2E/m", "v = √(E/(2m))", "v = √(2Em)"], how: "Multiply by 2 and divide by m to get v² = 2E/m, then take the square root." },
    { f: "y = mx + b", v: "x", ctx: "The equation relates x and y, where m ≠ 0.", ans: "x = (y − b)/m", d: ["x = (y + b)/m", "x = y/m − b", "x = m(y − b)"], how: "Subtract b from both sides, then divide by m." },
    { f: "S = 2πr² + 2πrh", v: "h", ctx: "The formula gives the surface area S of a cylinder with radius r and height h.", ans: "h = (S − 2πr²)/(2πr)", d: ["h = S/(2πr) − 2πr²", "h = S − 2πr² − 2πr", "h = (S − 2πr)/(2πr²)"], how: "Subtract 2πr² from both sides, then divide by 2πr." }
  ];
  const LIT3 = [
    { f: "a = (b + c)/b", v: "b", ctx: "In the equation, a ≠ 1 and b ≠ 0.", ans: "b = c/(a − 1)", d: ["b = c/(a + 1)", "b = (c − 1)/a", "b = c(a − 1)"], how: "Multiply by b: ab = b + c. Get both b-terms on one side: ab − b = c. Factor: b(a − 1) = c, so b = c/(a − 1)." },
    { f: "y = (x + 3)/(x − 2)", v: "x", ctx: "In the equation, x ≠ 2 and y ≠ 1.", ans: "x = (2y + 3)/(y − 1)", d: ["x = (2y − 3)/(y − 1)", "x = (y + 3)/(y − 2)", "x = (2y + 3)/(y + 1)"], how: "Multiply by (x − 2): xy − 2y = x + 3. Collect x-terms: xy − x = 2y + 3. Factor: x(y − 1) = 2y + 3." },
    { f: "1/f = 1/p + 1/q", v: "q", ctx: "The lens equation relates focal length f to distances p and q, where p ≠ f.", ans: "q = pf/(p − f)", d: ["q = p − f", "q = pf/(f − p)", "q = (p − f)/(pf)"], how: "1/q = 1/f − 1/p = (p − f)/(pf). Flip both sides: q = pf/(p − f)." },
    { f: "A = P + Prt", v: "P", ctx: "The formula gives the amount A in an account after simple interest, where 1 + rt ≠ 0.", ans: "P = A/(1 + rt)", d: ["P = A − rt", "P = A/(rt)", "P = (A − 1)/(rt)"], how: "P appears twice, so factor it out: A = P(1 + rt). Then divide by (1 + rt)." },
    { f: "k = (3m − n)/(m + n)", v: "m", ctx: "In the equation, k ≠ 3 and m + n ≠ 0.", ans: "m = n(k + 1)/(3 − k)", d: ["m = n(k − 1)/(3 − k)", "m = n(k + 1)/(k − 3)", "m = (k + n)/(3 − k)"], how: "Multiply: km + kn = 3m − n. Collect m-terms: km − 3m = −n − kn, so m(k − 3) = −n(k + 1) and m = n(k + 1)/(3 − k)." }
  ];
  G.alg_literal = (r, L) => {
    if (L === 1) {
      const t = r.int(0, 2);
      if (t === 0) { const l = r.int(4, 20), w = r.int(2, 15), P = 2 * l + 2 * w;
        const { o, a } = mc(r, w, [P - l, (P - l) / 2, P / 2 - 2 * l, P - 2 * l], fmtN);
        return { d: "alg", sk: "Rearranging formulas", q: `The perimeter P of a rectangle is given by P = 2l + 2w, where l is the length and w is the width. A rectangle has a perimeter of ${P} inches and a length of ${l} inches. What is its width, in inches?`, o, a, spr: w,
          e: `Substitute: ${P} = 2(${l}) + 2w, so ${P} = ${2 * l} + 2w. Subtract: 2w = ${P - 2 * l}, so w = ${w}.`, t: "Plug in what you know, then solve for what's left.", key: `lit1p:${l},${w}` }; }
      if (t === 1) { const b = r.pick([4, 6, 8, 10, 12, 14]), h = r.int(3, 15), A = (b * h) / 2;
        const { o, a } = mc(r, h, [A / b, 2 * A * b, A - b, 2 * A - b], fmtN);
        return { d: "alg", sk: "Rearranging formulas", q: `The area A of a triangle is given by A = ½bh, where b is the base and h is the height. A triangle has an area of ${fmtN(A)} square centimeters and a base of ${b} centimeters. What is its height, in centimeters?`, o, a, spr: h,
          e: `${fmtN(A)} = ½(${b})h = ${b / 2}h, so h = ${fmtN(A)} ÷ ${b / 2} = ${h}.`, t: "Don't forget the ½: the height is 2A ÷ b.", key: `lit1a:${b},${h}` }; }
      const Cc = r.pick([-10, -5, 0, 5, 10, 15, 20, 25, 30, 35, 40]), F = (9 * Cc) / 5 + 32;
      const { o, a } = mc(r, Cc, [F - 32, Math.round((9 / 5) * (F - 32)), Math.round((5 / 9) * F - 32), Cc + 32].filter(Number.isInteger), fmtN);
      return { d: "alg", sk: "Rearranging formulas", q: `The formula F = (9/5)C + 32 converts a temperature of C degrees Celsius to F degrees Fahrenheit. What temperature, in degrees Celsius, is equal to ${fmtN(F)} degrees Fahrenheit?`, o, a, spr: Cc,
        e: `${fmtN(F)} = (9/5)C + 32. Subtract 32: ${fmtN(F - 32)} = (9/5)C. Multiply by 5/9: C = ${fmtN(Cc)}.`, t: "Undo in reverse: subtract 32 first, then multiply by 5/9.", key: `lit1c:${Cc}` };
    }
    const it = r.pick(L === 2 ? LIT2 : LIT3);
    const { o, a } = mc(r, it.ans, it.d, String);
    return { d: "alg", sk: "Rearranging formulas", q: `${it.f}\n\n${it.ctx} Which equation correctly expresses ${it.v} in terms of the other variables?`, o, a,
      e: it.how, t: L === 3 ? "If the variable shows up twice, get both terms on one side and factor it out." : "Treat the other letters like numbers and undo the operations in reverse order.", key: `lit${L}:${it.f}` };
  };

  /* ---------- Systems of linear inequalities ---------- */
  const SYM = { gt: ">", ge: "≥", lt: "<", le: "≤" };
  const holds = (op, lhs, rhs) => (op === "gt" ? lhs > rhs : op === "ge" ? lhs >= rhs : op === "lt" ? lhs < rhs : lhs <= rhs);
  G.alg_sysineq = (r, L) => {
    const m1 = r.nz(-3, 3), b1 = r.int(-4, 4), m2 = r.nz(-3, 3), b2 = r.int(-4, 4);
    if (m1 === m2) retry();
    const op1 = L === 1 ? r.pick(["gt", "lt"]) : r.pick(["gt", "ge", "lt", "le"]), op2 = L === 1 ? (op1 === "gt" ? "lt" : "gt") : r.pick(["gt", "ge", "lt", "le"]);
    const ok1 = (x, y) => holds(op1, y, m1 * x + b1), ok2 = (x, y) => holds(op2, y, m2 * x + b2), ok = (x, y) => ok1(x, y) && ok2(x, y);
    const all = [];
    for (let x = -6; x <= 6; x++) for (let y = -8; y <= 8; y++) all.push([x, y]);
    const good = all.filter(([x, y]) => ok(x, y) && (L !== 3 || y === m1 * x + b1 || y === m2 * x + b2));
    const onStrict = all.filter(([x, y]) => (y === m1 * x + b1 && (op1 === "gt" || op1 === "lt") && ok2(x, y)) || (y === m2 * x + b2 && (op2 === "gt" || op2 === "lt") && ok1(x, y)));
    const f1 = all.filter(([x, y]) => !ok1(x, y) && ok2(x, y)), f2 = all.filter(([x, y]) => ok1(x, y) && !ok2(x, y));
    if (!good.length || !f1.length || !f2.length) retry();
    if (L === 3 && !onStrict.length) retry();
    const right = r.pick(good);
    const wrong = L === 3 ? [r.pick(onStrict), r.pick(f1), r.pick(f2)] : [r.pick(f1), r.pick(f2), r.pick(all.filter(([x, y]) => !ok1(x, y) && !ok2(x, y)).concat(f1))];
    const pt = ([x, y]) => `(${fmtN(x)}, ${fmtN(y)})`;
    const { o, a } = mc(r, pt(right), wrong.map(pt), String);
    const s1 = `y ${SYM[op1]} ${lin(m1, b1)}`, s2 = `y ${SYM[op2]} ${lin(m2, b2)}`;
    const [rx, ry] = right;
    return { d: "alg", sk: "Linear inequalities", q: `${s1}\n${s2}\n\nWhich point (x, y) is a solution to the system of inequalities?`, o, a,
      e: `Test each point in BOTH inequalities. For ${pt(right)}: ${fmtN(ry)} ${SYM[op1]} ${fmtN(m1 * rx + b1)} ✓ and ${fmtN(ry)} ${SYM[op2]} ${fmtN(m2 * rx + b2)} ✓. Each other point fails at least one inequality${L === 3 ? " (a point on a dashed line, from < or >, is NOT a solution; a point on a solid line, from ≤ or ≥, is)" : ""}.`,
      t: "Plug each point into both inequalities. One failure knocks it out.", key: `sysineq:${m1},${b1},${op1},${m2},${b2},${op2},${right}` };
  };

  /* ---------- Polynomial operations ---------- */
  const pl = (c2, c1, c0) => poly([[c2, 2], [c1, 1], [c0, 0]]);
  G.adv_poly = (r, L) => {
    if (L === 1) {
      const a = r.nz(1, 7), b = r.nz(-9, 9), c = r.nz(-9, 9), d = r.nz(1, 6), e = r.nz(-9, 9), f = r.nz(-9, 9);
      if (a === d) retry();
      const right = pl(a - d, b - e, c - f);
      const { o, a: ai } = mc(r, right, [pl(a - d, b + e, c + f), pl(a + d, b + e, c + f), pl(a - d, b - e, c + f), pl(a - d, e - b, c - f)], String);
      return { d: "adv", sk: "Polynomial operations", q: `Which expression is equivalent to (${pl(a, b, c)}) ${M} (${pl(d, e, f)})?`, o, a: ai,
        e: `Distribute the minus sign to EVERY term in the second polynomial: ${pl(a, b, c)} ${M} ${fmtN(d)}x² ${e < 0 ? "+ " + Math.abs(e) : M + " " + e}x ${f < 0 ? "+ " + Math.abs(f) : M + " " + f}. Combine like terms: ${right}.`,
        t: "Subtracting a polynomial flips the sign of every term inside, not just the first.", key: `poly1:${a},${b},${c},${d},${e},${f}` };
    }
    if (L === 2) {
      const p = r.nz(1, 5), q = r.nz(-8, 8), s = r.nz(1, 4), t = r.nz(-8, 8);
      const mid = p * t + q * s;
      if (mid === 0) retry();
      const right = pl(p * s, mid, q * t);
      const { o, a: ai } = mc(r, right, [pl(p * s, 0, q * t), pl(p * s, p * t - q * s, q * t), pl(p * s, mid, q + t), pl(p + s, mid, q * t)], String);
      return { d: "adv", sk: "Polynomial operations", q: `Which expression is equivalent to (${lin(p, q)})(${lin(s, t)})?`, o, a: ai,
        e: `Multiply every term by every term (FOIL): ${poly([[p * s, 2]])} + (${fmtN(p * t)} + ${q * s < 0 ? "(" + fmtN(q * s) + ")" : fmtN(q * s)})x + ${q * t < 0 ? "(" + fmtN(q * t) + ")" : fmtN(q * t)} = ${right}.`,
        t: "Four products, not two: first, outer, inner, last. Check by plugging in x = 1.", key: `poly2:${p},${q},${s},${t}` };
    }
    // (p x + k)(x + t) = A x² + B x + C for all x; find k.
    const p = r.int(2, 5), t = r.nz(-6, 6), k = r.nz(-9, 9);
    const B = p * t + k, Cc = k * t;
    if (B === 0) retry();
    const { o, a: ai } = mc(r, k, [-k, B, Cc, B - t, B + p * t], fmtN);
    return { d: "adv", sk: "Polynomial operations", q: `(${fmtN(p)}x + k)(${lin(1, t)}) = ${pl(p, B, Cc)}\n\nThe equation above is true for all values of x, where k is a constant. What is the value of k?`, o, a: ai, spr: k,
      e: `Expand the left side: ${fmtN(p)}x² + (${fmtN(p * t)} + k)x + ${fmtN(t)}k. Match the constant terms: ${fmtN(t)}k = ${fmtN(Cc)}, so k = ${fmtN(k)}. Check with the x-terms: ${fmtN(p * t)} + (${fmtN(k)}) = ${fmtN(B)} ✓.`,
      t: "\"True for all x\" means the coefficients match term by term. The constant term is usually the fastest.", key: `poly3:${p},${t},${k}` };
  };

  /* ---------- Rational expressions and equations ---------- */
  G.adv_rational = (r, L) => {
    if (L === 1) {
      // a/(x + b) = c/(x + d)
      for (let i = 0; i < 60; i++) {
        const x = r.int(-6, 12), a = r.int(1, 9), c = r.int(1, 9), b = r.int(-6, 6), d = r.int(-6, 6);
        if (a === c || b === d || x + b === 0 || x + d === 0) continue;
        if (a * (x + d) !== c * (x + b)) continue;
        const { o, a: ai } = mc(r, x, [-x, x + 1, (c * b + a * d) / (a - c), (c * b - a * d) / (c - a) + 2], fmtN);
        return { d: "adv", sk: "Rational equations", q: `${a}/${pr(lin(1, b))} = ${c}/${pr(lin(1, d))}\n\nWhat value of x satisfies the equation?`, o, a: ai, spr: x,
          e: `Cross-multiply: ${a}(${lin(1, d)}) = ${c}(${lin(1, b)}), so ${lin(a, a * d)} = ${lin(c, c * b)}. Then ${fmtN(a - c)}x = ${fmtN(c * b - a * d)} and x = ${fmtN(x)}. It doesn't make a denominator zero, so it works.`,
          t: "One fraction equals one fraction: cross-multiply. Then check that no denominator becomes 0.", key: `rat1:${a},${b},${c},${d}` };
      }
      retry();
    }
    if (L === 2) {
      const p = r.nz(-7, 7), q = r.nz(-7, 7);
      if (p === q || p === -q) retry();
      const num = pl(1, p + q, p * q);
      const right = lin(1, q);
      const { o, a } = mc(r, right, [lin(1, -q), lin(1, p), lin(1, p + q), poly([[1, 1], [p * q, 0]])], String);
      return { d: "adv", sk: "Rational expressions", q: `Which expression is equivalent to (${num})/(${lin(1, p)}), for x ≠ ${fmtN(-p)}?`, o, a,
        e: `Factor the numerator: ${num} = (${lin(1, p)})(${lin(1, q)}). Cancel the common factor (${lin(1, p)}) to get ${right}.`,
        t: "Factor first, then cancel whole factors. Never cancel single terms from a sum.", key: `rat2:${p},${q}` };
    }
    // (x + p)/(x − a) = (x + q)/(x − b)
    for (let i = 0; i < 80; i++) {
      const p = r.int(-6, 6), q = r.int(-6, 6), A = r.int(-6, 6), Bv = r.int(-6, 6);
      const den = p - Bv - q + A, num = p * Bv - q * A;
      if (den === 0 || num % den !== 0 || A === Bv || p === q) continue;
      const x = num / den;
      if (x === A || x === Bv || Math.abs(x) > 20) continue;
      const { o, a: ai } = mc(r, x, [-x, (p * Bv + q * A) / den, num / (p + Bv - q - A), x + 2].filter(Number.isInteger), fmtN);
      const xm = (h) => lin(1, -h);
      return { d: "adv", sk: "Rational equations", q: `${pr(lin(1, p))}/${pr(xm(A))} = ${pr(lin(1, q))}/${pr(xm(Bv))}\n\nWhat is the solution to the equation?`, o, a: ai, spr: x,
        e: `Cross-multiply: (${lin(1, p)})(${xm(Bv)}) = (${lin(1, q)})(${xm(A)}). Expand: x²${sgn(p - Bv)}x${sgn(-p * Bv)} = x²${sgn(q - A)}x${sgn(-q * A)}. The x² terms cancel, leaving ${poly([[den, 1]])} = ${fmtN(num)}, so x = ${fmtN(x)}. It doesn't make either denominator zero.`,
        t: "After cross-multiplying, the x² terms often cancel. Watch every sign as you expand.", key: `rat3:${p},${q},${A},${Bv}` };
    }
    retry();
  };

  /* ---------- Measures of spread ---------- */
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  const sd = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((v) => (v - m) ** 2))); };
  const median = (a) => { const s = a.slice().sort((p, q) => p - q), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
  const CTX = [(n) => `the number of points a team scored in each of ${n} games`, (n) => `the length, in minutes, of each of ${n} commutes`, (n) => `the number of pages a student read on each of ${n} days`, (n) => `the height, in inches, of each of ${n} plants`];
  G.psda_spread = (r, L) => {
    if (L === 1) {
      const n = r.int(7, 10), vals = Array.from({ length: n }, () => r.int(5, 60));
      const mx = Math.max(...vals), mn = Math.min(...vals), rg = mx - mn;
      const sorted = vals.slice().sort((a, b) => a - b);
      if (new Set(vals).size < n - 1) retry();
      const what = r.pick(CTX)(n);
      const { o, a } = mc(r, rg, [mx, sorted[n - 1] - sorted[1], sorted[n - 2] - sorted[0], Math.round(median(vals))], fmtN);
      return { d: "psda", sk: "Measures of spread", q: `The list shows ${what}: ${vals.join(", ")}.\n\nWhat is the range of the data?`, o, a, spr: rg,
        e: `Range = maximum − minimum = ${mx} − ${mn} = ${rg}. The list isn't in order, so find the largest and smallest values carefully.`, t: "Range = max − min. Sort the list first so you don't miss either end.", key: `spr1:${vals}` };
    }
    if (L === 2) {
      // Two sets with the same mean; one tightly clustered, one spread out.
      const m = r.int(20, 40), n = 7;
      const tight = [], wide = [];
      const offT = r.pick([[-2, -1, -1, 0, 1, 1, 2], [-3, -1, 0, 0, 0, 1, 3], [-2, -2, 0, 0, 0, 2, 2]]);
      const offW = r.pick([[-9, -6, -3, 0, 3, 6, 9], [-12, -8, -2, 0, 2, 8, 12], [-10, -10, -5, 0, 5, 10, 10]]);
      offT.forEach((d) => tight.push(m + d)); offW.forEach((d) => wide.push(m + d));
      const aIsWide = r.f() < 0.5, A = aIsWide ? wide : tight, B = aIsWide ? tight : wide;
      const right = aIsWide ? "The standard deviation of data set A is greater than that of data set B." : "The standard deviation of data set B is greater than that of data set A.";
      const { o, a } = mc(r, right, [aIsWide ? "The standard deviation of data set B is greater than that of data set A." : "The standard deviation of data set A is greater than that of data set B.", "The standard deviations of the two data sets are equal.", "There isn't enough information to compare the standard deviations."], String);
      return { d: "psda", sk: "Measures of spread", q: `Data set A: ${r.shuffle(A).join(", ")}\nData set B: ${r.shuffle(B).join(", ")}\n\nBoth data sets have a mean of ${m}. Which statement is true?`, o, a,
        e: `Standard deviation measures how far values typically sit from the mean. The values in data set ${aIsWide ? "A" : "B"} range from ${Math.min(...wide)} to ${Math.max(...wide)}, while data set ${aIsWide ? "B" : "A"} stays between ${Math.min(...tight)} and ${Math.max(...tight)}. The more spread-out set has the larger standard deviation. No calculation needed.`,
        t: "SAT never makes you compute a standard deviation. Just ask: which set is more spread out from its center?", key: `spr2:${m},${offT},${offW},${aIsWide}` };
    }
    // Removing an outlier: judge the effect on mean, median, standard deviation and range.
    const n = r.pick([7, 9]), base = Array.from({ length: n - 1 }, () => r.int(20, 40));
    const hi = r.f() < 0.5, out = hi ? r.int(70, 95) : r.int(1, 6);
    const vals = base.concat(out), rest = base;
    const d = { mean: mean(rest) - mean(vals), median: median(rest) - median(vals), sd: sd(rest) - sd(vals), range: (Math.max(...rest) - Math.min(...rest)) - (Math.max(...vals) - Math.min(...vals)) };
    const word = (x) => (Math.abs(x) < 1e-9 ? "stays the same" : x > 0 ? "increases" : "decreases");
    const truth = (k, w) => word(d[k]) === w;
    const cands = [];
    for (const k1 of ["mean", "median"]) for (const w1 of ["increases", "decreases", "stays the same"])
      for (const k2 of ["standard deviation", "range"]) for (const w2 of ["increases", "decreases", "stays the same"]) {
        const kk2 = k2 === "range" ? "range" : "sd";
        cands.push({ s: `The ${k1} ${w1}, and the ${k2} ${w2}.`, ok: truth(k1, w1) && truth(kk2, w2) });
      }
    const rights = cands.filter((c) => c.ok), wrongs = r.shuffle(cands.filter((c) => !c.ok));
    if (!rights.length || wrongs.length < 3) retry();
    const meanFirst = rights.filter((c) => /The mean/.test(c.s));
    const pick = r.pick(meanFirst.length && r.f() < 0.7 ? meanFirst : rights).s;
    const { o, a } = mc(r, pick, wrongs.map((c) => c.s), String);
    const what = r.pick(CTX)(n);
    return { d: "psda", sk: "Measures of spread", q: `The list shows ${what}: ${r.shuffle(vals).join(", ")}.\n\nIf the value ${out} is removed from the list, which statement about the remaining ${n - 1} values is true?`, o, a,
      e: `${out} is an outlier far ${hi ? "above" : "below"} the other values. Removing it pulls the mean ${hi ? "down" : "up"} (it was dragging the mean toward itself), and the data become less spread out, so the standard deviation and the range decrease. The median ${word(d.median) === "stays the same" ? "stays the same" : word(d.median) + " slightly, by " + fmtN(Math.abs(d.median))}: it only depends on the middle values.`,
      t: "Outliers pull the mean and stretch the spread. The median barely moves.", key: `spr3:${vals}` };
  };

  /* ---------- Area, perimeter and scale ---------- */
  G.geo_area = (r, L) => {
    if (L === 1) {
      const w = r.int(3, 15), l = r.int(w + 1, 25), P = 2 * (l + w);
      const { o, a } = mc(r, l * w, [P, l + w, 2 * l * w, l * l], fmtN);
      return { d: "geo", sk: "Area and perimeter", q: `A rectangle has a perimeter of ${P} meters. Its length is ${l} meters. What is the area of the rectangle, in square meters?`, o, a, spr: l * w,
        e: `Perimeter: 2(${l}) + 2w = ${P}, so 2w = ${P - 2 * l} and w = ${w}. Area = length × width = ${l} × ${w} = ${l * w}.`, t: "Find the missing side from the perimeter first, then multiply.", key: `area1:${l},${w}`,
        fig: { type: "rect", ratio: w / l, l: l + " m", w: "w", note: "Perimeter = " + P + " m" }, efig: { type: "rect", ratio: w / l, l: l + " m", w: w + " m", inside: "area = " + l + " × " + w + " = " + l * w },
        steps: ["Perimeter = all four sides: two lengths + two widths.", `2(${l}) + 2w = ${P}, so 2w = ${P - 2 * l} and w = ${w}.`, `Area = length × width = ${l} × ${w} = ${l * w}.`] };
    }
    if (L === 2) {
      const k = r.pick([2, 3, 4, 5]), shape = r.pick(["square", "circle", "equilateral triangle", "rectangle"]);
      const dim = shape === "circle" ? "radius" : shape === "rectangle" ? "length and width" : "side length";
      const { o, a } = mc(r, k * k, [k, 2 * k, k * k * k], fmtN);
      return { d: "geo", sk: "Area and perimeter", q: `The ${dim} of a ${shape} ${dim.includes(" and ") ? "are each" : "is"} multiplied by ${k}. The area of the new ${shape} is how many times the area of the original ${shape}?`, o, a, spr: k * k,
        e: `Area uses two lengths multiplied together, so scaling every length by ${k} scales the area by ${k} × ${k} = ${k * k}. (Volume would scale by ${k}³ = ${k ** 3}.)`, t: "Scale lengths by k: area × k², volume × k³.", key: `area2:${k},${shape}` };
    }
    const p = r.pick([10, 20, 25, 30, 40, 50]), q = r.pick([10, 20, 25, 30, 40, 50]);
    const change = Math.round(((1 + p / 100) * (1 - q / 100) - 1) * 10000) / 100;
    if (Math.abs(change) < 0.01) retry();
    const say = (c) => (Math.abs(c) < 0.001 ? "It stays the same." : (c > 0 ? "It increases by " : "It decreases by ") + fmtN(Math.abs(c)) + "%.");
    const { o, a } = mc(r, say(change), [say(p - q), say(-change), say(p - q === 0 ? q : 0), say(change + (change > 0 ? 10 : -10))], String);
    return { d: "geo", sk: "Area and perimeter", q: `The length of a rectangle is increased by ${p}%, and the width is decreased by ${q}%. How does the area of the rectangle change?`, o, a,
      e: `New area = (${1 + p / 100})(${1 - q / 100}) × old area = ${String(Math.round((1 + p / 100) * (1 - q / 100) * 10000) / 10000)} × old area. ${say(change)} Percent changes multiply; they don't add, so it isn't simply ${p}% − ${q}%.`,
      t: "Turn each percent change into a multiplier, then multiply. Or try a 10 × 10 rectangle.", key: `area3:${p},${q}` };
  };

  /* ---------- Parallel lines, exterior angles, polygons ---------- */
  G.geo_polygon = (r, L) => {
    if (L === 1) {
      // Alternate interior angles: 3x + 10 = 5x − 30
      for (let i = 0; i < 60; i++) {
        const x = r.int(8, 40), a1 = r.int(1, 4), a2 = r.int(a1 + 1, 6), c1 = r.int(-20, 40);
        const ang = a1 * x + c1, c2 = ang - a2 * x;
        if (ang <= 20 || ang >= 160) continue;
        const kind = r.pick(["alternate interior", "corresponding"]);
        const { o, a } = mc(r, ang, [x, 180 - ang, ang + a2, (a2 - a1) * x], (v) => fmtN(v) + "°");
        return { d: "geo", sk: "Lines and angles", q: `Parallel lines ℓ and m are cut by a transversal. Two ${kind} angles have measures (${lin(a1, c1)})° and (${lin(a2, c2)})°. What is the measure of each of these angles?`, o, a, spr: ang,
          e: `${kind[0].toUpperCase() + kind.slice(1)} angles formed by parallel lines are equal: ${lin(a1, c1)} = ${lin(a2, c2)}, so ${a2 - a1 === 1 ? "" : fmtN(a2 - a1)}x = ${fmtN(c1 - c2)} and x = ${x}. Each angle is ${a1}(${x})${sgn(c1)} = ${ang}°.`,
          t: "Parallel lines: angles are either equal or add to 180°. Solve for x, then answer the angle they asked for.", key: `pl1:${a1},${c1},${a2},${c2}`,
          fig: { type: "parallel", at: kind === "corresponding" ? [[1, "ur", "(" + lin(a1, c1) + ")°", "fg-a"], [2, "ur", "(" + lin(a2, c2) + ")°", "fg-b"]] : [[1, "lr", "(" + lin(a1, c1) + ")°", "fg-a"], [2, "ul", "(" + lin(a2, c2) + ")°", "fg-b"]], note: "ℓ ∥ m · not drawn to scale" },
          efig: { type: "parallel", th: kind === "corresponding" ? ang : 180 - ang, at: kind === "corresponding" ? [[1, "ur", ang + "°", "fg-a"], [2, "ur", ang + "°", "fg-a"]] : [[1, "lr", ang + "°", "fg-a"], [2, "ul", ang + "°", "fg-a"]], note: "Same color = equal angles" },
          steps: [kind === "corresponding" ? "Corresponding angles sit in the same spot at each crossing (both upper right here), so they're equal." : "Alternate interior angles sit between the parallel lines, on opposite sides of the slanted line (a Z shape), so they're equal.", `Set them equal: ${lin(a1, c1)} = ${lin(a2, c2)}.`, `${a2 - a1 === 1 ? "" : fmtN(a2 - a1)}x = ${fmtN(c1 - c2)}, so x = ${x}.`, `Plug x back in: ${a1}(${x})${sgn(c1)} = ${ang}°. That's the angle, not x.`] };
      }
      retry();
    }
    if (L === 2) {
      const A = r.int(25, 75), B = r.int(25, 75);
      if (A + B >= 170) retry();
      const { o, a } = mc(r, A + B, [180 - A - B, 180 - A, Math.abs(A - B), 360 - A - B], (v) => fmtN(v) + "°");
      return { d: "geo", sk: "Lines and angles", q: `In triangle PQR, the measure of angle P is ${A}° and the measure of angle Q is ${B}°. Side QR is extended past R to point S. What is the measure of exterior angle PRS?`, o, a, spr: A + B,
        e: `An exterior angle equals the sum of the two remote interior angles: ${A}° + ${B}° = ${A + B}°. (Check: angle R = 180° − ${A + B}° = ${180 - A - B}°, and ${180 - A - B}° + ${A + B}° = 180° on the straight line.)`,
        t: "Exterior angle = the two far interior angles added together.", key: `pl2:${A},${B}`,
        fig: { type: "tri", ext: true, lab: { P: A + "°", Q: B + "°", x: "?" } }, efig: { type: "tri", deg: [A, B, 180 - A - B], ext: true, lab: { P: A + "°", Q: B + "°", R: 180 - A - B + "°", x: A + B + "°" }, col: { P: "fg-a", Q: "fg-a", x: "fg-a", R: "fg-dim" } },
        steps: ["The exterior angle PRS sits on the straight line QRS.", "It equals the two inside angles that are NOT next to it (at P and Q) added together.", `${A}° + ${B}° = ${A + B}°.`, `Check: angle R = 180° − ${A + B}° = ${180 - A - B}°, and ${180 - A - B}° + ${A + B}° = 180° on the line.`] };
    }
    const n = r.pick([5, 6, 8, 9, 10, 12, 15, 18, 20]), interior = 180 - 360 / n;
    if (r.f() < 0.5) {
      const { o, a } = mc(r, n, [Math.round(360 / interior), n + 2, n - 2, Math.round(180 / (180 - interior))].filter(Number.isInteger), fmtN);
      return { d: "geo", sk: "Polygons", q: `Each interior angle of a regular polygon measures ${fmtN(interior)}°. How many sides does the polygon have?`, o, a, spr: n,
        e: `Each exterior angle is 180° − ${fmtN(interior)}° = ${fmtN(360 / n)}°. The exterior angles of any polygon add to 360°, so n = 360 ÷ ${fmtN(360 / n)} = ${n}.`,
        t: "Work with exterior angles: they always total 360°.", key: `poly:${n}:n` };
    }
    const sum = (n - 2) * 180;
    const { o, a } = mc(r, interior, [sum / (n - 1), 360 / n, (n * 180) / n - 360 / (2 * n), 180 - 180 / n].filter((v) => Number.isInteger(v * 10)), (v) => fmtN(v) + "°");
    return { d: "geo", sk: "Polygons", q: `A regular polygon has ${n} sides. What is the measure, in degrees, of each interior angle?`, o, a, spr: interior,
      e: `The interior angles of an n-sided polygon add to (n − 2) × 180° = ${n - 2} × 180° = ${sum}°. Divide equally: ${sum} ÷ ${n} = ${fmtN(interior)}°.`,
      t: "Sum of interior angles = (n − 2) × 180°.", key: `poly:${n}:ang` };
  };

  /* ================= Harder, multi-step items used only at level 3 ================= */
  G.hard_compose = (r) => {
    const a = r.nz(-4, 4), b = r.int(-6, 6), c = r.nz(-3, 3), d = r.int(-5, 5), x0 = r.int(-3, 4);
    // f(x) = a x + b, g(x) = c x² + d. Ask f(g(x0)) or g(f(x0)).
    const which = r.f() < 0.5;
    const g = (x) => c * x * x + d, f = (x) => a * x + b;
    const ans = which ? f(g(x0)) : g(f(x0)), wrong = which ? g(f(x0)) : f(g(x0));
    const { o, a: ai } = mc(r, ans, [wrong, f(x0) * g(x0), which ? f(x0) + g(x0) : g(x0), ans + 2 * a], fmtN);
    const fs = `f(x) = ${lin(a, b)}`, gs = `g(x) = ${poly([[c, 2], [d, 0]])}`;
    const inner = which ? `g(${x0}) = ${fmtN(g(x0))}` : `f(${x0}) = ${fmtN(f(x0))}`, outer = which ? `f(${fmtN(g(x0))}) = ${fmtN(ans)}` : `g(${fmtN(f(x0))}) = ${fmtN(ans)}`;
    return { d: "adv", sk: "Function notation", q: `${fs}\n${gs}\n\nFor the functions f and g defined above, what is the value of ${which ? "f(g(" + x0 + "))" : "g(f(" + x0 + "))"}?`, o, a: ai, spr: ans,
      e: `Work from the inside out. First ${inner}. Then ${outer}.`, t: "Inside first: evaluate the inner function, then feed that number into the outer one.", key: `comp:${a},${b},${c},${d},${x0},${which}` };
  };
  G.hard_circleeq = (r) => {
    const h = r.nz(-6, 6), k = r.nz(-6, 6), R = r.int(2, 9);
    const D = -2 * h, E = -2 * k, F = h * h + k * k - R * R;
    const eq = `x² ${D < 0 ? M : "+"} ${Math.abs(D)}x + y² ${E < 0 ? M : "+"} ${Math.abs(E)}y${F === 0 ? "" : F < 0 ? " " + M + " " + Math.abs(F) : " + " + F} = 0`;
    const askR = r.f() < 0.5;
    if (askR) {
      const { o, a } = mc(r, R, [R * R, Math.round(Math.sqrt(Math.abs(F))) || R + 1, R + 1, 2 * R], fmtN);
      return { d: "geo", sk: "Circles", q: `The equation of a circle in the xy-plane is ${eq}. What is the radius of the circle?`, o, a, spr: R,
        e: `Complete the square for x and y: (x ${h > 0 ? M + " " + h : "+ " + -h})² + (y ${k > 0 ? M + " " + k : "+ " + -k})² = ${h * h} + ${k * k}${F === 0 ? "" : F < 0 ? " + " + -F : " " + M + " " + F} = ${R * R}. So r² = ${R * R} and r = ${R}.`,
        t: "Half the x-coefficient, squared, gets added to both sides. Same for y. The right side is r², not r.", key: `ceq:${h},${k},${R}:r` };
    }
    const pt = (x, y) => `(${fmtN(x)}, ${fmtN(y)})`;
    const { o, a } = mc(r, pt(h, k), [pt(-h, -k), pt(D, E), pt(k, h)], String);
    return { d: "geo", sk: "Circles", q: `The equation of a circle in the xy-plane is ${eq}. What are the coordinates of the center of the circle?`, o, a,
      e: `Completing the square gives (x ${h > 0 ? M + " " + h : "+ " + -h})² + (y ${k > 0 ? M + " " + k : "+ " + -k})² = ${R * R}. The center is (h, k) = ${pt(h, k)}: take half of each linear coefficient and flip its sign.`,
      t: "Center: half of each linear coefficient, with the sign flipped.", key: `ceq:${h},${k},${R}:c` };
  };
  G.hard_perp = (r) => {
    const p = r.nz(-4, 4), q = r.pick([1, 2, 3]), x0 = r.int(-6, 6), y0 = r.int(-6, 6);
    if (gcd(p, q) !== 1) retry();
    // given line slope p/q; perpendicular slope −q/p through (x0,y0); ask y-intercept.
    const bNum = y0 * p + q * x0, bDen = p; // b = y0 − (−q/p)x0 = y0 + q x0 / p
    const b = frac(bNum, bDen), mStr = frac(p, q);
    const given = `y = ${mStr === "1" ? "" : mStr === M + "1" ? M : mStr.includes("/") ? "(" + mStr + ")" : mStr}x ${r.f() < 0.5 ? "+ 4" : M + " 2"}`;
    const bParal = frac(y0 * q - p * x0, q), bWrong = frac(y0 * p - q * x0, p);
    const { o, a } = mc(r, b, [bParal, bWrong, frac(-bNum, bDen), fmtN(y0)], String);
    return { d: "alg", sk: "Linear functions", q: `Line k is perpendicular to the line ${given} and passes through the point (${fmtN(x0)}, ${fmtN(y0)}). What is the y-intercept of line k?`, o, a,
      e: `Perpendicular slopes are negative reciprocals, so line k has slope ${frac(-q, p)}. Use y = mx + b with the point: ${fmtN(y0)} = (${frac(-q, p)})(${fmtN(x0)}) + b, so b = ${b}.`,
      t: "Perpendicular: flip the fraction AND change the sign. Parallel: same slope.", key: `perp:${p},${q},${x0},${y0}` };
  };
  const TWOWAY = [
    { rows: ["Grade 10", "Grade 11"], cols: ["Soccer", "Basketball", "Swimming"], who: "students", what: "chose each sport" },
    { rows: ["Morning", "Evening"], cols: ["Bus", "Car", "Bicycle"], who: "commuters", what: "used each type of transportation" },
    { rows: ["Planted in shade", "Planted in sun"], cols: ["Flowered", "Did not flower"], who: "plants", what: "flowered or did not flower" }
  ];
  G.hard_twoway = (r) => {
    const T = r.pick(TWOWAY), cells = T.rows.map(() => T.cols.map(() => r.int(6, 40)));
    const rowT = cells.map((row) => row.reduce((s, v) => s + v, 0)), colT = T.cols.map((_, j) => cells.reduce((s, row) => s + row[j], 0)), N = rowT.reduce((s, v) => s + v, 0);
    const i = r.int(0, T.rows.length - 1), j = r.int(0, T.cols.length - 1), v = cells[i][j];
    const givenRow = r.f() < 0.5;
    const right = frac(v, givenRow ? rowT[i] : colT[j]);
    const { o, a } = mc(r, right, [frac(v, givenRow ? colT[j] : rowT[i]), frac(v, N), frac(givenRow ? rowT[i] : colT[j], N)], String);
    const table = { head: [""].concat(T.cols, ["Total"]), rows: T.rows.map((rw, k) => [rw].concat(cells[k].map(String), [String(rowT[k])])).concat([["Total"].concat(colT.map(String), [String(N)])]) };
    const cond = givenRow ? `a ${T.who.slice(0, -1)} in the "${T.rows[i]}" group` : `a ${T.who.slice(0, -1)} in the "${T.cols[j]}" column`;
    return { d: "psda", sk: "Probability", table, p: `The table shows how ${N} ${T.who} ${T.what}.`, q: `One of these ${T.who} is chosen at random. Given that the ${T.who.slice(0, -1)} is in the "${givenRow ? T.rows[i] : T.cols[j]}" category, what is the probability that it is also in the "${givenRow ? T.cols[j] : T.rows[i]}" category?`, o, a,
      e: `"Given that" shrinks the group to ${cond}: ${givenRow ? rowT[i] : colT[j]} ${T.who}. Of those, ${v} are in both. Probability = ${v}/${givenRow ? rowT[i] : colT[j]} = ${right}.`,
      t: "\"Given that\" tells you the denominator: the total of that row or column only, not the grand total.", key: `tw:${cells}:${i}${j}${givenRow}` };
  };
  G.hard_growth = (r) => {
    const P0 = r.pick([200, 500, 800, 1200, 2000, 5000]), pct = r.pick([3, 4, 5, 6, 8, 10, 12, 15]), per = r.pick([2, 3, 4, 5, 6]);
    const up = r.f() < 0.6, f = up ? fmtN(1 + pct / 100) : fmtN(1 - pct / 100), fx = up ? fmtN(1 + (pct * per) / 100) : fmtN(1 - pct / 100);
    const what = up ? r.pick(["The number of bacteria in a sample", "The number of members of a club", "The number of monthly visitors to a website"]) : r.pick(["The number of fish in a lake", "The value of a machine, in dollars,"]);
    const right = `${P0}(${f})^(t/${per})`;
    const { o, a } = mc(r, right, [`${P0}(${f})^(${per}t)`, `${P0}(${f})^t`, `${P0}(${fx})^(t/${per})`, `${P0}(${fmtN(pct / 100)})^(t/${per})`], String);
    return { d: "adv", sk: "Exponential functions", q: `${what} is ${P0} at time t = 0 and ${up ? "increases" : "decreases"} by ${pct}% every ${per} years. Which function f gives ${what.replace(/^The/, "the").replace(/,$/, "")} t years after t = 0?`, o: o.map((s) => "f(t) = " + s), a,
      e: `Start value ${P0}. Each period multiplies by ${up ? "1 + " : "1 − "}${fmtN(pct / 100)} = ${f}. A period is ${per} years, so after t years there have been t/${per} periods: f(t) = ${right}.`,
      t: "The exponent counts periods: time ÷ length of one period.", key: `grow:${P0},${pct},${per},${up}` };
  };
  G.hard_quadk = (r) => {
    const h = r.int(-5, 5), k = r.int(-9, 9), sgnA = r.pick([1, -1]);
    const b = -2 * sgnA * h, c = sgnA * h * h + k;
    const fx = poly([[sgnA, 2], [b, 1], [c, 0]]);
    const { o, a } = mc(r, k, [c, h, -k, k + sgnA], fmtN);
    return { d: "adv", sk: "Nonlinear systems", q: `y = ${fx}\ny = c\n\nIn the system of equations above, c is a constant. For what value of c does the system have exactly one real solution?`, o, a, spr: k,
      e: `A horizontal line y = c touches the parabola exactly once only at its vertex. The vertex's x-coordinate is −b/(2a) = ${fmtN(h)}, and y = ${fmtN(k)} there. So c = ${fmtN(k)}. (Or set ${fx} = c and require the discriminant to be 0.)`,
      t: "Exactly one intersection with a horizontal line → the line goes through the vertex. Desmos: graph it and read the vertex.", key: `qk:${h},${k},${sgnA}` };
  };

  MG.BY_DOMAIN.alg.push("alg_literal", "alg_sysineq");
  MG.BY_DOMAIN.adv.push("adv_poly", "adv_rational");
  MG.BY_DOMAIN.psda.push("psda_spread");
  MG.BY_DOMAIN.geo.push("geo_area", "geo_polygon");
  MG.HARD = { alg: ["hard_perp"], adv: ["hard_compose", "hard_growth", "hard_quadk"], psda: ["hard_twoway"], geo: ["hard_circleeq"] };
  // At level 3, about 40% of questions come from the harder, multi-step set.
  const baseGenerate = MG.generate;
  MG.generate = function (domain, level, rng, avoid, only) {
    if (level === 3 && !(only && only.length) && MG.HARD[domain] && rng.f() < 0.4) {
      for (let t = 0; t < 8; t++) { const q = MG.build(rng.pick(MG.HARD[domain]), rng, 3); if (q && (!avoid || !avoid.has(q.key))) return q; }
    }
    return baseGenerate(domain, level, rng, avoid, only);
  };
  if (typeof module !== "undefined") module.exports = MG;
})(typeof window !== "undefined" ? window : globalThis);
