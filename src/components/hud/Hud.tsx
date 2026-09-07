'use client'

import Link from 'next/link'
import { identity, stops } from '@/content/profile'
import { useScrollProgress } from '@/hooks/useScrollProgress'
import { useDrive } from '@/store/drive'

export function Hud() {
  useScrollProgress()
  const scroll = useDrive((s) => s.scroll)
  const stopIndex = useDrive((s) => s.stopIndex)
  const stop = stops[stopIndex]

  return (
    <>
      <div className="hud top">
        <a className="wordmark" href="#content">
          {identity.name}
        </a>
        <div className="actions">
          <Link className="btn" href="/resume">
            Resume
          </Link>
          <a className="btn primary" href={identity.resumePdf} download>
            PDF
          </a>
        </div>
      </div>
      <div className="hud bottom">
        <div className="odometer" aria-live="polite" data-testid="odometer">
          <b>
            Stop {stopIndex + 1} of {stops.length}, {stop.name}
          </b>
          <div className="track" aria-hidden="true">
            <i style={{ width: `${(scroll * 100).toFixed(1)}%` }} />
          </div>
        </div>
        <div className={`hint${scroll > 0.02 ? ' gone' : ''}`} aria-hidden={scroll > 0.02}>
          Scroll to drive
        </div>
      </div>
    </>
  )
}
