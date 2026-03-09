import { useGameStore } from '@/store/useGameStore'
import { JOBS, getTier1Jobs, getNextJobs } from '@/data/jobs'
import { getSkillSet } from '@/data/skills'

// ─── Job choice card ──────────────────────────────────────────────────────────

function JobChoiceCard({ job, onChoose }) {
  const tierColors = {
    1: { border: 'border-green-700/60', bg: 'bg-green-950/30', text: 'text-green-400', btn: 'border-green-700 text-green-400 hover:bg-green-900/40' },
    2: { border: 'border-blue-700/60',  bg: 'bg-blue-950/30',  text: 'text-blue-400',  btn: 'border-blue-700  text-blue-400  hover:bg-blue-900/40'  },
    3: { border: 'border-purple-700/60',bg: 'bg-purple-950/30',text: 'text-purple-300',btn: 'border-purple-700 text-purple-300 hover:bg-purple-900/40'},
  }[job.tier] ?? { border: 'border-gray-700', bg: 'bg-gray-900', text: 'text-gray-300', btn: 'border-gray-700 text-gray-300' }

  const skills = getSkillSet(job.baseClass, job.id)
  const isLegendary = job.tier === 3

  return (
    <div className={`flex-1 rounded-lg border p-4 flex flex-col gap-3 ${tierColors.border} ${tierColors.bg}`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-3xl leading-none">{job.icon}</span>
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`font-bold text-base ${tierColors.text}`}>{job.name}</h3>
            {isLegendary && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-900/50 text-yellow-400 border border-yellow-700/50 uppercase tracking-wider">
                Legendary
              </span>
            )}
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5">{job.description}</p>
        </div>
      </div>

      {/* Stat bonuses */}
      {job.statBonus && Object.keys(job.statBonus).length > 0 && (
        <div>
          <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Stat Bonuses</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {Object.entries(job.statBonus).map(([k, v]) => (
              <span key={k} className="text-[11px] text-green-400">
                +{typeof v === 'number' && Math.abs(v) < 1
                  ? `${(v * 100).toFixed(1)}%`
                  : Math.floor(v)
                } {k.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Key skills (skill + ult only) */}
      <div>
        <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Key Skills</p>
        <div className="flex flex-col gap-1">
          {skills.filter((s) => s.slot === 'skill' || s.slot === 'ultimate').map((skill) => (
            <div key={skill.id} className="flex items-start gap-1.5">
              <span className="text-sm leading-tight">{skill.icon}</span>
              <div>
                <span className={`text-[11px] font-semibold ${
                  skill.slot === 'ultimate' ? 'text-purple-400' : 'text-blue-400'
                }`}>
                  {skill.name}
                </span>
                <p className="text-[10px] text-gray-600 leading-snug">{skill.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Choose button */}
      <button
        onClick={() => onChoose(job.id)}
        className={`mt-auto w-full py-2 rounded border text-sm font-bold tracking-wide transition-colors ${tierColors.btn}`}
      >
        Choose {job.name}
      </button>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

/**
 * @param {string}   heroId    — hero that is advancing
 * @param {boolean}  open
 * @param {Function} onClose
 */
export default function JobAdvancementModal({ heroId, open, onClose }) {
  const { heroes, advanceJob } = useGameStore()

  if (!open || !heroId) return null

  const hero = heroes[heroId]
  if (!hero) return null

  // Determine which tier is being selected
  const nextTier = hero.jobTier + 1
  const tierLabel = { 1: 'Tier I', 2: 'Tier II', 3: 'Tier III (Legendary)' }[nextTier]

  // Get the correct job choices for this tier
  let choices = []
  if (nextTier === 1) {
    choices = getTier1Jobs(hero.classId)
  } else if (hero.jobId) {
    choices = getNextJobs(hero.jobId)
  }

  function handleChoose(jobId) {
    advanceJob(heroId, jobId)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-2xl rounded-xl border border-amber-700/40 bg-gray-950 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-800 bg-linear-to-r from-amber-950/40 to-gray-950">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-amber-600 mb-1">
                Job Advancement — {tierLabel}
              </p>
              <h2 className="text-xl font-bold text-amber-400">
                {hero.name} has reached Level {hero.level}!
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Choose a path. This decision is permanent.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-400 text-xl p-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Choices */}
        <div className="p-6">
          {choices.length === 0 ? (
            <p className="text-center text-gray-600 py-8">No advancement paths available.</p>
          ) : (
            <div className="flex gap-4 flex-col sm:flex-row">
              {choices.map((job) => (
                <JobChoiceCard key={job.id} job={job} onChoose={handleChoose} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
