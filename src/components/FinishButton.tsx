'use client'

import Link from 'next/link'
import { useSeen3d } from '@/components/ViewSwitch'
import { track } from '@/content/track'

// The big button at the end of the 2D page. It beats until the visitor has seen the drive once, the
// same rule as the 3D side of the switch.
export function FinishButton() {
  const seen = useSeen3d()
  return (
    <Link className={`tp-btn primary big${seen ? '' : ' pulse'}`} href="/drive" prefetch={false}>
      {track.finish.button}
    </Link>
  )
}
