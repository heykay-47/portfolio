import assert from "node:assert/strict";
import { test } from "node:test";
import { BOSS_HP, createGame, resizeGame, stepGame } from "../src/components/arcade/arcade-engine.ts";

const content = {
  projects: [{ title: "VouchIt", image: "/projects/vouchit_headerPage.png" }],
  skills: ["TypeScript"],
  experience: ["Archimedis Digital"],
  education: ["SASTRA"],
};
const idle = { x: 0, y: 0, firing: false, target: null };
const stepFor = (game, seconds, input = idle, onEvent = () => {}) => {
  const frames = Math.ceil(seconds / 0.04);
  for (let i = 0; i < frames; i++) stepGame(game, Math.min(0.04, seconds - i * 0.04), input, onEvent);
};

test("round one advances from a cleared ship to a debris lane, then their combination", () => {
  const game = createGame(700, 800, content, () => 0.5);
  game.player.invulnerable = Infinity;
  stepFor(game, 1);
  assert.equal(game.wave, 1);
  assert.ok(game.enemies.some((enemy) => enemy.kind === "ship"));
  assert.equal(game.enemies.some((enemy) => enemy.kind === "asteroid"), false);

  game.enemies = [];
  game.bullets = [];
  stepFor(game, 5.9);
  assert.equal(game.beatIndex, 0);
  stepFor(game, 0.6);
  assert.equal(game.beatIndex, 1);
  stepFor(game, 0.7);
  assert.ok(game.enemies.some((enemy) => enemy.kind === "asteroid"));
  assert.equal(game.enemies.some((enemy) => enemy.kind === "ship"), false);

  game.enemies = [];
  game.bullets = [];
  stepFor(game, 8);
  assert.ok(game.enemies.some((enemy) => enemy.kind === "ship"));
  assert.ok(game.enemies.some((enemy) => enemy.kind === "asteroid"));
});

test("a ship shows its straight firing lane before firing a hostile shot", () => {
  const game = createGame(700, 800, content, () => 0.75);
  game.player.invulnerable = Infinity;
  stepFor(game, 4);
  const warnedShip = game.enemies.find((enemy) => enemy.kind === "ship" && enemy.warningFor > 0);
  assert.ok(warnedShip);
  assert.equal(warnedShip.targetX, warnedShip.x);
  assert.equal(game.bullets.some((bullet) => bullet.hostile), false);
  stepFor(game, 0.8);
  assert.ok(game.bullets.some((bullet) => bullet.hostile && bullet.vx === 0));
});

test("a missed round-one threat cannot stall the round past its cap", () => {
  const game = createGame(700, 800, content, () => 0.5);
  game.player.invulnerable = Infinity;
  game.roundElapsed = 44.98;
  game.enemies.push({ kind: "ship", x: 350, y: 400, radius: 20, hp: 2, vy: 0, drift: 0, age: 0, shot: 99, flash: 0, warningFor: 0, targetX: 350 });
  game.bullets.push({ x: 350, y: 100, vx: 0, vy: 220, hostile: true });
  game.hazards.push({ kind: "rail-pulse", x: 40, y: 0, width: 50, height: 800, gapX: 0, gapWidth: 0, age: 0, warningFor: 0, activeFor: 5, velocity: 0, drift: 0 });
  stepGame(game, 0.04, idle, () => {});
  assert.equal(game.wave, 1);
  assert.equal(game.roundState, "intermission");
  assert.equal(game.enemies.length, 0);
  assert.equal(game.bullets.some((bullet) => bullet.hostile), false);
  assert.equal(game.hazards.length, 0);
  assert.ok(game.pickups.some((pickup) => pickup.kind === "repair" || pickup.kind === "project"));
});

test("an uncleared beat is cleared and advances at its own hard timeout", () => {
  const game = createGame(700, 800, content, () => 0.5);
  game.player.invulnerable = Infinity;
  stepFor(game, 1);
  const ship = game.enemies.find((enemy) => enemy.kind === "ship");
  assert.ok(ship);
  ship.y = 300;
  ship.vy = 0;
  ship.shot = 99;
  stepFor(game, 10.6);
  assert.equal(game.beatIndex, 1);
  assert.equal(game.enemies.length, 0);
  assert.equal(game.bullets.length, 0);
  stepFor(game, 0.7);
  assert.ok(game.enemies.some((enemy) => enemy.kind === "asteroid"));
});

test("a rail pulse warns before it damages the player", () => {
  const game = createGame(700, 800, content, () => 0.5);
  game.player.invulnerable = 0;
  game.hazards.push({ kind: "rail-pulse", x: game.player.x, y: 0, width: 50, height: 800, gapX: 0, gapWidth: 0, age: 0, warningFor: 0.5, activeFor: 0.5, velocity: 0, drift: 0 });
  stepFor(game, 0.2);
  assert.equal(game.health, 3);
  stepFor(game, 0.4);
  assert.equal(game.health, 2);
});

test("round two introduces a warned interceptor and rail pulse after round one", () => {
  const game = createGame(700, 800, content, () => 0.5);
  game.player.invulnerable = Infinity;
  game.wave = 2;
  stepFor(game, 1);
  const interceptor = game.enemies.find((enemy) => enemy.kind === "interceptor");
  assert.ok(interceptor);
  const laneDistance = Math.abs(interceptor.laneX - interceptor.x);
  assert.ok(laneDistance > 0);
  stepFor(game, 0.2);
  assert.ok(Math.abs(interceptor.laneX - interceptor.x) < laneDistance);

  interceptor.y = 200;
  interceptor.shot = 0.001;
  game.player.x = 100;
  game.player.y = 650;
  stepGame(game, 0.04, idle, () => {});
  assert.ok(interceptor.warningFor > 0);
  assert.equal(interceptor.targetX, 100);
  stepFor(game, 1);
  const aimedShot = game.bullets.find((bullet) => bullet.hostile);
  assert.ok(aimedShot);
  assert.ok(aimedShot.vx < 0 && aimedShot.vy > 0);

  game.enemies = [];
  game.bullets = [];
  stepFor(game, 5.9);
  assert.ok(game.hazards.some((hazard) => hazard.kind === "rail-pulse" && hazard.warningFor > 0));
});

test("a debris gate only damages inside its visible side panels", () => {
  const game = createGame(700, 800, content, () => 0.5);
  game.player.x = 22;
  game.player.invulnerable = 0;
  game.hazards.push({ kind: "debris-gate", x: 84, y: game.player.y, width: 532, height: 22, gapX: 350, gapWidth: 100, age: 0, warningFor: 0, activeFor: 1, velocity: 0, drift: 0 });
  stepGame(game, 0.04, idle, () => {});
  assert.equal(game.health, 3);

  game.player.x = 678;
  stepGame(game, 0.04, idle, () => {});
  assert.equal(game.health, 3);

  game.player.x = 200;
  game.player.invulnerable = 0;
  stepGame(game, 0.04, idle, () => {});
  assert.equal(game.health, 2);
});

test("round three teaches the gate before combining it with a ship and then the alien", () => {
  const game = createGame(360, 740, content, () => 0.5);
  game.player.invulnerable = Infinity;
  game.wave = 3;
  stepFor(game, 1);
  assert.equal(game.enemies.length, 0);
  assert.equal(game.hazards.length, 1);
  assert.equal(game.hazards[0].kind, "debris-gate");
  assert.ok(game.hazards[0].warningFor > 0);
  assert.ok(game.hazards[0].gapWidth >= 92);

  game.hazards = [];
  game.beatElapsed = 8;
  stepGame(game, 0.04, idle, () => {});
  stepFor(game, 0.7);
  assert.ok(game.enemies.some((enemy) => enemy.kind === "ship"));
  assert.ok(game.hazards.some((hazard) => hazard.kind === "debris-gate"));
  assert.equal(game.enemies.some((enemy) => enemy.kind === "alien"), false);

  game.enemies = [];
  game.bullets = [];
  game.hazards = [];
  game.beatElapsed = 9;
  stepGame(game, 0.04, idle, () => {});
  stepFor(game, 0.7);
  assert.ok(game.enemies.some((enemy) => enemy.kind === "alien"));
  assert.ok(game.hazards.some((hazard) => hazard.kind === "debris-gate"));
});

test("shattered debris-lane fragments stay outside the reserved escape gap", () => {
  const game = createGame(700, 800, content, () => 0.5);
  game.player.invulnerable = Infinity;
  const gapX = 350;
  game.enemies.push({ kind: "asteroid", x: 260, y: 300, radius: 26, hp: 1, safeGapX: gapX, vy: 0, drift: 0, age: 0, shot: 99, flash: 0, warningFor: 0, targetX: game.player.x });
  game.bullets.push({ x: 260, y: 300, vx: 0, vy: -820, hostile: false });
  stepGame(game, 0.001, idle, () => {});
  stepFor(game, 1);
  const fragments = game.enemies.filter((enemy) => enemy.kind === "asteroid" && enemy.radius === 12);
  assert.equal(fragments.length, 2);
  assert.ok(fragments.every((fragment) => fragment.x < gapX - 60));
});

test("phase one fires its warned slow volley and fan before exposing the core", () => {
  const game = createGame(700, 800, content, () => 0.5);
  game.player.invulnerable = Infinity;
  stepFor(game, 163);
  const fight = game.bossFight;
  const boss = game.enemies.find((enemy) => enemy.kind === "boss");
  game.bullets = [];
  game.hazards = [];
  fight.phase = 1;
  fight.mode = "telegraph";
  fight.timer = 0.04;
  fight.sequenceStep = 0;
  fight.coreOpen = false;
  fight.attackX = 160;

  stepGame(game, 0.04, idle, () => {});
  assert.equal(fight.mode, "attack");
  assert.equal(fight.sequenceStep, 1);
  assert.equal(fight.coreOpen, false);
  assert.equal(game.bullets.filter((bullet) => bullet.hostile).length, 3);

  for (let i = 0; i < 200 && !(fight.mode === "telegraph" && fight.sequenceStep === 1); i++) {
    stepGame(game, 0.04, idle, () => {});
  }
  assert.equal(fight.mode, "telegraph");
  assert.equal(fight.coreOpen, false);
  assert.equal(game.bullets.filter((bullet) => bullet.hostile).length, 0);

  let originX = boss.x;
  let originY = boss.y + boss.radius * 0.6;
  for (let i = 0; i < 100 && fight.mode === "telegraph"; i++) {
    if (fight.timer <= 0.04) {
      originX = boss.x;
      originY = boss.y + boss.radius * 0.6;
    }
    stepGame(game, 0.04, idle, () => {});
  }
  assert.equal(fight.mode, "attack");
  assert.equal(fight.sequenceStep, 0);
  const fan = game.bullets.filter((bullet) => bullet.hostile);
  assert.equal(fan.length, 3);
  const centerAngle = Math.atan2(fan[1].vx, fan[1].vy);
  const aimedAngle = Math.atan2(fight.attackX - originX, game.player.y - originY);
  assert.ok(Math.abs(centerAngle - aimedAngle) < 0.01);

  for (let i = 0; i < 200 && fight.mode === "attack"; i++) stepGame(game, 0.04, idle, () => {});
  assert.equal(fight.mode, "recovery");
  assert.equal(fight.coreOpen, true);
  assert.equal(game.bullets.filter((bullet) => bullet.hostile).length, 0);
});

test("phase two keeps the core closed until its aimed shot has passed", () => {
  const game = createGame(700, 800, content, () => 0.5);
  game.player.invulnerable = Infinity;
  stepFor(game, 163);
  const fight = game.bossFight;
  game.bullets = [];
  fight.phase = 2;
  fight.mode = "telegraph";
  fight.timer = 0.04;
  fight.coreOpen = false;
  fight.attackX = 250;

  stepGame(game, 0.04, idle, () => {});
  assert.ok(game.hazards.some((hazard) => hazard.kind === "rail-pulse"));
  for (let i = 0; i < 200 && fight.followupWarning === 0 && !fight.followupFired; i++) stepGame(game, 0.04, idle, () => {});
  assert.ok(fight.followupWarning > 0);
  assert.equal(game.bullets.some((bullet) => bullet.hostile), false);
  stepFor(game, 0.6);
  assert.equal(fight.followupFired, true);
  assert.equal(fight.coreOpen, false);
  assert.equal(game.hazards.some((hazard) => hazard.kind === "rail-pulse"), false);
  assert.ok(game.bullets.some((bullet) => bullet.hostile));

  for (let i = 0; i < 200 && fight.mode === "attack"; i++) stepGame(game, 0.04, idle, () => {});
  assert.equal(fight.mode, "recovery");
  assert.equal(fight.coreOpen, true);
  assert.equal(game.bullets.filter((bullet) => bullet.hostile).length, 0);
});

test("boss entry stays harmless through its descent and first warning on a small screen", () => {
  const game = createGame(400, 400, content, () => 0.5);
  game.phase = "boss";
  game.wave = 4;
  game.player.x = 200;
  game.player.y = 112;
  game.enemies.push({ kind: "boss", x: 200, y: -65, radius: 48, hp: BOSS_HP, vy: 120, drift: 0, age: 0, shot: 0, flash: 0, warningFor: 0, targetX: game.player.x });
  game.bossFight = { phase: 1, mode: "intro", timer: 1.5, attacksInPhase: 0, sequenceStep: 0, coreOpen: false, thresholdHit: false, counterWindowSeen: false, attackX: 200, followupFired: false, followupWarning: 0 };

  for (let i = 0; i < 55; i++) {
    game.player.x = game.enemies[0].x;
    stepGame(game, 0.04, idle, () => {});
  }
  assert.equal(game.health, 3);
  assert.equal(game.bossFight.mode, "telegraph");
  assert.equal(game.enemies[0].y, 96);
  for (let i = 0; i < 8; i++) {
    game.player.x = game.enemies[0].x;
    stepGame(game, 0.04, idle, () => {});
  }
  assert.equal(game.health, 3);
  assert.equal(game.enemies[0].y, 96);
});

test("a tall-screen boss waits for its debris gate to leave before warning for the fan", () => {
  const game = createGame(700, 800, content, () => 0.5);
  game.phase = "boss";
  game.wave = 4;
  game.player.y = 224;
  game.player.invulnerable = Infinity;
  game.enemies.push({ kind: "boss", x: 350, y: 96, radius: 48, hp: BOSS_HP, vy: 0, drift: 0, age: 0, shot: 0, flash: 0, warningFor: 0, targetX: game.player.x });
  game.hazards.push({ kind: "debris-gate", x: 84, y: -336, width: 532, height: 22, gapX: 350, gapWidth: 100, age: 0, warningFor: 3.2, activeFor: 12, velocity: 128, drift: 42 });
  game.bossFight = { phase: 3, mode: "attack", timer: 0.04, attacksInPhase: 1, sequenceStep: 0, coreOpen: false, thresholdHit: false, counterWindowSeen: false, attackX: game.player.x, followupFired: false, followupWarning: 0 };

  stepFor(game, 8.2);
  assert.ok(game.hazards.some((hazard) => hazard.kind === "debris-gate"));
  assert.equal(game.bossFight.mode, "attack");
  assert.equal(game.bossFight.followupWarning, 0);
  assert.equal(game.bossFight.coreOpen, false);

  for (let i = 0; i < 80 && game.hazards.some((hazard) => hazard.kind === "debris-gate"); i++) {
    stepGame(game, 0.04, idle, () => {});
  }
  assert.equal(game.hazards.some((hazard) => hazard.kind === "debris-gate"), false);
  stepGame(game, 0.04, idle, () => {});
  assert.ok(game.bossFight.followupWarning > 0);
  assert.equal(game.bossFight.coreOpen, false);
});

test("the three authored rounds lead into a boss with a readable first attack", () => {
  const game = createGame(700, 800, content, () => 0.5);
  game.player.invulnerable = Infinity;
  const events = [];
  stepFor(game, 163, idle, (event) => events.push(event));
  assert.equal(game.phase, "boss");
  assert.equal(game.wave, 4);
  assert.equal(game.enemies.some((enemy) => enemy.kind === "boss"), true);
  assert.equal(events.filter((event) => event === "wave").length, 3);
  assert.equal(game.bossFight.phase, 1);
  assert.ok(game.bossFight.attacksInPhase > 0);
  assert.equal(game.bossFight.counterWindowSeen, true);
});

test("a centered continuous-fire run defeats the boss within its tuning budget", () => {
  const game = createGame(700, 800, content, () => 0.5);
  game.player.invulnerable = Infinity;
  const started = { at: 0 };
  let defeatedAt;
  const bossPhases = [];
  for (let i = 0; i < 10_000 && defeatedAt === undefined; i++) {
    stepGame(game, 0.04, { ...idle, firing: true }, (event) => {
      if (event === "wave" && game.wave === 4) started.at = game.elapsed;
      if (event === "boss-phase") bossPhases.push(game.bossFight.phase);
      if (event === "felled") defeatedAt = game.elapsed;
    });
  }
  assert.notEqual(defeatedAt, undefined);
  assert.deepEqual(bossPhases, [2, 3]);
  assert.ok(defeatedAt - started.at >= 60 && defeatedAt - started.at <= 80);
});

test("boss health segments stop power damage from skipping the next phase", () => {
  const game = createGame(700, 800, content, () => 0.5);
  game.player.invulnerable = Infinity;
  stepFor(game, 163);
  const boss = game.enemies.find((enemy) => enemy.kind === "boss");
  assert.equal(boss.hp, BOSS_HP);
  game.bossFight.mode = "recovery";
  game.bossFight.coreOpen = true;
  game.bossFight.counterWindowSeen = true;
  game.bossFight.attacksInPhase = 1;
  boss.hp = BOSS_HP * (2 / 3) + 1;
  game.player.power = 9;
  for (let i = 0; i < 8; i++) {
    game.bullets.push({ x: boss.x, y: boss.y, vx: 0, vy: -820, hostile: false });
    stepGame(game, 0.001, idle, () => {});
  }
  assert.equal(boss.hp, BOSS_HP * (2 / 3));
  assert.equal(game.bossFight.phase, 1);
  assert.equal(game.phase, "boss");
});

test("nova earns the exposed-core bonus without skipping a boss health segment", () => {
  const applyNova = (coreOpen) => {
    const game = createGame(700, 800, content, () => 0.5);
    game.player.invulnerable = Infinity;
    stepFor(game, 163);
    const boss = game.enemies.find((enemy) => enemy.kind === "boss");
    game.bossFight.mode = "recovery";
    game.bossFight.timer = 10;
    game.bossFight.coreOpen = coreOpen;
    game.pickups.push({ x: game.player.x, y: game.player.y, kind: "nova", label: "Docker" });
    stepGame(game, 0.01, idle, () => {});
    return { boss, fight: game.bossFight };
  };

  const closed = applyNova(false);
  assert.equal(closed.boss.hp, 48);

  const open = applyNova(true);
  assert.equal(open.boss.hp, BOSS_HP * (2 / 3));
  assert.equal(open.fight.thresholdHit, true);
  assert.equal(open.fight.phase, 1);
});

test("the exposed core doubles ordinary chip damage", () => {
  const damageBoss = (coreOpen) => {
    const game = createGame(700, 800, content, () => 0.5);
    game.player.invulnerable = Infinity;
    stepFor(game, 163);
    const boss = game.enemies.find((enemy) => enemy.kind === "boss");
    game.bossFight.mode = coreOpen ? "recovery" : "attack";
    game.bossFight.timer = 10;
    game.bossFight.coreOpen = coreOpen;
    game.bullets.push({ x: boss.x, y: boss.y, vx: 0, vy: -820, hostile: false });
    stepGame(game, 0.001, idle, () => {});
    return boss.hp;
  };

  assert.ok(Math.abs(damageBoss(false) - (BOSS_HP - 0.22)) < 1e-9);
  assert.equal(damageBoss(true), BOSS_HP - 2);
});

test("a boss phase transition clears old hazards and each attack creates a counter window", () => {
  const game = createGame(700, 800, content, () => 0.5);
  game.player.invulnerable = Infinity;
  stepFor(game, 163);
  const boss = game.enemies.find((enemy) => enemy.kind === "boss");
  game.bossFight.mode = "recovery";
  game.bossFight.timer = 0.01;
  game.bossFight.thresholdHit = true;
  game.bossFight.counterWindowSeen = true;
  game.bossFight.attacksInPhase = 1;
  game.bullets.push({ x: 10, y: 10, vx: 0, vy: 220, hostile: true });
  game.hazards.push({ kind: "rail-pulse", x: 10, y: 0, width: 50, height: 800, gapX: 0, gapWidth: 0, age: 0, warningFor: 0, activeFor: 5, velocity: 0, drift: 0 });
  stepGame(game, 0.04, idle, () => {});
  assert.equal(game.bossFight.mode, "transition");
  assert.equal(game.bullets.length, 0);
  assert.equal(game.hazards.length, 0);
  stepFor(game, 1.5);
  assert.equal(game.bossFight.phase, 2);
  stepFor(game, 1.3);
  assert.equal(game.bossFight.attacksInPhase, 1);
  assert.ok(game.hazards.some((hazard) => hazard.kind === "rail-pulse"));
  stepFor(game, 4.5);
  assert.equal(game.bossFight.coreOpen, true);
  assert.ok(boss.hp > 0);

  game.bossFight.mode = "recovery";
  game.bossFight.timer = 0.01;
  game.bossFight.thresholdHit = true;
  game.bullets.push({ x: 10, y: 10, vx: 0, vy: 220, hostile: true });
  game.hazards.push({ kind: "rail-pulse", x: 10, y: 0, width: 50, height: 800, gapX: 0, gapWidth: 0, age: 0, warningFor: 0, activeFor: 5, velocity: 0, drift: 0 });
  stepGame(game, 0.04, idle, () => {});
  assert.equal(game.bossFight.mode, "transition");
  assert.equal(game.bullets.length, 0);
  assert.equal(game.hazards.length, 0);
  stepFor(game, 1.5);
  assert.equal(game.bossFight.phase, 3);
  stepFor(game, 1.6);
  assert.ok(game.hazards.some((hazard) => hazard.kind === "debris-gate"));
});

test("the final boss phase warns and fires a fan after its changing-gap panel", () => {
  const game = createGame(700, 800, content, () => 0.5);
  game.player.invulnerable = Infinity;
  stepFor(game, 163);
  const fight = game.bossFight;
  game.bullets = [];
  game.hazards = [];
  fight.phase = 3;
  fight.mode = "telegraph";
  fight.timer = 0.001;
  fight.coreOpen = false;
  stepGame(game, 0.04, idle, () => {});
  assert.ok(game.hazards.some((hazard) => hazard.kind === "debris-gate"));

  let fanOverlappedGate = false;
  for (let i = 0; i < 250 && game.hazards.some((hazard) => hazard.kind === "debris-gate"); i++) {
    stepGame(game, 0.04, idle, () => {});
    if (game.bullets.some((bullet) => bullet.hostile) && game.hazards.some((hazard) => hazard.kind === "debris-gate")) {
      fanOverlappedGate = true;
    }
  }
  assert.equal(game.hazards.some((hazard) => hazard.kind === "debris-gate"), false);
  assert.equal(fanOverlappedGate, false);
  stepGame(game, 0.04, idle, () => {});
  assert.ok(fight.followupWarning > 0);
  assert.equal(game.bullets.filter((bullet) => bullet.hostile).length, 0);
  stepFor(game, 0.9);
  assert.equal(game.bullets.filter((bullet) => bullet.hostile).length, 3);
  assert.equal(fight.followupFired, true);

  for (let i = 0; i < 200 && fight.mode === "attack"; i++) stepGame(game, 0.04, idle, () => {});
  assert.equal(fight.mode, "recovery");
  assert.equal(fight.coreOpen, true);
  assert.equal(game.bullets.filter((bullet) => bullet.hostile).length, 0);
});

test("the exposed core rewards counterattacks and the final phase can be defeated", () => {
  const game = createGame(700, 800, content, () => 0.5);
  game.player.invulnerable = Infinity;
  stepFor(game, 163);
  const boss = game.enemies.find((enemy) => enemy.kind === "boss");
  game.bossFight.phase = 3;
  game.bossFight.mode = "recovery";
  game.bossFight.coreOpen = true;
  game.bossFight.counterWindowSeen = true;
  game.bossFight.attacksInPhase = 1;
  boss.hp = 1;
  const events = [];
  game.bullets.push({ x: boss.x, y: boss.y, vx: 0, vy: -620, hostile: false });
  stepGame(game, 0.001, idle, (event) => events.push(event));
  assert.equal(game.phase, "felled");
  assert.equal(events.includes("felled"), true);
  stepFor(game, 4.3, idle, (event) => events.push(event));
  assert.equal(game.phase, "won");
  assert.equal(events.filter((event) => event === "won").length, 1);
});

test("new powerups repair the hull, clear the sky, and shatter rocks satisfyingly", () => {
  const game = createGame(700, 800, content, () => 0.5);
  game.health = 1;
  game.pickups.push({ x: game.player.x, y: game.player.y, kind: "repair", label: "Docker" });
  stepGame(game, 0.01, idle, () => {});
  assert.equal(game.health, 2);

  game.enemies.push({ kind: "asteroid", x: 350, y: 100, radius: 26, hp: 1, vy: 0, drift: 0, age: 0, shot: 9, flash: 0 });
  game.bullets.push({ x: 350, y: 100, vx: 0, vy: -820, hostile: false });
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
  game.bullets.push({ x: game.player.x, y: game.player.y, vx: 0, vy: -620, hostile: false });
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
    game.bullets.push({ x: game.player.x, y: game.player.y, vx: 0, vy: 220, hostile: true });
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
  game.enemies.push({ kind: "interceptor", x: 100, y: 200, radius: 20, hp: 2, laneX: 200, vy: 116, drift: 0, age: 0, shot: 1.5, flash: 0, warningFor: 0, targetX: game.player.x });
  game.enemies.push({ kind: "boss", x: 200, y: 96, radius: 48, hp: BOSS_HP, vy: 60, drift: 0, age: 0, shot: 0, flash: 0, warningFor: 0, targetX: game.player.x });
  game.phase = "boss";
  game.bossFight = { phase: 2, mode: "telegraph", timer: 0.04, attacksInPhase: 0, sequenceStep: 0, coreOpen: false, thresholdHit: false, counterWindowSeen: false, attackX: 300, followupFired: false, followupWarning: 0 };
  resizeGame(game, 800, 400);
  assert.equal(game.player.x, 400);
  assert.equal(game.player.y, 312);
  assert.equal(game.enemies[0].laneX, 400);
  assert.equal(game.bossFight.attackX, 600);
  stepGame(game, 0.04, idle, () => {});
  assert.equal(game.hazards[0].x, 600);
});

test("resizing preserves the debris lane's reserved escape gap", () => {
  const game = createGame(400, 800, content);
  game.player.invulnerable = Infinity;
  game.enemies.push({ kind: "asteroid", x: 100, y: 300, radius: 24, hp: 1, safeGapX: 300, vy: 112, drift: 0, age: 0, shot: 99, flash: 0, warningFor: 0, targetX: game.player.x });
  resizeGame(game, 800, 400);
  assert.equal(game.enemies[0].x, 200);
  assert.equal(game.enemies[0].safeGapX, 600);

  game.bullets.push({ x: 200, y: 150, vx: 0, vy: -820, hostile: false });
  stepGame(game, 0.001, idle, () => {});
  stepFor(game, 1);
  const fragments = game.enemies.filter((enemy) => enemy.kind === "asteroid" && enemy.radius === 12);
  assert.equal(fragments.length, 2);
  assert.ok(fragments.every((fragment) => fragment.x < game.enemies[0].safeGapX - 60));
});

test("round pickups keep their existing spawn cadence", () => {
  const game = createGame(700, 800, content, () => 0.5);
  game.pickupIn = 0.01;
  stepGame(game, 0.04, idle, () => {});
  assert.equal(game.pickups.length, 1);
  assert.equal(game.pickupIn, 5.5);
  assert.ok(game.pickups[0].y >= 82);
});
