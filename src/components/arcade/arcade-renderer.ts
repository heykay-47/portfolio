import { aimedShotVector, BOSS_HP, bossFanVectors, type Game } from "./arcade-engine";

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

  for (const hazard of game.hazards) {
    const warning = hazard.warningFor > 0;
    ctx.save();
    ctx.lineWidth = warning ? 2 : 1;
    ctx.strokeStyle = warning ? gold : red;
    ctx.fillStyle = warning ? `${gold}24` : `${red}38`;
    ctx.setLineDash(warning ? [7, 6] : []);
    if (hazard.kind === "rail-pulse") {
      const x = hazard.x - hazard.width / 2;
      ctx.fillRect(x, 0, hazard.width, h);
      ctx.strokeRect(x, 0, hazard.width, h);
      ctx.setLineDash([]);
      ctx.textAlign = "center";
      ctx.font = "700 10px monospace";
      ctx.fillStyle = warning ? gold : red;
      ctx.fillText(warning ? "RAIL CHARGING" : "RAIL ACTIVE", hazard.x, Math.max(92, h * 0.2));
      ctx.textAlign = "start";
    } else {
      const gapLeft = hazard.gapX - hazard.gapWidth / 2;
      const gapRight = hazard.gapX + hazard.gapWidth / 2;
      const panelRight = hazard.x + hazard.width;
      for (const [start, end] of [[hazard.x, gapLeft], [gapRight, panelRight]]) {
        const panelWidth = Math.max(0, end - start);
        if (warning) ctx.strokeRect(start, hazard.y - hazard.height / 2, panelWidth, hazard.height);
        else ctx.fillRect(start, hazard.y - hazard.height / 2, panelWidth, hazard.height);
        ctx.beginPath();
        ctx.moveTo(start, hazard.y - hazard.height / 2);
        ctx.lineTo(end, hazard.y + hazard.height / 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(hazard.gapX, hazard.y - hazard.height * 0.9);
      ctx.lineTo(hazard.gapX, hazard.y + hazard.height * 0.9);
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.font = "700 9px monospace";
      ctx.fillStyle = warning ? gold : red;
      ctx.fillText(warning ? "GAP MOVING" : "SAFE GAP", hazard.gapX, hazard.y - hazard.height);
      ctx.textAlign = "start";
    }
    ctx.restore();
  }

  for (const enemy of game.enemies) {
    if (enemy.kind === "interceptor" && enemy.laneX !== undefined && Math.abs(enemy.laneX - enemy.x) > 4) {
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = gold;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 6]);
      ctx.beginPath();
      ctx.moveTo(enemy.laneX, Math.max(0, enemy.y - 90));
      ctx.lineTo(enemy.laneX, enemy.y + 90);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(enemy.laneX, enemy.y + 50, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (enemy.warningFor > 0 && enemy.kind !== "boss") {
      ctx.save();
      ctx.strokeStyle = gold;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 6]);
      const originY = enemy.y + enemy.radius;
      const targetY = player.y;
      const fall = Math.max(0, targetY - originY);
      const targets = enemy.kind === "alien"
        ? [-70, 0, 70].map((vx) => enemy.x + vx * (fall / 245))
        : [enemy.targetX];
      ctx.setLineDash([]);
      for (const targetX of targets) {
        ctx.setLineDash([5, 6]);
        ctx.beginPath();
        ctx.moveTo(enemy.x, originY);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(targetX, targetY, 7, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
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
    } else if (enemy.kind === "interceptor") {
      ctx.beginPath();
      ctx.moveTo(0, 23);
      ctx.lineTo(-18, -4);
      ctx.lineTo(-11, -13);
      ctx.lineTo(0, -7);
      ctx.lineTo(11, -13);
      ctx.lineTo(18, -4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-11, -13);
      ctx.lineTo(0, -20);
      ctx.lineTo(11, -13);
      ctx.stroke();
    } else {
      const scale = enemy.kind === "boss" ? 2.1 : 1;
      ctx.scale(scale, scale);
      if (enemy.kind === "boss" && game.bossFight?.phase === 1 && game.bossFight.mode === "telegraph" && game.bossFight.sequenceStep === 1) {
        ctx.strokeStyle = gold;
        ctx.fillStyle = `${gold}24`;
        ctx.beginPath();
        ctx.moveTo(-16, 1);
        ctx.lineTo(-38, -10);
        ctx.lineTo(-55, -5);
        ctx.lineTo(-28, 13);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(16, 1);
        ctx.lineTo(38, -10);
        ctx.lineTo(55, -5);
        ctx.lineTo(28, 13);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.ellipse(0, 4, 25, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 1, 10, Math.PI, 0);
      ctx.stroke();
      if (enemy.kind === "boss" && game.bossFight?.coreOpen) {
        const pulse = 1 + Math.sin(elapsed * 12) * 0.14;
        ctx.fillStyle = gold;
        ctx.beginPath();
        ctx.ellipse(0, 3, 8 * pulse, 5 * pulse, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = fg;
        ctx.beginPath();
        ctx.moveTo(-12, 3);
        ctx.lineTo(12, 3);
        ctx.stroke();
      } else {
        ctx.fillStyle = gold;
        for (const x of [-13, 0, 13]) ctx.fillRect(x - 2, 5, 4, 2);
      }
    }
    ctx.restore();
    if (enemy.kind === "boss" && enemy.hp > 0) {
      const barWidth = Math.min(w * 0.62, 360);
      const barX = (w - barWidth) / 2;
      const barY = Math.max(62, Math.min(82, h * 0.1));
      ctx.fillStyle = line;
      ctx.fillRect(barX, barY, barWidth, 7);
      ctx.fillStyle = red;
      ctx.fillRect(barX, barY, barWidth * Math.max(0, enemy.hp / BOSS_HP), 7);
      ctx.fillStyle = bg;
      for (const segment of [1 / 3, 2 / 3]) ctx.fillRect(barX + barWidth * segment - 1, barY - 2, 2, 11);
      ctx.textAlign = "center";
      ctx.font = "700 9px monospace";
      ctx.fillStyle = fg;
      const state = game.bossFight?.coreOpen ? "CORE EXPOSED" : `PHASE ${game.bossFight?.phase ?? 1}`;
      ctx.fillText(`ALIEN CRAFT · ${state}`, w / 2, barY - 7);
      ctx.textAlign = "start";
    }
  }

  if (game.bossFight?.mode === "transition") {
    const boss = game.enemies.find((enemy) => enemy.kind === "boss");
    if (boss) {
      const progress = Math.max(0, Math.min(1, (1.4 - game.bossFight.timer) / 1.4));
      const pulse = Math.sin(elapsed * 14) * 3;
      const wing = 42 + progress * 44 + pulse;
      ctx.save();
      ctx.strokeStyle = gold;
      ctx.fillStyle = `${gold}18`;
      ctx.lineWidth = 2;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(boss.x + side * 30, boss.y + 6);
        ctx.lineTo(boss.x + side * wing, boss.y + 13);
        ctx.lineTo(boss.x + side * (wing + 10), boss.y + 34);
        ctx.lineTo(boss.x + side * 34, boss.y + 28);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.ellipse(boss.x, boss.y + 27, 52 + progress * 24, 18 + progress * 7, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.textAlign = "center";
      ctx.font = "700 10px monospace";
      ctx.fillStyle = gold;
      ctx.fillText(`CRAFT TRANSFORMING · PHASE ${Math.min(3, game.bossFight.phase + 1)}`, w / 2, boss.y + 67);
      ctx.restore();
    }
  }

  if (game.bossFight?.mode === "telegraph") {
    const fight = game.bossFight;
    ctx.save();
    ctx.strokeStyle = gold;
    ctx.fillStyle = gold;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 7]);
    if (fight.phase === 1) {
      const boss = game.enemies.find((enemy) => enemy.kind === "boss");
      const originX = boss?.x ?? w / 2;
      const originY = (boss?.y ?? 96) + (boss?.radius ?? 48) * 0.65;
      const targetY = player.y;
      const openingVolley = fight.sequenceStep === 0;
      const rays = bossFanVectors(
        originX,
        originY,
        fight.attackX,
        player.y,
        openingVolley ? 195 : 270,
        openingVolley ? 0.08 : 0.2,
      );
      const lanes = rays.map((ray) => {
        const timeToTarget = (targetY - originY) / ray.vy;
        const x = originX + ray.vx * timeToTarget;
        const labelTopX = originX + ray.vx * ((targetY - 22 - originY) / ray.vy);
        return { x, start: Math.min(x, labelTopX) - 22, end: Math.max(x, labelTopX) + 22 };
      }).sort((a, b) => a.start - b.start);
      ctx.fillStyle = `${gold}12`;
      for (const lane of lanes) {
        ctx.beginPath();
        ctx.moveTo(originX - 6, originY);
        ctx.lineTo(lane.x - 22, targetY);
        ctx.lineTo(lane.x + 22, targetY);
        ctx.lineTo(originX + 6, originY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      let gapStart = 22;
      let safestGap = { start: 22, end: 22 };
      for (const lane of [...lanes, { start: w - 22, end: w - 22 }]) {
        const gapEnd = Math.max(22, Math.min(w - 22, lane.start));
        if (gapEnd - gapStart > safestGap.end - safestGap.start) {
          safestGap = { start: gapStart, end: gapEnd };
        }
        gapStart = Math.max(gapStart, Math.min(w - 22, lane.end));
      }
      ctx.setLineDash([]);
      ctx.fillStyle = gold;
      ctx.textAlign = "center";
      ctx.font = "700 10px monospace";
      if (safestGap.end - safestGap.start >= 64) {
        ctx.beginPath();
        ctx.moveTo(safestGap.start + 8, targetY - 8);
        ctx.lineTo(safestGap.start + 8, targetY);
        ctx.lineTo(safestGap.end - 8, targetY);
        ctx.lineTo(safestGap.end - 8, targetY - 8);
        ctx.stroke();
        ctx.fillText("SAFE GAP", (safestGap.start + safestGap.end) / 2, targetY - 12);
      }
      ctx.fillText(openingVolley ? "OPENING VOLLEY" : "SWEEP INCOMING", fight.attackX, Math.min(player.y - 30, h * 0.7));
    } else if (fight.phase === 2) {
      ctx.beginPath();
      ctx.moveTo(fight.attackX, 110);
      ctx.lineTo(fight.attackX, h - 24);
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.font = "700 10px monospace";
      ctx.fillText("LANE LOCK", fight.attackX, 104);
    } else {
      ctx.beginPath();
      ctx.moveTo(w * 0.16, h * 0.48);
      ctx.lineTo(w * 0.84, h * 0.48);
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.font = "700 10px monospace";
      ctx.fillText("GAP FORMING", w / 2, h * 0.48 - 10);
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  if (game.bossFight?.phase === 3 && game.bossFight.mode === "attack" && game.bossFight.followupWarning > 0) {
    const boss = game.enemies.find((enemy) => enemy.kind === "boss");
    if (boss) {
      const originY = boss.y + boss.radius * 0.65;
      const distanceY = Math.max(1, player.y - originY);
      const rays = bossFanVectors(boss.x, originY, game.bossFight.attackX, player.y);
      ctx.save();
      ctx.strokeStyle = gold;
      ctx.fillStyle = gold;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      for (const ray of rays) {
        ctx.beginPath();
        ctx.moveTo(boss.x, originY);
        ctx.lineTo(boss.x + ray.vx * (distanceY / ray.vy), player.y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.textAlign = "center";
      ctx.font = "700 10px monospace";
      ctx.fillText("FAN INBOUND · MOVE", w / 2, Math.max(112, player.y - 34));
      ctx.restore();
    }
  }

  if (game.bossFight?.phase === 2 && game.bossFight.mode === "attack" && game.bossFight.followupWarning > 0) {
    const boss = game.enemies.find((enemy) => enemy.kind === "boss");
    if (boss) {
      const originY = boss.y + boss.radius * 0.65;
      const distanceY = Math.max(1, player.y - originY);
      const vector = aimedShotVector(boss.x, originY, game.bossFight.attackX, player.y);
      ctx.save();
      ctx.strokeStyle = gold;
      ctx.fillStyle = gold;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(boss.x, originY);
      ctx.lineTo(boss.x + vector.vx * (distanceY / vector.vy), player.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.textAlign = "center";
      ctx.font = "700 10px monospace";
      ctx.fillText("AIMED SHOT · MOVE", w / 2, Math.max(112, player.y - 34));
      ctx.restore();
    }
  }

  if (game.phase === "waves" && game.roundState === "intermission") {
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "700 13px monospace";
    ctx.fillStyle = gold;
    ctx.fillText(game.wave === 3 ? "ROUND CLEAR · FINAL CRAFT INBOUND" : `ROUND ${game.wave} CLEAR · RECOVER`, w / 2, h * 0.22);
    ctx.restore();
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
