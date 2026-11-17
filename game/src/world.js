import { CONFIG } from './config.js';
import { createMapGrid, tileAt, isBuildable, pointOnPath, getPathTotalLength, HEARTH_POS } from './map.js';
import { getRandomRelics } from './relics.js';
import { createBoss, updateBoss } from './boss.js';
import { 
  playSwordSlash, playTalismanDetonate, playDemonDeath, 
  playRealmUp, playBreakthrough, playWispCollect, playWispAltar, 
  playWaveClear, playNightClear, playAltarHit, playBossAlarm 
} from './audio.js';

export function createWorld(seed) {
  return {
    state: 'title', // 'title', 'build', 'playing', 'paused', 'relics', 'gameover', 'victory'
    time: 0,
    currentNight: 1,
    currentWave: 1,
    spiritStones: CONFIG.startingSpiritStones,
    altarHp: CONFIG.altarMaxHp,
    score: 0,
    kills: 0,
    formationLevel: 1,
    grid: createMapGrid(),
    cultivators: [],
    demons: [],
    projectiles: [],
    spiritWisps: [],
    floatingNumbers: [],
    particles: [],
    activeSynergies: [],
    synergyLinks: [],
    selectedTile: null,
    muted: false,
    bossActive: false,
    bossMaxHp: 100,
    bossHp: 100,
    bossName: '',
    relicBonuses: {},
    ownedRelics: [],
    currentRelicChoices: [],
    screenShake: 0,
    bestScore: parseInt(localStorage.getItem('embersect-best') || '0', 10),
    newBest: false,
    rng: createRng(seed)
  };
}

function createRng(seed) {
  let s = (seed || 12345) >>> 0;
  return function() {
    s += 0x6D2B79F5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getFormationRadius(world) {
  return CONFIG.baseFormationRadius + (world.formationLevel - 1) * CONFIG.formationRadiusStep;
}

export function isInsideFormation(world, x, y) {
  const r = getFormationRadius(world);
  return Math.hypot(x - HEARTH_POS.x, y - HEARTH_POS.y) <= r;
}

export function recomputeSynergies(world) {
  world.activeSynergies = [];
  world.synergyLinks = [];
  const cultivators = world.cultivators;

  cultivators.forEach(c => {
    c.synergyDamageBonus = 0;
    c.synergySlowBonus = 0;
    c.synergyDurabilityBonus = 0;
  });

  // 1. Flying Sword Formation: 3 sword cultivators in a straight line
  for (let r = 0; r < world.grid.length; r++) {
    for (let c = 0; c < world.grid[0].length - 2; c++) {
      const t1 = world.grid[r][c];
      const t2 = world.grid[r][c+1];
      const t3 = world.grid[r][c+2];
      if (t1.cultivator && t2.cultivator && t3.cultivator &&
          t1.cultivator.typeId === 1 && t2.cultivator.typeId === 1 && t3.cultivator.typeId === 1) {
        if (!world.activeSynergies.includes('Flying Sword Formation')) {
          world.activeSynergies.push('Flying Sword Formation');
        }
        t1.cultivator.synergyDamageBonus = 0.25;
        t2.cultivator.synergyDamageBonus = 0.25;
        t3.cultivator.synergyDamageBonus = 0.25;
        world.synergyLinks.push({ x1: t1.x, y1: t1.y, x2: t3.x, y2: t3.y });
      }
    }
  }
  for (let c = 0; c < world.grid[0].length; c++) {
    for (let r = 0; r < world.grid.length - 2; r++) {
      const t1 = world.grid[r][c];
      const t2 = world.grid[r+1][c];
      const t3 = world.grid[r+2][c];
      if (t1.cultivator && t2.cultivator && t3.cultivator &&
          t1.cultivator.typeId === 1 && t2.cultivator.typeId === 1 && t3.cultivator.typeId === 1) {
        if (!world.activeSynergies.includes('Flying Sword Formation')) {
          world.activeSynergies.push('Flying Sword Formation');
        }
        t1.cultivator.synergyDamageBonus = 0.25;
        t2.cultivator.synergyDamageBonus = 0.25;
        t3.cultivator.synergyDamageBonus = 0.25;
        world.synergyLinks.push({ x1: t1.x, y1: t1.y, x2: t3.x, y2: t3.y });
      }
    }
  }

  // 2. Sealing Array: Sword cultivator adjacent to Talisman Master
  cultivators.forEach(c1 => {
    if (c1.typeId === 1) {
      cultivators.forEach(c2 => {
        if (c2.typeId === 2) {
          const dist = Math.abs(c1.col - c2.col) + Math.abs(c1.row - c2.row);
          if (dist === 1) {
            if (!world.activeSynergies.includes('Sealing Array')) {
              world.activeSynergies.push('Sealing Array');
            }
            c1.synergySlowBonus = 0.3;
            c2.synergySlowBonus = 0.3;
            world.synergyLinks.push({ x1: c1.x, y1: c1.y, x2: c2.x, y2: c2.y });
          }
        }
      });
    }
  });

  // 3. Iron Wall Formation: 2+ adjacent Formation Keepers
  cultivators.forEach(c1 => {
    if (c1.typeId === 3) {
      cultivators.forEach(c2 => {
        if (c2 !== c1 && c2.typeId === 3) {
          const dist = Math.abs(c1.col - c2.col) + Math.abs(c1.row - c2.row);
          if (dist === 1) {
            if (!world.activeSynergies.includes('Iron Wall Formation')) {
              world.activeSynergies.push('Iron Wall Formation');
            }
            c1.synergyDurabilityBonus = 30;
            c2.synergyDurabilityBonus = 30;
            world.synergyLinks.push({ x1: c1.x, y1: c1.y, x2: c2.x, y2: c2.y });
          }
        }
      });
    }
  });
}

export function spawnFloatingNumber(world, text, x, y, color = '#ffb347') {
  world.floatingNumbers.push({ text, x, y, life: 0.7, maxLife: 0.7, color });
}

export function spawnParticleBurst(world, x, y, color = '#ffd700', count = 6) {
  for (let i = 0; i < count; i++) {
    const angle = world.rng() * Math.PI * 2;
    const speed = 20 + world.rng() * 40;
    world.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + world.rng() * 3,
      life: 0.5,
      maxLife: 0.5,
      color
    });
  }
}

export function addCultivator(world, tile, typeId) {
  const info = CONFIG.cultivators[typeId];
  if (!info || world.spiritStones < info.cost) return false;
  if (tile.cultivator) return false;
  if (!isInsideFormation(world, tile.x, tile.y)) return false;

  world.spiritStones -= info.cost;
  const baseDurability = (info.durability || 60) + (world.relicBonuses.keeperDurabilityBonus || 0);

  const cultivator = {
    typeId,
    name: info.name,
    col: tile.col,
    row: tile.row,
    x: tile.x,
    y: tile.y,
    level: 0,
    xp: 0,
    cooldown: 0,
    breakthrough: false,
    secluded: false,
    durability: baseDurability,
    maxDurability: baseDurability,
    synergyDamageBonus: 0,
    synergySlowBonus: 0,
    synergyDurabilityBonus: 0
  };
  tile.cultivator = cultivator;
  tile.tower = cultivator;
  world.cultivators.push(cultivator);
  recomputeSynergies(world);
  return true;
}

export function removeCultivator(world, tile) {
  if (!tile || !tile.cultivator) return;
  const idx = world.cultivators.indexOf(tile.cultivator);
  if (idx !== -1) {
    const info = CONFIG.cultivators[tile.cultivator.typeId];
    world.spiritStones += Math.floor(info.cost * 0.7);
    world.cultivators.splice(idx, 1);
    tile.cultivator = null;
    tile.tower = null;
    recomputeSynergies(world);
  }
}

export function triggerBreakthrough(world, cultivator) {
  if (!cultivator || cultivator.breakthrough || cultivator.secluded) return;
  const cost = world.relicBonuses.cheapBreakthrough ? 15 : 25;
  if (world.spiritStones < cost) return;
  world.spiritStones -= cost;
  cultivator.breakthrough = true;
  playBreakthrough();
  spawnFloatingNumber(world, 'BREAKTHROUGH!', cultivator.x, cultivator.y - 20, '#ff7a1a');
  spawnParticleBurst(world, cultivator.x, cultivator.y, '#ff7a1a', 10);
}

export function updateWorld(world, dt, input) {
  world.time += dt;

  if (world.screenShake > 0) {
    world.screenShake -= dt;
  }

  // Ambient formation embers & altar sparks (visual only, capped counts)
  if (world.rng() < 0.35 && world.particles.filter(p => p.isEmber).length < 35) {
    const angle = world.rng() * Math.PI * 2;
    const rad = world.rng() * getFormationRadius(world);
    const ex = HEARTH_POS.x + Math.cos(angle) * rad;
    const ey = HEARTH_POS.y + Math.sin(angle) * rad;
    world.particles.push({
      x: ex, y: ey,
      vx: (world.rng() - 0.5) * 12,
      vy: -25 - world.rng() * 25,
      size: 1.5 + world.rng() * 2,
      life: 1.5 + world.rng() * 1.5,
      maxLife: 3.0,
      color: world.rng() > 0.4 ? '#ffd700' : '#ff7a1a',
      isEmber: true
    });
  }
  if (world.rng() < 0.3 && world.particles.filter(p => p.isAltarSpark).length < 15) {
    world.particles.push({
      x: HEARTH_POS.x + (world.rng() - 0.5) * 35,
      y: HEARTH_POS.y + (world.rng() - 0.5) * 20,
      vx: (world.rng() - 0.5) * 18,
      vy: -35 - world.rng() * 30,
      size: 1 + world.rng() * 2,
      life: 0.8 + world.rng() * 0.8,
      maxLife: 1.6,
      color: '#ffb347',
      isAltarSpark: true
    });
  }

  // Update floating numbers
  for (let i = world.floatingNumbers.length - 1; i >= 0; i--) {
    const fn = world.floatingNumbers[i];
    fn.life -= dt;
    fn.y -= 20 * dt;
    if (fn.life <= 0) world.floatingNumbers.splice(i, 1);
  }

  // Update particles
  for (let i = world.particles.length - 1; i >= 0; i--) {
    const p = world.particles[i];
    p.life -= dt;
    if (p.isShockwave) {
      p.radius += (p.maxRadius - p.radius) * (dt * 10);
    } else {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    if (p.life <= 0) world.particles.splice(i, 1);
  }

  // Update spirit wisps
  for (let i = world.spiritWisps.length - 1; i >= 0; i--) {
    const w = world.spiritWisps[i];
    w.life -= dt;
    const angle = Math.atan2(HEARTH_POS.y - w.y, HEARTH_POS.x - w.x);
    const speed = world.relicBonuses.wispLure ? 35 : 60;
    w.x += Math.cos(angle) * speed * dt;
    w.y += Math.sin(angle) * speed * dt;

    if (input && input.clicked && Math.hypot(input.mousePos.x - w.x, input.mousePos.y - w.y) < 20) {
      world.spiritStones += w.value;
      playWispCollect();
      spawnFloatingNumber(world, `+${w.value} STONES`, w.x, w.y, '#ffd700');
      spawnParticleBurst(world, w.x, w.y, '#ffd700', 8);
      world.spiritWisps.splice(i, 1);
      input.clicked = false;
      continue;
    }

    if (Math.hypot(w.x - HEARTH_POS.x, w.y - HEARTH_POS.y) < 25) {
      world.altarHp = Math.min(CONFIG.altarMaxHp, world.altarHp + 1);
      playWispAltar();
      spawnFloatingNumber(world, '+1 ALTAR', HEARTH_POS.x, HEARTH_POS.y - 30, '#50fa7b');
      world.spiritWisps.splice(i, 1);
      continue;
    }

    if (w.life <= 0) world.spiritWisps.splice(i, 1);
  }

  if (world.state === 'playing') {
    const pathLen = getPathTotalLength();

    world.cultivators.forEach(c => {
      if (c.poisonTimer > 0) c.poisonTimer -= dt;
      if (c.stunTimer > 0) c.stunTimer -= dt;

      const inside = isInsideFormation(world, c.x, c.y);
      if (!inside || c.secluded || c.stunTimer > 0) return;

      c.cooldown -= dt;
      if (c.cooldown <= 0) {
        const info = CONFIG.cultivators[c.typeId];
        const realm = CONFIG.realms[c.level];
        const range = info.range * realm.rangeMult;

        if (c.typeId === 1) {
          let nearest = null;
          let minDist = range;
          world.demons.forEach(d => {
            const dist = Math.hypot(d.x - c.x, d.y - c.y);
            if (dist < minDist) {
              minDist = dist;
              nearest = d;
            }
          });

          if (nearest) {
            const speedMult = world.relicBonuses.talismanSpeedMult || 1.0;
            c.cooldown = 1 / (info.fireRate * speedMult * (1 + c.level * 0.1));
            let dmg = info.damage * realm.mult * (1 + c.synergyDamageBonus);
            if (c.poisonTimer > 0) dmg *= 0.5;
            if (c.breakthrough) dmg *= 2;
            dmg *= (world.relicBonuses.swordDamageMult || 1.0);
            if (nearest.boss || nearest.type === 'fox') {
              dmg *= (world.relicBonuses.bossFoxDamageMult || 1.0);
            }

            playSwordSlash();
            world.projectiles.push({
              x: c.x, y: c.y,
              target: nearest,
              speed: 400,
              damage: dmg,
              type: 'sword'
            });
          }
        } else if (c.typeId === 2) {
          let hit = false;
          world.demons.forEach(d => {
            if (!hit && Math.hypot(d.x - c.x, d.y - c.y) < range) {
              hit = true;
              const speedMult = world.relicBonuses.talismanSpeedMult || 1.0;
              c.cooldown = 1 / (info.fireRate * speedMult * (1 + c.level * 0.1));
              let dmg = info.damage * realm.mult * (1 + c.synergyDamageBonus);
              if (c.poisonTimer > 0) dmg *= 0.5;
              if (c.breakthrough) dmg *= 2;
              dmg *= (world.relicBonuses.talismanDamageMult || 1.0);
              if (d.boss || d.type === 'fox') {
                dmg *= (world.relicBonuses.bossFoxDamageMult || 1.0);
              }
              d.hp -= dmg;
              playTalismanDetonate();
              spawnFloatingNumber(world, Math.round(dmg), d.x, d.y - 15, '#ff7a1a');
              spawnParticleBurst(world, d.x, d.y, '#ff7a1a', 5);
              if (c.synergySlowBonus > 0) {
                d.slowTimer = 1.5;
              }
              if (d.hp <= 0) handleDemonDeath(world, d);
            }
          });
        } else if (c.typeId === 3) {
          world.demons.forEach(d => {
            if (Math.hypot(d.x - c.x, d.y - c.y) < 30) {
              d.slowTimer = 2.0;
            }
          });
        }
      }
    });

    // Update projectiles
    for (let i = world.projectiles.length - 1; i >= 0; i--) {
      const pr = world.projectiles[i];
      if (!pr.target || pr.target.hp <= 0) {
        world.projectiles.splice(i, 1);
        continue;
      }
      const angle = Math.atan2(pr.target.y - pr.y, pr.target.x - pr.x);
      pr.x += Math.cos(angle) * pr.speed * dt;
      pr.y += Math.sin(angle) * pr.speed * dt;

      if (Math.hypot(pr.target.x - pr.x, pr.target.y - pr.y) < 15) {
        pr.target.hp -= pr.damage;
        spawnFloatingNumber(world, Math.round(pr.damage), pr.target.x, pr.target.y - 15, '#ffd700');
        spawnParticleBurst(world, pr.target.x, pr.target.y, '#ffd700', 4);
        if (pr.target.hp <= 0) {
          handleDemonDeath(world, pr.target);
        }
        world.projectiles.splice(i, 1);
      }
    }

    // Update demons
    for (let i = world.demons.length - 1; i >= 0; i--) {
      const en = world.demons[i];
      if (en.boss) {
        updateBoss(world, en, dt);
        world.bossHp = en.hp;
        if (en.hp <= 0) {
          handleDemonDeath(world, en);
          world.bossActive = false;
        }
        continue;
      }
      let spd = en.speed;
      if (en.slowTimer > 0) {
        spd *= 0.5;
        en.slowTimer -= dt;
      }
      en.dist += spd * dt;
      const pos = pointOnPath(en.dist);
      en.x = pos.x;
      en.y = pos.y;

      if (en.dist >= pathLen) {
        world.altarHp -= en.damage;
        world.score = Math.max(0, world.score - 25);
        world.screenShake = 0.25;
        playAltarHit();
        spawnFloatingNumber(world, `-${en.damage} ALTAR`, HEARTH_POS.x, HEARTH_POS.y - 30, '#ff4a4a');
        world.demons.splice(i, 1);
        if (world.altarHp <= 0) {
          world.altarHp = 0;
          world.state = 'gameover';
          checkBestScore(world);
        }
      }
    }

    // Check wave completion
    if (world.demons.length === 0) {
      world.score += 50 + 15; // wave-clear bonus +15 stones/score
      world.spiritStones += 15;
      playWaveClear();

      world.cultivators.forEach(c => {
        if (c.secluded) c.secluded = false;
        if (c.breakthrough) {
          c.breakthrough = false;
          if (!world.relicBonuses.cheapBreakthrough) {
            c.secluded = true;
          }
        }
      });

      if (world.currentWave < CONFIG.nights[world.currentNight - 1].waves) {
        world.currentWave++;
        world.state = 'build';
      } else {
        // Night cleared
        world.score += 200;
        if (world.currentNight >= 10) {
          world.state = 'victory';
          checkBestScore(world);
        } else {
          // Offer Relics between nights
          world.currentRelicChoices = getRandomRelics(world, 3);
          if (world.currentRelicChoices.length > 0) {
            world.state = 'relics';
          } else {
            advanceNight(world);
          }
        }
      }
    }
  }
}

export function advanceNight(world) {
  world.currentNight++;
  world.currentWave = 1;
  world.spiritStones += 50 + world.currentNight * 15;
  world.state = 'build';
}

function handleDemonDeath(world, demon) {
  const idx = world.demons.indexOf(demon);
  if (idx !== -1) {
    world.demons.splice(idx, 1);
    world.kills++;
    playDemonDeath();
    const stoneBonus = world.relicBonuses.stoneMult || 1.0;
    const earnedStones = Math.round(demon.value * stoneBonus);
    world.spiritStones += earnedStones;
    world.score += 10 * (demon.boss ? 10 : 1);

    const wispLife = world.relicBonuses.wispLure ? 9.0 : 6.0;
    world.spiritWisps.push({
      x: demon.x,
      y: demon.y,
      life: wispLife,
      maxLife: wispLife,
      value: demon.boss ? 20 : 6
    });

    const burstSize = demon.type === 'fox' || demon.boss ? 14 : 8;
    spawnParticleBurst(world, demon.x, demon.y, demon.type === 'fox' || demon.boss ? '#ffd700' : '#ba55d3', burstSize);
    world.particles.push({
      x: demon.x, y: demon.y,
      radius: 6,
      maxRadius: demon.boss || demon.type === 'fox' ? 65 : 40,
      life: 0.45,
      maxLife: 0.45,
      color: demon.boss || demon.type === 'fox' ? '#ffd700' : '#ba55d3',
      isShockwave: true
    });
    if (demon.type === 'fox' || demon.boss) {
      world.screenShake = 0.2;
    }

    world.cultivators.forEach(c => {
      if (Math.hypot(demon.x - c.x, demon.y - c.y) < 200) {
        c.xp++;
        checkRealmUp(world, c);
      }
    });

    if (demon.boss) {
      world.score += 500;
      world.bossActive = false;
    }
  }
}

function checkRealmUp(world, cultivator) {
  const currentRealm = cultivator.level;
  if (currentRealm < CONFIG.realms.length - 1) {
    const nextRealmConfig = CONFIG.realms[currentRealm + 1];
    if (cultivator.xp >= nextRealmConfig.threshold) {
      cultivator.level++;
      playRealmUp();
      spawnFloatingNumber(world, `REALM: ${nextRealmConfig.name}!`, cultivator.x, cultivator.y - 25, '#ffd700');
      spawnParticleBurst(world, cultivator.x, cultivator.y, '#ffd700', 12);
    }
  }
}

export function startWave(world) {
  world.state = 'playing';
  const nightConfig = CONFIG.nights[world.currentNight - 1];
  const isBossWave = nightConfig.boss && world.currentWave === nightConfig.waves;
  world.bossActive = isBossWave;
  world.demons = [];

  if (world.bossActive) {
    playBossAlarm();
    const bossObj = createBoss(world.currentNight);
    if (bossObj) {
      world.demons.push(bossObj);
      world.bossName = bossObj.name;
      world.bossMaxHp = bossObj.maxHp;
      world.bossHp = bossObj.hp;
    }
  }

  const enemyCount = 8 + world.currentNight * 3 + (world.formationLevel - 1) * 2;
  const hpNightScale = Math.min(1.6, Math.pow(1.06, world.currentNight - 1));
  const speedNightScale = Math.min(1.3, 1 + (world.currentNight - 1) * 0.03);

  const rng = world.rng;
  for (let i = 0; i < enemyCount; i++) {
    let typeKey = 'lesser';
    const r = rng();
    if (world.currentNight >= 3 && r > 0.55) typeKey = 'fox';
    else if (world.currentNight >= 2 && r > 0.3) typeKey = 'snake';

    const baseDef = CONFIG.demons[typeKey];
    const hpMultiplier = (1 + (world.formationLevel - 1) * 0.08) * hpNightScale;
    const speedMultiplier = (world.formationLevel >= 3 ? 1.05 : 1.0) * speedNightScale;

    world.demons.push({
      x: -20 - i * 35,
      y: 360,
      dist: -i * 35,
      speed: baseDef.speed * speedMultiplier,
      hp: Math.round(baseDef.hp * hpMultiplier),
      maxHp: Math.round(baseDef.hp * hpMultiplier),
      value: baseDef.value,
      damage: baseDef.damage,
      boss: false,
      type: typeKey,
      slowTimer: 0
    });
  }
}

function checkBestScore(world) {
  if (world.score > world.bestScore) {
    world.bestScore = world.score;
    world.newBest = true;
    localStorage.setItem('embersect-best', world.bestScore.toString());
  }
}
