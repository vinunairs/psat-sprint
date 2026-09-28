/* PSAT Sprint — cloud sync with Supabase.
   Progress is always saved on the device first (localStorage), then uploaded to the
   signed-in account. On open, the newer copy (device or cloud) wins; the replaced
   copy is kept on the device under "psat-sprint-v2-before-sync" as a safety net. */
(function () {
  "use strict";
  const SUPABASE_URL = "https://frdcgfafsumdqjbjdhmf.supabase.co";
  const SUPABASE_KEY = "sb_publishable_S-5a43bXpPvd_aDsrcp44A_D8TQTAOw"; // public key; access is protected by row-level security
  const SITE = location.origin + location.pathname;
  const BACKUP_KEY = "psat-sprint-v2-before-sync";

  function boot() {
    const app = window.PSApp;
    const chip = document.getElementById("syncBtn");
    if (!app || !chip) return;
    if (!window.supabase || !window.supabase.createClient) { chip.className = "syncchip off"; chip.textContent = "Sync unavailable"; return; }

    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "implicit" }
    });
    let user = null, pushing = false, pending = false, timer = null, lastSynced = null, status = "off";

    function setChip(kind, text) {
      status = kind;
      chip.className = "syncchip " + kind;
      chip.textContent = text;
    }
    function paint() {
      if (!user) return setChip("off", "Sign in to sync");
      if (status === "syncing") return setChip("syncing", "Syncing…");
      if (status === "offline") return setChip("offline", "Offline · saved on device");
      if (status === "error") return setChip("error", "Sync problem · tap");
      setChip("synced", "Synced" + (lastSynced ? " " + lastSynced.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : ""));
    }

    async function pushNow() {
      if (!user) return;
      if (pushing) { pending = true; return; }
      pushing = true; status = "syncing"; paint();
      const s = app.state;
      const { error } = await sb.from("progress").upsert({ user_id: user.id, data: s, client_updated_ms: s.updatedAt || Date.now() }, { onConflict: "user_id" });
      pushing = false;
      if (error) { status = navigator.onLine ? "error" : "offline"; paint(); }
      else { status = "synced"; lastSynced = new Date(); paint(); }
      if (pending) { pending = false; pushNow(); }
    }
    function schedulePush() { if (!user) return; clearTimeout(timer); timer = setTimeout(pushNow, 1500); }

    async function pull(first) {
      if (!user) return;
      if (app.busy && !first) return; // never swap data under an in-progress test or practice set
      status = "syncing"; paint();
      const { data, error } = await sb.from("progress").select("data, client_updated_ms").eq("user_id", user.id).maybeSingle();
      if (error) { status = navigator.onLine ? "error" : "offline"; paint(); return; }
      const local = app.state, localMs = local.updatedAt || 0;
      if (!data) {
        if (localMs > 0) { await pushNow(); if (first) app.toast("Progress on this device is now saved to the account", true); }
        else { status = "synced"; lastSynced = new Date(); paint(); }
        return;
      }
      const remoteMs = Number(data.client_updated_ms) || 0;
      if (remoteMs > localMs + 1000 && !app.busy) {
        if (localMs > 0) { try { localStorage.setItem(BACKUP_KEY, JSON.stringify(local)); } catch (e) { } }
        app.replace(data.data);
        status = "synced"; lastSynced = new Date(); paint();
        if (first) app.toast("Loaded his latest progress from the account", true);
      } else if (localMs > remoteMs + 1000) {
        await pushNow();
      } else { status = "synced"; lastSynced = new Date(); paint(); }
    }

    app.onSave(() => schedulePush());
    window.addEventListener("online", () => { if (user) pushNow(); });
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && user) pull(false); });

    sb.auth.onAuthStateChange((event, session) => {
      const was = user && user.id;
      user = session ? session.user : null;
      if (event === "PASSWORD_RECOVERY") setTimeout(showReset, 0);
      if (user && user.id !== was) setTimeout(() => pull(true), 0);
      if (!user) status = "off";
      paint();
      if (document.querySelector("#pop .acct")) setTimeout(openAccount, 0);
    });

    /* ---------- Account panel ---------- */
    const el = (tag, attrs = {}, ...kids) => {
      const e = document.createElement(tag);
      for (const [k, v] of Object.entries(attrs)) { if (v == null || v === false) continue; if (k === "class") e.className = v; else if (k === "text") e.textContent = v; else if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? "" : v); }
      for (const k of kids.flat()) if (k != null && k !== false) e.append(k instanceof Node ? k : document.createTextNode(String(k)));
      return e;
    };
    const host = () => document.getElementById("pop");
    const close = () => el("button", { type: "button", class: "btn small ghost", onclick: () => (host().textContent = "") }, "Close");
    function friendly(err) {
      const m = (err && err.message) || String(err);
      if (/invalid login/i.test(m)) return "Email or password is incorrect.";
      if (/not confirmed/i.test(m)) return "Confirm the email address first: open the link in the confirmation email, then sign in.";
      if (/already registered|already exists/i.test(m)) return "An account with this email already exists. Sign in instead.";
      if (/password/i.test(m) && /6|short|least/i.test(m)) return "Use a password with at least 6 characters.";
      if (/rate limit|too many/i.test(m)) return "Too many attempts. Wait a few minutes and try again.";
      if (/fetch|network/i.test(m)) return "Can't reach the sync service. Check the internet connection.";
      return m;
    }

    function openAccount(mode) {
      const h = host(); h.textContent = "";
      if (user) {
        h.append(el("div", { class: "panelpop acct", role: "dialog", "aria-label": "Account" },
          el("header", {}, el("strong", { text: "Progress sync" }), close()),
          el("p", {}, "Signed in as ", el("strong", { text: user.email })),
          el("p", { class: "muted", style: "font-size:13px", text: lastSynced ? "Last synced " + lastSynced.toLocaleString() + ". Every change on this device uploads automatically." : "Every change on this device uploads automatically." }),
          el("div", { class: "row" },
            el("button", { class: "btn primary", onclick: async () => { await pull(false); if (status === "synced") await pushNow(); app.toast(status === "synced" ? "Synced" : "Couldn't sync right now"); openAccount(); } }, "Sync now"),
            el("button", { class: "btn ghost", onclick: async () => { await pushNow(); await sb.auth.signOut(); app.toast("Signed out. Progress stays on this device."); host().textContent = ""; } }, "Sign out"))));
        return;
      }
      mode = mode || "in";
      const email = el("input", { type: "email", id: "acEmail", autocomplete: "email", required: true, placeholder: "name@example.com" });
      const pw = el("input", { type: "password", id: "acPw", autocomplete: mode === "up" ? "new-password" : "current-password", minlength: "6", placeholder: "At least 6 characters" });
      const msg = el("p", { class: "err", role: "alert" });
      const busyBtn = (b, on) => { b.disabled = on; };
      const submit = el("button", { class: "btn primary", type: "submit" }, mode === "up" ? "Create account" : "Sign in");
      const f = el("form", { class: "panelpop acct", role: "dialog", "aria-label": "Sign in to sync" },
        el("header", {}, el("strong", { text: mode === "up" ? "Create an account" : "Sign in to sync" }), close()),
        el("p", { class: "muted", style: "font-size:13px", text: "Signing in saves his progress online so it shows up on every device, and you can check it from yours with the same account. Progress already on this device is kept." }),
        el("label", { class: "f", for: "acEmail" }, "Email", email),
        el("label", { class: "f", for: "acPw" }, "Password", pw),
        msg,
        el("div", { class: "row" }, submit,
          el("button", { type: "button", class: "btn small ghost", onclick: () => openAccount(mode === "up" ? "in" : "up") }, mode === "up" ? "I have an account" : "Create account"),
          mode === "in" ? el("button", { type: "button", class: "btn small ghost", onclick: forgot }, "Forgot password?") : null));
      async function forgot() {
        if (!email.value.trim()) { msg.textContent = "Type the email address first."; return; }
        const { error } = await sb.auth.resetPasswordForEmail(email.value.trim(), { redirectTo: SITE });
        msg.className = error ? "err" : "muted"; msg.textContent = error ? friendly(error) : "Check the inbox for a link to set a new password.";
      }
      f.addEventListener("submit", async (e) => {
        e.preventDefault(); msg.className = "err"; msg.textContent = "";
        const em = email.value.trim(), p = pw.value;
        if (!em || p.length < 6) { msg.textContent = "Enter an email and a password of at least 6 characters."; return; }
        busyBtn(submit, true);
        if (mode === "up") {
          const { data, error } = await sb.auth.signUp({ email: em, password: p, options: { emailRedirectTo: SITE } });
          busyBtn(submit, false);
          if (error) { msg.textContent = friendly(error); return; }
          if (!data.session) { msg.className = "muted"; msg.textContent = "Account created. Open the confirmation link sent to " + em + ", then come back here and sign in."; return; }
          host().textContent = ""; app.toast("Account created and signed in", true);
        } else {
          const { error } = await sb.auth.signInWithPassword({ email: em, password: p });
          busyBtn(submit, false);
          if (error) { msg.textContent = friendly(error); return; }
          host().textContent = "";
        }
      });
      h.append(f); email.focus();
    }
    function showReset() {
      const h = host(); h.textContent = "";
      const pw = el("input", { type: "password", id: "newPw", autocomplete: "new-password", minlength: "6" });
      const msg = el("p", { class: "err", role: "alert" });
      const f = el("form", { class: "panelpop", role: "dialog", "aria-label": "Set a new password" },
        el("header", {}, el("strong", { text: "Set a new password" }), close()),
        el("label", { class: "f", for: "newPw" }, "New password", pw), msg, el("button", { class: "btn primary", type: "submit" }, "Save password"));
      f.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (pw.value.length < 6) { msg.textContent = "Use at least 6 characters."; return; }
        const { error } = await sb.auth.updateUser({ password: pw.value });
        if (error) { msg.textContent = friendly(error); return; }
        h.textContent = ""; app.toast("Password updated", true);
      });
      h.append(f); pw.focus();
    }

    chip.addEventListener("click", () => openAccount());
    paint();
    window.__psync = { get user() { return user; }, get status() { return status; }, pushNow, pull, sb };
  }

  if (window.PSApp) boot(); else document.addEventListener("psapp-ready", boot, { once: true });
})();
