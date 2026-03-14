import { useState, useRef, useEffect } from 'react'
import { useGameStore, resolveHeroStats, xpToNextLevel } from '@/store/useGameStore'
import { useInventoryStore, RARITY_COLORS } from '@/store/useInventoryStore'
import { useCombatStore } from '@/store/useCombatStore'
import { computePartySynergies, ALL_SYNERGY_DEFINITIONS } from '@/hooks/useCombat'
import { RARITY_STAT_COLOR, RARITY_SECONDARY_COLOR } from '@/data/items'
import { ITEM_SET_DEFINITIONS, getActiveTierLabel } from '@/data/itemSets'
import { CLASSES } from '@/data/classes'
import { JOBS } from '@/data/jobs'
import HeroDetailModal from './HeroDetailModal'

// ─── Class color map ──────────────────────────────────────────────────────────

const CLASS_ACCENT = {
  warrior:  'bg-red-600',
  paladin:  'bg-yellow-500',
  mage:     'bg-purple-500',
  healer:   'bg-emerald-500',
  assassin: 'bg-gray-500',
  rogue:    'bg-orange-500',
  ranger:   'bg-blue-500',
  shaman:   'bg-teal-500',
}

const CLASS_ICON_BG = {
  warrior:  'bg-red-950/70 border-red-800/40',
  paladin:  'bg-yellow-950/70 border-yellow-800/40',
  mage:     'bg-purple-950/70 border-purple-800/40',
  healer:   'bg-emerald-950/70 border-emerald-800/40',
  assassin: 'bg-gray-800/70 border-gray-700/40',
  rogue:    'bg-orange-950/70 border-orange-800/40',
  ranger:   'bg-blue-950/70 border-blue-800/40',
  shaman:   'bg-teal-950/70 border-teal-800/40',
}

const CLASS_GLOW = {
  warrior:  'shadow-red-900/30',
  paladin:  'shadow-yellow-900/30',
  mage:     'shadow-purple-900/30',
  healer:   'shadow-emerald-900/30',
  assassin: 'shadow-gray-900/30',
  rogue:    'shadow-orange-900/30',
  ranger:   'shadow-blue-900/30',
  shaman:   'shadow-teal-900/30',
}

// ─── Shared bar ───────────────────────────────────────────────────────────────

function Bar({ value, max, color, h = 'h-2' }) {
  const pct = Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : 0))
  return (
    <div className={`w-full ${h} bg-gray-800/80 rounded-full overflow-hidden`}>
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
      <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 uppercase tracking-wider">
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
    <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider ${tierStyle}`}>
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
  const isMythic   = item.rarity === 'mythic'
  const cls        = CLASSES[item.classLock]
  const fixedSet   = new Set(item.fixedSubstatKeys ?? [])
  const hasTrait   = item.trait || item.mythicSkillTraits?.length > 0
  return (
    <div className={`absolute left-full top-0 ml-2 z-50 w-52 rounded-lg border bg-gray-950 shadow-2xl p-2.5 pointer-events-none ${isMythic ? 'border-red-800/70' : 'border-gray-700'}`}>
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
          const isFixed = isMythic && fixedSet.has(k)
          const statRar = (item.statRarities?.[k]) ?? item.rarity
          const color   = isMain
            ? `${RARITY_STAT_COLOR[statRar] ?? 'text-gray-300'} font-semibold`
            : isFixed
              ? 'text-rose-300'
              : RARITY_SECONDARY_COLOR[statRar] ?? 'text-gray-500'
          return (
            <span key={k} className={`text-[10px] ${color}`}>
              +{fmtStat(k, v)} {k.toUpperCase()}
              {isMain  && <span className="opacity-50 ml-1 text-[8px]">(main)</span>}
              {isFixed && !isMain && <span className="opacity-50 ml-1 text-[8px]">(fixed)</span>}
            </span>
          )
        })}
      </div>
      {hasTrait && (
        <div className="mt-1.5 pt-1.5 border-t border-gray-800 flex flex-col gap-0.5">
          {item.trait && (
            <div className="text-[10px] text-yellow-400 font-semibold">✦ {item.trait.label}</div>
          )}
          {(item.mythicSkillTraits ?? []).map((t, i) => (
            <div key={i} className="text-[10px] text-red-300 font-semibold">✦ {t.label}</div>
          ))}
        </div>
      )}
      {item.setId && ITEM_SET_DEFINITIONS[item.setId] && (() => {
        const sd = ITEM_SET_DEFINITIONS[item.setId]
        return <div className={`text-[9px] font-bold mt-1 ${sd.color}`}>{sd.icon} {sd.name}</div>
      })()}
      {cls && (
        <div className="text-[9px] text-gray-500 mt-0.5">{cls.icon} {cls.name} only</div>
      )}
    </div>
  )
}

// ─── Equipped items row ───────────────────────────────────────────────────────

const SLOT_ORDER = ['weapon', 'helmet', 'chest', 'gloves', 'boots', 'ring', 'amulet', 'relic']

function EquippedItems({ heroId }) {
  const allItems = useInventoryStore((s) => s.items)
  const items = allItems
    .filter((i) => i.equippedBy === heroId)
    .sort((a, b) => {
      const ai = SLOT_ORDER.indexOf(a.slot)
      const bi = SLOT_ORDER.indexOf(b.slot)
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
    })
  if (!items.length) return null

  // Group by setId, find active tier for each
  const setCounts = {}
  items.forEach((i) => { if (i.setId) setCounts[i.setId] = (setCounts[i.setId] ?? 0) + 1 })
  const activeSets = Object.entries(setCounts)
    .map(([setId, count]) => ({ setId, count, def: ITEM_SET_DEFINITIONS[setId], label: getActiveTierLabel(setId, count) }))
    .filter(({ def, label }) => def && label)

  return (
    <div className="mt-2 pt-2 border-t border-gray-800/60">
      <div className="flex flex-wrap gap-1">
        {items.map((item) => {
          const borderColor = RARITY_COLORS[item.rarity]?.split(' ')[1] ?? 'border-gray-700'
          return (
            <div key={item.uid} className="relative group/gear z-0 hover:z-20">
              <div
                className={`w-6 h-6 rounded border-2 ${borderColor} flex items-center justify-center text-xs leading-none bg-gray-950 cursor-default`}
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
      {activeSets.map(({ setId, count, def, label }) => (
        <div key={setId} className={`mt-1 text-[9px] font-bold ${def.color}`}>
          {def.icon} {def.name} <span className="opacity-70">({label} · {count} pcs)</span>
        </div>
      ))}
    </div>
  )
}

// ─── Hero active effect strip ─────────────────────────────────────────────────

const HERO_EFFECT_META = {
  stun:      { icon: '😵', label: 'Stunned',   color: 'text-yellow-400 bg-yellow-950/60 border-yellow-700/40' },
  dot:       { icon: '🔥', label: 'Burning',    color: 'text-orange-400 bg-orange-950/60 border-orange-700/40' },
  bleed:     { icon: '🩸', label: 'Bleeding',   color: 'text-red-400    bg-red-950/60    border-red-700/40'   },
  freeze:    { icon: '🧊', label: 'Frozen',     color: 'text-cyan-400   bg-cyan-950/60   border-cyan-700/40'  },
  silence:   { icon: '🤐', label: 'Silenced',   color: 'text-indigo-400 bg-indigo-950/60 border-indigo-700/40' },
  dmgReduce: { icon: '🛡️', label: 'Shield',     color: 'text-blue-400   bg-blue-950/60   border-blue-700/40'  },
  taunt:     { icon: '😤', label: 'Taunting',   color: 'text-red-400    bg-red-950/60    border-red-700/40'   },
  buff:      { icon: '✨', label: 'Buffed',     color: 'text-emerald-400 bg-emerald-950/60 border-emerald-700/40' },
  debuff:    { icon: '⬇️', label: 'Debuffed',   color: 'text-purple-400 bg-purple-950/60 border-purple-700/40' },
}

function HeroEffectStrip({ effects }) {
  const byType = {}
  for (const e of effects) {
    if (!byType[e.type] || e.ticks > byType[e.type].ticks) byType[e.type] = e
  }
  const visible = Object.values(byType).filter((e) => HERO_EFFECT_META[e.type])
  if (!visible.length) return null

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {visible.map((e) => {
        const meta = HERO_EFFECT_META[e.type]
        const label = e.type === 'buff' && e.stat ? `${e.stat.toUpperCase()} ↑` : meta.label
        return (
          <span
            key={e.type}
            title={e.ticks >= 100 ? `${label} (active for fight)` : `${label} (${e.ticks} turns)`}
            className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded border ${meta.color}`}
          >
            {meta.icon} <span className="tabular-nums">{e.ticks >= 100 ? '∞' : e.ticks}</span>
          </span>
        )
      })}
    </div>
  )
}

// ─── Job advancement badge ────────────────────────────────────────────────────

function canHeroAdvanceJob(hero) {
  const tier = hero.jobTier ?? 0
  return (
    (hero.level >= 20 && tier === 0) ||
    (hero.level >= 50 && tier === 1) ||
    (hero.level >= 100 && tier === 2)
  )
}

// ─── Compact hero card (for narrow sidebar) ───────────────────────────────────

function CompactHeroCard({ hero, onClick, effects = [], posIndex = 0, heroFormation = {}, setHeroFormation }) {
  const stats    = resolveHeroStats(hero)
  const cls      = CLASSES[hero.classId]
  const xpNeeded = xpToNextLevel(hero.level + 1)
  const isDead   = hero.isDead
  const hpPct    = stats ? hero.currentHp / stats.maxHp : 0
  const isLowHp  = hpPct < 0.3 && !isDead
  const showJobBadge = canHeroAdvanceJob(hero)
  const phase    = useCombatStore((s) => s.phase)

  const classAccent  = CLASS_ACCENT[hero.classId]  ?? 'bg-gray-600'
  const classIconBg  = CLASS_ICON_BG[hero.classId]  ?? 'bg-gray-800/70 border-gray-700/40'

  // Damage flash + floating numbers
  const prevHpRef = useRef(hero.currentHp)
  const [hitFlash, setHitFlash] = useState(false)
  const [floats, setFloats]     = useState([])
  useEffect(() => {
    const prev = prevHpRef.current
    const dmg  = prev - hero.currentHp
    if (!hero.isDead && dmg > 0) {
      const id = Date.now()
      setHitFlash(true)
      setFloats((f) => [...f, { id, value: Math.floor(dmg) }])
      const shakeTimer = setTimeout(() => setHitFlash(false), 380)
      const floatTimer = setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 700)
      prevHpRef.current = hero.currentHp
      return () => { clearTimeout(shakeTimer); clearTimeout(floatTimer) }
    }
    prevHpRef.current = hero.currentHp
  }, [hero.currentHp, hero.isDead])

  return (
    <button
      onClick={onClick}
      className={`
        relative w-full text-left rounded-lg border px-3 py-2.5 pt-3.5
        transition-all duration-150 cursor-pointer
        hover:shadow-md
        ${hitFlash ? 'anim-hit-shake' : ''}
        ${isDead
          ? 'border-red-900/20 bg-gray-950/60'
          : isLowHp
            ? 'border-red-800/40 bg-gray-900/80 animate-pulse'
            : 'border-gray-700/40 bg-gray-900/50 hover:border-gray-600/60'
        }
      `}
    >
      {/* Top class accent strip */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-lg ${isDead ? 'bg-red-900/40' : classAccent} opacity-80`} />

      {/* Dead overlay */}
      {isDead && (
        <div className="absolute inset-0 bg-red-950/20 pointer-events-none rounded-lg" />
      )}

      {/* Floating damage numbers */}
      {floats.map((f) => (
        <div
          key={f.id}
          className="anim-dmg-float absolute right-2 top-1 pointer-events-none text-red-400 font-black text-sm tabular-nums select-none z-10"
        >
          -{f.value.toLocaleString()}
        </div>
      ))}

      {/* Row 1: icon + name + level */}
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="relative shrink-0">
          <span className={`
            w-9 h-9 rounded-lg border flex items-center justify-center text-lg
            leading-none select-none transition-all duration-150
            ${isDead ? 'grayscale opacity-40 bg-gray-800/50 border-gray-700/30' : classIconBg}
            ${!isDead && phase === 'idle' ? 'anim-idle-breathe' : ''}
          `}>
            {cls?.icon ?? '⚔️'}
          </span>
          {showJobBadge && !isDead && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse border border-amber-600 shadow-sm shadow-amber-500/50" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className={`font-bold text-xs leading-tight truncate ${isDead ? 'text-gray-600' : 'text-gray-100'}`}>
              {hero.name}
              {isDead && <span className="text-[9px] text-red-500 font-black ml-1.5">† FALLEN</span>}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <FormationBadge heroId={hero.id} posIndex={posIndex} heroFormation={heroFormation} setHeroFormation={setHeroFormation} />
              <span className="text-[10px] font-black text-amber-400 tabular-nums">Lv {hero.level}</span>
            </div>
          </div>
          <JobBadge hero={hero} />
        </div>
      </div>

      {/* Row 2: bars */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-gray-600 w-4 shrink-0 font-semibold">HP</span>
          <div className="flex-1">
            <Bar
              value={hero.currentHp}
              max={stats?.maxHp ?? 1}
              color={isDead ? 'bg-red-900' : hpPct < 0.3 ? 'bg-red-600' : 'bg-red-500'}
              h="h-2"
            />
          </div>
          <span className={`text-[10px] w-10 text-right shrink-0 tabular-nums font-semibold ${
            isDead ? 'text-gray-700' : hpPct < 0.3 ? 'text-red-400' : 'text-gray-400'
          }`}>
            {isDead ? '0' : Math.floor(hero.currentHp)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-gray-600 w-4 shrink-0 font-semibold">MP</span>
          <div className="flex-1">
            <Bar value={hero.currentMana} max={stats?.maxMana ?? 1} color="bg-indigo-500" h="h-2" />
          </div>
          <span className="text-[10px] text-gray-600 w-10 text-right shrink-0 tabular-nums">
            {Math.floor(hero.currentMana)}
          </span>
        </div>

        {/* XP bar — thin, amber */}
        <Bar value={hero.xp} max={xpNeeded} color="bg-amber-500/50" h="h-1" />
      </div>

      {/* Active effects */}
      <HeroEffectStrip effects={effects} />

      {/* Row 3: equipped items */}
      <EquippedItems heroId={hero.id} />
    </button>
  )
}

// ─── Full hero card (for wider layouts) ──────────────────────────────────────

function FullHeroCard({ hero, onClick, effects = [], posIndex = 0, heroFormation = {}, setHeroFormation }) {
  const stats    = resolveHeroStats(hero)
  const cls      = CLASSES[hero.classId]
  const xpNeeded = xpToNextLevel(hero.level + 1)
  const isDead   = hero.isDead
  const hpPct    = stats ? hero.currentHp / stats.maxHp : 0
  const isLowHp  = hpPct < 0.3 && !isDead
  const showJobBadge = canHeroAdvanceJob(hero)
  const phase    = useCombatStore((s) => s.phase)

  const classAccent = CLASS_ACCENT[hero.classId] ?? 'bg-gray-600'
  const classIconBg = CLASS_ICON_BG[hero.classId] ?? 'bg-gray-800/70 border-gray-700/40'

  // Damage flash + floating numbers
  const prevHpRef = useRef(hero.currentHp)
  const [hitFlash, setHitFlash] = useState(false)
  const [floats, setFloats]     = useState([])
  useEffect(() => {
    const prev = prevHpRef.current
    const dmg  = prev - hero.currentHp
    if (!hero.isDead && dmg > 0) {
      const id = Date.now()
      setHitFlash(true)
      setFloats((f) => [...f, { id, value: Math.floor(dmg) }])
      const shakeTimer = setTimeout(() => setHitFlash(false), 380)
      const floatTimer = setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 700)
      prevHpRef.current = hero.currentHp
      return () => { clearTimeout(shakeTimer); clearTimeout(floatTimer) }
    }
    prevHpRef.current = hero.currentHp
  }, [hero.currentHp, hero.isDead])

  return (
    <button
      onClick={onClick}
      className={`
        relative w-full text-left rounded-lg border p-3 pt-4
        transition-all duration-150 cursor-pointer
        hover:shadow-md
        ${hitFlash ? 'anim-hit-shake' : ''}
        ${isDead
          ? 'border-red-900/30 bg-gray-950/40 opacity-60 grayscale'
          : isLowHp
            ? 'border-red-800/50 bg-gray-900/80'
            : 'border-gray-700/50 bg-gray-900/60 hover:border-gray-600/60'
        }
      `}
    >
      {/* Top class accent strip */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-lg ${isDead ? 'bg-red-900/40' : classAccent} opacity-80`} />

      {/* Dead overlay */}
      {isDead && (
        <div className="absolute inset-0 bg-red-950/10 pointer-events-none rounded-lg" />
      )}

      {/* Floating damage numbers */}
      {floats.map((f) => (
        <div
          key={f.id}
          className="anim-dmg-float absolute right-3 top-2 pointer-events-none text-red-400 font-black text-base tabular-nums select-none z-10"
        >
          -{f.value.toLocaleString()}
        </div>
      ))}

      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span className={`w-10 h-10 rounded-lg border flex items-center justify-center text-2xl leading-none select-none ${classIconBg} ${!isDead && phase === 'idle' ? 'anim-idle-breathe' : ''}`}>{cls?.icon ?? '⚔️'}</span>
            {showJobBadge && !isDead && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 animate-pulse border border-amber-600 shadow-sm shadow-amber-500/50" title="Ready to advance job!" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-gray-100 leading-tight">{hero.name}</span>
              {isDead && <span className="text-[10px] text-red-500 font-black tracking-wider">† FALLEN</span>}
            </div>
            <div className="mt-0.5"><JobBadge hero={hero} /></div>
          </div>
        </div>
        <div className="text-right shrink-0 flex flex-col items-end gap-1">
          <FormationBadge heroId={hero.id} posIndex={posIndex} heroFormation={heroFormation} setHeroFormation={setHeroFormation} />
          <div className="text-sm font-black text-amber-400 tabular-nums">Lv {hero.level}</div>
          <div className="text-[10px] text-gray-600 tabular-nums">
            {Math.floor(hero.xp).toLocaleString()} / {xpNeeded.toLocaleString()} xp
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-[10px] mb-0.5">
          <span className="text-gray-600 font-semibold">HP</span>
          <span className={`tabular-nums font-semibold ${hpPct < 0.3 ? 'text-red-400' : 'text-gray-500'}`}>
            {Math.floor(hero.currentHp)}/{Math.floor(stats?.maxHp ?? 0)}
          </span>
        </div>
        <Bar value={hero.currentHp} max={stats?.maxHp ?? 1}
          color={hpPct < 0.3 ? 'bg-red-600' : 'bg-red-500'} h="h-2" />

        <div className="flex justify-between text-[10px] mb-0.5 mt-0.5">
          <span className="text-gray-600 font-semibold">Mana</span>
          <span className="text-gray-600 tabular-nums">{Math.floor(hero.currentMana)}/{Math.floor(stats?.maxMana ?? 0)}</span>
        </div>
        <Bar value={hero.currentMana} max={stats?.maxMana ?? 1} color="bg-indigo-500" h="h-2" />

        <Bar value={hero.xp} max={xpNeeded} color="bg-amber-500/60" h="h-1" />
      </div>

      {stats && (
        <div className="flex gap-3 mt-2.5 text-[10px] text-gray-600">
          <span title="Attack">⚔️ {Math.floor(stats.atk)}</span>
          <span title="Defense">🛡️ {Math.floor(stats.def)}</span>
          <span title="Speed">💨 {stats.spd.toFixed(1)}</span>
          <span title="Crit">🎯 {(stats.crit * 100).toFixed(0)}%</span>
        </div>
      )}

      <HeroEffectStrip effects={effects} />

      <EquippedItems heroId={hero.id} />
    </button>
  )
}

// ─── Formation row badge (clickable toggle) ───────────────────────────────────

function FormationBadge({ heroId, posIndex, heroFormation, setHeroFormation }) {
  const row     = heroFormation[heroId] ?? (posIndex <= 1 ? 'front' : 'back')
  const isFront = row === 'front'

  function toggle(e) {
    e.stopPropagation()
    setHeroFormation(heroId, isFront ? 'back' : 'front')
  }

  return (
    <button
      onClick={toggle}
      title={isFront ? 'Front row — 2× target chance, full damage. Click to move back.' : 'Back row — 1× target chance, 20% less damage. Click to move front.'}
      className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded leading-none transition-colors ${
        isFront
          ? 'text-red-400 bg-red-950/50 border border-red-800/40 hover:bg-red-900/40'
          : 'text-blue-400 bg-blue-950/50 border border-blue-800/40 hover:bg-blue-900/40'
      }`}
    >
      {isFront ? '⚔ Front' : '🛡 Back'}
    </button>
  )
}

// ─── Party panel ──────────────────────────────────────────────────────────────

export default function PartyPanel({ compact = false }) {
  const { heroes, partyIds, swapPartyPositions, heroFormation, setHeroFormation } = useGameStore()
  const activeEffects = useCombatStore((s) => s.activeEffects)
  const [selectedHeroId, setSelectedHeroId] = useState(null)
  const [synergyOpen, setSynergyOpen]       = useState(false)
  const [draggedId, setDraggedId]           = useState(null)
  const [dragOverId, setDragOverId]         = useState(null)
  const synergyRef = useRef(null)

  const party = partyIds.map((id) => heroes[id]).filter(Boolean)
  const HeroCard = compact ? CompactHeroCard : FullHeroCard
  const activeSynergies = computePartySynergies(party)
  const activeNames = new Set(activeSynergies.map((s) => s.name))

  // Close synergy popover on outside click
  useEffect(() => {
    if (!synergyOpen) return
    function handler(e) {
      if (synergyRef.current && !synergyRef.current.contains(e.target)) setSynergyOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [synergyOpen])

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-600 px-1 flex items-center gap-2">
        <span>Party</span>
        <span className="flex-1 h-px bg-gray-800" />
        {/* Active synergy dots + info button */}
        {activeSynergies.length > 0 && (
          <span className="flex gap-0.5">
            {activeSynergies.map((s) => (
              <span key={s.name} className="text-[10px] leading-none" title={s.name}>{s.icon}</span>
            ))}
          </span>
        )}
        <div className="relative" ref={synergyRef}>
          <button
            onClick={() => setSynergyOpen((v) => !v)}
            className="text-[9px] w-4 h-4 rounded-full border border-gray-700 text-gray-500 hover:border-amber-700/60 hover:text-amber-400 flex items-center justify-center transition-colors leading-none"
            title="Party synergies"
          >
            ?
          </button>
          {synergyOpen && (
            <div className="absolute right-0 top-6 z-50 w-64 rounded-lg border border-gray-700 bg-gray-950 shadow-2xl p-2.5 flex flex-col gap-1">
              <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Party Synergies</div>
              {ALL_SYNERGY_DEFINITIONS.map((def) => {
                const active = activeNames.has(def.name)
                return (
                  <div key={def.name} className={`flex items-start gap-2 px-2 py-1.5 rounded border ${active ? 'border-amber-800/50 bg-amber-950/30' : 'border-gray-800/40 bg-gray-900/20 opacity-60'}`}>
                    <span className="text-base leading-none shrink-0 mt-0.5">{def.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold ${active ? 'text-amber-400' : 'text-gray-500'}`}>{def.name}</span>
                        {active && <span className="text-[8px] text-amber-600 font-semibold">● Active</span>}
                      </div>
                      <div className={`text-[9px] font-semibold ${active ? 'text-amber-500' : 'text-gray-500'}`}>{def.bonus}</div>
                      <div className="text-[8px] text-gray-600 mt-0.5">{def.condition}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </h2>

      {party.map((hero, posIndex) => {
        const isDragging = draggedId === hero.id
        const isOver     = dragOverId === hero.id && draggedId !== hero.id
        return (
          <div
            key={hero.id}
            draggable
            onDragStart={(e) => {
              setDraggedId(hero.id)
              e.dataTransfer.effectAllowed = 'move'
            }}
            onDragEnd={() => { setDraggedId(null); setDragOverId(null) }}
            onDragOver={(e) => { e.preventDefault(); setDragOverId(hero.id) }}
            onDragLeave={() => setDragOverId(null)}
            onDrop={(e) => {
              e.preventDefault()
              if (draggedId && draggedId !== hero.id) swapPartyPositions(draggedId, hero.id)
              setDraggedId(null)
              setDragOverId(null)
            }}
            className={`relative hover:z-10 rounded-lg transition-all duration-100 cursor-grab active:cursor-grabbing
              ${isDragging ? 'opacity-40 scale-95' : ''}
              ${isOver ? 'ring-2 ring-amber-500/60 ring-offset-1 ring-offset-gray-950' : ''}
            `}
          >
            <HeroCard
              hero={hero}
              onClick={() => setSelectedHeroId(hero.id)}
              effects={activeEffects[hero.id] ?? []}
              posIndex={posIndex}
              heroFormation={heroFormation}
              setHeroFormation={setHeroFormation}
            />
          </div>
        )
      })}

      {party.length === 0 && (
        <p className="text-center text-gray-700 text-xs py-8">No party selected.</p>
      )}

      <HeroDetailModal
        heroId={selectedHeroId}
        open={!!selectedHeroId}
        onClose={() => setSelectedHeroId(null)}
      />

    </section>
  )
}
