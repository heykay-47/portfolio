export type ArcadeContent = {
  projects: { title: string; image: string }[];
  skills: string[];
  experience: string[];
  education: string[];
};

type EnemyKind = "asteroid" | "ship" | "interceptor" | "alien" | "boss";
export type Upgrade = "shield" | "rapid" | "wide" | "power" | "magnet" | "repair" | "nova";
const UPGRADES: Upgrade[] = ["shield", "rapid", "wide", "power", "magnet", "repair", "nova"];
export const BOSS_HP = 60;
const FELLED_SECONDS = 4.2;
type BossPhase = 1 | 2 | 3;
type BossMode = "intro" | "telegraph" | "attack" | "recovery" | "transition";
export type BossFight = {
  phase: BossPhase;
  mode: BossMode;
  timer: number;
  attacksInPhase: number;
  sequenceStep: 0 | 1;
  coreOpen: boolean;
  thresholdHit: boolean;
  counterWindowSeen: boolean;
  attackX: number;
  followupFired: boolean;
  followupWarning: number;
};

type Enemy = {
  kind: EnemyKind;
  x: number;
  y: number;
  radius: number;
  hp: number;
  laneX?: number;
  safeGapX?: number;
  vy: number;
  drift: number;
  age: number;
  shot: number;
  flash: number;
  warningFor: number;
  targetX: number;
};

type Bullet = { x: number; y: number; vx: number; vy: number; hostile: boolean };
export type Hazard = {
  kind: "rail-pulse" | "debris-gate";
  x: number;
  y: number;
  width: number;
  height: number;
  gapX: number;
  gapWidth: number;
  age: number;
  warningFor: number;
  activeFor: number;
  velocity: number;
  drift: number;
};
type RoundPattern = "ship" | "interceptor" | "alien" | "debris-lane" | "rail-pulse" | "debris-gate";
type RoundBeat = { delaySeconds: number; advanceAfterSeconds: number; maxSeconds: number; patterns: RoundPattern[] };
type Pickup = {
  x: number;
  y: number;
  kind: "project" | Upgrade;
  label: string;
  image?: string;
};
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number };
type Ring = { x: number; y: number; radius: number; grow: number; life: number; color: string };
type Popup = { x: number; y: number; text: string; life: number };

export type GameEvent = "hit" | "pickup" | "destroy" | "won" | "lost" | "wave" | "intermission" | "felled" | "boss-phase";
export type GameInput = {
  x: number;
  y: number;
  firing: boolean;
  target: { x: number; y: number } | null;
};

export type Game = {
  width: number;
  height: number;
  elapsed: number;
  wave: number;
  roundElapsed: number;
  roundState: "active" | "intermission" | "boss";
  intermissionFor: number;
  beatIndex: number;
  beatElapsed: number;
  beatSpawned: boolean;
  phase: "waves" | "boss" | "felled" | "won" | "lost";
  score: number;
  health: number;
  player: { x: number; y: number; invulnerable: number; shield: number; rapid: number; wide: number; power: number; magnet: number };
  enemies: Enemy[];
  bullets: Bullet[];
  pickups: Pickup[];
  hazards: Hazard[];
  bossFight: BossFight | null;
  particles: Particle[];
  rings: Ring[];
  popups: Popup[];
  shake: number;
  combo: number;
  comboFor: number;
  felledFor: number;
  spawned: Enemy[];
  pickupIn: number;
  fireIn: number;
  content: ArcadeContent;
  random: () => number;
};

const ROUND_SECONDS = [45, 50, 55];
const ROUND_BEATS: RoundBeat[][] = [
  [
    { delaySeconds: 0.4, advanceAfterSeconds: 7, maxSeconds: 11, patterns: ["ship"] },
    { delaySeconds: 0.6, advanceAfterSeconds: 7, maxSeconds: 11, patterns: ["debris-lane"] },
    { delaySeconds: 0.6, advanceAfterSeconds: 12, maxSeconds: 20, patterns: ["ship", "debris-lane"] },
  ],
  [
    { delaySeconds: 0.4, advanceAfterSeconds: 7, maxSeconds: 10, patterns: ["interceptor"] },
    { delaySeconds: 0.6, advanceAfterSeconds: 7, maxSeconds: 10, patterns: ["rail-pulse"] },
    { delaySeconds: 0.6, advanceAfterSeconds: 8, maxSeconds: 14, patterns: ["ship", "rail-pulse"] },
    { delaySeconds: 0.6, advanceAfterSeconds: 8, maxSeconds: 13, patterns: ["interceptor", "rail-pulse"] },
  ],
  [
    { delaySeconds: 0.4, advanceAfterSeconds: 8, maxSeconds: 12, patterns: ["debris-gate"] },
    { delaySeconds: 0.6, advanceAfterSeconds: 9, maxSeconds: 15, patterns: ["ship", "debris-gate"] },
    { delaySeconds: 0.6, advanceAfterSeconds: 10, maxSeconds: 13, patterns: ["alien", "debris-gate"] },
  ],
];
const INTERMISSION_SECONDS = 4;
const BOSS_ATTACK_CLEARANCE = 0.1;
const BOSS_RECOVERY_SECONDS = 1.7;
const BOSS_PHASE_TWO_ATTACK_SECONDS = 3.5;
const BOSS_PHASE_TWO_WARNING_REMAINING = 2.4;
const BOSS_PHASE_TWO_WARNING_SECONDS = 0.55;
const BOSS_PHASE_THREE_WARNING_SECONDS = 0.8;
const BOSS_GATE_SPEED = 128;
const BOSS_FAN_SPREAD = 0.2;
const BOSS_OPENING_SPREAD = 0.08;
const BOSS_OPENING_SPEED = 195;
const BOSS_FAN_SPEED = 270;
const intersects = (ax: number, ay: number, bx: number, by: number, radius: number) =>
  (ax - bx) ** 2 + (ay - by) ** 2 < radius ** 2;

export function createGame(
  width: number,
  height: number,
  content: ArcadeContent,
  random: () => number = Math.random,
): Game {
  return {
    width,
    height,
    elapsed: 0,
    wave: 1,
    roundElapsed: 0,
    roundState: "active",
    intermissionFor: 0,
    beatIndex: 0,
    beatElapsed: 0,
    beatSpawned: false,
    phase: "waves",
    score: 0,
    health: 3,
    player: { x: width / 2, y: height * 0.78, invulnerable: 0, shield: 0, rapid: 0, wide: 0, power: 0, magnet: 0 },
    enemies: [],
    bullets: [],
    pickups: [],
    hazards: [],
    bossFight: null,
    particles: [],
    rings: [],
    popups: [],
    shake: 0,
    combo: 0,
    comboFor: 0,
    felledFor: 0,
    spawned: [],
    pickupIn: 7,
    fireIn: 0,
    content,
    random,
  };
}

export function resizeGame(game: Game, width: number, height: number) {
  const oldWidth = game.width;
  const oldHeight = game.height;
  game.width = width;
  game.height = height;
  game.player.x = (game.player.x / oldWidth) * width;
  game.player.y = (game.player.y / oldHeight) * height;
  for (const enemy of game.enemies) {
    enemy.x = (enemy.x / oldWidth) * width;
    enemy.y = (enemy.y / oldHeight) * height;
    if (enemy.laneX !== undefined) enemy.laneX = (enemy.laneX / oldWidth) * width;
    if (enemy.safeGapX !== undefined) enemy.safeGapX = (enemy.safeGapX / oldWidth) * width;
  }
  for (const pickup of game.pickups) {
    pickup.x = (pickup.x / oldWidth) * width;
    pickup.y = (pickup.y / oldHeight) * height;
  }
  for (const hazard of game.hazards) {
    hazard.x = (hazard.x / oldWidth) * width;
    hazard.y = (hazard.y / oldHeight) * height;
    hazard.gapX = (hazard.gapX / oldWidth) * width;
    hazard.width = (hazard.width / oldWidth) * width;
    hazard.gapWidth = (hazard.gapWidth / oldWidth) * width;
  }
  if (game.bossFight) {
    game.bossFight.attackX = Math.max(30, Math.min(width - 30, (game.bossFight.attackX / oldWidth) * width));
  }
}

function burst(game: Game, x: number, y: number, color: string, count = 8, force = 1) {
  for (let i = 0; i < count; i++) {
    const angle = game.random() * Math.PI * 2;
    const speed = (60 + game.random() * 220) * force;
    game.particles.push({
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      life: 0.35 + game.random() * 0.5, color, size: 2 + game.random() * 3 * force,
    });
  }
  if (game.particles.length > 260) game.particles.splice(0, game.particles.length - 260);
}

function ring(game: Game, x: number, y: number, radius: number, color: string, grow = 260) {
  game.rings.push({ x, y, radius, grow, life: 0.45, color });
}

function popup(game: Game, x: number, y: number, text: string) {
  game.popups.push({ x, y, text, life: 0.8 });
  if (game.popups.length > 14) game.popups.shift();
}

function spawnEnemy(game: Game, kind: EnemyKind) {
  const radius = kind === "asteroid" ? 18 + game.random() * 10 : kind === "boss" ? 48 : 20;
  const speed = kind === "interceptor" ? 116 : kind === "alien" ? 126 : 85 + game.wave * 18;
  const x = radius + game.random() * Math.max(1, game.width - radius * 2);
  const laneX = kind === "interceptor"
    ? Math.max(radius + 8, Math.min(game.width - radius - 8, game.width * (game.random() < 0.5 ? 0.24 : 0.76)))
    : undefined;
  game.enemies.push({
    kind,
    x,
    y: -radius,
    radius,
    hp: kind === "asteroid" ? 2 : kind === "alien" ? 3 : kind === "boss" ? BOSS_HP : 2,
    laneX,
    vy: speed + game.random() * 32,
    drift: kind === "interceptor" ? 0 : kind === "alien" ? 95 : (game.random() - 0.5) * 50,
    age: 0,
    shot: kind === "interceptor" ? 1.5 : kind === "alien" ? 1.8 : 1.5 + game.random() * 1.4,
    flash: 0,
    warningFor: 0,
    targetX: game.player.x,
  });
}

function spawnDebrisLane(game: Game) {
  const left = Math.max(30, game.width * 0.12);
  const right = Math.min(game.width - 30, game.width * 0.88);
  const span = Math.max(1, right - left);
  const gapX = left + span * (0.35 + game.random() * 0.3);
  const gapWidth = Math.max(88, Math.min(128, span * 0.3));
  const count = Math.max(4, Math.floor(span / 54));
  for (let i = 0; i < count; i++) {
    const x = left + (i / (count - 1)) * span;
    if (Math.abs(x - gapX) < gapWidth / 2 + 24) continue;
    const radius = 18 + game.random() * 5;
    game.enemies.push({
      kind: "asteroid", x, y: -radius - Math.floor(i / 3) * 20, radius, hp: 2,
      safeGapX: gapX, vy: 112 + game.random() * 18, drift: 0, age: 0, shot: 99, flash: 0,
      warningFor: 0, targetX: game.player.x,
    });
  }
}

function spawnHazard(game: Game, kind: Hazard["kind"]) {
  if (kind === "rail-pulse") {
    const width = Math.max(44, Math.min(62, game.width * 0.16));
    const min = game.width * 0.2;
    const max = game.width * 0.8;
    const x = min + game.random() * (max - min);
    game.hazards.push({ kind, x, y: 0, width, height: game.height, gapX: 0, gapWidth: 0, age: 0, warningFor: 1.35, activeFor: 0.85, velocity: 0, drift: 0 });
    return;
  }
  const left = game.width * 0.12;
  const width = game.width - left * 2;
  game.hazards.push({
    kind, x: left, y: -22, width, height: 22,
    gapX: left + width * (0.3 + game.random() * 0.4),
    gapWidth: Math.max(92, Math.min(138, width * 0.32)),
    age: 0, warningFor: 1.8, activeFor: 12, velocity: 112, drift: game.random() < 0.5 ? -42 : 42,
  });
}

function playRoundPattern(game: Game, kind: RoundPattern) {
  if (kind === "debris-lane") spawnDebrisLane(game);
  else if (kind === "rail-pulse" || kind === "debris-gate") spawnHazard(game, kind);
  else spawnEnemy(game, kind);
}

function clearRoundThreats(game: Game) {
  game.enemies = [];
  game.bullets = [];
  game.hazards = [];
}

function advanceRoundBeat(game: Game, onEvent: (event: GameEvent) => void) {
  const beats = ROUND_BEATS[game.wave - 1] ?? [];
  if (game.beatIndex + 1 >= beats.length) {
    beginIntermission(game, onEvent);
    return;
  }
  game.beatIndex += 1;
  game.beatElapsed = 0;
  game.beatSpawned = false;
}

function spawnPickup(game: Game) {
  const project = Math.floor(game.elapsed / 5.5) % 3 === 0 && game.content.projects.length > 0;
  const selected = project
    ? game.content.projects[Math.floor(game.elapsed / 16.5) % game.content.projects.length]
    : null;
  const upgrade = UPGRADES[Math.floor(game.elapsed / 5.5) % UPGRADES.length];
  const entryY = Math.max(82, game.height * 0.12);
  game.pickups.push({
    x: 36 + game.random() * Math.max(1, game.width - 72),
    y: entryY,
    kind: selected ? "project" : upgrade,
    label: selected?.title ?? game.content.skills[Math.floor(game.elapsed / 5.5) % game.content.skills.length] ?? "Upgrade",
    image: selected?.image,
  });
}

export function stepGame(game: Game, dt: number, input: GameInput, onEvent: (event: GameEvent) => void) {
  if (game.phase === "won" || game.phase === "lost") return;
  dt = Math.min(0.04, Math.max(0, dt));
  game.shake = Math.max(0, game.shake - dt * 2.5);
  game.comboFor = Math.max(0, game.comboFor - dt);
  if (game.comboFor === 0) game.combo = 0;
  if (game.phase === "felled") {
    // The world slows while the final craft comes apart.
    game.felledFor -= dt;
    dt *= 0.35;
    const boss = game.enemies.find((enemy) => enemy.kind === "boss");
    if (boss && game.random() < 0.3) {
      const x = boss.x + (game.random() - 0.5) * 140;
      const y = boss.y + (game.random() - 0.5) * 60;
      burst(game, x, y, game.random() < 0.5 ? "#d9a441" : "#b65a50", 10, 1.3);
      ring(game, x, y, 6, "#d9a441", 180);
      game.shake = Math.min(1, game.shake + 0.25);
    }
    if (game.felledFor <= 0) {
      game.enemies = [];
      game.phase = "won";
      onEvent("won");
      return;
    }
  }
  game.elapsed += dt;
  const player = game.player;
  player.invulnerable = Math.max(0, player.invulnerable - dt);
  player.shield = Math.max(0, player.shield - dt);
  player.rapid = Math.max(0, player.rapid - dt);
  player.wide = Math.max(0, player.wide - dt);
  player.power = Math.max(0, player.power - dt);
  player.magnet = Math.max(0, player.magnet - dt);

  if (input.target) {
    // Exponential follow: snappy near the pointer, capped so long jumps still read as flight.
    const dx = input.target.x - player.x;
    const dy = input.target.y - player.y;
    const distance = Math.hypot(dx, dy);
    const step = Math.min(distance * (1 - Math.exp(-24 * dt)), 2400 * dt);
    if (distance > 0.5) {
      player.x += (dx / distance) * step;
      player.y += (dy / distance) * step;
    }
  } else {
    const magnitude = Math.hypot(input.x, input.y) || 1;
    player.x += (input.x / magnitude) * 600 * dt;
    player.y += (input.y / magnitude) * 600 * dt;
  }
  player.x = Math.max(22, Math.min(game.width - 22, player.x));
  player.y = Math.max(game.height * 0.28, Math.min(game.height - 32, player.y));

  game.fireIn -= dt;
  if (input.firing && game.fireIn <= 0 && game.phase !== "felled") {
    game.bullets.push({ x: player.x, y: player.y - 25, vx: 0, vy: -820, hostile: false });
    if (player.wide > 0) {
      game.bullets.push({ x: player.x - 16, y: player.y - 12, vx: 0, vy: -800, hostile: false });
      game.bullets.push({ x: player.x + 16, y: player.y - 12, vx: 0, vy: -800, hostile: false });
    }
    game.fireIn = player.rapid > 0 ? 0.075 : 0.14;
  }

  if (game.phase === "waves") {
    if (game.roundState === "intermission") {
      game.intermissionFor -= dt;
      if (game.intermissionFor <= 0) advanceRound(game, onEvent);
    } else {
      game.roundElapsed += dt;
      game.beatElapsed += dt;
      const beats = ROUND_BEATS[game.wave - 1] ?? [];
      const beat = beats[game.beatIndex];
      if (beat && !game.beatSpawned && game.beatElapsed >= beat.delaySeconds) {
        for (const pattern of beat.patterns) playRoundPattern(game, pattern);
        game.beatSpawned = true;
        game.beatElapsed = 0;
      } else if (beat && game.beatSpawned) {
        const threatsRemain = game.enemies.length > 0 || game.bullets.some((bullet) => bullet.hostile) || game.hazards.length > 0;
        if (game.beatElapsed >= beat.advanceAfterSeconds && !threatsRemain) {
          advanceRoundBeat(game, onEvent);
        } else if (game.beatElapsed >= beat.maxSeconds) {
          clearRoundThreats(game);
          advanceRoundBeat(game, onEvent);
        }
      }
      if (game.roundState === "active" && game.roundElapsed >= (ROUND_SECONDS[game.wave - 1] ?? 0)) beginIntermission(game, onEvent);
    }
    if (game.roundState === "active") {
      game.pickupIn -= dt;
      if (game.pickupIn <= 0) {
        spawnPickup(game);
        game.pickupIn = 5.5;
      }
    }
  }
  if (game.phase === "boss") updateBoss(game, dt, onEvent);

  for (const enemy of game.enemies) {
    enemy.age += dt;
    enemy.flash = Math.max(0, enemy.flash - dt);
    if (enemy.kind === "boss") {
      enemy.y = Math.min(96, enemy.y + enemy.vy * dt);
      enemy.x = game.width / 2 + Math.sin(enemy.age * 0.62) * Math.min(game.width * 0.26, 150);
    } else {
      enemy.y += enemy.vy * dt;
      if (enemy.kind === "interceptor" && enemy.laneX !== undefined) {
        const distanceToLane = enemy.laneX - enemy.x;
        enemy.x += Math.sign(distanceToLane) * Math.min(Math.abs(distanceToLane), 220 * dt);
      } else {
        enemy.x = Math.max(enemy.radius, Math.min(game.width - enemy.radius, enemy.x + Math.sin(enemy.age * 2) * enemy.drift * dt));
      }
    }
    if (game.phase !== "felled" && enemy.kind !== "asteroid" && enemy.kind !== "boss" && enemy.y > 40 && enemy.y < game.height * 0.72) {
      if (enemy.warningFor > 0) {
        if (enemy.kind === "ship") enemy.targetX = enemy.x;
        enemy.warningFor = Math.max(0, enemy.warningFor - dt);
        if (enemy.warningFor === 0) fireEnemyAttack(game, enemy);
      } else {
        enemy.shot -= dt;
        if (enemy.shot <= 0) {
          enemy.targetX = enemy.kind === "ship" ? enemy.x : game.player.x;
          enemy.warningFor = enemy.kind === "interceptor" ? 0.9 : 0.72;
        }
      }
    }
    const bossIsHarmless = enemy.kind === "boss" && (
      game.bossFight?.mode === "intro" || game.bossFight?.mode === "telegraph" || game.bossFight?.mode === "transition"
    );
    if (game.phase !== "felled" && !bossIsHarmless && player.invulnerable <= 0 && intersects(enemy.x, enemy.y, player.x, player.y, enemy.radius + 13)) {
      damagePlayer(game, onEvent);
    }
  }

  for (const bullet of game.bullets) {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    if (bullet.hostile) {
      if (player.invulnerable <= 0 && intersects(bullet.x, bullet.y, player.x, player.y, 15)) {
        bullet.y = game.height + 100;
        damagePlayer(game, onEvent);
      }
      continue;
    }
    for (const enemy of game.enemies) {
      if (enemy.hp > 0 && intersects(bullet.x, bullet.y, enemy.x, enemy.y, enemy.radius + 5)) {
        bullet.y = -100;
        damageEnemy(game, enemy, player.power > 0 ? 2 : 1, onEvent);
        break;
      }
    }
  }
  game.enemies.push(...game.spawned);
  game.spawned = [];

  for (const hazard of game.hazards) {
    hazard.age += dt;
    if (hazard.kind === "debris-gate") {
      hazard.y += hazard.velocity * dt;
      const min = hazard.x + hazard.gapWidth / 2;
      const max = hazard.x + hazard.width - hazard.gapWidth / 2;
      hazard.gapX = Math.max(min, Math.min(max, hazard.gapX + Math.sin(hazard.age * 1.4) * hazard.drift * dt));
    }
    if (hazard.warningFor > 0) hazard.warningFor = Math.max(0, hazard.warningFor - dt);
    else hazard.activeFor -= dt;
    if (hazard.warningFor <= 0 && hazard.activeFor > 0 && player.invulnerable <= 0) {
      const hitsRail = hazard.kind === "rail-pulse" && Math.abs(player.x - hazard.x) < hazard.width / 2 + 12;
      const inGateBand = hazard.kind === "debris-gate" && Math.abs(player.y - hazard.y) < hazard.height / 2 + 12;
      const overlapsGatePanels = player.x + 12 > hazard.x && player.x - 12 < hazard.x + hazard.width;
      const hitsGate = inGateBand && overlapsGatePanels && Math.abs(player.x - hazard.gapX) > hazard.gapWidth / 2 - 12;
      if (hitsRail || hitsGate) damagePlayer(game, onEvent);
    }
  }
  game.hazards = game.hazards.filter((hazard) => hazard.activeFor > 0 && (hazard.kind !== "debris-gate" || hazard.y < game.height + hazard.height));

  for (const pickup of game.pickups) {
    pickup.y += 82 * dt;
    if (player.magnet > 0) {
      const pull = Math.min(1, 5 * dt);
      pickup.x += (player.x - pickup.x) * pull;
      pickup.y += (player.y - pickup.y) * pull;
    }
    if (intersects(pickup.x, pickup.y, player.x, player.y, pickup.kind === "project" ? 38 : 29)) {
      pickup.y = game.height + 100;
      game.score += pickup.kind === "project" ? 150 : 75;
      if (pickup.kind !== "project") applyUpgrade(game, pickup.kind, onEvent);
      burst(game, player.x, player.y, "#bc893b", 14);
      ring(game, player.x, player.y, 12, "#d9a441", 200);
      popup(game, player.x, player.y - 34, pickup.kind === "project" ? pickup.label : pickup.kind.toUpperCase());
      onEvent("pickup");
    }
  }

  for (const particle of game.particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.life -= dt;
  }
  game.particles = game.particles.filter((particle) => particle.life > 0);
  for (const wave of game.rings) {
    wave.radius += wave.grow * dt;
    wave.life -= dt;
  }
  game.rings = game.rings.filter((wave) => wave.life > 0);
  for (const label of game.popups) {
    label.y -= 40 * dt;
    label.life -= dt;
  }
  game.popups = game.popups.filter((label) => label.life > 0);
  game.enemies = game.enemies.filter((enemy) => (enemy.hp > 0 || (enemy.kind === "boss" && game.phase === "felled")) && (enemy.kind === "boss" || enemy.y < game.height + 70));
  game.bullets = game.bullets.filter((bullet) => bullet.y > -20 && bullet.y < game.height + 20 && bullet.x > -20 && bullet.x < game.width + 20);
  game.pickups = game.pickups.filter((pickup) => pickup.y < game.height + 70);
}

function damagePlayer(game: Game, onEvent: (event: GameEvent) => void) {
  const player = game.player;
  player.invulnerable = 1.6;
  if (player.shield > 0) {
    player.shield = 0;
  } else {
    game.health -= 1;
  }
  burst(game, player.x, player.y, "#b65a50", 12);
  onEvent("hit");
  if (game.health <= 0) {
    game.phase = "lost";
    onEvent("lost");
  }
}

function applyUpgrade(game: Game, upgrade: Upgrade, onEvent: (event: GameEvent) => void) {
  if (upgrade === "repair") {
    game.health = Math.min(3, game.health + 1);
  } else if (upgrade === "nova") {
    // Clears the sky around the jet; the final craft only takes a heavy hit.
    ring(game, game.player.x, game.player.y, 20, "#d9a441", 900);
    game.shake = 1;
    for (const enemy of game.enemies) {
      if (enemy.hp > 0) damageEnemy(game, enemy, enemy.kind === "boss" ? 12 : 99, onEvent);
    }
    game.bullets = game.bullets.filter((bullet) => !bullet.hostile);
  } else {
    game.player[upgrade] = 9;
  }
}

function beginIntermission(game: Game, onEvent: (event: GameEvent) => void) {
  game.roundState = "intermission";
  game.intermissionFor = INTERMISSION_SECONDS;
  game.enemies = [];
  game.bullets = [];
  game.hazards = [];
  const project = game.content.projects[game.wave % Math.max(1, game.content.projects.length)];
  const kind: Pickup["kind"] = game.health < 3 ? "repair" : project ? "project" : "shield";
  game.pickups.push({
    x: Math.max(36, Math.min(game.width - 36, game.player.x + (game.random() - 0.5) * game.width * 0.32)),
    y: Math.max(72, game.player.y - 110),
    kind,
    label: kind === "project" ? project.title : game.content.skills[game.wave % Math.max(1, game.content.skills.length)] ?? "Upgrade",
    image: kind === "project" ? project.image : undefined,
  });
  onEvent("intermission");
}

function advanceRound(game: Game, onEvent: (event: GameEvent) => void) {
  if (game.wave < ROUND_SECONDS.length) {
    game.wave += 1;
    game.roundElapsed = 0;
    game.beatIndex = 0;
    game.beatElapsed = 0;
    game.beatSpawned = false;
    game.roundState = "active";
    onEvent("wave");
    return;
  }

  game.wave = 4;
  game.roundState = "boss";
  game.phase = "boss";
  game.enemies = [];
  game.bullets = [];
  game.hazards = [];
  game.enemies.push({
    kind: "boss", x: game.width / 2, y: -65, radius: 48, hp: BOSS_HP, vy: 120,
    drift: 0, age: 0, shot: 0, flash: 0, warningFor: 0, targetX: game.player.x,
  });
  game.bossFight = {
    phase: 1, mode: "intro", timer: 1.5, attacksInPhase: 0, sequenceStep: 0, coreOpen: false,
    thresholdHit: false, counterWindowSeen: false, attackX: game.player.x, followupFired: false, followupWarning: 0,
  };
  onEvent("wave");
}

function fireEnemyAttack(game: Game, enemy: Enemy) {
  const x = enemy.x;
  const y = enemy.y + enemy.radius;
  if (enemy.kind === "interceptor") {
    const vector = aimedShotVector(x, y, enemy.targetX, game.player.y, 270);
    game.bullets.push({ x, y, ...vector, hostile: true });
    enemy.shot = 2.8;
    return;
  }
  if (enemy.kind === "alien") {
    for (const vx of [-70, 0, 70]) game.bullets.push({ x, y, vx, vy: 245, hostile: true });
    enemy.shot = 2.8;
    return;
  }
  game.bullets.push({ x, y, vx: 0, vy: 220, hostile: true });
  enemy.shot = 2.2;
}

function bossThreshold(phase: BossPhase) {
  return phase === 1 ? BOSS_HP * (2 / 3) : phase === 2 ? BOSS_HP / 3 : 0;
}

function beginBossTelegraph(game: Game) {
  const fight = game.bossFight;
  if (!fight) return;
  fight.mode = "telegraph";
  fight.coreOpen = false;
  fight.timer = fight.phase === 3 ? 1.5 : 1.15;
  fight.attackX = Math.max(30, Math.min(game.width - 30, game.player.x));
  fight.followupFired = false;
  fight.followupWarning = 0;
}

export function aimedShotVector(originX: number, originY: number, targetX: number, targetY: number, speed = 260) {
  const dx = targetX - originX;
  const dy = Math.max(1, targetY - originY);
  const distance = Math.hypot(dx, dy);
  return { vx: (dx / distance) * speed, vy: (dy / distance) * speed };
}

export function bossFanVectors(
  originX: number,
  originY: number,
  targetX: number,
  targetY: number,
  speed = BOSS_FAN_SPEED,
  spread = BOSS_FAN_SPREAD,
) {
  const center = Math.atan2(targetX - originX, targetY - originY);
  return [-spread, 0, spread].map((offset) => {
    const angle = center + offset;
    return { vx: Math.sin(angle) * speed, vy: Math.cos(angle) * speed };
  });
}

function fireBossFan(game: Game, boss: Enemy, targetX: number, speed = BOSS_FAN_SPEED, spread = BOSS_FAN_SPREAD) {
  const x = boss.x;
  const y = boss.y + boss.radius * 0.65;
  const vectors = bossFanVectors(x, y, targetX, game.player.y, speed, spread);
  let flightTime = 0;
  for (const { vx, vy } of vectors) {
    game.bullets.push({ x, y, vx, vy, hostile: true });
    if (vy > 0) flightTime = Math.max(flightTime, (game.player.y + 16 - y) / vy);
  }
  return flightTime;
}

function bossAimedBullet(game: Game, boss: Enemy, targetX: number) {
  const x = boss.x;
  const y = boss.y + boss.radius * 0.65;
  const speed = 260;
  const vector = aimedShotVector(x, y, targetX, game.player.y, speed);
  game.bullets.push({ x, y, ...vector, hostile: true });
  return (game.player.y + 16 - y) / vector.vy;
}

function fireBossAttack(game: Game) {
  const fight = game.bossFight;
  const boss = game.enemies.find((enemy) => enemy.kind === "boss");
  if (!fight || !boss) return;
  fight.mode = "attack";
  if (fight.phase === 1) {
    if (fight.sequenceStep === 0) {
      fight.sequenceStep = 1;
      fight.timer = fireBossFan(game, boss, fight.attackX, BOSS_OPENING_SPEED, BOSS_OPENING_SPREAD) + BOSS_ATTACK_CLEARANCE;
    } else {
      fight.sequenceStep = 0;
      fight.attacksInPhase += 1;
      fight.timer = fireBossFan(game, boss, fight.attackX) + BOSS_ATTACK_CLEARANCE;
    }
  } else if (fight.phase === 2) {
    fight.attacksInPhase += 1;
    const width = Math.max(44, Math.min(62, game.width * 0.16));
    game.hazards.push({ kind: "rail-pulse", x: fight.attackX, y: 0, width, height: game.height, gapX: 0, gapWidth: 0, age: 0, warningFor: 0.12, activeFor: 0.82, velocity: 0, drift: 0 });
    fight.timer = BOSS_PHASE_TWO_ATTACK_SECONDS;
  } else {
    fight.attacksInPhase += 1;
    const left = game.width * 0.12;
    const width = game.width - left * 2;
    game.hazards.push({
      kind: "debris-gate", x: left, y: game.player.y - 560, width, height: 22,
      gapX: left + width * (0.3 + game.random() * 0.4),
      gapWidth: Math.max(92, Math.min(138, width * 0.32)),
      age: 0, warningFor: 3.2, activeFor: 12, velocity: BOSS_GATE_SPEED, drift: game.random() < 0.5 ? -42 : 42,
    });
    fight.timer = 8;
  }
}

function updateBoss(game: Game, dt: number, onEvent: (event: GameEvent) => void) {
  const fight = game.bossFight;
  if (!fight || game.phase !== "boss") return;
  fight.timer -= dt;
  if (fight.mode === "intro") {
    if (fight.timer <= 0) beginBossTelegraph(game);
    return;
  }
  if (fight.mode === "telegraph") {
    if (fight.timer <= 0) fireBossAttack(game);
    return;
  }
  if (fight.mode === "attack") {
    if (fight.phase === 2 && !fight.followupFired) {
      if (fight.followupWarning > 0) {
        fight.followupWarning = Math.max(0, fight.followupWarning - dt);
        if (fight.followupWarning === 0) {
          const boss = game.enemies.find((enemy) => enemy.kind === "boss");
          if (boss) {
            const travelTime = bossAimedBullet(game, boss, fight.attackX);
            fight.timer = Math.max(fight.timer, travelTime + BOSS_ATTACK_CLEARANCE);
          }
          fight.followupFired = true;
        }
      } else if (fight.timer <= BOSS_PHASE_TWO_WARNING_REMAINING) {
        fight.followupWarning = BOSS_PHASE_TWO_WARNING_SECONDS;
      }
    }
    if (fight.phase === 3 && !fight.followupFired) {
      if (fight.followupWarning > 0) {
        fight.followupWarning = Math.max(0, fight.followupWarning - dt);
        if (fight.followupWarning === 0) {
          const boss = game.enemies.find((enemy) => enemy.kind === "boss");
          if (boss) {
            const travelTime = fireBossFan(game, boss, fight.attackX);
            fight.timer = Math.max(fight.timer, travelTime + BOSS_ATTACK_CLEARANCE);
          }
          fight.followupFired = true;
        }
      } else {
        const gate = game.hazards.find((hazard) => hazard.kind === "debris-gate");
        if (gate) {
          const secondsUntilGateClears = Math.max(0, (game.height + gate.height - gate.y) / Math.max(1, gate.velocity));
          fight.timer = Math.max(fight.timer, secondsUntilGateClears + BOSS_PHASE_THREE_WARNING_SECONDS + BOSS_ATTACK_CLEARANCE);
        } else {
          fight.attackX = game.player.x;
          fight.followupWarning = BOSS_PHASE_THREE_WARNING_SECONDS;
          fight.timer = Math.max(fight.timer, fight.followupWarning + BOSS_ATTACK_CLEARANCE);
        }
      }
    }
    if (fight.timer <= 0) {
      if (fight.phase === 1 && fight.sequenceStep === 1) {
        fight.mode = "telegraph";
        fight.timer = 1.15;
        fight.attackX = Math.max(30, Math.min(game.width - 30, game.player.x));
        game.bullets = game.bullets.filter((bullet) => !bullet.hostile);
        return;
      }
      fight.mode = "recovery";
      fight.timer = BOSS_RECOVERY_SECONDS;
      fight.coreOpen = true;
      fight.counterWindowSeen = true;
      game.bullets = game.bullets.filter((bullet) => !bullet.hostile);
    }
    return;
  }
  if (fight.mode === "recovery") {
    if (fight.timer <= 0) {
      fight.coreOpen = false;
      if (fight.phase < 3 && fight.thresholdHit && fight.counterWindowSeen) {
        fight.mode = "transition";
        fight.timer = 1.4;
        game.bullets = [];
        game.hazards = [];
      } else {
        beginBossTelegraph(game);
      }
    }
    return;
  }
  if (fight.mode === "transition" && fight.timer <= 0) {
    if (fight.phase < 3) fight.phase = (fight.phase + 1) as BossPhase;
    fight.mode = "telegraph";
    fight.timer = fight.phase === 3 ? 1.5 : 1.15;
    fight.attacksInPhase = 0;
    fight.sequenceStep = 0;
    fight.thresholdHit = false;
    fight.counterWindowSeen = false;
    fight.coreOpen = false;
    fight.attackX = Math.max(30, Math.min(game.width - 30, game.player.x));
    fight.followupFired = false;
    fight.followupWarning = 0;
    onEvent("boss-phase");
  }
}

function damageEnemy(game: Game, enemy: Enemy, damage: number, onEvent: (event: GameEvent) => void) {
  const boss = enemy.kind === "boss";
  if (boss) {
    const fight = game.bossFight;
    if (!fight || fight.mode === "intro" || fight.mode === "transition") return;
    const threshold = bossThreshold(fight.phase);
    const appliedDamage = fight.coreOpen ? damage * 2 : damage >= 10 ? damage : damage * 0.22;
    const nextHp = enemy.hp - appliedDamage;
    if (fight.phase < 3 && nextHp <= threshold) {
      enemy.hp = threshold;
      fight.thresholdHit = true;
    } else if (fight.phase === 3 && nextHp <= 0 && !fight.counterWindowSeen) {
      enemy.hp = 1;
      fight.thresholdHit = true;
    } else {
      enemy.hp = nextHp;
    }
  } else {
    enemy.hp -= damage;
  }
  enemy.flash = 0.09;
  enemy.y -= enemy.kind === "boss" ? 1 : 5;
  burst(game, enemy.x, enemy.y + enemy.radius * 0.6, "#d9a441", 3, 0.5);
  if (enemy.hp > 0) return;

  game.combo += 1;
  game.comboFor = 2.2;
  const multiplier = boss ? 1 : Math.min(3, 1 + Math.floor(game.combo / 5) * 0.5);
  const points = Math.round((boss ? 1000 : enemy.kind === "asteroid" ? 50 : enemy.kind === "alien" ? 150 : 100) * multiplier);
  game.score += points;
  popup(game, enemy.x, enemy.y, multiplier > 1 ? `+${points} ×${multiplier}` : `+${points}`);
  burst(game, enemy.x, enemy.y, "#b65a50", boss ? 40 : 14, boss ? 1.6 : 1);
  burst(game, enemy.x, enemy.y, "#d9a441", boss ? 30 : 8, boss ? 1.4 : 0.8);
  ring(game, enemy.x, enemy.y, enemy.radius * 0.6, boss ? "#d9a441" : "#b65a50", boss ? 420 : 240);
  game.shake = Math.min(1, game.shake + (boss ? 1 : enemy.kind === "asteroid" ? 0.18 : 0.28));
  onEvent("destroy");

  if (enemy.kind === "asteroid" && enemy.radius > 22) {
    // Large rocks shatter into two fast fragments.
    for (const side of [-1, 1]) {
      const drift = enemy.safeGapX === undefined ? side * 140 : enemy.x < enemy.safeGapX ? -140 : 140;
      game.spawned.push({ ...enemy, radius: 12, hp: 1, x: enemy.x + side * 10, drift, vy: enemy.vy * 1.2, age: 0, flash: 0 });
    }
  }
  if (!boss && game.random() < 0.12) {
    const kind = UPGRADES[Math.floor(game.random() * UPGRADES.length)];
    game.pickups.push({ x: enemy.x, y: enemy.y, kind, label: game.content.skills[Math.floor(game.random() * game.content.skills.length)] ?? "Upgrade" });
  }
  if (boss) {
    if (game.bossFight) game.bossFight.coreOpen = false;
    enemy.hp = 0;
    game.phase = "felled";
    game.felledFor = FELLED_SECONDS;
    game.bullets = [];
    game.hazards = [];
    onEvent("felled");
  }
}
