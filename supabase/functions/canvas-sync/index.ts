// Test Prep Hub — Canvas homework sync (Supabase Edge Function "canvas-sync").
// Reads each student's Canvas calendar feed (an .ics link the student copies from Canvas → Calendar → Calendar Feed,
// stored as app_secrets "canvas_ics_<user_id>") and writes the upcoming assignments into the student's inbox
// (focus_targets.items) as one item {type:"hw", hw:{at, items:[...]}}. The app shows them on the Tonight card.
// POST {mode:"cron"} + x-cron-secret → runs at 3:30 pm and 9 pm New York time (pg_cron calls it at the UTC hours
//   that can match either; the function checks the local clock). The 9 pm run marks anything added since 3:30 as new.
// POST {mode:"now"} + x-cron-secret → runs right away, for testing. {mode:"preview"} returns the parsed items only.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.117.2";

const TZ = "America/New_York";
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
function localParts(d = new Date()) {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "numeric", minute: "2-digit", hourCycle: "h23" });
  const o: Record<string, string> = {}; for (const p of f.formatToParts(d)) o[p.type] = p.value;
  return { date: `${o.year}-${o.month}-${o.day}`, hour: Number(o.hour) % 24, minute: Number(o.minute) };
}
function addDays(ymd: string, n: number) { const d = new Date(ymd + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }

// Course names as the student says them.
function shortCourse(c: string) {
  const s = c.toUpperCase();
  if (s.includes("SPANISH")) return "Spanish";
  if (s.includes("PHYSICS")) return "Physics";
  if (s.includes("EURO")) return "AP Euro";
  if (s.includes("ENG COMPO") || s.includes("ENGLISH")) return "AP English";
  if (s.includes("ORCHESTRA")) return "Orchestra";
  if (s.includes("PRECALC") || s.includes("TRIG")) return "Precalc";
  if (s.includes("CHEM")) return "Chemistry";
  if (s.includes("GEOMETRY")) return "Geometry";
  if (s.includes("SOPHOMORE") || s.includes("HOMEROOM") || s.includes("COUNSELOR") || s.includes("NJHS") || s.includes("CLUB")) return "School";
  return c.replace(/\s*[-(\[].*$/, "").trim().slice(0, 18) || "School";
}
// Minutes a student should plan for, from the kind of item. The student can change it with a tap in the app.
function estimate(name: string, pts: number | null) {
  const n = name.toLowerCase();
  if (/concert|performance|field trip|homecoming|court|dance|rehearsal/.test(n) && !/evaluation|reflection|assignment|worksheet|essay|write/.test(n)) return 0;
  if (/\b(test|exam|assessment|quiz|prueba|mcq|saq|leq)\b/.test(n)) return 30;
  if (/bellwork|binder check|classwork|puntos extras|extra credit/.test(n)) return 10;
  if (pts == null) return 20;
  if (pts >= 100) return 45; if (pts >= 20) return 25; return 10;
}
function unescapeIcs(s: string) { return s.replace(/\\n/g, " ").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\").replace(/\s+/g, " ").trim(); }
type Hw = { id: string; name: string; course: string; due: string; time?: string; pts: number | null; est: number; url?: string; added?: string };
function parseIcs(text: string, from: string, to: string): Hw[] {
  const unfolded = text.replace(/\r?\n[ \t]/g, "");
  const out: Hw[] = [];
  for (const block of unfolded.split("BEGIN:VEVENT").slice(1)) {
    const get = (k: string) => { const m = block.match(new RegExp("^" + k + "(?:;[^:\\n]*)?:(.*)$", "m")); return m ? m[1].trim() : ""; };
    const dt = get("DTSTART"); if (!dt) continue;
    let due = dt.slice(0, 4) + "-" + dt.slice(4, 6) + "-" + dt.slice(6, 8), time: string | undefined;
    if (dt.includes("T")) { // UTC datetime → local wall clock
      const lp = localParts(new Date(`${due}T${dt.slice(9, 11)}:${dt.slice(11, 13)}:00Z`));
      due = lp.date; time = String(lp.hour).padStart(2, "0") + ":" + String(lp.minute).padStart(2, "0");
    }
    if (due < from || due > to) continue;
    const sum = unescapeIcs(get("SUMMARY"));
    const m = sum.match(/^(.*?)\s*\[([^\]]+)\]\s*$/);
    const name = (m ? m[1] : sum).replace(/\s*\([^)]*(Period|Block|YR|S1|S2)[^)]*\)\s*$/i, "").trim(), course = m ? m[2] : "";
    const ptsM = unescapeIcs(get("DESCRIPTION")).match(/(\d+(?:\.\d+)?)\s*(?:points|pts)/i), pts = ptsM ? Number(ptsM[1]) : null;
    out.push({ id: get("UID").replace(/@.*$/, "").slice(0, 60), name, course: shortCourse(course), due, time, pts, est: estimate(name, pts), url: get("URL") || undefined });
  }
  const seen = new Set<string>();
  return out.filter((x) => x.name && !seen.has(x.id) && seen.add(x.id)).sort((a, b) => a.due.localeCompare(b.due) || a.course.localeCompare(b.course));
}

async function syncOne(userId: string, url: string, when: { date: string; hour: number }, write: boolean) {
  const r = await fetch(url, { headers: { "User-Agent": "TestPrepHub/1.0" } });
  if (!r.ok) return { userId, error: "feed " + r.status };
  const items = parseIcs(await r.text(), addDays(when.date, -3), addDays(when.date, 14));
  if (!write) return { userId, n: items.length, items };
  const { data: row } = await admin.from("focus_targets").select("items, source").eq("user_id", userId).maybeSingle();
  const cur: Record<string, unknown>[] = Array.isArray(row?.items) ? row!.items : [];
  const old = cur.find((x) => x && x.type === "hw") as { hw?: { items?: Hw[]; at?: string } } | undefined;
  const known = new Map((old?.hw?.items || []).map((x) => [x.id, x]));
  const stamp = when.date + " " + String(when.hour).padStart(2, "0") + ":" + (when.hour === 15 ? "30" : "00");
  for (const it of items) { const k = known.get(it.id); it.added = k?.added || stamp; if (k && k.est !== estimate(k.name, k.pts)) it.est = k.est; }
  const next = cur.filter((x) => !(x && x.type === "hw")).concat([{ type: "hw", hw: { at: stamp, items } }]);
  const { error } = await admin.from("focus_targets").upsert({ user_id: userId, items: next, source: row?.source || "canvas", updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  return { userId, n: items.length, newSinceLast: items.filter((x) => x.added === stamp).length, error: error?.message };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: true });
  const { data: sec } = await admin.from("app_secrets").select("name, value");
  const S = Object.fromEntries((sec || []).map((r: { name: string; value: string }) => [r.name, r.value])) as Record<string, string>;
  if (req.headers.get("x-cron-secret") !== S.cron_secret) return json({ error: "forbidden" }, 403);
  const body = await req.json().catch(() => ({}));
  const lp = localParts();
  if (body.mode === "cron") {
    // Scheduled at the UTC hours that can be 3:30 pm or 9 pm in New York; run only when the local clock agrees.
    const slot = lp.hour === 15 && lp.minute >= 25 ? 15 : lp.hour === 21 && lp.minute < 25 ? 21 : null;
    if (!slot) return json({ ok: true, skipped: "not a run time", local: lp });
    lp.hour = slot;
  } else if (body.mode !== "now" && body.mode !== "preview") return json({ error: "unknown mode" }, 400);
  const feeds = Object.entries(S).filter(([k]) => k.startsWith("canvas_ics_")).map(([k, v]) => [k.slice(11), v]);
  const out = [];
  for (const [uid, url] of feeds) { try { out.push(await syncOne(uid, url, lp, body.mode !== "preview")); } catch (e) { out.push({ userId: uid, error: String(e) }); } }
  return json({ ok: true, local: lp, results: out });
});
