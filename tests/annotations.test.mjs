import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const resume = readFileSync(new URL("../src/data/resume.tsx", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const workSection = readFileSync(
  new URL("../src/components/section/work-section.tsx", import.meta.url),
  "utf8",
);
const projectsSection = readFileSync(
  new URL("../src/components/section/projects-section.tsx", import.meta.url),
  "utf8",
);
const hackathonsSection = readFileSync(
  new URL("../src/components/section/hackathons-section.tsx", import.meta.url),
  "utf8",
);

test("leads with the personal introduction and hero actions", () => {
  assert.match(page, /<h1[^>]*>\s*Hi! I&apos;m Krithik\s*<\/h1>/);
  assert.match(page, /I ship products and features fast, and make sure they work end to end/);
  assert.match(page, /href="#projects"[\s\S]*?View projects/);
  assert.match(page, /href=\{DATA\.contact\.social\.email\.url\}[\s\S]*?Email me/);
  assert.match(page, /<ResumeLink href=\{DATA\.resumeUrl\} \/>/);
  assert.match(resume, /resumeUrl:\s*"https:\/\/drive\.google\.com\/file\/d\/1g-jddgelD3agQ-EhKK6NWfpSY3ijGBvy\/view\?usp=drivesdk"/);
});

test("orders the homepage sections around project evidence", () => {
  const sectionStarts = [
    '<section id="hero"',
    '<section id="about"',
    "<ProjectsSection",
    '<section id="work"',
    '<section id="education"',
    '<section id="skills"',
    "<HackathonsSection",
    "<ContactSection",
  ].map((marker) => page.indexOf(marker));

  assert.ok(sectionStarts.every((index) => index >= 0));
  assert.deepEqual(sectionStarts, [...sectionStarts].sort((a, b) => a - b));
  assert.match(resume, /summary:[\s\S]*?final year CSE undergrad/);
});

test("preserves the approved education, student-year, and hackathon decoration", () => {
  assert.match(
    resume,
    /description: "I ship products and features fast, and make sure they work end to end"/,
  );
  assert.doesNotMatch(
    resume,
    /description: "Third Year Computer Science and Engineering student from India"/,
  );
  assert.match(workSection, /<h2 className="text-xl font-bold">Experience<\/h2>/);
  assert.doesNotMatch(page, /Work Experience/);
  assert.doesNotMatch(projectsSection, /I(?:&apos;|')ve worked on a variety of projects/);
  assert.doesNotMatch(hackathonsSection, /I like building things/);
  assert.doesNotMatch(hackathonsSection, /During my time in university/);
  assert.match(hackathonsSection, /<AnimatedHeart \/>/);
  const animatedHeart = readFileSync(new URL("../src/components/animated-heart.tsx", import.meta.url), "utf8");
  assert.match(animatedHeart, /<Heart[\s\S]*fill-red-500/);
  assert.match(animatedHeart, /whileInView/);
});
