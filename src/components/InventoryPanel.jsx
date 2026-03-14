import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useInventoryStore, RARITY_COLORS, RARITY_ORDER, calcSellPrice, itemPower } from '@/store/useInventoryStore'
import { useGameStore } from '@/store/useGameStore'
import { CLASSES } from '@/data/classes'
import { JOBS } from '@/data/jobs'
import { RARITY_STAT_COLOR, RARITY_SECONDARY_COLOR } from '@/data/items'
import { generateShopItems, calcBuyPrice } from '@/utils/loot'
import { ITEM_SET_DEFINITIONS } from '@/data/itemSets'
import { calcRerollCost, calcUpgradeCost, canFuse } from '@/utils/crafting'

const ITEMS_PER_PAGE = 12

// ─── Stat formatting ──────────────────────────────────────────────────────────

const PERCENT_STATS = new Set(['crit', 'critDmg', 'evasion'])

function formatStatValue(key, value) {
  if (PERCENT_STATS.has(key)) return `${(value * 100).toFixed(1)}%`
  if (key === 'spd') return value.toFixed(1)
  return Math.floor(value)
}

// ─── Stat hover tooltip ────────────────────────────────────────────────────────

function StatTooltip({ item, rect, compareItem }) {
  const [textColor] = (RARITY_COLORS[item.rarity] ?? 'text-gray-400 border-gray-600').split(' ')
  const cls = CLASSES[item.classLock]
  const isMythic = item.rarity === 'mythic'
  const fixedSet = new Set(item.fixedSubstatKeys ?? [])

  const tooltipWidth = compareItem ? 260 : 220
  const spaceBelow = window.innerHeight - rect.bottom
  const above = spaceBelow < 220
  const style = above
    ? { position: 'fixed', bottom: window.innerHeight - rect.top + 6, left: rect.left, width: tooltipWidth }
    : { position: 'fixed', top: rect.bottom + 6, left: rect.left, width: tooltipWidth }

  return createPortal(
    <div style={style} className={`z-9999 rounded-lg border bg-gray-950 shadow-2xl p-3 pointer-events-none ${isMythic ? 'border-red-800/70' : 'border-gray-700'}`}>
      {/* Name + rarity badge */}
      <div className={`text-[11px] font-bold mb-0.5 ${textColor}`}>{item.icon} {item.name}</div>
      <div className="flex items-center gap-1.5 text-[9px] text-gray-500 mb-2">
        <span className="capitalize">{item.slot}</span>
        {item.itemLevel && <span>· iLv {item.itemLevel}</span>}
        <span className={`ml-auto font-bold uppercase ${textColor}`}>{item.rarity}</span>
      </div>

      {/* Numerical stats */}
      <div className="flex flex-col gap-0.5 mt-1">
        {Object.entries(item.stats ?? {}).map(([k, v]) => {
          const isMain   = k === item.mainStat
          const isFixed  = isMythic && fixedSet.has(k)
          const statRar  = item.statRarities?.[k] ?? item.rarity
          const color    = isMain
            ? (RARITY_STAT_COLOR[statRar] ?? 'text-gray-300')
            : isFixed
              ? 'text-rose-300'
              : (RARITY_SECONDARY_COLOR[statRar] ?? 'text-gray-500')
          return (
            <span key={k} className={`text-[10px] ${color} ${isMain ? 'font-semibold' : ''}`}>
              +{formatStatValue(k, v)} {k.toUpperCase()}
              {isMain  && <span className="text-[9px] ml-1 opacity-60">(main)</span>}
              {isFixed && !isMain && <span className="text-[9px] ml-1 opacity-50">(fixed)</span>}
            </span>
          )
        })}
      </div>

      {/* Legendary trait */}
      {item.trait && (
        <div className="text-[10px] text-yellow-400 font-semibold mt-2 pt-2 border-t border-yellow-900/30">
          ✦ {item.trait.label}
        </div>
      )}

      {/* Mythic skill traits (2 fixed) */}
      {isMythic && item.mythicSkillTraits?.length > 0 && (
        <div className="mt-2 pt-2 border-t border-red-900/40 flex flex-col gap-0.5">
          <span className="text-[9px] text-red-600 uppercase tracking-wider mb-0.5">Mythic Skill Traits</span>
          {item.mythicSkillTraits.map((t, i) => (
            <div key={i} className="text-[10px] text-red-300 font-semibold">
              ✦ {t.label}
            </div>
          ))}
        </div>
      )}

      {item.setId && ITEM_SET_DEFINITIONS[item.setId] && (() => {
        const sd = ITEM_SET_DEFINITIONS[item.setId]
        return <div className={`text-[9px] font-bold mt-1.5 ${sd.color}`}>{sd.icon} {sd.name} set</div>
      })()}
      {cls && (
        <div className="text-[9px] text-gray-400 mt-0.5">{cls.icon} {cls.name} only</div>
      )}

      {/* Comparison vs equipped */}
      {compareItem && (() => {
        const [cmpColor] = (RARITY_COLORS[compareItem.rarity] ?? 'text-gray-400 border-gray-600').split(' ')
        const allKeys = Array.from(new Set([
          ...Object.keys(item.stats ?? {}),
          ...Object.keys(compareItem.stats ?? {}),
        ]))
        return (
          <div className="mt-2 pt-2 border-t border-gray-800/60">
            <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">
              vs. <span className={cmpColor}>{compareItem.icon} {compareItem.name}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              {allKeys.map((k) => {
                const nv = item.stats?.[k] ?? 0
                const cv = compareItem.stats?.[k] ?? 0
                const delta = nv - cv
                if (delta === 0) return null
                const sign = delta > 0 ? '+' : ''
                const color = delta > 0 ? 'text-green-400' : 'text-red-400'
                const arrow = delta > 0 ? '▲' : '▼'
                return (
                  <span key={k} className={`text-[10px] ${color} flex items-center justify-between`}>
                    <span>{k.toUpperCase()}</span>
                    <span>{arrow} {sign}{formatStatValue(k, Math.abs(delta))}</span>
                  </span>
                )
              })}
            </div>
          </div>
        )
      })()}
    </div>,
    document.body
  )
}

// ─── Item card ────────────────────────────────────────────────────────────────

function ItemCard({ item, onEquip, onSell, onToggleLock, isBetter, compareItem, skipSellConfirm, onSetSkipSellConfirm }) {
  const [textColor, borderColor] = (RARITY_COLORS[item.rarity] ?? 'text-gray-400 border-gray-600').split(' ')
  const isEquipped = !!item.equippedBy
  const setDef = item.setId ? ITEM_SET_DEFINITIONS[item.setId] : null
  const sellPrice  = calcSellPrice(item)
  const cardRef = useRef(null)
  const [rect, setRect] = useState(null)
  const [confirmSell, setConfirmSell] = useState(false)

  function handleMouseEnter() {
    if (cardRef.current) setRect(cardRef.current.getBoundingClientRect())
  }

  function handleSellClick() {
    if (skipSellConfirm) { onSell(item); return }
    setConfirmSell(true)
  }

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setRect(null)}
      className={`
        relative rounded-lg border-2 p-2 flex flex-col gap-1.5 cursor-default bg-transparent
        transition-all duration-150 hover:brightness-110
        ${borderColor}
        ${isEquipped ? 'ring-2 ring-amber-500/40 ring-offset-1 ring-offset-gray-950' : ''}
        ${!isEquipped && isBetter ? 'ring-1 ring-green-500/50' : ''}
        ${setDef && !isEquipped ? `ring-1 ${setDef.ring}/60` : ''}
      `}
    >
      {/* Dynamic portal tooltip */}
      {rect && <StatTooltip item={item} rect={rect} compareItem={compareItem} />}

      {/* Compact header: icon + name + badges */}
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-md border-2 ${borderColor} bg-gray-950/70 flex items-center justify-center text-base leading-none shrink-0`}>
          {item.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className={`text-[11px] font-bold truncate ${textColor}`}>{item.name}</span>
            {isBetter && (
              <span className="shrink-0 text-[9px] px-1 py-px rounded bg-green-950/60 border border-green-700/50 text-green-400 font-bold leading-tight">
                ↑ upgrade
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[9px] px-1 py-px rounded bg-gray-900 border border-gray-800 text-gray-500 capitalize leading-tight">
              {item.slot}
            </span>
            <span className="text-[9px] text-gray-400">iLv {item.itemLevel}</span>
            {setDef ? (
              <span className={`ml-auto text-[8px] font-bold leading-tight ${setDef.color}`}>
                {setDef.icon} {setDef.name}
              </span>
            ) : (
              <span className="ml-auto text-[8px] text-gray-500 leading-tight">
                {item.classLock
                  ? `${CLASSES[item.classLock]?.icon ?? ''} ${CLASSES[item.classLock]?.name ?? item.classLock}`
                  : 'All classes'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      {isEquipped ? (
        <div className={`w-full text-[10px] py-0.5 text-center font-semibold rounded border ${borderColor} ${textColor} opacity-60`}>
          ✓ Equipped
        </div>
      ) : (
        <div className="flex gap-1">
          {onEquip && (
            <button
              onClick={() => onEquip(item)}
              className={`flex-1 text-[10px] py-0.5 rounded border-2 font-semibold transition-all ${borderColor} ${textColor} bg-gray-950/40 hover:brightness-125`}
            >
              Equip
            </button>
          )}
          <button
            onClick={() => onToggleLock(item)}
            className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
              item.locked
                ? 'border-yellow-700/60 text-yellow-400 bg-yellow-950/20'
                : 'border-gray-700 text-gray-600 hover:border-yellow-700/40 hover:text-yellow-600'
            }`}
            title={item.locked ? 'Unlock item' : 'Lock item (prevents selling)'}
          >
            {item.locked ? '🔒' : '🔓'}
          </button>
          {onSell && !item.locked && !confirmSell && (
            <button
              onClick={handleSellClick}
              className="text-[10px] px-1.5 py-0.5 rounded border border-gray-700 text-gray-600 hover:border-red-800/60 hover:text-red-400 transition-colors"
              title={`Sell for ${sellPrice}g`}
            >
              {sellPrice}g
            </button>
          )}
          {confirmSell && (
            <div className="flex flex-col gap-1 w-full">
              <div className="flex gap-1">
                <button
                  onClick={() => { onSell(item); setConfirmSell(false) }}
                  className="flex-1 text-[10px] py-0.5 rounded border border-red-800/60 text-red-400 hover:bg-red-950/30 transition-colors"
                >
                  ✓ {sellPrice}g
                </button>
                <button
                  onClick={() => setConfirmSell(false)}
                  className="text-[10px] px-1.5 py-0.5 rounded border border-gray-700 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  ✕
                </button>
              </div>
              <label className="flex items-center gap-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-2.5 h-2.5 accent-amber-500"
                  onChange={(e) => { if (e.target.checked) onSetSkipSellConfirm(true) }}
                />
                <span className="text-[9px] text-gray-600">Don't ask again</span>
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// itemPower is imported from useInventoryStore (class-aware)

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

// ─── Shop item card ───────────────────────────────────────────────────────────

function ShopItemCard({ item, gold, bought, onBuy }) {
  const [textColor, borderColor] = (RARITY_COLORS[item.rarity] ?? 'text-gray-400 border-gray-600').split(' ')
  const price = calcBuyPrice(item)
  const canAfford = gold >= price
  const cardRef = useRef(null)
  const [rect, setRect] = useState(null)

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => cardRef.current && setRect(cardRef.current.getBoundingClientRect())}
      onMouseLeave={() => setRect(null)}
      className={`relative rounded-lg border-2 p-2 flex flex-col gap-1.5 bg-transparent transition-all duration-150 ${borderColor} ${bought ? 'opacity-40' : ''}`}
    >
      {rect && <StatTooltip item={item} rect={rect} />}

      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-md border-2 ${borderColor} bg-gray-950/70 flex items-center justify-center text-base leading-none shrink-0`}>
          {item.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-[11px] font-bold truncate ${textColor}`}>{item.name}</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[9px] px-1 py-px rounded bg-gray-900 border border-gray-800 text-gray-500 capitalize">{item.slot}</span>
            <span className="text-[9px] text-gray-500">iLv {item.itemLevel}</span>
          </div>
        </div>
      </div>

      {bought ? (
        <div className="w-full text-[10px] py-0.5 text-center font-semibold rounded border border-gray-700 text-gray-600">✓ Purchased</div>
      ) : (
        <button
          onClick={() => onBuy(item)}
          disabled={!canAfford}
          className={`w-full text-[10px] py-0.5 rounded border-2 font-semibold transition-all ${
            canAfford
              ? `${borderColor} ${textColor} bg-gray-950/40 hover:brightness-125`
              : 'border-gray-700 text-gray-700 cursor-not-allowed'
          }`}
        >
          🪙 {price.toLocaleString()}g
        </button>
      )}
    </div>
  )
}

// ─── Shop content ─────────────────────────────────────────────────────────────

function ShopContent({ gameStore, invStore }) {
  const { currentStage, gold } = gameStore
  const partyMaxLevel = Math.max(1, ...gameStore.partyIds.map((id) => gameStore.heroes[id]?.level ?? 1))
  const refreshCost = Math.max(25, Math.floor(50 + currentStage * 1.5))

  const [shopItems, setShopItems] = useState(() => generateShopItems(currentStage, partyMaxLevel, 6))
  const [boughtUids, setBoughtUids] = useState(new Set())

  function refresh() {
    if (gold < refreshCost) return
    gameStore.spendGold(refreshCost)
    setShopItems(generateShopItems(currentStage, partyMaxLevel, 6))
    setBoughtUids(new Set())
  }

  function buy(item) {
    const price = calcBuyPrice(item)
    if (gold < price || boughtUids.has(item.uid)) return
    gameStore.spendGold(price)
    invStore.addItem(item)
    setBoughtUids((prev) => new Set([...prev, item.uid]))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-600">Stage {currentStage} stock · refreshes each visit</span>
        <button
          onClick={refresh}
          disabled={gold < refreshCost}
          className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded border font-semibold transition-colors ${
            gold >= refreshCost
              ? 'border-amber-700/60 text-amber-400 hover:bg-amber-950/30'
              : 'border-gray-700 text-gray-700 cursor-not-allowed'
          }`}
        >
          🔄 Refresh · {refreshCost.toLocaleString()}g
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {shopItems.map((item) => (
          <ShopItemCard
            key={item.uid}
            item={item}
            gold={gold}
            bought={boughtUids.has(item.uid)}
            onBuy={buy}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Crafting panel ───────────────────────────────────────────────────────────

function CraftItemRow({ item, isSelected, onClick, badge }) {
  const [textColor, borderColor] = (RARITY_COLORS[item.rarity] ?? 'text-gray-400 border-gray-600').split(' ')
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 rounded px-2 py-1.5 text-left border transition-colors ${
        isSelected
          ? `${borderColor} bg-gray-900`
          : 'border-gray-800 bg-gray-900/40 hover:border-gray-600'
      }`}
    >
      <span className="text-base leading-none shrink-0">{item.icon}</span>
      <div className="flex-1 min-w-0">
        <div className={`text-[11px] font-semibold truncate ${textColor}`}>{item.name}</div>
        <div className="text-[9px] text-gray-600">iLv {item.itemLevel} · {item.rarity}</div>
      </div>
      {badge && <span className="text-[9px] text-amber-600 shrink-0">{badge}</span>}
    </button>
  )
}

function CraftingContent({ gameStore, invStore }) {
  const [mode, setMode]           = useState('craft') // 'craft' | 'fuse'
  const [selected, setSelected]   = useState(null)    // uid for craft mode
  const [fuseUids, setFuseUids]   = useState([])       // up to 3 uids
  const [lastResult, setLastResult] = useState(null)

  const { gold } = gameStore
  const allItems = invStore.items

  // ── Craft mode ───────────────────────────────────────────────────────────────
  const selectedItem  = allItems.find((i) => i.uid === selected) ?? null
  const rerollCost    = selectedItem ? calcRerollCost(selectedItem) : 0
  const upgradeCost   = selectedItem ? calcUpgradeCost(selectedItem) : 0
  const canReroll     = selectedItem && gold >= rerollCost && selectedItem.rarity !== 'mythic'
  const canUpgrade    = selectedItem && gold >= upgradeCost && selectedItem.rarity !== 'mythic'

  function handleReroll() {
    const key = invStore.craftRerollSubstat(selected, gameStore)
    if (key) setLastResult(`🎲 Rerolled ${key.toUpperCase()} stat!`)
    else setLastResult('⚠ Nothing to reroll.')
  }

  function handleUpgrade() {
    const ok = invStore.craftUpgradeItemLevel(selected, gameStore)
    if (ok) setLastResult('⬆ Item level increased!')
  }

  // ── Fuse mode ────────────────────────────────────────────────────────────────
  const fuseRarity  = fuseUids.length > 0 ? allItems.find((i) => i.uid === fuseUids[0])?.rarity : null
  const fuseReady   = fuseUids.length === 3
  const nextRarity  = fuseRarity ? RARITY_ORDER[RARITY_ORDER.indexOf(fuseRarity) + 1] : null

  function toggleFuse(uid) {
    const item = allItems.find((i) => i.uid === uid)
    if (!item || !canFuse(item.rarity)) return
    setFuseUids((prev) => {
      if (prev.includes(uid)) return prev.filter((u) => u !== uid)
      if (prev.length >= 3) return prev
      if (fuseRarity && item.rarity !== fuseRarity) return prev
      return [...prev, uid]
    })
  }

  function handleFuse() {
    const newItem = invStore.craftFuseItems(fuseUids, gameStore)
    if (newItem) {
      setFuseUids([])
      setMode('craft')
      setSelected(newItem.uid)
      setLastResult(`✨ Fused into ${newItem.name}! (${newItem.rarity})`)
    }
  }

  const [textColor] = (RARITY_COLORS[nextRarity] ?? 'text-gray-400 border-gray-600').split(' ')

  return (
    <div className="flex flex-col gap-3">
      {/* Sub-mode tabs */}
      <div className="flex gap-1">
        {[['craft', '🔨 Craft'], ['fuse', '⚗️ Fuse (3→1)']].map(([m, label]) => (
          <button
            key={m}
            onClick={() => { setMode(m); setLastResult(null); setFuseUids([]) }}
            className={`text-[10px] font-semibold px-2.5 py-1 rounded border transition-colors ${
              mode === m
                ? 'border-violet-700/60 bg-violet-950/30 text-violet-300'
                : 'border-gray-700 text-gray-600 hover:border-gray-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Feedback banner */}
      {lastResult && (
        <div className="text-[11px] text-green-400 text-center py-1.5 bg-green-950/20 border border-green-900/30 rounded">
          {lastResult}
        </div>
      )}

      {/* ── Craft mode ── */}
      {mode === 'craft' && (
        <>
          {allItems.length === 0 ? (
            <p className="text-center text-gray-700 text-xs py-6">No items yet. Clear some stages!</p>
          ) : (
            <div className="max-h-44 overflow-y-auto flex flex-col gap-1 pr-0.5">
              {allItems.map((item) => (
                <CraftItemRow
                  key={item.uid}
                  item={item}
                  isSelected={selected === item.uid}
                  onClick={() => { setSelected(item.uid); setLastResult(null) }}
                  badge={item.equippedBy ? 'Equipped' : null}
                />
              ))}
            </div>
          )}

          {selectedItem && (
            <div className="border-t border-gray-800 pt-3 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="text-[9px] text-gray-600 uppercase tracking-widest">Craft Options</div>
                <span className="text-[9px] text-amber-600 tabular-nums">🪙 {gold.toLocaleString()}g available</span>
              </div>

              {/* Reroll substat */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] text-gray-200 font-semibold">🎲 Reroll Substat</div>
                  <div className="text-[9px] text-gray-600 mt-0.5">Randomize one random secondary stat</div>
                  {!canReroll && gold < rerollCost && (
                    <div className="text-[9px] text-red-600 mt-0.5">Need {(rerollCost - gold).toLocaleString()}g more</div>
                  )}
                  {!canReroll && selectedItem.rarity === 'mythic' && (
                    <div className="text-[9px] text-red-600 mt-0.5">Mythic items cannot be crafted</div>
                  )}
                </div>
                <button
                  onClick={handleReroll}
                  disabled={!canReroll}
                  className={`shrink-0 text-[10px] px-2.5 py-1 rounded border font-semibold transition-colors ${
                    canReroll
                      ? 'border-blue-700/60 text-blue-400 hover:bg-blue-950/30'
                      : 'border-gray-700 text-gray-700 cursor-not-allowed'
                  }`}
                >
                  🪙 {rerollCost.toLocaleString()}g
                </button>
              </div>

              {/* Upgrade level */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] text-gray-200 font-semibold">⬆ Upgrade Level</div>
                  <div className="text-[9px] text-gray-600 mt-0.5">+1 item level · all stats scale up</div>
                  {!canUpgrade && gold < upgradeCost && (
                    <div className="text-[9px] text-red-600 mt-0.5">Need {(upgradeCost - gold).toLocaleString()}g more</div>
                  )}
                  {!canUpgrade && selectedItem.rarity === 'mythic' && (
                    <div className="text-[9px] text-red-600 mt-0.5">Mythic items cannot be crafted</div>
                  )}
                </div>
                <button
                  onClick={handleUpgrade}
                  disabled={!canUpgrade}
                  className={`shrink-0 text-[10px] px-2.5 py-1 rounded border font-semibold transition-colors ${
                    canUpgrade
                      ? 'border-green-700/60 text-green-400 hover:bg-green-950/30'
                      : 'border-gray-700 text-gray-700 cursor-not-allowed'
                  }`}
                >
                  🪙 {upgradeCost.toLocaleString()}g
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Fuse mode ── */}
      {mode === 'fuse' && (
        <>
          <p className="text-[11px] text-gray-500 leading-snug">
            Select 3 items of the same rarity (up to epic) to fuse into 1 guaranteed higher-rarity item.
          </p>

          <div className="max-h-44 overflow-y-auto flex flex-col gap-1 pr-0.5">
            {allItems.map((item) => {
              const isSelectable = canFuse(item.rarity)
              const isDisabled   = !isSelectable || (fuseRarity && item.rarity !== fuseRarity && !fuseUids.includes(item.uid))
              const isChecked    = fuseUids.includes(item.uid)
              const [tc, bc]     = (RARITY_COLORS[item.rarity] ?? 'text-gray-400 border-gray-600').split(' ')
              return (
                <button
                  key={item.uid}
                  onClick={() => toggleFuse(item.uid)}
                  disabled={isDisabled}
                  className={`w-full flex items-center gap-2 rounded px-2 py-1.5 text-left border transition-colors ${
                    isChecked
                      ? `${bc} bg-gray-900`
                      : isDisabled
                        ? 'border-gray-800 opacity-30 cursor-not-allowed'
                        : 'border-gray-800 bg-gray-900/40 hover:border-gray-600'
                  }`}
                >
                  <span className={`w-4 h-4 rounded border flex items-center justify-center text-[9px] shrink-0 ${isChecked ? `${bc} text-green-400` : 'border-gray-700'}`}>
                    {isChecked ? '✓' : ''}
                  </span>
                  <span className="text-base leading-none shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[11px] font-semibold truncate ${tc}`}>{item.name}</div>
                    <div className="text-[9px] text-gray-600">iLv {item.itemLevel} · {item.rarity}</div>
                  </div>
                  {!isSelectable && <span className="text-[9px] text-gray-700 shrink-0">max</span>}
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-gray-800">
            <span className="text-[11px] text-gray-500">
              {fuseUids.length}/3 selected
              {fuseRarity && <span className="ml-1 text-gray-700">({fuseRarity})</span>}
            </span>
            <button
              onClick={handleFuse}
              disabled={!fuseReady}
              className={`text-[10px] px-3 py-1 rounded border font-semibold transition-colors ${
                fuseReady
                  ? `border-violet-700/60 ${textColor} hover:bg-violet-950/30`
                  : 'border-gray-700 text-gray-700 cursor-not-allowed'
              }`}
            >
              ⚗️ Fuse → {nextRarity ?? '?'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Inventory panel ──────────────────────────────────────────────────────────

export default function InventoryPanel() {
  const invStore  = useInventoryStore()
  const gameStore = useGameStore()
  const { filters, setFilter, clearFilters, showPartyOnly, autoSellRarity, autoEquip, skipSellConfirm } = invStore
  const [tab, setTab] = useState('inventory')
  const [page, setPage] = useState(0)
  const [showLockedOnly, setShowLockedOnly] = useState(false)
  const [equipPending, setEquipPending] = useState(null)
  const [downgradeConfirm, setDowngradeConfirm] = useState(null)
  const [sortBy, setSortBy] = useState('newest') // 'newest' | 'power' | 'rarity' | 'slot'

  // Party class IDs for the party-only filter
  const partyClassIds = new Set(
    gameStore.partyIds
      .map((id) => gameStore.heroes[id]?.classId)
      .filter(Boolean)
  )

  // Party classId for power sort (prefer active filter, else first party member)
  const sortClassId = filters.classId
    ?? gameStore.partyIds.map((id) => gameStore.heroes[id]?.classId).filter(Boolean)[0]
    ?? null

  // Exclude equipped items (shown on hero cards instead), apply filters, party filter
  const allFiltered = invStore.getFilteredItems().filter((item) => !item.equippedBy)
  const items = allFiltered
    .filter((item) => showLockedOnly ? item.locked : !item.locked)
    .filter((item) => !showPartyOnly || !item.classLock || partyClassIds.has(item.classLock))
    .sort((a, b) => {
      if (sortBy === 'power')  return itemPower(b, sortClassId) - itemPower(a, sortClassId)
      if (sortBy === 'rarity') return RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity)
      if (sortBy === 'slot')   return (a.slot ?? '').localeCompare(b.slot ?? '')
      // 'newest': keep original store order reversed
      return allFiltered.indexOf(b) - allFiltered.indexOf(a)
    })

  // Pagination
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE))
  const safePage   = Math.min(page, totalPages - 1)
  const pageItems  = items.slice(safePage * ITEMS_PER_PAGE, (safePage + 1) * ITEMS_PER_PAGE)

  const totalUnequipped = invStore.items.filter((i) => !i.equippedBy).length
  const autoSellIdx     = autoSellRarity ? RARITY_ORDER.indexOf(autoSellRarity) : -1

  // Return the best equipped item in the same slot from eligible party members (for tooltip comparison)
  function getCompareItem(item) {
    const party = gameStore.getParty()
    const eligible = party.filter((h) => !item.classLock || h.classId === item.classLock)
    let best = null
    eligible.forEach((h) => {
      const cur = invStore.getItemInSlot(h.id, item.slot)
      if (cur && (!best || itemPower(cur, h.classId) > itemPower(best, h.classId))) best = cur
    })
    return best
  }

  // Compute upgrade status: true if item is stronger than what any eligible party member has equipped
  function isUpgrade(item) {
    const party = gameStore.getParty()
    const eligible = party.filter((h) => !item.classLock || h.classId === item.classLock)
    if (!eligible.length) return false
    return eligible.some((h) => {
      const current = invStore.getItemInSlot(h.id, item.slot)
      return !current || itemPower(item, h.classId) > itemPower(current, h.classId)
    })
  }

  // Check for downgrade and either confirm or equip directly
  function tryEquip(item, heroId) {
    const hero = gameStore.getParty().find((h) => h.id === heroId)
    const currentItem = invStore.getItemInSlot(heroId, item.slot)
    if (currentItem && itemPower(item, hero?.classId) < itemPower(currentItem, hero?.classId)) {
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
    if (autoSellRarity === rarity) {
      // step down one tier rather than clearing everything
      const idx = RARITY_ORDER.indexOf(rarity)
      invStore.setAutoSellRarity(idx > 0 ? RARITY_ORDER[idx - 1] : null, gameStore)
    } else {
      invStore.setAutoSellRarity(rarity, gameStore)
    }
    setPage(0)
  }

  return (
    <section className="flex flex-col gap-2">
      {/* ── Tab bar ── */}
      <div className="flex items-center gap-1 px-1">
        {[['inventory', '⚔ Inventory'], ['shop', '🛒 Shop'], ['craft', '🔨 Craft']].map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded border transition-colors ${
              tab === t
                ? 'border-amber-700/60 bg-amber-950/30 text-amber-400'
                : 'border-gray-700 text-gray-600 hover:border-gray-500 hover:text-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
        {tab === 'inventory' && (
          <span className="ml-auto text-[10px] text-gray-700">{totalUnequipped} items</span>
        )}
      </div>

      <div className="rounded-lg border border-gray-700/60 bg-gray-900/60 p-3">

        {/* ── Shop tab ── */}
        {tab === 'shop' && <ShopContent gameStore={gameStore} invStore={invStore} />}

        {/* ── Craft tab ── */}
        {tab === 'craft' && <CraftingContent gameStore={gameStore} invStore={invStore} />}

        {/* ── Inventory tab ── */}
        {tab === 'inventory' && (
          <div>
            {/* Settings row */}
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

              {/* Auto-equip toggle */}
              <button
                onClick={() => invStore.toggleAutoEquip()}
                className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded border transition-colors ${
                  autoEquip
                    ? 'border-green-700/60 bg-green-950/30 text-green-400'
                    : 'border-gray-700 text-gray-500 hover:border-green-700/40 hover:text-green-600'
                }`}
                title="Auto-equip upgrades when items drop"
              >
                ⚡ Auto-equip {autoEquip ? 'ON' : 'OFF'}
              </button>

              {/* Sort toggle */}
              <div className="flex items-center gap-0.5 ml-auto">
                {(['newest', 'power', 'rarity', 'slot']).map((s) => (
                  <button
                    key={s}
                    onClick={() => { setSortBy(s); setPage(0) }}
                    className={`text-[10px] px-2 py-1 rounded border capitalize transition-colors ${
                      sortBy === s
                        ? 'border-blue-700/60 bg-blue-950/30 text-blue-400'
                        : 'border-gray-700 text-gray-600 hover:border-gray-500'
                    }`}
                  >
                    {s === 'newest' ? '🕐' : s === 'power' ? '⚡' : s === 'rarity' ? '💎' : '📦'} {s}
                  </button>
                ))}
              </div>

              {/* Salvage All button */}
              <button
                onClick={() => {
                  const unequipped = invStore.items.filter((i) => !i.equippedBy && !i.locked)
                  if (!unequipped.length) return
                  const total = unequipped.reduce((s, i) => s + calcSellPrice(i), 0)
                  if (confirm(`Salvage ${unequipped.length} item${unequipped.length > 1 ? 's' : ''} for ${total.toLocaleString()}g?`)) {
                    invStore.salvageAll(gameStore)
                    setPage(0)
                  }
                }}
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-gray-700 text-gray-500 hover:border-orange-700/60 hover:text-orange-400 transition-colors"
                title="Salvage all unequipped unlocked items for gold"
              >
                🔥 Salvage All
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

            <FilterBar
              filters={filters}
              setFilter={(k, v) => { setFilter(k, v); setPage(0) }}
              clearFilters={() => { clearFilters(); setPage(0) }}
            />

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
                    <ItemCard
                      key={item.uid}
                      item={item}
                      onEquip={handleEquip}
                      onSell={handleSell}
                      onToggleLock={(i) => invStore.toggleLock(i.uid)}
                      isBetter={isUpgrade(item)}
                      compareItem={getCompareItem(item)}
                      skipSellConfirm={skipSellConfirm}
                      onSetSkipSellConfirm={invStore.setSkipSellConfirm}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-800/60">
                    <button
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={safePage === 0}
                      className="text-[10px] px-2 py-0.5 rounded border border-gray-700 text-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ← Prev
                    </button>
                    <span className="text-[10px] text-gray-600">{safePage + 1} / {totalPages}</span>
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
        onClose={() => setDowngradeConfirm(null)}
      />
    </section>
  )
}
