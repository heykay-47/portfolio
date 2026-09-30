import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { test } from "node:test";
import { bossFanVectors, createGame } from "../src/components/arcade/arcade-engine.ts";

const engineUrl = new URL("../src/components/arcade/arcade-engine.ts", import.meta.url).href;
const rendererSource = readFileSync(new URL("../src/components/arcade/arcade-renderer.ts", import.meta.url), "utf8")
  .replace('"./arcade-engine"', JSON.stringify(engineUrl));
const { drawGame } = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(rendererSource)).toString("base64")}`);

test("the boss escape label stays clear of angled danger lanes, including near the mobile top edge", () => {
  let labelsShown = 0;
  for (const [width, height, bossX, playerY, attackX] of [
    [320, 568, 236.544, 159.04, 140],
    [390, 844, 195, 700, 195],
    [900, 800, 450, 700, 450],
  ]) {
    const game = createGame(width, height, { projects: [], skills: [], experience: [], education: [] });
    game.phase = "boss";
    game.wave = 4;
    game.player.y = playerY;
    game.bossFight = { phase: 1, mode: "telegraph", sequenceStep: 1, attackX };
    game.enemies = [{ kind: "boss", x: bossX, y: 96, radius: 48, hp: 60, age: 0, flash: 0 }];
    const labels = [];
    const ctx = new Proxy({
      fillText: (text, x, y) => labels.push({ text, x, y }),
    }, { get: (target, key) => key in target ? target[key] : () => {} });
    drawGame(ctx, game, new Map(), true);

    const label = labels.find(({ text }) => text === "SAFE GAP");
    if (!label) continue;
    labelsShown += 1;
    const originY = 96 + 48 * 0.65;
    for (const ray of bossFanVectors(bossX, originY, attackX, playerY)) {
      for (const y of [label.y - 10, label.y]) {
        const laneX = bossX + ray.vx * ((y - originY) / ray.vy);
        assert.ok(Math.abs(label.x - laneX) > 24 + 22, `label overlaps a danger lane at ${width}×${height}`);
      }
    }
  }
  assert.ok(labelsShown >= 2, "normal desktop/mobile warnings should identify an escape gap");
});
