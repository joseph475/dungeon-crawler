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
 *   dot        – damage-over-time: amount per tick × ticks remaining
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
    desc: 'Deals 150% ATK and stuns the target for 1 tick.',
    cooldown: 6,
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
    desc: 'Rallies the entire party, boosting ATK by 25% for 5 ticks.',
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
  { ...WARRIOR_BASE[0], id: 'guardian_basic', name: 'Stalwart Strike', desc: 'Attacks and reduces incoming damage by 5% for 2 ticks.', effects: [{ type: 'dmg', multiplier: 1.0, target: 'enemy' }, { type: 'buff', stat: 'defMult', multiplier: 0.95, ticks: 2, target: 'self' }] },
  { ...WARRIOR_BASE[1], id: 'guardian_skill', name: 'Fortress Slam', desc: 'Deals 175% ATK, stuns 2 ticks, and taunts all enemies.', cooldown: 7, effects: [{ type: 'dmg', multiplier: 1.75, target: 'enemy' }, { type: 'stun', ticks: 2, target: 'enemy' }, { type: 'taunt', ticks: 4, target: 'self' }] },
  { ...WARRIOR_BASE[2], id: 'guardian_ult', name: 'Unbreakable', desc: 'Party gains damage immunity for 3 ticks. Warrior taunts for 5 ticks.', effects: [{ type: 'shield', multiplier: 9999, ticks: 3, target: 'allAllies' }, { type: 'taunt', ticks: 5, target: 'self' }] },
  { ...WARRIOR_BASE[3], id: 'guardian_passive', name: 'Guardian Aura', desc: 'Reduces all party damage taken by 8%.', effects: [{ type: 'passive_partyDmgReduce', value: 0.08 }] },
]

const BERSERKER_SKILLS = [
  { ...WARRIOR_BASE[0], id: 'berserker_basic', name: 'Reckless Swing', desc: 'Deals 120% ATK. Each consecutive hit adds 5% more damage (stacks to 50%).', effects: [{ type: 'dmg', multiplier: 1.2, target: 'enemy' }, { type: 'passive_comboStack', max: 10 }] },
  { ...WARRIOR_BASE[1], id: 'berserker_skill', name: 'Bloodthirst', desc: 'Deals 200% ATK and heals self for 30% of damage dealt.', cooldown: 5, effects: [{ type: 'dmg', multiplier: 2.0, target: 'enemy' }, { type: 'lifesteal', value: 0.30 }] },
  { ...WARRIOR_BASE[2], id: 'berserker_ult', name: 'Frenzy', desc: 'Enters a frenzy for 6 ticks: ATK +50%, SPD +30%, ignores DEF.', effects: [{ type: 'buff', stat: 'atk', multiplier: 1.5, ticks: 6, target: 'self' }, { type: 'buff', stat: 'spd', multiplier: 1.3, ticks: 6, target: 'self' }] },
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
    cooldown: 7,
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
    cooldown: 8,
    effects: [{ type: 'dmgAll', multiplier: 2.2 }],
  },
  {
    slot: 'ultimate', id: 'mage_ult', name: 'Meteor Storm', icon: '☄️',
    desc: 'Calls meteors for 4 ticks, each hitting all enemies for 180% ATK.',
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
  { ...MAGE_BASE[1], id: 'elem_skill', name: 'Elemental Burst', desc: 'Fires all 3 elements at once for 180% ATK each.', cooldown: 9, effects: [{ type: 'dmgAll', multiplier: 1.8 }, { type: 'dmgAll', multiplier: 1.8 }, { type: 'dmgAll', multiplier: 1.8 }] },
  { ...MAGE_BASE[2], id: 'elem_ult', name: 'Cataclysm', desc: 'All 3 elemental forces collide. 400% ATK AOE + all elemental debuffs.', effects: [{ type: 'dmgAll', multiplier: 4.0 }, { type: 'debuff', stat: 'def', multiplier: 0.7, ticks: 5 }] },
  { ...MAGE_BASE[3], id: 'elem_passive', name: 'Elemental Affinity', desc: 'Elemental debuffs increase damage taken by 20%.', effects: [{ type: 'passive_elemDebuffAmp', value: 0.20 }] },
]

const ARCANIST_SKILLS = [
  { ...MAGE_BASE[0], id: 'arcanist_basic', name: 'Arcane Lance', desc: '110% ATK. Generates bonus mana on each hit.', effects: [{ type: 'dmg', multiplier: 1.1, target: 'enemy' }, { type: 'gainMana', value: 8 }] },
  { ...MAGE_BASE[1], id: 'arcanist_skill', name: 'Arcane Surge', desc: '280% ATK single target. Costs extra mana but ignores DEF.', cooldown: 7, effects: [{ type: 'dmg', multiplier: 2.8, target: 'enemy', ignoresDef: true }] },
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
    cooldown: 7,
    effects: [{ type: 'healAll', value: 0.35, stat: 'maxHp' }],
  },
  {
    slot: 'ultimate', id: 'healer_ult', name: 'Resurrection', icon: '✨',
    desc: 'Revives all dead allies at 40% max HP and heals entire party for 50%.',
    effects: [{ type: 'reviveAll', value: 0.40 }, { type: 'healAll', value: 0.50, stat: 'maxHp' }],
  },
  {
    slot: 'passive', id: 'healer_passive', name: 'Blessed Aura', icon: '🌟',
    desc: 'Passively regenerates 2% max HP for all allies each tick.',
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
    cooldown: 6,
    effects: [{ type: 'dmg', multiplier: 2.8, target: 'enemy', critBonus: 0.25 }],
  },
  {
    slot: 'ultimate', id: 'assassin_ult', name: 'Death Mark', icon: '⚰️',
    desc: 'Marks a target. Next 4 hits against it deal 300% ATK. Vanish for 2 ticks.',
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
    desc: 'Reduces enemy accuracy by 40% for 3 ticks and grants self evasion +30%.',
    cooldown: 6,
    effects: [{ type: 'debuff', stat: 'accuracy', multiplier: 0.6, ticks: 3, target: 'enemy' }, { type: 'buff', stat: 'evasion', multiplier: 1.3, ticks: 3, target: 'self' }],
  },
  {
    slot: 'ultimate', id: 'rogue_ult', name: 'Fan of Blades', icon: '🌀',
    desc: 'Throws blades at all enemies 5 times for 80% ATK each.',
    effects: [{ type: 'dmgAll', multiplier: 0.8, hits: 5 }],
  },
  {
    slot: 'passive', id: 'rogue_passive', name: 'Evasive Instincts', icon: '🌬️',
    desc: 'Base evasion chance of 15%. Dodging grants +10% ATK for 2 ticks.',
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
    cooldown: 7,
    effects: [{ type: 'dmgAll', multiplier: 1.1 }],
  },
  {
    slot: 'ultimate', id: 'ranger_ult', name: 'Rain of Arrows', icon: '🌂',
    desc: 'Bombards all enemies with arrows for 5 ticks, each for 120% ATK.',
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
    cooldown: 7,
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
    { ...PALADIN_BASE[1], id: 'templar_skill', name: 'Holy Sword', icon: '⚔️', desc: 'Deals 200% ATK as holy damage and buffs own ATK by 15% for 3 ticks.', cooldown: 6, effects: [{ type: 'dmg', multiplier: 2.0, target: 'enemy' }, { type: 'buff', stat: 'atk', multiplier: 1.15, ticks: 3, target: 'self' }] },
    PALADIN_BASE[2],
    PALADIN_BASE[3],
  ],
  crusader: [
    PALADIN_BASE[0],
    { ...PALADIN_BASE[1], id: 'crusader_skill', name: 'Consecrate', icon: '✝️', desc: 'Heals all allies for 25% max HP and reduces incoming damage by 10% for 3 ticks.', cooldown: 8, effects: [{ type: 'healAll', value: 0.25, stat: 'maxHp' }, { type: 'buffAll', stat: 'defMult', multiplier: 0.90, ticks: 3 }] },
    PALADIN_BASE[2],
    PALADIN_BASE[3],
  ],
  priest: [
    HEALER_BASE[0],
    { ...HEALER_BASE[1], id: 'priest_skill', name: 'Greater Heal', icon: '💖', desc: 'Fully restores 60% max HP to the lowest HP ally.', cooldown: 6, effects: [{ type: 'heal', value: 0.60, stat: 'maxHp', target: 'lowestHpAlly' }] },
    HEALER_BASE[2],
    HEALER_BASE[3],
  ],
  druid: [
    HEALER_BASE[0],
    { ...HEALER_BASE[1], id: 'druid_skill', name: 'Rejuvenation', icon: '🌿', desc: 'Places a HoT on all allies, healing 8% max HP per tick for 4 ticks.', cooldown: 7, effects: [{ type: 'dot', damageType: 'heal', value: 0.08, stat: 'maxHp', ticks: 4, target: 'allAllies' }] },
    HEALER_BASE[2],
    HEALER_BASE[3],
  ],
  shadow: [
    ASSASSIN_BASE[0],
    { ...ASSASSIN_BASE[1], id: 'shadow_skill', name: 'Shadow Step', icon: '🌑', desc: 'Teleports behind the enemy, dealing 220% ATK and stunning for 1 tick.', cooldown: 5, effects: [{ type: 'dmg', multiplier: 2.2, target: 'enemy' }, { type: 'stun', ticks: 1, target: 'enemy' }] },
    ASSASSIN_BASE[2],
    ASSASSIN_BASE[3],
  ],
  duelist: [
    ASSASSIN_BASE[0],
    { ...ASSASSIN_BASE[1], id: 'duelist_skill', name: 'Riposte', icon: '🤺', desc: 'A precise counter-strike dealing 320% ATK. Ignores 30% of enemy DEF.', cooldown: 6, effects: [{ type: 'dmg', multiplier: 3.2, target: 'enemy', defPierce: 0.30 }] },
    ASSASSIN_BASE[2],
    ASSASSIN_BASE[3],
  ],
  trickster: [
    ROGUE_BASE[0],
    { ...ROGUE_BASE[1], id: 'trickster_skill', name: 'Trick Shot', icon: '🃏', desc: 'Confuses the enemy, reducing their ATK by 30% and DEF by 20% for 4 ticks.', cooldown: 6, effects: [{ type: 'debuff', stat: 'atk', multiplier: 0.70, ticks: 4, target: 'enemy' }, { type: 'debuff', stat: 'def', multiplier: 0.80, ticks: 4, target: 'enemy' }] },
    ROGUE_BASE[2],
    ROGUE_BASE[3],
  ],
  blade_dancer: [
    ROGUE_BASE[0],
    { ...ROGUE_BASE[1], id: 'blade_dancer_skill', name: 'Blade Flurry', icon: '💃', desc: 'Spins through all enemies dealing 90% ATK 3 times.', cooldown: 6, effects: [{ type: 'dmgAll', multiplier: 0.9, hits: 3 }] },
    ROGUE_BASE[2],
    ROGUE_BASE[3],
  ],
  sniper: [
    RANGER_BASE[0],
    { ...RANGER_BASE[1], id: 'sniper_skill', name: 'Aimed Shot', icon: '🎯', desc: 'A fully charged shot dealing 350% ATK with +30% crit rate.', cooldown: 8, effects: [{ type: 'dmg', multiplier: 3.5, target: 'enemy', critBonus: 0.30 }] },
    RANGER_BASE[2],
    RANGER_BASE[3],
  ],
  beastmaster: [
    RANGER_BASE[0],
    { ...RANGER_BASE[1], id: 'beastmaster_skill', name: 'Beast Charge', icon: '🐺', desc: 'Sends your beast to charge the enemy, dealing 180% ATK to all enemies and stunning the main target.', cooldown: 7, effects: [{ type: 'dmgAll', multiplier: 1.8 }, { type: 'stun', ticks: 1, target: 'enemy' }] },
    RANGER_BASE[2],
    RANGER_BASE[3],
  ],
  storm_caller: [
    SHAMAN_BASE[0],
    { ...SHAMAN_BASE[1], id: 'storm_caller_skill', name: 'Thunderclap', icon: '⛈️', desc: 'Slams the ground with lightning force, dealing 200% ATK to all enemies and stunning for 1 tick.', cooldown: 7, effects: [{ type: 'dmgAll', multiplier: 2.0 }, { type: 'stun', ticks: 1 }] },
    SHAMAN_BASE[2],
    SHAMAN_BASE[3],
  ],
  earth_warden: [
    SHAMAN_BASE[0],
    { ...SHAMAN_BASE[1], id: 'earth_warden_skill', name: 'Stone Shield', icon: '🪨', desc: 'Raises a stone barrier, shielding all allies for 5 ticks. Taunts enemies to attack the warden.', cooldown: 8, effects: [{ type: 'shield', multiplier: 3.0, stat: 'def', ticks: 5, target: 'allAllies' }, { type: 'taunt', ticks: 4, target: 'self' }] },
    SHAMAN_BASE[2],
    SHAMAN_BASE[3],
  ],
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
