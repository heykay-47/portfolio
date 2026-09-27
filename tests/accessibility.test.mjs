import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const navbar = readFileSync(
  new URL("../src/components/navbar.tsx", import.meta.url),
  "utf8",
);
const modeToggle = readFileSync(
  new URL("../src/components/mode-toggle.tsx", import.meta.url),
  "utf8",
);
const layout = readFileSync(new URL("../src/app/layout.tsx", import.meta.url), "utf8");
const motionTogglePath = new URL(
  "../src/components/motion-toggle.tsx",
  import.meta.url,
);

test("gives icon-only shared navigation and theme controls accessible names", () => {
  assert.match(navbar, /aria-label=\{item\.label\}/);
  assert.match(navbar, /aria-label=\{name\}/);
  assert.match(modeToggle, /aria-label="Toggle theme"/);
  assert.match(layout, /aria-hidden="true"/);
});

test("provides a persistent manual control for continuous decorative motion", () => {
  assert.equal(existsSync(motionTogglePath), true);
  const motionToggle = readFileSync(motionTogglePath, "utf8");

  assert.match(motionToggle, /Pause decorative motion/);
  assert.match(motionToggle, /Resume decorative motion/);
  assert.match(motionToggle, /aria-pressed/);
  assert.match(layout, /MotionPlaybackProvider/);
});
