'use client'

import { useEffect, useMemo, useRef } from 'react'
import { DoubleSide, InstancedMesh } from 'three'
import { DASH_COUNT, KERB_WIDTH, ROAD_HALF_WIDTH, ROAD_SEGMENTS } from '@/content/route'
import { buildKerbGeometry, buildRoadGeometry, dashMatrices } from '@/lib/road'
import { roadCurve } from './roadCurve'

export const COLORS = {
  ground: '#E3E6D6',
  road: '#9EA4AC',
  kerb: '#D8DCE0',
  dash: '#F6F2EA',
  water: '#BBD7E6',
  wood: '#C9B48F',
  ink: '#1E2A38',
  cobalt: '#2F5BEA',
  leaf: '#7FB069',
  leafDark: '#6A9C57',
} as const

export function Road() {
  const curve = roadCurve()
  const road = useMemo(() => buildRoadGeometry(curve, ROAD_HALF_WIDTH, ROAD_SEGMENTS), [curve])
  const kerbL = useMemo(() => buildKerbGeometry(curve, ROAD_HALF_WIDTH, KERB_WIDTH, 1, ROAD_SEGMENTS), [curve])
  const kerbR = useMemo(() => buildKerbGeometry(curve, ROAD_HALF_WIDTH, KERB_WIDTH, -1, ROAD_SEGMENTS), [curve])
  const dashes = useMemo(() => dashMatrices(curve, DASH_COUNT), [curve])
  const inst = useRef<InstancedMesh>(null)

  useEffect(() => {
    const m = inst.current
    if (!m) return
    dashes.forEach((mat, i) => m.setMatrixAt(i, mat))
    m.instanceMatrix.needsUpdate = true
  }, [dashes])

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[1400, 1400]} />
        <meshLambertMaterial color={COLORS.ground} />
      </mesh>
      <mesh geometry={road} receiveShadow>
        <meshLambertMaterial color={COLORS.road} side={DoubleSide} />
      </mesh>
      <mesh geometry={kerbL}>
        <meshLambertMaterial color={COLORS.kerb} side={DoubleSide} />
      </mesh>
      <mesh geometry={kerbR}>
        <meshLambertMaterial color={COLORS.kerb} side={DoubleSide} />
      </mesh>
      <instancedMesh ref={inst} args={[undefined, undefined, DASH_COUNT]}>
        <boxGeometry args={[0.22, 0.02, 1.4]} />
        <meshLambertMaterial color={COLORS.dash} />
      </instancedMesh>
    </group>
  )
}
