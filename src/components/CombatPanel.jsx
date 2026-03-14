import { useEffect, useRef, useState } from 'react'
import { useCombatStore } from '@/store/useCombatStore'
import { useGameStore } from '@/store/useGameStore'

// ─── Turn order strip ─────────────────────────────────────────────────────────

const HERO_AVATAR_BG = {
  warrior:  'bg-red-900/70 border-red-700/50',
  paladin:  'bg-yellow-900/70 border-yellow-700/50',
  mage:     'bg-purple-900/70 border-purple-700/50',
  healer:   'bg-emerald-900/70 border-emerald-700/50',
  assassin: 'bg-gray-800/70 border-gray-600/50',
  rogue:    'bg-orange-900/70 border-orange-700/50',
  ranger:   'bg-blue-900/70 border-blue-700/50',
  shaman:   'bg-teal-900/70 border-teal-700/50',
}

function TurnOrderStrip({ turnQueue, currentActorIdx, enemies, heroes }) {
  if (!turnQueue.length) return null

  const VISIBLE = 8
  const total = turnQueue.length
  const slots = Array.from({ length: Math.min(VISIBLE, total) }, (_, i) => {
    const idx = (currentActorIdx + i) % total
    return { ...turnQueue[idx], queueIdx: idx }
  })

  function getActorInfo(actor) {
    if (actor.isEnemy) {
      const enemy = enemies.find((e) => e.id === actor.id)
      return { icon: enemy?.icon ?? '👾', name: enemy?.name?.split(' ')[0] ?? 'Enemy', isEnemy: true, classId: null }
    }
    const hero = heroes[actor.id]
    return { icon: hero?.icon ?? '🧙', name: hero?.name?.split(' ')[0] ?? 'Hero', isEnemy: false, classId: hero?.classId ?? null }
  }

  return (
    <div className="px-4 pt-3 pb-2.5 border-b border-gray-800/60 bg-gray-900/30">
      <div className="text-[9px] font-black uppercase tracking-widest text-gray-700 mb-2">Turn Order</div>
      <div className="flex items-end gap-1.5 overflow-x-auto pb-0.5">
        {slots.map((actor, i) => {
          const info      = getActorInfo(actor)
          const isCurrent = i === 0
          const avatarBg  = info.isEnemy
            ? 'bg-red-950/80 border-red-800/60'
            : (HERO_AVATAR_BG[info.classId] ?? 'bg-gray-800/70 border-gray-600/50')

          return (
            <div
              key={`${actor.id}-${actor.queueIdx}`}
              className={`
                flex flex-col items-center gap-1 min-w-11 rounded-lg px-1.5 py-2 border transition-all duration-200
                ${isCurrent
                  ? info.isEnemy
                    ? 'border-red-500/80 bg-red-950/40 ring-2 ring-red-500/30 scale-110 shadow-md shadow-red-900/40'
                    : 'border-amber-500/80 bg-amber-950/30 ring-2 ring-amber-500/25 scale-110 shadow-md shadow-amber-900/30'
                  : 'border-gray-800/60 bg-gray-900/30 opacity-50'
                }
              `}
            >
              {/* Class-colored avatar */}
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center leading-none ${avatarBg} ${isCurrent ? 'text-base' : 'text-sm'}`}>
                {info.icon}
              </div>
              <span className={`text-[8px] truncate w-full text-center font-semibold ${isCurrent ? 'text-gray-200' : 'text-gray-600'}`}>
                {info.name}
              </span>
              {isCurrent && (
                <span className={`text-[7px] font-black uppercase tracking-wider leading-none ${info.isEnemy ? 'text-red-400' : 'text-amber-400'}`}>
                  NOW
                </span>
              )}
            </div>
          )
        })}
        {total > VISIBLE && (
          <span className="text-[9px] text-gray-700 self-center ml-1">+{total - VISIBLE}</span>
        )}
      </div>
    </div>
  )
}

// ─── Effect icons ─────────────────────────────────────────────────────────────

const EFFECT_META = {
  stun:       { icon: '😵', label: 'Stunned',      color: 'text-yellow-400 bg-yellow-950/60 border-yellow-700/40' },
  dot:        { icon: '🔥', label: 'Burning',       color: 'text-orange-400 bg-orange-950/60 border-orange-700/40' },
  shield:     { icon: '🛡️', label: 'Shield',        color: 'text-blue-400   bg-blue-950/60   border-blue-700/40'  },
  debuff:     { icon: '⬇️', label: 'Debuffed',      color: 'text-purple-400 bg-purple-950/60 border-purple-700/40'},
  stunImmune: { icon: '🔒', label: 'Stun Immune',   color: 'text-gray-400   bg-gray-800/60   border-gray-700/40'  },
}

function EffectStrip({ effects }) {
  // Deduplicate by type, keep highest ticks
  const byType = {}
  for (const e of effects) {
    if (!byType[e.type] || e.ticks > byType[e.type].ticks) byType[e.type] = e
  }
  const visible = Object.values(byType).filter((e) => EFFECT_META[e.type])
  if (!visible.length) return null

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {visible.map((e) => {
        const meta = EFFECT_META[e.type]
        return (
          <span
            key={e.type}
            title={`${meta.label} (${e.ticks} turns)`}
            className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded border ${meta.color}`}
          >
            {meta.icon} <span className="tabular-nums">{e.ticks}</span>
          </span>
        )
      })}
    </div>
  )
}

// ─── Element display helpers ──────────────────────────────────────────────────

const ELEMENT_ICON = {
  nature:   { icon: '🌿', color: 'text-green-400 border-green-800/50 bg-green-950/40' },
  earth:    { icon: '🪨', color: 'text-stone-400 border-stone-700/50 bg-stone-950/40' },
  shadow:   { icon: '⚫', color: 'text-purple-400 border-purple-800/50 bg-purple-950/40' },
  physical: { icon: '⚔️', color: 'text-gray-400 border-gray-700/50 bg-gray-800/40' },
  holy:     { icon: '✨', color: 'text-yellow-400 border-yellow-700/50 bg-yellow-950/40' },
  fire:     { icon: '🔥', color: 'text-orange-400 border-orange-800/50 bg-orange-950/40' },
  poison:   { icon: '☠️', color: 'text-lime-400 border-lime-800/50 bg-lime-950/40' },
  void:     { icon: '🌀', color: 'text-cyan-400 border-cyan-800/50 bg-cyan-950/40' },
  arcane:   { icon: '💜', color: 'text-violet-400 border-violet-800/50 bg-violet-950/40' },
  undead:   { icon: '💀', color: 'text-zinc-400 border-zinc-700/50 bg-zinc-900/40' },
}

// Which element each class attacks with
const CLASS_ATTACK_ELEMENT = {
  warrior: 'physical', paladin: 'holy', mage: 'arcane', healer: 'holy',
  assassin: 'shadow', rogue: 'shadow', ranger: 'nature', shaman: 'fire',
}

// ─── Enemy HP card ────────────────────────────────────────────────────────────

function EnemyCard({ enemy, isActing, effects = [], partyElements = [] }) {
  const pct   = Math.min(100, Math.max(0, (enemy.currentHp / enemy.maxHp) * 100))
  const isLow = pct < 25

  // Track HP changes for damage flash + floating numbers
  const prevHpRef   = useRef(enemy.currentHp)
  const [hitFlash, setHitFlash]   = useState(false)
  const [floats, setFloats]       = useState([]) // [{id, value, isCrit}]

  useEffect(() => {
    const prev = prevHpRef.current
    const dmg  = prev - enemy.currentHp
    if (dmg > 0) {
      const id = Date.now()
      setHitFlash(true)
      setFloats((f) => [...f, { id, value: Math.floor(dmg) }])
      const shakeTimer  = setTimeout(() => setHitFlash(false), 380)
      const floatTimer  = setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 700)
      prevHpRef.current = enemy.currentHp
      return () => { clearTimeout(shakeTimer); clearTimeout(floatTimer) }
    }
    prevHpRef.current = enemy.currentHp
  }, [enemy.currentHp])

  return (
    <div className={`
      relative rounded-xl border px-4 py-3 transition-all duration-200
      ${hitFlash ? 'anim-hit-shake' : ''}
      ${enemy.isBoss
        ? isActing
          ? 'border-amber-500/80 bg-amber-950/40 ring-2 ring-amber-500/30 shadow-lg shadow-amber-900/40 animate-pulse'
          : 'border-amber-700/50 bg-amber-950/20'
        : isActing
          ? 'border-red-500/60 bg-red-950/30 ring-1 ring-red-500/20 shadow-md shadow-red-900/30'
          : 'border-gray-700/40 bg-gray-800/30'
      }
      ${hitFlash ? 'bg-red-950/40' : ''}
    `}>
      {/* Floating damage numbers */}
      {floats.map((f) => (
        <div
          key={f.id}
          className="anim-dmg-float absolute right-3 top-2 pointer-events-none text-red-400 font-black text-base tabular-nums select-none"
          style={{ zIndex: 10 }}
        >
          -{f.value.toLocaleString()}
        </div>
      ))}

      {/* Name row */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2.5">
          <span className={`leading-none ${enemy.isBoss ? 'text-3xl' : 'text-xl'}`}>{enemy.icon}</span>
          <div>
            <div className={`font-bold leading-tight ${enemy.isBoss ? 'text-sm text-amber-200' : 'text-xs text-gray-200'}`}>
              {enemy.name}
            </div>
            {enemy.isBoss && (
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">⚡ Boss</span>
            )}
          </div>
          {isActing && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-900/70 text-red-300 border border-red-700/50 uppercase tracking-wider font-black">
              Acting
            </span>
          )}
        </div>
        <span className={`text-[11px] tabular-nums font-semibold ${isLow ? 'text-red-400' : 'text-gray-500'}`}>
          {Math.floor(enemy.currentHp).toLocaleString()}
          <span className="text-gray-700 font-normal"> / {Math.floor(enemy.maxHp).toLocaleString()}</span>
        </span>
      </div>

      {/* Element + weakness badges */}
      {enemy.element && (() => {
        const elemMeta = ELEMENT_ICON[enemy.element]
        const weakEntries = Object.entries(enemy.elementWeak ?? {})
        // Which of the party's elements hit a weakness
        const exploitedBy = partyElements.filter((el) => enemy.elementWeak?.[el] > 0)
        return (
          <div className="flex items-center gap-1.5 mb-2">
            {elemMeta && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${elemMeta.color}`}>
                {elemMeta.icon} {enemy.element}
              </span>
            )}
            {weakEntries.map(([el, frac]) => {
              const meta = ELEMENT_ICON[el]
              const isExploited = exploitedBy.includes(el)
              return (
                <span
                  key={el}
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                    isExploited
                      ? 'text-red-300 border-red-600/60 bg-red-950/50'
                      : 'text-gray-600 border-gray-700/40 bg-gray-900/30'
                  }`}
                  title={`Weak to ${el} (+${Math.round(frac * 100)}%)`}
                >
                  {isExploited ? '💥' : '▲'} {meta?.icon ?? el}
                </span>
              )
            })}
          </div>
        )
      })()}

      {/* HP bar — thicker for boss */}
      <div className={`w-full rounded-full overflow-hidden bg-gray-800/80 ${enemy.isBoss ? 'h-4' : 'h-3'}`}>
        <div
          className={`h-full rounded-full transition-all duration-200 ${
            enemy.isBoss
              ? isLow ? 'bg-linear-to-r from-red-700 to-red-500' : 'bg-linear-to-r from-amber-600 to-amber-400'
              : isLow ? 'bg-red-600' : 'bg-red-700'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Active effects */}
      <EffectStrip effects={effects} />

      {/* Stats row */}
      <div className="flex gap-3 mt-2 text-[10px] text-gray-600">
        <span title="Attack">⚔️ {enemy.atk}</span>
        <span title="Defense">🛡️ {enemy.def}</span>
        <span title="Speed">💨 {enemy.spd}</span>
        <span title="Crit">🎯 {(enemy.crit * 100).toFixed(0)}%</span>
      </div>
    </div>
  )
}

// ─── Log entry ────────────────────────────────────────────────────────────────

const LOG_STYLES = {
  hit:    { base: 'text-gray-500',                   crit: 'text-orange-400 font-semibold' },
  skill:  { base: 'text-blue-400',                   crit: 'text-blue-300 font-semibold'   },
  ult:    { base: 'text-purple-400 font-bold',       crit: 'text-purple-300 font-bold'     },
  heal:   { base: 'text-emerald-500',                crit: 'text-emerald-400 font-semibold'},
  death:  { base: 'text-red-500 font-semibold',      crit: 'text-red-500'                  },
  stage:  { base: 'text-amber-400 font-semibold',    crit: 'text-amber-400'                },
  loot:   { base: 'text-yellow-400',                 crit: 'text-yellow-300'               },
  system: { base: 'text-gray-700',                   crit: 'text-gray-700'                 },
}

function LogEntry({ entry, isNewest }) {
  const style = LOG_STYLES[entry.type] ?? LOG_STYLES.system
  const isHighlight = entry.type === 'stage' || entry.type === 'loot' || entry.type === 'death'

  return (
    <div className={`
      text-[11px] leading-relaxed py-0.5 px-1 rounded
      ${isNewest ? 'anim-log-in' : ''}
      ${isHighlight ? 'border-l-2 pl-2' : ''}
      ${entry.type === 'stage'  ? 'border-l-amber-600/50 bg-amber-950/10' : ''}
      ${entry.type === 'loot'   ? 'border-l-yellow-600/40 bg-yellow-950/10' : ''}
      ${entry.type === 'death'  ? 'border-l-red-700/50 bg-red-950/10' : ''}
      ${entry.type === 'ult'    ? 'bg-purple-950/10' : ''}
      ${entry.isCrit ? style.crit : style.base}
    `}>
      {entry.text}
    </div>
  )
}

// ─── Post-combat summary ──────────────────────────────────────────────────────

function CombatSummary({ fightStats, heroes, partyIds, roundNumber }) {
  const party = (partyIds ?? []).map((id) => heroes[id]).filter(Boolean)
  if (!party.length) return null

  const totalDmg  = party.reduce((s, h) => s + (fightStats[h.id]?.dmgDealt ?? 0), 0)
  const totalHeal = party.reduce((s, h) => s + (fightStats[h.id]?.healDone ?? 0), 0)
  const hasHealing = totalHeal > 0

  return (
    <div className="mt-3 rounded-lg border border-gray-800/60 bg-gray-900/30 overflow-hidden">
      <div className="px-3 py-1.5 border-b border-gray-800/40 flex items-center justify-between">
        <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">Combat Summary</span>
        <span className="text-[9px] text-gray-700">{roundNumber} rounds</span>
      </div>
      <div className="divide-y divide-gray-800/30">
        {party.map((hero) => {
          const stats    = fightStats[hero.id] ?? { dmgDealt: 0, healDone: 0 }
          const dmgShare = totalDmg > 0 ? stats.dmgDealt / totalDmg : 0
          return (
            <div key={hero.id} className="px-3 py-1.5 flex items-center gap-2 text-[10px]">
              <span className="w-14 truncate font-semibold text-gray-500">{hero.name}</span>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-700 rounded-full transition-all"
                      style={{ width: `${dmgShare * 100}%` }}
                    />
                  </div>
                  <span className="tabular-nums text-gray-600 w-14 text-right shrink-0">
                    {stats.dmgDealt > 0 ? stats.dmgDealt.toLocaleString() : '—'}
                  </span>
                </div>
              </div>
              {hasHealing && (
                <span className={`tabular-nums w-12 text-right shrink-0 ${stats.healDone > 0 ? 'text-emerald-600' : 'text-gray-800'}`}>
                  {stats.healDone > 0 ? `+${stats.healDone.toLocaleString()}` : '—'}
                </span>
              )}
            </div>
          )
        })}
      </div>
      {(totalDmg > 0 || totalHeal > 0) && (
        <div className="px-3 py-1 border-t border-gray-800/40 flex items-center gap-2 text-[9px] text-gray-700">
          <span>⚔️ {totalDmg.toLocaleString()} total dmg</span>
          {hasHealing && <span>💚 {totalHeal.toLocaleString()} healed</span>}
        </div>
      )}
    </div>
  )
}

// ─── Combat panel ─────────────────────────────────────────────────────────────

export default function CombatPanel() {
  const { enemies, combatLog, phase, turnQueue, currentActorIdx, currentActorId, activeEffects, fightStats, roundNumber } = useCombatStore()
  const { heroes, partyIds } = useGameStore()
  const logRef = useRef(null)

  // Skill/ult flash overlay
  const [actionFlash, setActionFlash] = useState(null) // null | 'skill' | 'ult'
  const prevLogLenRef = useRef(combatLog.length)

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
    // Detect new skill/ult entries for flash
    if (combatLog.length > prevLogLenRef.current) {
      const newest = combatLog[combatLog.length - 1]
      if (newest?.type === 'ult') {
        setActionFlash('ult')
        setTimeout(() => setActionFlash(null), 600)
      } else if (newest?.type === 'skill') {
        setActionFlash('skill')
        setTimeout(() => setActionFlash(null), 400)
      }
      prevLogLenRef.current = combatLog.length
    }
  }, [combatLog.length])

  const livingEnemies = enemies.filter((e) => e.currentHp > 0)
  const hasBoss = livingEnemies.some((e) => e.isBoss)
  // Unique attack elements from the party (for weakness highlighting)
  const partyElements = [...new Set(
    partyIds.map((id) => CLASS_ATTACK_ELEMENT[heroes[id]?.classId]).filter(Boolean)
  )]

  return (
    <section className="rounded-xl border border-gray-700/50 bg-gray-900/50 overflow-hidden flex flex-col">

      {/* Turn order */}
      {phase === 'fighting' && turnQueue.length > 0 && (
        <TurnOrderStrip
          turnQueue={turnQueue}
          currentActorIdx={currentActorIdx}
          enemies={enemies}
          heroes={heroes}
        />
      )}

      {/* Boss banner */}
      {hasBoss && phase === 'fighting' && (
        <div className="px-4 py-2 bg-linear-to-r from-amber-950/50 via-amber-900/30 to-amber-950/50 border-b border-amber-700/40 flex items-center gap-2">
          <span className="text-amber-500 text-sm">⚠</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/90">Boss Encounter</span>
          <div className="flex-1 h-px bg-amber-800/30" />
          <span className="text-amber-600/50 text-[10px]">⚡</span>
        </div>
      )}

      {/* Enemies */}
      <div className="relative p-4 border-b border-gray-800/60">
        {/* Skill/ult flash overlay */}
        {actionFlash && (
          <div className={`
            anim-skill-flash pointer-events-none absolute inset-0 rounded-none
            ${actionFlash === 'ult' ? 'bg-purple-500/10 ring-inset ring-1 ring-purple-500/30' : 'bg-blue-500/8 ring-inset ring-1 ring-blue-500/20'}
          `} />
        )}

        <div className="text-[9px] font-black uppercase tracking-widest text-gray-700 mb-3 flex items-center gap-2">
          <span>Enemies</span>
          <span className="flex-1 h-px bg-gray-800/80" />
        </div>

        {livingEnemies.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {livingEnemies.map((enemy) => (
              <EnemyCard
                key={enemy.id}
                enemy={enemy}
                isActing={enemy.id === currentActorId}
                effects={activeEffects[enemy.id] ?? []}
                partyElements={partyElements}
              />
            ))}
          </div>
        ) : (
          <div>
            <div className="text-center py-4">
              {phase === 'victory' && (
                <div>
                  <div className="text-2xl mb-1">✨</div>
                  <p className="text-green-400 font-black text-sm tracking-wider uppercase">Stage Cleared!</p>
                </div>
              )}
              {phase === 'defeat' && (
                <div>
                  <div className="text-2xl mb-1">💀</div>
                  <p className="text-red-500 font-black text-sm tracking-wider uppercase">Party Defeated</p>
                </div>
              )}
              {phase === 'idle' && <p className="text-gray-800 text-sm">…</p>}
            </div>
            {(phase === 'victory' || phase === 'defeat') && (
              <CombatSummary
                fightStats={fightStats}
                heroes={heroes}
                partyIds={partyIds}
                roundNumber={roundNumber}
              />
            )}
          </div>
        )}
      </div>

      {/* Combat log */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className="px-4 pt-2.5 pb-1.5 border-b border-gray-800/40 bg-gray-900/20">
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-700">Combat Log</span>
        </div>
        <div
          ref={logRef}
          className="flex-1 overflow-y-auto px-3 py-2 space-y-px bg-linear-to-b from-gray-950/0 to-gray-950/20"
          style={{ maxHeight: '220px' }}
        >
          {combatLog.length === 0
            ? <p className="text-gray-800 text-xs pt-2 px-1">Waiting for combat…</p>
            : combatLog.map((entry, i) => (
                <LogEntry key={entry.id} entry={entry} isNewest={i === combatLog.length - 1} />
              ))
          }
        </div>
      </div>
    </section>
  )
}
