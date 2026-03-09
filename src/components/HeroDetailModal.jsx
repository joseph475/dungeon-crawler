import { useGameStore, resolveHeroStats, xpToNextLevel } from '@/store/useGameStore'
import { useInventoryStore, RARITY_COLORS } from '@/store/useInventoryStore'
import { CLASSES } from '@/data/classes'
import { JOBS, JOB_ADVANCEMENT_LEVELS, getTier1Jobs, getNextJobs } from '@/data/jobs'
import { getSkillSet } from '@/data/skills'
import { RARITY_STAT_COLOR, RARITY_SECONDARY_COLOR } from '@/data/items'

const PERCENT_STATS = new Set(['crit', 'critDmg'])
function fmtStat(key, v) {
  if (PERCENT_STATS.has(key)) return `${(v * 100).toFixed(1)}%`
  if (key === 'spd') return v.toFixed(1)
  return Math.floor(v)
}

// ─── Stat row ─────────────────────────────────────────────────────────────────

function StatRow({ label, value, highlight }) {
  return (
    <div className="flex justify-between text-xs py-1 border-b border-gray-800/60">
      <span className="text-gray-500">{label}</span>
      <span className={highlight ? 'text-amber-400 font-semibold' : 'text-gray-200'}>
        {value}
      </span>
    </div>
  )
}

// ─── Skill card ───────────────────────────────────────────────────────────────

const SLOT_STYLES = {
  basic:    'bg-gray-800 border-gray-700   text-gray-400',
  skill:    'bg-blue-950 border-blue-800   text-blue-300',
  ultimate: 'bg-purple-950 border-purple-800 text-purple-300',
  passive:  'bg-green-950 border-green-800 text-green-300',
}
const SLOT_LABEL = {
  basic: 'Basic', skill: 'Skill', ultimate: 'Ultimate', passive: 'Passive',
}

function SkillCard({ skill }) {
  const style = SLOT_STYLES[skill.slot] ?? SLOT_STYLES.basic
  return (
    <div className={`rounded border p-2 ${style}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-base leading-none">{skill.icon}</span>
        <span className="text-xs font-semibold">{skill.name}</span>
        <span className={`ml-auto text-[9px] uppercase tracking-wider px-1 py-0.5 rounded border ${style}`}>
          {SLOT_LABEL[skill.slot]}
        </span>
      </div>
      <p className="text-[10px] text-gray-500 leading-snug">{skill.desc}</p>
      <div className="flex gap-3 mt-1 flex-wrap">
        {skill.cooldown && (
          <p className="text-[10px] text-gray-600">⏱ {skill.cooldown}s cooldown</p>
        )}
        {skill.slot === 'ultimate' && (
          <p className="text-[10px] text-blue-400">🔵 Cost: Full mana</p>
        )}
        {skill.slot === 'basic' && (
          <p className="text-[10px] text-gray-700">🔵 No mana cost</p>
        )}
        {skill.slot === 'skill' && (
          <p className="text-[10px] text-gray-700">🔵 No mana cost</p>
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
  return (
    <div className={`rounded border p-2 flex flex-col gap-1 min-h-14
      ${item ? RARITY_COLORS[item.rarity] : 'border-gray-800 bg-gray-800/20'}
    `}>
      <div className="flex items-center gap-1 text-[10px] text-gray-600">
        <span>{SLOT_ICONS[slotKey]}</span>
        <span className="capitalize">{slotKey}</span>
      </div>
      {item ? (
        <>
          <div className={`text-[11px] font-semibold ${RARITY_COLORS[item.rarity]?.split(' ')[0]}`}>
            {item.icon} {item.name}
          </div>
          {item.itemLevel && (
            <div className="text-[9px] text-gray-600">iLv {item.itemLevel}</div>
          )}
          <div className="flex flex-col gap-0.5">
            {Object.entries(item.stats ?? {}).map(([k, v]) => {
              const isMain  = k === item.mainStat
              const statRar = (item.statRarities?.[k]) ?? item.rarity
              const color   = isMain
                ? `${RARITY_STAT_COLOR[statRar] ?? 'text-gray-300'} font-semibold`
                : RARITY_SECONDARY_COLOR[statRar] ?? 'text-gray-600'
              return (
                <span key={k} className={`text-[9px] ${color}`}>
                  +{fmtStat(k, v)} {k.toUpperCase()}
                </span>
              )
            })}
            {item.trait && (
              <span className="text-[9px] text-yellow-400 font-semibold">✦ {item.trait.label}</span>
            )}
          </div>
          <button
            onClick={() => onUnequip(item.uid, slotKey)}
            className="text-[9px] text-gray-600 hover:text-red-500 text-left mt-auto"
          >
            Unequip
          </button>
        </>
      ) : (
        <div className="text-[10px] text-gray-700">Empty</div>
      )}
    </div>
  )
}

// ─── Job tree with advancement ────────────────────────────────────────────────

// JobNode must be defined at module level so React doesn't treat it as a new
// component type on every render (which would break onClick and cause remounts).
function JobNode({ job, activeJobPath, pickableIds, nextTier, onAdvance }) {
  const isActive = activeJobPath.includes(job.id)
  const isPickable = pickableIds.has(job.id)
  const nextJobs = getNextJobs(job.id)
  const tierColors = {
    1: isActive ? 'border-green-700 bg-green-950 text-green-400'    : isPickable ? 'border-green-700/50 bg-green-950/40 text-green-500'    : 'border-gray-700 text-gray-600',
    2: isActive ? 'border-blue-700 bg-blue-950 text-blue-400'       : isPickable ? 'border-blue-700/50 bg-blue-950/40 text-blue-500'       : 'border-gray-800 text-gray-700',
    3: isActive ? 'border-purple-700 bg-purple-950 text-purple-300' : isPickable ? 'border-purple-700/50 bg-purple-950/40 text-purple-400' : 'border-gray-800 text-gray-700',
  }
  const colorClass = tierColors[job.tier] ?? tierColors[1]

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        {isPickable ? (
          <button
            onClick={() => onAdvance(job.id)}
            className={`text-[10px] px-2 py-1 rounded border cursor-pointer hover:brightness-125 transition-all ${colorClass}`}
            title={job.description}
          >
            {job.icon} {job.name}
            <span className="ml-1 text-[9px] opacity-70">(Pick)</span>
          </button>
        ) : (
          <div className={`text-[10px] px-2 py-1 rounded border ${colorClass}`} title={job.description}>
            {job.icon} {job.name}
            {!isActive && !isPickable && job.tier <= nextTier && (
              <span className="ml-1 text-[9px] opacity-50">Lv{JOB_ADVANCEMENT_LEVELS[job.tier]}</span>
            )}
          </div>
        )}
      </div>
      {nextJobs.length > 0 && (
        <div className="flex gap-2 ml-3">
          {nextJobs.map((nj) => (
            <JobNode
              key={nj.id}
              job={nj}
              activeJobPath={activeJobPath}
              pickableIds={pickableIds}
              nextTier={nextTier}
              onAdvance={onAdvance}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function JobTreeMini({ hero, onAdvance }) {
  const tier1Jobs = getTier1Jobs(hero.classId)
  const activeJobPath = []
  if (hero.jobId) {
    let job = JOBS[hero.jobId]
    while (job) { activeJobPath.unshift(job.id); job = job.parent ? JOBS[job.parent] : null }
  }

  const nextTier = (hero.jobTier ?? 0) + 1
  const advLevel = JOB_ADVANCEMENT_LEVELS[nextTier] ?? 999
  const canAdvanceNow = hero.level >= advLevel && hero.jobTier < 3

  const pickableIds = new Set()
  if (canAdvanceNow) {
    if (nextTier === 1) {
      getTier1Jobs(hero.classId).forEach((j) => pickableIds.add(j.id))
    } else {
      Object.values(JOBS).forEach((j) => {
        if (j.tier === nextTier && j.parent === hero.jobId && j.baseClass === hero.classId) {
          pickableIds.add(j.id)
        }
      })
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-gray-600 uppercase tracking-wider">Job Path</p>
        {canAdvanceNow ? (
          <span className="text-[10px] text-yellow-400 font-semibold animate-pulse">
            ✦ Job advancement available!
          </span>
        ) : hero.jobTier < 3 ? (
          <span className="text-[10px] text-gray-600">Next advancement: Level {advLevel}</span>
        ) : null}
      </div>
      <div className="flex gap-3 flex-wrap">
        {tier1Jobs.map((j) => (
          <JobNode
            key={j.id}
            job={j}
            activeJobPath={activeJobPath}
            pickableIds={pickableIds}
            nextTier={nextTier}
            onAdvance={onAdvance}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function HeroDetailModal({ heroId, open, onClose }) {
  const { heroes } = useGameStore()
  const invStore   = useInventoryStore()
  const gameStore  = useGameStore()

  if (!open || !heroId) return null

  const hero = heroes[heroId]
  if (!hero) return null

  const stats  = resolveHeroStats(hero)
  const cls    = CLASSES[hero.classId]
  const job    = hero.jobId ? JOBS[hero.jobId] : null
  const skills = getSkillSet(hero.classId, hero.jobId)
  const xpNeeded = xpToNextLevel(hero.level + 1)

  const equippedItems = invStore.getEquippedItems(heroId)
  const slotMap = {}
  equippedItems.forEach((i) => { slotMap[i.slot] = i })

  function handleUnequip(uid, slot) {
    invStore.unequipItem(uid, heroId, gameStore)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-gray-700 bg-gray-950 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-950">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{cls?.icon}</span>
            <div>
              <h2 className="text-base font-bold text-gray-100">{hero.name}</h2>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{job ? `${job.icon} ${job.name}` : cls?.name}</span>
                <span>·</span>
                <span className="text-amber-400 font-semibold">Level {hero.level}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-300 text-xl leading-none p-1"
          >
            ✕
          </button>
        </div>

        <div className="p-5 flex flex-col gap-6">
          {/* Stats */}
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Stats</p>
            <div className="grid grid-cols-2 gap-x-6">
              <StatRow label="HP"      value={`${Math.floor(hero.currentHp)} / ${Math.floor(stats?.maxHp ?? 0)}`} />
              <StatRow label="Mana"    value={`${Math.floor(hero.currentMana)} / ${Math.floor(stats?.maxMana ?? 0)}`} />
              <StatRow label="ATK"     value={stats?.atk.toFixed(1) ?? 0} highlight />
              <StatRow label="DEF"     value={stats?.def.toFixed(1) ?? 0} highlight />
              <StatRow label="SPD"     value={stats?.spd.toFixed(2) ?? 0} />
              <StatRow label="Crit"    value={`${((stats?.crit ?? 0) * 100).toFixed(1)}%`} />
              <StatRow label="Crit DMG" value={`${((stats?.critDmg ?? 1.5) * 100).toFixed(0)}%`} />
              <StatRow label="XP"      value={`${Math.floor(hero.xp).toLocaleString()} / ${xpNeeded.toLocaleString()}`} />
            </div>
          </div>

          {/* Equipment */}
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Equipment</p>
            <div className="grid grid-cols-4 gap-2">
              {Object.keys(hero.equipment).map((slot) => (
                <GearSlot
                  key={slot}
                  slotKey={slot}
                  item={slotMap[slot] ?? null}
                  onUnequip={handleUnequip}
                />
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Skills</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {skills.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          </div>

          {/* Job tree */}
          <div>
            <JobTreeMini
              hero={hero}
              onAdvance={(jobId) => gameStore.advanceJob(heroId, jobId)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
