'use client'

// MedChron: records in, cited chronology out. A records building with a loading dock, a conveyor of
// paper sheets that pass through a scanner arch and continue as cards, chronology signposts, and a
// board that counts up the resume's numbers when the car parks.
import { useFrame, useThree } from '@react-three/fiber'
import { useCallback, useMemo, useRef } from 'react'
import { Color, InstancedMesh, Matrix4, Quaternion, Vector3, type CanvasTexture } from 'three'
import { setPieces } from '@/content/profile'
import { MEDCHRON } from '@/content/route'
import { conveyorU, counterValue } from '@/lib/pieceMath'
import { parkedStop } from '@/lib/scroll'
import { useDrive } from '@/store/drive'
import { drawArchLabel, drawBoard, drawCard, drawLastCard, drawSign, makeTexture, PALETTE, repaint, useRepaintOnFonts } from '../paint'
import { poseAt, roadCurve } from '../roadCurve'
import { readRoadT } from '../useDriveFrame'
import { usePieceTextures } from './textures'
import { Glow, Mass, Post, Screen, Sign } from './toolkit'

const SHEETS = 36
const SHEET_SPEED = 0.05 // conveyor lengths per second
const ARCH_U = 0.52 // where along the conveyor the arch stands
const BELT_Y = 1.05
const COUNT_SECONDS = 1.8
const REPAINT_EVERY = 1 / 24

const m4 = new Matrix4()
const q = new Quaternion()
const scale = new Vector3()
const pos = new Vector3()
const yAxis = new Vector3(0, 1, 0)
const white = new Color(PALETTE.white)
const paper = new Color(PALETTE.paper)

export function MedChron() {
  const tex = usePieceTextures()
  const invalidate = useThree((s) => s.invalidate)
  const md = setPieces.medchron
  const L = MEDCHRON

  // Conveyor line in world space, and the arch position on it.
  const belt = useMemo(() => {
    const a = poseAt(L.conveyorStart, L.conveyorLateral).position.clone()
    const b = poseAt(L.conveyorEnd, L.conveyorLateral).position.clone()
    const dir = b.clone().sub(a)
    const length = dir.length()
    dir.normalize()
    const mid = a.clone().addScaledVector(dir, length / 2)
    const yaw = Math.atan2(dir.x, dir.z)
    const arch = a.clone().addScaledVector(dir, length * ARCH_U)
    return { a, dir, length, mid, yaw, arch }
  }, [L])

  const building = useMemo(() => poseAt(L.buildingT, L.lateral), [L])
  // Signposts stand by the kerb and turn to face the car as it comes up the road behind them.
  const signs = useMemo(
    () =>
      L.signTs.map((t) => {
        const pose = poseAt(t, L.signLateral)
        const from = roadCurve().getPointAt(Math.max(0, t - 0.03))
        const dir = from.sub(pose.position).setY(0).normalize()
        pose.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), dir)
        return pose
      }),
    [L],
  )

  // Painted textures. Cards are painted once; the board is repainted while counting.
  const signTex = useMemo(() => makeTexture(1024, 256, (c, w, h) => drawSign(c, w, h, md.building)), [md.building])
  const archTex = useMemo(() => makeTexture(1024, 192, (c, w, h) => drawArchLabel(c, w, h, md.arch)), [md.arch])
  const cardTex = useMemo(() => md.chronology.map((card) => makeTexture(512, 512, (c, w, h) => drawCard(c, w, h, card))), [md.chronology])
  const lastTex = useMemo(() => makeTexture(512, 512, (c, w, h) => drawLastCard(c, w, h, md.last)), [md.last])
  const boardTex = useMemo<CanvasTexture>(
    () =>
      makeTexture(1024, 640, (c, w, h) =>
        drawBoard(c, w, h, 'MedChron', md.sample, md.counters.map((r) => ({ label: r.label, value: `${r.from}${r.suffix}` }))),
      ),
    [md],
  )

  const sheets = useRef<InstancedMesh>(null)
  const count = useRef({ started: -1, k: 0, lastPaint: 0, finished: false })

  useRepaintOnFonts(
    useCallback(() => {
      repaint(signTex, (c, w, h) => drawSign(c, w, h, md.building))
      repaint(archTex, (c, w, h) => drawArchLabel(c, w, h, md.arch))
      cardTex.forEach((t, i) => repaint(t, (c, w, h) => drawCard(c, w, h, md.chronology[i])))
      repaint(lastTex, (c, w, h) => drawLastCard(c, w, h, md.last))
      const k = count.current.k
      const rows = md.counters.map((r) => ({ label: r.label, value: `${counterValue(r.from, r.to, k)}${r.suffix}` }))
      repaint(boardTex, (c, w, h) => drawBoard(c, w, h, 'MedChron', md.sample, rows))
    }, [signTex, archTex, cardTex, lastTex, boardTex, md]),
  )

  useFrame(() => {
    const { s, reduced } = readRoadT()
    // Wall time: the fiber clock restarts when the frameloop switches on at ready.
    const now = performance.now() / 1000

    // Sheets ride the belt; past the arch they grow into paper cards.
    const inst = sheets.current
    if (inst) {
      for (let i = 0; i < SHEETS; i++) {
        const u = reduced ? i / SHEETS : conveyorU(i, SHEETS, now, SHEET_SPEED)
        const card = u > ARCH_U
        pos.copy(belt.a).addScaledVector(belt.dir, u * belt.length)
        pos.y = BELT_Y + (card ? 0.1 : 0.02)
        q.setFromAxisAngle(yAxis, belt.yaw + (card ? 0 : Math.sin(i * 7.3) * 0.12))
        scale.set(card ? 0.9 : 0.62, 0.012, card ? 1.15 : 0.86)
        inst.setMatrixAt(i, m4.compose(pos, q, scale))
        inst.setColorAt(i, card ? paper : white)
      }
      inst.instanceMatrix.needsUpdate = true
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true
    }

    // The board counts up once, when the car first parks here.
    const c = count.current
    const parked = parkedStop(s, useDrive.getState().zones) === 1
    if (parked && c.started < 0) c.started = now
    if (c.started >= 0 && !c.finished) {
      c.k = reduced ? 1 : Math.min(1, (now - c.started) / COUNT_SECONDS)
      if (now - c.lastPaint >= REPAINT_EVERY || c.k >= 1) {
        c.lastPaint = now
        const rows = md.counters.map((r) => ({ label: r.label, value: `${counterValue(r.from, r.to, c.k)}${r.suffix}` }))
        repaint(boardTex, (ctx, w, h) => drawBoard(ctx, w, h, 'MedChron', md.sample, rows))
      }
      if (c.k >= 1) c.finished = true
      else invalidate()
    }
  })

  const bw = L.buildingLen
  return (
    <group name="piece-medchron">
      {/* records building: concrete base, brick body, corrugated roof, sign and board on the road face */}
      <group position={building.position} quaternion={building.quaternion}>
        <Mass w={bw} h={0.6} d={11} diff={tex.concreteDiff} nor={tex.concreteNor} metres={3} color="#b9b6ae" />
        <Mass w={bw - 0.4} h={6.2} d={10.4} y={0.6} diff={tex.brickDiff} nor={tex.brickNor} metres={2.5} color="#d8cfc4" />
        <Mass w={bw + 0.6} h={0.4} d={11.4} y={6.8} diff={tex.corrugatedDiff} nor={tex.corrugatedNor} metres={1.5} color="#8e949c" />
        {/* loading dock, sign and board on the road face (local +z faces the road in a poseAt frame) */}
        <Mass w={5} h={1.1} d={2.4} x={-bw * 0.28} z={6.4} diff={tex.concreteDiff} nor={tex.concreteNor} metres={2} color="#b9b6ae" />
        <Glow w={4.6} h={3.2} d={0.3} x={-bw * 0.28} y={2.8} z={5.3} color="#ffe2b8" opacity={0.12} />
        <Sign texture={signTex} w={6} h={1.5} x={-bw * 0.24} y={5.3} z={5.9} postHeight={0.1} />
        <Screen texture={boardTex} w={5.6} h={3.5} x={bw * 0.24} y={3.6} z={5.4} />
      </group>

      {/* conveyor: a belt on posts, and the sheets riding it */}
      <group position={belt.mid} rotation={[0, belt.yaw, 0]}>
        <mesh position={[0, BELT_Y - 0.05, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.3, 0.1, belt.length]} />
          <meshStandardMaterial map={tex.metalDiff} normalMap={tex.metalNor} color="#6d7278" roughness={0.6} metalness={0.5} />
        </mesh>
        {Array.from({ length: Math.floor(belt.length / 3) + 1 }, (_, i) => (
          <group key={i} position={[0, 0, -belt.length / 2 + i * 3]}>
            <Post h={BELT_Y - 0.1} r={0.06} x={-0.55} />
            <Post h={BELT_Y - 0.1} r={0.06} x={0.55} />
          </group>
        ))}
      </group>
      <instancedMesh ref={sheets} args={[undefined, undefined, SHEETS]} frustumCulled={false} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.9} metalness={0} />
      </instancedMesh>

      {/* scanner arch over the belt: two posts, a lintel with the label, cobalt glow through the gap */}
      <group position={belt.arch} rotation={[0, belt.yaw, 0]}>
        <Post h={2.6} r={0.12} x={-1.1} color="#3a4250" />
        <Post h={2.6} r={0.12} x={1.1} color="#3a4250" />
        <Screen texture={archTex} w={2.6} h={0.5} y={2.75} rotationY={Math.PI} />
        <Glow w={2.0} h={1.5} d={0.4} y={BELT_Y + 0.8} color={PALETTE.cobalt} opacity={0.32} />
      </group>

      {/* five chronology signposts, then the closing card */}
      {signs.map((pose, i) => (
        <group key={i} position={pose.position} quaternion={pose.quaternion}>
          <Sign texture={i < 5 ? cardTex[i] : lastTex} w={2.6} h={2.6} y={2.9} postHeight={1.7} />
        </group>
      ))}
    </group>
  )
}
