/**
 * Item templates — no hardcoded stats.
 * All stat values are generated dynamically in loot.js based on item level + rarity.
 *
 * Template fields:
 *   id            – unique key
 *   name          – display name
 *   icon          – emoji
 *   slot          – weapon | helmet | chest | gloves | boots | ring | amulet | relic
 *   classLock     – classId or null (any class)
 *   minStage      – earliest stage this template can appear
 *   mainStat      – fixed primary stat key for this item, or 'random' for amulets
 *   mainStatPool  – (amulets only) pool to pick random main stat from
 *   subMainStat   – optional second fixed stat (e.g. helmet always gives HP + DEF)
 *   secondaryPool – stats that can appear as randomized secondary rolls
 */

// ─── Secondary pools by archetype ────────────────────────────────────────────

const SEC = {
  phys:    ['def', 'hp', 'crit', 'critDmg', 'spd'],
  magic:   ['mana', 'hp', 'crit', 'critDmg', 'spd'],
  tank:    ['hp', 'atk', 'mana', 'crit', 'spd'],
  support: ['hp', 'atk', 'def', 'mana', 'crit'],
  hybrid:  ['atk', 'def', 'hp', 'mana', 'crit', 'spd'],
  armor:   ['atk', 'mana', 'spd', 'crit', 'critDmg'],
  boots:   ['atk', 'def', 'hp', 'crit', 'mana'],
  ring:    ['atk', 'def', 'spd', 'crit', 'critDmg', 'mana'],
  amulet:  ['atk', 'def', 'spd', 'crit', 'critDmg', 'mana', 'hp'],
}

// ─── Rarity stat value color (applied to each stat line in the UI) ───────────

export const RARITY_STAT_COLOR = {
  common:    'text-gray-300',
  uncommon:  'text-green-400',
  rare:      'text-blue-400',
  epic:      'text-purple-400',
  legendary: 'text-yellow-300',
}

export const RARITY_SECONDARY_COLOR = {
  common:    'text-gray-500',
  uncommon:  'text-green-700',
  rare:      'text-blue-700',
  epic:      'text-purple-700',
  legendary: 'text-amber-700',
}

// ─── Secondary stat count by rarity ──────────────────────────────────────────

export const RARITY_SECONDARY_COUNT = {
  common:    1,
  uncommon:  2,
  rare:      3,
  epic:      4,
  legendary: 5,
}

// ─── Item templates ───────────────────────────────────────────────────────────

export const ITEMS = [

  // ── WARRIOR ─────────────────────────────────────────────────────────────────
  // Weapons (3 tiers: early / mid / late)
  { id: 'iron_sword',        name: 'Iron Sword',         icon: '⚔️',  slot: 'weapon',  classLock: 'warrior', minStage: 1,  mainStat: 'atk',  subMainStat: null,  secondaryPool: SEC.phys    },
  { id: 'steel_sword',       name: 'Steel Sword',        icon: '⚔️',  slot: 'weapon',  classLock: 'warrior', minStage: 15, mainStat: 'atk',  subMainStat: null,  secondaryPool: SEC.phys    },
  { id: 'dragonbone_sword',  name: 'Dragonbone Sword',   icon: '🐉',  slot: 'weapon',  classLock: 'warrior', minStage: 45, mainStat: 'atk',  subMainStat: null,  secondaryPool: SEC.phys    },
  // Armor
  { id: 'chain_helm',        name: 'Chain Helm',         icon: '⛑️',  slot: 'helmet',  classLock: 'warrior', minStage: 1,  mainStat: 'hp',   subMainStat: 'def', secondaryPool: SEC.armor   },
  { id: 'fortress_helm',     name: 'Fortress Helm',      icon: '⛑️',  slot: 'helmet',  classLock: 'warrior', minStage: 30, mainStat: 'hp',   subMainStat: 'def', secondaryPool: SEC.armor   },
  { id: 'chain_vest',        name: 'Chain Vest',         icon: '🧥',  slot: 'chest',   classLock: 'warrior', minStage: 1,  mainStat: 'hp',   subMainStat: 'def', secondaryPool: SEC.armor   },
  { id: 'fortress_plate',    name: 'Fortress Plate',     icon: '🧥',  slot: 'chest',   classLock: 'warrior', minStage: 30, mainStat: 'hp',   subMainStat: 'def', secondaryPool: SEC.armor   },
  { id: 'war_gauntlets',     name: 'War Gauntlets',      icon: '🧤',  slot: 'gloves',  classLock: 'warrior', minStage: 5,  mainStat: 'def',  subMainStat: null,  secondaryPool: SEC.tank    },
  { id: 'iron_greaves',      name: 'Iron Greaves',       icon: '👢',  slot: 'boots',   classLock: 'warrior', minStage: 5,  mainStat: 'spd',  subMainStat: null,  secondaryPool: SEC.boots   },
  { id: 'warlord_relic',     name: 'Warlord Relic',      icon: '🏆',  slot: 'relic',   classLock: 'warrior', minStage: 20, mainStat: 'def',  subMainStat: 'hp',  secondaryPool: SEC.tank    },

  // ── PALADIN ──────────────────────────────────────────────────────────────────
  { id: 'blessed_mace',      name: 'Blessed Mace',       icon: '🔨',  slot: 'weapon',  classLock: 'paladin', minStage: 1,  mainStat: 'atk',  subMainStat: null,  secondaryPool: SEC.support },
  { id: 'templar_sword',     name: 'Templar Sword',       icon: '⚔️',  slot: 'weapon',  classLock: 'paladin', minStage: 20, mainStat: 'atk',  subMainStat: null,  secondaryPool: SEC.support },
  { id: 'holy_avenger',      name: 'Holy Avenger',        icon: '☀️',  slot: 'weapon',  classLock: 'paladin', minStage: 55, mainStat: 'atk',  subMainStat: null,  secondaryPool: SEC.support },
  { id: 'sacred_helm',       name: 'Sacred Helm',         icon: '⛑️',  slot: 'helmet',  classLock: 'paladin', minStage: 1,  mainStat: 'hp',   subMainStat: 'def', secondaryPool: SEC.support },
  { id: 'divine_plate',      name: 'Divine Plate',        icon: '🧥',  slot: 'chest',   classLock: 'paladin', minStage: 1,  mainStat: 'hp',   subMainStat: 'def', secondaryPool: SEC.support },
  { id: 'holy_gauntlets',    name: 'Holy Gauntlets',      icon: '🧤',  slot: 'gloves',  classLock: 'paladin', minStage: 5,  mainStat: 'def',  subMainStat: null,  secondaryPool: SEC.support },
  { id: 'blessed_greaves',   name: 'Blessed Greaves',     icon: '👢',  slot: 'boots',   classLock: 'paladin', minStage: 5,  mainStat: 'spd',  subMainStat: null,  secondaryPool: SEC.boots   },
  { id: 'prayer_beads',      name: 'Prayer Beads',        icon: '📿',  slot: 'amulet',  classLock: 'paladin', minStage: 5,  mainStat: 'mana', subMainStat: null,  secondaryPool: SEC.support },
  { id: 'crusader_relic',    name: 'Crusader Relic',      icon: '✝️',  slot: 'relic',   classLock: 'paladin', minStage: 20, mainStat: 'mana', subMainStat: 'def', secondaryPool: SEC.support },

  // ── MAGE ─────────────────────────────────────────────────────────────────────
  { id: 'apprentice_staff',  name: 'Apprentice Staff',    icon: '🪄',  slot: 'weapon',  classLock: 'mage',    minStage: 1,  mainStat: 'atk',  subMainStat: null,  secondaryPool: SEC.magic   },
  { id: 'elder_wand',        name: 'Elder Wand',          icon: '🪄',  slot: 'weapon',  classLock: 'mage',    minStage: 20, mainStat: 'atk',  subMainStat: null,  secondaryPool: SEC.magic   },
  { id: 'staff_of_eternity', name: 'Staff of Eternity',   icon: '⭐',  slot: 'weapon',  classLock: 'mage',    minStage: 55, mainStat: 'atk',  subMainStat: null,  secondaryPool: SEC.magic   },
  { id: 'mage_hood',         name: 'Mage Hood',           icon: '⛑️',  slot: 'helmet',  classLock: 'mage',    minStage: 1,  mainStat: 'hp',   subMainStat: 'mana',secondaryPool: SEC.armor   },
  { id: 'spellweave_robe',   name: 'Spellweave Robe',     icon: '🧥',  slot: 'chest',   classLock: 'mage',    minStage: 1,  mainStat: 'hp',   subMainStat: 'mana',secondaryPool: SEC.armor   },
  { id: 'arcane_gloves',     name: 'Arcane Gloves',       icon: '🧤',  slot: 'gloves',  classLock: 'mage',    minStage: 5,  mainStat: 'atk',  subMainStat: null,  secondaryPool: SEC.magic   },
  { id: 'silk_boots',        name: 'Silk Boots',          icon: '👢',  slot: 'boots',   classLock: 'mage',    minStage: 5,  mainStat: 'spd',  subMainStat: null,  secondaryPool: SEC.boots   },
  { id: 'mana_crystal',      name: 'Mana Crystal',        icon: '💎',  slot: 'relic',   classLock: 'mage',    minStage: 5,  mainStat: 'mana', subMainStat: null,  secondaryPool: SEC.magic   },
  { id: 'tome_of_fire',      name: 'Tome of Fire',        icon: '📕',  slot: 'relic',   classLock: 'mage',    minStage: 25, mainStat: 'mana', subMainStat: 'atk', secondaryPool: SEC.magic   },

  // ── HEALER ───────────────────────────────────────────────────────────────────
  { id: 'novice_scepter',    name: 'Novice Scepter',      icon: '✝️',  slot: 'weapon',  classLock: 'healer',  minStage: 1,  mainStat: 'atk',  subMainStat: null,  secondaryPool: SEC.support },
  { id: 'divine_scepter',    name: 'Divine Scepter',      icon: '🌟',  slot: 'weapon',  classLock: 'healer',  minStage: 20, mainStat: 'atk',  subMainStat: null,  secondaryPool: SEC.support },
  { id: 'staff_of_rebirth',  name: 'Staff of Rebirth',    icon: '💫',  slot: 'weapon',  classLock: 'healer',  minStage: 55, mainStat: 'atk',  subMainStat: null,  secondaryPool: SEC.support },
  { id: 'healers_circlet',   name: "Healer's Circlet",    icon: '⛑️',  slot: 'helmet',  classLock: 'healer',  minStage: 1,  mainStat: 'hp',   subMainStat: 'mana',secondaryPool: SEC.support },
  { id: 'priests_vestment',  name: "Priest's Vestment",   icon: '🧥',  slot: 'chest',   classLock: 'healer',  minStage: 1,  mainStat: 'hp',   subMainStat: 'mana',secondaryPool: SEC.support },
  { id: 'healing_gloves',    name: 'Healing Gloves',      icon: '🧤',  slot: 'gloves',  classLock: 'healer',  minStage: 5,  mainStat: 'atk',  subMainStat: null,  secondaryPool: SEC.support },
  { id: 'spirit_boots',      name: 'Spirit Boots',        icon: '👢',  slot: 'boots',   classLock: 'healer',  minStage: 5,  mainStat: 'spd',  subMainStat: null,  secondaryPool: SEC.boots   },
  { id: 'sacred_tome',       name: 'Sacred Tome',         icon: '📖',  slot: 'relic',   classLock: 'healer',  minStage: 10, mainStat: 'mana', subMainStat: 'hp',  secondaryPool: SEC.support },

  // ── ASSASSIN ─────────────────────────────────────────────────────────────────
  { id: 'rusty_dagger',      name: 'Rusty Dagger',        icon: '🗡️',  slot: 'weapon',  classLock: 'assassin',minStage: 1,  mainStat: 'atk',  subMainStat: null,  secondaryPool: SEC.phys    },
  { id: 'venomfang_blade',   name: 'Venomfang Blade',     icon: '🐍',  slot: 'weapon',  classLock: 'assassin',minStage: 20, mainStat: 'atk',  subMainStat: null,  secondaryPool: SEC.phys    },
  { id: 'void_daggers',      name: 'Void Daggers',        icon: '🌑',  slot: 'weapon',  classLock: 'assassin',minStage: 55, mainStat: 'atk',  subMainStat: null,  secondaryPool: SEC.phys    },
  { id: 'assassin_hood',     name: 'Assassin Hood',       icon: '⛑️',  slot: 'helmet',  classLock: 'assassin',minStage: 1,  mainStat: 'hp',   subMainStat: 'def', secondaryPool: SEC.armor   },
  { id: 'shadow_cloak',      name: 'Shadow Cloak',        icon: '🧥',  slot: 'chest',   classLock: 'assassin',minStage: 1,  mainStat: 'hp',   subMainStat: 'def', secondaryPool: SEC.armor   },
  { id: 'leather_wraps',     name: 'Leather Wraps',       icon: '🧤',  slot: 'gloves',  classLock: 'assassin',minStage: 5,  mainStat: 'atk',  subMainStat: null,  secondaryPool: SEC.phys    },
  { id: 'shadow_boots',      name: 'Shadow Boots',        icon: '👢',  slot: 'boots',   classLock: 'assassin',minStage: 5,  mainStat: 'spd',  subMainStat: null,  secondaryPool: SEC.boots   },
  { id: 'death_mark_ring',   name: 'Death Mark Ring',     icon: '💍',  slot: 'ring',    classLock: 'assassin',minStage: 15, mainStat: 'crit', subMainStat: null,  secondaryPool: SEC.phys    },

  // ── ROGUE ────────────────────────────────────────────────────────────────────
  { id: 'throwing_knives',   name: 'Throwing Knives',     icon: '🪃',  slot: 'weapon',  classLock: 'rogue',   minStage: 1,  mainStat: 'atk',  subMainStat: null,  secondaryPool: SEC.phys    },
  { id: 'phantom_edge',      name: 'Phantom Edge',        icon: '👤',  slot: 'weapon',  classLock: 'rogue',   minStage: 20, mainStat: 'atk',  subMainStat: null,  secondaryPool: SEC.phys    },
  { id: 'hurricane_blades',  name: 'Hurricane Blades',    icon: '🌪️',  slot: 'weapon',  classLock: 'rogue',   minStage: 55, mainStat: 'atk',  subMainStat: null,  secondaryPool: SEC.phys    },
  { id: 'rogue_mask',        name: 'Rogue Mask',          icon: '⛑️',  slot: 'helmet',  classLock: 'rogue',   minStage: 1,  mainStat: 'hp',   subMainStat: 'def', secondaryPool: SEC.armor   },
  { id: 'rogue_leathers',    name: 'Rogue Leathers',      icon: '🧥',  slot: 'chest',   classLock: 'rogue',   minStage: 1,  mainStat: 'hp',   subMainStat: 'def', secondaryPool: SEC.armor   },
  { id: 'nimble_gloves',     name: 'Nimble Gloves',       icon: '🧤',  slot: 'gloves',  classLock: 'rogue',   minStage: 5,  mainStat: 'atk',  subMainStat: null,  secondaryPool: SEC.phys    },
  { id: 'soft_boots',        name: 'Soft Boots',          icon: '👢',  slot: 'boots',   classLock: 'rogue',   minStage: 5,  mainStat: 'spd',  subMainStat: null,  secondaryPool: SEC.boots   },
  { id: 'smoke_bombs',       name: 'Smoke Bombs',         icon: '💨',  slot: 'relic',   classLock: 'rogue',   minStage: 10, mainStat: 'spd',  subMainStat: null,  secondaryPool: SEC.phys    },

  // ── RANGER ───────────────────────────────────────────────────────────────────
  { id: 'shortbow',          name: 'Shortbow',            icon: '🏹',  slot: 'weapon',  classLock: 'ranger',  minStage: 1,  mainStat: 'atk',  subMainStat: null,  secondaryPool: SEC.phys    },
  { id: 'longbow_of_storms', name: 'Longbow of Storms',   icon: '⛈️',  slot: 'weapon',  classLock: 'ranger',  minStage: 20, mainStat: 'atk',  subMainStat: null,  secondaryPool: SEC.phys    },
  { id: 'void_bow',          name: 'Void Bow',            icon: '🕳️',  slot: 'weapon',  classLock: 'ranger',  minStage: 55, mainStat: 'atk',  subMainStat: null,  secondaryPool: SEC.phys    },
  { id: 'ranger_cap',        name: 'Ranger Cap',          icon: '⛑️',  slot: 'helmet',  classLock: 'ranger',  minStage: 1,  mainStat: 'hp',   subMainStat: 'def', secondaryPool: SEC.armor   },
  { id: 'ranger_coat',       name: 'Ranger Coat',         icon: '🧥',  slot: 'chest',   classLock: 'ranger',  minStage: 1,  mainStat: 'hp',   subMainStat: 'def', secondaryPool: SEC.armor   },
  { id: 'archer_gloves',     name: 'Archer Gloves',       icon: '🧤',  slot: 'gloves',  classLock: 'ranger',  minStage: 5,  mainStat: 'atk',  subMainStat: null,  secondaryPool: SEC.phys    },
  { id: 'ranger_boots',      name: 'Ranger Boots',        icon: '👢',  slot: 'boots',   classLock: 'ranger',  minStage: 5,  mainStat: 'spd',  subMainStat: null,  secondaryPool: SEC.boots   },
  { id: 'eagle_eye_helm',    name: 'Eagle Eye Helm',      icon: '⛑️',  slot: 'helmet',  classLock: 'ranger',  minStage: 30, mainStat: 'hp',   subMainStat: 'crit',secondaryPool: SEC.phys    },
  { id: 'leather_quiver',    name: 'Leather Quiver',      icon: '🧺',  slot: 'relic',   classLock: 'ranger',  minStage: 5,  mainStat: 'atk',  subMainStat: null,  secondaryPool: SEC.phys    },

  // ── SHAMAN ───────────────────────────────────────────────────────────────────
  { id: 'bone_totem',        name: 'Bone Totem',          icon: '🦴',  slot: 'weapon',  classLock: 'shaman',  minStage: 1,  mainStat: 'atk',  subMainStat: null,  secondaryPool: SEC.hybrid  },
  { id: 'thunder_staff',     name: 'Thunder Staff',       icon: '⛈️',  slot: 'weapon',  classLock: 'shaman',  minStage: 20, mainStat: 'atk',  subMainStat: null,  secondaryPool: SEC.hybrid  },
  { id: 'storm_king_staff',  name: "Storm King's Staff",  icon: '🌩️',  slot: 'weapon',  classLock: 'shaman',  minStage: 55, mainStat: 'atk',  subMainStat: null,  secondaryPool: SEC.hybrid  },
  { id: 'shaman_mask',       name: 'Shaman Mask',         icon: '⛑️',  slot: 'helmet',  classLock: 'shaman',  minStage: 1,  mainStat: 'hp',   subMainStat: 'mana',secondaryPool: SEC.armor   },
  { id: 'spirit_wrap',       name: 'Spirit Wrap',         icon: '🧥',  slot: 'chest',   classLock: 'shaman',  minStage: 1,  mainStat: 'hp',   subMainStat: 'mana',secondaryPool: SEC.armor   },
  { id: 'shaman_wraps',      name: 'Shaman Wraps',        icon: '🧤',  slot: 'gloves',  classLock: 'shaman',  minStage: 5,  mainStat: 'atk',  subMainStat: null,  secondaryPool: SEC.hybrid  },
  { id: 'spirit_boots',      name: 'Spirit Boots',        icon: '👢',  slot: 'boots',   classLock: 'shaman',  minStage: 5,  mainStat: 'spd',  subMainStat: null,  secondaryPool: SEC.boots   },
  { id: 'storm_fetish',      name: 'Storm Fetish',        icon: '⚡',  slot: 'relic',   classLock: 'shaman',  minStage: 10, mainStat: 'mana', subMainStat: null,  secondaryPool: SEC.hybrid  },
  { id: 'earth_core_relic',  name: 'Earth Core Relic',    icon: '🪨',  slot: 'relic',   classLock: 'shaman',  minStage: 30, mainStat: 'def',  subMainStat: 'hp',  secondaryPool: SEC.hybrid  },

  // ── UNIVERSAL ────────────────────────────────────────────────────────────────
  { id: 'adventurers_ring',  name: "Adventurer's Ring",   icon: '💍',  slot: 'ring',    classLock: null,      minStage: 1,  mainStat: 'hp',   subMainStat: null,  secondaryPool: SEC.ring    },
  { id: 'warriors_ring',     name: "Warrior's Ring",      icon: '💍',  slot: 'ring',    classLock: null,      minStage: 15, mainStat: 'atk',  subMainStat: null,  secondaryPool: SEC.ring    },
  { id: 'speed_boots',       name: 'Speed Boots',         icon: '👟',  slot: 'boots',   classLock: null,      minStage: 10, mainStat: 'spd',  subMainStat: null,  secondaryPool: SEC.boots   },
  { id: 'heart_of_chaos',    name: 'Heart of Chaos',      icon: '💜',  slot: 'ring',    classLock: null,      minStage: 50, mainStat: 'atk',  subMainStat: 'crit',secondaryPool: SEC.ring    },

  // Amulets — random main stat, broad secondary pool
  { id: 'copper_amulet',     name: 'Copper Amulet',       icon: '📿',  slot: 'amulet',  classLock: null,      minStage: 1,  mainStat: 'random', mainStatPool: ['atk','def','hp','mana'],             secondaryPool: SEC.amulet },
  { id: 'silver_amulet',     name: 'Silver Amulet',       icon: '📿',  slot: 'amulet',  classLock: null,      minStage: 15, mainStat: 'random', mainStatPool: ['atk','def','hp','mana','spd'],        secondaryPool: SEC.amulet },
  { id: 'mystic_amulet',     name: 'Mystic Amulet',       icon: '🔮',  slot: 'amulet',  classLock: null,      minStage: 35, mainStat: 'random', mainStatPool: ['atk','def','hp','mana','spd','crit'], secondaryPool: SEC.amulet },
  { id: 'amulet_of_power',   name: 'Amulet of Power',     icon: '🌟',  slot: 'amulet',  classLock: null,      minStage: 60, mainStat: 'random', mainStatPool: ['atk','def','hp','mana','spd','crit','critDmg'], secondaryPool: SEC.amulet },
]
