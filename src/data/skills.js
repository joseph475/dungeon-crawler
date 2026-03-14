/**
 * Skill definitions keyed by classId (base) and jobId (advanced).
 *
 * Each hero always has exactly 4 skills:
 *   [0] basic    – auto-fires based on SPD; no cooldown
 *   [1] skill    – fires on cooldown (seconds)
 *   [2] ultimate – fires when mana is full (100%)
 *   [3] passive  – always-active bonus; applied via stat modifier
 *
 * Effect tags (resolved by useCombat.js):
 *   dmg        – deal damage to target (multiplier × ATK)
 *   dmgAll     – deal damage to all enemies
 *   heal       – restore HP to target ally (multiplier × ATK or % maxHp)
 *   healAll    – restore HP to all allies
 *   buff       – apply a stat multiplier to target (ally) for N ticks
 *   buffAll    – buff all allies
 *   debuff     – reduce enemy stat by multiplier for N ticks
 *   dot        – damage-over-time: amount per turn × ticks remaining
 *   shield     – absorb incoming damage for N ticks
 *   stun       – skip enemy action for N ticks
 *   revive     – resurrect a dead ally at X% max HP
 *   passive_*  – handled at hero stat assembly time
 */

// ─── WARRIOR ─────────────────────────────────────────────────────────────────

const WARRIOR_BASE = [
  {
    slot: 'basic',
    id: 'warrior_basic',
    name: 'Sword Strike',
    icon: '⚔️',
    desc: 'A standard physical attack.',
    effects: [{ type: 'dmg', multiplier: 1.0, target: 'enemy' }],
  },
  {
    slot: 'skill',
    id: 'warrior_skill',
    name: 'Shield Bash',
    icon: '🛡️',
    desc: 'Deals 150% ATK and stuns the target for 1 turn.',
    cooldownTurns: 3,
    effects: [
      { type: 'dmg', multiplier: 1.5, target: 'enemy' },
      { type: 'stun', ticks: 1, target: 'enemy' },
    ],
  },
  {
    slot: 'ultimate',
    id: 'warrior_ult',
    name: 'War Cry',
    icon: '📣',
    desc: 'Rallies the entire party, boosting ATK by 25% for 5 turns.',
    effects: [{ type: 'buffAll', stat: 'atk', multiplier: 1.25, ticks: 5 }],
  },
  {
    slot: 'passive',
    id: 'warrior_passive',
    name: 'Iron Skin',
    icon: '🧲',
    desc: 'Permanently reduces all incoming damage by 10%.',
    effects: [{ type: 'passive_dmgReduce', value: 0.10 }],
  },
]

const GUARDIAN_SKILLS = [
  { ...WARRIOR_BASE[0], id: 'guardian_basic', name: 'Stalwart Strike', desc: 'Attacks and reduces incoming damage by 5% for 2 turns.', effects: [{ type: 'dmg', multiplier: 1.0, target: 'enemy' }, { type: 'buff', stat: 'defMult', multiplier: 0.95, ticks: 2, target: 'self' }] },
  { ...WARRIOR_BASE[1], id: 'guardian_skill', name: 'Fortress Slam', desc: 'Deals 175% ATK, stuns 2 turns, and taunts all enemies.', cooldownTurns: 4, effects: [{ type: 'dmg', multiplier: 1.75, target: 'enemy' }, { type: 'stun', ticks: 2, target: 'enemy' }, { type: 'taunt', ticks: 4, target: 'self' }] },
  { ...WARRIOR_BASE[2], id: 'guardian_ult', name: 'Unbreakable', desc: 'Party gains damage immunity for 3 turns. Warrior taunts for 5 turns.', effects: [{ type: 'shield', multiplier: 9999, ticks: 3, target: 'allAllies' }, { type: 'taunt', ticks: 5, target: 'self' }] },
  { ...WARRIOR_BASE[3], id: 'guardian_passive', name: 'Guardian Aura', desc: 'Reduces all party damage taken by 8%.', effects: [{ type: 'passive_partyDmgReduce', value: 0.08 }] },
]

const BERSERKER_SKILLS = [
  { ...WARRIOR_BASE[0], id: 'berserker_basic', name: 'Reckless Swing', desc: 'Deals 120% ATK. Each consecutive hit adds 5% more damage (stacks to 50%).', effects: [{ type: 'dmg', multiplier: 1.2, target: 'enemy' }, { type: 'passive_comboStack', max: 10 }] },
  { ...WARRIOR_BASE[1], id: 'berserker_skill', name: 'Bloodthirst', desc: 'Deals 200% ATK and heals self for 30% of damage dealt.', cooldownTurns: 3, effects: [{ type: 'dmg', multiplier: 2.0, target: 'enemy' }, { type: 'lifesteal', value: 0.30 }] },
  { ...WARRIOR_BASE[2], id: 'berserker_ult', name: 'Frenzy', desc: 'Enters a frenzy for 6 turns: ATK +50%, SPD +30%, ignores DEF.', effects: [{ type: 'buff', stat: 'atk', multiplier: 1.5, ticks: 6, target: 'self' }, { type: 'buff', stat: 'spd', multiplier: 1.3, ticks: 6, target: 'self' }] },
  { ...WARRIOR_BASE[3], id: 'berserker_passive', name: 'Blood Rage', desc: 'ATK increases by 1% for every 2% HP missing (up to +40%).', effects: [{ type: 'passive_missingHpAtk', rate: 0.005, cap: 0.40 }] },
]

// ─── PALADIN ─────────────────────────────────────────────────────────────────

const PALADIN_BASE = [
  {
    slot: 'basic', id: 'paladin_basic', name: 'Holy Strike', icon: '⚔️',
    desc: 'Deals 90% ATK as holy damage and restores a tiny amount of mana.',
    effects: [{ type: 'dmg', multiplier: 0.9, target: 'enemy' }, { type: 'gainMana', value: 5 }],
  },
  {
    slot: 'skill', id: 'paladin_skill', name: 'Divine Shield', icon: '🛡️',
    desc: 'Places a shield on the lowest HP ally equal to 80% of Paladin\'s DEF × 10.',
    cooldownTurns: 4,
    effects: [{ type: 'shield', multiplier: 8.0, stat: 'def', target: 'lowestHpAlly', ticks: 4 }],
  },
  {
    slot: 'ultimate', id: 'paladin_ult', name: 'Holy Nova', icon: '✨',
    desc: 'Deals 150% ATK to all enemies and heals all allies for 20% max HP.',
    effects: [{ type: 'dmgAll', multiplier: 1.5 }, { type: 'healAll', value: 0.20, stat: 'maxHp' }],
  },
  {
    slot: 'passive', id: 'paladin_passive', name: 'Blessed Presence', icon: '💛',
    desc: 'All allies gain +8% DEF passively.',
    effects: [{ type: 'passive_partyDef', value: 0.08 }],
  },
]

// ─── MAGE ────────────────────────────────────────────────────────────────────

const MAGE_BASE = [
  {
    slot: 'basic', id: 'mage_basic', name: 'Arcane Bolt', icon: '🔵',
    desc: 'Fires a bolt of arcane energy at the target.',
    effects: [{ type: 'dmg', multiplier: 1.0, target: 'enemy' }],
  },
  {
    slot: 'skill', id: 'mage_skill', name: 'Fireball', icon: '🔥',
    desc: 'Launches a fireball that deals 220% ATK to all enemies.',
    manaCost: 25,
    effects: [{ type: 'dmgAll', multiplier: 2.2 }],
  },
  {
    slot: 'ultimate', id: 'mage_ult', name: 'Meteor Storm', icon: '☄️',
    desc: 'Calls meteors for 4 turns, each hitting all enemies for 180% ATK.',
    effects: [{ type: 'dmgAll', multiplier: 1.8, ticks: 4, isChanneled: true }],
  },
  {
    slot: 'passive', id: 'mage_passive', name: 'Arcane Mastery', icon: '📚',
    desc: 'Skill and ULT deal +15% damage.',
    effects: [{ type: 'passive_spellBoost', value: 0.15 }],
  },
]

const ELEMENTALIST_SKILLS = [
  { ...MAGE_BASE[0], id: 'elem_basic', name: 'Elemental Bolt', desc: 'Rotates between fire, frost, and lightning bolts. Each element applies a unique debuff.', effects: [{ type: 'dmg', multiplier: 1.1, target: 'enemy' }, { type: 'elementCycle' }] },
  { ...MAGE_BASE[1], id: 'elem_skill', name: 'Elemental Burst', desc: 'Fires all 3 elements at once for 180% ATK each.', manaCost: 35, effects: [{ type: 'dmgAll', multiplier: 1.8 }, { type: 'dmgAll', multiplier: 1.8 }, { type: 'dmgAll', multiplier: 1.8 }] },
  { ...MAGE_BASE[2], id: 'elem_ult', name: 'Cataclysm', desc: 'All 3 elemental forces collide. 400% ATK AOE + all elemental debuffs.', effects: [{ type: 'dmgAll', multiplier: 4.0 }, { type: 'debuff', stat: 'def', multiplier: 0.7, ticks: 5 }] },
  { ...MAGE_BASE[3], id: 'elem_passive', name: 'Elemental Affinity', desc: 'Elemental debuffs increase damage taken by 20%.', effects: [{ type: 'passive_elemDebuffAmp', value: 0.20 }] },
]

const ARCANIST_SKILLS = [
  { ...MAGE_BASE[0], id: 'arcanist_basic', name: 'Arcane Lance', desc: '110% ATK. Generates bonus mana on each hit.', effects: [{ type: 'dmg', multiplier: 1.1, target: 'enemy' }, { type: 'gainMana', value: 8 }] },
  { ...MAGE_BASE[1], id: 'arcanist_skill', name: 'Arcane Surge', desc: '280% ATK single target. High mana cost but ignores DEF.', manaCost: 30, effects: [{ type: 'dmg', multiplier: 2.8, target: 'enemy', ignoresDef: true }] },
  { ...MAGE_BASE[2], id: 'arcanist_ult', name: 'Arcane Singularity', desc: 'Black hole of arcane energy pulls all enemies in and deals 500% ATK.', effects: [{ type: 'dmgAll', multiplier: 5.0 }, { type: 'stun', ticks: 2 }] },
  { ...MAGE_BASE[3], id: 'arcanist_passive', name: 'Mana Overload', desc: 'When mana is above 80%, all spells deal +25% damage.', effects: [{ type: 'passive_highManaBoost', threshold: 0.80, value: 0.25 }] },
]

// ─── HEALER ──────────────────────────────────────────────────────────────────

const HEALER_BASE = [
  {
    slot: 'basic', id: 'healer_basic', name: 'Holy Bolt', icon: '💛',
    desc: 'Fires a bolt of healing light at an enemy. Restores minor HP to lowest-HP ally.',
    effects: [{ type: 'dmg', multiplier: 0.7, target: 'enemy' }, { type: 'heal', value: 0.05, stat: 'maxHp', target: 'lowestHpAlly' }],
  },
  {
    slot: 'skill', id: 'healer_skill', name: 'Mending Wave', icon: '💚',
    desc: 'Restores 35% max HP to all allies.',
    manaCost: 30,
    effects: [{ type: 'healAll', value: 0.35, stat: 'maxHp' }],
  },
  {
    slot: 'ultimate', id: 'healer_ult', name: 'Resurrection', icon: '✨',
    desc: 'Revives all dead allies at 40% max HP and heals entire party for 50%.',
    effects: [{ type: 'reviveAll', value: 0.40 }, { type: 'healAll', value: 0.50, stat: 'maxHp' }],
  },
  {
    slot: 'passive', id: 'healer_passive', name: 'Blessed Aura', icon: '🌟',
    desc: 'Passively regenerates 2% max HP for all allies each turn.',
    effects: [{ type: 'passive_partyRegen', value: 0.02 }],
  },
]

// ─── ASSASSIN ────────────────────────────────────────────────────────────────

const ASSASSIN_BASE = [
  {
    slot: 'basic', id: 'assassin_basic', name: 'Quick Stab', icon: '🗡️',
    desc: 'Fast precise stab. SPD-scaled attack frequency.',
    effects: [{ type: 'dmg', multiplier: 1.0, target: 'enemy' }],
  },
  {
    slot: 'skill', id: 'assassin_skill', name: 'Backstab', icon: '💀',
    desc: 'Deals 280% ATK with +25% crit rate bonus this hit.',
    cooldownTurns: 2,
    effects: [{ type: 'dmg', multiplier: 2.8, target: 'enemy', critBonus: 0.25 }],
  },
  {
    slot: 'ultimate', id: 'assassin_ult', name: 'Death Mark', icon: '⚰️',
    desc: 'Marks a target. Next 4 hits against it deal 300% ATK. Vanish for 2 turns.',
    effects: [{ type: 'mark', hitCount: 4, multiplier: 3.0, target: 'enemy' }, { type: 'stealth', ticks: 2, target: 'self' }],
  },
  {
    slot: 'passive', id: 'assassin_passive', name: 'Lethal Precision', icon: '🎯',
    desc: 'Critical hits deal an additional 50% bonus damage.',
    effects: [{ type: 'passive_critDmgBonus', value: 0.50 }],
  },
]

// ─── ROGUE ───────────────────────────────────────────────────────────────────

const ROGUE_BASE = [
  {
    slot: 'basic', id: 'rogue_basic', name: 'Twin Slash', icon: '🪃',
    desc: 'Hits twice rapidly. Each hit at 60% ATK.',
    effects: [{ type: 'dmg', multiplier: 0.6, target: 'enemy', hits: 2 }],
  },
  {
    slot: 'skill', id: 'rogue_skill', name: 'Smoke Screen', icon: '💨',
    desc: 'Reduces enemy accuracy by 40% for 3 turns and grants self evasion +30%.',
    cooldownTurns: 2,
    effects: [{ type: 'debuff', stat: 'accuracy', multiplier: 0.6, ticks: 3, target: 'enemy' }, { type: 'buff', stat: 'evasion', multiplier: 1.3, ticks: 3, target: 'self' }],
  },
  {
    slot: 'ultimate', id: 'rogue_ult', name: 'Fan of Blades', icon: '🌀',
    desc: 'Throws blades at all enemies 5 times for 80% ATK each.',
    effects: [{ type: 'dmgAll', multiplier: 0.8, hits: 5 }],
  },
  {
    slot: 'passive', id: 'rogue_passive', name: 'Evasive Instincts', icon: '🌬️',
    desc: 'Base evasion chance of 15%. Dodging grants +10% ATK for 2 turns.',
    effects: [{ type: 'passive_evasion', value: 0.15, onDodgeAtk: 0.10, ticks: 2 }],
  },
]

// ─── RANGER ──────────────────────────────────────────────────────────────────

const RANGER_BASE = [
  {
    slot: 'basic', id: 'ranger_basic', name: 'Arrow Shot', icon: '🏹',
    desc: 'A steady accurate arrow shot.',
    effects: [{ type: 'dmg', multiplier: 1.0, target: 'enemy' }],
  },
  {
    slot: 'skill', id: 'ranger_skill', name: 'Volley', icon: '🌧️',
    desc: 'Fires a volley of arrows, hitting all enemies for 110% ATK.',
    cooldownTurns: 3,
    effects: [{ type: 'dmgAll', multiplier: 1.1 }],
  },
  {
    slot: 'ultimate', id: 'ranger_ult', name: 'Rain of Arrows', icon: '🌂',
    desc: 'Bombards all enemies with arrows for 5 turns, each for 120% ATK.',
    effects: [{ type: 'dmgAll', multiplier: 1.2, ticks: 5, isChanneled: true }],
  },
  {
    slot: 'passive', id: 'ranger_passive', name: 'Eagle Eye', icon: '🦅',
    desc: '+10% crit rate and crits pierce 20% of enemy DEF.',
    effects: [{ type: 'passive_critRate', value: 0.10 }, { type: 'passive_critDefPierce', value: 0.20 }],
  },
]

// ─── SHAMAN ──────────────────────────────────────────────────────────────────

const SHAMAN_BASE = [
  {
    slot: 'basic', id: 'shaman_basic', name: 'Lightning Jolt', icon: '⚡',
    desc: 'Channels lightning through the target for 100% ATK.',
    effects: [{ type: 'dmg', multiplier: 1.0, target: 'enemy' }],
  },
  {
    slot: 'skill', id: 'shaman_skill', name: 'Chain Lightning', icon: '⛈️',
    desc: 'Lightning bounces between enemies 3 times, 150% ATK each.',
    manaCost: 25,
    effects: [{ type: 'dmg', multiplier: 1.5, target: 'enemy', chain: 3, chainDecay: 0.0 }],
  },
  {
    slot: 'ultimate', id: 'shaman_ult', name: 'Thunderstorm', icon: '🌩️',
    desc: 'Calls a storm that strikes all enemies for 200% ATK and heals all allies for 20% max HP.',
    effects: [{ type: 'dmgAll', multiplier: 2.0 }, { type: 'healAll', value: 0.20, stat: 'maxHp' }],
  },
  {
    slot: 'passive', id: 'shaman_passive', name: 'Elemental Balance', icon: '☯️',
    desc: 'Deals +12% elemental damage. Healing skills heal for +10% more.',
    effects: [{ type: 'passive_elemBoost', value: 0.12 }, { type: 'passive_healBoost', value: 0.10 }],
  },
]

// ─── WARRIOR TIER 2/3 ────────────────────────────────────────────────────────

const IRON_FORTRESS_SKILLS = [
  { ...GUARDIAN_SKILLS[0], id: 'iron_fortress_basic', name: 'Iron Smash', desc: 'Deals 110% ATK and reduces own incoming damage by 10% for 2 turns.', effects: [{ type: 'dmg', multiplier: 1.1, target: 'enemy' }, { type: 'buff', stat: 'defMult', multiplier: 0.90, ticks: 2, target: 'self' }] },
  { ...GUARDIAN_SKILLS[1], id: 'iron_fortress_skill', name: 'Damage Reflect', desc: 'Absorbs the next hit and reflects 150% of it back to the attacker.', cooldownTurns: 4, effects: [{ type: 'shield', multiplier: 9999, ticks: 1, target: 'self' }, { type: 'reflect', value: 1.5, ticks: 1, target: 'self' }] },
  { ...GUARDIAN_SKILLS[2], id: 'iron_fortress_ult', name: 'Iron Aegis', desc: 'Becomes immune for 3 turns and reflects all damage taken back to attackers.', effects: [{ type: 'shield', multiplier: 9999, ticks: 3, target: 'self' }, { type: 'reflect', value: 2.0, ticks: 3, target: 'self' }, { type: 'taunt', ticks: 3, target: 'self' }] },
  { id: 'iron_fortress_passive', slot: 'passive', icon: '🔩', name: 'Thorns', desc: 'Reflects 20% of all incoming damage back to the attacker.', effects: [{ type: 'passive_reflect', value: 0.20 }] },
]

const DIVINE_SHIELD_SKILLS = [
  { ...GUARDIAN_SKILLS[0], id: 'divine_shield_basic', name: 'Sacred Smash', desc: 'Deals 100% ATK and grants a small shield to self for 2 turns.', effects: [{ type: 'dmg', multiplier: 1.0, target: 'enemy' }, { type: 'shield', multiplier: 2.0, stat: 'def', ticks: 2, target: 'self' }] },
  { ...GUARDIAN_SKILLS[1], id: 'divine_shield_skill', name: 'Radiant Barrier', desc: 'Shields all allies for DEF×5 HP for 4 turns.', cooldownTurns: 4, effects: [{ type: 'shield', multiplier: 5.0, stat: 'def', ticks: 4, target: 'allAllies' }] },
  { ...GUARDIAN_SKILLS[2], id: 'divine_shield_ult', name: 'Divine Intervention', desc: 'Shields all allies for massive HP and heals entire party for 40% max HP.', effects: [{ type: 'shield', multiplier: 9999, ticks: 2, target: 'allAllies' }, { type: 'healAll', value: 0.40, stat: 'maxHp' }] },
  { id: 'divine_shield_passive', slot: 'passive', icon: '✨', name: 'Sacred Aura', desc: 'All allies take 12% less damage passively.', effects: [{ type: 'passive_partyDmgReduce', value: 0.12 }] },
]

const WARLORD_SKILLS = [
  { ...BERSERKER_SKILLS[0], id: 'warlord_basic', name: 'Power Strike', desc: 'Deals 120% ATK and grants the weakest ally ATK +10% for 2 turns.', effects: [{ type: 'dmg', multiplier: 1.2, target: 'enemy' }, { type: 'buff', stat: 'atk', multiplier: 1.10, ticks: 2, target: 'lowestHpAlly' }] },
  { ...BERSERKER_SKILLS[1], id: 'warlord_skill', name: 'Battle Cry', desc: 'Rallies all allies — ATK +40% for 4 turns.', cooldownTurns: 4, effects: [{ type: 'buffAll', stat: 'atk', multiplier: 1.40, ticks: 4 }] },
  { ...BERSERKER_SKILLS[2], id: 'warlord_ult', name: 'Warlord\'s Command', desc: 'All allies gain ATK +50% and SPD +30% for 6 turns.', effects: [{ type: 'buffAll', stat: 'atk', multiplier: 1.50, ticks: 6 }, { type: 'buffAll', stat: 'spd', multiplier: 1.30, ticks: 6 }] },
  { id: 'warlord_passive', slot: 'passive', icon: '⚔️', name: 'Inspiring Presence', desc: 'Party ATK is permanently +15% due to the Warlord\'s presence.', effects: [{ type: 'passive_partyAtk', value: 0.15 }] },
]

const BLOODRAGE_SKILLS = [
  { ...BERSERKER_SKILLS[0], id: 'bloodrage_basic', name: 'Feral Strike', desc: 'Deals 130% ATK. Deals +2% per 1% HP missing.', effects: [{ type: 'dmg', multiplier: 1.3, target: 'enemy' }, { type: 'missingHpScaling', rate: 0.02 }] },
  { ...BERSERKER_SKILLS[1], id: 'bloodrage_skill', name: 'Blood Frenzy', desc: 'Enrage self: ATK +60%, SPD +25%, DEF -30% for 4 turns.', cooldownTurns: 3, effects: [{ type: 'buff', stat: 'atk', multiplier: 1.60, ticks: 4, target: 'self' }, { type: 'buff', stat: 'spd', multiplier: 1.25, ticks: 4, target: 'self' }] },
  { ...BERSERKER_SKILLS[2], id: 'bloodrage_ult', name: 'Enrage', desc: 'Enters permanent frenzy: ATK +80%, SPD +40%, immune to stuns for 8 turns.', effects: [{ type: 'buff', stat: 'atk', multiplier: 1.80, ticks: 8, target: 'self' }, { type: 'buff', stat: 'spd', multiplier: 1.40, ticks: 8, target: 'self' }] },
  { id: 'bloodrage_passive', slot: 'passive', icon: '🩸', name: 'Adrenaline Rush', desc: 'Below 30% HP: ATK +80%, SPD +30%.', effects: [{ type: 'passive_lowHpBuff', threshold: 0.30, atkBonus: 0.80, spdBonus: 0.30 }] },
]

const ETERNAL_BULWARK_SKILLS = [
  { ...IRON_FORTRESS_SKILLS[0], id: 'eternal_bulwark_basic', name: 'Colossus Slam', desc: 'Deals 120% ATK and reduces own incoming damage by 20% for 2 turns.', effects: [{ type: 'dmg', multiplier: 1.2, target: 'enemy' }, { type: 'buff', stat: 'defMult', multiplier: 0.80, ticks: 2, target: 'self' }] },
  { ...IRON_FORTRESS_SKILLS[1], id: 'eternal_bulwark_skill', name: 'Fortress Mode', desc: 'Taunts all enemies and absorbs 50% of all party damage for 5 turns.', cooldownTurns: 5, effects: [{ type: 'taunt', ticks: 5, target: 'self' }, { type: 'partyAbsorb', value: 0.50, ticks: 5, target: 'self' }] },
  { ...IRON_FORTRESS_SKILLS[2], id: 'eternal_bulwark_ult', name: 'Eternal Wall', desc: 'Becomes untargetable for 2 turns, absorbs ALL party damage, then heals party for 50% max HP.', effects: [{ type: 'shield', multiplier: 9999, ticks: 2, target: 'self' }, { type: 'taunt', ticks: 2, target: 'self' }, { type: 'healAll', value: 0.50, stat: 'maxHp' }] },
  { id: 'eternal_bulwark_passive', slot: 'passive', icon: '🏰', name: 'Immovable Object', desc: 'Redirects 40% of all party damage taken to self. Self takes 25% less damage.', effects: [{ type: 'passive_partyDmgRedirect', value: 0.40 }, { type: 'passive_dmgReduce', value: 0.25 }] },
]

const SACRED_GUARDIAN_SKILLS = [
  { ...DIVINE_SHIELD_SKILLS[0], id: 'sacred_guardian_basic', name: 'Sacred Strike', desc: 'Holy attack for 100% ATK that heals the lowest HP ally for 10% max HP.', effects: [{ type: 'dmg', multiplier: 1.0, target: 'enemy' }, { type: 'heal', value: 0.10, stat: 'maxHp', target: 'lowestHpAlly' }] },
  { ...DIVINE_SHIELD_SKILLS[1], id: 'sacred_guardian_skill', name: 'Guardian\'s Blessing', desc: 'All allies gain DEF +30% and regen 5% max HP per turn for 5 turns.', cooldownTurns: 4, effects: [{ type: 'buffAll', stat: 'def', multiplier: 1.30, ticks: 5 }, { type: 'dot', damageType: 'heal', value: 0.05, stat: 'maxHp', ticks: 5, target: 'allAllies' }] },
  { ...DIVINE_SHIELD_SKILLS[2], id: 'sacred_guardian_ult', name: 'Divine Sanctum', desc: 'All allies become invincible for 3 turns and heal for 60% max HP.', effects: [{ type: 'shield', multiplier: 9999, ticks: 3, target: 'allAllies' }, { type: 'healAll', value: 0.60, stat: 'maxHp' }] },
  { id: 'sacred_guardian_passive', slot: 'passive', icon: '⚜️', name: 'Radiant Aura', desc: 'All allies passively regenerate 3% max HP per turn.', effects: [{ type: 'passive_partyRegen', value: 0.03 }] },
]

const CONQUEROR_SKILLS = [
  { ...WARLORD_SKILLS[0], id: 'conqueror_basic', name: 'Conqueror\'s Blow', desc: 'Deals 130% ATK. On kill, permanently gains +5% ATK.', effects: [{ type: 'dmg', multiplier: 1.3, target: 'enemy' }, { type: 'onKill_permAtk', value: 0.05 }] },
  { ...WARLORD_SKILLS[1], id: 'conqueror_skill', name: 'Dominate', desc: 'Stuns the target for 2 turns and reduces their ATK by 40% for 5 turns.', cooldownTurns: 3, effects: [{ type: 'stun', ticks: 2, target: 'enemy' }, { type: 'debuff', stat: 'atk', multiplier: 0.60, ticks: 5, target: 'enemy' }] },
  { ...WARLORD_SKILLS[2], id: 'conqueror_ult', name: 'Total War', desc: 'All allies gain ATK +50% for 6 turns; all enemies suffer DEF -30% for 6 turns.', effects: [{ type: 'buffAll', stat: 'atk', multiplier: 1.50, ticks: 6 }, { type: 'debuff', stat: 'def', multiplier: 0.70, ticks: 6, target: 'allEnemies' }] },
  { id: 'conqueror_passive', slot: 'passive', icon: '👑', name: 'Conquest', desc: 'On enemy kill, ATK permanently increases by 3%.', effects: [{ type: 'passive_onKillPermAtk', value: 0.03 }] },
]

const AVATAR_OF_RAGE_SKILLS = [
  { ...BLOODRAGE_SKILLS[0], id: 'avatar_of_rage_basic', name: 'Primal Slam', desc: 'Deals 140% ATK, scaling up to +100% more at 0 HP.', effects: [{ type: 'dmg', multiplier: 1.4, target: 'enemy' }, { type: 'missingHpScaling', rate: 0.03 }] },
  { ...BLOODRAGE_SKILLS[1], id: 'avatar_of_rage_skill', name: 'Savage Rend', desc: 'Deals 300% ATK ignoring 50% of enemy DEF.', cooldownTurns: 2, effects: [{ type: 'dmg', multiplier: 3.0, target: 'enemy', defPierce: 0.50 }] },
  { ...BLOODRAGE_SKILLS[2], id: 'avatar_of_rage_ult', name: 'Ragnarok', desc: 'Deals 600% ATK to single target. Temporarily invincible during cast.', effects: [{ type: 'shield', multiplier: 9999, ticks: 1, target: 'self' }, { type: 'dmg', multiplier: 6.0, target: 'enemy' }] },
  { id: 'avatar_of_rage_passive', slot: 'passive', icon: '🔥', name: 'Rage Incarnate', desc: 'Every 1% missing HP adds 1% ATK (uncapped).', effects: [{ type: 'passive_missingHpAtk', rate: 0.01, cap: 1.0 }] },
]

// ─── PALADIN TIER 2/3 ────────────────────────────────────────────────────────

const HOLY_KNIGHT_SKILLS = [
  { ...PALADIN_BASE[0], id: 'holy_knight_basic', name: 'Holy Smite', desc: 'Deals 100% ATK as holy damage and applies a burn DoT for 3 turns.', effects: [{ type: 'dmg', multiplier: 1.0, target: 'enemy' }, { type: 'dot', value: 0.4, ticks: 3, target: 'enemy' }] },
  { ...PALADIN_BASE[1], id: 'holy_knight_skill', name: 'Divine Blade', desc: 'Deals 250% ATK holy damage, ignoring 30% of enemy DEF.', cooldownTurns: 3, effects: [{ type: 'dmg', multiplier: 2.5, target: 'enemy', defPierce: 0.30 }] },
  { ...PALADIN_BASE[2], id: 'holy_knight_ult', name: 'Sacred Flame', desc: 'Burns all enemies with holy fire for 5 turns, dealing 100% ATK per turn.', effects: [{ type: 'dot', value: 1.0, ticks: 5, target: 'allEnemies' }, { type: 'dmgAll', multiplier: 1.5 }] },
  { id: 'holy_knight_passive', slot: 'passive', icon: '🌟', name: 'Holy Fire', desc: 'Basic attacks apply a holy burn DoT (30% ATK for 2 turns).', effects: [{ type: 'passive_basicDot', value: 0.30, ticks: 2 }] },
]

const INQUISITOR_SKILLS = [
  { ...PALADIN_BASE[0], id: 'inquisitor_basic', name: 'Inquisition Strike', desc: 'Deals 110% ATK. Deals +40% bonus damage against bosses.', effects: [{ type: 'dmg', multiplier: 1.1, target: 'enemy' }, { type: 'bossBonus', value: 0.40 }] },
  { ...PALADIN_BASE[1], id: 'inquisitor_skill', name: 'Judgment', desc: 'Stuns the target for 2 turns and seals their next ability.', cooldownTurns: 3, effects: [{ type: 'stun', ticks: 2, target: 'enemy' }, { type: 'seal', ticks: 3, target: 'enemy' }] },
  { ...PALADIN_BASE[2], id: 'inquisitor_ult', name: 'Divine Execution', desc: 'Deals 400% ATK to one target, ignoring all DEF (tripled vs bosses).', effects: [{ type: 'dmg', multiplier: 4.0, target: 'enemy', defPierce: 1.0 }, { type: 'bossBonus', value: 2.0 }] },
  { id: 'inquisitor_passive', slot: 'passive', icon: '⚖️', name: 'Witch Hunter', desc: 'All damage vs bosses +25%. Critical hits always pierce 40% of boss DEF.', effects: [{ type: 'passive_bossBonus', value: 0.25 }, { type: 'passive_critDefPierce', value: 0.40 }] },
]

const LIGHT_BRINGER_SKILLS = [
  { ...PALADIN_BASE[0], id: 'light_bringer_basic', name: 'Light Bolt', desc: 'Deals 80% ATK and heals the lowest HP ally for 8% max HP.', effects: [{ type: 'dmg', multiplier: 0.8, target: 'enemy' }, { type: 'heal', value: 0.08, stat: 'maxHp', target: 'lowestHpAlly' }] },
  { ...PALADIN_BASE[1], id: 'light_bringer_skill', name: 'Beacon of Hope', desc: 'Heals all allies for 30% max HP and grants 8% HP regen per turn for 5 turns.', manaCost: 35, effects: [{ type: 'healAll', value: 0.30, stat: 'maxHp' }, { type: 'dot', damageType: 'heal', value: 0.08, stat: 'maxHp', ticks: 5, target: 'allAllies' }] },
  { ...PALADIN_BASE[2], id: 'light_bringer_ult', name: 'Holy Light', desc: 'Heals all allies for 70% max HP and buffs ATK +20% for 5 turns.', effects: [{ type: 'healAll', value: 0.70, stat: 'maxHp' }, { type: 'buffAll', stat: 'atk', multiplier: 1.20, ticks: 5 }] },
  { id: 'light_bringer_passive', slot: 'passive', icon: '💛', name: 'Light\'s Embrace', desc: 'Party passively regenerates 3% max HP per turn.', effects: [{ type: 'passive_partyRegen', value: 0.03 }] },
]

const BATTLE_CHAPLAIN_SKILLS = [
  { ...PALADIN_BASE[0], id: 'battle_chaplain_basic', name: 'Chaplain\'s Strike', desc: 'Attacks for 90% ATK and restores 8 mana.', effects: [{ type: 'dmg', multiplier: 0.9, target: 'enemy' }, { type: 'gainMana', value: 8 }] },
  { ...PALADIN_BASE[1], id: 'battle_chaplain_skill', name: 'Last Rites', desc: 'Revives one dead ally at 50% HP and shields them for 3 turns.', manaCost: 40, effects: [{ type: 'revive', value: 0.50, target: 'deadAlly' }, { type: 'shield', multiplier: 5.0, stat: 'def', ticks: 3, target: 'lowestHpAlly' }] },
  { ...PALADIN_BASE[2], id: 'battle_chaplain_ult', name: 'Mass Resurrection', desc: 'Revives all dead allies at 60% HP and shields the entire living party.', effects: [{ type: 'reviveAll', value: 0.60 }, { type: 'shield', multiplier: 6.0, stat: 'def', ticks: 4, target: 'allAllies' }] },
  { id: 'battle_chaplain_passive', slot: 'passive', icon: '📿', name: 'Mana Ward', desc: 'Each ally passively has a shield equal to 20% of current mana.', effects: [{ type: 'passive_manaShield', value: 0.20 }] },
]

const DIVINE_AVENGER_SKILLS = [
  { ...HOLY_KNIGHT_SKILLS[0], id: 'divine_avenger_basic', name: 'Avenger\'s Wrath', desc: 'Deals 120% ATK to all enemies as holy damage.', effects: [{ type: 'dmgAll', multiplier: 1.2 }] },
  { ...HOLY_KNIGHT_SKILLS[1], id: 'divine_avenger_skill', name: 'Holy Retribution', desc: 'Deals 200% ATK to all enemies and reflects the next hit taken back.', cooldownTurns: 3, effects: [{ type: 'dmgAll', multiplier: 2.0 }, { type: 'reflect', value: 2.0, ticks: 1, target: 'self' }] },
  { ...HOLY_KNIGHT_SKILLS[2], id: 'divine_avenger_ult', name: 'Divine Judgment', desc: 'Deals 500% ATK to all enemies and grants party immunity for 3 turns.', effects: [{ type: 'dmgAll', multiplier: 5.0 }, { type: 'shield', multiplier: 9999, ticks: 3, target: 'allAllies' }] },
  { id: 'divine_avenger_passive', slot: 'passive', icon: '☀️', name: 'Avenger\'s Blessing', desc: 'When any ally takes damage, the attacker takes 20% of that damage reflected.', effects: [{ type: 'passive_partyReflect', value: 0.20 }] },
]

const GRAND_INQUISITOR_SKILLS = [
  { ...INQUISITOR_SKILLS[0], id: 'grand_inquisitor_basic', name: 'Seal Strike', desc: 'Deals 110% ATK and seals one enemy ability for 2 turns.', effects: [{ type: 'dmg', multiplier: 1.1, target: 'enemy' }, { type: 'seal', ticks: 2, target: 'enemy' }] },
  { ...INQUISITOR_SKILLS[1], id: 'grand_inquisitor_skill', name: 'Grand Inquisition', desc: 'Deals 300% ATK (900% vs bosses), stuns for 2 turns.', cooldownTurns: 3, effects: [{ type: 'dmg', multiplier: 3.0, target: 'enemy' }, { type: 'bossBonus', value: 2.0 }, { type: 'stun', ticks: 2, target: 'enemy' }] },
  { ...INQUISITOR_SKILLS[2], id: 'grand_inquisitor_ult', name: 'Heretic\'s End', desc: 'Deals 600% ATK to one target (boss triple), seals ALL their abilities for 5 turns.', effects: [{ type: 'dmg', multiplier: 6.0, target: 'enemy', defPierce: 1.0 }, { type: 'bossBonus', value: 2.0 }, { type: 'seal', ticks: 5, target: 'enemy' }] },
  { id: 'grand_inquisitor_passive', slot: 'passive', icon: '🔱', name: 'Nemesis', desc: 'All damage vs bosses is tripled. Critical hits always pierce 100% of boss DEF.', effects: [{ type: 'passive_bossBonus', value: 2.0 }, { type: 'passive_critDefPierce', value: 1.0 }] },
]

const HERALD_OF_LIGHT_SKILLS = [
  { ...LIGHT_BRINGER_SKILLS[0], id: 'herald_of_light_basic', name: 'Herald\'s Blessing', desc: 'Attacks for 80% ATK and heals all allies for 5% max HP.', effects: [{ type: 'dmg', multiplier: 0.8, target: 'enemy' }, { type: 'healAll', value: 0.05, stat: 'maxHp' }] },
  { ...LIGHT_BRINGER_SKILLS[1], id: 'herald_of_light_skill', name: 'Light\'s Embrace', desc: 'All allies regen 8% max HP per turn for 5 turns and gain DEF +15%.', manaCost: 35, effects: [{ type: 'dot', damageType: 'heal', value: 0.08, stat: 'maxHp', ticks: 5, target: 'allAllies' }, { type: 'buffAll', stat: 'def', multiplier: 1.15, ticks: 5 }] },
  { ...LIGHT_BRINGER_SKILLS[2], id: 'herald_of_light_ult', name: 'Divine Radiance', desc: 'Heals all allies to full HP and grants death immunity for 3 turns.', effects: [{ type: 'healAll', value: 1.0, stat: 'maxHp' }, { type: 'deathImmunity', ticks: 3, target: 'allAllies' }] },
  { id: 'herald_of_light_passive', slot: 'passive', icon: '🕊️', name: 'Deathless Light', desc: 'Once per combat, negates a fatal blow and heals self to 30% HP.', effects: [{ type: 'passive_deathSave', value: 0.30, charges: 1 }] },
]

const SAINTGUARD_SKILLS = [
  { ...BATTLE_CHAPLAIN_SKILLS[0], id: 'saintguard_basic', name: 'Saintly Strike', desc: 'Deals 90% ATK and grants a small mana-based shield to all allies.', effects: [{ type: 'dmg', multiplier: 0.9, target: 'enemy' }, { type: 'gainMana', value: 8 }] },
  { ...BATTLE_CHAPLAIN_SKILLS[1], id: 'saintguard_skill', name: 'Mana Aegis', desc: 'Shields all allies for (mana × 3) HP for 4 turns.', manaCost: 30, effects: [{ type: 'shield', multiplier: 3.0, stat: 'mana', ticks: 4, target: 'allAllies' }] },
  { ...BATTLE_CHAPLAIN_SKILLS[2], id: 'saintguard_ult', name: 'Saintguard\'s Oath', desc: 'Revives up to 2 dead allies at 70% HP and shields the whole party.', effects: [{ type: 'reviveAll', value: 0.70 }, { type: 'shield', multiplier: 8.0, stat: 'def', ticks: 5, target: 'allAllies' }] },
  { id: 'saintguard_passive', slot: 'passive', icon: '🛡️', name: 'Divine Covenant', desc: 'Auto-revive can trigger twice per combat. Shields last 1 extra turn.', effects: [{ type: 'passive_deathSave', value: 0.50, charges: 2 }, { type: 'passive_shieldExtend', value: 1 }] },
]

// ─── MAGE TIER 2/3 ───────────────────────────────────────────────────────────

const PYROMANCER_SKILLS = [
  { ...MAGE_BASE[0], id: 'pyromancer_basic', name: 'Scorch', desc: 'Deals 100% ATK and applies Burn (40% ATK per turn for 3 turns).', effects: [{ type: 'dmg', multiplier: 1.0, target: 'enemy' }, { type: 'dot', value: 0.4, ticks: 3, target: 'enemy' }] },
  { ...MAGE_BASE[1], id: 'pyromancer_skill', name: 'Flame Burst', desc: 'Deals 200% ATK to all enemies and applies Burn stacks to each.', manaCost: 30, effects: [{ type: 'dmgAll', multiplier: 2.0 }, { type: 'dot', value: 0.4, ticks: 3, target: 'allEnemies' }] },
  { ...MAGE_BASE[2], id: 'pyromancer_ult', name: 'Inferno', desc: 'Deals 300% ATK to all enemies and applies a 5-tick Burn DoT to all.', effects: [{ type: 'dmgAll', multiplier: 3.0 }, { type: 'dot', value: 0.6, ticks: 5, target: 'allEnemies' }] },
  { id: 'pyromancer_passive', slot: 'passive', icon: '🔥', name: 'Pyromaniac', desc: 'Burn damage deals 25% more damage. Fire spells +10% damage.', effects: [{ type: 'passive_dotAmp', value: 0.25 }, { type: 'passive_spellBoost', value: 0.10 }] },
]

const STORM_MAGE_SKILLS = [
  { ...MAGE_BASE[0], id: 'storm_mage_basic', name: 'Shock', desc: 'Deals 110% ATK lightning and chains to one additional enemy for 60% ATK.', effects: [{ type: 'dmg', multiplier: 1.1, target: 'enemy' }, { type: 'dmg', multiplier: 0.6, target: 'enemy', chain: 1 }] },
  { ...MAGE_BASE[1], id: 'storm_mage_skill', name: 'Overcharge', desc: 'Deals 220% ATK to all enemies and stuns all for 1 turn.', manaCost: 30, effects: [{ type: 'dmgAll', multiplier: 2.2 }, { type: 'stun', ticks: 1 }] },
  { ...MAGE_BASE[2], id: 'storm_mage_ult', name: 'Tempest', desc: 'Deals 280% ATK to all enemies and stuns all for 2 turns.', effects: [{ type: 'dmgAll', multiplier: 2.8 }, { type: 'stun', ticks: 2 }] },
  { id: 'storm_mage_passive', slot: 'passive', icon: '⚡', name: 'Static Field', desc: 'Basic attacks also chain to one random enemy for 40% ATK.', effects: [{ type: 'passive_chainLightning', value: 0.40, targets: 1 }] },
]

const ARCHMAGE_SKILLS = [
  { ...MAGE_BASE[0], id: 'archmage_basic', name: 'Arcane Beam', desc: 'Deals 120% ATK and reduces own skill cooldown by 1 turn.', effects: [{ type: 'dmg', multiplier: 1.2, target: 'enemy' }, { type: 'gainMana', value: 10 }] },
  { ...MAGE_BASE[1], id: 'archmage_skill', name: 'Time Warp', desc: 'Resets all skill cooldowns and instantly restores 50% mana.', manaCost: 20, effects: [{ type: 'resetCooldowns', target: 'self' }, { type: 'gainMana', value: 50 }] },
  { ...MAGE_BASE[2], id: 'archmage_ult', name: 'Arcane Annihilation', desc: 'Deals 600% ATK to all enemies, ignoring all DEF.', effects: [{ type: 'dmgAll', multiplier: 6.0, ignoresDef: true }] },
  { id: 'archmage_passive', slot: 'passive', icon: '🔮', name: 'Spellmaster', desc: 'All magic skills cost 25% less mana and deal 20% more damage.', effects: [{ type: 'passive_manaCostReduce', value: 0.25 }, { type: 'passive_spellBoost', value: 0.20 }] },
]

const NECROMANCER_SKILLS = [
  { ...MAGE_BASE[0], id: 'necromancer_basic', name: 'Death Bolt', desc: 'Deals 100% ATK and heals self for 15% of damage dealt.', effects: [{ type: 'dmg', multiplier: 1.0, target: 'enemy' }, { type: 'lifesteal', value: 0.15 }] },
  { ...MAGE_BASE[1], id: 'necromancer_skill', name: 'Soul Drain', desc: 'Deals 200% ATK and steals life force: heals self for 25% of damage dealt.', manaCost: 25, effects: [{ type: 'dmg', multiplier: 2.0, target: 'enemy' }, { type: 'lifesteal', value: 0.25 }] },
  { ...MAGE_BASE[2], id: 'necromancer_ult', name: 'Raise Dead', desc: 'Revives one dead ally at full HP and fears all enemies for 2 turns (debuff ATK -30%).', effects: [{ type: 'revive', value: 1.0, target: 'deadAlly' }, { type: 'debuff', stat: 'atk', multiplier: 0.70, ticks: 2, target: 'allEnemies' }] },
  { id: 'necromancer_passive', slot: 'passive', icon: '💀', name: 'Death\'s Embrace', desc: 'On enemy death, gain ATK +20% for 3 turns.', effects: [{ type: 'passive_onKillBuff', stat: 'atk', value: 0.20, ticks: 3 }] },
]

const INFERNO_LORD_SKILLS = [
  { ...PYROMANCER_SKILLS[0], id: 'inferno_lord_basic', name: 'Magma Bolt', desc: 'Deals 120% ATK fire and intensifies all existing Burn stacks by 1 turn.', effects: [{ type: 'dmg', multiplier: 1.2, target: 'enemy' }, { type: 'dot', value: 0.5, ticks: 3, target: 'enemy' }] },
  { ...PYROMANCER_SKILLS[1], id: 'inferno_lord_skill', name: 'Flame Eruption', desc: 'Detonates all Burn stacks on all enemies for 80% ATK per stack, then reapplies.', manaCost: 35, effects: [{ type: 'dmgAll', multiplier: 3.5 }, { type: 'dot', value: 0.8, ticks: 5, target: 'allEnemies' }] },
  { ...PYROMANCER_SKILLS[2], id: 'inferno_lord_ult', name: 'Apocalypse Fire', desc: 'Deals 700% ATK AOE fire, applies max Burn stacks to all, stuns for 2 turns.', effects: [{ type: 'dmgAll', multiplier: 7.0 }, { type: 'dot', value: 1.0, ticks: 6, target: 'allEnemies' }, { type: 'stun', ticks: 2 }] },
  { id: 'inferno_lord_passive', slot: 'passive', icon: '🌋', name: 'Infernal Core', desc: 'Burn deals 50% more damage. All fire spells +20% damage.', effects: [{ type: 'passive_dotAmp', value: 0.50 }, { type: 'passive_spellBoost', value: 0.20 }] },
]

const TEMPEST_CALLER_SKILLS = [
  { ...STORM_MAGE_SKILLS[0], id: 'tempest_caller_basic', name: 'Voltaic Arc', desc: 'Deals 130% ATK and chains to up to 3 additional enemies for 70% ATK each.', effects: [{ type: 'dmg', multiplier: 1.3, target: 'enemy' }, { type: 'dmg', multiplier: 0.7, target: 'enemy', chain: 3 }] },
  { ...STORM_MAGE_SKILLS[1], id: 'tempest_caller_skill', name: 'Chain Storm', desc: 'Deals 200% ATK to all enemies, then chains lightning between them again.', manaCost: 35, effects: [{ type: 'dmgAll', multiplier: 2.0 }, { type: 'dmgAll', multiplier: 1.0 }] },
  { ...STORM_MAGE_SKILLS[2], id: 'tempest_caller_ult', name: 'Eye of the Storm', desc: 'Deals 500% ATK to all. Storm lingers for 5 turns (100% ATK AOE each turn).', effects: [{ type: 'dmgAll', multiplier: 5.0 }, { type: 'dot', value: 1.0, ticks: 5, target: 'allEnemies' }] },
  { id: 'tempest_caller_passive', slot: 'passive', icon: '🌪️', name: 'Living Storm', desc: 'Every basic attack also hits all enemies for 25% ATK as chain lightning.', effects: [{ type: 'passive_chainLightning', value: 0.25, targets: 99 }] },
]

const ARCANE_SOVEREIGN_SKILLS = [
  { ...ARCHMAGE_SKILLS[0], id: 'arcane_sovereign_basic', name: 'Sovereign\'s Lance', desc: 'Deals 130% ATK ignoring all DEF.', effects: [{ type: 'dmg', multiplier: 1.3, target: 'enemy', ignoresDef: true }] },
  { ...ARCHMAGE_SKILLS[1], id: 'arcane_sovereign_skill', name: 'Mana Surge', desc: 'Deals 350% ATK to one target. Costs only half mana.', manaCost: 15, effects: [{ type: 'dmg', multiplier: 3.5, target: 'enemy', ignoresDef: true }] },
  { ...ARCHMAGE_SKILLS[2], id: 'arcane_sovereign_ult', name: 'Twin Singularity', desc: 'Fires Arcane Singularity twice: 500% ATK AOE both times with stuns.', effects: [{ type: 'dmgAll', multiplier: 5.0 }, { type: 'stun', ticks: 2 }, { type: 'dmgAll', multiplier: 5.0 }] },
  { id: 'arcane_sovereign_passive', slot: 'passive', icon: '💠', name: 'Arcane Dominion', desc: 'All spells cost 50% less mana. Mana regen is doubled.', effects: [{ type: 'passive_manaCostReduce', value: 0.50 }, { type: 'passive_manaRegenBoost', value: 2.0 }] },
]

const LICH_SKILLS = [
  { ...NECROMANCER_SKILLS[0], id: 'lich_basic', name: 'Life Drain', desc: 'Deals 100% ATK and heals self for 25% of damage dealt.', effects: [{ type: 'dmg', multiplier: 1.0, target: 'enemy' }, { type: 'lifesteal', value: 0.25 }] },
  { ...NECROMANCER_SKILLS[1], id: 'lich_skill', name: 'Corpse Explosion', desc: 'Deals 250% ATK AOE necrotic and applies Decay (DEF -20% for 4 turns) to all.', manaCost: 30, effects: [{ type: 'dmgAll', multiplier: 2.5 }, { type: 'debuff', stat: 'def', multiplier: 0.80, ticks: 4, target: 'allEnemies' }] },
  { ...NECROMANCER_SKILLS[2], id: 'lich_ult', name: 'Undead Army', desc: 'Revives all dead allies as undead at 80% HP and fears all enemies for 3 turns.', effects: [{ type: 'reviveAll', value: 0.80 }, { type: 'debuff', stat: 'atk', multiplier: 0.60, ticks: 3, target: 'allEnemies' }] },
  { id: 'lich_passive', slot: 'passive', icon: '☠️', name: 'Phylactery', desc: 'Once per combat, revive at 50% HP on death. Lifesteal on all skills +15%.', effects: [{ type: 'passive_deathSave', value: 0.50, charges: 1 }, { type: 'passive_lifesteal', value: 0.15 }] },
]

// ─── HEALER TIER 2/3 ─────────────────────────────────────────────────────────

const BISHOP_SKILLS = [
  { ...HEALER_BASE[0], id: 'bishop_basic', name: 'Sanctify', desc: 'Deals 70% ATK and heals all allies for 8% max HP.', effects: [{ type: 'dmg', multiplier: 0.7, target: 'enemy' }, { type: 'healAll', value: 0.08, stat: 'maxHp' }] },
  { ...HEALER_BASE[1], id: 'bishop_skill', name: 'Mass Heal', desc: 'Heals all allies for 50% max HP.', manaCost: 35, effects: [{ type: 'healAll', value: 0.50, stat: 'maxHp' }] },
  { ...HEALER_BASE[2], id: 'bishop_ult', name: 'Holy Miracle', desc: 'Revives all dead allies and heals the entire party to full HP, plus DEF +30% for 5 turns.', effects: [{ type: 'reviveAll', value: 0.60 }, { type: 'healAll', value: 1.0, stat: 'maxHp' }, { type: 'buffAll', stat: 'def', multiplier: 1.30, ticks: 5 }] },
  { id: 'bishop_passive', slot: 'passive', icon: '👑', name: 'Sermon of Life', desc: 'Party passively regens 4% max HP per turn from holy aura.', effects: [{ type: 'passive_partyRegen', value: 0.04 }] },
]

const ORACLE_SKILLS = [
  { ...HEALER_BASE[0], id: 'oracle_basic', name: 'Prophetic Strike', desc: 'Deals 70% ATK and places Foresight on self (negate the next hit taken).', effects: [{ type: 'dmg', multiplier: 0.7, target: 'enemy' }, { type: 'shield', multiplier: 9999, ticks: 1, target: 'self' }] },
  { ...HEALER_BASE[1], id: 'oracle_skill', name: 'Fate\'s Shield', desc: 'Target ally becomes invulnerable for 2 turns.', manaCost: 30, effects: [{ type: 'shield', multiplier: 9999, ticks: 2, target: 'lowestHpAlly' }] },
  { ...HEALER_BASE[2], id: 'oracle_ult', name: 'Precognition', desc: 'All allies gain death protection for 3 turns — cannot be reduced below 1 HP.', effects: [{ type: 'deathImmunity', ticks: 3, target: 'allAllies' }, { type: 'healAll', value: 0.40, stat: 'maxHp' }] },
  { id: 'oracle_passive', slot: 'passive', icon: '🔮', name: 'Future Sight', desc: '30% chance to negate any incoming lethal blow for any ally.', effects: [{ type: 'passive_deathSave', value: 0.30, charges: 99 }] },
]

const ARCHDRUID_SKILLS = [
  { ...HEALER_BASE[0], id: 'archdruid_basic', name: 'Nature\'s Wrath', desc: 'Deals 110% ATK nature damage and places a 3-tick HoT on the lowest HP ally.', effects: [{ type: 'dmg', multiplier: 1.1, target: 'enemy' }, { type: 'dot', damageType: 'heal', value: 0.06, stat: 'maxHp', ticks: 3, target: 'lowestHpAlly' }] },
  { ...HEALER_BASE[1], id: 'archdruid_skill', name: 'Ancient Growth', desc: 'Places a powerful HoT on all allies: 10% max HP per turn for 5 turns.', manaCost: 35, effects: [{ type: 'dot', damageType: 'heal', value: 0.10, stat: 'maxHp', ticks: 5, target: 'allAllies' }] },
  { ...HEALER_BASE[2], id: 'archdruid_ult', name: 'Nature\'s Fury', desc: 'Deals 300% ATK AOE nature damage and places HoT on all allies for 5 turns.', effects: [{ type: 'dmgAll', multiplier: 3.0 }, { type: 'dot', damageType: 'heal', value: 0.08, stat: 'maxHp', ticks: 5, target: 'allAllies' }] },
  { id: 'archdruid_passive', slot: 'passive', icon: '🌳', name: 'Verdant Soul', desc: 'HoTs activate 25% faster. Nature damage +15%.', effects: [{ type: 'passive_healBoost', value: 0.25 }, { type: 'passive_spellBoost', value: 0.15 }] },
]

const SPIRITWALKER_SKILLS = [
  { ...HEALER_BASE[0], id: 'spiritwalker_basic', name: 'Spirit Touch', desc: 'Deals 70% ATK and a bound spirit attacks for an additional 50% ATK.', effects: [{ type: 'dmg', multiplier: 0.7, target: 'enemy' }, { type: 'dmg', multiplier: 0.5, target: 'enemy' }] },
  { ...HEALER_BASE[1], id: 'spiritwalker_skill', name: 'Spirit Bind', desc: 'Summons 3 spirits that each heal an ally for 20% max HP.', manaCost: 35, effects: [{ type: 'healAll', value: 0.20, stat: 'maxHp' }, { type: 'healAll', value: 0.20, stat: 'maxHp' }] },
  { ...HEALER_BASE[2], id: 'spiritwalker_ult', name: 'Spirit Storm', desc: 'Spirits attack all enemies 3 times (100% ATK each) and heal all allies for 30% max HP.', effects: [{ type: 'dmgAll', multiplier: 1.0 }, { type: 'dmgAll', multiplier: 1.0 }, { type: 'dmgAll', multiplier: 1.0 }, { type: 'healAll', value: 0.30, stat: 'maxHp' }] },
  { id: 'spiritwalker_passive', slot: 'passive', icon: '🌀', name: 'Spirit Presence', desc: 'Each living party member has a spirit healing them for 3% max HP per turn.', effects: [{ type: 'passive_partyRegen', value: 0.03 }] },
]

const ARCH_SERAPH_SKILLS = [
  { ...BISHOP_SKILLS[0], id: 'arch_seraph_basic', name: 'Seraph\'s Touch', desc: 'Deals 60% ATK and heals all allies for 15% max HP. Overflow becomes a shield.', effects: [{ type: 'dmg', multiplier: 0.6, target: 'enemy' }, { type: 'healAll', value: 0.15, stat: 'maxHp' }] },
  { ...BISHOP_SKILLS[1], id: 'arch_seraph_skill', name: 'Angelic Barrier', desc: 'Heals all allies for 60% max HP; excess healing converts to a damage shield.', manaCost: 40, effects: [{ type: 'healAll', value: 0.60, stat: 'maxHp' }, { type: 'shield', multiplier: 4.0, stat: 'def', ticks: 3, target: 'allAllies' }] },
  { ...BISHOP_SKILLS[2], id: 'arch_seraph_ult', name: 'Divine Providence', desc: 'While mana > 0, no ally can die for 5 turns (1 HP floor). Heals all for 50% max HP.', effects: [{ type: 'deathImmunity', ticks: 5, target: 'allAllies' }, { type: 'healAll', value: 0.50, stat: 'maxHp' }] },
  { id: 'arch_seraph_passive', slot: 'passive', icon: '😇', name: 'Overflow', desc: 'Any heal exceeding max HP becomes a shield for 2 turns. Party regen +5% per turn.', effects: [{ type: 'passive_overflowShield', value: 1.0 }, { type: 'passive_partyRegen', value: 0.05 }] },
]

const SEER_SKILLS = [
  { ...ORACLE_SKILLS[0], id: 'seer_basic', name: 'Vision Strike', desc: 'Deals 70% ATK and halves the next attack the target makes.', effects: [{ type: 'dmg', multiplier: 0.7, target: 'enemy' }, { type: 'debuff', stat: 'atk', multiplier: 0.50, ticks: 1, target: 'enemy' }] },
  { ...ORACLE_SKILLS[1], id: 'seer_skill', name: 'Temporal Ward', desc: 'Target ally dodges the next 2 incoming attacks completely.', manaCost: 30, effects: [{ type: 'shield', multiplier: 9999, ticks: 2, target: 'lowestHpAlly' }] },
  { ...ORACLE_SKILLS[2], id: 'seer_ult', name: 'Omniscience', desc: 'All allies negate next fatal hit and heal for 40% max HP.', effects: [{ type: 'deathImmunity', ticks: 5, target: 'allAllies' }, { type: 'healAll', value: 0.40, stat: 'maxHp' }] },
  { id: 'seer_passive', slot: 'passive', icon: '👁️', name: 'Death Foreseen', desc: 'Each ally has a 50% chance to survive any fatal blow at 1 HP.', effects: [{ type: 'passive_deathSave', value: 0.50, charges: 99 }] },
]

const WORLD_TREE_SKILLS = [
  { ...ARCHDRUID_SKILLS[0], id: 'world_tree_basic', name: 'Root Strike', desc: 'Deals 80% ATK nature and all allies regen 5% max HP this turn.', effects: [{ type: 'dmg', multiplier: 0.8, target: 'enemy' }, { type: 'healAll', value: 0.05, stat: 'maxHp' }] },
  { ...ARCHDRUID_SKILLS[1], id: 'world_tree_skill', name: 'Ancient Roots', desc: 'All allies regenerate 15% max HP per turn for 6 turns.', manaCost: 40, effects: [{ type: 'dot', damageType: 'heal', value: 0.15, stat: 'maxHp', ticks: 6, target: 'allAllies' }] },
  { ...ARCHDRUID_SKILLS[2], id: 'world_tree_ult', name: 'World Tree\'s Blessing', desc: 'All allies heal 80% max HP and regen 8% per turn for 8 turns.', effects: [{ type: 'healAll', value: 0.80, stat: 'maxHp' }, { type: 'dot', damageType: 'heal', value: 0.08, stat: 'maxHp', ticks: 8, target: 'allAllies' }] },
  { id: 'world_tree_passive', slot: 'passive', icon: '🌲', name: 'Life\'s Abundance', desc: 'Party passively regenerates 6% max HP per turn from the World Tree\'s roots.', effects: [{ type: 'passive_partyRegen', value: 0.06 }] },
]

const SPIRIT_SOVEREIGN_SKILLS = [
  { ...SPIRITWALKER_SKILLS[0], id: 'spirit_sovereign_basic', name: 'Sovereign\'s Smite', desc: 'Deals 90% ATK and spirits heal party for 15% of damage dealt.', effects: [{ type: 'dmg', multiplier: 0.9, target: 'enemy' }, { type: 'lifesteal', value: 0.15, target: 'allAllies' }] },
  { ...SPIRITWALKER_SKILLS[1], id: 'spirit_sovereign_skill', name: 'Spirit Army', desc: 'Summons 5 spirits — each heals a random ally for 20% max HP.', manaCost: 40, effects: [{ type: 'healAll', value: 0.20, stat: 'maxHp' }, { type: 'healAll', value: 0.20, stat: 'maxHp' }] },
  { ...SPIRITWALKER_SKILLS[2], id: 'spirit_sovereign_ult', name: 'Sovereign\'s Dominion', desc: 'Spirit army attacks all enemies (5× 80% ATK) and heals party for all damage dealt.', effects: [{ type: 'dmgAll', multiplier: 0.8 }, { type: 'dmgAll', multiplier: 0.8 }, { type: 'dmgAll', multiplier: 0.8 }, { type: 'dmgAll', multiplier: 0.8 }, { type: 'dmgAll', multiplier: 0.8 }, { type: 'healAll', value: 0.50, stat: 'maxHp' }] },
  { id: 'spirit_sovereign_passive', slot: 'passive', icon: '👻', name: 'Healing Spirits', desc: '10% of all party damage dealt is returned as healing to all allies.', effects: [{ type: 'passive_lifesteal', value: 0.10, target: 'allAllies' }] },
]

// ─── ASSASSIN TIER 2/3 ───────────────────────────────────────────────────────

const PHANTOM_SKILLS = [
  { ...ASSASSIN_BASE[0], id: 'phantom_basic', name: 'Phantom Slash', desc: 'Deals 110% ATK with a 25% chance to phase, dodging the next hit.', effects: [{ type: 'dmg', multiplier: 1.1, target: 'enemy' }, { type: 'buff', stat: 'evasion', multiplier: 1.25, ticks: 1, target: 'self' }] },
  { ...ASSASSIN_BASE[1], id: 'phantom_skill', name: 'Phase Strike', desc: 'Deals 250% ATK ignoring DEF. Become intangible for 2 turns (dodge all).', cooldownTurns: 3, effects: [{ type: 'dmg', multiplier: 2.5, target: 'enemy', defPierce: 1.0 }, { type: 'shield', multiplier: 9999, ticks: 2, target: 'self' }] },
  { ...ASSASSIN_BASE[2], id: 'phantom_ult', name: 'Phantom Barrage', desc: 'Strikes 5 times for 150% ATK each from the phantom dimension, ignoring DEF.', effects: [{ type: 'dmg', multiplier: 1.5, target: 'enemy', defPierce: 0.5 }, { type: 'dmg', multiplier: 1.5, target: 'enemy', defPierce: 0.5 }, { type: 'dmg', multiplier: 1.5, target: 'enemy', defPierce: 0.5 }, { type: 'dmg', multiplier: 1.5, target: 'enemy', defPierce: 0.5 }, { type: 'dmg', multiplier: 1.5, target: 'enemy', defPierce: 0.5 }] },
  { id: 'phantom_passive', slot: 'passive', icon: '👤', name: 'Phase Shift', desc: '30% chance to phase through any incoming attack.', effects: [{ type: 'passive_evasion', value: 0.30 }] },
]

const NIGHT_BLADE_SKILLS = [
  { ...ASSASSIN_BASE[0], id: 'night_blade_basic', name: 'Shadow Cut', desc: 'Deals 100% ATK and gains 1 shadow charge (up to 10).', effects: [{ type: 'dmg', multiplier: 1.0, target: 'enemy' }, { type: 'gainCharge', chargeType: 'shadow', value: 1 }] },
  { ...ASSASSIN_BASE[1], id: 'night_blade_skill', name: 'Shadow Release', desc: 'Consumes all shadow charges dealing 100% ATK each (max 10 charges = 1000% ATK).', cooldownTurns: 1, effects: [{ type: 'consumeCharges', chargeType: 'shadow', multiplier: 1.0 }] },
  { ...ASSASSIN_BASE[2], id: 'night_blade_ult', name: 'Void Slash', desc: 'Deals 500% ATK and resets all shadow charges for a fresh combo.', effects: [{ type: 'dmg', multiplier: 5.0, target: 'enemy', defPierce: 0.50 }, { type: 'resetCharges', chargeType: 'shadow' }] },
  { id: 'night_blade_passive', slot: 'passive', icon: '🌙', name: 'Charge Accumulation', desc: 'Basic attacks generate 2 shadow charges. Maximum charges increased to 15.', effects: [{ type: 'passive_chargeBoost', chargeType: 'shadow', value: 2 }] },
]

const SWORD_SAINT_SKILLS = [
  { ...ASSASSIN_BASE[0], id: 'sword_saint_basic', name: 'Saint\'s Cut', desc: 'Deals 110% ATK and gains ATK +5% for 2 turns (stacks).', effects: [{ type: 'dmg', multiplier: 1.1, target: 'enemy' }, { type: 'buff', stat: 'atk', multiplier: 1.05, ticks: 2, target: 'self' }] },
  { ...ASSASSIN_BASE[1], id: 'sword_saint_skill', name: 'Perfect Form', desc: 'Deals 300% ATK ignoring DEF. ATK buff stacks double on this hit.', cooldownTurns: 3, effects: [{ type: 'dmg', multiplier: 3.0, target: 'enemy', defPierce: 1.0 }, { type: 'buff', stat: 'atk', multiplier: 1.15, ticks: 3, target: 'self' }] },
  { ...ASSASSIN_BASE[2], id: 'sword_saint_ult', name: 'Sword God\'s Edge', desc: 'Deals 700% ATK. If it kills, chains 400% ATK to the next enemy.', effects: [{ type: 'dmg', multiplier: 7.0, target: 'enemy' }, { type: 'dmg', multiplier: 4.0, target: 'enemy', onKillChain: true }] },
  { id: 'sword_saint_passive', slot: 'passive', icon: '🗡️', name: 'Blade Mastery', desc: 'Each consecutive hit adds +5% ATK (max +50%). Resets on a miss.', effects: [{ type: 'passive_comboStack', max: 10, value: 0.05 }] },
]

const DEATH_DEALER_SKILLS = [
  { ...ASSASSIN_BASE[0], id: 'death_dealer_basic', name: 'Death\'s Touch', desc: 'Deals 110% ATK. If target is below 20% HP, deals triple damage.', effects: [{ type: 'dmg', multiplier: 1.1, target: 'enemy' }, { type: 'executeThreshold', threshold: 0.20, multiplier: 3.0 }] },
  { ...ASSASSIN_BASE[1], id: 'death_dealer_skill', name: 'Execute', desc: 'Instantly kills enemies below 20% HP, or deals 250% ATK otherwise.', cooldownTurns: 2, effects: [{ type: 'execute', threshold: 0.20, fallbackMultiplier: 2.5, target: 'enemy' }] },
  { ...ASSASSIN_BASE[2], id: 'death_dealer_ult', name: 'Reaping', desc: 'Executes all enemies below 25% HP simultaneously. Resets all cooldowns.', effects: [{ type: 'execute', threshold: 0.25, target: 'allEnemies' }, { type: 'resetCooldowns', target: 'self' }] },
  { id: 'death_dealer_passive', slot: 'passive', icon: '💀', name: 'Death\'s Harvest', desc: 'Killing an enemy resets all cooldowns and grants ATK +10% for 3 turns.', effects: [{ type: 'passive_onKillBuff', stat: 'atk', value: 0.10, ticks: 3 }, { type: 'passive_onKillResetCooldowns' }] },
]

const VOID_STALKER_SKILLS = [
  { ...PHANTOM_SKILLS[0], id: 'void_stalker_basic', name: 'Void Strike', desc: 'Deals 130% ATK from the void. 30% chance to be untargetable this turn.', effects: [{ type: 'dmg', multiplier: 1.3, target: 'enemy', defPierce: 0.30 }, { type: 'buff', stat: 'evasion', multiplier: 1.30, ticks: 1, target: 'self' }] },
  { ...PHANTOM_SKILLS[1], id: 'void_stalker_skill', name: 'Dimensional Tear', desc: 'Deals 400% ATK ignoring DEF. Phases into the void for 2 turns (untargetable).', cooldownTurns: 3, effects: [{ type: 'dmg', multiplier: 4.0, target: 'enemy', defPierce: 1.0 }, { type: 'shield', multiplier: 9999, ticks: 2, target: 'self' }] },
  { ...PHANTOM_SKILLS[2], id: 'void_stalker_ult', name: 'Void Nova', desc: 'Erupts from the void dimension for 600% ATK to all enemies.', effects: [{ type: 'dmgAll', multiplier: 6.0, defPierce: 0.50 }] },
  { id: 'void_stalker_passive', slot: 'passive', icon: '🕳️', name: 'Phase Existence', desc: '30% of all attacks against this hero pass through into the void (miss).', effects: [{ type: 'passive_evasion', value: 0.30 }] },
]

const SHADOW_EMPEROR_SKILLS = [
  { ...NIGHT_BLADE_SKILLS[0], id: 'shadow_emperor_basic', name: 'Emperor\'s Cut', desc: 'Deals 120% ATK and gains 2 shadow charges.', effects: [{ type: 'dmg', multiplier: 1.2, target: 'enemy' }, { type: 'gainCharge', chargeType: 'shadow', value: 2 }] },
  { ...NIGHT_BLADE_SKILLS[1], id: 'shadow_emperor_skill', name: 'Shadow Dominion', desc: 'Empowers shadow charges to triple potency for 4 turns.', cooldownTurns: 4, effects: [{ type: 'buff', stat: 'atk', multiplier: 2.0, ticks: 4, target: 'self' }] },
  { ...NIGHT_BLADE_SKILLS[2], id: 'shadow_emperor_ult', name: 'Shadow Apocalypse', desc: 'Consumes all charges for 200% ATK each (no cap on charges).', effects: [{ type: 'consumeCharges', chargeType: 'shadow', multiplier: 2.0 }, { type: 'dmg', multiplier: 5.0, target: 'enemy' }] },
  { id: 'shadow_emperor_passive', slot: 'passive', icon: '🌑', name: 'Eternal Shadow', desc: 'Shadow charges never decay. At 20 charges, auto-release for massive damage.', effects: [{ type: 'passive_chargeBoost', chargeType: 'shadow', value: 2 }, { type: 'passive_evasion', value: 0.20 }] },
]

const BLADE_GOD_SKILLS = [
  { ...SWORD_SAINT_SKILLS[0], id: 'blade_god_basic', name: 'God Slash', desc: 'Deals 150% ATK. On kill, ATK permanently increases by 5%.', effects: [{ type: 'dmg', multiplier: 1.5, target: 'enemy' }, { type: 'onKill_permAtk', value: 0.05 }] },
  { ...SWORD_SAINT_SKILLS[1], id: 'blade_god_skill', name: 'Divine Technique', desc: 'Deals 400% ATK ignoring DEF. On crit, ATK permanently increases by 3%.', cooldownTurns: 2, effects: [{ type: 'dmg', multiplier: 4.0, target: 'enemy', defPierce: 1.0 }, { type: 'onCrit_permAtk', value: 0.03 }] },
  { ...SWORD_SAINT_SKILLS[2], id: 'blade_god_ult', name: 'Blade of Divinity', desc: 'Deals 800% ATK. If it kills, chains 400% ATK to the next target.', effects: [{ type: 'dmg', multiplier: 8.0, target: 'enemy' }, { type: 'dmg', multiplier: 4.0, target: 'enemy', onKillChain: true }] },
  { id: 'blade_god_passive', slot: 'passive', icon: '⚔️', name: 'Divine Path', desc: 'Each kill permanently adds +5% ATK. Each crit permanently adds +2% ATK.', effects: [{ type: 'passive_onKillPermAtk', value: 0.05 }, { type: 'passive_critDmgBonus', value: 0.30 }] },
]

const GRIM_REAPER_SKILLS = [
  { ...DEATH_DEALER_SKILLS[0], id: 'grim_reaper_basic', name: 'Scythe Sweep', desc: 'Deals 120% ATK to all enemies with the reaper\'s scythe.', effects: [{ type: 'dmgAll', multiplier: 1.2 }] },
  { ...DEATH_DEALER_SKILLS[1], id: 'grim_reaper_skill', name: 'Death\'s Scythe', desc: 'Executes all enemies below 35% HP, or deals 300% ATK AOE otherwise.', cooldownTurns: 2, effects: [{ type: 'execute', threshold: 0.35, fallbackMultiplier: 3.0, target: 'allEnemies' }] },
  { ...DEATH_DEALER_SKILLS[2], id: 'grim_reaper_ult', name: 'Harvest of Souls', desc: 'Kills all enemies below 50% HP instantly. Resets all cooldowns.', effects: [{ type: 'execute', threshold: 0.50, target: 'allEnemies' }, { type: 'resetCooldowns', target: 'self' }] },
  { id: 'grim_reaper_passive', slot: 'passive', icon: '💀', name: 'Death\'s Domain', desc: 'Execute threshold is 35%. On any kill, scythe sweeps all enemies for 150% ATK.', effects: [{ type: 'passive_onKillAoe', value: 1.5 }, { type: 'passive_onKillResetCooldowns' }] },
]

// ─── ROGUE TIER 2/3 ──────────────────────────────────────────────────────────

const ACROBAT_SKILLS = [
  { ...ROGUE_BASE[0], id: 'acrobat_basic', name: 'Acrobatic Strike', desc: 'Deals 100% ATK and boosts own evasion by 20% for 1 turn.', effects: [{ type: 'dmg', multiplier: 1.0, target: 'enemy' }, { type: 'buff', stat: 'evasion', multiplier: 1.20, ticks: 1, target: 'self' }] },
  { ...ROGUE_BASE[1], id: 'acrobat_skill', name: 'Tumble', desc: 'Dodges all attacks for 2 turns. Counterattacks each dodge for 150% ATK.', cooldownTurns: 3, effects: [{ type: 'shield', multiplier: 9999, ticks: 2, target: 'self' }, { type: 'reflect', value: 1.5, ticks: 2, target: 'self' }] },
  { ...ROGUE_BASE[2], id: 'acrobat_ult', name: 'Perfect Evasion', desc: '100% evasion for 3 turns. Each avoided attack triggers a 250% ATK counter.', effects: [{ type: 'shield', multiplier: 9999, ticks: 3, target: 'self' }, { type: 'reflect', value: 2.5, ticks: 3, target: 'self' }] },
  { id: 'acrobat_passive', slot: 'passive', icon: '🎪', name: 'Counter', desc: 'Whenever dodging an attack, immediately counterattack for 200% ATK.', effects: [{ type: 'passive_evasion', value: 0.30, onDodgeAtk: 2.0, ticks: 1 }] },
]

const VENOMANCER_SKILLS = [
  { ...ROGUE_BASE[0], id: 'venomancer_basic', name: 'Venom Fang', desc: 'Deals 90% ATK and applies Venom (30% ATK DoT for 3 turns).', effects: [{ type: 'dmg', multiplier: 0.9, target: 'enemy' }, { type: 'dot', value: 0.3, ticks: 3, target: 'enemy' }] },
  { ...ROGUE_BASE[1], id: 'venomancer_skill', name: 'Toxic Cloud', desc: 'Poisons all enemies: 40% ATK per turn for 4 turns each.', cooldownTurns: 3, effects: [{ type: 'dot', value: 0.4, ticks: 4, target: 'allEnemies' }] },
  { ...ROGUE_BASE[2], id: 'venomancer_ult', name: 'Death Venom', desc: 'Deals 250% ATK to all enemies and applies max Venom stacks to all.', effects: [{ type: 'dmgAll', multiplier: 2.5 }, { type: 'dot', value: 0.5, ticks: 6, target: 'allEnemies' }] },
  { id: 'venomancer_passive', slot: 'passive', icon: '🐍', name: 'Virulent', desc: 'Venom DoTs deal 25% more damage per stack. Basic attacks apply Venom.', effects: [{ type: 'passive_dotAmp', value: 0.25 }, { type: 'passive_basicDot', value: 0.30, ticks: 3 }] },
]

const STORM_DANCER_SKILLS = [
  { ...ROGUE_BASE[0], id: 'storm_dancer_basic', name: 'Blade Storm', desc: 'Deals 80% ATK to all enemies twice.', effects: [{ type: 'dmgAll', multiplier: 0.8, hits: 2 }] },
  { ...ROGUE_BASE[1], id: 'storm_dancer_skill', name: 'Cyclone', desc: 'Spins through all enemies 4 times for 120% ATK each.', cooldownTurns: 2, effects: [{ type: 'dmgAll', multiplier: 1.2, hits: 4 }] },
  { ...ROGUE_BASE[2], id: 'storm_dancer_ult', name: 'Hurricane Spin', desc: 'Unleashes a hurricane spin hitting all enemies 8 times for 100% ATK each.', effects: [{ type: 'dmgAll', multiplier: 1.0, hits: 8 }] },
  { id: 'storm_dancer_passive', slot: 'passive', icon: '🌀', name: 'Momentum', desc: 'Each consecutive AOE hit increases damage by 5% (max +50%).', effects: [{ type: 'passive_comboStack', max: 10, value: 0.05 }] },
]

const CRIMSON_BLADE_SKILLS = [
  { ...ROGUE_BASE[0], id: 'crimson_blade_basic', name: 'Crimson Cut', desc: 'Deals 100% ATK and applies Bleed (35% ATK per turn for 3 turns).', effects: [{ type: 'dmg', multiplier: 1.0, target: 'enemy' }, { type: 'dot', value: 0.35, ticks: 3, target: 'enemy' }] },
  { ...ROGUE_BASE[1], id: 'crimson_blade_skill', name: 'Blood Slash', desc: 'Deals 200% ATK and applies 3 Bleed stacks to the target.', cooldownTurns: 2, effects: [{ type: 'dmg', multiplier: 2.0, target: 'enemy' }, { type: 'dot', value: 0.5, ticks: 5, target: 'enemy' }] },
  { ...ROGUE_BASE[2], id: 'crimson_blade_ult', name: 'Bloodbath', desc: 'Deals 300% ATK to all enemies and applies max Bleed stacks to all.', effects: [{ type: 'dmgAll', multiplier: 3.0 }, { type: 'dot', value: 0.5, ticks: 5, target: 'allEnemies' }] },
  { id: 'crimson_blade_passive', slot: 'passive', icon: '🔴', name: 'Blood Frenzy', desc: 'Each Bleed stack on a target increases all damage dealt to it by 8%.', effects: [{ type: 'passive_dotAmp', value: 0.08 }] },
]

const WIND_PHANTOM_SKILLS = [
  { ...ACROBAT_SKILLS[0], id: 'wind_phantom_basic', name: 'Wind Slice', desc: 'Deals 120% ATK. After dodging, next attack deals 200% ATK bonus.', effects: [{ type: 'dmg', multiplier: 1.2, target: 'enemy' }, { type: 'buff', stat: 'atk', multiplier: 2.0, ticks: 1, target: 'self' }] },
  { ...ACROBAT_SKILLS[1], id: 'wind_phantom_skill', name: 'Phantom Step', desc: 'Dodge all attacks for 3 turns. Each counterattack hits for 300% ATK.', cooldownTurns: 3, effects: [{ type: 'shield', multiplier: 9999, ticks: 3, target: 'self' }, { type: 'reflect', value: 3.0, ticks: 3, target: 'self' }] },
  { ...ACROBAT_SKILLS[2], id: 'wind_phantom_ult', name: 'Storm Phantom', desc: '10 rapid wind attacks of 100% ATK. If any are dodged by enemies, repeat.', effects: [{ type: 'dmg', multiplier: 1.0, target: 'enemy' }, { type: 'dmg', multiplier: 1.0, target: 'enemy' }, { type: 'dmg', multiplier: 1.0, target: 'enemy' }, { type: 'dmg', multiplier: 1.0, target: 'enemy' }, { type: 'dmg', multiplier: 1.0, target: 'enemy' }, { type: 'dmgAll', multiplier: 1.5 }] },
  { id: 'wind_phantom_passive', slot: 'passive', icon: '💨', name: 'Wind Counter', desc: 'Each dodge triggers an immediate 250% ATK counter-attack.', effects: [{ type: 'passive_evasion', value: 0.40, onDodgeAtk: 2.5, ticks: 1 }] },
]

const PLAGUE_MASTER_SKILLS = [
  { ...VENOMANCER_SKILLS[0], id: 'plague_master_basic', name: 'Plague Touch', desc: 'Deals 90% ATK. Venom on target spreads to one adjacent enemy.', effects: [{ type: 'dmg', multiplier: 0.9, target: 'enemy' }, { type: 'dot', value: 0.4, ticks: 4, target: 'enemy' }] },
  { ...VENOMANCER_SKILLS[1], id: 'plague_master_skill', name: 'Outbreak', desc: 'Spreads all DoTs from one enemy to all other enemies.', cooldownTurns: 3, effects: [{ type: 'spreadDot', target: 'allEnemies' }, { type: 'dot', value: 0.5, ticks: 5, target: 'allEnemies' }] },
  { ...VENOMANCER_SKILLS[2], id: 'plague_master_ult', name: 'Pandemic', desc: 'Applies all DoTs to all enemies simultaneously; DoT damage is doubled.', effects: [{ type: 'dmgAll', multiplier: 2.0 }, { type: 'dot', value: 1.0, ticks: 6, target: 'allEnemies' }] },
  { id: 'plague_master_passive', slot: 'passive', icon: '☣️', name: 'Contagion', desc: 'When an enemy dies with Venom, all living enemies gain Venom stacks. Dots +30% damage.', effects: [{ type: 'passive_dotAmp', value: 0.30 }, { type: 'passive_basicDot', value: 0.40, ticks: 4 }] },
]

const HURRICANE_SKILLS = [
  { ...STORM_DANCER_SKILLS[0], id: 'hurricane_basic', name: 'Gale Slash', desc: 'Deals 70% ATK to all enemies. Chains again if any hit crits.', effects: [{ type: 'dmgAll', multiplier: 0.7 }, { type: 'dmgAll', multiplier: 0.7, onCritChain: true }] },
  { ...STORM_DANCER_SKILLS[1], id: 'hurricane_skill', name: 'Maelstrom', desc: 'Deals 80% ATK to all enemies 6 times. Each kill adds 2 more spins.', cooldownTurns: 2, effects: [{ type: 'dmgAll', multiplier: 0.8, hits: 6 }] },
  { ...STORM_DANCER_SKILLS[2], id: 'hurricane_ult', name: 'Hurricane Force', desc: 'Continuous 60% ATK to all enemies for 8 turns — a relentless storm.', effects: [{ type: 'dmgAll', multiplier: 0.6, ticks: 8, isChanneled: true }] },
  { id: 'hurricane_passive', slot: 'passive', icon: '🌪️', name: 'Infinite Spin', desc: 'After hitting all enemies, 35% chance to spin again (can chain infinitely).', effects: [{ type: 'passive_comboStack', max: 20, value: 0.05 }] },
]

const BLOODLETTER_SKILLS = [
  { ...CRIMSON_BLADE_SKILLS[0], id: 'bloodletter_basic', name: 'Arterial Slash', desc: 'Deals 110% ATK. Bleed stacks applied by this hero never expire.', effects: [{ type: 'dmg', multiplier: 1.1, target: 'enemy' }, { type: 'dot', value: 0.5, ticks: 99, target: 'enemy' }] },
  { ...CRIMSON_BLADE_SKILLS[1], id: 'bloodletter_skill', name: 'Hemorrhage', desc: 'Deals 200% ATK and applies 5 permanent Bleed stacks to the target.', cooldownTurns: 2, effects: [{ type: 'dmg', multiplier: 2.0, target: 'enemy' }, { type: 'dot', value: 0.6, ticks: 99, target: 'enemy' }] },
  { ...CRIMSON_BLADE_SKILLS[2], id: 'bloodletter_ult', name: 'Exsanguinate', desc: 'Deals 400% ATK to all enemies and all their Bleed stacks deal full damage instantly.', effects: [{ type: 'dmgAll', multiplier: 4.0 }, { type: 'dot', value: 0.8, ticks: 99, target: 'allEnemies' }] },
  { id: 'bloodletter_passive', slot: 'passive', icon: '🩸', name: 'Eternal Bleeding', desc: 'Bleed stacks are permanent. Each stack deals 12% ATK per turn.', effects: [{ type: 'passive_dotAmp', value: 0.40 }] },
]

// ─── RANGER TIER 2/3 ─────────────────────────────────────────────────────────

const DEADEYE_SKILLS = [
  { ...RANGER_BASE[0], id: 'deadeye_basic', name: 'Precision Shot', desc: 'Deals 110% ATK — guaranteed hit. Crits ignore 40% of enemy DEF.', effects: [{ type: 'dmg', multiplier: 1.1, target: 'enemy', critBonus: 0.10 }] },
  { ...RANGER_BASE[1], id: 'deadeye_skill', name: 'Pinpoint Strike', desc: 'Deals 350% ATK — guaranteed critical hit ignoring 60% DEF.', cooldownTurns: 4, effects: [{ type: 'dmg', multiplier: 3.5, target: 'enemy', defPierce: 0.60, critBonus: 0.60 }] },
  { ...RANGER_BASE[2], id: 'deadeye_ult', name: 'Perfect Shot', desc: 'Deals 600% ATK — guaranteed critical hit ignoring ALL DEF.', effects: [{ type: 'dmg', multiplier: 6.0, target: 'enemy', defPierce: 1.0 }] },
  { id: 'deadeye_passive', slot: 'passive', icon: '👁️', name: 'True Aim', desc: 'All attacks cannot miss. Critical hits always ignore 40% of enemy DEF.', effects: [{ type: 'passive_critRate', value: 0.15 }, { type: 'passive_critDefPierce', value: 0.40 }] },
]

const VOID_ARCHER_SKILLS = [
  { ...RANGER_BASE[0], id: 'void_archer_basic', name: 'Void Arrow', desc: 'Deals 110% ATK and pierces through to hit a second enemy for 60% ATK.', effects: [{ type: 'dmg', multiplier: 1.1, target: 'enemy' }, { type: 'dmg', multiplier: 0.6, target: 'enemy', pierce: true }] },
  { ...RANGER_BASE[1], id: 'void_archer_skill', name: 'Dimension Pierce', desc: 'Fires a void bolt that deals 250% ATK and pierces through all enemies.', cooldownTurns: 3, effects: [{ type: 'dmgAll', multiplier: 2.5 }] },
  { ...RANGER_BASE[2], id: 'void_archer_ult', name: 'Void Barrage', desc: 'Fires 5 void arrows hitting all enemies for 150% ATK each.', effects: [{ type: 'dmgAll', multiplier: 1.5, hits: 5 }] },
  { id: 'void_archer_passive', slot: 'passive', icon: '🌑', name: 'Piercing Void', desc: 'All arrows pierce through to also hit a second enemy for 50% of damage.', effects: [{ type: 'passive_critDefPierce', value: 0.30 }, { type: 'passive_spellBoost', value: 0.10 }] },
]

const ALPHA_SKILLS = [
  { ...RANGER_BASE[0], id: 'alpha_basic', name: 'Pack Strike', desc: 'Deals 110% ATK while beast companion also attacks for 60% ATK.', effects: [{ type: 'dmg', multiplier: 1.1, target: 'enemy' }, { type: 'dmg', multiplier: 0.6, target: 'enemy' }] },
  { ...RANGER_BASE[1], id: 'alpha_skill', name: 'Alpha\'s Call', desc: 'Summons additional beasts. Pack deals 3× 80% ATK to all enemies for 4 turns.', cooldownTurns: 4, effects: [{ type: 'dmgAll', multiplier: 0.8 }, { type: 'dmgAll', multiplier: 0.8 }, { type: 'dmgAll', multiplier: 0.8 }] },
  { ...RANGER_BASE[2], id: 'alpha_ult', name: 'Pack Assault', desc: 'Entire pack assaults all enemies — 3 strikes of 120% ATK to all.', effects: [{ type: 'dmgAll', multiplier: 1.2 }, { type: 'dmgAll', multiplier: 1.2 }, { type: 'dmgAll', multiplier: 1.2 }] },
  { id: 'alpha_passive', slot: 'passive', icon: '🦁', name: 'Alpha Leader', desc: 'All pack attacks deal +25% more damage. Eagle Eye crit bonuses enhanced.', effects: [{ type: 'passive_critRate', value: 0.12 }, { type: 'passive_critDefPierce', value: 0.25 }] },
]

const WILD_CALLER_SKILLS = [
  { ...RANGER_BASE[0], id: 'wild_caller_basic', name: 'Nature Shot', desc: 'Deals 100% ATK and a nature spirit heals the lowest HP ally for 8% max HP.', effects: [{ type: 'dmg', multiplier: 1.0, target: 'enemy' }, { type: 'heal', value: 0.08, stat: 'maxHp', target: 'lowestHpAlly' }] },
  { ...RANGER_BASE[1], id: 'wild_caller_skill', name: 'Spirit Summon', desc: 'Summons 3 nature spirits: each heals an ally 15% max HP and attacks for 80% ATK.', cooldownTurns: 3, effects: [{ type: 'dmgAll', multiplier: 0.8 }, { type: 'healAll', value: 0.15, stat: 'maxHp' }] },
  { ...RANGER_BASE[2], id: 'wild_caller_ult', name: 'Nature\'s Army', desc: 'Summons full pack and spirits: 200% ATK AOE and heals all allies 25% max HP.', effects: [{ type: 'dmgAll', multiplier: 2.0 }, { type: 'healAll', value: 0.25, stat: 'maxHp' }] },
  { id: 'wild_caller_passive', slot: 'passive', icon: '🌿', name: 'Nature Bond', desc: 'Allied summons deal +25% more damage. Party gains +10% ATK from nature energy.', effects: [{ type: 'passive_partyAtk', value: 0.10 }, { type: 'passive_spellBoost', value: 0.15 }] },
]

const TRUE_SIGHT_SKILLS = [
  { ...DEADEYE_SKILLS[0], id: 'true_sight_basic', name: 'Hawkeye Shot', desc: 'Deals 110% ATK. Every 5th basic attack is a 500% ATK guaranteed critical.', effects: [{ type: 'dmg', multiplier: 1.1, target: 'enemy', critBonus: 0.15 }] },
  { ...DEADEYE_SKILLS[1], id: 'true_sight_skill', name: 'Headshot', desc: 'Deals 400% ATK as a guaranteed critical hit ignoring ALL DEF.', cooldownTurns: 3, effects: [{ type: 'dmg', multiplier: 4.0, target: 'enemy', defPierce: 1.0 }] },
  { ...DEADEYE_SKILLS[2], id: 'true_sight_ult', name: 'Rain of Death', desc: 'Fires 5 guaranteed critical shots of 300% ATK at random enemies.', effects: [{ type: 'dmg', multiplier: 3.0, target: 'enemy' }, { type: 'dmg', multiplier: 3.0, target: 'enemy' }, { type: 'dmg', multiplier: 3.0, target: 'enemy' }, { type: 'dmg', multiplier: 3.0, target: 'enemy' }, { type: 'dmg', multiplier: 3.0, target: 'enemy' }] },
  { id: 'true_sight_passive', slot: 'passive', icon: '🔭', name: 'Perfect Vision', desc: 'Every 5th basic attack is a guaranteed 500% ATK critical headshot. Crit rate +20%.', effects: [{ type: 'passive_critRate', value: 0.20 }, { type: 'passive_critDefPierce', value: 0.50 }] },
]

const RIFT_HUNTER_SKILLS = [
  { ...VOID_ARCHER_SKILLS[0], id: 'rift_hunter_basic', name: 'Rift Arrow', desc: 'Deals 120% ATK and pulls the target into a rift (stun 1 turn).', effects: [{ type: 'dmg', multiplier: 1.2, target: 'enemy' }, { type: 'stun', ticks: 1, target: 'enemy' }] },
  { ...VOID_ARCHER_SKILLS[1], id: 'rift_hunter_skill', name: 'Void Rift', desc: 'Creates a rift pulling ALL enemies — deals 200% ATK to all and stuns for 2 turns.', cooldownTurns: 3, effects: [{ type: 'dmgAll', multiplier: 2.0 }, { type: 'stun', ticks: 2 }] },
  { ...VOID_ARCHER_SKILLS[2], id: 'rift_hunter_ult', name: 'Reality Shatter', desc: 'Deals 400% ATK AOE and rifts deal 200% ATK again for 3 additional ticks.', effects: [{ type: 'dmgAll', multiplier: 4.0 }, { type: 'dot', value: 2.0, ticks: 3, target: 'allEnemies' }] },
  { id: 'rift_hunter_passive', slot: 'passive', icon: '🕳️', name: 'Dimensional Snare', desc: '25% chance any arrow hit creates a rift, stunning the target for 1 turn.', effects: [{ type: 'passive_critRate', value: 0.10 }, { type: 'passive_critDefPierce', value: 0.40 }] },
]

const PRIMAL_LORD_SKILLS = [
  { ...ALPHA_SKILLS[0], id: 'primal_lord_basic', name: 'Primal Strike', desc: 'Deals 120% ATK and the entire beast army attacks for 5× 80% ATK.', effects: [{ type: 'dmg', multiplier: 1.2, target: 'enemy' }, { type: 'dmgAll', multiplier: 0.8 }, { type: 'dmgAll', multiplier: 0.8 }] },
  { ...ALPHA_SKILLS[1], id: 'primal_lord_skill', name: 'Primal Roar', desc: 'Buffs beast army ATK +50% and stuns all enemies for 1 turn.', cooldownTurns: 3, effects: [{ type: 'buffAll', stat: 'atk', multiplier: 1.50, ticks: 4 }, { type: 'stun', ticks: 1 }] },
  { ...ALPHA_SKILLS[2], id: 'primal_lord_ult', name: 'Beast Apocalypse', desc: 'All beasts attack all enemies (5× 150% ATK AOE). New beasts join the pack.', effects: [{ type: 'dmgAll', multiplier: 1.5 }, { type: 'dmgAll', multiplier: 1.5 }, { type: 'dmgAll', multiplier: 1.5 }, { type: 'dmgAll', multiplier: 1.5 }, { type: 'dmgAll', multiplier: 1.5 }] },
  { id: 'primal_lord_passive', slot: 'passive', icon: '🦅', name: 'Primal Command', desc: 'Pack size +3. All beasts deal +30% more damage. Crit rate +15%.', effects: [{ type: 'passive_critRate', value: 0.15 }, { type: 'passive_spellBoost', value: 0.20 }] },
]

const NATURE_SOVEREIGN_SKILLS = [
  { ...WILD_CALLER_SKILLS[0], id: 'nature_sovereign_basic', name: 'Earth Slam', desc: 'Deals 120% ATK and roots the target in place (stun 1 turn).', effects: [{ type: 'dmg', multiplier: 1.2, target: 'enemy' }, { type: 'stun', ticks: 1, target: 'enemy' }] },
  { ...WILD_CALLER_SKILLS[1], id: 'nature_sovereign_skill', name: 'Nature\'s Wrath', desc: 'Roots all enemies (stun 2 turns) and deals 200% ATK to all.', cooldownTurns: 3, effects: [{ type: 'dmgAll', multiplier: 2.0 }, { type: 'stun', ticks: 2 }] },
  { ...WILD_CALLER_SKILLS[2], id: 'nature_sovereign_ult', name: 'Gaia\'s Fury', desc: 'Earth erupts: 500% ATK AOE + 300% storm strike + heals party 30% max HP.', effects: [{ type: 'dmgAll', multiplier: 5.0 }, { type: 'dmgAll', multiplier: 3.0 }, { type: 'healAll', value: 0.30, stat: 'maxHp' }] },
  { id: 'nature_sovereign_passive', slot: 'passive', icon: '🌍', name: 'Sovereign Earth', desc: 'All attacks trigger a nature strike hitting all enemies for 30% ATK.', effects: [{ type: 'passive_chainLightning', value: 0.30, targets: 99 }, { type: 'passive_partyAtk', value: 0.10 }] },
]

// ─── SHAMAN TIER 2/3 ─────────────────────────────────────────────────────────

const THUNDER_GOD_SKILLS = [
  { ...SHAMAN_BASE[0], id: 'thunder_god_basic', name: 'God\'s Lightning', desc: 'Deals 120% ATK and chains to all enemies for 40% ATK each.', effects: [{ type: 'dmg', multiplier: 1.2, target: 'enemy' }, { type: 'dmgAll', multiplier: 0.4 }] },
  { ...SHAMAN_BASE[1], id: 'thunder_god_skill', name: 'Thunder Clap', desc: 'Deals 250% ATK to all enemies and stuns all for 1 turn.', manaCost: 30, effects: [{ type: 'dmgAll', multiplier: 2.5 }, { type: 'stun', ticks: 1 }] },
  { ...SHAMAN_BASE[2], id: 'thunder_god_ult', name: 'Divine Thunder', desc: 'Deals 400% ATK to all enemies and stuns all for 2 turns.', effects: [{ type: 'dmgAll', multiplier: 4.0 }, { type: 'stun', ticks: 2 }] },
  { id: 'thunder_god_passive', slot: 'passive', icon: '⚡', name: 'Perpetual Lightning', desc: 'Every basic attack also hits all enemies for 35% ATK as chain lightning.', effects: [{ type: 'passive_chainLightning', value: 0.35, targets: 99 }, { type: 'passive_elemBoost', value: 0.15 }] },
]

const HEX_CASTER_SKILLS = [
  { ...SHAMAN_BASE[0], id: 'hex_caster_basic', name: 'Hex Bolt', desc: 'Deals 90% ATK and applies Hex: ATK -20%, DEF -20% for 4 turns.', effects: [{ type: 'dmg', multiplier: 0.9, target: 'enemy' }, { type: 'debuff', stat: 'atk', multiplier: 0.80, ticks: 4, target: 'enemy' }, { type: 'debuff', stat: 'def', multiplier: 0.80, ticks: 4, target: 'enemy' }] },
  { ...SHAMAN_BASE[1], id: 'hex_caster_skill', name: 'Grand Hex', desc: 'Hexes ALL enemies: ATK -35%, DEF -35%, SPD -20% for 5 turns.', manaCost: 30, effects: [{ type: 'debuff', stat: 'atk', multiplier: 0.65, ticks: 5, target: 'allEnemies' }, { type: 'debuff', stat: 'def', multiplier: 0.65, ticks: 5, target: 'allEnemies' }] },
  { ...SHAMAN_BASE[2], id: 'hex_caster_ult', name: 'Doom Hex', desc: 'All enemies suffer a permanent hex: all stats -40% for rest of combat.', effects: [{ type: 'dmgAll', multiplier: 1.5 }, { type: 'debuff', stat: 'atk', multiplier: 0.60, ticks: 99, target: 'allEnemies' }, { type: 'debuff', stat: 'def', multiplier: 0.60, ticks: 99, target: 'allEnemies' }] },
  { id: 'hex_caster_passive', slot: 'passive', icon: '🌀', name: 'Curse Amplifier', desc: 'Hexed enemies take 30% more damage from all sources.', effects: [{ type: 'passive_debuffAmp', value: 0.30 }, { type: 'passive_elemBoost', value: 0.12 }] },
]

const STONEGUARD_SKILLS = [
  { ...SHAMAN_BASE[0], id: 'stoneguard_basic', name: 'Stone Fist', desc: 'Deals 100% ATK and shields self for DEF×2 HP for 2 turns.', effects: [{ type: 'dmg', multiplier: 1.0, target: 'enemy' }, { type: 'shield', multiplier: 2.0, stat: 'def', ticks: 2, target: 'self' }] },
  { ...SHAMAN_BASE[1], id: 'stoneguard_skill', name: 'Stone Pillar', desc: 'Raises an earth pillar: taunts all enemies for 4 turns and shields all allies.', cooldownTurns: 4, effects: [{ type: 'shield', multiplier: 4.0, stat: 'def', ticks: 4, target: 'allAllies' }, { type: 'taunt', ticks: 4, target: 'self' }] },
  { ...SHAMAN_BASE[2], id: 'stoneguard_ult', name: 'Mountain\'s Embrace', desc: 'All allies receive massive stone shields for 8 turns and enemies are taunted.', effects: [{ type: 'shield', multiplier: 8.0, stat: 'def', ticks: 8, target: 'allAllies' }, { type: 'taunt', ticks: 5, target: 'self' }] },
  { id: 'stoneguard_passive', slot: 'passive', icon: '🧱', name: 'Earthen Resolve', desc: 'All ally shields absorb 25% more damage. Party takes 8% less damage.', effects: [{ type: 'passive_partyDmgReduce', value: 0.08 }, { type: 'passive_dmgReduce', value: 0.15 }] },
]

const LAVA_SHAMAN_SKILLS = [
  { ...SHAMAN_BASE[0], id: 'lava_shaman_basic', name: 'Magma Bolt', desc: 'Deals 110% ATK fire and creates a lava pool (40% ATK per turn to all for 3 turns).', effects: [{ type: 'dmg', multiplier: 1.1, target: 'enemy' }, { type: 'dot', value: 0.4, ticks: 3, target: 'allEnemies' }] },
  { ...SHAMAN_BASE[1], id: 'lava_shaman_skill', name: 'Eruption', desc: 'Deals 200% ATK AOE fire and creates a lava pool for 5 turns.', manaCost: 30, effects: [{ type: 'dmgAll', multiplier: 2.0 }, { type: 'dot', value: 0.5, ticks: 5, target: 'allEnemies' }] },
  { ...SHAMAN_BASE[2], id: 'lava_shaman_ult', name: 'Lava Surge', desc: 'Deals 350% ATK AOE and creates a massive lava field: 80% ATK per turn for 6 turns.', effects: [{ type: 'dmgAll', multiplier: 3.5 }, { type: 'dot', value: 0.8, ticks: 6, target: 'allEnemies' }] },
  { id: 'lava_shaman_passive', slot: 'passive', icon: '🌋', name: 'Lava Mastery', desc: 'Lava pools deal 30% more damage. All fire DoTs stack and intensify.', effects: [{ type: 'passive_dotAmp', value: 0.30 }, { type: 'passive_elemBoost', value: 0.15 }] },
]

const STORM_KING_SKILLS = [
  { ...THUNDER_GOD_SKILLS[0], id: 'storm_king_basic', name: 'King\'s Thunder', desc: 'Deals 140% ATK and chains to ALL enemies for 60% ATK each.', effects: [{ type: 'dmg', multiplier: 1.4, target: 'enemy' }, { type: 'dmgAll', multiplier: 0.6 }] },
  { ...THUNDER_GOD_SKILLS[1], id: 'storm_king_skill', name: 'Storm Surge', desc: 'Deals 300% ATK to all and stuns for 2 turns; storm lingers for 3 more ticks.', manaCost: 35, effects: [{ type: 'dmgAll', multiplier: 3.0 }, { type: 'stun', ticks: 2 }, { type: 'dot', value: 0.5, ticks: 3, target: 'allEnemies' }] },
  { ...THUNDER_GOD_SKILLS[2], id: 'storm_king_ult', name: 'Eternal Storm', desc: 'Strikes all enemies for 200% ATK every tick for 6 turns in a permanent tempest.', effects: [{ type: 'dmgAll', multiplier: 2.0, ticks: 6, isChanneled: true }] },
  { id: 'storm_king_passive', slot: 'passive', icon: '🌩️', name: 'Storm Eternal', desc: 'Every turn, all enemies automatically take 60% ATK lightning damage.', effects: [{ type: 'passive_chainLightning', value: 0.60, targets: 99 }, { type: 'passive_elemBoost', value: 0.20 }] },
]

const GRAND_HEXER_SKILLS = [
  { ...HEX_CASTER_SKILLS[0], id: 'grand_hexer_basic', name: 'Curse Bolt', desc: 'Deals 100% ATK and permanently reduces target\'s ATK by 10%.', effects: [{ type: 'dmg', multiplier: 1.0, target: 'enemy' }, { type: 'debuff', stat: 'atk', multiplier: 0.90, ticks: 99, target: 'enemy' }] },
  { ...HEX_CASTER_SKILLS[1], id: 'grand_hexer_skill', name: 'Seal of Doom', desc: 'Permanently hexes all stats -50% on one enemy.', manaCost: 35, effects: [{ type: 'debuff', stat: 'atk', multiplier: 0.50, ticks: 99, target: 'enemy' }, { type: 'debuff', stat: 'def', multiplier: 0.50, ticks: 99, target: 'enemy' }] },
  { ...HEX_CASTER_SKILLS[2], id: 'grand_hexer_ult', name: 'Cursed World', desc: 'All enemies are permanently hexed to take double damage from all sources.', effects: [{ type: 'dmgAll', multiplier: 2.0 }, { type: 'debuff', stat: 'atk', multiplier: 0.50, ticks: 99, target: 'allEnemies' }, { type: 'debuff', stat: 'def', multiplier: 0.50, ticks: 99, target: 'allEnemies' }] },
  { id: 'grand_hexer_passive', slot: 'passive', icon: '🔮', name: 'Doom\'s Touch', desc: 'Hexes are permanent. Hexed enemies take 50% more damage from all sources.', effects: [{ type: 'passive_debuffAmp', value: 0.50 }, { type: 'passive_elemBoost', value: 0.20 }] },
]

const EARTH_TITAN_SKILLS = [
  { ...STONEGUARD_SKILLS[0], id: 'earth_titan_basic', name: 'Titan\'s Fist', desc: 'Deals 130% ATK and reduces own incoming damage by 20% for 2 turns.', effects: [{ type: 'dmg', multiplier: 1.3, target: 'enemy' }, { type: 'buff', stat: 'defMult', multiplier: 0.80, ticks: 2, target: 'self' }] },
  { ...STONEGUARD_SKILLS[1], id: 'earth_titan_skill', name: 'Continental Crush', desc: 'Deals 300% ATK to all enemies and reduces party damage taken by 30% for 5 turns.', cooldownTurns: 4, effects: [{ type: 'dmgAll', multiplier: 3.0 }, { type: 'buffAll', stat: 'defMult', multiplier: 0.70, ticks: 5 }] },
  { ...STONEGUARD_SKILLS[2], id: 'earth_titan_ult', name: 'Atlas Stand', desc: 'Becomes immovable for 5 turns absorbing ALL party damage, then releases as counterattack.', effects: [{ type: 'shield', multiplier: 9999, ticks: 5, target: 'self' }, { type: 'taunt', ticks: 5, target: 'self' }, { type: 'reflect', value: 3.0, ticks: 5, target: 'self' }] },
  { id: 'earth_titan_passive', slot: 'passive', icon: '⛰️', name: 'Colossus Form', desc: 'Redirects 40% of party damage to self. Self takes 30% less damage.', effects: [{ type: 'passive_partyDmgRedirect', value: 0.40 }, { type: 'passive_dmgReduce', value: 0.30 }] },
]

const VOLCANO_LORD_SKILLS = [
  { ...LAVA_SHAMAN_SKILLS[0], id: 'volcano_lord_basic', name: 'Lava Lance', desc: 'Deals 130% ATK fire and the lava pool covers all enemies this tick (50% ATK each).', effects: [{ type: 'dmg', multiplier: 1.3, target: 'enemy' }, { type: 'dot', value: 0.5, ticks: 3, target: 'allEnemies' }] },
  { ...LAVA_SHAMAN_SKILLS[1], id: 'volcano_lord_skill', name: 'Volcanic Eruption', desc: 'Deals 400% ATK AOE fire and lava field burns for 8 turns.', manaCost: 35, effects: [{ type: 'dmgAll', multiplier: 4.0 }, { type: 'dot', value: 1.0, ticks: 8, target: 'allEnemies' }] },
  { ...LAVA_SHAMAN_SKILLS[2], id: 'volcano_lord_ult', name: 'Apocalyptic Eruption', desc: 'Deals 600% ATK AOE and permanent lava field burns all enemies for the rest of combat.', effects: [{ type: 'dmgAll', multiplier: 6.0 }, { type: 'dot', value: 1.5, ticks: 99, target: 'allEnemies' }] },
  { id: 'volcano_lord_passive', slot: 'passive', icon: '🌋', name: 'Volcanic Core', desc: 'All enemies passively burn for 60% ATK per turn. Lava field is always active.', effects: [{ type: 'passive_dotAmp', value: 0.50 }, { type: 'passive_elemBoost', value: 0.25 }] },
]

// ─── EXPORT MAP ──────────────────────────────────────────────────────────────
// Skills are keyed first by classId/jobId for easy lookup in combat.

export const SKILLS = {
  // Base classes
  warrior: WARRIOR_BASE,
  paladin: PALADIN_BASE,
  mage: MAGE_BASE,
  healer: HEALER_BASE,
  assassin: ASSASSIN_BASE,
  rogue: ROGUE_BASE,
  ranger: RANGER_BASE,
  shaman: SHAMAN_BASE,

  // Tier 1 jobs
  guardian: GUARDIAN_SKILLS,
  berserker: BERSERKER_SKILLS,
  elementalist: ELEMENTALIST_SKILLS,
  arcanist: ARCANIST_SKILLS,

  // Tier 1 jobs — unique skill slot
  templar: [
    PALADIN_BASE[0],
    { ...PALADIN_BASE[1], id: 'templar_skill', name: 'Holy Sword', icon: '⚔️', desc: 'Deals 200% ATK as holy damage and buffs own ATK by 15% for 3 turns.', cooldownTurns: 3, effects: [{ type: 'dmg', multiplier: 2.0, target: 'enemy' }, { type: 'buff', stat: 'atk', multiplier: 1.15, ticks: 3, target: 'self' }] },
    PALADIN_BASE[2],
    PALADIN_BASE[3],
  ],
  crusader: [
    PALADIN_BASE[0],
    { ...PALADIN_BASE[1], id: 'crusader_skill', name: 'Consecrate', icon: '✝️', desc: 'Heals all allies for 25% max HP and reduces incoming damage by 10% for 3 turns.', cooldownTurns: 4, effects: [{ type: 'healAll', value: 0.25, stat: 'maxHp' }, { type: 'buffAll', stat: 'defMult', multiplier: 0.90, ticks: 3 }] },
    PALADIN_BASE[2],
    PALADIN_BASE[3],
  ],
  priest: [
    HEALER_BASE[0],
    { ...HEALER_BASE[1], id: 'priest_skill', name: 'Greater Heal', icon: '💖', desc: 'Fully restores 60% max HP to the lowest HP ally.', manaCost: 25, effects: [{ type: 'heal', value: 0.60, stat: 'maxHp', target: 'lowestHpAlly' }] },
    HEALER_BASE[2],
    HEALER_BASE[3],
  ],
  druid: [
    HEALER_BASE[0],
    { ...HEALER_BASE[1], id: 'druid_skill', name: 'Rejuvenation', icon: '🌿', desc: 'Places a HoT on all allies, healing 8% max HP per turn for 4 turns.', manaCost: 35, effects: [{ type: 'dot', damageType: 'heal', value: 0.08, stat: 'maxHp', ticks: 4, target: 'allAllies' }] },
    HEALER_BASE[2],
    HEALER_BASE[3],
  ],
  shadow: [
    ASSASSIN_BASE[0],
    { ...ASSASSIN_BASE[1], id: 'shadow_skill', name: 'Shadow Step', icon: '🌑', desc: 'Teleports behind the enemy, dealing 220% ATK and stunning for 1 turn.', cooldownTurns: 2, effects: [{ type: 'dmg', multiplier: 2.2, target: 'enemy' }, { type: 'stun', ticks: 1, target: 'enemy' }] },
    ASSASSIN_BASE[2],
    ASSASSIN_BASE[3],
  ],
  duelist: [
    ASSASSIN_BASE[0],
    { ...ASSASSIN_BASE[1], id: 'duelist_skill', name: 'Riposte', icon: '🤺', desc: 'A precise counter-strike dealing 320% ATK. Ignores 30% of enemy DEF.', cooldownTurns: 3, effects: [{ type: 'dmg', multiplier: 3.2, target: 'enemy', defPierce: 0.30 }] },
    ASSASSIN_BASE[2],
    ASSASSIN_BASE[3],
  ],
  trickster: [
    ROGUE_BASE[0],
    { ...ROGUE_BASE[1], id: 'trickster_skill', name: 'Trick Shot', icon: '🃏', desc: 'Confuses the enemy, reducing their ATK by 30% and DEF by 20% for 4 turns.', cooldownTurns: 2, effects: [{ type: 'debuff', stat: 'atk', multiplier: 0.70, ticks: 4, target: 'enemy' }, { type: 'debuff', stat: 'def', multiplier: 0.80, ticks: 4, target: 'enemy' }] },
    ROGUE_BASE[2],
    ROGUE_BASE[3],
  ],
  blade_dancer: [
    ROGUE_BASE[0],
    { ...ROGUE_BASE[1], id: 'blade_dancer_skill', name: 'Blade Flurry', icon: '💃', desc: 'Spins through all enemies dealing 90% ATK 3 times.', cooldownTurns: 2, effects: [{ type: 'dmgAll', multiplier: 0.9, hits: 3 }] },
    ROGUE_BASE[2],
    ROGUE_BASE[3],
  ],
  sniper: [
    RANGER_BASE[0],
    { ...RANGER_BASE[1], id: 'sniper_skill', name: 'Aimed Shot', icon: '🎯', desc: 'A fully charged shot dealing 350% ATK with +30% crit rate.', cooldownTurns: 4, effects: [{ type: 'dmg', multiplier: 3.5, target: 'enemy', critBonus: 0.30 }] },
    RANGER_BASE[2],
    RANGER_BASE[3],
  ],
  beastmaster: [
    RANGER_BASE[0],
    { ...RANGER_BASE[1], id: 'beastmaster_skill', name: 'Beast Charge', icon: '🐺', desc: 'Sends your beast to charge the enemy, dealing 180% ATK to all enemies and stunning the main target.', cooldownTurns: 3, effects: [{ type: 'dmgAll', multiplier: 1.8 }, { type: 'stun', ticks: 1, target: 'enemy' }] },
    RANGER_BASE[2],
    RANGER_BASE[3],
  ],
  storm_caller: [
    SHAMAN_BASE[0],
    { ...SHAMAN_BASE[1], id: 'storm_caller_skill', name: 'Thunderclap', icon: '⛈️', desc: 'Slams the ground with lightning force, dealing 200% ATK to all enemies and stunning for 1 turn.', manaCost: 30, effects: [{ type: 'dmgAll', multiplier: 2.0 }, { type: 'stun', ticks: 1 }] },
    SHAMAN_BASE[2],
    SHAMAN_BASE[3],
  ],
  earth_warden: [
    SHAMAN_BASE[0],
    { ...SHAMAN_BASE[1], id: 'earth_warden_skill', name: 'Stone Shield', icon: '🪨', desc: 'Raises a stone barrier, shielding all allies for 5 turns. Taunts enemies to attack the warden.', cooldownTurns: 4, effects: [{ type: 'shield', multiplier: 3.0, stat: 'def', ticks: 5, target: 'allAllies' }, { type: 'taunt', ticks: 4, target: 'self' }] },
    SHAMAN_BASE[2],
    SHAMAN_BASE[3],
  ],

  // Warrior tier 2
  iron_fortress: IRON_FORTRESS_SKILLS,
  divine_shield: DIVINE_SHIELD_SKILLS,
  warlord: WARLORD_SKILLS,
  bloodrage: BLOODRAGE_SKILLS,
  // Warrior tier 3
  eternal_bulwark: ETERNAL_BULWARK_SKILLS,
  sacred_guardian: SACRED_GUARDIAN_SKILLS,
  conqueror: CONQUEROR_SKILLS,
  avatar_of_rage: AVATAR_OF_RAGE_SKILLS,

  // Paladin tier 2
  holy_knight: HOLY_KNIGHT_SKILLS,
  inquisitor: INQUISITOR_SKILLS,
  light_bringer: LIGHT_BRINGER_SKILLS,
  battle_chaplain: BATTLE_CHAPLAIN_SKILLS,
  // Paladin tier 3
  divine_avenger: DIVINE_AVENGER_SKILLS,
  grand_inquisitor: GRAND_INQUISITOR_SKILLS,
  herald_of_light: HERALD_OF_LIGHT_SKILLS,
  saintguard: SAINTGUARD_SKILLS,

  // Mage tier 2
  pyromancer: PYROMANCER_SKILLS,
  storm_mage: STORM_MAGE_SKILLS,
  archmage: ARCHMAGE_SKILLS,
  necromancer: NECROMANCER_SKILLS,
  // Mage tier 3
  inferno_lord: INFERNO_LORD_SKILLS,
  tempest_caller: TEMPEST_CALLER_SKILLS,
  arcane_sovereign: ARCANE_SOVEREIGN_SKILLS,
  lich: LICH_SKILLS,

  // Healer tier 2
  bishop: BISHOP_SKILLS,
  oracle: ORACLE_SKILLS,
  archdruid: ARCHDRUID_SKILLS,
  spiritwalker: SPIRITWALKER_SKILLS,
  // Healer tier 3
  arch_seraph: ARCH_SERAPH_SKILLS,
  seer: SEER_SKILLS,
  world_tree: WORLD_TREE_SKILLS,
  spirit_sovereign: SPIRIT_SOVEREIGN_SKILLS,

  // Assassin tier 2
  phantom: PHANTOM_SKILLS,
  night_blade: NIGHT_BLADE_SKILLS,
  sword_saint: SWORD_SAINT_SKILLS,
  death_dealer: DEATH_DEALER_SKILLS,
  // Assassin tier 3
  void_stalker: VOID_STALKER_SKILLS,
  shadow_emperor: SHADOW_EMPEROR_SKILLS,
  blade_god: BLADE_GOD_SKILLS,
  grim_reaper: GRIM_REAPER_SKILLS,

  // Rogue tier 2
  acrobat: ACROBAT_SKILLS,
  venomancer: VENOMANCER_SKILLS,
  storm_dancer: STORM_DANCER_SKILLS,
  crimson_blade: CRIMSON_BLADE_SKILLS,
  // Rogue tier 3
  wind_phantom: WIND_PHANTOM_SKILLS,
  plague_master: PLAGUE_MASTER_SKILLS,
  hurricane: HURRICANE_SKILLS,
  bloodletter: BLOODLETTER_SKILLS,

  // Ranger tier 2
  deadeye: DEADEYE_SKILLS,
  void_archer: VOID_ARCHER_SKILLS,
  alpha: ALPHA_SKILLS,
  wild_caller: WILD_CALLER_SKILLS,
  // Ranger tier 3
  true_sight: TRUE_SIGHT_SKILLS,
  rift_hunter: RIFT_HUNTER_SKILLS,
  primal_lord: PRIMAL_LORD_SKILLS,
  nature_sovereign: NATURE_SOVEREIGN_SKILLS,

  // Shaman tier 2
  thunder_god: THUNDER_GOD_SKILLS,
  hex_caster: HEX_CASTER_SKILLS,
  stoneguard: STONEGUARD_SKILLS,
  lava_shaman: LAVA_SHAMAN_SKILLS,
  // Shaman tier 3
  storm_king: STORM_KING_SKILLS,
  grand_hexer: GRAND_HEXER_SKILLS,
  earth_titan: EARTH_TITAN_SKILLS,
  volcano_lord: VOLCANO_LORD_SKILLS,
}

/**
 * Get the skill set for a hero based on their current job (or base class).
 * Falls back to the base class skills if the job has no custom skills yet.
 */
export function getSkillSet(classId, jobId) {
  if (jobId && SKILLS[jobId]) return SKILLS[jobId]
  return SKILLS[classId] ?? []
}

/**
 * Get a specific skill slot for a hero.
 * @param {string} classId
 * @param {string|null} jobId
 * @param {'basic'|'skill'|'ultimate'|'passive'} slot
 */
export function getSkill(classId, jobId, slot) {
  return getSkillSet(classId, jobId).find((s) => s.slot === slot) ?? null
}
