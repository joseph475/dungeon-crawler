import { useState } from 'react'
import { useGameStore, resolveHeroStats, xpToNextLevel } from '@/store/useGameStore'
import { useInventoryStore, RARITY_COLORS } from '@/store/useInventoryStore'
import { RARITY_STAT_COLOR, RARITY_SECONDARY_COLOR } from '@/data/items'
import { CLASSES } from '@/data/classes'
import { JOBS } from '@/data/jobs'
import HeroDetailModal from './HeroDetailModal'

// ─── Shared bar ───────────────────────────────────────────────────────────────

function Bar({ value, max, color, h = 'h-1.5' }) {
  const pct = Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : 0))
  return (
    <div className={`w-full ${h} bg-gray-800 rounded-full overflow-hidden`}>
      <div
        className={`h-full rounded-full transition-all duration-150 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// ─── Job badge ────────────────────────────────────────────────────────────────

function JobBadge({ hero }) {
  const cls = CLASSES[hero.classId]
  if (!hero.jobId) {
    return (
      <span className="text-[9px] px-1 py-0.5 rounded bg-gray-800 text-gray-500 uppercase tracking-wider">
        {cls?.name ?? hero.classId}
      </span>
    )
  }
  const job = JOBS[hero.jobId]
  const tierStyle = {
    1: 'bg-green-950 text-green-400 border border-green-800/50',
    2: 'bg-blue-950 text-blue-400 border border-blue-800/50',
    3: 'bg-purple-950 text-purple-300 border border-purple-700/50',
  }[job?.tier ?? 1]
  return (
    <span className={`text-[9px] px-1 py-0.5 rounded uppercase tracking-wider ${tierStyle}`}>
      {job?.icon} {job?.name ?? hero.jobId}
    </span>
  )
}

// ─── Item tooltip ─────────────────────────────────────────────────────────────

const PERCENT_STATS = new Set(['crit', 'critDmg'])

function fmtStat(k, v) {
  if (PERCENT_STATS.has(k)) return `${(v * 100).toFixed(1)}%`
  if (k === 'spd') return v.toFixed(1)
  return Math.floor(v)
}

function ItemTooltip({ item }) {
  const colorClass = RARITY_COLORS[item.rarity]?.split(' ')[0] ?? 'text-gray-400'
  return (
    <div className="absolute left-full top-0 ml-2 z-50 w-48 rounded-lg border border-gray-700 bg-gray-950 shadow-2xl p-2.5 pointer-events-none">
      <div className={`text-[11px] font-semibold mb-1 ${colorClass}`}>
        {item.icon} {item.name}
      </div>
      <div className="text-[9px] text-gray-600 mb-1.5 capitalize flex gap-1.5">
        <span>{item.slot}</span>
        {item.itemLevel && <span>· iLv {item.itemLevel}</span>}
        <span className={`ml-auto font-bold uppercase ${colorClass}`}>{item.rarity}</span>
      </div>
      <div className="flex flex-col gap-0.5">
        {Object.entries(item.stats ?? {}).map(([k, v]) => {
          const isMain  = k === item.mainStat
          const statRar = (item.statRarities?.[k]) ?? item.rarity
          const color   = isMain
            ? `${RARITY_STAT_COLOR[statRar] ?? 'text-gray-300'} font-semibold`
            : RARITY_SECONDARY_COLOR[statRar] ?? 'text-gray-500'
          return (
            <span key={k} className={`text-[10px] ${color}`}>
              +{fmtStat(k, v)} {k.toUpperCase()}
              {isMain && <span className="opacity-50 ml-1 text-[8px]">(main)</span>}
            </span>
          )
        })}
      </div>
      {item.trait && (
        <div className="text-[10px] text-yellow-400 font-semibold mt-1.5 pt-1.5 border-t border-gray-800">
          ✦ {item.trait.label}
        </div>
      )}
    </div>
  )
}

// ─── Equipped items row ───────────────────────────────────────────────────────

function EquippedItems({ heroId }) {
  const allItems = useInventoryStore((s) => s.items)
  const items = allItems.filter((i) => i.equippedBy === heroId)
  if (!items.length) return null

  return (
    <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-800/60">
      {items.map((item) => {
        const borderColor = RARITY_COLORS[item.rarity]?.split(' ')[1] ?? 'border-gray-700'
        return (
          <div key={item.uid} className="relative group/gear">
            <div
              className={`w-6 h-6 rounded border ${borderColor} flex items-center justify-center text-xs leading-none bg-gray-900/80 cursor-default`}
              title={item.name}
            >
              {item.icon}
            </div>
            <div className="hidden group-hover/gear:block">
              <ItemTooltip item={item} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Compact hero card (for narrow sidebar) ───────────────────────────────────

function CompactHeroCard({ hero, onClick }) {
  const stats    = resolveHeroStats(hero)
  const cls      = CLASSES[hero.classId]
  const xpNeeded = xpToNextLevel(hero.level + 1)
  const isDead   = hero.isDead
  const hpPct    = stats ? hero.currentHp / stats.maxHp : 0
  const isLowHp  = hpPct < 0.3 && !isDead

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left rounded-lg border px-3 py-2.5 transition-all duration-150 cursor-pointer
        hover:border-amber-700/50 hover:bg-gray-900
        ${isDead
          ? 'border-red-900/30 bg-gray-950/40 opacity-50 grayscale'
          : isLowHp
            ? 'border-red-800/50 bg-gray-900/80'
            : 'border-gray-700/50 bg-gray-900/50'
        }
      `}
    >
      {/* Row 1: icon + name + level */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl leading-none select-none shrink-0">{cls?.icon ?? '⚔️'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="font-semibold text-xs text-gray-100 truncate leading-tight">
              {hero.name}
              {isDead && <span className="text-[9px] text-red-500 font-bold ml-1">†</span>}
            </span>
            <span className="text-[10px] font-bold text-amber-400 shrink-0">Lv {hero.level}</span>
          </div>
          <JobBadge hero={hero} />
        </div>
      </div>

      {/* Row 2: bars */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-gray-600 w-4 shrink-0">HP</span>
          <div className="flex-1">
            <Bar value={hero.currentHp} max={stats?.maxHp ?? 1}
              color={hpPct < 0.3 ? 'bg-red-700' : 'bg-red-600'} />
          </div>
          <span className="text-[9px] text-gray-600 w-10 text-right shrink-0">
            {Math.floor(hero.currentHp)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-gray-600 w-4 shrink-0">MP</span>
          <div className="flex-1">
            <Bar value={hero.currentMana} max={stats?.maxMana ?? 1} color="bg-indigo-500" />
          </div>
          <span className="text-[9px] text-gray-600 w-10 text-right shrink-0">
            {Math.floor(hero.currentMana)}
          </span>
        </div>

        <Bar value={hero.xp} max={xpNeeded} color="bg-amber-500/60" h="h-0.5" />
      </div>

      {/* Row 3: equipped items */}
      <EquippedItems heroId={hero.id} />
    </button>
  )
}

// ─── Full hero card (for wider layouts) ──────────────────────────────────────

function FullHeroCard({ hero, onClick }) {
  const stats    = resolveHeroStats(hero)
  const cls      = CLASSES[hero.classId]
  const xpNeeded = xpToNextLevel(hero.level + 1)
  const isDead   = hero.isDead
  const hpPct    = stats ? hero.currentHp / stats.maxHp : 0
  const isLowHp  = hpPct < 0.3 && !isDead

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left rounded-lg border p-3 transition-all duration-150 cursor-pointer
        hover:border-amber-700/60 hover:bg-gray-900
        ${isDead
          ? 'border-red-900/40 bg-gray-950/40 opacity-50 grayscale'
          : isLowHp
            ? 'border-red-800/60 bg-gray-900/80'
            : 'border-gray-700/60 bg-gray-900/60'
        }
      `}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-2xl leading-none select-none">{cls?.icon ?? '⚔️'}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-gray-100 leading-tight">{hero.name}</span>
              {isDead && <span className="text-[10px] text-red-500 font-bold tracking-wider">FALLEN</span>}
            </div>
            <div className="mt-0.5"><JobBadge hero={hero} /></div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-bold text-amber-400">Lv {hero.level}</div>
          <div className="text-[10px] text-gray-600 mt-0.5">
            {Math.floor(hero.xp).toLocaleString()} / {xpNeeded.toLocaleString()} xp
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
          <span>HP</span>
          <span>{Math.floor(hero.currentHp)}/{Math.floor(stats?.maxHp ?? 0)}</span>
        </div>
        <Bar value={hero.currentHp} max={stats?.maxHp ?? 1}
          color={hpPct < 0.3 ? 'bg-red-700' : 'bg-red-600'} h="h-1.5" />
        <div className="flex justify-between text-[10px] text-gray-500 mb-0.5 mt-0.5">
          <span>Mana</span>
          <span>{Math.floor(hero.currentMana)}/{Math.floor(stats?.maxMana ?? 0)}</span>
        </div>
        <Bar value={hero.currentMana} max={stats?.maxMana ?? 1} color="bg-indigo-500" h="h-1.5" />
        <Bar value={hero.xp} max={xpNeeded} color="bg-amber-500/70" h="h-0.5" />
      </div>

      {stats && (
        <div className="flex gap-3 mt-2 text-[10px] text-gray-500">
          <span title="Attack">⚔️ {Math.floor(stats.atk)}</span>
          <span title="Defense">🛡️ {Math.floor(stats.def)}</span>
          <span title="Speed">💨 {stats.spd.toFixed(1)}</span>
          <span title="Crit">🎯 {(stats.crit * 100).toFixed(0)}%</span>
        </div>
      )}

      <EquippedItems heroId={hero.id} />
    </button>
  )
}

// ─── Party panel ──────────────────────────────────────────────────────────────

// ─── Swap modal ───────────────────────────────────────────────────────────────

const CLASS_LIST = Object.values(CLASSES)

function SwapModal({ partyHeroId, onClose }) {
  const { heroes, partyIds, swapHero, recruitHero } = useGameStore()
  const [recruiting, setRecruiting] = useState(false)

  const benchHeroes = Object.values(heroes).filter((h) => !partyIds.includes(h.id))

  function handleSwap(benchHeroId) {
    swapHero(partyHeroId, benchHeroId)
    onClose()
  }

  function handleRecruit(classId) {
    const newId = recruitHero(classId)
    swapHero(partyHeroId, newId)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-950 shadow-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-100">Swap Hero</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 text-lg leading-none">✕</button>
        </div>

        {!recruiting ? (
          <>
            {benchHeroes.length > 0 && (
              <>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Bench</p>
                <div className="flex flex-col gap-1.5 mb-3">
                  {benchHeroes.map((h) => {
                    const cls = CLASSES[h.classId]
                    const job = h.jobId ? JOBS[h.jobId] : null
                    return (
                      <button
                        key={h.id}
                        onClick={() => handleSwap(h.id)}
                        className="flex items-center gap-2 rounded border border-gray-700 bg-gray-900 px-3 py-2 hover:border-amber-700/60 hover:bg-gray-800 transition-colors text-left"
                      >
                        <span className="text-xl">{cls?.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-gray-100 truncate">{h.name}</div>
                          <div className="text-[10px] text-gray-500">{job ? `${job.icon} ${job.name}` : cls?.name} · Lv {h.level}</div>
                        </div>
                        <span className="text-[10px] text-amber-400">Swap →</span>
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Recruit New Hero</p>
            <button
              onClick={() => setRecruiting(true)}
              className="w-full text-xs py-1.5 rounded border border-gray-700 text-gray-400 hover:border-green-700/60 hover:text-green-400 transition-colors"
            >
              + Choose Class
            </button>
          </>
        ) : (
          <>
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Choose Class</p>
            <div className="grid grid-cols-2 gap-1.5">
              {CLASS_LIST.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => handleRecruit(cls.id)}
                  className="flex items-center gap-2 rounded border border-gray-700 bg-gray-900 px-2 py-1.5 hover:border-amber-700/60 hover:bg-gray-800 transition-colors text-left"
                >
                  <span className="text-base">{cls.icon}</span>
                  <span className="text-[11px] text-gray-300">{cls.name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setRecruiting(false)}
              className="mt-2 text-[10px] text-gray-600 hover:text-gray-400"
            >
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Party panel ──────────────────────────────────────────────────────────────

export default function PartyPanel({ compact = false }) {
  const { heroes, partyIds } = useGameStore()
  const [selectedHeroId, setSelectedHeroId] = useState(null)
  const [swappingHeroId, setSwappingHeroId]  = useState(null)

  const party = partyIds.map((id) => heroes[id]).filter(Boolean)
  const HeroCard = compact ? CompactHeroCard : FullHeroCard

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-600 px-1">
        Party
      </h2>

      {party.map((hero) => (
        <div key={hero.id} className="relative group">
          <HeroCard
            hero={hero}
            onClick={() => setSelectedHeroId(hero.id)}
          />
          <button
            onClick={(e) => { e.stopPropagation(); setSwappingHeroId(hero.id) }}
            className="absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0.5 rounded border border-gray-700 text-gray-600 hover:border-amber-700/60 hover:text-amber-400 bg-gray-950 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Swap hero"
          >
            ⇄
          </button>
        </div>
      ))}

      {party.length === 0 && (
        <p className="text-center text-gray-700 text-xs py-8">No party selected.</p>
      )}

      <HeroDetailModal
        heroId={selectedHeroId}
        open={!!selectedHeroId}
        onClose={() => setSelectedHeroId(null)}
      />

      {swappingHeroId && (
        <SwapModal
          partyHeroId={swappingHeroId}
          onClose={() => setSwappingHeroId(null)}
        />
      )}
    </section>
  )
}
