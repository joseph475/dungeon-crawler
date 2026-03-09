/**
 * Pure combat math — no store access, no side effects.
 * All functions are deterministic given their inputs (except RNG rolls).
 */

// ─── Core damage formula ──────────────────────────────────────────────────────

/**
 * Calculate damage from attacker to defender.
 *
 * Formula:
 *   raw = max(1, atk - def × 0.4)
 *   if crit: raw × critDmg
 *   apply dmgReduce modifier from effects
 *
 * @param {object} attacker   resolved stat block + optional modifiers
 * @param {object} defender   resolved stat block + optional modifiers
 * @param {object} [opts]
 * @param {number} [opts.multiplier=1]    skill damage multiplier
 * @param {number} [opts.critBonus=0]     extra crit chance for this hit
 * @param {boolean} [opts.ignoresDef=false]
 * @param {number} [opts.defPierce=0]     fraction of def to ignore (0–1)
 * @returns {{ damage: number, isCrit: boolean }}
 */
export function calcDamage(attacker, defender, opts = {}) {
  const {
    multiplier = 1,
    critBonus = 0,
    ignoresDef = false,
    defPierce = 0,
  } = opts

  const atkStat = attacker.atk ?? 1
  const defStat = ignoresDef ? 0 : (defender.def ?? 0) * (1 - defPierce) * 0.4

  const raw = Math.max(1, atkStat - defStat) * multiplier

  const critRate = Math.min(0.95, (attacker.crit ?? 0.05) + critBonus)
  const isCrit = Math.random() < critRate
  const critMult = isCrit ? (attacker.critDmg ?? 1.5) : 1

  // Apply defender's incoming damage reduction (e.g. from Iron Skin passive)
  const dmgReduce = defender.dmgReduce ?? 0
  const final = Math.max(1, Math.floor(raw * critMult * (1 - dmgReduce)))

  return { damage: final, isCrit }
}

// ─── Heal formula ─────────────────────────────────────────────────────────────

/**
 * Calculate a heal amount.
 * @param {object} healer     stat block (atk used as heal power for offensive healers)
 * @param {object} target     stat block of the recipient
 * @param {object} [opts]
 * @param {number} [opts.multiplier=1]
 * @param {number} [opts.flatPercent=0]   if > 0, heals this fraction of target maxHp instead
 * @param {number} [opts.healBoost=0]     additive bonus from passives
 * @returns {number}
 */
export function calcHeal(healer, target, opts = {}) {
  const { multiplier = 1, flatPercent = 0, healBoost = 0 } = opts
  const boost = 1 + healBoost

  if (flatPercent > 0) {
    return Math.floor((target.maxHp ?? target.hp ?? 100) * flatPercent * boost)
  }

  return Math.floor((healer.atk ?? 8) * multiplier * boost)
}

// ─── Attack speed ─────────────────────────────────────────────────────────────

/**
 * Convert SPD stat to ticks-per-attack.
 * SPD 5  → attacks every 10 ticks (1s at 100ms/tick)
 * SPD 10 → attacks every 5 ticks
 * SPD 20 → attacks every 3 ticks (capped)
 *
 * @param {number} spd
 * @returns {number} ticks between attacks
 */
export function spdToTickRate(spd) {
  return Math.max(3, Math.round(50 / Math.max(1, spd)))
}

// ─── Mana gain per hit ────────────────────────────────────────────────────────

/**
 * How much mana a hero gains per basic attack hit.
 * Base: 10 mana. Scales slightly with mana pool size.
 * @param {object} stats  resolved hero stats
 * @returns {number}
 */
export function manaPerHit(stats) {
  return Math.floor(10 + (stats.mana ?? 100) * 0.02)
}

// ─── Effect resolution helpers ────────────────────────────────────────────────

/**
 * Apply all active buff/debuff effects to a stat block.
 * Effects are multiplied together (stacking multiplicatively).
 *
 * @param {object} baseStats
 * @param {Array}  effects    from combatStore.getEffects(targetId)
 * @returns {object} modified stat block
 */
export function applyEffects(baseStats, effects) {
  if (!effects || effects.length === 0) return baseStats
  const result = { ...baseStats }

  effects.forEach(({ type, stat, multiplier, value }) => {
    if (type === 'buff' || type === 'debuff') {
      if (stat && result[stat] !== undefined) {
        result[stat] = result[stat] * (multiplier ?? 1)
      }
    }
    if (type === 'dmgReduce') {
      result.dmgReduce = Math.min(0.9, (result.dmgReduce ?? 0) + (value ?? 0))
    }
  })

  return result
}

// ─── Enemy attack ─────────────────────────────────────────────────────────────

/**
 * Resolve an enemy's basic attack against a hero.
 * Returns damage dealt (after evasion check).
 *
 * @param {object} enemy      enemy stat block
 * @param {object} heroStats  resolved hero stats (with effects applied)
 * @returns {{ damage: number, dodged: boolean, isCrit: boolean }}
 */
export function enemyAttack(enemy, heroStats) {
  const evasion = heroStats.evasion ?? 0
  if (Math.random() < evasion) {
    return { damage: 0, dodged: true, isCrit: false }
  }
  const { damage, isCrit } = calcDamage(enemy, heroStats)
  return { damage, dodged: false, isCrit }
}

// ─── Lifesteal ────────────────────────────────────────────────────────────────

/**
 * @param {number} damage      actual damage dealt
 * @param {number} lifeSteal   fraction to return as HP (0–1)
 * @returns {number}
 */
export function calcLifesteal(damage, lifeSteal) {
  return Math.floor(damage * lifeSteal)
}

// ─── DoT tick ─────────────────────────────────────────────────────────────────

/**
 * Resolve a single DoT tick (burn, bleed, poison).
 * @param {object} dotEffect   { damage, canCrit, crit, critDmg }
 * @returns {{ damage: number, isCrit: boolean }}
 */
export function calcDotTick(dotEffect) {
  const base = dotEffect.damage ?? 0
  if (dotEffect.canCrit) {
    const isCrit = Math.random() < (dotEffect.crit ?? 0.05)
    return {
      damage: Math.floor(base * (isCrit ? (dotEffect.critDmg ?? 1.5) : 1)),
      isCrit,
    }
  }
  return { damage: Math.floor(base), isCrit: false }
}
