import { ITEMS, RARITY_SECONDARY_COUNT } from '@/data/items'

// ─── Rarity weights by stage ──────────────────────────────────────────────────

function getRarityWeights(stage) {
  const t = Math.min(1, stage / 100)
  return {
    common:    lerp(60, 5,  t),
    uncommon:  lerp(25, 15, t),
    rare:      lerp(10, 35, t),
    epic:      lerp(4,  30, t),
    legendary: lerp(1,  15, t),
  }
}

function lerp(a, b, t) { return a + (b - a) * t }

// ─── Rarity stat multipliers ──────────────────────────────────────────────────
// Higher rarity = stronger values on ALL stats (main + secondaries)

// Rarity multipliers tightened — legendary is strong but not 3× common.
const RARITY_MULTIPLIER = {
  common:    1.00,
  uncommon:  1.18,
  rare:      1.42,
  epic:      1.72,
  legendary: 2.10,
}

// ─── Stat growth config ───────────────────────────────────────────────────────
// Reduced growth rates so gear doesn't trivially outpace enemy scaling.
// At iLv 54 legendary ATK ≈ 225 (down from ~700 previously).

const MAIN_GROWTH = {
  atk:     { base: 7,     growth: 1.6,   isFloat: false },
  def:     { base: 4,     growth: 1.0,   isFloat: false },
  hp:      { base: 22,    growth: 4.5,   isFloat: false },
  spd:     { base: 1.2,   growth: 0.20,  isFloat: true,  precision: 1 },
  crit:    { base: 0.018, growth: 0.003, isFloat: true,  precision: 3 },
  critDmg: { base: 0.08,  growth: 0.012, isFloat: true,  precision: 2 },
  mana:    { base: 14,    growth: 3.0,   isFloat: false },
}

const SECONDARY_GROWTH = {
  atk:     { base: 2,     growth: 0.5,   isFloat: false },
  def:     { base: 1,     growth: 0.35,  isFloat: false },
  hp:      { base: 6,     growth: 1.5,   isFloat: false },
  spd:     { base: 0.2,   growth: 0.06,  isFloat: true,  precision: 1 },
  crit:    { base: 0.004, growth: 0.001, isFloat: true,  precision: 3 },
  critDmg: { base: 0.015, growth: 0.005, isFloat: true,  precision: 2 },
  mana:    { base: 3,     growth: 0.8,   isFloat: false },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rollStatValue(config, level, rarityMult, variance = 0.15) {
  const base  = config.base + config.growth * (level - 1)
  const v     = 1 + (Math.random() * 2 - 1) * variance
  const raw   = base * v * rarityMult

  if (config.isFloat) {
    const p = config.precision ?? 2
    return parseFloat(raw.toFixed(p))
  }
  return Math.max(1, Math.floor(raw))
}

function weightedPick(pool, weights) {
  const total = weights.reduce((s, w) => s + w, 0)
  let roll = Math.random() * total
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i]
    if (roll <= 0) return pool[i]
  }
  return pool[pool.length - 1]
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Item level: roughly stage × 1.1 capped at stage + 5, with small variance
function calcItemLevel(stage) {
  const base    = Math.max(1, Math.floor(stage * 1.1))
  const jitter  = Math.floor(Math.random() * 5) - 2
  const capped  = Math.min(stage + 5, base + jitter)
  return Math.max(1, capped)
}

// ─── Legendary traits ─────────────────────────────────────────────────────────
// One trait is assigned to every legendary item. Traits enhance a specific
// skill slot (basic / skill / ultimate) and are displayed in gold.

export const LEGENDARY_TRAITS = [
  { label: '+25% Basic ATK',        skillSlot: 'basic',    type: 'dmg_bonus',       value: 0.25 },
  { label: '+20% Skill DMG',        skillSlot: 'skill',    type: 'dmg_bonus',       value: 0.20 },
  { label: '+30% Ultimate DMG',     skillSlot: 'ultimate', type: 'dmg_bonus',       value: 0.30 },
  { label: '-2s Skill Cooldown',    skillSlot: 'skill',    type: 'cooldown_reduce', value: 2    },
  { label: '+15% Basic Lifesteal',  skillSlot: 'basic',    type: 'lifesteal',       value: 0.15 },
  { label: '+25% Skill Heal Power', skillSlot: 'skill',    type: 'heal_boost',      value: 0.25 },
  { label: '+3 ULT Buff Duration',  skillSlot: 'ultimate', type: 'buff_ticks',      value: 3    },
  { label: '+15% Crit on Skill',    skillSlot: 'skill',    type: 'crit_bonus',      value: 0.15 },
  { label: '+20% Basic Lifesteal',  skillSlot: 'basic',    type: 'lifesteal',       value: 0.20 },
  { label: '+10% Mana/Hit',         skillSlot: 'basic',    type: 'mana_per_hit',    value: 0.10 },
]

// ─── Item generator ───────────────────────────────────────────────────────────

function generateItem(template, rarity, stage) {
  const level    = calcItemLevel(stage)
  const rarityMult = RARITY_MULTIPLIER[rarity] ?? 1
  const stats    = {}

  // ── Main stat ──────────────────────────────────────────────────────────────
  let mainKey = template.mainStat
  if (mainKey === 'random') {
    const pool = template.mainStatPool ?? ['atk']
    mainKey = pool[Math.floor(Math.random() * pool.length)]
  }
  const mainConfig = MAIN_GROWTH[mainKey]
  if (mainConfig) {
    stats[mainKey] = rollStatValue(mainConfig, level, rarityMult)
  }

  // ── Sub-main stat (e.g. chest HP + DEF) ────────────────────────────────────
  if (template.subMainStat) {
    const subKey = template.subMainStat
    const subConfig = MAIN_GROWTH[subKey]
    if (subConfig) {
      // Sub-main is 55–65% of the main growth values
      const subScaled = {
        ...subConfig,
        base:   subConfig.base   * 0.60,
        growth: subConfig.growth * 0.60,
      }
      stats[subKey] = rollStatValue(subScaled, level, rarityMult)
    }
  }

  // ── Secondary stats ────────────────────────────────────────────────────────
  const secCount  = rarity === 'legendary' ? 4 : (RARITY_SECONDARY_COUNT[rarity] ?? 1)
  const usedStats = new Set([mainKey, template.subMainStat].filter(Boolean))
  const secPool   = (template.secondaryPool ?? []).filter((s) => !usedStats.has(s))
  const chosen    = shuffle(secPool).slice(0, Math.min(secCount, secPool.length))

  // Each secondary stat gets its own random rarity (up to the item's rarity tier)
  const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary']
  const itemRarityIdx = RARITY_ORDER.indexOf(rarity)
  const statRarities = { [mainKey]: rarity }

  chosen.forEach((statKey) => {
    const cfg = SECONDARY_GROWTH[statKey]
    if (!cfg) return
    // Random rarity from common up to the item's own rarity
    const statRarityIdx = Math.floor(Math.random() * (itemRarityIdx + 1))
    const statRarity = RARITY_ORDER[statRarityIdx]
    const statMult = RARITY_MULTIPLIER[statRarity] ?? 1
    statRarities[statKey] = statRarity
    stats[statKey] = rollStatValue(cfg, level, statMult)
  })

  // Legendary items get a random trait that enhances a specific skill slot
  const trait = rarity === 'legendary'
    ? LEGENDARY_TRAITS[Math.floor(Math.random() * LEGENDARY_TRAITS.length)]
    : null

  return {
    uid:        crypto.randomUUID(),
    id:         template.id,
    name:       template.name,
    icon:       template.icon,
    slot:       template.slot,
    classLock:  template.classLock,
    rarity,
    itemLevel:  level,
    mainStat:   mainKey,
    stats,
    statRarities,
    trait,
    locked:     false,
    equippedBy: null,
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Roll loot for a stage clear.
 * @param {number} stage
 * @param {number} bonusChance   added on top of base drop chance (0.25 for boss)
 * @returns {object[]}           array of generated item instances
 */
export function rollLoot(stage, bonusChance = 0) {
  // Regular stages: 15% drop chance. Bosses add 0.35 → 50% and can drop 2.
  const BASE_DROP_CHANCE = 0.15
  if (Math.random() > Math.min(0.90, BASE_DROP_CHANCE + bonusChance)) return []

  // Boss stages have a 25% chance to drop a second item
  const dropCount = (stage % 10 === 0 && Math.random() < 0.25) ? 2 : 1
  const rarityWeights = getRarityWeights(stage)
  const rarityKeys    = Object.keys(rarityWeights)
  const rarityValues  = Object.values(rarityWeights)

  const results = []

  for (let i = 0; i < dropCount; i++) {
    const pool = ITEMS.filter((t) => t.minStage <= stage)
    if (!pool.length) break

    // Pick rarity first, then pick a template (all templates equally likely within rarity)
    const rarity   = weightedPick(rarityKeys, rarityValues)
    const template = pool[Math.floor(Math.random() * pool.length)]

    results.push(generateItem(template, rarity, stage))
  }

  return results
}
