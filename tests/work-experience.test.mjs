import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const resume = readFileSync(new URL("../src/data/resume.tsx", import.meta.url), "utf8");
const normalizedResume = resume.replace(/\s+/g, " ");
const workSection = readFileSync(
  new URL("../src/components/section/work-section.tsx", import.meta.url),
  "utf8",
);
const styles = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

test("includes the Archimedis Digital internship", () => {
  for (const detail of [
    'company: "Archimedis Digital"',
    'title: "Full Stack Intern"',
    'location: "Chennai"',
    'start: "June 2026"',
    'end: ""',
    "Improved performance on a client-facing React website by applying component optimization, lazy loading, code splitting, and asset compression, reducing unnecessary frontend load and improving overall page responsiveness.",
    "Improved backend performance and reliability for a client’s website by optimizing MongoDB queries, restructuring Node.js &amp; Express REST APIs, and strengthening data retrieval and error-handling flows.",
    "https://media.licdn.com/dms/image/v2/D560BAQHVaEpS6X7g-A/company-logo_200_200/B56ZjSYaHmIAAM-/0/1755876271029/archimedis_digital_logo?e=2147483647&v=beta&t=iiVNxr5NpRacZDa4JRntkF916vs1HLVx8Wc-yTF_qoA",
  ]) {
    assert.equal(
      normalizedResume.includes(detail),
      true,
      `missing work experience detail: ${detail}`,
    );
  }

  assert.match(resume, /description: \(\s*<ul/);
});

test("renders work locations and supports an unspecified end date", () => {
  assert.match(workSection, /work\.location/);
  assert.match(workSection, /work\.end \?/);
});

test("shows one animated expansion hint until either experience is opened", () => {
  assert.match(workSection, /Click me to expand/);
  assert.match(workSection, /useInView\(hintRef, \{ once: true \}\)/);
  assert.match(
    workSection,
    /onValueChange=\{\(value\) => \{\s*if \(value\) setHasExpandedWork\(true\);\s*\}\}/,
  );
  assert.match(workSection, /!hasExpandedWork &&/);
  assert.match(workSection, /hintIsInView && "experience-title-hint-arrow"/);
  assert.match(
    styles,
    /\.experience-expand-hint-arrow \{\s*animation: experience-expand-hint-nudge 1\.4s ease-in-out infinite;/,
  );
  assert.match(
    styles,
    /\.experience-title-hint-arrow \{\s*animation: experience-title-hint-nudge 1\.4s ease-in-out infinite;/,
  );
  assert.match(styles, /\.motion-paused \.experience-expand-hint-arrow/);
});
