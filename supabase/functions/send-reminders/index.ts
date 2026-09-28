// Test Prep Hub — daily study reminders (Supabase Edge Function "send-reminders").
// POST {mode:"test"} with the signed-in user's access token → sends a test notification to that user.
// POST {mode:"cron"} with header x-cron-secret → hourly job: sends each subscriber a personalized
// reminder at their chosen local hour, unless they've already practiced that day.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.117.2";
import * as webpush from "jsr:@negrel/webpush@0.5.0";

const SITE = "https://vinunairs.github.io/psat-sprint/";
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

let appServer: webpush.ApplicationServer | null = null;
let cronSecret = "";
async function getServer() {
  if (appServer) return appServer;
  const { data, error } = await admin.from("app_secrets").select("name, value");
  if (error || !data) throw new Error("Could not load server settings");
  const m = Object.fromEntries(data.map((r: { name: string; value: string }) => [r.name, r.value]));
  cronSecret = m.cron_secret;
  const vapidKeys = await webpush.importVapidKeys(JSON.parse(m.vapid_keys), { extractable: false });
  appServer = await webpush.ApplicationServer.new({ contactInformation: m.vapid_contact, vapidKeys });
  return appServer;
}

const DOMAINS: Record<string, { name: string; n: number }> = {
  ii: { name: "Information and Ideas", n: 14 }, cs: { name: "Craft and Structure", n: 14 },
  eoi: { name: "Expression of Ideas", n: 11 }, sec: { name: "grammar (Standard English Conventions)", n: 15 },
  alg: { name: "Algebra", n: 15 }, adv: { name: "Advanced Math", n: 14 },
  psda: { name: "Problem-Solving and Data Analysis", n: 9 }, geo: { name: "Geometry and Trig", n: 6 },
};
function localParts(tz: string, d = new Date()) {
  let date: string, hour: number;
  try {
    date = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
    hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hourCycle: "h23" }).format(d)) % 24;
  } catch {
    return localParts("America/New_York", d);
  }
  return { date, hour };
}
function weekdayIn(tz: string, d = new Date()) {
  try { return new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(d); } catch { return ""; }
}
function mondayOf(date: string) {
  const t = Date.parse(date + "T00:00:00Z"), wd = (new Date(t).getUTCDay() + 6) % 7;
  return new Date(t - wd * 864e5).toISOString().slice(0, 10);
}
const dayDiff = (a: string, b: string) => Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 864e5);

// deno-lint-ignore no-explicit-any
function compose(p: any, today: string, test = false, weekday = "") {
  const name = (p?.settings?.name || "").trim();
  const hi = name ? ", " + name : "";
  const testDate = p?.settings?.date || "2026-10-07";
  const kind = p?.settings?.kind === "sat" ? "SAT" : "PSAT";
  const left = dayDiff(today, testDate);
  const last = p?.streak?.last;
  const yesterday = new Date(Date.parse(today + "T00:00:00Z") - 864e5).toISOString().slice(0, 10);
  const streak = last === today || last === yesterday ? p?.streak?.count || 0 : 0;
  const practiced = last === today;
  // weakest skill: latest test accuracy (60%) blended with practice accuracy (40%)
  let weak = "your weakest skill", worst = 2;
  for (const [id, info] of Object.entries(DOMAINS)) {
    let t: number | null = null;
    for (let i = (p?.tests || []).length - 1; i >= 0; i--) { const x = p.tests[i]?.dom?.[id]; if (x && x.t) { t = x.c / x.t; break; } }
    const s = p?.stats?.[id]; const pr = s && s.att >= 3 ? s.cor / s.att : null;
    const m = t != null && pr != null ? 0.6 * t + 0.4 * pr : t ?? pr;
    if (m != null && m < worst) { worst = m; weak = info.name; }
  }
  const mistakes = (p?.mistakes || []).length;
  let title: string, body: string;
  if (left === 1) { title = `${kind} tomorrow${hi}!`; body = "Light review only tonight: one short set, charge your device, and get to bed early. You've got this."; }
  else if (left === 0) { title = `It's ${kind} day${hi}!`; body = "Take care on Module 1, use Desmos, and never leave a question blank. Good luck!"; }
  else if (left < 0) { title = `Keep your skills sharp${hi}`; body = `10 quick questions on ${weak} keep your progress going.`; }
  else if (streak > 0) { title = `Keep your ${streak}-day streak${hi}!`; body = `${left} days to the ${kind}. 10 questions on ${weak} tonight will do it.`; }
  else { title = `${left} days to the ${kind}${hi}`; body = `Tonight: 10 questions on ${weak}.` + (mistakes ? ` ${mistakes} missed question${mistakes === 1 ? " is" : "s are"} waiting in your Mistake notebook.` : ""); }
  // Long-range plan: use this week's goals, and send a check-in on Sundays.
  let checkin = false;
  const wsNow = p?.weekStatus;
  if (left > 9) {
    const until = left > 60 ? `${Math.round(left / 7)} weeks` : `${left} days`;
    const stale = !wsNow || wsNow.ws !== mondayOf(today);
    const focus = wsNow && wsNow.focus && wsNow.focus.length ? wsNow.focus.join(" and ") : weak;
    if (weekday === "Sun") {
      checkin = true;
      title = `Weekly check-in${hi}`;
      body = stale ? "No practice logged this week yet. New goals start tomorrow, so make it a strong week."
        : `This week: ${wsNow.q} questions, ${wsNow.done} of ${wsNow.total} goals done.` + (wsNow.done < wsNow.total ? " Tonight's a good chance to finish one more." : " Every goal met. Great week!");
    } else if (stale) {
      title = `${until} to the ${kind}${hi}`; body = "New week, new goals. Open Test Prep Hub to see this week's focus.";
    } else {
      title = streak > 0 ? `Keep your ${streak}-day streak${hi}!` : `${until} to the ${kind}${hi}`;
      body = `This week: ${wsNow.q} of ${wsNow.qTarget} questions. Focus: ${focus}.`;
    }
  }
  if (test) { title = `Reminders are on${hi}`; body = `Here's what a reminder looks like: ${body}`; }
  return { title, body, practiced, left, checkin };
}

// deno-lint-ignore no-explicit-any
async function sendTo(sub: any, payload: object) {
  const server = await getServer();
  try {
    await server.subscribe({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }).pushTextMessage(JSON.stringify(payload), {});
    return "sent";
  } catch (e) {
    const msg = String(e?.message || e);
    // Expired or unsubscribed endpoints: remove them.
    if (/\b(404|410)\b/.test(msg) || e?.isGone?.()) { await admin.from("push_subscriptions").delete().eq("id", sub.id); return "removed"; }
    console.error("push failed", sub.id, msg);
    return "failed";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  let body: { mode?: string } = {};
  try { body = await req.json(); } catch { /* empty body */ }
  await getServer();

  if (body.mode === "test") {
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: u, error } = await admin.auth.getUser(token);
    if (error || !u?.user) return json({ error: "Sign in first" }, 401);
    const { data: subs } = await admin.from("push_subscriptions").select("*").eq("user_id", u.user.id).eq("enabled", true);
    if (!subs?.length) return json({ error: "No devices have reminders turned on" }, 404);
    const { data: prog } = await admin.from("progress").select("data").eq("user_id", u.user.id).maybeSingle();
    const results = [];
    for (const s of subs) {
      const c = compose(prog?.data || {}, localParts(s.tz).date, true, weekdayIn(s.tz));
      results.push(await sendTo(s, { title: c.title, body: c.body, url: SITE, tag: "psat-test" }));
    }
    return json({ ok: true, results });
  }

  if (body.mode === "cron") {
    if (req.headers.get("x-cron-secret") !== cronSecret) return json({ error: "Not allowed" }, 401);
    const { data: subs } = await admin.from("push_subscriptions").select("*").eq("enabled", true);
    const progressCache = new Map<string, unknown>();
    let sent = 0, skipped = 0;
    for (const s of subs || []) {
      const { date, hour } = localParts(s.tz);
      if (s.last_sent_on === date) continue;
      if (hour !== s.remind_hour && hour !== 6) continue;
      if (!progressCache.has(s.user_id)) {
        const { data: prog } = await admin.from("progress").select("data").eq("user_id", s.user_id).maybeSingle();
        progressCache.set(s.user_id, prog?.data || {});
      }
      const c = compose(progressCache.get(s.user_id), date, false, weekdayIn(s.tz));
      const testMorning = hour === 6 && c.left === 0; // good-luck message on test day, 6 a.m.
      const evening = hour === s.remind_hour && c.left > 0; // daily reminder until the test
      if (!testMorning && !evening) continue;
      await admin.from("push_subscriptions").update({ last_sent_on: date }).eq("id", s.id);
      if (evening && c.practiced && !c.checkin) { skipped++; continue; } // already practiced today (Sunday check-ins still go out)
      if ((await sendTo(s, { title: c.title, body: c.body, url: SITE + "?from=reminder", tag: "psat-daily" })) === "sent") sent++;
    }
    return json({ ok: true, sent, skipped });
  }

  return json({ error: "Unknown mode" }, 400);
});
