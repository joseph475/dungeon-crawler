import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'

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

export const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary']

export const RARITY_COLORS = {
  common: 'text-gray-400 border-gray-600',
  uncommon: 'text-green-400 border-green-600',
  rare: 'text-blue-400 border-blue-600',
  epic: 'text-purple-400 border-purple-600',
  legendary: 'text-yellow-400 border-yellow-500',
}

export const RARITY_BG = {
  common: 'bg-gray-800',
  uncommon: 'bg-green-950',
  rare: 'bg-blue-950',
  epic: 'bg-purple-950',
  legendary: 'bg-yellow-950',
}

// Gold received when selling an item: itemLevel × rarity multiplier
const SELL_PRICE_MULT = { common: 2, uncommon: 5, rare: 12, epic: 30, legendary: 75 }

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
          const { autoSellRarity } = get()
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

        /** Recalculate and push flat equipment bonus to game store. */
        _syncEquipmentBonus(heroId, gameStore) {
          const equipped = get().items.filter((i) => i.equippedBy === heroId)
          const bonus = {}
          equipped.forEach((item) => {
            Object.entries(item.stats ?? {}).forEach(([k, v]) => {
              bonus[k] = (bonus[k] ?? 0) + v
            })
          })
          gameStore?.setEquipmentBonus(heroId, bonus)
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
      }),
      {
        name: 'dungeon-inventory',
        partialize: (s) => ({ items: s.items, showPartyOnly: s.showPartyOnly, autoSellRarity: s.autoSellRarity }),
      }
    ),
    { name: 'InventoryStore' }
  )
)
