'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { introPhase } from '@/lib/pieceMath'
import { roadT } from '@/lib/scroll'
import { INTRO_BACK, T_END, T_STOPS } from '@/content/route'
import { isMobileSize } from '@/lib/layout'
import { useDrive } from '@/store/drive'

// Browsers deliver scroll in steps. The drive state is damped toward the scroll target every frame,
// time-based so it feels the same at 60 and 144 Hz. One DriveClock advances it before anything reads it.
const drive = { s: 0, t: 0, targetS: 0, targetT: 0, reduced: false, primed: false }

// Nothing renders on its own until the warm-up in Scene.tsx has compiled and drawn every material.
// Before that, a frame requested by a scroll or the idle loop would draw whatever had loaded and
// compile its shaders on the spot, in one frame, which measured 1.3 s and lost the WebGL context.
const gate = { open: false }
export function openRenderGate() {
  gate.open = true
}
export function closeRenderGate() {
  gate.open = false
}
export function renderGateOpen(): boolean {
  return gate.open
}

// The first-load intro: door, car roll-out, camera swing. Module state read by the camera, the car
// and the garage door inside their frame loops. Ends by time, or at once when the visitor scrolls.
const intro = { active: false, start: 0, door: 0, car: 0, camera: 0, back: 0 }

export function startIntro(now: number) {
  intro.active = true
  intro.start = now
}

export function cancelIntro() {
  if (!intro.active) return
  intro.active = false
  intro.door = intro.car = intro.camera = 1
  intro.back = 0
  useDrive.getState().setIntro('skipped')
}

export function readIntro(): { active: boolean; door: number; car: number; camera: number; back: number } {
  return intro
}
const RESPONSE = 7 // higher is snappier, lower is floatier
const EPS_T = 1e-5
const EPS_S = 1e-4

// Returns true when the eased state has caught up with the scroll target.
export function stepDrive(delta: number, now = performance.now()): boolean {
  const { scroll, zones, reducedMotion } = useDrive.getState()
  drive.targetS = scroll
  drive.targetT = zones.length ? roadT(scroll, zones, T_STOPS, T_END) : T_STOPS[0]
  drive.reduced = reducedMotion
  if (intro.active) {
    const ph = introPhase((now - intro.start) / 1000)
    intro.door = ph.door
    intro.car = ph.car
    intro.camera = ph.camera
    // The car rolls from inside the garage (behind the origin) up to the first stop.
    intro.back = INTRO_BACK * (1 - ph.car)
    drive.s = drive.targetS
    drive.t = T_STOPS[0] * ph.car
    drive.primed = true
    if (ph.done) {
      intro.active = false
      intro.back = 0
      useDrive.getState().setIntro('done')
    }
    return false
  }
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
// Resolution scaling while the car is moving, on integrated and phone GPUs only. Motion hides the
// softer pixels; the frame the car settles on renders at full resolution again. Hysteresis on the
// remaining road distance keeps the ratio from flapping at the end of a scroll.
const MOTION_DPR_SCALE = 0.75
const MOTION_ENTER = 0.004 // road parameter still to travel
const MOTION_EXIT = 0.001

export function DriveClock({ scaleInMotion = false }: { scaleInMotion?: boolean }) {
  const invalidate = useThree((s) => s.invalidate)
  const setDpr = useThree((s) => s.setDpr)
  const baseDpr = useRef(0)
  const lowered = useRef(false)
  useEffect(
    () =>
      useDrive.subscribe((s, prev) => {
        if (s.scroll !== prev.scroll && s.scroll > 0.002) cancelIntro()
        if (gate.open) invalidate()
      }),
    [invalidate],
  )
  useFrame(({ viewport }, delta) => {
    const settled = stepDrive(delta, performance.now())
    if (!settled && gate.open) invalidate()
    if (!scaleInMotion || !gate.open || drive.reduced) return
    if (!baseDpr.current) baseDpr.current = viewport.dpr
    const remaining = Math.abs(drive.targetT - drive.t)
    if (!lowered.current && remaining > MOTION_ENTER) {
      lowered.current = true
      setDpr(baseDpr.current * MOTION_DPR_SCALE)
    } else if (lowered.current && remaining < MOTION_EXIT) {
      lowered.current = false
      setDpr(baseDpr.current)
      invalidate()
    }
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
      if (gate.open && !useDrive.getState().reducedMotion && document.visibilityState === 'visible' && performance.now() - last < sleepAfterMs) invalidate()
    }, 1000 / fps)
    return () => {
      clearInterval(id)
      events.forEach((e) => removeEventListener(e, bump))
    }
  }, [invalidate, fps, sleepAfterMs])
  return null
}

export function useIsMobile(): boolean {
  return useThree((s) => isMobileSize(s.size.width, s.size.height))
}
