/* ===== site-pages.js: pages, menu, join form, events calendar and memo board ===== */
(function () {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- router (hash based, so the USB link survives page changes) ---------- */
  const ROUTES = { "": "home", home: "home", about: "about", events: "events", memo: "memo" };
  const TITLES = { home: "The Little Red Flower Club", about: "About Us", events: "Events", memo: "Memo Board" };
  let current = null;
  function route() {
    const key = ROUTES[location.hash.replace(/^#\/?/, "").split("?")[0]] || "home";
    $$(".page").forEach(p => { p.hidden = p.dataset.page !== key; });
    $$(".menu a").forEach(a => a.toggleAttribute("aria-current", a.dataset.page === key) && a.setAttribute("aria-current", "page"));
    document.title = (key === "home" ? "" : TITLES[key] + " | ") + "The Little Red Flower Club";
    window.scrollTo(0, 0); closeMenu();
    if (key === "events") initEvents(); if (key === "memo") initMemo();
    current = key;
  }
  addEventListener("hashchange", route);

  /* ---------- menu ---------- */
  const menu = $("#menu");
  function openMenu() { menu.hidden = false; $$(".menu-btn").forEach(b => b.setAttribute("aria-expanded", "true")); $(".menu-x").focus(); }
  function closeMenu() { if (menu.hidden) return; menu.hidden = true; $$(".menu-btn").forEach(b => b.setAttribute("aria-expanded", "false")); }
  document.addEventListener("click", e => { if (e.target.closest(".menu-btn")) openMenu(); else if (e.target === menu || e.target.closest(".menu-x") || e.target.closest(".menu a")) closeMenu(); });
  addEventListener("keydown", e => { if (e.key === "Escape") { closeMenu(); closeModal(); } });

  /* ---------- join form (front end only: nothing is saved) ---------- */
  document.addEventListener("submit", e => {
    const f = e.target.closest(".join"); if (!f) return; e.preventDefault();
    const name = f.name.value.trim(), mail = f.email.value.trim(), msg = $(".join-msg", f);
    if (!name || !/.+@.+\..+/.test(mail)) { msg.textContent = "Add your name and a real email to join."; return; }
    msg.textContent = `Welcome to the club, ${name}! (Prototype: nothing is saved.)`; f.reset();
  });

  /* ---------- home: tap to place the petal on touch screens ---------- */
  document.addEventListener("click", e => { const w = e.target.closest(".well"); if (w && matchMedia("(hover:none)").matches) w.classList.toggle("go"); });

  /* ---------- events: today circle + flowers + tips ---------- */
  const CAL = { x: 210, y: 464, w: 1583, h: 781 };
  const DATES = {1:[1451,663,17,36],2:[254,819,19,34],3:[431,800,17,37],4:[621,801,19,34],5:[838,802,16,35],6:[1054,801,15,35],7:[1255,800,18,33],8:[1459,795,14,34],9:[257,944,14,33],10:[422,926,35,36],11:[613,926,37,36],12:[827,926,38,36],13:[1043,919,36,37],14:[1245,918,38,36],15:[1449,914,35,36],16:[259,1074,34,36],17:[423,1057,37,36],18:[614,1057,33,36],19:[829,1053,33,36],20:[1037,1052,37,34],21:[1247,1047,38,36],22:[1446,1046,40,34],23:[268,1184,38,37],24:[433,1168,40,36],25:[624,1169,37,35],26:[839,1164,36,36],27:[1046,1163,39,34],28:[1259,1158,35,36],29:[1459,1157,35,35],30:[1653,1169,34,37]};
  const EVENTS = [
    { day: 4, name: "Bake & Chill", wd: "Wed", art: "ev-flower-4", rect: [691, 740, 90, 90], cell: [592, 725, 216, 126] },
    { day: 15, name: "Make & Play", wd: "Sun", art: "ev-flower-15", rect: [1545, 845, 83, 83], cell: [1435, 837, 212, 127] },
    { day: 23, name: "Redo & Replay", wd: "Mon", art: "ev-flower-23", rect: [318, 1116, 83, 83], cell: [235, 1107, 177, 129] }
  ];
  const px = (v, o, t) => (((v - o) / t) * 100).toFixed(3) + "%";
  function today() {
    const q = new URLSearchParams(location.hash.split("?")[1] || location.search).get("today");
    return q ? new Date(q + "T12:00:00") : new Date();
  }
  function scribble(cx, cy, rx, ry) {
    const n = 70, pts = [];
    for (let i = 0; i <= n; i++) { const a = -2.2 + (i / n) * Math.PI * 2.18, w = 1 + 0.05 * Math.sin(i * 0.37 + cx) + 0.025 * Math.sin(i * 0.9), g = 1 + (i / n) * 0.07;
      pts.push([cx + Math.cos(a) * rx * w * g, cy + Math.sin(a) * ry * w * g]); }
    return "M" + pts.map(p => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L");
  }
  let eventsReady = false;
  function initEvents() {
    const d = today(), isNov = d.getFullYear() === 2026 && d.getMonth() === 10, day = d.getDate();
    const cal = $("#p-events #cal"), host = $("#p-events #evflowers"), svg = $("#p-events #today"), tip = $("#p-events #evtip");
    host.innerHTML = ""; svg.innerHTML = "";
    EVENTS.forEach(ev => {
      const past = isNov ? day > ev.day : d > new Date(2026, 10, ev.day), [fx, fy, fw, fh] = ev.rect, [cx, cy, cw, ch] = ev.cell;
      const b = document.createElement("button"); b.className = "ev"; b.setAttribute("aria-label", `${ev.name}, ${ev.wd} ${ev.day} November${past ? " (past)" : ""}`);
      b.style.cssText = `left:${px(cx, CAL.x, CAL.w)};top:${px(cy, CAL.y, CAL.h)};width:${(cw / CAL.w * 100).toFixed(3)}%;height:${(ch / CAL.h * 100).toFixed(3)}%`;
      const rel = (v, o, t) => ((v - o) / t * 100).toFixed(2) + "%";
      let h = `<img class="fl" src="img/${ev.art}.svg" alt="" style="left:${rel(fx, cx, cw)};top:${rel(fy, cy, ch)};width:${(fw / cw * 100).toFixed(2)}%">`;
      if (past) h += `<img src="img/petal.png" alt="" style="left:${rel(fx + fw * 0.433, cx, cw)};top:${rel(fy + fh * 0.578, cy, ch)};width:${(fw * 0.378 / cw * 100).toFixed(2)}%">`;
      b.innerHTML = h; host.appendChild(b);
      const show = () => { tip.textContent = `${ev.name} · ${ev.wd} ${ev.day} Nov${past ? " (done)" : ""}`; tip.style.left = px(cx + cw / 2, CAL.x, CAL.w); tip.style.top = px(cy, CAL.y, CAL.h); tip.classList.add("on"); };
      b.addEventListener("mouseenter", show); b.addEventListener("focus", show); b.addEventListener("click", show);
      b.addEventListener("mouseleave", () => tip.classList.remove("on")); b.addEventListener("blur", () => tip.classList.remove("on"));
    });
    if (isNov && DATES[day]) {
      const [x, y, w, h] = DATES[day], cx = x + w / 2, cy = y + h / 2, ns = "http://www.w3.org/2000/svg";
      const p = document.createElementNS(ns, "path"); p.setAttribute("d", scribble(cx, cy, 44, 40)); svg.appendChild(p);
      const t = document.createElementNS(ns, "text"); t.setAttribute("x", cx + 22); t.setAttribute("y", cy - 46); t.textContent = "today"; t.style.opacity = 0; t.style.transition = "opacity .5s 1s"; svg.appendChild(t);
      const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; p.getBoundingClientRect();
      p.style.transition = "stroke-dashoffset 1s ease-out .3s"; p.style.strokeDashoffset = 0; t.style.opacity = 1;
    }
  }

  /* ---------- memo board ---------- */
  const TYPES = {
    A: { label: "Event Request:", frame: "noteA-frame", icon: "noteA-icon", nw: 374.5, ar: 1.0196, tilt: -1.6, il: 61.5, it: 57.0, iw: 20.2, tilt2: -2 },
    B: { label: "Discussion:", frame: "noteB-frame", icon: "noteB-icon", nw: 406.2, ar: 1.027, tilt: 7.6, il: 52.5, it: 66.2, iw: 26.5, tilt2: 1 },
    C: { label: "General:", frame: "noteC-frame", icon: "noteC-icon", nw: 404.4, ar: 1.0128, tilt: -7.9, il: 60.3, it: 59.6, iw: 22.7, tilt2: 2 }
  };
  const KEY = "lrfc-memo-v1", DAY = 864e5;
  const SEEDS = [
    { id: "s1", t: "A", seed: true, text: "Does anyone remember making Loom Bands? I would love a Make & Play session on that!" },
    { id: "s2", t: "C", seed: true, text: "I want to join the redo & Replay event on the 23rd but it's my first time. Is there anything I need to do beforehand?" },
    { id: "s3", t: "B", seed: true, text: "How does everyone manage their pre-exam anxiety? I always tell myself that it isn't a bit deal but I still stress over it :(" }
  ];
  let posts = [], topic = "all", memoReady = false;
  function load() {
    let saved = []; try { saved = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) {}
    const now = Date.now(); posts = saved.filter(p => p.seed || now - p.ts < 3 * DAY);   // posts refresh after 3 days
    SEEDS.forEach(s => { if (!posts.some(p => p.id === s.id)) posts.push({ ...s, ts: 0 }); });
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(posts)); } catch (e) {} }
  const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function render(freshId) {
    const sc = $("#p-memo #scroll"), board = $("#p-memo #board"); if (!sc) return;
    const list = posts.filter(p => topic === "all" || p.t === topic).sort((a, b) => (b.ts || 0) - (a.ts || 0));
    sc.innerHTML = list.map((p, i) => { const T = TYPES[p.t], rot = p.seed ? 0 : ((p.id.charCodeAt(p.id.length - 1) % 5) - 2), tot = p.seed ? 0 : rot + T.tilt2;
      return `<article class="note ${p.id === freshId ? "fresh" : ""}" data-t="${p.t}" tabindex="0" style="--nw:${T.nw};--ar:${T.ar};--rot:${tot}deg" aria-label="${T.label} ${esc(p.text)}">
        <img class="nf" src="img/${T.frame}.svg" alt=""><div class="nc" style="transform:rotate(${T.tilt}deg)"><h4 class="lr">${T.label}</h4><p class="mt">${esc(p.text)}</p></div>
        <img class="ni" src="img/${T.icon}.svg" alt="" style="left:${T.il}%;top:${T.it}%;width:${T.iw}%"></article>`; }).join("");
    board.dataset.t = topic; $("#p-memo #showall").hidden = topic === "all";
    if (freshId) sc.scrollTo({ top: 0, behavior: "smooth" });
  }
  function setTopic(t) { topic = topic === t ? "all" : t; render(); }
  function initMemo() { if (!memoReady) { load(); memoReady = true; } render(); }
  document.addEventListener("click", e => {
    const n = e.target.closest("#p-memo .note"); if (n) setTopic(n.dataset.t);
    if (e.target.closest("#showall")) { topic = "all"; render(); }
    if (e.target.closest("#postbtn")) openModal();
    if (e.target.closest(".modal .close") || e.target.classList.contains("modal")) closeModal();
  });
  document.addEventListener("keydown", e => { const n = e.target.closest && e.target.closest("#p-memo .note"); if (n && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); setTopic(n.dataset.t); } });

  /* post modal */
  const modal = $("#postmodal"); let pick = "A";
  function openModal() { modal.hidden = false; pick = "A"; $$(".topics button", modal).forEach(b => b.setAttribute("aria-pressed", b.dataset.t === pick)); $("textarea", modal).value = ""; count(); preview(pick); $("textarea", modal).focus(); }
  function closeModal() { if (modal.hidden) return; modal.hidden = true; const b = $("#p-memo #board"); if (b) b.dataset.t = topic; }
  function preview(t) { const b = $("#p-memo #board"); if (b) b.dataset.t = t; }
  function count() { const v = $("textarea", modal).value.length; $(".count", modal).textContent = v + "/160"; $(".pin", modal).disabled = !v.toString() || v < 3; }
  modal.addEventListener("click", e => { const b = e.target.closest(".topics button"); if (!b) return; pick = b.dataset.t; $$(".topics button", modal).forEach(x => x.setAttribute("aria-pressed", x === b)); preview(pick); });
  $("textarea", modal).addEventListener("input", count);
  $(".pin", modal).addEventListener("click", () => {
    const text = $("textarea", modal).value.trim().replace(/\s+/g, " "); if (text.length < 3) return;
    const id = "p" + Date.now().toString(36); posts.push({ id, t: pick, text: text.slice(0, 160), ts: Date.now() }); save();
    topic = pick; modal.hidden = true; render(id);
  });
  /* host tools: Shift+E export posts, Shift+I import, Shift+X clear (for compiling posts on the exhibition laptop) */
  addEventListener("keydown", e => {
    if (!e.shiftKey || /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (current !== "memo") return;
    if (e.key === "E") { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(posts, null, 1)], { type: "application/json" })); a.download = "lrfc-memo-posts.json"; a.click(); }
    if (e.key === "I") { const f = document.createElement("input"); f.type = "file"; f.accept = ".json"; f.onchange = () => f.files[0].text().then(t => { try { const inc = JSON.parse(t); inc.forEach(p => { if (!posts.some(x => x.id === p.id)) posts.push(p); }); save(); render(); } catch (er) {} }); f.click(); }
    if (e.key === "X" && confirm("Clear all member posts on this laptop?")) { posts = posts.filter(p => p.seed); save(); render(); }
  });
  document.addEventListener("lrfc-reset", () => { topic = "all"; if (memoReady) render(); });

  route();
})();
