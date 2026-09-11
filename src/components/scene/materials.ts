import { Color, Material, MeshLambertMaterial, MeshStandardMaterial } from 'three'

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

// A tinted copy of a Lambert material, cached per material and tint. The nature kit's mint leaves
// and peach trunks multiply to natural greens and browns under the photographic ground.
const tinted = new Map<MeshLambertMaterial, Map<string, MeshLambertMaterial>>()
export function tintedLambert(base: MeshLambertMaterial, hex: string): MeshLambertMaterial {
  let byTint = tinted.get(base)
  if (!byTint) {
    byTint = new Map()
    tinted.set(base, byTint)
  }
  const hit = byTint.get(hex)
  if (hit) return hit
  const m = base.clone()
  m.color.multiply(new Color(hex))
  byTint.set(hex, m)
  return m
}

