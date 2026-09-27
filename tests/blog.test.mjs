import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const resume = readFileSync(new URL("../src/data/resume.tsx", import.meta.url), "utf8");
const layout = readFileSync(new URL("../src/app/layout.tsx", import.meta.url), "utf8");
const blogPage = readFileSync(new URL("../src/app/blog/page.tsx", import.meta.url), "utf8");
const articlePage = readFileSync(
  new URL("../src/app/blog/[slug]/page.tsx", import.meta.url),
  "utf8",
);

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

test("sets current-origin canonicals for the homepage, blog index, and articles", () => {
  assert.match(resume, /url: "https:\/\/www\.krithik\.dev\/"/);
  assert.match(layout, /alternates:\s*\{\s*canonical: "\/"/);
  assert.match(blogPage, /alternates:\s*\{\s*canonical: "\/blog"/);
  assert.match(articlePage, /canonical: `\/blog\/\$\{slug\}`/);
  assert.match(blogPage, /url: new URL\("\/blog", DATA\.url\)\.toString\(\)/);
});

test("uses one main landmark on the blog index and article routes", () => {
  assert.match(blogPage, /<main[\s\S]*<\/main>/);
  assert.match(articlePage, /<main[\s\S]*<\/main>/);
});

test("avoids duplicate article titles and keeps body headings below the page h1", () => {
  assert.match(articlePage, /children === post\.title \? null : <h2/);
  assert.match(articlePage, /components=\{articleMdxComponents\}/);
});

test("preserves the placeholder blog introduction and existing author metadata", () => {
  assert.match(blogPage, /My thoughts on software development, life, and more\./);
  assert.match(articlePage, /name: DATA\.name/);
});

test("keeps inactive pagination readable and visibly disabled", () => {
  assert.match(blogPage, /aria-disabled="true"/);
  assert.match(blogPage, /bg-muted[^\n]*text-foreground/);
  assert.doesNotMatch(blogPage, /opacity-50 cursor-not-allowed/);
});
