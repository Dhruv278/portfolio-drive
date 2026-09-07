'use client'

import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Box3, CanvasTexture, Group, Material, Mesh, MeshLambertMaterial, MeshStandardMaterial, NearestFilter, Object3D, SRGBColorSpace, SpotLight, Vector3 } from 'three'
import { CAR_LENGTH, CAR_MODEL, DUSK_SPAN, DUSK_START } from '@/content/route'
import { recolorRedCells } from '@/lib/recolor'
import { roadCurve } from './roadCurve'
import { readRoadT } from './useDriveFrame'

const MODEL_URL = `/models/${CAR_MODEL}.glb`
const COBALT: [number, number, number] = [47, 91, 234]
const NIGHT_THRESHOLD = 0.25 // dusk fraction at which the headlights switch on

useGLTF.preload(MODEL_URL)

type LoadedGltf = { scene: Group }

// Build a cobalt Lambert copy of the kit's palette material. Runs once per source material.
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
  const out = recolorRedCells(data.data, COBALT)
  const repainted = ctx.createImageData(w, h)
  repainted.data.set(out)
  ctx.putImageData(repainted, 0, 0)
  const tex = new CanvasTexture(c)
  tex.flipY = mat.map.flipY
  tex.colorSpace = SRGBColorSpace
  tex.magFilter = NearestFilter
  tex.minFilter = mat.map.minFilter
  return new MeshLambertMaterial({ map: tex, color: mat.color })
}

export function Car() {
  const { scene } = useGLTF(MODEL_URL) as unknown as LoadedGltf
  const car = useRef<Group>(null)
  const chassis = useRef<Group>(null)
  const state = useRef({ prevT: 0, prevSpeed: 0, spin: 0, steer: 0, roll: 0, pitch: 0, night: false })
  const wheels = useRef<Object3D[]>([])
  const frontWheels = useRef<Object3D[]>([])
  const lampMat = useRef<MeshStandardMaterial>(null)
  const tailMat = useRef<MeshStandardMaterial>(null)
  const beams = useRef<SpotLight[]>([])
  // Headlight spotlights only exist at dusk. Two live spotlights make every material in the scene
  // more expensive, so they are mounted when needed rather than dimmed.
  const [night, setNight] = useState(false)

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
    const repainted = new Map<Material, Material>()
    m.traverse((o) => {
      if ((o as Mesh).isMesh) {
        const mesh = o as Mesh
        mesh.castShadow = true
        mesh.receiveShadow = false
        const mat = mesh.material as MeshStandardMaterial
        if (mat && mat.map) {
          if (!repainted.has(mat)) repainted.set(mat, recolorMaterial(mat))
          mesh.material = repainted.get(mat)!
        }
      }
    })
    box.setFromObject(m)
    box.getSize(size)
    return { model: m, halfW: size.x / 2, front: box.max.z, back: box.min.z, lampY: size.y * 0.38 }
  }, [scene])

  const tmp = useMemo(() => ({ pos: new Vector3(), tan: new Vector3(), tanAhead: new Vector3(), look: new Vector3() }), [])

  useFrame(() => {
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
    const speed = t - st.prevT
    const accel = speed - st.prevSpeed
    st.prevT = t
    st.prevSpeed = speed

    const curve = roadCurve()
    curve.getPointAt(t, tmp.pos)
    curve.getTangentAt(t, tmp.tan).setY(0).normalize()
    g.position.copy(tmp.pos)
    g.position.y = 0.03
    tmp.look.copy(tmp.pos).add(tmp.tan)
    g.lookAt(tmp.look)

    curve.getTangentAt(Math.min(1, t + 0.01), tmp.tanAhead).setY(0).normalize()
    const turn = Math.atan2(tmp.tan.x * tmp.tanAhead.z - tmp.tan.z * tmp.tanAhead.x, tmp.tan.dot(tmp.tanAhead))
    const targetSteer = Math.max(-0.45, Math.min(0.45, -turn * 6))
    st.steer += (targetSteer - st.steer) * (reduced ? 1 : 0.15)
    for (const w of frontWheels.current) w.rotation.y = st.steer

    const sp = Math.min(1, Math.abs(speed) * 2600)
    st.roll += (-st.steer * 0.3 * sp - st.roll) * 0.1
    st.pitch += (-accel * 1400 - st.pitch) * 0.12
    ch.rotation.set(reduced ? 0 : Math.max(-0.07, Math.min(0.07, st.pitch)), 0, reduced ? 0 : st.roll)

    st.spin += speed * 900
    for (const w of wheels.current) w.rotation.x = st.spin

    const dusk = Math.min(1, Math.max(0, (t - DUSK_START) / DUSK_SPAN))
    const isNight = dusk > NIGHT_THRESHOLD
    if (isNight !== st.night) {
      st.night = isNight
      setNight(isNight)
    }
    for (const b of beams.current) b.intensity = (dusk - NIGHT_THRESHOLD) * 160
    if (lampMat.current) lampMat.current.emissiveIntensity = 0.5 + dusk * 1.8
    if (tailMat.current) tailMat.current.emissiveIntensity = 0.6 + dusk * 1.2
  })

  return (
    <group ref={car}>
      <group ref={chassis}>
        <primitive object={model} />
        {[1, -1].map((sx) => (
          <group key={sx}>
            <mesh position={[sx * (halfW - 0.45), lampY, front + 0.02]}>
              <boxGeometry args={[0.34, 0.14, 0.06]} />
              <meshStandardMaterial ref={sx === 1 ? lampMat : undefined} color="#FFF3C4" emissive="#FFE9A8" emissiveIntensity={0.5} roughness={0.4} />
            </mesh>
            <mesh position={[sx * (halfW - 0.45), lampY + 0.1, back - 0.02]}>
              <boxGeometry args={[0.32, 0.12, 0.05]} />
              <meshStandardMaterial ref={sx === 1 ? tailMat : undefined} color="#D9463F" emissive="#B0231D" emissiveIntensity={0.6} roughness={0.4} />
            </mesh>
            {night && <Headlight sx={sx} halfW={halfW} lampY={lampY} front={front} beams={beams} />}
          </group>
        ))}
      </group>
    </group>
  )
}

function Headlight({ sx, halfW, lampY, front, beams }: { sx: number; halfW: number; lampY: number; front: number; beams: RefObject<SpotLight[]> }) {
  const light = useRef<SpotLight>(null)
  const target = useMemo(() => {
    const o = new Object3D()
    o.position.set(sx * 0.9, 0.1, 12)
    return o
  }, [sx])
  useEffect(() => {
    const l = light.current
    if (!l) return
    l.target = target
    beams.current.push(l)
    return () => {
      beams.current = beams.current.filter((b) => b !== l)
    }
  }, [target, beams])
  return (
    <>
      <spotLight ref={light} position={[sx * (halfW - 0.45), lampY, front]} color="#FFF1C8" intensity={0} distance={38} angle={0.42} penumbra={0.55} decay={1.3} />
      <primitive object={target} />
    </>
  )
}
