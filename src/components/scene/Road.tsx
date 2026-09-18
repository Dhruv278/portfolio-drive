'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, Color, DoubleSide, type Mesh, ShaderMaterial } from 'three'
import { KERB_WIDTH, ROAD_HALF_WIDTH, ROAD_SEGMENTS } from '@/content/route'
import { buildEdgeGeometry, buildKerbGeometry, buildRoadGeometry } from '@/lib/road'
import { NIGHT } from './Night'
import { roadCurve } from './roadCurve'
import { buildGroundMap, paintRoadStrip, useSurfaces } from './surfaces'
import { readRoadT } from './useDriveFrame'

export const COLORS = {
  ground: '#E3E6D6',
  road: '#8E949C',
  kerb: '#D8DCE0',
  line: '#FFFFFF',
  water: '#24454b',
  wood: '#4a3d2e',
  ink: '#344247',
  cobalt: '#d6ed83',
  leaf: '#7FB069',
  leafDark: '#6A9C57',
} as const

// The lit edge: faint ahead of the car, bright behind it, the 3D twin of the 2D track's lit line.
// Values above one so bloom picks it up. Additive, so it reads as light on the asphalt.
const EDGE_INSET = 0.45
const EDGE_WIDTH = 0.12
function edgeMaterial(hex: string): ShaderMaterial {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    uniforms: { progress: { value: 0 }, color: { value: new Color(hex) } },
    vertexShader: 'attribute float progress; varying float vP; void main(){ vP = progress; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float progress; uniform vec3 color; varying float vP; void main(){ float lit = 1.0 - smoothstep(progress - 0.003, progress + 0.003, vP); gl_FragColor = vec4(color * mix(0.3, 1.7, lit), 1.0); }',
  })
}

// Ground, road and kerbs as photographic PBR surfaces. Lane markings are painted into the road
// strip (see surfaces.ts) rather than modelled, so the road is a single draw call. Two thin edge
// strips carry the lit line.
export function Road() {
  const curve = roadCurve()
  const s = useSurfaces()
  const road = useMemo(() => buildRoadGeometry(curve, ROAD_HALF_WIDTH, ROAD_SEGMENTS), [curve])
  const kerbL = useMemo(() => buildKerbGeometry(curve, ROAD_HALF_WIDTH, KERB_WIDTH, 1, ROAD_SEGMENTS), [curve])
  const kerbR = useMemo(() => buildKerbGeometry(curve, ROAD_HALF_WIDTH, KERB_WIDTH, -1, ROAD_SEGMENTS), [curve])
  const edgeL = useMemo(() => buildEdgeGeometry(curve, ROAD_HALF_WIDTH, EDGE_INSET, EDGE_WIDTH, 1, ROAD_SEGMENTS), [curve])
  const edgeR = useMemo(() => buildEdgeGeometry(curve, ROAD_HALF_WIDTH, EDGE_INSET, EDGE_WIDTH, -1, ROAD_SEGMENTS), [curve])
  const edgeMatL = useMemo(() => edgeMaterial(NIGHT.amber), [])
  const edgeMatR = useMemo(() => edgeMaterial('#a2c9d3'), [])
  const edgeMeshL = useRef<Mesh>(null)
  const edgeMeshR = useRef<Mesh>(null)
  const strip = useMemo(() => paintRoadStrip(s.asphaltDiff.image as CanvasImageSource), [s.asphaltDiff])
  const ground = useMemo(() => buildGroundMap(s.grassDiff.image as CanvasImageSource), [s.grassDiff])

  // The travelled part of each edge follows the car. Uniforms are reached through the mesh refs,
  // the same way the car and camera mutate their objects inside the frame loop.
  useFrame(() => {
    const { t } = readRoadT()
    for (const m of [edgeMeshL.current, edgeMeshR.current]) {
      if (m) (m.material as ShaderMaterial).uniforms.progress.value = t
    }
  })

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[1400, 1400]} />
        <meshStandardMaterial map={ground} normalMap={s.grassNor} normalScale={[0.7, 0.7]} roughnessMap={s.grassArm} metalnessMap={s.grassArm} roughness={1} metalness={0} />
      </mesh>
      {/* Wet asphalt: a lower roughness lets the sky and the lamps reflect a little. */}
      <mesh geometry={road} receiveShadow>
        <meshStandardMaterial map={strip} normalMap={s.asphaltNor} normalScale={[0.8, 0.8]} roughnessMap={s.asphaltArm} metalnessMap={s.asphaltArm} roughness={0.6} metalness={0} side={DoubleSide} />
      </mesh>
      <mesh geometry={kerbL} receiveShadow>
        <meshStandardMaterial map={s.concreteDiff} normalMap={s.concreteNor} color="#afbdb6" roughness={0.9} metalness={0} side={DoubleSide} />
      </mesh>
      <mesh geometry={kerbR} receiveShadow>
        <meshStandardMaterial map={s.concreteDiff} normalMap={s.concreteNor} color="#afbdb6" roughness={0.9} metalness={0} side={DoubleSide} />
      </mesh>
      <mesh ref={edgeMeshL} geometry={edgeL} material={edgeMatL} />
      <mesh ref={edgeMeshR} geometry={edgeR} material={edgeMatR} />
    </group>
  )
}
