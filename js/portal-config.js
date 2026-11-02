/* ===== Little Red Flower Club portal: settings =====
   Change things here. Nothing else needs touching for normal tweaks. */
window.LRFC = {
  // Only ONE sticker opens the doors? Paste its ID. Leave "" and ANY sticker works.
  petalId: "",                 // e.g. "53289DABA30001"

  // Timing in milliseconds
  senseMs: 4000,               // flower slowly grows, petal glides in
  snapMs: 700,                 // the little "click"
  doorMs: 2600,                // doors sliding apart
  resetDelayMs: 0,             // 0 = doors close the moment the petal is lifted

  // Words that rotate while the flower waits
  idleLines: [
    "Are you part of a little red flower?",
    "One petal is missing.",
    "Place the missing piece.",
    "Do you remember being the little red flower?",
    "Every flower needs one more of us."
  ],

  // The 3D flower
  flower: {
    sizeW: 0.68, sizeH: 0.54,  // size as a share of screen width / height
    idleScale: 0.58,           // small while waiting
    fullScale: 1.12,           // size once sensed
    looseDistance: 0.055,      // how far the loose petal waits from the gap
    outline: true              // black outline like the logo
  }
};
