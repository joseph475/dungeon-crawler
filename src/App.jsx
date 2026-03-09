import { useState } from 'react'
import { useGameStore } from '@/store/useGameStore'
import { useInventoryStore } from '@/store/useInventoryStore'
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

function ClassCard({ cls, selected, onClick }) {
  const ROLE_COLORS = {
    'tank':             'text-red-400',
    'support-tank':     'text-orange-400',
    'burst-dps':        'text-purple-400',
    'healer':           'text-green-400',
    'single-target-dps':'text-rose-400',
    'multi-hit-dps':    'text-yellow-400',
    'consistent-dps':   'text-blue-400',
    'hybrid':           'text-teal-400',
  }
  return (
    <button
      onClick={onClick}
      className={`
        relative rounded-lg border p-4 text-left transition-all duration-150 cursor-pointer
        hover:border-amber-600/60 hover:bg-gray-900
        ${selected
          ? 'border-amber-500 bg-amber-950/30 ring-1 ring-amber-600/40'
          : 'border-gray-700/60 bg-gray-900/40'
        }
      `}
    >
      {selected && (
        <span className="absolute top-2 right-2 text-amber-400 text-xs font-bold">✓</span>
      )}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl leading-none">{cls.icon}</span>
        <div>
          <div className="font-bold text-sm text-gray-100">{cls.name}</div>
          <div className={`text-[10px] capitalize ${ROLE_COLORS[cls.role] ?? 'text-gray-500'}`}>
            {cls.role.replace(/-/g, ' ')}
          </div>
        </div>
      </div>
      <p className="text-[11px] text-gray-500 leading-snug">{cls.description}</p>
      <div className="mt-2 flex gap-2 text-[10px] text-gray-600">
        <span>HP {cls.baseStats.hp}</span>
        <span>ATK {cls.baseStats.atk}</span>
        <span>SPD {cls.baseStats.spd}</span>
      </div>
    </button>
  )
}

function PartySelectScreen({ onStart }) {
  const [selected, setSelected] = useState([])

  function toggle(classId) {
    setSelected((prev) => {
      if (prev.includes(classId)) return prev.filter((c) => c !== classId)
      if (prev.length >= PARTY_SIZE) return prev   // max 4
      return [...prev, classId]
    })
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center p-6">
      {/* Title */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-widest text-amber-400 mb-2">
          ⚔️ DUNGEON CRAWL
        </h1>
        <p className="text-gray-500 text-sm">Select your party of {PARTY_SIZE}</p>
      </div>

      {/* Class grid */}
      <div className="w-full max-w-3xl grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {CLASS_LIST.map((cls) => (
          <ClassCard
            key={cls.id}
            cls={cls}
            selected={selected.includes(cls.id)}
            onClick={() => toggle(cls.id)}
          />
        ))}
      </div>

      {/* Party preview */}
      <div className="flex gap-2 mb-6 min-h-9">
        {Array.from({ length: PARTY_SIZE }).map((_, i) => {
          const classId = selected[i]
          const cls = classId ? CLASSES[classId] : null
          return (
            <div
              key={i}
              className={`
                w-9 h-9 rounded-lg border flex items-center justify-center text-lg
                ${cls ? 'border-amber-600/60 bg-amber-950/20' : 'border-gray-800 bg-gray-900/40'}
              `}
            >
              {cls ? cls.icon : <span className="text-gray-700 text-xs">{i + 1}</span>}
            </div>
          )
        })}
      </div>

      {/* Start button */}
      <button
        onClick={() => selected.length === PARTY_SIZE && onStart(selected)}
        disabled={selected.length < PARTY_SIZE}
        className={`
          px-8 py-3 rounded-lg font-bold text-base tracking-wider border transition-all
          ${selected.length === PARTY_SIZE
            ? 'border-amber-600 bg-amber-900/40 text-amber-400 hover:bg-amber-900/60 cursor-pointer'
            : 'border-gray-700 bg-gray-900/20 text-gray-600 cursor-not-allowed'
          }
        `}
      >
        {selected.length === PARTY_SIZE
          ? '⚔️ Enter the Dungeon'
          : `Select ${PARTY_SIZE - selected.length} more hero${PARTY_SIZE - selected.length === 1 ? '' : 'es'}`
        }
      </button>
    </div>
  )
}

// ─── HUD ─────────────────────────────────────────────────────────────────────

function HUD() {
  const { gold, currentStage, highestStage, totalRunTime, resetGame, gameSpeed, setGameSpeed } = useGameStore()
  const resetInventory = useInventoryStore((s) => s.resetInventory)

  const hours   = Math.floor(totalRunTime / 3600)
  const minutes = Math.floor((totalRunTime % 3600) / 60)
  const seconds = totalRunTime % 60
  const timeStr = hours > 0
    ? `${hours}h ${minutes}m`
    : `${minutes}m ${seconds}s`

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-gray-800/60 bg-gray-950/80 sticky top-0 z-20">
      <h1 className="text-lg font-bold tracking-widest text-amber-400">⚔️ DUNGEON CRAWL</h1>
      <div className="flex items-center gap-5 text-xs">
        <span className="text-amber-400 font-semibold">💰 {gold.toLocaleString()}</span>
        <span className="text-gray-500">Stage {currentStage} <span className="text-gray-700">/ {highestStage}</span></span>
        <span className="text-gray-700">{timeStr}</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((s) => (
            <button
              key={s}
              onClick={() => setGameSpeed(s)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                gameSpeed === s
                  ? 'bg-amber-500 border-amber-400 text-gray-900'
                  : 'border-gray-700 text-gray-600 hover:text-gray-400'
              }`}
            >
              x{s}
            </button>
          ))}
        </div>
        <button
          onClick={() => { if (confirm('Reset all progress?')) { resetGame(); resetInventory() } }}
          className="text-gray-700 hover:text-red-500 transition-colors"
          title="Reset game"
        >
          ↺
        </button>
      </div>
    </header>
  )
}

// ─── Game view ────────────────────────────────────────────────────────────────

const SPEED_MS = { 1: 300, 2: 150, 3: 100 }

function GameView() {
  const { processTick } = useCombat()
  const gameSpeed = useGameStore((s) => s.gameSpeed)
  useGameLoop(processTick, true, SPEED_MS[gameSpeed] ?? 100)

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <HUD />

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
