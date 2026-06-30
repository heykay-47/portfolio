import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const resume = readFileSync(new URL("../src/data/resume.tsx", import.meta.url), "utf8");

test("blog nav points to local portfolio blog route", () => {
  assert.match(resume, /href: "\/blog"/);
  assert.doesNotMatch(resume, /hashnode\.dev/);
});

test("local portfolio blog route and sample content exist", () => {
  assert.equal(existsSync(new URL("../src/app/blog", import.meta.url)), true);
  assert.equal(existsSync(new URL("../src/app/blog/page.tsx", import.meta.url)), true);
  assert.equal(existsSync(new URL("../src/app/blog/[slug]/page.tsx", import.meta.url)), true);
  assert.equal(existsSync(new URL("../content", import.meta.url)), true);
  assert.equal(existsSync(new URL("../content-collections.ts", import.meta.url)), true);
  assert.equal(existsSync(new URL("../src/lib/pagination.ts", import.meta.url)), true);
});

test("sample blog posts are present", () => {
  const posts = readdirSync(new URL("../content", import.meta.url));
  assert.ok(posts.length > 0, "expected at least one blog post");
  assert.ok(posts.every((p) => p.endsWith(".mdx")));
});