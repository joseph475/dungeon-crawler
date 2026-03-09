import { useEffect, useRef } from 'react'

const TICK_MS = 100  // 10 ticks per second

/**
 * Core idle tick engine.
 *
 * Calls `onTick` every TICK_MS milliseconds while `active` is true.
 * Uses a ref to always call the latest version of the callback without
 * restarting the interval on every render.
 *
 * @param {() => void} onTick
 * @param {boolean} [active=true]
 * @param {number} [intervalMs=TICK_MS]
 */
export function useGameLoop(onTick, active = true, intervalMs = TICK_MS) {
  const callbackRef = useRef(onTick)

  // Keep ref current without resetting the interval
  useEffect(() => {
    callbackRef.current = onTick
  })

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => callbackRef.current(), intervalMs)
    return () => clearInterval(id)
  }, [active, intervalMs])
}

export { TICK_MS }
