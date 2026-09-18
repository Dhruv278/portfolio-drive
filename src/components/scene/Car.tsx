'use client'

import { ContactShadows, useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, Box3, CanvasTexture, Group, Material, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, NearestFilter, Object3D, SRGBColorSpace, Vector3 } from 'three'
import { CAR_LENGTH, CAR_MODEL } from '@/content/route'
import { flags } from '@/lib/flags'
import { recolorRedCells } from '@/lib/recolor'
import { NIGHT, usePoolTexture } from './Night'
import { roadCurve, UP } from './roadCurve'
import { readIntro, readRoadT } from './useDriveFrame'

const MODEL_URL = `/models/${CAR_MODEL}.glb`
// Slate. A real paint reads dark at night; the earlier ceramic glared under the sky light.
const BODY_PAINT: [number, number, number] = [79, 95, 99]
// Exhaust: a small pool of puffs recycled while the car moves.
const PUFFS = 12
const PUFF_EVERY = 0.09 // seconds between puffs at speed
const PUFF_LIFE = 1.1 // seconds

useGLTF.preload(MODEL_URL)

type LoadedGltf = { scene: Group }

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
  // Clearcoat over a mid-metal base: soft highlights that move with the camera, no glare. Reflection
  // strength comes from scene.environmentIntensity in Scene.tsx, not from this material.
  return new MeshPhysicalMaterial({ map: tex, color: mat.color, roughness: 0.38, metalness: 0.55, clearcoat: 1, clearcoatRoughness: 0.14 })
}

export function Car() {
  const { scene } = useGLTF(MODEL_URL) as unknown as LoadedGltf
  const invalidate = useThree((s) => s.invalidate)
  const pool = usePoolTexture()
  const car = useRef<Group>(null)
  const chassis = useRef<Group>(null)
  const state = useRef({ prevT: 0, prevSpeed: 0, spin: 0, steer: 0, roll: 0, pitch: 0, lastPuff: 0, next: 0 })
  const wheels = useRef<Object3D[]>([])
  const frontWheels = useRef<Object3D[]>([])
  const puffs = useRef<(Mesh | null)[]>([])
  const puffLife = useRef<number[]>(Array.from({ length: PUFFS }, () => 0))

  // Clone, fit to length, base on the ground, repaint.
  const { model, halfW, front, back, lampY } = useMemo(() => {
    const m = scene.clone(true)
    const box = new Box3().setFromObject(m)
    const size = box.getSize(new Vector3())
    const s = CAR_LENGTH / Math.max(size.x, size.z)
    m.scale.setScalar(s)
    box.setFromObject(m)
    const center = box.getCenter(new Vector3())
    m.position.set(-center.x, -box.min.y, -center.z)
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
          if (!repainted.has(key)) repainted.set(key, rubber
            ? new MeshStandardMaterial({ map: mat.map, color: mat.color, roughness: 0.88, metalness: 0.04 })
            : recolorMaterial(mat))
          mesh.material = repainted.get(key)!
        }
      }
    })
    box.setFromObject(m)
    box.getSize(size)
    return { model: m, halfW: size.x / 2, front: box.max.z, back: box.min.z, lampY: size.y * 0.38 }
  }, [scene])

  const tmp = useMemo(() => ({ pos: new Vector3(), tan: new Vector3(), tanAhead: new Vector3(), look: new Vector3(), right: new Vector3() }), [])

  useFrame(({ clock }, delta) => {
    const g = car.current
    const ch = chassis.current
    if (!g || !ch) return
    if (!wheels.current.length) {
      model.traverse((o) => {
        if (/^wheel/.test(o.name)) {
          wheels.current.push(o)
          if (/front/.test(o.name)) frontWheels.current.push(o)
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
    for (const w of frontWheels.current) w.rotation.y = st.steer

    const sp = Math.min(1, Math.abs(speed) * 2600)
    st.roll += (-st.steer * 0.3 * sp - st.roll) * (1 - Math.exp(-6.3 * Math.min(delta, 0.1)))
    st.pitch += (-accel * 1400 - st.pitch) * (1 - Math.exp(-7.7 * Math.min(delta, 0.1)))
    ch.rotation.set(reduced ? 0 : Math.max(-0.07, Math.min(0.07, st.pitch)), 0, reduced ? 0 : st.roll)

    st.spin += travel * 900
    for (const w of wheels.current) w.rotation.x = st.spin

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
          {[1, -1].map((sx) => (
            <group key={sx}>
              {/* Lamps bright enough for bloom to catch: headlights warm white, tail lamps coral. */}
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
