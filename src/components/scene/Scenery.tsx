'use client'

import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Suspense, useMemo, useRef } from 'react'
import { Box3, Group, Material, Mesh, Vector3 } from 'three'
import { buildPlacements, REVEAL_LEAD, type Fit, type Placement } from '@/content/route'
import { lambertFor } from './materials'
import { poseAt } from './roadCurve'
import { readRoadT, useIsMobile } from './useDriveFrame'

type LoadedGltf = { scene: Group }

// Only things taller than this cast a shadow. Fence posts, rocks and small props do not need one.
const SHADOW_MIN_HEIGHT = 3

// Clone a loaded model and size it to the fit spec, footprint centred, base on the ground.
// Swaps PBR materials for Lambert and limits shadow casting, both for integrated GPUs.
export function fitModel(src: Group, fit: Fit): Group {
  const m = src.clone(true)
  const box = new Box3().setFromObject(m)
  const size = box.getSize(new Vector3())
  let s = 1
  if (fit.h) s = fit.h / size.y
  else if (fit.w) s = fit.w / size.x
  else if (fit.d) s = fit.d / size.z
  else if (fit.len) s = fit.len / Math.max(size.x, size.z)
  m.scale.setScalar(s)
  box.setFromObject(m)
  const center = box.getCenter(new Vector3())
  m.position.set(-center.x, -box.min.y, -center.z)
  const tall = size.y * s >= SHADOW_MIN_HEIGHT
  m.traverse((o) => {
    if ((o as Mesh).isMesh) {
      const mesh = o as Mesh
      // Tall things cast and receive. Self-shadowing is what gives the low-poly trees their depth.
      mesh.castShadow = tall
      mesh.receiveShadow = tall
      mesh.material = lambertFor(mesh.material as Material)
    }
  })
  return m
}

// One placed model. Unfolds from the ground as the car approaches, using its own small frame loop.
function Placed({ p, lat }: { p: Placement; lat: number }) {
  const { scene } = useGLTF(`/models/${p.model}.glb`) as unknown as LoadedGltf
  const group = useRef<Group>(null)
  const k = useRef(0)
  const model = useMemo(() => {
    const m = fitModel(scene, p.fit)
    if (p.rot) m.rotation.y = p.rot
    if (p.dx) m.position.x += p.dx
    if (p.dz) m.position.z += p.dz
    return m
  }, [scene, p])
  const pose = useMemo(() => poseAt(p.t, p.lateral * lat), [p.t, p.lateral, lat])

  const spins = /windmill/.test(p.model)

  useFrame(({ clock }) => {
    const g = group.current
    if (!g) return
    const { t, reduced } = readRoadT()
    const target = t > p.t - REVEAL_LEAD ? 1 : 0
    if (reduced) k.current = target
    else k.current += (target - k.current) * 0.09
    const x = k.current
    const e = x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
    g.scale.y = Math.max(0.001, e)
    if (spins && !reduced) {
      // the kit's windmill keeps its sails in a node called "blades"
      const blades = g.getObjectByName('blades')
      if (blades) blades.rotation.x = clock.elapsedTime * 0.9 + p.t * 20
    }
  })

  return (
    <group ref={group} position={pose.position} quaternion={pose.quaternion} scale={[1, 0.001, 1]}>
      <primitive object={model} />
    </group>
  )
}

export function Scenery() {
  const mobile = useIsMobile()
  const lat = mobile ? 0.72 : 1
  const placements = useMemo(() => buildPlacements(), [])
  return (
    <group>
      {placements.map((p, i) => (
        <Suspense key={`${p.model}-${i}`} fallback={null}>
          <Placed p={p} lat={lat} />
        </Suspense>
      ))}
    </group>
  )
}
