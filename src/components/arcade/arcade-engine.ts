export type ArcadeContent = {
  projects: { title: string; image: string }[];
  skills: string[];
  experience: string[];
  education: string[];
};

type EnemyKind = "asteroid" | "ship" | "alien" | "boss";
type Upgrade = "shield" | "rapid" | "wide";

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
};

type Bullet = { x: number; y: number; vy: number; hostile: boolean };
type Pickup = {
  x: number;
  y: number;
  kind: "project" | Upgrade;
  label: string;
  image?: string;
};
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string };

export type GameEvent = "hit" | "pickup" | "destroy" | "won" | "lost" | "wave";
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
  phase: "waves" | "boss" | "won" | "lost";
  score: number;
  health: number;
  player: { x: number; y: number; invulnerable: number; shield: number; rapid: number; wide: number };
  enemies: Enemy[];
  bullets: Bullet[];
  pickups: Pickup[];
  particles: Particle[];
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
    player: { x: width / 2, y: height * 0.78, invulnerable: 0, shield: 0, rapid: 0, wide: 0 },
    enemies: [],
    bullets: [],
    pickups: [],
    particles: [],
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

function burst(game: Game, x: number, y: number, color: string, count = 8) {
  for (let i = 0; i < count; i++) {
    const angle = game.random() * Math.PI * 2;
    const speed = 40 + game.random() * 130;
    game.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.3 + game.random() * 0.4, color });
  }
  if (game.particles.length > 80) game.particles.splice(0, game.particles.length - 80);
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
  });
}

function spawnPickup(game: Game) {
  const project = Math.floor(game.elapsed / 11) % 2 === 0 && game.content.projects.length > 0;
  const selected = project
    ? game.content.projects[Math.floor(game.elapsed / 11) % game.content.projects.length]
    : null;
  const upgrade: Upgrade = (["shield", "rapid", "wide"] as const)[Math.floor(game.elapsed / 11) % 3];
  game.pickups.push({
    x: 36 + game.random() * Math.max(1, game.width - 72),
    y: -28,
    kind: selected ? "project" : upgrade,
    label: selected?.title ?? game.content.skills[Math.floor(game.elapsed / 11) % game.content.skills.length] ?? "Upgrade",
    image: selected?.image,
  });
}

export function stepGame(game: Game, dt: number, input: GameInput, onEvent: (event: GameEvent) => void) {
  if (game.phase === "won" || game.phase === "lost") return;
  dt = Math.min(0.04, Math.max(0, dt));
  game.elapsed += dt;
  const player = game.player;
  player.invulnerable = Math.max(0, player.invulnerable - dt);
  player.shield = Math.max(0, player.shield - dt);
  player.rapid = Math.max(0, player.rapid - dt);
  player.wide = Math.max(0, player.wide - dt);

  if (input.target) {
    const distance = Math.hypot(input.target.x - player.x, input.target.y - player.y);
    const fraction = Math.min(1, (600 * dt) / Math.max(1, distance));
    player.x += (input.target.x - player.x) * fraction;
    player.y += (input.target.y - player.y) * fraction;
  } else {
    const magnitude = Math.hypot(input.x, input.y) || 1;
    player.x += (input.x / magnitude) * 370 * dt;
    player.y += (input.y / magnitude) * 370 * dt;
  }
  player.x = Math.max(22, Math.min(game.width - 22, player.x));
  player.y = Math.max(game.height * 0.34, Math.min(game.height - 32, player.y));

  game.fireIn -= dt;
  if (input.firing && game.fireIn <= 0) {
    game.bullets.push({ x: player.x, y: player.y - 25, vy: -620, hostile: false });
    if (player.wide > 0) {
      game.bullets.push({ x: player.x - 16, y: player.y - 12, vy: -600, hostile: false });
      game.bullets.push({ x: player.x + 16, y: player.y - 12, vy: -600, hostile: false });
    }
    game.fireIn = player.rapid > 0 ? 0.11 : 0.19;
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
      game.pickupIn = 10;
    }
    if (game.elapsed >= WAVE_SECONDS * TOTAL_WAVES) {
      game.phase = "boss";
      game.wave = 4;
      game.enemies = [{ kind: "boss", x: game.width / 2, y: -65, radius: 48, hp: 28, vy: 38, drift: 0, age: 0, shot: 1.2 }];
      onEvent("wave");
    }
  }

  for (const enemy of game.enemies) {
    enemy.age += dt;
    if (enemy.kind === "boss") {
      enemy.y = Math.min(96, enemy.y + enemy.vy * dt);
      enemy.x = game.width / 2 + Math.sin(enemy.age * 1.35) * Math.max(0, game.width / 2 - 75);
    } else {
      enemy.y += enemy.vy * dt;
      enemy.x = Math.max(enemy.radius, Math.min(game.width - enemy.radius, enemy.x + Math.sin(enemy.age * 2) * enemy.drift * dt));
    }
    if (enemy.kind !== "asteroid" && enemy.y > 40 && enemy.y < game.height * 0.72) {
      enemy.shot -= dt;
      if (enemy.shot <= 0) {
        game.bullets.push({ x: enemy.x, y: enemy.y + enemy.radius, vy: enemy.kind === "boss" ? 290 : 220, hostile: true });
        enemy.shot = enemy.kind === "boss" ? 0.9 : 2.2;
      }
    }
    if (player.invulnerable <= 0 && intersects(enemy.x, enemy.y, player.x, player.y, enemy.radius + 13)) {
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
        enemy.hp -= 1;
        if (enemy.hp <= 0) {
          burst(game, enemy.x, enemy.y, enemy.kind === "boss" ? "#bc893b" : "#b65a50", enemy.kind === "boss" ? 25 : 8);
          game.score += enemy.kind === "boss" ? 1000 : enemy.kind === "asteroid" ? 50 : 100;
          onEvent("destroy");
          if (enemy.kind === "boss") {
            game.phase = "won";
            onEvent("won");
          }
        }
        break;
      }
    }
  }

  for (const pickup of game.pickups) {
    pickup.y += 82 * dt;
    if (intersects(pickup.x, pickup.y, player.x, player.y, pickup.kind === "project" ? 38 : 29)) {
      pickup.y = game.height + 100;
      game.score += pickup.kind === "project" ? 150 : 75;
      if (pickup.kind !== "project") player[pickup.kind] = 9;
      burst(game, player.x, player.y, "#bc893b", 12);
      onEvent("pickup");
    }
  }

  for (const particle of game.particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.life -= dt;
  }
  game.particles = game.particles.filter((particle) => particle.life > 0);
  game.enemies = game.enemies.filter((enemy) => enemy.hp > 0 && (enemy.kind === "boss" || enemy.y < game.height + 70));
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
