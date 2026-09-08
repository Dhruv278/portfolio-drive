'use client'

import { useGLTF, useProgress } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useRef, useState } from 'react'
import { Color, DirectionalLight, EquirectangularReflectionMapping, Fog, HemisphereLight, NeutralToneMapping, PMREMGenerator, Vector3 } from 'three'
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js'
import { DUSK_SPAN, DUSK_START, usedModels } from '@/content/route'
import { Car } from './Car'
import { ChaseCamera } from './ChaseCamera'
import { DebugStats } from './DebugStats'
import { Effects } from './Effects'
import { Billboards, Hills, Pier, PierPosts } from './Extras'
import { Birds, Clouds, Water } from './Living'
import { Road } from './Road'
import { roadCurve } from './roadCurve'
import { Scenery } from './Scenery'
import { flags } from '@/lib/flags'
import { gpuInfo } from '@/lib/gpu'
import { MOBILE_QUERY } from '@/lib/layout'
import { DriveClock, IdleLoop, readRoadT, useIsMobile } from './useDriveFrame'

// Start every model download the moment the scene bundle arrives, not when each item first renders.
for (const m of usedModels()) useGLTF.preload(`/models/${m}.glb`)

const SKY_DAY = new Color('#DCEAF4')
const SKY_DUSK = new Color('#F3D9C4')
// Fog meets the photographic sky at the horizon, so it carries the sky's haze.
const FOG_DAY = new Color('#D9E4EC')
const FOG_DUSK = new Color('#EBD3BE')
// The sky photo is the visible background; dusk dims and warms it through uniforms only.
const SKY_INTENSITY_DAY = 1
const SKY_INTENSITY_DUSK = 0.72
const carPos = new Vector3() // module-level scratch, never handed to React
// Sky light from the HDRI on PBR surfaces, eased down at dusk. Only uniforms change.
const ENV_DAY = 0.7
const ENV_DUSK = 0.35
const HDRI = '/hdri/autumn_field_1k.hdr'

// Render resolution, capped below the device ratio. Integrated GPUs pay per pixel.
const DPR_DESKTOP = 1.25
const DPR_PHONE = 1.25
// If the warm-up takes longer than this after the models arrive, fade in anyway.
const COMPILE_TIMEOUT_MS = 8000

function Atmosphere({ mobile }: { mobile: boolean }) {
  const bg = useRef<Color>(null)
  const fog = useRef<Fog>(null)
  const sun = useRef<DirectionalLight>(null)
  const hemi = useRef<HemisphereLight>(null)

  useFrame((state) => {
    const { t } = readRoadT()
    const dusk = Math.min(1, Math.max(0, (t - DUSK_START) / DUSK_SPAN))
    state.scene.environmentIntensity = ENV_DAY + (ENV_DUSK - ENV_DAY) * dusk
    state.scene.backgroundIntensity = SKY_INTENSITY_DAY + (SKY_INTENSITY_DUSK - SKY_INTENSITY_DAY) * dusk
    if (bg.current) bg.current.copy(SKY_DAY).lerp(SKY_DUSK, dusk)
    if (fog.current) fog.current.color.copy(FOG_DAY).lerp(FOG_DUSK, dusk)
    if (sun.current) {
      sun.current.intensity = 2.2 - dusk * 0.9
      roadCurve().getPointAt(t, carPos)
      sun.current.position.set(carPos.x + 30, 50, carPos.z + 20)
      sun.current.target.position.copy(carPos)
      sun.current.target.updateMatrixWorld()
    }
    if (hemi.current) hemi.current.intensity = 0.75 - dusk * 0.2
  })

  return (
    <>
      {/* Drawn sky colour until the sky photo arrives, and for good if it never does. */}
      <color ref={bg} attach="background" args={['#DCEAF4']} />
      <fog ref={fog} attach="fog" args={['#D9E4EC', 50, 170]} />
      <hemisphereLight ref={hemi} args={['#E8F1F8', '#FFFDF8', 0.75]} />
      <directionalLight
        ref={sun}
        position={[30, 50, 20]}
        intensity={2.2}
        color="#FFF6E8"
        castShadow={!mobile}
        shadow-mapSize={mobile ? [1024, 1024] : [1536, 1536]}
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

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()))

// Warm-up, run once every model has arrived and while the canvas is still faded out:
// 1. decode the sky HDR and prefilter it into the environment map, each in its own frame,
// 2. compile every shader with the environment present (KHR_parallel_shader_compile where available),
// 3. render one frame so the post-processing passes compile too,
// then report ready. Doing all of this in one frame lost the WebGL context on Intel graphics, and
// letting the environment arrive after compilation recompiled every PBR material mid-drive.
function CompileWhenLoaded({ onReady }: { onReady: () => void }) {
  const get = useThree((s) => s.get)
  const started = useRef(false)

  // Loader progress is read through a subscription, not a hook: the loading manager reports from
  // inside other components' renders, and a hook here would turn that into a setState-in-render.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let done = false
    const finish = () => {
      if (done) return
      done = true
      get().invalidate()
      onReady()
    }
    const run = async () => {
      const { gl, scene, camera, advance } = get()
      // Let React commit the last resolved models before touching the graph.
      await nextFrame()
      if (flags.env) {
        try {
          const hdr = await new HDRLoader().loadAsync(HDRI)
          hdr.mapping = EquirectangularReflectionMapping
          await nextFrame()
          const pmrem = new PMREMGenerator(gl)
          pmrem.compileEquirectangularShader()
          await nextFrame()
          const env = pmrem.fromEquirectangular(hdr).texture
          pmrem.dispose()
          scene.environment = env
          // The same photo, unblurred, is the visible sky. Fog hides the seam with the ground plane.
          scene.background = hdr
          scene.backgroundIntensity = SKY_INTENSITY_DAY
          await nextFrame()
        } catch {
          // No sky light. The scene still renders under the sun and hemisphere lights.
        }
      }
      await gl.compileAsync(scene, camera)
      await nextFrame()
      advance(performance.now())
    }
    const check = () => {
      const { active, progress } = useProgress.getState()
      if (started.current || active || progress < 100) return
      started.current = true
      timer = setTimeout(finish, COMPILE_TIMEOUT_MS)
      run().then(finish, finish)
    }
    const unsubscribe = useProgress.subscribe(check)
    check()
    return () => {
      unsubscribe()
      clearTimeout(timer)
    }
  }, [get, onReady])

  return null
}

function World({ stats, fx, onReady }: { stats: boolean; fx: boolean; onReady: () => void }) {
  const mobile = useIsMobile()
  return (
    <>
      {stats && <DebugStats />}
      <DriveClock />
      <IdleLoop />
      <Atmosphere mobile={mobile} />
      <ChaseCamera />
      <Birds />
      <Hills />
      <PierPosts />
      <Pier />
      <Billboards />
      <Suspense fallback={null}>
        <Road />
        <Water />
        {flags.clouds && <Clouds />}
        <Car />
        <Scenery />
      </Suspense>
      {fx && <Effects />}
      <CompileWhenLoaded onReady={onReady} />
    </>
  )
}

// Client only (SceneMount renders this with ssr: false), so window is available at render.
export function Scene() {
  const [mobile, setMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches)
  const stats = flags.stats
  // Post-processing is desktop only and skipped on integrated graphics unless forced with ?fx=1.
  const fx = !mobile && (flags.fx ?? !gpuInfo.lowEnd)
  const dpr = Math.min(window.devicePixelRatio, mobile ? DPR_PHONE : DPR_DESKTOP)
  const [ready, setReady] = useState(false)

  // Rotating a phone crosses the layout query. Shadows, resolution and field of view are fixed at
  // Canvas creation, so the Canvas remounts with a new key instead of running with stale settings.
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY)
    const onChange = () => setMobile(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return (
    <div className={`scene-root${ready ? ' ready' : ''}`} aria-hidden="true" data-testid="scene" data-ready={ready}>
      <Canvas
        key={mobile ? 'phone' : 'desktop'}
        frameloop="demand"
        dpr={dpr}
        shadows={mobile ? false : 'percentage'}
        gl={{ antialias: !fx, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          // Set once, before any material compiles. Neutral keeps the cobalt hue where ACES drifts it.
          gl.toneMapping = NeutralToneMapping
        }}
        camera={{ fov: mobile ? 54 : 36, near: 0.1, far: 400, position: [0, 8, 14] }}
      >
        <World stats={stats} fx={fx} onReady={() => setReady(true)} />
      </Canvas>
    </div>
  )
}
