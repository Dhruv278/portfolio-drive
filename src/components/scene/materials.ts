import { Material, MeshLambertMaterial, MeshStandardMaterial } from 'three'

// Kenney models ship with MeshStandardMaterial (PBR). On integrated GPUs Lambert is much cheaper
// and the flat palette look is unchanged. One Lambert material is built per source material.
const cache = new WeakMap<Material, MeshLambertMaterial>()

export function lambertFor(src: Material): MeshLambertMaterial {
  const hit = cache.get(src)
  if (hit) return hit
  const s = src as MeshStandardMaterial
  const m = new MeshLambertMaterial({
    map: s.map ?? null,
    color: s.color ?? undefined,
    transparent: s.transparent,
    opacity: s.opacity,
    side: s.side,
  })
  cache.set(src, m)
  return m
}
