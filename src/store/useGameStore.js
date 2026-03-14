import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import { getStatsAtLevel } from '@/data/classes'
import { JOBS } from '@/data/jobs'
import { getSkillRank, getUpgradeCost, MAX_RANK } from '@/utils/skillRank'
import { ACHIEVEMENTS, getAchievementBonus } from '@/data/achievements'


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
    // multiplicative/additive set bonuses pushed by inventory store
    setBonus: null,   // { mults: {...}, adds: {...} } | null
    // skill ranks: { [skillId]: rank 1–5 }
    skillRanks: {},
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

  // Apply item set bonuses (pushed by inventory store when equip changes)
  const sb = hero.setBonus
  if (sb) {
    Object.entries(sb.mults ?? {}).forEach(([k, mult]) => {
      if (merged[k] != null) merged[k] = merged[k] * mult
    })
    Object.entries(sb.adds ?? {}).forEach(([k, add]) => {
      if (merged[k] != null) merged[k] = merged[k] + add
    })
  }

  merged.maxHp = merged.hp
  merged.maxMana = merged.mana
  return merged
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = create(
  devtools(
    persist(
      (set, get) => ({
        // ── Achievements ─────────────────────────────────────────────────
        unlockedAchievements: {},  // { [achievementId]: { unlockedAt: timestamp } }

        // ── Stage speed records (best clear time per stage in ticks) ─────
        stageRecords: {},   // { [stage]: ticks }

        // ── Lifetime stats (never reset, survive prestige) ───────────────
        lifetimeStats: {
          damage:     0,
          healing:    0,
          kills:      0,
          clears:     0,
          goldEarned: 0,
          itemsFound: 0,
        },

        // ── Prestige ─────────────────────────────────────────────────────
        prestigeCount: 0,   // persisted across resets

        // ── Party setup ──────────────────────────────────────────────────
        gameStarted: false,
        heroes: {},       // Record<heroId, heroObject>
        partyIds: [],     // ordered array of 4 hero ids
        heroFormation: {}, // Record<heroId, 'front'|'back'> — default: pos 0-1 front, 2-3 back

        // ── Economy / progression ────────────────────────────────────────
        gold: 0,
        skillShards: 0,
        currentStage: 1,
        highestStage: 1,
        autoAdvance: true,
        retreatOnFirstDeath: false, // if true, retreat immediately when any hero dies
        gameSpeed: 3,     // 1 = slow, 2 = medium, 3 = fast
        totalRunTime: 0,  // seconds elapsed
        clearedBossStages: [],  // stage numbers first-cleared boss stages
        clearedStages: [],      // ALL stages cleared at least once (for first-clear chest)

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
            skillShards: 0,
            currentStage: 1,
            highestStage: 1,
            autoAdvance: true,
            retreatOnFirstDeath: false,
            gameSpeed: 3,
            totalRunTime: 0,
            clearedBossStages: [],
            clearedStages: [],
          })
        },

        markBossCleared(stage) {
          set((s) => {
            if (s.clearedBossStages.includes(stage)) return {}
            return { clearedBossStages: [...s.clearedBossStages, stage] }
          })
        },

        markStageCleared(stage) {
          set((s) => {
            if (s.clearedStages.includes(stage)) return {}
            return { clearedStages: [...s.clearedStages, stage] }
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

            while (xp >= xpToNextLevel(level + 1) && level < 999) {
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

        /** Called by inventory store to push set bonus multipliers/additives. */
        setSetBonus(heroId, setBonus) {
          set((s) => {
            const hero = s.heroes[heroId]
            if (!hero) return {}
            return {
              heroes: {
                ...s.heroes,
                [heroId]: { ...hero, setBonus },
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

        toggleRetreatOnFirstDeath() {
          set((s) => ({ retreatOnFirstDeath: !s.retreatOnFirstDeath }))
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

        /** Move a party hero one slot up (-1) or down (+1). */
        reorderHero(heroId, direction) {
          set((s) => {
            const ids = [...s.partyIds]
            const idx = ids.indexOf(heroId)
            if (idx === -1) return {}
            const next = idx + direction
            if (next < 0 || next >= ids.length) return {}
            ;[ids[idx], ids[next]] = [ids[next], ids[idx]]
            return { partyIds: ids }
          })
        },

        /** Swap two party heroes by their IDs (for drag-and-drop reorder). */
        setHeroFormation(heroId, row) {
          set((s) => ({ heroFormation: { ...s.heroFormation, [heroId]: row } }))
        },

        swapPartyPositions(heroIdA, heroIdB) {
          set((s) => {
            const ids = [...s.partyIds]
            const a = ids.indexOf(heroIdA)
            const b = ids.indexOf(heroIdB)
            if (a === -1 || b === -1 || a === b) return {}
            ;[ids[a], ids[b]] = [ids[b], ids[a]]
            return { partyIds: ids }
          })
        },

        // ── Actions: economy ─────────────────────────────────────────────

        addGold(amount) {
          set((s) => ({ gold: (s.gold || 0) + (amount || 0) }))
        },

        spendGold(amount) {
          set((s) => ({ gold: Math.max(0, (s.gold ?? 0) - (amount ?? 0)) }))
        },

        addShards(amount) {
          set((s) => ({ skillShards: (s.skillShards ?? 0) + amount }))
        },

        /** Spend shards to increment a hero's skill rank by 1. Returns true on success. */
        upgradeSkill(heroId, skillId) {
          const s = get()
          const hero = s.heroes[heroId]
          if (!hero) return false
          const currentRank = getSkillRank(hero, skillId)
          const cost = getUpgradeCost(currentRank)
          if (cost === null) return false          // already max rank
          if ((s.skillShards ?? 0) < cost) return false  // can't afford
          set((state) => ({
            skillShards: (state.skillShards ?? 0) - cost,
            heroes: {
              ...state.heroes,
              [heroId]: {
                ...state.heroes[heroId],
                skillRanks: {
                  ...(state.heroes[heroId].skillRanks ?? {}),
                  [skillId]: Math.min(MAX_RANK, currentRank + 1),
                },
              },
            },
          }))
          return true
        },

        tickRunTime() {
          set((s) => ({ totalRunTime: s.totalRunTime + 1 }))
        },

        /**
         * Check all achievements against current stats/state.
         * Unlocks any newly met ones and returns their ids.
         */
        checkAchievements() {
          const s = get()
          const ls = s.lifetimeStats
          const newlyUnlocked = {}

          ACHIEVEMENTS.forEach((a) => {
            if (s.unlockedAchievements[a.id]) return
            const { stat, threshold } = a.condition
            let value = 0
            if (stat === 'kills')        value = ls.kills       ?? 0
            if (stat === 'clears')       value = ls.clears      ?? 0
            if (stat === 'goldEarned')   value = ls.goldEarned  ?? 0
            if (stat === 'itemsFound')   value = ls.itemsFound  ?? 0
            if (stat === 'highestStage') value = s.highestStage ?? 0
            if (value >= threshold) {
              newlyUnlocked[a.id] = { unlockedAt: Date.now() }
            }
          })

          if (Object.keys(newlyUnlocked).length > 0) {
            set((state) => ({
              unlockedAchievements: { ...state.unlockedAchievements, ...newlyUnlocked },
            }))
          }
          return Object.keys(newlyUnlocked)
        },

        getAchievementBonus() {
          return getAchievementBonus(get().unlockedAchievements)
        },

        recordStageSpeed(stage, ticks) {
          set((s) => {
            const prev = s.stageRecords[stage]
            if (prev !== undefined && prev <= ticks) return {}
            return { stageRecords: { ...s.stageRecords, [stage]: ticks } }
          })
        },

        addLifetimeStats(delta) {
          set((s) => ({
            lifetimeStats: {
              damage:     (s.lifetimeStats.damage     ?? 0) + (delta.damage     ?? 0),
              healing:    (s.lifetimeStats.healing    ?? 0) + (delta.healing    ?? 0),
              kills:      (s.lifetimeStats.kills      ?? 0) + (delta.kills      ?? 0),
              clears:     (s.lifetimeStats.clears     ?? 0) + (delta.clears     ?? 0),
              goldEarned: (s.lifetimeStats.goldEarned ?? 0) + (delta.goldEarned ?? 0),
              itemsFound: (s.lifetimeStats.itemsFound ?? 0) + (delta.itemsFound ?? 0),
            },
          }))
        },

        // ── Actions: prestige ─────────────────────────────────────────────

        /** Returns the prestige bonus object based on current prestigeCount. Pure. */
        getPrestigeBonus() {
          const count = get().prestigeCount
          return {
            goldMult: 1 + count * 0.05,   // +5% gold per prestige
            xpMult:   1 + count * 0.05,   // +5% XP per prestige
            atkPct:   count * 0.03,        // +3% ATK per prestige (applied as combat buff)
          }
        },

        canPrestige() {
          const { highestStage, prestigeCount } = get()
          const required = 25 + prestigeCount * 10
          return highestStage >= required && prestigeCount < 10
        },

        /**
         * Perform prestige: increment prestigeCount and reset all game progress.
         * Inventory reset must be triggered separately by the calling component.
         */
        prestige() {
          const next = get().prestigeCount + 1
          set({
            prestigeCount: next,
            gameStarted: false,
            heroes: {},
            partyIds: [],
            gold: 0,
            skillShards: 0,
            currentStage: 1,
            highestStage: 1,
            autoAdvance: true,
            retreatOnFirstDeath: false,
            gameSpeed: 3,
            totalRunTime: 0,
            clearedBossStages: [],
            clearedStages: [],
            heroFormation: {},
          })
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
          unlockedAchievements: s.unlockedAchievements,
          stageRecords:  s.stageRecords,
          lifetimeStats: s.lifetimeStats,
          prestigeCount: s.prestigeCount,
          gameStarted: s.gameStarted,
          heroes: s.heroes,
          partyIds: s.partyIds,
          gold: s.gold,
          skillShards: s.skillShards,
          currentStage: s.currentStage,
          highestStage: s.highestStage,
          autoAdvance: s.autoAdvance,
          retreatOnFirstDeath: s.retreatOnFirstDeath,
          heroFormation: s.heroFormation,
          gameSpeed: s.gameSpeed,
          totalRunTime: s.totalRunTime,
          clearedBossStages: s.clearedBossStages,
          clearedStages: s.clearedStages,
        }),
      }
    ),
    { name: 'GameStore' }
  )
)
