/**
 * Achievement definitions.
 *
 * condition.stat: 'kills' | 'clears' | 'goldEarned' | 'itemsFound' | 'highestStage'
 * reward keys: goldMult (additive fraction), xpMult, atkPct, defPct
 */

export const ACHIEVEMENTS = [
  // ── Kill milestones ──────────────────────────────────────────────────────
  {
    id: 'kills_100',
    name: 'First Blood',
    icon: '⚔️',
    desc: 'Kill 100 enemies',
    condition: { stat: 'kills', threshold: 100 },
    reward: { goldMult: 0.01 },
    rewardLabel: '+1% gold',
    category: 'Combat',
  },
  {
    id: 'kills_500',
    name: 'Slayer',
    icon: '🗡️',
    desc: 'Kill 500 enemies',
    condition: { stat: 'kills', threshold: 500 },
    reward: { goldMult: 0.02 },
    rewardLabel: '+2% gold',
    category: 'Combat',
  },
  {
    id: 'kills_2000',
    name: 'Warlord',
    icon: '💀',
    desc: 'Kill 2,000 enemies',
    condition: { stat: 'kills', threshold: 2000 },
    reward: { goldMult: 0.03 },
    rewardLabel: '+3% gold',
    category: 'Combat',
  },

  // ── Stage clears ─────────────────────────────────────────────────────────
  {
    id: 'clears_50',
    name: 'Dungeon Diver',
    icon: '🏰',
    desc: 'Clear 50 stages',
    condition: { stat: 'clears', threshold: 50 },
    reward: { xpMult: 0.01 },
    rewardLabel: '+1% XP',
    category: 'Progress',
  },
  {
    id: 'clears_200',
    name: 'Veteran',
    icon: '🛡️',
    desc: 'Clear 200 stages',
    condition: { stat: 'clears', threshold: 200 },
    reward: { xpMult: 0.02 },
    rewardLabel: '+2% XP',
    category: 'Progress',
  },
  {
    id: 'clears_1000',
    name: 'Eternal Champion',
    icon: '👑',
    desc: 'Clear 1,000 stages',
    condition: { stat: 'clears', threshold: 1000 },
    reward: { xpMult: 0.03 },
    rewardLabel: '+3% XP',
    category: 'Progress',
  },

  // ── Stage reached ─────────────────────────────────────────────────────────
  {
    id: 'stage_25',
    name: 'Deep Delver',
    icon: '🪨',
    desc: 'Reach stage 25',
    condition: { stat: 'highestStage', threshold: 25 },
    reward: { atkPct: 0.01 },
    rewardLabel: '+1% ATK',
    category: 'Progress',
  },
  {
    id: 'stage_50',
    name: 'Inferno Walker',
    icon: '🔥',
    desc: 'Reach stage 50',
    condition: { stat: 'highestStage', threshold: 50 },
    reward: { atkPct: 0.02 },
    rewardLabel: '+2% ATK',
    category: 'Progress',
  },
  {
    id: 'stage_100',
    name: 'Realm Conqueror',
    icon: '⚡',
    desc: 'Reach stage 100',
    condition: { stat: 'highestStage', threshold: 100 },
    reward: { atkPct: 0.05 },
    rewardLabel: '+5% ATK',
    category: 'Progress',
  },

  // ── Economy ───────────────────────────────────────────────────────────────
  {
    id: 'gold_10k',
    name: 'Treasure Hunter',
    icon: '🪙',
    desc: 'Earn 10,000 gold lifetime',
    condition: { stat: 'goldEarned', threshold: 10000 },
    reward: { defPct: 0.01 },
    rewardLabel: '+1% DEF',
    category: 'Economy',
  },
  {
    id: 'gold_100k',
    name: 'Gold Baron',
    icon: '💰',
    desc: 'Earn 100,000 gold lifetime',
    condition: { stat: 'goldEarned', threshold: 100000 },
    reward: { defPct: 0.02 },
    rewardLabel: '+2% DEF',
    category: 'Economy',
  },
  {
    id: 'items_100',
    name: 'Collector',
    icon: '🎁',
    desc: 'Find 100 items',
    condition: { stat: 'itemsFound', threshold: 100 },
    reward: { xpMult: 0.01 },
    rewardLabel: '+1% XP',
    category: 'Economy',
  },
]

/** Get total stacking bonus from a set of unlocked achievement ids. */
export function getAchievementBonus(unlockedAchievements) {
  const bonus = { goldMult: 1, xpMult: 1, atkPct: 0, defPct: 0 }
  ACHIEVEMENTS.forEach((a) => {
    if (!unlockedAchievements[a.id]) return
    if (a.reward.goldMult) bonus.goldMult += a.reward.goldMult
    if (a.reward.xpMult)   bonus.xpMult  += a.reward.xpMult
    if (a.reward.atkPct)   bonus.atkPct  += a.reward.atkPct
    if (a.reward.defPct)   bonus.defPct  += a.reward.defPct
  })
  return bonus
}
