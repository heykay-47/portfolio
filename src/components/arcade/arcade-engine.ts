export type ArcadeContent = {
  projects: { title: string; image: string }[];
  skills: string[];
  experience: string[];
  education: string[];
};

type EnemyKind = "asteroid" | "ship" | "alien" | "boss";
export type Upgrade = "shield" | "rapid" | "wide" | "power" | "magnet" | "repair" | "nova";
const UPGRADES: Upgrade[] = ["shield", "rapid", "wide", "power", "magnet", "repair", "nova"];
export const BOSS_HP = 16;
const FELLED_SECONDS = 4.2;

type Enemy = {
  kind: EnemyKind;
  x: number;
  y: number;
  radius: number;
  hp: number;
  vy: number;
  drift: number;
  age: number;
  shot: number;
  flash: number;
};

type Bullet = { x: number; y: number; vy: number; hostile: boolean };
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

export type GameEvent = "hit" | "pickup" | "destroy" | "won" | "lost" | "wave" | "felled";
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
  phase: "waves" | "boss" | "felled" | "won" | "lost";
  score: number;
  health: number;
  player: { x: number; y: number; invulnerable: number; shield: number; rapid: number; wide: number; power: number; magnet: number };
  enemies: Enemy[];
  bullets: Bullet[];
  pickups: Pickup[];
  particles: Particle[];
  rings: Ring[];
  popups: Popup[];
  shake: number;
  combo: number;
  comboFor: number;
  felledFor: number;
  spawned: Enemy[];
  spawnIn: number;
  pickupIn: number;
  fireIn: number;
  content: ArcadeContent;
  random: () => number;
};

const WAVE_SECONDS = 18;
const TOTAL_WAVES = 3;
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
    phase: "waves",
    score: 0,
    health: 3,
    player: { x: width / 2, y: height * 0.78, invulnerable: 0, shield: 0, rapid: 0, wide: 0, power: 0, magnet: 0 },
    enemies: [],
    bullets: [],
    pickups: [],
    particles: [],
    rings: [],
    popups: [],
    shake: 0,
    combo: 0,
    comboFor: 0,
    felledFor: 0,
    spawned: [],
    spawnIn: 1.2,
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
  }
  for (const pickup of game.pickups) {
    pickup.x = (pickup.x / oldWidth) * width;
    pickup.y = (pickup.y / oldHeight) * height;
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

function spawnEnemy(game: Game) {
  const kind: EnemyKind = game.wave === 1
    ? (game.random() < 0.65 ? "asteroid" : "ship")
    : game.wave === 2
      ? (game.random() < 0.45 ? "asteroid" : "ship")
      : (game.random() < 0.55 ? "alien" : "ship");
  const radius = kind === "asteroid" ? 18 + game.random() * 10 : 20;
  game.enemies.push({
    kind,
    x: radius + game.random() * Math.max(1, game.width - radius * 2),
    y: -radius,
    radius,
    hp: kind === "asteroid" ? 2 : kind === "alien" ? 3 : 2,
    vy: 85 + game.wave * 22 + game.random() * 55,
    drift: (game.random() - 0.5) * 50,
    age: 0,
    shot: 1.5 + game.random() * 2,
    flash: 0,
  });
}

function spawnPickup(game: Game) {
  const project = Math.floor(game.elapsed / 5.5) % 3 === 0 && game.content.projects.length > 0;
  const selected = project
    ? game.content.projects[Math.floor(game.elapsed / 16.5) % game.content.projects.length]
    : null;
  const upgrade = UPGRADES[Math.floor(game.elapsed / 5.5) % UPGRADES.length];
  game.pickups.push({
    x: 36 + game.random() * Math.max(1, game.width - 72),
    y: -28,
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
    game.bullets.push({ x: player.x, y: player.y - 25, vy: -820, hostile: false });
    if (player.wide > 0) {
      game.bullets.push({ x: player.x - 16, y: player.y - 12, vy: -800, hostile: false });
      game.bullets.push({ x: player.x + 16, y: player.y - 12, vy: -800, hostile: false });
    }
    game.fireIn = player.rapid > 0 ? 0.075 : 0.14;
  }

  if (game.phase === "waves") {
    const nextWave = Math.min(TOTAL_WAVES, Math.floor(game.elapsed / WAVE_SECONDS) + 1);
    if (nextWave !== game.wave) {
      game.wave = nextWave;
      onEvent("wave");
    }
    game.spawnIn -= dt;
    if (game.spawnIn <= 0 && game.enemies.length < 12) {
      spawnEnemy(game);
      game.spawnIn = 1.25 - game.wave * 0.12 + game.random() * 0.5;
    }
    game.pickupIn -= dt;
    if (game.pickupIn <= 0) {
      spawnPickup(game);
      game.pickupIn = 5.5;
    }
    if (game.elapsed >= WAVE_SECONDS * TOTAL_WAVES) {
      game.phase = "boss";
      game.wave = 4;
      game.enemies = [{ kind: "boss", x: game.width / 2, y: -65, radius: 48, hp: BOSS_HP, vy: 60, drift: 0, age: 0, shot: 1.2, flash: 0 }];
      onEvent("wave");
    }
  }

  for (const enemy of game.enemies) {
    enemy.age += dt;
    enemy.flash = Math.max(0, enemy.flash - dt);
    if (enemy.kind === "boss") {
      enemy.y = Math.min(96, enemy.y + enemy.vy * dt);
      enemy.x = game.width / 2 + Math.sin(enemy.age * 1.35) * Math.max(0, game.width / 2 - 75);
    } else {
      enemy.y += enemy.vy * dt;
      enemy.x = Math.max(enemy.radius, Math.min(game.width - enemy.radius, enemy.x + Math.sin(enemy.age * 2) * enemy.drift * dt));
    }
    if (game.phase !== "felled" && enemy.kind !== "asteroid" && enemy.y > 40 && enemy.y < game.height * 0.72) {
      enemy.shot -= dt;
      if (enemy.shot <= 0) {
        game.bullets.push({ x: enemy.x, y: enemy.y + enemy.radius, vy: enemy.kind === "boss" ? 290 : 220, hostile: true });
        enemy.shot = enemy.kind === "boss" ? 0.9 : 2.2;
      }
    }
    if (game.phase !== "felled" && player.invulnerable <= 0 && intersects(enemy.x, enemy.y, player.x, player.y, enemy.radius + 13)) {
      damagePlayer(game, onEvent);
    }
  }

  for (const bullet of game.bullets) {
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
  game.bullets = game.bullets.filter((bullet) => bullet.y > -20 && bullet.y < game.height + 20);
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
      if (enemy.hp > 0) damageEnemy(game, enemy, enemy.kind === "boss" ? 3 : 99, onEvent);
    }
    game.bullets = game.bullets.filter((bullet) => !bullet.hostile);
  } else {
    game.player[upgrade] = 9;
  }
}

function damageEnemy(game: Game, enemy: Enemy, damage: number, onEvent: (event: GameEvent) => void) {
  enemy.hp -= damage;
  enemy.flash = 0.09;
  enemy.y -= enemy.kind === "boss" ? 1 : 5;
  burst(game, enemy.x, enemy.y + enemy.radius * 0.6, "#d9a441", 3, 0.5);
  if (enemy.hp > 0) return;

  const boss = enemy.kind === "boss";
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
      game.spawned.push({ ...enemy, radius: 12, hp: 1, x: enemy.x + side * 10, drift: side * 140, vy: enemy.vy * 1.2, age: 0, flash: 0 });
    }
  }
  if (!boss && game.random() < 0.12) {
    const kind = UPGRADES[Math.floor(game.random() * UPGRADES.length)];
    game.pickups.push({ x: enemy.x, y: enemy.y, kind, label: game.content.skills[Math.floor(game.random() * game.content.skills.length)] ?? "Upgrade" });
  }
  if (boss) {
    enemy.hp = 0;
    game.phase = "felled";
    game.felledFor = FELLED_SECONDS;
    game.bullets = [];
    onEvent("felled");
  }
}
