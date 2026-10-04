// Test Prep Hub — Telegram reports for the admin (Supabase Edge Function "telegram-report").
// Bot token: the TELEGRAM_BOT_TOKEN function secret (set by the admin in the Supabase dashboard).
// POST {mode:"setup"} + x-cron-secret → points the bot's webhook here.
// POST {mode:"cron"}  + x-cron-secret → hourly: daily summary at 9 pm New York time, plus alerts for newly logged tests.
// Telegram webhook (header X-Telegram-Bot-Api-Secret-Token) → commands:
//   /link CODE  connect this chat (CODE is app_secrets.telegram_link_code; nothing is shared without it)
//   /report  short summary now   /details  full summary   /brief  Daily Brief coach reports   /stop  pause
// The evening summary also includes each Daily Brief learner's day (brief_* tables, same project)
// and each FAST Prep learner's day (grade 4 FAST + i-Ready practice; fast_* tables, site /fast/).
// POST {mode:"preview", full?} + x-cron-secret → returns the report text without sending it (for testing).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.117.2";

const SITE = "https://vinunairs.github.io/psat-sprint/";
const TZ = "America/New_York", SEND_HOUR = 21;
const HOOK_URL = "https://frdcgfafsumdqjbjdhmf.supabase.co/functions/v1/telegram-report";
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function secrets() {
  const { data, error } = await admin.from("app_secrets").select("name, value");
  if (error || !data) throw new Error("Could not load server settings");
  return Object.fromEntries(data.map((r: { name: string; value: string }) => [r.name, r.value])) as Record<string, string>;
}
async function setSecret(name: string, value: string) { await admin.from("app_secrets").upsert({ name, value }); }

async function tg(method: string, body: Record<string, unknown>) {
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return r.json();
}
const send = (chat_id: number, text: string) => tg("sendMessage", { chat_id, text, parse_mode: "HTML", disable_web_page_preview: true });
const esc = (s: string) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const DOMAINS: Record<string, string> = { ii: "Information and Ideas", cs: "Craft and Structure", eoi: "Expression of Ideas", sec: "Grammar", alg: "Algebra", adv: "Advanced Math", psda: "Data Analysis", geo: "Geometry and Trig" };
const PACE: Record<string, number> = { ii: 71, cs: 71, eoi: 71, sec: 71, alg: 95, adv: 95, psda: 95, geo: 95 };
const ACT: Record<string, string> = { practice: "practice", focus: "focus set", notebook: "mistake notebook", mock: "mock test", cards: "flashcards", challenge: "challenges" };
function localDate(d = new Date()) { return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d); }
function localHour(d = new Date()) { return Number(new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", hourCycle: "h23" }).format(d)) % 24; }
const mins = (s: number) => (s < 60 ? (s > 0 ? "<1" : "0") : String(Math.round(s / 60)));
const mmss = (s: number) => Math.floor(s / 60) + ":" + String(Math.round(s % 60)).padStart(2, "0");
const dayLabel = (date: string) => new Date(date + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

async function students() {
  const [{ data: prog }, { data: profs }, { data: admins }, users, { data: fastL }] = await Promise.all([
    admin.from("progress").select("user_id, data"), admin.from("profiles").select("user_id, first_name, test_kind, test_date"),
    admin.from("admins").select("email"), admin.auth.admin.listUsers({ perPage: 200 }), admin.from("fast_learners").select("user_id")]);
  const fastIds = new Set((fastL || []).map((f: { user_id: string }) => f.user_id));
  const adminEmails = new Set((admins || []).map((a: { email: string }) => a.email.toLowerCase()));
  const email: Record<string, string> = {}; for (const u of users.data?.users || []) email[u.id] = (u.email || "").toLowerCase();
  const prof: Record<string, { first_name?: string; test_kind?: string; test_date?: string }> = {}; for (const p of profs || []) prof[p.user_id] = p;
  return (prog || []).filter((r: { user_id: string }) => !adminEmails.has(email[r.user_id] || "") && !fastIds.has(r.user_id)).map((r: { user_id: string; data: Record<string, unknown> }) => ({ id: r.user_id, D: r.data || {}, p: prof[r.user_id] || {}, email: email[r.user_id] || "" }));
}

// deno-lint-ignore no-explicit-any
function summary(s: any, date: string) {
  const D = s.D, st = D.settings || {}, name = (s.p.first_name || st.name || s.email.split("@")[0] || "Student").trim();
  const testDate = st.date || s.p.test_date, kind = (st.kind || s.p.test_kind) === "sat" ? "SAT" : "PSAT";
  const left = testDate ? Math.round((Date.parse(testDate + "T00:00:00Z") - Date.parse(date + "T00:00:00Z")) / 864e5) : null;
  const L: string[] = [`📚 <b>${esc(name)}</b> · ${dayLabel(date)}${left != null && left >= 0 ? ` · ${left === 0 ? kind + " is today" : left + " day" + (left === 1 ? "" : "s") + " to the " + kind}` : ""}`];
  const tasks = Object.keys(D.tasks || {}).filter((k) => k.startsWith(date + "#")).length;
  const a = (D.activity || {})[date] || {}, t = (D.time || {})[date];
  const labToday = [D.lab, D.lab2].some((x) => x && Object.values(x.log || {}).includes(date));
  if (!tasks && !a.q && !a.mock && !(t && t.f > 60) && !labToday) { L.push("⚠️ No study activity yet today."); return L.join("\n"); }
  L.push(`✅ Plan tasks done today: ${tasks}`);
  if (t) {
    const by = Object.entries(t.by || {}).sort((x, y) => (y[1] as number) - (x[1] as number)).map(([k, v]) => `${ACT[k] || k} ${mins(v as number)}`).join(", ");
    L.push(`⏱ Focused ${mins(t.f)} min${by ? " (" + by + ")" : ""} · idle ${mins(t.i)} min · stepped away ${t.n || 0}×${t.n ? " (" + mins(t.a) + " min)" : ""}`);
  }
  if (a.q) {
    L.push(`📝 ${a.q} questions · ${a.c} right (${Math.round((a.c / a.q) * 100)}%)`);
    const doms = Object.entries(a.dom || {}).sort((x, y) => (y[1] as number[])[0] - (x[1] as number[])[0]).map(([d, v]) => `${DOMAINS[d] || d} ${(v as number[])[1]}/${(v as number[])[0]}`);
    if (doms.length) L.push("   " + doms.join(" · "));
    const weak = Object.entries(a.dom || {}).filter(([, v]) => (v as number[])[0] >= 3).sort((x, y) => (x[1] as number[])[1] / (x[1] as number[])[0] - (y[1] as number[])[1] / (y[1] as number[])[0])[0];
    if (weak && (weak[1] as number[])[1] / (weak[1] as number[])[0] < 0.7) L.push(`🎯 Needs work: ${DOMAINS[weak[0]] || weak[0]}`);
  }
  if (a.mock) L.push(`🧪 Mock test sections today: ${a.mock}`);
  const qt = D.qtime || {}, pace = Object.entries(qt).filter(([d, v]) => (a.dom || {})[d] && (v as number[])[0] >= 3)
    .map(([d, v]) => { const avg = (v as number[])[1] / (v as number[])[0]; return `${DOMAINS[d] || d} ${mmss(avg)}/q (test ${mmss(PACE[d] || 95)})${avg > (PACE[d] || 95) * 1.25 ? " ⚠️" : ""}`; });
  if (pace.length) L.push("⚡ Pace: " + pace.join(" · "));
  const nb = (D.mistakes || []).length; if (nb) L.push(`📌 ${nb} questions waiting in the Mistake notebook`);
  if (D.lab && D.lab.done) {
    const todayM = Object.entries(D.lab.log || {}).filter(([, d]) => d === date).map(([n]) => n);
    L.push(`🧩 Geometry Lab: ${D.lab.done.length} of 7 missions done${todayM.length ? " (today: Mission " + todayM.join(", ") + ")" : ""}`);
  }
  if (D.lab2 && D.lab2.done) {
    const todayM = Object.entries(D.lab2.log || {}).filter(([, d]) => d === date).map(([n]) => n);
    L.push(`💡 Concept Lab: ${D.lab2.done.length} of 7 missions done${todayM.length ? " (today: Mission " + todayM.join(", ") + ")" : ""}`);
  }
  return L.join("\n");
}

// Short version (the 9 pm message): one status line plus only the things worth a parent's attention.
// deno-lint-ignore no-explicit-any
function short(s: any, date: string, brief?: { done: boolean; opened: boolean; read: number; total: number }) {
  const D = s.D, st = D.settings || {}, name = (s.p.first_name || st.name || s.email.split("@")[0] || "Student").trim();
  const testDate = st.date || s.p.test_date, kind = (st.kind || s.p.test_kind) === "sat" ? "SAT" : "PSAT";
  const left = testDate ? Math.round((Date.parse(testDate + "T00:00:00Z") - Date.parse(date + "T00:00:00Z")) / 864e5) : null;
  const tasks = Object.keys(D.tasks || {}).filter((k) => k.startsWith(date + "#")).length;
  const a = (D.activity || {})[date] || {}, t = (D.time || {})[date];
  const head = `<b>${esc(name)}</b>${left != null && left >= 0 ? " · " + (left === 0 ? kind + " today" : left + "d to " + kind) : ""}`;
  const labToday = Object.entries((D.lab && D.lab.log) || {}).filter(([, d]) => d === date).length + Object.entries((D.lab2 && D.lab2.log) || {}).filter(([, d]) => d === date).length;
  if (!tasks && !a.q && !a.mock && !(t && t.f > 60) && !labToday) return `${head}\n⚠️ No study today${brief ? (brief.done ? " · 📰 Brief ✓" : brief.opened ? " · 📰 Brief " + brief.read + "/" + brief.total : " · 📰 Brief not opened") : ""}`;
  const bits = [`✅ ${tasks} task${tasks === 1 ? "" : "s"}`];
  if (t && t.f >= 60) bits.push(`⏱ ${mins(t.f)} min`);
  if (a.q) bits.push(`📝 ${a.c}/${a.q} (${Math.round((a.c / a.q) * 100)}%)`);
  if (brief) bits.push(brief.done ? "📰 ✓" : brief.opened ? "📰 " + brief.read + "/" + brief.total : "📰 ✗");
  const flags: string[] = [];
  for (const [d, v] of Object.entries(a.dom || {})) { const [n, c] = v as number[]; if (n >= 3 && c / n < 0.6) flags.push(`${DOMAINS[d] || d} ${c}/${n}`); }
  const qt = D.qtime || {};
  for (const [d, v] of Object.entries(qt)) { const [n, sum] = v as number[]; if ((a.dom || {})[d] && n >= 3 && sum / n > (PACE[d] || 95) * 1.25) flags.push(`slow on ${DOMAINS[d] || d} (${mmss(sum / n)}/q)`); }
  if (t && t.n >= 3) flags.push(`left the app ${t.n}×`);
  if (t && t.f >= 600 && t.i > t.f * 0.5) flags.push(`idle ${mins(t.i)} min`);
  if (a.mock) flags.push(`🧪 ${a.mock} mock section${a.mock === 1 ? "" : "s"}`);
  if (labToday) flags.push(`🧩 +${labToday} Lab mission${labToday === 1 ? "" : "s"}`);
  return `${head}\n${bits.join(" · ")}${flags.length ? "\n⚠️ " + flags.slice(0, 3).join(" · ") : ""}`;
}

// Daily Brief: one line per active learner for the given day.
async function briefLines(date: string) {
  const [{ data: learners }, { data: feeds }, { data: ev }] = await Promise.all([
    admin.from("brief_learners").select("user_id, display_name").eq("active", true),
    admin.from("brief_feeds").select("user_id, cards").eq("feed_date", date),
    admin.from("brief_events").select("user_id, kind, card_id, correct, points").eq("feed_date", date)]);
  const out: Record<string, { name: string; line: string; info: { done: boolean; opened: boolean; read: number; total: number } }> = {};
  for (const l of learners || []) {
    const f = (feeds || []).find((x: { user_id: string }) => x.user_id === l.user_id), mine = (ev || []).filter((e: { user_id: string }) => e.user_id === l.user_id);
    const total = f && Array.isArray(f.cards) ? f.cards.length : 0;
    const read = new Set(mine.filter((e: { kind: string }) => e.kind === "read").map((e: { card_id: string }) => e.card_id)).size;
    const graded = mine.filter((e: { correct: boolean | null }) => e.correct !== null && e.correct !== undefined), cor = graded.filter((e: { correct: boolean }) => e.correct).length;
    const pts = mine.reduce((a: number, e: { points: number | null }) => a + (e.points || 0), 0);
    out[l.user_id] = { name: l.display_name, info: { done: total > 0 && read >= total, opened: mine.length > 0, read, total }, line: !total ? "📰 Daily Brief: no brief today" : !mine.length ? "📰 Daily Brief: not opened yet" :
      `📰 Daily Brief: ${read}/${total} cards read${read >= total ? " ✓" : ""}${graded.length ? ` · ${cor}/${graded.length} checks right` : ""} · ${pts} pts` };
  }
  return out;
}
async function briefCoach(chat: number) {
  const { data } = await admin.from("brief_reports").select("user_id, report_date, summary").order("report_date", { ascending: false }).limit(20);
  const { data: learners } = await admin.from("brief_learners").select("user_id, display_name").eq("active", true);
  const parts: string[] = [];
  for (const l of learners || []) { const r = (data || []).find((x: { user_id: string }) => x.user_id === l.user_id); if (r) parts.push(`📰 <b>${esc(l.display_name)}</b> · Daily Brief report, ${dayLabel(r.report_date)}\n${esc(r.summary)}`); }
  for (const chunk of (parts.length ? parts : ["No Daily Brief reports yet."])) await send(chat, chunk.slice(0, 4000));
}

// FAST Prep (grade 4 FAST + i-Ready): one block per learner from fast_progress.data.days[date].
const FAST_SUB: Record<string, string> = { math: "➗ Math", reading: "📚 Reading", writing: "✏️ Writing", stretch: "🚀 Level Up" };
const FAST_SKILL: Record<string, string> = {
  "m.fr.equiv": "Equivalent fractions", "m.fr.compare": "Compare fractions", "m.fr.decomp": "Break apart fractions", "m.fr.addsub": "Add/subtract fractions", "m.fr.word": "Fraction word problems",
  "m.fr.times": "Fraction × whole", "m.fr.tenths": "Tenths & hundredths", "m.dec.notation": "Decimals", "m.dec.ops": "Decimal sums", "m.gr.angles": "Types of angles", "m.gr.measure": "Measure angles",
  "m.gr.unknown": "Missing angles", "m.gr.area": "Area & perimeter", "m.geo.shapes": "Lines & shapes", "m.m.convert": "Convert units", "m.m.time": "Time & distance", "m.m.money": "Money",
  "m.dp.lineplot": "Line plots & data", "m.md.facts": "Times tables", "m.md.mult": "Multi-digit ×", "m.md.div": "Division w/ remainders", "m.md.estimate": "Estimation", "m.ar.word": "× ÷ word problems",
  "m.ar.equation": "Equations", "m.ar.factors": "Factors & primes", "m.ar.pattern": "Patterns", "m.nso.place": "Place value", "m.nso.compare": "Compare big numbers", "m.nso.round": "Rounding",
  "r.plot": "Plot & characters", "r.theme": "Theme", "r.pov": "Point of view", "r.poetry": "Poetry", "r.textfeat": "Text features", "r.central": "Central idea", "r.perspective": "Author's perspective",
  "r.claim": "Claim & evidence", "r.figurative": "Figurative language", "r.summary": "Summarize", "r.compare": "Compare texts", "v.context": "Context clues", "v.roots": "Roots & affixes",
  "v.multi": "Multiple-meaning words", "v.relations": "Word relationships", "v.academic": "Academic words", "w.org": "Writing: organization", "w.evid": "Writing: evidence", "w.conv": "Writing: conventions" };
const FAST_CATS: Record<string, string[]> = {
  "Fractions & Decimals": ["m.fr.equiv", "m.fr.compare", "m.fr.decomp", "m.fr.addsub", "m.fr.times", "m.fr.tenths", "m.dec.notation", "m.dec.ops"],
  "Whole Numbers": ["m.md.facts", "m.md.mult", "m.md.div", "m.md.estimate", "m.nso.place", "m.nso.compare", "m.nso.round"],
  "Algebraic Reasoning": ["m.fr.word", "m.ar.word", "m.ar.equation", "m.ar.factors", "m.ar.pattern"],
  "Geometry, Measurement & Data": ["m.gr.angles", "m.gr.measure", "m.gr.unknown", "m.gr.area", "m.geo.shapes", "m.m.convert", "m.m.time", "m.m.money", "m.dp.lineplot"],
  "Prose & Poetry": ["r.plot", "r.theme", "r.pov", "r.poetry"], "Informational Text": ["r.textfeat", "r.central", "r.perspective", "r.claim"],
  "Across Genres & Vocabulary": ["r.figurative", "r.summary", "r.compare", "v.context", "v.roots", "v.multi", "v.relations", "v.academic"] };
// deno-lint-ignore no-explicit-any
function fastSkillScore(D: any, id: string) { const s = (D.skills || {})[id]; if (!s || s.n < 3) return null; const h = (s.h || []).slice(-10); return Math.round(((h.reduce((a: number, b: number) => a + b, 0) + 0.5) / (h.length + 1)) * 100); }
// deno-lint-ignore no-explicit-any
function fastCat(D: any, ids: string[]) { let w = 0, t = 0; for (const id of ids) { const sc = fastSkillScore(D, id); if (sc == null) continue; const k = Math.min(D.skills[id].n, 20); w += k; t += sc * k; } return w ? Math.round(t / w) : null; }
async function fastLearners() {
  const [{ data: L }, { data: P }, { data: F }] = await Promise.all([admin.from("fast_learners").select("user_id, first_name, grade").eq("active", true), admin.from("fast_progress").select("user_id, data"), admin.from("fast_scores").select("user_id, test, score, level, term, grade, taken_on").order("taken_on")]);
  return (L || []).map((l: { user_id: string; first_name: string; grade: string }) => ({ ...l, D: ((P || []).find((p: { user_id: string }) => p.user_id === l.user_id) || { data: {} }).data || {}, scores: (F || []).filter((f: { user_id: string }) => f.user_id === l.user_id) }));
}
type BriefInfo = { done: boolean; opened: boolean; read: number; total: number };
const briefBit = (b?: BriefInfo) => (b ? (b.done ? "📰 ✓" : b.opened ? "📰 " + b.read + "/" + b.total : "📰 ✗") : "");
// deno-lint-ignore no-explicit-any
function fastShort(f: any, date: string, brief?: BriefInfo) {
  const D = f.D, d = (D.days || {})[date], st = D.streak || {};
  const streak = st.last === date || st.last === prevDate(date) ? st.cur || 0 : 0;
  const head = `<b>${esc(f.first_name)}</b> · FAST Gr${esc(f.grade)}${streak > 1 ? ` · 🔥${streak}` : ""}`;
  if (!d || (!d.q && !d.essays)) return `${head}\n⚠️ No FAST practice today${brief ? " · " + briefBit(brief) : ""}`;
  const bits = [d.set ? "✅ mission" : "⏳ mission not finished"];
  if (d.sec >= 60) bits.push(`⏱ ${mins(d.sec)} min`);
  if (d.q) bits.push(`📝 ${d.c}/${d.q} (${Math.round((d.c / d.q) * 100)}%)`);
  if (brief) bits.push(briefBit(brief));
  const subs = Object.entries(d.sub || {}).map(([k, v]) => `${FAST_SUB[k] || k} ${(v as number[])[1]}/${(v as number[])[0]}`);
  const flags: string[] = [];
  for (const [id, v] of Object.entries(d.sk || {})) { const [n, c] = v as number[]; if (n >= 3 && c / n < 0.6) flags.push(`${FAST_SKILL[id] || id} ${c}/${n}`); }
  if (d.essays) flags.push(`✍️ wrote ${d.essays} essay${d.essays > 1 ? "s" : ""}`);
  for (const c of (D.claims || []).filter((x: { at: string }) => x.at === date)) flags.push(`🎁 claimed “${esc(c.label)}”`);
  return `${head}\n${bits.join(" · ")}${subs.length ? "\n   " + subs.join(" · ") : ""}${flags.length ? "\n⚠️ " + flags.slice(0, 3).join(" · ") : ""}`;
}
// deno-lint-ignore no-explicit-any
function fastFull(f: any, date: string, brief?: { line: string }) {
  const D = f.D, d = (D.days || {})[date], st = D.streak || {};
  const L = [`🧮 <b>${esc(f.first_name)}</b> · FAST Prep (grade ${esc(f.grade)}) · ${dayLabel(date)}`];
  if (!d || (!d.q && !d.essays)) L.push("⚠️ No FAST practice yet today.");
  else {
    L.push(`${d.set ? "✅ Daily mission done" : "⏳ Daily mission not finished"} · ⏱ ${mins(d.sec || 0)} min · 📝 ${d.c}/${d.q} right (${d.q ? Math.round((d.c / d.q) * 100) : 0}%)`);
    const subs = Object.entries(d.sub || {}).map(([k, v]) => `${FAST_SUB[k] || k} ${(v as number[])[1]}/${(v as number[])[0]}`);
    if (subs.length) L.push("   " + subs.join(" · "));
    const sk = Object.entries(d.sk || {}).sort((x, y) => (x[1] as number[])[1] / (x[1] as number[])[0] - (y[1] as number[])[1] / (y[1] as number[])[0]).map(([id, v]) => `${FAST_SKILL[id] || id} ${(v as number[])[1]}/${(v as number[])[0]}`);
    if (sk.length) L.push("🎯 Skills today: " + sk.slice(0, 8).join(" · "));
    if (d.essays) L.push(`✍️ Essays turned in today: ${d.essays} (score them in the parent view)`);
  }
  const cats = Object.entries(FAST_CATS).map(([name, ids]) => [name, fastCat(D, ids)] as [string, number | null]).filter(([, v]) => v != null);
  if (cats.length) L.push("📊 Practice by FAST area: " + cats.map(([n, v]) => `${n} ${v}%`).join(" · "));
  const last = (t: string) => f.scores.filter((s: { test: string }) => s.test === t).slice(-1)[0];
  const lm = last("fast_math"), lr = last("fast_reading"), im = last("iready_math"), ir = last("iready_reading");
  L.push(`🏫 Latest school: FAST Math ${lm ? lm.score + (lm.level ? " L" + lm.level : "") : "—"} · FAST Reading ${lr ? lr.score + (lr.level ? " L" + lr.level : "") : "—"} · i-Ready Math ${im ? im.score : "—"} · Reading ${ir ? ir.score : "—"}`);
  L.push(`🔥 Streak ${st.last === date || st.last === prevDate(date) ? st.cur || 0 : 0} (best ${st.best || 0}) · 🪙 ${D.coins || 0} coins`);
  if (brief) L.push(brief.line);
  return L.join("\n");
}
function prevDate(date: string) { const d = new Date(date + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); }

async function chats() { const { data } = await admin.from("telegram_chats").select("chat_id").eq("enabled", true); return (data || []).map((c: { chat_id: number }) => c.chat_id); }
async function reportText(date: string, full = false) {
  // deno-lint-ignore no-explicit-any
  const [list, brief, fast] = await Promise.all([students(), briefLines(date).catch(() => ({} as Record<string, any>)), fastLearners().catch(() => [])]);
  const ids = new Set([...list.map((s) => s.id), ...fast.map((f: { user_id: string }) => f.user_id)]);
  if (full) {
    const blocks = list.map((s) => summary(s, date) + (brief[s.id] ? "\n" + brief[s.id].line : ""));
    // deno-lint-ignore no-explicit-any
    for (const f of fast as any[]) blocks.push(fastFull(f, date, brief[f.user_id]));
    for (const [id, b] of Object.entries(brief)) if (!ids.has(id)) blocks.push(`👤 <b>${esc(b.name)}</b>\n${b.line}`);
    return blocks.length ? blocks.join("\n\n") + `\n\n<a href="${SITE}">Open Test Prep Hub</a> · <a href="${SITE}fast/">FAST Prep</a>` : "No students yet.";
  }
  const blocks = list.map((s) => short(s, date, brief[s.id] && brief[s.id].info));
  // deno-lint-ignore no-explicit-any
  for (const f of fast as any[]) blocks.push(fastShort(f, date, brief[f.user_id] && brief[f.user_id].info));
  const others = Object.entries(brief).filter(([id]) => !ids.has(id)).map(([, b]) => `${esc(b.name)} ${b.info.done ? "✓" : b.info.opened ? b.info.read + "/" + b.info.total : "✗"}`);
  if (others.length) blocks.push("📰 Daily Brief: " + others.join(" · "));
  return `📊 <b>${dayLabel(date)}</b>\n\n` + (blocks.length ? blocks.join("\n\n") : "No students yet.") + "\n\n/details for the full report";
}
async function reportTo(chat_ids: number[], date: string, full = false) {
  // Telegram caps a message at 4,096 characters: split between blocks so HTML tags stay whole.
  const parts: string[] = []; let cur = "";
  for (const block of (await reportText(date, full)).split("\n\n")) {
    if (cur && (cur + "\n\n" + block).length > 4000) { parts.push(cur); cur = block; } else cur = cur ? cur + "\n\n" + block : block;
  }
  if (cur) parts.push(cur);
  for (const c of chat_ids) for (const p of parts) await send(c, p);
}

// New tests logged since the last check → a short alert.
async function testAlerts(state: Record<string, unknown>) {
  const seen = (state.tests || {}) as Record<string, string[]>, out: string[] = [];
  for (const s of await students()) {
    const name = (s.p.first_name || s.D.settings?.name || "Student").trim();
    // deno-lint-ignore no-explicit-any
    const ids = (s.D.tests || []).map((t: any) => t.id), prev = seen[s.id];
    if (prev) for (const t of s.D.tests || []) if (!prev.includes(t.id)) {
      const parts = [t.rw ? "R&W " + t.rw : null, t.math ? "Math " + t.math : null, t.total ? "total " + t.total : null].filter(Boolean).join(", ");
      out.push(`🏁 <b>${esc(name)}</b> logged a test: ${esc(t.name || "Practice test")}${parts ? " · " + parts : ""}`);
    }
    seen[s.id] = ids;
  }
  state.tests = seen;
  return out;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: true });
  const S = await secrets();
  // Telegram webhook
  const hook = req.headers.get("x-telegram-bot-api-secret-token");
  if (hook) {
    if (hook !== S.telegram_hook_secret) return json({ error: "forbidden" }, 403);
    const u = await req.json().catch(() => ({}));
    const m = u.message; if (!m || !m.chat || typeof m.text !== "string") return json({ ok: true });
    const chat = m.chat.id, text = m.text.trim(), cmd = text.split(/\s+/)[0].toLowerCase().replace(/@.*$/, "");
    const { data: row } = await admin.from("telegram_chats").select("enabled").eq("chat_id", chat).maybeSingle();
    if (cmd === "/link") {
      const code = (text.split(/\s+/)[1] || "").toUpperCase();
      if (code && code === S.telegram_link_code) {
        await admin.from("telegram_chats").upsert({ chat_id: chat, label: [m.chat.first_name, m.chat.last_name].filter(Boolean).join(" ") || m.chat.title || "", enabled: true });
        await send(chat, "Linked ✅ You'll get a study summary every evening at 9 pm, plus a note whenever a test is logged.\n\nCommands: /report (summary now) · /stop (pause messages)");
      } else await send(chat, "That link code isn't right. Ask the person who runs Test Prep Hub for the code.");
    } else if (row && row.enabled && cmd === "/report") await reportTo([chat], localDate());
    else if (row && row.enabled && (cmd === "/details" || cmd === "/full")) await reportTo([chat], localDate(), true);
    else if (row && row.enabled && cmd === "/brief") await briefCoach(chat);
    else if (row && cmd === "/stop") { await admin.from("telegram_chats").update({ enabled: false }).eq("chat_id", chat); await send(chat, "Paused. Send /link CODE again to restart."); }
    else if (row && row.enabled) await send(chat, "Commands: /report (short summary) · /details (full report) · /brief (Daily Brief coach reports) · /stop (pause)");
    else await send(chat, "Hi! To connect, send: /link YOURCODE");
    return json({ ok: true });
  }
  // Admin / scheduled calls
  if (req.headers.get("x-cron-secret") !== S.cron_secret) return json({ error: "forbidden" }, 403);
  const body = await req.json().catch(() => ({}));
  if (body.mode === "preview") return json({ text: await reportText(body.date || localDate(), !!body.full) });
  if (!TOKEN) return json({ error: "TELEGRAM_BOT_TOKEN is not set" }, 400);
  if (body.mode === "setup") {
    const r = await tg("setWebhook", { url: HOOK_URL, secret_token: S.telegram_hook_secret, allowed_updates: ["message"], drop_pending_updates: true });
    const me = await tg("getMe", {});
    return json({ webhook: r, bot: me?.result?.username });
  }
  if (body.mode === "cron") {
    const state = JSON.parse(S.telegram_state || "{}"), date = localDate(), ids = await chats();
    const alerts = await testAlerts(state);
    if (alerts.length) for (const c of ids) await send(c, alerts.join("\n"));
    let sent = false;
    if (localHour() >= SEND_HOUR && state.lastDaily !== date && ids.length) { await reportTo(ids, date); state.lastDaily = date; sent = true; }
    await setSecret("telegram_state", JSON.stringify(state));
    return json({ ok: true, alerts: alerts.length, daily: sent });
  }
  return json({ error: "unknown mode" }, 400);
});
