import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

/**
 * Combat state — NOT persisted.
 *
 * Turn-based model: each tick, one entity in `turnQueue` takes their action.
 * After all entities act → new round is built (sorted by SPD desc).
 *
 * turnQueue entry: { id: string, isEnemy: boolean }
 */

let _logId = 0

export const useCombatStore = create(
  devtools(
    (set, get) => ({
      // ── State ──────────────────────────────────────────────────────────
      phase: 'idle',        // 'idle' | 'fighting' | 'victory' | 'defeat'
      enemies: [],
      combatLog: [],
      tick: 0,
      stageStartTick: 0,
      consecutiveWipes: 0,
      stageModifier: null,  // { id, icon, label, desc, effect, ... } | null

      // ── Turn queue ─────────────────────────────────────────────────────
      // Ordered array of { id, isEnemy } for the current round.
      // Consumed front-to-back; when empty, rebuild for next round.
      turnQueue: [],
      currentActorIdx: 0,
      currentActorId: null,   // id of who is acting RIGHT NOW (for UI highlight)
      roundNumber: 0,

      // Skill cooldowns: { [`${heroId}_${slot}`]: turnsRemaining }
      // Decremented once per time THAT HERO takes a turn (not per game tick).
      cooldowns: {},

      // Active effects: { [targetId]: [{ type, ... , ticks }] }
      // Ticked per entity's turn, not per global tick.
      activeEffects: {},

      // Fight statistics — reset each fight, used for post-combat summary
      fightStats: {},   // { [heroId]: { dmgDealt: 0, healDone: 0 } }

      // ── Lifecycle ──────────────────────────────────────────────────────

      startFight(enemies, modifier = null) {
        set((s) => ({
          phase: 'fighting',
          enemies: enemies.map((e) => ({ ...e, currentHp: e.maxHp })),
          cooldowns: {},
          activeEffects: {},
          fightStats: {},
          stageStartTick: s.tick,
          turnQueue: [],
          currentActorIdx: 0,
          currentActorId: null,
          roundNumber: 0,
          stageModifier: modifier,
        }))
      },

      setStageModifier(modifier) {
        set({ stageModifier: modifier })
      },

      setPhase(phase) {
        set((s) => ({ phase, stageStartTick: s.tick, currentActorId: null }))
      },

      // ── Turn queue management ──────────────────────────────────────────

      /** Replace the queue with a new round's actor list. */
      setTurnQueue(queue) {
        set((s) => ({
          turnQueue: queue,
          currentActorIdx: 0,
          roundNumber: s.roundNumber + 1,
          currentActorId: queue[0]?.id ?? null,
        }))
      },

      /** Current actor (the entity whose turn it is right now). */
      getCurrentActor() {
        const { turnQueue, currentActorIdx } = get()
        return turnQueue[currentActorIdx] ?? null
      },

      /** Advance to the next actor in the queue. */
      advanceTurn() {
        set((s) => {
          const next = s.currentActorIdx + 1
          const nextActor = s.turnQueue[next] ?? null
          return { currentActorIdx: next, currentActorId: nextActor?.id ?? null }
        })
      },

      /** Decrement effect durations for ONE entity and remove expired effects. */
      tickEntityEffects(entityId) {
        set((s) => {
          const existing = s.activeEffects[entityId]
          if (!existing?.length) return {}
          const alive = existing
            .map((e) => ({ ...e, ticks: e.ticks - 1 }))
            .filter((e) => e.ticks > 0)
          const next = { ...s.activeEffects }
          if (alive.length) {
            next[entityId] = alive
          } else {
            delete next[entityId]
          }
          return { activeEffects: next }
        })
      },

      /** Decrement cooldowns for ONE hero (called once per that hero's turn). */
      tickHeroCooldown(heroId) {
        set((s) => {
          const next = { ...s.cooldowns }
          for (const slot of ['skill', 'ultimate']) {
            const key = `${heroId}_${slot}`
            if ((next[key] ?? 0) > 0) {
              next[key] -= 1
              if (next[key] <= 0) delete next[key]
            }
          }
          return { cooldowns: next }
        })
      },

      /** Decrement all ability cooldowns for ONE enemy (called once per that enemy's turn). */
      tickEnemyCooldown(enemyId) {
        set((s) => {
          const prefix = `enemy_${enemyId}_`
          const next = { ...s.cooldowns }
          let changed = false
          for (const key of Object.keys(next)) {
            if (key.startsWith(prefix)) {
              next[key] -= 1
              changed = true
              if (next[key] <= 0) delete next[key]
            }
          }
          return changed ? { cooldowns: next } : {}
        })
      },

      setEnemyCooldown(enemyId, abilityType, turns) {
        set((s) => ({
          cooldowns: { ...s.cooldowns, [`enemy_${enemyId}_${abilityType}`]: turns },
        }))
      },

      isEnemyOnCooldown(enemyId, abilityType) {
        return (get().cooldowns[`enemy_${enemyId}_${abilityType}`] ?? 0) > 0
      },

      // ── Wipes ──────────────────────────────────────────────────────────

      incrementWipes() {
        set((s) => ({ consecutiveWipes: s.consecutiveWipes + 1 }))
      },

      resetWipes() {
        set({ consecutiveWipes: 0 })
      },

      // ── Enemies ────────────────────────────────────────────────────────

      damageEnemy(enemyId, amount) {
        set((s) => ({
          enemies: s.enemies.map((e) =>
            e.id === enemyId
              ? { ...e, currentHp: Math.max(0, e.currentHp - amount) }
              : e
          ),
        }))
      },

      healEnemy(enemyId, amount) {
        set((s) => ({
          enemies: s.enemies.map((e) =>
            e.id === enemyId
              ? { ...e, currentHp: Math.min(e.maxHp, e.currentHp + amount) }
              : e
          ),
        }))
      },

      getEnemy(id) {
        return get().enemies.find((e) => e.id === id) ?? null
      },

      /** Returns true only when there is at least one enemy and all are at 0 HP. */
      allEnemiesDead() {
        const enemies = get().enemies
        return enemies.length > 0 && enemies.every((e) => e.currentHp <= 0)
      },

      // ── Cooldowns ──────────────────────────────────────────────────────

      setCooldown(heroId, slot, turns) {
        set((s) => ({
          cooldowns: { ...s.cooldowns, [`${heroId}_${slot}`]: turns },
        }))
      },

      isOnCooldown(heroId, slot) {
        return (get().cooldowns[`${heroId}_${slot}`] ?? 0) > 0
      },

      // ── Effects ────────────────────────────────────────────────────────

      addEffect(targetId, effect) {
        set((s) => {
          const existing = s.activeEffects[targetId] ?? []
          return {
            activeEffects: {
              ...s.activeEffects,
              [targetId]: [...existing, { ...effect, id: ++_logId }],
            },
          }
        })
      },

      getEffects(targetId) {
        return get().activeEffects[targetId] ?? []
      },

      // ── Combat log ─────────────────────────────────────────────────────

      log(entry) {
        set((s) => ({
          combatLog: [
            ...s.combatLog.slice(-99),
            { ...entry, id: ++_logId, tick: s.tick },
          ],
        }))
      },

      clearLog() {
        set({ combatLog: [] })
      },

      // ── Tick counter ───────────────────────────────────────────────────

      incrementTick() {
        set((s) => ({ tick: s.tick + 1 }))
      },

      getStageClearTicks() {
        const { tick, stageStartTick } = get()
        return tick - stageStartTick
      },

      // ── Fight stat tracking ────────────────────────────────────────────

      recordFightDmg(heroId, amount) {
        if (!heroId || !(amount > 0)) return
        set((s) => {
          const prev = s.fightStats[heroId] ?? { dmgDealt: 0, healDone: 0 }
          return { fightStats: { ...s.fightStats, [heroId]: { ...prev, dmgDealt: prev.dmgDealt + amount } } }
        })
      },

      recordFightHeal(heroId, amount) {
        if (!heroId || !(amount > 0)) return
        set((s) => {
          const prev = s.fightStats[heroId] ?? { dmgDealt: 0, healDone: 0 }
          return { fightStats: { ...s.fightStats, [heroId]: { ...prev, healDone: prev.healDone + amount } } }
        })
      },

      // ── Selectors ──────────────────────────────────────────────────────

      getLivingEnemies() {
        return get().enemies.filter((e) => e.currentHp > 0)
      },

      getFirstLivingEnemy() {
        return get().enemies.find((e) => e.currentHp > 0) ?? null
      },
    }),
    { name: 'CombatStore' }
  )
)
