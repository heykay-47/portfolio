import { BOSS_HP, type Game } from "./arcade-engine";

export function drawGame(
  ctx: CanvasRenderingContext2D,
  game: Game,
  images: Map<string, HTMLImageElement>,
  dark: boolean,
) {
  const { width: w, height: h, elapsed, player } = game;
  const bg = dark ? "#191919" : "#fafaf9";
  const fg = dark ? "#e9e7e3" : "#292929";
  const line = dark ? "#45413a" : "#ddd9d2";
  const muted = dark ? "#a29c90" : "#77736d";
  const gold = dark ? "#e3b65f" : "#a36c20";
  const red = dark ? "#e18b7c" : "#b84f48";

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  if (game.shake > 0) {
    const amount = game.shake * game.shake * 9;
    ctx.translate((Math.random() - 0.5) * amount, (Math.random() - 0.5) * amount);
  }

  // The homepage's dividers and timeline become the moving playfield rails.
  const left = Math.max(18, w * 0.12);
  const right = w - left;
  ctx.strokeStyle = line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, 0);
  ctx.lineTo(left, h);
  ctx.moveTo(right, 0);
  ctx.lineTo(right, h);
  ctx.stroke();
  for (let y = (elapsed * 90) % 74 - 74; y < h; y += 74) {
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.font = "10px monospace";
  ctx.fillStyle = muted;
  for (let i = 0; i < 4; i++) {
    const y = ((elapsed * 85 + i * 270) % (h + 300)) - 150;
    const label = [...game.content.experience, ...game.content.education, "PROJECTS", "SKILLS"][i % Math.max(1, game.content.experience.length + game.content.education.length + 2)];
    ctx.save();
    ctx.translate(left + 11, y);
    ctx.rotate(-Math.PI / 2);
    ctx.globalAlpha = 0.5;
    ctx.fillText(label?.toUpperCase().slice(0, 32) ?? "PORTFOLIO", 0, 0);
    ctx.restore();
  }

  // Real project screenshots remain recognizable scenery, never targets.
  for (let i = 0; i < game.content.projects.length; i++) {
    const project = game.content.projects[i];
    const y = ((elapsed * 58 + i * 230) % (h + 480)) - 240;
    const cardW = Math.min(154, Math.max(76, w * 0.24));
    const x = i % 2 === 0 ? Math.max(3, left - cardW * 0.64) : Math.min(w - cardW - 3, right - cardW * 0.36);
    ctx.save();
    ctx.globalAlpha = dark ? 0.42 : 0.4;
    ctx.fillStyle = dark ? "#31302d" : "#e7e4de";
    ctx.strokeStyle = line;
    ctx.beginPath();
    ctx.roundRect(x, y, cardW, 94, 9);
    ctx.fill();
    ctx.stroke();
    const image = images.get(project.image);
    if (image?.complete && image.naturalWidth) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x + 4, y + 4, cardW - 8, 63, 5);
      ctx.clip();
      const scale = Math.max((cardW - 8) / image.width, 63 / image.height);
      ctx.drawImage(image, x + 4, y + 4, image.width * scale, image.height * scale);
      ctx.restore();
    }
    ctx.fillStyle = fg;
    ctx.font = "600 10px sans-serif";
    ctx.fillText(project.title.slice(0, 19), x + 7, y + 82, cardW - 14);
    ctx.restore();
  }

  // Small stars reference the header's flickering grid without making another canvas loop.
  ctx.fillStyle = muted;
  for (let i = 0; i < 36; i++) {
    const x = ((i * 89.7) % w);
    const y = ((i * 131.3 + elapsed * (15 + i % 4 * 12)) % h);
    ctx.globalAlpha = 0.15 + (i % 4) * 0.08;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;

  for (const pickup of game.pickups) {
    const isProject = pickup.kind === "project";
    const boxW = isProject ? 72 : 90;
    ctx.fillStyle = bg;
    ctx.strokeStyle = gold;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(pickup.x - boxW / 2, pickup.y - 20, boxW, 40, 9);
    ctx.fill();
    ctx.stroke();
    const image = pickup.image ? images.get(pickup.image) : undefined;
    if (isProject && image?.complete && image.naturalWidth) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(pickup.x - 32, pickup.y - 15, 64, 19, 3);
      ctx.clip();
      ctx.drawImage(image, pickup.x - 32, pickup.y - 15, 64, 28);
      ctx.restore();
    } else {
      ctx.fillStyle = gold;
      ctx.font = "600 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(pickup.kind.toUpperCase(), pickup.x, pickup.y - 3);
    }
    ctx.fillStyle = fg;
    ctx.font = "600 9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(pickup.label.slice(0, 13), pickup.x, pickup.y + 13, boxW - 8);
    ctx.textAlign = "start";
  }

  for (const enemy of game.enemies) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    const felled = enemy.kind === "boss" && enemy.hp <= 0;
    if (felled) ctx.globalAlpha = 0.45 + Math.random() * 0.5;
    // A white-hot frame on every hit makes damage legible at a glance.
    ctx.strokeStyle = enemy.flash > 0 ? fg : red;
    ctx.fillStyle = enemy.flash > 0 || felled ? (dark ? "#fff4dc" : "#ffffff") : dark ? "#4b302e" : "#ebd9d5";
    ctx.lineWidth = 2;
    if (enemy.kind === "asteroid") {
      ctx.rotate(enemy.age * 0.4);
      ctx.beginPath();
      for (let i = 0; i < 9; i++) {
        const angle = (i / 9) * Math.PI * 2;
        const radius = enemy.radius * (i % 3 === 0 ? 0.8 : 1);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-4, 2, 4, 0, Math.PI * 2);
      ctx.stroke();
    } else if (enemy.kind === "ship") {
      ctx.beginPath();
      ctx.moveTo(0, 23);
      ctx.lineTo(-7, 4);
      ctx.lineTo(-21, -8);
      ctx.lineTo(-18, -15);
      ctx.lineTo(0, -5);
      ctx.lineTo(18, -15);
      ctx.lineTo(21, -8);
      ctx.lineTo(7, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      const scale = enemy.kind === "boss" ? 2.1 : 1;
      ctx.scale(scale, scale);
      ctx.beginPath();
      ctx.ellipse(0, 4, 25, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 1, 10, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = gold;
      for (const x of [-13, 0, 13]) ctx.fillRect(x - 2, 5, 4, 2);
    }
    ctx.restore();
    if (enemy.kind === "boss" && enemy.hp > 0) {
      ctx.fillStyle = line;
      ctx.fillRect(w / 2 - Math.min(w * 0.27, 155), 25, Math.min(w * 0.54, 310), 3);
      ctx.fillStyle = red;
      ctx.fillRect(w / 2 - Math.min(w * 0.27, 155), 25, Math.min(w * 0.54, 310) * Math.max(0, enemy.hp / BOSS_HP), 3);
    }
  }

  const heavy = player.power > 0;
  for (const bullet of game.bullets) {
    ctx.fillStyle = bullet.hostile ? red : gold;
    if (bullet.hostile) ctx.fillRect(bullet.x - 3, bullet.y - 8, 6, 13);
    else ctx.fillRect(bullet.x - (heavy ? 3.5 : 2), bullet.y - 10, heavy ? 7 : 4, heavy ? 18 : 14);
  }
  for (const particle of game.particles) {
    ctx.globalAlpha = Math.min(1, particle.life * 2);
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
  }
  for (const wave of game.rings) {
    ctx.globalAlpha = Math.min(1, wave.life * 2.2);
    ctx.strokeStyle = wave.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.textAlign = "center";
  ctx.font = "700 12px monospace";
  for (const label of game.popups) {
    ctx.globalAlpha = Math.min(1, label.life * 2);
    ctx.fillStyle = gold;
    ctx.fillText(label.text.slice(0, 22), label.x, label.y);
  }
  ctx.textAlign = "start";
  ctx.globalAlpha = 1;

  ctx.save();
  const playerAlpha = player.invulnerable > 0 ? 0.55 + Math.sin(elapsed * 18) * 0.15 : 1;
  ctx.globalAlpha = playerAlpha;
  ctx.translate(player.x, player.y);
  if (player.magnet > 0) {
    ctx.strokeStyle = gold;
    ctx.globalAlpha = 0.25;
    ctx.setLineDash([3, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, 44 + Math.sin(elapsed * 6) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = playerAlpha;
  }
  if (player.shield > 0) {
    ctx.strokeStyle = gold;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(0, 0, 27, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = playerAlpha;
  }
  // The silhouette is deliberately broad enough to read as a jet on a phone.
  ctx.fillStyle = fg;
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -27);
  ctx.lineTo(6, -9);
  ctx.lineTo(22, 6);
  ctx.lineTo(22, 13);
  ctx.lineTo(6, 9);
  ctx.lineTo(5, 20);
  ctx.lineTo(-5, 20);
  ctx.lineTo(-6, 9);
  ctx.lineTo(-22, 13);
  ctx.lineTo(-22, 6);
  ctx.lineTo(-6, -9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = gold;
  ctx.fillRect(-2, -14, 4, 13);
  ctx.globalAlpha = 0.55 + Math.sin(elapsed * 24) * 0.2;
  ctx.fillRect(-3, 21, 6, 12);
  ctx.restore();
  ctx.restore();
}
