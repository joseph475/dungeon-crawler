/**
 * Full 3-tier job advancement tree.
 * Advancement thresholds: Tier 1 = level 20, Tier 2 = level 50, Tier 3 = level 100
 *
 * Each job entry defines:
 *   - id, name, icon, description
 *   - tier: 1 | 2 | 3
 *   - baseClass: the original class this path belongs to
 *   - parent: the job id required before this one (null for tier 1)
 *   - statBonus: flat bonuses added on top of class growth when job is taken
 */

export const JOB_ADVANCEMENT_LEVELS = { 1: 20, 2: 50, 3: 100 }

export const JOBS = {
  // ─── WARRIOR ────────────────────────────────────────────────────────────────
  guardian: {
    id: 'guardian', name: 'Guardian', icon: '🛡️', tier: 1, baseClass: 'warrior',
    parent: null,
    description: 'Masters the art of defense. Becomes an immovable shield for the party.',
    statBonus: { hp: 80, def: 10 },
  },
  berserker: {
    id: 'berserker', name: 'Berserker', icon: '🪓', tier: 1, baseClass: 'warrior',
    parent: null,
    description: 'Sacrifices defense for raw offensive power and lifesteal.',
    statBonus: { atk: 12, crit: 0.05 },
  },
  iron_fortress: {
    id: 'iron_fortress', name: 'Iron Fortress', icon: '⚙️', tier: 2, baseClass: 'warrior',
    parent: 'guardian',
    description: 'Becomes nearly unkillable. Reflects a portion of damage received.',
    statBonus: { hp: 150, def: 25 },
  },
  divine_shield: {
    id: 'divine_shield', name: 'Divine Shield', icon: '✨', tier: 2, baseClass: 'warrior',
    parent: 'guardian',
    description: 'Channels holy energy to protect allies with shielding auras.',
    statBonus: { hp: 100, def: 15, mana: 30 },
  },
  warlord: {
    id: 'warlord', name: 'Warlord', icon: '⚔️', tier: 2, baseClass: 'warrior',
    parent: 'berserker',
    description: 'Commands the battlefield. Empowers all party members with battle cries.',
    statBonus: { atk: 20, spd: 2 },
  },
  bloodrage: {
    id: 'bloodrage', name: 'Bloodrage', icon: '🩸', tier: 2, baseClass: 'warrior',
    parent: 'berserker',
    description: 'Grows stronger as HP drops. Enrages at 30% HP for devastating damage.',
    statBonus: { atk: 25, crit: 0.08, critDmg: 0.3 },
  },
  eternal_bulwark: {
    id: 'eternal_bulwark', name: 'Eternal Bulwark', icon: '🏰', tier: 3, baseClass: 'warrior',
    parent: 'iron_fortress',
    description: 'LEGENDARY. An indestructible wall. Absorbs party damage when below 50% HP.',
    statBonus: { hp: 300, def: 50 },
  },
  sacred_guardian: {
    id: 'sacred_guardian', name: 'Sacred Guardian', icon: '⚜️', tier: 3, baseClass: 'warrior',
    parent: 'divine_shield',
    description: 'LEGENDARY. Radiates divine auras that protect and empower all allies.',
    statBonus: { hp: 200, def: 35, mana: 60 },
  },
  conqueror: {
    id: 'conqueror', name: 'Conqueror', icon: '👑', tier: 3, baseClass: 'warrior',
    parent: 'warlord',
    description: 'LEGENDARY. Every kill permanently increases ATK for the rest of combat.',
    statBonus: { atk: 45, spd: 4, crit: 0.05 },
  },
  avatar_of_rage: {
    id: 'avatar_of_rage', name: 'Avatar of Rage', icon: '🔥', tier: 3, baseClass: 'warrior',
    parent: 'bloodrage',
    description: 'LEGENDARY. Permanently enraged. ATK scales inversely with HP.',
    statBonus: { atk: 55, crit: 0.12, critDmg: 0.5 },
  },

  // ─── PALADIN ────────────────────────────────────────────────────────────────
  templar: {
    id: 'templar', name: 'Templar', icon: '⚔️', tier: 1, baseClass: 'paladin',
    parent: null,
    description: 'A holy warrior. Balances offensive holy power with defensive duties.',
    statBonus: { atk: 8, def: 8 },
  },
  crusader: {
    id: 'crusader', name: 'Crusader', icon: '✝️', tier: 1, baseClass: 'paladin',
    parent: null,
    description: 'Devoted healer and protector. Enhances party survivability.',
    statBonus: { hp: 60, mana: 40 },
  },
  holy_knight: {
    id: 'holy_knight', name: 'Holy Knight', icon: '🌟', tier: 2, baseClass: 'paladin',
    parent: 'templar',
    description: 'Channels divine smite through attacks. Burns enemies with holy fire.',
    statBonus: { atk: 18, crit: 0.06, mana: 20 },
  },
  inquisitor: {
    id: 'inquisitor', name: 'Inquisitor', icon: '⚖️', tier: 2, baseClass: 'paladin',
    parent: 'templar',
    description: 'Hunts evil relentlessly. Deals bonus damage to bosses and elites.',
    statBonus: { atk: 22, def: 8 },
  },
  light_bringer: {
    id: 'light_bringer', name: 'Light Bringer', icon: '💛', tier: 2, baseClass: 'paladin',
    parent: 'crusader',
    description: 'Fills the battlefield with healing light. Passive party regeneration.',
    statBonus: { hp: 80, mana: 60 },
  },
  battle_chaplain: {
    id: 'battle_chaplain', name: 'Battle Chaplain', icon: '📿', tier: 2, baseClass: 'paladin',
    parent: 'crusader',
    description: 'Resurrects fallen allies with bonus HP. Converts mana to shields.',
    statBonus: { hp: 60, def: 12, mana: 50 },
  },
  divine_avenger: {
    id: 'divine_avenger', name: 'Divine Avenger', icon: '☀️', tier: 3, baseClass: 'paladin',
    parent: 'holy_knight',
    description: 'LEGENDARY. Holy smite deals AOE damage. Party gains divine protection.',
    statBonus: { atk: 40, crit: 0.10, mana: 40 },
  },
  grand_inquisitor: {
    id: 'grand_inquisitor', name: 'Grand Inquisitor', icon: '🔱', tier: 3, baseClass: 'paladin',
    parent: 'inquisitor',
    description: 'LEGENDARY. Boss damage tripled. Seals enemy abilities on hit.',
    statBonus: { atk: 50, def: 20 },
  },
  herald_of_light: {
    id: 'herald_of_light', name: 'Herald of Light', icon: '🕊️', tier: 3, baseClass: 'paladin',
    parent: 'light_bringer',
    description: 'LEGENDARY. Passive aura heals all allies every tick. Immune to death once.',
    statBonus: { hp: 160, mana: 100 },
  },
  saintguard: {
    id: 'saintguard', name: 'Saintguard', icon: '🛡️', tier: 3, baseClass: 'paladin',
    parent: 'battle_chaplain',
    description: 'LEGENDARY. Auto-revives two allies per combat. Shields scale with mana.',
    statBonus: { hp: 120, def: 28, mana: 80 },
  },

  // ─── MAGE ───────────────────────────────────────────────────────────────────
  elementalist: {
    id: 'elementalist', name: 'Elementalist', icon: '🌊', tier: 1, baseClass: 'mage',
    parent: null,
    description: 'Commands all elements. Cycles through fire, frost, and lightning attacks.',
    statBonus: { atk: 14, mana: 30 },
  },
  arcanist: {
    id: 'arcanist', name: 'Arcanist', icon: '🌀', tier: 1, baseClass: 'mage',
    parent: null,
    description: 'Pure arcane power. Massive burst damage with high mana costs.',
    statBonus: { atk: 18, crit: 0.04, critDmg: 0.2 },
  },
  pyromancer: {
    id: 'pyromancer', name: 'Pyromancer', icon: '🔥', tier: 2, baseClass: 'mage',
    parent: 'elementalist',
    description: 'Masters fire. Applies burn DoT stacks that deal scaling damage.',
    statBonus: { atk: 25, crit: 0.05 },
  },
  storm_mage: {
    id: 'storm_mage', name: 'Storm Mage', icon: '⚡', tier: 2, baseClass: 'mage',
    parent: 'elementalist',
    description: 'Chains lightning between enemies. Stuns with overcharge.',
    statBonus: { atk: 20, spd: 2, mana: 20 },
  },
  archmage: {
    id: 'archmage', name: 'Archmage', icon: '🔮', tier: 2, baseClass: 'mage',
    parent: 'arcanist',
    description: 'Supreme magical knowledge. Reduces all skill cooldowns significantly.',
    statBonus: { atk: 28, mana: 50 },
  },
  necromancer: {
    id: 'necromancer', name: 'Necromancer', icon: '💀', tier: 2, baseClass: 'mage',
    parent: 'arcanist',
    description: 'Raises slain enemies as undead minions to fight alongside the party.',
    statBonus: { atk: 22, hp: 40, mana: 40 },
  },
  inferno_lord: {
    id: 'inferno_lord', name: 'Inferno Lord', icon: '🌋', tier: 3, baseClass: 'mage',
    parent: 'pyromancer',
    description: 'LEGENDARY. Entire battlefield becomes a burning inferno. Burn stacks explode.',
    statBonus: { atk: 55, crit: 0.10 },
  },
  tempest_caller: {
    id: 'tempest_caller', name: 'Tempest Caller', icon: '🌪️', tier: 3, baseClass: 'mage',
    parent: 'storm_mage',
    description: 'LEGENDARY. Summons a permanent storm. Every enemy hit has chain potential.',
    statBonus: { atk: 48, spd: 4, mana: 40 },
  },
  arcane_sovereign: {
    id: 'arcane_sovereign', name: 'Arcane Sovereign', icon: '💠', tier: 3, baseClass: 'mage',
    parent: 'archmage',
    description: 'LEGENDARY. All spells cost half mana. ULT fires twice per charge.',
    statBonus: { atk: 60, mana: 80, crit: 0.08 },
  },
  lich: {
    id: 'lich', name: 'Lich', icon: '☠️', tier: 3, baseClass: 'mage',
    parent: 'necromancer',
    description: 'LEGENDARY. Undying. Revives once per combat. Minion army grows each stage.',
    statBonus: { atk: 50, hp: 80, mana: 70 },
  },

  // ─── HEALER ─────────────────────────────────────────────────────────────────
  priest: {
    id: 'priest', name: 'Priest', icon: '✝️', tier: 1, baseClass: 'healer',
    parent: null,
    description: 'Holy healer. Strong single-target heals and resurrection.',
    statBonus: { hp: 40, mana: 50 },
  },
  druid: {
    id: 'druid', name: 'Druid', icon: '🌿', tier: 1, baseClass: 'healer',
    parent: null,
    description: 'Nature healing. Applies HoTs and nature buffs to party.',
    statBonus: { hp: 30, def: 5, mana: 40 },
  },
  bishop: {
    id: 'bishop', name: 'Bishop', icon: '👑', tier: 2, baseClass: 'healer',
    parent: 'priest',
    description: 'Channels mass heals that restore the whole party at once.',
    statBonus: { hp: 60, mana: 70 },
  },
  oracle: {
    id: 'oracle', name: 'Oracle', icon: '🔮', tier: 2, baseClass: 'healer',
    parent: 'priest',
    description: 'Predicts and negates lethal blows. Grants temporary invulnerability.',
    statBonus: { hp: 50, mana: 60, spd: 1 },
  },
  archdruid: {
    id: 'archdruid', name: 'Archdruid', icon: '🌳', tier: 2, baseClass: 'healer',
    parent: 'druid',
    description: 'Nature\'s guardian. Strong HoTs and powerful nature damage hybrid.',
    statBonus: { hp: 50, atk: 8, mana: 40 },
  },
  spiritwalker: {
    id: 'spiritwalker', name: 'Spiritwalker', icon: '🌀', tier: 2, baseClass: 'healer',
    parent: 'druid',
    description: 'Walks between worlds. Spirits follow and heal party members passively.',
    statBonus: { hp: 40, def: 8, mana: 50 },
  },
  arch_seraph: {
    id: 'arch_seraph', name: 'Arch Seraph', icon: '😇', tier: 3, baseClass: 'healer',
    parent: 'bishop',
    description: 'LEGENDARY. Heals overflow into shields. Party cannot die while mana > 0.',
    statBonus: { hp: 120, mana: 130 },
  },
  seer: {
    id: 'seer', name: 'Seer', icon: '👁️', tier: 3, baseClass: 'healer',
    parent: 'oracle',
    description: 'LEGENDARY. Sees all incoming damage. 50% chance to negate any fatal hit.',
    statBonus: { hp: 100, mana: 110, spd: 2 },
  },
  world_tree: {
    id: 'world_tree', name: 'World Tree', icon: '🌲', tier: 3, baseClass: 'healer',
    parent: 'archdruid',
    description: 'LEGENDARY. Roots extend everywhere. Party regenerates massive HP each tick.',
    statBonus: { hp: 150, atk: 15, mana: 70 },
  },
  spirit_sovereign: {
    id: 'spirit_sovereign', name: 'Spirit Sovereign', icon: '👻', tier: 3, baseClass: 'healer',
    parent: 'spiritwalker',
    description: 'LEGENDARY. Summons a spirit army that heals based on damage dealt.',
    statBonus: { hp: 110, def: 18, mana: 90 },
  },

  // ─── ASSASSIN ───────────────────────────────────────────────────────────────
  shadow: {
    id: 'shadow', name: 'Shadow', icon: '🌑', tier: 1, baseClass: 'assassin',
    parent: null,
    description: 'Strikes from darkness. High evasion and first-strike advantage.',
    statBonus: { atk: 10, crit: 0.08, spd: 2 },
  },
  duelist: {
    id: 'duelist', name: 'Duelist', icon: '🤺', tier: 1, baseClass: 'assassin',
    parent: null,
    description: 'One-on-one expert. Massive bonus damage when targeting isolated enemies.',
    statBonus: { atk: 14, critDmg: 0.3 },
  },
  phantom: {
    id: 'phantom', name: 'Phantom', icon: '👤', tier: 2, baseClass: 'assassin',
    parent: 'shadow',
    description: 'Becomes intangible. Can phase through hits and deliver phantom strikes.',
    statBonus: { atk: 20, crit: 0.10, spd: 3 },
  },
  night_blade: {
    id: 'night_blade', name: 'Night Blade', icon: '🌙', tier: 2, baseClass: 'assassin',
    parent: 'shadow',
    description: 'Darkness empowers each attack. Stacks shadow charges for a burst.',
    statBonus: { atk: 24, crit: 0.08, critDmg: 0.2 },
  },
  sword_saint: {
    id: 'sword_saint', name: 'Sword Saint', icon: '🗡️', tier: 2, baseClass: 'assassin',
    parent: 'duelist',
    description: 'Perfect blade technique. Each successful hit increases ATK temporarily.',
    statBonus: { atk: 28, critDmg: 0.4 },
  },
  death_dealer: {
    id: 'death_dealer', name: 'Death Dealer', icon: '💀', tier: 2, baseClass: 'assassin',
    parent: 'duelist',
    description: 'Executes enemies below 20% HP instantly. Resets cooldowns on kill.',
    statBonus: { atk: 22, crit: 0.06, critDmg: 0.35 },
  },
  void_stalker: {
    id: 'void_stalker', name: 'Void Stalker', icon: '🕳️', tier: 3, baseClass: 'assassin',
    parent: 'phantom',
    description: 'LEGENDARY. Exists between dimensions. Untargetable 30% of the time.',
    statBonus: { atk: 45, crit: 0.15, spd: 5 },
  },
  shadow_emperor: {
    id: 'shadow_emperor', name: 'Shadow Emperor', icon: '🌑', tier: 3, baseClass: 'assassin',
    parent: 'night_blade',
    description: 'LEGENDARY. Shadow charges never decay. Final burst deals 10x damage.',
    statBonus: { atk: 50, crit: 0.12, critDmg: 0.4 },
  },
  blade_god: {
    id: 'blade_god', name: 'Blade God', icon: '⚔️', tier: 3, baseClass: 'assassin',
    parent: 'sword_saint',
    description: 'LEGENDARY. ATK stacks permanently each kill. Untouchable swordsmanship.',
    statBonus: { atk: 60, critDmg: 0.6 },
  },
  grim_reaper: {
    id: 'grim_reaper', name: 'Grim Reaper', icon: '💀', tier: 3, baseClass: 'assassin',
    parent: 'death_dealer',
    description: 'LEGENDARY. Execute threshold rises to 35%. Scythe sweeps all enemies on kill.',
    statBonus: { atk: 52, crit: 0.10, critDmg: 0.5 },
  },

  // ─── ROGUE ──────────────────────────────────────────────────────────────────
  trickster: {
    id: 'trickster', name: 'Trickster', icon: '🃏', tier: 1, baseClass: 'rogue',
    parent: null,
    description: 'Deceives enemies. High evasion and debuff application.',
    statBonus: { spd: 3, crit: 0.06 },
  },
  blade_dancer: {
    id: 'blade_dancer', name: 'Blade Dancer', icon: '💃', tier: 1, baseClass: 'rogue',
    parent: null,
    description: 'Graceful whirlwind of blades. Hits all enemies with multi-hit combos.',
    statBonus: { atk: 8, spd: 2, crit: 0.04 },
  },
  acrobat: {
    id: 'acrobat', name: 'Acrobat', icon: '🎪', tier: 2, baseClass: 'rogue',
    parent: 'trickster',
    description: 'Maximum agility. Near-unhittable. Counters on dodge.',
    statBonus: { spd: 5, crit: 0.08, def: 4 },
  },
  venomancer: {
    id: 'venomancer', name: 'Venomancer', icon: '🐍', tier: 2, baseClass: 'rogue',
    parent: 'trickster',
    description: 'Poisons all attacks. Venom DoTs stack and accelerate.',
    statBonus: { atk: 14, spd: 3 },
  },
  storm_dancer: {
    id: 'storm_dancer', name: 'Storm Dancer', icon: '🌀', tier: 2, baseClass: 'rogue',
    parent: 'blade_dancer',
    description: 'Tornado of blades. Hit count per spin increases with each combo.',
    statBonus: { atk: 16, spd: 3, crit: 0.05 },
  },
  crimson_blade: {
    id: 'crimson_blade', name: 'Crimson Blade', icon: '🔴', tier: 2, baseClass: 'rogue',
    parent: 'blade_dancer',
    description: 'Each cut bleeds the enemy. Bleed stacks amplify all subsequent damage.',
    statBonus: { atk: 18, crit: 0.06, critDmg: 0.2 },
  },
  wind_phantom: {
    id: 'wind_phantom', name: 'Wind Phantom', icon: '💨', tier: 3, baseClass: 'rogue',
    parent: 'acrobat',
    description: 'LEGENDARY. Moves faster than sight. Dodge becomes a damaging counter.',
    statBonus: { spd: 10, crit: 0.12, def: 8 },
  },
  plague_master: {
    id: 'plague_master', name: 'Plague Master', icon: '☣️', tier: 3, baseClass: 'rogue',
    parent: 'venomancer',
    description: 'LEGENDARY. Venom spreads between enemies. Entire field is poisoned.',
    statBonus: { atk: 35, spd: 5 },
  },
  hurricane: {
    id: 'hurricane', name: 'Hurricane', icon: '🌪️', tier: 3, baseClass: 'rogue',
    parent: 'storm_dancer',
    description: 'LEGENDARY. Infinite spin combo. Can hit hundreds of times per cycle.',
    statBonus: { atk: 40, spd: 7, crit: 0.08 },
  },
  bloodletter: {
    id: 'bloodletter', name: 'Bloodletter', icon: '🩸', tier: 3, baseClass: 'rogue',
    parent: 'crimson_blade',
    description: 'LEGENDARY. Bleed stacks permanently. Enemies melt from a thousand cuts.',
    statBonus: { atk: 45, crit: 0.10, critDmg: 0.35 },
  },

  // ─── RANGER ─────────────────────────────────────────────────────────────────
  sniper: {
    id: 'sniper', name: 'Sniper', icon: '🎯', tier: 1, baseClass: 'ranger',
    parent: null,
    description: 'Precision shooting. Massive single-shot damage from distance.',
    statBonus: { atk: 12, crit: 0.07, critDmg: 0.2 },
  },
  beastmaster: {
    id: 'beastmaster', name: 'Beastmaster', icon: '🐺', tier: 1, baseClass: 'ranger',
    parent: null,
    description: 'Commands a loyal beast companion to fight alongside them.',
    statBonus: { atk: 8, hp: 40, spd: 1 },
  },
  deadeye: {
    id: 'deadeye', name: 'Deadeye', icon: '👁️', tier: 2, baseClass: 'ranger',
    parent: 'sniper',
    description: 'Never misses. Crits ignore a large portion of enemy DEF.',
    statBonus: { atk: 22, crit: 0.09, critDmg: 0.3 },
  },
  void_archer: {
    id: 'void_archer', name: 'Void Archer', icon: '🌑', tier: 2, baseClass: 'ranger',
    parent: 'sniper',
    description: 'Void-tipped arrows pierce enemies and strike those behind.',
    statBonus: { atk: 25, crit: 0.06 },
  },
  alpha: {
    id: 'alpha', name: 'Alpha', icon: '🦁', tier: 2, baseClass: 'ranger',
    parent: 'beastmaster',
    description: 'Leads a pack. Multiple beast companions fight together.',
    statBonus: { atk: 15, hp: 60, spd: 2 },
  },
  wild_caller: {
    id: 'wild_caller', name: 'Wild Caller', icon: '🌿', tier: 2, baseClass: 'ranger',
    parent: 'beastmaster',
    description: 'Summons nature spirits alongside beasts. Nature damage bonus.',
    statBonus: { atk: 14, hp: 50, mana: 30 },
  },
  true_sight: {
    id: 'true_sight', name: 'True Sight', icon: '🔭', tier: 3, baseClass: 'ranger',
    parent: 'deadeye',
    description: 'LEGENDARY. Perfect aim. Every 5th shot is a guaranteed critical headshot.',
    statBonus: { atk: 50, crit: 0.12, critDmg: 0.5 },
  },
  rift_hunter: {
    id: 'rift_hunter', name: 'Rift Hunter', icon: '🕳️', tier: 3, baseClass: 'ranger',
    parent: 'void_archer',
    description: 'LEGENDARY. Void arrows create rifts that pull in nearby enemies.',
    statBonus: { atk: 55, crit: 0.08 },
  },
  primal_lord: {
    id: 'primal_lord', name: 'Primal Lord', icon: '🦅', tier: 3, baseClass: 'ranger',
    parent: 'alpha',
    description: 'LEGENDARY. Commands an entire army of beasts. Pack overwhelms enemies.',
    statBonus: { atk: 40, hp: 120, spd: 4 },
  },
  nature_sovereign: {
    id: 'nature_sovereign', name: 'Nature Sovereign', icon: '🌍', tier: 3, baseClass: 'ranger',
    parent: 'wild_caller',
    description: 'LEGENDARY. Nature itself fights. Earth rises, roots bind, storms strike.',
    statBonus: { atk: 45, hp: 100, mana: 60 },
  },

  // ─── SHAMAN ─────────────────────────────────────────────────────────────────
  storm_caller: {
    id: 'storm_caller', name: 'Storm Caller', icon: '⛈️', tier: 1, baseClass: 'shaman',
    parent: null,
    description: 'Calls down lightning and storm magic on enemies.',
    statBonus: { atk: 12, spd: 1, mana: 20 },
  },
  earth_warden: {
    id: 'earth_warden', name: 'Earth Warden', icon: '🪨', tier: 1, baseClass: 'shaman',
    parent: null,
    description: 'Commands stone and earth to protect and harm.',
    statBonus: { hp: 50, def: 8, mana: 15 },
  },
  thunder_god: {
    id: 'thunder_god', name: 'Thunder God', icon: '⚡', tier: 2, baseClass: 'shaman',
    parent: 'storm_caller',
    description: 'Becomes the storm itself. Constant chain lightning on every attack.',
    statBonus: { atk: 22, spd: 2, mana: 30 },
  },
  hex_caster: {
    id: 'hex_caster', name: 'Hex Caster', icon: '🌀', tier: 2, baseClass: 'shaman',
    parent: 'storm_caller',
    description: 'Curses enemies with hexes that reduce all their stats drastically.',
    statBonus: { atk: 18, mana: 40 },
  },
  stoneguard: {
    id: 'stoneguard', name: 'Stoneguard', icon: '🧱', tier: 2, baseClass: 'shaman',
    parent: 'earth_warden',
    description: 'Wraps allies in stone shields. Earth pillars taunt enemies.',
    statBonus: { hp: 80, def: 16 },
  },
  lava_shaman: {
    id: 'lava_shaman', name: 'Lava Shaman', icon: '🌋', tier: 2, baseClass: 'shaman',
    parent: 'earth_warden',
    description: 'Erupts the ground beneath enemies. Lava pools deal ongoing fire damage.',
    statBonus: { atk: 20, hp: 40, mana: 25 },
  },
  storm_king: {
    id: 'storm_king', name: 'Storm King', icon: '🌩️', tier: 3, baseClass: 'shaman',
    parent: 'thunder_god',
    description: 'LEGENDARY. Lightning strikes every enemy every tick. Storm lasts forever.',
    statBonus: { atk: 50, spd: 4, mana: 60 },
  },
  grand_hexer: {
    id: 'grand_hexer', name: 'Grand Hexer', icon: '🔮', tier: 3, baseClass: 'shaman',
    parent: 'hex_caster',
    description: 'LEGENDARY. Hexes become permanent. Cursed enemies take double damage.',
    statBonus: { atk: 45, mana: 80 },
  },
  earth_titan: {
    id: 'earth_titan', name: 'Earth Titan', icon: '⛰️', tier: 3, baseClass: 'shaman',
    parent: 'stoneguard',
    description: 'LEGENDARY. Becomes a colossus of stone. Absorbs all party damage above 50%.',
    statBonus: { hp: 200, def: 40 },
  },
  volcano_lord: {
    id: 'volcano_lord', name: 'Volcano Lord', icon: '🌋', tier: 3, baseClass: 'shaman',
    parent: 'lava_shaman',
    description: 'LEGENDARY. Erupts a mega volcano. Lava covers the entire field permanently.',
    statBonus: { atk: 55, hp: 80, mana: 50 },
  },
}

/**
 * Returns all tier-1 job choices for a given base class.
 */
export function getTier1Jobs(baseClass) {
  return Object.values(JOBS).filter((j) => j.baseClass === baseClass && j.tier === 1)
}

/**
 * Returns all tier-N job choices that branch from a given parent job id.
 */
export function getNextJobs(parentJobId) {
  return Object.values(JOBS).filter((j) => j.parent === parentJobId)
}

/**
 * Returns the full job path taken by a hero (array from tier1 → current job).
 */
export function getJobPath(currentJobId) {
  const path = []
  let job = JOBS[currentJobId]
  while (job) {
    path.unshift(job)
    job = job.parent ? JOBS[job.parent] : null
  }
  return path
}
