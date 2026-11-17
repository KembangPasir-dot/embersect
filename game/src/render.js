import { CONFIG } from './config.js';
import { WAYPOINTS, HEARTH_POS, TILE_SIZE, COLS, ROWS } from './map.js';
import { getFormationRadius, isInsideFormation } from './world.js';

export function render(ctx, world) {
  const { width, height, palette } = CONFIG;

  ctx.save();

  // Screen shake application
  if (world.screenShake > 0) {
    const intensity = world.screenShake * 15;
    const shakeX = (Math.random() - 0.5) * intensity;
    const shakeY = (Math.random() - 0.5) * intensity;
    ctx.translate(shakeX, shakeY);
  }

  // Clear background
  ctx.fillStyle = palette.nightBlue;
  ctx.fillRect(0, 0, width, height);

  // Draw Layered Mountain Silhouette (Sect Peaks)
  ctx.fillStyle = '#0f1738';
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(0, height - 160);
  ctx.lineTo(200, height - 300);
  ctx.lineTo(420, height - 220);
  ctx.lineTo(680, height - 360);
  ctx.lineTo(950, height - 260);
  ctx.lineTo(width, height - 190);
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#090d21';
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(0, height - 100);
  ctx.lineTo(150, height - 200);
  ctx.lineTo(380, height - 150);
  ctx.lineTo(600, height - 280);
  ctx.lineTo(880, height - 180);
  ctx.lineTo(width, height - 120);
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();

  // Draw Snow / Stars / Spirit Dust Motes
  ctx.fillStyle = palette.snowWhite;
  for (let i = 0; i < 50; i++) {
    const sx = (Math.sin(i * 77 + world.time * 0.08) * 0.5 + 0.5) * width;
    const sy = (Math.cos(i * 41 + world.time * 0.04) * 0.5 + 0.5) * height;
    ctx.globalAlpha = 0.15 + (i % 6) * 0.08;
    ctx.fillRect(sx, sy, 2, 2);
  }
  ctx.globalAlpha = 1.0;

  // Draw Grid / Map Tiles
  const grid = world.grid;
  const formationRadius = getFormationRadius(world);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tile = grid[r][c];
      const insideForm = isInsideFormation(world, tile.x, tile.y);

      if (tile.type === 'grass') {
        ctx.fillStyle = insideForm ? palette.grassGreen : '#111830';
        ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE - 1, TILE_SIZE - 1);
      } else if (tile.type === 'path') {
        ctx.fillStyle = palette.pathGray;
        ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  // Draw Stone Path Line
  ctx.strokeStyle = palette.stoneBorder;
  ctx.lineWidth = 36;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  WAYPOINTS.forEach((wp, idx) => {
    if (idx === 0) ctx.moveTo(wp.x, wp.y);
    else ctx.lineTo(wp.x, wp.y);
  });
  ctx.stroke();

  // Draw Protective Formation Radius (Golden Radial Gradient + Rotating Rune Circle)
  const grad = ctx.createRadialGradient(HEARTH_POS.x, HEARTH_POS.y, 30, HEARTH_POS.x, HEARTH_POS.y, formationRadius);
  grad.addColorStop(0, 'rgba(255, 179, 71, 0.28)');
  grad.addColorStop(0.65, 'rgba(255, 122, 26, 0.14)');
  grad.addColorStop(1, 'rgba(255, 122, 26, 0.0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(HEARTH_POS.x, HEARTH_POS.y, formationRadius, 0, Math.PI * 2);
  ctx.fill();

  // Outer ring edge with rotating runes
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.arc(HEARTH_POS.x, HEARTH_POS.y, formationRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Rotating rune notches
  ctx.translate(HEARTH_POS.x, HEARTH_POS.y);
  ctx.rotate(world.time * 0.2);
  ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    ctx.fillRect(Math.cos(angle) * formationRadius - 3, Math.sin(angle) * formationRadius - 3, 6, 6);
  }
  ctx.restore();

  // Draw Altar Center (Sacred Spirit Vein / Flame)
  ctx.save();
  const altarHpRatio = Math.max(0.2, world.altarHp / CONFIG.altarMaxHp);
  ctx.shadowColor = palette.altarGold;
  ctx.shadowBlur = (35 + Math.sin(world.time * 6) * 12) * altarHpRatio;

  ctx.fillStyle = palette.altarGold;
  ctx.beginPath();
  ctx.arc(HEARTH_POS.x, HEARTH_POS.y, 42, 0, Math.PI * 2);
  ctx.fill();

  // Inner pulsing flame / jade core
  ctx.fillStyle = palette.spiritOrange;
  ctx.beginPath();
  ctx.arc(HEARTH_POS.x, HEARTH_POS.y, (22 + Math.sin(world.time * 10) * 5) * altarHpRatio, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ALTAR', HEARTH_POS.x, HEARTH_POS.y + 4);
  ctx.restore();

  // Draw Synergy Link Lines
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
  ctx.lineWidth = 2.5;
  world.synergyLinks.forEach(link => {
    ctx.beginPath();
    ctx.moveTo(link.x1, link.y1);
    ctx.lineTo(link.x2, link.y2);
    ctx.stroke();
  });

  // Draw Cultivators (Richer Art with Robe, Sash, Floating Sword, Seal Circle, Hexagram Barrier)
  world.cultivators.forEach(c => {
    ctx.save();
    ctx.translate(c.x, c.y);

    const inside = isInsideFormation(world, c.x, c.y);
    if (!inside || c.secluded) {
      ctx.globalAlpha = 0.45;
    }

    const realm = CONFIG.realms[c.level];

    // Realm Aura Soft Ring
    ctx.fillStyle = realm.color;
    ctx.beginPath();
    ctx.arc(0, 0, 20 + Math.sin(world.time * 6 + c.x) * 3, 0, Math.PI * 2);
    ctx.fill();

    if (c.typeId === 1) {
      // Sword Cultivator
      // Robe body
      ctx.fillStyle = '#3a7bd5';
      ctx.beginPath();
      ctx.moveTo(-10, 12);
      ctx.lineTo(-12, -4);
      ctx.lineTo(0, -14);
      ctx.lineTo(12, -4);
      ctx.lineTo(10, 12);
      ctx.closePath();
      ctx.fill();
      // Sash & headband
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(-8, -2, 16, 3);
      // Floating Sword
      ctx.save();
      ctx.rotate(Math.sin(world.time * 8 + c.x) * 0.4);
      ctx.fillStyle = '#e2ecff';
      ctx.fillRect(10, -18, 3, 14);
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(9, -6, 5, 2);
      ctx.restore();
    } else if (c.typeId === 2) {
      // Talisman Master
      ctx.fillStyle = '#d48826';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      // Glowing Talisman seals rotating underneath
      ctx.save();
      ctx.rotate(world.time * 3);
      ctx.strokeStyle = '#ff7a1a';
      ctx.lineWidth = 2;
      ctx.strokeRect(-15, -15, 30, 30);
      ctx.restore();
    } else if (c.typeId === 3) {
      // Formation Keeper
      ctx.fillStyle = '#2eb85c';
      ctx.beginPath();
      ctx.rect(-11, -11, 22, 22);
      ctx.fill();
      // Translucent barrier hexagram glyph
      ctx.strokeStyle = '#7fd4ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + world.time * 0.5;
        const px = Math.cos(angle) * 18;
        const py = Math.sin(angle) * 18;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Breakthrough flame icon
    if (c.breakthrough) {
      ctx.fillStyle = '#ff7a1a';
      ctx.beginPath();
      ctx.arc(0, -24, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Poison tint
    if (c.poisonTimer > 0) {
      ctx.fillStyle = 'rgba(46, 204, 113, 0.5)';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    // Stun / Dazed stars
    if (c.stunTimer > 0) {
      ctx.fillStyle = '#ffd700';
      for (let s = 0; s < 3; s++) {
        const sa = world.time * 8 + (s / 3) * Math.PI * 2;
        const sx = Math.cos(sa) * 16;
        const sy = Math.sin(sa) * 16 - 20;
        ctx.fillRect(sx - 2, sy - 2, 4, 4);
      }
    }

    // Secluded meditation mark
    if (c.secluded) {
      ctx.fillStyle = '#7fd4ff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('MED', 0, -24);
    }

    // Realm Badge above unit
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(realm.badge, 0, -28);

    ctx.restore();
  });

  // Draw Projectiles (Sword-Qi arcs)
  world.projectiles.forEach(pr => {
    ctx.save();
    ctx.strokeStyle = '#7fd4ff';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(pr.x, pr.y, 9, 0, Math.PI);
    ctx.stroke();
    ctx.restore();
  });

  // Draw Demons (Rich Art: Ghostly Wisp, Slithering Snake Demon, 3-Tailed Fox Spirit, Boss)
  world.demons.forEach(en => {
    ctx.save();
    ctx.shadowColor = palette.demonPurple;
    ctx.shadowBlur = 15;

    if (en.boss) {
      if (en.type === 'serpent') {
        // Serpent Demon King
        ctx.strokeStyle = en.invulnTimer > 0 ? '#ffffff' : '#2ecc71';
        ctx.lineWidth = 18;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(en.x - 35, en.y);
        ctx.quadraticCurveTo(en.x, en.y + Math.sin(world.time * 10) * 20, en.x + 35, en.y);
        ctx.stroke();

        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(en.x + 25, en.y - 4, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff3333';
        ctx.fillRect(en.x + 23, en.y - 7, 3, 3);

        ctx.fillStyle = '#2ecc71';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(en.name || 'SERPENT DEMON KING', en.x, en.y - 44);
      } else if (en.type === 'fox_boss') {
        // Nine-Tailed Fox Spirit (drawn large so all nine tails read clearly)
        ctx.fillStyle = en.phase === 3 ? '#ba55d3' : (en.phase === 2 ? '#ff4a4a' : '#ff7a1a');
        for (let t = 0; t < 9; t++) {
          const tAngle = (t / 9) * Math.PI - Math.PI / 2;
          const tailLen = 36 + Math.sin(world.time * 10 + t) * 9;
          ctx.beginPath();
          ctx.ellipse(
            en.x - 30 + Math.cos(tAngle) * 18,
            en.y + Math.sin(tAngle + world.time * 6) * 22,
            tailLen, 9, tAngle, 0, Math.PI * 2
          );
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(en.x, en.y, 40, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffff00';
        ctx.fillRect(en.x + 12, en.y - 12, 6, 6);
        ctx.fillRect(en.x + 26, en.y - 12, 6, 6);

        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${en.name} (PHASE ${en.phase})`, en.x, en.y - 74);
      } else {
        // Boss Demon
        ctx.fillStyle = '#9b30ff';
        ctx.beginPath();
        ctx.arc(en.x, en.y, 28, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff3333';
        ctx.beginPath();
        ctx.arc(en.x - 8, en.y - 6, 5, 0, Math.PI * 2);
        ctx.arc(en.x + 8, en.y - 6, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff4a4a';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(world.bossName || 'BOSS', en.x, en.y - 36);
      }
    } else if (en.type === 'fox') {
      // Fox Spirit (Large orange fox with 3 visible tails & glowing eyes)
      ctx.fillStyle = '#ff7a1a';
      // 3 tails swaying
      ctx.beginPath();
      ctx.ellipse(en.x - 12, en.y + Math.sin(world.time * 12) * 4, 10, 4, -0.5, 0, Math.PI * 2);
      ctx.ellipse(en.x - 14, en.y, 10, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(en.x - 12, en.y - Math.sin(world.time * 12) * 4, 10, 4, 0.5, 0, Math.PI * 2);
      ctx.fill();
      // Fox body
      ctx.beginPath();
      ctx.arc(en.x, en.y, 16, 0, Math.PI * 2);
      ctx.fill();
      // Glowing eyes
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(en.x + 4, en.y - 5, 3, 3);
      ctx.fillRect(en.x + 10, en.y - 5, 3, 3);
    } else if (en.type === 'snake') {
      // Snake Demon (Segmented green serpent with fangs, slithering sine wiggle)
      ctx.strokeStyle = '#2ecc71';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(en.x - 15, en.y);
      ctx.quadraticCurveTo(en.x, en.y + Math.sin(world.time * 15) * 12, en.x + 15, en.y);
      ctx.stroke();
      // Eyes
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(en.x + 10, en.y - 4, 3, 3);
    } else {
      // Lesser Evil Spirit (Pale ghostly wisp with hollow eyes & trailing tail)
      ctx.fillStyle = 'rgba(107, 79, 161, 0.85)';
      ctx.beginPath();
      ctx.arc(en.x, en.y - 4, 12, 0, Math.PI * 2);
      ctx.lineTo(en.x + Math.sin(world.time * 10) * 8, en.y + 16);
      ctx.closePath();
      ctx.fill();
      // Hollow eyes
      ctx.fillStyle = '#7fd4ff';
      ctx.fillRect(en.x - 5, en.y - 7, 3, 3);
      ctx.fillRect(en.x + 2, en.y - 7, 3, 3);
    }

    // HP Bar
    const hpPct = Math.max(0, Math.min(1, en.hp / en.maxHp));
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(en.x - 18, en.y - (en.boss ? 48 : 24), 36, 5);
    ctx.fillStyle = en.boss ? '#ba55d3' : '#50fa7b';
    ctx.fillRect(en.x - 18, en.y - (en.boss ? 48 : 24), 36 * hpPct, 5);

    ctx.restore();
  });

  // Draw Spirit Wisps (Pulsing golden orbs with trailing sparkle)
  world.spiritWisps.forEach(w => {
    ctx.save();
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(w.x, w.y, 7 + Math.sin(world.time * 12) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(w.x - 2, w.y - 2, 4, 4);
    ctx.restore();
  });

  // Draw Particles
  world.particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Draw Floating Numbers
  world.floatingNumbers.forEach(fn => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, fn.life / fn.maxLife);
    ctx.fillStyle = fn.color;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(fn.text, fn.x, fn.y);
    ctx.restore();
  });

  // Draw Tile Hover / Selection Box in Build Mode
  if (world.state === 'build' && world.hoveredTile) {
    const ht = world.hoveredTile;
    ctx.strokeStyle = isInsideFormation(world, ht.x, ht.y) ? '#50fa7b' : '#ff4a4a';
    ctx.lineWidth = 2;
    ctx.strokeRect(ht.col * TILE_SIZE, ht.row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }

  ctx.restore(); // Restore from screen shake

  // --- OVERLAYS ---

  if (world.state === 'title') {
    renderTitleScreen(ctx, world);
  } else if (world.state === 'build') {
    renderBuildOverlay(ctx, world);
  } else if (world.state === 'relics') {
    renderRelicsOverlay(ctx, world);
  } else if (world.state === 'paused') {
    renderPauseOverlay(ctx, world);
  } else if (world.state === 'gameover') {
    renderGameOverOverlay(ctx, world);
  } else if (world.state === 'victory') {
    renderVictoryOverlay(ctx, world);
  }
}

function renderTitleScreen(ctx, world) {
  const { width, height } = CONFIG;
  ctx.fillStyle = 'rgba(6, 8, 19, 0.55)';
  ctx.fillRect(0, 0, width, height);

  // Sect mountain silhouette along the bottom (the in-map mountains are
  // hidden behind the tile grid, so the title draws its own ridge).
  ctx.fillStyle = '#0f1738';
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(0, height - 120);
  ctx.lineTo(220, height - 210);
  ctx.lineTo(450, height - 140);
  ctx.lineTo(700, height - 230);
  ctx.lineTo(980, height - 150);
  ctx.lineTo(width, height - 110);
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#090d21';
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(0, height - 70);
  ctx.lineTo(180, height - 140);
  ctx.lineTo(420, height - 90);
  ctx.lineTo(660, height - 160);
  ctx.lineTo(920, height - 100);
  ctx.lineTo(width, height - 80);
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.shadowColor = '#ff7a1a';
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#ffb347';
  ctx.font = 'bold 64px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('EMBERSECT', width / 2, height / 2 - 70);
  ctx.restore();

  ctx.fillStyle = '#7fd4ff';
  ctx.font = '20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Defend the Sacred Spirit Vein against the Demonic Hordes', width / 2, height / 2 - 15);

  ctx.fillStyle = '#ffd700';
  ctx.font = '16px monospace';
  ctx.fillText(`BEST SCORE: ${world.bestScore}`, width / 2, height / 2 + 35);

  ctx.fillStyle = '#e2ecff';
  ctx.font = '15px monospace';
  ctx.fillText('Controls: [1/2/3] Select Cultivator | [Click] Place | [Right-Click] Sell | [G] Expand Formation', width / 2, height / 2 + 85);
  ctx.fillText('[Space] Start Wave / Next | [P] Pause | [M] Mute Audio', width / 2, height / 2 + 115);

  ctx.fillStyle = '#ff7a1a';
  ctx.font = 'bold 22px monospace';
  const pulse = Math.sin(world.time * 6) * 0.3 + 0.7;
  ctx.globalAlpha = pulse;
  ctx.fillText('CLICK OR PRESS SPACE / ENTER TO BEGIN ASCENSION', width / 2, height / 2 + 175);
  ctx.restore();
}

function renderBuildOverlay(ctx, world) {
  const { width } = CONFIG;
  ctx.fillStyle = 'rgba(11, 16, 38, 0.75)';
  ctx.fillRect(width - 320, 15, 305, 115);

  ctx.strokeStyle = '#2f3868';
  ctx.lineWidth = 2;
  ctx.strokeRect(width - 320, 15, 305, 115);

  ctx.fillStyle = '#ffb347';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('BUILD PHASE — Press SPACE to start Night', width - 167, 38);

  ctx.fillStyle = '#e2ecff';
  ctx.font = '13px monospace';
  ctx.fillText('[1] Sword Cultivator (50 stones)', width - 305, 65);
  ctx.fillText('[2] Talisman Master (30 stones)', width - 305, 88);
  ctx.fillText('[3] Formation Keeper (40 stones)', width - 305, 111);

  // Active Relics indicator in HUD corner
  if (world.ownedRelics && world.ownedRelics.length > 0) {
    ctx.fillStyle = 'rgba(11, 16, 38, 0.8)';
    ctx.fillRect(15, 60, 260, 36);
    ctx.strokeStyle = '#ffd700';
    ctx.strokeRect(15, 60, 260, 36);
    ctx.fillStyle = '#ffd700';
    ctx.font = '12px monospace';
    ctx.fillText(`Relics Owned: ${world.ownedRelics.length}`, 28, 83);
  }
}

function renderRelicsOverlay(ctx, world) {
  const { width, height } = CONFIG;
  ctx.fillStyle = 'rgba(6, 8, 19, 0.90)';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 32px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CHOOSE A CULTIVATION MANUAL / TREASURE', width / 2, 120);

  ctx.fillStyle = '#7fd4ff';
  ctx.font = '16px monospace';
  ctx.fillText('Select one relic to strengthen your sect for the upcoming nights:', width / 2, 165);

  const choices = world.currentRelicChoices || [];
  const startX = width / 2 - 270;
  choices.forEach((relic, idx) => {
    const rx = startX + idx * 190;
    const ry = 230;
    const rw = 170;
    const rh = 280;

    // Card background
    ctx.fillStyle = '#141d38';
    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeStyle = '#ffb347';
    ctx.lineWidth = 2;
    ctx.strokeRect(rx, ry, rw, rh);

    // Glyph icon
    ctx.font = '36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(relic.glyph, rx + rw / 2, ry + 65);

    // Name
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 15px monospace';
    wrapText(ctx, relic.name, rx + rw / 2, ry + 115, rw - 20, 20);

    // Description
    ctx.fillStyle = '#e2ecff';
    ctx.font = '13px monospace';
    wrapText(ctx, relic.description, rx + rw / 2, ry + 170, rw - 20, 18);

    // Pick instruction
    ctx.fillStyle = '#50fa7b';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('[ Click to Pick ]', rx + rw / 2, ry + 245);
  });
  ctx.textAlign = 'left';
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}

function renderPauseOverlay(ctx, world) {
  const { width, height } = CONFIG;
  ctx.fillStyle = 'rgba(6, 8, 19, 0.85)';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#ffb347';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', width / 2, height / 2 - 30);

  ctx.fillStyle = '#e2ecff';
  ctx.font = '18px monospace';
  ctx.fillText('Press P to resume your ascension', width / 2, height / 2 + 25);
  ctx.textAlign = 'left';
}

function getGrade(score) {
  if (score >= 8000) return 'S';
  if (score >= 5500) return 'A';
  if (score >= 3000) return 'B';
  return 'C';
}

function renderGameOverOverlay(ctx, world) {
  const { width, height } = CONFIG;
  ctx.fillStyle = 'rgba(15, 8, 8, 0.90)';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#ff4a4a';
  ctx.font = 'bold 56px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ALTAR FALLEN', width / 2, height / 2 - 90);

  const grade = getGrade(world.score);
  ctx.fillStyle = grade === 'S' ? '#ffd700' : '#ffb347';
  ctx.font = 'bold 28px monospace';
  ctx.fillText(`Final Score: ${world.score} | Grade: ${grade} | Nights: ${world.currentNight}`, width / 2, height / 2 - 35);

  ctx.fillStyle = '#ffd700';
  ctx.font = '16px monospace';
  ctx.fillText(`Best Record: ${world.bestScore}`, width / 2, height / 2 + 5);

  if (world.newBest) {
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('★ NEW SECT RECORD! ★', width / 2, height / 2 + 45);
  }

  ctx.fillStyle = '#e2ecff';
  ctx.font = '16px monospace';
  ctx.fillText('Press R / Enter to Reincarnate / Restart', width / 2, height / 2 + 95);
  ctx.textAlign = 'left';
}

function renderVictoryOverlay(ctx, world) {
  const { width, height } = CONFIG;
  ctx.fillStyle = 'rgba(8, 15, 30, 0.92)';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 54px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ASCENSION ACHIEVED', width / 2, height / 2 - 90);

  const grade = getGrade(world.score);
  ctx.fillStyle = grade === 'S' ? '#ffd700' : '#50fa7b';
  ctx.font = 'bold 28px monospace';
  ctx.fillText(`Score: ${world.score} | Grade: ${grade} | All 10 Nights Cleared`, width / 2, height / 2 - 35);

  ctx.fillStyle = '#ffd700';
  ctx.font = '16px monospace';
  ctx.fillText(`Best Record: ${world.bestScore} | Demons Vanquished: ${world.kills || 0}`, width / 2, height / 2 + 5);

  if (world.newBest) {
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('★ NEW SECT RECORD! ★', width / 2, height / 2 + 45);
  }

  ctx.fillStyle = '#e2ecff';
  ctx.font = '16px monospace';
  ctx.fillText('Press R / Enter to Begin New Cycle', width / 2, height / 2 + 95);
  ctx.textAlign = 'left';
}
