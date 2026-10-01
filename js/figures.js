/* Test Prep Hub — geometry and trig figures.
   Question generators attach plain data (q.fig for the question, q.efig for the explanation);
   Figures.svg(spec) turns it into an inline SVG. Colors come from CSS classes so they follow the theme:
   fg-a / fg-b / fg-c are the three highlight colors, fg-dim is a faded line, fg-ink is normal ink. */
(function (root) {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const R2D = 180 / Math.PI;
  const pt = (cx, cy, r, deg) => [cx + r * Math.cos(deg / R2D), cy - r * Math.sin(deg / R2D)]; // math angle, SVG y-down
  const line = (a, b, cls, w) => `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" class="${cls || "fg-ink"}" stroke-width="${w || 2.5}" stroke-linecap="round"/>`;
  const text = (p, s, cls, anchor, size) => `<text x="${p[0].toFixed(1)}" y="${p[1].toFixed(1)}" class="${cls || "fg-t"}" text-anchor="${anchor || "middle"}" dominant-baseline="middle" font-size="${size || 14}">${esc(s)}</text>`;
  const dot = (p, cls) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.5" class="${cls || "fg-fill"}"/>`;
  // Arc for the angle from math-angle a0 to a1 (counterclockwise), optionally filled as a wedge.
  function arc(c, r, a0, a1, cls, wedge) {
    const p0 = pt(c[0], c[1], r, a0), p1 = pt(c[0], c[1], r, a1), large = ((a1 - a0 + 360) % 360) > 180 ? 1 : 0;
    const d = `M${p0[0].toFixed(1)},${p0[1].toFixed(1)} A${r},${r} 0 ${large} 0 ${p1[0].toFixed(1)},${p1[1].toFixed(1)}`;
    return wedge ? `<path d="M${c[0]},${c[1]} L${p0[0].toFixed(1)},${p0[1].toFixed(1)} A${r},${r} 0 ${large} 0 ${p1[0].toFixed(1)},${p1[1].toFixed(1)} Z" class="${cls}-wedge"/>` + `<path d="${d}" class="${cls}" fill="none" stroke-width="2.5"/>`
      : `<path d="${d}" class="${cls || "fg-ink"}" fill="none" stroke-width="2"/>`;
  }
  const ang = (a, b) => Math.atan2(-(b[1] - a[1]), b[0] - a[0]) * R2D; // math angle of the ray a→b
  const norm = (d) => ((d % 360) + 360) % 360;
  // Label beside a segment, pushed away from the point `away`.
  function sideLabel(a, b, away, s, cls, gap) {
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
    if ((away[0] - m[0]) * nx + (away[1] - m[1]) * ny > 0) { nx = -nx; ny = -ny; }
    // Push the label far enough that its box clears the line: half its width along x, half its height along y.
    const w = String(s).length * 8, off = (w / 2) * Math.abs(nx) + 8 * Math.abs(ny) + (gap ? gap - 10 : 6);
    return text([m[0] + nx * off, m[1] + ny * off], s, cls ? cls.replace("fg-", "fg-t") : "fg-t");
  }
  // Angle mark at vertex v between rays to p and q (the smaller angle), with a label.
  function angleMark(v, p, q, label, cls, r) {
    let a0 = norm(ang(v, p)), a1 = norm(ang(v, q));
    if (norm(a1 - a0) > 180) [a0, a1] = [a1, a0];
    const rr = r || 24, mid = a0 + norm(a1 - a0) / 2;
    return arc(v, rr, a0, a1, cls || "fg-ink", !!cls) + (label ? text(pt(v[0], v[1], rr + 14 + String(label).length * 2.2, mid), label, cls ? cls.replace("fg-", "fg-t") : "fg-t", "middle", 13) : "");
  }
  const rightMark = (v, p, q) => { // small square at a right angle
    const u = (a) => { const dx = a[0] - v[0], dy = a[1] - v[1], L = Math.hypot(dx, dy); return [dx / L * 13, dy / L * 13]; };
    const a = u(p), b = u(q);
    return `<path d="M${v[0] + a[0]},${v[1] + a[1]} L${v[0] + a[0] + b[0]},${v[1] + a[1] + b[1]} L${v[0] + b[0]},${v[1] + b[1]}" class="fg-ink" fill="none" stroke-width="1.6"/>`;
  };
  const tick = (a, b, n) => { // equal-length tick marks
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
    let s = ""; for (let i = 0; i < (n || 1); i++) { const o = (i - ((n || 1) - 1) / 2) * 6, c = [m[0] + ux * o, m[1] + uy * o]; s += line([c[0] - uy * 7, c[1] + ux * 7], [c[0] + uy * 7, c[1] - ux * 7], "fg-ink", 1.8); }
    return s;
  };
  const wrap = (w, h, body, title, note) => `<svg viewBox="0 0 ${w} ${h + (note ? 18 : 0)}" class="fig-svg" role="img" aria-label="${esc(title)}">${body}${note ? text([w / 2, h + 8], note, "fg-tnote", "middle", 11.5) : ""}</svg>`;

  /* Right triangle: A bottom-left, C bottom-right (right angle), B top-right.
     adj = AC, opp = BC (lengths set the shape); lab/col/dim keyed by a (AC), o (BC), h (AB). */
  function rtri(f) {
    const s = Math.min(230 / f.adj, 140 / f.opp), A = [40, 180], C = [40 + f.adj * s, 180], B = [C[0], 180 - f.opp * s], G = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3];
    const col = f.col || {}, lab = f.lab || {}, dim = f.dim || [];
    const sc = (k) => (dim.includes(k) ? "fg-dim" : col[k] || "fg-ink"), sw = (k) => (col[k] ? 4 : 2.5);
    let b = line(A, C, sc("a"), sw("a")) + line(C, B, sc("o"), sw("o")) + line(A, B, sc("h"), sw("h")) + rightMark(C, A, B);
    if (f.angA) b += angleMark(A, C, B, f.angA === true ? "" : f.angA, f.angCls, 28);
    if (f.angB) b += angleMark(B, A, C, f.angB === true ? "" : f.angB, f.angBCls, 24);
    const nm = f.names || ["A", "B", "C"];
    b += text([A[0] - 14, A[1] + 4], nm[0], "fg-tv") + text([B[0] + 14, B[1] - 4], nm[1], "fg-tv") + text([C[0] + 14, C[1] + 6], nm[2], "fg-tv");
    if (lab.a != null) b += sideLabel(A, C, G, lab.a, col.a, 15);
    if (lab.o != null) b += sideLabel(C, B, G, lab.o, col.o, 18);
    if (lab.h != null) b += sideLabel(A, B, G, lab.h, col.h, 16);
    const w = Math.max(320, C[0] + 120);
    return wrap(w, 205, b, f.title || "Right triangle", f.note);
  }

  /* Two parallel lines cut by a transversal. at: [[line 1|2, "ur"|"ul"|"ll"|"lr", label, cls], ...] */
  function parallel(f) {
    const y1 = 60, y2 = 150, th = Math.max(28, Math.min(152, f.th || 56)), P1 = [215, y1], P2 = [P1[0] - (y2 - y1) / Math.tan(th / R2D), y2];
    const top = pt(P1[0], P1[1], 50, th), bot = pt(P2[0], P2[1], 50, 180 + th);
    let b = line([20, y1], [370, y1], "fg-ink", 2.5) + line([20, y2], [370, y2], "fg-ink", 2.5) + line(bot, top, "fg-ink", 2.5);
    b += text([380, y1], "ℓ", "fg-tv", "start") + text([380, y2], "m", "fg-tv", "start");
    const span = { ur: [0, th], ul: [th, 180], ll: [180, 180 + th], lr: [180 + th, 360] };
    for (const [ln, pos, label, cls] of f.at) {
      const c = ln === 1 ? P1 : P2, [a0, a1] = span[pos], mid = (a0 + a1) / 2, rr = 22;
      b += arc(c, rr, a0, a1, cls || "fg-a", true);
      // Labels sit beside the angle, just above or below the parallel line, clear of the slanted line.
      const right = pos === "ur" || pos === "lr", up = pos === "ur" || pos === "ul", w = String(label).length * 7.6;
      const lp = [c[0] + (right ? 1 : -1) * (34 + w / 2), c[1] + (up ? -13 : 15)];
      b += text(lp, label, (cls || "fg-a").replace("fg-", "fg-t"), "middle", 13);
    }
    return wrap(400, 205, b, "Parallel lines cut by a transversal", f.note);
  }

  /* Triangle with angle labels. Q bottom-left, R bottom-right, P top. ext: extend QR past R to S. */
  function tri(f) {
    let Q = [50, 170], R = [230, 170], P = [f.apex || 120, 40];
    if (f.deg) { // draw to scale from the angles [P, Q, R] using the law of sines, then fit the box
      const [dp, dq, dr] = f.deg.map((d) => d / R2D), qp = Math.sin(dr) / Math.sin(dp);
      const raw = [[0, 0], [1, 0], [qp * Math.cos(dq), -qp * Math.sin(dq)]]; // Q, R, P with base 1
      const xs = raw.map((p) => p[0]), minx = Math.min(...xs), wid = Math.max(...xs) - minx, hgt = -raw[2][1];
      const sc = Math.min(230 / wid, 135 / hgt), ox = 50 - minx * sc;
      [Q, R, P] = raw.map((p) => [ox + p[0] * sc, 170 + p[1] * sc]);
    }
    let b = line(Q, R) + line(R, P) + line(P, Q);
    const nm = f.names || ["P", "Q", "R"], L = f.lab || {}, C = f.col || {};
    if (f.ext) { const S = [R[0] + 80, 170]; b += line(R, S, "fg-ink", 2.5) + text([S[0] + 12, S[1] + 4], f.extName || "S", "fg-tv"); b += angleMark(R, S, P, L.x, C.x || "fg-c", 26); }
    if (L.P != null) b += angleMark(P, Q, R, L.P, C.P || "fg-a", 22);
    if (L.Q != null) b += angleMark(Q, R, P, L.Q, C.Q || "fg-b", 26);
    if (L.R != null) b += angleMark(R, P, Q, L.R, C.R || "fg-c", 24);
    if (f.ticks) b += tick(P, Q, 1) + tick(P, R, 1);
    b += text([P[0], P[1] - 14], nm[0], "fg-tv") + text([Q[0] - 14, Q[1] + 6], nm[1], "fg-tv") + text([R[0] + (f.ext ? 2 : 14), R[1] + 18], nm[2], "fg-tv");
    return wrap(Math.max(f.ext ? 350 : 290, (f.ext ? R[0] + 110 : R[0] + 40)), 200, b, "Triangle", f.note);
  }

  /* Angles on a straight line (total 180) or in a right angle (total 90), split by one ray at angle `ray`. */
  function angles(f) {
    const O = [175, 165], rr = 120;
    let b = "";
    if (f.total === 180) b += line(pt(O[0], O[1], rr, 180), pt(O[0], O[1], rr, 0));
    else { b += line(O, pt(O[0], O[1], rr, 0)) + line(O, pt(O[0], O[1], rr, 90)) + rightMark(O, pt(O[0], O[1], 30, 0), pt(O[0], O[1], 30, 90)); }
    b += line(O, pt(O[0], O[1], rr, f.ray));
    const end = f.total === 180 ? 180 : 90;
    b += arc(O, 34, 0, f.ray, f.c1 || "fg-a", true) + text(pt(O[0], O[1], 62 + String(f.l1).length * 2, f.ray / 2), f.l1, (f.c1 || "fg-a").replace("fg-", "fg-t"), "middle", 13);
    b += arc(O, 28, f.ray, end, f.c2 || "fg-b", true) + text(pt(O[0], O[1], 56 + String(f.l2).length * 2.4, (f.ray + end) / 2), f.l2, (f.c2 || "fg-b").replace("fg-", "fg-t"), "middle", 13);
    return wrap(350, 180, b, "Angles", f.note);
  }

  /* Two similar triangles; matching sides share a color. */
  function similar(f) {
    const base = [[0, 0], [70, 0], [20, -55]]; // A, B, C relative (A bottom-left, B bottom-right, C top)
    const k = Math.min(f.k, 2.3), o1 = [30, 175], o2 = [160, 175];
    const P = (o, s) => base.map((p) => [o[0] + p[0] * s, o[1] + p[1] * s]);
    const [A, B, Cc] = P(o1, 1), [D, E, F] = P(o2, k);
    const G1 = [(A[0] + B[0] + Cc[0]) / 3, (A[1] + B[1] + Cc[1]) / 3], G2 = [(D[0] + E[0] + F[0]) / 3, (D[1] + E[1] + F[1]) / 3];
    let b = line(A, B, "fg-a", 3.5) + line(B, Cc, "fg-b", 3.5) + line(Cc, A, "fg-ink", 2.5) + line(D, E, "fg-a", 3.5) + line(E, F, "fg-b", 3.5) + line(F, D, "fg-ink", 2.5);
    if (f.fill) b += `<path d="M${A} L${B} L${Cc} Z" class="fg-a-wedge"/><path d="M${D} L${E} L${F} Z" class="fg-b-wedge"/>`;
    const L = f.lab || {};
    if (L.AB != null) b += sideLabel(A, B, G1, L.AB, "fg-a"); if (L.BC != null) b += sideLabel(B, Cc, G1, L.BC, "fg-b");
    if (L.DE != null) b += sideLabel(D, E, G2, L.DE, "fg-a"); if (L.EF != null) b += sideLabel(E, F, G2, L.EF, "fg-b");
    if (L.in1) b += text([Cc[0], Cc[1] - 30], L.in1, "fg-ta", "middle", 13); if (L.in2) b += text([F[0], F[1] - 30], L.in2, "fg-tb", "middle", 13);
    b += text([A[0] - 10, A[1] + 12], "A", "fg-tv") + text([B[0] + 8, B[1] + 12], "B", "fg-tv") + text([Cc[0], Cc[1] - 12], "C", "fg-tv");
    b += text([D[0] - 10, D[1] + 12], "D", "fg-tv") + text([E[0] + 8, E[1] + 12], "E", "fg-tv") + text([F[0], F[1] - 12], "F", "fg-tv");
    return `<svg viewBox="0 ${f.lab && f.lab.in2 ? -20 : 0} ${Math.max(340, E[0] + 40)} ${f.lab && f.lab.in2 ? 220 : 200}" class="fig-svg" role="img" aria-label="Similar triangles">${b}</svg>`;
  }

  /* Circle on a coordinate grid: center (h, k), radius r. */
  function circle(f) {
    const lim = Math.max(10, Math.abs(f.h) + f.r + 1, Math.abs(f.k) + f.r + 1), W = 300, u = (W - 40) / (2 * lim), o = [W / 2, W / 2];
    const X = (x) => o[0] + x * u, Y = (y) => o[1] - y * u;
    let b = "";
    for (let i = -lim; i <= lim; i++) { b += line([X(i), Y(-lim)], [X(i), Y(lim)], "fg-grid", 1) + line([X(-lim), Y(i)], [X(lim), Y(i)], "fg-grid", 1); }
    b += line([X(-lim), Y(0)], [X(lim), Y(0)], "fg-ink", 1.5) + line([X(0), Y(-lim)], [X(0), Y(lim)], "fg-ink", 1.5);
    b += text([X(lim) - 4, Y(0) - 10], "x", "fg-tv", "end", 12) + text([X(0) + 10, Y(lim) + 8], "y", "fg-tv", "start", 12);
    b += `<circle cx="${X(f.h)}" cy="${Y(f.k)}" r="${f.r * u}" class="fg-b" fill="none" stroke-width="3"/>`;
    b += line([X(f.h), Y(f.k)], [X(f.h + f.r), Y(f.k)], "fg-c", 3) + text([X(f.h + f.r / 2), Y(f.k) - 11], "r = " + f.r, "fg-tc", "middle", 13);
    b += dot([X(f.h), Y(f.k)], "fg-afill") + text([X(f.h), Y(f.k) + 16], "(" + f.h + ", " + f.k + ")", "fg-ta", "middle", 13);
    return wrap(W, W, b, "Circle in the xy-plane", f.note);
  }

  /* A sector of a circle with central angle th (degrees). */
  function sector(f) {
    const O = [150, 110], rr = 85;
    let b = `<circle cx="${O[0]}" cy="${O[1]}" r="${rr}" class="fg-ink" fill="none" stroke-width="2.5"/>`;
    b += arc(O, rr, 0, f.th, "fg-a", true) + line(O, pt(O[0], O[1], rr, 0), "fg-c", 3) + line(O, pt(O[0], O[1], rr, f.th), "fg-ink", 2.5);
    b += text(pt(O[0], O[1], 30, f.th / 2), f.th + "°", "fg-ta", "middle", 13) + text([O[0] + rr / 2, O[1] + 14], "r = " + f.r, "fg-tc", "middle", 13) + dot(O);
    return wrap(300, 210, b, "Sector of a circle", f.note);
  }

  /* Rectangle with side labels. */
  function rect(f) {
    const w = 220, h = Math.max(50, Math.min(140, 220 * f.ratio)), x = 50, y = 30;
    let b = `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="fg-a-wedge"/>` + line([x, y], [x + w, y], "fg-a", 3.5) + line([x, y + h], [x + w, y + h], "fg-a", 3.5) + line([x, y], [x, y + h], "fg-b", 3.5) + line([x + w, y], [x + w, y + h], "fg-b", 3.5);
    b += text([x + w / 2, y + h + 18], f.l, "fg-ta") + text([x + w + 10, y + h / 2], f.w, "fg-tb", "start");
    if (f.inside) b += text([x + w / 2, y + h / 2], f.inside, "fg-t", "middle", 13);
    return wrap(340, y + h + 34, b, "Rectangle", f.note);
  }

  const R = { rtri, parallel, tri, angles, similar, circle, sector, rect };
  root.Figures = { svg: (f) => (f && R[f.type] ? R[f.type](f) : "") };
  if (typeof module !== "undefined") module.exports = root.Figures;
})(typeof window !== "undefined" ? window : globalThis);
