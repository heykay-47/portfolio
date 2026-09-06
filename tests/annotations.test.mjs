import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const resume = readFileSync(new URL("../src/data/resume.tsx", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const projectsSection = readFileSync(
  new URL("../src/components/section/projects-section.tsx", import.meta.url),
  "utf8",
);
const hackathonsSection = readFileSync(
  new URL("../src/components/section/hackathons-section.tsx", import.meta.url),
  "utf8",
);

test("applies the annotated copy and icon changes", () => {
  assert.match(
    resume,
    /description: "Fourth Year Computer Science and Engineering student from India"/,
  );
  assert.doesNotMatch(
    resume,
    /description: "Third Year Computer Science and Engineering student from India"/,
  );
  assert.match(page, /<h2 className="text-xl font-bold">Experience<\/h2>/);
  assert.doesNotMatch(page, /Work Experience/);
  assert.doesNotMatch(projectsSection, /I(?:&apos;|')ve worked on a variety of projects/);
  assert.doesNotMatch(hackathonsSection, /I like building things/);
  assert.doesNotMatch(hackathonsSection, /During my time in university/);
  assert.match(hackathonsSection, /<Heart[\s\S]*fill-red-500/);
});
