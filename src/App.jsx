import { useState, useRef, useEffect } from 'react'
import { exportSave, importSave } from '@/utils/save'
import { useGameStore } from '@/store/useGameStore'
import { useInventoryStore } from '@/store/useInventoryStore'
import { useToastStore } from '@/store/useToastStore'
import { ACHIEVEMENTS } from '@/data/achievements'
import { useGameLoop } from '@/hooks/useGameLoop'
import { useCombat } from '@/hooks/useCombat'
import { CLASSES } from '@/data/classes'
import PartyPanel from '@/components/PartyPanel'
import CombatPanel from '@/components/CombatPanel'
import StagePanel from '@/components/StagePanel'
import InventoryPanel from '@/components/InventoryPanel'

// ─── Party select screen ──────────────────────────────────────────────────────

const CLASS_LIST = Object.values(CLASSES)
const PARTY_SIZE = 4

const ROLE_COLORS = {
  'tank':              'text-red-400',
  'support-tank':      'text-orange-400',
  'burst-dps':         'text-purple-400',
  'healer':            'text-green-400',
  'single-target-dps': 'text-rose-400',
  'multi-hit-dps':     'text-yellow-400',
  'consistent-dps':    'text-blue-400',
  'hybrid':            'text-teal-400',
}

const ROLE_GLOW = {
  'tank':              'hover:shadow-red-900/40',
  'support-tank':      'hover:shadow-orange-900/40',
  'burst-dps':         'hover:shadow-purple-900/40',
  'healer':            'hover:shadow-green-900/40',
  'single-target-dps': 'hover:shadow-rose-900/40',
  'multi-hit-dps':     'hover:shadow-yellow-900/40',
  'consistent-dps':    'hover:shadow-blue-900/40',
  'hybrid':            'hover:shadow-teal-900/40',
}

const ROLE_BORDER_SELECTED = {
  'tank':              'border-red-500/70 ring-red-600/30',
  'support-tank':      'border-orange-500/70 ring-orange-600/30',
  'burst-dps':         'border-purple-500/70 ring-purple-600/30',
  'healer':            'border-green-500/70 ring-green-600/30',
  'single-target-dps': 'border-rose-500/70 ring-rose-600/30',
  'multi-hit-dps':     'border-yellow-500/70 ring-yellow-600/30',
  'consistent-dps':    'border-blue-500/70 ring-blue-600/30',
  'hybrid':            'border-teal-500/70 ring-teal-600/30',
}

function ClassCard({ cls, selected, onClick }) {
  const roleColor  = ROLE_COLORS[cls.role]  ?? 'text-gray-500'
  const roleGlow   = ROLE_GLOW[cls.role]    ?? ''
  const selBorder  = ROLE_BORDER_SELECTED[cls.role] ?? 'border-amber-500/70 ring-amber-600/30'

  return (
    <button
      onClick={onClick}
      className={`
        relative rounded-xl border p-4 text-left transition-all duration-200 cursor-pointer
        hover:shadow-lg ${roleGlow} hover:shadow-[0_0_20px_0] hover:-translate-y-0.5
        ${selected
          ? `${selBorder} bg-gray-900 ring-1 shadow-lg`
          : 'border-gray-700/60 bg-gray-900/40 hover:border-gray-600/80 hover:bg-gray-900/70'
        }
      `}
    >
      {selected && (
        <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-[10px] font-black text-gray-900">
          ✓
        </span>
      )}

      {/* Icon — larger, centered top */}
      <div className="flex flex-col items-start gap-3">
        <span className={`text-4xl leading-none select-none transition-transform duration-200 ${selected ? 'scale-110' : ''}`}>
          {cls.icon}
        </span>
        <div>
          <div className="font-bold text-sm text-gray-100 leading-tight">{cls.name}</div>
          <div className={`text-[10px] capitalize font-semibold mt-0.5 ${roleColor}`}>
            {cls.role.replace(/-/g, ' ')}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-gray-500 leading-snug mt-2.5">{cls.description}</p>

      {/* Base stat pills */}
      <div className="mt-3 flex gap-1.5 flex-wrap">
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-950/60 border border-red-900/40 text-red-400 font-semibold">
          HP {cls.baseStats.hp}
        </span>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-950/60 border border-orange-900/40 text-orange-400 font-semibold">
          ATK {cls.baseStats.atk}
        </span>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-900/40 text-blue-400 font-semibold">
          SPD {cls.baseStats.spd}
        </span>
      </div>
    </button>
  )
}

function PartySelectScreen({ onStart }) {
  const [selected, setSelected] = useState([])

  function toggle(classId) {
    setSelected((prev) => {
      if (prev.includes(classId)) return prev.filter((c) => c !== classId)
      if (prev.length >= PARTY_SIZE) return prev
      return [...prev, classId]
    })
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center p-6">
      {/* Subtle radial glow behind title */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
        <div className="w-96 h-96 rounded-full bg-amber-600 blur-3xl" />
      </div>

      {/* Title */}
      <div className="mb-10 text-center relative z-10">
        <div className="text-5xl mb-3 select-none">⚔️</div>
        <h1 className="text-4xl font-black tracking-[0.2em] text-amber-400 uppercase mb-2"
            style={{ textShadow: '0 0 40px rgba(251,191,36,0.4)' }}>
          Dungeon Crawl
        </h1>
        <p className="text-gray-500 text-sm tracking-wider">Assemble your party of {PARTY_SIZE} heroes</p>
        <div className="w-24 h-px bg-linear-to-r from-transparent via-amber-600/60 to-transparent mx-auto mt-3" />
      </div>

      {/* Class grid */}
      <div className="relative z-10 w-full max-w-3xl grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {CLASS_LIST.map((cls) => (
          <ClassCard
            key={cls.id}
            cls={cls}
            selected={selected.includes(cls.id)}
            onClick={() => toggle(cls.id)}
          />
        ))}
      </div>

      {/* Party preview slots */}
      <div className="relative z-10 flex gap-3 mb-8 items-center">
        <span className="text-[10px] text-gray-700 uppercase tracking-widest mr-1">Party</span>
        {Array.from({ length: PARTY_SIZE }).map((_, i) => {
          const classId = selected[i]
          const cls = classId ? CLASSES[classId] : null
          return (
            <div
              key={i}
              className={`
                w-12 h-12 rounded-xl border-2 flex items-center justify-center text-2xl
                transition-all duration-200
                ${cls
                  ? 'border-amber-500/60 bg-amber-950/30 shadow-lg shadow-amber-900/30 scale-105'
                  : 'border-gray-800 bg-gray-900/40 border-dashed'
                }
              `}
            >
              {cls ? cls.icon : <span className="text-gray-800 text-xs font-bold">{i + 1}</span>}
            </div>
          )
        })}
      </div>

      {/* Start button */}
      <button
        onClick={() => selected.length === PARTY_SIZE && onStart(selected)}
        disabled={selected.length < PARTY_SIZE}
        className={`
          relative z-10 px-10 py-3.5 rounded-xl font-black text-sm tracking-[0.15em] uppercase border-2 transition-all duration-200
          ${selected.length === PARTY_SIZE
            ? 'border-amber-500 bg-amber-950/50 text-amber-400 hover:bg-amber-900/50 hover:border-amber-400 cursor-pointer shadow-lg shadow-amber-900/30 hover:shadow-amber-800/40 hover:-translate-y-0.5'
            : 'border-gray-700/50 bg-gray-900/20 text-gray-700 cursor-not-allowed'
          }
        `}
      >
        {selected.length === PARTY_SIZE
          ? '⚔ Enter the Dungeon'
          : `Select ${PARTY_SIZE - selected.length} more hero${PARTY_SIZE - selected.length === 1 ? '' : 'es'}`
        }
      </button>
    </div>
  )
}

// ─── Toast notifications ──────────────────────────────────────────────────────

const TOAST_STYLES = {
  levelup:     'border-amber-700/60 bg-amber-950/90 text-amber-300',
  jobready:    'border-violet-700/60 bg-violet-950/90 text-violet-300',
  mythic:      'border-red-700/60 bg-red-950/90 text-red-300',
  achievement: 'border-yellow-600/60 bg-yellow-950/90 text-yellow-200',
  info:        'border-gray-700/60 bg-gray-900/90 text-gray-300',
}

function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const removeToast = useToastStore((s) => s.removeToast)

  if (!toasts.length) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg border shadow-xl
            text-[11px] font-semibold pointer-events-auto
            animate-in fade-in slide-in-from-right-4 duration-200
            ${TOAST_STYLES[toast.type] ?? TOAST_STYLES.info}
          `}
        >
          {toast.icon && <span className="text-sm leading-none">{toast.icon}</span>}
          <span>{toast.text}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-1 opacity-50 hover:opacity-100 text-xs leading-none"
          >✕</button>
        </div>
      ))}
    </div>
  )
}

// ─── Achievements modal ───────────────────────────────────────────────────────

const ACHIEVEMENT_CATEGORIES = ['Combat', 'Progress', 'Economy']

function AchievementsModal({ onClose }) {
  const unlockedAchievements = useGameStore((s) => s.unlockedAchievements ?? {})
  const lifetimeStats = useGameStore((s) => s.lifetimeStats ?? {})
  const highestStage  = useGameStore((s) => s.highestStage ?? 0)

  function getProgress(a) {
    const { stat, threshold } = a.condition
    let value = 0
    if (stat === 'kills')        value = lifetimeStats.kills       ?? 0
    if (stat === 'clears')       value = lifetimeStats.clears      ?? 0
    if (stat === 'goldEarned')   value = lifetimeStats.goldEarned  ?? 0
    if (stat === 'itemsFound')   value = lifetimeStats.itemsFound  ?? 0
    if (stat === 'highestStage') value = highestStage
    return { value, threshold, pct: Math.min(100, (value / threshold) * 100) }
  }

  const unlocked = ACHIEVEMENTS.filter((a) => unlockedAchievements[a.id]).length

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-950 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
          <div>
            <span className="text-sm font-black text-gray-100 tracking-wide">🏅 Achievements</span>
            <span className="ml-2 text-[10px] text-gray-600">{unlocked} / {ACHIEVEMENTS.length} unlocked</span>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 text-lg leading-none">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-3 flex flex-col gap-4">
          {ACHIEVEMENT_CATEGORIES.map((cat) => {
            const catAchievements = ACHIEVEMENTS.filter((a) => a.category === cat)
            return (
              <div key={cat}>
                <div className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-2">{cat}</div>
                <div className="flex flex-col gap-2">
                  {catAchievements.map((a) => {
                    const isUnlocked = !!unlockedAchievements[a.id]
                    const prog = getProgress(a)
                    return (
                      <div
                        key={a.id}
                        className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                          isUnlocked
                            ? 'border-yellow-700/50 bg-yellow-950/20'
                            : 'border-gray-800/60 bg-gray-900/30'
                        }`}
                      >
                        <span className={`text-xl leading-none shrink-0 ${isUnlocked ? '' : 'grayscale opacity-40'}`}>
                          {a.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[11px] font-bold ${isUnlocked ? 'text-yellow-300' : 'text-gray-500'}`}>
                              {a.name}
                            </span>
                            <span className={`text-[9px] font-bold shrink-0 ${isUnlocked ? 'text-yellow-500' : 'text-gray-700'}`}>
                              {a.rewardLabel}
                            </span>
                          </div>
                          <div className={`text-[10px] mt-0.5 ${isUnlocked ? 'text-gray-400' : 'text-gray-600'}`}>
                            {a.desc}
                          </div>
                          {!isUnlocked && (
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-700 rounded-full transition-all"
                                  style={{ width: `${prog.pct}%` }}
                                />
                              </div>
                              <span className="text-[9px] text-gray-700 tabular-nums shrink-0">
                                {prog.value.toLocaleString()} / {prog.threshold.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {isUnlocked && (
                            <div className="text-[9px] text-yellow-700 mt-0.5">✓ Unlocked</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── HUD ─────────────────────────────────────────────────────────────────────

function StatsModal({ onClose }) {
  const ls = useGameStore((s) => s.lifetimeStats ?? {})
  const totalRunTime = useGameStore((s) => s.totalRunTime)
  const stageRecords = useGameStore((s) => s.stageRecords ?? {})
  const hours   = Math.floor(totalRunTime / 3600)
  const minutes = Math.floor((totalRunTime % 3600) / 60)
  const seconds = totalRunTime % 60
  const timeStr = hours > 0 ? `${hours}h ${minutes}m ${seconds}s` : `${minutes}m ${seconds}s`

  const rows = [
    { label: 'Total Damage Dealt', value: (ls.damage ?? 0).toLocaleString(), icon: '⚔️' },
    { label: 'Total Healing Done', value: (ls.healing ?? 0).toLocaleString(), icon: '💚' },
    { label: 'Enemies Killed',     value: (ls.kills ?? 0).toLocaleString(),   icon: '💀' },
    { label: 'Stages Cleared',     value: (ls.clears ?? 0).toLocaleString(),  icon: '✅' },
    { label: 'Gold Earned',        value: (ls.goldEarned ?? 0).toLocaleString(), icon: '🪙' },
    { label: 'Items Found',        value: (ls.itemsFound ?? 0).toLocaleString(), icon: '🎁' },
    { label: 'Time Played',        value: timeStr, icon: '⏱️' },
  ]

  // Top 5 fastest clears (lowest ticks = best)
  const topRecords = Object.entries(stageRecords)
    .map(([stage, ticks]) => ({ stage: Number(stage), ticks }))
    .sort((a, b) => a.ticks - b.ticks)
    .slice(0, 5)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-xs rounded-xl border border-gray-700 bg-gray-950 shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <span className="text-sm font-black text-gray-100 tracking-wide">📊 Battle Statistics</span>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 text-lg leading-none">✕</button>
        </div>
        <div className="p-4 flex flex-col gap-2">
          {rows.map(({ label, value, icon }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[11px] text-gray-500">{icon} {label}</span>
              <span className="text-[11px] font-bold text-gray-200 tabular-nums">{value}</span>
            </div>
          ))}
        </div>
        {topRecords.length > 0 && (
          <div className="px-4 pb-3">
            <div className="border-t border-gray-800 pt-3">
              <div className="text-[9px] font-black uppercase tracking-widest text-amber-700 mb-2">🏆 Fastest Clears</div>
              <div className="flex flex-col gap-1.5">
                {topRecords.map(({ stage, ticks }, i) => (
                  <div key={stage} className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">
                      <span className="text-amber-700 mr-1">#{i + 1}</span> Stage {stage}
                    </span>
                    <span className="text-[11px] font-bold text-amber-400 tabular-nums">{(ticks * 0.1).toFixed(1)}s</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="px-4 pb-4">
          <p className="text-[9px] text-gray-700 text-center">Lifetime totals · survive prestige</p>
        </div>
      </div>
    </div>
  )
}

function HUD() {
  const { gold, currentStage, highestStage, totalRunTime, resetGame, gameSpeed, setGameSpeed } = useGameStore()
  const resetInventory = useInventoryStore((s) => s.resetInventory)
  const [saveOpen, setSaveOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [achievementsOpen, setAchievementsOpen] = useState(false)
  const [importError, setImportError] = useState(null)
  const saveRef = useRef(null)

  // Close save popover on outside click
  useEffect(() => {
    if (!saveOpen) return
    function handler(e) {
      if (saveRef.current && !saveRef.current.contains(e.target)) setSaveOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [saveOpen])

  const hours   = Math.floor(totalRunTime / 3600)
  const minutes = Math.floor((totalRunTime % 3600) / 60)
  const seconds = totalRunTime % 60
  const timeStr = hours > 0
    ? `${hours}h ${minutes}m`
    : `${minutes}m ${seconds}s`

  return (
    <>
    <header className="
      flex items-center justify-between px-5 py-3
      bg-linear-to-r from-gray-950 via-gray-900/90 to-gray-950
      border-b border-amber-900/30
      sticky top-0 z-20
    ">
      {/* Left: title */}
      <h1 className="text-base font-black tracking-[0.18em] uppercase text-amber-400 select-none"
          style={{ textShadow: '0 0 20px rgba(251,191,36,0.25)' }}>
        ⚔ Dungeon Crawl
      </h1>

      {/* Right: stats + controls */}
      <div className="flex items-center gap-4">

        {/* Gold */}
        <div className="flex items-center gap-1.5">
          <span className="text-amber-500 text-sm leading-none">🪙</span>
          <span className="text-amber-400 font-bold text-sm tabular-nums">
            {(gold ?? 0).toLocaleString()}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-gray-700/60" />

        {/* Stage */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-600 uppercase tracking-wider">Stage</span>
          <span className="text-sm font-bold text-gray-200 tabular-nums">{currentStage}</span>
          <span className="text-[10px] text-gray-700 tabular-nums">/ {highestStage}</span>
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-gray-700/60" />

        {/* Time */}
        <span className="text-[11px] text-gray-600 tabular-nums">{timeStr}</span>

        {/* Divider */}
        <div className="w-px h-4 bg-gray-700/60" />

        {/* Speed controls */}
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((s) => (
            <button
              key={s}
              onClick={() => setGameSpeed(s)}
              className={`
                px-2.5 py-1 rounded-full text-[11px] font-black border transition-all duration-150
                ${gameSpeed === s
                  ? 'bg-amber-500 border-amber-400 text-gray-900 shadow-sm shadow-amber-700/40'
                  : 'border-gray-700 text-gray-600 hover:border-gray-500 hover:text-gray-400'
                }
              `}
            >
              x{s}
            </button>
          ))}
        </div>

        {/* Achievements */}
        <button
          onClick={() => setAchievementsOpen(true)}
          className="text-gray-600 hover:text-gray-300 transition-colors text-sm leading-none"
          title="Achievements"
        >
          🏅
        </button>

        {/* Stats */}
        <button
          onClick={() => setStatsOpen(true)}
          className="text-gray-600 hover:text-gray-300 transition-colors text-sm leading-none"
          title="Battle statistics"
        >
          📊
        </button>

        {/* Save / Export / Import */}
        <div className="relative" ref={saveRef}>
          <button
            onClick={() => setSaveOpen((v) => !v)}
            className="text-gray-600 hover:text-gray-300 transition-colors text-sm leading-none"
            title="Save options"
          >
            💾
          </button>
          {saveOpen && (
            <div className="absolute right-0 top-7 z-50 w-52 rounded-lg border border-gray-700 bg-gray-950 shadow-2xl p-2 flex flex-col gap-1.5">
              <div className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-0.5">Save Data</div>
              <button
                onClick={() => {
                  try {
                    const code = btoa(encodeURIComponent(exportSave()))
                    navigator.clipboard.writeText(code).then(() => {
                      setSaveOpen(false)
                    }).catch(() => {
                      // Clipboard API blocked — show the code in a prompt instead
                      prompt('Copy this save code:', code)
                      setSaveOpen(false)
                    })
                  } catch (e) {
                    setImportError('Export failed: ' + e.message)
                    setTimeout(() => setImportError(null), 4000)
                  }
                }}
                className="w-full text-left px-2.5 py-1.5 rounded text-xs text-gray-300 hover:bg-gray-800 transition-colors"
              >
                📤 Export (copy to clipboard)
              </button>
              <button
                onClick={() => {
                  const code = prompt('Paste your save code:')
                  if (!code) return
                  try {
                    importSave(decodeURIComponent(atob(code.trim())))
                  } catch {
                    setImportError('Invalid save code.')
                    setTimeout(() => setImportError(null), 3000)
                  }
                  setSaveOpen(false)
                }}
                className="w-full text-left px-2.5 py-1.5 rounded text-xs text-gray-300 hover:bg-gray-800 transition-colors"
              >
                📥 Import (paste code)
              </button>
              <div className="h-px bg-gray-800 my-0.5" />
              <button
                onClick={() => { if (confirm('Reset all progress?')) { resetGame(); resetInventory(); setSaveOpen(false) } }}
                className="w-full text-left px-2.5 py-1.5 rounded text-xs text-red-500 hover:bg-red-950/30 transition-colors"
              >
                ↺ Reset All Progress
              </button>
              {importError && <p className="text-[10px] text-red-400 px-1">{importError}</p>}
            </div>
          )}
        </div>
      </div>
    </header>
    {statsOpen && <StatsModal onClose={() => setStatsOpen(false)} />}
    {achievementsOpen && <AchievementsModal onClose={() => setAchievementsOpen(false)} />}
    </>
  )
}

// ─── Game view ────────────────────────────────────────────────────────────────

const SPEED_MS = { 1: 300, 2: 150, 3: 100 }

function GameView() {
  const { processTick } = useCombat()
  const gameSpeed = useGameStore((s) => s.gameSpeed)
  useGameLoop(processTick, true, SPEED_MS[gameSpeed] ?? 100)

  // On mount: reconcile the two persisted stores.
  // If they were saved from different sessions/accounts, heroes may reference
  // item UIDs that don't exist, or items may claim to be equipped by missing
  // heroes. Fix orphans first, then re-sync all equipment bonuses.
  useEffect(() => {
    const game = useGameStore.getState()
    const inv  = useInventoryStore.getState()
    const heroIds = new Set(Object.keys(game.heroes))

    // 1. Clear equippedBy on items whose hero no longer exists
    const hasOrphans = inv.items.some((i) => i.equippedBy && !heroIds.has(i.equippedBy))
    if (hasOrphans) {
      useInventoryStore.setState((s) => ({
        items: s.items.map((i) =>
          i.equippedBy && !heroIds.has(i.equippedBy) ? { ...i, equippedBy: null } : i
        ),
      }))
    }

    // 2. Re-sync equipment bonuses for every hero from the (now-clean) inventory
    Object.keys(game.heroes).forEach((heroId) => {
      useInventoryStore.getState()._syncEquipmentBonus(heroId, game)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <HUD />
      <ToastContainer />

      {/*
        Desktop: 3-column row — [Party narrow] [Stage+Combat wide] [Inventory]
        Mobile:  single column stack
      */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[260px_1fr_520px] gap-3 p-3 items-start">

        {/* ── Party (narrow, compact cards) ── */}
        <div className="flex flex-col gap-3">
          <PartyPanel compact />
        </div>

        {/* ── Center: Stage + Combat ── */}
        <div className="flex flex-col gap-3">
          <StagePanel />
          <CombatPanel />
        </div>

        {/* ── Inventory ── */}
        <div className="flex flex-col gap-3">
          <InventoryPanel />
        </div>

      </main>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const { gameStarted, startGame } = useGameStore()

  if (!gameStarted) {
    return <PartySelectScreen onStart={startGame} />
  }

  return <GameView />
}
