'use client'

// Building blocks for set pieces: textured masses, posts, signs, screens and additive glow.
import { useMemo } from 'react'
import { AdditiveBlending, DoubleSide, type CanvasTexture, type Texture } from 'three'
import { PALETTE } from '../paint'
import { tiled } from './textures'

type MassProps = { w: number; h: number; d: number; x?: number; y?: number; z?: number; diff: Texture; nor?: Texture; metres?: number; color?: string; roughness?: number }

// A box standing on y with a texture tiled so one repeat covers `metres` on every face.
export function Mass({ w, h, d, x = 0, y = 0, z = 0, diff, nor, metres = 2, color = '#ffffff', roughness = 0.9 }: MassProps) {
  const maps = useMemo(
    () => ({ map: tiled(diff, Math.max(w, d), h, metres), normalMap: nor ? tiled(nor, Math.max(w, d), h, metres) : undefined }),
    [diff, nor, w, d, h, metres],
  )
  return (
    <mesh position={[x, y + h / 2, z]} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial map={maps.map} normalMap={maps.normalMap} color={color} roughness={roughness} metalness={0} />
    </mesh>
  )
}

export function Post({ h, r = 0.08, x = 0, z = 0, color = PALETTE.ink }: { h: number; r?: number; x?: number; z?: number; color?: string }) {
  return (
    <mesh position={[x, h / 2, z]} castShadow>
      <cylinderGeometry args={[r, r, h, 8]} />
      <meshStandardMaterial color={color} roughness={0.6} metalness={0.3} />
    </mesh>
  )
}

type SignProps = { texture: CanvasTexture; w: number; h: number; x?: number; y: number; z?: number; postHeight: number }

// A painted board at height y on one post (narrow) or two (wide). Faces local +z, which in a
// poseAt() frame points at the road.
export function Sign({ texture, w, h, x = 0, y, z = 0, postHeight }: SignProps) {
  const two = w > 1.2
  return (
    <group position={[x, 0, z]}>
      {two ? (
        <>
          <Post h={postHeight} x={-w * 0.4} />
          <Post h={postHeight} x={w * 0.4} />
        </>
      ) : (
        <Post h={postHeight} />
      )}
      <mesh position={[0, y, 0.06]} castShadow>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={texture} roughness={0.85} metalness={0} side={DoubleSide} />
      </mesh>
    </group>
  )
}

type ScreenProps = { texture: CanvasTexture; w: number; h: number; x?: number; y: number; z?: number; rotationY?: number }

// A painted panel with a thin ink frame, mounted on a wall or a post by the caller. Faces local +z.
export function Screen({ texture, w, h, x = 0, y, z = 0, rotationY = 0 }: ScreenProps) {
  return (
    <group position={[x, y, z]} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[w + 0.12, h + 0.12, 0.06]} />
        <meshStandardMaterial color={PALETTE.ink} roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={texture} roughness={0.7} metalness={0} />
      </mesh>
    </group>
  )
}

type GlowProps = { w: number; h: number; d: number; x?: number; y?: number; z?: number; color?: string; opacity?: number }

// Light without a light: an additive translucent box. Real lights would recompile every material.
export function Glow({ w, h, d, x = 0, y = 0, z = 0, color = PALETTE.cobalt, opacity = 0.35 }: GlowProps) {
  return (
    <mesh position={[x, y, z]}>
      <boxGeometry args={[w, h, d]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} blending={AdditiveBlending} toneMapped={false} fog={false} />
    </mesh>
  )
}
