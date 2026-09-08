'use client'

import { useMemo } from 'react'
import { DoubleSide } from 'three'
import { KERB_WIDTH, ROAD_HALF_WIDTH, ROAD_SEGMENTS } from '@/content/route'
import { buildKerbGeometry, buildRoadGeometry } from '@/lib/road'
import { roadCurve } from './roadCurve'
import { buildGroundMap, paintRoadStrip, useSurfaces } from './surfaces'

export const COLORS = {
  ground: '#E3E6D6',
  road: '#8E949C',
  kerb: '#D8DCE0',
  line: '#FFFFFF',
  water: '#9FC4DA',
  wood: '#C9B48F',
  ink: '#1E2A38',
  cobalt: '#2F5BEA',
  leaf: '#7FB069',
  leafDark: '#6A9C57',
} as const

// Ground, road and kerbs as photographic PBR surfaces. Lane markings are painted into the road
// strip (see surfaces.ts) rather than modelled, so the road is a single draw call.
export function Road() {
  const curve = roadCurve()
  const s = useSurfaces()
  const road = useMemo(() => buildRoadGeometry(curve, ROAD_HALF_WIDTH, ROAD_SEGMENTS), [curve])
  const kerbL = useMemo(() => buildKerbGeometry(curve, ROAD_HALF_WIDTH, KERB_WIDTH, 1, ROAD_SEGMENTS), [curve])
  const kerbR = useMemo(() => buildKerbGeometry(curve, ROAD_HALF_WIDTH, KERB_WIDTH, -1, ROAD_SEGMENTS), [curve])
  const strip = useMemo(() => paintRoadStrip(s.asphaltDiff.image as CanvasImageSource), [s.asphaltDiff])
  const ground = useMemo(() => buildGroundMap(s.grassDiff.image as CanvasImageSource), [s.grassDiff])

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[1400, 1400]} />
        <meshStandardMaterial map={ground} normalMap={s.grassNor} normalScale={[0.7, 0.7]} roughnessMap={s.grassArm} metalnessMap={s.grassArm} roughness={1} metalness={0} />
      </mesh>
      <mesh geometry={road} receiveShadow>
        <meshStandardMaterial map={strip} normalMap={s.asphaltNor} normalScale={[0.8, 0.8]} roughnessMap={s.asphaltArm} metalnessMap={s.asphaltArm} roughness={1} metalness={0} side={DoubleSide} />
      </mesh>
      <mesh geometry={kerbL} receiveShadow>
        <meshStandardMaterial map={s.concreteDiff} normalMap={s.concreteNor} roughness={0.9} metalness={0} side={DoubleSide} />
      </mesh>
      <mesh geometry={kerbR} receiveShadow>
        <meshStandardMaterial map={s.concreteDiff} normalMap={s.concreteNor} roughness={0.9} metalness={0} side={DoubleSide} />
      </mesh>
    </group>
  )
}
