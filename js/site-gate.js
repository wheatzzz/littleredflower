/* ===== site-gate.js: the opening sequence and the USB link to the flower =====
   idle -> sensing -> snapped -> opening -> open.  Lifting the petal closes the doors again. */
(function () {
  const C = window.LRFC, body = document.body, root = document.documentElement.style;
  root.setProperty("--sense", C.senseMs + "ms"); root.setProperty("--door", C.doorMs + "ms");
  const connectBtn = document.getElementById("connect-button"), dbg = document.getElementById("debug-box"), skip = document.getElementById("skip-button");
  const say = t => { dbg.textContent = "debug: " + t + "  [state: " + body.dataset.state + "]"; };
  const setState = s => { body.dataset.state = s; };
  let timers = [], resetTimer = null, lastPlace = 0;
  const after = (ms, fn) => timers.push(setTimeout(fn, ms));

  function petalPlaced(id) {
    if (C.petalId && id && id !== C.petalId) return;
    clearTimeout(resetTimer);
    if (body.dataset.state !== "idle") {           // every tap unlocks: if the doors are already open, replay the opening
      if (Date.now() - lastPlace < 1500) return;   // ignore a double read of the same tap
      timers.forEach(clearTimeout); timers = []; setState("idle");
      return void setTimeout(() => petalPlaced(id), 120);
    }
    lastPlace = Date.now();
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
  // The sticker IS the portal: no waiting, no hint, no skip/connect buttons. The animation starts as soon as the page loads.
  if (new URLSearchParams(location.search).has("petal")) {
    requestAnimationFrame(() => setTimeout(() => petalPlaced(C.petalId || ""), C.nfcDelayMs ?? 2500));   // short pause on the flower before the petal flies in
  }

  // USB chips, so the debug box can say what you are connected to
  const CHIPS = { 0x10c4: "CP210x (ESP32 USB)", 0x1a86: "CH340 (ESP32 USB)", 0x303a: "Espressif native USB", 0x0403: "FTDI USB", 0x2341: "Arduino" };
  let active = null;                      // { port, reader } currently listened to
  async function stop() {
    if (!active) return; const a = active; active = null;
    try { await a.reader.cancel(); } catch (e) {} try { a.reader.releaseLock(); } catch (e) {} try { await a.port.close(); } catch (e) {}
  }
  async function listen(port) {
    await stop();
    const info = port.getInfo ? port.getInfo() : {}, vid = info.usbVendorId;
    const name = vid ? (CHIPS[vid] || "USB device " + vid.toString(16).toUpperCase()) : "non-USB port (probably not the flower)";
    try {
      await port.open({ baudRate: 115200 });
      const reader = port.readable.pipeThrough(new TextDecoderStream()).getReader(); let buffer = "";
      const me = active = { port, reader };
      connectBtn.classList.add("connected"); connectBtn.textContent = "Flower connected · change port";
      say("connected to " + name + ", waiting for a petal (press EN on the ESP32: you should see READY)");
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        buffer += value; const lines = buffer.split("\n"); buffer = lines.pop();
        lines.forEach(raw => { const line = raw.trim(); if (!line) return; say("got '" + line + "' from " + name);
          if (line.startsWith("IN:")) petalPlaced(line.slice(3)); if (line.startsWith("OUT:")) petalRemoved(); });
      }
      if (active !== me) return;          // we switched to another port on purpose
    } catch (e) { say("not connected to " + name + ": " + e.message + (/open/i.test(e.message) ? " (close the Arduino Serial Monitor and try again)" : "")); }
    active = null; connectBtn.classList.remove("connected"); connectBtn.textContent = "Reconnect the flower";
  }
  if ("serial" in navigator) {
    // the button always stays available, so a wrong port can be swapped for the right one
    connectBtn.addEventListener("click", async () => { try { listen(await navigator.serial.requestPort()); } catch (e) { say("no port chosen: " + e.message); } });
    navigator.serial.getPorts().then(ports => {
      const usb = ports.filter(p => p.getInfo && p.getInfo().usbVendorId);       // prefer a real USB device over Bluetooth ports
      const pick = usb.find(p => CHIPS[p.getInfo().usbVendorId]) || usb[0] || ports[0];
      if (pick) listen(pick);
    });
  } else { connectBtn.textContent = "Use Chrome or Edge"; }

  addEventListener("keydown", e => {
    if (/INPUT|TEXTAREA/.test((e.target.tagName || ""))) return;
    const k = e.key.toLowerCase();
    if (k === "p") petalPlaced(C.petalId); if (k === "r") petalRemoved(); if (k === "d") dbg.classList.toggle("on");
  });
})();