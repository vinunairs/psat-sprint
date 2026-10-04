/* FAST Prep — original squishy characters (inline SVG, no images).
   Each one is built from simple shapes: a soft body, ears or a topper, a kawaii face, and a detail. */
(function (root) {
  "use strict";
  const SQ = [
    { id: "mochi", name: "Mochi Bunny", cost: 0, starter: true, body: "#FFF1F5", edge: "#F6B8CB", ears: "bunny", extra: "blush", about: "Soft as a rice cake. Bounces when you get one right." },
    { id: "dumpling", name: "Dumpling Cat", cost: 0, starter: true, body: "#FFF4DE", edge: "#E9C98F", ears: "cat", extra: "pleats", about: "Folded with love. Naps on fraction bars." },
    { id: "peach", name: "Peach Pup", cost: 0, starter: true, body: "#FFD9C2", edge: "#F2A07B", ears: "flop", extra: "leaf", about: "Sweet and fuzzy. Wags at every streak." },
    { id: "boba", name: "Boba Bear", cost: 200, body: "#D9B79A", edge: "#A97B57", ears: "bear", extra: "boba", about: "Full of chewy pearls of wisdom." },
    { id: "matcha", name: "Matcha Frog", cost: 250, body: "#BFE3A6", edge: "#7DB861", ears: "frog", extra: "blush", about: "Calm, green and great at leaping to answers." },
    { id: "onigiri", name: "Onigiri Owl", cost: 300, body: "#FFFFFF", edge: "#C9CED8", ears: "tufts", extra: "nori", shape: "tri", about: "Wise little snack. Hoots at hard words." },
    { id: "berry", name: "Strawberry Hamster", cost: 350, body: "#FF9DB0", edge: "#E5677F", ears: "round", extra: "seeds", about: "Stuffs its cheeks with vocabulary." },
    { id: "cloud", name: "Cloud Lamb", cost: 400, body: "#E7F1FF", edge: "#9CBCE8", ears: "lamb", extra: "fluff", about: "Floats through long passages." },
    { id: "taiyaki", name: "Taiyaki Fox", cost: 450, body: "#FFC27A", edge: "#E08A2E", ears: "fox", extra: "scales", about: "Crispy outside, clever inside." },
    { id: "panda", name: "Mooncake Panda", cost: 550, body: "#FFFFFF", edge: "#B9BDC8", ears: "panda", extra: "patches", about: "Loves full moons and full marks." },
    { id: "jelly", name: "Star Jelly", cost: 650, body: "#DCCBFF", edge: "#A487E8", ears: "none", extra: "tentacles", about: "Glows brighter with every star you earn." },
    { id: "sakura", name: "Sakura Dragon", cost: 800, body: "#FFC9DE", edge: "#E68AAE", ears: "horns", extra: "petals", about: "A tiny dragon who dances in petal storms." },
    { id: "galaxy", name: "Galaxy Kitty", cost: 1200, body: "#6D5BD0", edge: "#463A9E", ears: "cat", extra: "stars", dark: true, about: "Legendary. Made of stardust and determination." }
  ];

  function face(cx, cy, dark) {
    const eye = dark ? "#FFFFFF" : "#2B2340", hi = dark ? "#2B2340" : "#FFFFFF";
    return `<ellipse cx="${cx - 15}" cy="${cy}" rx="5" ry="6" fill="${eye}"/><ellipse cx="${cx + 15}" cy="${cy}" rx="5" ry="6" fill="${eye}"/>` +
      `<circle cx="${cx - 13.5}" cy="${cy - 2.5}" r="1.8" fill="${hi}"/><circle cx="${cx + 16.5}" cy="${cy - 2.5}" r="1.8" fill="${hi}"/>` +
      `<ellipse cx="${cx - 24}" cy="${cy + 9}" rx="6.5" ry="3.8" fill="#FF7FA3" opacity=".55"/><ellipse cx="${cx + 24}" cy="${cy + 9}" rx="6.5" ry="3.8" fill="#FF7FA3" opacity=".55"/>` +
      `<path d="M${cx - 5} ${cy + 8} q2.5 3.5 5 0 q2.5 3.5 5 0" fill="none" stroke="${eye}" stroke-width="2" stroke-linecap="round"/>`;
  }
  function ears(t, c, e) {
    const s = `fill="${c}" stroke="${e}" stroke-width="3"`;
    switch (t) {
      case "bunny": return `<ellipse cx="44" cy="30" rx="9" ry="24" ${s} transform="rotate(-12 44 30)"/><ellipse cx="76" cy="30" rx="9" ry="24" ${s} transform="rotate(12 76 30)"/><ellipse cx="44" cy="32" rx="4" ry="15" fill="#FFB3C8" transform="rotate(-12 44 32)"/><ellipse cx="76" cy="32" rx="4" ry="15" fill="#FFB3C8" transform="rotate(12 76 32)"/>`;
      case "cat": return `<path d="M30 52 L36 22 L56 40 Z" ${s} stroke-linejoin="round"/><path d="M90 52 L84 22 L64 40 Z" ${s} stroke-linejoin="round"/>`;
      case "fox": return `<path d="M28 54 L32 16 L56 40 Z" ${s} stroke-linejoin="round"/><path d="M92 54 L88 16 L64 40 Z" ${s} stroke-linejoin="round"/><path d="M34 30 L36 22 L46 36 Z" fill="#FFF4E0"/><path d="M86 30 L84 22 L74 36 Z" fill="#FFF4E0"/>`;
      case "bear": return `<circle cx="34" cy="38" r="12" ${s}/><circle cx="86" cy="38" r="12" ${s}/><circle cx="34" cy="38" r="5" fill="${e}" opacity=".5"/><circle cx="86" cy="38" r="5" fill="${e}" opacity=".5"/>`;
      case "panda": return `<circle cx="34" cy="38" r="12" fill="#2B2340"/><circle cx="86" cy="38" r="12" fill="#2B2340"/>`;
      case "round": return `<circle cx="36" cy="40" r="10" ${s}/><circle cx="84" cy="40" r="10" ${s}/>`;
      case "flop": return `<ellipse cx="26" cy="62" rx="10" ry="18" ${s} transform="rotate(20 26 62)"/><ellipse cx="94" cy="62" rx="10" ry="18" ${s} transform="rotate(-20 94 62)"/>`;
      case "frog": return `<circle cx="40" cy="38" r="13" ${s}/><circle cx="80" cy="38" r="13" ${s}/>`;
      case "tufts": return `<path d="M34 46 L30 24 L48 40 Z" ${s} stroke-linejoin="round"/><path d="M86 46 L90 24 L72 40 Z" ${s} stroke-linejoin="round"/>`;
      case "lamb": return `<ellipse cx="24" cy="58" rx="12" ry="7" ${s} transform="rotate(-25 24 58)"/><ellipse cx="96" cy="58" rx="12" ry="7" ${s} transform="rotate(25 96 58)"/>`;
      case "horns": return `<path d="M42 40 q-6 -16 4 -24 q-2 12 6 20 Z" fill="#FFE9A8" stroke="#E0B84E" stroke-width="2.5"/><path d="M78 40 q6 -16 -4 -24 q2 12 -6 20 Z" fill="#FFE9A8" stroke="#E0B84E" stroke-width="2.5"/>`;
      default: return "";
    }
  }
  function extra(t, d) {
    switch (t) {
      case "leaf": return `<path d="M60 30 q10 -14 22 -10 q-8 12 -22 10 Z" fill="#7BC67E" stroke="#4E9A55" stroke-width="2"/>`;
      case "pleats": return `<path d="M44 34 q4 -6 8 0 M56 31 q4 -6 8 0 M68 34 q4 -6 8 0" fill="none" stroke="#E0B97A" stroke-width="2.5" stroke-linecap="round"/>`;
      case "boba": return [[48, 96], [60, 100], [72, 96], [54, 106], [66, 106]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#5A3B2A"/>`).join("");
      case "nori": return `<rect x="40" y="88" width="40" height="22" rx="3" fill="#2F4A3A"/>`;
      case "seeds": return [[40, 92], [52, 100], [68, 100], [80, 92], [60, 90], [46, 82], [74, 82]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.8" ry="2.8" fill="#FFF3B0"/>`).join("") + `<path d="M48 34 l6 -10 l6 8 l6 -8 l6 10 Z" fill="#6CC070" stroke="#3F8F4A" stroke-width="2"/>`;
      case "fluff": return [[36, 38], [52, 30], [68, 30], [84, 38]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#FFFFFF" stroke="#9CBCE8" stroke-width="2.5"/>`).join("");
      case "scales": return `<path d="M44 96 q6 -6 12 0 q6 -6 12 0 q6 -6 12 0 M50 104 q6 -6 12 0 q6 -6 12 0" fill="none" stroke="#C9741F" stroke-width="2" stroke-linecap="round"/>`;
      case "patches": return `<ellipse cx="45" cy="70" rx="10" ry="12" fill="#2B2340" transform="rotate(-20 45 70)"/><ellipse cx="75" cy="70" rx="10" ry="12" fill="#2B2340" transform="rotate(20 75 70)"/>`;
      case "tentacles": return [40, 52, 64, 76].map((x) => `<path d="M${x + 2} 100 q-6 8 0 14 q6 6 0 12" fill="none" stroke="#A487E8" stroke-width="4" stroke-linecap="round"/>`).join("");
      case "petals": return [[30, 30], [94, 44], [22, 86]].map(([x, y]) => `<path d="M${x} ${y} q5 -7 10 0 q-5 7 -10 0 Z" fill="#FF8FB7"/>`).join("");
      case "stars": return [[42, 92, 4], [72, 98, 3], [86, 80, 2.5], [34, 74, 2.5], [60, 36, 3]].map(([x, y, r]) => `<path d="M${x} ${y - r * 2} L${x + r * .6} ${y - r * .6} L${x + r * 2} ${y} L${x + r * .6} ${y + r * .6} L${x} ${y + r * 2} L${x - r * .6} ${y + r * .6} L${x - r * 2} ${y} L${x - r * .6} ${y - r * .6} Z" fill="#FFE68A"/>`).join("");
      default: return "";
    }
  }
  function svg(id, opts = {}) {
    const d = SQ.find((s) => s.id === id) || SQ[0];
    const body = d.shape === "tri"
      ? `<path d="M60 24 Q66 24 70 30 L102 92 Q106 112 86 112 L34 112 Q14 112 18 92 L50 30 Q54 24 60 24 Z" fill="${d.body}" stroke="${d.edge}" stroke-width="3.5" stroke-linejoin="round"/>`
      : `<path d="M60 34 C92 34 106 56 106 80 C106 104 88 114 60 114 C32 114 14 104 14 80 C14 56 28 34 60 34 Z" fill="${d.body}" stroke="${d.edge}" stroke-width="3.5"/>`;
    const shine = `<ellipse cx="38" cy="58" rx="9" ry="5" fill="#FFFFFF" opacity="${d.dark ? .25 : .7}" transform="rotate(-30 38 58)"/>`;
    const behind = ["flop", "lamb", "tentacles"].includes(d.ears) || d.extra === "tentacles" ? ears(d.ears, d.body, d.edge) + (d.extra === "tentacles" ? extra("tentacles") : "") : "";
    const front = behind ? "" : ears(d.ears, d.body, d.edge);
    const lockAttr = opts.locked ? ' class="locked"' : "";
    return `<svg viewBox="0 0 120 128" class="squishy${opts.cls ? " " + opts.cls : ""}" role="img" aria-label="${d.name}"${lockAttr} xmlns="http://www.w3.org/2000/svg"><ellipse cx="60" cy="120" rx="36" ry="5" fill="#000" opacity=".08"/>${behind}${front}<g class="sq-body">${body}${shine}${extra(d.extra === "tentacles" ? "" : d.extra, d)}${face(60, 76, d.dark)}</g></svg>`;
  }
  root.FASTSquish = { list: SQ, svg, get: (id) => SQ.find((s) => s.id === id) };
})(typeof window !== "undefined" ? window : globalThis);
