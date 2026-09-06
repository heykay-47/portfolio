import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const resume = readFileSync(new URL("../src/data/resume.tsx", import.meta.url), "utf8");
const projects = resume.slice(resume.indexOf("projects: ["), resume.indexOf("hackathons: ["));
const normalizedProjects = projects.replace(/\s+/g, " ");

test("matches the annotated project lineup", () => {
  for (const detail of [
    'title: "ApartCheck"',
    'title: "wpdbot"',
    'title: "Google Classroom Auto File Downloader"',
    "https://github.com/heykay-47/ApartCheck",
    "https://github.com/heykay-47/wpdbot",
    "https://github.com/heykay-47/google-classroom-downloader",
  ]) {
    assert.equal(
      normalizedProjects.includes(detail),
      true,
      `missing project detail: ${detail}`,
    );
  }

  assert.equal((projects.match(/title:/g) ?? []).length, 4);
  assert.doesNotMatch(projects, /title: "Intelligent RAG Agent"/);
  assert.doesNotMatch(
    projects,
    /title: "Hybrid Deep Learning Model for Stock Price Prediction"/,
  );
});

test("uses local screenshots for the new project cards", () => {
  for (const image of [
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
