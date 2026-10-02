// Test Prep Hub — Telegram reports for the admin (Supabase Edge Function "telegram-report").
// Bot token: the TELEGRAM_BOT_TOKEN function secret (set by the admin in the Supabase dashboard).
// POST {mode:"setup"} + x-cron-secret → points the bot's webhook here.
// POST {mode:"cron"}  + x-cron-secret → hourly: daily summary at 9 pm New York time, plus alerts for newly logged tests.
// Telegram webhook (header X-Telegram-Bot-Api-Secret-Token) → commands:
//   /link CODE  connect this chat (CODE is app_secrets.telegram_link_code; nothing is shared without it)
//   /report     today's summary now      /brief  latest Daily Brief coach reports      /stop  pause      /help
// The evening summary also includes each Daily Brief learner's day (brief_* tables, same project).
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
  const [{ data: prog }, { data: profs }, { data: admins }, users] = await Promise.all([
    admin.from("progress").select("user_id, data"), admin.from("profiles").select("user_id, first_name, test_kind, test_date"),
    admin.from("admins").select("email"), admin.auth.admin.listUsers({ perPage: 200 })]);
  const adminEmails = new Set((admins || []).map((a: { email: string }) => a.email.toLowerCase()));
  const email: Record<string, string> = {}; for (const u of users.data?.users || []) email[u.id] = (u.email || "").toLowerCase();
  const prof: Record<string, { first_name?: string; test_kind?: string; test_date?: string }> = {}; for (const p of profs || []) prof[p.user_id] = p;
  return (prog || []).filter((r: { user_id: string }) => !adminEmails.has(email[r.user_id] || "")).map((r: { user_id: string; data: Record<string, unknown> }) => ({ id: r.user_id, D: r.data || {}, p: prof[r.user_id] || {}, email: email[r.user_id] || "" }));
}

// deno-lint-ignore no-explicit-any
function summary(s: any, date: string) {
  const D = s.D, st = D.settings || {}, name = (s.p.first_name || st.name || s.email.split("@")[0] || "Student").trim();
  const testDate = st.date || s.p.test_date, kind = (st.kind || s.p.test_kind) === "sat" ? "SAT" : "PSAT";
  const left = testDate ? Math.round((Date.parse(testDate + "T00:00:00Z") - Date.parse(date + "T00:00:00Z")) / 864e5) : null;
  const L: string[] = [`📚 <b>${esc(name)}</b> · ${dayLabel(date)}${left != null && left >= 0 ? ` · ${left === 0 ? kind + " is today" : left + " day" + (left === 1 ? "" : "s") + " to the " + kind}` : ""}`];
  const tasks = Object.keys(D.tasks || {}).filter((k) => k.startsWith(date + "#")).length;
  const a = (D.activity || {})[date] || {}, t = (D.time || {})[date];
  const labToday = D.lab && Object.values(D.lab.log || {}).includes(date);
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
  return L.join("\n");
}

// Daily Brief: one line per active learner for the given day.
async function briefLines(date: string) {
  const [{ data: learners }, { data: feeds }, { data: ev }] = await Promise.all([
    admin.from("brief_learners").select("user_id, display_name").eq("active", true),
    admin.from("brief_feeds").select("user_id, cards").eq("feed_date", date),
    admin.from("brief_events").select("user_id, kind, card_id, correct, points").eq("feed_date", date)]);
  const out: Record<string, { name: string; line: string }> = {};
  for (const l of learners || []) {
    const f = (feeds || []).find((x: { user_id: string }) => x.user_id === l.user_id), mine = (ev || []).filter((e: { user_id: string }) => e.user_id === l.user_id);
    const total = f && Array.isArray(f.cards) ? f.cards.length : 0;
    const read = new Set(mine.filter((e: { kind: string }) => e.kind === "read").map((e: { card_id: string }) => e.card_id)).size;
    const graded = mine.filter((e: { correct: boolean | null }) => e.correct !== null && e.correct !== undefined), cor = graded.filter((e: { correct: boolean }) => e.correct).length;
    const pts = mine.reduce((a: number, e: { points: number | null }) => a + (e.points || 0), 0);
    out[l.user_id] = { name: l.display_name, line: !total ? "📰 Daily Brief: no brief today" : !mine.length ? "📰 Daily Brief: not opened yet" :
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

async function chats() { const { data } = await admin.from("telegram_chats").select("chat_id").eq("enabled", true); return (data || []).map((c: { chat_id: number }) => c.chat_id); }
async function reportTo(chat_ids: number[], date: string) {
  const [list, brief] = await Promise.all([students(), briefLines(date).catch(() => ({} as Record<string, { name: string; line: string }>))]);
  const blocks = list.map((s) => summary(s, date) + (brief[s.id] ? "\n" + brief[s.id].line : ""));
  const ids = new Set(list.map((s) => s.id));
  for (const [id, b] of Object.entries(brief)) if (!ids.has(id)) blocks.push(`👤 <b>${esc(b.name)}</b>\n${b.line}`);
  const text = blocks.length ? blocks.join("\n\n") + `\n\n<a href="${SITE}">Open Test Prep Hub</a> · /brief for the Daily Brief coach reports` : "No students yet.";
  for (const c of chat_ids) await send(c, text);
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
    else if (row && row.enabled && cmd === "/brief") await briefCoach(chat);
    else if (row && cmd === "/stop") { await admin.from("telegram_chats").update({ enabled: false }).eq("chat_id", chat); await send(chat, "Paused. Send /link CODE again to restart."); }
    else if (row && row.enabled) await send(chat, "Commands: /report (today's summary now) · /brief (Daily Brief coach reports) · /stop (pause messages)");
    else await send(chat, "Hi! To connect, send: /link YOURCODE");
    return json({ ok: true });
  }
  // Admin / scheduled calls
  if (req.headers.get("x-cron-secret") !== S.cron_secret) return json({ error: "forbidden" }, 403);
  if (!TOKEN) return json({ error: "TELEGRAM_BOT_TOKEN is not set" }, 400);
  const body = await req.json().catch(() => ({}));
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
