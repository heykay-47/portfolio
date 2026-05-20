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
