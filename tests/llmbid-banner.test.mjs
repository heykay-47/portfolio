import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const banner = readFileSync(
  new URL("../src/components/llmbid-banner.tsx", import.meta.url),
  "utf8",
);
const page = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

test("places the llmbid.lol promotion before the portfolio hero content", () => {
  assert.match(page, /<section id="hero" className="space-y-8">\s*<LlmbidBanner \/>/);
  assert.match(banner, /href="https:\/\/llmbid\.lol"/);
  assert.match(banner, /target="_blank"/);
  assert.match(banner, /A \$1 LLM popularity leaderboard/);
});

test("keeps the banner animation enabled by preference and manually pausable", () => {
  assert.match(banner, /llmbid-banner-border/);
  assert.match(styles, /@keyframes llmbid-banner-border-spin/);
  assert.match(styles, /conic-gradient\(/);
  assert.doesNotMatch(styles, /prefers-reduced-motion:\s*reduce/);
  assert.match(banner, /useMotionPlayback/);
  assert.match(styles, /\.llmbid-banner-border\.motion-paused::before/);
  assert.match(styles, /animation-play-state:\s*paused/);
});
