/**
 * Skill rank utilities.
 *
 * Heroes can upgrade basic / skill / ultimate slots from Rank 1 to Rank 5.
 * Passives are not upgradeable — they scale with job advancement instead.
 */

export const MAX_RANK = 5

/** Shard cost to advance FROM rank N (index 0 = cost to go 1→2, etc.) */
export const UPGRADE_COSTS = [20, 50, 100, 200]

/** Returns this hero's current rank for a skill id (defaults to 1). */
export function getSkillRank(hero, skillId) {
  return hero?.skillRanks?.[skillId] ?? 1
}

/** Shard cost to upgrade to the next rank, or null if already max rank. */
export function getUpgradeCost(currentRank) {
  if (currentRank >= MAX_RANK) return null
  return UPGRADE_COSTS[currentRank - 1]
}

/** Damage / heal multiplier bonus from rank (+15% per rank above 1). */
export function rankDmgMult(rank) {
  return 1 + (rank - 1) * 0.15
}

/** Extra effect ticks granted by rank (+1 per rank above 1). */
export function rankExtraTicks(rank) {
  return rank - 1
}

/** Cooldown turn reduction from rank (−1 at rank 3, −2 at rank 5). */
export function rankCdReduction(rank) {
  return Math.floor((rank - 1) / 2)
}
