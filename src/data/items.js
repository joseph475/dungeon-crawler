/**
 * Item templates — no hardcoded stats.
 * All stat values are generated dynamically in loot.js based on item level + rarity.
 *
 * Slot rules enforced here:
 *   weapon  → main: flat ATK
 *   helmet  → main: flat HP  (sub: DEF for tanks, mana for magic)
 *   chest   → main: flat DEF (sub: HP always)
 *   gloves  → main: random from ['crit','critDmg','atk']
 *   boots   → main: SPD (only slot that gives SPD — no SPD in any secondary pools)
 *   ring    → main: anything except SPD
 *   amulet  → main: random pool (no SPD)
 *   relic   → main: class-themed (no SPD)
 *
 * Secondary pools intentionally exclude SPD — boots remain the unique SPD slot.
 * hpRegen and manaRegen can appear as secondary stats for sustained value.
 */

// ─── Secondary pools by archetype ────────────────────────────────────────────

const SEC = {
  phys:    ['def', 'hp', 'crit', 'critDmg', 'hpRegen', 'evasion'],
  magic:   ['mana', 'hp', 'crit', 'critDmg', 'manaRegen'],
  tank:    ['hp', 'atk', 'mana', 'crit', 'hpRegen'],
  support: ['hp', 'atk', 'def', 'mana', 'crit', 'hpRegen', 'manaRegen'],
  hybrid:  ['atk', 'def', 'hp', 'mana', 'crit', 'hpRegen', 'manaRegen', 'evasion'],
  armor:   ['atk', 'mana', 'crit', 'critDmg', 'hpRegen'],
  boots:   ['atk', 'def', 'hp', 'crit', 'hpRegen', 'evasion'],
  ring:    ['atk', 'def', 'crit', 'critDmg', 'mana', 'manaRegen'],
  amulet:  ['atk', 'def', 'crit', 'critDmg', 'mana', 'hp', 'hpRegen', 'manaRegen'],
}

// Gloves main stat pool used on all glove items
const GLOVE_MAIN = ['crit', 'critDmg', 'atk']

// ─── Rarity stat value color ──────────────────────────────────────────────────

export const RARITY_STAT_COLOR = {
  common:    'text-gray-300',
  uncommon:  'text-green-400',
  rare:      'text-blue-400',
  epic:      'text-purple-400',
  legendary: 'text-yellow-300',
  mythic:    'text-red-300',
}

export const RARITY_SECONDARY_COLOR = {
  common:    'text-gray-400',
  uncommon:  'text-green-500',
  rare:      'text-blue-400',
  epic:      'text-purple-400',
  legendary: 'text-amber-500',
  mythic:    'text-rose-400',
}

// ─── Secondary stat count by rarity ──────────────────────────────────────────

export const RARITY_SECONDARY_COUNT = {
  common:    1,
  uncommon:  2,
  rare:      3,
  epic:      4,
  legendary: 5,
  mythic:    6, // 2 fixed normal + 2 fixed skill traits + 2 random
}

// ─── Item templates ───────────────────────────────────────────────────────────

export const ITEMS = [

  // ── WARRIOR ──────────────────────────────────────────────────────────────────
  { id: 'iron_sword',        name: 'Iron Sword',         icon: '⚔️',  slot: 'weapon',  classLock: 'warrior', setId: 'fury', minStage: 1,  mainStat: 'atk',                                            secondaryPool: SEC.phys    },
  { id: 'steel_sword',       name: 'Steel Sword',        icon: '⚔️',  slot: 'weapon',  classLock: 'warrior', setId: 'fury', minStage: 15, mainStat: 'atk',                                            secondaryPool: SEC.phys    },
  { id: 'dragonbone_sword',  name: 'Dragonbone Sword',   icon: '🐉',  slot: 'weapon',  classLock: 'warrior', setId: 'fury', minStage: 45, mainStat: 'atk',                                            secondaryPool: SEC.phys    },
  { id: 'chain_helm',        name: 'Chain Helm',         icon: '⛑️',  slot: 'helmet',  classLock: 'warrior', setId: 'iron_bastion', minStage: 1,  mainStat: 'hp',   subMainStat: 'def',                      secondaryPool: SEC.armor   },
  { id: 'fortress_helm',     name: 'Fortress Helm',      icon: '⛑️',  slot: 'helmet',  classLock: 'warrior', setId: 'iron_bastion', minStage: 30, mainStat: 'hp',   subMainStat: 'def',                      secondaryPool: SEC.armor   },
  { id: 'chain_vest',        name: 'Chain Vest',         icon: '🧥',  slot: 'chest',   classLock: 'warrior', setId: 'iron_bastion', minStage: 1,  mainStat: 'def',  subMainStat: 'hp',                       secondaryPool: SEC.armor   },
  { id: 'fortress_plate',    name: 'Fortress Plate',     icon: '🧥',  slot: 'chest',   classLock: 'warrior', setId: 'iron_bastion', minStage: 30, mainStat: 'def',  subMainStat: 'hp',                       secondaryPool: SEC.armor   },
  { id: 'war_gauntlets',     name: 'War Gauntlets',      icon: '🧤',  slot: 'gloves',  classLock: 'warrior', setId: 'fury',         minStage: 5,  mainStat: 'random', mainStatPool: GLOVE_MAIN,             secondaryPool: SEC.tank    },
  { id: 'iron_greaves',      name: 'Iron Greaves',       icon: '👢',  slot: 'boots',   classLock: 'warrior', setId: 'fury',         minStage: 5,  mainStat: 'spd',                                            secondaryPool: SEC.boots   },
  { id: 'warlord_relic',     name: 'Warlord Relic',      icon: '🏆',  slot: 'relic',   classLock: 'warrior', setId: 'iron_bastion', minStage: 20, mainStat: 'def',  subMainStat: 'hp',                       secondaryPool: SEC.tank    },

  // ── PALADIN ──────────────────────────────────────────────────────────────────
  { id: 'blessed_mace',      name: 'Blessed Mace',       icon: '🔨',  slot: 'weapon',  classLock: 'paladin', setId: 'divine_light', minStage: 1,  mainStat: 'atk',                                            secondaryPool: SEC.support },
  { id: 'templar_sword',     name: 'Templar Sword',      icon: '⚔️',  slot: 'weapon',  classLock: 'paladin', setId: 'crusade',      minStage: 20, mainStat: 'atk',                                            secondaryPool: SEC.support },
  { id: 'holy_avenger',      name: 'Holy Avenger',       icon: '☀️',  slot: 'weapon',  classLock: 'paladin', setId: 'crusade',      minStage: 55, mainStat: 'atk',                                            secondaryPool: SEC.support },
  { id: 'sacred_helm',       name: 'Sacred Helm',        icon: '⛑️',  slot: 'helmet',  classLock: 'paladin', setId: 'crusade',      minStage: 1,  mainStat: 'hp',   subMainStat: 'def',                      secondaryPool: SEC.support },
  { id: 'divine_plate',      name: 'Divine Plate',       icon: '🧥',  slot: 'chest',   classLock: 'paladin', setId: 'crusade',      minStage: 1,  mainStat: 'def',  subMainStat: 'hp',                       secondaryPool: SEC.support },
  { id: 'holy_gauntlets',    name: 'Holy Gauntlets',     icon: '🧤',  slot: 'gloves',  classLock: 'paladin', setId: 'divine_light', minStage: 5,  mainStat: 'random', mainStatPool: GLOVE_MAIN,             secondaryPool: SEC.support },
  { id: 'blessed_greaves',   name: 'Blessed Greaves',    icon: '👢',  slot: 'boots',   classLock: 'paladin', setId: 'crusade',      minStage: 5,  mainStat: 'spd',                                            secondaryPool: SEC.boots   },
  { id: 'prayer_beads',      name: 'Prayer Beads',       icon: '📿',  slot: 'amulet',  classLock: 'paladin', setId: 'divine_light', minStage: 5,  mainStat: 'mana',                                           secondaryPool: SEC.support },
  { id: 'crusader_relic',    name: 'Crusader Relic',     icon: '✝️',  slot: 'relic',   classLock: 'paladin', setId: 'divine_light', minStage: 20, mainStat: 'mana', subMainStat: 'def',                      secondaryPool: SEC.support },

  // ── MAGE ─────────────────────────────────────────────────────────────────────
  { id: 'apprentice_staff',  name: 'Apprentice Staff',   icon: '🪄',  slot: 'weapon',  classLock: 'mage',    setId: 'arcane',     minStage: 1,  mainStat: 'atk',                                            secondaryPool: SEC.magic   },
  { id: 'elder_wand',        name: 'Elder Wand',         icon: '🪄',  slot: 'weapon',  classLock: 'mage',    setId: 'arcane',     minStage: 20, mainStat: 'atk',                                            secondaryPool: SEC.magic   },
  { id: 'staff_of_eternity', name: 'Staff of Eternity',  icon: '⭐',  slot: 'weapon',  classLock: 'mage',    setId: 'arcane',     minStage: 55, mainStat: 'atk',                                            secondaryPool: SEC.magic   },
  { id: 'mage_hood',         name: 'Mage Hood',          icon: '⛑️',  slot: 'helmet',  classLock: 'mage',    setId: 'spellweave', minStage: 1,  mainStat: 'hp',   subMainStat: 'mana',                     secondaryPool: SEC.armor   },
  { id: 'spellweave_robe',   name: 'Spellweave Robe',    icon: '🧥',  slot: 'chest',   classLock: 'mage',    setId: 'spellweave', minStage: 1,  mainStat: 'def',  subMainStat: 'hp',                       secondaryPool: SEC.armor   },
  { id: 'arcane_gloves',     name: 'Arcane Gloves',      icon: '🧤',  slot: 'gloves',  classLock: 'mage',    setId: 'arcane',     minStage: 5,  mainStat: 'random', mainStatPool: GLOVE_MAIN,             secondaryPool: SEC.magic   },
  { id: 'silk_boots',        name: 'Silk Boots',         icon: '👢',  slot: 'boots',   classLock: 'mage',    setId: 'spellweave', minStage: 5,  mainStat: 'spd',                                            secondaryPool: SEC.boots   },
  { id: 'mana_crystal',      name: 'Mana Crystal',       icon: '💎',  slot: 'relic',   classLock: 'mage',    setId: 'spellweave', minStage: 5,  mainStat: 'mana',                                           secondaryPool: SEC.magic   },
  { id: 'tome_of_fire',      name: 'Tome of Fire',       icon: '📕',  slot: 'relic',   classLock: 'mage',    setId: 'arcane',     minStage: 25, mainStat: 'mana', subMainStat: 'atk',                      secondaryPool: SEC.magic   },

  // ── HEALER ───────────────────────────────────────────────────────────────────
  { id: 'novice_scepter',    name: 'Novice Scepter',     icon: '✝️',  slot: 'weapon',  classLock: 'healer',  setId: 'nature',      minStage: 1,  mainStat: 'atk',                                            secondaryPool: SEC.support },
  { id: 'divine_scepter',    name: 'Divine Scepter',     icon: '🌟',  slot: 'weapon',  classLock: 'healer',  setId: 'nature',      minStage: 20, mainStat: 'atk',                                            secondaryPool: SEC.support },
  { id: 'staff_of_rebirth',  name: 'Staff of Rebirth',   icon: '💫',  slot: 'weapon',  classLock: 'healer',  setId: 'restoration', minStage: 55, mainStat: 'atk',                                            secondaryPool: SEC.support },
  { id: 'healers_circlet',   name: "Healer's Circlet",   icon: '⛑️',  slot: 'helmet',  classLock: 'healer',  setId: 'nature',      minStage: 1,  mainStat: 'hp',   subMainStat: 'mana',                     secondaryPool: SEC.support },
  { id: 'priests_vestment',  name: "Priest's Vestment",  icon: '🧥',  slot: 'chest',   classLock: 'healer',  setId: 'restoration', minStage: 1,  mainStat: 'def',  subMainStat: 'hp',                       secondaryPool: SEC.support },
  { id: 'healing_gloves',    name: 'Healing Gloves',     icon: '🧤',  slot: 'gloves',  classLock: 'healer',  setId: 'restoration', minStage: 5,  mainStat: 'random', mainStatPool: GLOVE_MAIN,             secondaryPool: SEC.support },
  { id: 'spirit_boots_h',    name: 'Spirit Boots',       icon: '👢',  slot: 'boots',   classLock: 'healer',  setId: 'restoration', minStage: 5,  mainStat: 'spd',                                            secondaryPool: SEC.boots   },
  { id: 'sacred_tome',       name: 'Sacred Tome',        icon: '📖',  slot: 'relic',   classLock: 'healer',  setId: 'nature',      minStage: 10, mainStat: 'mana', subMainStat: 'hp',                       secondaryPool: SEC.support },

  // ── ASSASSIN ─────────────────────────────────────────────────────────────────
  { id: 'rusty_dagger',      name: 'Rusty Dagger',       icon: '🗡️',  slot: 'weapon',  classLock: 'assassin', setId: 'death_strike', minStage: 1,  mainStat: 'atk',                                            secondaryPool: SEC.phys    },
  { id: 'venomfang_blade',   name: 'Venomfang Blade',    icon: '🐍',  slot: 'weapon',  classLock: 'assassin', setId: 'death_strike', minStage: 20, mainStat: 'atk',                                            secondaryPool: SEC.phys    },
  { id: 'void_daggers',      name: 'Void Daggers',       icon: '🌑',  slot: 'weapon',  classLock: 'assassin', setId: 'shadow',       minStage: 55, mainStat: 'atk',                                            secondaryPool: SEC.phys    },
  { id: 'assassin_hood',     name: 'Assassin Hood',      icon: '⛑️',  slot: 'helmet',  classLock: 'assassin', setId: 'shadow',       minStage: 1,  mainStat: 'hp',   subMainStat: 'def',                      secondaryPool: SEC.armor   },
  { id: 'shadow_cloak',      name: 'Shadow Cloak',       icon: '🧥',  slot: 'chest',   classLock: 'assassin', setId: 'shadow',       minStage: 1,  mainStat: 'def',  subMainStat: 'hp',                       secondaryPool: SEC.armor   },
  { id: 'leather_wraps',     name: 'Leather Wraps',      icon: '🧤',  slot: 'gloves',  classLock: 'assassin', setId: 'death_strike', minStage: 5,  mainStat: 'random', mainStatPool: GLOVE_MAIN,             secondaryPool: SEC.phys    },
  { id: 'shadow_boots',      name: 'Shadow Boots',       icon: '👢',  slot: 'boots',   classLock: 'assassin', setId: 'shadow',       minStage: 5,  mainStat: 'spd',                                            secondaryPool: SEC.boots   },
  { id: 'death_mark_ring',   name: 'Death Mark Ring',    icon: '💍',  slot: 'ring',    classLock: 'assassin', setId: 'death_strike', minStage: 15, mainStat: 'crit',                                           secondaryPool: SEC.phys    },

  // ── ROGUE ────────────────────────────────────────────────────────────────────
  { id: 'throwing_knives',   name: 'Throwing Knives',    icon: '🪃',  slot: 'weapon',  classLock: 'rogue',   setId: 'shadow_cut', minStage: 1,  mainStat: 'atk',                                            secondaryPool: SEC.phys    },
  { id: 'phantom_edge',      name: 'Phantom Edge',       icon: '👤',  slot: 'weapon',  classLock: 'rogue',   setId: 'phantom',    minStage: 20, mainStat: 'atk',                                            secondaryPool: SEC.phys    },
  { id: 'hurricane_blades',  name: 'Hurricane Blades',   icon: '🌪️',  slot: 'weapon',  classLock: 'rogue',   setId: 'phantom',    minStage: 55, mainStat: 'atk',                                            secondaryPool: SEC.phys    },
  { id: 'rogue_mask',        name: 'Rogue Mask',         icon: '⛑️',  slot: 'helmet',  classLock: 'rogue',   setId: 'shadow_cut', minStage: 1,  mainStat: 'hp',   subMainStat: 'def',                      secondaryPool: SEC.armor   },
  { id: 'rogue_leathers',    name: 'Rogue Leathers',     icon: '🧥',  slot: 'chest',   classLock: 'rogue',   setId: 'shadow_cut', minStage: 1,  mainStat: 'def',  subMainStat: 'hp',                       secondaryPool: SEC.armor   },
  { id: 'nimble_gloves',     name: 'Nimble Gloves',      icon: '🧤',  slot: 'gloves',  classLock: 'rogue',   setId: 'phantom',    minStage: 5,  mainStat: 'random', mainStatPool: GLOVE_MAIN,             secondaryPool: SEC.phys    },
  { id: 'soft_boots',        name: 'Soft Boots',         icon: '👢',  slot: 'boots',   classLock: 'rogue',   setId: 'phantom',    minStage: 5,  mainStat: 'spd',                                            secondaryPool: SEC.boots   },
  { id: 'smoke_bombs',       name: 'Smoke Bombs',        icon: '💨',  slot: 'relic',   classLock: 'rogue',   setId: 'shadow_cut', minStage: 10, mainStat: 'atk',                                            secondaryPool: SEC.phys    },

  // ── RANGER ───────────────────────────────────────────────────────────────────
  { id: 'shortbow',          name: 'Shortbow',           icon: '🏹',  slot: 'weapon',  classLock: 'ranger',  setId: 'eagles_eye',   minStage: 1,  mainStat: 'atk',                                            secondaryPool: SEC.phys    },
  { id: 'longbow_of_storms', name: 'Longbow of Storms',  icon: '⛈️',  slot: 'weapon',  classLock: 'ranger',  setId: 'rangers_path', minStage: 20, mainStat: 'atk',                                            secondaryPool: SEC.phys    },
  { id: 'void_bow',          name: 'Void Bow',           icon: '🕳️',  slot: 'weapon',  classLock: 'ranger',  setId: 'rangers_path', minStage: 55, mainStat: 'atk',                                            secondaryPool: SEC.phys    },
  { id: 'ranger_cap',        name: 'Ranger Cap',         icon: '⛑️',  slot: 'helmet',  classLock: 'ranger',  setId: 'eagles_eye',   minStage: 1,  mainStat: 'hp',   subMainStat: 'def',                      secondaryPool: SEC.armor   },
  { id: 'ranger_coat',       name: 'Ranger Coat',        icon: '🧥',  slot: 'chest',   classLock: 'ranger',  setId: 'eagles_eye',   minStage: 1,  mainStat: 'def',  subMainStat: 'hp',                       secondaryPool: SEC.armor   },
  { id: 'archer_gloves',     name: 'Archer Gloves',      icon: '🧤',  slot: 'gloves',  classLock: 'ranger',  setId: 'rangers_path', minStage: 5,  mainStat: 'random', mainStatPool: GLOVE_MAIN,             secondaryPool: SEC.phys    },
  { id: 'ranger_boots',      name: 'Ranger Boots',       icon: '👢',  slot: 'boots',   classLock: 'ranger',  setId: 'rangers_path', minStage: 5,  mainStat: 'spd',                                            secondaryPool: SEC.boots   },
  { id: 'eagle_eye_helm',    name: 'Eagle Eye Helm',     icon: '⛑️',  slot: 'helmet',  classLock: 'ranger',  setId: 'eagles_eye',   minStage: 30, mainStat: 'hp',   subMainStat: 'crit',                     secondaryPool: SEC.phys    },
  { id: 'leather_quiver',    name: 'Leather Quiver',     icon: '🧺',  slot: 'relic',   classLock: 'ranger',  setId: 'rangers_path', minStage: 5,  mainStat: 'atk',                                            secondaryPool: SEC.phys    },

  // ── SHAMAN ───────────────────────────────────────────────────────────────────
  { id: 'bone_totem',        name: 'Bone Totem',         icon: '🦴',  slot: 'weapon',  classLock: 'shaman',  setId: 'earth_totem', minStage: 1,  mainStat: 'atk',                                            secondaryPool: SEC.hybrid  },
  { id: 'thunder_staff',     name: 'Thunder Staff',      icon: '⛈️',  slot: 'weapon',  classLock: 'shaman',  setId: 'storm',       minStage: 20, mainStat: 'atk',                                            secondaryPool: SEC.hybrid  },
  { id: 'storm_king_staff',  name: "Storm King's Staff", icon: '🌩️',  slot: 'weapon',  classLock: 'shaman',  setId: 'storm',       minStage: 55, mainStat: 'atk',                                            secondaryPool: SEC.hybrid  },
  { id: 'shaman_mask',       name: 'Shaman Mask',        icon: '⛑️',  slot: 'helmet',  classLock: 'shaman',  setId: 'earth_totem', minStage: 1,  mainStat: 'hp',   subMainStat: 'mana',                     secondaryPool: SEC.armor   },
  { id: 'spirit_wrap',       name: 'Spirit Wrap',        icon: '🧥',  slot: 'chest',   classLock: 'shaman',  setId: 'earth_totem', minStage: 1,  mainStat: 'def',  subMainStat: 'hp',                       secondaryPool: SEC.armor   },
  { id: 'shaman_wraps',      name: 'Shaman Wraps',       icon: '🧤',  slot: 'gloves',  classLock: 'shaman',  setId: 'storm',       minStage: 5,  mainStat: 'random', mainStatPool: GLOVE_MAIN,             secondaryPool: SEC.hybrid  },
  { id: 'spirit_boots_s',    name: 'Spirit Boots',       icon: '👢',  slot: 'boots',   classLock: 'shaman',  setId: 'earth_totem', minStage: 5,  mainStat: 'spd',                                            secondaryPool: SEC.boots   },
  { id: 'storm_fetish',      name: 'Storm Fetish',       icon: '⚡',  slot: 'relic',   classLock: 'shaman',  setId: 'storm',       minStage: 10, mainStat: 'mana',                                           secondaryPool: SEC.hybrid  },
  { id: 'earth_core_relic',  name: 'Earth Core Relic',   icon: '🪨',  slot: 'relic',   classLock: 'shaman',  setId: 'earth_totem', minStage: 30, mainStat: 'def',  subMainStat: 'hp',                       secondaryPool: SEC.hybrid  },

  // ── UNIVERSAL ────────────────────────────────────────────────────────────────
  { id: 'adventurers_ring',  name: "Adventurer's Ring",  icon: '💍',  slot: 'ring',    classLock: null,      minStage: 1,  mainStat: 'hp',                                             secondaryPool: SEC.ring    },
  { id: 'warriors_ring',     name: "Warrior's Ring",     icon: '💍',  slot: 'ring',    classLock: null,      minStage: 15, mainStat: 'atk',                                            secondaryPool: SEC.ring    },
  { id: 'speed_boots',       name: 'Speed Boots',        icon: '👟',  slot: 'boots',   classLock: null,      minStage: 10, mainStat: 'spd',                                            secondaryPool: SEC.boots   },
  { id: 'heart_of_chaos',    name: 'Heart of Chaos',     icon: '💜',  slot: 'ring',    classLock: null,      minStage: 50, mainStat: 'atk',  subMainStat: 'crit',                     secondaryPool: SEC.ring    },

  // Amulets — random main stat (no SPD)
  { id: 'copper_amulet',     name: 'Copper Amulet',      icon: '📿',  slot: 'amulet',  classLock: null,      minStage: 1,  mainStat: 'random', mainStatPool: ['atk','def','hp','mana'],                        secondaryPool: SEC.amulet },
  { id: 'silver_amulet',     name: 'Silver Amulet',      icon: '📿',  slot: 'amulet',  classLock: null,      minStage: 15, mainStat: 'random', mainStatPool: ['atk','def','hp','mana','crit'],                 secondaryPool: SEC.amulet },
  { id: 'mystic_amulet',     name: 'Mystic Amulet',      icon: '🔮',  slot: 'amulet',  classLock: null,      minStage: 35, mainStat: 'random', mainStatPool: ['atk','def','hp','mana','crit'],                 secondaryPool: SEC.amulet },
  { id: 'amulet_of_power',   name: 'Amulet of Power',    icon: '🌟',  slot: 'amulet',  classLock: null,      minStage: 60, mainStat: 'random', mainStatPool: ['atk','def','hp','mana','crit','critDmg'],       secondaryPool: SEC.amulet },
]

// ─── Mythic item templates ────────────────────────────────────────────────────
// Each mythic item is class-exclusive with:
//   - 1 main stat
//   - 2 fixed normal substats  (mythicFixedStats)
//   - 2 fixed skill traits     (mythicSkillTraits)
//   - 2 random substats        (mythicRandomPool — 2 are picked on drop)
// Name, icon, and skill traits are EXCLUSIVE to each item — they never vary.

export const MYTHIC_ITEMS = [

  // ── WARRIOR ──────────────────────────────────────────────────────────────────
  {
    id: 'ravagers_annihilator', name: "Ravager's Annihilator", icon: '🪓',
    slot: 'weapon', classLock: 'warrior', setId: 'fury', minStage: 70, mainStat: 'atk',
    mythicFixedStats: ['hp', 'def'],
    mythicSkillTraits: [
      { label: '+40% Basic ATK DMG', skillSlot: 'basic',    type: 'dmg_bonus',       value: 0.40 },
      { label: '-3 Turns Skill CD',  skillSlot: 'skill',    type: 'cooldown_reduce', value: 3    },
    ],
    mythicRandomPool: ['crit', 'critDmg', 'hpRegen'],
  },
  {
    id: 'dragonscale_fortress', name: 'Dragonscale Fortress', icon: '🐲',
    slot: 'chest', classLock: 'warrior', setId: 'iron_bastion', minStage: 75, mainStat: 'def',
    mythicFixedStats: ['hp', 'atk'],
    mythicSkillTraits: [
      { label: '+35% Ultimate DMG',    skillSlot: 'ultimate', type: 'dmg_bonus',    value: 0.35 },
      { label: '+6 ULT Buff Duration', skillSlot: 'ultimate', type: 'buff_ticks',   value: 6    },
    ],
    mythicRandomPool: ['crit', 'hpRegen', 'mana'],
  },
  {
    id: 'titans_crown', name: "Titan's Crown", icon: '👑',
    slot: 'helmet', classLock: 'warrior', setId: 'iron_bastion', minStage: 72, mainStat: 'hp',
    mythicFixedStats: ['def', 'atk'],
    mythicSkillTraits: [
      { label: '+30% Skill DMG',       skillSlot: 'skill',  type: 'dmg_bonus',  value: 0.30 },
      { label: '+25% Basic Lifesteal', skillSlot: 'basic',  type: 'lifesteal',  value: 0.25 },
    ],
    mythicRandomPool: ['crit', 'hpRegen', 'critDmg'],
  },
  {
    id: 'earthshaker_gauntlets', name: 'Earthshaker Gauntlets', icon: '🌋',
    slot: 'gloves', classLock: 'warrior', setId: 'fury', minStage: 78, mainStat: 'crit',
    mythicFixedStats: ['atk', 'hp'],
    mythicSkillTraits: [
      { label: '+20% Crit on Skill',  skillSlot: 'skill',  type: 'crit_bonus', value: 0.20 },
      { label: '+30% Basic ATK DMG',  skillSlot: 'basic',  type: 'dmg_bonus',  value: 0.30 },
    ],
    mythicRandomPool: ['def', 'critDmg', 'hpRegen'],
  },
  {
    id: 'warlords_sigil', name: "Warlord's Sigil", icon: '🔱',
    slot: 'relic', classLock: 'warrior', setId: 'iron_bastion', minStage: 80, mainStat: 'def',
    mythicFixedStats: ['hp', 'atk'],
    mythicSkillTraits: [
      { label: '+40% Ultimate DMG',    skillSlot: 'ultimate', type: 'dmg_bonus',  value: 0.40 },
      { label: '+25% Basic Lifesteal', skillSlot: 'basic',    type: 'lifesteal',  value: 0.25 },
    ],
    mythicRandomPool: ['crit', 'critDmg', 'hpRegen'],
  },

  // ── PALADIN ──────────────────────────────────────────────────────────────────
  {
    id: 'heavens_verdict', name: "Heaven's Verdict", icon: '☀️',
    slot: 'weapon', classLock: 'paladin', setId: 'crusade', minStage: 70, mainStat: 'atk',
    mythicFixedStats: ['mana', 'hp'],
    mythicSkillTraits: [
      { label: '+35% Skill Heal Power', skillSlot: 'skill',    type: 'heal_boost',  value: 0.35 },
      { label: '+6 ULT Buff Duration',  skillSlot: 'ultimate', type: 'buff_ticks',  value: 6    },
    ],
    mythicRandomPool: ['def', 'crit', 'hpRegen'],
  },
  {
    id: 'divine_aegis', name: 'Divine Aegis', icon: '🌟',
    slot: 'chest', classLock: 'paladin', setId: 'crusade', minStage: 75, mainStat: 'def',
    mythicFixedStats: ['hp', 'mana'],
    mythicSkillTraits: [
      { label: '+30% Skill Heal Power', skillSlot: 'skill', type: 'heal_boost',      value: 0.30 },
      { label: '-3 Turns Skill CD',     skillSlot: 'skill', type: 'cooldown_reduce', value: 3    },
    ],
    mythicRandomPool: ['atk', 'hpRegen', 'manaRegen'],
  },
  {
    id: 'sacred_halo', name: 'Sacred Halo', icon: '💫',
    slot: 'helmet', classLock: 'paladin', setId: 'crusade', minStage: 72, mainStat: 'hp',
    mythicFixedStats: ['def', 'mana'],
    mythicSkillTraits: [
      { label: '+6 ULT Buff Duration', skillSlot: 'ultimate', type: 'buff_ticks',  value: 6    },
      { label: '+25% Skill DMG',       skillSlot: 'skill',    type: 'dmg_bonus',   value: 0.25 },
    ],
    mythicRandomPool: ['atk', 'crit', 'hpRegen'],
  },
  {
    id: 'blessed_band', name: 'Blessed Band', icon: '🌈',
    slot: 'ring', classLock: 'paladin', setId: 'divine_light', minStage: 78, mainStat: 'mana',
    mythicFixedStats: ['hp', 'def'],
    mythicSkillTraits: [
      { label: '+40% Skill Heal Power', skillSlot: 'skill', type: 'heal_boost',  value: 0.40 },
      { label: '+20% Crit on Skill',    skillSlot: 'skill', type: 'crit_bonus',  value: 0.20 },
    ],
    mythicRandomPool: ['atk', 'hpRegen', 'manaRegen'],
  },
  {
    id: 'templars_oath', name: "Templar's Oath", icon: '✨',
    slot: 'amulet', classLock: 'paladin', setId: 'divine_light', minStage: 80, mainStat: 'mana',
    mythicFixedStats: ['def', 'hp'],
    mythicSkillTraits: [
      { label: '+35% Ultimate DMG',    skillSlot: 'ultimate', type: 'dmg_bonus',  value: 0.35 },
      { label: '+6 ULT Buff Duration', skillSlot: 'ultimate', type: 'buff_ticks', value: 6    },
    ],
    mythicRandomPool: ['atk', 'crit', 'manaRegen'],
  },

  // ── MAGE ─────────────────────────────────────────────────────────────────────
  {
    id: 'void_singularity', name: 'Void Singularity', icon: '🌌',
    slot: 'weapon', classLock: 'mage', setId: 'arcane', minStage: 70, mainStat: 'atk',
    mythicFixedStats: ['mana', 'crit'],
    mythicSkillTraits: [
      { label: '+50% Ultimate DMG',   skillSlot: 'ultimate', type: 'dmg_bonus',  value: 0.50 },
      { label: '+25% Crit on Skill',  skillSlot: 'skill',    type: 'crit_bonus', value: 0.25 },
    ],
    mythicRandomPool: ['hp', 'critDmg', 'manaRegen'],
  },
  {
    id: 'arcane_shroud', name: 'Arcane Shroud', icon: '🌀',
    slot: 'chest', classLock: 'mage', setId: 'spellweave', minStage: 75, mainStat: 'def',
    mythicFixedStats: ['mana', 'hp'],
    mythicSkillTraits: [
      { label: '+40% Skill DMG',    skillSlot: 'skill', type: 'dmg_bonus',       value: 0.40 },
      { label: '-3 Turns Skill CD', skillSlot: 'skill', type: 'cooldown_reduce', value: 3    },
    ],
    mythicRandomPool: ['crit', 'critDmg', 'manaRegen'],
  },
  {
    id: 'nethervoid_hood', name: 'Nethervoid Hood', icon: '🌑',
    slot: 'helmet', classLock: 'mage', setId: 'spellweave', minStage: 72, mainStat: 'hp',
    mythicFixedStats: ['mana', 'crit'],
    mythicSkillTraits: [
      { label: '+35% Basic ATK DMG', skillSlot: 'basic', type: 'dmg_bonus',    value: 0.35 },
      { label: '+15% Mana/Hit',      skillSlot: 'basic', type: 'mana_per_hit', value: 0.15 },
    ],
    mythicRandomPool: ['critDmg', 'def', 'manaRegen'],
  },
  {
    id: 'spellbinders_seal', name: "Spellbinder's Seal", icon: '🔮',
    slot: 'ring', classLock: 'mage', setId: 'arcane', minStage: 78, mainStat: 'crit',
    mythicFixedStats: ['mana', 'atk'],
    mythicSkillTraits: [
      { label: '+45% Ultimate DMG',  skillSlot: 'ultimate', type: 'dmg_bonus',  value: 0.45 },
      { label: '+20% Crit on Skill', skillSlot: 'skill',    type: 'crit_bonus', value: 0.20 },
    ],
    mythicRandomPool: ['critDmg', 'hp', 'manaRegen'],
  },
  {
    id: 'eye_of_the_abyss', name: 'Eye of the Abyss', icon: '👁️',
    slot: 'relic', classLock: 'mage', setId: 'arcane', minStage: 80, mainStat: 'mana',
    mythicFixedStats: ['atk', 'crit'],
    mythicSkillTraits: [
      { label: '+50% Ultimate DMG', skillSlot: 'ultimate', type: 'dmg_bonus', value: 0.50 },
      { label: '+40% Skill DMG',    skillSlot: 'skill',    type: 'dmg_bonus', value: 0.40 },
    ],
    mythicRandomPool: ['critDmg', 'hp', 'manaRegen'],
  },

  // ── HEALER ───────────────────────────────────────────────────────────────────
  {
    id: 'staff_of_miracles', name: 'Staff of Miracles', icon: '🌺',
    slot: 'weapon', classLock: 'healer', setId: 'nature', minStage: 70, mainStat: 'atk',
    mythicFixedStats: ['mana', 'hp'],
    mythicSkillTraits: [
      { label: '+45% Skill Heal Power', skillSlot: 'skill',    type: 'heal_boost', value: 0.45 },
      { label: '+6 ULT Buff Duration',  skillSlot: 'ultimate', type: 'buff_ticks', value: 6    },
    ],
    mythicRandomPool: ['def', 'hpRegen', 'manaRegen'],
  },
  {
    id: 'celestial_vestment', name: 'Celestial Vestment', icon: '🕊️',
    slot: 'chest', classLock: 'healer', setId: 'restoration', minStage: 75, mainStat: 'def',
    mythicFixedStats: ['hp', 'mana'],
    mythicSkillTraits: [
      { label: '+40% Skill Heal Power', skillSlot: 'skill', type: 'heal_boost',      value: 0.40 },
      { label: '-3 Turns Skill CD',     skillSlot: 'skill', type: 'cooldown_reduce', value: 3    },
    ],
    mythicRandomPool: ['atk', 'hpRegen', 'manaRegen'],
  },
  {
    id: 'angelic_circlet', name: 'Angelic Circlet', icon: '😇',
    slot: 'helmet', classLock: 'healer', setId: 'nature', minStage: 72, mainStat: 'hp',
    mythicFixedStats: ['mana', 'def'],
    mythicSkillTraits: [
      { label: '+15% Mana/Hit',         skillSlot: 'basic', type: 'mana_per_hit', value: 0.15 },
      { label: '+45% Skill Heal Power', skillSlot: 'skill', type: 'heal_boost',   value: 0.45 },
    ],
    mythicRandomPool: ['atk', 'hpRegen', 'manaRegen'],
  },
  {
    id: 'oracles_band', name: "Oracle's Band", icon: '🌸',
    slot: 'ring', classLock: 'healer', setId: 'nature', minStage: 78, mainStat: 'mana',
    mythicFixedStats: ['hp', 'def'],
    mythicSkillTraits: [
      { label: '+35% Ultimate DMG',    skillSlot: 'ultimate', type: 'dmg_bonus',  value: 0.35 },
      { label: '+6 ULT Buff Duration', skillSlot: 'ultimate', type: 'buff_ticks', value: 6    },
    ],
    mythicRandomPool: ['atk', 'hpRegen', 'manaRegen'],
  },
  {
    id: 'eternal_tome', name: 'Eternal Tome', icon: '📜',
    slot: 'relic', classLock: 'healer', setId: 'restoration', minStage: 80, mainStat: 'mana',
    mythicFixedStats: ['hp', 'def'],
    mythicSkillTraits: [
      { label: '+50% Skill Heal Power', skillSlot: 'skill', type: 'heal_boost', value: 0.50 },
      { label: '+20% Basic Lifesteal',  skillSlot: 'basic', type: 'lifesteal',  value: 0.20 },
    ],
    mythicRandomPool: ['atk', 'crit', 'hpRegen'],
  },

  // ── ASSASSIN ─────────────────────────────────────────────────────────────────
  {
    id: 'nightmare_blades', name: 'Nightmare Blades', icon: '🌒',
    slot: 'weapon', classLock: 'assassin', setId: 'death_strike', minStage: 70, mainStat: 'atk',
    mythicFixedStats: ['crit', 'critDmg'],
    mythicSkillTraits: [
      { label: '+50% Basic ATK DMG',  skillSlot: 'basic', type: 'dmg_bonus',  value: 0.50 },
      { label: '+25% Crit on Skill',  skillSlot: 'skill', type: 'crit_bonus', value: 0.25 },
    ],
    mythicRandomPool: ['hp', 'def', 'hpRegen'],
  },
  {
    id: 'shadow_shroud', name: 'Shadow Shroud', icon: '🌫️',
    slot: 'chest', classLock: 'assassin', setId: 'shadow', minStage: 75, mainStat: 'def',
    mythicFixedStats: ['atk', 'crit'],
    mythicSkillTraits: [
      { label: '+40% Ultimate DMG',    skillSlot: 'ultimate', type: 'dmg_bonus', value: 0.40 },
      { label: '+30% Basic Lifesteal', skillSlot: 'basic',    type: 'lifesteal', value: 0.30 },
    ],
    mythicRandomPool: ['critDmg', 'hp', 'hpRegen'],
  },
  {
    id: 'deathmark_hood', name: 'Deathmark Hood', icon: '🎭',
    slot: 'helmet', classLock: 'assassin', setId: 'shadow', minStage: 72, mainStat: 'hp',
    mythicFixedStats: ['atk', 'crit'],
    mythicSkillTraits: [
      { label: '+20% Crit on Skill',  skillSlot: 'skill', type: 'crit_bonus', value: 0.20 },
      { label: '+40% Basic ATK DMG',  skillSlot: 'basic', type: 'dmg_bonus',  value: 0.40 },
    ],
    mythicRandomPool: ['critDmg', 'def', 'hpRegen'],
  },
  {
    id: 'phantom_step', name: 'Phantom Step', icon: '👤',
    slot: 'boots', classLock: 'assassin', setId: 'shadow', minStage: 78, mainStat: 'spd',
    mythicFixedStats: ['atk', 'crit'],
    mythicSkillTraits: [
      { label: '+45% Basic ATK DMG',  skillSlot: 'basic', type: 'dmg_bonus',  value: 0.45 },
      { label: '+25% Crit on Skill',  skillSlot: 'skill', type: 'crit_bonus', value: 0.25 },
    ],
    mythicRandomPool: ['critDmg', 'hp', 'hpRegen'],
  },
  {
    id: 'death_signet', name: 'Death Signet', icon: '💀',
    slot: 'ring', classLock: 'assassin', setId: 'death_strike', minStage: 80, mainStat: 'crit',
    mythicFixedStats: ['atk', 'critDmg'],
    mythicSkillTraits: [
      { label: '+50% Ultimate DMG',    skillSlot: 'ultimate', type: 'dmg_bonus', value: 0.50 },
      { label: '+35% Basic Lifesteal', skillSlot: 'basic',    type: 'lifesteal', value: 0.35 },
    ],
    mythicRandomPool: ['hp', 'def', 'hpRegen'],
  },

  // ── ROGUE ────────────────────────────────────────────────────────────────────
  {
    id: 'tempest_fangs', name: 'Tempest Fangs', icon: '🌪️',
    slot: 'weapon', classLock: 'rogue', setId: 'phantom', minStage: 70, mainStat: 'atk',
    mythicFixedStats: ['crit', 'critDmg'],
    mythicSkillTraits: [
      { label: '+40% Basic ATK DMG',   skillSlot: 'basic', type: 'dmg_bonus', value: 0.40 },
      { label: '+25% Basic Lifesteal', skillSlot: 'basic', type: 'lifesteal', value: 0.25 },
    ],
    mythicRandomPool: ['hp', 'def', 'hpRegen'],
  },
  {
    id: 'void_leathers', name: 'Void Leathers', icon: '🫥',
    slot: 'chest', classLock: 'rogue', setId: 'shadow_cut', minStage: 75, mainStat: 'def',
    mythicFixedStats: ['atk', 'crit'],
    mythicSkillTraits: [
      { label: '+30% Skill DMG',      skillSlot: 'skill', type: 'dmg_bonus',  value: 0.30 },
      { label: '+20% Crit on Skill',  skillSlot: 'skill', type: 'crit_bonus', value: 0.20 },
    ],
    mythicRandomPool: ['critDmg', 'hp', 'hpRegen'],
  },
  {
    id: 'ghost_veil', name: 'Ghost Veil', icon: '👻',
    slot: 'helmet', classLock: 'rogue', setId: 'shadow_cut', minStage: 72, mainStat: 'hp',
    mythicFixedStats: ['atk', 'crit'],
    mythicSkillTraits: [
      { label: '+35% Basic ATK DMG', skillSlot: 'basic', type: 'dmg_bonus',  value: 0.35 },
      { label: '+20% Crit on Skill', skillSlot: 'skill', type: 'crit_bonus', value: 0.20 },
    ],
    mythicRandomPool: ['critDmg', 'def', 'hpRegen'],
  },
  {
    id: 'wraith_steps', name: 'Wraith Steps', icon: '💨',
    slot: 'boots', classLock: 'rogue', setId: 'phantom', minStage: 78, mainStat: 'spd',
    mythicFixedStats: ['atk', 'crit'],
    mythicSkillTraits: [
      { label: '+30% Basic ATK DMG',   skillSlot: 'basic', type: 'dmg_bonus', value: 0.30 },
      { label: '+20% Basic Lifesteal', skillSlot: 'basic', type: 'lifesteal', value: 0.20 },
    ],
    mythicRandomPool: ['critDmg', 'hp', 'hpRegen'],
  },
  {
    id: 'storm_core', name: 'Storm Core', icon: '🔥',
    slot: 'relic', classLock: 'rogue', setId: 'shadow_cut', minStage: 80, mainStat: 'atk',
    mythicFixedStats: ['crit', 'critDmg'],
    mythicSkillTraits: [
      { label: '+45% Basic ATK DMG',   skillSlot: 'basic',    type: 'dmg_bonus', value: 0.45 },
      { label: '+25% Basic Lifesteal', skillSlot: 'basic',    type: 'lifesteal', value: 0.25 },
    ],
    mythicRandomPool: ['hp', 'def', 'hpRegen'],
  },

  // ── RANGER ───────────────────────────────────────────────────────────────────
  {
    id: 'judgement_bow', name: 'Judgement Bow', icon: '🎯',
    slot: 'weapon', classLock: 'ranger', setId: 'rangers_path', minStage: 70, mainStat: 'atk',
    mythicFixedStats: ['crit', 'critDmg'],
    mythicSkillTraits: [
      { label: '+40% Basic ATK DMG', skillSlot: 'basic', type: 'dmg_bonus',  value: 0.40 },
      { label: '+25% Crit on Skill', skillSlot: 'skill', type: 'crit_bonus', value: 0.25 },
    ],
    mythicRandomPool: ['hp', 'def', 'hpRegen'],
  },
  {
    id: 'sentinels_mail', name: "Sentinel's Mail", icon: '🦅',
    slot: 'chest', classLock: 'ranger', setId: 'rangers_path', minStage: 75, mainStat: 'def',
    mythicFixedStats: ['hp', 'crit'],
    mythicSkillTraits: [
      { label: '+35% Skill DMG',      skillSlot: 'skill', type: 'dmg_bonus',  value: 0.35 },
      { label: '+20% Crit on Skill',  skillSlot: 'skill', type: 'crit_bonus', value: 0.20 },
    ],
    mythicRandomPool: ['atk', 'critDmg', 'hpRegen'],
  },
  {
    id: 'eagle_crown', name: 'Eagle Crown', icon: '🔭',
    slot: 'helmet', classLock: 'ranger', setId: 'eagles_eye', minStage: 72, mainStat: 'hp',
    mythicFixedStats: ['crit', 'critDmg'],
    mythicSkillTraits: [
      { label: '+30% Basic ATK DMG', skillSlot: 'basic', type: 'dmg_bonus',  value: 0.30 },
      { label: '+25% Crit on Skill', skillSlot: 'skill', type: 'crit_bonus', value: 0.25 },
    ],
    mythicRandomPool: ['atk', 'def', 'hpRegen'],
  },
  {
    id: 'windrunner_treads', name: 'Windrunner Treads', icon: '🌬️',
    slot: 'boots', classLock: 'ranger', setId: 'rangers_path', minStage: 78, mainStat: 'spd',
    mythicFixedStats: ['atk', 'crit'],
    mythicSkillTraits: [
      { label: '+35% Basic ATK DMG',   skillSlot: 'basic', type: 'dmg_bonus', value: 0.35 },
      { label: '+20% Basic Lifesteal', skillSlot: 'basic', type: 'lifesteal', value: 0.20 },
    ],
    mythicRandomPool: ['critDmg', 'hp', 'hpRegen'],
  },
  {
    id: 'natures_eye', name: "Nature's Eye", icon: '🌿',
    slot: 'relic', classLock: 'ranger', setId: 'rangers_path', minStage: 80, mainStat: 'atk',
    mythicFixedStats: ['crit', 'critDmg'],
    mythicSkillTraits: [
      { label: '+45% Basic ATK DMG', skillSlot: 'basic', type: 'dmg_bonus',  value: 0.45 },
      { label: '+30% Crit on Skill', skillSlot: 'skill', type: 'crit_bonus', value: 0.30 },
    ],
    mythicRandomPool: ['hp', 'def', 'hpRegen'],
  },

  // ── SHAMAN ───────────────────────────────────────────────────────────────────
  {
    id: 'world_ender_staff', name: 'World Ender Staff', icon: '💥',
    slot: 'weapon', classLock: 'shaman', setId: 'storm', minStage: 70, mainStat: 'atk',
    mythicFixedStats: ['mana', 'crit'],
    mythicSkillTraits: [
      { label: '+40% Skill DMG',  skillSlot: 'skill', type: 'dmg_bonus',    value: 0.40 },
      { label: '+15% Mana/Hit',   skillSlot: 'basic', type: 'mana_per_hit', value: 0.15 },
    ],
    mythicRandomPool: ['hp', 'critDmg', 'manaRegen'],
  },
  {
    id: 'spirit_shell', name: 'Spirit Shell', icon: '🐚',
    slot: 'chest', classLock: 'shaman', setId: 'earth_totem', minStage: 75, mainStat: 'def',
    mythicFixedStats: ['hp', 'mana'],
    mythicSkillTraits: [
      { label: '+35% Skill DMG',       skillSlot: 'skill',    type: 'dmg_bonus', value: 0.35 },
      { label: '+6 ULT Buff Duration', skillSlot: 'ultimate', type: 'buff_ticks', value: 6   },
    ],
    mythicRandomPool: ['atk', 'crit', 'manaRegen'],
  },
  {
    id: 'ancestral_mask', name: 'Ancestral Mask', icon: '🗿',
    slot: 'helmet', classLock: 'shaman', setId: 'earth_totem', minStage: 72, mainStat: 'hp',
    mythicFixedStats: ['mana', 'crit'],
    mythicSkillTraits: [
      { label: '+30% Ultimate DMG', skillSlot: 'ultimate', type: 'dmg_bonus',    value: 0.30 },
      { label: '+15% Mana/Hit',     skillSlot: 'basic',    type: 'mana_per_hit', value: 0.15 },
    ],
    mythicRandomPool: ['atk', 'critDmg', 'manaRegen'],
  },
  {
    id: 'vortex_band', name: 'Vortex Band', icon: '🌀',
    slot: 'ring', classLock: 'shaman', setId: 'storm', minStage: 78, mainStat: 'mana',
    mythicFixedStats: ['atk', 'crit'],
    mythicSkillTraits: [
      { label: '+45% Skill DMG',    skillSlot: 'skill',    type: 'dmg_bonus', value: 0.45 },
      { label: '+25% Ultimate DMG', skillSlot: 'ultimate', type: 'dmg_bonus', value: 0.25 },
    ],
    mythicRandomPool: ['hp', 'critDmg', 'manaRegen'],
  },
  {
    id: 'stormcaller_totem', name: 'Stormcaller Totem', icon: '⛈️',
    slot: 'relic', classLock: 'shaman', setId: 'storm', minStage: 80, mainStat: 'mana',
    mythicFixedStats: ['atk', 'hp'],
    mythicSkillTraits: [
      { label: '+40% Ultimate DMG', skillSlot: 'ultimate', type: 'dmg_bonus',    value: 0.40 },
      { label: '+15% Mana/Hit',     skillSlot: 'basic',    type: 'mana_per_hit', value: 0.15 },
    ],
    mythicRandomPool: ['crit', 'critDmg', 'manaRegen'],
  },
]
