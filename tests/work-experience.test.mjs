import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const resume = readFileSync(new URL("../src/data/resume.tsx", import.meta.url), "utf8");
const normalizedResume = resume.replace(/\s+/g, " ");
const workSection = readFileSync(
  new URL("../src/components/section/work-section.tsx", import.meta.url),
  "utf8",
);

test("includes the Archimedis Digital internship", () => {
  for (const detail of [
    'company: "Archimedis Digital"',
    'title: "Full Stack Intern"',
    'location: "Chennai"',
    'start: "June 2026"',
    'end: ""',
    "Learned web performance optimization techniques including React component optimization, lazy loading, code splitting, and asset compression to improve website load performance.",
    "Gained practical understanding of backend performance optimization using Node.js, Express.js, and MongoDB, including query optimization, REST API structuring, efficient data retrieval, and error handling.",
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
