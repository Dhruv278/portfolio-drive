'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { roadT } from '@/lib/scroll'
import { T_END, T_STOPS } from '@/content/route'
import { useDrive } from '@/store/drive'

// Browsers deliver scroll in steps. The drive state is damped toward the scroll target every frame,
// time-based so it feels the same at 60 and 144 Hz. One DriveClock advances it before anything reads it.
const drive = { s: 0, t: 0, targetS: 0, targetT: 0, reduced: false, primed: false }
const RESPONSE = 7 // higher is snappier, lower is floatier
const EPS_T = 1e-5
const EPS_S = 1e-4

// Returns true when the eased state has caught up with the scroll target.
export function stepDrive(delta: number): boolean {
  const { scroll, zones, reducedMotion } = useDrive.getState()
  drive.targetS = scroll
  drive.targetT = zones.length ? roadT(scroll, zones, T_STOPS, T_END) : 0
  drive.reduced = reducedMotion
  if (!drive.primed || reducedMotion) {
    drive.s = drive.targetS
    drive.t = drive.targetT
    drive.primed = true
    return true
  }
  const k = 1 - Math.exp(-Math.min(delta, 0.1) * RESPONSE)
  drive.s += (drive.targetS - drive.s) * k
  drive.t += (drive.targetT - drive.t) * k
  const doneT = Math.abs(drive.targetT - drive.t) < EPS_T
  const doneS = Math.abs(drive.targetS - drive.s) < EPS_S
  if (doneT) drive.t = drive.targetT
  if (doneS) drive.s = drive.targetS
  return doneT && doneS
}

// Smoothed drive state for this frame. Call inside useFrame.
export function readRoadT(): { s: number; t: number; reduced: boolean } {
  return { s: drive.s, t: drive.t, reduced: drive.reduced }
}

// Mount once inside the Canvas. The canvas renders on demand: any store change (a scroll step)
// requests a frame, and the clock keeps requesting frames until the eased state has caught up.
// When nothing moves, nothing renders, and the GPU idles.
export function DriveClock() {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => useDrive.subscribe(() => invalidate()), [invalidate])
  useFrame((_, delta) => {
    const settled = stepDrive(delta)
    if (!settled) invalidate()
  }, -10)
  return null
}

// Keeps the world alive (clouds, birds, water, windmills) at a modest rate while the visitor is
// present: tab visible, some interaction in the last while, and no reduced-motion preference.
// After that it sleeps and the canvas stops rendering until the next scroll or pointer move.
export function IdleLoop({ fps = 24, sleepAfterMs = 25_000 }: { fps?: number; sleepAfterMs?: number }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let last = performance.now()
    const bump = () => {
      last = performance.now()
    }
    const events = ['scroll', 'pointermove', 'pointerdown', 'keydown', 'touchstart', 'wheel'] as const
    events.forEach((e) => addEventListener(e, bump, { passive: true }))
    const id = setInterval(() => {
      if (document.visibilityState === 'visible' && performance.now() - last < sleepAfterMs) invalidate()
    }, 1000 / fps)
    return () => {
      clearInterval(id)
      events.forEach((e) => removeEventListener(e, bump))
    }
  }, [invalidate, fps, sleepAfterMs])
  return null
}

export function useIsMobile(): boolean {
  return useThree((s) => s.size.width) < 720
}
