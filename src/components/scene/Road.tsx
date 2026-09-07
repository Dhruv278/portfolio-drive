'use client'

import { useEffect, useMemo, useRef } from 'react'
import { DoubleSide, InstancedMesh } from 'three'
import { DASH_COUNT, KERB_WIDTH, ROAD_HALF_WIDTH, ROAD_SEGMENTS } from '@/content/route'
import { buildKerbGeometry, buildRoadGeometry, dashMatrices } from '@/lib/road'
import { roadCurve } from './roadCurve'

export const COLORS = {
  ground: '#E3E6D6',
  road: '#8E949C',
  kerb: '#D8DCE0',
  line: '#FFFFFF',
  water: '#BBD7E6',
  wood: '#C9B48F',
  ink: '#1E2A38',
  cobalt: '#2F5BEA',
  leaf: '#7FB069',
  leafDark: '#6A9C57',
} as const

// Solid edge lines sit just inside the kerbs. Centre dashes are wider and brighter than the first draft.
const EDGE_INSET = 0.6
const EDGE_WIDTH = 0.18

export function Road() {
  const curve = roadCurve()
  const road = useMemo(() => buildRoadGeometry(curve, ROAD_HALF_WIDTH, ROAD_SEGMENTS), [curve])
  const kerbL = useMemo(() => buildKerbGeometry(curve, ROAD_HALF_WIDTH, KERB_WIDTH, 1, ROAD_SEGMENTS), [curve])
  const kerbR = useMemo(() => buildKerbGeometry(curve, ROAD_HALF_WIDTH, KERB_WIDTH, -1, ROAD_SEGMENTS), [curve])
  const edgeL = useMemo(() => buildKerbGeometry(curve, ROAD_HALF_WIDTH - EDGE_INSET, EDGE_WIDTH, 1, ROAD_SEGMENTS, 0.045), [curve])
  const edgeR = useMemo(() => buildKerbGeometry(curve, ROAD_HALF_WIDTH - EDGE_INSET, EDGE_WIDTH, -1, ROAD_SEGMENTS, 0.045), [curve])
  const dashes = useMemo(() => dashMatrices(curve, DASH_COUNT), [curve])
  const inst = useRef<InstancedMesh>(null)

  useEffect(() => {
    const m = inst.current
    if (!m) return
    dashes.forEach((mat, i) => m.setMatrixAt(i, mat))
    m.instanceMatrix.needsUpdate = true
    // The culling sphere is computed lazily on the first frame, before these matrices exist, and
    // would otherwise sit at the origin and hide every dash once the camera drives away.
    m.computeBoundingSphere()
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
      <mesh geometry={edgeL}>
        <meshBasicMaterial color={COLORS.line} side={DoubleSide} />
      </mesh>
      <mesh geometry={edgeR}>
        <meshBasicMaterial color={COLORS.line} side={DoubleSide} />
      </mesh>
      <instancedMesh ref={inst} args={[undefined, undefined, DASH_COUNT]} frustumCulled={false}>
        <boxGeometry args={[0.32, 0.02, 1.6]} />
        <meshBasicMaterial color={COLORS.line} />
      </instancedMesh>
    </group>
  )
}
