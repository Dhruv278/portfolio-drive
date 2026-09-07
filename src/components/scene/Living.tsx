'use client'

// Things that move on their own: rippling water, drifting clouds, a small flock of birds.
// All are time-based and cheap. They render only while the IdleLoop is awake.
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Group, Mesh, PlaneGeometry, Vector3 } from 'three'
import { WATER } from '@/content/route'
import { COLORS } from './Road'
import { roadCurve } from './roadCurve'
import { readRoadT } from './useDriveFrame'

// ---------- water ----------
function WaterSheet({ x, z, w, d }: { x: number; z: number; w: number; d: number }) {
  const mesh = useRef<Mesh>(null)
  const segs = useMemo(() => [Math.max(8, Math.round(w / 6)), Math.max(8, Math.round(d / 6))] as const, [w, d])
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
  })
  return (
    <mesh ref={mesh} rotation-x={-Math.PI / 2} position={[x, 0.02, z]}>
      <planeGeometry args={[w, d, segs[0], segs[1]]} />
      <meshLambertMaterial color={COLORS.water} />
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
type Cloud = { x: number; y: number; z: number; s: number; speed: number }
const CLOUDS: Cloud[] = [
  { x: -60, y: 52, z: -40, s: 1.0, speed: 0.9 },
  { x: 40, y: 58, z: -120, s: 1.4, speed: 0.7 },
  { x: 110, y: 50, z: -210, s: 0.9, speed: 1.1 },
  { x: -80, y: 56, z: -280, s: 1.2, speed: 0.8 },
  { x: 60, y: 62, z: -360, s: 1.5, speed: 0.6 },
  { x: -30, y: 54, z: -440, s: 1.0, speed: 1.0 },
  { x: 90, y: 57, z: -520, s: 1.3, speed: 0.75 },
]
const CLOUD_SPAN = 240 // clouds wrap around this x range so they never run out

function CloudPuffs({ s }: { s: number }) {
  return (
    <group scale={s}>
      {[
        [0, 0, 0, 4.2],
        [3.6, -0.4, 0.6, 3.1],
        [-3.4, -0.6, -0.4, 2.8],
        [1.2, 1.1, -0.8, 2.6],
        [-1.4, 0.9, 0.9, 2.3],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} scale={[1, 0.62, 1]}>
          <sphereGeometry args={[r, 7, 5]} />
          <meshLambertMaterial color="#FFFFFF" flatShading />
        </mesh>
      ))}
    </group>
  )
}

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
    <>
      {CLOUDS.map((c, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          position={[c.x, c.y, c.z]}
        >
          <CloudPuffs s={c.s} />
        </group>
      ))}
    </>
  )
}

// ---------- birds ----------
const BIRDS = 5
const FLOCK_RADIUS = 30
const FLOCK_HEIGHT = 22

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
    roadCurve().getPointAt(t, centre)
    birds.current.forEach((b, i) => {
      const phase = (i / BIRDS) * Math.PI * 2
      const a = time * 0.22 + phase
      const r = FLOCK_RADIUS + Math.sin(time * 0.5 + i) * 4
      const x = centre.x + Math.cos(a) * r
      const z = centre.z - 20 + Math.sin(a) * r * 0.6
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
