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

  // --- PARALLAX BACKGROUND & ATMOSPHERE ---

  // Starfield
  ctx.fillStyle = palette.snowWhite;
  for (let i = 0; i < 65; i++) {
    const sx = (Math.sin(i * 77 + world.time * 0.05) * 0.5 + 0.5) * width;
    const sy = (Math.cos(i * 41 + world.time * 0.03) * 0.5 + 0.5) * height * 0.65;
    ctx.globalAlpha = 0.2 + (i % 5) * 0.1;
    ctx.fillRect(sx, sy, i % 3 === 0 ? 2.5 : 1.5, i % 3 === 0 ? 2.5 : 1.5);
  }
  ctx.globalAlpha = 1.0;

  // Far Hazy Mountain Ridge
  ctx.fillStyle = '#080c24';
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(0, height - 240);
  ctx.lineTo(240, height - 360);
  ctx.lineTo(500, height - 290);
  ctx.lineTo(760, height - 410);
  ctx.lineTo(1020, height - 310);
  ctx.lineTo(width, height - 260);
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();

  // Mid Mountain Ridge
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

  // Near Dark Ridge
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

  // Drifting Mist Bands
  ctx.fillStyle = 'rgba(180, 210, 255, 0.045);';
  for (let m = 0; m < 3; m++) {
    const mx = ((world.time * (15 + m * 8)) + m * 450) % (width + 400) - 200;
    ctx.fillRect(mx, height - 170 + m * 45, 360, 22);
  }

  // Spirit Dust Motes
  ctx.fillStyle = palette.snowWhite;
  for (let i = 0; i < 40; i++) {
    const sx = (Math.sin(i * 33 + world.time * 0.08) * 0.5 + 0.5) * width;
    const sy = (Math.cos(i * 19 + world.time * 0.04) * 0.5 + 0.5) * height;
    ctx.globalAlpha = 0.12 + (i % 4) * 0.07;
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

  // Draw Protective Formation Radius (Layered Golden Radial Gradient + Wide Halo)
  const wideGrad = ctx.createRadialGradient(HEARTH_POS.x, HEARTH_POS.y, formationRadius * 0.4, HEARTH_POS.x, HEARTH_POS.y, formationRadius * 1.3);
  wideGrad.addColorStop(0, 'rgba(255, 215, 0, 0.18)');
  wideGrad.addColorStop(1, 'rgba(255, 122, 26, 0.0)');
  ctx.fillStyle = wideGrad;
  ctx.beginPath();
  ctx.arc(HEARTH_POS.x, HEARTH_POS.y, formationRadius * 1.3, 0, Math.PI * 2);
  ctx.fill();

  const grad = ctx.createRadialGradient(HEARTH_POS.x, HEARTH_POS.y, 20, HEARTH_POS.x, HEARTH_POS.y, formationRadius);
  grad.addColorStop(0, 'rgba(255, 215, 0, 0.38)');
  grad.addColorStop(0.5, 'rgba(255, 179, 71, 0.24)');
  grad.addColorStop(0.85, 'rgba(255, 122, 26, 0.12)');
  grad.addColorStop(1, 'rgba(255, 122, 26, 0.0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(HEARTH_POS.x, HEARTH_POS.y, formationRadius, 0, Math.PI * 2);
  ctx.fill();

  // Outer ring edge with rotating runes
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.75)';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.arc(HEARTH_POS.x, HEARTH_POS.y, formationRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Counter-rotating inner ring
  ctx.strokeStyle = 'rgba(255, 179, 71, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.arc(HEARTH_POS.x, HEARTH_POS.y, formationRadius - 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Rotating rune notches
  ctx.translate(HEARTH_POS.x, HEARTH_POS.y);
  ctx.rotate(world.time * 0.25);
  ctx.fillStyle = 'rgba(255, 215, 0, 0.85)';
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    ctx.fillRect(Math.cos(angle) * formationRadius - 4, Math.sin(angle) * formationRadius - 4, 8, 8);
  }
  ctx.rotate(-world.time * 0.5);
  ctx.fillStyle = 'rgba(255, 179, 71, 0.75)';
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    ctx.fillRect(Math.cos(angle) * (formationRadius - 12) - 3, Math.sin(angle) * (formationRadius - 12) - 3, 6, 6);
  }
  ctx.restore();

  // Draw Altar Center (Sacred Spirit Vein / Flame)
  ctx.save();
  const altarHpRatio = Math.max(0.2, world.altarHp / CONFIG.altarMaxHp);
  ctx.shadowColor = palette.altarGold;
  ctx.shadowBlur = (50 + Math.sin(world.time * 8) * 15) * altarHpRatio;

  const altarHalo = ctx.createRadialGradient(HEARTH_POS.x, HEARTH_POS.y, 10, HEARTH_POS.x, HEARTH_POS.y, 65);
  altarHalo.addColorStop(0, 'rgba(255, 179, 71, 0.6)');
  altarHalo.addColorStop(1, 'rgba(255, 122, 26, 0)');
  ctx.fillStyle = altarHalo;
  ctx.beginPath();
  ctx.arc(HEARTH_POS.x, HEARTH_POS.y, 65, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = palette.altarGold;
  ctx.beginPath();
  ctx.arc(HEARTH_POS.x, HEARTH_POS.y, 44, 0, Math.PI * 2);
  ctx.fill();

  // Inner pulsing flame / jade core
  ctx.fillStyle = palette.spiritOrange;
  ctx.beginPath();
  ctx.arc(HEARTH_POS.x, HEARTH_POS.y, (24 + Math.sin(world.time * 12) * 6) * altarHpRatio, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('ALTAR', HEARTH_POS.x, HEARTH_POS.y + 4);
  ctx.restore();

  // --- LANTERNKEEP HERO ELEMENT: ALTAR RADIANT BEAM FAN & SYNERGY GLOWING BEAMS ---

  // Altar Radiant Beam Fan
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.28)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + world.time * 0.08;
    const rayLen = formationRadius * 0.95;
    ctx.beginPath();
    ctx.moveTo(HEARTH_POS.x, HEARTH_POS.y);
    ctx.lineTo(HEARTH_POS.x + Math.cos(angle) * rayLen, HEARTH_POS.y + Math.sin(angle) * rayLen);
    ctx.stroke();
  }
  ctx.restore();

  // Synergy Link Beams (Glowing Beams: Wide Soft Glow + Narrow Bright Core + Traveling Energy Dash)
  world.synergyLinks.forEach(link => {
    ctx.save();
    // Wide soft glow
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.lineWidth = 11;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(link.x1, link.y1);
    ctx.lineTo(link.x2, link.y2);
    ctx.stroke();

    // Mid gold beam
    ctx.strokeStyle = 'rgba(255, 230, 130, 0.9)';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(link.x1, link.y1);
    ctx.lineTo(link.x2, link.y2);
    ctx.stroke();

    // Inner bright core with moving dash energy
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([8, 10]);
    ctx.lineDashOffset = -world.time * 40;
    ctx.beginPath();
    ctx.moveTo(link.x1, link.y1);
    ctx.lineTo(link.x2, link.y2);
    ctx.stroke();
    ctx.restore();
  });

  // --- DETAILED CULTIVATOR SPRITES ---
  world.cultivators.forEach(c => {
    ctx.save();
    ctx.translate(c.x, c.y);

    const inside = isInsideFormation(world, c.x, c.y);
    if (!inside || c.secluded) {
      ctx.globalAlpha = 0.45;
    }

    const realm = CONFIG.realms[c.level];

    // Realm Aura Soft Radial Gradient
    const auraGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 30 + c.level * 5);
    auraGrad.addColorStop(0, c.level === 3 ? 'rgba(255,255,255,0.9)' : realm.color);
    auraGrad.addColorStop(0.5, realm.color);
    auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 32 + c.level * 5, 0, Math.PI * 2);
    ctx.fill();

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 6, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    if (c.typeId === 1) {
      // Sword Cultivator (Richer Robe with sash, collar trim, floating glowing sword)
      ctx.fillStyle = '#2b6cd4';
      ctx.beginPath();
      ctx.moveTo(-11, 14);
      ctx.lineTo(-13, -5);
      ctx.lineTo(0, -16);
      ctx.lineTo(13, -5);
      ctx.lineTo(11, 14);
      ctx.closePath();
      ctx.fill();
      // Collar trim & golden sash
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(-9, -3, 18, 3.5);
      ctx.fillRect(-4, -12, 8, 3);
      // Floating Sword with glowing aura
      ctx.save();
      ctx.rotate(Math.sin(world.time * 9 + c.x) * 0.45);
      ctx.shadowColor = '#7fd4ff';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#e2ecff';
      ctx.fillRect(11, -20, 3.5, 16);
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(10, -7, 5.5, 2.5);
      ctx.restore();
    } else if (c.typeId === 2) {
      // Talisman Master (Rich robes + rotating seal talismans with stamp marks)
      ctx.fillStyle = '#d48826';
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(-10, -3, 20, 3);
      // Rotating Talisman seals
      ctx.save();
      ctx.rotate(world.time * 3.5);
      ctx.strokeStyle = '#ff7a1a';
      ctx.lineWidth = 2.2;
      ctx.strokeRect(-16, -16, 32, 32);
      // Red seal stamp mark
      ctx.fillStyle = '#ff3333';
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
    } else if (c.typeId === 3) {
      // Formation Keeper (Emerald jade block with stone tablets & hexagram barrier)
      ctx.fillStyle = '#2eb85c';
      ctx.beginPath();
      ctx.rect(-12, -12, 24, 24);
      ctx.fill();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-12, -12, 24, 24);
      // Translucent barrier hexagram glyph
      ctx.strokeStyle = '#7fd4ff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + world.time * 0.5;
        const px = Math.cos(angle) * 19;
        const py = Math.sin(angle) * 19;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Breakthrough flame icon
    if (c.breakthrough) {
      ctx.fillStyle = '#ff7a1a';
      ctx.shadowColor = '#ff7a1a';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, -26, 6.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Poison tint
    if (c.poisonTimer > 0) {
      ctx.fillStyle = 'rgba(46, 204, 113, 0.55)';
      ctx.beginPath();
      ctx.arc(0, 0, 19, 0, Math.PI * 2);
      ctx.fill();
    }

    // Stun / Dazed stars
    if (c.stunTimer > 0) {
      ctx.fillStyle = '#ffd700';
      for (let s = 0; s < 3; s++) {
        const sa = world.time * 8 + (s / 3) * Math.PI * 2;
        const sx = Math.cos(sa) * 17;
        const sy = Math.sin(sa) * 17 - 22;
        ctx.fillRect(sx - 2, sy - 2, 4.5, 4.5);
      }
    }

    // Secluded meditation mark
    if (c.secluded) {
      ctx.fillStyle = '#7fd4ff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('MED', 0, -26);
    }

    // Realm Badge above unit with gold backing disc
    ctx.fillStyle = 'rgba(11, 16, 38, 0.85)';
    ctx.beginPath();
    ctx.arc(0, -32, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(realm.badge, 0, -28);

    ctx.restore();
  });

  // Draw Projectiles (Sword-Qi arcs)
  world.projectiles.forEach(pr => {
    ctx.save();
    ctx.strokeStyle = '#7fd4ff';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = '#7fd4ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(pr.x, pr.y, 9.5, 0, Math.PI);
    ctx.stroke();
    ctx.restore();
  });

  // --- DETAILED DEMON SPRITES ---
  world.demons.forEach(en => {
    ctx.save();
    ctx.shadowColor = palette.demonPurple;
    ctx.shadowBlur = 16;

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, en.boss ? 18 : 6, en.boss ? 34 : (en.type === 'fox' ? 16 : 11), en.boss ? 12 : 5.5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (en.boss) {
      if (en.type === 'serpent') {
        // Serpent Demon King glow
        ctx.save();
        const sGlow = ctx.createRadialGradient(0, 0, 10, 0, 0, 58);
        sGlow.addColorStop(0, 'rgba(46, 204, 113, 0.7)');
        sGlow.addColorStop(1, 'rgba(46, 204, 113, 0)');
        ctx.fillStyle = sGlow;
        ctx.beginPath();
        ctx.arc(0, 0, 58, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.strokeStyle = en.invulnTimer > 0 ? '#ffffff' : '#2ecc71';
        ctx.lineWidth = 19;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(en.x - 38, en.y);
        ctx.quadraticCurveTo(en.x, en.y + Math.sin(world.time * 10) * 22, en.x + 38, en.y);
        ctx.stroke();

        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(en.x + 26, en.y - 4, 6.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff3333';
        ctx.fillRect(en.x + 24, en.y - 7.5, 3.5, 3.5);

        ctx.fillStyle = '#2ecc71';
        ctx.font = 'bold 14px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(en.name || 'SERPENT DEMON KING', en.x, en.y - 46);
      } else if (en.type === 'fox_boss') {
        // Nine-Tailed Fox Spirit glow
        ctx.save();
        const fGlow = ctx.createRadialGradient(0, 0, 15, 0, 0, 75);
        fGlow.addColorStop(0, 'rgba(255, 122, 26, 0.8)');
        fGlow.addColorStop(0.5, 'rgba(186, 85, 211, 0.5)');
        fGlow.addColorStop(1, 'rgba(186, 85, 211, 0)');
        ctx.fillStyle = fGlow;
        ctx.beginPath();
        ctx.arc(0, 0, 75, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Nine distinct fanned tails with flame tips — fanned LEFT (behind the
        // boss, toward the path) in contrasting ember-gold so they read against
        // the phase-colored body instead of merging into one blob.
        const tailColors = ['#ff7a1a', '#ffb347', '#ffd700'];
        for (let t = 0; t < 9; t++) {
          const tAngle = Math.PI / 2 + (t / 8) * Math.PI;
          const tailLen = 46 + Math.sin(world.time * 10 + t) * 12;
          const tx = en.x - 44 + Math.cos(tAngle) * 26;
          const ty = en.y + Math.sin(tAngle) * 26;
          ctx.fillStyle = tailColors[t % 3];
          ctx.beginPath();
          ctx.ellipse(tx, ty, tailLen, 11, tAngle, 0, Math.PI * 2);
          ctx.fill();
          // Flame tip on each tail: gold ring + white-hot core
          const tipX = en.x - 44 + Math.cos(tAngle) * (tailLen + 26);
          const tipY = en.y + Math.sin(tAngle) * (tailLen + 26);
          ctx.fillStyle = '#ffd700';
          ctx.beginPath();
          ctx.arc(tipX, tipY, 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(tipX, tipY, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(en.x, en.y, 42, 0, Math.PI * 2);
        ctx.fillStyle = en.phase === 3 ? '#ba55d3' : (en.phase === 2 ? '#ff4a4a' : '#ff7a1a');
        ctx.fill();

        ctx.fillStyle = '#ffff00';
        ctx.fillRect(en.x + 13, en.y - 13, 6.5, 6.5);
        ctx.fillRect(en.x + 28, en.y - 13, 6.5, 6.5);

        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 15px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${en.name} (PHASE ${en.phase})`, en.x, en.y - 78);
      } else {
        // Boss Demon
        ctx.fillStyle = '#9b30ff';
        ctx.beginPath();
        ctx.arc(en.x, en.y, 30, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff3333';
        ctx.beginPath();
        ctx.arc(en.x - 9, en.y - 7, 5.5, 0, Math.PI * 2);
        ctx.arc(en.x + 9, en.y - 7, 5.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff4a4a';
        ctx.font = 'bold 14px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(world.bossName || 'BOSS', en.x, en.y - 38);
      }
    } else if (en.type === 'fox') {
      // Fox Spirit (Orange fox with 3 distinct swaying tails & glowing eyes)
      ctx.fillStyle = '#ff7a1a';
      for (let ft = -1; ft <= 1; ft++) {
        ctx.beginPath();
        ctx.ellipse(en.x - 14 + ft * 4, en.y + ft * Math.sin(world.time * 12) * 5, 11, 4.5, ft * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(en.x, en.y, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(en.x + 5, en.y - 5.5, 3.5, 3.5);
      ctx.fillRect(en.x + 11, en.y - 5.5, 3.5, 3.5);
    } else if (en.type === 'snake') {
      // Snake Demon (Segmented green serpent with scale arcs, fangs, red eyes)
      ctx.strokeStyle = '#2ecc71';
      ctx.lineWidth = 11;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(en.x - 16, en.y);
      ctx.quadraticCurveTo(en.x, en.y + Math.sin(world.time * 16) * 14, en.x + 16, en.y);
      ctx.stroke();
      // Scale ridges along body
      ctx.strokeStyle = '#27ae60';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(en.x, en.y + Math.sin(world.time * 16) * 7, 5, 0, Math.PI);
      ctx.stroke();
      // Eyes
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(en.x + 11, en.y - 4.5, 3.5, 3.5);
    } else {
      // Lesser Evil Spirit (Translucent trailing ghost tail, glowing hollow eyes)
      ctx.fillStyle = 'rgba(125, 95, 185, 0.88)';
      ctx.beginPath();
      ctx.arc(en.x, en.y - 4, 13, 0, Math.PI * 2);
      ctx.lineTo(en.x + Math.sin(world.time * 11) * 9, en.y + 18);
      ctx.closePath();
      ctx.fill();
      // Hollow cyan eyes
      ctx.fillStyle = '#7fd4ff';
      ctx.fillRect(en.x - 5.5, en.y - 7.5, 3.5, 3.5);
      ctx.fillRect(en.x + 2, en.y - 7.5, 3.5, 3.5);
    }

    // HP Bar
    const hpPct = Math.max(0, Math.min(1, en.hp / en.maxHp));
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(en.x - 19, en.y - (en.boss ? 52 : 26), 38, 5.5);
    ctx.fillStyle = en.boss ? '#ba55d3' : '#50fa7b';
    ctx.fillRect(en.x - 19, en.y - (en.boss ? 52 : 26), 38 * hpPct, 5.5);

    ctx.restore();
  });

  // Draw Spirit Wisps (Pulsing golden orbs with trailing sparkle)
  world.spiritWisps.forEach(w => {
    ctx.save();
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(w.x, w.y, 7.5 + Math.sin(world.time * 12) * 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(w.x - 2.2, w.y - 2.2, 4.5, 4.5);
    ctx.restore();
  });

  // Draw Particles
  world.particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    if (p.isShockwave) {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });

  // Draw Floating Numbers (Outlined for high readability)
  world.floatingNumbers.forEach(fn => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, fn.life / fn.maxLife);
    ctx.font = 'bold 15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000000';
    ctx.fillText(fn.text, fn.x + 1.5, fn.y + 1.5);
    ctx.fillText(fn.text, fn.x - 1.5, fn.y - 1.5);
    ctx.fillStyle = fn.color;
    ctx.fillText(fn.text, fn.x, fn.y);
    ctx.restore();
  });

  // Drifting mist overlay (atmosphere over the playfield, very low alpha so
  // gameplay stays readable; the parallax ridges sit behind the opaque tiles,
  // so the mist is what carries the night air during play).
  ctx.save();
  for (let m = 0; m < 4; m++) {
    const mx = ((world.time * (8 + m * 3) + m * 340) % (CONFIG.width + 360)) - 180;
    const my = 150 + m * 140 + Math.sin(world.time * 0.3 + m * 2) * 12;
    ctx.fillStyle = m % 2 === 0 ? 'rgba(190, 210, 255, 0.035)' : 'rgba(255, 179, 71, 0.028)';
    ctx.beginPath();
    ctx.ellipse(mx, my, 260, 42, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Draw Tile Hover / Selection Box in Build Mode
  if (world.state === 'build' && world.hoveredTile) {
    const ht = world.hoveredTile;
    ctx.strokeStyle = isInsideFormation(world, ht.x, ht.y) ? '#50fa7b' : '#ff4a4a';
    ctx.lineWidth = 2.2;
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

  // Apply Vignette & Color Grading
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const vignette = getVignetteCanvas(width, height);
  ctx.drawImage(vignette, 0, 0);

  ctx.fillStyle = 'rgba(255, 170, 70, 0.025)';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(60, 100, 220, 0.035)';
  ctx.fillRect(0, 0, width, height * 0.4);
  ctx.restore();
}

let cachedVignette = null;
function getVignetteCanvas(w, h) {
  if (cachedVignette && cachedVignette.width === w && cachedVignette.height === h) {
    return cachedVignette;
  }
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const cctx = canvas.getContext('2d');
  const grad = cctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.6, 'rgba(5, 8, 20, 0.35)');
  grad.addColorStop(1, 'rgba(2, 3, 10, 0.85)');
  cctx.fillStyle = grad;
  cctx.fillRect(0, 0, w, h);
  cachedVignette = canvas;
  return canvas;
}

function renderTitleScreen(ctx, world) {
  const { width, height } = CONFIG;
  ctx.fillStyle = 'rgba(6, 8, 19, 0.65)';
  ctx.fillRect(0, 0, width, height);

  // Ornamental framing lines & corners
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, width - 80, height - 80);
  ctx.strokeRect(46, 46, width - 92, height - 92);

  ctx.save();
  ctx.shadowColor = '#ff7a1a';
  ctx.shadowBlur = 35;
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 72px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('EMBERSECT', width / 2, height / 2 - 85);
  ctx.restore();

  ctx.fillStyle = '#7fd4ff';
  ctx.font = '18px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('— ❖ Defend the Sacred Spirit Vein against Demonic Hordes ❖ —', width / 2, height / 2 - 25);

  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(`BEST SECT SCORE: ${world.bestScore}`, width / 2, height / 2 + 25);

  ctx.fillStyle = '#e2ecff';
  ctx.font = '14px monospace';
  ctx.fillText('Controls: [1/2/3] Select Cultivator | [Click] Place | [Right-Click] Sell | [G] Expand Formation', width / 2, height / 2 + 75);
  ctx.fillText('[Space] Start Wave / Next | [P] Pause | [M] Mute Audio', width / 2, height / 2 + 102);

  ctx.fillStyle = '#ff7a1a';
  ctx.font = 'bold 20px Georgia, serif';
  const pulse = Math.sin(world.time * 6) * 0.3 + 0.7;
  ctx.globalAlpha = pulse;
  ctx.fillText('✦ CLICK OR PRESS SPACE / ENTER TO BEGIN ASCENSION ✦', width / 2, height / 2 + 165);
  ctx.restore();
}

function renderBuildOverlay(ctx, world) {
  const { width } = CONFIG;
  ctx.fillStyle = 'rgba(8, 12, 28, 0.85)';
  ctx.fillRect(width - 325, 60, 310, 115);

  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(width - 325, 60, 310, 115);

  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.fillText('BUILD PHASE — Press SPACE for Night', width - 170, 82);

  ctx.fillStyle = '#e2ecff';
  ctx.font = '12px monospace';
  ctx.fillText('[1] Sword Cultivator (50 stones)', width - 315, 108);
  ctx.fillText('[2] Talisman Master (30 stones)', width - 315, 131);
  ctx.fillText('[3] Formation Keeper (40 stones)', width - 315, 154);
}

function renderRelicsOverlay(ctx, world) {
  const { width, height } = CONFIG;
  ctx.fillStyle = 'rgba(6, 8, 19, 0.94)';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 34px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('CHOOSE A CULTIVATION MANUAL / TREASURE', width / 2, 110);

  ctx.fillStyle = '#7fd4ff';
  ctx.font = '16px Georgia, serif';
  ctx.fillText('Select one relic to strengthen your sect for the upcoming trials:', width / 2, 150);

  const choices = world.currentRelicChoices || [];
  const startX = width / 2 - 270;
  choices.forEach((relic, idx) => {
    const rx = startX + idx * 190;
    const ry = 210;
    const rw = 170;
    const rh = 300;

    // Card background
    ctx.fillStyle = '#141d38';
    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.strokeRect(rx, ry, rw, rh);

    // Glyph icon
    ctx.font = '36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(relic.glyph, rx + rw / 2, ry + 60);

    // Name
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 15px Georgia, serif';
    wrapText(ctx, relic.name, rx + rw / 2, ry + 110, rw - 20, 20);

    // Description
    ctx.fillStyle = '#e2ecff';
    ctx.font = '12px monospace';
    wrapText(ctx, relic.description, rx + rw / 2, ry + 165, rw - 20, 18);

    // Pick instruction
    ctx.fillStyle = '#50fa7b';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('[ Click to Pick ]', rx + rw / 2, ry + 260);
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
  ctx.fillStyle = 'rgba(6, 8, 19, 0.88)';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 50px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', width / 2, height / 2 - 30);

  ctx.fillStyle = '#e2ecff';
  ctx.font = '17px Georgia, serif';
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
  ctx.fillStyle = 'rgba(15, 8, 8, 0.92)';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#ff4a4a';
  ctx.font = 'bold 56px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('ALTAR FALLEN', width / 2, height / 2 - 90);

  const grade = getGrade(world.score);
  ctx.fillStyle = grade === 'S' ? '#ffd700' : '#ffb347';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText(`Final Score: ${world.score} | Grade: ${grade} | Nights: ${world.currentNight}`, width / 2, height / 2 - 35);

  ctx.fillStyle = '#ffd700';
  ctx.font = '16px monospace';
  ctx.fillText(`Best Record: ${world.bestScore}`, width / 2, height / 2 + 10);

  if (world.newBest) {
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText('★ NEW SECT RECORD! ★', width / 2, height / 2 + 50);
  }

  ctx.fillStyle = '#e2ecff';
  ctx.font = '16px Georgia, serif';
  ctx.fillText('Press R / Enter to Reincarnate / Restart', width / 2, height / 2 + 100);
  ctx.textAlign = 'left';
}

function renderVictoryOverlay(ctx, world) {
  const { width, height } = CONFIG;
  ctx.fillStyle = 'rgba(8, 15, 30, 0.94)';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 54px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('ASCENSION ACHIEVED', width / 2, height / 2 - 90);

  const grade = getGrade(world.score);
  ctx.fillStyle = grade === 'S' ? '#ffd700' : '#50fa7b';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText(`Score: ${world.score} | Grade: ${grade} | All 10 Nights Cleared`, width / 2, height / 2 - 35);

  ctx.fillStyle = '#ffd700';
  ctx.font = '16px monospace';
  ctx.fillText(`Best Record: ${world.bestScore} | Demons Vanquished: ${world.kills || 0}`, width / 2, height / 2 + 10);

  if (world.newBest) {
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText('★ NEW SECT RECORD! ★', width / 2, height / 2 + 50);
  }

  ctx.fillStyle = '#e2ecff';
  ctx.font = '16px Georgia, serif';
  ctx.fillText('Press R / Enter to Begin New Cycle', width / 2, height / 2 + 100);
  ctx.textAlign = 'left';
}
