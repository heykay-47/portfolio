import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const resume = readFileSync(new URL("../src/data/resume.tsx", import.meta.url), "utf8");
const projects = resume.slice(resume.indexOf("projects: ["), resume.indexOf("hackathons: ["));
const normalizedProjects = projects.replace(/\s+/g, " ");
const llmbidStart = normalizedProjects.indexOf('title: "llmbid.lol"');
const llmbidEnd = normalizedProjects.indexOf('title: "VouchIt"', llmbidStart);
const llmbidProject = normalizedProjects.slice(llmbidStart, llmbidEnd);
const vouchitProject = normalizedProjects.slice(llmbidEnd, normalizedProjects.indexOf('title: "ApartCheck"', llmbidEnd));

test("matches the approved five-project lineup and primary destinations", () => {
  const titles = [...projects.matchAll(/title: "([^"]+)"/g)].map(
    ([, title]) => title,
  );
  const primaryDestinations = [
    ...projects.matchAll(/title: "[^"]+",\s*href: "([^"]+)"/g),
  ].map(([, href]) => href);

  assert.deepEqual(titles, [
    "llmbid.lol",
    "VouchIt",
    "ApartCheck",
    "wpdbot",
    "Google Classroom Auto File Downloader",
  ]);
  assert.deepEqual(primaryDestinations, [
    "https://llmbid.lol/",
    "https://vouchit-xi.vercel.app/",
    "https://apartcheck-heykay-47.onrender.com",
    "https://github.com/heykay-47/wpdbot",
    "https://github.com/heykay-47/google-classroom-downloader",
  ]);
  assert.doesNotMatch(projects, /title: "Intelligent RAG Agent"/);
  assert.doesNotMatch(
    projects,
    /title: "Hybrid Deep Learning Model for Stock Price Prediction"/,
  );
  assert.doesNotMatch(projects, /href: "#"/);
  assert.doesNotMatch(projects, /https:\/\/github\.com\/heykay-47"/);
});

test("uses the supplied project screenshots", () => {
  for (const image of [
    "/projects/llmbid_headerPage.png",
    "/projects/vouchit_headerPage.png",
    "/projects/apartcheck_headerPage.png",
    "/projects/wpdbot_dashboard.png",
    "/projects/classroom_dashboard.png",
  ]) {
    assert.equal(
      normalizedProjects.includes(`image: "${image}"`),
      true,
      `missing project image reference: ${image}`,
    );
    assert.equal(
      existsSync(new URL(`../public${image}`, import.meta.url)),
      true,
      `missing project image asset: ${image}`,
    );
  }
});

test("keeps VouchIt's stack and project links aligned with its README", () => {
  assert.match(projects, /Vercel serverless API using Express/);
  assert.match(projects, /MongoDB Atlas/);
  assert.match(projects, /email\/password authentication with JWT httpOnly cookies/);
  assert.match(projects, /type: "Live",\s*href: "https:\/\/vouchit-xi\.vercel\.app\/"/);
  assert.match(projects, /type: "Source",\s*href: "https:\/\/github\.com\/heykay-47\/vouchit"/);
  assert.doesNotMatch(vouchitProject, /PostgreSQL|Supabase|Google OAuth|payment processor/);
});

test("shows llmbid.lol with its live link, supplied image, and verified stack", () => {
  assert.match(
    llmbidProject,
    /title: "llmbid\.lol".*?href: "https:\/\/llmbid\.lol\/".*?description:.*?image: "\/projects\/llmbid_headerPage\.png", video: ""/,
  );
  assert.match(llmbidProject, /50 models through \$1 user bids/);
  assert.match(llmbidProject, /payment webhooks and limited bids per hour/);
  assert.match(llmbidProject, /technologies: \["Next\.js", "TypeScript", "PostgreSQL", "Docker", "Dodo Payments"\]/);
  assert.match(llmbidProject, /type: "Live", href: "https:\/\/llmbid\.lol\/"/);
  assert.doesNotMatch(llmbidProject, /source|model engineering/i);
});
