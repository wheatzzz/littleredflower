/* ===== site-pages.js: pages, menu, join form, events calendar and memo board ===== */
(function () {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- pop-up helper (menu, event card, memo post, new post) ---------- */
  let openPopEl = null, lastFocus = null;
  const FOCUSABLE = 'a[href],button:not([disabled]),textarea,input,[tabindex="0"]';
  function openPop(el, opener) {
    if (openPopEl && openPopEl !== el) closePop(openPopEl, true);
    lastFocus = opener || document.activeElement; el.hidden = false; openPopEl = el;
    const first = el.querySelector(".close, .menu-x"); if (first) first.focus({ preventScroll: true });
  }
  function closePop(el, quiet) {
    if (!el || el.hidden) return; el.hidden = true; if (openPopEl === el) openPopEl = null;
    el.dispatchEvent(new Event("pop-closed"));
    if (!quiet && lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }
  addEventListener("keydown", e => {
    if (!openPopEl) return;
    if (e.key === "Escape") { closePop(openPopEl); return; }
    if (e.key !== "Tab") return;                                   // keep Tab inside the open pop-up
    const f = $$(FOCUSABLE, openPopEl).filter(x => x.offsetParent !== null); if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });
  document.addEventListener("click", e => {
    if (!openPopEl) return;
    if (e.target === openPopEl || e.target.closest(".close")) closePop(openPopEl);   // click outside the card, or the X
  });

  /* ---------- router (hash based, so the USB link survives page changes) ---------- */
  const ROUTES = { "": "home", home: "home", about: "about", events: "events", memo: "memo" };
  const TITLES = { home: "The Little Red Flower Club", about: "About Us", events: "Events", memo: "Memo Board" };
  let current = null;
  function route() {
    const key = ROUTES[location.hash.replace(/^#\/?/, "").split("?")[0]] || "home";
    $$(".page").forEach(p => { p.hidden = p.dataset.page !== key; });
    $$(".menu a").forEach(a => a.toggleAttribute("aria-current", a.dataset.page === key) && a.setAttribute("aria-current", "page"));
    document.title = (key === "home" ? "" : TITLES[key] + " | ") + "The Little Red Flower Club";
    window.scrollTo(0, 0); if (openPopEl) closePop(openPopEl, true);
    if (key === "events") initEvents(); if (key === "memo") initMemo();
    current = key;
  }
  addEventListener("hashchange", route);

  /* ---------- menu (Figma Group 10) ---------- */
  const menu = $("#menu");
  menu.addEventListener("pop-closed", () => $$(".menu-btn").forEach(b => b.setAttribute("aria-expanded", "false")));
  document.addEventListener("click", e => {
    const b = e.target.closest(".menu-btn"); if (!b) return;
    $$(".menu-btn").forEach(x => x.setAttribute("aria-expanded", "true")); openPop(menu, b);
  });
  menu.addEventListener("click", e => { if (e.target.closest(".menu-x") || e.target.closest(".menu a")) closePop(menu, !!e.target.closest(".menu a")); });

  /* ---------- join form (front end only: nothing is saved) ---------- */
  const joinModal = $("#joinmodal");
  joinModal.addEventListener("click", e => { if (e.target.closest(".jm-go")) closePop(joinModal, true); });
  document.addEventListener("submit", e => {
    const f = e.target.closest(".join"); if (!f) return; e.preventDefault();
    const name = f.name.value.trim(), mail = f.email.value.trim(), msg = $(".join-msg", f);
    if (!name || !/.+@.+\..+/.test(mail)) { msg.textContent = "Add your name and a real email to join."; return; }
    msg.textContent = ""; f.reset();
    $(".jm-name", joinModal).textContent = name; openPop(joinModal, $(".join-btn", f));   // welcome pop-up
  });

  /* ---------- home: tap to place the petal on touch screens ---------- */
  document.addEventListener("click", e => { const w = e.target.closest(".well"); if (w && matchMedia("(hover:none)").matches) w.classList.toggle("go"); });

  /* ---------- events: today circle + flowers + tips + event cards ---------- */
  const CAL = { x: 210, y: 464, w: 1583, h: 781 };
  const DATES = {1:[1451,663,17,36],2:[254,819,19,34],3:[431,800,17,37],4:[621,801,19,34],5:[838,802,16,35],6:[1054,801,15,35],7:[1255,800,18,33],8:[1459,795,14,34],9:[257,944,14,33],10:[422,926,35,36],11:[613,926,37,36],12:[827,926,38,36],13:[1043,919,36,37],14:[1245,918,38,36],15:[1449,914,35,36],16:[259,1074,34,36],17:[423,1057,37,36],18:[614,1057,33,36],19:[829,1053,33,36],20:[1037,1052,37,34],21:[1247,1047,38,36],22:[1446,1046,40,34],23:[268,1184,38,37],24:[433,1168,40,36],25:[624,1169,37,35],26:[839,1164,36,36],27:[1046,1163,39,34],28:[1259,1158,35,36],29:[1459,1157,35,35],30:[1653,1169,34,37]};
  const PLACE = "Lvl 2, A'Flowers Street, Melbourne";
  const EVENTS = [
    { day: 4, name: "Bake & Chill", wd: "Wed", art: "ev-flower-4", rect: [691, 740, 90, 90], cell: [592, 725, 216, 126],
      card: "event-pop-4", date: "Wednesday, 4th of November", time: "1 - 3pm",
      text: "Remember that Fairy Bread and Honey Joys that always appears at every picnic? Join us to Bake & Chill!" },
    { day: 15, name: "Make & Play", wd: "Sun", art: "ev-flower-15", rect: [1545, 845, 83, 83], cell: [1435, 837, 212, 127],
      card: "event-pop-15", date: "Sunday, 15th of November", time: "4 - 5pm",
      text: "Glue + Magic Solution = Slime! Test out the craziest slime recipes that you always knew but never tested. Its Make & Play Time!" },
    { day: 23, name: "Redo & Replay", wd: "Mon", art: "ev-flower-23", rect: [318, 1116, 83, 83], cell: [235, 1107, 177, 129],
      card: "event-pop-23", date: "Monday, 23rd of November", time: "11am - 1pm",
      text: "Ever though about how crazy the alphabet can be? Forget about that pen licence and let your wildest character designs fly at Redo & Replay." }
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
  const evModal = $("#evmodal");
  function openEvent(ev, opener) {
    $(".evart", evModal).src = `img/${ev.card}.svg`;
    $("#evm-name").textContent = ev.name;
    $("#evm-text").textContent = `${ev.text} Date: ${ev.date}. Time: ${ev.time}. Location: ${PLACE}.`;
    $("#evm-name").closest(".evcard").setAttribute("aria-label", ev.name);
    openPop(evModal, opener);
  }
  // preload the three cards so they appear instantly
  EVENTS.forEach(ev => { const i = new Image(); i.src = `img/${ev.card}.svg`; });
  function initEvents() {
    const d = today(), isNov = d.getFullYear() === 2026 && d.getMonth() === 10, day = d.getDate();
    const host = $("#p-events #evflowers"), svg = $("#p-events #today"), tip = $("#p-events #evtip");
    host.innerHTML = ""; svg.innerHTML = "";
    EVENTS.forEach(ev => {
      const past = isNov ? day > ev.day : d > new Date(2026, 10, ev.day), [fx, fy, fw, fh] = ev.rect, [cx, cy, cw, ch] = ev.cell;
      const b = document.createElement("button"); b.className = "ev"; b.setAttribute("aria-label", `${ev.name}, ${ev.wd} ${ev.day} November${past ? " (past)" : ""}. Open details`);
      b.style.cssText = `left:${px(cx, CAL.x, CAL.w)};top:${px(cy, CAL.y, CAL.h)};width:${(cw / CAL.w * 100).toFixed(3)}%;height:${(ch / CAL.h * 100).toFixed(3)}%`;
      const rel = (v, o, t) => ((v - o) / t * 100).toFixed(2) + "%";
      let h = `<img class="fl" src="img/${ev.art}.svg" alt="" style="left:${rel(fx, cx, cw)};top:${rel(fy, cy, ch)};width:${(fw / cw * 100).toFixed(2)}%">`;
      if (past) h += `<img src="img/petal.png" alt="" style="left:${rel(fx + fw * 0.433, cx, cw)};top:${rel(fy + fh * 0.578, cy, ch)};width:${(fw * 0.378 / cw * 100).toFixed(2)}%">`;
      b.innerHTML = h; host.appendChild(b);
      const show = () => { tip.textContent = `${ev.name} · ${ev.wd} ${ev.day} Nov${past ? " (done)" : ""}`; tip.style.left = px(cx + cw / 2, CAL.x, CAL.w); tip.style.top = px(cy, CAL.y, CAL.h); tip.classList.add("on"); };
      b.addEventListener("mouseenter", show); b.addEventListener("focus", show);
      b.addEventListener("click", () => { tip.classList.remove("on"); openEvent(ev, b); });
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
    A: { label: "Event Request:", pw: 258, frame: "noteA-frame", icon: "noteA-icon", nw: 374.5, ar: 1.0196, tilt: -1.6, il: 61.5, it: 57.0, iw: 20.2, tilt2: -2,
         pop: { title: 311, icon: [785, 174, 126], body: [196, 188, 530, 32] } },
    B: { label: "Discussion:", pw: 282, frame: "noteB-frame", icon: "noteB-icon", nw: 406.2, ar: 1.027, tilt: 7.6, il: 52.5, it: 66.2, iw: 26.5, tilt2: 1,
         pop: { title: 206, icon: [804, 195, 126], body: [178, 191, 580, 30] } },
    C: { label: "General:", pw: 274, frame: "noteC-frame", icon: "noteC-icon", nw: 404.4, ar: 1.0128, tilt: -7.9, il: 60.3, it: 59.6, iw: 22.7, tilt2: 2,
         pop: { title: 169, icon: [809, 182, 120], body: [178, 191, 580, 30] } }
  };
  const KEY = "lrfc-memo-v1", CKEY = "lrfc-memo-comments-v1", DAY = 864e5;
  /* replies on the three starter posts come from the Figma pop-ups. ind = indent (px at full size), arrow = the little ↳ */
  const SEEDS = [
    { id: "s1", t: "A", seed: true, text: "Does anyone remember making Loom Bands? I would love a Make & Play session on that!", replies: [
      { by: "Petal 1:", text: "YESSSS. I was obsessed with loom bands. I used to spend all my free time making them. So sad that now I just doom scroll on tiktok instead..." },
      { by: "Flower (OP):", ind: 83, w: 590, text: "Me tooo. I was cleaning out my storage room and found a bunch made like 10 years ago. Are you coming to the slime event? Lets share bracelets!" },
      { by: "Petal 1:", ind: 150, w: 520, text: "I am :) I'll see id i can find my collection as well!" } ] },
    { id: "s2", t: "C", seed: true, text: "I want to join the Redo & Replay event on the 23rd but it's my first time. Is there anything I need to do beforehand?", replies: [
      { by: "Petal 1:", text: "The events are very chill :) You can bring yourself or a friend as all events are free!" },
      { by: "Petal 2:", text: "I am going to the event as well. I you would like we can meet up and grab a coffee before the event" },
      { by: "Flower (OP):", ind: 84, arrow: true, text: "That would be much help :))) I'm just a bit nervous to go straight in alone" } ] },
    { id: "s3", t: "B", seed: true, text: "How does everyone manage their pre-exam anxiety? I always tell myself that it isn't a big deal but I still stress over it :(", replies: [
      { by: "Petal 1:", text: "I also had pre-exam anxiety back when I was a student. But looking back at it now, I do realise the more stress I have, often the more prepared I am. So do not treat stress as some sort of demon." },
      { by: "Petal 2:", ind: 101, arrow: true, text: "I agree. But if turning your viewpoint is too hard, please try and give yourself a break, go in the sun a give yourself a sweet treat :)))" },
      { by: "Flower (OP):", ind: 98, arrow: true, text: "Thank you! I never though about it that way. I'll try!" } ] }
  ];
  let posts = [], comments = {}, memoReady = false;          // comments = { postId: [{ id, by, text, ts, parent }] } written by visitors
  function load() {
    let saved = [], c = {}; try { saved = JSON.parse(localStorage.getItem(KEY) || "[]"); c = JSON.parse(localStorage.getItem(CKEY) || "{}"); } catch (e) {}
    const now = Date.now(); posts = saved.filter(p => !p.seed && now - p.ts < 3 * DAY);   // posts refresh after 3 days
    SEEDS.forEach(s => posts.push({ ...s, ts: 0 }));                                       // starter posts always come from the code
    comments = {}; Object.keys(c).forEach(id => { const keep = (c[id] || []).filter(x => now - x.ts < 3 * DAY); if (keep.length && posts.some(p => p.id === id)) comments[id] = keep; });
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(posts.filter(p => !p.seed))); localStorage.setItem(CKEY, JSON.stringify(comments)); } catch (e) {} }

  /* one thread = the post's built-in replies + visitor comments. A reply to a comment sits under it with the ↳ arrow. */
  function threadFor(p) {
    const list = (p.replies || []).map((r, i) => ({ ...r, arrow: !!r.ind, id: `${p.id}-r${i}`, depth: r.ind ? (r.ind > 120 ? 2 : 1) : 0 }));   // every indented reply gets the ↳ arrow
    (comments[p.id] || []).slice().sort((a, b) => a.ts - b.ts).forEach(c => {
      const item = { ...c, depth: 0, mine: true };
      let at = list.length; const pi = c.parent ? list.findIndex(x => x.id === c.parent) : -1;
      if (pi >= 0) { item.depth = Math.min(list[pi].depth + 1, 2); at = pi + 1; while (at < list.length && list[at].depth > list[pi].depth) at++; }
      item.ind = item.depth * 84; item.arrow = item.depth > 0; list.splice(at, 0, item);
    });
    return list;
  }
  function nextPetal(p) {      // everyone is anonymous: the next commenter is "Petal N"
    const nums = threadFor(p).map(r => +((r.by.match(/^Petal (\d+)/) || [])[1] || 0));
    return `Petal ${Math.max(0, ...nums) + 1}:`;
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const boardTint = () => { const b = $("#p-memo #board"); if (b) b.dataset.t = "all"; };   // board border always stays orange
  function render(freshId) {
    const sc = $("#p-memo #scroll"); if (!sc) return;
    const list = posts.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));
    sc.innerHTML = list.map(p => { const T = TYPES[p.t], rot = p.seed ? 0 : ((p.id.charCodeAt(p.id.length - 1) % 5) - 2), tot = p.seed ? 0 : rot + T.tilt2;
      return `<article class="note ${p.id === freshId ? "fresh" : ""}" data-id="${esc(p.id)}" data-t="${p.t}" tabindex="0" role="button" style="--nw:${T.nw};--ar:${T.ar};--pw:${T.pw};--rot:${tot}deg" aria-label="${T.label} ${esc(p.text)}. Open post">
        <img class="nf" src="img/${T.frame}.svg" alt=""><div class="nc" style="transform:rotate(${T.tilt}deg)"><h4 class="lr">${T.label}</h4><p class="mt">${esc(p.text)}</p></div>
        <img class="ni" src="img/${T.icon}.svg" alt="" style="left:${T.il}%;top:${T.it}%;width:${T.iw}%"></article>`; }).join("");
    boardTint("all");
    if (freshId) sc.scrollTo({ top: 0, behavior: "smooth" });
  }
  function initMemo() { if (!memoReady) { load(); memoReady = true; } render(); }

  /* memo post pop-up (Figma Groups 69 / 72 / 75) */
  const noteModal = $("#notemodal"), npop = $(".npop", noteModal);
  function openNote(p, opener) {
    const T = TYPES[p.t], [il, it, iw] = T.pop.icon, u = v => `calc(${v}*var(--u))`;
    npop.dataset.t = p.t;
    $(".nfr", npop).src = `img/memo-pop-${p.t}.svg`;
    const title = $(".np-title", npop); title.src = `img/memo-title-${p.t}.svg`; title.style.width = u(T.pop.title);
    $("#np-label").textContent = T.label.replace(":", "");
    const body = $(".np-body", npop), [bl, bt, bw, bf] = T.pop.body; body.style.cssText = `--bl:${bl};--bt:${bt};--bw:${bw};--bf:${bf}`; body.textContent = p.text; body.classList.toggle("long", p.text.length > (bf >= 32 ? 105 : 150));   // only very long member posts shrink a little
    const ic = $(".np-icon", npop); ic.src = `img/memo-pop-icon-${p.t}.svg`; ic.style.cssText = `left:${u(il)};top:${u(it)};width:${u(iw)}`;
    openPostId = p.id; renderThread(); setReplyTo(null); nta.value = ""; ncount();
    boardTint(p.t); openPop(noteModal, opener);
  }
  let openPostId = null, replyTo = null;
  const nta = $(".np-ta", npop), nsend = $(".np-send", npop), openPostObj = () => posts.find(x => x.id === openPostId);
  function renderThread(freshId) {
    const p = openPostObj(); if (!p) return; const R = threadFor(p);
    $(".np-replies", npop).innerHTML = R.length
      ? R.map(r => `<div class="rp${r.id === freshId ? " fresh" : ""}${r.id === replyTo ? " target" : ""}" data-rid="${esc(r.id)}" style="--ind:${r.ind || 0}${r.w ? `;--rw:calc(${r.w}*var(--u))` : ""}">${r.arrow ? '<img class="arw" src="img/memo-reply-arrow.svg" alt="">' : ""}<h4>${esc(r.by)}</h4><p class="mt">${esc(r.text)}</p>${r.depth < 2 ? `<button class="rp-reply" type="button" aria-label="Reply to ${esc(r.by.replace(":", ""))}">Reply</button>` : ""}</div>`).join("")
      : `<p class="rp-none mt">No petals yet. Be the first to reply!</p>`;
  }
  function setReplyTo(rid) {
    replyTo = rid; const to = $(".np-to", npop), r = rid && threadFor(openPostObj()).find(x => x.id === rid);
    to.hidden = !r; if (r) $("span", to).textContent = `Replying to ${r.by.replace(":", "")}`;
    $$(".rp", npop).forEach(el => el.classList.toggle("target", el.dataset.rid === rid));
  }
  function ncount() { $(".np-count", npop).textContent = nta.value.length + "/160"; nsend.disabled = nta.value.trim().length < 2; }
  nta.addEventListener("input", ncount);
  nta.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (!nsend.disabled) nsend.click(); } });   // Enter sends, Shift+Enter = new line
  npop.addEventListener("click", e => {
    const rb = e.target.closest(".rp-reply"); if (rb) { setReplyTo(rb.closest(".rp").dataset.rid); nta.focus(); }
    if (e.target.closest(".np-to-x")) { setReplyTo(null); nta.focus(); }
  });
  nsend.addEventListener("click", () => {
    const p = openPostObj(), text = nta.value.trim().replace(/\s+/g, " "); if (!p || text.length < 2) return;
    const c = { id: "c" + Date.now().toString(36), by: nextPetal(p), text: text.slice(0, 160), ts: Date.now(), parent: replyTo || null };
    (comments[p.id] = comments[p.id] || []).push(c); save();
    replyTo = null; nta.value = ""; ncount(); renderThread(c.id); setReplyTo(null);
    const el = $(`.rp[data-rid="${c.id}"]`, npop); if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  });
  noteModal.addEventListener("pop-closed", () => boardTint("all"));
  const noteFor = el => posts.find(p => p.id === el.dataset.id);
  document.addEventListener("click", e => {
    const n = e.target.closest("#p-memo .note"); if (n && noteFor(n)) openNote(noteFor(n), n);
    if (e.target.closest("#postbtn")) openPost(e.target.closest("#postbtn"));
  });
  document.addEventListener("keydown", e => { const n = e.target.closest && e.target.closest("#p-memo .note"); if (n && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); if (noteFor(n)) openNote(noteFor(n), n); } });

  /* new post pop-up (Figma Group 76) */
  const postModal = $("#postmodal"), ta = $("textarea", postModal), sendBtn = $(".send", postModal); let pick = null;
  function setPick(t) { pick = t; $(".ppop", postModal).dataset.t = t || ""; $$(".cat", postModal).forEach(b => b.setAttribute("aria-pressed", b.dataset.t === t)); boardTint(t); count(); }
  function count() { const v = ta.value.trim().length; $(".count", postModal).textContent = ta.value.length + "/160"; sendBtn.disabled = !pick || v < 3; }
  function openPost(opener) { ta.value = ""; setPick(null); openPop(postModal, opener); }
  postModal.addEventListener("pop-closed", () => boardTint("all"));
  postModal.addEventListener("click", e => { const b = e.target.closest(".cat"); if (b) { setPick(b.dataset.t); ta.focus(); } });
  ta.addEventListener("input", count);
  sendBtn.addEventListener("click", () => {
    const text = ta.value.trim().replace(/\s+/g, " "); if (!pick || text.length < 3) return;
    const id = "p" + Date.now().toString(36); posts.push({ id, t: pick, text: text.slice(0, 160), ts: Date.now(), replies: [] }); save();
    closePop(postModal, true); render(id);
    const fresh = $(`#p-memo .note[data-id="${id}"]`); if (fresh) fresh.focus({ preventScroll: true });
  });

  /* host tools: Shift+E export posts + comments, Shift+I import, Shift+X clear (for compiling posts on the exhibition laptop) */
  addEventListener("keydown", e => {
    if (!e.shiftKey || /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (current !== "memo") return;
    if (e.key === "E") { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify({ posts: posts.filter(p => !p.seed), comments }, null, 1)], { type: "application/json" })); a.download = "lrfc-memo-posts.json"; a.click(); }
    if (e.key === "I") { const f = document.createElement("input"); f.type = "file"; f.accept = ".json"; f.onchange = () => f.files[0].text().then(t => { try {
      const inc = JSON.parse(t), incPosts = Array.isArray(inc) ? inc : (inc.posts || []), incCom = Array.isArray(inc) ? {} : (inc.comments || {});
      incPosts.forEach(p => { if (!p.seed && !posts.some(x => x.id === p.id)) posts.push(p); });
      Object.keys(incCom).forEach(id => { const list = comments[id] = comments[id] || []; incCom[id].forEach(c => { if (!list.some(x => x.id === c.id)) list.push(c); }); });
      save(); render(); } catch (er) {} }); f.click(); }
    if (e.key === "X" && confirm("Clear all member posts and comments on this laptop?")) { posts = posts.filter(p => p.seed); comments = {}; save(); render(); }
  });
  document.addEventListener("lrfc-reset", () => { if (openPopEl) closePop(openPopEl, true); if (memoReady) render(); });

  route();
})();