/* Test Prep Hub — math question generators.
   Numbers are random every time; answers and explanations are computed from the same numbers. */
(function (root) {
  const C = root.PSCore || (typeof require !== "undefined" ? require("./core.js") : null);
  const { fmtN, frac, poly, lin, eq2, paren, xMinus, mc, gcd, MINUS } = C;
  const M = MINUS;
  const money = (x) => "$" + x.toFixed(2);
  const sgn = (n) => (n === 0 ? "" : n < 0 ? " " + MINUS + " " + fmtN(Math.abs(n)) : " + " + fmtN(n)); // " + 3", " − 3", or nothing
  const art = (n, cap) => { const a = /^(8|11|18)(\D|$)/.test(String(n)) || /^8\d/.test(String(n)) ? "an" : "a"; return cap ? a[0].toUpperCase() + a.slice(1) : a; };
  const ordinal = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th");

  const G = {};

  /* ============ ALGEBRA ============ */
  G.alg_lineq = (r, L) => {
    const x = r.int(-8, 12);
    if (L === 1) {
      const a = r.int(2, 9), b = r.nz(-15, 20), c = a * x + b;
      const { o, a: ai } = mc(r, x, [(c + b) / a, -x, x + 1, c - b], fmtN);
      return { d: "alg", sk: "Linear equations", q: `If ${lin(a, b)} = ${fmtN(c)}, what is the value of x?`, o, a: ai, spr: x,
        e: `${b > 0 ? "Subtract " + b : "Add " + Math.abs(b)} ${b > 0 ? "from" : "to"} both sides: ${fmtN(a)}x = ${fmtN(c - b)}. Divide by ${a}: x = ${fmtN(x)}.`, key: `lineq1:${a},${b},${c}` };
    }
    if (L === 2) {
      const a = r.int(4, 11), c2 = r.int(1, a - 2), b = r.nz(-12, 15), d = (a - c2) * x + b;
      const { o, a: ai } = mc(r, x, [(d - b) / (a + c2), -x, (d + b) / (a - c2), x + 2], fmtN);
      return { d: "alg", sk: "Linear equations", q: `${lin(a, b)} = ${lin(c2, d)}\n\nWhat value of x is the solution to the equation above?`, o, a: ai, spr: x,
        e: `Move the x-terms to one side and constants to the other: ${fmtN(a)}x ${M} ${c2 === 1 ? "" : fmtN(c2)}x = ${fmtN(d)} ${M} ${paren(b)}, so ${poly([[a - c2, 1]])} = ${fmtN(d - b)}${a - c2 === 1 ? "" : " and x = " + fmtN(x)}.`,
        t: "Plug your answer back in to check: both sides should match.", key: `lineq2:${a},${b},${c2},${d}` };
    }
    const p = r.int(2, 6), m = r.nz(-7, 7), rr = r.pick([1, 2, 3, p + 1, p + 2].filter((v) => v !== p)), n = p * x + p * m - rr * x;
    const { o, a: ai } = mc(r, x, [(n - m) / (p - rr), -x, (n - p * m) / (p + rr), x - 1], fmtN);
    return { d: "alg", sk: "Linear equations", q: `${p}(${lin(1, m)}) = ${lin(rr, n)}\n\nWhat is the solution to the equation above?`, o, a: ai, spr: x,
      e: `Distribute: ${lin(p, p * m)} = ${lin(rr, n)}. Collect x-terms: ${poly([[p - rr, 1]])} = ${fmtN(n - p * m)}, so x = ${fmtN(x)}.`,
      t: "Distribute to every term inside the parentheses, including the constant.", key: `lineq3:${p},${m},${rr},${n}` };
  };

  G.alg_scaled = (r, L) => {
    const a = r.int(2, 6), x = r.int(1, 9), b = r.nz(-10, 12), c = a * x + b, k = L === 1 ? 2 : r.int(2, 4), m = r.nz(-9, 9);
    const ans = k * (c - b) + m;
    const { o, a: ai } = mc(r, ans, [x, k * c + m, c - b + m, k * (c - b)], fmtN);
    return { d: "alg", sk: "Linear expressions", q: `If ${lin(a, b)} = ${fmtN(c)}, what is the value of ${lin(k * a, m)}?`, o, a: ai, spr: ans,
      e: `From the equation, ${fmtN(a)}x = ${fmtN(c - b)}. Then ${fmtN(k * a)}x = ${k} × ${fmtN(c - b)} = ${fmtN(k * (c - b))}, and adding ${fmtN(m)} gives ${fmtN(ans)}.`,
      t: "Look for a shortcut: the new expression is a multiple of the one you already have.", key: `scaled:${a},${b},${c},${k},${m}` };
  };

  G.alg_system = (r, L) => {
    const x = r.int(-5, 9), y = r.int(-5, 9);
    let e1, e2, how;
    if (L === 1) {
      e1 = [1, 1, x + y]; e2 = [1, -1, x - y];
      how = `Add the equations to eliminate y: 2x = ${fmtN(2 * x)}, so x = ${fmtN(x)}. Then y = ${fmtN(x + y)}${sgn(-x)} = ${fmtN(y)}.`;
    } else {
      let a1, b1, a2, b2;
      do { a1 = r.nz(-4, 5); b1 = r.nz(-4, 5); a2 = r.nz(-4, 5); b2 = r.nz(-4, 5); } while (a1 * b2 - a2 * b1 === 0 || (L === 2 && Math.abs(b1) !== Math.abs(b2) && Math.abs(a1) !== Math.abs(a2)));
      e1 = [a1, b1, a1 * x + b1 * y]; e2 = [a2, b2, a2 * x + b2 * y];
      how = `Solve by elimination or substitution (or graph both lines in Desmos and click the intersection). The solution is (${fmtN(x)}, ${fmtN(y)}).`;
    }
    const ask = L === 3 ? r.pick(["x", "y", "x + y"]) : r.pick(["x", "y"]);
    const ans = ask === "x" ? x : ask === "y" ? y : x + y;
    const { o, a: ai } = mc(r, ans, [ask === "x" ? y : x, x - y, -ans, x + y, x * y], fmtN);
    return { d: "alg", sk: "Systems of equations", q: `${eq2(...e1)}\n${eq2(...e2)}\n\nIf (x, y) is the solution to the system of equations above, what is the value of ${ask}?`, o, a: ai, spr: ans,
      e: how + (ask === "x + y" ? ` So x + y = ${fmtN(ans)}.` : ""), t: "Desmos: type both equations and click the point where the lines cross.", key: `sys:${e1},${e2},${ask}` };
  };

  G.alg_slope = (r, L) => {
    const m = r.nz(-4, 5), b = r.int(-6, 8), x1 = r.int(-3, 2), x2 = x1 + r.int(1, 4), y1 = m * x1 + b, y2 = m * x2 + b;
    if (L === 3) {
      const ans = frac(-1, m);
      const { o, a: ai } = mc(r, ans, [frac(1, m), fmtN(-m), fmtN(m), frac(-m, 1 + Math.abs(m))], String);
      return { d: "alg", sk: "Linear functions", q: `Line ℓ passes through the points (${fmtN(x1)}, ${fmtN(y1)}) and (${fmtN(x2)}, ${fmtN(y2)}). Line k is perpendicular to line ℓ. What is the slope of line k?`, o, a: ai,
        e: `The slope of ℓ is (${fmtN(y2)} ${M} ${paren(y1)}) ÷ (${fmtN(x2)} ${M} ${paren(x1)}) = ${fmtN(m)}. Perpendicular slopes are negative reciprocals, so the slope of k is ${ans}.`,
        t: "Perpendicular: flip the fraction and change the sign.", key: `perp:${x1},${y1},${x2},${y2}` };
    }
    const f = (mm, bb) => "y = " + lin(mm, bb);
    const { o, a: ai } = mc(r, f(m, b), [f(b === 0 ? m + 1 : b, m), f(m, -b), f(-m, b), f(m, y2)], String);
    return { d: "alg", sk: "Linear functions", q: `A line in the xy-plane passes through the points (${fmtN(x1)}, ${fmtN(y1)}) and (${fmtN(x2)}, ${fmtN(y2)}). Which equation defines the line?`, o, a: ai,
      e: `Slope = (${fmtN(y2)} ${M} ${paren(y1)}) ÷ (${fmtN(x2)} ${M} ${paren(x1)}) = ${fmtN(y2 - y1)} ÷ ${fmtN(x2 - x1)} = ${fmtN(m)}. Substitute a point to find the y-intercept: ${fmtN(y1)} = ${fmtN(m)}(${fmtN(x1)}) + b, so b = ${fmtN(b)}.`,
      t: "Fast check: plug both points into each answer choice.", key: `slope:${x1},${y1},${x2},${y2}` };
  };

  const MODELS = [
    { sym: "C", v: "h", setup: (F, R) => `A plumber uses the equation C = ${F} + ${R}h to estimate the total cost C, in dollars, of a repair that takes h hours.`,
      right: (F, R) => `The cost increases by $${R} for each additional hour of work.`, wrong: (F, R) => [`The plumber charges a flat fee of $${R}.`, `The repair takes ${R} hours.`, `The total cost of the repair is $${R + F}.`], unit: "hours", total: "cost" },
    { sym: "S", v: "w", setup: (F, R) => `The equation S = ${F} + ${R}w models the amount S, in dollars, in Priya's savings account w weeks after she starts a summer job.`,
      right: (F, R) => `Priya adds $${R} to the account each week.`, wrong: (F, R) => [`Priya started with $${R} in the account.`, `Priya will work for ${R} weeks.`, `Priya's account grows by ${R}% each week.`], unit: "weeks", total: "amount" },
    { sym: "T", v: "m", setup: (F, R) => `A taxi company uses T = ${F} + ${R}m to find the fare T, in dollars, for a ride of m miles.`,
      right: (F, R) => `Each additional mile adds $${R} to the fare.`, wrong: (F, R) => [`Every ride costs a flat $${R}.`, `The average ride is ${R} miles.`, `The fare for a 1-mile ride is $${R}.`], unit: "miles", total: "fare" },
    { sym: "H", v: "d", setup: (F, R) => `The height H, in centimeters, of a plant d days after it was measured is modeled by H = ${F} + ${R}d.`,
      right: (F, R) => `The plant grows ${R} centimeters each day.`, wrong: (F, R) => [`The plant was ${R} centimeters tall when first measured.`, `The plant will stop growing after ${R} days.`, `The plant doubles in height every ${R} days.`], unit: "days", total: "height" }
  ];
  G.alg_model = (r, L) => {
    const ctx = r.pick(MODELS), F = r.int(2, 9) * 5;
    let R; do { R = r.pick([3, 4, 6, 8, 12, 15, 18, 25]); } while (R === F);
    if (L === 1) {
      const { o, a } = mc(r, ctx.right(F, R), ctx.wrong(F, R), String);
      return { d: "alg", sk: "Linear models", q: `${ctx.setup(F, R)} What is the best interpretation of ${R} in this context?`, o, a,
        e: `${R} is multiplied by ${ctx.v}, so it's the rate: how much the ${ctx.total} changes for each 1-unit increase in ${ctx.v}. ${F} is the starting value.`,
        t: "In y = b + mx, the number multiplied by the variable is the rate of change; the constant is the starting value.", key: `model1:${ctx.sym},${F},${R}` };
    }
    const n = r.int(3, 12), total = F + R * n;
    if (L === 2) {
      const { o, a } = mc(r, total, [F * n + R, R * n, F + R + n, total + R], fmtN);
      return { d: "alg", sk: "Linear models", q: `${ctx.setup(F, R)} What is the value of ${ctx.sym} when ${ctx.v} = ${n}?`, o, a, spr: total,
        e: `${ctx.sym} = ${F} + ${R}(${n}) = ${F} + ${R * n} = ${total}.`, key: `model2:${ctx.sym},${F},${R},${n}` };
    }
    const { o, a } = mc(r, n, [total / R, (total + F) / R, n + 1, n - 1], (x) => fmtN(Math.round(x * 100) / 100));
    return { d: "alg", sk: "Linear models", q: `${ctx.setup(F, R)} For what value of ${ctx.v} is ${ctx.sym} = ${total}?`, o, a, spr: n,
      e: `${total} = ${F} + ${R}${ctx.v}, so ${R}${ctx.v} = ${total - F} and ${ctx.v} = ${n}.`, key: `model3:${ctx.sym},${F},${R},${n}` };
  };

  G.alg_ineq = (r, L) => {
    const F = r.int(2, 8) * 5, R = r.pick([3, 4, 5, 6, 7, 8, 9, 12]), g = r.int(4, 14);
    const atLeast = L === 3 && r.f() < 0.5;
    if (!atLeast) {
      const B = F + R * g + r.int(0, R - 1), ans = Math.floor((B - F) / R);
      const { o, a } = mc(r, ans, [ans + 1, ans - 1, Math.floor(B / R), Math.ceil((B - F) / R) === ans ? ans + 2 : Math.ceil((B - F) / R)], fmtN);
      return { d: "alg", sk: "Linear inequalities", q: `A gym charges a one-time fee of $${F} plus $${R} for each class. Diego wants to spend at most $${B}. What is the greatest number of classes he can take?`, o, a, spr: ans,
        e: `${F} + ${R}c ≤ ${B}, so ${R}c ≤ ${B - F} and c ≤ ${fmtN(Math.round(((B - F) / R) * 100) / 100)}. The greatest whole number of classes is ${ans}.`,
        t: "\"At most\" means ≤. Round down when you can't go over.", key: `ineq:${F},${R},${B}` };
    }
    const need = F * 10 + R * g - r.int(0, R - 1), per = R * 2, start = F * 10;
    const ans = Math.ceil((need - start) / per);
    const { o, a } = mc(r, ans, [ans - 1, ans + 1, Math.floor(need / per)], fmtN);
    return { d: "alg", sk: "Linear inequalities", q: `A club has raised $${start} and earns $${per} for each car it washes. What is the least number of cars it must wash to have at least $${need}?`, o, a, spr: ans,
      e: `${start} + ${per}c ≥ ${need}, so c ≥ ${fmtN(Math.round(((need - start) / per) * 100) / 100)}. The least whole number is ${ans}.`,
      t: "\"At least\" means ≥. Round up when you must reach the goal.", key: `ineqB:${start},${per},${need}` };
  };

  G.alg_nosol = (r, L) => {
    if (L < 3) {
      const m = r.nz(-6, 7), b1 = r.int(-8, 8); let b2; do { b2 = r.int(-8, 8); } while (b2 === b1);
      const { o, a } = mc(r, m, [-m, frac(1, m), b1 === m ? b2 : b1, m + 1], (x) => (typeof x === "string" ? x : fmtN(x)));
      return { d: "alg", sk: "Systems of equations", q: `y = ${lin(m, b1)}\ny = kx${b2 < 0 ? " " + M + " " + Math.abs(b2) : b2 > 0 ? " + " + b2 : ""}\n\nIn the system of equations above, k is a constant. For what value of k does the system have no solution?`, o, a, spr: m,
        e: `No solution means the lines are parallel: same slope, different y-intercepts. The intercepts (${fmtN(b1)} and ${fmtN(b2)}) already differ, so k must equal the other slope, ${fmtN(m)}.`,
        t: "No solution = same slope, different intercept. Infinitely many = the same line.", key: `nosol:${m},${b1},${b2}` };
    }
    const a1 = r.int(2, 5), b1 = r.nz(-5, 6), c1 = r.nz(-9, 12), k = r.int(2, 4);
    const inf = r.f() < 0.5, ans = b1 * k;
    const c2 = inf ? c1 * k : c1 * k + r.nz(-3, 3);
    const { o, a } = mc(r, ans, [b1, -ans, b1 + k, a1 * k], fmtN);
    return { d: "alg", sk: "Systems of equations", q: `${eq2(a1, b1, c1)}\n${fmtN(a1 * k)}x + ry = ${fmtN(c2)}\n\nIn the system above, r is a constant. For what value of r does the system have ${inf ? "infinitely many solutions" : "no solution"}?`, o, a, spr: ans,
      e: `The second x-coefficient is ${k} times the first, so for the lines to be ${inf ? "identical" : "parallel"}, r must be ${k} × ${fmtN(b1)} = ${fmtN(ans)}. ${inf ? `The constants match too (${fmtN(c1)} × ${k} = ${fmtN(c2)}), so the equations are the same line.` : `The constants don't scale the same way (${fmtN(c1)} × ${k} ≠ ${fmtN(c2)}), so the lines never meet.`}`,
      key: `nosol3:${a1},${b1},${c1},${k},${c2}` };
  };

  G.alg_fx = (r, L) => {
    const m = r.nz(-4, 6), b = r.int(-8, 8), p = r.int(-3, 3); let q; do { q = r.int(-2, 6); } while (q === p);
    let rr; do { rr = r.int(-5, 10); } while (rr === p || rr === q);
    const u = m * p + b, v = m * q + b, ans = m * rr + b;
    const { o, a } = mc(r, ans, [m * rr, m, b, (u + v) / 2, ans + m], fmtN);
    return { d: "alg", sk: "Linear functions", q: `For the linear function f, f(${fmtN(p)}) = ${fmtN(u)} and f(${fmtN(q)}) = ${fmtN(v)}. What is the value of f(${fmtN(rr)})?`, o, a, spr: ans,
      e: `Slope = (${fmtN(v)} ${M} ${paren(u)}) ÷ (${fmtN(q)} ${M} ${paren(p)}) = ${fmtN(m)}. So f(x) = ${lin(m, b)}, and f(${fmtN(rr)}) = ${fmtN(m)}(${fmtN(rr)})${sgn(b)} = ${fmtN(ans)}.`,
      key: `fx:${p},${u},${q},${v},${rr}` };
  };

  /* ============ ADVANCED MATH ============ */
  G.adv_roots = (r, L) => {
    let s1, s2; do { s1 = r.nz(-9, 9); s2 = r.nz(-9, 9); } while (s1 === s2);
    const lead = L === 3 ? r.int(2, 3) : 1;
    const B = -lead * (s1 + s2), Cc = lead * s1 * s2;
    const eq = `${poly([[lead, 2], [B, 1], [Cc, 0]])} = 0`;
    if (L === 1) {
      const [lo, hi] = [Math.min(s1, s2), Math.max(s1, s2)];
      const pair = (a, b) => `${fmtN(Math.min(a, b))} and ${fmtN(Math.max(a, b))}`;
      const { o, a } = mc(r, pair(lo, hi), [pair(-lo, -hi), pair(lo, -hi), pair(s1 * s2, 1), pair(-(s1 + s2), s1 * s2)], String);
      return { d: "adv", sk: "Quadratic equations", q: `What are the solutions to ${eq}?`, o, a,
        e: `Factor: (${xMinus(s1)})(${xMinus(s2)}) = 0, so x = ${fmtN(s1)} or x = ${fmtN(s2)}. Look for two numbers that multiply to ${fmtN(Cc)} and add to ${fmtN(-B)}.`,
        t: "Desmos: graph the quadratic and read the x-intercepts.", key: `roots1:${s1},${s2}` };
    }
    const askSum = L === 2 || r.f() < 0.5;
    const ans = askSum ? s1 + s2 : s1 * s2;
    const { o, a } = mc(r, ans, askSum ? [-ans, s1 * s2, lead * ans, B] : [-ans, s1 + s2, Cc, -Cc], fmtN);
    return { d: "adv", sk: "Quadratic equations", q: `What is the ${askSum ? "sum" : "product"} of the solutions to ${eq}?`, o, a, spr: ans,
      e: `${lead > 1 ? `Divide by ${lead}: ${poly([[1, 2], [B / lead, 1], [Cc / lead, 0]])} = 0. ` : ""}This factors as (${xMinus(s1)})(${xMinus(s2)}) = 0, so the solutions are ${fmtN(s1)} and ${fmtN(s2)}. Their ${askSum ? "sum" : "product"} is ${fmtN(ans)}.`,
      t: askSum ? "Shortcut: for ax² + bx + c = 0, the sum of the solutions is −b/a." : "Shortcut: for ax² + bx + c = 0, the product of the solutions is c/a.", key: `roots:${lead},${s1},${s2},${askSum}` };
  };

  G.adv_eval = (r, L) => {
    const a = r.nz(-3, 4), b = r.int(-6, 6), c = r.int(-9, 9), n = -r.int(1, L === 1 ? 3 : 5);
    const ans = a * n * n + b * n + c;
    const { o, a: ai } = mc(r, ans, [-a * n * n + b * n + c, a * n * n - b * n + c, a * n * 2 + b * n + c, ans + 2], fmtN);
    return { d: "adv", sk: "Nonlinear functions", q: `The function f is defined by f(x) = ${poly([[a, 2], [b, 1], [c, 0]])}. What is the value of f(${fmtN(n)})?`, o, a: ai, spr: ans,
      e: `f(${fmtN(n)}) = ${a === 1 ? "" : a === -1 ? M : fmtN(a)}(${fmtN(n)})²${b ? sgn(b) + "(" + fmtN(n) + ")" : ""}${sgn(c)} = ${fmtN(a * n * n)}${sgn(b * n)}${sgn(c)} = ${fmtN(ans)}. Squaring a negative number gives a positive result.`,
      t: "Use parentheses when substituting negatives, in your head and in Desmos.", key: `eval:${a},${b},${c},${n}` };
  };

  G.adv_exp = (r, L) => {
    if (L === 3) {
      const P = r.pick([800, 1200, 1500, 2400, 5000]), pct = r.pick([4, 6, 8, 12, 15, 20]), up = r.f() < 0.5;
      const base = up ? (100 + pct) / 100 : (100 - pct) / 100;
      const right = up ? `It increases by ${pct}% each year.` : `It decreases by ${pct}% each year.`;
      const { o, a } = mc(r, right, [up ? `It increases by ${100 + pct}% each year.` : `It decreases by ${100 - pct}% each year.`, up ? `It decreases by ${pct}% each year.` : `It increases by ${pct}% each year.`, `It changes by $${pct} each year.`], String);
      return { d: "adv", sk: "Exponential functions", q: `The value V, in dollars, of an item t years after it was purchased is modeled by V(t) = ${P}(${base})^t. Which statement best describes how the value changes?`, o, a,
        e: `The base ${base} = 1 ${up ? "+" : M} ${pct / 100}, so each year the value is multiplied by ${base}: a ${pct}% ${up ? "increase" : "decrease"}.`,
        t: "Base above 1 means growth; below 1 means decay. The percent is the distance from 1.", key: `exp3:${P},${pct},${up}` };
    }
    const P0 = r.pick([200, 300, 400, 500, 800, 1000]), k = r.pick([2, 3]), T = r.pick([2, 3, 4, 5, 6]);
    const unit = r.pick(["hours", "days", "weeks"]), word = k === 2 ? "doubles" : "triples";
    const right = `P(t) = ${P0}(${k})^(t/${T})`;
    const { o, a } = mc(r, right, [`P(t) = ${P0}(${k})^(${T}t)`, `P(t) = ${P0}(${T})^(t/${k})`, `P(t) = ${k}(${P0})^(t/${T})`, `P(t) = ${P0} + ${k}t`], String);
    return { d: "adv", sk: "Exponential functions", q: `A population of ${P0} organisms ${word} every ${T} ${unit}. Which function gives the population P after t ${unit}?`, o, a,
      e: `Start at ${P0}, multiply by ${k} once for every ${T} ${unit}, so the exponent is t/${T}. Check: when t = ${T}, P = ${P0 * k}.`,
      t: "Test an answer choice with an easy value of t.", key: `exp:${P0},${k},${T},${unit}` };
  };

  G.adv_equiv = (r, L) => {
    const a = r.nz(-7, 7);
    if (L === 1) {
      const right = poly([[1, 2], [2 * a, 1]]);
      const { o, a: ai } = mc(r, right, [poly([[1, 2]]), poly([[1, 2], [a, 1]]), poly([[1, 2], [2 * a, 1], [2 * a * a, 0]]), poly([[1, 2], [-2 * a, 1]])], String);
      return { d: "adv", sk: "Equivalent expressions", q: `Which expression is equivalent to (${lin(1, a)})² ${M} ${a * a}?`, o, a: ai,
        e: `(${lin(1, a)})² = ${poly([[1, 2], [2 * a, 1], [a * a, 0]])}. Subtract ${a * a}: ${right}.`,
        t: "(x + a)² is NOT x² + a². Don't forget the middle term 2ax.", key: `equiv1:${a}` };
    }
    const p = L === 3 ? r.int(2, 4) : 1, b = r.nz(-8, 8);
    const A2 = p, B1 = p * -b + a, C0 = -a * b; // (px + a)(x − b)
    const right = poly([[A2, 2], [B1, 1], [C0, 0]]);
    const { o, a: ai } = mc(r, right, [poly([[A2, 2], [p * b + a, 1], [a * b, 0]]), poly([[A2, 2], [B1, 1], [-C0, 0]]), poly([[A2, 2], [a - b, 1], [C0, 0]]), poly([[A2, 2], [C0, 0]])], String);
    return { d: "adv", sk: "Equivalent expressions", q: `Which expression is equivalent to (${lin(p, a)})(${xMinus(b)})?`, o, a: ai,
      e: `Multiply every term: ${p === 1 ? "" : fmtN(p)}x·x = ${poly([[p, 2]])}, ${p === 1 ? "" : fmtN(p)}x·${paren(-b)} = ${poly([[-p * b, 1]])}, ${fmtN(a)}·x = ${poly([[a, 1]])}, and ${fmtN(a)}·${paren(-b)} = ${fmtN(C0)}. Combine: ${right}.`,
      t: "Desmos check: graph the original and your answer. Equivalent expressions draw the same graph.", key: `equiv:${p},${a},${b}` };
  };

  G.adv_vertex = (r, L) => {
    if (L === 3) {
      const h = r.nz(-6, 6), b = -2 * h, c = r.int(-10, 20), ans = c - h * h;
      const { o, a } = mc(r, ans, [c, h, -h, c + h * h], fmtN);
      return { d: "adv", sk: "Quadratic functions", q: `The function f is defined by f(x) = ${poly([[1, 2], [b, 1], [c, 0]])}. What is the minimum value of f(x)?`, o, a, spr: ans,
        e: `The vertex is at x = −b/(2a) = ${fmtN(-b)}/2 = ${fmtN(h)}. f(${fmtN(h)}) = ${fmtN(h * h)}${sgn(b * h)}${sgn(c)} = ${fmtN(ans)}.`,
        t: "Desmos: graph it and click the lowest point.", key: `vert3:${b},${c}` };
    }
    const h = r.nz(-7, 7), k = r.nz(-9, 12), up = r.f() < 0.6, A = up ? r.int(1, 3) : -r.int(1, 3), askX = L === 2 && r.f() < 0.5;
    const ans = askX ? h : k;
    const { o, a } = mc(r, ans, [askX ? -h : h, askX ? k : -k, askX ? -k : -h, ans + A], fmtN);
    return { d: "adv", sk: "Quadratic functions", q: `y = ${A === 1 ? "" : A === -1 ? M : fmtN(A)}(${xMinus(h)})² ${k < 0 ? M + " " + Math.abs(k) : "+ " + k}\n\n${askX ? `For what value of x does y reach its ${up ? "minimum" : "maximum"}?` : `What is the ${up ? "minimum" : "maximum"} value of y?`}`, o, a, spr: ans,
      e: `This is vertex form y = a(x − h)² + k with vertex (${fmtN(h)}, ${fmtN(k)}). Since a is ${up ? "positive, the parabola opens up, so the vertex is a minimum" : "negative, the parabola opens down, so the vertex is a maximum"}. ${askX ? `It occurs at x = ${fmtN(h)}.` : `The ${up ? "minimum" : "maximum"} value is ${fmtN(k)}.`}`,
      t: "In (x − h)², the sign flips: (x + 3)² means h = −3.", key: `vert:${A},${h},${k},${askX}` };
  };

  G.adv_disc = (r, L) => {
    const type = r.pick([0, 1, 2]);
    let a, b, c;
    if (type === 1) { const p = r.int(1, 3), q = r.nz(-6, 6); a = p * p; b = 2 * p * q; c = q * q; }
    else if (type === 2) { let s1, s2; do { s1 = r.nz(-7, 7); s2 = r.nz(-7, 7); } while (s1 === s2); a = r.int(1, 2); b = -a * (s1 + s2); c = a * s1 * s2; }
    else { a = r.int(1, 3); b = r.int(-6, 6); c = Math.floor((b * b) / (4 * a)) + r.int(1, 8); }
    const D = b * b - 4 * a * c;
    const labels = ["No real solutions", "Exactly one real solution", "Exactly two real solutions", "Infinitely many solutions"];
    const right = labels[type];
    const { o, a: ai } = mc(r, right, labels.filter((x) => x !== right), String);
    return { d: "adv", sk: "Quadratic equations", q: `How many distinct real solutions does the equation ${poly([[a, 2], [b, 1], [c, 0]])} = 0 have?`, o, a: ai,
      e: `The discriminant b² − 4ac = (${fmtN(b)})² − 4(${a})(${fmtN(c)}) = ${fmtN(D)}. ${D > 0 ? "Positive means two real solutions." : D === 0 ? "Zero means exactly one real solution." : "Negative means no real solutions."}`,
      t: "Desmos: graph y = the expression and count how many times it touches the x-axis.", key: `disc:${a},${b},${c}` };
  };

  G.adv_exprules = (r, L) => {
    const a = r.int(2, 7), b = r.int(2, 6), c = r.int(1, 5);
    let q, ans, e;
    if (L === 1) { ans = a + b - c; q = `(x^${a})(x^${b}) ÷ x^${c} = x^n. If x > 1, what is the value of n?`; e = `Multiply: add exponents (${a} + ${b} = ${a + b}). Divide: subtract (${a + b} − ${c} = ${ans}).`; }
    else { ans = a * b + c; q = `(x^${a})^${b} · x^${c} = x^n. If x > 1, what is the value of n?`; e = `Power of a power: multiply exponents (${a} × ${b} = ${a * b}). Then multiply by x^${c}: add ${c} to get ${ans}.`; }
    const { o, a: ai } = mc(r, ans, L === 1 ? [a * b - c, a + b + c, (a * b) / c] : [a + b + c, a * b * c, Math.pow(a, b) + c], fmtN);
    return { d: "adv", sk: "Exponent rules", q, o, a: ai, spr: ans, e, t: "Multiply → add exponents. Divide → subtract. Power of a power → multiply.", key: `exr:${L},${a},${b},${c}` };
  };

  G.adv_radical = (r, L) => {
    const bb = r.int(2, 9), a = r.nz(-10, 12), ans = bb * bb - a;
    const { o, a: ai } = mc(r, ans, [bb - a, bb * bb + a, 2 * bb - a, ans + 1], fmtN);
    return { d: "adv", sk: "Radical equations", q: `√(${lin(1, a)}) = ${bb}\n\nWhat is the solution to the equation above?`, o, a: ai, spr: ans,
      e: `Square both sides: ${lin(1, a)} = ${bb * bb}. So x = ${bb * bb} ${M} ${paren(a)} = ${fmtN(ans)}. Check: √(${fmtN(ans + a)}) = ${bb}.`, key: `rad:${a},${bb}` };
  };

  /* ============ PROBLEM-SOLVING & DATA ANALYSIS ============ */
  G.psda_discount = (r, L) => {
    const P = r.int(8, 40) * 5, d = r.pick([10, 15, 20, 25, 30, 40]), t = r.pick([5, 6, 7, 8]);
    // Work in exact cents; retry if the true total isn't a whole number of cents.
    const exact = P * (100 - d) * (100 + t); // in 1/100 of a cent
    if (exact % 100 !== 0) throw { retry: true };
    const ans = exact / 10000;
    const cents = (x) => Math.round(x * 100) / 100;
    const { o, a } = mc(r, ans, [cents((P * (100 - d + t)) / 100), (P * (100 - d)) / 100, cents((P * (100 - d) * (100 - t)) / 10000), P - d + t], money);
    return { d: "psda", sk: "Percentages", q: `A jacket regularly priced at $${P} is on sale for ${d}% off. ${art(t, true)} ${t}% sales tax is then applied to the sale price. What is the total cost of the jacket?`, o, a,
      e: `Sale price: ${P} × ${(1 - d / 100).toFixed(2)} = ${money(P * (1 - d / 100))}. With tax: × ${(1 + t / 100).toFixed(2)} = ${money(ans)}.`,
      t: "Percent off: multiply by (1 − rate). Percent added: multiply by (1 + rate).", key: `disc:${P},${d},${t}` };
  };

  G.psda_pctchange = (r, L) => {
    if (L === 3) {
      const p1 = r.pick([10, 20, 25, 50]), p2 = r.pick([10, 20, 25, 40]);
      const net = Math.round(((1 + p1 / 100) * (1 - p2 / 100) - 1) * 10000) / 100;
      const desc = (x) => (x === 0 ? "No change" : `${art(Math.abs(x), true)} ${Math.abs(x)}% ${x > 0 ? "increase" : "decrease"}`);
      const { o, a } = mc(r, desc(net), [desc(p1 - p2), desc(-net === 0 ? p2 : -net), desc(p1 + p2 === 0 ? 5 : Math.round((p1 - p2) / 2))], String);
      return { d: "psda", sk: "Percentages", q: `The price of a stock rose by ${p1}% on Monday and then fell by ${p2}% on Tuesday. Which describes the total change in price from the start of Monday to the end of Tuesday?`, o, a,
        e: `Multiply the factors: ${(1 + p1 / 100).toFixed(2)} × ${(1 - p2 / 100).toFixed(2)} = ${((1 + p1 / 100) * (1 - p2 / 100)).toFixed(4).replace(/\.?0+$/, "")}. That's ${desc(net).toLowerCase()} overall. You can't just add the percents.`,
        t: "Successive percent changes multiply; they don't add.", key: `pc3:${p1},${p2}` };
    }
    let A, p, B;
    do { A = r.pick([20, 25, 40, 50, 60, 80, 120, 150, 200, 250, 400]); p = r.pick([10, 12, 15, 20, 25, 30, 35, 40, 60, 75]); B = (A * (100 + p)) / 100; } while (!Number.isInteger(B));
    const down = L === 2 && r.f() < 0.5;
    const from = down ? B : A, to = down ? A : B;
    if ((Math.abs(to - from) * 10000) % from !== 0) throw { retry: true }; // exact to 2 decimal places
    const ans = (Math.abs(to - from) * 100) / from;
    const { o, a } = mc(r, ans, [Math.round((Math.abs(to - from) / to) * 10000) / 100, Math.abs(to - from), Math.round((to / from) * 10000) / 100], (x) => fmtN(x) + "%");
    return { d: "psda", sk: "Percentages", q: `The number of members in a club ${down ? "decreased" : "increased"} from ${from} to ${to}. By what percent did the number of members ${down ? "decrease" : "increase"}?`, o, a, spr: ans,
      e: `Percent change = change ÷ original = ${Math.abs(to - from)} ÷ ${from} = ${fmtN(ans / 100)}, or ${fmtN(ans)}%.`,
      t: "Always divide by the ORIGINAL (starting) amount.", key: `pc:${from},${to}` };
  };

  G.psda_mean = (r, L) => {
    const n = L === 1 ? 4 : r.int(5, 7), target = r.int(76, 92);
    const vals = Array.from({ length: n - 1 }, () => r.int(target - 12, Math.min(100, target + 10)));
    const ans = target * n - vals.reduce((s, v) => s + v, 0);
    if (ans < 40 || ans > 100) return G.psda_mean(r, L);
    const { o, a } = mc(r, ans, [target, Math.round(vals.reduce((s, v) => s + v, 0) / (n - 1)), ans + n, target * (n - 1) - vals.reduce((s, v) => s + v, 0) + target], fmtN);
    return { d: "psda", sk: "Statistics", q: `A student's first ${n - 1} quiz scores were ${vals.join(", ")}. What score does the student need on quiz ${n} for the mean of all ${n} scores to be exactly ${target}?`, o, a, spr: ans,
      e: `${n} scores averaging ${target} total ${target * n}. The first ${n - 1} total ${vals.reduce((s, v) => s + v, 0)}, so the last score must be ${target * n} ${M} ${vals.reduce((s, v) => s + v, 0)} = ${ans}.`,
      t: "Mean problems: work with totals (mean × count).", key: `mean:${vals},${target}` };
  };

  G.psda_median = (r, L) => {
    const n = r.pick(L === 1 ? [5, 7] : [6, 8]);
    let vals = Array.from({ length: n }, () => r.int(2, 30));
    vals[r.int(0, n - 1)] = vals[0];
    const sorted = vals.slice().sort((a, b) => a - b);
    const med = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
    const mean = Math.round((vals.reduce((s, v) => s + v, 0) / n) * 10) / 10;
    const unsortedMid = n % 2 ? vals[(n - 1) / 2] : (vals[n / 2 - 1] + vals[n / 2]) / 2;
    const { o, a } = mc(r, med, [mean, unsortedMid, sorted[Math.floor(n / 2)], med + 1], fmtN);
    return { d: "psda", sk: "Statistics", q: `What is the median of the data set below?\n\n${vals.join(", ")}`, o, a, spr: med,
      e: `First put the values in order: ${sorted.join(", ")}. ${n % 2 ? `The middle (${ordinal((n + 1) / 2)}) value is ${fmtN(med)}.` : `With ${n} values, the median is the mean of the two middle values: (${sorted[n / 2 - 1]} + ${sorted[n / 2]}) ÷ 2 = ${fmtN(med)}.`}`,
      t: "Sort first. The median of an unsorted list is a classic trap.", key: `med:${vals}` };
  };

  G.psda_rate = (r, L) => {
    const sp = r.pick([36, 40, 42, 45, 48, 50, 52, 55, 60, 64]), t = r.pick([1.5, 2, 2.5, 3, 4]), d = sp * t;
    if (L === 3) {
      const miles = sp * r.pick([0.25, 0.5, 0.75, 1.25, 1.5]), mins = (miles / sp) * 60;
      const { o, a } = mc(r, mins, [miles / sp, (miles / d) * 100, mins + 10, (sp / miles) * 60], fmtN);
      return { d: "psda", sk: "Rates and units", q: `A bus travels ${d} miles in ${t} hours at a constant speed. At this speed, how many minutes will it take the bus to travel ${fmtN(miles)} miles?`, o, a, spr: mins,
        e: `Speed = ${d} ÷ ${t} = ${sp} miles per hour. Time = ${fmtN(miles)} ÷ ${sp} = ${fmtN(miles / sp)} hours = ${fmtN(mins)} minutes.`,
        t: "Write units next to every number so you can see when to convert.", key: `rate3:${d},${t},${miles}` };
    }
    const T = r.pick([1, 3, 3.5, 5, 6].filter((v) => v !== t)), ans = sp * T;
    const { o, a } = mc(r, ans, [d * T, (d / T) * t, ans + sp, d + T], fmtN);
    return { d: "psda", sk: "Rates and units", q: `A car travels ${d} miles in ${t} hours. At the same rate, how many miles will it travel in ${T} ${T === 1 ? "hour" : "hours"}?`, o, a, spr: ans,
      e: `Rate = ${d} ÷ ${t} = ${sp} miles per hour. In ${T} ${T === 1 ? "hour" : "hours"}: ${sp} × ${T} = ${fmtN(ans)} miles.`, key: `rate:${d},${t},${T}` };
  };

  G.psda_prob = (r, L) => {
    if (L === 1) {
      const R = r.int(2, 9), B = r.int(2, 9), Gg = r.int(2, 9), tot = R + B + Gg;
      const { o, a } = mc(r, frac(R + Gg, tot), [frac(B, tot), frac(R, tot), frac(R + Gg, B), frac(Gg, tot)], String);
      return { d: "psda", sk: "Probability", q: `A bag contains ${R} red, ${B} blue, and ${Gg} green marbles. If one marble is chosen at random, what is the probability that it is NOT blue?`, o, a,
        e: `There are ${tot} marbles and ${R + Gg} are not blue. Probability = ${R + Gg}/${tot}${frac(R + Gg, tot) === (R + Gg) + "/" + tot ? "" : " = " + frac(R + Gg, tot)}.`, key: `prob1:${R},${B},${Gg}` };
    }
    const g10y = r.int(8, 40), g10n = r.int(8, 40), g11y = r.int(8, 40), g11n = r.int(8, 40);
    const rowG = r.pick(["10", "11"]), yes = rowG === "10" ? g10y : g11y, rowT = rowG === "10" ? g10y + g10n : g11y + g11n, colT = g10y + g11y, all = g10y + g10n + g11y + g11n;
    const cond = L === 3 ? "given" : "row";
    const right = cond === "given" ? frac(yes, colT) : frac(yes, rowT);
    const { o, a } = mc(r, right, [frac(yes, all), cond === "given" ? frac(yes, rowT) : frac(yes, colT), frac(rowT, all)], String);
    const table = { head: ["", "Joined a club", "Did not join", "Total"], rows: [["Grade 10", g10y, g10n, g10y + g10n], ["Grade 11", g11y, g11n, g11y + g11n], ["Total", colT, g10n + g11n, all]] };
    return { d: "psda", sk: "Probability", table,
      q: cond === "given" ? `The table summarizes a survey of students. If a student who joined a club is chosen at random, what is the probability that the student is in grade ${rowG}?`
        : `The table summarizes a survey of students. If a grade ${rowG} student is chosen at random, what is the probability that the student joined a club?`, o, a,
      e: cond === "given" ? `Restrict to students who joined a club: ${colT} students. Of those, ${yes} are in grade ${rowG}. Probability = ${yes}/${colT} = ${right}.`
        : `Restrict to grade ${rowG}: ${rowT} students. Of those, ${yes} joined a club. Probability = ${yes}/${rowT} = ${right}.`,
      t: "The group after \"if a ___ is chosen\" is your denominator.", key: `prob2:${g10y},${g10n},${g11y},${g11n},${rowG},${cond}` };
  };

  G.psda_ratio = (r, L) => {
    let a1 = r.int(2, 7), b1 = r.int(2, 9); while (gcd(a1, b1) !== 1 || a1 === b1) { a1 = r.int(2, 7); b1 = r.int(2, 9); }
    const k = r.int(3, 15), N = (a1 + b1) * k, big = a1 > b1 ? "boys" : "girls";
    const ans = Math.max(a1, b1) * k;
    const { o, a } = mc(r, ans, [Math.min(a1, b1) * k, N / Math.max(a1, b1), Math.max(a1, b1) * (k + 1), N - k], fmtN);
    return { d: "psda", sk: "Ratios", q: `The ratio of boys to girls in a school orchestra is ${a1} to ${b1}. There are ${N} students in the orchestra. How many ${big} are in the orchestra?`, o, a, spr: ans,
      e: `The ratio has ${a1} + ${b1} = ${a1 + b1} parts. ${N} ÷ ${a1 + b1} = ${k} students per part. ${big[0].toUpperCase() + big.slice(1)}: ${Math.max(a1, b1)} × ${k} = ${ans}.`,
      t: "Add the ratio parts to get the total parts.", key: `ratio:${a1},${b1},${N}` };
  };

  /* ============ GEOMETRY & TRIGONOMETRY ============ */
  const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]];
  G.geo_pyth = (r, L) => {
    const [p, q, h] = r.pick(TRIPLES), k = r.int(1, L === 1 ? 2 : 4), A = p * k, B = q * k, H = h * k;
    const askLeg = L > 1 && r.f() < 0.5;
    const ans = askLeg ? B : H;
    const { o, a } = mc(r, ans, askLeg ? [H - A, H + A, Math.round(Math.sqrt(H * H + A * A) * 100) / 100] : [A + B, A * A + B * B, H + k], fmtN);
    return { d: "geo", sk: "Right triangles", q: askLeg ? `A right triangle has a hypotenuse of length ${H} and one leg of length ${A}. What is the length of the other leg?` : `A right triangle has legs of length ${A} and ${B}. What is the length of the hypotenuse?`, o, a, spr: ans,
      e: askLeg ? `${A}² + b² = ${H}², so b² = ${H * H} − ${A * A} = ${B * B} and b = ${B}.` : `${A}² + ${B}² = ${A * A} + ${B * B} = ${H * H}, and √${H * H} = ${H}.`,
      t: `Spot Pythagorean triples: ${p}-${q}-${h}${k > 1 ? " (here multiplied by " + k + ")" : ""}.`, key: `pyth:${A},${B},${askLeg}` };
  };

  G.geo_trig = (r, L) => {
    const [p, q, h] = r.pick(TRIPLES), fn = r.pick(["sin", "cos", "tan"]);
    if (L === 3) {
      const other = fn === "sin" ? "cos" : "sin", val = frac(p, h);
      const { o, a } = mc(r, val, [frac(q, h), frac(p, q), frac(h, p)], String);
      return { d: "geo", sk: "Trigonometry", q: `In right triangle ABC, angle C is a right angle and ${fn === "sin" ? "sin" : "cos"} A = ${val}. What is the value of ${other} B?`, o, a,
        e: `Angles A and B are complementary (they add to 90°), so ${fn === "sin" ? "sin A = cos B" : "cos A = sin B"}. The value is ${val}.`,
        t: "sin x° = cos(90° − x°). This shows up often.", key: `trig3:${p},${h},${fn}` };
    }
    const ratio = fn === "sin" ? [p, h] : fn === "cos" ? [q, h] : [p, q];
    const right = frac(...ratio);
    const { o, a } = mc(r, right, [frac(q, h), frac(p, h), frac(p, q), frac(q, p), frac(h, p)], String);
    return { d: "geo", sk: "Trigonometry", q: `In right triangle ABC, angle C is the right angle. The side opposite angle A has length ${p}, the side adjacent to angle A has length ${q}, and the hypotenuse has length ${h}. What is ${fn} A?`, o, a,
      e: `${fn === "sin" ? "Sine = opposite ÷ hypotenuse" : fn === "cos" ? "Cosine = adjacent ÷ hypotenuse" : "Tangent = opposite ÷ adjacent"} = ${ratio[0]}/${ratio[1]}.`,
      t: "SOH-CAH-TOA: Sine=Opp/Hyp, Cosine=Adj/Hyp, Tangent=Opp/Adj.", key: `trig:${p},${q},${fn}` };
  };

  G.geo_circle = (r, L) => {
    const h = r.nz(-6, 6), k = r.nz(-6, 6), rad = r.int(2, 9);
    if (L === 3) {
      const D = -2 * h, E = -2 * k, F = h * h + k * k - rad * rad;
      const { o, a } = mc(r, rad, [rad * rad, Math.abs(F), h * h + k * k, rad * 2], fmtN);
      return { d: "geo", sk: "Circles", q: `x² + y² ${D < 0 ? M : "+"} ${Math.abs(D)}x ${E < 0 ? M : "+"} ${Math.abs(E)}y${F ? (F < 0 ? " " + M + " " : " + ") + Math.abs(F) : ""} = 0\n\nWhat is the radius of the circle defined by the equation above?`, o, a, spr: rad,
        e: `Complete the square: (x ${h > 0 ? M : "+"} ${Math.abs(h)})² + (y ${k > 0 ? M : "+"} ${Math.abs(k)})² = ${h * h} + ${k * k}${sgn(-F)} = ${rad * rad}. The radius is √${rad * rad} = ${rad}.`,
        t: "Complete the square: half the x-coefficient, squared, gets added to both sides.", key: `circ3:${h},${k},${rad}` };
    }
    const c = (hh, kk, rr) => `Center (${fmtN(hh)}, ${fmtN(kk)}), radius ${rr}`;
    const { o, a } = mc(r, c(h, k, rad), [c(-h, -k, rad), c(h, k, rad * rad), c(-h, -k, rad * rad)], String);
    return { d: "geo", sk: "Circles", q: `(${xMinus(h)})² + (${xMinus(k, "y")})² = ${rad * rad}\n\nWhat are the center and radius of the circle defined by the equation above?`, o, a,
      e: `Standard form is (x − h)² + (y − k)² = r². So the center is (${fmtN(h)}, ${fmtN(k)}) and r = √${rad * rad} = ${rad}.`,
      t: "The signs inside the parentheses flip for the center.", key: `circ:${h},${k},${rad}` };
  };

  G.geo_angles = (r, L) => {
    const total = r.pick([90, 180]), m = r.int(2, 4);
    let x, c;
    for (let i = 0; i < 50; i++) { x = r.int(10, 50); c = total - x - m * x; if (L === 1 ? c === 0 : Math.abs(c) <= 30 && c !== 0) break; }
    if (L === 1) c = 0;
    if (x + m * x + c !== total) { x = total / (m + 1); if (!Number.isInteger(x)) return G.geo_angles(r, L); c = 0; }
    const big = m * x + c, askSmall = x <= big;
    const ans = askSmall ? x : big;
    const { o, a } = mc(r, ans, [askSmall ? big : x, total - ans + 10, total / m, ans + m], (v) => fmtN(v) + "°");
    const word = total === 180 ? "supplementary" : "complementary";
    return { d: "geo", sk: "Lines and angles", q: `Two angles are ${word}. The measure of one angle is x°, and the measure of the other is (${lin(m, c)})°. What is the measure of the ${askSmall ? "smaller" : "larger"} angle?`, o, a, spr: ans,
      e: `${word[0].toUpperCase() + word.slice(1)} angles sum to ${total}°. x + ${lin(m, c)} = ${total}, so ${m + 1}x = ${total - c} and x = ${x}. The angles are ${x}° and ${big}°.`,
      t: "Supplementary = 180°, complementary = 90°.", key: `ang:${total},${m},${c}` };
  };

  G.geo_volume = (r, L) => {
    const shape = L === 1 ? "cylinder" : r.pick(["cylinder", "cone", "sphere"]);
    const R = shape === "sphere" ? r.pick([3, 6]) : r.int(2, 6), H = shape === "cone" ? r.int(1, 4) * 3 : r.int(3, 12);
    let k, formula, wrongs;
    if (shape === "cylinder") { k = R * R * H; formula = `V = πr²h = π(${R}²)(${H})`; wrongs = [2 * R * H, R * H, 4 * R * R * H]; }
    else if (shape === "cone") { k = (R * R * H) / 3; formula = `V = ⅓πr²h = ⅓π(${R}²)(${H})`; wrongs = [R * R * H, (R * H) / 3, (2 * R * R * H) / 3]; }
    else { k = (4 * R * R * R) / 3; formula = `V = (4/3)πr³ = (4/3)π(${R}³)`; wrongs = [4 * R * R, R * R * R, (4 * R * R * R * 8) / 3]; }
    const fmt = (v) => (Number.isInteger(v) ? fmtN(v) : "(" + frac(Math.round(v * 3), 3) + ")") + "π";
    const { o, a } = mc(r, k, wrongs, fmt);
    return { d: "geo", sk: "Area and volume", q: shape === "sphere" ? `A sphere has a radius of ${R} inches. What is its volume, in cubic inches?` : `A ${shape} has a radius of ${R} centimeters and a height of ${H} centimeters. What is its volume, in cubic centimeters?`, o, a,
      e: `${formula} = ${fmt(k)}.`, t: "Every volume formula you need is on the reference sheet. Open it.", key: `vol:${shape},${R},${H}` };
  };

  G.geo_triangle = (r, L) => {
    if (L === 1) {
      const A = r.int(25, 80), B = r.int(25, 150 - A), ans = 180 - A - B;
      const { o, a } = mc(r, ans, [360 - A - B, 90 - A, A + B, ans + 10], (v) => fmtN(v) + "°");
      return { d: "geo", sk: "Triangles", q: `In triangle PQR, the measure of angle P is ${A}° and the measure of angle Q is ${B}°. What is the measure of angle R?`, o, a, spr: ans,
        e: `The angles of a triangle sum to 180°: 180 − ${A} − ${B} = ${ans}.`, key: `tri1:${A},${B}` };
    }
    if (L === 2) {
      const V = r.int(10, 70) * 2, ans = (180 - V) / 2;
      const { o, a } = mc(r, ans, [180 - V, V / 2, 90 - V / 2 + 10, V], (v) => fmtN(v) + "°");
      return { d: "geo", sk: "Triangles", q: `In isosceles triangle ABC, AB = AC and the measure of angle A is ${V}°. What is the measure of angle B?`, o, a, spr: ans,
        e: `The base angles B and C are equal. (180 − ${V}) ÷ 2 = ${ans}.`, t: "Equal sides are opposite equal angles.", key: `tri2:${V}` };
    }
    const A = r.int(30, 70), B = r.int(30, 70), ans = A + B;
    const { o, a } = mc(r, ans, [180 - ans, 180 - A, 360 - ans], (v) => fmtN(v) + "°");
    return { d: "geo", sk: "Triangles", q: `In triangle JKL, angle J measures ${A}° and angle K measures ${B}°. Side KL is extended past L to point M. What is the measure of angle JLM?`, o, a, spr: ans,
      e: `An exterior angle equals the sum of the two remote interior angles: ${A} + ${B} = ${ans}. (Or: angle L = ${180 - ans}°, and 180 − ${180 - ans} = ${ans}.)`, key: `tri3:${A},${B}` };
  };

  G.geo_similar = (r, L) => {
    const s = r.int(3, 9), k = r.pick([2, 3, 4, 1.5, 2.5]), t = r.int(4, 12);
    if (L === 3) {
      const areaSmall = r.int(4, 20) * 2, ans = areaSmall * k * k;
      const { o, a } = mc(r, ans, [areaSmall * k, areaSmall * k * 2, areaSmall + k], fmtN);
      return { d: "geo", sk: "Similar figures", q: `Triangle ABC is similar to triangle DEF. Each side of triangle DEF is ${fmtN(k)} times as long as the corresponding side of triangle ABC. The area of triangle ABC is ${areaSmall} square units. What is the area of triangle DEF?`, o, a, spr: ans,
        e: `Lengths scale by ${fmtN(k)}, so areas scale by ${fmtN(k)}² = ${fmtN(k * k)}. ${areaSmall} × ${fmtN(k * k)} = ${fmtN(ans)}.`,
        t: "Length scale k → area scale k² → volume scale k³.", key: `sim3:${k},${areaSmall}` };
    }
    const ans = t * k;
    const { o, a } = mc(r, ans, [t + (s * k - s), s * k, t / k, ans + k], fmtN);
    return { d: "geo", sk: "Similar figures", q: `Triangle ABC is similar to triangle DEF, with A corresponding to D, B to E, and C to F. AB = ${s}, DE = ${fmtN(s * k)}, and BC = ${t}. What is the length of EF?`, o, a, spr: ans,
      e: `The scale factor is DE ÷ AB = ${fmtN(s * k)} ÷ ${s} = ${fmtN(k)}. So EF = ${t} × ${fmtN(k)} = ${fmtN(ans)}.`,
      t: "Set up a proportion with matching sides.", key: `sim:${s},${k},${t}` };
  };

  G.geo_arc = (r, L) => {
    const th = r.pick([30, 40, 45, 60, 72, 90, 120, 135, 150, 240]), R = r.int(2, 12);
    const sector = L === 3 && r.f() < 0.5;
    const num = sector ? th * R * R : th * 2 * R, den = 360;
    const fmt = (n, d) => { const f = frac(n, d); return (f === "1" ? "" : f.includes("/") ? "(" + f + ")" : f) + "π"; };
    const right = fmt(num, den);
    const wrongs = sector ? [fmt(th * 2 * R, 360), fmt(R * R, 1), fmt(th * R * R, 180)] : [fmt(th * R * R, 360), fmt(th * R, 360), fmt(2 * R, 1)];
    const { o, a } = mc(r, right, wrongs, String);
    return { d: "geo", sk: "Circles", q: `A circle has a radius of ${R}. What is the ${sector ? "area of a sector" : "length of an arc"} with a central angle of ${th}°?`, o, a,
      e: sector ? `Sector area = (${th}/360) × πr² = (${frac(th, 360)}) × ${R * R}π = ${right}.` : `Arc length = (${th}/360) × 2πr = (${frac(th, 360)}) × ${2 * R}π = ${right}.`,
      t: "The fraction of the circle is the central angle ÷ 360°.", key: `arc:${th},${R},${sector}` };
  };

  /* ============ Registry ============ */
  const BY_DOMAIN = {
    alg: ["alg_lineq", "alg_scaled", "alg_system", "alg_slope", "alg_model", "alg_ineq", "alg_nosol", "alg_fx"],
    adv: ["adv_roots", "adv_eval", "adv_exp", "adv_equiv", "adv_vertex", "adv_disc", "adv_exprules", "adv_radical"],
    psda: ["psda_discount", "psda_pctchange", "psda_mean", "psda_median", "psda_rate", "psda_prob", "psda_ratio"],
    geo: ["geo_pyth", "geo_trig", "geo_circle", "geo_angles", "geo_volume", "geo_triangle", "geo_similar", "geo_arc"]
  };

  function build(name, rng, level) {
    for (let i = 0; i < 40; i++) {
      try { const q = G[name](rng, level); q.gen = name; q.lv = level; return q; }
      catch (e) { if (!e || !e.retry) throw e; }
    }
    return null;
  }
  function generate(domain, level, rng, avoid, only) {
    const list = only && only.length ? only : BY_DOMAIN[domain];
    let last = null;
    for (let tries = 0; tries < 25; tries++) {
      const q = build(rng.pick(list), rng, level);
      if (!q) continue;
      last = q;
      if (!avoid || !avoid.has(q.key)) return q;
    }
    return last;
  }

  root.MathGen = { G, BY_DOMAIN, generate, build };
  if (typeof module !== "undefined") module.exports = root.MathGen;
})(typeof window !== "undefined" ? window : globalThis);
