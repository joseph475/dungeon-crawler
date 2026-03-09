import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import { getStatsAtLevel, CLASSES } from '@/data/classes'
import { JOBS } from '@/data/jobs'

// ─── Hero factory ─────────────────────────────────────────────────────────────

let _heroIdCounter = 0

const DEFAULT_NAMES = {
  warrior: 'Gareth',
  paladin: 'Seraphine',
  mage: 'Zara',
  healer: 'Lyria',
  assassin: 'Vex',
  rogue: 'Kael',
  ranger: 'Theron',
  shaman: 'Oryn',
}

export function createHero(classId, name) {
  const id = `hero_${++_heroIdCounter}_${Date.now()}`
  const stats = getStatsAtLevel(classId, 1)
  return {
    id,
    name: name ?? DEFAULT_NAMES[classId] ?? 'Hero',
    classId,
    jobId: null,   // null = base class; set on advancement
    jobTier: 0,    // 0 = base, 1 / 2 / 3 after each advancement
    level: 1,
    xp: 0,
    // combat live values
    currentHp: stats.hp,
    currentMana: 0,
    isDead: false,
    // gear slots → item uid or null
    equipment: {
      weapon: null,
      helmet: null,
      chest: null,
      gloves: null,
      boots: null,
      ring: null,
      amulet: null,
      relic: null,
    },
    // flat bonuses from equipped items (recalculated in useInventoryStore)
    equipmentBonus: {},
  }
}

// ─── XP curve ────────────────────────────────────────────────────────────────

export function xpToNextLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.6))
}

// ─── Stat resolver (pure, exported for use in combat/UI) ─────────────────────

export function resolveHeroStats(hero) {
  if (!hero) return null
  const base = getStatsAtLevel(hero.classId, hero.level)

  // Accumulate job stat bonuses for the full job path
  const jobBonus = {}
  if (hero.jobId) {
    let job = JOBS[hero.jobId]
    const path = []
    while (job) {
      path.unshift(job)
      job = job.parent ? JOBS[job.parent] : null
    }
    path.forEach(({ statBonus }) => {
      Object.entries(statBonus ?? {}).forEach(([k, v]) => {
        jobBonus[k] = (jobBonus[k] ?? 0) + v
      })
    })
  }

  const eq = hero.equipmentBonus ?? {}
  const merged = {}
  const keys = new Set([...Object.keys(base), ...Object.keys(jobBonus), ...Object.keys(eq)])
  keys.forEach((k) => {
    merged[k] = (base[k] ?? 0) + (jobBonus[k] ?? 0) + (eq[k] ?? 0)
  })
  merged.maxHp = merged.hp
  merged.maxMana = merged.mana
  return merged
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = create(
  devtools(
    persist(
      (set, get) => ({
        // ── Party setup ──────────────────────────────────────────────────
        gameStarted: false,
        heroes: {},       // Record<heroId, heroObject>
        partyIds: [],     // ordered array of 4 hero ids

        // ── Economy / progression ────────────────────────────────────────
        gold: 0,
        currentStage: 1,
        highestStage: 1,
        autoAdvance: true,
        gameSpeed: 3,     // 1 = slow, 2 = medium, 3 = fast
        totalRunTime: 0,  // seconds elapsed

        // ── Actions: setup ───────────────────────────────────────────────

        startGame(classIds) {
          const heroes = {}
          const partyIds = classIds.slice(0, 4).map((classId) => {
            const hero = createHero(classId)
            heroes[hero.id] = hero
            return hero.id
          })
          set({ gameStarted: true, heroes, partyIds })
        },

        resetGame() {
          set({
            gameStarted: false,
            heroes: {},
            partyIds: [],
            gold: 0,
            currentStage: 1,
            highestStage: 1,
            autoAdvance: true,
            gameSpeed: 3,
            totalRunTime: 0,
          })
        },

        // ── Actions: hero HP / mana ──────────────────────────────────────

        /** Reset all party members to full HP and 0 mana before a new fight. */
        resetPartyForCombat() {
          set((s) => {
            const heroes = { ...s.heroes }
            s.partyIds.forEach((id) => {
              const hero = heroes[id]
              if (!hero) return
              const stats = resolveHeroStats(hero)
              heroes[id] = { ...hero, currentHp: stats.maxHp, currentMana: 0, isDead: false }
            })
            return { heroes }
          })
        },

        modifyHeroHp(heroId, delta) {
          set((s) => {
            const hero = s.heroes[heroId]
            if (!hero) return {}
            const stats = resolveHeroStats(hero)
            const newHp = Math.min(stats.maxHp, Math.max(0, hero.currentHp + delta))
            return {
              heroes: {
                ...s.heroes,
                [heroId]: { ...hero, currentHp: newHp, isDead: newHp <= 0 },
              },
            }
          })
        },

        modifyHeroMana(heroId, delta) {
          set((s) => {
            const hero = s.heroes[heroId]
            if (!hero) return {}
            const stats = resolveHeroStats(hero)
            const newMana = Math.min(stats.maxMana, Math.max(0, hero.currentMana + delta))
            return {
              heroes: {
                ...s.heroes,
                [heroId]: { ...hero, currentMana: newMana },
              },
            }
          })
        },

        reviveHero(heroId, hpPercent = 0.4) {
          set((s) => {
            const hero = s.heroes[heroId]
            if (!hero) return {}
            const stats = resolveHeroStats(hero)
            return {
              heroes: {
                ...s.heroes,
                [heroId]: {
                  ...hero,
                  currentHp: Math.floor(stats.maxHp * hpPercent),
                  isDead: false,
                },
              },
            }
          })
        },

        // ── Actions: XP / leveling ───────────────────────────────────────

        grantXp(heroId, amount) {
          set((s) => {
            const hero = s.heroes[heroId]
            if (!hero || hero.isDead) return {}

            let { level, xp } = hero
            xp += amount
            let didLevel = false

            while (xp >= xpToNextLevel(level + 1) && level < 100) {
              xp -= xpToNextLevel(level + 1)
              level += 1
              didLevel = true
            }

            const patch = { level, xp }
            if (didLevel) {
              const stats = getStatsAtLevel(hero.classId, level)
              patch.currentHp = stats.hp  // full heal on level-up
            }

            return {
              heroes: {
                ...s.heroes,
                [heroId]: { ...hero, ...patch },
              },
            }
          })
        },

        // ── Actions: job advancement ─────────────────────────────────────

        advanceJob(heroId, jobId) {
          set((s) => {
            const hero = s.heroes[heroId]
            if (!hero) return {}
            const job = JOBS[jobId]
            if (!job) return {}
            return {
              heroes: {
                ...s.heroes,
                [heroId]: { ...hero, jobId, jobTier: job.tier },
              },
            }
          })
        },

        // ── Actions: equipment ───────────────────────────────────────────

        /** Equip item uid to a hero slot. Returns displaced uid (or null). */
        equipItem(heroId, itemUid, slot) {
          let displaced = null
          set((s) => {
            const hero = s.heroes[heroId]
            if (!hero) return {}
            displaced = hero.equipment[slot]
            return {
              heroes: {
                ...s.heroes,
                [heroId]: {
                  ...hero,
                  equipment: { ...hero.equipment, [slot]: itemUid },
                },
              },
            }
          })
          return displaced
        },

        unequipItem(heroId, slot) {
          let uid = null
          set((s) => {
            const hero = s.heroes[heroId]
            if (!hero) return {}
            uid = hero.equipment[slot]
            return {
              heroes: {
                ...s.heroes,
                [heroId]: {
                  ...hero,
                  equipment: { ...hero.equipment, [slot]: null },
                },
              },
            }
          })
          return uid
        },

        /** Called by inventory store after equip changes to push stat bonuses. */
        setEquipmentBonus(heroId, bonus) {
          set((s) => {
            const hero = s.heroes[heroId]
            if (!hero) return {}
            return {
              heroes: {
                ...s.heroes,
                [heroId]: { ...hero, equipmentBonus: bonus },
              },
            }
          })
        },

        // ── Actions: stage ───────────────────────────────────────────────

        advanceStage() {
          set((s) => {
            const next = s.currentStage + 1
            return {
              currentStage: next,
              highestStage: Math.max(s.highestStage, next),
            }
          })
        },

        retreatToHighest() {
          set((s) => ({ currentStage: s.highestStage }))
        },

        setStage(stage) {
          set({ currentStage: stage })
        },

        toggleAutoAdvance() {
          set((s) => ({ autoAdvance: !s.autoAdvance }))
        },

        disableAutoAdvance() {
          set({ autoAdvance: false })
        },

        setGameSpeed(speed) {
          set({ gameSpeed: speed })
        },

        // ── Actions: roster ───────────────────────────────────────────────

        recruitHero(classId) {
          const hero = createHero(classId)
          set((s) => ({ heroes: { ...s.heroes, [hero.id]: hero } }))
          return hero.id
        },

        swapHero(partyHeroId, benchHeroId) {
          set((s) => {
            const partyIds = s.partyIds.map((id) =>
              id === partyHeroId ? benchHeroId : id
            )
            return { partyIds }
          })
        },

        // ── Actions: economy ─────────────────────────────────────────────

        addGold(amount) {
          set((s) => ({ gold: s.gold + amount }))
        },

        spendGold(amount) {
          set((s) => ({ gold: Math.max(0, s.gold - amount) }))
        },

        tickRunTime() {
          set((s) => ({ totalRunTime: s.totalRunTime + 1 }))
        },

        // ── Selectors (call directly, not reactive) ───────────────────────

        getParty() {
          const { heroes, partyIds } = get()
          return partyIds.map((id) => heroes[id]).filter(Boolean)
        },

        getLivingParty() {
          return get().getParty().filter((h) => !h.isDead)
        },

        getHeroStats(heroId) {
          return resolveHeroStats(get().heroes[heroId])
        },
      }),
      {
        name: 'dungeon-game',
        partialize: (s) => ({
          gameStarted: s.gameStarted,
          heroes: s.heroes,
          partyIds: s.partyIds,
          gold: s.gold,
          currentStage: s.currentStage,
          highestStage: s.highestStage,
          autoAdvance: s.autoAdvance,
          totalRunTime: s.totalRunTime,
        }),
      }
    ),
    { name: 'GameStore' }
  )
)
