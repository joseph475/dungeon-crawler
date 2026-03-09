import { useState } from 'react'
import { useInventoryStore, RARITY_COLORS, RARITY_BG, RARITY_ORDER, calcSellPrice } from '@/store/useInventoryStore'
import { useGameStore } from '@/store/useGameStore'
import { CLASSES } from '@/data/classes'
import { JOBS } from '@/data/jobs'
import { RARITY_STAT_COLOR, RARITY_SECONDARY_COLOR } from '@/data/items'

const ITEMS_PER_PAGE = 12

// ─── Stat formatting ──────────────────────────────────────────────────────────

const PERCENT_STATS = new Set(['crit', 'critDmg'])

function formatStatValue(key, value) {
  if (PERCENT_STATS.has(key)) return `${(value * 100).toFixed(1)}%`
  if (key === 'spd') return value.toFixed(1)
  return Math.floor(value)
}

// ─── Item stat list ───────────────────────────────────────────────────────────

function StatList({ stats, mainStat, statRarities, fallbackRarity }) {
  return (
    <div className="flex flex-col gap-0.5 mt-1">
      {Object.entries(stats ?? {}).map(([k, v]) => {
        const isMain   = k === mainStat
        const statRar  = statRarities?.[k] ?? fallbackRarity
        const color    = isMain
          ? (RARITY_STAT_COLOR[statRar] ?? 'text-gray-300')
          : (RARITY_SECONDARY_COLOR[statRar] ?? 'text-gray-500')
        return (
          <span key={k} className={`text-[10px] ${color} ${isMain ? 'font-semibold' : ''}`}>
            +{formatStatValue(k, v)} {k.toUpperCase()}
            {isMain && <span className="text-[9px] ml-1 opacity-60">(main)</span>}
          </span>
        )
      })}
    </div>
  )
}

// ─── Item card ────────────────────────────────────────────────────────────────

function ItemCard({ item, onEquip, onSell, onToggleLock }) {
  const rarityColor = RARITY_COLORS[item.rarity] ?? 'text-gray-400 border-gray-600'
  const rarityBg    = RARITY_BG[item.rarity] ?? 'bg-gray-800'
  const cls = CLASSES[item.classLock]
  const isEquipped = !!item.equippedBy
  const sellPrice  = calcSellPrice(item)

  return (
    <div
      className={`
        relative rounded-md border p-2 flex flex-col gap-1 cursor-default
        transition-colors hover:brightness-110
        ${rarityColor} ${rarityBg}
        ${isEquipped ? 'ring-1 ring-amber-600/50' : ''}
      `}
    >
      {/* Icon + name */}
      <div className="flex items-center gap-1.5">
        <span className="text-lg leading-none">{item.icon}</span>
        <div className="flex-1 min-w-0">
          <div className={`text-[11px] font-semibold truncate ${rarityColor.split(' ')[0]}`}>
            {item.name}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
            <span className="capitalize">{item.slot}</span>
            {item.itemLevel && (
              <span className="text-gray-700">· iLv {item.itemLevel}</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <StatList stats={item.stats} mainStat={item.mainStat} statRarities={item.statRarities} fallbackRarity={item.rarity} />

      {/* Legendary trait */}
      {item.trait && (
        <div className="text-[10px] text-yellow-400 font-semibold mt-0.5">
          ✦ {item.trait.label}
        </div>
      )}

      {/* Class lock + rarity */}
      <div className="flex items-center justify-between mt-1">
        {cls ? (
          <span className="text-[10px] text-gray-600">{cls.icon} {cls.name} only</span>
        ) : (
          <span />
        )}
        <span className={`text-[9px] uppercase tracking-wider font-bold ${rarityColor.split(' ')[0]}`}>
          {item.rarity}
        </span>
      </div>

      {/* Actions */}
      {isEquipped ? (
        <div className="mt-1 w-full text-[10px] py-0.5 text-center text-amber-600">
          Equipped
        </div>
      ) : (
        <div className="mt-1 flex gap-1">
          {onEquip && (
            <button
              onClick={() => onEquip(item)}
              className="flex-1 text-[10px] py-0.5 rounded border border-gray-700 text-gray-400 hover:border-amber-700/60 hover:text-amber-400 transition-colors"
            >
              Equip
            </button>
          )}
          <button
            onClick={() => onToggleLock(item)}
            className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
              item.locked
                ? 'border-yellow-700/60 text-yellow-400'
                : 'border-gray-700 text-gray-600 hover:border-yellow-700/40 hover:text-yellow-600'
            }`}
            title={item.locked ? 'Unlock item' : 'Lock item (prevents selling)'}
          >
            {item.locked ? '🔒' : '🔓'}
          </button>
          {onSell && !item.locked && (
            <button
              onClick={() => onSell(item)}
              className="text-[10px] px-1.5 py-0.5 rounded border border-gray-700 text-gray-600 hover:border-red-800/60 hover:text-red-400 transition-colors"
              title={`Sell for ${sellPrice}g`}
            >
              {sellPrice}g
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Item power (weighted stat sum for downgrade detection) ───────────────────

const STAT_WEIGHT = { atk: 2, def: 1.5, hp: 0.05, spd: 5, crit: 50, critDmg: 30, mana: 0.1 }
function itemPower(item) {
  return Object.entries(item.stats ?? {}).reduce(
    (sum, [k, v]) => sum + v * (STAT_WEIGHT[k] ?? 1), 0
  )
}

// ─── Downgrade confirm modal ──────────────────────────────────────────────────

function DowngradeConfirmModal({ newItem, currentItem, onConfirm, onClose }) {
  if (!newItem || !currentItem) return null

  const newColor = RARITY_COLORS[newItem.rarity]?.split(' ')[0] ?? 'text-gray-400'
  const curColor = RARITY_COLORS[currentItem.rarity]?.split(' ')[0] ?? 'text-gray-400'

  // Build merged stat key list for comparison table
  const allKeys = Array.from(new Set([
    ...Object.keys(newItem.stats ?? {}),
    ...Object.keys(currentItem.stats ?? {}),
  ]))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm rounded-xl border border-amber-900/60 bg-gray-950 shadow-2xl">
        <div className="px-4 py-3 border-b border-gray-800">
          <p className="text-xs font-bold text-amber-400 mb-0.5">⚠️ Equipping a Weaker Item</p>
          <p className="text-[10px] text-gray-500">The current item is stronger. Are you sure?</p>
        </div>

        {/* Side-by-side comparison */}
        <div className="p-4 grid grid-cols-2 gap-3">
          {/* Current (stronger) */}
          <div className="flex flex-col gap-1">
            <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">Current</p>
            <div className={`text-[11px] font-semibold ${curColor}`}>
              {currentItem.icon} {currentItem.name}
            </div>
            <div className="text-[9px] text-gray-700">iLv {currentItem.itemLevel} · {currentItem.rarity}</div>
            {allKeys.map((k) => {
              const cv = currentItem.stats?.[k] ?? 0
              const nv = newItem.stats?.[k] ?? 0
              return cv > 0 ? (
                <div key={k} className={`text-[10px] ${cv >= nv ? 'text-green-400' : 'text-gray-500'}`}>
                  +{formatStatValue(k, cv)} {k.toUpperCase()}
                </div>
              ) : null
            })}
          </div>

          {/* New (weaker) */}
          <div className="flex flex-col gap-1">
            <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">New</p>
            <div className={`text-[11px] font-semibold ${newColor}`}>
              {newItem.icon} {newItem.name}
            </div>
            <div className="text-[9px] text-gray-700">iLv {newItem.itemLevel} · {newItem.rarity}</div>
            {allKeys.map((k) => {
              const cv = currentItem.stats?.[k] ?? 0
              const nv = newItem.stats?.[k] ?? 0
              return nv > 0 ? (
                <div key={k} className={`text-[10px] ${nv >= cv ? 'text-gray-300' : 'text-red-400'}`}>
                  +{formatStatValue(k, nv)} {k.toUpperCase()}
                </div>
              ) : null
            })}
          </div>
        </div>

        <div className="flex gap-2 px-4 pb-4">
          <button
            onClick={onClose}
            className="flex-1 text-[11px] py-1.5 rounded border border-gray-700 text-gray-400 hover:border-gray-500 transition-colors"
          >
            Keep Current
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 text-[11px] py-1.5 rounded border border-amber-700/60 text-amber-400 hover:bg-amber-950/30 transition-colors"
          >
            Equip Anyway
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Hero picker modal ────────────────────────────────────────────────────────

function HeroPickerModal({ item, heroes, invStore, onPick, onClose }) {
  if (!item) return null

  const rarityColor = RARITY_COLORS[item.rarity]?.split(' ')[0] ?? 'text-gray-400'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-4 py-3 border-b border-gray-800">
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Equip to which hero?</p>
            <div className="flex items-center gap-2">
              <span className="text-xl leading-none">{item.icon}</span>
              <div>
                <div className={`text-sm font-semibold ${rarityColor}`}>{item.name}</div>
                <div className="text-[10px] text-gray-600 capitalize">
                  {item.slot}{item.itemLevel ? ` · iLv ${item.itemLevel}` : ''}
                  <span className={`ml-2 font-bold uppercase text-[9px] ${rarityColor}`}>{item.rarity}</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 text-lg leading-none p-1">✕</button>
        </div>

        {/* Hero list */}
        <div className="p-3 flex flex-col gap-2">
          {heroes.map((hero) => {
            const cls = CLASSES[hero.classId]
            const job = hero.jobId ? JOBS[hero.jobId] : null
            const currentItem = invStore.getItemInSlot(hero.id, item.slot)
            const curColor = currentItem ? RARITY_COLORS[currentItem.rarity]?.split(' ')[0] : null

            return (
              <button
                key={hero.id}
                onClick={() => onPick(hero.id)}
                className="w-full text-left rounded-lg border border-gray-700 bg-gray-900/60 hover:border-amber-700/60 hover:bg-gray-900 p-3 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl leading-none">{cls?.icon ?? '⚔️'}</span>
                  <div>
                    <div className="text-xs font-semibold text-gray-100">{hero.name}</div>
                    <div className="text-[10px] text-gray-600">
                      {job ? `${job.icon} ${job.name}` : cls?.name} · Lv {hero.level}
                    </div>
                  </div>
                </div>
                {/* Current item in slot */}
                <div className="text-[10px] pl-1 border-l-2 border-gray-800">
                  {currentItem ? (
                    <span className={curColor}>
                      {currentItem.icon} {currentItem.name}
                      <span className="text-gray-600 ml-1">iLv {currentItem.itemLevel}</span>
                    </span>
                  ) : (
                    <span className="text-gray-700">Empty slot</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

function FilterBar({ filters, setFilter, clearFilters }) {
  const classes = Object.values(CLASSES)

  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {/* Rarity filter */}
      {RARITY_ORDER.map((r) => (
        <button
          key={r}
          onClick={() => setFilter('rarity', filters.rarity === r ? null : r)}
          className={`text-[10px] px-2 py-0.5 rounded border capitalize transition-colors
            ${filters.rarity === r
              ? `${RARITY_COLORS[r]} bg-opacity-20`
              : 'border-gray-700 text-gray-600 hover:border-gray-500'
            }`}
        >
          {r}
        </button>
      ))}

      {/* Class filter */}
      <select
        value={filters.classId ?? ''}
        onChange={(e) => setFilter('classId', e.target.value || null)}
        className="text-[10px] px-2 py-0.5 rounded border border-gray-700 bg-gray-900 text-gray-500 hover:border-gray-500 cursor-pointer"
      >
        <option value="">All classes</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
        ))}
      </select>

      {/* Clear */}
      {(filters.rarity || filters.classId) && (
        <button
          onClick={clearFilters}
          className="text-[10px] px-2 py-0.5 rounded border border-gray-700 text-gray-600 hover:text-gray-400"
        >
          ✕ Clear
        </button>
      )}
    </div>
  )
}

// ─── Inventory panel ──────────────────────────────────────────────────────────

export default function InventoryPanel() {
  const invStore  = useInventoryStore()
  const gameStore = useGameStore()
  const { filters, setFilter, clearFilters, showPartyOnly, autoSellRarity } = invStore
  const [page, setPage] = useState(0)
  const [showLockedOnly, setShowLockedOnly] = useState(false)
  const [equipPending, setEquipPending] = useState(null)
  const [downgradeConfirm, setDowngradeConfirm] = useState(null)

  // Party class IDs for the party-only filter
  const partyClassIds = new Set(
    gameStore.partyIds
      .map((id) => gameStore.heroes[id]?.classId)
      .filter(Boolean)
  )

  // Exclude equipped items (shown on hero cards instead), apply filters, party filter
  // Reverse so newest items appear first
  const allFiltered = invStore.getFilteredItems().filter((item) => !item.equippedBy).reverse()
  const items = allFiltered
    .filter((item) => showLockedOnly ? item.locked : !item.locked)
    .filter((item) => !showPartyOnly || !item.classLock || partyClassIds.has(item.classLock))

  // Pagination
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE))
  const safePage   = Math.min(page, totalPages - 1)
  const pageItems  = items.slice(safePage * ITEMS_PER_PAGE, (safePage + 1) * ITEMS_PER_PAGE)

  const totalUnequipped = invStore.items.filter((i) => !i.equippedBy).length
  const autoSellIdx     = autoSellRarity ? RARITY_ORDER.indexOf(autoSellRarity) : -1

  // Check for downgrade and either confirm or equip directly
  function tryEquip(item, heroId) {
    const currentItem = invStore.getItemInSlot(heroId, item.slot)
    if (currentItem && itemPower(item) < itemPower(currentItem)) {
      setDowngradeConfirm({ item, heroId, currentItem })
    } else {
      invStore.equipItem(item.uid, heroId, gameStore)
    }
  }

  function handleEquip(item) {
    const party = gameStore.getParty()
    const eligible = party.filter((h) => !item.classLock || h.classId === item.classLock)
    if (!eligible.length) return
    if (eligible.length === 1) {
      tryEquip(item, eligible[0].id)
    } else {
      setEquipPending({ item, eligible })
    }
  }

  function handlePickHero(heroId) {
    if (!equipPending) return
    const item = equipPending.item
    setEquipPending(null)
    tryEquip(item, heroId)
  }

  function handleConfirmDowngrade() {
    if (!downgradeConfirm) return
    invStore.equipItem(downgradeConfirm.item.uid, downgradeConfirm.heroId, gameStore)
    setDowngradeConfirm(null)
  }

  function handleSell(item) {
    invStore.sellItem(item.uid, gameStore)
  }

  function handleSetAutoSell(rarity) {
    invStore.setAutoSellRarity(autoSellRarity === rarity ? null : rarity, gameStore)
    setPage(0)
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-600">
          Inventory
        </h2>
        <span className="text-[10px] text-gray-700">{totalUnequipped} items</span>
      </div>

      <div className="rounded-lg border border-gray-700/60 bg-gray-900/60 p-3">
        {/* ── Settings row ── */}
        <div className="flex flex-wrap items-center gap-2 mb-3 pb-3 border-b border-gray-800/60">
          {/* Party-only toggle */}
          <button
            onClick={() => { invStore.setShowPartyOnly(!showPartyOnly); setPage(0) }}
            className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded border transition-colors ${
              showPartyOnly
                ? 'border-amber-700/60 bg-amber-950/30 text-amber-400'
                : 'border-gray-700 text-gray-600 hover:border-gray-500'
            }`}
            title="Show only items your party can equip"
          >
            <span>{showPartyOnly ? '✓' : '○'}</span>
            Party only
          </button>

          {/* Locked filter */}
          <button
            onClick={() => { setShowLockedOnly((v) => !v); setPage(0) }}
            className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded border transition-colors ${
              showLockedOnly
                ? 'border-yellow-700/60 bg-yellow-950/30 text-yellow-400'
                : 'border-gray-700 text-gray-600 hover:border-gray-500'
            }`}
            title="Show only locked items"
          >
            🔒 Locked
          </button>

          {/* Auto-sell rarity selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-600">Auto-sell ≤</span>
            <div className="flex gap-1">
              {RARITY_ORDER.slice(0, -1).map((r, idx) => {
                const isActive = autoSellIdx >= idx
                const rColor = RARITY_COLORS[r]?.split(' ')[0] ?? 'text-gray-400'
                return (
                  <button
                    key={r}
                    onClick={() => handleSetAutoSell(r)}
                    className={`text-[9px] px-1.5 py-0.5 rounded border capitalize transition-colors ${
                      isActive
                        ? `${rColor} border-current bg-gray-900`
                        : 'border-gray-700 text-gray-700 hover:border-gray-600'
                    }`}
                    title={`Auto-sell ${r} and below`}
                  >
                    {r[0].toUpperCase()}
                  </button>
                )
              })}
              {autoSellRarity && (
                <button
                  onClick={() => invStore.setAutoSellRarity(null)}
                  className="text-[9px] px-1 py-0.5 rounded border border-gray-700 text-gray-600 hover:text-red-400"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        <FilterBar filters={filters} setFilter={(k, v) => { setFilter(k, v); setPage(0) }} clearFilters={() => { clearFilters(); setPage(0) }} />

        {items.length === 0 ? (
          <p className="text-center text-gray-700 text-xs py-6">
            {totalUnequipped === 0
              ? 'No items yet. Clear some stages!'
              : showPartyOnly
                ? 'No usable items for your party.'
                : 'No items match filters.'}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {pageItems.map((item) => (
                <ItemCard key={item.uid} item={item} onEquip={handleEquip} onSell={handleSell} onToggleLock={(i) => invStore.toggleLock(i.uid)} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-800/60">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                  className="text-[10px] px-2 py-0.5 rounded border border-gray-700 text-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>
                <span className="text-[10px] text-gray-600">
                  {safePage + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={safePage === totalPages - 1}
                  className="text-[10px] px-2 py-0.5 rounded border border-gray-700 text-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <HeroPickerModal
        item={equipPending?.item ?? null}
        heroes={equipPending?.eligible ?? []}
        invStore={invStore}
        onPick={handlePickHero}
        onClose={() => setEquipPending(null)}
      />

      <DowngradeConfirmModal
        newItem={downgradeConfirm?.item ?? null}
        currentItem={downgradeConfirm?.currentItem ?? null}
        onConfirm={handleConfirmDowngrade}
        onClose={() => {
          if (downgradeConfirm) invStore.sellItem(downgradeConfirm.item.uid, gameStore)
          setDowngradeConfirm(null)
        }}
      />
    </section>
  )
}
