// Test Prep Hub — coach notes to the admin's Telegram (Supabase Edge Function "coach-note").
// POST {text, student?} + x-cron-secret → sends the text (HTML) to every linked chat. Used by the scheduled
// coaching tasks (daily tune, weekly review) so they can report without touching the report function.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.117.2";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: true });
  const { data: sec } = await admin.from("app_secrets").select("name, value").eq("name", "cron_secret").maybeSingle();
  if (!sec || req.headers.get("x-cron-secret") !== sec.value) return json({ error: "forbidden" }, 403);
  const body = await req.json().catch(() => ({}));
  const text = String(body.text || "").trim().slice(0, 3800);
  if (!text) return json({ error: "text required" }, 400);
  if (!TOKEN) return json({ error: "TELEGRAM_BOT_TOKEN is not set" }, 400);
  const { data: chats } = await admin.from("telegram_chats").select("chat_id").eq("enabled", true);
  const sent = [];
  for (const c of chats || []) {
    const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: c.chat_id, text: "🧭 " + text, parse_mode: "HTML", disable_web_page_preview: true }) });
    sent.push({ chat: c.chat_id, ok: r.ok });
  }
  return json({ ok: true, sent });
});
