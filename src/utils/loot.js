import { ITEMS, MYTHIC_ITEMS, RARITY_SECONDARY_COUNT } from '@/data/items'

// ─── Rarity weights by stage ──────────────────────────────────────────────────

function getRarityWeights(stage) {
  const t = Math.min(1, stage / 100)
  // Stage 1:  common=65, uncommon=28, rare=6,  epic=1,  legendary=0
  // Stage 50: common=30, uncommon=22, rare=25, epic=16, legendary=7
  // Stage 100: common=5, uncommon=10, rare=35, epic=30, legendary=20
  return {
    common:    lerp(65, 5,  t),
    uncommon:  lerp(28, 10, t),
    rare:      lerp(6,  35, t),
    epic:      lerp(1,  30, t),
    legendary: lerp(0,  20, t),
  }
}

function lerp(a, b, t) { return a + (b - a) * t }

// ─── Rarity stat multipliers ──────────────────────────────────────────────────
// Higher rarity = stronger values on ALL stats (main + secondaries)

// Rarity multipliers tightened — legendary is strong but not 3× common.
export const RARITY_MULTIPLIER = {
  common:    1.00,
  uncommon:  1.18,
  rare:      1.42,
  epic:      1.72,
  legendary: 2.10,
  mythic:    3.00,
}

const MYTHIC_MAIN_MULT      = 3.00
const MYTHIC_FIXED_MULT     = 2.60  // fixed substats — guaranteed high but slightly below main
const MYTHIC_RANDOM_MULT_LO = 1.72  // random substats range: epic → legendary
const MYTHIC_RANDOM_MULT_HI = 2.40

// ─── Stat growth config ───────────────────────────────────────────────────────
// Reduced growth rates so gear doesn't trivially outpace enemy scaling.
// At iLv 54 legendary ATK ≈ 225 (down from ~700 previously).

export const MAIN_GROWTH = {
  atk:     { base: 8,     growth: 1.8,   isFloat: false },
  def:     { base: 5,     growth: 1.1,   isFloat: false },
  hp:      { base: 25,    growth: 5.0,   isFloat: false },
  // SPD is boots-only; kept low so one pair of boots doesn't dominate speed
  spd:     { base: 0.8,   growth: 0.10,  isFloat: true,  precision: 1 },
  // Crit capped lower so stacking gear stays under 100% in most builds
  crit:    { base: 0.010, growth: 0.0018, isFloat: true,  precision: 3 },
  critDmg: { base: 0.08,  growth: 0.010,  isFloat: true,  precision: 2 },
  mana:    { base: 14,    growth: 3.0,   isFloat: false },
}

export const SECONDARY_GROWTH = {
  atk:       { base: 2,     growth: 0.6,    isFloat: false },
  def:       { base: 1,     growth: 0.40,   isFloat: false },
  hp:        { base: 7,     growth: 1.8,    isFloat: false },
  // Secondary crit kept small so multiple crit pieces don't trivially hit cap
  crit:      { base: 0.002, growth: 0.0006, isFloat: true,  precision: 3 },
  critDmg:   { base: 0.012, growth: 0.004,  isFloat: true,  precision: 2 },
  mana:      { base: 3,     growth: 0.9,    isFloat: false },
  // Regen stats: flat amount restored per actor turn in combat
  hpRegen:   { base: 2,     growth: 0.6,    isFloat: false },
  manaRegen: { base: 1,     growth: 0.4,    isFloat: false },
  // Evasion: chance to dodge an incoming attack (0–1), capped at 0.6 in engine
  evasion:   { base: 0.005, growth: 0.0015, isFloat: true, precision: 3 },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function rollStatValue(config, level, rarityMult, variance = 0.15) {
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

// Item level tracks hero level for stages 1-100 (keeps gear balanced with hero power).
// In endless mode (stage > 100) stage drives item level so gear keeps scaling past the hero cap.
function calcItemLevel(partyMaxLevel, stage) {
  const base   = stage > 100 ? Math.max(partyMaxLevel, stage) : partyMaxLevel
  const jitter = Math.floor(Math.random() * 7) - 3   // −3 to +3
  return Math.max(1, base + jitter)
}

// ─── Legendary traits ─────────────────────────────────────────────────────────
// One trait is assigned to every legendary item. Traits enhance a specific
// skill slot (basic / skill / ultimate) and are displayed in gold.

export const LEGENDARY_TRAITS = [
  { label: '+25% Basic ATK',        skillSlot: 'basic',    type: 'dmg_bonus',       value: 0.25 },
  { label: '+20% Skill DMG',        skillSlot: 'skill',    type: 'dmg_bonus',       value: 0.20 },
  { label: '+30% Ultimate DMG',     skillSlot: 'ultimate', type: 'dmg_bonus',       value: 0.30 },
  { label: '-2 Turns Skill CD',     skillSlot: 'skill',    type: 'cooldown_reduce', value: 2    },
  { label: '+15% Basic Lifesteal',  skillSlot: 'basic',    type: 'lifesteal',       value: 0.15 },
  { label: '+25% Skill Heal Power', skillSlot: 'skill',    type: 'heal_boost',      value: 0.25 },
  { label: '+3 ULT Buff Duration',  skillSlot: 'ultimate', type: 'buff_ticks',      value: 3    },
  { label: '+15% Crit on Skill',    skillSlot: 'skill',    type: 'crit_bonus',      value: 0.15 },
  { label: '+20% Basic Lifesteal',  skillSlot: 'basic',    type: 'lifesteal',       value: 0.20 },
  { label: '+10% Mana/Hit',         skillSlot: 'basic',    type: 'mana_per_hit',    value: 0.10 },
]

// ─── Mythic item generator ────────────────────────────────────────────────────
// Mythic items have a fixed name/icon, 1 main stat, 2 fixed normal substats,
// 2 fixed skill traits, and 2 random substats drawn from mythicRandomPool.

function generateMythicItem(template, partyMaxLevel, stage) {
  const level = calcItemLevel(partyMaxLevel, stage)
  const stats       = {}
  const statRarities = {}

  // Main stat
  const mainKey    = template.mainStat
  const mainConfig = MAIN_GROWTH[mainKey]
  if (mainConfig) {
    stats[mainKey]       = rollStatValue(mainConfig, level, MYTHIC_MAIN_MULT)
    statRarities[mainKey] = 'mythic'
  }

  // Fixed normal substats — always present, always mythic-tier
  const fixedStatKeys = template.mythicFixedStats ?? []
  fixedStatKeys.forEach((statKey) => {
    const cfg = SECONDARY_GROWTH[statKey]
    if (!cfg) return
    stats[statKey]       = rollStatValue(cfg, level, MYTHIC_FIXED_MULT)
    statRarities[statKey] = 'mythic'
  })

  // 2 random substats from mythicRandomPool (epic–legendary quality)
  const usedStats     = new Set([mainKey, ...fixedStatKeys])
  const availablePool = (template.mythicRandomPool ?? []).filter((s) => !usedStats.has(s))
  shuffle(availablePool).slice(0, 2).forEach((statKey) => {
    const cfg = SECONDARY_GROWTH[statKey]
    if (!cfg) return
    const randMult = lerp(MYTHIC_RANDOM_MULT_LO, MYTHIC_RANDOM_MULT_HI, Math.random())
    stats[statKey]       = rollStatValue(cfg, level, randMult)
    statRarities[statKey] = Math.random() < 0.5 ? 'legendary' : 'mythic'
  })

  return {
    uid:              crypto.randomUUID(),
    id:               template.id,
    name:             template.name,
    icon:             template.icon,
    slot:             template.slot,
    classLock:        template.classLock,
    setId:            template.setId ?? null,
    rarity:           'mythic',
    itemLevel:        level,
    mainStat:         mainKey,
    stats,
    statRarities,
    fixedSubstatKeys: fixedStatKeys,
    mythicSkillTraits: template.mythicSkillTraits ?? [],
    trait:            null,
    locked:           false,
    equippedBy:       null,
  }
}

// ─── Item generator ───────────────────────────────────────────────────────────

export function generateItem(template, rarity, partyMaxLevel, stage) {
  const level    = calcItemLevel(partyMaxLevel, stage)
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
    setId:      template.setId ?? null,
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

// ─── Shop pricing ─────────────────────────────────────────────────────────────
// Buy price = itemLevel × multiplier. Prices are intentionally high so gold
// stays a meaningful resource — loot should be the primary gearing path.

const SHOP_BUY_MULT = {
  common:    14,
  uncommon:  38,
  rare:      90,
  epic:      220,
  legendary: 580,
}

export function calcBuyPrice(item) {
  const mult = SHOP_BUY_MULT[item.rarity] ?? 14
  return Math.max(20, Math.floor((item.itemLevel ?? 1) * mult))
}

// Shop rarity weights are much more conservative than combat loot:
// - Legendary capped at stage 80+ and always low probability
// - Epic only appears at stage 40+
// - Common/uncommon dominate early, rare dominates mid-game
function getShopRarityWeights(stage) {
  // early (stage ≤ 20): mostly common/uncommon
  // mid   (stage ~50):  common fades, rare rises, epic appears
  // late  (stage 80+):  rare dominant, epic solid, legendary rare treat
  const t = Math.min(1, stage / 100)
  return {
    common:    lerp(60, 18, t),
    uncommon:  lerp(32, 22, t),
    rare:      lerp(7,  40, t),
    epic:      stage >= 40 ? lerp(1, 16, Math.min(1, (stage - 40) / 60)) : 0,
    legendary: stage >= 80 ? lerp(0,  4, Math.min(1, (stage - 80) / 20)) : 0,
  }
}

/**
 * Generate a stock of items for the merchant shop.
 * Mythic items are never sold — they are combat-drop exclusive.
 * Shop rarity is capped lower than combat loot to keep looting relevant.
 * @param {number} stage
 * @param {number} partyMaxLevel
 * @param {number} count   number of items to generate (default 6)
 */
export function generateShopItems(stage, partyMaxLevel = 1, count = 6) {
  const rarityWeights = getShopRarityWeights(stage)
  const rarityKeys    = Object.keys(rarityWeights)
  const rarityValues  = Object.values(rarityWeights)
  const pool = ITEMS.filter((t) => t.minStage <= stage)

  const results = []
  for (let i = 0; i < count; i++) {
    if (!pool.length) break
    const rarity   = weightedPick(rarityKeys, rarityValues)
    const template = pool[Math.floor(Math.random() * pool.length)]
    results.push(generateItem(template, rarity, partyMaxLevel, stage))
  }
  return results
}

// ─── Public API ───────────────────────────────────────────────────────────────

// ─── Party-weighted template picker ──────────────────────────────────────────
// Items matching a party member's class are 3× more likely.
// Items locked to a class NOT in the party are 0.3× as likely.

function pickTemplate(pool, partyClassIds = []) {
  if (!pool.length) return null
  if (!partyClassIds.length) return pool[Math.floor(Math.random() * pool.length)]
  const weights = pool.map((t) => {
    if (!t.classLock) return 1
    if (partyClassIds.includes(t.classLock)) return 3
    return 0.3
  })
  return weightedPick(pool, weights)
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Roll loot for a stage clear.
 * @param {number}   stage
 * @param {number}   bonusChance       added on top of base drop chance (boss stages: 0.35)
 * @param {number}   partyMaxLevel
 * @param {boolean}  isFirstBossClear  true only on the FIRST clear of a boss stage
 * @param {string[]} partyClassIds     classIds of current party members for biased drops
 * @returns {object[]}                 array of generated item instances
 */
export function rollLoot(stage, bonusChance = 0, partyMaxLevel = 1, isFirstBossClear = false, partyClassIds = []) {
  // Boss bonus (drop chance boost, double-drop) only applies on first clear
  const effectiveBonus = isFirstBossClear ? bonusChance : 0
  const BASE_DROP_CHANCE = lerp(0.45, 0.20, Math.min(1, stage / 80))
  if (Math.random() > Math.min(0.92, BASE_DROP_CHANCE + effectiveBonus)) return []

  // Double-drop on boss first clear only
  const dropCount = (isFirstBossClear && Math.random() < 0.40) ? 2 : 1
  const rarityWeights = getRarityWeights(stage)
  const rarityKeys    = Object.keys(rarityWeights)
  const rarityValues  = Object.values(rarityWeights)

  const results = []
  const pool = ITEMS.filter((t) => t.minStage <= stage)

  for (let i = 0; i < dropCount; i++) {
    if (!pool.length) break
    const rarity   = weightedPick(rarityKeys, rarityValues)
    const template = pickTemplate(pool, partyClassIds)
    results.push(generateItem(template, rarity, partyMaxLevel, stage))
  }

  // Boss milestone: guaranteed rare+ item on first clear
  if (isFirstBossClear && pool.length) {
    const template  = pickTemplate(pool, partyClassIds)
    const rarity    = weightedPick(['rare', 'epic', 'legendary'], [55, 33, 12])
    results.push(generateItem(template, rarity, partyMaxLevel, stage))
  }

  // Mythic drop — only at stage 70+
  // 3× boss multiplier only on first clear to prevent parking exploit
  if (stage >= 70) {
    const baseMythicChance = Math.min(0.05, (stage - 70) / 60 * 0.05)
    const mythicChance = isFirstBossClear
      ? Math.min(0.15, baseMythicChance * 3)
      : baseMythicChance
    if (Math.random() < mythicChance) {
      const mythicPool = MYTHIC_ITEMS.filter((t) => t.minStage <= stage)
      if (mythicPool.length) {
        const mTemplate = mythicPool[Math.floor(Math.random() * mythicPool.length)]
        results.push(generateMythicItem(mTemplate, partyMaxLevel, stage))
      }
    }
  }

  return results
}

/**
 * Generate a single first-clear chest item for any stage.
 * Rarity scales with stage. Item is biased toward the current party's classes.
 * @param {number}   stage
 * @param {number}   partyMaxLevel
 * @param {string[]} partyClassIds
 * @returns {object|null}
 */
export function rollFirstClearChest(stage, partyMaxLevel = 1, partyClassIds = []) {
  const pool = ITEMS.filter((t) => t.minStage <= stage)
  if (!pool.length) return null
  const template = pickTemplate(pool, partyClassIds)
  // Rarity scales: mostly common early, shifts toward rare/epic at high stages
  const t = Math.min(1, stage / 80)
  const rarity = weightedPick(
    ['common', 'uncommon', 'rare', 'epic'],
    [lerp(55, 5, t), lerp(32, 20, t), lerp(11, 42, t), lerp(2, 33, t)]
  )
  return generateItem(template, rarity, partyMaxLevel, stage)
}
