import { create } from 'zustand'
import type { Zone } from '@/lib/scroll'

export type DriveState = {
  scroll: number // 0 to 1, page scroll fraction
  stopIndex: number // 0 to 5
  zones: Zone[]
  reducedMotion: boolean
  webglOk: boolean | null // null until probed
  intro: 'idle' | 'playing' | 'done' | 'skipped'
  setScroll: (scroll: number, stopIndex: number) => void
  setZones: (zones: Zone[]) => void
  setReducedMotion: (v: boolean) => void
  setWebglOk: (v: boolean) => void
  setIntro: (v: DriveState['intro']) => void
}

export const useDrive = create<DriveState>((set) => ({
  scroll: 0,
  stopIndex: 0,
  zones: [],
  reducedMotion: false,
  webglOk: null,
  intro: 'idle',
  setScroll: (scroll, stopIndex) => set((s) => (s.scroll === scroll && s.stopIndex === stopIndex ? s : { scroll, stopIndex })),
  setZones: (zones) => set({ zones }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setWebglOk: (webglOk) => set({ webglOk }),
  setIntro: (intro) => set((s) => (s.intro === intro ? s : { intro })),
}))
