import { ITEMS } from '@/data/items'
import { rollStatValue, SECONDARY_GROWTH, MAIN_GROWTH, RARITY_MULTIPLIER, generateItem } from '@/utils/loot'
import { RARITY_ORDER } from '@/store/useInventoryStore'

// ─── Crafting costs (per itemLevel) ──────────────────────────────────────────

const REROLL_PER_LEVEL  = { common: 5,   uncommon: 12,  rare: 30,  epic: 75,  legendary: 200 }
const UPGRADE_PER_LEVEL = { common: 15,  uncommon: 35,  rare: 90,  epic: 220, legendary: 600 }

export function calcRerollCost(item) {
  return Math.floor((REROLL_PER_LEVEL[item.rarity] ?? 30) * (item.itemLevel ?? 1))
}

export function calcUpgradeCost(item) {
  return Math.floor((UPGRADE_PER_LEVEL[item.rarity] ?? 90) * (item.itemLevel ?? 1))
}

/** True if this rarity can be fused (there's a higher tier to promote into). */
export function canFuse(rarity) {
  const idx = RARITY_ORDER.indexOf(rarity)
  return idx >= 0 && idx < RARITY_ORDER.indexOf('legendary')
}

/**
 * Reroll one random secondary stat on the item.
 * Returns { newStats, newStatRarities, rerolledKey } or null if nothing to reroll.
 */
export function craftReroll(item) {
  const fixed = new Set([item.mainStat, ...(item.fixedSubstatKeys ?? [])])
  const rerollable = Object.keys(item.stats ?? {}).filter((k) => !fixed.has(k))
  if (!rerollable.length) return null

  const targetKey = rerollable[Math.floor(Math.random() * rerollable.length)]
  const cfg = SECONDARY_GROWTH[targetKey]
  if (!cfg) return null

  const itemRarityIdx = RARITY_ORDER.indexOf(item.rarity)
  const statRarityIdx = Math.floor(Math.random() * (itemRarityIdx + 1))
  const statRarity    = RARITY_ORDER[statRarityIdx]
  const mult          = RARITY_MULTIPLIER[statRarity] ?? 1
  const newVal        = rollStatValue(cfg, item.itemLevel ?? 1, mult)

  return {
    newStats:       { ...item.stats, [targetKey]: newVal },
    newStatRarities: { ...(item.statRarities ?? {}), [targetKey]: statRarity },
    rerolledKey:    targetKey,
  }
}

/**
 * Scale all stats up by iLv+1/iLv ratio.
 * Returns { newStats, newItemLevel }.
 */
export function craftUpgrade(item) {
  const oldLv = item.itemLevel ?? 1
  const ratio = (oldLv + 1) / oldLv
  const newStats = {}
  Object.entries(item.stats ?? {}).forEach(([k, v]) => {
    const cfg = MAIN_GROWTH[k] ?? SECONDARY_GROWTH[k]
    if (cfg?.isFloat) {
      newStats[k] = parseFloat((v * ratio).toFixed(cfg.precision ?? 2))
    } else {
      newStats[k] = Math.max(1, Math.round(v * ratio))
    }
  })
  return { newStats, newItemLevel: oldLv + 1 }
}

/**
 * Fuse 3 items of the same rarity into 1 item of the next rarity tier.
 * Returns a new item instance, or null on invalid input.
 */
export function craftFuse(items) {
  if (items.length !== 3) return null
  const rarity = items[0].rarity
  if (!items.every((i) => i.rarity === rarity) || !canFuse(rarity)) return null

  const rarityIdx  = RARITY_ORDER.indexOf(rarity)
  const nextRarity = RARITY_ORDER[rarityIdx + 1]
  const avgLevel   = Math.round(items.reduce((s, i) => s + (i.itemLevel ?? 1), 0) / 3)

  // Prefer same classLock; fall back to any template if no exact match
  const classLock  = items.every((i) => i.classLock === items[0].classLock) ? items[0].classLock : null
  let pool = ITEMS.filter((t) => classLock ? t.classLock === classLock : !t.classLock)
  if (!pool.length) pool = ITEMS  // final fallback

  const template = pool[Math.floor(Math.random() * pool.length)]
  // Pass avgLevel as partyMaxLevel, stage=1 so calcItemLevel uses partyMaxLevel (with ±3 jitter)
  return generateItem(template, nextRarity, avgLevel, 1)
}
