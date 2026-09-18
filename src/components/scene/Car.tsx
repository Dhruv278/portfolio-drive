'use client'

import { ContactShadows, useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, Box3, CanvasTexture, Color, Group, Material, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, NearestFilter, Object3D, SRGBColorSpace, Vector3 } from 'three'
import { CAR_LENGTH, CAR_MODEL, CAR_MODEL_PBR, DRACO_PATH } from '@/content/route'
import { flags } from '@/lib/flags'
import { recolorRedCells } from '@/lib/recolor'
import { NIGHT, usePoolTexture } from './Night'
import { roadCurve, UP } from './roadCurve'
import { readIntro, readRoadT, useIsMobile } from './useDriveFrame'

// Two cars. The kit sedan (Kenney, palette texture, 170 KB) drives on phones and low-end GPUs. The
// real car (a Draco-compressed PBR model, 1.6 MB) drives on desktop, loaded here on demand so phones
// never fetch it. Both get the same paint, lamps and light pools.
const KIT_URL = `/models/${CAR_MODEL}.glb`
const PBR_URL = `/models/${CAR_MODEL_PBR}.glb`
// Slate. A real paint reads dark at night; the earlier ceramic glared under the sky light.
const BODY_PAINT: [number, number, number] = [79, 95, 99]
const PAINT_HEX = '#4f5f63'
// Exhaust: a small pool of puffs recycled while the car moves.
const PUFFS = 12
const PUFF_EVERY = 0.09 // seconds between puffs at speed
const PUFF_LIFE = 1.1 // seconds

useGLTF.preload(KIT_URL)

type LoadedGltf = { scene: Group }
type Kind = 'kit' | 'pbr'
type Built = { model: Group; halfW: number; front: number; back: number; lampY: number; ownLamps: boolean; sign: number }

// Clearcoat over a mid-metal base: soft highlights that move with the camera, no glare. Reflection
// strength comes from scene.environmentIntensity in Scene.tsx, not from these materials.
const paint = (map: CanvasTexture | null, color?: Color) => new MeshPhysicalMaterial({ map, color, roughness: 0.38, metalness: 0.55, clearcoat: 1, clearcoatRoughness: 0.14 })

// Build a clearcoat PBR copy of the kit's palette material. Runs once per source material.
function recolorMaterial(mat: MeshStandardMaterial): Material {
  const img = mat.map?.image as CanvasImageSource & { width?: number; height?: number }
  const w = img?.width ?? 0
  const h = img?.height ?? 0
  if (!mat.map || !w || !h) return mat
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  if (!ctx) return mat
  ctx.drawImage(img, 0, 0)
  const data = ctx.getImageData(0, 0, w, h)
  const out = recolorRedCells(data.data, BODY_PAINT)
  // The kit's pale blue window cells read as white panels at night. Give the glass depth
  // while retaining the separate grey trim and the original paint shading.
  for (let i = 0; i < out.length; i += 4) {
    const r = data.data[i], g = data.data[i + 1], b = data.data[i + 2]
    if (r > 100 && b > r * 1.08 && g > r * 1.02) {
      out[i] = 46
      out[i + 1] = 66
      out[i + 2] = 73
    }
  }
  const repainted = ctx.createImageData(w, h)
  repainted.data.set(out)
  ctx.putImageData(repainted, 0, 0)
  const tex = new CanvasTexture(c)
  tex.flipY = mat.map.flipY
  tex.colorSpace = SRGBColorSpace
  tex.magFilter = NearestFilter
  tex.minFilter = mat.map.minFilter
  return paint(tex, mat.color)
}

// Size a model to CAR_LENGTH, centre its footprint and set its base on the ground.
function fit(m: Group): { halfW: number; front: number; back: number; height: number } {
  const box = new Box3().setFromObject(m)
  const size = box.getSize(new Vector3())
  const s = CAR_LENGTH / Math.max(size.x, size.z)
  m.scale.setScalar(s)
  m.updateMatrixWorld(true)
  box.setFromObject(m)
  const center = box.getCenter(new Vector3())
  m.position.set(-center.x, -box.min.y, -center.z)
  m.updateMatrixWorld(true)
  box.setFromObject(m)
  box.getSize(size)
  return { halfW: size.x / 2, front: box.max.z, back: box.min.z, height: size.y }
}

// The kit sedan: repainted palette, PBR materials, box lamps added by the component.
function buildKit(scene: Group): Built {
  const m = scene.clone(true)
  const repainted = new Map<string, Material>()
  m.traverse((o) => {
    if ((o as Mesh).isMesh) {
      const mesh = o as Mesh
      mesh.castShadow = true
      mesh.receiveShadow = false
      const mat = mesh.material as MeshStandardMaterial
      if (mat && mat.map) {
        const rubber = /^wheel/.test(mesh.name)
        const key = mat.uuid + (rubber ? ':wheel' : ':body')
        if (!repainted.has(key)) repainted.set(key, rubber ? new MeshStandardMaterial({ map: mat.map, color: mat.color, roughness: 0.88, metalness: 0.04 }) : recolorMaterial(mat))
        mesh.material = repainted.get(key)!
      }
    }
  })
  const f = fit(m)
  return { model: m, halfW: f.halfW, front: f.front, back: f.back, lampY: f.height * 0.38, ownLamps: false, sign: 1 }
}

// The real car: its own body, glass, rim and lamp meshes get the site's materials by node name, and
// its lamp glass glows, so nothing is bolted on. The model may face -z; it is turned to face +z, the
// direction of travel, by comparing the front and rear wheel positions.
function buildPbr(scene: Group): Built {
  const inner = scene.clone(true)
  inner.updateMatrixWorld(true)
  const wz = (name: string) => {
    const o = inner.getObjectByName(name)
    return o ? o.getWorldPosition(new Vector3()).z : 0
  }
  const flipped = (wz('wheel_fl') + wz('wheel_fr')) / 2 < (wz('wheel_rl') + wz('wheel_rr')) / 2
  if (flipped) inner.rotation.y = Math.PI
  const m = new Group()
  m.add(inner)
  const body = paint(null, new Color(PAINT_HEX))
  const glass = new MeshPhysicalMaterial({ color: '#0b151a', metalness: 0.8, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.1 })
  const detail = new MeshStandardMaterial({ color: '#b9bfb8', metalness: 1, roughness: 0.5 })
  const tail = new MeshStandardMaterial({ color: '#7a0c08', emissive: '#ff3a24', emissiveIntensity: 3, roughness: 0.35, metalness: 0.1, toneMapped: false })
  const head = new MeshStandardMaterial({ color: '#dfe6cf', emissive: '#f4f7e3', emissiveIntensity: 2.4, roughness: 0.3, metalness: 0.1, toneMapped: false })
  inner.traverse((o) => {
    if (!(o as Mesh).isMesh) return
    const mesh = o as Mesh
    mesh.receiveShadow = false
    // Only the shell casts a shadow: the interior would double the shadow pass for nothing visible.
    mesh.castShadow = mesh.name === 'body'
    if (mesh.name === 'body') mesh.material = body
    else if (mesh.name === 'glass') mesh.material = glass
    else if (/^rim_|^trim$/.test(mesh.name)) mesh.material = detail
    else if (mesh.name === 'lights_red' || mesh.name === 'brakes') mesh.material = tail
    else if (mesh.name === 'lights') mesh.material = head
  })
  const f = fit(m)
  return { model: m, halfW: f.halfW, front: f.front, back: f.back, lampY: f.height * 0.36, ownLamps: true, sign: flipped ? -1 : 1 }
}

export function Car() {
  const mobile = useIsMobile()
  // Phones keep the light kit sedan. Every desktop, integrated graphics included, gets the real car:
  // the scene renders on demand, so the heavier model costs frames only while the visitor scrolls.
  const kind: Kind = mobile ? 'kit' : 'pbr'
  const { scene } = useGLTF(kind === 'pbr' ? PBR_URL : KIT_URL, kind === 'pbr' ? DRACO_PATH : undefined) as unknown as LoadedGltf
  const invalidate = useThree((s) => s.invalidate)
  const pool = usePoolTexture()
  const car = useRef<Group>(null)
  const chassis = useRef<Group>(null)
  const state = useRef({ prevT: 0, prevSpeed: 0, spin: 0, steer: 0, roll: 0, pitch: 0, lastPuff: 0, next: 0 })
  const wheels = useRef<Object3D[]>([])
  const frontWheels = useRef<Object3D[]>([])
  const puffs = useRef<(Mesh | null)[]>([])
  const puffLife = useRef<number[]>(Array.from({ length: PUFFS }, () => 0))

  const { model, halfW, front, back, lampY, ownLamps, sign } = useMemo(() => (kind === 'pbr' ? buildPbr(scene) : buildKit(scene)), [scene, kind])

  const tmp = useMemo(() => ({ pos: new Vector3(), tan: new Vector3(), tanAhead: new Vector3(), look: new Vector3(), right: new Vector3() }), [])

  useFrame(({ clock }, delta) => {
    const g = car.current
    const ch = chassis.current
    if (!g || !ch) return
    if (!wheels.current.length) {
      model.traverse((o) => {
        if (/^wheel/.test(o.name)) {
          wheels.current.push(o)
          if (/front|_f[lr]$/.test(o.name)) frontWheels.current.push(o)
        }
      })
    }
    const { t, reduced } = readRoadT()
    const st = state.current
    const travel = t - st.prevT
    const speed = travel / Math.max(delta, 1 / 240) / 60
    const accel = (speed - st.prevSpeed) / Math.max(delta, 1 / 240) / 60
    st.prevT = t
    st.prevSpeed = speed

    const curve = roadCurve()
    curve.getPointAt(t, tmp.pos)
    curve.getTangentAt(t, tmp.tan).setY(0).normalize()
    tmp.right.crossVectors(UP, tmp.tan).normalize()
    g.position.copy(tmp.pos)
    // During the intro the car starts inside the garage, behind the road origin.
    const introBack = readIntro().back
    if (introBack > 0) g.position.addScaledVector(tmp.tan, -introBack)
    g.position.y = 0.03
    tmp.look.copy(tmp.pos).add(tmp.tan)
    g.lookAt(tmp.look)

    curve.getTangentAt(Math.min(1, t + 0.01), tmp.tanAhead).setY(0).normalize()
    const turn = Math.atan2(tmp.tan.x * tmp.tanAhead.z - tmp.tan.z * tmp.tanAhead.x, tmp.tan.dot(tmp.tanAhead))
    const targetSteer = Math.max(-0.45, Math.min(0.45, -turn * 6))
    st.steer += (targetSteer - st.steer) * (reduced ? 1 : 1 - Math.exp(-9.75 * Math.min(delta, 0.1)))
    // A model turned to face +z has its wheel axes mirrored, hence the sign.
    for (const w of frontWheels.current) {
      w.rotation.order = 'YXZ'
      w.rotation.y = st.steer * sign
    }

    const sp = Math.min(1, Math.abs(speed) * 2600)
    st.roll += (-st.steer * 0.3 * sp - st.roll) * (1 - Math.exp(-6.3 * Math.min(delta, 0.1)))
    st.pitch += (-accel * 1400 - st.pitch) * (1 - Math.exp(-7.7 * Math.min(delta, 0.1)))
    ch.rotation.set(reduced ? 0 : Math.max(-0.07, Math.min(0.07, st.pitch)), 0, reduced ? 0 : st.roll)

    st.spin += travel * 900
    for (const w of wheels.current) w.rotation.x = st.spin * sign

    // Exhaust. Spawn behind the right rear while moving, age every live puff, keep frames coming
    // until the last one has faded.
    if (!reduced) {
      const now = clock.elapsedTime
      if (Math.abs(speed) > 0.00005 && now - st.lastPuff > PUFF_EVERY) {
        st.lastPuff = now
        const i = st.next
        st.next = (st.next + 1) % PUFFS
        const p = puffs.current[i]
        if (p) {
          p.position.copy(tmp.pos).addScaledVector(tmp.tan, -2.3).addScaledVector(tmp.right, -0.55)
          p.position.y = 0.45
          p.scale.setScalar(0.6)
          p.visible = true
          puffLife.current[i] = 1
        }
      }
      let alive = false
      for (let i = 0; i < PUFFS; i++) {
        const p = puffs.current[i]
        if (!p || puffLife.current[i] <= 0) continue
        puffLife.current[i] -= delta / PUFF_LIFE
        const life = puffLife.current[i]
        if (life <= 0) {
          p.visible = false
          continue
        }
        alive = true
        p.position.y += delta * 1.4
        p.scale.setScalar(0.6 + (1 - life) * 1.5)
        ;(p.material as MeshBasicMaterial).opacity = life * 0.55
      }
      if (alive) invalidate()
    }
  })

  return (
    <>
      <group ref={car} name="car">
        {/* Ground contact: a blurred top-down depth of the car, re-rendered only when a frame is requested. */}
        {flags.contact && <ContactShadows position={[0, 0.005, 0]} scale={7} blur={2.4} far={1.5} opacity={0.5} resolution={256} frames={1} color="#090e10" />}
        {/* The restrained citron pool matches the 2D track. */}
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0.4]}>
          <planeGeometry args={[6.5, 9]} />
          <meshBasicMaterial map={pool} color={NIGHT.amber} transparent opacity={0.1} depthWrite={false} blending={AdditiveBlending} toneMapped={false} fog={false} />
        </mesh>
        <group ref={chassis}>
          <primitive object={model} />
          {/* The kit sedan has no lamp meshes of its own, so it gets boxes bright enough for bloom. */}
          {!ownLamps &&
            [1, -1].map((sx) => (
              <group key={sx}>
                <mesh position={[sx * (halfW - 0.45), lampY, front + 0.02]}>
                  <boxGeometry args={[0.34, 0.14, 0.06]} />
                  <meshStandardMaterial color="#f2f5df" emissive="#e4edce" emissiveIntensity={3} roughness={0.4} toneMapped={false} />
                </mesh>
                <mesh position={[sx * (halfW - 0.45), lampY + 0.1, back - 0.02]}>
                  <boxGeometry args={[0.32, 0.12, 0.05]} />
                  <meshStandardMaterial color="#ee806b" emissive="#d45c46" emissiveIntensity={2.4} roughness={0.4} toneMapped={false} />
                </mesh>
              </group>
            ))}
        </group>
        {/* Light pools hang off the road-following group, not the chassis: a pitch under acceleration
            used to dip them below the asphalt and switch the beams off mid-scroll. A soft pool avoids
            the solid-cone look and transparent overdraw. */}
        {[1, -1].map((sx) => (
          <mesh key={sx} position={[sx * (halfW - 0.45), 0.025, front + 3.2]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[2.6, 7.5]} />
            <meshBasicMaterial map={pool} color="#edf4dc" transparent opacity={0.24} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
          </mesh>
        ))}
      </group>
      {Array.from({ length: PUFFS }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            puffs.current[i] = el
          }}
          visible={false}
        >
          <sphereGeometry args={[0.22, 6, 5]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </>
  )
}
