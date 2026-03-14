import { useGameStore, resolveHeroStats } from '@/store/useGameStore'
import { useCombatStore } from '@/store/useCombatStore'
import { useInventoryStore } from '@/store/useInventoryStore'
import { useToastStore } from '@/store/useToastStore'
import { getStage, generateEnemies, rollStageModifier } from '@/data/stages'
import { ACHIEVEMENTS } from '@/data/achievements'
import { getSkill } from '@/data/skills'
import {
  calcDamage,
  calcHeal,
  calcLifesteal,
  calcDotTick,
  applyEffects,
  enemyAttack,
} from '@/utils/combat'
import { rollLoot, rollFirstClearChest } from '@/utils/loot'
import { getSkillRank, rankDmgMult, rankExtraTicks, rankCdReduction } from '@/utils/skillRank'

// Live state accessors — bypass React snapshot so processTick always sees
// the current store values even if React hasn't re-rendered between ticks.
const getCombat = () => useCombatStore.getState()
const getGame   = () => useGameStore.getState()

// ─── Element map ──────────────────────────────────────────────────────────────

// Natural attack element per base class.
// Jobs don't change element — class identity defines it.
const CLASS_ELEMENTS = {
  warrior:  'physical',
  paladin:  'holy',
  mage:     'arcane',
  healer:   'holy',
  assassin: 'shadow',
  rogue:    'shadow',
  ranger:   'nature',
  shaman:   'fire',
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ADVANCE_DELAY_TICKS = 15   // pause after victory before next stage starts
const RETREAT_DELAY_TICKS = 20   // pause after wipe before retreating

/** Base mana regenerated per turn for each class. */
const BASE_MANA_REGEN = {
  mage: 14, healer: 14, shaman: 12,
  warrior: 8, paladin: 10, ranger: 8,
  assassin: 6, rogue: 6,
}

// ─── Module-level helpers (use live accessors, no React deps) ─────────────────

/** Get live stats for a hero with all active effects and passives applied. */
function getEffectiveStats(hero) {
  const base = resolveHeroStats(hero)
  const effects = getCombat().getEffects(hero.id)
  let stats = applyEffects(base, effects)
  stats.attackElement = CLASS_ELEMENTS[hero.classId] ?? null

  // Own passive stat bonuses
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

  // Party passives from living allies
  getGame().getParty().forEach((ally) => {
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
}

/** Build a sorted turn queue for a new round: all living entities by SPD desc. */
function buildRoundQueue() {
  const livingHeroes  = getGame().getLivingParty()
  const livingEnemies = getCombat().getLivingEnemies()

  const actors = [
    ...livingHeroes.map((h) => ({ id: h.id, isEnemy: false, spd: resolveHeroStats(h).spd ?? 10 })),
    ...livingEnemies.map((e) => ({ id: e.id, isEnemy: true,  spd: e.spd ?? 10 })),
  ]

  actors.sort((a, b) => b.spd - a.spd)
  return actors.map(({ id, isEnemy }) => ({ id, isEnemy }))
}

/** Check whether a hero can use a skill slot right now. */
function canUseSkill(hero, slot) {
  const skill = getSkill(hero.classId, hero.jobId, slot)
  if (!skill) return false
  if (slot === 'basic') return true

  // Mana-cost skill — gated by implicit cooldown set in fireSkill.
  // The cooldown is long enough for mana to fully rebuild to max between uses.
  // Exception: at max mana with ultimate being held, drain immediately.
  if (skill.manaCost != null) {
    const freshHero = getGame().heroes[hero.id]
    if (!freshHero) return false
    if (getCombat().isOnCooldown(hero.id, slot)) return false
    const stats = resolveHeroStats(freshHero)
    const mana = freshHero.currentMana
    const maxMana = stats.maxMana ?? 100
    if (mana < skill.manaCost) return false
    if (mana >= maxMana) return true   // at cap with held ultimate — drain to restart cycle
    return mana < maxMana * 0.80
  }

  // Cooldown-turn skill (physical classes)
  if (skill.cooldownTurns != null) {
    return !getCombat().isOnCooldown(hero.id, slot)
  }

  return true
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useCombat — orchestrates the full turn-based idle combat loop.
 *
 * Each game tick = one entity's turn (determined by the turnQueue).
 * Call `processTick()` every game tick from useGameLoop.
 */
export function useCombat() {
  const game   = useGameStore()
  const combat = useCombatStore()
  const inv    = useInventoryStore()

  // ── Phase transitions ──────────────────────────────────────────────────────

  function beginFight() {
    const stage   = getGame().currentStage
    const enemies = generateEnemies(stage)
    const modifier = rollStageModifier(stage)
    game.resetPartyForCombat()
    combat.startFight(enemies, modifier)
    combat.clearLog()
    combat.log({
      type: 'stage',
      text: `⚔️  Entering Stage ${stage}...`,
      actorId: null,
      value: null,
      isCrit: false,
    })

    // Apply party synergy bonuses after startFight (which clears effects)
    const party = getGame().getParty()

    // Apply prestige + achievement ATK/DEF bonuses as permanent-for-fight buffs
    const { atkPct: prestigeAtk } = getGame().getPrestigeBonus()
    const { atkPct: achAtk, defPct: achDef } = getGame().getAchievementBonus()
    const totalAtkPct = prestigeAtk + achAtk
    const totalDefPct = achDef
    if (totalAtkPct > 0) {
      party.forEach((h) => {
        combat.addEffect(h.id, { type: 'buff', stat: 'atk', multiplier: 1 + totalAtkPct, ticks: 9999 })
      })
    }
    if (totalDefPct > 0) {
      party.forEach((h) => {
        combat.addEffect(h.id, { type: 'buff', stat: 'def', multiplier: 1 + totalDefPct, ticks: 9999 })
      })
    }

    const synergies = computePartySynergies(party)
    synergies.forEach((text) => {
      party.forEach((h) => {
        if (text.stat) {
          combat.addEffect(h.id, { type: 'buff', stat: text.stat, multiplier: text.mult, ticks: 9999 })
        }
        if (text.stat2) {
          combat.addEffect(h.id, { type: 'buff', stat: text.stat2, multiplier: text.mult2, ticks: 9999 })
        }
      })
      combat.log({ type: 'stage', text: `${text.icon} Synergy: ${text.name} — ${text.bonus}`, actorId: null, value: null, isCrit: false })
    })

    // Apply stage modifier effects
    if (modifier) {
      const livingEnemies = getCombat().getLivingEnemies()
      const livingParty   = getGame().getLivingParty()
      if (modifier.effect === 'enemyBuff') {
        livingEnemies.forEach((e) =>
          combat.addEffect(e.id, { type: 'buff', stat: modifier.stat, multiplier: modifier.mult, ticks: 9999 })
        )
      } else if (modifier.effect === 'enemyShield') {
        livingEnemies.forEach((e) =>
          combat.addEffect(e.id, { type: 'dmgReduce', value: modifier.value, ticks: 9999 })
        )
      } else if (modifier.effect === 'partyBuff') {
        livingParty.forEach((h) =>
          combat.addEffect(h.id, { type: 'buff', stat: modifier.stat, multiplier: modifier.mult, ticks: 9999 })
        )
      } else if (modifier.effect === 'partyHpStart') {
        livingParty.forEach((h) => {
          const stats = resolveHeroStats(h)
          const targetHp = Math.floor(stats.maxHp * modifier.mult)
          game.modifyHeroHp(h.id, targetHp - h.currentHp)
        })
      } else if (modifier.effect === 'partyShield') {
        livingParty.forEach((h) =>
          combat.addEffect(h.id, { type: 'dmgReduce', value: modifier.value, ticks: 9999 })
        )
      }
      combat.log({ type: 'stage', text: `${modifier.icon} Modifier: ${modifier.label} — ${modifier.desc}`, actorId: null, value: null, isCrit: false })
    }
  }

  /**
   * Fire any ready special abilities for an enemy.
   * Called at the start of each enemy turn (before normal attack).
   */
  function performEnemyAbilities(enemy) {
    const abilities = enemy.abilities ?? []
    for (const ability of abilities) {
      if (combat.isEnemyOnCooldown(enemy.id, ability.type)) continue

      if (ability.type === 'heal_self') {
        const heal = Math.floor(enemy.maxHp * ability.value)
        combat.healEnemy(enemy.id, heal)
        combat.setEnemyCooldown(enemy.id, ability.type, ability.cooldown)
        combat.log({ type: 'skill', text: `💚 ${enemy.name} regenerates ${heal} HP!`, actorId: enemy.id, value: heal, isCrit: false })
      }

      if (ability.type === 'stun_hero') {
        const targets = getGame().getLivingParty()
        if (!targets.length) continue
        const target = targets[Math.floor(Math.random() * targets.length)]
        combat.addEffect(target.id, { type: 'stun', ticks: ability.ticks ?? 1 })
        combat.setEnemyCooldown(enemy.id, ability.type, ability.cooldown)
        combat.log({ type: 'skill', text: `😵 ${enemy.name} stuns ${target.name}!`, actorId: enemy.id, value: null, isCrit: false })
      }

      if (ability.type === 'shield_self') {
        combat.addEffect(enemy.id, { type: 'dmgReduce', value: ability.value, ticks: ability.ticks ?? 3 })
        combat.setEnemyCooldown(enemy.id, ability.type, ability.cooldown)
        combat.log({ type: 'skill', text: `🛡️ ${enemy.name} shields itself!`, actorId: enemy.id, value: null, isCrit: false })
      }

      if (ability.type === 'bleed_hero') {
        const targets = getGame().getLivingParty()
        if (!targets.length) continue
        const target = targets[Math.floor(Math.random() * targets.length)]
        combat.addEffect(target.id, {
          type: 'bleed',
          damage: Math.floor(freshEnemy.atk * (ability.value ?? 0.30)),
          ticks: ability.ticks ?? 3,
          canCrit: false,
          label: 'Bleed',
        })
        combat.setEnemyCooldown(enemy.id, ability.type, ability.cooldown)
        combat.log({ type: 'skill', text: `🩸 ${enemy.name} inflicts Bleed on ${target.name}!`, actorId: enemy.id, value: null, isCrit: false })
      }

      if (ability.type === 'freeze_hero') {
        const targets = getGame().getLivingParty()
        if (!targets.length) continue
        const target = targets[Math.floor(Math.random() * targets.length)]
        combat.addEffect(target.id, { type: 'freeze', ticks: ability.ticks ?? 2 })
        combat.setEnemyCooldown(enemy.id, ability.type, ability.cooldown)
        combat.log({ type: 'skill', text: `🧊 ${enemy.name} freezes ${target.name}! SPD halved.`, actorId: enemy.id, value: null, isCrit: false })
      }

      if (ability.type === 'silence_hero') {
        const targets = getGame().getLivingParty()
        if (!targets.length) continue
        const target = targets[Math.floor(Math.random() * targets.length)]
        combat.addEffect(target.id, { type: 'silence', ticks: ability.ticks ?? 1 })
        combat.setEnemyCooldown(enemy.id, ability.type, ability.cooldown)
        combat.log({ type: 'skill', text: `🤐 ${enemy.name} silences ${target.name}! Skills blocked.`, actorId: enemy.id, value: null, isCrit: false })
      }

      if (ability.type === 'enrage') {
        const freshEnemy = getCombat().getEnemy(enemy.id)
        const hpPct = freshEnemy ? freshEnemy.currentHp / freshEnemy.maxHp : 1
        if (hpPct > (ability.hpThreshold ?? 0.5)) continue
        combat.addEffect(enemy.id, { type: 'buff', stat: 'atk', multiplier: ability.value, ticks: 9999 })
        combat.setEnemyCooldown(enemy.id, ability.type, ability.cooldown)
        combat.log({ type: 'skill', text: `💢 ${enemy.name} ENRAGES! ATK ×${ability.value}!`, actorId: enemy.id, value: null, isCrit: false })
      }
    }
  }

  function handleVictory() {
    const currentStage = getGame().currentStage
    const stageDef  = getStage(currentStage)
    const modifier  = getCombat().stageModifier
    const modGoldMult = modifier?.effect === 'goldBonus' ? modifier.mult : 1
    const modXpMult   = modifier?.effect === 'goldBonus' ? modifier.mult : 1
    const { goldMult: prestigeGoldMult, xpMult: prestigeXpMult } = getGame().getPrestigeBonus()
    const { goldMult: achGoldMult, xpMult: achXpMult } = getGame().getAchievementBonus()
    const goldMult = modGoldMult * prestigeGoldMult * achGoldMult
    const xpMult   = modXpMult  * prestigeXpMult  * achXpMult

    game.addGold(Math.floor(stageDef.goldReward * goldMult))

    const party = getGame().getParty()
    const xpShare = Math.floor((stageDef.xpReward * xpMult) / party.length)
    party.forEach((h) => {
      const levelBefore = h.level
      const xpBefore    = h.xp
      game.grantXp(h.id, xpShare)
      const updated = getGame().heroes[h.id]
      if (!updated) return
      // Level-up toast
      if (updated.level > levelBefore) {
        useToastStore.getState().addToast({
          type: 'levelup',
          icon: '⬆️',
          text: `${h.name} reached Lv ${updated.level}!`,
          duration: 3000,
        })
        // Job-ready toast (first time crossing threshold while no job yet at that tier)
        const JOB_THRESHOLDS = [20, 50, 100]
        JOB_THRESHOLDS.forEach((threshold) => {
          if (levelBefore < threshold && updated.level >= threshold) {
            const tierNames = { 20: 'Tier 1', 50: 'Tier 2', 100: 'Tier 3' }
            useToastStore.getState().addToast({
              type: 'jobready',
              icon: '✦',
              text: `${h.name} can advance to ${tierNames[threshold]}!`,
              duration: 5000,
            })
          }
        })
      }
    })

    const partyClassIds = party.map((h) => h.classId)
    const partyMaxLevel = Math.max(1, ...party.map((h) => h.level))
    const isBoss = currentStage % 10 === 0
    const isFirstBossClear = isBoss && !getGame().clearedBossStages.includes(currentStage)
    const isFirstStageClear = !getGame().clearedStages.includes(currentStage)
    if (isFirstBossClear) game.markBossCleared(currentStage)
    if (isFirstStageClear) game.markStageCleared(currentStage)

    const loot = rollLoot(currentStage, stageDef.lootBonus, partyMaxLevel, isFirstBossClear, partyClassIds)
    if (loot.length > 0) {
      const { kept, sold, goldEarned } = inv.addItemsWithAutoSell(loot, game)
      kept.forEach((item) => {
        combat.log({ type: 'loot', text: `💰 ${item.icon} ${item.name} dropped!`, actorId: null, value: null, isCrit: false })
        if (item.rarity === 'mythic') {
          useToastStore.getState().addToast({
            type: 'mythic',
            icon: item.icon,
            text: `Mythic drop! ${item.name}`,
            duration: 6000,
          })
        }
      })
      if (sold.length > 0) {
        combat.log({ type: 'loot', text: `💸 Auto-sold ${sold.length} item${sold.length > 1 ? 's' : ''} for ${goldEarned}g`, actorId: null, value: null, isCrit: false })
      }
    }

    if (isFirstStageClear) {
      const chest = rollFirstClearChest(currentStage, partyMaxLevel, partyClassIds)
      if (chest) {
        const { kept } = inv.addItemsWithAutoSell([chest], game)
        if (kept.length) {
          combat.log({ type: 'loot', text: `🎁 First clear! ${chest.icon} ${chest.name} from chest!`, actorId: null, value: null, isCrit: false })
        }
      }
    }

    const shards = isBoss ? 4 : 1
    game.addShards(shards)

    // Accumulate lifetime stats from this fight
    const fightStats = getCombat().fightStats
    const fightDmg  = Object.values(fightStats).reduce((s, h) => s + (h.dmgDealt ?? 0), 0)
    const fightHeal = Object.values(fightStats).reduce((s, h) => s + (h.healDone ?? 0), 0)
    const enemiesKilled = getCombat().enemies.length
    game.addLifetimeStats({
      damage:     fightDmg,
      healing:    fightHeal,
      kills:      enemiesKilled,
      clears:     1,
      goldEarned: Math.floor(stageDef.goldReward * goldMult),
      itemsFound: loot.length,
    })

    // Achievement check — fire toasts for newly unlocked
    const newAchievements = game.checkAchievements()
    newAchievements.forEach((id) => {
      const a = ACHIEVEMENTS.find((x) => x.id === id)
      if (a) {
        useToastStore.getState().addToast({
          type: 'achievement',
          icon: a.icon,
          text: `Achievement: ${a.name} — ${a.rewardLabel}`,
          duration: 5000,
        })
      }
    })

    // Stage speed record
    const clearTicks = getCombat().getStageClearTicks()
    const prevRecord = getGame().stageRecords[currentStage]
    game.recordStageSpeed(currentStage, clearTicks)
    const isNewRecord = prevRecord === undefined || clearTicks < prevRecord
    const clearSecs = (clearTicks * 0.1).toFixed(1)

    combat.log({
      type: 'stage',
      text: `✅ Stage ${currentStage} cleared! +${stageDef.goldReward}g +${stageDef.xpReward}xp +${shards}💎${isNewRecord ? ` 🏆 Record: ${clearSecs}s` : ''}`,
      actorId: null,
      value: stageDef.goldReward,
      isCrit: false,
    })

    combat.setPhase('victory')
  }

  function handleDefeat() {
    combat.incrementWipes()
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

  function resolveSkillEffect(effect, hero, heroStats, target, traitBonuses = {}, rank = 1) {
    const {
      dmgBonus = 0,
      critBonus: traitCrit = 0,
      lifeSteal: traitLS = 0,
      buffTicks = 0,
      healBoost: traitHeal = 0,
    } = traitBonuses

    const rDmg   = rankDmgMult(rank)
    const rTicks = rankExtraTicks(rank)

    switch (effect.type) {
      case 'dmg': {
        if (!target) break
        const defStats = applyEffects(target, getCombat().getEffects(target.id))
        const hits = effect.hits ?? 1
        for (let h = 0; h < hits; h++) {
          const { damage, isCrit } = calcDamage(heroStats, defStats, {
            multiplier: (effect.multiplier ?? 1) * rDmg * (1 + dmgBonus),
            critBonus: (effect.critBonus ?? 0) + traitCrit,
            ignoresDef: effect.ignoresDef ?? false,
            defPierce: heroStats.critDefPierce ?? 0,
            attackElement: heroStats.attackElement,
          })
          combat.damageEnemy(target.id, damage)
          combat.recordFightDmg(hero.id, damage)
          combat.log({ type: 'hit', text: `${hero.name} hits ${target.name} for ${damage}${isCrit ? ' 💥CRIT' : ''}`, actorId: hero.id, value: damage, isCrit })
          const totalLS = (effect.lifeSteal ?? 0) + traitLS
          if (totalLS > 0) {
            const heal = calcLifesteal(damage, totalLS)
            if (heal > 0) game.modifyHeroHp(hero.id, heal)
          }
        }
        break
      }

      case 'dmgAll': {
        const living = getCombat().getLivingEnemies()
        const ticks = effect.ticks ?? 1
        for (let t = 0; t < ticks; t++) {
          living.forEach((enemy) => {
            const defStats = applyEffects(enemy, getCombat().getEffects(enemy.id))
            const { damage, isCrit } = calcDamage(heroStats, defStats, {
              multiplier: (effect.multiplier ?? 1) * rDmg * (1 + dmgBonus),
              attackElement: heroStats.attackElement,
            })
            combat.damageEnemy(enemy.id, damage)
            combat.recordFightDmg(hero.id, damage)
            combat.log({ type: 'hit', text: `${hero.name} hits ${enemy.name} for ${damage}${isCrit ? ' 💥CRIT' : ''}`, actorId: hero.id, value: damage, isCrit })
          })
        }
        break
      }

      case 'dot': {
        if (!target) break
        combat.addEffect(target.id, {
          type: 'dot',
          damage: Math.floor(heroStats.atk * (effect.multiplier ?? 0.5) * rDmg * (1 + dmgBonus)),
          ticks: (effect.ticks ?? 3) + rTicks,
          canCrit: effect.canCrit ?? false,
          crit: heroStats.crit,
          critDmg: heroStats.critDmg,
          label: effect.label ?? 'DoT',
        })
        combat.log({ type: 'skill', text: `🩸 ${target.name} is afflicted with ${effect.label ?? 'DoT'}`, actorId: hero.id, value: null, isCrit: false })
        break
      }

      case 'heal': {
        const tgt = effect.target === 'lowestHpAlly'
          ? _lowestHpHero(getGame().getLivingParty())
          : getGame().heroes[hero.id]
        if (!tgt) break
        const tgtStats = resolveHeroStats(tgt)
        const amount = calcHeal(heroStats, tgtStats, {
          multiplier: (effect.multiplier ?? 1) * rDmg,
          flatPercent: (effect.value ?? 0) * rDmg,
          healBoost: _getPassiveValue(hero, 'passive_healBoost') + traitHeal,
        })
        game.modifyHeroHp(tgt.id, amount)
        combat.recordFightHeal(hero.id, amount)
        combat.log({ type: 'heal', text: `💚 ${hero.name} heals ${tgt.name} for ${amount} HP`, actorId: hero.id, value: amount, isCrit: false })
        break
      }

      case 'healAll': {
        const alive = getGame().getLivingParty()
        let totalHeal = 0
        alive.forEach((ally) => {
          const allyStats = resolveHeroStats(ally)
          const amount = calcHeal(heroStats, allyStats, {
            flatPercent: (effect.value ?? 0) * rDmg,
            healBoost: _getPassiveValue(hero, 'passive_healBoost') + traitHeal,
          })
          game.modifyHeroHp(ally.id, amount)
          totalHeal += amount
        })
        combat.recordFightHeal(hero.id, totalHeal)
        combat.log({ type: 'heal', text: `💚 ${hero.name} heals the entire party`, actorId: hero.id, value: null, isCrit: false })
        break
      }

      case 'buff':
      case 'buffAll': {
        const targets = effect.type === 'buffAll'
          ? getGame().getLivingParty()
          : [getGame().heroes[hero.id]]
        targets.forEach((ally) => {
          if (!ally) return
          combat.addEffect(ally.id, {
            type: 'buff',
            stat: effect.stat,
            multiplier: effect.multiplier,
            ticks: (effect.ticks ?? 3) + buffTicks + rTicks,
          })
        })
        combat.log({ type: 'skill', text: `✨ ${hero.name} buffs ${effect.type === 'buffAll' ? 'the party' : 'self'} (${effect.stat} ×${effect.multiplier})`, actorId: hero.id, value: null, isCrit: false })
        break
      }

      case 'debuff': {
        if (!target) break
        combat.addEffect(target.id, {
          type: 'debuff',
          stat: effect.stat,
          multiplier: effect.multiplier,
          ticks: (effect.ticks ?? 3) + buffTicks + rTicks,
        })
        combat.log({ type: 'skill', text: `⬇️ ${hero.name} debuffs ${target.name} (${effect.stat})`, actorId: hero.id, value: null, isCrit: false })
        break
      }

      case 'taunt': {
        combat.addEffect(hero.id, { type: 'taunt', ticks: effect.ticks ?? 2 })
        combat.log({ type: 'skill', text: `😤 ${hero.name} taunts all enemies!`, actorId: hero.id, value: null, isCrit: false })
        break
      }

      case 'shield': {
        const amount = heroStats.def * (effect.multiplier ?? 1)
        combat.addEffect(hero.id, {
          type: 'dmgReduce',
          value: Math.min(0.8, amount / (heroStats.maxHp ?? 100)),
          ticks: effect.ticks ?? 3,
        })
        combat.log({ type: 'skill', text: `🛡️ ${hero.name} gains a shield`, actorId: hero.id, value: null, isCrit: false })
        break
      }

      case 'stun': {
        if (!target) break
        // Bosses resist stuns: halved duration (min 1) + stun immunity window after
        let stunTicks = (effect.ticks ?? 1) + rTicks
        const targetEffects = getCombat().getEffects(target.id)
        const isStunImmune = targetEffects.some((e) => e.type === 'stunImmune')
        if (isStunImmune) break
        if (target.isBoss) {
          stunTicks = Math.max(1, Math.floor(stunTicks / 2))
          // Grant immunity for 2× the stun duration after it wears off
          combat.addEffect(target.id, { type: 'stunImmune', ticks: stunTicks * 2 })
        }
        combat.addEffect(target.id, { type: 'stun', ticks: stunTicks })
        combat.log({ type: 'skill', text: `😵 ${target.name} is stunned for ${stunTicks} turn${stunTicks !== 1 ? 's' : ''}${target.isBoss ? ' (boss resist)' : ''}`, actorId: hero.id, value: null, isCrit: false })
        break
      }

      case 'reviveAll': {
        const dead = getGame().getParty().filter((h) => h.isDead)
        dead.forEach((h) => {
          game.reviveHero(h.id, effect.value ?? 0.4)
          combat.log({ type: 'heal', text: `✨ ${hero.name} revives ${h.name}!`, actorId: hero.id, value: null, isCrit: false })
        })
        break
      }

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
   * Handles mana costs (magic) and turn cooldowns (physical).
   */
  function fireSkill(hero, slot) {
    const skill = getSkill(hero.classId, hero.jobId, slot)
    if (!skill) return

    // ULT: requires full mana
    if (slot === 'ultimate') {
      const stats = resolveHeroStats(hero)
      const freshHero = getGame().heroes[hero.id]
      if (!freshHero || freshHero.currentMana < stats.maxMana) return
      game.modifyHeroMana(hero.id, -stats.maxMana)
      combat.log({ type: 'ult', text: `⚡ ${hero.name} uses ULTIMATE: ${skill.name}!`, actorId: hero.id, value: null, isCrit: false })
    } else if (slot === 'skill') {
      // Mana-cost skill (magic classes)
      if (skill.manaCost != null) {
        const freshHero = getGame().heroes[hero.id]
        if (!freshHero || freshHero.currentMana < skill.manaCost) return
        game.modifyHeroMana(hero.id, -skill.manaCost)
      }
      // Cooldown-turn skill (physical classes) — already validated by canUseSkill
      combat.log({ type: 'skill', text: `✨ ${hero.name} uses ${skill.name}`, actorId: hero.id, value: null, isCrit: false })
    }

    const heroStats = getEffectiveStats(hero)
    const target = getCombat().getFirstLivingEnemy()

    const traitBonuses = _getTraitBonuses(hero, slot, inv.items)
    const spellBoost = slot !== 'basic' ? _getPassiveValue(hero, 'passive_spellBoost') : 0
    if (spellBoost > 0) traitBonuses.dmgBonus = (traitBonuses.dmgBonus ?? 0) + spellBoost

    const freshHeroForRank = getGame().heroes[hero.id]
    const rank = getSkillRank(freshHeroForRank, skill.id)

    skill.effects.forEach((effect) => {
      resolveSkillEffect(effect, hero, heroStats, target, traitBonuses, rank)
    })

    // Set resource cost after firing
    if (slot === 'skill' && skill.cooldownTurns != null) {
      const cdReduce = (traitBonuses.cdReduce ?? 0) + rankCdReduction(rank)
      combat.setCooldown(hero.id, 'skill', Math.max(1, skill.cooldownTurns - cdReduce))
    }
    // Implicit cooldown for mana-cost skills: long enough that mana fully rebuilds to max.
    // Formula: ceil(maxMana / regenPerTurn). Each turn hero gets classRegen + 5 (basic attack).
    if (slot === 'skill' && skill.manaCost != null) {
      const regenPerTurn = (BASE_MANA_REGEN[hero.classId] ?? 8) + 5
      const maxMana = resolveHeroStats(hero).maxMana ?? 100
      const implicitCd = Math.max(3, Math.ceil(maxMana / regenPerTurn))
      combat.setCooldown(hero.id, 'skill', implicitCd)
    }
    if (slot === 'ultimate') {
      combat.setCooldown(hero.id, 'ultimate', 3)  // 3-turn brief lock after ULT
    }
  }

  // ── Per-entity turn logic ──────────────────────────────────────────────────

  /**
   * Execute one hero's full turn:
   * Tick effects/cooldowns → regen → passive aura → choose action.
   */
  function performHeroTurn(hero) {
    // Read effects BEFORE ticking (so 1-tick effects still fire this turn)
    const effects = getCombat().getEffects(hero.id)
    const wasStunned  = effects.some((e) => e.type === 'stun')
    const wasSilenced = effects.some((e) => e.type === 'silence')

    // Apply bleed DoT damage before hero acts
    effects.filter((e) => e.type === 'bleed').forEach((dot) => {
      const { damage } = calcDotTick(dot)
      if (damage > 0) {
        game.modifyHeroHp(hero.id, -damage)
        combat.log({ type: 'hit', text: `🩸 ${hero.name} takes ${damage} from Bleed`, actorId: hero.id, value: damage, isCrit: false })
        const afterHero = getGame().heroes[hero.id]
        if (afterHero?.isDead) {
          combat.log({ type: 'death', text: `💀 ${hero.name} has fallen!`, actorId: hero.id, value: null, isCrit: false })
          return
        }
      }
    })

    // Tick this hero's effects and cooldowns
    combat.tickEntityEffects(hero.id)
    combat.tickHeroCooldown(hero.id)

    // HP regen from gear stat
    const heroStats = getEffectiveStats(hero)
    const hpRegenStat = heroStats.hpRegen ?? 0
    if (hpRegenStat > 0) game.modifyHeroHp(hero.id, hpRegenStat)

    // Mana regen: base class amount + gear manaRegen stat
    const classRegen  = BASE_MANA_REGEN[hero.classId] ?? 8
    const manaRegenStat = heroStats.manaRegen ?? 0
    game.modifyHeroMana(hero.id, classRegen + manaRegenStat)

    // Passive party HP regen aura (e.g. healer's Blessed Aura)
    const casterPassive = getSkill(hero.classId, hero.jobId, 'passive')
    if (casterPassive) {
      casterPassive.effects.forEach((e) => {
        if (e.type !== 'passive_partyRegen') return
        getGame().getLivingParty().forEach((target) => {
          const tStats = resolveHeroStats(target)
          const amt = Math.floor(tStats.maxHp * e.value)
          if (amt > 0) game.modifyHeroHp(target.id, amt)
        })
      })
    }

    // Skip action if stunned
    if (wasStunned) {
      combat.log({ type: 'skill', text: `😵 ${hero.name} is stunned and loses their turn!`, actorId: hero.id, value: null, isCrit: false })
      return
    }

    // Get fresh hero (mana may have changed above)
    const freshHero = getGame().heroes[hero.id]
    if (!freshHero || freshHero.isDead) return

    const stats = resolveHeroStats(freshHero)

    // Priority: ultimate (full mana) > skill (mana/cooldown ready) > basic attack
    // Silenced heroes can only use basic attacks
    if (!wasSilenced && freshHero.currentMana >= stats.maxMana && !getCombat().isOnCooldown(hero.id, 'ultimate')) {
      const ult = getSkill(freshHero.classId, freshHero.jobId, 'ultimate')
      const hasRevive = ult?.effects?.some((e) => e.type === 'reviveAll')
      // Revive-type ultimates only fire when someone is dead or party is badly hurt
      const shouldFire = !hasRevive || _isUltimateNeeded()
      if (shouldFire) {
        fireSkill(freshHero, 'ultimate')
        return
      }
    }

    if (!wasSilenced && canUseSkill(freshHero, 'skill')) {
      fireSkill(freshHero, 'skill')
      return
    }

    if (wasSilenced) {
      combat.log({ type: 'skill', text: `🤐 ${hero.name} is silenced — only basic attack!`, actorId: hero.id, value: null, isCrit: false })
    }

    // Basic attack — always fires, gives +5 mana
    fireSkill(freshHero, 'basic')
    game.modifyHeroMana(freshHero.id, 5)
  }

  /**
   * Execute one enemy's full turn:
   * Apply DoTs → tick effects → attack a hero (unless stunned).
   */
  function performEnemyTurn(enemy) {
    // Read stun and DoTs BEFORE ticking effects
    const effects = getCombat().getEffects(enemy.id)
    const wasStunned = effects.some((e) => e.type === 'stun')

    // Apply DoT damage from current effects
    effects.filter((e) => e.type === 'dot').forEach((dot) => {
      const { damage } = calcDotTick(dot)
      if (damage > 0) {
        combat.damageEnemy(enemy.id, damage)
        combat.log({ type: 'hit', text: `🩸 ${enemy.name} takes ${damage} from ${dot.label ?? 'DoT'}`, actorId: enemy.id, value: damage, isCrit: false })
      }
    })

    // Tick this enemy's effects and ability cooldowns
    combat.tickEntityEffects(enemy.id)
    combat.tickEnemyCooldown(enemy.id)

    // Skip attack if stunned
    if (wasStunned) {
      combat.log({ type: 'skill', text: `😵 ${enemy.name} is stunned and loses their turn!`, actorId: enemy.id, value: null, isCrit: false })
      return
    }

    // Fresh enemy check (DoT may have killed it)
    const freshEnemy = getCombat().getEnemy(enemy.id)
    if (!freshEnemy || freshEnemy.currentHp <= 0) return

    // Fire any ready special abilities
    performEnemyAbilities(freshEnemy)

    const livingParty = getGame().getLivingParty()
    if (livingParty.length === 0) return

    // Pick target: taunted hero first, otherwise weighted by formation.
    // Front row → 2× target weight, full damage. Back row → 1× weight, 20% less damage.
    // Formation is set per-hero in heroFormation store (falls back to party position).
    const { partyIds, heroFormation } = getGame()
    function isHeroFront(h) {
      const explicit = heroFormation?.[h.id]
      if (explicit) return explicit === 'front'
      return partyIds.indexOf(h.id) <= 1
    }
    const taunted = livingParty.find((h) =>
      getCombat().getEffects(h.id).some((e) => e.type === 'taunt')
    )
    let heroTarget
    if (taunted) {
      heroTarget = taunted
    } else {
      const weights = livingParty.map((h) => (isHeroFront(h) ? 2 : 1))
      const total   = weights.reduce((a, b) => a + b, 0)
      let r = Math.random() * total
      heroTarget = livingParty[livingParty.length - 1]
      for (let i = 0; i < livingParty.length; i++) {
        r -= weights[i]
        if (r <= 0) { heroTarget = livingParty[i]; break }
      }
    }
    const heroStats = getEffectiveStats(heroTarget)

    let { damage, dodged, isCrit } = enemyAttack(freshEnemy, heroStats)

    // Back row heroes take 20% reduced damage
    if (!dodged && !isHeroFront(heroTarget)) {
      damage = Math.floor(damage * 0.80)
    }

    if (dodged) {
      combat.log({ type: 'hit', text: `💨 ${heroTarget.name} dodges ${freshEnemy.name}'s attack!`, actorId: freshEnemy.id, value: 0, isCrit: false })
      return
    }

    game.modifyHeroHp(heroTarget.id, -damage)

    if (damage > 0) {
      combat.log({
        type: 'hit',
        text: `${freshEnemy.icon} ${freshEnemy.name} hits ${heroTarget.name} for ${damage}${isCrit ? ' 💥CRIT' : ''}`,
        actorId: freshEnemy.id,
        value: damage,
        isCrit,
      })
    }

    // Death check
    const updatedHero = getGame().heroes[heroTarget.id]
    if (updatedHero?.isDead) {
      combat.log({ type: 'death', text: `💀 ${heroTarget.name} has fallen!`, actorId: heroTarget.id, value: null, isCrit: false })
      if (getGame().retreatOnFirstDeath) {
        handleDefeat()
        return
      }
    }
  }

  // ── Main tick ──────────────────────────────────────────────────────────────

  /**
   * Called every TICK_MS by useGameLoop.
   * Each tick = one entity's turn in the turn queue.
   */
  function processTick() {
    combat.incrementTick()
    game.tickRunTime()

    const { phase, consecutiveWipes, turnQueue, currentActorIdx } = getCombat()

    // ── Idle: start first fight ──────────────────────────────────────────
    if (phase === 'idle') {
      beginFight()
      return
    }

    // ── Victory delay ────────────────────────────────────────────────────
    if (phase === 'victory') {
      const waited = combat.getStageClearTicks()
      if (waited >= ADVANCE_DELAY_TICKS) {
        combat.resetWipes()
        if (getGame().autoAdvance) game.advanceStage()
        beginFight()
      }
      return
    }

    // ── Defeat delay: retry or retreat ───────────────────────────────────
    if (phase === 'defeat') {
      const waited = combat.getStageClearTicks()
      if (waited >= RETREAT_DELAY_TICKS) {
        if (consecutiveWipes >= 3 && getGame().currentStage > 1) {
          game.setStage(getGame().currentStage - 1)
          game.disableAutoAdvance()
          combat.resetWipes()
        }
        beginFight()
      }
      return
    }

    if (phase !== 'fighting') return

    // ── Win/loss checks ──────────────────────────────────────────────────
    const livingParty = getGame().getLivingParty()
    if (livingParty.length === 0) { handleDefeat(); return }
    if (getCombat().allEnemiesDead()) { handleVictory(); return }

    // ── Build round queue when exhausted ─────────────────────────────────
    if (currentActorIdx >= turnQueue.length) {
      combat.setTurnQueue(buildRoundQueue())
      return  // next tick starts the new round
    }

    // ── Execute current actor's turn ─────────────────────────────────────
    const actor = getCombat().getCurrentActor()
    if (!actor) {
      combat.setTurnQueue(buildRoundQueue())
      return
    }

    if (actor.isEnemy) {
      const enemy = getCombat().getEnemy(actor.id)
      if (enemy && enemy.currentHp > 0) {
        performEnemyTurn(enemy)
      }
    } else {
      const hero = getGame().heroes[actor.id]
      if (hero && !hero.isDead) {
        performHeroTurn(hero)
      }
    }

    combat.advanceTurn()

    // ── Post-turn win/loss check ──────────────────────────────────────────
    if (getGame().getLivingParty().length === 0) { handleDefeat(); return }
    if (getCombat().allEnemiesDead()) { handleVictory(); return }
  }

  return { processTick }
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/** Returns true if a revive-type ultimate is worth using right now. */
function _isUltimateNeeded() {
  const party = getGame().getParty()
  const hasDead = party.some((h) => h.isDead)
  if (hasDead) return true
  // Also fire if average living party HP is below 55%
  const living = party.filter((h) => !h.isDead)
  if (!living.length) return false
  const avgHpPct = living.reduce((sum, h) => {
    const maxHp = resolveHeroStats(h)?.maxHp ?? 1
    return sum + h.currentHp / maxHp
  }, 0) / living.length
  return avgHpPct < 0.55
}

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

/** All possible synergies with their activation requirements (for UI display). */
export const ALL_SYNERGY_DEFINITIONS = [
  { name: 'Vanguard',           bonus: 'DEF +15%',         icon: '🛡️', condition: '2+ Warriors / Paladins' },
  { name: 'Arcane Surge',       bonus: 'ATK +12%',         icon: '✨', condition: '2+ Mages / Shamans / Healers' },
  { name: 'Shadow Cadre',       bonus: 'ATK +15% SPD +15%',icon: '🗡️', condition: '2+ Rogues / Assassins' },
  { name: "Hunter's Mark",      bonus: 'SPD +20%',         icon: '🏹', condition: 'Ranger + Assassin in party' },
  { name: 'Balanced Formation', bonus: 'ATK +8% DEF +8%',  icon: '⚖️', condition: 'All 4 different classes' },
]

/**
 * Compute active party synergy bonuses based on class composition.
 * Returns an array of { name, bonus, label, stat, mult, stat2?, mult2? } for each active synergy.
 * Pure function — exported so UI can call it without store access.
 */
export function computePartySynergies(party) {
  const synergies = []
  const classes = party.map((h) => h.classId)
  const counts = {}
  classes.forEach((c) => { counts[c] = (counts[c] ?? 0) + 1 })

  const tankCount   = (counts.warrior ?? 0) + (counts.paladin ?? 0)
  const casterCount = (counts.mage ?? 0) + (counts.shaman ?? 0) + (counts.healer ?? 0)
  const rogueCount  = (counts.rogue ?? 0) + (counts.assassin ?? 0)

  // Vanguard: 2+ tanks → party DEF +15%
  if (tankCount >= 2) {
    synergies.push({ name: 'Vanguard', bonus: 'DEF +15%', icon: '🛡️', stat: 'def', mult: 1.15 })
  }

  // Arcane Surge: 2+ casters → party ATK +12%
  if (casterCount >= 2) {
    synergies.push({ name: 'Arcane Surge', bonus: 'ATK +12%', icon: '✨', stat: 'atk', mult: 1.12 })
  }

  // Shadow Cadre: 2+ rogues/assassins → party ATK +15% SPD +15%
  if (rogueCount >= 2) {
    synergies.push({ name: 'Shadow Cadre', bonus: 'ATK +15% SPD +15%', icon: '🗡️', stat: 'atk', mult: 1.15, stat2: 'spd', mult2: 1.15 })
  }

  // Hunter Duo: ranger + assassin → party SPD +20%
  if ((counts.ranger ?? 0) >= 1 && (counts.assassin ?? 0) >= 1) {
    synergies.push({ name: "Hunter's Mark", bonus: 'SPD +20%', icon: '🏹', stat: 'spd', mult: 1.20 })
  }

  // Balanced Formation: all 4 party members are different classes → ATK +8%, DEF +8%
  if (new Set(classes).size === 4) {
    synergies.push({ name: 'Balanced Formation', bonus: 'ATK +8% DEF +8%', icon: '⚖️', stat: 'atk', mult: 1.08, stat2: 'def', mult2: 1.08 })
  }

  return synergies
}

function _applyTrait(bonuses, t) {
  if (!t) return
  if (t.type === 'dmg_bonus')      bonuses.dmgBonus   += t.value
  if (t.type === 'lifesteal')      bonuses.lifeSteal  += t.value
  if (t.type === 'crit_bonus')     bonuses.critBonus  += t.value
  if (t.type === 'heal_boost')     bonuses.healBoost  += t.value
  if (t.type === 'buff_ticks')     bonuses.buffTicks  += t.value
  if (t.type === 'cooldown_reduce')bonuses.cdReduce   += t.value
  if (t.type === 'mana_per_hit')   bonuses.manaPerHit += t.value
}

function _getTraitBonuses(hero, slot, items) {
  const bonuses = { dmgBonus: 0, critBonus: 0, lifeSteal: 0, buffTicks: 0, healBoost: 0, cdReduce: 0, manaPerHit: 0 }
  items
    .filter((i) => i.equippedBy === hero.id)
    .forEach((i) => {
      // Legendary single trait
      if (i.trait?.skillSlot === slot) _applyTrait(bonuses, i.trait)
      // Mythic multiple skill traits
      ;(i.mythicSkillTraits ?? []).forEach((t) => {
        if (t.skillSlot === slot) _applyTrait(bonuses, t)
      })
    })
  return bonuses
}
