/**
 * Base class definitions for all 8 hero classes.
 * Stats shown are BASE values at level 1.
 * growthPerLevel defines how much each stat increases per level-up.
 */

export const CLASSES = {
  warrior: {
    id: 'warrior',
    name: 'Warrior',
    icon: '⚔️',
    role: 'tank',
    description: 'High HP and DEF. Absorbs damage for the party.',
    baseStats: {
      hp: 180,
      atk: 14,
      def: 12,
      spd: 5,
      crit: 0.05,
      critDmg: 1.5,
      mana: 100,
    },
    growthPerLevel: {
      hp: 22,
      atk: 1.8,
      def: 2.0,
      spd: 0.1,
      crit: 0.001,
      critDmg: 0.005,
      mana: 0,
    },
  },

  paladin: {
    id: 'paladin',
    name: 'Paladin',
    icon: '🛡️',
    role: 'support-tank',
    description: 'Tanky support who buffs and heals allies.',
    baseStats: {
      hp: 160,
      atk: 10,
      def: 10,
      spd: 5,
      crit: 0.04,
      critDmg: 1.4,
      mana: 120,
    },
    growthPerLevel: {
      hp: 18,
      atk: 1.4,
      def: 1.8,
      spd: 0.1,
      crit: 0.001,
      critDmg: 0.004,
      mana: 2,
    },
  },

  mage: {
    id: 'mage',
    name: 'Mage',
    icon: '🔮',
    role: 'burst-dps',
    description: 'Devastating magic damage. Extremely fragile.',
    baseStats: {
      hp: 75,
      atk: 26,
      def: 3,
      spd: 7,
      crit: 0.07,
      critDmg: 1.8,
      mana: 140,
    },
    growthPerLevel: {
      hp: 8,
      atk: 3.5,
      def: 0.4,
      spd: 0.15,
      crit: 0.002,
      critDmg: 0.01,
      mana: 3,
    },
  },

  healer: {
    id: 'healer',
    name: 'Healer',
    icon: '✝️',
    role: 'healer',
    description: 'Sustained healing and resurrection support.',
    baseStats: {
      hp: 95,
      atk: 8,
      def: 5,
      spd: 6,
      crit: 0.04,
      critDmg: 1.4,
      mana: 150,
    },
    growthPerLevel: {
      hp: 10,
      atk: 1.0,
      def: 0.8,
      spd: 0.1,
      crit: 0.001,
      critDmg: 0.004,
      mana: 4,
    },
  },

  assassin: {
    id: 'assassin',
    name: 'Assassin',
    icon: '🗡️',
    role: 'single-target-dps',
    description: 'Extremely high single-target crit damage.',
    baseStats: {
      hp: 88,
      atk: 22,
      def: 4,
      spd: 10,
      crit: 0.15,
      critDmg: 2.2,
      mana: 100,
    },
    growthPerLevel: {
      hp: 9,
      atk: 3.0,
      def: 0.5,
      spd: 0.2,
      crit: 0.003,
      critDmg: 0.015,
      mana: 1,
    },
  },

  rogue: {
    id: 'rogue',
    name: 'Rogue',
    icon: '🪃',
    role: 'multi-hit-dps',
    description: 'Fast multi-hit attacks with high evasion.',
    baseStats: {
      hp: 90,
      atk: 16,
      def: 4,
      spd: 13,
      crit: 0.10,
      critDmg: 1.7,
      mana: 100,
    },
    growthPerLevel: {
      hp: 9,
      atk: 2.2,
      def: 0.5,
      spd: 0.25,
      crit: 0.002,
      critDmg: 0.008,
      mana: 1,
    },
  },

  ranger: {
    id: 'ranger',
    name: 'Ranger',
    icon: '🏹',
    role: 'consistent-dps',
    description: 'Ranged physical DPS. Consistent and reliable.',
    baseStats: {
      hp: 100,
      atk: 18,
      def: 5,
      spd: 9,
      crit: 0.08,
      critDmg: 1.75,
      mana: 110,
    },
    growthPerLevel: {
      hp: 11,
      atk: 2.4,
      def: 0.6,
      spd: 0.18,
      crit: 0.002,
      critDmg: 0.008,
      mana: 2,
    },
  },

  shaman: {
    id: 'shaman',
    name: 'Shaman',
    icon: '⚡',
    role: 'hybrid',
    description: 'Elemental damage hybrid with minor healing.',
    baseStats: {
      hp: 105,
      atk: 18,
      def: 5,
      spd: 7,
      crit: 0.06,
      critDmg: 1.6,
      mana: 130,
    },
    growthPerLevel: {
      hp: 12,
      atk: 2.5,
      def: 0.7,
      spd: 0.12,
      crit: 0.0015,
      critDmg: 0.007,
      mana: 3,
    },
  },
}

/**
 * Calculate a hero's stats at a given level.
 * @param {string} classId
 * @param {number} level
 * @returns {object} computed stat block
 */
export function getStatsAtLevel(classId, level) {
  const cls = CLASSES[classId]
  if (!cls) throw new Error(`Unknown class: ${classId}`)
  const { baseStats, growthPerLevel } = cls
  const lvl = Math.max(1, level)
  const computed = {}
  for (const stat of Object.keys(baseStats)) {
    const growth = growthPerLevel[stat] ?? 0
    computed[stat] = baseStats[stat] + growth * (lvl - 1)
  }
  computed.hp = Math.floor(computed.hp)
  computed.atk = Math.round(computed.atk * 10) / 10
  computed.def = Math.round(computed.def * 10) / 10
  computed.spd = Math.round(computed.spd * 100) / 100
  computed.mana = Math.floor(computed.mana)
  return computed
}
