'use client'

// Things the kits do not cover, built from primitives: water, hills, pier, pier posts, billboards.
import { useMemo } from 'react'
import { Quaternion, Vector3 } from 'three'
import { BILLBOARDS, HILLS, PIER_POSTS } from '@/content/route'
import { poseAt, roadCurve } from './roadCurve'
import { COLORS } from './Road'
import { useSurfaces } from './surfaces'

function Box({ w, h, d, c, x = 0, y = 0, z = 0 }: { w: number; h: number; d: number; c: string; x?: number; y?: number; z?: number }) {
  return (
    <mesh position={[x, y + h / 2, z]} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <meshLambertMaterial color={c} />
    </mesh>
  )
}

function Cyl({ r, h, c, x = 0, y = 0, z = 0, seg = 10 }: { r: number; h: number; c: string; x?: number; y?: number; z?: number; seg?: number }) {
  return (
    <mesh position={[x, y + h / 2, z]} castShadow>
      <cylinderGeometry args={[r, r, h, seg]} />
      <meshLambertMaterial color={c} />
    </mesh>
  )
}

// Rounded hills in the same grass as the ground. Replaced by displaced terrain in stage 2.
export function Hills() {
  const s = useSurfaces()
  const map = useMemo(() => {
    const t = s.grassDiff.clone()
    t.repeat.set(6, 3)
    t.needsUpdate = true
    return t
  }, [s.grassDiff])
  return (
    <>
      {HILLS.map((h, i) => (
        <mesh key={i} position={poseAt(h.t, h.lateral).position} scale={[1, h.h / h.r, 1]} castShadow receiveShadow>
          <sphereGeometry args={[h.r, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial map={map} normalMap={s.grassNor} roughness={1} metalness={0} color={h.dark ? '#3a4760' : '#485878'} />
        </mesh>
      ))}
    </>
  )
}

export function PierPosts() {
  return (
    <>
      {PIER_POSTS.map((p, i) => {
        const pose = poseAt(p.t, p.lateral)
        return (
          <group key={i} position={pose.position} quaternion={pose.quaternion}>
            <Cyl r={0.16} h={1.4} c={COLORS.wood} seg={6} />
            <Cyl r={0.16} h={1.4} c={COLORS.wood} z={-2.2} seg={6} />
          </group>
        )
      })}
    </>
  )
}

export function Pier() {
  const { position, quaternion } = useMemo(() => {
    const curve = roadCurve()
    const p = curve.getPointAt(1)
    const tan = curve.getTangentAt(1).setY(0).normalize()
    return { position: p, quaternion: new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), tan) }
  }, [])
  return (
    <group position={position} quaternion={quaternion}>
      {Array.from({ length: 12 }, (_, i) => (
        <Box key={`p${i}`} w={6} h={0.25} d={1.6} c={COLORS.wood} y={0.3} z={i * 1.8 + 1} />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <group key={`s${i}`}>
          <Cyl r={0.16} h={1.0} c={COLORS.wood} x={-2.8} z={i * 3.6 + 1} seg={6} />
          <Cyl r={0.16} h={1.0} c={COLORS.wood} x={2.8} z={i * 3.6 + 1} seg={6} />
        </group>
      ))}
      <Box w={1.2} h={2.4} d={0.2} c={COLORS.cobalt} x={2.2} y={0.55} z={21} />
      <Cyl r={0.6} h={0.3} c="#ffffff" x={2.2} y={2.95} z={21} />
    </group>
  )
}

export function Billboards() {
  return (
    <>
      {BILLBOARDS.map((b, i) => {
        const pose = poseAt(b.t, b.lateral)
        return (
          <group key={i} position={pose.position} quaternion={pose.quaternion}>
            <Cyl r={0.14} h={3.6} c={COLORS.ink} x={-1.8} seg={6} />
            <Cyl r={0.14} h={3.6} c={COLORS.ink} x={1.8} seg={6} />
            <Box w={5.2} h={2.8} d={0.2} c="#101e3d" y={3.4} />
            <Box w={4.2} h={0.4} d={0.05} c="#ffb547" y={5.2} z={0.12} />
            <Box w={3.4} h={0.25} d={0.05} c="#e8edf7" x={-0.4} y={4.5} z={0.12} />
            <Box w={2.6} h={0.25} d={0.05} c="#94a3c4" x={-0.8} y={4.0} z={0.12} />
          </group>
        )
      })}
    </>
  )
}
