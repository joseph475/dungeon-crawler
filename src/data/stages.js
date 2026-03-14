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
 *
 * Elements: fire | nature | earth | shadow | holy | arcane | void | physical | poison
 * elementResist: damage taken from that element is reduced by the fraction
 * elementWeak:   damage taken from that element is amplified by the fraction
 * abilities: array of { type, cooldown, value?, ticks?, hpThreshold? }
 *   types: heal_self | shield_self | stun_hero | enrage
 */

// ─── Stage modifiers ──────────────────────────────────────────────────────────
// Random per-stage conditions applied at combat start.
// effect types: 'enemyBuff' | 'enemyShield' | 'goldBonus' | 'partyHpStart' | 'partyBuff'

export const STAGE_MODIFIERS = [
  { id: 'enraged',    icon: '⚡', label: 'Enraged',     desc: 'Enemies start with +30% ATK',        effect: 'enemyBuff',    stat: 'atk', mult: 1.30 },
  { id: 'fortified',  icon: '🛡️', label: 'Fortified',   desc: 'Enemies start with a damage shield',  effect: 'enemyShield', value: 0.35 },
  { id: 'bountiful',  icon: '💰', label: 'Bountiful',   desc: '+60% gold and XP this stage',          effect: 'goldBonus',   mult: 1.60 },
  { id: 'cursed',     icon: '🩸', label: 'Cursed',      desc: 'Party starts at 70% HP',               effect: 'partyHpStart', mult: 0.70 },
  { id: 'blessed',    icon: '✨', label: 'Blessed',     desc: 'Party starts with +20% ATK',           effect: 'partyBuff',   stat: 'atk', mult: 1.20 },
  { id: 'reinforced', icon: '🪨', label: 'Reinforced',  desc: 'Enemies start with +25% DEF',          effect: 'enemyBuff',   stat: 'def', mult: 1.25 },
  { id: 'shielded',   icon: '💎', label: 'Shielded',    desc: 'Party starts with a 25% damage shield', effect: 'partyShield', value: 0.25 },
]

/**
 * Roll a deterministic stage modifier (same modifier every time you visit a stage).
 * ~65% of non-boss stages from stage 3+ get a modifier.
 * Boss stages (×10) never get a modifier — they're already a challenge.
 */
export function rollStageModifier(stage) {
  if (stage < 3 || stage % 10 === 0) return null
  // Simple hash for determinism: mix stage with prime
  const hash = ((stage * 2654435769) >>> 0)
  if (hash % 100 >= 65) return null  // 35% no modifier
  return STAGE_MODIFIERS[hash % STAGE_MODIFIERS.length]
}

// ─── Element configs ──────────────────────────────────────────────────────────

// Maps element name → default resist/weak for enemies of that element.
// These are merged into enemy objects at generation time.
export const ELEMENT_CONFIGS = {
  nature:   { resist: { nature: 0.30 }, weak: { fire: 0.25 } },
  earth:    { resist: { earth: 0.25, physical: 0.20 }, weak: { arcane: 0.20 } },
  shadow:   { resist: { shadow: 0.35 }, weak: { holy: 0.30 } },
  physical: { resist: { physical: 0.25 } },
  holy:     { resist: { holy: 0.30 }, weak: { shadow: 0.25 } },
  fire:     { resist: { fire: 0.35 }, weak: { arcane: 0.20 } },
  poison:   { resist: { poison: 0.30, nature: 0.20 }, weak: { fire: 0.15 } },
  void:     { resist: { void: 0.30, arcane: 0.20 }, weak: { holy: 0.20 } },
  undead:   { resist: { shadow: 0.20, physical: 0.15 }, weak: { holy: 0.40, fire: 0.15 } },
}

// ─── Enemy name pools ────────────────────────────────────────────────────────

const ENEMY_POOLS = {
  // stages 1-9 — nature
  forest: [
    { name: 'Goblin Scout',    icon: '👺', element: 'nature' },
    { name: 'Wild Boar',       icon: '🐗', element: 'nature' },
    { name: 'Forest Sprite',   icon: '🧚', element: 'nature',
      abilities: [{ type: 'heal_self', cooldown: 5, value: 0.15 }] },
    { name: 'Mossy Slime',     icon: '🟢', element: 'nature' },
    { name: 'Thorn Imp',       icon: '👿', element: 'nature' },
  ],
  // stages 10-19 — earth
  cave: [
    { name: 'Cave Troll',      icon: '👹', element: 'earth' },
    { name: 'Stone Golem',     icon: '🪨', element: 'earth',
      abilities: [{ type: 'shield_self', cooldown: 6, value: 0.30, ticks: 3 }] },
    { name: 'Bat Swarm',       icon: '🦇', element: 'shadow' },
    { name: 'Dark Spider',     icon: '🕷️', element: 'shadow',
      abilities: [{ type: 'stun_hero', cooldown: 7, ticks: 1 }] },
    { name: 'Rock Crawler',    icon: '🦂', element: 'earth' },
  ],
  // stages 20-29 — shadow/undead
  dungeon: [
    { name: 'Skeleton Archer', icon: '💀', element: 'undead',
      abilities: [{ type: 'bleed_hero', cooldown: 6, value: 0.30, ticks: 3 }] },
    { name: 'Cursed Knight',   icon: '⚔️', element: 'shadow',
      abilities: [{ type: 'bleed_hero', cooldown: 7, value: 0.25, ticks: 3 }] },
    { name: 'Dungeon Rat',     icon: '🐀', element: 'physical' },
    { name: 'Zombie Brute',    icon: '🧟', element: 'undead',
      abilities: [{ type: 'heal_self', cooldown: 6, value: 0.12 }] },
    { name: 'Shadow Wisp',     icon: '👻', element: 'shadow',
      abilities: [{ type: 'stun_hero', cooldown: 6, ticks: 1 }, { type: 'silence_hero', cooldown: 8, ticks: 1 }] },
  ],
  // stages 30-39 — physical
  fortress: [
    { name: 'Orc Warrior',     icon: '🐾', element: 'physical' },
    { name: 'Iron Sentinel',   icon: '🤖', element: 'physical',
      abilities: [{ type: 'shield_self', cooldown: 5, value: 0.35, ticks: 3 }] },
    { name: 'War Hound',       icon: '🐕', element: 'physical' },
    { name: 'Crossbowman',     icon: '🏹', element: 'physical' },
    { name: 'Shield Bearer',   icon: '🛡️', element: 'physical',
      abilities: [{ type: 'shield_self', cooldown: 5, value: 0.25, ticks: 4 }] },
  ],
  // stages 40-49 — poison
  swamp: [
    { name: 'Bog Witch',       icon: '🧙', element: 'poison',
      abilities: [{ type: 'heal_self', cooldown: 5, value: 0.20 }, { type: 'silence_hero', cooldown: 7, ticks: 1 }] },
    { name: 'Venomfang',       icon: '🐍', element: 'poison',
      abilities: [{ type: 'silence_hero', cooldown: 8, ticks: 1 }] },
    { name: 'Swamp Horror',    icon: '🐊', element: 'poison',
      abilities: [{ type: 'bleed_hero', cooldown: 6, value: 0.35, ticks: 3 }] },
    { name: 'Will-o-Wisp',     icon: '🔵', element: 'shadow',
      abilities: [{ type: 'stun_hero', cooldown: 6, ticks: 2 }] },
    { name: 'Rot Elemental',   icon: '☣️', element: 'poison',
      abilities: [{ type: 'bleed_hero', cooldown: 6, value: 0.28, ticks: 4 }] },
  ],
  // stages 50-59 — fire
  volcano: [
    { name: 'Lava Hound',      icon: '🔥', element: 'fire' },
    { name: 'Magma Golem',     icon: '🌋', element: 'fire',
      abilities: [{ type: 'shield_self', cooldown: 6, value: 0.30, ticks: 3 }] },
    { name: 'Fire Imp',        icon: '😈', element: 'fire' },
    { name: 'Ember Drake',     icon: '🐉', element: 'fire',
      abilities: [{ type: 'enrage', cooldown: 999, value: 1.6, hpThreshold: 0.5 }] },
    { name: 'Cinder Wraith',   icon: '💨', element: 'fire' },
  ],
  // stages 60-69 — void/shadow
  abyss: [
    { name: 'Void Stalker',    icon: '🕳️', element: 'void',
      abilities: [{ type: 'freeze_hero', cooldown: 7, ticks: 2 }] },
    { name: 'Soul Reaper',     icon: '💀', element: 'shadow',
      abilities: [{ type: 'stun_hero', cooldown: 5, ticks: 2 }, { type: 'silence_hero', cooldown: 8, ticks: 1 }] },
    { name: 'Abyssal Fiend',   icon: '👾', element: 'void',
      abilities: [{ type: 'heal_self', cooldown: 5, value: 0.18 }, { type: 'freeze_hero', cooldown: 8, ticks: 2 }] },
    { name: 'Dark Elemental',  icon: '🌑', element: 'shadow',
      abilities: [{ type: 'bleed_hero', cooldown: 6, value: 0.40, ticks: 3 }] },
    { name: 'Chaos Spawn',     icon: '🌀', element: 'void',
      abilities: [{ type: 'freeze_hero', cooldown: 6, ticks: 2 }] },
  ],
  // stages 70-79 — undead/shadow
  undead: [
    { name: 'Death Knight',    icon: '🦴', element: 'undead',
      abilities: [{ type: 'enrage', cooldown: 999, value: 1.7, hpThreshold: 0.4 }, { type: 'bleed_hero', cooldown: 5, value: 0.45, ticks: 3 }] },
    { name: 'Lich Acolyte',    icon: '🧿', element: 'shadow',
      abilities: [{ type: 'heal_self', cooldown: 4, value: 0.18 }, { type: 'silence_hero', cooldown: 6, ticks: 1 }] },
    { name: 'Bone Dragon',     icon: '🐲', element: 'undead',
      abilities: [{ type: 'bleed_hero', cooldown: 5, value: 0.50, ticks: 3 }] },
    { name: 'Spectral Guard',  icon: '👻', element: 'shadow',
      abilities: [{ type: 'shield_self', cooldown: 5, value: 0.30, ticks: 3 }, { type: 'freeze_hero', cooldown: 7, ticks: 2 }] },
    { name: 'Wight',           icon: '🌫️', element: 'undead',
      abilities: [{ type: 'silence_hero', cooldown: 7, ticks: 1 }] },
  ],
  // stages 80-89 — holy/void
  celestial: [
    { name: 'Fallen Seraph',   icon: '😇', element: 'holy',
      abilities: [{ type: 'heal_self', cooldown: 4, value: 0.25 }] },
    { name: 'Void Angel',      icon: '⚜️', element: 'void' },
    { name: 'Cursed Paladin',  icon: '🛡️', element: 'holy',
      abilities: [{ type: 'shield_self', cooldown: 5, value: 0.35, ticks: 3 }] },
    { name: 'Light Eater',     icon: '☀️', element: 'void',
      abilities: [{ type: 'stun_hero', cooldown: 5, ticks: 2 }, { type: 'freeze_hero', cooldown: 7, ticks: 2 }] },
    { name: 'Astral Horror',   icon: '🌟', element: 'holy',
      abilities: [{ type: 'silence_hero', cooldown: 6, ticks: 1 }, { type: 'freeze_hero', cooldown: 8, ticks: 2 }] },
  ],
  // stages 90-100 — fire/void
  inferno: [
    { name: 'Demon Lord',      icon: '😈', element: 'fire',
      abilities: [{ type: 'stun_hero', cooldown: 5, ticks: 2 }, { type: 'enrage', cooldown: 999, value: 1.8, hpThreshold: 0.5 }] },
    { name: 'Infernal Titan',  icon: '💀', element: 'fire',
      abilities: [{ type: 'shield_self', cooldown: 5, value: 0.35, ticks: 3 }] },
    { name: 'Hellfire Drake',  icon: '🐉', element: 'fire' },
    { name: 'Void Emperor',    icon: '👑', element: 'void',
      abilities: [{ type: 'heal_self', cooldown: 4, value: 0.20 }] },
    { name: 'Armageddon',      icon: '☄️', element: 'void' },
  ],
}

const BOSS_POOL = [
  { name: 'Ancient Treant',     icon: '🌳', element: 'nature',
    abilities: [{ type: 'heal_self', cooldown: 4, value: 0.25 }] },
  { name: 'Cave Dragon',        icon: '🐉', element: 'earth',
    abilities: [{ type: 'shield_self', cooldown: 5, value: 0.30, ticks: 4 }, { type: 'enrage', cooldown: 999, value: 1.7, hpThreshold: 0.4 }] },
  { name: 'Dungeon Overlord',   icon: '👑', element: 'shadow',
    abilities: [{ type: 'heal_self', cooldown: 5, value: 0.20 }, { type: 'stun_hero', cooldown: 6, ticks: 2 }] },
  { name: 'Fortress Commander', icon: '⚔️', element: 'physical',
    abilities: [{ type: 'shield_self', cooldown: 4, value: 0.35, ticks: 4 }, { type: 'enrage', cooldown: 999, value: 1.8, hpThreshold: 0.5 }] },
  { name: 'Bog Lich',           icon: '🧙', element: 'poison',
    abilities: [{ type: 'heal_self', cooldown: 4, value: 0.22 }, { type: 'silence_hero', cooldown: 5, ticks: 1 }, { type: 'bleed_hero', cooldown: 6, value: 0.40, ticks: 3 }] },
  { name: 'Volcano God',        icon: '🌋', element: 'fire',
    abilities: [{ type: 'enrage', cooldown: 999, value: 2.0, hpThreshold: 0.5 }, { type: 'stun_hero', cooldown: 6, ticks: 1 }] },
  { name: 'Abyssal Lord',       icon: '🕳️', element: 'void',
    abilities: [{ type: 'shield_self', cooldown: 4, value: 0.40, ticks: 4 }, { type: 'heal_self', cooldown: 5, value: 0.18 }, { type: 'freeze_hero', cooldown: 6, ticks: 2 }] },
  { name: 'Death Emperor',      icon: '💀', element: 'undead',
    abilities: [{ type: 'heal_self', cooldown: 3, value: 0.25 }, { type: 'stun_hero', cooldown: 5, ticks: 2 }, { type: 'enrage', cooldown: 999, value: 1.9, hpThreshold: 0.4 }] },
  { name: 'Void Seraph',        icon: '😇', element: 'holy',
    abilities: [{ type: 'heal_self', cooldown: 3, value: 0.30 }, { type: 'shield_self', cooldown: 5, value: 0.40, ticks: 4 }] },
  { name: 'The Undying King',   icon: '👿', element: 'void',
    abilities: [{ type: 'heal_self', cooldown: 3, value: 0.30 }, { type: 'stun_hero', cooldown: 4, ticks: 2 }, { type: 'enrage', cooldown: 999, value: 2.2, hpThreshold: 0.5 }, { type: 'shield_self', cooldown: 5, value: 0.40, ticks: 3 }] },
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
  // stage 1 → ~1.2×, stage 10 → ~5×, stage 30 → ~19×, stage 50 → ~37×, stage 100 → ~113×
  return Math.floor(base * Math.pow(1 + stage * 0.20, 1.5))
}

function makeEnemyId(stage, index) {
  return `enemy_s${stage}_${index}`
}

function applyElement(template) {
  const config = ELEMENT_CONFIGS[template.element] ?? {}
  return {
    element: template.element ?? null,
    elementResist: config.resist ?? {},
    elementWeak:   config.weak   ?? {},
  }
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
    lootBonus: isBoss ? 0.35 : 0,   // added to base drop chance
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
        maxHp: scaleStat(550, stage),
        currentHp: scaleStat(550, stage),
        atk: scaleStat(18, stage),
        def: scaleStat(12, stage),
        spd: scaleStat(5, stage),
        crit: 0.12,
        critDmg: 1.9,
        abilities: template.abilities ?? [],
        ...applyElement(template),
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
      maxHp: Math.floor(scaleStat(110, stage) * variance),
      currentHp: Math.floor(scaleStat(110, stage) * variance),
      atk: Math.floor(scaleStat(12, stage) * variance),
      def: Math.floor(scaleStat(6, stage) * variance),
      spd: Math.floor(scaleStat(5, stage) * variance),
      crit: 0.06,
      critDmg: 1.5,
      abilities: template.abilities ?? [],
      ...applyElement(template),
    }
  })
}

// Pre-computed metadata array for UI (stage select, progress display)
export const STAGES = Array.from({ length: MAX_STAGE }, (_, i) => getStage(i + 1))
