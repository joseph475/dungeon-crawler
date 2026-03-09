/**
 * Stage definitions and enemy generation.
 *
 * Every 10 stages is a BOSS stage (stage 10, 20, 30, ...).
 * Enemies scale exponentially — party must keep up with gear + jobs.
 *
 * Enemy base template (before stage scaling):
 *   hp: 60, atk: 8, def: 4, spd: 5
 *
 * Scaling formula:
 *   stat = base × (1 + stage × 0.18)^1.1
 * This produces gentle early scaling that becomes steep in high stages.
 */

// ─── Enemy name pools ────────────────────────────────────────────────────────

const ENEMY_POOLS = {
  // stages 1-9
  forest: [
    { name: 'Goblin Scout',    icon: '👺' },
    { name: 'Wild Boar',       icon: '🐗' },
    { name: 'Forest Sprite',   icon: '🧚' },
    { name: 'Mossy Slime',     icon: '🟢' },
    { name: 'Thorn Imp',       icon: '👿' },
  ],
  // stages 10-19
  cave: [
    { name: 'Cave Troll',      icon: '👹' },
    { name: 'Stone Golem',     icon: '🪨' },
    { name: 'Bat Swarm',       icon: '🦇' },
    { name: 'Dark Spider',     icon: '🕷️' },
    { name: 'Rock Crawler',    icon: '🦂' },
  ],
  // stages 20-29
  dungeon: [
    { name: 'Skeleton Archer', icon: '💀' },
    { name: 'Cursed Knight',   icon: '⚔️' },
    { name: 'Dungeon Rat',     icon: '🐀' },
    { name: 'Zombie Brute',    icon: '🧟' },
    { name: 'Shadow Wisp',     icon: '👻' },
  ],
  // stages 30-39
  fortress: [
    { name: 'Orc Warrior',     icon: '🐾' },
    { name: 'Iron Sentinel',   icon: '🤖' },
    { name: 'War Hound',       icon: '🐕' },
    { name: 'Crossbowman',     icon: '🏹' },
    { name: 'Shield Bearer',   icon: '🛡️' },
  ],
  // stages 40-49
  swamp: [
    { name: 'Bog Witch',       icon: '🧙' },
    { name: 'Venomfang',       icon: '🐍' },
    { name: 'Swamp Horror',    icon: '🐊' },
    { name: 'Will-o-Wisp',     icon: '🔵' },
    { name: 'Rot Elemental',   icon: '☣️' },
  ],
  // stages 50-59
  volcano: [
    { name: 'Lava Hound',      icon: '🔥' },
    { name: 'Magma Golem',     icon: '🌋' },
    { name: 'Fire Imp',        icon: '😈' },
    { name: 'Ember Drake',     icon: '🐉' },
    { name: 'Cinder Wraith',   icon: '💨' },
  ],
  // stages 60-69
  abyss: [
    { name: 'Void Stalker',    icon: '🕳️' },
    { name: 'Soul Reaper',     icon: '💀' },
    { name: 'Abyssal Fiend',   icon: '👾' },
    { name: 'Dark Elemental',  icon: '🌑' },
    { name: 'Chaos Spawn',     icon: '🌀' },
  ],
  // stages 70-79
  undead: [
    { name: 'Death Knight',    icon: '🦴' },
    { name: 'Lich Acolyte',    icon: '🧿' },
    { name: 'Bone Dragon',     icon: '🐲' },
    { name: 'Spectral Guard',  icon: '👻' },
    { name: 'Wight',           icon: '🌫️' },
  ],
  // stages 80-89
  celestial: [
    { name: 'Fallen Seraph',   icon: '😇' },
    { name: 'Void Angel',      icon: '⚜️' },
    { name: 'Cursed Paladin',  icon: '🛡️' },
    { name: 'Light Eater',     icon: '☀️' },
    { name: 'Astral Horror',   icon: '🌟' },
  ],
  // stages 90-100
  inferno: [
    { name: 'Demon Lord',      icon: '😈' },
    { name: 'Infernal Titan',  icon: '💀' },
    { name: 'Hellfire Drake',  icon: '🐉' },
    { name: 'Void Emperor',    icon: '👑' },
    { name: 'Armageddon',      icon: '☄️' },
  ],
}

const BOSS_POOL = [
  { name: 'Ancient Treant',     icon: '🌳' },  // 10
  { name: 'Cave Dragon',        icon: '🐉' },  // 20
  { name: 'Dungeon Overlord',   icon: '👑' },  // 30
  { name: 'Fortress Commander', icon: '⚔️' },  // 40
  { name: 'Bog Lich',           icon: '🧙' },  // 50
  { name: 'Volcano God',        icon: '🌋' },  // 60
  { name: 'Abyssal Lord',       icon: '🕳️' },  // 70
  { name: 'Death Emperor',      icon: '💀' },  // 80
  { name: 'Void Seraph',        icon: '😇' },  // 90
  { name: 'The Undying King',   icon: '👿' },  // 100
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPool(stage) {
  if (stage <= 9)  return ENEMY_POOLS.forest
  if (stage <= 19) return ENEMY_POOLS.cave
  if (stage <= 29) return ENEMY_POOLS.dungeon
  if (stage <= 39) return ENEMY_POOLS.fortress
  if (stage <= 49) return ENEMY_POOLS.swamp
  if (stage <= 59) return ENEMY_POOLS.volcano
  if (stage <= 69) return ENEMY_POOLS.abyss
  if (stage <= 79) return ENEMY_POOLS.undead
  if (stage <= 89) return ENEMY_POOLS.celestial
  return ENEMY_POOLS.inferno
}

function scaleStat(base, stage) {
  // More aggressive curve so geared heroes can't trivially one-shot mobs.
  // Stage 1 → ~1.3×, Stage 25 → ~16×, Stage 49 → ~36×, Stage 100 → ~200×
  return Math.floor(base * Math.pow(1 + stage * 0.20, 1.5))
}

function makeEnemyId(stage, index) {
  return `enemy_s${stage}_${index}`
}

// ─── Stage data ───────────────────────────────────────────────────────────────

export const MAX_STAGE = 100

/**
 * Get the stage definition for a given stage number.
 * @param {number} stage 1–100
 * @returns {object} stage definition
 */
export function getStage(stage) {
  const isBoss = stage % 10 === 0
  const bossIndex = Math.floor(stage / 10) - 1

  return {
    id: stage,
    name: isBoss ? `Stage ${stage} — BOSS` : `Stage ${stage}`,
    isBoss,
    enemyCount: isBoss ? 1 : Math.min(1 + Math.floor(stage / 20), 4),
    goldReward: isBoss ? stage * 25 : stage * 10,
    xpReward: isBoss ? stage * 50 : stage * 20,
    lootBonus: isBoss ? 0.25 : 0,   // added to base drop chance
    bossIndex,
  }
}

/**
 * Generate the enemy array for a given stage.
 * Each enemy is a fully populated combat-ready object.
 * @param {number} stage
 * @returns {object[]}
 */
export function generateEnemies(stage) {
  const def = getStage(stage)
  const pool = getPool(stage)

  if (def.isBoss) {
    const idx = Math.max(0, Math.min(def.bossIndex, BOSS_POOL.length - 1))
    const template = BOSS_POOL[idx]
    return [
      {
        id: makeEnemyId(stage, 0),
        name: template.name,
        icon: template.icon,
        isBoss: true,
        maxHp: scaleStat(450, stage),
        currentHp: scaleStat(450, stage),
        atk: scaleStat(16, stage),
        def: scaleStat(12, stage),
        spd: scaleStat(5, stage),
        crit: 0.10,
        critDmg: 1.8,
      },
    ]
  }

  return Array.from({ length: def.enemyCount }, (_, i) => {
    const template = pool[i % pool.length]
    // Vary stats slightly per enemy slot
    const variance = 0.9 + i * 0.05
    return {
      id: makeEnemyId(stage, i),
      name: template.name,
      icon: template.icon,
      isBoss: false,
      maxHp: Math.floor(scaleStat(75, stage) * variance),
      currentHp: Math.floor(scaleStat(75, stage) * variance),
      atk: Math.floor(scaleStat(10, stage) * variance),
      def: Math.floor(scaleStat(6, stage) * variance),
      spd: Math.floor(scaleStat(5, stage) * variance),
      crit: 0.05,
      critDmg: 1.5,
    }
  })
}

// Pre-computed metadata array for UI (stage select, progress display)
export const STAGES = Array.from({ length: MAX_STAGE }, (_, i) => getStage(i + 1))
