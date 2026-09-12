'use client'

// Night. A gradient sky dome in the page's navy, a field of stars, amber street lamps along the road
// with pools of light painted on the asphalt, and the pool under the car. Everything here is static
// geometry with unlit or emissive materials: no lights are added, so the shader programs the warm-up
// compiles stay the same and nothing recompiles mid-drive.
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { AdditiveBlending, BackSide, BufferGeometry, type CanvasTexture, Color, Float32BufferAttribute, Group, InstancedMesh, Matrix4, Mesh, Quaternion, SphereGeometry, Vector3 } from 'three'
import { KERB_WIDTH, ROAD_HALF_WIDTH, T_END } from '@/content/route'
import { makeTexture } from './paint'
import { poseAt, roadCurve } from './roadCurve'

// The page palette, as the scene sees it.
export const NIGHT = {
  zenith: '#070f22',
  horizon: '#12224a',
  fog: '#0f1d3d',
  skyLight: '#2b4384',
  groundLight: '#0b1630',
  moon: '#b7c6ff',
  amber: '#ffb547',
  post: '#1e2f58',
} as const

const SKY_RADIUS = 380
const STAR_COUNT = 700
const LAMP_EVERY = 38 // metres of road between lamps, alternating sides
const LAMP_HEIGHT = 5.2
const LAMP_REACH = 0.9 // how far the head leans over the road

// Deterministic pseudo-random, so screenshots are stable.
function rng(seed: number) {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) / 2147483647)
}

// A soft round pool of light, white fading to nothing. Tinted by the material that uses it.
export function usePoolTexture(): CanvasTexture {
  const tex = useMemo(
    () =>
      makeTexture(128, 128, (ctx, w, h) => {
        const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
        g.addColorStop(0, 'rgba(255,255,255,1)')
        g.addColorStop(0.45, 'rgba(255,255,255,0.35)')
        g.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
      }),
    [],
  )
  // The canvas remounts when a phone rotates; free the old texture.
  useEffect(() => () => tex.dispose(), [tex])
  return tex
}

// The sky: a sphere seen from inside, horizon navy at the rim rising to the deep navy overhead.
// It follows the camera, so the road never runs out of sky.
function SkyDome() {
  const mesh = useRef<Mesh>(null)
  const geometry = useMemo(() => {
    const g = new SphereGeometry(SKY_RADIUS, 32, 16)
    const pos = g.attributes.position
    const colors = new Float32Array(pos.count * 3)
    const zenith = new Color(NIGHT.zenith)
    const horizon = new Color(NIGHT.horizon)
    const c = new Color()
    for (let i = 0; i < pos.count; i++) {
      const k = Math.max(0, pos.getY(i) / SKY_RADIUS)
      c.copy(horizon).lerp(zenith, Math.pow(k, 0.55))
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    g.setAttribute('color', new Float32BufferAttribute(colors, 3))
    return g
  }, [])
  useEffect(() => () => geometry.dispose(), [geometry])
  useFrame(({ camera }) => {
    mesh.current?.position.copy(camera.position)
  })
  return (
    <mesh ref={mesh} geometry={geometry} frustumCulled={false} renderOrder={-2}>
      <meshBasicMaterial vertexColors side={BackSide} fog={false} toneMapped={false} depthWrite={false} />
    </mesh>
  )
}

// Stars: one point cloud on the upper sky, fixed pixel size, following the camera with the dome.
function Stars() {
  const group = useRef<Group>(null)
  const geometry = useMemo(() => {
    const rnd = rng(11)
    const arr = new Float32Array(STAR_COUNT * 3)
    const R = SKY_RADIUS * 0.97
    for (let i = 0; i < STAR_COUNT; i++) {
      const theta = 2 * Math.PI * rnd()
      const y = 0.06 + 0.94 * rnd()
      const r = Math.sqrt(1 - y * y)
      arr[i * 3] = Math.cos(theta) * r * R
      arr[i * 3 + 1] = y * R
      arr[i * 3 + 2] = Math.sin(theta) * r * R
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(arr, 3))
    return g
  }, [])
  useEffect(() => () => geometry.dispose(), [geometry])
  useFrame(({ camera }) => {
    group.current?.position.copy(camera.position)
  })
  return (
    <group ref={group}>
      <points geometry={geometry} frustumCulled={false} renderOrder={-1}>
        <pointsMaterial color="#ffffff" size={2.2} sizeAttenuation={false} transparent opacity={0.95} fog={false} toneMapped={false} depthWrite={false} />
      </points>
    </group>
  )
}

type LampPlacement = { post: Matrix4; head: Matrix4; pool: Matrix4 }

// Street lamps on alternating sides of the road: a post, an amber head leaning over the kerb, and a
// pool of light on the asphalt. Three instanced draws for the whole road.
function Lamps() {
  const pool = usePoolTexture()
  const posts = useRef<InstancedMesh>(null)
  const heads = useRef<InstancedMesh>(null)
  const pools = useRef<InstancedMesh>(null)

  const placements = useMemo(() => {
    const curve = roadCurve()
    const n = Math.max(1, Math.floor((curve.getLength() * T_END) / LAMP_EVERY))
    const one = new Vector3(1, 1, 1)
    const p = new Vector3()
    const toRoad = new Vector3()
    const q = new Quaternion()
    const flat = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2)
    const out: LampPlacement[] = []
    for (let i = 0; i < n; i++) {
      const t = ((i + 0.5) / n) * T_END
      const side = i % 2 ? 1 : -1
      const pose = poseAt(t, side * (ROAD_HALF_WIDTH + KERB_WIDTH + 0.6))
      // local +z faces the road in a poseAt frame
      toRoad.set(0, 0, 1).applyQuaternion(pose.quaternion)
      const post = new Matrix4().compose(p.copy(pose.position).setY(LAMP_HEIGHT / 2), pose.quaternion, one)
      const head = new Matrix4().compose(p.copy(pose.position).addScaledVector(toRoad, LAMP_REACH).setY(LAMP_HEIGHT - 0.1), pose.quaternion, one)
      const light = new Matrix4().compose(p.copy(pose.position).addScaledVector(toRoad, LAMP_REACH + 1.2).setY(0.025), q.copy(pose.quaternion).multiply(flat), one)
      out.push({ post, head, pool: light })
    }
    return out
  }, [])

  useEffect(() => {
    placements.forEach((pl, i) => {
      posts.current?.setMatrixAt(i, pl.post)
      heads.current?.setMatrixAt(i, pl.head)
      pools.current?.setMatrixAt(i, pl.pool)
    })
    for (const m of [posts.current, heads.current, pools.current]) if (m) m.instanceMatrix.needsUpdate = true
  }, [placements])

  const n = placements.length
  return (
    <group name="lamps">
      <instancedMesh ref={posts} args={[undefined, undefined, n]} frustumCulled={false}>
        <cylinderGeometry args={[0.07, 0.09, LAMP_HEIGHT, 8]} />
        <meshStandardMaterial color={NIGHT.post} roughness={0.6} metalness={0.4} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, n]} frustumCulled={false}>
        <boxGeometry args={[0.42, 0.14, 0.9]} />
        <meshStandardMaterial color={NIGHT.amber} emissive={NIGHT.amber} emissiveIntensity={2.6} roughness={0.5} metalness={0} />
      </instancedMesh>
      <instancedMesh ref={pools} args={[undefined, undefined, n]} frustumCulled={false}>
        <planeGeometry args={[9, 9]} />
        <meshBasicMaterial map={pool} color={NIGHT.amber} transparent opacity={0.6} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
      </instancedMesh>
    </group>
  )
}

export function Night() {
  return (
    <>
      <SkyDome />
      <Stars />
      <Lamps />
    </>
  )
}
