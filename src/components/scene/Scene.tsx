'use client'

import { PerformanceMonitor, Preload, useGLTF, useProgress } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useRef, useState } from 'react'
import { Color, DirectionalLight, Fog, HemisphereLight, Vector3 } from 'three'
import { DUSK_SPAN, DUSK_START, usedModels } from '@/content/route'
import { Car } from './Car'
import { ChaseCamera } from './ChaseCamera'
import { DebugStats } from './DebugStats'
import { Billboards, Hills, Pier, PierPosts, Water } from './Extras'
import { Road } from './Road'
import { roadCurve } from './roadCurve'
import { Scenery } from './Scenery'
import { DriveClock, readRoadT, useIsMobile } from './useDriveFrame'

// Start every model download the moment the scene bundle arrives, not when each item first renders.
for (const m of usedModels()) useGLTF.preload(`/models/${m}.glb`)

const SKY_DAY = new Color('#DCEAF4')
const SKY_DUSK = new Color('#F3D9C4')
const FOG_DAY = new Color('#E6EDF1')
const FOG_DUSK = new Color('#F4E0CE')
const carPos = new Vector3() // module-level scratch, never handed to React

// Render resolution: start moderate, step down if the frame rate sags, step back up when it recovers.
const DPR_HIGH_DESKTOP = 1.5
const DPR_HIGH_PHONE = 1.25
const DPR_LOW = 1

function Atmosphere({ mobile }: { mobile: boolean }) {
  const bg = useRef<Color>(null)
  const fog = useRef<Fog>(null)
  const sun = useRef<DirectionalLight>(null)
  const hemi = useRef<HemisphereLight>(null)

  useFrame(() => {
    const { t } = readRoadT()
    const dusk = Math.min(1, Math.max(0, (t - DUSK_START) / DUSK_SPAN))
    if (bg.current) bg.current.copy(SKY_DAY).lerp(SKY_DUSK, dusk)
    if (fog.current) fog.current.color.copy(FOG_DAY).lerp(FOG_DUSK, dusk)
    if (sun.current) {
      sun.current.intensity = 2.2 - dusk * 0.9
      roadCurve().getPointAt(t, carPos)
      sun.current.position.set(carPos.x + 30, 50, carPos.z + 20)
      sun.current.target.position.copy(carPos)
      sun.current.target.updateMatrixWorld()
    }
    if (hemi.current) hemi.current.intensity = 1.05 - dusk * 0.25
  })

  return (
    <>
      <color ref={bg} attach="background" args={['#DCEAF4']} />
      <fog ref={fog} attach="fog" args={['#E6EDF1', 50, 170]} />
      <hemisphereLight ref={hemi} args={['#E8F1F8', '#FFFDF8', 1.05]} />
      <directionalLight
        ref={sun}
        position={[30, 50, 20]}
        intensity={2.2}
        color="#FFF6E8"
        castShadow={!mobile}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={200}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-bias={-0.0006}
        shadow-normalBias={0.03}
      />
    </>
  )
}

function World({ onDecline, onIncline, stats }: { onDecline: () => void; onIncline: () => void; stats: boolean }) {
  const mobile = useIsMobile()
  return (
    <>
      {stats && <DebugStats />}
      <PerformanceMonitor onDecline={onDecline} onIncline={onIncline} flipflops={3} />
      <DriveClock />
      <Atmosphere mobile={mobile} />
      <ChaseCamera />
      <Road />
      <Water />
      <Hills />
      <PierPosts />
      <Pier />
      <Billboards />
      <Suspense fallback={null}>
        <Car />
        <Scenery />
        {/* Upload textures and compile shaders before the first visible frame, so nothing stutters in. */}
        <Preload all />
      </Suspense>
    </>
  )
}

export function Scene() {
  const mobile = typeof window !== 'undefined' && window.innerWidth < 720
  const stats = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('stats') === '1'
  const high = mobile ? DPR_HIGH_PHONE : DPR_HIGH_DESKTOP
  const [dpr, setDpr] = useState(high)
  const { active, progress } = useProgress()
  // Fade the canvas in once every model has arrived, and stay ready afterwards even if the
  // loader reports new activity later. Derived state latched during render, no effect needed.
  const done = !active && progress >= 100
  const [latched, setLatched] = useState(done)
  if (done && !latched) setLatched(true)
  const ready = latched || done

  return (
    <div className={`scene-root${ready ? ' ready' : ''}`} aria-hidden="true" data-testid="scene" data-ready={ready}>
      <Canvas
        dpr={dpr}
        shadows={mobile ? false : 'percentage'}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ fov: mobile ? 54 : 36, near: 0.1, far: 400, position: [0, 8, 14] }}
      >
        <World onDecline={() => setDpr(DPR_LOW)} onIncline={() => setDpr(high)} stats={stats} />
      </Canvas>
    </div>
  )
}
