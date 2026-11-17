export const CONFIG = {
  width: 1280,
  height: 720,
  palette: {
    altarGold: '#ffb347',
    spiritOrange: '#ff7a1a',
    spiritBlue: '#7fd4ff',
    nightBlue: '#0b1026',
    demonPurple: '#6b4fa1',
    groundDark: '#111836',
    grassGreen: '#1b284f',
    pathGray: '#3a4466',
    stoneBorder: '#4f5d8a',
    snowWhite: '#e2ecff',
    goldGlow: '#ffd700',
    violetGlow: '#ba55d3',
    qiGreen: '#50fa7b'
  },
  altarMaxHp: 20,
  startingSpiritStones: 120,
  baseFormationRadius: 180,
  formationRadiusStep: 40,
  formationCosts: [40, 60, 90, 130, 180, 240, 310, 400],
  cultivators: {
    1: { id: 1, name: 'Sword Cultivator', cost: 50, range: 110, damage: 12, fireRate: 1.0, type: 'sword' },
    2: { id: 2, name: 'Talisman Master', cost: 30, range: 45, damage: 8, fireRate: 1.5, type: 'talisman' },
    3: { id: 3, name: 'Formation Keeper', cost: 40, range: 45, durability: 60, fireRate: 2.0, type: 'keeper' }
  },
  realms: [
    { name: 'Qi Refining', threshold: 0, badge: '炼', mult: 1.0, rangeMult: 1.0, color: 'rgba(255,215,0,0.3)' },
    { name: 'Foundation Est.', threshold: 4, badge: '筑', mult: 1.2, rangeMult: 1.1, color: 'rgba(255,165,0,0.4)' },
    { name: 'Golden Core', threshold: 10, badge: '丹', mult: 1.4, rangeMult: 1.2, color: 'rgba(186,85,211,0.5)' },
    { name: 'Nascent Soul', threshold: 20, badge: '婴', mult: 1.6, rangeMult: 1.3, color: 'rgba(255,255,255,0.7)' }
  ],
  demons: {
    lesser: { name: 'Lesser Evil Spirit', hp: 1, speed: 70, value: 8, damage: 1, size: 10 },
    snake: { name: 'Snake Demon', hp: 2, speed: 95, value: 12, damage: 1, size: 12 },
    fox: { name: 'Fox Spirit', hp: 6, speed: 50, value: 25, damage: 3, size: 18 }
  },
  nights: [
    { night: 1, waves: 2, boss: false },
    { night: 2, waves: 3, boss: false },
    { night: 3, waves: 3, boss: false },
    { night: 4, waves: 3, boss: false },
    { night: 5, waves: 3, boss: true, bossName: 'Serpent Demon King' },
    { night: 6, waves: 3, boss: false },
    { night: 7, waves: 3, boss: false },
    { night: 8, waves: 3, boss: false },
    { night: 9, waves: 3, boss: false },
    { night: 10, waves: 3, boss: true, bossName: 'Nine-Tailed Fox Spirit' }
  ]
};
