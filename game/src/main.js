import { CONFIG } from './config.js';
import { tileAt, isBuildable, createMapGrid } from './map.js';
import { initInput, inputState } from './input.js';
import { 
  createWorld, updateWorld, startWave, addCultivator, 
  removeCultivator, triggerBreakthrough, recomputeSynergies, advanceNight, getFormationRadius 
} from './world.js';
import { createBoss } from './boss.js';
import { render } from './render.js';
import { initAudio, toggleAudioMute } from './audio.js';

const urlParams = new URLSearchParams(window.location.search);
const seedParam = parseInt(urlParams.get('seed') || '12345', 10);
const shotParam = urlParams.get('shot'); // 'start', 'play', 'boss', 'end'

const world = createWorld(seedParam);

// Handle ?shot= hooks for screenshot generation
// Staging rule: floating numbers pushed AFTER the pre-sim use a long life
// (30s) so they are still visible when headless Chrome captures the frame.
function stageFloat(world, text, x, y, color) {
  world.floatingNumbers.push({ text, x, y, life: 30, maxLife: 30, color: color || '#ffd700' });
}

if (shotParam) {
  if (shotParam === 'start') {
    world.state = 'title';
    world.bestScore = 8650;
  } else if (shotParam === 'play') {
    world.state = 'playing';
    world.currentNight = 6;
    world.currentWave = 2;
    world.score = 2480;
    world.spiritStones = 600;
    world.formationLevel = 3;
    // 6 cultivators: 3-sword Flying Sword line (row 7) + Sealing Array pair
    // + 2 more swords, one in breakthrough (flame icon).
    const t1 = world.grid[7][22];
    addCultivator(world, t1, 1);
    t1.cultivator.level = 3;
    const t2 = world.grid[7][23];
    addCultivator(world, t2, 1);
    t2.cultivator.level = 3;
    const t3 = world.grid[7][24];
    addCultivator(world, t3, 1);
    t3.cultivator.level = 3;
    t3.cultivator.breakthrough = true;
    const t4 = world.grid[6][23];
    addCultivator(world, t4, 2);
    t4.cultivator.level = 2;
    const t5 = world.grid[6][22];
    addCultivator(world, t5, 1);
    t5.cultivator.level = 2;
    const t6 = world.grid[6][24];
    addCultivator(world, t6, 1);
    t6.cultivator.level = 2;

    recomputeSynergies(world);

    // Staging only: show owned manuals in the right HUD panel (display only —
    // no apply(), so no gameplay bonuses).
    world.ownedRelics = ['sword_scripture', 'spirit_gathering'];

    // Flood the path: late cluster near the formation (in sword range, so
    // combat is live) plus a mid-path stream. High HP + slow speeds so the
    // horde survives the pre-sim and the live seconds after load.
    const demonSpawns = [
      // dist, type, hp, speed — late cluster on the final approach
      [1480, 'snake', 200, 55], [1540, 'fox', 240, 45], [1600, 'snake', 200, 55],
      [1660, 'fox', 240, 45], [1710, 'snake', 200, 50], [1760, 'fox', 240, 45],
      [1800, 'snake', 200, 50],
      // mid-path stream
      [700, 'snake', 200, 70], [800, 'fox', 240, 50], [900, 'snake', 200, 70],
      [1000, 'fox', 240, 50], [1100, 'snake', 200, 70], [1200, 'fox', 240, 50],
      [1300, 'snake', 200, 70], [1400, 'fox', 240, 50],
      // early stragglers
      [320, 'snake', 200, 70], [420, 'fox', 240, 50]
    ];
    for (const [d, type, hp, spd] of demonSpawns) {
      const pos = { x: 0, y: 360 };
      world.demons.push({
        x: pos.x, y: pos.y, dist: d, speed: spd, hp, maxHp: hp,
        value: 20, damage: 1, boss: false, type, slowTimer: 0
      });
    }

    // Short pre-sim: enough for swords to fire and projectiles to fly, short
    // enough that nothing dies or reaches the altar.
    for (let s = 0; s < 25; s++) {
      updateWorld(world, 0.02, null);
    }

    // Fresh, long-life combat text + particles + wisps at capture time.
    stageFloat(world, 'Flying Sword Formation!', 640, 300, '#ffd700');
    stageFloat(world, 'Sealing Array!', 640, 330, '#7fd4ff');
    stageFloat(world, 'BREAKTHROUGH!', 940, 200, '#ff7a1a');
    stageFloat(world, '-48', 880, 330, '#ffd700');
    stageFloat(world, '-36', 940, 380, '#ffd700');
    stageFloat(world, '-52', 780, 470, '#ff7a1a');
    stageFloat(world, '-29', 820, 520, '#ffd700');
    world.spiritWisps.push(
      { x: 700, y: 420, life: 6, maxLife: 6, value: 6 },
      { x: 860, y: 480, life: 6, maxLife: 6, value: 6 }
    );
  } else if (shotParam === 'boss') {
    world.state = 'playing';
    world.currentNight = 10;
    world.currentWave = 3;
    world.score = 7200;
    world.bossActive = true;
    world.bossName = 'NINE-TAILED FOX SPIRIT';
    world.formationLevel = 3;
    world.spiritStones = 600;

    const t1 = world.grid[7][23];
    addCultivator(world, t1, 1);
    t1.cultivator.level = 3;
    t1.cultivator.breakthrough = true;

    const t2 = world.grid[7][24];
    addCultivator(world, t2, 2);
    t2.cultivator.level = 3;
    t2.cultivator.stunTimer = 2.5;

    const t3 = world.grid[6][24];
    addCultivator(world, t3, 1);
    t3.cultivator.level = 2;
    t3.cultivator.breakthrough = true;

    const t4 = world.grid[6][23];
    addCultivator(world, t4, 1);
    t4.cultivator.level = 2;

    recomputeSynergies(world);

    // Staging only: show owned manuals in the right HUD panel (display only —
    // no apply(), so no gameplay bonuses).
    world.ownedRelics = ['fox_slaying', 'guardian_manual'];

    // Boss staged ON the final approach (dist 1650 -> x~830, y 360), right
    // at the formation edge next to the cultivators, phase 2 (60% HP).
    const bossObj = createBoss(10);
    bossObj.hp = 360;
    bossObj.phase = 2;
    bossObj.dist = 1650;
    world.demons.push(bossObj);
    world.bossHp = 360;
    world.bossMaxHp = 600;

    // Fox minions trailing the boss up the vertical segment, clearly visible.
    for (let m = 0; m < 3; m++) {
      world.demons.push({
        x: 820, y: 400 + m * 40, dist: 1600 - m * 50, speed: 55,
        hp: 60, maxHp: 60, value: 25, damage: 3, boss: false, type: 'fox', slowTimer: 0
      });
    }
    // Two extra snakes mid-path for density.
    world.demons.push(
      { x: 480, y: 400, dist: 900, speed: 70, hp: 120, maxHp: 120, value: 12, damage: 1, boss: false, type: 'snake', slowTimer: 0 },
      { x: 480, y: 560, dist: 1150, speed: 70, hp: 120, maxHp: 120, value: 12, damage: 1, boss: false, type: 'snake', slowTimer: 0 }
    );

    for (let s = 0; s < 25; s++) {
      updateWorld(world, 0.02, null);
    }

    stageFloat(world, 'NINE-TAIL BARRAGE!', 560, 200, '#ffd700');
    stageFloat(world, 'DAZED!', 1060, 245, '#ffd700');
    stageFloat(world, '-48', 700, 250, '#ffd700');
    stageFloat(world, '-36', 950, 430, '#ff7a1a');
    stageFloat(world, 'BREAKTHROUGH!', 860, 215, '#ff7a1a');
    world.screenShake = 0.3;
  } else if (shotParam === 'end') {
    world.state = 'victory';
    world.currentNight = 10;
    world.score = 8650;
    world.kills = 247;
    world.bestScore = 8650;
    world.newBest = true;
    // Staging only: show owned manuals in the right HUD panel (display only).
    world.ownedRelics = ['fox_slaying', 'guardian_manual'];
  }
}

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
initInput(canvas);

// Audio trigger on first user gesture
window.addEventListener('click', () => { initAudio(); }, { once: true });
window.addEventListener('keydown', () => { initAudio(); }, { once: true });

let lastTime = performance.now();

function gameLoop(timestamp) {
  const dt = Math.min(0.1, (timestamp - lastTime) / 1000);
  lastTime = timestamp;

  // Update hovered tile
  world.hoveredTile = tileAt(world.grid, inputState.mousePos.x, inputState.mousePos.y);

  // Keyboard controls
  if (inputState.consumeKey('p')) {
    if (world.state === 'playing') world.state = 'paused';
    else if (world.state === 'paused') world.state = 'playing';
  }
  if (inputState.consumeKey('r')) {
    resetGame();
  }
  // Enter restarts from the end screens (victory / game over) only.
  if ((world.state === 'victory' || world.state === 'gameover') && inputState.consumeKey('enter')) {
    resetGame();
  }
  if (inputState.consumeKey('m')) {
    toggleAudioMute();
  }
  if (inputState.consumeKey('num1')) inputState.selectedCultivatorType = 1;
  if (inputState.consumeKey('num2')) inputState.selectedCultivatorType = 2;
  if (inputState.consumeKey('num3')) inputState.selectedCultivatorType = 3;

  if (inputState.consumeKey('g')) {
    // Expand formation
    if (world.formationLevel <= CONFIG.formationCosts.length) {
      let cost = CONFIG.formationCosts[world.formationLevel - 1];
      if (world.relicBonuses.formationDiscount) cost = Math.floor(cost * 0.8);
      if (world.spiritStones >= cost) {
        world.spiritStones -= cost;
        world.formationLevel++;
      }
    }
  }

  if (inputState.consumeKey('f')) {
    if (world.selectedTile && world.selectedTile.cultivator) {
      triggerBreakthrough(world, world.selectedTile.cultivator);
    }
  }

  if (world.state === 'title') {
    if (inputState.consumeClick() || inputState.consumeKey('space') || inputState.consumeKey('enter') || inputState.consumeKey('esc')) {
      world.state = 'build';
    }
  } else if (world.state === 'build') {
    if (inputState.consumeClick()) {
      const tile = world.hoveredTile;
      if (tile) {
        if (tile.cultivator) {
          world.selectedTile = tile;
        } else if (isBuildable(tile)) {
          addCultivator(world, tile, inputState.selectedCultivatorType);
        }
      }
    }
    if (inputState.consumeRightClick()) {
      const tile = world.hoveredTile;
      if (tile && tile.cultivator) {
        removeCultivator(world, tile);
        world.selectedTile = null;
      }
    }
    if (inputState.consumeKey('space')) {
      startWave(world);
    }
  } else if (world.state === 'relics') {
    if (inputState.consumeClick()) {
      const mx = inputState.mousePos.x;
      const my = inputState.mousePos.y;
      const choices = world.currentRelicChoices || [];
      const startX = CONFIG.width / 2 - 270;
      choices.forEach((relic, idx) => {
        const rx = startX + idx * 190;
        const ry = 230;
        const rw = 170;
        const rh = 280;
        if (mx >= rx && mx <= rx + rw && my >= ry && my <= ry + rh) {
          relic.apply(world);
          world.ownedRelics.push(relic.id);
          advanceNight(world);
        }
      });
    }
  } else if (world.state === 'playing') {
    updateWorld(world, dt, inputState);
  }

  // Update DOM HUD elements
  document.getElementById('night').textContent = world.currentNight;
  document.getElementById('wave').textContent = world.currentWave;
  document.getElementById('stones').textContent = world.spiritStones;
  document.getElementById('altar').textContent = world.altarHp;
  document.getElementById('score').textContent = world.score;
  document.getElementById('formation-level').textContent = world.formationLevel;

  const altarFill = document.getElementById('altar-fill');
  if (altarFill) {
    const altarPct = Math.max(0, Math.min(100, (world.altarHp / CONFIG.altarMaxHp) * 100));
    altarFill.style.width = altarPct + '%';
  }

  let spiritCount = 0;
  let snakeCount = 0;
  let foxCount = 0;
  world.demons.forEach(d => {
    if (d.type === 'snake') snakeCount++;
    else if (d.type === 'fox' || d.type === 'fox_boss') foxCount++;
    else spiritCount++;
  });
  const qSpirits = document.getElementById('q-spirits');
  const qSnakes = document.getElementById('q-snakes');
  const qFoxes = document.getElementById('q-foxes');
  const qStatus = document.getElementById('q-status');
  if (qSpirits) qSpirits.textContent = spiritCount;
  if (qSnakes) qSnakes.textContent = snakeCount;
  if (qFoxes) qFoxes.textContent = foxCount;
  if (qStatus) {
    if (world.state === 'playing') {
      qStatus.textContent = world.bossActive ? '⚠️ BOSS INCOMING' : (world.demons.length > 0 ? '⚔️ Combat Active' : 'Wave Cleared');
      qStatus.style.color = world.bossActive ? '#ff4a4a' : '#50fa7b';
    } else if (world.state === 'build') {
      qStatus.textContent = `Night ${world.currentNight} Build Phase`;
      qStatus.style.color = '#ffd700';
    } else {
      qStatus.textContent = world.state.toUpperCase();
      qStatus.style.color = '#7fd4ff';
    }
  }

  const relicListEl = document.getElementById('relic-list');
  if (relicListEl) {
    if (world.ownedRelics && world.ownedRelics.length > 0) {
      relicListEl.innerHTML = world.ownedRelics.map(id => {
        const rName = id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return `• ${rName}`;
      }).join('<br>');
    } else {
      relicListEl.textContent = '— None acquired —';
    }
  }

  const realmHighlightEl = document.getElementById('realm-highlight');
  if (realmHighlightEl) {
    let highestLevel = 0;
    world.cultivators.forEach(c => {
      if (c.level > highestLevel) highestLevel = c.level;
    });
    const realmObj = CONFIG.realms[highestLevel] || CONFIG.realms[0];
    realmHighlightEl.textContent = `${realmObj.name} (${realmObj.badge})`;
  }

  const bossBarContainer = document.getElementById('boss-bar-container');
  const bossBar = document.getElementById('boss-bar');
  if (world.bossActive) {
    bossBarContainer.style.display = 'block';
    const pct = Math.max(0, Math.min(100, (world.bossHp / world.bossMaxHp) * 100));
    bossBar.style.width = pct + '%';
  } else {
    bossBarContainer.style.display = 'none';
  }

  render(ctx, world);

  requestAnimationFrame(gameLoop);
}

function resetGame() {
  world.state = 'build';
  world.currentNight = 1;
  world.currentWave = 1;
  world.spiritStones = CONFIG.startingSpiritStones;
  world.altarHp = CONFIG.altarMaxHp;
  world.score = 0;
  world.kills = 0;
  world.formationLevel = 1;
  world.grid = createMapGrid();
  world.cultivators = [];
  world.demons = [];
  world.projectiles = [];
  world.spiritWisps = [];
  world.ownedRelics = [];
  world.currentRelicChoices = [];
  world.relicBonuses = {};
  world.bossActive = false;
}

requestAnimationFrame(gameLoop);
