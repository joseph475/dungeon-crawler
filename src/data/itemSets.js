/**
 * Named item set definitions.
 *
 * Items carry a `setId` field that links them to one of these sets.
 * Collecting 2 or 4 pieces of the same named set on a single hero
 * unlocks the corresponding tier bonus.
 *
 * Bonus shape: { mults: { statKey: multiplier }, adds: { statKey: addedValue } }
 *   mults — multiplicative (e.g. { atk: 1.10 } = ATK ×1.10)
 *   adds  — additive        (e.g. { crit: 0.06 } = +6% crit rate)
 *
 * Each threshold defines the ADDITIONAL bonus unlocked at that count.
 * Collecting 4pc gives you BOTH 2pc and 4pc bonuses.
 */

export const ITEM_SET_DEFINITIONS = {

  // ── WARRIOR ──────────────────────────────────────────────────────────────────
  fury: {
    name: 'Fury',
    icon: '⚔️',
    color: 'text-red-400',
    ring: 'ring-red-400',
    tiers: [
      { minPieces: 2, label: '2pc', mults: { atk: 1.10 }, adds: {} },
      { minPieces: 4, label: '4pc', mults: { atk: 1.08 }, adds: { crit: 0.06 } },
    ],
  },
  iron_bastion: {
    name: 'Iron Bastion',
    icon: '🛡️',
    color: 'text-orange-300',
    ring: 'ring-orange-300',
    tiers: [
      { minPieces: 2, label: '2pc', mults: { def: 1.12 }, adds: {} },
      { minPieces: 4, label: '4pc', mults: { hp: 1.12  }, adds: {} },
    ],
  },

  // ── PALADIN ──────────────────────────────────────────────────────────────────
  crusade: {
    name: 'Holy Crusade',
    icon: '☀️',
    color: 'text-yellow-400',
    ring: 'ring-yellow-400',
    tiers: [
      { minPieces: 2, label: '2pc', mults: { hp: 1.10  }, adds: {} },
      { minPieces: 4, label: '4pc', mults: { def: 1.15 }, adds: {} },
    ],
  },
  divine_light: {
    name: 'Divine Light',
    icon: '✨',
    color: 'text-amber-300',
    ring: 'ring-amber-300',
    tiers: [
      { minPieces: 2, label: '2pc', mults: { mana: 1.12 }, adds: {} },
      { minPieces: 4, label: '4pc', mults: { hp: 1.08   }, adds: {} },
    ],
  },

  // ── MAGE ─────────────────────────────────────────────────────────────────────
  arcane: {
    name: 'Arcane Legacy',
    icon: '🪄',
    color: 'text-purple-400',
    ring: 'ring-purple-400',
    tiers: [
      { minPieces: 2, label: '2pc', mults: {},            adds: { crit: 0.06 } },
      { minPieces: 4, label: '4pc', mults: { atk: 1.12 }, adds: { crit: 0.04 } },
    ],
  },
  spellweave: {
    name: 'Spellweave',
    icon: '🌀',
    color: 'text-violet-400',
    ring: 'ring-violet-400',
    tiers: [
      { minPieces: 2, label: '2pc', mults: { mana: 1.12 }, adds: {} },
      { minPieces: 4, label: '4pc', mults: {},              adds: { crit: 0.05 } },
    ],
  },

  // ── HEALER ───────────────────────────────────────────────────────────────────
  nature: {
    name: "Nature's Grace",
    icon: '🌿',
    color: 'text-emerald-400',
    ring: 'ring-emerald-400',
    tiers: [
      { minPieces: 2, label: '2pc', mults: { hp: 1.12   }, adds: {} },
      { minPieces: 4, label: '4pc', mults: { mana: 1.15 }, adds: {} },
    ],
  },
  restoration: {
    name: 'Restoration',
    icon: '💚',
    color: 'text-green-400',
    ring: 'ring-green-400',
    tiers: [
      { minPieces: 2, label: '2pc', mults: { hp: 1.10  }, adds: {} },
      { minPieces: 4, label: '4pc', mults: { atk: 1.08 }, adds: {} },
    ],
  },

  // ── ASSASSIN ─────────────────────────────────────────────────────────────────
  shadow: {
    name: 'Shadow Web',
    icon: '🗡️',
    color: 'text-gray-400',
    ring: 'ring-gray-400',
    tiers: [
      { minPieces: 2, label: '2pc', mults: { spd: 1.10 }, adds: {} },
      { minPieces: 4, label: '4pc', mults: { spd: 1.08 }, adds: { crit: 0.06 } },
    ],
  },
  death_strike: {
    name: 'Death Strike',
    icon: '💀',
    color: 'text-red-300',
    ring: 'ring-red-300',
    tiers: [
      { minPieces: 2, label: '2pc', mults: {},             adds: { crit: 0.06 } },
      { minPieces: 4, label: '4pc', mults: { atk: 1.12 }, adds: {} },
    ],
  },

  // ── ROGUE ────────────────────────────────────────────────────────────────────
  phantom: {
    name: 'Phantom Edge',
    icon: '👤',
    color: 'text-orange-400',
    ring: 'ring-orange-400',
    tiers: [
      { minPieces: 2, label: '2pc', mults: { spd: 1.12 }, adds: {} },
      { minPieces: 4, label: '4pc', mults: { atk: 1.10 }, adds: {} },
    ],
  },
  shadow_cut: {
    name: 'Shadow Cut',
    icon: '🌑',
    color: 'text-slate-400',
    ring: 'ring-slate-400',
    tiers: [
      { minPieces: 2, label: '2pc', mults: {},             adds: { crit: 0.06 } },
      { minPieces: 4, label: '4pc', mults: { atk: 1.10 }, adds: {} },
    ],
  },

  // ── RANGER ───────────────────────────────────────────────────────────────────
  rangers_path: {
    name: "Ranger's Path",
    icon: '🏹',
    color: 'text-blue-400',
    ring: 'ring-blue-400',
    tiers: [
      { minPieces: 2, label: '2pc', mults: { atk: 1.10 }, adds: {} },
      { minPieces: 4, label: '4pc', mults: { atk: 1.08 }, adds: { crit: 0.06 } },
    ],
  },
  eagles_eye: {
    name: "Eagle's Eye",
    icon: '🔭',
    color: 'text-sky-400',
    ring: 'ring-sky-400',
    tiers: [
      { minPieces: 2, label: '2pc', mults: { hp: 1.10  }, adds: {} },
      { minPieces: 4, label: '4pc', mults: { atk: 1.08 }, adds: {} },
    ],
  },

  // ── SHAMAN ───────────────────────────────────────────────────────────────────
  storm: {
    name: 'Storm Caller',
    icon: '⛈️',
    color: 'text-teal-400',
    ring: 'ring-teal-400',
    tiers: [
      { minPieces: 2, label: '2pc', mults: { atk: 1.10  }, adds: {} },
      { minPieces: 4, label: '4pc', mults: { mana: 1.12 }, adds: {} },
    ],
  },
  earth_totem: {
    name: 'Earth Totem',
    icon: '🪨',
    color: 'text-lime-400',
    ring: 'ring-lime-400',
    tiers: [
      { minPieces: 2, label: '2pc', mults: { def: 1.10 }, adds: {} },
      { minPieces: 4, label: '4pc', mults: { hp: 1.12  }, adds: {} },
    ],
  },
}

/**
 * Given a setId and number of equipped set pieces,
 * compute the combined set bonus (all applicable tiers merged).
 * Returns { mults: {...}, adds: {...} } or null if no set found / not enough pieces.
 */
export function computeSetBonus(setId, equippedCount) {
  const def = ITEM_SET_DEFINITIONS[setId]
  if (!def) return null

  const mergedMults = {}
  const mergedAdds  = {}

  for (const tier of def.tiers) {
    if (equippedCount < tier.minPieces) break
    Object.entries(tier.mults ?? {}).forEach(([k, v]) => {
      mergedMults[k] = (mergedMults[k] ?? 1) * v
    })
    Object.entries(tier.adds ?? {}).forEach(([k, v]) => {
      mergedAdds[k] = (mergedAdds[k] ?? 0) + v
    })
  }

  if (!Object.keys(mergedMults).length && !Object.keys(mergedAdds).length) return null
  return { mults: mergedMults, adds: mergedAdds }
}

/**
 * Get the highest tier label active for a piece count.
 */
export function getActiveTierLabel(setId, equippedCount) {
  const def = ITEM_SET_DEFINITIONS[setId]
  if (!def) return null
  let label = null
  for (const tier of def.tiers) {
    if (equippedCount >= tier.minPieces) label = tier.label
    else break
  }
  return label
}
