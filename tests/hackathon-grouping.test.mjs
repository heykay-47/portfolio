import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const section = readFileSync(
  new URL("../src/components/section/hackathons-section.tsx", import.meta.url),
  "utf8",
);

test("hackathons are grouped by year instead of rendering each year per item", () => {
  assert.equal(section.includes("<time"), false, "year should not render as a per-hackathon time label");
  assert.match(section, /hackathonsByYear|groupedHackathons/, "component should group hackathons by year");
});

test("hackathon placements render as light gold badges", () => {
  assert.match(section, /bg-amber-100/, "placement badge should use light gold background");
  assert.match(section, /text-amber-900/, "placement badge should use readable gold text");
});
