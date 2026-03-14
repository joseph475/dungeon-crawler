import { useState } from 'react'
import { useGameStore, resolveHeroStats, xpToNextLevel } from '@/store/useGameStore'
import { useInventoryStore, RARITY_COLORS } from '@/store/useInventoryStore'
import { CLASSES } from '@/data/classes'
import { JOBS, JOB_ADVANCEMENT_LEVELS, getTier1Jobs, getNextJobs } from '@/data/jobs'
import { getSkillSet } from '@/data/skills'
import { RARITY_STAT_COLOR, RARITY_SECONDARY_COLOR } from '@/data/items'
import { getSkillRank, getUpgradeCost, MAX_RANK, rankDmgMult, rankExtraTicks, rankCdReduction } from '@/utils/skillRank'

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
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
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

const PERCENT_STATS = new Set(['crit', 'critDmg', 'evasion'])
function fmtStat(key, v) {
  if (PERCENT_STATS.has(key)) return `${(v * 100).toFixed(1)}%`
  if (key === 'spd') return v.toFixed(1)
  return Math.floor(v)
}

// ─── Class theme maps ─────────────────────────────────────────────────────────

const CLASS_ACCENT_BAR = {
  warrior:  'from-red-600 to-red-800',
  paladin:  'from-yellow-500 to-yellow-700',
  mage:     'from-purple-500 to-purple-700',
  healer:   'from-emerald-500 to-emerald-700',
  assassin: 'from-gray-500 to-gray-700',
  rogue:    'from-orange-500 to-orange-700',
  ranger:   'from-blue-500 to-blue-700',
  shaman:   'from-teal-500 to-teal-700',
}
const CLASS_ICON_BG = {
  warrior:  'bg-red-950/80 border-red-800/50',
  paladin:  'bg-yellow-950/80 border-yellow-800/50',
  mage:     'bg-purple-950/80 border-purple-800/50',
  healer:   'bg-emerald-950/80 border-emerald-800/50',
  assassin: 'bg-gray-800/80 border-gray-600/50',
  rogue:    'bg-orange-950/80 border-orange-800/50',
  ranger:   'bg-blue-950/80 border-blue-800/50',
  shaman:   'bg-teal-950/80 border-teal-800/50',
}
const CLASS_ACCENT_TEXT = {
  warrior:  'text-red-400',   paladin:  'text-yellow-400',  mage:     'text-purple-400',
  healer:   'text-emerald-400', assassin: 'text-gray-400',  rogue:    'text-orange-400',
  ranger:   'text-blue-400',  shaman:   'text-teal-400',
}

// ─── Shared bar ───────────────────────────────────────────────────────────────

function Bar({ value, max, color, h = 'h-1.5' }) {
  const pct = Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : 0))
  return (
    <div className={`w-full ${h} bg-gray-800/80 rounded-full overflow-hidden`}>
      <div className={`h-full rounded-full transition-all duration-150 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

// ─── Section title ────────────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 shrink-0">{children}</span>
      <div className="flex-1 h-px bg-gray-800/80" />
    </div>
  )
}

// ─── Stat block ───────────────────────────────────────────────────────────────

function StatBlock({ icon, label, value, highlight, warn }) {
  return (
    <div className="rounded-lg bg-gray-800/50 border border-gray-700/40 px-2 py-1.5 flex flex-col gap-0.5">
      <div className="text-[8px] text-gray-400 uppercase tracking-wider">{icon} {label}</div>
      <div className={`text-sm font-black tabular-nums leading-none ${warn ? 'text-red-400' : highlight ? 'text-amber-400' : 'text-gray-100'}`}>
        {value}
      </div>
    </div>
  )
}

// ─── Skill card ───────────────────────────────────────────────────────────────

const SLOT_STYLES = {
  basic:    { card: 'bg-gray-800/50 border-gray-700/60',     badge: 'bg-gray-700/80 text-gray-400',      dot: 'bg-gray-500', label: 'Basic'    },
  skill:    { card: 'bg-blue-950/40 border-blue-800/50',     badge: 'bg-blue-900/60 text-blue-300',      dot: 'bg-blue-500', label: 'Skill'    },
  ultimate: { card: 'bg-purple-950/40 border-purple-800/50', badge: 'bg-purple-900/60 text-purple-300',  dot: 'bg-purple-500', label: 'Ult'    },
  passive:  { card: 'bg-green-950/40 border-green-800/50',   badge: 'bg-green-900/60 text-green-300',    dot: 'bg-green-500', label: 'Passive' },
}

function SkillCard({ skill, rank = 1, shards = 0, onUpgrade }) {
  const style = SLOT_STYLES[skill.slot] ?? SLOT_STYLES.basic
  const upgradeable = skill.slot !== 'passive'
  const cost = upgradeable ? getUpgradeCost(rank) : null
  const isMax = rank >= MAX_RANK
  const canAfford = cost !== null && shards >= cost

  const rankDots = upgradeable
    ? Array.from({ length: MAX_RANK }, (_, i) => i < rank)
    : []

  return (
    <div className={`rounded-lg border p-2.5 ${style.card}`}>
      <div className="flex items-start gap-2 mb-1.5">
        <span className="text-lg leading-none mt-0.5 shrink-0">{skill.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[11px] font-bold text-gray-100 leading-tight">{skill.name}</span>
            <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ${style.badge}`}>
              {style.label}
            </span>
            {upgradeable && (
              <span className="flex gap-0.5 ml-auto shrink-0">
                {rankDots.map((filled, i) => (
                  <span key={i} className={`w-1.5 h-1.5 rounded-full ${filled ? 'bg-amber-400' : 'bg-gray-700'}`} />
                ))}
              </span>
            )}
          </div>
          <p className="text-[10px] text-gray-400 leading-snug">{skill.desc}</p>
        </div>
      </div>
      {/* Rank bonus summary — only shown when rank > 1 */}
      {upgradeable && rank > 1 && (
        <div className="flex flex-wrap gap-1.5 mt-1 mb-1">
          <span className="text-[9px] text-amber-400 font-semibold">
            +{((rankDmgMult(rank) - 1) * 100).toFixed(0)}% power
          </span>
          {rankExtraTicks(rank) > 0 && (
            <span className="text-[9px] text-amber-400 font-semibold">
              +{rankExtraTicks(rank)} duration
            </span>
          )}
          {rankCdReduction(rank) > 0 && (
            <span className="text-[9px] text-amber-400 font-semibold">
              −{rankCdReduction(rank)} CD
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2.5 mt-1">
        <div className="flex gap-2.5 flex-1">
          {skill.cooldownTurns != null && (() => {
            const effectiveCd = Math.max(1, skill.cooldownTurns - rankCdReduction(rank))
            const reduced = effectiveCd < skill.cooldownTurns
            return (
              <span className={`text-[9px] ${reduced ? 'text-amber-400' : 'text-gray-400'}`}>
                ⏱ {effectiveCd}-turn cd{reduced ? ` (base ${skill.cooldownTurns})` : ''}
              </span>
            )
          })()}
          {skill.manaCost != null && (
            <span className="text-[9px] text-indigo-400">💧 {skill.manaCost} mp</span>
          )}
          {skill.slot === 'ultimate' && skill.manaCost == null && (
            <span className="text-[9px] text-indigo-400">💧 Full mana</span>
          )}
        </div>
        {upgradeable && !isMax && (
          <button
            onClick={onUpgrade}
            disabled={!canAfford}
            className={`text-[9px] px-2 py-0.5 rounded border font-semibold transition-colors shrink-0 ${
              canAfford
                ? 'border-amber-700/60 text-amber-400 hover:bg-amber-950/40'
                : 'border-gray-800 text-gray-700 cursor-not-allowed'
            }`}
            title={canAfford ? `Upgrade to rank ${rank + 1}` : `Need ${cost} 💎`}
          >
            💎 {cost} → Rank {rank + 1}
          </button>
        )}
        {upgradeable && isMax && (
          <span className="text-[9px] text-amber-500 font-bold shrink-0">★ Max</span>
        )}
      </div>
    </div>
  )
}

// ─── Equipment slot ───────────────────────────────────────────────────────────

const SLOT_ICONS = {
  weapon: '⚔️', helmet: '⛑️', chest: '🧥', gloves: '🧤',
  boots: '👢', ring: '💍', amulet: '📿', relic: '🔮',
}

function GearSlot({ slotKey, item, onUnequip }) {
  const rarityClass = item ? RARITY_COLORS[item.rarity] : 'border-gray-800 bg-gray-800/20'
  return (
    <div className={`group relative rounded-lg border p-2 flex flex-col gap-0.5 min-h-20 transition-all duration-150 ${rarityClass}`}>
      {/* Slot label */}
      <div className="flex items-center gap-1 text-[8px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">
        <span>{SLOT_ICONS[slotKey]}</span>
        <span>{slotKey}</span>
      </div>

      {item ? (
        <>
          <div className={`text-[10px] font-bold leading-tight ${RARITY_COLORS[item.rarity]?.split(' ')[0] ?? 'text-gray-300'}`}>
            {item.icon} {item.name}
          </div>
          {item.itemLevel && <div className="text-[8px] text-gray-400">iLv {item.itemLevel}</div>}
          <div className="flex flex-col gap-0.5 mt-0.5">
            {Object.entries(item.stats ?? {}).map(([k, v]) => {
              const isMain  = k === item.mainStat
              const statRar = (item.statRarities?.[k]) ?? item.rarity
              const color   = isMain
                ? `${RARITY_STAT_COLOR[statRar] ?? 'text-gray-300'} font-semibold`
                : RARITY_SECONDARY_COLOR[statRar] ?? 'text-gray-600'
              return <span key={k} className={`text-[9px] ${color}`}>+{fmtStat(k, v)} {k.toUpperCase()}</span>
            })}
            {item.trait && (
              <span className="text-[9px] text-yellow-400 font-semibold">✦ {item.trait.label}</span>
            )}
            {(item.mythicSkillTraits ?? []).map((t, i) => (
              <span key={i} className="text-[9px] text-red-300 font-semibold">✦ {t.label}</span>
            ))}
          </div>
          {/* Unequip — absolutely positioned, no layout shift */}
          <button
            onClick={() => onUnequip(item.uid, slotKey)}
            className="absolute bottom-1.5 right-1.5 text-[8px] text-gray-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 font-semibold"
          >
            ✕ unequip
          </button>
        </>
      ) : (
        <div className="text-[9px] text-gray-500 mt-auto">Empty</div>
      )}
    </div>
  )
}

// ─── Job tree ─────────────────────────────────────────────────────────────────

const TIER_STYLES = {
  1: {
    active:   'border-green-600/80 bg-green-950/60 text-green-300',
    pickable: 'border-green-700/50 bg-green-950/30 text-green-400 hover:border-green-600/70 cursor-pointer',
    locked:   'border-gray-800/40 bg-gray-900/20 text-gray-700 opacity-40',
    inactive: 'border-gray-700/40 bg-gray-900/30 text-gray-500',
    header:   'text-green-600',
    advBtn:   'border-green-700/60 bg-green-900/30 text-green-400 hover:bg-green-900/50',
    label:    'Tier 1',
    level:    'Lv 20',
  },
  2: {
    active:   'border-blue-600/80 bg-blue-950/60 text-blue-300',
    pickable: 'border-blue-700/50 bg-blue-950/30 text-blue-400 hover:border-blue-600/70 cursor-pointer',
    locked:   'border-gray-800/40 bg-gray-900/20 text-gray-700 opacity-40',
    inactive: 'border-gray-700/40 bg-gray-900/30 text-gray-500',
    header:   'text-blue-600',
    advBtn:   'border-blue-700/60 bg-blue-900/30 text-blue-400 hover:bg-blue-900/50',
    label:    'Tier 2',
    level:    'Lv 50',
  },
  3: {
    active:   'border-purple-600/80 bg-purple-950/60 text-purple-300',
    pickable: 'border-purple-700/50 bg-purple-950/30 text-purple-400 hover:border-purple-600/70 cursor-pointer',
    locked:   'border-gray-800/40 bg-gray-900/20 text-gray-700 opacity-40',
    inactive: 'border-gray-700/40 bg-gray-900/30 text-gray-500',
    header:   'text-purple-600',
    advBtn:   'border-purple-700/60 bg-purple-900/30 text-purple-400 hover:bg-purple-900/50',
    label:    'Tier 3',
    level:    'Lv 100',
  },
}

function JobCard({ job, isActive, isPickable, isLocked, onAdvance, onPreview, isPreviewed }) {
  const ts = TIER_STYLES[job.tier]
  const cardClass = isActive ? ts.active : isPickable ? ts.pickable : isLocked ? ts.locked : ts.inactive

  return (
    <div className={`rounded-lg border p-2.5 transition-all duration-150 ${cardClass} ${isPreviewed ? 'ring-1 ring-yellow-500/40' : ''}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-lg leading-none ${isLocked ? 'grayscale' : ''}`}>{job.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold leading-tight truncate">{job.name}</div>
          {isActive && (
            <span className="text-[8px] font-black uppercase tracking-wider text-current opacity-70">● Active</span>
          )}
        </div>
      </div>

      {!isLocked && (
        <p className="text-[9px] leading-snug text-gray-400 mb-1.5">{job.description}</p>
      )}

      {isPickable && (
        <div className="flex gap-1.5 mt-1">
          <button
            onClick={() => onAdvance(job.id)}
            className={`flex-1 text-[9px] py-1 rounded border font-bold transition-colors ${ts.advBtn}`}
          >
            Advance →
          </button>
          {onPreview && (
            <button
              onClick={() => onPreview(isPreviewed ? null : job.id)}
              className={`text-[9px] px-1.5 py-1 rounded border transition-colors ${
                isPreviewed
                  ? 'border-yellow-600/60 bg-yellow-900/30 text-yellow-400'
                  : 'border-gray-700/50 text-gray-600 hover:text-yellow-500 hover:border-yellow-700/40'
              }`}
              title="Preview skills"
            >
              {isPreviewed ? '▲' : '▼'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const PREVIEW_SLOT_COLORS = {
  basic:    'text-gray-400 border-gray-700 bg-gray-800/40',
  skill:    'text-blue-300 border-blue-800 bg-blue-950/40',
  ultimate: 'text-purple-300 border-purple-800 bg-purple-950/40',
  passive:  'text-green-300 border-green-800 bg-green-950/40',
}

function JobSkillPreview({ classId, currentJobId, previewJobId }) {
  const currentSkills = getSkillSet(classId, currentJobId)
  const previewSkills = getSkillSet(classId, previewJobId)
  const job = JOBS[previewJobId]
  return (
    <div className="mt-3 rounded-lg border border-yellow-700/40 bg-yellow-950/10 p-3">
      <p className="text-[10px] text-yellow-400 font-semibold mb-2">
        {job?.icon} Preview: {job?.name} skills
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {previewSkills.map((skill, i) => {
          const changed = currentSkills[i]?.id !== skill.id
          const style = PREVIEW_SLOT_COLORS[skill.slot] ?? PREVIEW_SLOT_COLORS.basic
          return (
            <div key={skill.id} className={`rounded border p-2 ${style} ${changed ? 'ring-1 ring-yellow-500/40' : 'opacity-60'}`}>
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-sm leading-none">{skill.icon}</span>
                <span className="text-[10px] font-semibold">{skill.name}</span>
                {changed && <span className="ml-auto text-[8px] text-yellow-400 font-bold uppercase">New</span>}
              </div>
              <p className="text-[9px] text-gray-400 leading-snug">{skill.desc}</p>
            </div>
          )
        })}
      </div>
      <p className="text-[9px] text-gray-400 mt-2">Click "Advance →" to confirm.</p>
    </div>
  )
}

function JobTreeVisual({ hero, onAdvance }) {
  const [previewJobId, setPreviewJobId] = useState(null)

  const tier1Jobs = getTier1Jobs(hero.classId)
  const tier2Jobs = tier1Jobs.flatMap((j) => getNextJobs(j.id))
  const tier3Jobs = tier2Jobs.flatMap((j) => getNextJobs(j.id))

  // Build active path as a Set of job IDs
  const activeJobPath = new Set()
  if (hero.jobId) {
    let job = JOBS[hero.jobId]
    while (job) { activeJobPath.add(job.id); job = job.parent ? JOBS[job.parent] : null }
  }

  const nextTier    = (hero.jobTier ?? 0) + 1
  const advLevel    = JOB_ADVANCEMENT_LEVELS[nextTier] ?? 999
  const canAdvance  = hero.level >= advLevel && hero.jobTier < 3

  const pickableIds = new Set()
  if (canAdvance) {
    const all = [...tier1Jobs, ...tier2Jobs, ...tier3Jobs]
    all.forEach((j) => {
      if (j.tier !== nextTier) return
      if (nextTier === 1) { pickableIds.add(j.id); return }
      if (j.parent === hero.jobId && j.baseClass === hero.classId) pickableIds.add(j.id)
    })
  }

  function isLocked(job) {
    if (activeJobPath.has(job.id)) return false
    if (pickableIds.has(job.id)) return false
    if (job.tier === 1) return hero.jobTier >= 1
    if (job.tier === 2) {
      const activeT1 = [...activeJobPath].find((id) => JOBS[id]?.tier === 1)
      if (activeT1 && job.parent !== activeT1) return true
      return hero.jobTier >= 2
    }
    if (job.tier === 3) {
      const activeT2 = [...activeJobPath].find((id) => JOBS[id]?.tier === 2)
      if (activeT2 && job.parent !== activeT2) return true
      return hero.jobTier >= 3
    }
    return false
  }

  const tiers = [tier1Jobs, tier2Jobs, tier3Jobs]

  return (
    <div>
      {canAdvance && (
        <div className="mb-3 rounded-lg border border-yellow-700/40 bg-yellow-950/20 px-3 py-2 flex items-center gap-2">
          <span className="text-yellow-400 text-sm animate-pulse">✦</span>
          <span className="text-[11px] text-yellow-300 font-semibold">
            Job advancement available! Choose your Tier {nextTier} path.
          </span>
        </div>
      )}
      {!canAdvance && hero.jobTier < 3 && (
        <div className="mb-3 text-[10px] text-gray-400">
          Next advancement at <span className="text-amber-400 font-bold">Level {advLevel}</span>
          <span className="text-gray-500"> (currently {hero.level})</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {tiers.map((jobs, ti) => {
          const tier = ti + 1
          const ts   = TIER_STYLES[tier]
          return (
            <div key={tier} className="flex flex-col gap-2">
              {/* Tier header */}
              <div className={`flex items-center gap-1.5 pb-1.5 border-b border-gray-800/60`}>
                <span className={`text-[9px] font-black uppercase tracking-widest ${ts.header}`}>{ts.label}</span>
                <span className="text-[9px] text-gray-500">{ts.level}</span>
              </div>
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isActive={activeJobPath.has(job.id)}
                  isPickable={pickableIds.has(job.id)}
                  isLocked={isLocked(job)}
                  onAdvance={onAdvance}
                  onPreview={canAdvance ? setPreviewJobId : null}
                  isPreviewed={previewJobId === job.id}
                />
              ))}
            </div>
          )
        })}
      </div>

      {previewJobId && (
        <JobSkillPreview classId={hero.classId} currentJobId={hero.jobId} previewJobId={previewJobId} />
      )}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function HeroDetailModal({ heroId, open, onClose }) {
  const { heroes, skillShards, upgradeSkill } = useGameStore()
  const invStore   = useInventoryStore()
  const gameStore  = useGameStore()
  const [swapOpen, setSwapOpen] = useState(false)

  if (!open || !heroId) return null
  const hero = heroes[heroId]
  if (!hero) return null

  const stats    = resolveHeroStats(hero)
  const cls      = CLASSES[hero.classId]
  const job      = hero.jobId ? JOBS[hero.jobId] : null
  const skills   = getSkillSet(hero.classId, hero.jobId)
  const xpNeeded = xpToNextLevel(hero.level + 1)
  const hpPct    = stats ? (hero.currentHp / stats.maxHp) * 100 : 0

  const accentBar  = CLASS_ACCENT_BAR[hero.classId]  ?? 'from-gray-600 to-gray-800'
  const iconBg     = CLASS_ICON_BG[hero.classId]      ?? 'bg-gray-800/80 border-gray-600/50'
  const accentText = CLASS_ACCENT_TEXT[hero.classId]  ?? 'text-gray-400'

  const equippedItems = invStore.getEquippedItems(heroId)
  const slotMap = {}
  equippedItems.forEach((i) => { slotMap[i.slot] = i })

  const traitItems = equippedItems.filter((i) => i.trait || i.mythicSkillTraits?.length)
  const jobTierDots = ['', '●', '●●', '●●●'][hero.jobTier ?? 0]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-xl border border-gray-700/80 bg-gray-950 shadow-2xl overflow-hidden">

        {/* Top accent strip */}
        <div className={`h-1 w-full bg-linear-to-r ${accentBar} shrink-0`} />

        {/* ── Hero header ── */}
        <div className="px-5 py-4 border-b border-gray-800/60 bg-gray-900/40 shrink-0">
          <div className="flex items-center gap-4">
            {/* Class icon */}
            <div className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center text-4xl shrink-0 ${iconBg}`}>
              {cls?.icon ?? '⚔️'}
            </div>

            {/* Name + bars */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5">
                <h2 className="text-lg font-black text-gray-100">{hero.name}</h2>
                {hero.isDead && <span className="text-[10px] text-red-500 font-black">† FALLEN</span>}
              </div>
              <div className="flex items-center gap-2 mb-2.5">
                <span className={`text-xs font-semibold ${accentText}`}>
                  {job ? `${job.icon} ${job.name}` : cls?.name}
                </span>
                {jobTierDots && <span className={`text-[9px] ${accentText} opacity-60`}>{jobTierDots}</span>}
                <span className="text-gray-700 text-[10px]">·</span>
                <span className={`text-xs font-black ${accentText}`}>Lv {hero.level}</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] text-gray-600 w-4 font-bold shrink-0">HP</span>
                  <div className="flex-1"><Bar value={hero.currentHp} max={stats?.maxHp ?? 1} color={hpPct < 30 ? 'bg-red-600' : 'bg-red-500'} h="h-2" /></div>
                  <span className={`text-[10px] tabular-nums w-24 text-right shrink-0 font-semibold ${hpPct < 30 ? 'text-red-400' : 'text-gray-500'}`}>
                    {Math.floor(hero.currentHp)} / {Math.floor(stats?.maxHp ?? 0)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] text-gray-600 w-4 font-bold shrink-0">MP</span>
                  <div className="flex-1"><Bar value={hero.currentMana} max={stats?.maxMana ?? 1} color="bg-indigo-500" h="h-2" /></div>
                  <span className="text-[10px] tabular-nums w-24 text-right shrink-0 text-gray-600">
                    {Math.floor(hero.currentMana)} / {Math.floor(stats?.maxMana ?? 0)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] text-gray-600 w-4 font-bold shrink-0">XP</span>
                  <div className="flex-1"><Bar value={hero.xp} max={xpNeeded} color="bg-amber-500/60" h="h-1.5" /></div>
                  <span className="text-[9px] tabular-nums w-24 text-right shrink-0 text-gray-600">
                    {Math.floor(hero.xp).toLocaleString()} / {xpNeeded.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 self-start shrink-0">
              <button
                onClick={() => setSwapOpen(true)}
                className="text-[10px] px-2 py-1 rounded border border-gray-700 text-gray-500 hover:border-amber-700/60 hover:text-amber-400 transition-colors"
                title="Swap hero"
              >
                ⇄ Swap
              </button>
              <button onClick={onClose} className="text-gray-600 hover:text-gray-300 text-xl leading-none p-1">✕</button>
            </div>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 p-5 flex flex-col gap-5">

          {/* ── Two-column row: Stats+Skills | Equipment ── */}
          <div className="grid grid-cols-2 gap-5">

            {/* Left: Combat stats + Skills + Traits */}
            <div className="flex flex-col gap-4">
              <div>
                <SectionTitle>Combat Stats</SectionTitle>
                <div className="grid grid-cols-2 gap-1.5">
                  <StatBlock icon="⚔️" label="ATK"   value={stats?.atk.toFixed(1) ?? 0} highlight />
                  <StatBlock icon="🛡️" label="DEF"   value={stats?.def.toFixed(1) ?? 0} highlight />
                  <StatBlock icon="💨" label="SPD"   value={stats?.spd.toFixed(2) ?? 0} />
                  <StatBlock icon="🎯" label="CRIT"  value={`${Math.min((stats?.crit ?? 0) * 100, 100).toFixed(1)}%`} warn={(stats?.crit ?? 0) >= 1} />
                  <StatBlock icon="💥" label="C.DMG" value={`${((stats?.critDmg ?? 1.5) * 100).toFixed(0)}%`} />
                  <StatBlock icon="❤️" label="Max HP" value={Math.floor(stats?.maxHp ?? 0).toLocaleString()} />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 shrink-0">Skills</span>
                  <div className="flex-1 h-px bg-gray-800/80" />
                  <span className="text-[9px] text-amber-400 font-semibold shrink-0">💎 {skillShards ?? 0}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {skills.map((skill) => (
                    <SkillCard
                      key={skill.id}
                      skill={skill}
                      rank={getSkillRank(hero, skill.id)}
                      shards={skillShards ?? 0}
                      onUpgrade={() => upgradeSkill(heroId, skill.id)}
                    />
                  ))}
                </div>
              </div>

              {traitItems.length > 0 && (
                <div>
                  <SectionTitle>Active Traits</SectionTitle>
                  <div className="flex flex-col gap-1.5">
                    {traitItems.flatMap((i) => {
                      const rows = []
                      if (i.trait) {
                        rows.push(
                          <div key={`${i.uid}-trait`} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 bg-yellow-950/20 border border-yellow-700/30">
                            <span className="text-yellow-400">✦</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] text-yellow-300 font-bold">{i.trait.label}</div>
                            </div>
                            <span className="text-[9px] text-gray-600 shrink-0">{i.icon} {i.name}</span>
                          </div>
                        )
                      }
                      ;(i.mythicSkillTraits ?? []).forEach((t, ti) => {
                        rows.push(
                          <div key={`${i.uid}-mythic-${ti}`} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 bg-red-950/20 border border-red-800/30">
                            <span className="text-red-400">✦</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] text-red-300 font-bold">{t.label}</div>
                            </div>
                            <span className="text-[9px] text-gray-600 shrink-0">{i.icon} {i.name}</span>
                          </div>
                        )
                      })
                      return rows
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Equipment */}
            <div>
              <SectionTitle>Equipment</SectionTitle>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.keys(hero.equipment).map((slot) => (
                  <GearSlot
                    key={slot}
                    slotKey={slot}
                    item={slotMap[slot] ?? null}
                    onUnequip={(uid) => invStore.unequipItem(uid, heroId, gameStore)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── Job tree (full width) ── */}
          <div>
            <SectionTitle>Job Tree</SectionTitle>
            <JobTreeVisual
              hero={hero}
              onAdvance={(jobId) => gameStore.advanceJob(heroId, jobId)}
            />
          </div>
        </div>
      </div>

      {swapOpen && (
        <SwapModal partyHeroId={heroId} onClose={() => setSwapOpen(false)} />
      )}
    </div>
  )
}
