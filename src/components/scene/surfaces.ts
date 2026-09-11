'use client'

// Photographic surface textures (Poly Haven, CC0) and the painted road strip. UVs on the road and
// kerb ribbons run 0..1 across and in metres along, so every repeat here is "tiles per metre".
import { useTexture } from '@react-three/drei'
import { type CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three'
import { KERB_WIDTH, ROAD_HALF_WIDTH } from '@/content/route'
import { makeTexture } from './paint'

export const ROAD_WIDTH = ROAD_HALF_WIDTH * 2
export const ASPHALT_TILE = ROAD_WIDTH // one asphalt tile spans the road, 6.4 m
export const STRIP_LENGTH = 12.8 // metres of road painted per colour strip: two dash periods
export const DASH_PERIOD = 6.4
export const DASH_LENGTH = 2.4
export const LINE_WIDTH = 0.15
export const EDGE_INSET = 0.6
export const GRASS_TILE = 7
export const GROUND_MAP_TILES = 4 // the ground colour map holds a 4 by 4 block of grass tiles
export const CONCRETE_TILE = 2
const STRIP_W = 1024
const STRIP_H = 2048

const FILES = {
  asphaltDiff: '/textures/asphalt_diff.webp',
  asphaltNor: '/textures/asphalt_nor.webp',
  asphaltArm: '/textures/asphalt_arm.webp',
  grassDiff: '/textures/grass_diff.webp',
  grassNor: '/textures/grass_nor.webp',
  grassArm: '/textures/grass_arm.webp',
  concreteDiff: '/textures/concrete_diff.webp',
  concreteNor: '/textures/concrete_nor.webp',
  waterNor: '/textures/waternormals.webp',
}
export type Surfaces = Record<keyof typeof FILES, Texture>

// Start the texture downloads with the model downloads, not when the road first renders.
useTexture.preload(Object.values(FILES))

function tile(tex: Texture, rx: number, ry: number, srgb = false) {
  tex.wrapS = RepeatWrapping
  tex.wrapT = RepeatWrapping
  tex.repeat.set(rx, ry)
  tex.anisotropy = 4
  if (srgb) tex.colorSpace = SRGBColorSpace
  tex.needsUpdate = true
}

// Runs once per mount, after the textures have loaded, outside render. drei hands the callback the
// loaded textures as an array in key order, whatever its types say, so both shapes are accepted.
function configure(input: Surfaces | Texture[]) {
  const list = Array.isArray(input) ? input : Object.values(input)
  const keys = Object.keys(FILES) as (keyof typeof FILES)[]
  const t = Object.fromEntries(keys.map((k, i) => [k, list[i]])) as Surfaces
  tile(t.asphaltNor, 1, 1 / ASPHALT_TILE)
  tile(t.asphaltArm, 1, 1 / ASPHALT_TILE)
  tile(t.grassDiff, 1400 / GRASS_TILE, 1400 / GRASS_TILE, true)
  tile(t.grassNor, 1400 / GRASS_TILE, 1400 / GRASS_TILE)
  tile(t.grassArm, 1400 / GRASS_TILE, 1400 / GRASS_TILE)
  tile(t.concreteDiff, KERB_WIDTH / CONCRETE_TILE, 1 / CONCRETE_TILE, true)
  tile(t.concreteNor, KERB_WIDTH / CONCRETE_TILE, 1 / CONCRETE_TILE)
  tile(t.waterNor, 1, 1)
}

export function useSurfaces(): Surfaces {
  return useTexture(FILES, configure)
}

// The ground colour map: a block of grass tiles, each flipped or rotated differently, under a slow
// light-and-dark wash. Tiled textures repeat visibly at distance; this pushes the repeat to 28 m.
export function buildGroundMap(grass: CanvasImageSource): CanvasTexture {
  const n = GROUND_MAP_TILES
  const size = 2048
  const cell = size / n
  const tex = makeTexture(size, size, (ctx) => paintGround(ctx, grass, n, size, cell))
  tex.wrapS = RepeatWrapping
  tex.wrapT = RepeatWrapping
  tex.repeat.set(1400 / (GRASS_TILE * n), 1400 / (GRASS_TILE * n))
  return tex
}

function paintGround(ctx: CanvasRenderingContext2D, grass: CanvasImageSource, n: number, size: number, cell: number) {
  let seed = 7
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      ctx.save()
      ctx.translate(x * cell + cell / 2, y * cell + cell / 2)
      ctx.rotate((Math.floor(rnd() * 4) * Math.PI) / 2)
      ctx.scale(rnd() < 0.5 ? -1 : 1, 1)
      ctx.drawImage(grass, -cell / 2, -cell / 2, cell, cell)
      ctx.restore()
    }
  }
  // Slow wash: a few large soft blobs of shade and light.
  for (let i = 0; i < 14; i++) {
    const cx = rnd() * size
    const cy = rnd() * size
    const r = size * (0.18 + rnd() * 0.22)
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    const dark = rnd() < 0.55
    g.addColorStop(0, dark ? 'rgba(40,50,20,0.22)' : 'rgba(255,245,200,0.14)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
  }
  // Night: grass reads as a dark blue-green under the moon.
  ctx.fillStyle = 'rgba(7,15,34,0.5)'
  ctx.fillRect(0, 0, size, size)
}

// One strip of road: asphalt tiled to world scale, two centre dashes, both edge lines, tyre wear,
// then the paint aged with a thin asphalt wash. Repeats along the road every STRIP_LENGTH metres.
export function paintRoadStrip(asphalt: CanvasImageSource): CanvasTexture {
  const tex = makeTexture(STRIP_W, STRIP_H, (ctx) => paintStrip(ctx, asphalt))
  tex.wrapS = RepeatWrapping
  tex.wrapT = RepeatWrapping
  tex.repeat.set(1, 1 / STRIP_LENGTH)
  return tex
}

function paintStrip(ctx: CanvasRenderingContext2D, asphalt: CanvasImageSource) {
  const px = STRIP_W / ROAD_WIDTH // pixels per metre
  const tilePx = ASPHALT_TILE * px
  const drawAsphalt = () => {
    for (let y = 0; y < STRIP_H; y += tilePx) for (let x = 0; x < STRIP_W; x += tilePx) ctx.drawImage(asphalt, x, y, tilePx, tilePx)
  }
  drawAsphalt()
  // Night: the asphalt sits under a navy wash.
  ctx.fillStyle = 'rgba(7,15,34,0.42)'
  ctx.fillRect(0, 0, STRIP_W, STRIP_H)

  // Tyre wear: each lane centre sits 1.6 m from the crown, wheels 0.75 m either side of it.
  for (const lane of [-1.6, 1.6]) {
    for (const wheel of [-0.75, 0.75]) {
      const cx = (ROAD_HALF_WIDTH + lane + wheel) * px
      const grad = ctx.createLinearGradient(cx - 0.55 * px, 0, cx + 0.55 * px, 0)
      grad.addColorStop(0, 'rgba(0,0,0,0)')
      grad.addColorStop(0.5, 'rgba(0,0,0,0.16)')
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grad
      ctx.fillRect(cx - 0.55 * px, 0, 1.1 * px, STRIP_H)
    }
  }

  // Markings.
  ctx.fillStyle = 'rgba(255,238,205,0.92)'
  const lw = LINE_WIDTH * px
  ctx.fillRect(EDGE_INSET * px - lw / 2, 0, lw, STRIP_H)
  ctx.fillRect(STRIP_W - EDGE_INSET * px - lw / 2, 0, lw, STRIP_H)
  for (let y = 0; y < STRIP_H; y += DASH_PERIOD * px) ctx.fillRect(STRIP_W / 2 - lw / 2, y, lw, DASH_LENGTH * px)

  // Age the paint, then bring the wash back over it.
  ctx.globalAlpha = 0.22
  drawAsphalt()
  ctx.globalAlpha = 1
  ctx.fillStyle = 'rgba(7,15,34,0.2)'
  ctx.fillRect(0, 0, STRIP_W, STRIP_H)
}
