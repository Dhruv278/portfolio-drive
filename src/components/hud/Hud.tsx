'use client'

import { useProgress } from '@react-three/drei'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { identity, stops } from '@/content/profile'
import { useScrollProgress } from '@/hooks/useScrollProgress'
import { useDrive } from '@/store/drive'

export function Hud() {
  useScrollProgress()
  const router = useRouter()
  // Escape leaves the drive, like closing a full-screen view.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.push('/')
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [router])
  const scroll = useDrive((s) => s.scroll)
  const stopIndex = useDrive((s) => s.stopIndex)
  const zones = useDrive((s) => s.zones)
  const zone = zones[stopIndex]
  // True while the car is parked at the current stop. Read by the e2e suite.
  const parked = !!zone && scroll >= zone.a && scroll <= zone.b
  const webglOk = useDrive((s) => s.webglOk)
  const { active, progress } = useProgress()
  const stop = stops[stopIndex]
  const loading = webglOk === true && (active || progress < 100)

  return (
    <>
      <div className="hud top">
        <Link className="wordmark" href="/">
          {identity.name}
        </Link>
        <div className="actions">
          <Link className="btn exit" href="/" data-testid="exit-drive">
            <span aria-hidden="true">←</span> Back home
          </Link>
          <Link className="btn" href="/resume">
            Resume
          </Link>
          <a className="btn primary" href={identity.resumePdf} download>
            PDF
          </a>
        </div>
      </div>
      <div className="hud bottom">
        <div className="odometer" aria-live="polite" data-testid="odometer" data-stop={stopIndex} data-parked={parked ? 'true' : 'false'}>
          <b>
            Stop {stopIndex + 1} of {stops.length}
            <span className="stopname">, {stop.name}</span>
          </b>
          <div className="track" aria-hidden="true">
            <i style={{ width: `${(scroll * 100).toFixed(1)}%` }} />
          </div>
          <div className="loadstatus" data-testid="loadstatus">
            {loading ? `Loading the drive, ${Math.round(progress)}%` : ''}
          </div>
        </div>
        <div className={`hint${scroll > 0.02 ? ' gone' : ''}`} aria-hidden={scroll > 0.02}>
          Scroll to drive
        </div>
      </div>
    </>
  )
}
