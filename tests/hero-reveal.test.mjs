import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");

test("the banner and hero actions use the same entrance reveal as hero copy", () => {
  assert.match(page, /<BlurFade delay={BLUR_FADE_DELAY}>\s*<LlmbidBanner \/>\s*<\/BlurFade>/);
  assert.match(page, /<BlurFade delay={BLUR_FADE_DELAY \* 3}>\s*<div className="flex flex-wrap items-center gap-2">[\s\S]*?<ResumeLink href={DATA.resumeUrl} \/>[\s\S]*?<\/div>\s*<\/BlurFade>/);
});
