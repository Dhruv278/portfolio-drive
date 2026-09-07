'use client'

import { useGLTF, useProgress } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useRef, useState } from 'react'
import { Color, DirectionalLight, Fog, HemisphereLight, Vector3 } from 'three'
import { DUSK_SPAN, DUSK_START, usedModels } from '@/content/route'
import { Car } from './Car'
import { ChaseCamera } from './ChaseCamera'
import { DebugStats } from './DebugStats'
import { Billboards, Hills, Pier, PierPosts } from './Extras'
import { Birds, Clouds, Water } from './Living'
import { Road } from './Road'
import { roadCurve } from './roadCurve'
import { Scenery } from './Scenery'
import { DriveClock, IdleLoop, readRoadT, useIsMobile } from './useDriveFrame'

// Start every model download the moment the scene bundle arrives, not when each item first renders.
for (const m of usedModels()) useGLTF.preload(`/models/${m}.glb`)

const SKY_DAY = new Color('#DCEAF4')
const SKY_DUSK = new Color('#F3D9C4')
const FOG_DAY = new Color('#E6EDF1')
const FOG_DUSK = new Color('#F4E0CE')
const carPos = new Vector3() // module-level scratch, never handed to React

// Render resolution, capped below the device ratio. Integrated GPUs pay per pixel.
const DPR_DESKTOP = 1.5
const DPR_PHONE = 1.25
// If shader compilation takes longer than this after the models arrive, fade in anyway.
const COMPILE_TIMEOUT_MS = 4000

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

// Once every model has arrived, compile all shaders and upload all textures off the main thread's
// critical path (KHR_parallel_shader_compile where available), then report ready. The synchronous
// alternative froze the page for two seconds on integrated graphics.
function CompileWhenLoaded({ onReady }: { onReady: () => void }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const invalidate = useThree((s) => s.invalidate)
  const { active, progress } = useProgress()
  const started = useRef(false)

  useEffect(() => {
    if (started.current || active || progress < 100) return
    started.current = true
    let done = false
    const finish = () => {
      if (done) return
      done = true
      invalidate()
      onReady()
    }
    const timer = setTimeout(finish, COMPILE_TIMEOUT_MS)
    // Let React commit the last resolved models before compiling the graph.
    const raf = requestAnimationFrame(() => {
      gl.compileAsync(scene, camera).then(finish, finish)
    })
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(raf)
    }
  }, [gl, scene, camera, invalidate, active, progress, onReady])

  return null
}

function World({ stats, onReady }: { stats: boolean; onReady: () => void }) {
  const mobile = useIsMobile()
  return (
    <>
      {stats && <DebugStats />}
      <DriveClock />
      <IdleLoop />
      <Atmosphere mobile={mobile} />
      <ChaseCamera />
      <Road />
      <Water />
      <Clouds />
      <Birds />
      <Hills />
      <PierPosts />
      <Pier />
      <Billboards />
      <Suspense fallback={null}>
        <Car />
        <Scenery />
      </Suspense>
      <CompileWhenLoaded onReady={onReady} />
    </>
  )
}

export function Scene() {
  const mobile = typeof window !== 'undefined' && window.innerWidth < 720
  const stats = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('stats') === '1'
  const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, mobile ? DPR_PHONE : DPR_DESKTOP)
  const [ready, setReady] = useState(false)

  return (
    <div className={`scene-root${ready ? ' ready' : ''}`} aria-hidden="true" data-testid="scene" data-ready={ready}>
      <Canvas
        frameloop="demand"
        dpr={dpr}
        shadows={mobile ? false : 'percentage'}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ fov: mobile ? 54 : 36, near: 0.1, far: 400, position: [0, 8, 14] }}
      >
        <World stats={stats} onReady={() => setReady(true)} />
      </Canvas>
    </div>
  )
}
