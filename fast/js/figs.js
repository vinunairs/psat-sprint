/* FAST Prep — shared helpers and inline SVG figures for math questions.
   Fractions in question text use [[n/d]] or [[w n/d]]; the app renders them stacked.
   Figure colors come from CSS tokens (--fa, --fb, --fc, --ink, --line) so dark mode works. */
(function (root) {
  "use strict";
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  let seq = 0;
  function rng(seed) {
    if (seed == null) seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) + (seq++) * 7919;
    const r = mulberry32(seed);
    const R = {
      f: r,
      int: (a, b) => a + Math.floor(r() * (b - a + 1)),
      pick: (arr) => arr[Math.floor(r() * arr.length)],
      chance: (p) => r() < p,
      shuffle: (arr) => { arr = arr.slice(); for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; },
      sample: (arr, n) => R.shuffle(arr).slice(0, n)
    };
    return R;
  }
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  const N = (n) => (Number.isInteger(n) ? n.toLocaleString("en-US") : String(n));
  const F = (n, d) => `[[${n}/${d}]]`;
  const M = (w, n, d) => (n === 0 ? String(w) : w === 0 ? F(n, d) : `[[${w} ${n}/${d}]]`);
  const mixed = (n, d) => M(Math.floor(n / d), n % d, d); // improper → mixed-number markup
  const simp = (n, d) => { const g = gcd(n, d); return [n / g, d / g]; };
  const money = (c) => "$" + (c / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const dec = (x, places) => (places == null ? String(+x.toFixed(4)) : x.toFixed(places));

  // Multiple choice: correct + distinct wrong answers (strings), shuffled. `fill` makes more wrongs if needed.
  function mc(R, correct, wrongs, fill, n = 4) {
    const seen = new Set([String(correct)]), out = [];
    for (const w of wrongs) { const s = String(w); if (out.length < n - 1 && !seen.has(s) && s !== "" && !/NaN|undefined|Infinity/.test(s)) { seen.add(s); out.push(s); } }
    let guard = 0;
    while (out.length < n - 1 && fill && guard++ < 200) { const s = String(fill()); if (!seen.has(s) && !/NaN|undefined|Infinity/.test(s)) { seen.add(s); out.push(s); } }
    const o = R.shuffle([String(correct), ...out]);
    return { o, a: o.indexOf(String(correct)) };
  }
  // Choose-two multiple choice: two correct among five options.
  function mc2(R, rights, wrongs) {
    const o = R.shuffle([...rights.slice(0, 2), ...wrongs.slice(0, 3)].map(String));
    return { o, a: [o.indexOf(String(rights[0])), o.indexOf(String(rights[1]))].sort((x, y) => x - y) };
  }

  /* ---------- SVG figures ---------- */
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const svg = (w, h, body, label) => `<svg class="fig" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label || "figure")}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
  const txt = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" font-size="${o.fs || 13}" ${o.b ? 'font-weight="700"' : ""} fill="${o.fill || "var(--ink)"}">${esc(s)}</text>`;
  const fracLabel = (x, y, n, d, fs = 12) => `${txt(x, y - 2, n, { fs })}<line x1="${x - 7}" y1="${y + 1}" x2="${x + 7}" y2="${y + 1}" stroke="var(--ink)" stroke-width="1.2"/>${txt(x, y + fs + 1, d, { fs })}`;

  // One or more fraction bars: bars = [{ parts, shaded, label?, color? }]
  function bars(list, label) {
    const W = 300, bh = 34, gap = 14, left = list.some((b) => b.label) ? 60 : 8;
    const H = list.length * (bh + gap) + 4;
    let body = "";
    list.forEach((b, i) => {
      const y = 4 + i * (bh + gap), w = (W - left - 8) / b.parts;
      for (let k = 0; k < b.parts; k++) {
        body += `<rect x="${left + k * w}" y="${y}" width="${w}" height="${bh}" fill="${k < b.shaded ? b.color || "var(--fa)" : "var(--fig-bg)"}" stroke="var(--ink)" stroke-width="1.5"/>`;
      }
      if (b.label) body += b.label.includes("/") ? fracLabel(left / 2, y + 13, ...b.label.split("/")) : txt(left / 2, y + 22, b.label, { fs: 13 });
    });
    return svg(W, H, body, label || "fraction bars");
  }
  // Number line from lo to hi, ticks every 1/den, whole numbers labeled, points [{v, label}]
  function numberLine(lo, hi, den, points = [], opts = {}) {
    const W = 340, H = opts.fracLabels ? 86 : 70, x0 = 20, x1 = W - 20, y = 34;
    const X = (v) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0);
    let body = `<line x1="${x0 - 8}" y1="${y}" x2="${x1 + 8}" y2="${y}" stroke="var(--ink)" stroke-width="2"/>`;
    body += `<path d="M${x0 - 12} ${y} l8 -5 v10z M${x1 + 12} ${y} l-8 -5 v10z" fill="var(--ink)"/>`;
    const steps = Math.round((hi - lo) * den);
    for (let k = 0; k <= steps; k++) {
      const v = lo + k / den, whole = Math.abs(v - Math.round(v)) < 1e-9, x = X(v);
      body += `<line x1="${x}" y1="${y - (whole ? 10 : 6)}" x2="${x}" y2="${y + (whole ? 10 : 6)}" stroke="var(--ink)" stroke-width="${whole ? 2 : 1.3}"/>`;
      if (whole) body += txt(x, y + 27, String(Math.round(v)), { fs: 14, b: true });
      else if (opts.fracLabels) { const n = Math.round((v - Math.floor(v)) * den) + Math.floor(v) * den; body += fracLabel(x, y + 24, n, den, 10); }
      else if (opts.decLabels) body += txt(x, y + 26, (+v.toFixed(2)).toString().replace(/^0/, "0"), { fs: 10 });
    }
    for (const p of points) {
      const x = X(p.v);
      body += `<circle cx="${x}" cy="${y}" r="6" fill="var(--fb)" stroke="var(--ink)" stroke-width="1.5"/>${txt(x, y - 14, p.label, { fs: 14, b: true })}`;
    }
    return svg(W, H, body, "number line");
  }
  // Angle with vertex at the bottom center; first ray points right, second ray at `deg` (counterclockwise).
  function angle(deg, opts = {}) {
    const W = 300, H = opts.protractor ? 175 : 150, cx = 150, cy = opts.protractor ? 150 : 125, r = opts.protractor ? 125 : 105;
    const rad = (d) => (d * Math.PI) / 180, P = (d, rr) => [cx + rr * Math.cos(rad(d + (opts.rot || 0))), cy - rr * Math.sin(rad(d + (opts.rot || 0)))];
    let body = "";
    if (opts.protractor) {
      body += `<path d="M${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} Z" fill="var(--fig-bg)" stroke="var(--line-strong)" stroke-width="1.5"/>`;
      for (let d = 0; d <= 180; d += 5) {
        const long = d % 10 === 0, [ax, ay] = P(d, r), [bx, by] = P(d, r - (long ? 12 : 6));
        body += `<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="var(--graphite)" stroke-width="${long ? 1.4 : .8}"/>`;
        if (d % 30 === 0) {
          const [ix, iy] = P(d, r - 24), [ox, oy] = P(d, r + 10);
          body += txt(ix, iy + 4, String(d), { fs: 10, fill: "var(--fig-c-ink)" }) + txt(ox, oy + 3, String(180 - d), { fs: 10, fill: "var(--graphite)" });
        }
      }
      body += `<circle cx="${cx}" cy="${cy}" r="3" fill="var(--graphite)"/>`;
    }
    const [ex, ey] = P(deg, r - (opts.protractor ? 4 : 0)), [sx, sy] = P(0, r - (opts.protractor ? 4 : 0));
    const ar = 26, large = deg > 180 ? 1 : 0, [a1x, a1y] = P(0, ar), [a2x, a2y] = P(deg, ar);
    body += `<path d="M${a1x} ${a1y} A ${ar} ${ar} 0 ${large} 0 ${a2x} ${a2y}" fill="none" stroke="var(--fa)" stroke-width="3"/>`;
    if (deg === 90 && !opts.noSquare) { const [q1x, q1y] = P(0, 16), [q2x, q2y] = P(45, 16 * Math.SQRT2), [q3x, q3y] = P(90, 16); body = body.replace(/<path d="M[^"]*" fill="none" stroke="var\(--fa\)" stroke-width="3"\/>$/, "") + `<path d="M${q1x} ${q1y} L${q2x} ${q2y} L${q3x} ${q3y}" fill="none" stroke="var(--fa)" stroke-width="2.5"/>`; }
    body += `<line x1="${cx}" y1="${cy}" x2="${sx}" y2="${sy}" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/>`;
    body += `<line x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/>`;
    if (opts.label) { const [lx, ly] = P(deg / 2, ar + 18); body += txt(lx, ly + 5, opts.label, { fs: 14, b: true }); }
    if (opts.points) { const [L1, V, L2] = opts.points, [px, py] = P(0, r + 2), [qx, qy] = P(deg, r + 14); body += txt(px + 10, py + 5, L1, { b: true }) + txt(cx, cy + 18, V, { b: true }) + txt(qx, qy, L2, { b: true }); }
    return svg(W, H, body, opts.protractor ? "angle on a protractor" : "angle");
  }
  // Angles around a point on a straight line or a right angle: parts = [{deg, label}]
  function angleParts(parts, opts = {}) {
    const W = 320, H = 170, cx = 160, cy = 140, r = 120;
    const rad = (d) => (d * Math.PI) / 180, P = (d, rr) => [cx + rr * Math.cos(rad(d)), cy - rr * Math.sin(rad(d))];
    let body = "", start = 0;
    const total = parts.reduce((s, p) => s + p.deg, 0);
    const colors = ["var(--fa)", "var(--fb)", "var(--fc)"];
    parts.forEach((p, i) => {
      const ar = 30 + i * 8, [x1, y1] = P(start, ar), [x2, y2] = P(start + p.deg, ar);
      body += `<path d="M${x1} ${y1} A ${ar} ${ar} 0 0 0 ${x2} ${y2}" fill="none" stroke="${colors[i % 3]}" stroke-width="3"/>`;
      const [lx, ly] = P(start + p.deg / 2, ar + 22); body += txt(lx, ly + 5, p.label, { fs: 14, b: true });
      start += p.deg;
    });
    const rays = [0]; let acc = 0; for (const p of parts) { acc += p.deg; rays.push(acc); }
    if (opts.straight) { const [lx, ly] = P(180, r); body += `<line x1="${cx}" y1="${cy}" x2="${lx}" y2="${ly}" stroke="var(--ink)" stroke-width="3"/>`; }
    for (const d of rays) { const [x, y] = P(d, r); body += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/>`; }
    if (opts.right) { const [q1x, q1y] = P(0, 12), [q2x, q2y] = P(45, 12 * Math.SQRT2), [q3x, q3y] = P(90, 12); body += `<path d="M${q1x} ${q1y} L${q2x} ${q2y} L${q3x} ${q3y}" fill="none" stroke="var(--ink)" stroke-width="1.5"/>`; }
    void total;
    return svg(W, H, body, "angles");
  }
  // Rectangle with side labels (scaled to fit). grid draws unit squares when small.
  function rect(w, h, top, side, opts = {}) {
    const maxW = 240, maxH = 130, s = Math.min(maxW / w, maxH / h, 40), rw = w * s, rh = h * s, x = (320 - rw) / 2, y = 14;
    let body = `<rect x="${x}" y="${y}" width="${rw}" height="${rh}" fill="var(--fb-soft)" stroke="var(--ink)" stroke-width="2.5"/>`;
    if (opts.grid) { for (let i = 1; i < w; i++) body += `<line x1="${x + i * s}" y1="${y}" x2="${x + i * s}" y2="${y + rh}" stroke="var(--ink)" stroke-opacity=".35"/>`; for (let j = 1; j < h; j++) body += `<line x1="${x}" y1="${y + j * s}" x2="${x + rw}" y2="${y + j * s}" stroke="var(--ink)" stroke-opacity=".35"/>`; }
    body += txt(x + rw / 2, y + rh + 20, top, { fs: 14, b: true });
    body += txt(x + rw + 8, y + rh / 2 + 5, side, { fs: 14, b: true, a: "start" });
    return svg(320, rh + 34, body, "rectangle");
  }
  // Line plot: values are numerators over `den`, from lo..hi (in numerator units)
  function linePlot(values, lo, hi, den, title) {
    const W = 340, x0 = 24, x1 = W - 24, counts = {};
    values.forEach((v) => (counts[v] = (counts[v] || 0) + 1));
    const maxC = Math.max(...Object.values(counts)), y = 22 + maxC * 18 + 8, H = y + 58;
    const X = (v) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0);
    let body = txt(W / 2, 14, title, { fs: 13, b: true });
    body += `<line x1="${x0 - 6}" y1="${y}" x2="${x1 + 6}" y2="${y}" stroke="var(--ink)" stroke-width="2"/>`;
    for (let v = lo; v <= hi; v++) {
      const x = X(v), w = Math.floor(v / den), r = v % den;
      body += `<line x1="${x}" y1="${y - 6}" x2="${x}" y2="${y + 6}" stroke="var(--ink)" stroke-width="1.5"/>`;
      if (r === 0) body += txt(x, y + 24, String(w), { fs: 13, b: true });
      else body += (w ? txt(x - 10, y + 27, String(w), { fs: 12, b: true }) : "") + fracLabel(x + (w ? 4 : 0), y + 19, r, den, 10);
      for (let k = 0; k < (counts[v] || 0); k++) body += txt(x, y - 10 - k * 18, "✕", { fs: 15, fill: "var(--fa-ink)" });
    }
    return svg(W, H, body, "line plot");
  }
  // Pair of lines for parallel / perpendicular / intersecting
  function lines(kind) {
    let body = "";
    const L = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/>`;
    if (kind === "parallel") body = L(40, 40, 260, 70) + L(40, 100, 260, 130);
    else if (kind === "perpendicular") body = L(60, 85, 260, 85) + L(160, 20, 160, 150) + `<path d="M160 73 h12 v12" fill="none" stroke="var(--ink)" stroke-width="1.5"/>`;
    else body = L(50, 30, 250, 140) + L(60, 130, 250, 40);
    return svg(300, 165, body, kind + " lines");
  }
  // Coordinate grid 0..n with points [{x, y, label}]
  function grid(n, points = []) {
    const W = 260, s = 210 / n, x0 = 34, y0 = 230;
    let body = "";
    for (let i = 0; i <= n; i++) {
      body += `<line x1="${x0 + i * s}" y1="${y0}" x2="${x0 + i * s}" y2="${y0 - n * s}" stroke="var(--line-strong)" stroke-width="1"/>`;
      body += `<line x1="${x0}" y1="${y0 - i * s}" x2="${x0 + n * s}" y2="${y0 - i * s}" stroke="var(--line-strong)" stroke-width="1"/>`;
      body += txt(x0 + i * s, y0 + 16, String(i), { fs: 11 }) + (i ? txt(x0 - 10, y0 - i * s + 4, String(i), { fs: 11 }) : "");
    }
    body += `<line x1="${x0}" y1="${y0}" x2="${x0 + n * s + 8}" y2="${y0}" stroke="var(--ink)" stroke-width="2"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y0 - n * s - 8}" stroke="var(--ink)" stroke-width="2"/>`;
    body += txt(x0 + n * s + 14, y0 + 4, "x", { fs: 13, b: true }) + txt(x0, y0 - n * s - 12, "y", { fs: 13, b: true });
    for (const p of points) body += `<circle cx="${x0 + p.x * s}" cy="${y0 - p.y * s}" r="5.5" fill="var(--fa)" stroke="var(--ink)" stroke-width="1.5"/>` + txt(x0 + p.x * s + 11, y0 - p.y * s - 8, p.label, { fs: 13, b: true });
    return svg(W + 20, 250, body, "coordinate grid");
  }
  // Rectangular prism with labeled edges
  function prism(l, w, h) {
    const s = Math.min(150 / (l + w * 0.5), 110 / (h + w * 0.5), 26), L = l * s, Wd = w * s * 0.5, Hh = h * s, x = 60, y = 30 + Wd;
    const p = (pts) => pts.map((q) => q.join(",")).join(" ");
    let body = `<polygon points="${p([[x, y], [x + L, y], [x + L, y + Hh], [x, y + Hh]])}" fill="var(--fb-soft)" stroke="var(--ink)" stroke-width="2"/>`;
    body += `<polygon points="${p([[x, y], [x + Wd, y - Wd], [x + L + Wd, y - Wd], [x + L, y]])}" fill="var(--fa-soft)" stroke="var(--ink)" stroke-width="2"/>`;
    body += `<polygon points="${p([[x + L, y], [x + L + Wd, y - Wd], [x + L + Wd, y + Hh - Wd], [x + L, y + Hh]])}" fill="var(--fc-soft)" stroke="var(--ink)" stroke-width="2"/>`;
    body += txt(x + L / 2, y + Hh + 20, l + " cm", { b: true }) + txt(x - 8, y + Hh / 2 + 5, h + " cm", { b: true, a: "end" }) + txt(x + L + Wd / 2 + 14, y + Hh - Wd / 2 + 4, w + " cm", { b: true, a: "start" });
    return svg(320, y + Hh + 30, body, "rectangular prism");
  }

  root.FASTFig = { rng, gcd, N, F, M, mixed, simp, money, dec, mc, mc2, bars, numberLine, angle, angleParts, rect, linePlot, lines, grid, prism };
})(typeof window !== "undefined" ? window : globalThis);
