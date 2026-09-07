// Repaints the red and orange cells of a palette texture to a target colour.
// Kenney models colour every part through one small "colormap" texture, so swapping the red
// cells turns the red car cobalt without touching wheels, glass or trim.

export type RGB = [number, number, number]

export function isRedOrOrange(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const sat = max ? (max - min) / max : 0
  return sat > 0.45 && r > 120 && r > g * 1.35 && r > b * 1.6
}

export function recolorRedCells(pixels: Uint8ClampedArray, target: RGB): Uint8ClampedArray {
  const out = new Uint8ClampedArray(pixels)
  const [tr, tg, tb] = target
  for (let i = 0; i < out.length; i += 4) {
    const r = out[i], g = out[i + 1], b = out[i + 2]
    if (!isRedOrOrange(r, g, b)) continue
    const l = Math.max(r, g, b) / 255 // keep the cell's lightness so shading survives
    out[i] = Math.round(tr * l + 20)
    out[i + 1] = Math.round(tg * l + 20)
    out[i + 2] = Math.round(tb * l + 15)
  }
  return out
}
