/* ===== Little Red Flower Club website: settings =====
   Change things here. */
window.LRFC = {
  petalId: "",            // only ONE sticker opens the doors? Paste its ID. "" = any sticker works
  senseMs: 4000,          // flower slowly grows, petal glides in
  snapMs: 700,            // the little "click"
  doorMs: 2600,           // doors sliding apart
  resetDelayMs: 0,        // 0 = doors close the moment the petal is lifted
  showSkip: true,         // small "Enter without the flower" link (for markers and demos)
  flower: { sizeW: 0.68, sizeH: 0.54, idleScale: 0.58, fullScale: 1.12, looseDistance: 0.055, outline: true }
};
