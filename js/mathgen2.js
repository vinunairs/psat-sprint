/* Test Prep Hub — math question types that need a drawn graph or were missing from the first set.
   Adds to MathGen: scatterplots with a line of best fit, frequency bar charts, sampling and
   margin of error, graphs of lines and parabolas, line–parabola systems, radians,
   and special right triangles.
   Chart spec (rendered by app.js): { type: "scatter" | "bar" | "graph", x: {label, min, max, step},
   y: {label, min, max, step}, points: [[x,y]], lines: [{m,b}], curves: [[[x,y],...]], bars: [[label,value]] } */
(function (root) {
  const C = root.PSCore || (typeof require !== "undefined" ? require("./core.js") : null);
  const MG = root.MathGen || (typeof require !== "undefined" ? require("./mathgen.js") : null);
  const { fmtN, frac, poly, lin, xMinus, mc, MINUS } = C;
  const M = MINUS;
  const G = MG.G;

  /* ---------- Scatterplot with a line of best fit ---------- */
  const SCATTER = [
    { x: "Hours studied", y: "Test score", xq: "a student studies", xu: "hours", yq: "test score", xs: [1, 2, 3, 4, 5, 6, 7, 8, 9], ms: [4, 5, 6], bs: [40, 45, 50], noise: 4, per: "hour studied", unitY: "points", xmax: 10, ystep: 10 },
    { x: "Temperature (°F)", y: "Cups of lemonade sold", xq: "the temperature is", xu: "°F", yq: "number of cups of lemonade sold", xs: [60, 65, 70, 75, 80, 85, 90, 95], ms: [2, 3], bs: [-100, -80, -60], noise: 8, per: "degree Fahrenheit", unitY: "cups", xmin: 55, xmax: 100, xstep: 5, ystep: 20 },
    { x: "Age of car (years)", y: "Value (thousands of dollars)", xq: "a car is", xu: "years old", yq: "value of the car, in thousands of dollars,", xs: [1, 2, 3, 4, 5, 6, 7, 8, 9], ms: [-2, -3], bs: [30, 32, 34], noise: 2, per: "year of age", unitY: "thousand dollars", xmax: 10, ystep: 5 },
    { x: "Minutes of practice per day", y: "Free throws made (out of 50)", xq: "a player practices", xu: "minutes per day", yq: "number of free throws made", xs: [5, 10, 15, 20, 25, 30, 35, 40], ms: [1], bs: [5, 8, 10], noise: 3, per: "minute of daily practice", unitY: "free throws", xmax: 45, xstep: 5, ystep: 10 }
  ];
  G.psda_scatter = (r, L) => {
    const c = r.pick(SCATTER), m = r.pick(c.ms), b = r.pick(c.bs);
    const xs = r.sample(c.xs, Math.min(c.xs.length, 8)).sort((p, q) => p - q);
    const pts = xs.map((x) => { let n; do { n = r.int(-c.noise, c.noise); } while (Math.abs(n) < Math.max(1, c.noise / 3)); return [x, m * x + b + n]; });
    const ysAll = pts.map((p) => p[1]).concat(xs.map((x) => m * x + b));
    const ymin = Math.max(0, Math.floor((Math.min(...ysAll) - c.ystep) / c.ystep) * c.ystep), ymax = Math.ceil((Math.max(...ysAll) + c.ystep / 2) / c.ystep) * c.ystep;
    const chart = { type: "scatter", x: { label: c.x, min: c.xmin || 0, max: c.xmax, step: c.xstep || 1 }, y: { label: c.y, min: ymin, max: ymax, step: c.ystep }, points: pts, lines: [{ m, b }] };
    const intro = `The scatterplot shows the relationship between ${c.x.toLowerCase()} and ${c.y.toLowerCase()} for ${pts.length} data points, along with a line of best fit, y = ${lin(m, b)}.`;
    if (L === 1) {
      const cand = c.xs.filter((x) => !xs.includes(x) && m * x + b >= ymin && m * x + b <= ymax);
      const x0 = cand.length ? r.pick(cand) : r.pick(xs);
      const ans = m * x0 + b;
      const { o, a } = mc(r, ans, [m * x0, ans + c.noise, ans - c.noise, b], fmtN);
      return { d: "psda", sk: "Scatterplots", chart, p: intro, q: `Based on the line of best fit, what is the predicted ${c.yq} when ${c.xq} ${x0}${c.xu === "°F" ? "°F" : " " + c.xu}?`, o, a, spr: ans,
        e: `Substitute into the line of best fit: y = ${fmtN(m)}(${x0}) + ${fmtN(b)} = ${fmtN(ans)}.`, t: "\"Predicted\" means use the line, not the nearest dot.", key: `sc1:${c.x}:${m}:${b}:${x0}` };
    }
    if (L === 2) {
      const up = m > 0, abs = Math.abs(m);
      const right = `Each additional ${c.per} is associated with ${up ? "an increase" : "a decrease"} of about ${abs} ${c.unitY}.`;
      const { o, a } = mc(r, right, [`Each additional ${abs} ${c.per.split(" ")[0]}${abs === 1 ? "" : "s"} is associated with ${up ? "an increase" : "a decrease"} of about 1 ${c.unitY.replace(/s$/, "")}.`, `When ${c.x.toLowerCase()} is 0, the predicted value is ${abs}.`, `Every data point ${up ? "increases" : "decreases"} by exactly ${abs} ${c.unitY}.`], String);
      return { d: "psda", sk: "Scatterplots", chart, p: intro, q: `Which choice is the best interpretation of the slope of the line of best fit in this context?`, o, a,
        e: `The slope ${fmtN(m)} is the predicted change in y for each 1-unit increase in x. It's an average trend, not an exact rule for every point.`, t: "Slope = change in y per 1 unit of x. The intercept is the value at x = 0.", key: `sc2:${c.x}:${m}:${b}` };
    }
    const above = pts.filter(([x, y]) => y > m * x + b).length;
    const { o, a } = mc(r, above, [pts.length - above, above + 1, above - 1], fmtN);
    return { d: "psda", sk: "Scatterplots", chart, p: intro, q: `How many of the data points shown lie above the line of best fit?`, o, a, spr: above,
      e: `Count the dots that sit higher than the line at their x-value: ${above}. The other ${pts.length - above} are below it.`, t: "Read graphs carefully: check each point against the line directly above or below it.", key: `sc3:${pts.join(";")}` };
  };

  /* ---------- Frequency bar chart ---------- */
  const FREQ = [
    { x: "Number of books read this summer", who: "students" },
    { x: "Number of pets", who: "households" },
    { x: "Number of siblings", who: "students" },
    { x: "Goals scored per game", who: "games" }
  ];
  G.psda_freq = (r, L) => {
    const f = r.pick(FREQ), vals = [0, 1, 2, 3, 4, 5], counts = vals.map(() => r.int(1, 8));
    const total = counts.reduce((s, v) => s + v, 0), list = vals.flatMap((v, i) => Array(counts[i]).fill(v));
    const chart = { type: "bar", x: { label: f.x }, y: { label: "Frequency", min: 0, max: Math.max(...counts) + 1, step: 1 }, bars: vals.map((v, i) => [String(v), counts[i]]) };
    const intro = `The bar graph shows the distribution of ${f.x.toLowerCase()} for ${total} ${f.who}.`;
    if (L === 1) {
      const k = r.int(2, 4), ans = counts.slice(k).reduce((s, v) => s + v, 0);
      const { o, a } = mc(r, ans, [counts[k], total - ans, counts.slice(k + 1).reduce((s, v) => s + v, 0)], fmtN);
      return { d: "psda", sk: "Data displays", chart, p: intro, q: `How many ${f.who} had a value of at least ${k}?`, o, a, spr: ans,
        e: `"At least ${k}" includes ${k} itself: ${vals.slice(k).map((v, i) => counts[k + i]).join(" + ")} = ${ans}.`, t: "\"At least\" includes the number; \"more than\" doesn't.", key: `fq1:${counts}:${k}` };
    }
    const n = list.length;
    const med = n % 2 ? list[(n - 1) / 2] : (list[n / 2 - 1] + list[n / 2]) / 2;
    const mean = Math.round((list.reduce((s, v) => s + v, 0) / n) * 10) / 10;
    if (L === 2) {
      const modeV = vals[counts.indexOf(Math.max(...counts))];
      const { o, a } = mc(r, med, [mean, modeV, 2.5, Math.max(...counts)], fmtN);
      return { d: "psda", sk: "Data displays", chart, p: intro, q: `What is the median of the data shown?`, o, a, spr: med,
        e: `There are ${n} values. ${n % 2 ? `The median is value number ${(n + 1) / 2} in order` : `The median is the average of values ${n / 2} and ${n / 2 + 1} in order`}. Counting up the bars from 0 gives ${fmtN(med)}.`,
        t: "With a frequency chart, the median is a data value (the x-axis), not a bar height.", key: `fq2:${counts}` };
    }
    const { o, a } = mc(r, mean, [med, Math.round((total / 6) * 10) / 10, Math.round(((0 + 5) / 2) * 10) / 10, Math.round((mean + 0.5) * 10) / 10], (v) => v.toFixed(1));
    return { d: "psda", sk: "Data displays", chart, p: intro, q: `To the nearest tenth, what is the mean of the data shown?`, o, a,
      e: `Mean = (sum of value × frequency) ÷ total = ${list.reduce((s, v) => s + v, 0)} ÷ ${n} ≈ ${mean.toFixed(1)}.`, t: "Multiply each value by its bar height, add them, then divide by the total count.", key: `fq3:${counts}` };
  };

  /* ---------- Sampling and margin of error ---------- */
  const POPS = [["students at a large high school", "support a later school start time"], ["residents of a city", "use public transit at least once a week"], ["voters in a county", "favor building a new library"], ["customers of a streaming service", "watch at least one documentary a month"]];
  G.psda_sample = (r, L) => {
    const [pop, what] = r.pick(POPS);
    if (L <= 2) {
      const p = r.int(38, 72), moe = r.int(2, 5), N = r.pick([400, 500, 600, 800, 1000, 1200]);
      const right = `It is plausible that between ${p - moe}% and ${p + moe}% of all ${pop} ${what}.`;
      const { o, a } = mc(r, right, [`Exactly ${p}% of all ${pop} ${what}.`, `More than ${p + moe}% of all ${pop} ${what}.`, `The survey results cannot be used to estimate anything about all ${pop}.`], String);
      return { d: "psda", sk: "Sampling and inference", p: `A random sample of ${N} ${pop} was surveyed. Of those surveyed, ${p}% said they ${what}. The margin of error for this estimate is ${moe}%.`,
        q: "Which conclusion is most appropriate based on the survey?", o, a,
        e: `A margin of error of ${moe}% gives a plausible range of ${p} ± ${moe}, or ${p - moe}% to ${p + moe}%, for the whole population. The sample percentage is an estimate, not an exact value.`,
        t: "Margin of error → plausible range: estimate minus MOE to estimate plus MOE.", key: `smp1:${p}:${moe}:${pop}` };
    }
    if (r.f() < 0.5) {
      const club = r.pick(["robotics club", "soccer team", "chess club", "school band"]);
      const right = `No, because the sample was not chosen at random from all students at the school.`;
      const { o, a } = mc(r, right, ["Yes, because 150 students is a large sample.", "Yes, because a majority of the students gave the same answer.", "No, because a sample must include at least 1,000 people."], String);
      return { d: "psda", sk: "Sampling and inference", p: `To learn how students at her school spend their free time, a student surveyed all 150 members of the ${club}. Most said their favorite activity was the one their club focuses on.`,
        q: "Can the results be generalized to all students at the school?", o, a,
        e: `Club members aren't representative of the whole school, so the sample is biased. The problem is how the sample was chosen, not its size.`, t: "To generalize to a population, the sample must be selected at random from that population.", key: `smp2:${club}` };
    }
    const right = "The margin of error would likely be smaller.";
    const { o, a } = mc(r, right, ["The margin of error would likely be larger.", "The margin of error would stay exactly the same.", "The sample percentage would have to increase."], String);
    return { d: "psda", sk: "Sampling and inference", p: `A researcher surveyed a random sample of 300 ${pop} and reported an estimate with a margin of error of 6%. She plans to repeat the survey with a random sample of 1,200 ${pop} chosen the same way.`,
      q: "Compared with the first survey, what is most likely true of the second survey?", o, a,
      e: "Larger random samples give more precise estimates, so the margin of error tends to shrink.", t: "Bigger random sample → smaller margin of error.", key: `smp3:${pop}` };
  };

  /* ---------- Graph of a line ---------- */
  G.alg_graphline = (r, L) => {
    const slopes = L === 1 ? [[1, 1], [2, 1], [-1, 1], [-2, 1], [3, 1]] : [[1, 2], [-1, 2], [2, 3], [-2, 3], [3, 2], [-3, 2], [2, 1], [-3, 1]];
    const [n, d] = r.pick(slopes), b = r.int(-4, 4);
    if (Math.abs(b + n) > 5) throw { retry: true };
    const m = n / d, mTxt = frac(n, d);
    const chart = { type: "graph", x: { label: "x", min: -6, max: 6, step: 1 }, y: { label: "y", min: -6, max: 6, step: 1 }, lines: [{ m, b }], points: [[0, b], [d, b + n]] };
    const eq = (mt, bb) => `y = ${mt === "1" ? "" : mt === M + "1" ? M : mt.includes("/") ? "(" + mt + ")" : mt}x${bb === 0 ? "" : bb > 0 ? " + " + bb : " " + M + " " + Math.abs(bb)}`;
    if (L === 3) {
      const { o, a } = mc(r, mTxt, [frac(d, n), frac(-n, d), frac(-d, n)], String);
      return { d: "alg", sk: "Linear functions", chart, q: "The graph of the linear function shown passes through the marked points. What is the slope of the line?", o, a,
        e: `From (0, ${fmtN(b)}) to (${d}, ${fmtN(b + n)}): rise ${fmtN(n)} over run ${d}, so the slope is ${mTxt}.`, t: "Slope = rise ÷ run. Pick two points exactly on grid corners.", key: `gl3:${n},${d},${b}` };
    }
    const { o, a } = mc(r, eq(mTxt, b), [eq(frac(d, n), b), eq(frac(-n, d), b), eq(mTxt, -b === b ? b + 1 : -b)], String);
    return { d: "alg", sk: "Linear functions", chart, q: "Which equation defines the line shown in the graph?", o, a,
      e: `The line crosses the y-axis at ${fmtN(b)}, so b = ${fmtN(b)}. It rises ${fmtN(n)} for every ${d} to the right, so m = ${mTxt}.`, t: "Read the y-intercept first; it eliminates choices fast.", key: `gl:${n},${d},${b}` };
  };

  /* ---------- Graph of a parabola ---------- */
  G.adv_graph = (r, L) => {
    const h = r.int(-3, 3), k = r.int(-4, 4), A = r.pick([1, -1]);
    const f = (x) => A * (x - h) * (x - h) + k;
    const pts = []; for (let x = -7; x <= 7.001; x += 0.25) pts.push([x, f(x)]);
    const chart = { type: "graph", x: { label: "x", min: -7, max: 7, step: 1 }, y: { label: "y", min: -8, max: 8, step: 1 }, curves: [pts], points: [[h, k]] };
    const eq = (aa, hh, kk) => `y = ${aa === -1 ? M : ""}(${xMinus(hh)})²${kk === 0 ? "" : kk > 0 ? " + " + kk : " " + M + " " + Math.abs(kk)}`;
    if (L === 3) {
      const ans = f(0);
      const { o, a } = mc(r, ans, [k, h, -ans, A * h * h], fmtN);
      return { d: "adv", sk: "Quadratic functions", chart, q: "The graph of y = f(x) is shown, with its vertex marked. What is the y-coordinate of the y-intercept of the graph?", o, a, spr: ans,
        e: `The vertex is (${fmtN(h)}, ${fmtN(k)}) and the parabola opens ${A > 0 ? "up" : "down"}, so f(x) = ${eq(A, h, k).slice(4)}. Then f(0) = ${A === -1 ? M : ""}(${fmtN(-h)})² + ${fmtN(k)} = ${fmtN(ans)}.`, t: "Write the vertex form from the graph, then substitute x = 0.", key: `pg3:${h},${k},${A}` };
    }
    const { o, a } = mc(r, eq(A, h, k), [eq(A, -h, k), eq(A, h, -k), eq(-A, h, k), eq(A, -h, -k)], String);
    return { d: "adv", sk: "Quadratic functions", chart, q: "Which equation could define the parabola shown, whose vertex is marked?", o, a,
      e: `The vertex is (${fmtN(h)}, ${fmtN(k)}), which gives y = a(${xMinus(h)})²${k === 0 ? "" : k > 0 ? " + " + k : " " + M + " " + Math.abs(k)}. The parabola opens ${A > 0 ? "up, so a is positive" : "down, so a is negative"}.`, t: "Vertex (h, k) → (x − h)². Opening down → negative a.", key: `pg:${h},${k},${A}` };
  };

  /* ---------- System of a line and a parabola ---------- */
  G.adv_linquad = (r, L) => {
    let s1, s2; do { s1 = r.int(-5, 6); s2 = r.int(-5, 6); } while (s1 === s2);
    const m = r.nz(-3, 3), d = r.int(-6, 6), B = m - (s1 + s2), Cc = d + s1 * s2;
    const sys = `y = ${poly([[1, 2], [B, 1], [Cc, 0]])}\ny = ${lin(m, d)}`;
    const big = Math.max(s1, s2), ySum = m * (s1 + s2) + 2 * d;
    if (L === 3) {
      const { o, a } = mc(r, ySum, [s1 + s2, m * (s1 + s2) + d, -ySum, s1 * s2], fmtN);
      return { d: "adv", sk: "Nonlinear systems", q: `${sys}\n\nThe graphs of the equations above intersect at the points (x₁, y₁) and (x₂, y₂). What is the value of y₁ + y₂?`, o, a, spr: ySum,
        e: `Set the right sides equal: ${poly([[1, 2], [B - m, 1], [Cc - d, 0]])} = 0, which factors as (${xMinus(s1)})(${xMinus(s2)}) = 0. So x = ${fmtN(s1)} or ${fmtN(s2)}, giving y = ${fmtN(m * s1 + d)} and ${fmtN(m * s2 + d)}. Their sum is ${fmtN(ySum)}.`,
        t: "Desmos: graph both equations and click the two intersection points.", key: `lq3:${B},${Cc},${m},${d}` };
    }
    const { o, a } = mc(r, big, [Math.min(s1, s2), -big, s1 + s2, m * big + d], fmtN);
    return { d: "adv", sk: "Nonlinear systems", q: `${sys}\n\nIf (x, y) is a solution to the system of equations above, what is the greatest possible value of x?`, o, a, spr: big,
      e: `Set the right sides equal and move everything to one side: ${poly([[1, 2], [B - m, 1], [Cc - d, 0]])} = 0. Factor: (${xMinus(s1)})(${xMinus(s2)}) = 0, so x = ${fmtN(s1)} or x = ${fmtN(s2)}. The greater is ${fmtN(big)}.`,
      t: "Desmos: graph both and read the intersection farther to the right.", key: `lq:${B},${Cc},${m},${d}` };
  };

  /* ---------- Radians ---------- */
  const piFrac = (n, d) => {
    const f = frac(n, d);
    if (f === "1") return "π";
    if (f === M + "1") return M + "π";
    if (!f.includes("/")) return f + "π";
    const [num, den] = f.split("/");
    return (num === "1" ? "" : num === M + "1" ? M : num) + "π/" + den;
  };
  G.geo_radians = (r, L) => {
    const deg = r.pick([30, 45, 60, 90, 120, 135, 150, 210, 225, 240, 270, 300, 315, 330]);
    if (L === 1) {
      const right = piFrac(deg, 180);
      const { o, a } = mc(r, right, [piFrac(180, deg), piFrac(deg, 360), piFrac(deg, 90), piFrac(2 * deg, 180)], String);
      return { d: "geo", sk: "Radians", q: `What is the measure of an angle of ${deg}° in radians?`, o, a,
        e: `Multiply by π/180: ${deg} × π/180 = ${right}.`, t: "180° = π radians.", key: `rad1:${deg}` };
    }
    if (L === 2) {
      const { o, a } = mc(r, deg, [deg / 2, 180 - deg === 0 ? 45 : Math.abs(180 - deg), deg * 2], (v) => fmtN(v) + "°");
      return { d: "geo", sk: "Radians", q: `An angle measures ${piFrac(deg, 180)} radians. What is its measure in degrees?`, o, a, spr: deg,
        e: `Multiply by 180/π: (${piFrac(deg, 180)}) × 180/π = ${deg}°.`, t: "Replace π with 180° and simplify.", key: `rad2:${deg}` };
    }
    const R = r.int(2, 12), ang = r.pick([[1, 6], [1, 4], [1, 3], [1, 2], [2, 3], [3, 4], [5, 6]]);
    const right = piFrac(R * ang[0], ang[1]);
    const { o, a } = mc(r, right, [piFrac(R * R * ang[0], ang[1]), piFrac(ang[0], R * ang[1]), piFrac(2 * R * ang[0], ang[1])], String);
    return { d: "geo", sk: "Radians", q: `A circle has a radius of ${R} centimeters. What is the length, in centimeters, of an arc with a central angle of ${piFrac(ang[0], ang[1])} radians?`, o, a,
      e: `With the angle in radians, arc length = radius × angle = ${R} × ${piFrac(ang[0], ang[1])} = ${right}.`, t: "In radians, arc length s = rθ. No 360 needed.", key: `rad3:${R}:${ang}` };
  };

  /* ---------- Special right triangles ---------- */
  G.geo_special = (r, L) => {
    const s = r.int(2, 9);
    if (r.f() < 0.5) {
      const ask = L === 1 ? "short" : "long";
      const right = ask === "short" ? fmtN(s) : s + "√3";
      const { o, a } = mc(r, right, [ask === "short" ? s + "√3" : fmtN(s), s + "√2", fmtN(2 * s), (2 * s) + "√3"], String);
      return { d: "geo", sk: "Right triangles", q: `In a 30°-60°-90° triangle, the hypotenuse has length ${2 * s}. What is the length of the side opposite the ${ask === "short" ? "30°" : "60°"} angle?`, o, a, spr: ask === "short" ? s : undefined,
        e: `The sides of a 30°-60°-90° triangle are x, x√3, and 2x. The hypotenuse 2x = ${2 * s}, so x = ${s}. The side opposite ${ask === "short" ? "30° is x = " + s : "60° is x√3 = " + s + "√3"}.`, t: "30-60-90: x, x√3, 2x. It's on the reference sheet.", key: `sp1:${s}:${ask}` };
    }
    const right = s + "√2";
    const { o, a } = mc(r, right, [fmtN(2 * s), s + "√3", fmtN(s)], String);
    return { d: "geo", sk: "Right triangles", q: `An isosceles right triangle has legs of length ${s}. What is the length of its hypotenuse?`, o, a,
      e: `An isosceles right triangle is a 45°-45°-90° triangle with sides x, x, and x√2. The hypotenuse is ${s}√2.`, t: "45-45-90: x, x, x√2.", key: `sp2:${s}` };
  };

  MG.BY_DOMAIN.psda.push("psda_scatter", "psda_freq", "psda_sample");
  MG.BY_DOMAIN.alg.push("alg_graphline");
  MG.BY_DOMAIN.adv.push("adv_graph", "adv_linquad");
  MG.BY_DOMAIN.geo.push("geo_radians", "geo_special");
  if (typeof module !== "undefined") module.exports = MG;
})(typeof window !== "undefined" ? window : globalThis);
