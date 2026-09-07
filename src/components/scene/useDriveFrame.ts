'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { roadT } from '@/lib/scroll'
import { T_END, T_STOPS } from '@/content/route'
import { useDrive } from '@/store/drive'

// Browsers deliver scroll in steps. The drive state is damped toward the scroll target every frame,
// time-based so it feels the same at 60 and 144 Hz. One DriveClock advances it before anything reads it.
const drive = { s: 0, t: 0, targetS: 0, targetT: 0, reduced: false, primed: false }
const RESPONSE = 7 // higher is snappier, lower is floatier

export function stepDrive(delta: number): void {
  const { scroll, zones, reducedMotion } = useDrive.getState()
  drive.targetS = scroll
  drive.targetT = zones.length ? roadT(scroll, zones, T_STOPS, T_END) : 0
  drive.reduced = reducedMotion
  if (!drive.primed || reducedMotion) {
    drive.s = drive.targetS
    drive.t = drive.targetT
    drive.primed = true
    return
  }
  const k = 1 - Math.exp(-Math.min(delta, 0.1) * RESPONSE)
  drive.s += (drive.targetS - drive.s) * k
  drive.t += (drive.targetT - drive.t) * k
  if (Math.abs(drive.targetT - drive.t) < 1e-5) drive.t = drive.targetT
}

// Smoothed drive state for this frame. Call inside useFrame.
export function readRoadT(): { s: number; t: number; reduced: boolean } {
  return { s: drive.s, t: drive.t, reduced: drive.reduced }
}

// Mount once inside the Canvas. Runs ahead of every other frame callback.
export function DriveClock() {
  useFrame((_, delta) => stepDrive(delta), -10)
  return null
}

export function useIsMobile(): boolean {
  return useThree((s) => s.size.width) < 720
}
