import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const resume = readFileSync(new URL("../src/data/resume.tsx", import.meta.url), "utf8");
const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");

test("blog nav opens external Hashnode site", () => {
  assert.match(resume, /href: "https:\/\/heykay47\.hashnode\.dev\/"/);
});

test("local portfolio blog route and sample content are removed", () => {
  assert.equal(existsSync(new URL("../src/app/blog", import.meta.url)), false);
  assert.equal(existsSync(new URL("../content", import.meta.url)), false);
  assert.equal(readme.includes("Includes a blog"), false);
});
