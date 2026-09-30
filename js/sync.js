/* Test Prep Hub — cloud sync with Supabase.
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
      const local = app.state, localMs = local.updatedAt || 0;
      if (error) {
        // Offline with another student's copy on this device: set it aside and start this student fresh here.
        if (local.owner && local.owner !== user.id) {
          try { localStorage.setItem(BACKUP_KEY + "-" + local.owner, JSON.stringify(local)); } catch (e) { }
          app.replace(Object.assign(app.blank(), { owner: user.id }));
        }
        status = navigator.onLine ? "error" : "offline"; paint(); return;
      }
      const done = () => { app.setOwner(user.id); status = "synced"; lastSynced = new Date(); paint(); };
      const keepCopy = (label) => { try { localStorage.setItem(BACKUP_KEY + (label ? "-" + label : ""), JSON.stringify(local)); } catch (e) { } };

      // This device holds another student's progress: set it aside, never upload it to this account.
      if (local.owner && local.owner !== user.id) {
        keepCopy(local.owner);
        app.replace(data ? data.data : Object.assign(app.blank(), { owner: user.id }));
        done();
        if (first) app.toast(data ? "Loaded your progress" : "Fresh start for this account", true);
        return;
      }
      if (!data) {
        // Progress made on this device before signing in joins the account only if the account is empty.
        if (localMs > 0) { app.setOwner(user.id); await pushNow(); if (first) app.toast("Progress on this device is now saved to your account", true); }
        else done();
        return;
      }
      const remoteMs = Number(data.client_updated_ms) || 0;
      if (!local.owner && localMs > 0) {
        // Anonymous progress on this device vs. an account that already has progress: the account wins.
        keepCopy(); app.replace(data.data); done();
        if (first) app.toast("Loaded your progress from your account", true);
        return;
      }
      if (remoteMs > localMs + 1000 && !app.busy) {
        if (localMs > 0) keepCopy();
        app.replace(data.data); done();
        if (first) app.toast("Loaded your latest progress from your account", true);
      } else if (localMs > remoteMs + 1000) {
        app.setOwner(user.id); await pushNow();
      } else done();
    }

    // The server decides who is admin (confirmed email on its admin list); the page only shows the dashboard.
    async function checkAdmin() {
      if (!user || !app.setAdmin || typeof sb.rpc !== "function") return;
      let data = false, error = null;
      try { ({ data, error } = await sb.rpc("is_admin")); } catch (e) { error = e; }
      if (error || data !== true) { if (app.admin) app.setAdmin(null); setupSocial(); return; }
      const call = async (fn, args) => { const r = await sb.rpc(fn, args); if (r.error) throw r.error; return r.data; };
      app.setAdmin(async () => (await call("admin_dashboard")) || [], {
        createInvite: (note) => call("admin_create_invite", { p_note: note || null }),
        listInvites: async () => (await call("admin_list_invites")) || [],
        revokeInvite: (code) => call("admin_revoke_invite", { p_code: code })
      });
    }
    // Friends: every call is checked on the server (friends only, first names only).
    function setupSocial() {
      if (!user || !app.setSocial || typeof sb.rpc !== "function") return;
      const call = async (fn, args) => { const r = await sb.rpc(fn, args); if (r.error) throw r.error; return r.data; };
      app.setSocial({
        myCode: () => call("my_friend_code"),
        addFriend: (code) => call("add_friend", { p_code: code }),
        respond: (id, yes) => call("respond_friend", { p_user: id, p_accept: yes }),
        remove: (id) => call("remove_friend", { p_user: id }),
        friendsList: () => call("friends_list"),
        board: () => call("friends_board"),
        createChallenge: (to, topic, qs, correct, ms) => call("create_challenge", { p_to: to, p_topic: topic, p_questions: qs, p_correct: correct, p_ms: ms }),
        submitChallenge: (id, correct, ms) => call("submit_challenge", { p_id: id, p_correct: correct, p_ms: ms }),
        challengesList: () => call("challenges_list"),
        cheer: (to, kind) => call("send_cheer", { p_to: to, p_kind: kind }),
        myCheers: () => call("my_cheers")
      });
    }
    // Focus set targets written after a test review (read-only for the student).
    async function loadFocus() {
      if (!user || !app.setFocus) return;
      try { const { data } = await sb.from("focus_targets").select("items, source, updated_at").eq("user_id", user.id).maybeSingle(); app.setFocus(data || null); } catch (e) { }
    }
    async function loadProfile() {
      if (!user) return;
      const { data } = await sb.from("profiles").select("first_name, test_kind, test_date, target_score").eq("user_id", user.id).maybeSingle();
      if (data) app.applyProfile({ name: data.first_name || "", kind: data.test_kind, date: data.test_date || null, target: data.target_score ?? null });
    }
    app.onSettings(async (st) => {
      if (!user) return;
      // Never send a blank name: a fresh device doesn't know the name until the profile loads.
      const row = { user_id: user.id, test_kind: st.kind === "sat" ? "sat" : "psat", test_date: st.date || null, target_score: st.target || null };
      if ((st.name || "").trim()) row.first_name = st.name.trim();
      await sb.from("profiles").upsert(row, { onConflict: "user_id" });
    });

    app.onSave(() => schedulePush());
    window.addEventListener("online", () => { if (user) pushNow(); });
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && user) pull(false); });

    sb.auth.onAuthStateChange((event, session) => {
      const was = user && user.id;
      user = session ? session.user : null;
      if (event === "PASSWORD_RECOVERY") setTimeout(showReset, 0);
      if (user) {
        setTimeout(async () => {
          app.setGuest(false); // load this device's student copy, then reconcile with the account
          app.expect(user.id);
          if (user && user.id !== was) { await pull(true); await loadProfile(); await checkAdmin(); await loadFocus(); }
        }, 0);
      } else {
        status = "off";
        setTimeout(() => app.setGuest(true), 0); // back to the public site; the student's copy stays put
      }
      paint();
      if (user && document.querySelector("#pop .acct") && event !== "SIGNED_IN") setTimeout(openAccount, 0);
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
      if (/database error saving new user|INVITE_CODE/i.test(m)) return "That invite code isn't valid. Codes work once and expire after 30 days; ask the person who shared the site.";
      if (/email.*invalid|invalid.*email/i.test(m)) return "That email address doesn't look right.";
      return m;
    }

    function openAccount(mode) {
      const h = host(); h.textContent = "";
      if (user) {
        const nm = (app.state.settings && app.state.settings.name) || "";
        h.append(el("div", { class: "panelpop acct", role: "dialog", "aria-label": "Account" },
          el("header", {}, el("strong", { text: app.admin ? "Admin account" : nm ? nm + "'s account" : "Your account" }), close()),
          el("p", {}, "Signed in as ", el("strong", { text: user.email })),
          app.admin ? el("p", { class: "muted", style: "font-size:13px", text: "Read-only view of every student's progress. Nothing you do here changes a student's data." }) :
          el("p", { class: "muted", style: "font-size:13px", text: (lastSynced ? "Last synced " + lastSynced.toLocaleString() + ". " : "") + "Every change on this device uploads automatically." }),
          app.admin ? null : el("div", { class: "row" },
            el("button", { class: "btn primary", onclick: async () => { await pull(false); if (status === "synced") await pushNow(); app.toast(status === "synced" ? "Synced" : "Couldn't sync right now"); openAccount(); } }, "Sync now"),
            el("button", { class: "btn", onclick: () => openReminders() }, "Reminders")),
          el("div", { class: "row" },
            el("button", { class: "btn ghost", onclick: async () => { await pushNow(); await sb.auth.signOut(); app.toast("Signed out. Your progress stays on this device."); host().textContent = ""; } }, "Sign out"),
            el("button", { class: "btn ghost", onclick: async () => { await pushNow(); app.reset(); await sb.auth.signOut(); app.toast("Signed out and removed from this device. Your progress is safe in your account."); host().textContent = ""; } }, "Sign out and clear this device")),
          el("p", { class: "muted", style: "font-size:12px", text: "On a shared or school computer, use “Sign out and clear this device.”" })));
        return;
      }
      mode = mode || "in";
      const up = mode === "up";
      const email = el("input", { type: "email", id: "acEmail", autocomplete: "email", required: true, placeholder: "name@example.com" });
      const pw = el("input", { type: "password", id: "acPw", autocomplete: up ? "new-password" : "current-password", minlength: "6", placeholder: "At least 6 characters" });
      const msg = el("p", { class: "err", role: "alert" });
      const submit = el("button", { class: "btn primary", type: "submit" }, up ? "Create account" : "Sign in");
      const fields = [];
      let first, kind, date, grade, code, target;
      if (up) {
        const st = app.state.settings || {};
        first = el("input", { type: "text", id: "acFirst", autocomplete: "given-name", maxlength: "40", required: true, value: app.state.owner ? "" : st.name || "" });
        kind = el("select", { id: "acKind" }, el("option", { value: "psat", text: "PSAT/NMSQT" }), el("option", { value: "sat", text: "SAT" }));
        kind.value = app.state.owner ? "psat" : st.kind || "psat";
        date = el("input", { type: "date", id: "acDate", value: app.state.owner ? "2026-10-07" : st.date || "2026-10-07" });
        grade = el("select", { id: "acGrade" }, ["", "8", "9", "10", "11", "12"].map((g) => el("option", { value: g, text: g ? "Grade " + g : "Choose…" })));
        target = el("input", { type: "number", id: "acTarget", min: "320", max: "1600", step: "10", inputmode: "numeric", placeholder: "e.g. 1300" });
        code = el("input", { type: "text", id: "acCode", autocomplete: "off", maxlength: "20", placeholder: "e.g. SPRINT-XXXXX", style: "text-transform:uppercase" });
        fields.push(
          el("label", { class: "f", for: "acFirst" }, "Student's first name", first),
          el("div", { class: "fields" }, el("label", { class: "f", for: "acKind" }, "Test", kind), el("label", { class: "f", for: "acDate" }, "Test date", date)),
          el("div", { class: "fields" }, el("label", { class: "f", for: "acGrade" }, "Grade", grade), el("label", { class: "f", for: "acTarget" }, "Target score (optional)", target)));
      }
      fields.push(el("label", { class: "f", for: "acEmail" }, up ? "Student's email" : "Email", email), el("label", { class: "f", for: "acPw" }, "Password", pw));
      if (up) fields.push(el("label", { class: "f", for: "acCode" }, "Invite code", code));
      const f = el("form", { class: "panelpop acct", role: "dialog", "aria-label": up ? "Create a student account" : "Sign in", style: "max-height:calc(100vh - 32px);overflow:auto" },
        el("header", {}, el("strong", { text: up ? "Create a student account" : "Sign in" }), close()),
        el("p", { class: "muted", style: "font-size:13px", text: up ? "One account per student. Progress saves online and shows up on every device; a parent can follow along with the same sign-in." : "Sign in to save progress online and see it on every device." }),
        ...fields, msg,
        el("div", { class: "row" }, submit,
          el("button", { type: "button", class: "btn small ghost", onclick: () => openAccount(up ? "in" : "up") }, up ? "I have an account" : "Create a student account"),
          !up ? el("button", { type: "button", class: "btn small ghost", onclick: forgot }, "Forgot password?") : null));
      async function forgot() {
        if (!email.value.trim()) { msg.textContent = "Type the email address first."; return; }
        const { error } = await sb.auth.resetPasswordForEmail(email.value.trim(), { redirectTo: SITE });
        msg.className = error ? "err" : "muted"; msg.textContent = error ? friendly(error) : "Check the inbox for a link to set a new password.";
      }
      f.addEventListener("submit", async (e) => {
        e.preventDefault(); msg.className = "err"; msg.textContent = "";
        const em = email.value.trim(), p = pw.value;
        if (up && !first.value.trim()) { msg.textContent = "Enter the student's first name."; return; }
        if (!em || p.length < 6) { msg.textContent = "Enter an email and a password of at least 6 characters."; return; }
        if (up && !code.value.trim()) { msg.textContent = "Enter the invite code."; return; }
        submit.disabled = true;
        if (up) {
          const meta = { first_name: first.value.trim(), test_kind: kind.value, test_date: date.value || "", grade: grade.value, target_score: target.value ? String(Math.round(+target.value / 10) * 10) : "", invite_code: code.value.trim().toUpperCase() };
          const { data, error } = await sb.auth.signUp({ email: em, password: p, options: { emailRedirectTo: SITE, data: meta } });
          submit.disabled = false;
          if (error) { msg.textContent = friendly(error); return; }
          if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) { msg.textContent = "An account with this email already exists. Sign in instead."; return; }
          if (!data.session) { msg.className = "muted"; msg.textContent = "Account created for " + meta.first_name + ". Open the confirmation link sent to " + em + " (check Spam too), then come back and sign in."; return; }
          host().textContent = ""; app.toast("Welcome, " + meta.first_name + "! Your account is ready.", true);
        } else {
          const { error } = await sb.auth.signInWithPassword({ email: em, password: p });
          submit.disabled = false;
          if (error) { msg.textContent = friendly(error); return; }
          host().textContent = "";
        }
      });
      h.append(f); (up ? first : email).focus();
    }
    document.addEventListener("psapp-account", (e) => openAccount(e.detail));
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

    /* ---------- Study reminders (web push) ---------- */
    const APP_KEY = "BJ9VTfUnx7ubJrlV-oaQfCQhWtBco1uCGjH6eDVPkTbEpjGNz_Jdveg8OK74hGSBRQfznUUXiOQ3dLhmWuQwowU";
    const pushOK = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
    let swReg = null;
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").then((r) => (swReg = r)).catch(() => {});
    const b64u = (str) => { const pad = "=".repeat((4 - (str.length % 4)) % 4); const bin = atob((str + pad).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(bin, (c) => c.charCodeAt(0)); };
    async function currentSub() { const r = swReg || (await navigator.serviceWorker.getRegistration()); return r ? r.pushManager.getSubscription() : null; }
    const hourLabel = (h) => (h % 12 || 12) + ":00 " + (h < 12 ? "am" : "pm");
    const tz = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";

    const isAndroid = /Android/i.test(navigator.userAgent);
    // Step-by-step phone setup, shown in the Reminders panel. The guide for this device opens automatically.
    function phoneGuide(openFor) {
      const ol = (items) => el("ol", { class: "phsteps" }, items.map((t) => el("li", {}, t)));
      const b = (t) => el("strong", { text: t });
      const ios = el("details", { class: "phguide", open: openFor === "ios" }, el("summary", { text: "iPhone or iPad" }),
        ol([
          el("span", {}, "Open this site in ", b("Safari"), ". Needs iOS 16.4 or later (Settings → General → About → iOS Version)."),
          el("span", {}, "Tap the ", b("Share"), " button (the square with an up arrow). On newer iPhones it may be inside the ", b("⋯"), " menu at the bottom."),
          el("span", {}, "Scroll down, tap ", b("Add to Home Screen"), ", then tap ", b("Add"), "."),
          el("span", {}, "Close Safari and open ", b("Test Prep Hub"), " from its new Home Screen icon. Reminders only work from the icon, not from Safari."),
          el("span", {}, "Sign in, scroll to the bottom, and tap ", b("Reminders"), "."),
          el("span", {}, "Pick a time, tap ", b("Turn on reminders"), ", then tap ", b("Allow"), " when iPhone asks."),
          el("span", {}, "Tap ", b("Send a test"), ". A notification should appear within a few seconds.")]),
        el("p", { class: "muted", style: "font-size:13px" }, b("Not getting them? "), "Open iPhone Settings → Notifications → Test Prep Hub and turn on Allow Notifications. Also check that a Focus or Do Not Disturb mode isn't hiding them."));
      const and = el("details", { class: "phguide", open: openFor === "android" }, el("summary", { text: "Android" }),
        ol([
          el("span", {}, "Open this site in ", b("Chrome"), "."),
          el("span", {}, "Optional but handy: tap Chrome's ", b("⋮"), " menu, then ", b("Add to Home screen"), " (or ", b("Install app"), ") for an app icon."),
          el("span", {}, "Sign in, scroll to the bottom, and tap ", b("Reminders"), "."),
          el("span", {}, "Pick a time, tap ", b("Turn on reminders"), ", then tap ", b("Allow"), " when Chrome asks."),
          el("span", {}, "Tap ", b("Send a test"), ". A notification should appear within a few seconds.")]),
        el("p", { class: "muted", style: "font-size:13px" }, b("Not getting them? "), "In Chrome, tap the icon to the left of the web address → Permissions → Notifications → Allow. Then check phone Settings → Apps → Chrome → Notifications is on. Battery saver can delay reminders."));
      return el("div", { class: "phwrap" }, el("div", { class: "eyebrow", text: "Set up on a phone" }), ios, and,
        el("p", { class: "muted", style: "font-size:13px", text: "Reminders are per device: turn them on separately on each phone or computer you want them on." }));
    }
    async function openReminders() {
      const h = host(); h.textContent = "";
      const panel = el("div", { class: "panelpop acct", role: "dialog", "aria-label": "Study reminders" }, el("header", {}, el("strong", { text: "Study reminders" }), close()));
      h.append(panel);
      const add = (...n) => panel.append(...n);
      const msg = el("p", { class: "muted", role: "status", style: "font-size:13px" });
      const here = isIOS ? "ios" : isAndroid ? "android" : null;
      if (isIOS && !standalone) {
        add(el("p", { text: "On iPhone and iPad, reminders work once Test Prep Hub is added to the Home Screen. Follow these steps (your progress comes along after you sign in):" }), phoneGuide("ios"));
        return;
      }
      if (!pushOK) { add(el("p", { text: "This browser can't show notifications. Try Chrome, Edge, or Safari, or set it up on a phone:" }), phoneGuide(here)); return; }
      if (!user) { add(el("p", { text: "Sign in first, so reminders can use your progress to pick what to practice." }), el("div", { class: "row" }, el("button", { class: "btn primary", onclick: () => openAccount() }, "Sign in")), phoneGuide(here)); return; }
      if (Notification.permission === "denied") { add(el("p", { text: "Notifications are blocked for this site. Allow them in your browser's site settings (on a phone, see \"Not getting them?\" below), then come back here." }), phoneGuide(here)); return; }
      const sub = await currentSub();
      let row = null;
      if (sub) { const { data } = await sb.from("push_subscriptions").select("id, remind_hour, enabled").eq("endpoint", sub.endpoint).maybeSingle(); row = data; }
      const sel = el("select", { id: "remindHour", "aria-label": "Reminder time" }, [15, 16, 17, 18, 19, 20, 21].map((hh) => el("option", { value: String(hh), text: hourLabel(hh) })));
      sel.value = String(row ? row.remind_hour : 19);
      add(el("p", { style: "font-size:14px", text: "A daily nudge with the days left and the skill to work on next. It skips days you've already practiced, and sends a good-luck message on test morning." }));
      add(el("label", { class: "f", for: "remindHour" }, "Remind me at", sel));
      if (row && row.enabled) {
        sel.addEventListener("change", async () => {
          const { error } = await sb.from("push_subscriptions").update({ remind_hour: +sel.value, tz: tz() }).eq("id", row.id);
          msg.textContent = error ? friendly(error) : "Reminder time saved: " + hourLabel(+sel.value) + ".";
        });
        add(el("p", {}, el("span", { class: "chip good", text: "On for this device" })),
          el("div", { class: "row" },
            el("button", { class: "btn primary", onclick: async () => {
              msg.textContent = "Sending…";
              const { error } = await sb.functions.invoke("send-reminders", { body: { mode: "test" } });
              msg.textContent = error ? "Couldn't send the test. Try again in a minute." : "Test sent. It should appear in a few seconds.";
            } }, "Send a test"),
            el("button", { class: "btn ghost", onclick: async () => {
              try { await sub.unsubscribe(); } catch (e) { }
              await sb.from("push_subscriptions").delete().eq("id", row.id);
              app.toast("Reminders turned off on this device"); openReminders();
            } }, "Turn off")),
          msg);
      } else {
        const on = el("button", { class: "btn primary", onclick: async () => {
          on.disabled = true; msg.textContent = "Asking the browser for permission…";
          try {
            const perm = await Notification.requestPermission();
            if (perm !== "granted") { msg.textContent = "Notifications weren't allowed, so reminders are off."; on.disabled = false; return; }
            const reg = swReg || (await navigator.serviceWorker.register("sw.js"));
            await navigator.serviceWorker.ready;
            const s = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(APP_KEY) }));
            const j = s.toJSON();
            const { error } = await sb.from("push_subscriptions").upsert({ user_id: user.id, endpoint: s.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, tz: tz(), remind_hour: +sel.value, enabled: true }, { onConflict: "endpoint" });
            if (error) throw error;
            app.toast("Reminders are on", true);
            sb.functions.invoke("send-reminders", { body: { mode: "test" } });
            openReminders();
          } catch (e) { msg.textContent = "Couldn't turn on reminders: " + friendly(e); on.disabled = false; }
        } }, "Turn on reminders");
        add(el("div", { class: "row" }, on), msg);
      }
      add(phoneGuide(row && row.enabled ? null : here));
    }
    const rb = document.getElementById("remindBtn");
    if (rb) rb.addEventListener("click", () => openReminders());

    chip.addEventListener("click", () => openAccount());
    paint();
    window.__psync = { get user() { return user; }, get status() { return status; }, pushNow, pull, sb };
  }

  if (window.PSApp) boot(); else document.addEventListener("psapp-ready", boot, { once: true });
})();
