'use client'

import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Suspense, useMemo, useRef } from 'react'
import { Box3, Group, Mesh, Vector3 } from 'three'
import { buildPlacements, REVEAL_LEAD, type Fit, type Placement } from '@/content/route'
import { poseAt } from './roadCurve'
import { readRoadT, useIsMobile } from './useDriveFrame'

type LoadedGltf = { scene: Group }

// Clone a loaded model and size it to the fit spec, footprint centred, base on the ground.
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
  m.traverse((o) => {
    if ((o as Mesh).isMesh) {
      o.castShadow = true
      o.receiveShadow = true
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

  useFrame(() => {
    const g = group.current
    if (!g) return
    const { t, reduced } = readRoadT()
    const target = t > p.t - REVEAL_LEAD ? 1 : 0
    if (reduced) k.current = target
    else k.current += (target - k.current) * 0.09
    const x = k.current
    const e = x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
    g.scale.y = Math.max(0.001, e)
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
