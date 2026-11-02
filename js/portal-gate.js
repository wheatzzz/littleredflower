/* ===== portal-gate.js: the sequence, the guide words and the USB connection =====
   States: idle -> sensing -> snapped -> opening -> open
   The state sits on <body data-state="..."> and the CSS and 3D flower react to it. */
(function () {
  const C = window.LRFC, body = document.body;
  const root = document.documentElement.style;
  root.setProperty("--sense", C.senseMs + "ms");   // one source of truth for timing
  root.setProperty("--door", C.doorMs + "ms");

  const idleLine = document.getElementById("idle-line");
  const connectBtn = document.getElementById("connect-button");
  const dbg = document.getElementById("debug-box");
  const say = t => { dbg.textContent = "debug: " + t + "  [state: " + body.dataset.state + "]"; };
  const setState = s => { body.dataset.state = s; };

  /* ---- rotating guide words ---- */
  let lineIndex = 0;
  function nextLine() {
    if (body.dataset.state !== "idle") return;
    idleLine.classList.remove("show");
    setTimeout(() => {
      if (body.dataset.state !== "idle") return;
      idleLine.textContent = C.idleLines[lineIndex];
      lineIndex = (lineIndex + 1) % C.idleLines.length;
      idleLine.classList.add("show");
    }, 900);
  }
  nextLine(); setInterval(nextLine, 5200);

  /* ---- the sequence ---- */
  let timers = [], resetTimer = null;
  const after = (ms, fn) => timers.push(setTimeout(fn, ms));

  function petalPlaced(id) {
    if (C.petalId && id !== C.petalId) return;      // wrong sticker
    clearTimeout(resetTimer);
    if (body.dataset.state !== "idle") return;
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
    setState("idle"); window.scrollTo({ top: 0 });
  }

  /* ---- USB connection to the flower (Chrome or Edge) ---- */
  async function listen(port) {
    try {
      await port.open({ baudRate: 115200 });
      connectBtn.classList.add("connected"); say("connected, waiting for a petal");
      const reader = port.readable.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n"); buffer = lines.pop();
        lines.forEach(raw => {
          const line = raw.trim(); if (!line) return;
          say("got '" + line + "'");
          if (line.startsWith("IN:")) petalPlaced(line.slice(3));
          if (line.startsWith("OUT:")) petalRemoved();
        });
      }
    } catch (e) { say("lost connection: " + e.message); }
    connectBtn.classList.remove("connected"); connectBtn.textContent = "Reconnect the flower";
  }
  if ("serial" in navigator) {
    connectBtn.addEventListener("click", async () => {
      try { listen(await navigator.serial.requestPort()); } catch (e) { say("not connected: " + e.message); }
    });
    navigator.serial.getPorts().then(ports => { if (ports.length) listen(ports[0]); });
  } else { connectBtn.textContent = "Use Chrome or Edge"; }

  /* ---- keyboard: P = place petal, R = remove it, D = debug box ---- */
  addEventListener("keydown", e => {
    const k = e.key.toLowerCase();
    if (k === "p") petalPlaced(C.petalId);
    if (k === "r") petalRemoved();
    if (k === "d") dbg.classList.toggle("on");
  });
})();
