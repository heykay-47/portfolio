import assert from "node:assert/strict";
import { test } from "node:test";
import { createGame, resizeGame, stepGame } from "../src/components/arcade/arcade-engine.ts";

const content = {
  projects: [{ title: "VouchIt", image: "/projects/vouchit_headerPage.png" }],
  skills: ["TypeScript"],
  experience: ["Archimedis Digital"],
  education: ["SASTRA"],
};
const idle = { x: 0, y: 0, firing: false, target: null };

test("a run advances through three waves before the final craft", () => {
  const game = createGame(700, 800, content, () => 0.5);
  game.player.invulnerable = Infinity;
  const events = [];
  for (let i = 0; i < 1360; i++) stepGame(game, 0.04, idle, (event) => events.push(event));
  assert.equal(game.phase, "boss");
  assert.equal(game.wave, 4);
  assert.equal(game.enemies.some((enemy) => enemy.kind === "boss"), true);
  assert.equal(events.filter((event) => event === "wave").length, 3);

  const boss = game.enemies.find((enemy) => enemy.kind === "boss");
  const scoreBeforeBoss = game.score;
  boss.hp = 1;
  game.bullets.push({ x: boss.x, y: boss.y, vy: -620, hostile: false });
  stepGame(game, 0.001, idle, (event) => events.push(event));
  assert.equal(game.phase, "felled");
  assert.equal(game.score, scoreBeforeBoss + 1000);
  assert.equal(events.includes("felled"), true);
  assert.equal(events.includes("won"), false);
  for (let i = 0; i < 120; i++) stepGame(game, 0.04, idle, (event) => events.push(event));
  assert.equal(game.phase, "won");
  assert.equal(events.filter((event) => event === "won").length, 1);
});

test("the final craft falls to a focused minute of fire, not an endurance test", () => {
  const game = createGame(700, 800, content, () => 0.5);
  game.player.invulnerable = Infinity;
  for (let i = 0; i < 1360; i++) stepGame(game, 0.04, idle, () => {});
  const boss = game.enemies.find((enemy) => enemy.kind === "boss");
  assert.ok(boss.hp <= 16);
  game.player.power = 9;
  for (let i = 0; i < 8; i++) {
    game.bullets.push({ x: boss.x, y: boss.y, vy: -820, hostile: false });
    stepGame(game, 0.001, idle, () => {});
  }
  assert.equal(game.phase, "felled");
});

test("new powerups repair the hull, clear the sky, and shatter rocks satisfyingly", () => {
  const game = createGame(700, 800, content, () => 0.5);
  game.health = 1;
  game.pickups.push({ x: game.player.x, y: game.player.y, kind: "repair", label: "Docker" });
  stepGame(game, 0.01, idle, () => {});
  assert.equal(game.health, 2);

  game.enemies.push({ kind: "asteroid", x: 350, y: 100, radius: 26, hp: 1, vy: 0, drift: 0, age: 0, shot: 9, flash: 0 });
  game.bullets.push({ x: 350, y: 100, vy: -820, hostile: false });
  stepGame(game, 0.001, idle, () => {});
  assert.equal(game.enemies.filter((enemy) => enemy.radius === 12).length, 2);
  assert.ok(game.rings.length > 0 && game.popups.length > 0 && game.shake > 0);

  game.pickups.push({ x: game.player.x, y: game.player.y, kind: "nova", label: "Docker" });
  stepGame(game, 0.001, idle, () => {});
  assert.equal(game.enemies.length, 0);
});

test("pointer steering closes most of a long gap within a few frames", () => {
  const game = createGame(700, 800, content, () => 0.5);
  const target = { x: 100, y: 500 };
  const start = Math.hypot(target.x - game.player.x, target.y - game.player.y);
  for (let i = 0; i < 6; i++) stepGame(game, 1 / 60, { ...idle, target }, () => {});
  assert.ok(Math.hypot(target.x - game.player.x, target.y - game.player.y) < start * 0.2);
});

test("a pickup scores, upgrades expire, and project motifs are not targets", () => {
  const game = createGame(700, 800, content, () => 0.5);
  game.pickups.push({ x: game.player.x, y: game.player.y, kind: "wide", label: "TypeScript" });
  game.bullets.push({ x: game.player.x, y: game.player.y, vy: -620, hostile: false });
  stepGame(game, 0.01, idle, () => {});
  assert.equal(game.score, 75);
  assert.equal(game.player.wide, 9);
  assert.equal(game.pickups.length, 0);
  assert.equal(game.phase, "waves");
  game.player.invulnerable = Infinity;
  for (let i = 0; i < 240; i++) stepGame(game, 0.04, idle, () => {});
  assert.equal(game.player.wide, 0);
});

test("three hull hits end a run; shield absorbs one without losing hull", () => {
  const game = createGame(700, 800, content, () => 0.5);
  const events = [];
  const hit = () => {
    game.player.invulnerable = 0;
    game.bullets.push({ x: game.player.x, y: game.player.y, vy: 220, hostile: true });
    stepGame(game, 0.001, idle, (event) => events.push(event));
  };
  game.player.shield = 9;
  hit();
  assert.equal(game.health, 3);
  hit(); hit(); hit();
  assert.equal(game.health, 0);
  assert.equal(game.phase, "lost");
  assert.equal(events.filter((event) => event === "lost").length, 1);
});

test("the jet keeps its relative position across orientation changes", () => {
  const game = createGame(400, 800, content);
  resizeGame(game, 800, 400);
  assert.equal(game.player.x, 400);
  assert.equal(game.player.y, 312);
});
