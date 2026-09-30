/* Test Prep Hub — math question types added in batch 4 (from a Bluebook test review):
   shifting a graph, average rate of change from a graph or table, sum and product of roots,
   and reading the meaning of a linear model (constant functions, perimeter, fixed costs). */
(function (root) {
  const C = root.PSCore || (typeof require !== "undefined" ? require("./core.js") : null);
  const MG = root.MathGen || (typeof require !== "undefined" ? require("./mathgen.js") : null);
  const { fmtN, frac, poly, lin, mc, MINUS } = C;
  const M = MINUS;
  const G = MG.G;
  const retry = () => { throw { retry: true }; };
  const xm = (h) => (h === 0 ? "x" : h > 0 ? "x " + M + " " + h : "x + " + -h); // (x − h)
  const tail = (k) => (k === 0 ? "" : k > 0 ? " + " + k : " " + M + " " + -k);

  /* ---------- Shifting a graph ---------- */
  G.adv_shift = (r, L) => {
    const a = r.pick([1, 2, 3, -1, -2]), h = r.int(-6, 6), k = r.int(-9, 9), dx = r.nz(-5, 5), dy = r.nz(-6, 6);
    if (h === 0 && dx === 0) retry();
    const A = a === 1 ? "" : a === -1 ? M : String(a).replace("-", M);
    const f = (hh, kk) => (hh === 0 ? `${A}x²${tail(kk)}` : `${A}(${xm(hh)})²${tail(kk)}`);
    const right = f(h + dx, k + dy);
    const dirX = dx > 0 ? dx + " unit" + (dx === 1 ? "" : "s") + " to the right" : -dx + " unit" + (dx === -1 ? "" : "s") + " to the left";
    const dirY = dy > 0 ? dy + " unit" + (dy === 1 ? "" : "s") + " up" : -dy + " unit" + (dy === -1 ? "" : "s") + " down";
    const { o, a: ai } = mc(r, right, [f(h - dx, k + dy), f(h + dx, k - dy), f(h - dx, k - dy), f(h, k + dy + dx)], String);
    return { d: "adv", sk: "Nonlinear functions", q: `f(x) = ${f(h, k)}\n\nThe graph of y = f(x) in the xy-plane is shifted ${dirY} and ${dirX} to produce the graph of y = g(x). Which equation defines g?`, o: o.map((s) => "g(x) = " + s), a: ai,
      e: `Moving RIGHT by ${Math.abs(dx)} means replacing x with (x ${dx > 0 ? M : "+"} ${Math.abs(dx)}) (opposite sign inside); moving ${dy > 0 ? "up" : "down"} ${Math.abs(dy)} adds ${dy > 0 ? "" : M}${Math.abs(dy)} outside. So the vertex moves from (${fmtN(h)}, ${fmtN(k)}) to (${fmtN(h + dx)}, ${fmtN(k + dy)}): g(x) = ${right}.`.replace("Moving RIGHT", dx > 0 ? "Moving right" : "Moving left"),
      t: "Inside the parentheses the sign flips (right = minus); outside it doesn't (up = plus). Or track the vertex.", key: `shift:${a},${h},${k},${dx},${dy}` };
  };

  /* ---------- Average rate of change from a graph or table ---------- */
  const AROC = [
    { x: "Time (seconds)", y: "Momentum (newton-seconds)", ux: "second", uy: "newton-seconds" },
    { x: "Month", y: "Subscribers (thousands)", ux: "month", uy: "thousand subscribers" },
    { x: "Time (hours)", y: "Temperature (°C)", ux: "hour", uy: "degrees Celsius" },
    { x: "Day", y: "Plant height (centimeters)", ux: "day", uy: "centimeters" }
  ];
  G.psda_aroc = (r, L) => {
    const c = r.pick(AROC), xs = [0, 2, 4, 6, 8];
    let ys = [r.int(0, 6)]; for (let i = 1; i < 5; i++) ys.push(ys[i - 1] + r.int(L === 3 ? -3 : 0, 7));
    if (ys.some((y) => y < 0)) retry();
    const [i, j] = r.pick([[1, 3], [0, 2], [2, 4], [1, 4], [0, 3]]);
    const dy = ys[j] - ys[i], dx = xs[j] - xs[i];
    const right = frac(dy, dx);
    const { o, a } = mc(r, right, [frac(dx, dy || 1), frac(ys[j], xs[j] || 1), frac(dy, xs[j] || 1), frac(ys[j] + ys[i], dx)], String);
    const table = { head: [c.x + ", x", c.y + ", y"], rows: xs.map((x, k) => [String(x), String(ys[k])]) };
    return { d: "psda", sk: "Rates and units", table, p: `The table shows ${c.y.replace(/\s*\(.*\)/, "").toLowerCase()} at different times.`, q: `What is the average rate of change, in ${c.uy} per ${c.ux}, from x = ${xs[i]} to x = ${xs[j]}?`, o, a, spr: dy / dx,
      e: `Average rate of change = (change in y) ÷ (change in x) = (${ys[j]} ${M} ${ys[i]}) ÷ (${xs[j]} ${M} ${xs[i]}) = ${fmtN(dy)} ÷ ${dx} = ${right}. Use only the two endpoints; what happens in between doesn't matter.`,
      t: "Rate of change = rise ÷ run between the two given points. y on top.", key: `aroc:${ys}:${i}${j}` };
  };

  /* ---------- Sum and product of the roots ---------- */
  G.adv_vieta = (r, L) => {
    if (L === 3) {
      // p x² − (q a + s b) x + t·ab = 0 ; sum = (q a + s b)/p = k(4a + b) style
      const base = r.pick([[16, 4, 4, 64], [9, 3, 3, 27], [25, 5, 5, 125], [12, 4, 3, 48]]); // [coefA, coefB, ratio, lead]
      const [cA, cB, , lead] = base; const g = cA / cB; // sum = (cA a + cB b)/lead = (cB/lead)(g a + b)
      const k = frac(cB, lead), nb = `${g}a + b`;
      const { o, a } = mc(r, k, [frac(lead, cB), frac(cA, lead), frac(cB * g, lead * 2), String(cB)], String);
      return { d: "adv", sk: "Quadratic equations", q: `${lead}x² ${M} (${cA}a + ${cB}b)x + ab = 0\n\nIn the given equation, a and b are positive constants. The sum of the solutions to the equation is k(${nb}), where k is a constant. What is the value of k?`, o, a, spr: cB / lead,
        e: `For ax² + bx + c = 0, the sum of the solutions is −b/a. Here that's (${cA}a + ${cB}b)/${lead} = (${cB}/${lead})(${g}a + b). So k = ${k}.`,
        t: "Sum of roots = −b/a, product = c/a. No need to solve.", key: `vieta3:${lead},${cA},${cB}` };
    }
    const a0 = r.pick([1, 2, 3, 4, 5]), r1 = r.nz(-6, 6), r2 = r.nz(-6, 6);
    const b0 = -a0 * (r1 + r2), c0 = a0 * r1 * r2;
    const askSum = r.f() < 0.5;
    const right = askSum ? frac(-b0, a0) : frac(c0, a0);
    const { o, a } = mc(r, right, askSum ? [frac(b0, a0), frac(c0, a0), fmtN(-b0)] : [frac(-c0, a0), frac(-b0, a0), fmtN(c0)], String);
    return { d: "adv", sk: "Quadratic equations", q: `${poly([[a0, 2], [b0, 1], [c0, 0]])} = 0\n\nWhat is the ${askSum ? "sum" : "product"} of the solutions to the given equation?`, o, a, spr: askSum ? -b0 / a0 : c0 / a0,
      e: `For ax² + bx + c = 0, the sum of the solutions is −b/a and the product is c/a. Here a = ${a0}, b = ${fmtN(b0)}, c = ${fmtN(c0)}, so the ${askSum ? "sum is " + frac(-b0, a0) : "product is " + frac(c0, a0)}. (The solutions are ${fmtN(r1)} and ${fmtN(r2)}.)`,
      t: "Sum = −b/a, product = c/a. Desmos also works: graph it and read the x-intercepts.", key: `vieta:${a0},${r1},${r2},${askSum}` };
  };

  /* ---------- What a linear model means ---------- */
  G.alg_interp = (r, L) => {
    const t = r.int(0, 2);
    if (t === 0) {
      const w = r.int(12, 150), P0 = 2 * w;
      const { o, a } = mc(r, w, [2, P0, 2 * P0], fmtN);
      return { d: "alg", sk: "Linear models", q: `f(x) = 2x + ${P0}\n\nThe function f gives the perimeter, in centimeters, of a rectangle with a length of x centimeters and a fixed width. What is the width, in centimeters, of the rectangle?`, o, a, spr: w,
        e: `Perimeter = 2(length) + 2(width) = 2x + 2w. Matching 2x + ${P0}: 2w = ${P0}, so w = ${w}.`, t: "Match the formula term by term with the real-world formula.", key: `interp:p:${w}` };
    }
    if (t === 1) {
      const k = r.int(5, 90);
      const tbl = (vals) => vals.map(([x, y]) => `x = ${x}, f(x) = ${fmtN(y)}`).join("; ");
      const right = tbl([[0, k], [1, k], [2, k]]);
      const { o, a } = mc(r, right, [tbl([[0, 0], [1, k], [2, 2 * k]]), tbl([[0, 0], [1, 0], [2, 0]]), tbl([[0, k], [1, 0], [2, -k]])], String);
      return { d: "alg", sk: "Linear functions", q: `f(x) = ${k}\n\nFor the given function f, which choice gives three values of x and their corresponding values of f(x)?`, o, a,
        e: `f(x) = ${k} is a constant function: whatever x is, the output is ${k}. So every f(x) value is ${k}.`, t: "No x on the right side means the output never changes.", key: `interp:c:${k}` };
    }
    const fee = r.int(15, 80), rate = r.int(8, 45), unit = r.pick(["hour", "day", "month"]);
    const right = `The ${unit}ly charge is $${rate}.`.replace("dayly", "daily");
    const { o, a } = mc(r, right, [`The one-time fee is $${rate}.`, `The ${unit}ly charge is $${fee}.`.replace("dayly", "daily"), `The total cost for 1 ${unit} is $${rate}.`], String);
    return { d: "alg", sk: "Linear models", q: `C(x) = ${rate}x + ${fee}\n\nThe function C gives the total cost, in dollars, of renting a pressure washer for x ${unit}s. What is the best interpretation of ${rate} in this context?`, o, a,
      e: `In C(x) = ${rate}x + ${fee}, the coefficient of x (${rate}) is the cost added for each ${unit}; the constant (${fee}) is the one-time fee charged even at x = 0.`, t: "Coefficient of x = rate per unit. Constant = starting amount.", key: `interp:f:${rate},${fee},${unit}` };
  };

  MG.BY_DOMAIN.adv.push("adv_shift", "adv_vieta");
  MG.BY_DOMAIN.psda.push("psda_aroc");
  MG.BY_DOMAIN.alg.push("alg_interp");
  if (typeof module !== "undefined") module.exports = MG;
})(typeof window !== "undefined" ? window : globalThis);
