import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const resume = readFileSync(new URL("../src/data/resume.tsx", import.meta.url), "utf8");

test("all configured skills have icons", () => {
  assert.equal(
    resume.includes("icon: undefined"),
    false,
    "replace every skill icon: undefined with an icon component",
  );
});

test("skills reflect the featured project stacks", () => {
  const skills = resume.slice(resume.indexOf("skills: ["), resume.indexOf("navbar: ["));
  for (const name of [
    "Next.js", "TypeScript", "React.js", "Node.js", "Express.js",
    "PostgreSQL", "MongoDB", "Docker", "Dodo Payments", "Tailwind CSS",
    "Python", "FastAPI", "SQLite", "FFmpeg", "Google Classroom API",
    "Google Drive API", "Gotenberg",
  ]) {
    assert.match(skills, new RegExp(`name: "${name.replaceAll(".", "\\.")}"`));
  }
  assert.doesNotMatch(skills, /LangChain|Supabase|Google Cloud Platform/);
});
