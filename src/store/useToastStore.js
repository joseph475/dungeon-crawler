import { create } from 'zustand'

let _toastId = 0

/**
 * Lightweight toast queue — NOT persisted, resets each session.
 * Toast types: 'levelup' | 'jobready' | 'mythic' | 'info'
 */
export const useToastStore = create((set, get) => ({
  toasts: [],

  addToast(toast) {
    const id = ++_toastId
    set((s) => ({ toasts: [...s.toasts, { id, ...toast }] }))
    // Auto-remove after duration (default 3s)
    setTimeout(() => get().removeToast(id), toast.duration ?? 3000)
  },

  removeToast(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },
}))
