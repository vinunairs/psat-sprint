/* FAST Prep — the app: sign-in, sync, kid view (Home, Math, Reading, Writing, Me), the question runner,
   and the parent view (admin). Separate from the PSAT/SAT app: own tables (fast_*), own local storage key. */
(function () {
  "use strict";
  const SUPABASE_URL = "https://frdcgfafsumdqjbjdhmf.supabase.co";
  const SUPABASE_KEY = "sb_publishable_S-5a43bXpPvd_aDsrcp44A_D8TQTAOw"; // public key; data is protected by row-level security
  const E = window.FASTEngine, SK = window.FASTSkills, SQ = window.FASTSquish, B = window.FAST_BANK || {};
  const KEY = "fastprep-v1:";
  const $ = (s, r = document) => r.querySelector(s);

  /* ---------- tiny DOM helpers ---------- */
  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === "class") e.className = v; else if (k === "text") e.textContent = v; else if (k === "html") e.innerHTML = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? "" : v);
    }
    for (const c of kids.flat()) if (c != null && c !== false) e.append(c instanceof Node ? c : document.createTextNode(String(c)));
    return e;
  }
  const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  // Light markup: [[n/d]] and [[w n/d]] fractions, **bold**, | tables |, blank-line paragraphs, line breaks.
  function inline(s) {
    return esc(s)
      .replace(/\[\[(?:(\d+) (?=\d+\/))?([^\/\]]+)\/([^\]]+)\]\]/g, (m, w, n, d) => (w ? `<span class="mixed">${w}<span class="fr"><span>${n}</span><span>${d}</span></span></span>` : `<span class="fr"><span>${n}</span><span>${d}</span></span>`))
      .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  }
  function rich(s) {
    const blocks = String(s || "").split(/\n\s*\n/);
    return blocks.map((b) => {
      const lines = b.split("\n");
      if (lines.every((l) => /^\s*\|/.test(l))) {
        const rows = lines.filter((l) => !/^\s*\|[\s|:-]+\|\s*$/.test(l)).map((l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
        return `<table>${rows.map((r, i) => `<tr>${r.map((c) => (i === 0 ? `<th>${inline(c)}</th>` : `<td>${inline(c)}</td>`)).join("")}</tr>`).join("")}</table>`;
      }
      return `<p>${lines.map(inline).join("<br>")}</p>`;
    }).join("");
  }
  const R = () => window.FASTFig.rng();
  function toast(t) { const d = h("div", { class: "toast", text: t }); $("#toasts").append(d); setTimeout(() => d.remove(), 2600); }
  function sheet(build) {
    const host = $("#sheet"); host.textContent = "";
    const close = () => (host.textContent = "");
    const pane = h("div", { class: "pane", role: "dialog", "aria-modal": "true" });
    const back = h("div", { class: "back", onclick: (e) => { if (e.target === back) close(); } }, pane);
    host.append(back); build(pane, close);
    const f = pane.querySelector("button, input, textarea"); if (f) f.focus({ preventScroll: true });
    return close;
  }
  function starsEl(n) { return h("span", { class: "stars", "aria-label": n + " of 3 stars", html: [0, 1, 2].map((i) => (i < n ? "★" : '<span class="off">★</span>')).join("") }); }
  const pct = (c, n) => (n ? Math.round((c / n) * 100) : 0);
  const fmtMin = (sec) => (sec < 60 ? (sec ? "<1" : "0") : String(Math.round(sec / 60)));
  const dayLabel = (d) => new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

  /* ---------- sound (tiny, optional) ---------- */
  let actx = null;
  function ding(ok) {
    if (!S || !S.settings.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const notes = ok ? [660, 880, 1175] : [330, 262];
      notes.forEach((f, i) => { const o = actx.createOscillator(), g = actx.createGain(); o.type = "sine"; o.frequency.value = f; g.gain.setValueAtTime(0.0001, actx.currentTime + i * 0.09); g.gain.exponentialRampToValueAtTime(0.12, actx.currentTime + i * 0.09 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + i * 0.09 + 0.25); o.connect(g).connect(actx.destination); o.start(actx.currentTime + i * 0.09); o.stop(actx.currentTime + i * 0.09 + 0.3); });
    } catch (e) { /* sound is optional */ }
  }

  /* ---------- state & sync ---------- */
  let sb = null, user = null, S = null, learner = null, rewardsCfg = [], feedback = {}, scores = [], pushTimer = null, pushing = false, lastPushOk = null;
  const app = $("#app");
  function loadLocal(uid) { try { return JSON.parse(localStorage.getItem(KEY + uid) || "null"); } catch (e) { return null; } }
  function save() {
    if (!S || !user) return;
    S.updatedAt = Date.now(); S.owner = user.id; E.pruneDays(S);
    try { localStorage.setItem(KEY + user.id, JSON.stringify(S)); } catch (e) { /* storage full or blocked: cloud copy still saves */ }
    clearTimeout(pushTimer); pushTimer = setTimeout(push, 1500);
  }
  async function push() {
    if (!S || !user || !learner) return;
    if (pushing) { clearTimeout(pushTimer); pushTimer = setTimeout(push, 1500); return; }
    pushing = true;
    const { error } = await sb.from("fast_progress").upsert({ user_id: user.id, data: S, client_updated_ms: S.updatedAt || Date.now(), updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    pushing = false; lastPushOk = !error;
  }
  async function pull() {
    const { data, error } = await sb.from("fast_progress").select("data, client_updated_ms").eq("user_id", user.id).maybeSingle();
    if (error) return false;
    const local = S && S.updatedAt ? S.updatedAt : 0;
    if (data && Number(data.client_updated_ms) > local + 1000 && !runner) { S = E.normalize(data.data); try { localStorage.setItem(KEY + user.id, JSON.stringify(S)); } catch (e) { } return true; }
    if (!data || local > Number(data.client_updated_ms) + 1000) push();
    return false;
  }

  /* ---------- boot & sign-in ---------- */
  async function boot() {
    if (!window.supabase) { app.innerHTML = '<div class="signin"><p class="err">Couldn\'t load. Check the internet connection and reload.</p></div>'; return; }
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "implicit" } });
    window.__fast = { get S() { return S; }, sb, E, push, pull, render: () => render() };
    const { data } = await sb.auth.getSession();
    sb.auth.onAuthStateChange((ev, session) => {
      if (ev === "PASSWORD_RECOVERY") return setTimeout(showReset, 0);
      const was = user && user.id; user = session ? session.user : null;
      if ((user && user.id) !== was) setTimeout(enter, 0);
    });
    user = data.session ? data.session.user : null;
    enter();
  }
  async function enter() {
    if (!user) return renderSignIn();
    app.innerHTML = '<div class="boot"><div class="boot-blob"></div><p>Getting your squishies ready…</p></div>';
    let isAdmin = false;
    try { const r = await sb.rpc("is_admin"); isAdmin = r.data === true; } catch (e) { }
    if (isAdmin) return renderParent();
    const { data: lrow, error } = await sb.from("fast_learners").select("first_name, grade, goals, active, rewards").eq("user_id", user.id).maybeSingle();
    if (error && !navigator.onLine) learner = { first_name: "", offline: true };
    else if (!lrow || !lrow.active) return renderNotInvited();
    else learner = lrow;
    S = E.normalize(loadLocal(user.id));
    if (!S.created) S.created = E.today();
    if (!S.settings.name && learner.first_name) S.settings.name = learner.first_name;
    await pull().catch(() => false);
    S.settings.name = S.settings.name || learner.first_name || "";
    document.body.classList.toggle("big", !!S.settings.bigText);
    loadExtras();
    render();
    if (!S.buddy) pickStarter();
  }
  async function loadExtras() {
    rewardsCfg = (learner && learner.rewards) || [];
    try { const { data } = await sb.from("fast_feedback").select("essay_id, scores, note, updated_at").eq("user_id", user.id); feedback = Object.fromEntries((data || []).map((f) => [f.essay_id, f])); } catch (e) { }
    try { const { data } = await sb.from("fast_scores").select("*").eq("user_id", user.id).order("taken_on"); scores = data || []; } catch (e) { }
  }
  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState === "visible" && user && learner && !runner) { if (await pull().catch(() => false)) render(); }
    if (document.visibilityState === "hidden" && S && user && learner) push();
  });

  function renderSignIn(msgText) {
    app.textContent = "";
    const email = h("input", { type: "email", id: "em", autocomplete: "email", required: true, placeholder: "Email" });
    const pw = h("input", { type: "password", id: "pw", autocomplete: "current-password", required: true, placeholder: "Password" });
    const msg = h("p", { class: "err", role: "alert", text: msgText || "" });
    const go = h("button", { class: "btn primary block", type: "submit" }, "Let's go!");
    const f = h("form", { class: "card stack" },
      h("label", { class: "field" }, h("span", { text: "Email" }), email),
      h("label", { class: "field" }, h("span", { text: "Password" }), pw), msg, go,
      h("button", { type: "button", class: "btn ghost small", onclick: async () => {
        if (!email.value.trim()) { msg.textContent = "Type your email first."; return; }
        const { error } = await sb.auth.resetPasswordForEmail(email.value.trim(), { redirectTo: location.origin + location.pathname });
        msg.className = error ? "err" : "muted"; msg.textContent = error ? error.message : "Check your email for a link to set a new password.";
      } }, "Forgot password?"));
    f.addEventListener("submit", async (e) => {
      e.preventDefault(); msg.textContent = ""; go.disabled = true;
      const { error } = await sb.auth.signInWithPassword({ email: email.value.trim(), password: pw.value });
      go.disabled = false;
      if (error) msg.textContent = /invalid/i.test(error.message) ? "Email or password isn't right. Try again!" : /fetch|network/i.test(error.message) ? "Can't reach the internet right now." : error.message;
    });
    app.append(h("div", { class: "signin stack" },
      h("div", { class: "sqrow", html: SQ.svg("mochi", { cls: "dance-bounce" }) + SQ.svg("dumpling", { cls: "dance-wiggle" }) + SQ.svg("peach", { cls: "dance-sway" }) }),
      h("h1", { class: "center", text: "FAST Prep" }),
      h("p", { class: "center muted", text: "Math, reading and writing practice — with squishies! Sign in with the same email and password you use for Daily Brief." }),
      f, h("p", { class: "center small muted" }, "For invited students only. ", h("a", { href: "../" }, "Test Prep Hub"))));
    email.focus();
  }
  function renderNotInvited() {
    app.textContent = "";
    app.append(h("div", { class: "signin stack center" }, h("h1", { text: "Almost there!" }),
      h("p", { text: "This practice area is only for invited students, and this account isn't on the list yet. Ask your parent to add you." }),
      h("div", { class: "row", style: "justify-content:center" }, h("a", { class: "btn", href: "../" }, "Go to Test Prep Hub"), h("button", { class: "btn ghost", onclick: () => sb.auth.signOut() }, "Sign out"))));
  }
  function showReset() {
    sheet((p, close) => {
      const pw = h("input", { type: "password", autocomplete: "new-password", minlength: "6" }), msg = h("p", { class: "err" });
      p.append(h("h2", { text: "Set a new password" }), h("label", { class: "field" }, h("span", { text: "New password (6+ characters)" }), pw), msg,
        h("button", { class: "btn primary", onclick: async () => { if (pw.value.length < 6) { msg.textContent = "Use at least 6 characters."; return; } const { error } = await sb.auth.updateUser({ password: pw.value }); if (error) msg.textContent = error.message; else { close(); toast("Password saved!"); } } }, "Save"));
    });
  }

  /* ---------- kid shell ---------- */
  let tab = "home", sub = { me: "progress", reading: null };
  const TABS = [["home", "🏠", "Home"], ["math", "➗", "Math"], ["reading", "📚", "Reading"], ["writing", "✏️", "Writing"], ["me", "⭐", "Me"]];
  function render() {
    if (!S) return;
    app.textContent = "";
    const shell = h("div", { class: "shell" });
    const rk = E.rank(S.xp);
    shell.append(h("div", { class: "topbar" },
      h("div", { class: "who", text: `${rk.icon} ${S.settings.name || "Hi!"}` }),
      h("button", { class: "chip fire", title: "Day streak", onclick: () => go("me", "rewards") }, "🔥 " + (S.streak.last && S.streak.last >= E.addDays(E.today(), -1) ? S.streak.cur : 0)),
      h("button", { class: "chip coin", title: "Mochi coins", onclick: () => go("me", "squishies") }, "🪙 " + S.coins.toLocaleString())));
    const main = h("main", {});
    ({ home: pageHome, math: pageMath, reading: pageReading, writing: pageWriting, me: pageMe })[tab](main);
    shell.append(main);
    app.append(shell, h("nav", { class: "nav", "aria-label": "Sections" }, h("div", { class: "nav-in" }, TABS.map(([id, ic, label]) =>
      h("button", { "aria-current": tab === id ? "page" : null, onclick: () => go(id) }, h("span", { class: "ni", text: ic }), label)))));
  }
  function go(t, s) { tab = t; if (s) sub[t] = s; render(); window.scrollTo(0, 0); }

  function buddyEl(cls, size) {
    const wrap = h("div", { class: "buddy" + (size ? " " + size : ""), role: "button", tabindex: "0", "aria-label": "Squish your buddy", html: SQ.svg(S.buddy || "mochi", { cls }) });
    const squish = () => { const svg = wrap.firstChild; svg.classList.remove("squish"); void svg.getBoundingClientRect(); svg.classList.add("squish"); };
    wrap.addEventListener("click", squish); wrap.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); squish(); } });
    return wrap;
  }
  function pickStarter() {
    sheet((p, close) => {
      p.append(h("h2", { text: "Pick your first squishy buddy!" }), h("p", { class: "muted", text: "Your buddy cheers you on and dances when you finish your mission. You can collect more with mochi coins." }));
      const grid = h("div", { class: "sq-grid" });
      SQ.list.filter((s) => s.starter).forEach((s) => grid.append(h("button", { class: "sq-card", onclick: () => { S.buddy = s.id; if (!S.owned.includes(s.id)) S.owned.push(s.id); save(); close(); render(); toast(`${s.name} joined your team! 🎉`); } },
        h("div", { class: "sqw", html: SQ.svg(s.id, { cls: "dance-bounce" }) }), h("b", { text: s.name }), h("span", { class: "small muted", text: s.about }))));
      p.append(grid);
    });
  }

  /* ---------- Home ---------- */
  const CHEERS = ["You've got this!", "Ready to squish some questions?", "Little steps, big wins.", "Brains get stronger every time you practice!", "Let's dance through some math!", "Mistakes help your brain grow. 🌱"];
  function pageHome(main) {
    const date = E.today(), d = S.days[date], done = d && d.set > 0;
    const run = S.run && S.run.date === date ? S.run : null;
    const msg = done ? "Mission complete! Want a bonus round?" : run ? "Let's finish today's mission!" : CHEERS[new Date().getDate() % CHEERS.length];
    main.append(h("div", { class: "buddy-zone", style: "margin:4px 0 14px" }, buddyEl(done ? "dance-" + S.move : ""), h("div", { class: "bubble grow", text: `Hi ${S.settings.name || "friend"}! ${msg}` })));

    // Today's mission
    const total = run ? run.items.length : 0, at = run ? run.i : 0;
    const card = h("div", { class: "card hero mission stack" },
      h("div", { class: "row" }, h("h2", { class: "grow", text: done ? "✅ Today's mission: done!" : "🎯 Today's mission" }), h("span", { class: "chip tag", text: "10–15 min" })),
      h("p", { text: done ? `You answered ${d.c} of ${d.q} right today. ${S.streak.cur > 1 ? "🔥 " + S.streak.cur + "-day streak!" : ""}` : "Warm-up, math, then reading or word power. Weak spots come first so they get stronger!" }));
    if (run && !done) card.append(h("div", { class: "bar", "aria-label": `${at} of ${total} done` }, h("i", { style: `width:${pct(at, total)}%` })), h("p", { class: "small", text: `${at} of ${total} questions done` }));
    card.append(h("div", { class: "row" },
      done ? h("button", { class: "btn primary", onclick: () => startBonus() }, "⚡ Bonus round") : h("button", { class: "btn primary", onclick: () => startMission() }, run && at > 0 ? "Keep going ▶" : "Start mission ▶")));
    main.append(card);

    // Next stops
    const next = E.pathNext(S), grid = h("div", { class: "grid2", style: "margin-top:14px" });
    grid.append(tile("🍡", "Math path", `Next stop: ${next.name}`, () => openSkill(next.id)));
    const wk = S.essays.filter((e) => e.at >= E.addDays(date, -6)).length;
    grid.append(tile("✏️", wk ? "Writing ✓ this week" : "Weekly essay", wk ? "Nice work! Try a writing workout." : "Write one FAST-style essay this week (+100 🪙)", () => go("writing"), wk > 0));
    grid.append(tile("🌸", "Word Power", "8 quick vocabulary questions", () => startRun({ title: "Word Power", items: E.wordPower(S, 8, R()), kind: "practice" })));
    grid.append(tile("🚀", "Level Up zone", "Try 5th-grade questions!", () => go("math", "stretch")));
    main.append(grid);

    // This week strip
    const days = h("div", { class: "row", style: "gap:6px;justify-content:space-between;margin-top:8px" });
    for (let i = 6; i >= 0; i--) {
      const dd = E.addDays(date, -i), v = S.days[dd];
      days.append(h("div", { class: "center", style: "flex:1" }, h("div", { style: `font-size:22px;opacity:${v && v.set ? 1 : 0.25}`, text: v && v.set ? "🍡" : v && v.q ? "🌱" : "⚪" }), h("div", { class: "small muted", text: new Date(dd + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "narrow", timeZone: "UTC" }) })));
    }
    main.append(h("div", { class: "card", style: "margin-top:14px" }, h("h3", { text: "This week" }), days, h("p", { class: "small muted", text: "🍡 mission done · 🌱 practiced" })));
  }
  function tile(ic, title, text, onclick, done) { return h("button", { class: "tile" + (done ? " done" : ""), onclick }, h("span", { class: "ic", text: ic }), h("b", { text: title }), h("span", { text })); }

  /* ---------- Math ---------- */
  function pageMath(main) {
    const view = sub.math || "path";
    main.append(h("div", { class: "row", style: "margin-bottom:6px" }, h("h1", { class: "grow", text: "Math" }),
      h("div", { class: "seg" }, ["path", "stretch"].map((v) => h("button", { "aria-pressed": String(view === v), onclick: () => go("math", v) }, v === "path" ? "Math path" : "🚀 Level Up")))));
    if (view === "stretch") return stretchPage(main);
    main.append(h("p", { class: "muted", text: "Fractions first, then shapes & measuring, then multiplying & dividing, then big numbers. Get 2 ⭐ to move on — the glowing stop is next!" }));
    const next = E.pathNext(S).id;
    for (const u of SK.UNITS) {
      const skills = SK.list((s) => s.unit === u.id), got = skills.reduce((a, s) => a + E.stars(S, s.id), 0);
      const path = h("div", { class: "path" });
      skills.forEach((s, si) => {
        const st = E.stars(S, s.id);
        path.append(h("button", { class: `stop s${st}${s.id === next ? " next" : ""}`, onclick: () => openSkill(s.id) },
          h("span", { class: "dot", text: st === 3 ? "🏆" : st ? "⭐" : s.id === next ? "▶" : String(si + 1) }),
          h("span", { class: "lbl" }, h("b", { text: s.name }), starsEl(st))));
      });
      main.append(h("section", { class: "unit card" }, h("div", { class: "unit-head" }, h("span", { class: "ic", text: u.icon }), h("div", { class: "grow" }, h("h2", { text: u.name }), h("p", { class: "small muted", text: u.blurb }))), h("p", { class: "small", text: `⭐ ${got} of ${skills.length * 3}` }), path));
    }
  }
  function stretchPage(main) {
    main.append(h("div", { class: "card hero stack" }, h("h2", { text: "🚀 Level Up zone" }),
      h("p", { text: "These are 5th-grade skills! i-Ready gives harder questions when you get answers right, so practicing these helps you keep climbing. It's okay to find them tricky — that's how brains grow." }),
      h("div", { class: "row" }, h("button", { class: "btn primary", onclick: () => startRun({ title: "Level Up mix", items: E.stretchSet(S, 8, R()), kind: "practice" }) }, "Level Up mix (8)"),
        h("button", { class: "btn", onclick: () => { const ps = E.passageSet(S, null, R(), { lv: 5 }); if (ps) startRun({ title: ps.passage.title, items: ps.items, kind: "practice" }); } }, "📖 Level Up reading"),
        h("button", { class: "btn", onclick: () => startRun({ title: "Level Up words", items: E.wordPower(S, 8, R(), 5), kind: "practice" }) }, "🌸 Level Up words"))));
    const list = h("div", { class: "card", style: "margin-top:14px" }, h("h3", { text: "5th-grade math skills" }));
    SK.list((s) => s.stretch).forEach((s) => list.append(h("div", { class: "skl" }, h("div", { class: "nm" }, h("b", { text: s.name }), h("div", { class: "small muted", text: s.std })), starsEl(E.stars(S, s.id)), h("button", { class: "btn small", onclick: () => openSkill(s.id) }, "Go"))));
    main.append(list);
  }
  // Skill sheet: quick lesson (rule + a worked example), then practice.
  function openSkill(id) {
    const s = SK.SKILLS[id];
    sheet((p, close) => {
      p.append(h("div", { class: "row" }, h("h2", { class: "grow", text: s.name }), starsEl(E.stars(S, id))));
      p.append(h("p", { class: "small muted", text: `${s.std} · FAST: ${SK.CATS[s.cat].name}${s.ir ? " · i-Ready: " + (SK.IREADY[s.ir] || SK.IREADY.LIT).name : ""}` }));
      p.append(h("div", { class: "card flat", style: "background:var(--lemon-soft);border-color:transparent" }, h("b", { text: "💡 Quick lesson" }), h("p", { html: inline(s.tip) })));
      if (s.subj === "math") {
        const ex = E.fromGen(id, 1, R());
        const exBox = h("details", { class: "card flat", style: "margin-top:10px" }, h("summary", { style: "font-weight:800;cursor:pointer", text: "👀 See an example" }),
          h("div", { class: "qtext", html: rich(ex.q) }), ex.fig ? h("div", { html: ex.fig }) : null,
          h("p", { html: "<b>Answer:</b> " + inline(ex.t ? ex.ans + (ex.unit ? " " + ex.unit : "") : Array.isArray(ex.a) ? ex.a.map((i) => ex.o[i]).join(" and ") : ex.o[ex.a]) }), h("div", { html: rich(ex.e) }));
        p.append(exBox);
      }
      const st = S.skills[id];
      if (st && st.n) p.append(h("p", { class: "small", text: `You've tried ${st.n} · ${E.band(E.score(S, id)).label} · Level ${st.lv} of 3` }));
      p.append(h("div", { class: "row", style: "margin-top:12px" },
        h("button", { class: "btn primary", onclick: () => { close(); startRun({ title: s.name, items: E.practice(S, id, 8, R()), kind: "practice" }); } }, "Practice 8"),
        h("button", { class: "btn", onclick: () => { close(); startRun({ title: s.name, items: E.practice(S, id, 4, R()), kind: "practice" }); } }, "Quick 4"),
        h("button", { class: "btn ghost", onclick: close }, "Close")));
    });
  }

  /* ---------- Reading ---------- */
  function pageReading(main) {
    main.append(h("h1", { text: "Reading" }), h("p", { class: "muted", text: "Stories, poems, articles and paired texts — plus lots of word power, because words are your superpower." }));
    const g = h("div", { class: "grid2" });
    const pick = (genre, title) => () => { const ps = E.passageSet(S, genre, R()); if (ps) startRun({ title: ps.passage.title, items: ps.items, kind: "practice" }); else toast("No passages found"); };
    const count = (f) => E.allPassages().filter((p) => f(p) && (p.lv || 4) < 5), read = (f) => count(f).filter((p) => S.passages[p.id]).length;
    const isLit = (p) => p.genre === "prose", isPoem = (p) => p.genre === "poetry", isInfo = (p) => p.genre === "info", isPair = (p) => p.genre === "paired";
    g.append(tile("📖", "Story time", `${read(isLit)} of ${count(isLit).length} stories read`, pick("prose")));
    g.append(tile("🎐", "Poems", `${read(isPoem)} of ${count(isPoem).length} poems read`, pick("poetry")));
    g.append(tile("🔬", "Articles", `${read(isInfo)} of ${count(isInfo).length} articles read`, pick("info")));
    g.append(tile("🔀", "Two texts", `Compare across genres · ${read(isPair)} of ${count(isPair).length}`, pick("paired")));
    g.append(tile("🌸", "Word Power", "8 vocabulary questions — your weakest word skills first", () => startRun({ title: "Word Power", items: E.wordPower(S, 8, R()), kind: "practice" })));
    g.append(tile("🚀", "Level Up reading", "A 5th-grade passage", () => { const ps = E.passageSet(S, null, R(), { lv: 5 }); if (ps) startRun({ title: ps.passage.title, items: ps.items, kind: "practice" }); }));
    main.append(g);
    for (const cat of ["AGV", "PROSE", "INFO"]) {
      const c = h("div", { class: "card", style: "margin-top:14px" }, h("h3", { text: SK.CATS[cat].long }));
      SK.list((s) => s.cat === cat).forEach((s) => c.append(h("div", { class: "skl" }, h("div", { class: "nm" }, h("b", { text: s.name })), starsEl(E.stars(S, s.id)), h("button", { class: "btn small", onclick: () => openSkill(s.id) }, "Practice"))));
      main.append(c);
    }
  }

  /* ---------- Writing ---------- */
  let essayOpen = null;
  function pageWriting(main) {
    if (essayOpen) return pageEssay(main, essayOpen);
    main.append(h("h1", { text: "Writing" }), h("p", { class: "muted", text: "In spring, FAST Writing asks you to read sources and write an essay. Practice the moves here!" }));
    main.append(h("div", { class: "grid2" },
      tile("🏋️", "Writing workout", "8 quick questions: grammar, evidence, organization", () => startRun({ title: "Writing workout", items: E.writingDrill(S, 8, R()), kind: "practice" })),
      tile("📝", "Write an essay", "Read 2 sources, plan, write, check (+100 🪙)", () => { $("#essays").scrollIntoView({ behavior: "smooth" }); })));
    const list = h("div", { class: "card", id: "essays", style: "margin-top:14px" }, h("h3", { text: "Essay prompts" }));
    for (const p of B.prompts || []) {
      const did = S.essays.filter((e) => e.pid === p.id), draft = S.drafts[p.id];
      list.append(h("div", { class: "skl" }, h("div", { class: "nm" }, h("b", { text: p.title }), h("div", { class: "small muted", text: `${p.mode === "opinion" ? "Opinion" : "Informative"}${p.lv >= 5 ? " · 🚀 Level Up" : ""}${did.length ? " · ✓ written" : draft ? " · draft saved" : ""}` })),
        h("button", { class: "btn small" + (did.length ? "" : " primary"), onclick: () => { essayOpen = { id: p.id, step: draft ? (draft.text ? 2 : 1) : 0 }; render(); window.scrollTo(0, 0); } }, did.length ? "Again" : draft ? "Continue" : "Start")));
    }
    main.append(list);
    if (S.essays.length) {
      const mine = h("div", { class: "card", style: "margin-top:14px" }, h("h3", { text: "My essays" }));
      S.essays.slice().reverse().forEach((e) => {
        const fb = feedback[e.id];
        mine.append(h("details", { class: "skl", style: "display:block" }, h("summary", { style: "cursor:pointer;font-weight:800" }, `${e.title} · ${dayLabel(e.at)} · ${e.words} words${fb ? " · ⭐ " + scoreTotal(fb.scores) + "/10 from your grown-up" : ""}`),
          fb ? h("div", { class: "feedback ok" }, h("b", { text: `Grown-up score: ${scoreTotal(fb.scores)}/10` }), h("p", { class: "small", text: rubricLine(fb.scores) }), fb.note ? h("p", { text: "💬 " + fb.note }) : null) : null,
          h("div", { class: "essay-view", text: e.text })));
      });
      main.append(mine);
    }
  }
  const scoreTotal = (s) => ["w.org", "w.evid", "w.conv"].reduce((a, k) => a + (Number(s && s[k]) || 0), 0);
  const rubricLine = (s) => `Purpose & Organization ${s["w.org"] ?? "–"}/4 · Evidence & Elaboration ${s["w.evid"] ?? "–"}/4 · Conventions ${s["w.conv"] ?? "–"}/2`;
  function pageEssay(main, st) {
    const p = (B.prompts || []).find((x) => x.id === st.id); if (!p) { essayOpen = null; return pageWriting(main); }
    const dr = (S.drafts[p.id] = S.drafts[p.id] || { plan: {}, text: "", at: E.today() });
    const steps = ["1 Read", "2 Plan", "3 Write", "4 Check"];
    main.append(h("div", { class: "row" }, h("button", { class: "btn small ghost", onclick: () => { essayOpen = null; render(); } }, "← Writing"), h("span", { class: "chip tag", text: p.mode === "opinion" ? "Opinion essay" : "Informative essay" })));
    main.append(h("h1", { text: p.title, style: "margin:6px 0" }));
    main.append(h("div", { class: "wtabs" }, steps.map((t, i) => h("button", { "aria-pressed": String(st.step === i), onclick: () => { st.step = i; render(); } }, t))));
    const promptBox = h("div", { class: "card flat", style: "background:var(--grape-soft);border-color:transparent" }, h("b", { text: "Your task: " }), h("span", { html: inline(p.prompt) }));
    const saveDraft = () => { dr.at = E.today(); save(); };
    if (st.step === 0) {
      main.append(promptBox);
      let which = 0; const box = h("div", { class: "passage", style: "margin-top:12px" });
      const draw = () => { box.textContent = ""; box.append(h("div", { class: "ptabs" }, p.sources.map((s, i) => h("button", { "aria-pressed": String(i === which), onclick: () => { which = i; draw(); } }, "Source " + (i + 1)))), passageBody({ title: p.sources[which].title, text: p.sources[which].text, genre: "info" })); };
      draw(); main.append(box, h("div", { class: "row", style: "margin-top:14px" }, h("button", { class: "btn primary", onclick: () => { st.step = 1; render(); window.scrollTo(0, 0); } }, "I read both → Plan")));
    } else if (st.step === 1) {
      main.append(promptBox, h("p", { class: "muted", text: "Plan first — great writers do! Fill in the boxes using your own words and facts from the sources." }));
      const fld = (k, label, hint) => { const t = h("textarea", { rows: "3", placeholder: hint }); t.value = dr.plan[k] || ""; t.addEventListener("input", () => { dr.plan[k] = t.value; saveDraft(); }); return h("label", { class: "field" }, h("span", {}, label, h("div", { class: "hint", html: inline(hint) })), t); };
      main.append(fld("hook", "🪝 Hook", p.plan.hook), fld("claim", p.mode === "opinion" ? "📣 My opinion (claim)" : "🎯 My main idea", p.plan.claim),
        fld("r1", "1️⃣ Reason / point 1 + evidence", p.plan.reasons[0]), fld("r2", "2️⃣ Reason / point 2 + evidence", p.plan.reasons[1] || ""), fld("end", "🏁 Conclusion", p.plan.conclusion),
        h("div", { class: "row" }, h("button", { class: "btn", onclick: () => { st.step = 0; render(); } }, "← Sources"), h("button", { class: "btn primary", onclick: () => { st.step = 2; render(); window.scrollTo(0, 0); } }, "Start writing →")));
    } else if (st.step === 2) {
      const ta = h("textarea", { class: "essay", placeholder: "Write your essay here. Use your plan! Press Enter twice between paragraphs." }); ta.value = dr.text || "";
      const wc = h("span", { class: "chip" }), upd = () => { const n = (ta.value.match(/[A-Za-z']+/g) || []).length; wc.textContent = n + " words"; };
      ta.addEventListener("input", () => { dr.text = ta.value; upd(); saveDraft(); }); upd();
      const planView = h("details", { class: "card flat" }, h("summary", { style: "font-weight:800;cursor:pointer", text: "📋 My plan" }), ...["hook", "claim", "r1", "r2", "end"].filter((k) => dr.plan[k]).map((k) => h("p", { class: "small", text: dr.plan[k] })));
      const srcView = h("details", { class: "card flat", style: "margin-top:8px" }, h("summary", { style: "font-weight:800;cursor:pointer", text: "📄 Sources" }), ...p.sources.map((s) => h("div", {}, h("h3", { text: s.title, style: "margin-top:10px" }), h("div", { class: "small", html: rich(s.text) }))));
      main.append(promptBox, planView, srcView, h("div", { class: "row", style: "margin:12px 0 6px" }, h("b", { class: "grow", text: "Write" }), wc), ta,
        h("div", { class: "row", style: "margin-top:12px" }, h("button", { class: "btn", onclick: () => { st.step = 1; render(); } }, "← Plan"), h("button", { class: "btn primary", onclick: () => { st.step = 3; render(); window.scrollTo(0, 0); } }, "Check my essay →")));
    } else {
      const ck = E.essayChecks(dr.text, p);
      main.append(h("div", { class: "card" }, h("h3", { text: "🤖 Quick checks" }), h("ul", { class: "checks" }, ck.list.map((c) => h("li", { class: c.ok ? "ok" : "", text: c.text })))));
      const self = (dr.self = dr.self || {});
      const rub = h("div", { class: "card selfcheck", style: "margin-top:14px" }, h("h3", { text: "✅ Check it like a FAST scorer" }), h("p", { class: "small muted", text: "Tick each one you really did. Fix anything you missed in step 3!" }));
      (B.rubric || []).forEach((r) => {
        rub.append(h("h3", { text: `${r.name} (${r.max} pts)`, style: "margin-top:12px;font-size:16px" }));
        r.checks.forEach((c, i) => { const key = r.domain + ":" + i, cb = h("input", { type: "checkbox", checked: self[key] ? true : null, onchange: () => { self[key] = cb.checked; saveDraft(); } }); rub.append(h("label", {}, cb, h("span", { text: c }))); });
      });
      main.append(rub, h("div", { class: "row", style: "margin-top:14px" }, h("button", { class: "btn", onclick: () => { st.step = 2; render(); } }, "← Fix my essay"),
        h("button", { class: "btn primary", disabled: ck.words < 60 ? true : null, onclick: () => submitEssay(p, dr, ck) }, ck.words < 60 ? "Write at least 60 words first" : "Turn it in! (+100 🪙)")));
    }
  }
  function submitEssay(p, dr, ck) {
    const selfScore = {}; for (const r of B.rubric || []) { const n = r.checks.filter((_, i) => dr.self && dr.self[r.domain + ":" + i]).length; selfScore[r.domain] = Math.round((n / r.checks.length) * r.max); }
    const essay = { id: p.id + "-" + Date.now().toString(36), pid: p.id, title: p.title, mode: p.mode, text: dr.text, words: ck.words, at: E.today(), self: selfScore, checks: ck.list.filter((c) => c.ok).length + "/" + ck.list.length };
    S.essays.push(essay); delete S.drafts[p.id];
    E.earn(S, 100); const d = E.day(S, E.today()); d.essays = (d.essays || 0) + 1; E.touchStreak(S, E.today()); E.unlockMoves(S);
    save(); essayOpen = null; tab = "writing"; render(); confetti();
    toast("Essay turned in! +100 🪙 Your grown-up can score it.");
  }

  /* ---------- Me: progress, squishies, rewards, settings ---------- */
  function pageMe(main) {
    const v = sub.me || "progress";
    main.append(h("div", { class: "row", style: "margin-bottom:12px" }, h("h1", { class: "grow", text: "Me" })),
      h("div", { class: "seg full", style: "margin-bottom:14px" }, [["progress", "📊 Progress"], ["squishies", "🧸 Squishies"], ["rewards", "🏅 Rewards"], ["settings", "⚙️"]].map(([k, l]) => h("button", { "aria-pressed": String(v === k), onclick: () => go("me", k) }, l))));
    ({ progress: meProgress, squishies: meSquishies, rewards: meRewards, settings: meSettings })[v](main);
  }
  let progView = "fast";
  function meProgress(main) {
    main.append(h("div", { class: "seg full", style: "margin-bottom:12px" }, [["fast", "FAST"], ["iready", "i-Ready"], ["scores", "School scores"]].map(([k, l]) => h("button", { "aria-pressed": String(progView === k), onclick: () => { progView = k; render(); } }, l))));
    if (progView === "scores") return main.append(scoreCharts(scores, learner && learner.goals));
    if (progView === "iready") {
      for (const subj of ["math", "reading"]) {
        const c = h("div", { class: "card", style: "margin-bottom:14px" }, h("h2", { text: subj === "math" ? "i-Ready Math" : "i-Ready Reading" }), h("p", { class: "small muted", text: "Your practice, sorted the way i-Ready reports it." }));
        Object.entries(SK.IREADY).filter(([, d]) => d.subj === subj).forEach(([k, d]) => c.append(catRow(d.name, E.irScore(S, k))));
        main.append(c);
      }
      return;
    }
    for (const subj of ["math", "reading", "writing"]) {
      const c = h("div", { class: "card", style: "margin-bottom:14px" }, h("h2", { text: subj === "math" ? "FAST Math" : subj === "reading" ? "FAST Reading" : "FAST Writing" }), h("p", { class: "small muted", text: "Your practice, sorted the way your FAST report shows it. Tap an area to see its skills." }));
      Object.entries(SK.CATS).filter(([, d]) => d.subj === subj).forEach(([k, d]) => {
        const row = catRow(d.long, E.catScore(S, k)), skills = h("div", { class: "hidden", style: "grid-column:1/-1" });
        SK.list((s) => s.cat === k && !s.stretch).forEach((s) => skills.append(h("div", { class: "skl" }, h("div", { class: "nm small", text: s.name }), starsEl(E.stars(S, s.id)), h("button", { class: "btn small ghost", onclick: () => openSkill(s.id) }, "Go"))));
        row.append(skills); row.style.cursor = "pointer"; row.addEventListener("click", (e) => { if (!e.target.closest("button")) skills.classList.toggle("hidden"); });
        c.append(row);
      });
      main.append(c);
    }
    const date = E.today(), bars = h("div", { class: "days", "aria-label": "Minutes practiced, last 14 days" });
    let maxM = 1; const list = []; for (let i = 13; i >= 0; i--) { const dd = E.addDays(date, -i), v = S.days[dd]; list.push([dd, v]); maxM = Math.max(maxM, v ? v.sec / 60 : 0); }
    list.forEach(([dd, v]) => bars.append(h("div", { class: v && v.q ? "has" : "", style: `height:${Math.max(4, ((v ? v.sec / 60 : 0) / maxM) * 100)}%`, title: `${dayLabel(dd)}: ${v ? fmtMin(v.sec) : 0} min, ${v ? v.q : 0} questions` })));
    main.append(h("div", { class: "card" }, h("h3", { text: "Last 2 weeks" }), bars, h("p", { class: "small muted", text: `Best streak: ${S.streak.best} days · Questions answered: ${Object.values(S.days).reduce((a, d) => a + d.q, 0)}` })));
  }
  function catRow(name, g) {
    const b = E.band(g.score);
    return h("div", { class: "catrow" }, h("b", { text: name }), h("span", { class: "badge " + b.k, text: g.score == null ? (g.n ? "Keep practicing" : "Not started") : `${b.label} · ${g.score}%` }),
      h("div", { class: "meter" + (b.k === "strong" || b.k === "star" ? " mint" : "") }, h("i", { style: `width:${g.score || 0}%` })));
  }
  // School score charts: FAST (with Level bands for the grade) and i-Ready.
  function scoreCharts(list, goals) {
    const wrap = h("div", {});
    const mk = (test, title, lo, hi, bandsFor) => {
      const pts = list.filter((s) => s.test === test && s.score != null);
      const c = h("div", { class: "card", style: "margin-bottom:14px" }, h("h2", { text: title }));
      if (!pts.length) { c.append(h("p", { class: "muted", text: "No scores yet." })); return c; }
      const W = 340, H = 190, x0 = 40, x1 = W - 34, y0 = 160, y1 = 14, X = (i) => (pts.length === 1 ? (x0 + x1) / 2 : x0 + (i / (pts.length - 1)) * (x1 - x0)), Y = (v) => y0 - ((v - lo) / (hi - lo)) * (y0 - y1);
      let svg = "";
      const bands = bandsFor ? bandsFor(pts[pts.length - 1].grade) : null;
      if (bands) bands.forEach(([a, b, lbl, col]) => { const ya = Y(Math.min(Math.max(a, lo), hi)), yb = Y(Math.min(Math.max(b, lo), hi)); svg += `<rect x="${x0}" y="${yb}" width="${x1 - x0}" height="${ya - yb}" fill="${col}" opacity=".35"/><text x="${x1 + 4}" y="${(ya + yb) / 2 + 4}" text-anchor="start" font-size="10.5" font-weight="700" fill="var(--soft)">${lbl.length > 3 ? "" : lbl}</text>${lbl.length > 3 ? `<text x="${x0 + 4}" y="${yb + 12}" font-size="10" font-weight="700" fill="var(--soft)">${lbl}</text>` : ""}`; });
      for (let v = lo; v <= hi; v += (hi - lo) / 4) svg += `<text x="${x0 - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="10.5" fill="var(--soft)">${Math.round(v)}</text>`;
      svg += `<polyline points="${pts.map((p, i) => X(i) + "," + Y(p.score)).join(" ")}" fill="none" stroke="var(--berry)" stroke-width="3" stroke-linejoin="round"/>`;
      pts.forEach((p, i) => { svg += `<circle cx="${X(i)}" cy="${Y(p.score)}" r="5.5" fill="var(--card)" stroke="var(--berry)" stroke-width="3"/><text x="${X(i)}" y="${Y(p.score) - 11}" text-anchor="${pts.length > 1 && i === pts.length - 1 ? "end" : pts.length > 1 && i === 0 ? "start" : "middle"}" font-size="12" font-weight="800" fill="var(--ink)">${p.score}${p.level ? " L" + p.level : ""}</text><text x="${X(i)}" y="${y0 + 16}" text-anchor="${pts.length > 1 && i === pts.length - 1 ? "end" : pts.length > 1 && i === 0 ? "start" : "middle"}" font-size="9.5" fill="var(--soft)">Gr${p.grade} ${esc(p.term.split(" ")[0])}</text>`; });
      c.append(h("div", { html: `<svg class="chart" viewBox="0 0 ${W} ${H + 8}" role="img" aria-label="${esc(title)} scores">${svg}</svg>` }));
      const last = pts[pts.length - 1];
      c.append(h("p", { class: "small", text: `Latest: ${last.score}${last.level ? " (Level " + last.level + ")" : ""} · ${last.term}, grade ${last.grade}` }));
      return c;
    };
    const fastBands = (subj) => (g) => { const cut = SK.FAST_LEVELS[subj][g]; if (!cut || cut[0] == null) return null; const top = { math: 273, reading: 270 }[subj]; return [[cut[0], cut[1], "L2", "var(--oops-soft)"], [cut[1], cut[2], "L3", "var(--lemon-soft)"], [cut[2], cut[3], "L4", "var(--mint-soft)"], [cut[3], top, "L5", "var(--grape-soft)"]]; };
    const irBands = (subj) => (g) => { const b = SK.IREADY_BANDS[subj][g]; return b ? [[b[0], b[1], "Grade " + g + " range (approx.)", "var(--mint-soft)"], [b[1], b[1] + 100, "Above grade " + g, "var(--grape-soft)"]] : null; };
    wrap.append(mk("fast_math", "FAST Math", 190, 260, fastBands("math")), mk("fast_reading", "FAST Reading", 200, 260, fastBands("reading")), mk("iready_math", "i-Ready Math", 440, 560, irBands("math")), mk("iready_reading", "i-Ready Reading", 560, 660, irBands("reading")));
    if (goals && Object.keys(goals).length) wrap.append(h("div", { class: "card flat" }, h("h3", { text: "🎯 Spring goals" }), h("p", { text: [goals.fast_math_level && `FAST Math Level ${goals.fast_math_level}+`, goals.fast_reading_level && `FAST Reading Level ${goals.fast_reading_level}`, goals.iready_math && `i-Ready Math ${goals.iready_math}+`, goals.iready_reading && `i-Ready Reading ${goals.iready_reading}+`].filter(Boolean).join(" · ") })));
    wrap.append(h("p", { class: "small muted", text: "Shaded bands on FAST charts are the official grade-level ranges for the latest grade shown. i-Ready ranges are approximate — the school report shows the exact placement." }));
    return wrap;
  }
  function meSquishies(main) {
    main.append(h("div", { class: "card", style: "margin-bottom:14px" }, h("div", { class: "buddy-zone" }, buddyEl("dance-" + S.move, "big"), h("div", { class: "grow" }, h("h2", { text: (SQ.get(S.buddy) || {}).name || "Your buddy" }), h("p", { class: "muted", text: (SQ.get(S.buddy) || {}).about || "" }), h("p", { class: "small", text: "Tap to squish! Earn 🪙 mochi coins for every answer (even tries count)." })))));
    const moves = h("div", { class: "card", style: "margin-bottom:14px" }, h("h3", { text: "💃 Dance moves" }), h("p", { class: "small muted", text: "Unlock new moves with your best day streak. Your buddy does your move when you finish a mission." }));
    const row = h("div", { class: "row" });
    E.MOVES.forEach(([id, name, need]) => { const got = S.moves.includes(id) || S.streak.best >= need; row.append(h("button", { class: "btn small" + (S.move === id ? " grape" : ""), disabled: got ? null : true, onclick: () => { S.move = id; save(); render(); } }, got ? name : `🔒 ${name} (${need}-day streak)`)); });
    moves.append(row); main.append(moves);
    const grid = h("div", { class: "sq-grid" });
    SQ.list.forEach((s) => {
      const own = S.owned.includes(s.id), can = S.coins >= s.cost;
      grid.append(h("div", { class: "sq-card" + (S.buddy === s.id ? " on" : "") }, h("div", { class: "sqw", html: SQ.svg(s.id, { locked: !own }) }), h("b", { text: s.name }),
        own ? h("button", { class: "btn small" + (S.buddy === s.id ? " primary" : ""), onclick: () => { S.buddy = s.id; save(); render(); } }, S.buddy === s.id ? "Buddy ✓" : "Make buddy")
          : h("button", { class: "btn small", disabled: can ? null : true, onclick: () => { if (S.coins < s.cost) return; S.coins -= s.cost; S.owned.push(s.id); S.buddy = s.id; save(); render(); confetti(); toast(`You adopted ${s.name}! 🎉`); } }, `🪙 ${s.cost}`)));
    });
    main.append(h("h3", { text: "Squishy collection", style: "margin:6px 0 10px" }), grid);
  }
  function meRewards(main) {
    const rk = E.rank(S.xp);
    const ladder = h("div", { class: "card", style: "margin-bottom:14px" }, h("h2", { text: `${rk.icon} ${rk.name}` }),
      rk.next ? h("p", { class: "small", text: `${(rk.next.at - S.xp).toLocaleString()} more coins earned to reach ${rk.next.icon} ${rk.next.name}` }) : h("p", { text: "You reached the top rank! 🌟" }),
      rk.next ? h("div", { class: "meter" }, h("i", { style: `width:${pct(S.xp - rk.at, rk.next.at - rk.at)}%` })) : null,
      h("p", { class: "small muted", text: E.RANKS.map((r) => r[2] + " " + r[1]).join(" → ") }));
    main.append(ladder);
    const forms = h("div", { class: "card", style: "margin-bottom:14px" }, h("h2", { text: "🗡️ Secret Forms" }), h("p", { class: "small muted", text: "Master every skill in an area (2 ⭐ each) to unlock its Form badge and +200 🪙." }), h("div", { class: "grid2", style: "margin-top:10px" },
      E.FORMS.map(([cat, name, em]) => h("div", { class: "form-badge" + (S.forms.includes(cat) ? " got" : "") }, h("span", { class: "em", text: em }), h("div", {}, h("b", { text: name }), h("div", { class: "small muted", text: SK.CATS[cat].name }))))));
    main.append(forms);
    const rw = h("div", { class: "card" }, h("h2", { text: "🎁 Real rewards" }));
    if (!rewardsCfg.length) rw.append(h("p", { class: "muted", text: "Your grown-up hasn't added real rewards yet. Ask them — maybe a new squishy? 😉" }));
    rewardsCfg.forEach((r) => {
      const cost = Number(r.xp) || 0, claimed = S.claims.filter((c) => c.id === r.id).length;
      rw.append(h("div", { class: "skl" }, h("div", { class: "nm" }, h("b", { text: r.label }), h("div", { class: "small muted", text: `🪙 ${cost}${claimed ? " · claimed " + claimed + "×" : ""}` })),
        h("button", { class: "btn small primary", disabled: S.coins >= cost ? null : true, onclick: () => sheet((p, close) => {
          p.append(h("h2", { text: `Claim "${r.label}"?` }), h("p", { text: `This uses ${cost} coins. Your grown-up gets a message.` }), h("div", { class: "row" },
            h("button", { class: "btn primary", onclick: () => { S.coins -= cost; S.claims.push({ id: r.id, label: r.label, cost, at: E.today() }); save(); close(); render(); confetti(); toast("Claimed! Show your grown-up 🎉"); } }, "Yes, claim it!"), h("button", { class: "btn ghost", onclick: close }, "Not yet")));
        }) }, "Claim")));
    });
    main.append(rw);
  }
  function meSettings(main) {
    const c = h("div", { class: "card stack" }, h("h2", { text: "Settings" }));
    const tog = (label, key, after) => { const cb = h("input", { type: "checkbox", checked: S.settings[key] ? true : null, onchange: () => { S.settings[key] = cb.checked; save(); if (after) after(); } }); return h("label", { class: "row", style: "font-weight:700" }, cb, label); };
    c.append(tog("🔊 Sounds", "sound"), tog("🔍 Bigger text", "bigText", () => document.body.classList.toggle("big", !!S.settings.bigText)));
    c.append(h("p", { class: "small muted", text: `Signed in as ${user.email}. Progress saves on this device and online.` }));
    c.append(h("div", { class: "row" }, h("button", { class: "btn", onclick: async () => { await push(); toast(lastPushOk ? "Saved online ✓" : "Couldn't save online — will retry"); } }, "Save now"), h("button", { class: "btn ghost", onclick: async () => { await push(); await sb.auth.signOut(); } }, "Sign out")));
    main.append(c);
  }

  /* ---------- starting sets ---------- */
  function startMission() {
    const date = E.today();
    if (!(S.run && S.run.date === date)) { const m = E.mission(S, date, R()); S.run = { date, items: m.items, i: 0, res: [], plan: m.plan }; save(); }
    startRun({ title: "Today's mission", items: S.run.items, kind: "mission", resume: S.run });
  }
  function startBonus() {
    const weak = E.weakList(S, "math").slice(0, 2), next = E.pathNext(S).id, rr = R();
    const items = [...weak.map((id) => E.practice(S, id, 2, rr)).flat(), ...E.practice(S, next, 2, rr), ...E.wordPower(S, 2, rr)];
    startRun({ title: "Bonus round", items, kind: "practice" });
  }

  /* ---------- the runner ---------- */
  let runner = null;
  function passageOf(pid) { return E.allPassages().find((p) => p.id === pid); }
  function passageBody(p, which) {
    const frag = h("div", {});
    const one = (title, text, genre, features) => {
      const box = h("div", {}, h("h3", { text: title }));
      const t = h("div", { class: "ptxt" });
      let n = 0;
      if (genre === "poetry" || /\n[^\n]/.test(text) && text.split("\n\n").every((b) => b.split("\n").length > 1 && b.split("\n").every((l) => l.length < 70))) {
        text.split(/\n\s*\n/).forEach((st) => t.append(h("div", { class: "poem", html: inline(st) })));
      } else {
        text.split(/\n\s*\n/).forEach((para) => {
          if (/^##\s/.test(para)) { t.append(h("div", { class: "ph", html: inline(para.replace(/^##\s*/, "")) })); return; }
          n++; t.append(h("div", { class: "para" }, h("span", { class: "pn", text: n }), h("div", { html: inline(para).replace(/\n/g, "<br>") })));
        });
      }
      (features || []).forEach((f) => t.append(h("div", { class: "feat" }, h("b", { text: f.kind.replace("-", " ") }), h("span", { html: inline(f.text) }))));
      box.append(t); return box;
    };
    if (p.texts) {
      let w = which || 0; const host = h("div", {});
      const draw = () => { host.textContent = ""; host.append(h("div", { class: "ptabs" }, p.texts.map((t, i) => h("button", { "aria-pressed": String(i === w), onclick: () => { w = i; draw(); } }, "Text " + (i + 1)))), one(p.texts[w].title, p.texts[w].text, p.texts[w].genre || "info", p.texts[w].features)); };
      draw(); frag.append(h("div", { class: "small muted", style: "font-weight:800", text: p.title }), host);
    } else frag.append(one(p.title, p.text, p.genre, p.features));
    return frag;
  }
  function startRun(cfg) {
    if (!cfg.items || !cfg.items.length) { toast("Nothing to practice here yet!"); return; }
    runner = { cfg, items: cfg.items, i: cfg.resume ? cfg.resume.i : 0, res: cfg.resume ? cfg.resume.res : [], coins: 0, startCoins: S.coins, xp0: S.xp, lvUps: 0, folded: true };
    if (runner.i >= runner.items.length) {
      // Every question was answered but the app closed before "Finish": credit the set instead of starting over.
      document.body.append(h("div", { class: "runner", id: "runner" })); return finishRun();
    }
    drawRun();
  }
  function exitRun() {
    if (runner && runner.cfg.kind === "mission" && S.run) { S.run.i = runner.res.length; S.run.res = runner.res; save(); }
    runner = null; $("#runner") && $("#runner").remove(); render();
  }
  function drawRun() {
    const old = $("#runner"); if (old) old.remove();
    const r = runner, it = r.items[r.i];
    const el = h("div", { class: "runner", id: "runner", role: "dialog", "aria-label": r.cfg.title });
    const prog = h("div", { class: "prog", "aria-label": `Question ${r.i + 1} of ${r.items.length}` }, r.items.map((_, k) => h("i", { class: k < r.res.length ? (r.res[k] ? "ok" : "no") : k === r.i ? "cur" : "" })));
    el.append(h("div", { class: "run-top" }, h("button", { class: "btn small ghost", "aria-label": "Take a break", onclick: () => confirmExit() }, "✕"), prog, h("span", { class: "chip coin", text: "🪙 " + S.coins.toLocaleString() })));
    const body = h("div", { class: "run-body" });
    const p = it.pid ? passageOf(it.pid) : null;
    const cols = h("div", { class: "run-cols" + (p ? " has-p" : "") });
    if (p) {
      const pass = h("div", { class: "passage" + (r.folded && r.items[r.i - 1] && r.items[r.i - 1].pid === it.pid ? " folded" : "") }, passageBody(p));
      pass.append(h("button", { class: "btn small pfold", onclick: () => pass.classList.toggle("folded") }, "Show / hide the whole text"));
      cols.append(pass);
    }
    const q = h("div", { class: "qcard" });
    q.append(h("div", { class: "qtag" }, it.tag ? h("span", { class: "chip tag", text: it.tag }) : null, h("span", { class: "chip tag", style: "background:var(--sunk)", text: SK.SKILLS[it.skill].name }), it.stretch ? h("span", { class: "chip tag", style: "background:var(--grape-soft)", text: "🚀 Grade 5" }) : null, h("span", { class: "small muted", text: `${r.i + 1} / ${r.items.length}` })));
    q.append(h("div", { class: "qtext", html: rich(it.q) }));
    if (it.fig) q.append(h("div", { html: it.fig }));
    const state = { resp: it.b ? { a: null, b: null } : Array.isArray(it.a) ? [] : null, checked: false, t0: Date.now(), away: 0, hid: null };
    r.state = state;
    const checkBtn = h("button", { class: "btn primary grow", disabled: true }, "Check");
    const ready = () => { const s = state.resp; checkBtn.disabled = !(it.t ? String(s || "").trim() : it.b ? s.a != null && s.b != null : Array.isArray(it.a) ? s.length === it.a.length : s != null); };
    if (it.t) {
      const inp = h("input", { type: "text", inputmode: matchMedia("(pointer:coarse)").matches ? "none" : "text", autocomplete: "off", "aria-label": "Your answer", placeholder: it.t === "rem" ? "e.g. 12 R3" : "?" });
      inp.addEventListener("input", () => { state.resp = inp.value; ready(); });
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter" && !checkBtn.disabled) checkBtn.click(); });
      const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "/", ".", " ", "R", "⌫", "C"];
      const pad = h("div", { class: "keypad" }, keys.map((k) => h("button", { type: "button", "aria-label": k === " " ? "space" : k === "⌫" ? "backspace" : k === "C" ? "clear" : k, onclick: () => { if (state.checked) return; inp.value = k === "⌫" ? inp.value.slice(0, -1) : k === "C" ? "" : inp.value + k; state.resp = inp.value; ready(); } }, k === " " ? "␣" : k)));
      q.append(h("div", { class: "ans-in" }, inp, it.unit ? h("span", { class: "muted", style: "font-weight:800", text: it.unit }) : null), pad,
        h("p", { class: "small muted", text: "Fractions: type 3/4. Mixed numbers: 1 3/4 (use ␣ for the space)." }));
      state.input = inp;
      setTimeout(() => { if (!matchMedia("(pointer:coarse)").matches) inp.focus(); }, 50);
    } else {
      const multi = Array.isArray(it.a);
      const mkOpts = (opts, part) => {
        const isSym = opts.every((o) => ["<", ">", "="].includes(o)), isTF = opts.length === 2 && opts.join() === "True,False";
        const box = h("div", { class: "opts" + (isSym ? " sym" : isTF ? " tf" : ""), role: multi ? "group" : "radiogroup" });
        opts.forEach((o, k) => {
          const b = h("button", { class: "opt", type: "button", role: multi ? "checkbox" : "radio", "aria-checked": "false" }, h("span", { class: "lt", text: isSym || isTF ? "" : "ABCDE"[k] }), h("span", { html: inline(o) }));
          if (isSym || isTF) b.firstChild.remove();
          b.addEventListener("click", () => {
            if (state.checked) return;
            if (multi) { const i = state.resp.indexOf(k); if (i >= 0) state.resp.splice(i, 1); else { if (state.resp.length >= it.a.length) state.resp.shift(); state.resp.push(k); } }
            else if (part) state.resp[part] = k; else state.resp = k;
            box.querySelectorAll(".opt").forEach((x, j) => { const on = multi ? state.resp.includes(j) : (part ? state.resp[part] : state.resp) === j; x.classList.toggle("sel", on); x.setAttribute("aria-checked", String(on)); });
            ready();
          });
          box.append(b);
        });
        return box;
      };
      if (it.b) {
        q.append(h("p", { style: "font-weight:800;margin-top:12px", text: "Part A" }), mkOpts(it.o, "a"));
        const pb = h("div", { class: "partb" }, h("p", { style: "font-weight:800", text: "Part B" }), h("div", { class: "qtext", html: rich(it.b.q) }), mkOpts(it.b.o, "b"));
        q.append(pb); state.boxA = q.querySelectorAll(".opts")[0]; state.boxB = pb.querySelector(".opts");
      } else { const box = mkOpts(it.o); q.append(box); state.boxA = box; }
    }
    const fbHost = h("div", {}); q.append(fbHost);
    cols.append(q); body.append(cols); el.append(body);
    const foot = h("div", { class: "run-foot" }, h("div", { class: "in" }, checkBtn));
    el.append(foot);
    checkBtn.addEventListener("click", () => {
      if (state.checked) return next();
      state.checked = true;
      const ok = E.check(it, state.resp), half = !ok && E.partial(it, state.resp);
      const secs = (Date.now() - state.t0 - state.away) / 1000;
      const res = E.record(S, it, ok ? true : half ? "half" : false, Math.min(secs, 300));
      if (it.pid) { const pp = (S.passages[it.pid] = S.passages[it.pid] || { at: E.today(), n: 0, c: 0 }); pp.n++; pp.c += ok ? 1 : 0; pp.at = E.today(); }
      r.res.push(ok); r.coins += res.coins; if (res.leveled > 0) r.lvUps++;
      if (r.cfg.kind === "mission" && S.run) { S.run.i = r.i + 1; S.run.res = r.res; }
      save(); ding(ok);
      coinPop(checkBtn, res.coins);
      showFeedback(it, state, ok, half, fbHost, res);
      prog.children[r.i].className = ok ? "ok" : "no";
      checkBtn.textContent = r.i + 1 < r.items.length ? "Next ▶" : "Finish 🎉"; checkBtn.disabled = false;
      el.querySelector(".run-top .chip").textContent = "🪙 " + S.coins.toLocaleString();
      setTimeout(() => fbHost.scrollIntoView({ behavior: "smooth", block: "nearest" }), 60);
    });
    $("#app").after(el);
    el.scrollTop = 0;
  }
  function next() { runner.i++; if (runner.i >= runner.items.length) return finishRun(); drawRun(); }
  document.addEventListener("visibilitychange", () => { const st = runner && runner.state; if (!st) return; if (document.hidden) st.hid = Date.now(); else if (st.hid) { st.away += Date.now() - st.hid; st.hid = null; } });
  function confirmExit() {
    sheet((p, close) => {
      p.append(h("h2", { text: "Take a break?" }), h("p", { text: runner.cfg.kind === "mission" ? "Your mission is saved — you can keep going later today." : "You can come back any time. Your answers so far are saved." }),
        h("div", { class: "row" }, h("button", { class: "btn primary", onclick: () => { close(); } }, "Keep going"), h("button", { class: "btn", onclick: () => { close(); exitRun(); } }, "Take a break")));
    });
  }
  const YAY = ["Squish-tastic!", "Nailed it!", "You're on fire! 🔥", "Brilliant!", "Super squishy smart!", "Yes! 🎉", "Awesome dance move! 💃", "Perfect!"];
  const OOPS = ["Not quite — let's see why.", "Good try! Here's the trick.", "Almost! Let's look closer.", "That's a tricky one. Here's how it works."];
  function showFeedback(it, state, ok, half, host, res) {
    // mark options / input
    const mark = (box, opts, right, chosen) => { if (!box) return; box.querySelectorAll(".opt").forEach((b, j) => { b.disabled = true; const isR = Array.isArray(right) ? right.includes(j) : right === j, isC = Array.isArray(chosen) ? chosen.includes(j) : chosen === j; if (isR) b.classList.add("right"); else if (isC) b.classList.add("wrong"); }); };
    if (it.t) { state.input.readOnly = true; state.input.classList.add(ok ? "right" : "wrong"); }
    else if (it.b) { mark(state.boxA, it.o, it.a, state.resp.a); mark(state.boxB, it.b.o, it.b.a, state.resp.b); }
    else mark(state.boxA, it.o, it.a, state.resp);
    const sk = SK.SKILLS[it.skill];
    const fb = h("div", { class: "feedback " + (ok ? "ok" : half ? "half" : "no") });
    fb.append(h("h3", { text: ok ? YAY[Math.floor(Math.random() * YAY.length)] : half ? "Part A is right! Part B was tricky." : OOPS[Math.floor(Math.random() * OOPS.length)] }));
    if (!ok && it.t) fb.append(h("p", { html: "<b>Answer:</b> " + inline(it.ans.includes("/") ? "[[" + it.ans + "]]" : it.ans) + (it.unit ? " " + esc(it.unit) : "") }));
    fb.append(h("div", { html: rich(it.e) }));
    if (it.efig) fb.append(h("div", { html: it.efig }));
    if (!ok) fb.append(h("div", { class: "tip", html: "<b>Remember:</b> " + inline(sk.tip) }));
    if (res.leveled > 0) fb.append(h("p", { style: "font-weight:800;margin-top:8px", text: `⬆️ Level up! ${sk.name} questions get a little harder now.` }));
    host.append(fb);
  }
  function coinPop(anchor, n) { const r = anchor.getBoundingClientRect(), d = h("div", { class: "coin-pop", text: "+" + n + " 🪙", style: `left:${r.left + r.width / 2 - 40}px;top:${r.top - 40}px` }); document.body.append(d); setTimeout(() => d.remove(), 1100); }
  function confetti() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = h("div", { class: "confetti" }), cols = ["#FF9DB7", "#C9A7FF", "#9FD8FF", "#FFD166", "#7DD3B8"];
    for (let i = 0; i < 70; i++) c.append(h("i", { style: `left:${Math.random() * 100}%;background:${cols[i % 5]};animation-duration:${1.6 + Math.random() * 1.6}s;animation-delay:${Math.random() * 0.5}s;transform:rotate(${Math.random() * 360}deg)` }));
    document.body.append(c); setTimeout(() => c.remove(), 3800);
  }
  function finishRun() {
    const r = runner, right = r.res.filter(Boolean).length, n = r.res.length, date = E.today(), notes = [];
    const rk0 = E.rank(r.xp0);
    if (r.cfg.kind === "mission") {
      const d = E.day(S, date), first = !d.set; d.set = 1; d.sets = (d.sets || 0) + 1; S.run = null;
      if (first) { const bonus = 50 + 5 * Math.min(S.streak.cur, 10); E.earn(S, bonus, date); r.coins += bonus; notes.push(`🎯 Mission bonus +${bonus} 🪙`); }
    } else if (n >= 4 && right / n >= 0.8) { E.earn(S, 20, date); r.coins += 20; notes.push("🌟 Great set bonus +20 🪙"); }
    E.unlockMoves(S).forEach((m) => notes.push(`💃 New dance move: ${(E.MOVES.find((x) => x[0] === m) || [])[1]}!`));
    E.checkForms(S).forEach((f) => notes.push(`🗡️ You unlocked ${f}! +200 🪙`));
    const rk1 = E.rank(S.xp); if (rk1.i > rk0.i) notes.push(`${rk1.icon} New rank: ${rk1.name}!`);
    if (r.lvUps) notes.push(`⬆️ ${r.lvUps} skill${r.lvUps > 1 ? "s" : ""} leveled up`);
    save(); push();
    const el = $("#runner"); el.textContent = "";
    const msg = right === n ? "PERFECT! Every single one! 🏆" : right / n >= 0.8 ? "Amazing work!" : right / n >= 0.6 ? "Nice job — you're getting stronger!" : "You kept going — that's what champions do!";
    el.append(h("div", { class: "run-body" }, h("div", { class: "done-wrap stack" },
      h("div", { class: "buddy", html: SQ.svg(S.buddy || "mochi", { cls: "dance-" + S.move }) }),
      h("h1", { text: r.cfg.kind === "mission" ? "Mission complete!" : "Set complete!" }),
      h("div", { class: "big-num", text: `${right} / ${n}` }), h("p", { style: "font-weight:800", text: msg }),
      h("p", { class: "chip coin", style: "font-size:18px", text: `+${r.coins} 🪙 mochi coins` }),
      ...notes.map((t) => h("p", { style: "font-weight:700", text: t })),
      h("div", { class: "row", style: "justify-content:center;margin-top:10px" }, h("button", { class: "btn primary", onclick: () => exitRun() }, "Back home"),
        r.cfg.kind !== "mission" ? null : h("button", { class: "btn", onclick: () => { exitRun(); go("me", "squishies"); } }, "🧸 My squishies")))));
    confetti(); ding(true);
  }

  /* ---------- Parent view (admin) ---------- */
  async function renderParent() {
    app.textContent = "";
    const shell = h("div", { class: "shell pv", style: "padding-bottom:40px" });
    shell.append(h("div", { class: "topbar" }, h("div", { class: "who", text: "👪 FAST Prep · Parent view" }), h("a", { class: "btn small", href: "../" }, "PSAT/SAT dashboard"), h("button", { class: "btn small ghost", onclick: () => sb.auth.signOut() }, "Sign out")));
    app.append(shell);
    const [{ data: ls }, { data: ps }, { data: sc }, { data: fbs }] = await Promise.all([sb.from("fast_learners").select("*"), sb.from("fast_progress").select("*"), sb.from("fast_scores").select("*").order("taken_on"), sb.from("fast_feedback").select("*")]);
    if (!ls || !ls.length) { shell.append(h("p", { text: "No FAST learners yet. Add a row to public.fast_learners in Supabase." })); return; }
    for (const L of ls) {
      const row = (ps || []).find((p) => p.user_id === L.user_id), D = E.normalize(row ? row.data : null), mine = (sc || []).filter((s) => s.user_id === L.user_id);
      const fbm = Object.fromEntries((fbs || []).filter((f) => f.user_id === L.user_id).map((f) => [f.essay_id, f]));
      shell.append(await parentCard(L, D, row, mine, fbm));
    }
  }
  async function parentCard(L, D, row, mine, fbm) {
    const card = h("section", { class: "stack", style: "margin-bottom:30px" });
    const date = E.today(), d = D.days[date] || { q: 0, c: 0, sec: 0, set: 0, sub: {} };
    card.append(h("h1", { text: `${L.first_name} · Grade ${L.grade}` }), h("p", { class: "muted small", text: `${L.school || ""} · last synced ${row ? new Date(row.updated_at).toLocaleString() : "never"}` }));
    card.append(h("div", { class: "kpis" },
      [["Today", d.set ? "✅ mission" : d.q ? "practiced" : "—"], ["Minutes today", fmtMin(d.sec)], ["Right today", d.q ? `${d.c}/${d.q} (${pct(d.c, d.q)}%)` : "—"], ["Streak", `${D.streak.last >= E.addDays(date, -1) ? D.streak.cur : 0} days (best ${D.streak.best})`], ["Coins", `${D.coins} (earned ${D.xp})`], ["Rank", E.rank(D.xp).name]].map(([k, v]) => h("div", { class: "kpi" }, h("span", { text: k }), h("b", { text: v })))));
    // 14 days
    const t = h("table", {}, h("tr", {}, ["Day", "Mission", "Min", "Qs", "Right", "Math", "Reading", "Writing", "Level Up"].map((x) => h("th", { text: x }))));
    for (let i = 0; i < 14; i++) {
      const dd = E.addDays(date, -i), v = D.days[dd]; if (!v) { t.append(h("tr", {}, h("td", { text: dayLabel(dd) }), h("td", { class: "muted", text: "—", colspan: "8" }))); continue; }
      const s = (k) => (v.sub[k] ? `${v.sub[k][1]}/${v.sub[k][0]}` : "");
      t.append(h("tr", {}, [dayLabel(dd), v.set ? "✅" : "", fmtMin(v.sec), v.q, v.q ? pct(v.c, v.q) + "%" : "", s("math"), s("reading"), s("writing") + (v.essays ? ` ✍️${v.essays}` : ""), s("stretch")].map((x, j) => h("td", { class: j > 1 ? "num" : "", text: x }))));
    }
    card.append(h("div", { class: "card" }, h("h2", { text: "Last 14 days" }), h("div", { style: "overflow:auto" }, t)));
    // FAST + i-Ready areas vs school
    const latest = (test) => mine.filter((s) => s.test === test).slice(-1)[0];
    const ct = h("table", {}, h("tr", {}, ["FAST reporting category", "Practice", "Tries", "Skills practiced"].map((x) => h("th", { text: x }))));
    Object.entries(SK.CATS).forEach(([k, c]) => { const g = E.catScore(D, k); ct.append(h("tr", {}, h("td", { text: c.long }), h("td", { class: "num", text: g.score == null ? "—" : g.score + "% · " + E.band(g.score).label }), h("td", { class: "num", text: g.n }), h("td", { class: "num", text: `${g.practiced}/${g.total}` }))); });
    const it2 = h("table", {}, h("tr", {}, ["i-Ready domain", "Practice", "Tries"].map((x) => h("th", { text: x }))));
    Object.entries(SK.IREADY).forEach(([k, c]) => { const g = E.irScore(D, k); it2.append(h("tr", {}, h("td", { text: c.name }), h("td", { class: "num", text: g.score == null ? "—" : g.score + "%" }), h("td", { class: "num", text: g.n }))); });
    const lm = latest("fast_math"), lr = latest("fast_reading"), im = latest("iready_math"), ir = latest("iready_reading");
    card.append(h("div", { class: "card" }, h("h2", { text: "Skill areas vs. school scores" }),
      h("p", { class: "small", text: `Latest school: FAST Math ${lm ? lm.score + " (L" + (lm.level || "?") + ")" : "—"} · FAST Reading ${lr ? lr.score + " (L" + (lr.level || "?") + ")" : "—"} · i-Ready Math ${im ? im.score : "—"} · i-Ready Reading ${ir ? ir.score : "—"}` }),
      h("p", { class: "small muted", text: "Practice % is accuracy on recent questions (last 10 per skill), weighted by tries. Aim for 80%+ (\"Strong\") across categories for Level 4–5 readiness." }),
      h("div", { style: "overflow:auto" }, ct), h("div", { style: "overflow:auto;margin-top:12px" }, it2)));
    // skills
    const sk = SK.list((s) => D.skills[s.id] && D.skills[s.id].n).map((s) => [s, E.score(D, s.id), D.skills[s.id]]);
    const weak = sk.filter((x) => x[1] != null).sort((a, b) => a[1] - b[1]).slice(0, 6), strong = sk.filter((x) => x[1] != null).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const sl = (arr) => h("ul", {}, arr.map(([s, sc2, st]) => h("li", { text: `${s.name} — ${sc2}% (${st.n} tries, level ${st.lv}/3${s.stretch ? ", grade 5" : ""})` })));
    card.append(h("div", { class: "card" }, h("h2", { text: "Skills" }), h("div", { class: "grid2" }, h("div", {}, h("h3", { text: "Needs work" }), weak.length ? sl(weak) : h("p", { class: "muted", text: "Not enough practice yet." })), h("div", {}, h("h3", { text: "Strongest" }), strong.length ? sl(strong) : h("p", { class: "muted", text: "—" }))),
      h("p", { class: "small muted", text: `Math path is at: ${E.pathNext(D).name}. Missed recently: ${D.fixit.map((id) => SK.SKILLS[id] ? SK.SKILLS[id].name : id).join(", ") || "none"}.` })));
    // essays + feedback
    const es = h("div", { class: "card" }, h("h2", { text: "Essays" }));
    if (!D.essays.length) es.append(h("p", { class: "muted", text: "No essays yet. She can write one from the Writing tab (weekly is a good rhythm)." }));
    D.essays.slice().reverse().forEach((e) => {
      const f = fbm[e.id] || { scores: {}, note: "" };
      const sel = (k, max) => { const s = h("select", {}, h("option", { value: "", text: "–" }), ...Array.from({ length: max + 1 }, (_, i) => h("option", { value: String(i), text: String(i), selected: String(f.scores[k]) === String(i) ? true : null }))); return s; };
      const so = sel("w.org", 4), se = sel("w.evid", 4), scv = sel("w.conv", 2), note = h("textarea", { rows: "2", placeholder: "A kind note: one thing she did well and one thing to try next time" }); note.value = f.note || "";
      const msg = h("span", { class: "small muted" });
      es.append(h("details", { style: "border-bottom:1px solid var(--line);padding:10px 0" }, h("summary", { style: "cursor:pointer;font-weight:800", text: `${e.title} · ${dayLabel(e.at)} · ${e.words} words · self-check ${scoreTotal(e.self)}/10${fbm[e.id] ? " · you scored " + scoreTotal(f.scores) + "/10" : ""}` }),
        h("div", { class: "essay-view", text: e.text }),
        h("div", { class: "row", style: "margin-top:8px" }, h("label", {}, "Purpose & Org (0–4) ", so), h("label", {}, "Evidence (0–4) ", se), h("label", {}, "Conventions (0–2) ", scv)), note,
        h("div", { class: "row" }, h("button", { class: "btn small primary", onclick: async () => {
          const scores2 = { "w.org": so.value === "" ? null : +so.value, "w.evid": se.value === "" ? null : +se.value, "w.conv": scv.value === "" ? null : +scv.value };
          const { error } = await sb.from("fast_feedback").upsert({ user_id: L.user_id, essay_id: e.id, scores: scores2, note: note.value.trim() || null, updated_at: new Date().toISOString() }, { onConflict: "user_id,essay_id" });
          msg.textContent = error ? "Couldn't save: " + error.message : "Saved — she'll see it on her Writing tab.";
        } }, "Save score"), msg)));
    });
    card.append(es);
    // school scores
    const sct = h("table", {}, h("tr", {}, ["Test", "Grade", "Term", "Date", "Score", "Level", ""].map((x) => h("th", { text: x }))));
    const NAMES = { fast_math: "FAST Math", fast_reading: "FAST Reading", fast_writing: "FAST Writing", iready_math: "i-Ready Math", iready_reading: "i-Ready Reading" };
    mine.forEach((s) => sct.append(h("tr", {}, h("td", { text: NAMES[s.test] }), h("td", { text: s.grade }), h("td", { text: s.term }), h("td", { text: s.taken_on || "" }), h("td", { class: "num", text: s.score ?? "" }), h("td", { class: "num", text: s.level ?? "" }),
      h("td", {}, h("button", { class: "btn small ghost", onclick: async () => { if (!confirm(`Delete ${NAMES[s.test]} ${s.term}?`)) return; await sb.from("fast_scores").delete().eq("id", s.id); renderParent(); } }, "✕")))));
    const fTest = h("select", {}, Object.entries(NAMES).map(([k, v]) => h("option", { value: k, text: v }))), fGrade = h("input", { value: L.grade, size: "2" }), fTerm = h("input", { placeholder: "PM2 (winter)" }), fDate = h("input", { type: "date", value: date }), fScore = h("input", { type: "number", placeholder: "Score" }), fLevel = h("input", { type: "number", min: "1", max: "5", placeholder: "Level" }), smsg = h("span", { class: "small muted" });
    fScore.addEventListener("input", () => { const subj = fTest.value === "fast_math" ? "math" : fTest.value === "fast_reading" ? "reading" : null; const lv = subj ? SK.fastLevel(subj, fGrade.value, +fScore.value) : null; if (lv) fLevel.value = lv; });
    card.append(h("div", { class: "card" }, h("h2", { text: "School scores" }), h("div", { style: "overflow:auto" }, sct),
      h("h3", { text: "Add a new score", style: "margin-top:14px" }), h("div", { class: "row" }, fTest, fGrade, fTerm, fDate, fScore, fLevel,
        h("button", { class: "btn small primary", onclick: async () => {
          if (!fTerm.value.trim() || !fScore.value) { smsg.textContent = "Add a term and a score."; return; }
          const { error } = await sb.from("fast_scores").insert({ user_id: L.user_id, test: fTest.value, grade: fGrade.value.trim() || L.grade, term: fTerm.value.trim(), taken_on: fDate.value || null, score: +fScore.value, level: fLevel.value ? +fLevel.value : null });
          if (error) smsg.textContent = error.message; else renderParent();
        } }, "Add"), smsg),
      h("p", { class: "small muted", text: "FAST levels fill in automatically from the official grade 3–5 cut scores (grade 3 reading: enter the level from the report)." })));
    card.append(scoreCharts(mine, L.goals));
    // goals
    const g = L.goals || {}, gi = (k, ph) => { const i = h("input", { type: "number", value: g[k] ?? "", placeholder: ph, style: "width:110px" }); i.dataset.k = k; return i; };
    const gIns = [gi("fast_math_level", "4"), gi("fast_reading_level", "5"), gi("iready_math", "500"), gi("iready_reading", "620")], gmsg = h("span", { class: "small muted" });
    card.append(h("div", { class: "card" }, h("h2", { text: "Spring goals" }), h("div", { class: "row" }, h("label", {}, "FAST Math level ", gIns[0]), h("label", {}, "FAST Reading level ", gIns[1]), h("label", {}, "i-Ready Math ", gIns[2]), h("label", {}, "i-Ready Reading ", gIns[3])),
      h("div", { class: "row", style: "margin-top:8px" }, h("button", { class: "btn small primary", onclick: async () => { const goals = {}; gIns.forEach((i) => { if (i.value) goals[i.dataset.k] = +i.value; }); const { error } = await sb.from("fast_learners").update({ goals }).eq("user_id", L.user_id); gmsg.textContent = error ? error.message : "Saved."; } }, "Save goals"), gmsg),
      h("p", { class: "small muted", text: "She sees these on her School scores screen. Her i-Ready report lists her personal Typical and Stretch Growth targets — those are good numbers to use here." })));
    // rewards
    const rw = Array.isArray(L.rewards) ? L.rewards : [];
    const list = h("div", {}), rmsg = h("span", { class: "small muted" });
    const addRow = (r) => { const lab = h("input", { value: r.label || "", placeholder: "e.g. A new squishy", style: "flex:1;min-width:160px" }), cost = h("input", { type: "number", value: r.xp || 500, style: "width:100px" }); const rowEl = h("div", { class: "row", style: "margin:6px 0" }, lab, cost, h("span", { class: "small muted", text: "coins" }), h("button", { class: "btn small ghost", onclick: () => rowEl.remove() }, "✕")); rowEl._get = () => ({ id: r.id || "r" + Math.random().toString(36).slice(2, 8), label: lab.value.trim(), xp: Math.max(1, +cost.value || 1) }); list.append(rowEl); };
    rw.forEach(addRow);
    card.append(h("div", { class: "card" }, h("h2", { text: "Real-world rewards" }), h("p", { class: "small muted", text: "She earns ~10 coins per right answer, ~150–250 per day with the mission. So 1,000 coins ≈ a week of steady work." }), list,
      h("div", { class: "row" }, h("button", { class: "btn small", onclick: () => addRow({}) }, "+ Add reward"), h("button", { class: "btn small primary", onclick: async () => {
        const items = [...list.children].map((x) => x._get()).filter((x) => x.label);
        const { error } = await sb.from("fast_learners").update({ rewards: items }).eq("user_id", L.user_id); rmsg.textContent = error ? error.message : "Saved — she sees them under Me → Rewards.";
      } }, "Save rewards"), rmsg),
      h("h3", { text: "Claimed", style: "margin-top:12px" }), D.claims.length ? h("ul", {}, D.claims.slice().reverse().map((c) => h("li", { text: `${dayLabel(c.at)} — ${c.label} (${c.cost} coins)` }))) : h("p", { class: "muted", text: "Nothing claimed yet." })));
    return card;
  }

  boot();
})();
