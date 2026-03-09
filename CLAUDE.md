# Dungeon Crawling Idle RPG — Claude Instructions

## Commands
- **Dev server**: `export PATH="/opt/homebrew/bin:$PATH" && npm run dev`
- **Build**: `export PATH="/opt/homebrew/bin:$PATH" && npm run build`
- **Node is at**: `/opt/homebrew/bin/node` — always prefix with `export PATH="/opt/homebrew/bin:$PATH"`

## Project
Idle dungeon crawler. Party of 4 heroes auto-battles stages. Player manages party composition, equipment, and job advancement.

## Tech Stack
- React + Vite, Zustand (persist + devtools), Tailwind CSS v4 (`@tailwindcss/vite`), Radix UI primitives
- `@` alias → `src/` (configured in vite.config.js)
- No TypeScript — plain JSX throughout

## Architecture

### Data layer (`src/data/`) — pure JS, no side effects
| File | Purpose |
|------|---------|
| `classes.js` | 8 base classes, `getStatsAtLevel(classId, level)` |
| `jobs.js` | 3-tier job tree (40+ jobs), `getTier1Jobs()`, `getNextJobs()`, `getJobPath()` |
| `skills.js` | 4 skills per class/job, `getSkillSet(classId, jobId)`, `getSkill(classId, jobId, slot)` |
| `stages.js` | 100 stages, `generateEnemies(stage)`, `getStage(stage)`, `STAGES[]` |
| `items.js` | Item pool by class + rarity |

### Stores (`src/store/`)
| Store | Persisted | Purpose |
|-------|-----------|---------|
| `useGameStore` | ✅ `dungeon-game` | Heroes, party, gold, stage, XP, job advancement |
| `useCombatStore` | ❌ | Phase, enemies, cooldowns, effects, combat log |
| `useInventoryStore` | ✅ `dungeon-inventory` | Items, equip/unequip, rarity filters |

### Key store patterns
- `resolveHeroStats(hero)` — exported from `useGameStore`, pure, combines base + job + equipment bonuses
- `useGameStore.getHeroStats(heroId)` — calls resolveHeroStats via store getter
- Equipment bonuses flow: `useInventoryStore.equipItem()` → `_syncEquipmentBonus()` → `useGameStore.setEquipmentBonus()`
- Combat phase machine: `idle → fighting → victory/defeat → (delay) → idle`

### Hooks (`src/hooks/`)
| Hook | Purpose |
|------|---------|
| `useGameLoop(onTick, active, intervalMs)` | setInterval at 100ms (10 ticks/sec), ref-based |
| `useCombat()` | Full combat orchestration — returns `{ processTick }` |

### Utils (`src/utils/`)
| File | Exports |
|------|---------|
| `combat.js` | `calcDamage`, `calcHeal`, `spdToTickRate`, `manaPerHit`, `applyEffects`, `enemyAttack`, `calcLifesteal`, `calcDotTick` |
| `loot.js` | `rollLoot(stage, bonusChance)` → item array |
| `save.js` | `exportSave()`, `importSave(json)`, `resetSave()` |

## Key Data Shapes

### Hero object (in `useGameStore.heroes`)
```js
{
  id, name, classId, jobId, jobTier,
  level, xp,
  currentHp, currentMana, isDead,
  equipment: { weapon, helmet, chest, gloves, boots, ring, amulet, relic }, // item uid or null
  equipmentBonus: {}  // flat stat bonuses from gear
}
```

### Enemy object (in `useCombatStore.enemies`)
```js
{ id, name, icon, isBoss, maxHp, currentHp, atk, def, spd, crit, critDmg }
```

### Item object (in `useInventoryStore.items`)
```js
{ uid, id, name, icon, slot, classLock, rarity, stats: {}, equippedBy }
```

### Combat log entry
```js
{ id, tick, type: 'hit'|'skill'|'ult'|'heal'|'death'|'stage'|'loot', text, actorId, value, isCrit }
```

### Skill effect tags (resolved by `useCombat.js`)
`dmg`, `dmgAll`, `heal`, `healAll`, `buff`, `buffAll`, `debuff`, `shield`, `stun`, `reviveAll`, `gainMana`, `dot`

## Skills System
- Slot 0 `basic` — fires every N ticks based on SPD (`spdToTickRate`)
- Slot 1 `skill` — fires when cooldown expires (cooldown in seconds × 10 ticks)
- Slot 2 `ultimate` — fires when `currentMana >= maxMana`; drains mana fully on use
- Slot 3 `passive` — applied at stat-resolve time, not during combat loop

## Job Advancement
- Tier 1 at level 20, Tier 2 at level 50, Tier 3 at level 100
- Modal shown via `JobAdvancementModal.jsx` when threshold is crossed
- `advanceJob(heroId, jobId)` in `useGameStore`

## Classes
`warrior` `paladin` `mage` `healer` `assassin` `rogue` `ranger` `shaman`

## Rarity system
`common` → `uncommon` → `rare` → `epic` → `legendary`
Colors exported from `useInventoryStore`: `RARITY_COLORS`, `RARITY_BG`

## UI Conventions
- Dark fantasy theme: bg `gray-950`, accents `amber-400` (gold), `red-600` (blood), `purple-600` (epic)
- All panels are dark cards with subtle borders — no white backgrounds
- HP bars: red. Mana bars: blue/indigo. XP bars: yellow/amber
- Rarity borders match `RARITY_COLORS` from inventory store
- Use Tailwind utility classes only — no custom CSS unless unavoidable
- shadcn/ui for modals, tooltips, progress bars

## Component Map
| Component | Panel | Key data |
|-----------|-------|---------|
| `PartyPanel` | Left column | 4 hero cards, HP/mana/XP bars, class icon, job name |
| `CombatPanel` | Right column | Enemy HP bars, combat log, skill flash |
| `StagePanel` | Right column top | Stage number, auto-advance toggle, retreat button |
| `InventoryPanel` | Left column | Item grid, rarity filter, class filter |
| `HeroDetailModal` | Modal | Full stats, gear slots, skill list, job tree |
| `JobAdvancementModal` | Modal | 2 job choices with descriptions, triggered at level threshold |

## Do Not
- Do not use `require()` — ESM only (`import/export`)
- Do not add TypeScript
- Do not create new CSS files — Tailwind only
- Do not persist `useCombatStore` — combat resets each session
- Do not call store getters (`getParty`, `getHeroStats`) inside Zustand selectors — call them in component/hook body
