import { useState } from 'react'
import { useGameStore } from '@/store/useGameStore'
import { useInventoryStore } from '@/store/useInventoryStore'
import { useCombatStore } from '@/store/useCombatStore'
import { getStage, MAX_STAGE, rollStageModifier } from '@/data/stages'

const PHASE_LABEL = {
  idle:      { text: 'Preparing…', color: 'text-gray-500' },
  fighting:  { text: 'Fighting',   color: 'text-red-400'  },
  victory:   { text: '⚡ Victory', color: 'text-green-400'},
  defeat:    { text: '💀 Defeated', color: 'text-red-500' },
  advancing: { text: 'Advancing…', color: 'text-amber-400'},
}

const ZONE_NAMES = {
  1:  '🌲 Whispering Forest',
  2:  '🪨 Crystal Caves',
  3:  '💀 Bone Dungeon',
  4:  '🏰 Ironhold Fortress',
  5:  '🌿 Serpent Swamp',
  6:  '🌋 Scorched Volcano',
  7:  '🕳️ The Abyss',
  8:  '🦴 Undead Wastes',
  9:  '☀️ Fallen Celestia',
  10: '🔥 Infernal Depths',
}

function getZone(stage) {
  const zone = Math.ceil(Math.min(stage, MAX_STAGE) / 10)
  return ZONE_NAMES[zone] ?? '∞ Beyond'
}

export default function StagePanel() {
  const { currentStage, highestStage, autoAdvance, toggleAutoAdvance, retreatOnFirstDeath, toggleRetreatOnFirstDeath, setStage, prestigeCount, canPrestige, prestige, getPrestigeBonus, stageRecords } = useGameStore()
  const { phase, setPhase, stageModifier } = useCombatStore()
  const resetInventory = useInventoryStore((s) => s.resetInventory)
  const [showPrestigeConfirm, setShowPrestigeConfirm] = useState(false)
  const prestigeBonus = getPrestigeBonus()
  const prestigeReady = canPrestige()
  const prestigeRequired = 25 + prestigeCount * 10

  const stageRecord = (stageRecords ?? {})[currentStage]
  const recordStr   = stageRecord !== undefined ? `${(stageRecord * 0.1).toFixed(1)}s` : null

  const stageDef    = getStage(Math.min(currentStage, MAX_STAGE))
  const isEndless   = currentStage > MAX_STAGE
  const isBoss      = stageDef.isBoss
  const phaseInfo   = PHASE_LABEL[phase] ?? PHASE_LABEL.idle
  const zone        = getZone(currentStage)
  // Show upcoming modifier when idle, active modifier when fighting
  const previewMod  = phase === 'idle' ? rollStageModifier(currentStage) : null
  const activeMod   = phase === 'fighting' ? stageModifier : null
  const displayMod  = activeMod ?? previewMod

  return (
    <section className={`
      rounded-lg border p-4 transition-colors
      ${isBoss
        ? 'border-amber-700/50 bg-amber-950/10'
        : 'border-gray-700/50 bg-gray-900/50'
      }
    `}>
      <div className="flex items-start justify-between gap-3">
        {/* Left: stage number + zone */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-0.5">
            {isBoss ? '👑 Boss Encounter' : zone}
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-black leading-none ${isBoss ? 'text-amber-400' : 'text-gray-100'}`}>
              {currentStage}
            </span>
            {isEndless
              ? <span className="text-xs font-bold text-cyan-400 border border-cyan-700/40 rounded px-1.5 py-0.5 bg-cyan-900/20">∞ Endless</span>
              : <span className="text-xs text-gray-700">/ {highestStage} best</span>
            }
            {recordStr && (
              <span className="text-[10px] font-bold text-amber-500 border border-amber-800/40 rounded px-1.5 py-0.5 bg-amber-950/30">
                🏆 {recordStr}
              </span>
            )}
          </div>
          {isBoss && (
            <div className="text-[10px] text-amber-600/80 mt-0.5">{zone}</div>
          )}
        </div>

        {/* Right: phase + rewards */}
        <div className="text-right shrink-0">
          <div className={`text-sm font-bold mb-1 ${phaseInfo.color}`}>{phaseInfo.text}</div>
          <div className="flex flex-col gap-0.5 text-[10px] text-gray-600">
            <span>💰 {stageDef.goldReward.toLocaleString()}g</span>
            <span>✨ {stageDef.xpReward.toLocaleString()} xp</span>
            {isBoss && <span className="text-amber-600">+35% loot</span>}
          </div>
        </div>
      </div>

      {/* Stage modifier */}
      {displayMod && (
        <div className={`mt-3 flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold ${
          activeMod
            ? 'border-violet-700/50 bg-violet-950/30 text-violet-300'
            : 'border-gray-700/50 bg-gray-800/30 text-gray-500'
        }`}>
          <span className="text-sm leading-none">{displayMod.icon}</span>
          <div className="flex flex-col gap-0">
            <span className={`font-black text-[10px] uppercase tracking-wide ${activeMod ? 'text-violet-300' : 'text-gray-500'}`}>
              {activeMod ? '⚠ Active — ' : 'Upcoming — '}{displayMod.label}
            </span>
            <span className="text-[9px] opacity-70">{displayMod.desc}</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-800/60">
        <button
          onClick={toggleAutoAdvance}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition-colors
            ${autoAdvance
              ? 'bg-amber-900/30 border-amber-700/50 text-amber-400 hover:bg-amber-900/50'
              : 'bg-gray-800/60 border-gray-700 text-gray-500 hover:border-gray-600'
            }
          `}
        >
          {autoAdvance ? '⏩ Auto ON' : '⏸ Auto OFF'}
        </button>
        <button
          onClick={toggleRetreatOnFirstDeath}
          title="When ON, the party retreats immediately if any hero dies"
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition-colors
            ${retreatOnFirstDeath
              ? 'bg-red-950/40 border-red-800/50 text-red-400 hover:bg-red-950/60'
              : 'bg-gray-800/60 border-gray-700 text-gray-500 hover:border-gray-600'
            }
          `}
        >
          {retreatOnFirstDeath ? '🛡 Safe Mode ON' : '🛡 Safe Mode OFF'}
        </button>

        {currentStage > 1 && (
          <button
            onClick={() => { setStage(Math.max(1, currentStage - 1)); setPhase('idle') }}
            className="px-3 py-1.5 rounded text-xs font-semibold border border-gray-700/60 text-gray-600 hover:border-red-800/50 hover:text-red-500 transition-colors"
          >
            ← Retreat
          </button>
        )}

        {highestStage > 1 && (
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => { setStage(Math.max(1, currentStage - 1)); setPhase('idle') }}
              disabled={currentStage <= 1}
              className="w-6 h-6 rounded border border-gray-700/60 text-gray-600 hover:text-gray-300 text-xs disabled:opacity-20 transition-colors"
            >‹</button>
            <span className="text-[10px] text-gray-700 px-1">{currentStage}</span>
            <button
              onClick={() => { setStage(Math.min(highestStage, currentStage + 1)); setPhase('idle') }}
              disabled={currentStage >= highestStage}
              className="w-6 h-6 rounded border border-gray-700/60 text-gray-600 hover:text-gray-300 text-xs disabled:opacity-20 transition-colors"
            >›</button>
            {currentStage < highestStage && (
              <button
                onClick={() => { setStage(highestStage); setPhase('idle') }}
                title={`Jump to stage ${highestStage}`}
                className="ml-1 px-2 h-6 rounded border border-amber-800/50 text-amber-600 hover:border-amber-600 hover:text-amber-400 text-[10px] font-bold transition-colors"
              >⏭ {highestStage}</button>
            )}
          </div>
        )}
      </div>

      {/* Prestige panel */}
      <div className={`mt-3 pt-3 border-t ${prestigeReady ? 'border-violet-800/50' : 'border-gray-800/40'}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">Prestige</span>
              {prestigeCount > 0 && (
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-violet-950/50 border border-violet-800/50 text-violet-400">
                  ×{prestigeCount}
                </span>
              )}
            </div>
            {prestigeCount > 0 && (
              <div className="text-[9px] text-violet-500/80 flex gap-2">
                <span>💰 +{(prestigeBonus.goldMult - 1) * 100}%g</span>
                <span>✨ +{(prestigeBonus.xpMult - 1) * 100}%xp</span>
                <span>⚔️ +{Math.round(prestigeBonus.atkPct * 100)}%atk</span>
              </div>
            )}
            {!prestigeReady && (
              <div className="text-[9px] text-gray-700">
                Reach stage {prestigeRequired} to unlock
              </div>
            )}
          </div>

          {prestigeReady && !showPrestigeConfirm && (
            <button
              onClick={() => setShowPrestigeConfirm(true)}
              className="px-3 py-1.5 rounded text-xs font-black border border-violet-700/60 bg-violet-950/40 text-violet-400 hover:bg-violet-900/50 transition-colors animate-pulse"
            >
              ✦ Prestige
            </button>
          )}
        </div>

        {showPrestigeConfirm && (
          <div className="mt-2 rounded-lg border border-violet-800/60 bg-violet-950/30 p-2.5">
            <div className="text-[10px] text-violet-300 font-semibold mb-1">
              Reset ALL progress for permanent bonuses?
            </div>
            <div className="text-[9px] text-violet-500/80 mb-2 flex gap-3">
              <span>+5% gold/xp</span>
              <span>+3% ATK</span>
              <span>forever</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  prestige()
                  resetInventory()
                  setShowPrestigeConfirm(false)
                  setPhase('idle')
                }}
                className="flex-1 py-1 rounded text-[10px] font-black bg-violet-800/60 border border-violet-600/50 text-violet-200 hover:bg-violet-700/60 transition-colors"
              >
                Confirm Prestige
              </button>
              <button
                onClick={() => setShowPrestigeConfirm(false)}
                className="px-3 py-1 rounded text-[10px] font-semibold border border-gray-700 text-gray-500 hover:text-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
