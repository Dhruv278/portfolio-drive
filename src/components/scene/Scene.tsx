'use client'

import { useGLTF, useProgress } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useRef, useState } from 'react'
import { DataTexture, DirectionalLight, EquirectangularReflectionMapping, HalfFloatType, type Mesh, type MeshStandardMaterial, NeutralToneMapping, PMREMGenerator, RGBAFormat, type Texture, Vector3 } from 'three'
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js'
import { usedModels } from '@/content/route'
import { Car } from './Car'
import { ChaseCamera } from './ChaseCamera'
import { DebugStats } from './DebugStats'
import { Effects } from './Effects'
import { flushPaints, PaintPump, pendingPaints } from './paint'
import { Billboards, Hills, Pier, PierPosts } from './Extras'
import { Garage } from './pieces/Garage'
import { MedChron } from './pieces/MedChron'
import { Birds, Clouds, Water } from './Living'
import { Night, NIGHT } from './Night'
import { Road } from './Road'
import { roadCurve } from './roadCurve'
import { Scenery } from './Scenery'
import { flags } from '@/lib/flags'
import { gpuInfo } from '@/lib/gpu'
import { MOBILE_QUERY } from '@/lib/layout'
import { useDrive } from '@/store/drive'
import { DriveClock, IdleLoop, openRenderGate, readRoadT, startIntro, useIsMobile } from './useDriveFrame'

// Start every model download the moment the scene bundle arrives, not when each item first renders.
for (const m of usedModels()) useGLTF.preload(`/models/${m}.glb`)

const carPos = new Vector3() // module-level scratch, never handed to React
// Night. The sky photo is no longer visible; it only feeds reflections, at low strength. The sky
// itself is the gradient dome in Night.tsx, in the page's navy.
const ENV_NIGHT = 0.22
const HDRI = '/hdri/autumn_field_1k.hdr'

// Render resolution, capped below the device ratio. Integrated GPUs pay per pixel.
const DPR_DESKTOP = 1.25
const DPR_PHONE = 1.25
// If the warm-up takes longer than this after the models arrive, fade in anyway.
const COMPILE_TIMEOUT_MS = 8000

function Atmosphere({ mobile }: { mobile: boolean }) {
  const moon = useRef<DirectionalLight>(null)

  // The moon follows the car so its shadow map always covers the scene around it.
  useFrame(() => {
    const m = moon.current
    if (!m) return
    const { t } = readRoadT()
    roadCurve().getPointAt(t, carPos)
    m.position.set(carPos.x - 26, 46, carPos.z + 24)
    m.target.position.copy(carPos)
    m.target.updateMatrixWorld()
  })

  return (
    <>
      <color attach="background" args={[NIGHT.zenith]} />
      <fog attach="fog" args={[NIGHT.fog, 45, 165]} />
      <hemisphereLight args={[NIGHT.skyLight, NIGHT.groundLight, 0.6]} />
      <directionalLight
        ref={moon}
        position={[-26, 46, 24]}
        intensity={1.05}
        color={NIGHT.moon}
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

// Meshes that share a shader program. The first draw with a program is what stalls on ANGLE, so the
// warm-up reveals one such group at a time, not one material object (there are two hundred).
function programKey(m: Mesh): string {
  const mat = (Array.isArray(m.material) ? m.material[0] : m.material) as MeshStandardMaterial
  const has = (t: Texture | null | undefined) => (t ? 1 : 0)
  return [
    mat.type,
    has(mat.map),
    has(mat.normalMap),
    has(mat.roughnessMap),
    has(mat.metalnessMap),
    has(mat.emissiveMap),
    mat.transparent ? 1 : 0,
    mat.side,
    mat.flatShading ? 1 : 0,
    mat.vertexColors ? 1 : 0,
    mat.fog === false ? 0 : 1,
    (m as unknown as { isInstancedMesh?: boolean }).isInstancedMesh ? 1 : 0,
    m.receiveShadow ? 1 : 0,
  ].join('|')
}

// Every texture a material samples, plus the sky.
function texturesOf(mat: MeshStandardMaterial): Texture[] {
  return [mat.map, mat.normalMap, mat.roughnessMap, mat.metalnessMap, mat.emissiveMap, mat.alphaMap].filter((t): t is Texture => !!t)
}

// Warm-up, run once every model has arrived and while the canvas is still faded out:
// 1. decode the sky HDR and prefilter it into the environment map, each in its own frame,
// 2. compile every shader with the environment present (KHR_parallel_shader_compile where available),
// 3. draw the scene one material at a time: on ANGLE the first draw with each program still compiles
//    driver-side variants, and drawing everything at once measured a 1.5 s frame, long enough for
//    Windows to reset the GPU and lose the context,
// 4. render one full frame so the post-processing passes compile too,
// then report ready. Letting the environment arrive after compilation recompiled every PBR material
// mid-drive, so it is created here, before step 2.
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
      const store = useDrive.getState()
      openRenderGate()
      // Play the intro once, only if the visitor has not scrolled yet and does not prefer reduced motion.
      if (flags.intro && !store.reducedMotion && store.scroll <= 0.002) {
        startIntro(performance.now())
        store.setIntro('playing')
      } else {
        store.setIntro('skipped')
      }
      get().invalidate()
      onReady()
    }
    // Step timings, readable as window.__warmup with ?stats=1, to find any step long enough to
    // trip the GPU watchdog.
    const marks: { step: string; ms: number; at: number }[] = []
    let markAt = performance.now()
    const mark = (step: string) => {
      const now = performance.now()
      marks.push({ step, ms: Math.round(now - markAt), at: Math.round(now) })
      markAt = now
      if (flags.stats) (window as unknown as { __warmup?: typeof marks }).__warmup = marks
    }
    const run = async () => {
      const { gl, scene, camera, advance } = get()
      // React commits the loaded models a while after the loaders report done, the scenery last.
      // Wait until every placement is in the scene and the mesh count has held still for four frames
      // (up to four seconds), so the warm-up sees the whole scene.
      let stable = 0
      let lastCount = -1
      const waitStart = performance.now()
      while (performance.now() - waitStart < 4000) {
        await nextFrame()
        const scenery = scene.getObjectByName('scenery')
        const sceneryReady = !!scenery && scenery.children.length >= (scenery.userData.expected as number)
        let count = 0
        scene.traverse((o) => {
          if ((o as Mesh).isMesh) count++
        })
        stable = count === lastCount ? stable + 1 : 0
        lastCount = count
        if (sceneryReady && stable >= 4) break
      }
      mark(`commit (${lastCount} meshes)`)
      // Paint the queued canvases, one per frame.
      let painted = 0
      let longestPaint = 0
      while (pendingPaints()) {
        const t0 = performance.now()
        flushPaints(1)
        longestPaint = Math.max(longestPaint, performance.now() - t0)
        painted++
        await nextFrame()
      }
      mark(`paint (${painted} canvases, longest ${Math.round(longestPaint)} ms)`)
      if (flags.env) {
        try {
          const hdr = await new HDRLoader().loadAsync(HDRI)
          hdr.mapping = EquirectangularReflectionMapping
          mark('hdr decode')
          await nextFrame()
          const pmrem = new PMREMGenerator(gl)
          pmrem.compileEquirectangularShader()
          mark('pmrem equirect shader')
          await nextFrame()
          // A 4 by 2 texture through the prefilter compiles the blur shaders in their own frame, so the
          // real prefilter below is passes only.
          const tiny = new DataTexture(new Uint16Array(4 * 2 * 4).fill(0x3c00), 4, 2, RGBAFormat, HalfFloatType)
          tiny.mapping = EquirectangularReflectionMapping
          tiny.needsUpdate = true
          pmrem.fromEquirectangular(tiny).dispose()
          tiny.dispose()
          mark('pmrem blur shaders')
          await nextFrame()
          const env = pmrem.fromEquirectangular(hdr).texture
          pmrem.dispose()
          mark('pmrem')
          scene.environment = env
          scene.environmentIntensity = ENV_NIGHT
          hdr.dispose()
          await nextFrame()
        } catch {
          // No sky light. The scene still renders under the sun and hemisphere lights.
        }
      }
      await gl.compileAsync(scene, camera)
      mark('compile')
      await nextFrame()
      // Upload textures ahead of the draws, two per frame. A large mipmapped upload inside a draw
      // frame is another way to make that frame long.
      const textures = new Set<Texture>()
      const groups = new Map<string, Mesh[]>()
      scene.traverse((o) => {
        const m = o as Mesh
        if (!m.isMesh || !m.visible) return
        const mats = Array.isArray(m.material) ? m.material : [m.material]
        mats.forEach((mat) => texturesOf(mat as MeshStandardMaterial).forEach((t) => textures.add(t)))
        const key = programKey(m)
        const list = groups.get(key) ?? []
        list.push(m)
        groups.set(key, list)
      })
      if (scene.background && (scene.background as Texture).isTexture) textures.add(scene.background as Texture)
      let i = 0
      let longest = 0
      for (const t of textures) {
        const t0 = performance.now()
        gl.initTexture(t)
        longest = Math.max(longest, performance.now() - t0)
        if (++i % 2 === 0) await nextFrame()
      }
      mark(`textures (${textures.size}, longest ${Math.round(longest)} ms)`)
      await nextFrame()
      // Reveal the scene one program group per frame. Only meshes visible now take part; the rest
      // (exhaust puffs) are managed by their own frame loops and stay untouched.
      const all = [...groups.values()].flat()
      all.forEach((m) => (m.visible = false))
      longest = 0
      for (const group of groups.values()) {
        group.forEach((m) => (m.visible = true))
        const t0 = performance.now()
        advance(performance.now())
        longest = Math.max(longest, performance.now() - t0)
        await nextFrame()
      }
      mark(`first draws (${groups.size} programs, longest ${Math.round(longest)} ms)`)
      advance(performance.now())
      mark('full frame')
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
      <PaintPump />
      <DriveClock />
      <IdleLoop />
      <Atmosphere mobile={mobile} />
      <Night />
      <ChaseCamera />
      <Birds />
      <Hills />
      <PierPosts />
      <Pier />
      <Billboards />
      <Suspense fallback={null}>
        <Road />
        {flags.garage && <Garage />}
        {flags.medchron && <MedChron />}
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
  const intro = useDrive((s) => s.intro)
  const running = ready

  // Rotating a phone crosses the layout query. Shadows, resolution and field of view are fixed at
  // Canvas creation, so the Canvas remounts with a new key instead of running with stale settings.
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY)
    const onChange = () => setMobile(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return (
    <div className={`scene-root${ready ? ' ready' : ''}`} aria-hidden="true" data-testid="scene" data-ready={ready} data-intro={intro} data-running={running}>
      <Canvas
        key={mobile ? 'phone' : 'desktop'}
        // No frames at all until the warm-up has drawn every material: fiber requests a frame each
        // time the scene graph changes, and one such frame drew the freshly loaded scene with every
        // shader uncompiled, a 1.3 s stall that lost the WebGL context on Intel graphics.
        frameloop={running ? 'demand' : 'never'}
        dpr={dpr}
        shadows={mobile ? false : 'percentage'}
        gl={{ antialias: !fx, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          // Set once, before any material compiles. Neutral keeps the cobalt hue where ACES drifts it.
          gl.toneMapping = NeutralToneMapping
        }}
        camera={{ fov: mobile ? 54 : 36, near: 0.1, far: 400, position: [0, 8, 14] }}
      >
        <World
          stats={stats}
          fx={fx}
          onReady={() => {
            setReady(true)
            useDrive.getState().setSceneReady(true)
          }}
        />
      </Canvas>
    </div>
  )
}
