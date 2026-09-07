'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useRef } from 'react'
import { Color, DirectionalLight, Fog, HemisphereLight, Vector3 } from 'three'
import { DUSK_SPAN, DUSK_START } from '@/content/route'
import { Car } from './Car'
import { ChaseCamera } from './ChaseCamera'
import { Billboards, Hills, Pier, PierPosts, Water } from './Extras'
import { Road } from './Road'
import { roadCurve } from './roadCurve'
import { Scenery } from './Scenery'
import { DriveClock, readRoadT, useIsMobile } from './useDriveFrame'

const SKY_DAY = new Color('#DCEAF4')
const SKY_DUSK = new Color('#F3D9C4')
const FOG_DAY = new Color('#E6EDF1')
const FOG_DUSK = new Color('#F4E0CE')
const carPos = new Vector3() // module-level scratch, never handed to React

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
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={200}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-bias={-0.0006}
        shadow-normalBias={0.02}
      />
    </>
  )
}

function World() {
  const mobile = useIsMobile()
  return (
    <>
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
      </Suspense>
      <Scenery />
    </>
  )
}

export function Scene() {
  const mobile = typeof window !== 'undefined' && window.innerWidth < 720
  return (
    <div className="scene-root" aria-hidden="true" data-testid="scene">
      <Canvas
        dpr={[1, mobile ? 1.25 : 1.75]}
        shadows={!mobile}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ fov: mobile ? 54 : 36, near: 0.1, far: 500, position: [0, 8, 14] }}
      >
        <World />
      </Canvas>
    </div>
  )
}
