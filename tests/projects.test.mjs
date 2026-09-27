import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const resume = readFileSync(new URL("../src/data/resume.tsx", import.meta.url), "utf8");
const projects = resume.slice(resume.indexOf("projects: ["), resume.indexOf("hackathons: ["));
const normalizedProjects = projects.replace(/\s+/g, " ");
const llmbidStart = normalizedProjects.indexOf('title: "llmbid.lol"');
const llmbidEnd = normalizedProjects.indexOf('title: "wpdbot"', llmbidStart);
const llmbidProject = normalizedProjects.slice(llmbidStart, llmbidEnd);

test("matches the approved five-project lineup and primary destinations", () => {
  const titles = [...projects.matchAll(/title: "([^"]+)"/g)].map(
    ([, title]) => title,
  );
  const primaryDestinations = [
    ...projects.matchAll(/title: "[^"]+",\s*href: "([^"]+)"/g),
  ].map(([, href]) => href);

  assert.deepEqual(titles, [
    "VouchIt",
    "ApartCheck",
    "llmbid.lol",
    "wpdbot",
    "Google Classroom Auto File Downloader",
  ]);
  assert.deepEqual(primaryDestinations, [
    "https://vouchit-xi.vercel.app/",
    "https://apartcheck-heykay-47.onrender.com",
    "https://llmbid.lol/",
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
  assert.doesNotMatch(projects, /PostgreSQL|Supabase|Google OAuth|payment processor/);
});

test("shows llmbid.lol as a live project without fabricated media or source", () => {
  assert.match(
    llmbidProject,
    /title: "llmbid\.lol".*?href: "https:\/\/llmbid\.lol\/".*?description:.*?links: \[\], image: "", video: ""/,
  );
  assert.doesNotMatch(llmbidProject, /source|model engineering/i);
});
