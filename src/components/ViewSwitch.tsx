'use client'

import Link from 'next/link'
import { useSyncExternalStore } from 'react'
import { seen3d, shouldPulse, type View, writeView } from '@/lib/view'

// Whether the drive has been seen, read from storage as an external store: the server snapshot says
// "seen", so the first render never pulses and hydration matches; the client then reads the truth.
const subscribe = (onChange: () => void) => {
  addEventListener('storage', onChange)
  return () => removeEventListener('storage', onChange)
}
const useSeen3d = () => useSyncExternalStore(subscribe, seen3d, () => true)

// The 2D / 3D switch in both top bars. Clicking a side records it as the visitor's view, so the home
// address opens their last view next time (see ViewMemory). On the 2D page the 3D side carries a
// heartbeat glow until the visitor has seen the drive once.
// `current` is omitted on pages that are neither view, such as the resume, where both sides are plain links.
export function ViewSwitch({ current = null, exitTestId }: { current?: View | null; exitTestId?: string }) {
  const pulse = shouldPulse(current, useSeen3d())
  return (
    <nav className="view-switch" aria-label="View">
      <Link href="/" aria-current={current === '2d' ? 'page' : undefined} onClick={() => writeView('2d')} data-testid={exitTestId}>
        2D
      </Link>
      <Link href="/drive" className={pulse ? 'pulse' : undefined} aria-current={current === '3d' ? 'page' : undefined} onClick={() => writeView('3d')} title="Switch to the 3D drive">
        3D
      </Link>
    </nav>
  )
}
