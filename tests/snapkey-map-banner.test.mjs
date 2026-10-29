import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const banner = readFileSync(
  new URL("../src/components/snapkey-map-banner.tsx", import.meta.url),
  "utf8",
);
const page = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const resume = readFileSync(new URL("../src/data/resume.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
const borderBeam = readFileSync(new URL("../src/components/magicui/border-beam.tsx", import.meta.url), "utf8");

test("places the SnapKey Map promotion before the portfolio hero content", () => {
  assert.match(page, /<section id="hero" className="space-y-8">\s*<BlurFade[^>]*>\s*<SnapKeyMapBanner \/>\s*<\/BlurFade>/);
  assert.match(banner, /href="https:\/\/heykay-47\.github\.io\/SnapKeyMap\/"/);
  assert.match(banner, /target="_blank"/);
  assert.match(banner, /rel="noopener noreferrer"/);
  assert.match(banner, /aria-label="Visit SnapKey Map, an Oppo\/Oneplus Snap Key remapper"/);
  assert.match(banner, /Remap your Oppo\/Oneplus Snap Key/);
});

test("promotes the first project's title and destination", () => {
  const firstProject = resume.match(/projects: \[\s*\{\s*title: "([^"]+)",\s*href: "([^"]+)"/);
  assert.ok(firstProject, "first project has a title and destination");
  const bannerLabels = [...banner.matchAll(/>\s*([^<>]+?)\s*</g)].map(
    ([, label]) => label.trim(),
  );
  assert.ok(bannerLabels.includes(firstProject[1]));
  assert.ok(banner.includes(`href="${firstProject[2]}"`));
});

test("keeps the banner animation enabled by preference and manually pausable", () => {
  assert.match(banner, /<BorderBeam paused=\{isMotionPaused\}/);
  assert.match(borderBeam, /firecracker-spark/);
  assert.match(styles, /offset-path: border-box/);
  assert.doesNotMatch(styles, /offset-path: rect\(/);
  assert.match(styles, /\.firecracker \{\s*border: [^;]*solid/);
  assert.match(styles, /@keyframes firecracker-burn[\s\S]*offset-distance: 100%/);
  assert.doesNotMatch(styles, /prefers-reduced-motion:\s*reduce/);
  assert.match(banner, /useMotionPlayback/);
  assert.match(styles, /\.motion-paused \.firecracker-spark[\s\S]*animation-play-state: paused/);
});
