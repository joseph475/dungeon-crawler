import { useEffect, useRef } from 'react'
import { useCombatStore } from '@/store/useCombatStore'

// ─── Enemy HP card ────────────────────────────────────────────────────────────

function EnemyCard({ enemy }) {
  const pct = Math.min(100, Math.max(0, (enemy.currentHp / enemy.maxHp) * 100))
  const isLow = pct < 25

  return (
    <div className={`rounded-md border px-3 py-2 ${enemy.isBoss ? 'border-amber-700/60 bg-amber-950/20' : 'border-gray-700/50 bg-gray-800/40'}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-lg leading-none">{enemy.icon}</span>
          <span className={`text-xs font-semibold ${enemy.isBoss ? 'text-amber-300' : 'text-gray-300'}`}>
            {enemy.name}
          </span>
          {enemy.isBoss && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-amber-900/60 text-amber-400 border border-amber-700/50 uppercase tracking-wider">
              Boss
            </span>
          )}
        </div>
        <span className="text-[10px] text-gray-500">
          {Math.floor(enemy.currentHp).toLocaleString()} / {Math.floor(enemy.maxHp).toLocaleString()}
        </span>
      </div>

      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-150 ${
            enemy.isBoss
              ? 'bg-amber-600'
              : isLow
                ? 'bg-red-500'
                : 'bg-red-700'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex gap-3 mt-1.5 text-[10px] text-gray-600">
        <span>⚔️ {enemy.atk}</span>
        <span>🛡️ {enemy.def}</span>
        <span>💨 {enemy.spd}</span>
      </div>
    </div>
  )
}

// ─── Log entry ────────────────────────────────────────────────────────────────

const LOG_STYLES = {
  hit:    { base: 'text-gray-400',  crit: 'text-orange-400 font-semibold' },
  skill:  { base: 'text-blue-400',  crit: 'text-blue-400' },
  ult:    { base: 'text-purple-400 font-semibold', crit: 'text-purple-400' },
  heal:   { base: 'text-green-500', crit: 'text-green-500' },
  death:  { base: 'text-red-500 font-semibold', crit: 'text-red-500' },
  stage:  { base: 'text-amber-500 font-semibold', crit: 'text-amber-500' },
  loot:   { base: 'text-yellow-400', crit: 'text-yellow-400' },
  system: { base: 'text-gray-600',  crit: 'text-gray-600' },
}

function LogEntry({ entry }) {
  const style = LOG_STYLES[entry.type] ?? LOG_STYLES.system
  const cls = entry.isCrit ? style.crit : style.base
  return (
    <div className={`text-[11px] leading-snug ${cls}`}>
      {entry.text}
    </div>
  )
}

// ─── Combat panel ─────────────────────────────────────────────────────────────

export default function CombatPanel() {
  const { enemies, combatLog, phase } = useCombatStore()
  const logRef = useRef(null)

  // Auto-scroll log to bottom on new entries
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [combatLog.length])

  const livingEnemies = enemies.filter((e) => e.currentHp > 0)

  return (
    <section className="rounded-lg border border-gray-700/60 bg-gray-900/60 overflow-hidden flex flex-col">
      {/* Enemy section */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-600 mb-3">
          Enemies
        </h2>

        {livingEnemies.length > 0 ? (
          <div className="flex flex-col gap-2">
            {livingEnemies.map((enemy) => (
              <EnemyCard key={enemy.id} enemy={enemy} />
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-700 text-sm">
            {phase === 'victory' ? '✅ Stage cleared!' :
             phase === 'defeat'  ? '💀 Party defeated…' :
             '…'}
          </div>
        )}
      </div>

      {/* Combat log */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-600">
            Combat Log
          </h2>
          <span className="text-[10px] text-gray-700">{combatLog.length} entries</span>
        </div>

        <div
          ref={logRef}
          className="flex-1 overflow-y-auto px-4 pb-4 space-y-0.5"
          style={{ maxHeight: '240px' }}
        >
          {combatLog.length === 0 && (
            <p className="text-gray-700 text-xs">Waiting for combat…</p>
          )}
          {combatLog.map((entry) => (
            <LogEntry key={entry.id} entry={entry} />
          ))}
        </div>
      </div>
    </section>
  )
}
