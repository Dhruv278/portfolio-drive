'use client'

import { useProgress } from '@react-three/drei'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { writeView } from '@/lib/view'
import { useDrive } from '@/store/drive'

// The loading screen for the drive. Two phases: the models, textures and sky downloading (drei's
// progress), then the warm-up in Scene.tsx that compiles every shader before the first frame. The
// bar runs to 80 percent on downloads, creeps toward 95 during the warm-up, fills at ready, and the
// screen fades out. Shown only when a scene is really coming: not without WebGL, not with ?scene=off.
const WARMUP_CREEP_PER_SECOND = 2.5

export function DriveLoader() {
  const webglOk = useDrive((s) => s.webglOk)
  const ready = useDrive((s) => s.sceneReady)
  const { active, progress, loaded, total } = useProgress()
  const downloaded = !active && progress >= 100
  const [gone, setGone] = useState(false)
  const [warmSeconds, setWarmSeconds] = useState(0)

  // Unmount a moment after ready, once the fade has played.
  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => setGone(true), 750)
    return () => clearTimeout(t)
  }, [ready])

  // While the shaders compile there is no progress event, so the bar creeps on a timer.
  useEffect(() => {
    if (!downloaded || ready) return
    const t = setInterval(() => setWarmSeconds((s) => s + 0.25), 250)
    return () => clearInterval(t)
  }, [downloaded, ready])

  if (webglOk !== true || gone) return null

  const pct = ready ? 100 : downloaded ? Math.min(95, 80 + warmSeconds * WARMUP_CREEP_PER_SECOND) : Math.min(80, progress * 0.8)
  const phase = ready ? 'Ready' : downloaded ? 'Warming up the road and the lights' : `Loading assets, ${loaded} of ${Math.max(total, loaded)}`
  const carX = 24 + (312 * pct) / 100

  return (
    <div className={`loader${ready ? ' done' : ''}`} aria-busy={!ready} data-testid="drive-loader">
      <div className="loader-box">
        <svg className="loader-road" viewBox="0 0 360 70" aria-hidden="true">
          <path className="tp-kerb" d="M-10,40 C90,40 120,28 180,28 S270,44 370,44" />
          <path className="tp-road" d="M-10,40 C90,40 120,28 180,28 S270,44 370,44" />
          <path className="tp-dash" d="M-10,40 C90,40 120,28 180,28 S270,44 370,44" />
          <g className="tp-car" transform={`translate(${carX.toFixed(1)},${(40 - 12 * Math.sin((pct / 100) * Math.PI)).toFixed(1)}) rotate(90) scale(0.55)`}>
            <polygon className="beam" points="-26,-150 26,-150 9,-22 -9,-22" />
            <rect className="tyre" x="-15" y="-18" width="6" height="12" rx="2" />
            <rect className="tyre" x="9" y="-18" width="6" height="12" rx="2" />
            <rect className="tyre" x="-15" y="8" width="6" height="12" rx="2" />
            <rect className="tyre" x="9" y="8" width="6" height="12" rx="2" />
            <rect className="body" x="-13" y="-24" width="26" height="48" rx="7" />
            <rect className="roof" x="-9" y="-6" width="18" height="18" rx="3" />
            <rect className="glass" x="-9" y="-13" width="18" height="6" rx="2" />
            <circle className="lamp" cx="-8" cy="-22" r="2.4" />
            <circle className="lamp" cx="8" cy="-22" r="2.4" />
            <rect className="tail" x="-11" y="21" width="6" height="2.5" />
            <rect className="tail" x="5" y="21" width="6" height="2.5" />
          </g>
        </svg>
        <h2>Loading the drive</h2>
        <p className="loader-phase" role="status" data-testid="drive-loader-phase">
          {phase}
        </p>
        <div className="loader-bar" aria-hidden="true">
          <i style={{ width: `${pct.toFixed(0)}%` }} />
        </div>
        <p className="loader-pct" aria-hidden="true">
          {pct.toFixed(0)}%
        </p>
        <Link className="loader-skip" href="/" onClick={() => writeView('2d')}>
          Skip to the 2D page
        </Link>
      </div>
    </div>
  )
}
