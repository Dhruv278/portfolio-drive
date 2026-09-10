'use client'

// Wall and metal textures for the set pieces (Poly Haven, CC0, 512 WebP). Loaded once, shared.
import { useTexture } from '@react-three/drei'
import { RepeatWrapping, SRGBColorSpace, type Texture } from 'three'

const FILES = {
  brickDiff: '/textures/pieces/brick_diff.webp',
  brickNor: '/textures/pieces/brick_nor.webp',
  concreteDiff: '/textures/pieces/concrete_diff.webp',
  concreteNor: '/textures/pieces/concrete_nor.webp',
  corrugatedDiff: '/textures/pieces/corrugated_diff.webp',
  corrugatedNor: '/textures/pieces/corrugated_nor.webp',
  metalDiff: '/textures/pieces/metal_diff.webp',
  metalNor: '/textures/pieces/metal_nor.webp',
}
export type PieceTextures = Record<keyof typeof FILES, Texture>
const KEYS = Object.keys(FILES) as (keyof typeof FILES)[]

useTexture.preload(Object.values(FILES))

function configure(input: PieceTextures | Texture[]) {
  const list = Array.isArray(input) ? input : Object.values(input)
  list.forEach((tex, i) => {
    tex.wrapS = RepeatWrapping
    tex.wrapT = RepeatWrapping
    tex.anisotropy = 4
    if (KEYS[i].endsWith('Diff')) tex.colorSpace = SRGBColorSpace
    tex.needsUpdate = true
  })
}

export function usePieceTextures(): PieceTextures {
  return useTexture(FILES, configure)
}

// A copy of a texture tiled so one repeat covers `metres` of surface of the given size.
export function tiled(tex: Texture, width: number, height: number, metres = 2): Texture {
  const t = tex.clone()
  t.repeat.set(width / metres, height / metres)
  t.needsUpdate = true
  return t
}
