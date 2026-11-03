/* ===== site-gate.js: the opening sequence and the USB link to the flower =====
   idle -> sensing -> snapped -> opening -> open.  Lifting the petal closes the doors again. */
(function () {
  const C = window.LRFC, body = document.body, root = document.documentElement.style;
  root.setProperty("--sense", C.senseMs + "ms"); root.setProperty("--door", C.doorMs + "ms");
  const connectBtn = document.getElementById("connect-button"), dbg = document.getElementById("debug-box"), skip = document.getElementById("skip-button");
  const say = t => { dbg.textContent = "debug: " + t + "  [state: " + body.dataset.state + "]"; };
  const setState = s => { body.dataset.state = s; };
  let timers = [], resetTimer = null;
  const after = (ms, fn) => timers.push(setTimeout(fn, ms));

  function petalPlaced(id) {
    if (C.petalId && id && id !== C.petalId) return;
    clearTimeout(resetTimer);
    if (body.dataset.state !== "idle") return;
    location.hash = "#/";                                // doors open straight onto Home
    setState("sensing");
    after(C.senseMs, () => setState("snapped"));
    after(C.senseMs + C.snapMs, () => setState("opening"));
    after(C.senseMs + C.snapMs + C.doorMs, () => setState("open"));
  }
  function petalRemoved() {
    if (body.dataset.state === "idle") return;
    clearTimeout(resetTimer);
    if (C.resetDelayMs <= 0) resetToIdle(); else resetTimer = setTimeout(resetToIdle, C.resetDelayMs);
  }
  function resetToIdle() {
    timers.forEach(clearTimeout); timers = [];
    setState("idle"); location.hash = "#/"; window.scrollTo({ top: 0 });
    document.dispatchEvent(new Event("lrfc-reset"));
  }
  window.LRFC.place = petalPlaced; window.LRFC.remove = petalRemoved;
  if (skip) { skip.hidden = !C.showSkip; skip.addEventListener("click", () => petalPlaced("")); }
  // NFC sticker link: opening the site with ?petal=... (e.g. https://wheatzzz.github.io/littleredflower/?petal=1)
  // plays the full opening, as if the petal was placed on the flower, then lets the visitor in.
  if (new URLSearchParams(location.search).has("petal")) setTimeout(() => petalPlaced(C.petalId || ""), C.nfcDelayMs ?? 1500);

  async function listen(port) {
    try {
      await port.open({ baudRate: 115200 });
      connectBtn.classList.add("connected"); say("connected, waiting for a petal");
      const reader = port.readable.pipeThrough(new TextDecoderStream()).getReader(); let buffer = "";
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        buffer += value; const lines = buffer.split("\n"); buffer = lines.pop();
        lines.forEach(raw => { const line = raw.trim(); if (!line) return; say("got '" + line + "'");
          if (line.startsWith("IN:")) petalPlaced(line.slice(3)); if (line.startsWith("OUT:")) petalRemoved(); });
      }
    } catch (e) { say("lost connection: " + e.message); }
    connectBtn.classList.remove("connected"); connectBtn.textContent = "Reconnect the flower";
  }
  if ("serial" in navigator) {
    connectBtn.addEventListener("click", async () => { try { listen(await navigator.serial.requestPort()); } catch (e) { say("not connected: " + e.message); } });
    navigator.serial.getPorts().then(ports => { if (ports.length) listen(ports[0]); });
  } else { connectBtn.textContent = "Use Chrome or Edge"; }

  addEventListener("keydown", e => {
    if (/INPUT|TEXTAREA/.test((e.target.tagName || ""))) return;
    const k = e.key.toLowerCase();
    if (k === "p") petalPlaced(C.petalId); if (k === "r") petalRemoved(); if (k === "d") dbg.classList.toggle("on");
  });
})();