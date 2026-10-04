// End-to-end browser test for FAST Prep with an in-memory fake of the Supabase endpoints it uses.
// Run: NODE_PATH=$(npm root -g) node test/e2e-fast.js   (uses the Chromium Playwright finds; screenshots go to $SHOTS or /tmp)
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, ".."), SHOTS = process.env.SHOTS || "/tmp/fast-shots";
fs.mkdirSync(SHOTS, { recursive: true });
const SUPA = "https://frdcgfafsumdqjbjdhmf.supabase.co";
const KID = { id: "11111111-1111-4111-8111-111111111111", email: "kid@example.com" }, PARENT = { id: "22222222-2222-4222-8222-222222222222", email: "parent@example.com" };

const db = {
  fast_learners: [{ user_id: KID.id, first_name: "Prayaga", grade: "4", school: "Bryant Elementary", active: true, goals: { fast_math_level: 4, iready_math: 500 }, rewards: [{ id: "r1", label: "A new squishy", xp: 50 }] }],
  fast_progress: [], fast_feedback: [], reward_config: [{ user_id: KID.id, rewards: [{ id: "r1", label: "A new squishy", xp: 50 }] }],
  fast_scores: [
    { id: 1, user_id: KID.id, test: "fast_math", grade: "3", term: "PM2 (winter)", taken_on: "2025-12-10", score: 218, level: 4 },
    { id: 2, user_id: KID.id, test: "fast_math", grade: "3", term: "PM3 (spring)", taken_on: "2026-05-05", score: 240, level: 5 },
    { id: 3, user_id: KID.id, test: "fast_math", grade: "4", term: "PM1 (fall)", taken_on: "2026-09-15", score: 216, level: 3 },
    { id: 4, user_id: KID.id, test: "fast_reading", grade: "4", term: "PM1 (fall)", taken_on: "2026-09-15", score: 236, level: 4 },
    { id: 5, user_id: KID.id, test: "iready_math", grade: "4", term: "Fall diagnostic (Aug)", taken_on: "2026-08-20", score: 479, level: null },
    { id: 6, user_id: KID.id, test: "iready_reading", grade: "4", term: "Fall diagnostic (Aug)", taken_on: "2026-08-20", score: 607, level: null }]
};
const calls = [];
let who = null;
function filterRows(rows, params) {
  for (const [k, v] of params) { if (["select", "order", "on_conflict", "limit"].includes(k)) continue; const m = /^eq\.(.*)$/.exec(v); if (m) rows = rows.filter((r) => String(r[k]) === m[1]); }
  return rows;
}
async function fake(route) {
  const req = route.request(), url = new URL(req.url()), p = url.pathname, method = req.method();
  const body = req.postData() ? (() => { try { return JSON.parse(req.postData()); } catch (e) { return req.postData(); } })() : null;
  calls.push({ method, p: p + url.search, body });
  const json = (o, status = 200, headers = {}) => route.fulfill({ status, contentType: "application/json", headers: Object.assign({ "access-control-allow-origin": "*" }, headers), body: JSON.stringify(o) });
  if (method === "OPTIONS") return route.fulfill({ status: 200, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
  if (p === "/auth/v1/token") {
    const u = body.email === PARENT.email ? PARENT : body.email === KID.email ? KID : null;
    if (!u || body.password !== "secret123") return json({ error: "invalid_grant", error_description: "Invalid login credentials", msg: "Invalid login credentials", code: "invalid_credentials" }, 400);
    who = u;
    const user = { id: u.id, aud: "authenticated", role: "authenticated", email: u.email, email_confirmed_at: "2026-01-01T00:00:00Z", app_metadata: { provider: "email" }, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" };
    return json({ access_token: "tok-" + u.id, token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: "r-" + u.id, user });
  }
  if (p === "/auth/v1/logout") { who = null; return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*" } }); }
  if (p === "/auth/v1/user") return json({ id: who.id, email: who.email, aud: "authenticated", role: "authenticated" });
  if (p.startsWith("/rest/v1/rpc/")) {
    const fn = p.slice(13);
    if (fn === "is_admin") return json(who && who.id === PARENT.id);
    if (fn === "admin_get_rewards") return json((db.reward_config.find((r) => r.user_id === body.p_user) || {}).rewards || []);
    if (fn === "admin_set_rewards") { const r = db.reward_config.find((x) => x.user_id === body.p_user); if (r) r.rewards = body.p_rewards; else db.reward_config.push({ user_id: body.p_user, rewards: body.p_rewards }); return json(null); }
    return json({ message: "no fn " + fn }, 404);
  }
  if (p.startsWith("/rest/v1/")) {
    const table = p.slice(9), rows = db[table]; if (!rows) return json({ message: "no table " + table }, 404);
    const isAdmin = who && who.id === PARENT.id;
    const visible = () => rows.filter((r) => isAdmin || r.user_id === (who && who.id));
    const accept = req.headers()["accept"] || "";
    if (method === "GET") {
      let out = filterRows(visible(), url.searchParams);
      if (/vnd\.pgrst\.object/.test(accept)) return out.length ? json(out[0]) : json({ code: "PGRST116", message: "0 rows" }, 406);
      return json(out);
    }
    if (method === "POST") {
      const list = Array.isArray(body) ? body : [body], keyCols = (url.searchParams.get("on_conflict") || "user_id").split(",");
      for (const row of list) {
        if (table === "fast_progress" && (row.user_id !== who.id || !db.fast_learners.some((l) => l.user_id === who.id))) return json({ message: "new row violates row-level security policy" }, 403);
        if (["fast_scores", "fast_feedback"].includes(table) && !isAdmin) return json({ message: "row-level security" }, 403);
        if (table === "fast_scores") row.id = Math.max(0, ...rows.map((r) => r.id)) + 1;
        const i = rows.findIndex((r) => table !== "fast_scores" && keyCols.every((k) => r[k] === row[k]));
        if (i >= 0) rows[i] = Object.assign(rows[i], row); else rows.push(row);
      }
      return json(list, 201);
    }
    if (method === "PATCH") { if (!isAdmin) return json({ message: "rls" }, 403); filterRows(rows, url.searchParams).forEach((r) => Object.assign(r, body)); return json([], 200); }
    if (method === "DELETE") { if (!isAdmin) return json({ message: "rls" }, 403); const del = new Set(filterRows(rows, url.searchParams)); db[table] = rows.filter((r) => !del.has(r)); return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*" } }); }
  }
  return json({ message: "unhandled " + p }, 404);
}
const TYPES = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".webmanifest": "application/manifest+json" };
async function serveStatic(route) {
  const u = new URL(route.request().url()); let f = path.join(ROOT, decodeURIComponent(u.pathname.replace(/^\/psat-sprint/, "")));
  if (f.endsWith("/")) f += "index.html";
  if (!fs.existsSync(f)) return route.fulfill({ status: 404, body: "nf" });
  return route.fulfill({ status: 200, contentType: TYPES[path.extname(f)] || "application/octet-stream", body: fs.readFileSync(f) });
}

let failures = 0;
const ok = (cond, msg) => { console.log((cond ? "  ✓ " : "  ✗ ") + msg); if (!cond) failures++; };

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  for (const vp of [{ name: "phone", width: 390, height: 844, touch: true }, { name: "desktop", width: 1280, height: 860, touch: false }]) {
    console.log(`\n== ${vp.name} ==`);
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: vp.touch, isMobile: vp.touch, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push("console: " + m.text()); });
    await ctx.route("https://fonts.googleapis.com/**", (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
    await ctx.route("https://fonts.gstatic.com/**", (r) => r.fulfill({ status: 404, body: "" }));
    await ctx.route(SUPA + "/**", fake);
    await ctx.route("https://app.local/**", serveStatic);
    const shot = (n) => page.screenshot({ path: `${SHOTS}/${vp.name}-${n}.png`, fullPage: false });
    const noHScroll = async (label) => { const w = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); ok(w <= 1, `${label}: no sideways scroll (${w}px)`); };

    // --- sign in as the kid
    await page.goto("https://app.local/psat-sprint/fast/");
    await page.waitForSelector("input[type=email]");
    await shot("01-signin");
    await page.fill("input[type=email]", KID.email); await page.fill("input[type=password]", "wrong");
    await page.click("button[type=submit]"); await page.waitForSelector(".err:not(:empty)");
    ok(/isn't right/.test(await page.textContent(".err")), "wrong password shows a friendly message");
    await page.fill("input[type=password]", "secret123"); await page.click("button[type=submit]");
    await page.waitForSelector(".sq-grid", { timeout: 15000 });
    await shot("02-pick-buddy");
    await page.click(".sq-card >> nth=0");
    await page.waitForSelector(".mission");
    ok((await page.textContent(".who")).includes("Prayaga"), "greets her by name");
    await shot("03-home"); await noHScroll("home");

    // --- daily mission: answer everything (about 2/3 right), check feedback, finish
    await page.click(".mission .btn.primary");
    await page.waitForSelector("#runner .qcard");
    let n = 0, sawPassage = false, sawTyped = false, sawTwoPart = false, sawChoose2 = false, sawFig = false;
    for (let guard = 0; guard < 30; guard++) {
      const done = await page.$(".done-wrap"); if (done) break;
      const it = await page.evaluate(() => { const r = window.__fast.S.run; return r ? r.items[r.i] : null; });
      const right = n % 3 !== 2;
      if (await page.$("#runner .passage")) sawPassage = true;
      if (await page.$("#runner .qcard svg.fig")) sawFig = true;
      if (it.t) {
        sawTyped = true;
        const val = right ? it.ans : "999999";
        if (vp.touch) { for (const ch of val) await page.click(`#runner .keypad button[aria-label="${ch === " " ? "space" : ch}"]`); }
        else await page.fill("#runner .ans-in input", val);
      } else if (it.b) {
        sawTwoPart = true;
        await page.click(`#runner .opts >> nth=0 >> .opt >> nth=${it.a}`);
        await page.click(`#runner .opts >> nth=1 >> .opt >> nth=${right ? it.b.a : (it.b.a + 1) % 4}`);
      } else if (Array.isArray(it.a)) {
        sawChoose2 = true;
        const picks = right ? it.a : [0, 1].includes(it.a[0]) && [0, 1].includes(it.a[1]) ? [2, 3] : [0, 1];
        for (const k of picks) await page.click(`#runner .opts .opt >> nth=${k}`);
      } else await page.click(`#runner .opts .opt >> nth=${right ? it.a : (it.a + 1) % it.o.length}`);
      if (n === 0) await shot("04-question");
      await page.click("#runner .run-foot .btn");
      await page.waitForSelector("#runner .feedback");
      const cls = await page.getAttribute("#runner .feedback", "class");
      if (!(it.b && !right)) ok(cls.includes(right ? "ok" : "no"), `Q${n + 1} (${it.skill}${it.t ? ", typed" : it.b ? ", two-part" : Array.isArray(it.a) ? ", choose two" : ""}) marked ${right ? "right" : "wrong"}`);
      else ok(cls.includes("half"), `Q${n + 1} two-part: Part A right, Part B wrong → partial credit`);
      if (n === 2) await shot("05-feedback-wrong");
      if (sawPassage && n < 8) await shot("06-passage");
      if (n === 3) { await noHScroll("question screen"); }
      // take a break mid-way once, then resume from Home
      if (n === 4) {
        await page.click("#runner .run-top .btn"); await page.click("#sheet .btn:has-text('Take a break')");
        await page.waitForSelector(".mission"); ok((await page.textContent(".mission")).includes("5 of"), "mission progress saved after a break");
        await page.click(".mission .btn.primary"); await page.waitForSelector("#runner .qcard"); n++; continue;
      }
      await page.click("#runner .run-foot .btn");
      n++;
    }
    await page.waitForSelector(".done-wrap");
    await shot("07-mission-done");
    const S = await page.evaluate(() => window.__fast.S);
    const today = await page.evaluate(() => window.__fast.E.today());
    ok(S.days[today] && S.days[today].set === 1, "mission marked complete for today");
    ok(S.days[today].q === n, `answered ${n} questions recorded (got ${S.days[today].q})`);
    ok(S.coins > 0 && S.streak.cur === 1, `coins ${S.coins}, streak ${S.streak.cur}`);
    ok(sawTyped && (sawPassage || sawFig), `saw typed answers${sawPassage ? ", a passage" : ""}${sawFig ? ", a figure" : ""}${sawTwoPart ? ", a two-part item" : ""}${sawChoose2 ? ", a choose-two item" : ""}`);
    await page.click(".done-wrap .btn.primary");
    await page.waitForTimeout(2000);
    const up = db.fast_progress.find((r) => r.user_id === KID.id);
    ok(up && up.data.days[today].set === 1, "progress uploaded to fast_progress");
    ok(!calls.some((c) => /\/rest\/v1\/progress/.test(c.p)), "never touched the PSAT progress table");

    // --- math path, skill sheet, quick practice
    await page.click(".nav button:has-text('Math')"); await page.waitForSelector(".path");
    ok((await page.$$(".stop")).length === 29, "math path shows 29 grade-4 skills");
    ok((await page.textContent(".unit >> nth=0")).includes("Fraction Forest"), "first unit is fractions");
    await shot("08-math-path"); await noHScroll("math path");
    await page.click(".stop.next"); await page.waitForSelector("#sheet .pane");
    await page.click("#sheet details summary"); await shot("09-skill-sheet");
    await page.click("#sheet .btn:has-text('Quick 4')"); await page.waitForSelector("#runner .qcard");
    for (let i = 0; i < 4; i++) {
      const it = await page.evaluate(() => null);
      void it;
      const typed = await page.$("#runner .ans-in input");
      if (typed) await page.fill("#runner .ans-in input", "1"); else await page.click("#runner .opts .opt >> nth=0");
      if (await page.$("#runner .opts >> nth=1")) await page.click("#runner .opts >> nth=1 >> .opt >> nth=0");
      await page.click("#runner .run-foot .btn"); await page.waitForSelector("#runner .feedback"); await page.click("#runner .run-foot .btn");
    }
    await page.waitForSelector(".done-wrap"); ok(true, "quick practice set finishes"); await page.click(".done-wrap .btn.primary");
    await page.click(".nav button:has-text('Math')"); await page.click(".seg button:has-text('Level Up')"); await page.waitForSelector(".skl");
    ok((await page.$$(".skl")).length === 11, "Level Up zone lists 11 grade-5 skills"); await shot("10-level-up");

    // --- reading: a story and Word Power
    await page.click(".nav button:has-text('Reading')"); await page.waitForSelector(".tile");
    await shot("11-reading");
    await page.click(".tile:has-text('Two texts')"); await page.waitForSelector("#runner .passage .ptabs");
    ok((await page.$$("#runner .passage .ptabs button")).length === 2, "paired passage has Text 1 / Text 2 tabs");
    await page.click("#runner .passage .ptabs button >> nth=1"); await shot("12-paired");
    await page.click("#runner .run-top .btn"); await page.click("#sheet .btn:has-text('Take a break')");
    await page.click(".nav button:has-text('Reading')"); await page.click(".tile:has-text('Story time')"); await page.waitForSelector("#runner .passage .para");
    ok((await page.$$("#runner .passage .pn")).length >= 4, "story paragraphs are numbered");
    await page.click("#runner .run-top .btn"); await page.click("#sheet .btn:has-text('Take a break')");

    // --- writing: plan, write, check, turn in
    await page.click(".nav button:has-text('Writing')"); await page.waitForSelector("#essays");
    await shot("13-writing");
    await page.click("#essays .btn >> nth=0"); await page.waitForSelector(".passage .ptabs");
    await page.click(".btn:has-text('I read both')"); await page.waitForSelector("textarea");
    await page.fill("textarea >> nth=1", "I believe recess should come before lunch.");
    await page.click(".btn:has-text('Start writing')"); await page.waitForSelector("textarea.essay");
    const essay = "Picture this: the bell rings and everyone races outside.\n\nI believe students should have recess before lunch because they eat more and waste less food. According to the first source, schools that tried recess first threw away less food.\n\nAnother reason is that students calm down. For example, the article says kids come back ready to learn. This shows that a break helps.\n\nHowever, some people worry that kids will be too hungry. Still, lunch comes right after, so nobody waits long.\n\nIn conclusion, recess should come before lunch because kids eat better and focus better. If schools try it, students will be healthier and happier.";
    await page.fill("textarea.essay", essay);
    await shot("14-essay-write");
    await page.click(".btn:has-text('Check my essay')"); await page.waitForSelector(".checks");
    await page.click(".selfcheck input >> nth=0"); await shot("15-essay-check");
    await page.click(".btn:has-text('Turn it in')"); await page.waitForTimeout(400);
    const S2 = await page.evaluate(() => window.__fast.S);
    ok(S2.essays.length === 1 && S2.essays[0].words > 90, `essay saved (${S2.essays[0] && S2.essays[0].words} words)`);

    // --- Me: progress views, squishies, rewards
    await page.click(".nav button >> nth=4"); await page.waitForSelector(".catrow");
    ok((await page.$$(".catrow")).length === 10, "FAST view shows 4 math + 3 reading + 3 writing categories");
    await shot("16-progress-fast"); await noHScroll("progress");
    await page.click(".seg button:has-text('i-Ready')"); ok((await page.$$(".catrow")).length === 7, "i-Ready view shows 7 domains"); await shot("17-progress-iready");
    await page.click(".seg button:has-text('School scores')"); await page.waitForSelector("svg.chart"); ok((await page.$$("svg.chart")).length === 4, "4 school-score charts"); await shot("18-school-scores");
    await page.click(".seg button:has-text('Squishies')"); await page.waitForSelector(".sq-grid"); await shot("19-squishies");
    await page.click(".seg button:has-text('Rewards')"); await page.waitForSelector(".form-badge");
    await page.click(".btn:has-text('Claim')"); await page.click("#sheet .btn:has-text('Yes')"); await page.waitForTimeout(300);
    ok((await page.evaluate(() => window.__fast.S.claims.length)) === 1, "real reward claimed"); await shot("20-rewards");
    ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));

    // --- parent view
    await page.click(".nav button >> nth=4"); await page.click(".seg button >> nth=3"); await page.click(".btn:has-text('Sign out')");
    await page.waitForSelector("input[type=email]");
    await page.fill("input[type=email]", PARENT.email); await page.fill("input[type=password]", "secret123"); await page.click("button[type=submit]");
    await page.waitForSelector(".pv h1", { timeout: 15000 });
    ok((await page.textContent(".pv h1")).includes("Prayaga"), "parent view shows Prayaga");
    await shot("21-parent"); await noHScroll("parent view");
    await page.click(".pv details summary >> nth=0");
    await page.selectOption(".pv details select >> nth=0", "3"); await page.selectOption(".pv details select >> nth=1", "3"); await page.selectOption(".pv details select >> nth=2", "2");
    await page.click(".pv .btn:has-text('Save score')"); await page.waitForTimeout(300);
    ok(db.fast_feedback.length === 1 && db.fast_feedback[0].scores["w.org"] === 3, "parent essay score saved");
    await page.fill(".pv input[placeholder='PM2 (winter)']", "PM2 (winter)"); await page.selectOption(".pv .card select:near(:text('Add a new score'))", "fast_math").catch(() => {});
    await page.fill(".pv input[placeholder='Score']", "229");
    ok((await page.inputValue(".pv input[placeholder='Level']")) === "4", "level auto-fills from cut scores (229 → L4)");
    await page.click(".pv .btn:has-text('Add')"); await page.waitForSelector(".pv h1");
    await page.waitForTimeout(800);
    ok(db.fast_scores.some((s) => s.score === 229 && s.level === 4), "parent added a school score");
    await page.click(".pv .btn:has-text('+ Add reward')"); await page.fill(".pv input[placeholder='e.g. A new squishy'] >> nth=-1", "Dance class bonus");
    await page.click(".pv .btn:has-text('Save rewards')"); await page.waitForTimeout(400);
    ok(db.fast_learners[0].rewards.length === 2 && db.fast_learners[0].rewards[1].label === "Dance class bonus", "parent saved a new reward");
    db.fast_learners[0].rewards = [{ id: "r1", label: "A new squishy", xp: 50 }];
    await shot("22-parent-bottom");
    ok(errors.length === 0, "no page errors in parent view" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
    // reset fake db for next viewport
    db.fast_progress = []; db.fast_feedback = []; db.fast_scores = db.fast_scores.filter((s) => s.score !== 229);
    await ctx.close();
  }
  await browser.close();
  console.log(`\n${failures ? failures + " FAILED" : "all passed"} · screenshots in ${SHOTS}`);
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
