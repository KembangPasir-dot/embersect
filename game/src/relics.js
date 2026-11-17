// Cultivator Manuals & Treasures (Relics) for EMBERSECT

export const RELICS = [
  {
    id: 'sword_scripture',
    name: 'Sword Scripture',
    glyph: '⚔️',
    description: 'All Sword Cultivators gain +25% attack damage.',
    apply(world) {
      world.relicBonuses.swordDamageMult = (world.relicBonuses.swordDamageMult || 1.0) + 0.25;
    }
  },
  {
    id: 'talisman_codex',
    name: 'Talisman Codex',
    glyph: '📜',
    description: 'Talisman seals deal +50% damage and trigger faster.',
    apply(world) {
      world.relicBonuses.talismanDamageMult = (world.relicBonuses.talismanDamageMult || 1.0) + 0.50;
      world.relicBonuses.talismanSpeedMult = (world.relicBonuses.talismanSpeedMult || 1.0) + 0.25;
    }
  },
  {
    id: 'iron_wall',
    name: 'Iron Wall Sutra',
    glyph: '🛡️',
    description: 'Formation Keepers gain +50 maximum durability.',
    apply(world) {
      world.relicBonuses.keeperDurabilityBonus = (world.relicBonuses.keeperDurabilityBonus || 0) + 50;
      world.cultivators.forEach(c => {
        if (c.typeId === 3) {
          c.maxDurability += 50;
          c.durability += 50;
        }
      });
    }
  },
  {
    id: 'spirit_gathering',
    name: 'Spirit Gathering Array',
    glyph: '💎',
    description: '+30% spirit stones gained from demon kills.',
    apply(world) {
      world.relicBonuses.stoneMult = (world.relicBonuses.stoneMult || 1.0) + 0.30;
    }
  },
  {
    id: 'wisp_lure',
    name: 'Wisp Lure',
    glyph: '✨',
    description: 'Spirit wisps drift slower and last 9 seconds.',
    apply(world) {
      world.relicBonuses.wispLure = true;
      world.spiritWisps.forEach(w => {
        w.maxLife = 9.0;
        w.life = Math.max(w.life, 9.0);
      });
    }
  },
  {
    id: 'breakthrough_pill',
    name: 'Breakthrough Pill',
    glyph: '💊',
    description: 'Breakthrough costs 15 stones instead of 25, no seclusion.',
    apply(world) {
      world.relicBonuses.cheapBreakthrough = true;
    }
  },
  {
    id: 'sect_treasury',
    name: 'Sect Treasury',
    glyph: '💰',
    description: 'Gain +150 spirit stones immediately.',
    apply(world) {
      world.spiritStones += 150;
    }
  },
  {
    id: 'realm_insight',
    name: 'Realm Insight',
    glyph: '🧠',
    description: 'All current cultivators gain +2 kills of XP immediately.',
    apply(world) {
      world.cultivators.forEach(c => {
        c.xp += 2;
      });
    }
  },
  {
    id: 'fox_slaying',
    name: 'Fox-Slaying Blade',
    glyph: '🦊',
    description: '+50% damage dealt to Fox Spirits and Bosses.',
    apply(world) {
      world.relicBonuses.bossFoxDamageMult = (world.relicBonuses.bossFoxDamageMult || 1.0) + 0.50;
    }
  },
  {
    id: 'guardian_manual',
    name: 'Guardian Formation Manual',
    glyph: '🏮',
    description: 'Formation expansion costs 20% fewer spirit stones.',
    apply(world) {
      world.relicBonuses.formationDiscount = true;
    }
  }
];

// Pick 3 random distinct relics that the player does not already own
export function getRandomRelics(world, count = 3) {
  const owned = world.ownedRelics || [];
  const available = RELICS.filter(r => !owned.includes(r.id));
  const shuffled = [...available].sort(() => world.rng() - 0.5);
  return shuffled.slice(0, count);
}
