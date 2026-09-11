'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { probeGpu } from '@/lib/gpu'
import { MOBILE_QUERY } from '@/lib/layout'
import { markRedirected, readView, redirectedThisSession, shouldOpenDrive, type View, writeView } from '@/lib/view'

// Remembers which view the visitor used last. The drive records itself. The home page opens the
// drive instead when that was the last view, once per session, on a desktop with WebGL 2; otherwise
// it records itself as the view. Phones always land on the 2D page.
export function ViewMemory({ view }: { view: View }) {
  const router = useRouter()
  useEffect(() => {
    if (view === '3d') {
      writeView('3d')
      return
    }
    const phone = matchMedia(MOBILE_QUERY).matches
    if (shouldOpenDrive(readView(), redirectedThisSession(), phone, probeGpu().webgl2)) {
      markRedirected()
      router.replace('/drive')
      return
    }
    writeView('2d')
  }, [view, router])
  return null
}
