import { useCallback } from 'react'
import { useGameStore, resolveHeroStats } from '@/store/useGameStore'
import { useCombatStore } from '@/store/useCombatStore'
import { useInventoryStore } from '@/store/useInventoryStore'

// Live state accessors — bypass React snapshot so processTick always sees
// the current store values even if React hasn't re-rendered between ticks.
const getCombat = () => useCombatStore.getState()
const getGame   = () => useGameStore.getState()
import { getStage, generateEnemies } from '@/data/stages'
import { getSkill } from '@/data/skills'
import {
  calcDamage,
  calcHeal,
  calcLifesteal,
  calcDotTick,
  spdToTickRate,
  manaPerHit,
  applyEffects,
  enemyAttack,
} from '@/utils/combat'
import { rollLoot } from '@/utils/loot'

// ─── Constants ────────────────────────────────────────────────────────────────

const ADVANCE_DELAY_TICKS = 15   // pause after victory before next stage starts
const RETREAT_DELAY_TICKS = 20   // pause after wipe before retreating

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useCombat — orchestrates the full idle combat loop.
 *
 * Call `processTick()` every game tick from useGameLoop.
 * Everything else is driven by store state.
 */
export function useCombat() {
  const game   = useGameStore()
  const combat = useCombatStore()
  const inv    = useInventoryStore()

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Get live stats for a hero with all effects applied, including passives. */
  const getEffectiveStats = useCallback((hero) => {
    const base = resolveHeroStats(hero)
    const effects = combat.getEffects(hero.id)
    let stats = applyEffects(base, effects)

    // ── Own passive stat bonuses ─────────────────────────────────────────
    const ownPassive = getSkill(hero.classId, hero.jobId, 'passive')
    if (ownPassive) {
      ownPassive.effects.forEach((e) => {
        if (e.type === 'passive_dmgReduce') {
          stats = { ...stats, dmgReduce: Math.min(0.9, (stats.dmgReduce ?? 0) + e.value) }
        } else if (e.type === 'passive_critRate') {
          stats = { ...stats, crit: Math.min(0.95, (stats.crit ?? 0) + e.value) }
        } else if (e.type === 'passive_critDmgBonus') {
          stats = { ...stats, critDmg: (stats.critDmg ?? 1.5) + e.value }
        } else if (e.type === 'passive_evasion') {
          stats = { ...stats, evasion: (stats.evasion ?? 0) + e.value }
        } else if (e.type === 'passive_critDefPierce') {
          stats = { ...stats, critDefPierce: e.value }
        } else if (e.type === 'passive_missingHpAtk') {
          const missingFrac = Math.max(0, 1 - (hero.currentHp / (stats.maxHp ?? 1)))
          const bonus = Math.min(e.cap, missingFrac * e.rate * 100)
          stats = { ...stats, atk: Math.floor(stats.atk * (1 + bonus)) }
        }
      })
    }

    // ── Party passives from living allies ────────────────────────────────
    game.getParty().forEach((ally) => {
      if (ally.id === hero.id || ally.isDead) return
      const allyPassive = getSkill(ally.classId, ally.jobId, 'passive')
      if (!allyPassive) return
      allyPassive.effects.forEach((e) => {
        if (e.type === 'passive_partyDef') {
          stats = { ...stats, def: Math.floor(stats.def * (1 + e.value)) }
        } else if (e.type === 'passive_partyDmgReduce') {
          stats = { ...stats, dmgReduce: Math.min(0.9, (stats.dmgReduce ?? 0) + e.value) }
        }
      })
    })

    return stats
  }, [combat, game])

  /** Get the primary living enemy target. */
  const getPrimaryTarget = useCallback(() => {
    return combat.getFirstLivingEnemy()
  }, [combat])

  // ── Phase transitions ──────────────────────────────────────────────────────

  function beginFight() {
    const enemies = generateEnemies(getGame().currentStage)
    game.resetPartyForCombat()
    combat.startFight(enemies)
    combat.clearLog()
    combat.log({
      type: 'stage',
      text: `⚔️  Entering Stage ${game.currentStage}...`,
      actorId: null,
      value: null,
      isCrit: false,
    })
  }

  function handleVictory() {
    const currentStage = getGame().currentStage
    const stageDef = getStage(currentStage)

    // Rewards
    game.addGold(stageDef.goldReward)

    const party = getGame().getParty()
    const xpShare = Math.floor(stageDef.xpReward / party.length)
    party.forEach((h) => game.grantXp(h.id, xpShare))

    // Loot
    const loot = rollLoot(currentStage, stageDef.lootBonus)
    if (loot.length > 0) {
      const { kept, sold, goldEarned } = inv.addItemsWithAutoSell(loot, game)
      kept.forEach((item) => {
        combat.log({
          type: 'loot',
          text: `💰 ${item.icon} ${item.name} dropped!`,
          actorId: null, value: null, isCrit: false,
        })
      })
      if (sold.length > 0) {
        combat.log({
          type: 'loot',
          text: `💸 Auto-sold ${sold.length} item${sold.length > 1 ? 's' : ''} for ${goldEarned}g`,
          actorId: null, value: null, isCrit: false,
        })
      }
    }

    combat.log({
      type: 'stage',
      text: `✅ Stage ${currentStage} cleared! +${stageDef.goldReward}g +${stageDef.xpReward}xp`,
      actorId: null,
      value: stageDef.goldReward,
      isCrit: false,
    })

    combat.setPhase('victory')
  }

  function handleDefeat() {
    combat.incrementWipes()
    // Read fresh wipe count from live store (not stale snapshot)
    const wipes = getCombat().consecutiveWipes
    const currentStage = getGame().currentStage
    const willRetreat = wipes >= 3 && currentStage > 1

    combat.log({
      type: 'stage',
      text: willRetreat
        ? `💀 Wiped ${wipes}x on Stage ${currentStage}. Dropping back a stage...`
        : `💀 Party wiped on Stage ${currentStage}. Retrying... (${wipes}/3)`,
      actorId: null,
      value: null,
      isCrit: false,
    })
    combat.setPhase('defeat')
  }

  // ── Skill resolution ───────────────────────────────────────────────────────

  /**
   * Resolve a single skill effect against the current combat state.
   * @param {object} traitBonuses   aggregated trait bonuses for this skill slot
   *   { dmgBonus, critBonus, lifeSteal, buffTicks, healBoost, cdReduce, manaPerHit }
   */
  function resolveSkillEffect(effect, hero, heroStats, target, traitBonuses = {}) {
    const {
      dmgBonus = 0,
      critBonus: traitCrit = 0,
      lifeSteal: traitLS = 0,
      buffTicks = 0,
      healBoost: traitHeal = 0,
    } = traitBonuses

    switch (effect.type) {
      // ── Damage ──────────────────────────────────────────────────────────
      case 'dmg': {
        if (!target) break
        const defStats = applyEffects(target, combat.getEffects(target.id))
        const hits = effect.hits ?? 1
        for (let h = 0; h < hits; h++) {
          const { damage, isCrit } = calcDamage(heroStats, defStats, {
            multiplier: (effect.multiplier ?? 1) * (1 + dmgBonus),
            critBonus: (effect.critBonus ?? 0) + traitCrit,
            ignoresDef: effect.ignoresDef ?? false,
            defPierce: heroStats.critDefPierce ?? 0,
          })
          combat.damageEnemy(target.id, damage)
          combat.log({
            type: 'hit',
            text: `${hero.name} hits ${target.name} for ${damage}${isCrit ? ' 💥CRIT' : ''}`,
            actorId: hero.id,
            value: damage,
            isCrit,
          })
          const totalLS = (effect.lifeSteal ?? 0) + traitLS
          if (totalLS > 0) {
            const heal = calcLifesteal(damage, totalLS)
            if (heal > 0) game.modifyHeroHp(hero.id, heal)
          }
        }
        break
      }

      case 'dmgAll': {
        const living = combat.getLivingEnemies()
        const ticks = effect.ticks ?? 1
        for (let t = 0; t < ticks; t++) {
          living.forEach((enemy) => {
            const defStats = applyEffects(enemy, combat.getEffects(enemy.id))
            const { damage, isCrit } = calcDamage(heroStats, defStats, {
              multiplier: (effect.multiplier ?? 1) * (1 + dmgBonus),
            })
            combat.damageEnemy(enemy.id, damage)
            combat.log({
              type: 'hit',
              text: `${hero.name} hits ${enemy.name} for ${damage}${isCrit ? ' 💥CRIT' : ''}`,
              actorId: hero.id,
              value: damage,
              isCrit,
            })
          })
        }
        break
      }

      // ── DoT ─────────────────────────────────────────────────────────────
      case 'dot': {
        if (!target) break
        combat.addEffect(target.id, {
          type: 'dot',
          damage: Math.floor(heroStats.atk * (effect.multiplier ?? 0.5) * (1 + dmgBonus)),
          ticks: effect.ticks ?? 3,
          canCrit: effect.canCrit ?? false,
          crit: heroStats.crit,
          critDmg: heroStats.critDmg,
          label: effect.label ?? 'DoT',
        })
        combat.log({
          type: 'skill',
          text: `🩸 ${target.name} is afflicted with ${effect.label ?? 'DoT'}`,
          actorId: hero.id,
          value: null,
          isCrit: false,
        })
        break
      }

      // ── Heal ────────────────────────────────────────────────────────────
      case 'heal': {
        const tgt = effect.target === 'lowestHpAlly'
          ? _lowestHpHero(game.getLivingParty())
          : game.heroes[hero.id]
        if (!tgt) break
        const tgtStats = resolveHeroStats(tgt)
        const amount = calcHeal(heroStats, tgtStats, {
          multiplier: effect.multiplier ?? 1,
          flatPercent: effect.value ?? 0,
          healBoost: _getPassiveValue(hero, 'passive_healBoost') + traitHeal,
        })
        game.modifyHeroHp(tgt.id, amount)
        combat.log({
          type: 'heal',
          text: `💚 ${hero.name} heals ${tgt.name} for ${amount} HP`,
          actorId: hero.id,
          value: amount,
          isCrit: false,
        })
        break
      }

      case 'healAll': {
        const alive = game.getLivingParty()
        alive.forEach((ally) => {
          const allyStats = resolveHeroStats(ally)
          const amount = calcHeal(heroStats, allyStats, {
            flatPercent: effect.value ?? 0,
            healBoost: _getPassiveValue(hero, 'passive_healBoost') + traitHeal,
          })
          game.modifyHeroHp(ally.id, amount)
        })
        combat.log({
          type: 'heal',
          text: `💚 ${hero.name} heals the entire party`,
          actorId: hero.id,
          value: null,
          isCrit: false,
        })
        break
      }

      // ── Buff / Debuff ────────────────────────────────────────────────────
      case 'buff':
      case 'buffAll': {
        const targets = effect.type === 'buffAll'
          ? game.getLivingParty()
          : [game.heroes[hero.id]]
        targets.forEach((ally) => {
          if (!ally) return
          combat.addEffect(ally.id, {
            type: 'buff',
            stat: effect.stat,
            multiplier: effect.multiplier,
            ticks: (effect.ticks ?? 3) + buffTicks,
          })
        })
        combat.log({
          type: 'skill',
          text: `✨ ${hero.name} buffs ${effect.type === 'buffAll' ? 'the party' : 'self'} (${effect.stat} ×${effect.multiplier})`,
          actorId: hero.id,
          value: null,
          isCrit: false,
        })
        break
      }

      case 'debuff': {
        if (!target) break
        combat.addEffect(target.id, {
          type: 'debuff',
          stat: effect.stat,
          multiplier: effect.multiplier,
          ticks: (effect.ticks ?? 3) + buffTicks,
        })
        combat.log({
          type: 'skill',
          text: `⬇️ ${hero.name} debuffs ${target.name} (${effect.stat})`,
          actorId: hero.id,
          value: null,
          isCrit: false,
        })
        break
      }

      // ── Taunt ────────────────────────────────────────────────────────────
      case 'taunt': {
        const tauntId = effect.target === 'self' ? hero.id : hero.id
        combat.addEffect(tauntId, { type: 'taunt', ticks: effect.ticks ?? 2 })
        combat.log({
          type: 'skill',
          text: `😤 ${hero.name} taunts all enemies!`,
          actorId: hero.id,
          value: null,
          isCrit: false,
        })
        break
      }

      // ── Shield ───────────────────────────────────────────────────────────
      case 'shield': {
        const amount = heroStats.def * (effect.multiplier ?? 1)
        combat.addEffect(hero.id, {
          type: 'dmgReduce',
          value: Math.min(0.8, amount / (heroStats.maxHp ?? 100)),
          ticks: effect.ticks ?? 3,
        })
        combat.log({
          type: 'skill',
          text: `🛡️ ${hero.name} gains a shield`,
          actorId: hero.id,
          value: null,
          isCrit: false,
        })
        break
      }

      // ── Stun ─────────────────────────────────────────────────────────────
      case 'stun': {
        if (!target) break
        combat.addEffect(target.id, { type: 'stun', ticks: effect.ticks ?? 1 })
        combat.log({
          type: 'skill',
          text: `😵 ${target.name} is stunned for ${effect.ticks ?? 1} ticks`,
          actorId: hero.id,
          value: null,
          isCrit: false,
        })
        break
      }

      // ── Revive ───────────────────────────────────────────────────────────
      case 'reviveAll': {
        const dead = game.getParty().filter((h) => h.isDead)
        dead.forEach((h) => {
          game.reviveHero(h.id, effect.value ?? 0.4)
          combat.log({
            type: 'heal',
            text: `✨ ${hero.name} revives ${h.name}!`,
            actorId: hero.id,
            value: null,
            isCrit: false,
          })
        })
        break
      }

      // ── Mana gain ────────────────────────────────────────────────────────
      case 'gainMana': {
        game.modifyHeroMana(hero.id, effect.value ?? 10)
        break
      }

      default:
        break
    }
  }

  /**
   * Fire a hero's skill (basic / skill / ultimate).
   * Handles cooldowns, mana consumption, and ULT mana drain.
   */
  function fireSkill(hero, slot) {
    const skill = getSkill(hero.classId, hero.jobId, slot)
    if (!skill) return

    // Check cooldown for non-basic skills
    if (slot !== 'basic' && combat.isOnCooldown(hero.id, slot)) return

    // ULT requires full mana
    if (slot === 'ultimate') {
      const stats = resolveHeroStats(hero)
      if (hero.currentMana < stats.maxMana) return
      game.modifyHeroMana(hero.id, -stats.maxMana)  // drain mana
      combat.log({
        type: 'ult',
        text: `⚡ ${hero.name} uses ULTIMATE: ${skill.name}!`,
        actorId: hero.id,
        value: null,
        isCrit: false,
      })
    } else if (slot === 'skill') {
      combat.log({
        type: 'skill',
        text: `✨ ${hero.name} uses ${skill.name}`,
        actorId: hero.id,
        value: null,
        isCrit: false,
      })
    }

    const heroStats = getEffectiveStats(hero)
    const target = getPrimaryTarget()

    // Collect bonuses from legendary item traits + spell boost passive
    const traitBonuses = _getTraitBonuses(hero, slot, inv.items)
    const spellBoost = slot !== 'basic' ? _getPassiveValue(hero, 'passive_spellBoost') : 0
    if (spellBoost > 0) traitBonuses.dmgBonus = (traitBonuses.dmgBonus ?? 0) + spellBoost

    skill.effects.forEach((effect) => {
      resolveSkillEffect(effect, hero, heroStats, target, traitBonuses)
    })

    // Set cooldown (in ticks, 1s = 10 ticks at 100ms/tick)
    if (slot === 'skill' && skill.cooldown) {
      const cdReduce = traitBonuses.cdReduce ?? 0
      combat.setCooldown(hero.id, 'skill', Math.max(10, (skill.cooldown - cdReduce) * 10))
    }
    if (slot === 'ultimate') {
      combat.setCooldown(hero.id, 'ultimate', 5 * 10)  // brief lock after ULT
    }
  }

  // ── Main tick ──────────────────────────────────────────────────────────────

  /**
   * Called every TICK_MS by useGameLoop.
   * Full combat resolution for one tick.
   */
  function processTick() {
    combat.incrementTick()
    combat.tickCooldowns()
    combat.tickEffects()
    game.tickRunTime()

    // Always read phase from live store state (not stale React snapshot)
    const { phase, tick, consecutiveWipes } = getCombat()

    // ── Idle: start first fight ──────────────────────────────────────────
    if (phase === 'idle') {
      beginFight()
      return
    }

    // ── Victory delay: advance or farm ──────────────────────────────────
    if (phase === 'victory') {
      const waited = combat.getStageClearTicks()
      if (waited >= ADVANCE_DELAY_TICKS) {
        combat.resetWipes()
        if (getGame().autoAdvance) {
          game.advanceStage()
        }
        beginFight()
      }
      return
    }

    // ── Defeat delay: retry or retreat ───────────────────────────────────
    if (phase === 'defeat') {
      const waited = combat.getStageClearTicks()
      if (waited >= RETREAT_DELAY_TICKS) {
        // 3 consecutive wipes on the same stage → drop back one
        if (consecutiveWipes >= 3 && getGame().currentStage > 1) {
          game.setStage(getGame().currentStage - 1)
          game.disableAutoAdvance()
          combat.resetWipes()
        }
        beginFight()
      }
      return
    }

    // ── Active fighting ──────────────────────────────────────────────────
    if (phase !== 'fighting') return

    const livingParty = getGame().getLivingParty()

    // ── Party wipe check ────────────────────────────────────────────────
    if (livingParty.length === 0) {
      handleDefeat()
      return
    }

    // ── Victory check ────────────────────────────────────────────────────
    if (combat.allEnemiesDead()) {
      handleVictory()
      return
    }

    // ── Passive party regen (healer aura etc.) ───────────────────────────
    livingParty.forEach((caster) => {
      const casterPassive = getSkill(caster.classId, caster.jobId, 'passive')
      if (!casterPassive) return
      casterPassive.effects.forEach((e) => {
        if (e.type !== 'passive_partyRegen') return
        livingParty.forEach((target) => {
          const tStats = resolveHeroStats(target)
          const amt = Math.floor(tStats.maxHp * e.value)
          if (amt > 0) game.modifyHeroHp(target.id, amt)
        })
      })
    })

    // ── Hero actions ─────────────────────────────────────────────────────
    livingParty.forEach((hero) => {
      const heroStats = getEffectiveStats(hero)

      // 1. Basic attack (SPD-based)
      const attackRate = spdToTickRate(heroStats.spd)
      const heroOffset = hero.id.charCodeAt(hero.id.length - 1) % attackRate // stagger heroes
      if ((tick + heroOffset) % attackRate === 0) {
        fireSkill(hero, 'basic')
        const basicTraits = _getTraitBonuses(hero, 'basic', inv.items)
        const manaBonus = basicTraits.manaPerHit ?? 0
        game.modifyHeroMana(hero.id, Math.floor(manaPerHit(heroStats) * (1 + manaBonus)))
      }

      // 2. Active skill (fires whenever cooldown is up)
      if (!combat.isOnCooldown(hero.id, 'skill')) {
        fireSkill(hero, 'skill')
      }

      // 3. ULT (fires when mana is full)
      const stats = resolveHeroStats(hero)
      if (hero.currentMana >= stats.maxMana) {
        fireSkill(hero, 'ultimate')
      }
    })

    // ── Enemy actions ────────────────────────────────────────────────────
    const livingEnemies = combat.getLivingEnemies()
    livingEnemies.forEach((enemy) => {
      // Skip stunned enemies
      const effects = combat.getEffects(enemy.id)
      if (effects.some((e) => e.type === 'stun')) return

      const enemyRate = spdToTickRate(enemy.spd)
      const enemyOffset = enemy.id.charCodeAt(enemy.id.length - 1) % enemyRate
      if ((tick + enemyOffset) % enemyRate !== 0) return

      // Pick a random living hero to attack
      if (livingParty.length === 0) return
      const taunted = livingParty.find((h) => {
        const fx = combat.getEffects(h.id)
        return fx.some((e) => e.type === 'taunt')
      })
      const heroTarget = taunted ?? livingParty[Math.floor(Math.random() * livingParty.length)]
      const heroStats = getEffectiveStats(heroTarget)

      const { damage, dodged, isCrit } = enemyAttack(enemy, heroStats)

      if (dodged) {
        combat.log({
          type: 'hit',
          text: `💨 ${heroTarget.name} dodges ${enemy.name}'s attack!`,
          actorId: enemy.id,
          value: 0,
          isCrit: false,
        })
        // Dodge buff (evasive instincts passive)
        return
      }

      game.modifyHeroHp(heroTarget.id, -damage)

      if (damage > 0) {
        combat.log({
          type: 'hit',
          text: `${enemy.icon} ${enemy.name} hits ${heroTarget.name} for ${damage}${isCrit ? ' 💥CRIT' : ''}`,
          actorId: enemy.id,
          value: damage,
          isCrit,
        })
      }

      // Death check for this hero
      const updatedHero = game.heroes[heroTarget.id]
      if (updatedHero?.isDead) {
        combat.log({
          type: 'death',
          text: `💀 ${heroTarget.name} has fallen!`,
          actorId: heroTarget.id,
          value: null,
          isCrit: false,
        })
      }
    })

    // ── DoT ticks (active effects on enemies with dot type) ──────────────
    livingEnemies.forEach((enemy) => {
      const effects = combat.getEffects(enemy.id)
      effects.filter((e) => e.type === 'dot').forEach((dot) => {
        const { damage } = calcDotTick(dot)
        if (damage > 0) {
          combat.damageEnemy(enemy.id, damage)
          combat.log({
            type: 'hit',
            text: `🩸 ${enemy.name} takes ${damage} from ${dot.label ?? 'DoT'}`,
            actorId: enemy.id,
            value: damage,
            isCrit: false,
          })
        }
      })
    })

  }

  return { processTick }
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function _lowestHpHero(party) {
  if (!party.length) return null
  return party.reduce((lowest, hero) => {
    const pct = hero.currentHp / (resolveHeroStats(hero)?.maxHp ?? 1)
    const lowestPct = lowest.currentHp / (resolveHeroStats(lowest)?.maxHp ?? 1)
    return pct < lowestPct ? hero : lowest
  })
}

function _getPassiveValue(hero, passiveType) {
  const skill = getSkill(hero.classId, hero.jobId, 'passive')
  if (!skill) return 0
  const effect = skill.effects?.find((e) => e.type === passiveType)
  return effect?.value ?? 0
}

/**
 * Aggregate all legendary trait bonuses on a hero's equipped items for a given skill slot.
 */
function _getTraitBonuses(hero, slot, items) {
  const bonuses = { dmgBonus: 0, critBonus: 0, lifeSteal: 0, buffTicks: 0, healBoost: 0, cdReduce: 0, manaPerHit: 0 }
  items
    .filter((i) => i.equippedBy === hero.id && i.trait?.skillSlot === slot)
    .forEach((i) => {
      const t = i.trait
      if (t.type === 'dmg_bonus')      bonuses.dmgBonus   += t.value
      if (t.type === 'lifesteal')       bonuses.lifeSteal  += t.value
      if (t.type === 'crit_bonus')      bonuses.critBonus  += t.value
      if (t.type === 'heal_boost')      bonuses.healBoost  += t.value
      if (t.type === 'buff_ticks')      bonuses.buffTicks  += t.value
      if (t.type === 'cooldown_reduce') bonuses.cdReduce   += t.value
      if (t.type === 'mana_per_hit')    bonuses.manaPerHit += t.value
    })
  return bonuses
}
