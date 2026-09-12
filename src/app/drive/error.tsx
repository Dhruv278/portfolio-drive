'use client'

import { Fallback } from '@/components/scene/Fallback'
import { Stops } from '@/components/stops/Stops'
import { ViewSwitch } from '@/components/ViewSwitch'
import { identity } from '@/content/profile'

// If anything in the drive throws, the visitor still gets the content and a way out. Without this
// file Next would replace the whole page with its generic error screen.
export default function DriveError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="drive">
      <div className="hud top">
        <span className="wordmark">{identity.name}</span>
        <div className="actions">
          <ViewSwitch current="3d" />
          <button type="button" className="btn primary" onClick={reset}>
            Try the drive again
          </button>
        </div>
      </div>
      <Fallback />
      <Stops />
    </div>
  )
}
