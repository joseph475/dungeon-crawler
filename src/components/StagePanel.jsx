import { useGameStore } from '@/store/useGameStore'
import { useCombatStore } from '@/store/useCombatStore'
import { getStage } from '@/data/stages'

const PHASE_LABEL = {
  idle:      { text: 'Starting…',  color: 'text-gray-500' },
  fighting:  { text: 'Fighting',   color: 'text-red-400'  },
  victory:   { text: 'Victory!',   color: 'text-green-400'},
  defeat:    { text: 'Defeated…',  color: 'text-red-600'  },
  advancing: { text: 'Advancing…', color: 'text-amber-400'},
}

export default function StagePanel() {
  const { currentStage, highestStage, autoAdvance, toggleAutoAdvance, retreatToHighest, setStage } =
    useGameStore()
  const { phase, enemies } = useCombatStore()

  const stageDef = getStage(currentStage)
  const phaseInfo = PHASE_LABEL[phase] ?? PHASE_LABEL.idle

  const totalEnemyHp  = enemies.reduce((s, e) => s + e.maxHp, 0)
  const currentEnemyHp = enemies.reduce((s, e) => s + e.currentHp, 0)
  const stagePct = totalEnemyHp > 0
    ? Math.max(0, (currentEnemyHp / totalEnemyHp) * 100)
    : 100

  return (
    <section className="rounded-lg border border-gray-700/60 bg-gray-900/60 p-4">
      {/* Stage header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-600">
            {stageDef.isBoss ? '👑 Boss Stage' : 'Stage'}
          </h2>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className={`text-3xl font-bold ${stageDef.isBoss ? 'text-amber-400' : 'text-gray-100'}`}>
              {currentStage}
            </span>
            <span className="text-xs text-gray-600">/ {highestStage} best</span>
          </div>
        </div>

        {/* Phase badge */}
        <div className={`text-sm font-semibold ${phaseInfo.color}`}>
          {phaseInfo.text}
        </div>
      </div>

      {/* Enemy HP progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] text-gray-600 mb-1">
          <span>Enemy HP</span>
          <span>{Math.floor(currentEnemyHp).toLocaleString()} / {Math.floor(totalEnemyHp).toLocaleString()}</span>
        </div>
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-200 ${stageDef.isBoss ? 'bg-amber-600' : 'bg-red-700'}`}
            style={{ width: `${stagePct}%` }}
          />
        </div>
      </div>

      {/* Rewards preview */}
      <div className="flex gap-4 text-[11px] text-gray-500 mb-4">
        <span>💰 {stageDef.goldReward.toLocaleString()} gold</span>
        <span>✨ {stageDef.xpReward.toLocaleString()} xp</span>
        {stageDef.isBoss && <span className="text-amber-500">+25% loot bonus</span>}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Auto-advance toggle */}
        <button
          onClick={toggleAutoAdvance}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition-colors
            ${autoAdvance
              ? 'bg-amber-900/40 border-amber-700/60 text-amber-400 hover:bg-amber-900/60'
              : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600'
            }
          `}
        >
          <span>{autoAdvance ? '⏩' : '⏸️'}</span>
          Auto-Advance {autoAdvance ? 'ON' : 'OFF'}
        </button>

        {/* Retreat button */}
        {currentStage > 1 && (
          <button
            onClick={retreatToHighest}
            className="px-3 py-1.5 rounded text-xs font-semibold border border-gray-700 text-gray-500 hover:border-red-800/60 hover:text-red-500 transition-colors"
          >
            ← Retreat
          </button>
        )}

        {/* Manual stage nav (dev / convenience) */}
        {highestStage > 1 && (
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setStage(Math.max(1, currentStage - 1))}
              disabled={currentStage <= 1}
              className="w-6 h-6 rounded border border-gray-700 text-gray-500 hover:text-gray-300 text-xs disabled:opacity-30"
            >
              ‹
            </button>
            <button
              onClick={() => setStage(Math.min(highestStage, currentStage + 1))}
              disabled={currentStage >= highestStage}
              className="w-6 h-6 rounded border border-gray-700 text-gray-500 hover:text-gray-300 text-xs disabled:opacity-30"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
