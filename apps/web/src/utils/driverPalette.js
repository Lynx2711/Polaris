// driverPalette.js

// Tier 1 — curated, matches the established Polaris palette exactly.
// Muted/earthy on purpose — no neon, nothing that clashes with #F6F4EF/#14171C.
const CURATED_PALETTE = [
  '#2B5D4F', // deep route-green
  '#D6862A', // depot-amber
  '#5B7FBD', // muted blue
  '#9B5DE5', // muted violet
  '#C13B3B', // muted red (used sparingly — also means "alert" elsewhere)
  '#4C8577', // secondary green
  '#B08968', // clay/tan
  '#6B8F71', // sage green
  '#9C6B4F', // terracotta
  '#5C7A99', // slate blue
  '#8A6D9B', // muted plum
  '#A6763F', // ochre
];

const HUE_STEP = 137.508; // golden angle, in degrees
const SATURATION = 38;    // %, kept low — this is what prevents neon
const LIGHTNESS = 42;     // %, mid-range — avoids both pastel-washout and neon-brightness

export function getDriverColor(index) {
  if (index < CURATED_PALETTE.length) {
    return CURATED_PALETTE[index];
  }
  // Beyond the curated list: generate a new hue, offset past the curated
  // range so generated colors don't visually collide with the hand-picked ones.
  const generatedIndex = index - CURATED_PALETTE.length;
  const hue = (generatedIndex * HUE_STEP) % 360;
  return `hsl(${hue.toFixed(0)}, ${SATURATION}%, ${LIGHTNESS}%)`;
}

/**
 * Maps an array of drivers to a color map object { [driverId]: hexOrHslColor }
 */
export function buildDriverColorMap(drivers = []) {
  const driverColorMap = {};
  drivers.forEach((driver, i) => {
    driverColorMap[driver.id] = getDriverColor(i);
  });
  return driverColorMap;
}
