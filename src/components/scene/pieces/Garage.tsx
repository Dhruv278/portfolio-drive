'use client'

// The garage the car starts in. Open toward the road ahead; the roller door carries the name and
// rolls up during the intro (readIntro().door), or stands open under reduced motion.
import { useFrame } from '@react-three/fiber'
import { useCallback, useMemo, useRef } from 'react'
import { Mesh, PlaneGeometry } from 'three'
import { setPieces } from '@/content/profile'
import { GARAGE } from '@/content/route'
import { drawDoor, makeTexture, repaint, useRepaintOnFonts } from '../paint'
import { frameAt } from '../roadCurve'
import { readIntro, readRoadT } from '../useDriveFrame'
import { usePieceTextures } from './textures'
import { Glow, Mass } from './toolkit'

const WALL = 0.3

export function Garage() {
  const tex = usePieceTextures()
  const frame = useMemo(() => frameAt(0), [])
  const door = useRef<Mesh>(null)
  const { width: W, depth: D, height: H, centerZ, doorZ, doorHeight } = GARAGE
  const doorTex = useMemo(() => makeTexture(1024, 512, (ctx, w, h) => drawDoor(ctx, w, h, setPieces.garage.door)), [])
  useRepaintOnFonts(useCallback(() => repaint(doorTex, (ctx, w, h) => drawDoor(ctx, w, h, setPieces.garage.door)), [doorTex]))
  // The door hangs from its top edge, so scaling y rolls it up toward the lintel.
  const doorGeo = useMemo(() => {
    const g = new PlaneGeometry(W - WALL * 2, doorHeight)
    g.translate(0, -doorHeight / 2, 0)
    return g
  }, [W, doorHeight])

  useFrame(() => {
    const d = door.current
    if (!d) return
    const { reduced } = readRoadT()
    const intro = readIntro()
    const open = reduced ? 1 : intro.active ? intro.door : 1
    d.scale.y = Math.max(0.08, 1 - open * 0.92)
  })

  return (
    <group name="piece-garage" position={frame.position} quaternion={frame.quaternion}>
      {/* floor slab, and an apron from the door to the road's first metre */}
      <Mass w={W} h={0.08} d={D} z={centerZ} diff={tex.concreteDiff} nor={tex.concreteNor} metres={3} color="#c9c6bf" />
      <Mass w={W} h={0.06} d={-doorZ + 1.5} z={doorZ / 2 + 0.75} diff={tex.concreteDiff} nor={tex.concreteNor} metres={3} color="#c3c0b8" />
      {/* side walls, back wall, roof */}
      <Mass w={WALL} h={H} d={D} x={-W / 2 + WALL / 2} z={centerZ} diff={tex.brickDiff} nor={tex.brickNor} metres={2.5} />
      <Mass w={WALL} h={H} d={D} x={W / 2 - WALL / 2} z={centerZ} diff={tex.brickDiff} nor={tex.brickNor} metres={2.5} />
      <Mass w={W} h={H} d={WALL} z={centerZ - D / 2 + WALL / 2} diff={tex.brickDiff} nor={tex.brickNor} metres={2.5} />
      <Mass w={W + 0.4} h={0.25} d={D + 0.4} y={H} z={centerZ} diff={tex.corrugatedDiff} nor={tex.corrugatedNor} metres={1.5} color="#8e949c" />
      {/* lintel above the door, then the door hanging from it */}
      <Mass w={W} h={H - doorHeight} d={WALL} y={doorHeight} z={doorZ} diff={tex.brickDiff} nor={tex.brickNor} metres={2.5} />
      <mesh ref={door} geometry={doorGeo} position={[0, doorHeight, doorZ]} castShadow>
        <meshStandardMaterial map={doorTex} roughness={0.55} metalness={0.35} />
      </mesh>
      {/* a workbench at the back and a warm light inside */}
      <Mass w={2.6} h={0.9} d={0.8} x={-W / 2 + 1.7} z={centerZ - D / 2 + 1} diff={tex.metalDiff} nor={tex.metalNor} metres={1} color="#a9a9a9" />
      <Glow w={W - 1} h={0.4} d={D - 2} y={H - 0.5} z={centerZ} color="#ffd9a8" opacity={0.18} />
      <mesh position={[0, H - 0.3, centerZ]}>
        <boxGeometry args={[1.2, 0.08, 0.3]} />
        <meshStandardMaterial color="#fff1d6" emissive="#ffe2b8" emissiveIntensity={1.4} />
      </mesh>
    </group>
  )
}
