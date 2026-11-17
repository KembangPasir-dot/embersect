import { HEARTH_POS, pointOnPath, getPathTotalLength } from './map.js';
import { spawnFloatingNumber, spawnParticleBurst } from './world.js';
import { playBossAlarm, playSwordSlash } from './audio.js';

export function createBoss(night) {
  if (night === 5) {
    return {
      type: 'serpent',
      name: 'SERPENT DEMON KING',
      hp: 300,
      maxHp: 300,
      speed: 35,
      damage: 5,
      value: 500,
      boss: true,
      dist: 0,
      x: -30,
      y: 360,
      venomTimer: 6.0,
      shedded: false,
      invulnTimer: 0,
      slowTimer: 0
    };
  } else if (night === 10) {
    return {
      type: 'fox_boss',
      name: 'NINE-TAILED FOX SPIRIT',
      hp: 600,
      maxHp: 600,
      speed: 30,
      damage: 10,
      value: 500,
      boss: true,
      dist: 0,
      x: -30,
      y: 360,
      phase: 1,
      barrageTimer: 20.0,
      tails: 9,
      minionsSpawned: false,
      invulnTimer: 0,
      slowTimer: 0
    };
  }
  return null;
}

export function updateBoss(world, boss, dt) {
  if (!boss) return;

  if (boss.invulnTimer > 0) {
    boss.invulnTimer -= dt;
  }

  const pathLen = getPathTotalLength();
  let spd = boss.speed;
  if (boss.slowTimer > 0) {
    spd *= 0.5;
    boss.slowTimer -= dt;
  }
  boss.dist += spd * dt;
  const pos = pointOnPath(boss.dist);
  boss.x = pos.x;
  boss.y = pos.y;

  if (boss.type === 'serpent') {
    // Shed skin at 50% HP
    if (!boss.shedded && boss.hp <= boss.maxHp * 0.5) {
      boss.shedded = true;
      boss.invulnTimer = 1.5;
      boss.speed *= 1.3;
      playBossAlarm();
      spawnFloatingNumber(world, 'SERPENT SHEDS SKIN!', boss.x, boss.y - 30, '#2ecc71');
      spawnParticleBurst(world, boss.x, boss.y, '#2ecc71', 15);
    }

    // Venom spit every 6s
    boss.venomTimer -= dt;
    if (boss.venomTimer <= 0) {
      boss.venomTimer = 6.0;
      if (world.cultivators.length > 0) {
        const targetCultivator = world.cultivators[Math.floor(world.rng() * world.cultivators.length)];
        targetCultivator.poisonTimer = 5.0; // poisoned for 5s (-50% damage)
        spawnFloatingNumber(world, 'VENOM POISON!', targetCultivator.x, targetCultivator.y - 20, '#2ecc71');
        spawnParticleBurst(world, targetCultivator.x, targetCultivator.y, '#2ecc71', 6);
      }
    }
  } else if (boss.type === 'fox_boss') {
    // Phase 2 at 66%, Phase 3 at 33%
    const hpPct = boss.hp / boss.maxHp;
    if (hpPct <= 0.33 && boss.phase < 3) {
      boss.phase = 3;
      boss.speed *= 1.25;
      boss.barrageTimer = 12.0;
      playBossAlarm();
      spawnFloatingNumber(world, 'FOX VIOLET AURA (PHASE 3)!', boss.x, boss.y - 30, '#ba55d3');
      spawnParticleBurst(world, boss.x, boss.y, '#ba55d3', 20);
      if (!boss.minionsSpawned) {
        boss.minionsSpawned = true;
        // Spawn 2 fox spirits as minions
        for (let m = 0; m < 2; m++) {
          world.demons.push({
            x: boss.x - 30 - m * 25,
            y: boss.y,
            dist: Math.max(0, boss.dist - 40 - m * 25),
            speed: 55,
            hp: 20,
            maxHp: 20,
            value: 25,
            damage: 3,
            boss: false,
            type: 'fox',
            slowTimer: 0
          });
        }
      }
    } else if (hpPct <= 0.66 && hpPct > 0.33 && boss.phase < 2) {
      boss.phase = 2;
      boss.speed *= 1.25;
      boss.barrageTimer = 15.0;
      playBossAlarm();
      spawnFloatingNumber(world, 'FOX EYES GLOW RED (PHASE 2)!', boss.x, boss.y - 30, '#ff4a4a');
      spawnParticleBurst(world, boss.x, boss.y, '#ff4a4a', 15);
    }

    // Nine-Tail Barrage
    boss.barrageTimer -= dt;
    if (boss.barrageTimer <= 0) {
      boss.barrageTimer = boss.phase === 3 ? 12.0 : (boss.phase === 2 ? 15.0 : 20.0);
      spawnFloatingNumber(world, 'NINE-TAIL BARRAGE!', boss.x, boss.y - 35, '#ffd700');
      playSwordSlash();
      // Stun cultivators
      world.cultivators.forEach(c => {
        if (Math.hypot(c.x - boss.x, c.y - boss.y) < 280) {
          c.stunTimer = 3.0; // stunned for 3s
          spawnFloatingNumber(world, 'DAZED!', c.x, c.y - 15, '#ffd700');
          spawnParticleBurst(world, c.x, c.y, '#ffd700', 5);
        }
      });
    }
  }
}
