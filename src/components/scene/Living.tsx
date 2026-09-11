'use client'

// Things that move on their own: reflective water, drifting sprite clouds, a small flock of birds.
// All are time-based and cheap. They render only while the IdleLoop is awake.
import { Cloud, Clouds as CloudField } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Group, Mesh, MeshLambertMaterial, MeshStandardMaterial, PlaneGeometry, Vector3 } from 'three'
import { WATER } from '@/content/route'
import { COLORS } from './Road'
import { roadCurve } from './roadCurve'
import { useSurfaces } from './surfaces'
import { readRoadT } from './useDriveFrame'

// ---------- water ----------
const WATER_TILE = 9 // metres per repeat of the normal map

function WaterSheet({ x, z, w, d }: { x: number; z: number; w: number; d: number }) {
  const mesh = useRef<Mesh>(null)
  const mat = useRef<MeshStandardMaterial>(null)
  const s = useSurfaces()
  const segs = useMemo(() => [Math.max(8, Math.round(w / 6)), Math.max(8, Math.round(d / 6))] as const, [w, d])
  // Each sheet has its own copy of the normal map so the ripple scale stays in metres.
  const normal = useMemo(() => {
    const t = s.waterNor.clone()
    t.repeat.set(w / WATER_TILE, d / WATER_TILE)
    t.needsUpdate = true
    return t
  }, [s.waterNor, w, d])

  useFrame(({ clock }) => {
    const m = mesh.current
    if (!m) return
    const { reduced } = readRoadT()
    if (reduced) return
    const geo = m.geometry as PlaneGeometry
    const pos = geo.attributes.position
    const t = clock.elapsedTime
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i)
      const py = pos.getY(i)
      pos.setZ(i, Math.sin(px * 0.35 + t * 1.1) * 0.07 + Math.cos(py * 0.28 + t * 0.8) * 0.06)
    }
    pos.needsUpdate = true
    // The normal map drifts slowly so the sky reflection shimmers.
    const nm = mat.current?.normalMap
    if (nm) nm.offset.set(t * 0.011, t * 0.007)
  })
  return (
    <mesh ref={mesh} rotation-x={-Math.PI / 2} position={[x, 0.02, z]}>
      <planeGeometry args={[w, d, segs[0], segs[1]]} />
      <meshStandardMaterial ref={mat} color={COLORS.water} roughness={0.12} metalness={0} normalMap={normal} normalScale={[0.35, 0.35]} envMapIntensity={1.3} transparent opacity={0.94} />
    </mesh>
  )
}

export function Water() {
  return (
    <>
      {WATER.map((w, i) => (
        <WaterSheet key={i} {...w} />
      ))}
    </>
  )
}

// ---------- clouds ----------
type CloudSpec = { x: number; y: number; z: number; s: number; speed: number }
// Low enough to sit in the band of sky the chase camera shows, far enough out to read as distant.
const CLOUDS: CloudSpec[] = [
  { x: -60, y: 15, z: -70, s: 1.1, speed: 0.9 },
  { x: 40, y: 18, z: -150, s: 1.5, speed: 0.7 },
  { x: 110, y: 14, z: -230, s: 1.0, speed: 1.1 },
  { x: -80, y: 17, z: -310, s: 1.3, speed: 0.8 },
  { x: 60, y: 20, z: -390, s: 1.6, speed: 0.6 },
  { x: -30, y: 16, z: -470, s: 1.1, speed: 1.0 },
  { x: 90, y: 18, z: -560, s: 1.4, speed: 0.75 },
]
const CLOUD_SPAN = 240 // clouds wrap around this x range so they never run out

// Sprite clouds in one instanced draw call (drei), lit by the same lights as the scene.
export function Clouds() {
  const refs = useRef<(Group | null)[]>([])
  useFrame(({ clock }) => {
    const { reduced } = readRoadT()
    if (reduced) return
    const t = clock.elapsedTime
    CLOUDS.forEach((c, i) => {
      const g = refs.current[i]
      if (!g) return
      const dx = ((c.x + 120 + t * c.speed) % CLOUD_SPAN) - 120
      g.position.set(dx, c.y, c.z)
    })
  })
  return (
    <CloudField material={MeshLambertMaterial} texture="/textures/cloud.webp" limit={140} range={140}>
      {CLOUDS.map((c, i) => (
        <Cloud
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          position={[c.x, c.y, c.z]}
          seed={i + 3}
          segments={14}
          bounds={[16 * c.s, 3 * c.s, 7 * c.s]}
          volume={8 * c.s}
          growth={2}
          speed={0.12}
          opacity={0.38}
          fade={40}
          color="#22345f"
        />
      ))}
    </CloudField>
  )
}

// ---------- birds ----------
const BIRDS = 5
const FLOCK_RADIUS = 22
const FLOCK_HEIGHT = 10.5
const FLOCK_AHEAD = 30 // the flock circles a point this far ahead of the car, inside the camera's view

function Bird({ register }: { register: (g: Group | null, wings: (Mesh | null)[]) => void }) {
  const wings = useRef<(Mesh | null)[]>([])
  return (
    <group
      ref={(g) => {
        register(g, wings.current)
      }}
    >
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.28, 0.12, 0.7]} />
        <meshLambertMaterial color={COLORS.ink} />
      </mesh>
      {[1, -1].map((sx) => (
        <mesh
          key={sx}
          ref={(el) => {
            wings.current[sx === 1 ? 0 : 1] = el
          }}
          position={[sx * 0.55, 0.05, -0.05]}
        >
          <boxGeometry args={[1.1, 0.05, 0.4]} />
          <meshLambertMaterial color={COLORS.ink} />
        </mesh>
      ))}
    </group>
  )
}

export function Birds() {
  const birds = useRef<{ g: Group; wings: (Mesh | null)[] }[]>([])
  const centre = useMemo(() => new Vector3(), [])
  useFrame(({ clock }) => {
    const { t, reduced } = readRoadT()
    if (reduced) return
    const time = clock.elapsedTime
    const curve = roadCurve()
    curve.getPointAt(Math.min(1, t + 0.06), centre)
    birds.current.forEach((b, i) => {
      const phase = (i / BIRDS) * Math.PI * 2
      const a = time * 0.22 + phase
      const r = FLOCK_RADIUS + Math.sin(time * 0.5 + i) * 4
      const x = centre.x + Math.cos(a) * r
      const z = centre.z - FLOCK_AHEAD * 0.2 + Math.sin(a) * r * 0.6
      const y = FLOCK_HEIGHT + Math.sin(time * 0.9 + i * 1.7) * 1.6
      const prevX = b.g.position.x
      const prevZ = b.g.position.z
      b.g.position.set(x, y, z)
      b.g.lookAt(x + (x - prevX), y, z + (z - prevZ))
      const flap = Math.sin(time * 7 + i) * 0.55
      const [l, rgt] = b.wings
      if (l) l.rotation.z = flap
      if (rgt) rgt.rotation.z = -flap
    })
  })
  const register = (g: Group | null, wings: (Mesh | null)[]) => {
    if (!g) return
    if (!birds.current.some((b) => b.g === g)) birds.current.push({ g, wings })
  }
  return (
    <>
      {Array.from({ length: BIRDS }, (_, i) => (
        <Bird key={i} register={register} />
      ))}
    </>
  )
}
