import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

/**
 * Combat state — intentionally NOT persisted.
 * A fresh combat starts each session / after every wipe.
 *
 * Enemy shape:
 * {
 *   id: string,
 *   name: string,
 *   icon: string,
 *   maxHp: number,
 *   currentHp: number,
 *   atk: number,
 *   def: number,
 *   spd: number,
 *   isBoss: boolean,
 * }
 *
 * Log entry shape:
 * {
 *   id: number,           auto-incrementing
 *   tick: number,         game tick this happened on
 *   type: 'hit'|'skill'|'ult'|'heal'|'death'|'stage'|'system',
 *   text: string,
 *   actorId: string,      heroId or enemyId
 *   value: number|null,   damage or heal amount
 *   isCrit: boolean,
 * }
 */

let _logId = 0

export const useCombatStore = create(
  devtools(
    (set, get) => ({
      // ── State ──────────────────────────────────────────────────────────
      phase: 'idle',        // 'idle' | 'fighting' | 'victory' | 'defeat' | 'advancing'
      enemies: [],          // array of enemy objects for current fight
      combatLog: [],        // last N log entries
      tick: 0,              // current game tick counter
      stageStartTick: 0,    // tick when this stage started (for clear-time tracking)
      consecutiveWipes: 0,  // wipes on the same stage in a row

      // Skill cooldown tracking: { [heroId_slot]: ticksRemaining }
      cooldowns: {},

      // Active buffs/debuffs: { [targetId]: [ { stat, multiplier, ticks, id } ] }
      activeEffects: {},

      // ── Actions: lifecycle ─────────────────────────────────────────────

      incrementWipes() {
        set((s) => ({ consecutiveWipes: s.consecutiveWipes + 1 }))
      },

      resetWipes() {
        set({ consecutiveWipes: 0 })
      },

      startFight(enemies) {
        set((s) => ({
          phase: 'fighting',
          enemies: enemies.map((e) => ({ ...e, currentHp: e.maxHp })),
          cooldowns: {},
          activeEffects: {},
          stageStartTick: s.tick,
        }))
      },

      setPhase(phase) {
        set((s) => ({ phase, stageStartTick: s.tick }))
      },

      // ── Actions: enemies ───────────────────────────────────────────────

      damageEnemy(enemyId, amount) {
        set((s) => ({
          enemies: s.enemies.map((e) =>
            e.id === enemyId
              ? { ...e, currentHp: Math.max(0, e.currentHp - amount) }
              : e
          ),
        }))
      },

      /** Returns true if all enemies are at 0 HP (and there is at least one). */
      allEnemiesDead() {
        const enemies = get().enemies
        return enemies.length > 0 && enemies.every((e) => e.currentHp <= 0)
      },

      // ── Actions: cooldowns ─────────────────────────────────────────────

      setCooldown(heroId, slot, ticks) {
        set((s) => ({
          cooldowns: { ...s.cooldowns, [`${heroId}_${slot}`]: ticks },
        }))
      },

      /** Decrement all cooldowns by 1 each tick. */
      tickCooldowns() {
        set((s) => {
          const next = {}
          Object.entries(s.cooldowns).forEach(([k, v]) => {
            if (v > 1) next[k] = v - 1
            // drops to 0 = expired, so we omit it
          })
          return { cooldowns: next }
        })
      },

      isOnCooldown(heroId, slot) {
        return (get().cooldowns[`${heroId}_${slot}`] ?? 0) > 0
      },

      // ── Actions: effects ───────────────────────────────────────────────

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

      /** Decrement effect durations and remove expired ones each tick. */
      tickEffects() {
        set((s) => {
          const next = {}
          Object.entries(s.activeEffects).forEach(([targetId, effects]) => {
            const alive = effects
              .map((e) => ({ ...e, ticks: e.ticks - 1 }))
              .filter((e) => e.ticks > 0)
            if (alive.length > 0) next[targetId] = alive
          })
          return { activeEffects: next }
        })
      },

      getEffects(targetId) {
        return get().activeEffects[targetId] ?? []
      },

      // ── Actions: combat log ────────────────────────────────────────────

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

      // ── Actions: tick ──────────────────────────────────────────────────

      incrementTick() {
        set((s) => ({ tick: s.tick + 1 }))
      },

      // ── Selectors ─────────────────────────────────────────────────────

      getLivingEnemies() {
        return get().enemies.filter((e) => e.currentHp > 0)
      },

      getFirstLivingEnemy() {
        return get().enemies.find((e) => e.currentHp > 0) ?? null
      },

      getStageClearTicks() {
        const { tick, stageStartTick } = get()
        return tick - stageStartTick
      },
    }),
    { name: 'CombatStore' }
  )
)
