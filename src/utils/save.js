/**
 * Save/load helpers.
 * Zustand persist handles auto-save; these are for manual export/import.
 */

export function exportSave() {
  const keys = ['dungeon-game', 'dungeon-inventory']
  const data = {}
  keys.forEach((k) => {
    const raw = localStorage.getItem(k)
    if (raw) data[k] = JSON.parse(raw)
  })
  return JSON.stringify(data)
}

export function importSave(jsonString) {
  try {
    const data = JSON.parse(jsonString)
    Object.entries(data).forEach(([k, v]) => {
      localStorage.setItem(k, JSON.stringify(v))
    })
    window.location.reload()
  } catch (e) {
    console.error('Failed to import save:', e)
    throw new Error('Invalid save data')
  }
}

export function resetSave() {
  ;['dungeon-game', 'dungeon-inventory'].forEach((k) => localStorage.removeItem(k))
  window.location.reload()
}
