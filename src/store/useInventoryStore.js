import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import { computeSetBonus } from '@/data/itemSets'
import { craftReroll, craftUpgrade, craftFuse, calcRerollCost, calcUpgradeCost } from '@/utils/crafting'

/**
 * Item shape (as stored in inventory):
 * {
 *   uid: string,           unique instance id (crypto.randomUUID)
 *   id: string,            template id from items.js
 *   name: string,
 *   icon: string,
 *   slot: string,          'weapon'|'helmet'|'chest'|'gloves'|'boots'|'ring'|'amulet'|'relic'
 *   classLock: string,     classId this item is locked to
 *   rarity: string,        'common'|'uncommon'|'rare'|'epic'|'legendary'
 *   stats: object,         { atk, def, hp, ... }
 *   equippedBy: string|null   heroId or null
 * }
 */

export const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']

export const RARITY_COLORS = {
  common: 'text-gray-400 border-gray-600',
  uncommon: 'text-green-400 border-green-600',
  rare: 'text-blue-400 border-blue-600',
  epic: 'text-purple-400 border-purple-600',
  legendary: 'text-yellow-400 border-yellow-500',
  mythic: 'text-red-400 border-red-600',
}

export const RARITY_BG = {
  common: 'bg-gray-800',
  uncommon: 'bg-green-950',
  rare: 'bg-blue-950',
  epic: 'bg-purple-950',
  legendary: 'bg-yellow-950',
  mythic: 'bg-red-950',
}

// Gold received when selling an item: itemLevel × rarity multiplier
const SELL_PRICE_MULT = { common: 2, uncommon: 5, rare: 12, epic: 30, legendary: 75, mythic: 300 }

// Per-class stat weights for auto-equip scoring.
// crit/critDmg are decimals on items (e.g. 0.05 = 5%), so weights are scaled up.
// hp/mana are large integers so weights are scaled down.
const CLASS_STAT_WEIGHTS = {
  //                    hp     atk   def   spd   crit  critDmg mana  hpRegen manaRegen
  warrior:  { hp: 0.15, atk: 2.0, def: 3.0, spd: 2,  crit: 20, critDmg: 12, mana: 0.05, hpRegen: 0.8,  manaRegen: 0.1 },
  paladin:  { hp: 0.12, atk: 1.2, def: 2.5, spd: 3,  crit: 15, critDmg: 10, mana: 0.4,  hpRegen: 0.5,  manaRegen: 0.5 },
  mage:     { hp: 0.03, atk: 2.0, def: 0.3, spd: 6,  crit: 70, critDmg: 50, mana: 0.5,  hpRegen: 0.1,  manaRegen: 1.2 },
  healer:   { hp: 0.10, atk: 0.4, def: 0.8, spd: 6,  crit: 10, critDmg:  5, mana: 0.8,  hpRegen: 0.4,  manaRegen: 1.5 },
  assassin: { hp: 0.03, atk: 3.0, def: 0.4, spd: 5,  crit: 80, critDmg: 55, mana: 0.1,  hpRegen: 0.1,  manaRegen: 0.1 },
  rogue:    { hp: 0.03, atk: 2.5, def: 0.4, spd: 8,  crit: 70, critDmg: 40, mana: 0.1,  hpRegen: 0.1,  manaRegen: 0.1 },
  ranger:   { hp: 0.04, atk: 2.8, def: 0.5, spd: 5,  crit: 65, critDmg: 45, mana: 0.2,  hpRegen: 0.2,  manaRegen: 0.2 },
  shaman:   { hp: 0.05, atk: 2.5, def: 0.7, spd: 4,  crit: 45, critDmg: 30, mana: 0.45, hpRegen: 0.3,  manaRegen: 0.8 },
}
const DEFAULT_STAT_WEIGHT = { hp: 0.05, atk: 2, def: 1.5, spd: 5, crit: 50, critDmg: 30, mana: 0.2, hpRegen: 0.3, manaRegen: 0.3 }

export function itemPower(item, classId) {
  const weights = CLASS_STAT_WEIGHTS[classId] ?? DEFAULT_STAT_WEIGHT
  return Object.entries(item?.stats ?? {}).reduce((sum, [k, v]) => sum + v * (weights[k] ?? 1), 0)
}

export function calcSellPrice(item) {
  const mult = SELL_PRICE_MULT[item.rarity] ?? 2
  return Math.max(1, Math.floor((item.itemLevel ?? 1) * mult))
}

export const useInventoryStore = create(
  devtools(
    persist(
      (set, get) => ({
        // ── State ────────────────────────────────────────────────────────
        items: [],          // all items in inventory (including equipped)
        filters: {
          classId: null,    // null = show all
          rarity: null,     // null = show all
          slot: null,
        },
        showPartyOnly: true,        // hide items no party member can equip
        autoSellRarity: null,       // null = off | rarity string = auto-sell at/below this tier
        autoEquip: false,           // when true, auto-equip upgrades on drop
        skipSellConfirm: false,     // when true, sell without confirmation prompt

        // ── Actions: items ───────────────────────────────────────────────

        addItem(item) {
          set((s) => ({ items: [...s.items, { ...item, equippedBy: null }] }))
        },

        addItems(newItems) {
          set((s) => ({
            items: [
              ...s.items,
              ...newItems.map((item) => ({ ...item, equippedBy: null })),
            ],
          }))
        },

        /**
         * Add items, auto-selling any at/below the configured rarity threshold.
         * Returns { kept: Item[], sold: Item[], goldEarned: number }
         */
        addItemsWithAutoSell(newItems, gameStore) {
          const { autoSellRarity, autoEquip } = get()
          const thresholdIdx = autoSellRarity ? RARITY_ORDER.indexOf(autoSellRarity) : -1

          const toKeep = []
          const toSell = []

          newItems.forEach((item) => {
            const idx = RARITY_ORDER.indexOf(item.rarity)
            if (!item.locked && thresholdIdx >= 0 && idx <= thresholdIdx) {
              toSell.push(item)
            } else {
              toKeep.push(item)
            }
          })

          if (toKeep.length) {
            set((s) => ({
              items: [...s.items, ...toKeep.map((i) => ({ ...i, equippedBy: null }))],
            }))
          }

          let goldEarned = 0
          toSell.forEach((item) => { goldEarned += calcSellPrice(item) })
          if (goldEarned > 0) gameStore?.addGold(goldEarned)

          // Auto-equip upgrades from the newly kept items
          if (autoEquip && gameStore && toKeep.length) {
            get().autoEquipAll(gameStore)
          }

          return { kept: toKeep, sold: toSell, goldEarned }
        },

        removeItem(uid) {
          set((s) => ({ items: s.items.filter((i) => i.uid !== uid) }))
        },

        toggleLock(uid) {
          set((s) => ({
            items: s.items.map((i) => i.uid === uid ? { ...i, locked: !i.locked } : i)
          }))
        },

        sellItem(uid, gameStore) {
          const item = get().items.find((i) => i.uid === uid)
          if (!item || item.locked) return 0
          const price = calcSellPrice(item)
          set((s) => ({ items: s.items.filter((i) => i.uid !== uid) }))
          if (item.equippedBy) get()._syncEquipmentBonus(item.equippedBy, gameStore)
          gameStore?.addGold(price)
          return price
        },

        // ── Actions: equip ───────────────────────────────────────────────

        /**
         * Equip an item to a hero.
         * - Automatically unequips any existing item in that slot.
         * - Calls back into useGameStore to push equipment bonuses.
         * - Returns the unequipped item uid (or null).
         */
        equipItem(uid, heroId, gameStore) {
          let displaced = null
          set((s) => {
            const item = s.items.find((i) => i.uid === uid)
            if (!item) return {}

            const updatedItems = s.items.map((i) => {
              // unequip same-slot item from same hero
              if (i.equippedBy === heroId && i.slot === item.slot) {
                displaced = i.uid
                return { ...i, equippedBy: null }
              }
              // equip the new item
              if (i.uid === uid) return { ...i, equippedBy: heroId }
              return i
            })

            return { items: updatedItems }
          })

          // Sync equipment bonus back to game store
          get()._syncEquipmentBonus(heroId, gameStore)
          return displaced
        },

        unequipItem(uid, heroId, gameStore) {
          set((s) => ({
            items: s.items.map((i) =>
              i.uid === uid ? { ...i, equippedBy: null } : i
            ),
          }))
          get()._syncEquipmentBonus(heroId, gameStore)
        },

        /** Recalculate and push flat equipment bonus + set bonuses to game store. */
        _syncEquipmentBonus(heroId, gameStore) {
          const equipped = get().items.filter((i) => i.equippedBy === heroId)

          // Flat stat bonus from all equipped items
          const bonus = {}
          equipped.forEach((item) => {
            Object.entries(item.stats ?? {}).forEach(([k, v]) => {
              bonus[k] = (bonus[k] ?? 0) + v
            })
          })
          gameStore?.setEquipmentBonus(heroId, bonus)

          // Set bonus: count equipped pieces per setId, merge all active set bonuses
          const setCounts = {}
          equipped.forEach((i) => { if (i.setId) setCounts[i.setId] = (setCounts[i.setId] ?? 0) + 1 })

          const mergedMults = {}
          const mergedAdds  = {}
          Object.entries(setCounts).forEach(([setId, count]) => {
            const sb = computeSetBonus(setId, count)
            if (!sb) return
            Object.entries(sb.mults ?? {}).forEach(([k, v]) => { mergedMults[k] = (mergedMults[k] ?? 1) * v })
            Object.entries(sb.adds  ?? {}).forEach(([k, v]) => { mergedAdds[k]  = (mergedAdds[k]  ?? 0) + v })
          })

          const combinedSetBonus = (Object.keys(mergedMults).length || Object.keys(mergedAdds).length)
            ? { mults: mergedMults, adds: mergedAdds }
            : null
          gameStore?.setSetBonus(heroId, combinedSetBonus)
        },

        // ── Actions: filters & settings ──────────────────────────────────

        setFilter(key, value) {
          set((s) => ({ filters: { ...s.filters, [key]: value } }))
        },

        clearFilters() {
          set({ filters: { classId: null, rarity: null, slot: null } })
        },

        setShowPartyOnly(val) {
          set({ showPartyOnly: val })
        },

        setSkipSellConfirm(val) {
          set({ skipSellConfirm: val })
        },

        toggleAutoEquip() {
          set((s) => ({ autoEquip: !s.autoEquip }))
        },

        /**
         * Set the auto-sell threshold AND immediately sell all unequipped items
         * at or below that rarity from the current inventory.
         */
        resetInventory() {
          set({ items: [], filters: { classId: null, rarity: null, slot: null }, autoSellRarity: null })
        },

        setAutoSellRarity(rarity, gameStore) {
          const prevRarity = get().autoSellRarity
          set({ autoSellRarity: rarity })
          if (!rarity || !gameStore) return

          // Only immediately sell existing inventory items when the threshold is
          // being raised (first enable or moving up). Re-toggling the same level
          // or lowering it must NOT sell items — that would catch displaced items.
          const prevIdx = prevRarity ? RARITY_ORDER.indexOf(prevRarity) : -1
          const newIdx  = RARITY_ORDER.indexOf(rarity)
          if (newIdx <= prevIdx) return

          const { items } = get()
          const toSell = items.filter(
            (i) => !i.equippedBy && !i.locked && RARITY_ORDER.indexOf(i.rarity) <= newIdx
          )
          if (!toSell.length) return
          const goldEarned = toSell.reduce((s, i) => s + calcSellPrice(i), 0)
          const sellIds = new Set(toSell.map((i) => i.uid))
          set((s) => ({ items: s.items.filter((i) => !sellIds.has(i.uid)) }))
          gameStore.addGold(goldEarned)
        },

        // ── Actions: crafting ────────────────────────────────────────────

        /**
         * Reroll one random secondary stat.
         * Returns the rerolled stat key on success, null if insufficient gold or nothing to reroll.
         */
        craftRerollSubstat(uid, gameStore) {
          const item = get().items.find((i) => i.uid === uid)
          if (!item) return null
          const cost = calcRerollCost(item)
          if ((gameStore.gold ?? 0) < cost) return null
          const result = craftReroll(item)
          if (!result) return null
          gameStore.spendGold(cost)
          set((s) => ({
            items: s.items.map((i) => i.uid !== uid ? i : {
              ...i, stats: result.newStats, statRarities: result.newStatRarities,
            }),
          }))
          if (item.equippedBy) get()._syncEquipmentBonus(item.equippedBy, gameStore)
          return result.rerolledKey
        },

        /**
         * Upgrade item level by 1, scaling all stats proportionally.
         * Returns true on success, false if insufficient gold or item is mythic.
         */
        craftUpgradeItemLevel(uid, gameStore) {
          const item = get().items.find((i) => i.uid === uid)
          if (!item || item.rarity === 'mythic') return false
          const cost = calcUpgradeCost(item)
          if ((gameStore.gold ?? 0) < cost) return false
          const result = craftUpgrade(item)
          gameStore.spendGold(cost)
          set((s) => ({
            items: s.items.map((i) => i.uid !== uid ? i : {
              ...i, itemLevel: result.newItemLevel, stats: result.newStats,
            }),
          }))
          if (item.equippedBy) get()._syncEquipmentBonus(item.equippedBy, gameStore)
          return true
        },

        /**
         * Fuse 3 items of same rarity into 1 item of the next rarity tier.
         * Returns the new item on success, null on failure.
         */
        craftFuseItems(uids, gameStore) {
          if (uids.length !== 3) return null
          const items = uids.map((uid) => get().items.find((i) => i.uid === uid)).filter(Boolean)
          const newItem = craftFuse(items)
          if (!newItem) return null
          const uidSet = new Set(uids)
          const affectedHeroes = new Set(items.filter((i) => i.equippedBy).map((i) => i.equippedBy))
          set((s) => ({
            items: [...s.items.filter((i) => !uidSet.has(i.uid)), { ...newItem, equippedBy: null }],
          }))
          affectedHeroes.forEach((heroId) => get()._syncEquipmentBonus(heroId, gameStore))
          return newItem
        },

        // ── Selectors ────────────────────────────────────────────────────

        getFilteredItems() {
          const { items, filters } = get()
          return items.filter((item) => {
            if (filters.classId && item.classLock !== filters.classId) return false
            if (filters.rarity && item.rarity !== filters.rarity) return false
            if (filters.slot && item.slot !== filters.slot) return false
            return true
          })
        },

        getEquippedItems(heroId) {
          return get().items.filter((i) => i.equippedBy === heroId)
        },

        getItemInSlot(heroId, slot) {
          return get().items.find((i) => i.equippedBy === heroId && i.slot === slot) ?? null
        },

        getUnequippedItems() {
          return get().items.filter((i) => !i.equippedBy)
        },

        /**
         * Bulk-salvage all unequipped, unlocked items (or filtered by max rarity index).
         * Returns total gold earned.
         */
        salvageAll(gameStore, maxRarityIdx = Infinity) {
          const toSell = get().items.filter(
            (i) => !i.equippedBy && !i.locked &&
            RARITY_ORDER.indexOf(i.rarity) <= maxRarityIdx
          )
          if (!toSell.length) return 0
          const gold = toSell.reduce((s, i) => s + calcSellPrice(i), 0)
          const ids = new Set(toSell.map((i) => i.uid))
          set((s) => ({ items: s.items.filter((i) => !ids.has(i.uid)) }))
          gameStore?.addGold(gold)
          return gold
        },

        /**
         * Auto-equip the best available item per slot per party hero.
         * Uses gain-first assignment: collect all (hero, slot, item) upgrade candidates,
         * sort by power gain descending, then assign greedily so unbound items go to
         * whoever benefits most — not just whoever is first in party order.
         */
        autoEquipAll(gameStore) {
          const SLOTS = ['weapon','helmet','chest','gloves','boots','ring','amulet','relic']
          const party = gameStore.getParty?.() ?? []
          if (!party.length) return

          // Collect every possible upgrade across all heroes × slots × unequipped items
          const candidates = []
          party.forEach((hero) => {
            const cls = hero.classId
            SLOTS.forEach((slot) => {
              const current     = get().getItemInSlot(hero.id, slot)
              const currentPow  = current ? itemPower(current, cls) : 0
              get().items
                .filter((i) => !i.equippedBy && i.slot === slot && (!i.classLock || i.classLock === cls))
                .forEach((item) => {
                  const gain = itemPower(item, cls) - currentPow
                  if (gain > 0) candidates.push({ hero, slot, item, gain })
                })
            })
          })

          // Sort best gain first so unbound items go to the hero that benefits most
          candidates.sort((a, b) => b.gain - a.gain)

          // Greedily assign — skip if item or (hero, slot) already claimed
          const usedItems = new Set()
          const usedSlots = new Set()
          for (const { hero, slot, item } of candidates) {
            const slotKey = `${hero.id}_${slot}`
            if (usedItems.has(item.uid) || usedSlots.has(slotKey)) continue
            get().equipItem(item.uid, hero.id, gameStore)
            usedItems.add(item.uid)
            usedSlots.add(slotKey)
          }
        },
      }),
      {
        name: 'dungeon-inventory',
        partialize: (s) => ({ items: s.items, showPartyOnly: s.showPartyOnly, autoSellRarity: s.autoSellRarity, autoEquip: s.autoEquip, skipSellConfirm: s.skipSellConfirm }),
      }
    ),
    { name: 'InventoryStore' }
  )
)
