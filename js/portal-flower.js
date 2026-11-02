/* ===== portal-flower.js: the 3D flower (made from flower.obj) =====
   If WebGL is not available this file does nothing and the flat fallback shows. */
(function () {
  const C = window.LRFC, F = C.flower;
  if (!window.THREE || !window.FLOWER_PARTS) return;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("flower-canvas"), antialias: true, alpha: true }); }
  catch (e) { console.log("WebGL not available, using flat flower"); return; }
  document.body.classList.add("webgl");
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, Math.PI * 0.62));
  const sun = new THREE.DirectionalLight(0xffffff, Math.PI * 0.40); sun.position.set(-0.3, 1, 0.4); scene.add(sun);
  const cam = new THREE.PerspectiveCamera(26, 1, 0.01, 10); cam.up.set(0, 0, -1);
  const root = new THREE.Group(); scene.add(root);

  const side = THREE.DoubleSide;
  const mats = {
    red: new THREE.MeshLambertMaterial({ color: 0xd33027, flatShading: true, side }),
    yellow: new THREE.MeshLambertMaterial({ color: 0xfde168, flatShading: true, side })
  };
  const ink = new THREE.MeshBasicMaterial({ color: 0x231f20, side });
  const geo = (pos, idx) => { const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g; };

  const parts = window.FLOWER_PARTS.map(p => {
    const g = new THREE.Group();
    if (F.outline) g.add(new THREE.Mesh(geo(p.o, p.i), ink));
    g.add(new THREE.Mesh(geo(p.p, p.i), mats[p.c]));
    root.add(g);
    const d = Math.hypot(p.cx, p.cz) || 1;
    return { g, loose: p.loose, dx: p.cx / d, dz: p.cz / d };
  });

  // layout: same size logic as the flat flower
  const FLOWER_WIDTH = 0.163; let vw = 1, vh = 1;
  function resize() {
    const W = innerWidth, H = innerHeight;
    renderer.setSize(W, H, false); cam.aspect = W / H;
    vh = (FLOWER_WIDTH / Math.min(F.sizeW * W, F.sizeH * H)) * H; vw = vh * cam.aspect;
    const dist = (vh / 2) / Math.tan(cam.fov * Math.PI / 360);
    cam.position.set(0, dist, dist * 0.16); cam.lookAt(0, 0, 0); cam.updateProjectionMatrix();
    root.position.z = -0.05 * vh;                 // sits a little above centre
  }
  addEventListener("resize", resize); resize();

  // tweening helpers
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const V = { scale: { val: F.idleScale }, petal: { val: 1 }, exit: { val: 0 } };
  const tw = (v, to, dur, delay = 0) => { v.from = v.val; v.to = to; v.t0 = performance.now() + delay; v.dur = dur; };
  const step = (v, now) => { if (!v.dur) return; const k = Math.min(1, Math.max(0, (now - v.t0) / v.dur)); v.val = v.from + (v.to - v.from) * ease(k); };
  const sm = t => t * t * (3 - 2 * t);
  function hint(now) { const p = (now % 5000) / 5000;       // the loose petal's "come on in"
    if (p < 0.45) return 0.05 * (p / 0.45);
    if (p < 0.62) return 0.05 + 0.7 * sm((p - 0.45) / 0.17);
    if (p < 0.80) return 0.75 * (1 - sm((p - 0.62) / 0.18));
    return 0; }

  let state = "idle", hintAt = 0, snapT0 = 0, lastEff = 1;
  function onState(s, now) {
    if (s === "sensing") { V.petal.val = lastEff; tw(V.scale, F.fullScale, C.senseMs); tw(V.petal, 0, C.senseMs - 400, 400); }
    if (s === "snapped") snapT0 = now;
    if (s === "opening") tw(V.exit, 1, C.doorMs);
    if (s === "idle") { tw(V.scale, F.idleScale, C.senseMs); tw(V.petal, 1, 1800); tw(V.exit, 0, C.doorMs); hintAt = now + 2600; }
  }

  function frame(now) {
    const s = document.body.dataset.state || "idle";
    if (s !== state) { state = s; onState(s, now); }
    step(V.scale, now); step(V.petal, now); step(V.exit, now);
    const eff = (state === "idle" && now > hintAt) ? V.petal.val * (1 - hint(now)) : V.petal.val;
    lastEff = eff;
    const br = 0.5 - 0.5 * Math.cos((now / 4800) * Math.PI * 2);          // breathing
    const pulse = state === "snapped" ? 0.06 * Math.sin(Math.PI * Math.min(1, (now - snapT0) / 600)) : 0;
    const sc = V.scale.val * (1 + 0.045 * br) * (1 + pulse);
    root.scale.setScalar(sc); root.rotation.y = -0.021 * br;
    const slide = (vw * 0.85) / sc * V.exit.val;                          // doors: flower left, petal right
    parts.forEach(p => p.loose
      ? p.g.position.set(p.dx * F.looseDistance * eff + slide, 0, p.dz * F.looseDistance * eff)
      : p.g.position.set(-slide, 0, 0));
    renderer.render(scene, cam);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
