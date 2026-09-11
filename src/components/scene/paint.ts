'use client'

// Canvas 2D painter for signs, cards, boards and the garage door, in the site's own design language.
// Everything drawn here is text from profile.ts. Textures are small (512 wide) and repainted rarely.
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import type { ChronologyCard } from '@/content/profile'
import { wrapText } from '@/lib/pieceMath'

export const PALETTE = { panel: '#101e3d', panel2: '#0b1630', text: '#e8edf7', muted: '#94a3c4', amber: '#ffb547', cobalt: '#6f93ff', line: '#1e2f58' } as const

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void

export function fonts(): { display: string; body: string } {
  const css = getComputedStyle(document.documentElement)
  const display = css.getPropertyValue('--font-display').trim() || 'sans-serif'
  const body = css.getPropertyValue('--font-body').trim() || 'sans-serif'
  return { display, body }
}

// Painting is deferred: canvases are rasterised on the GPU, and painting every board, the ground
// map and the road strip in the single task where React commits the loaded scene lost the WebGL
// context on Intel graphics. The warm-up in Scene.tsx paints one canvas per frame; PaintPump covers
// anything created later. A texture is blank until its turn comes.
const queue: (() => void)[] = []

export function makeTexture(width: number, height: number, draw: Draw): CanvasTexture {
  const c = document.createElement('canvas')
  c.width = width
  c.height = height
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 4
  queue.push(() => repaint(tex, draw))
  return tex
}

export function pendingPaints(): number {
  return queue.length
}

// Paint up to `max` queued canvases now. Returns how many remain.
export function flushPaints(max = 1): number {
  for (let i = 0; i < max && queue.length; i++) queue.shift()!()
  return queue.length
}

// Inside the Canvas: paints one queued canvas per frame and keeps frames coming until none remain.
export function PaintPump() {
  const invalidate = useThree((s) => s.invalidate)
  useFrame(() => {
    if (queue.length) {
      flushPaints(1)
      invalidate()
    }
  })
  return null
}

// Textures painted at mount use the fallback font until the web fonts arrive. Call the given
// repaint function once they have, and request a frame.
export function useRepaintOnFonts(repaintAll: () => void): void {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    let live = true
    const f = fonts()
    // Ask for the faces the painter uses, so this resolves after they are usable on a canvas.
    Promise.all([document.fonts.load(`800 24px ${f.display}`), document.fonts.load(`400 16px ${f.body}`), document.fonts.ready])
      .catch(() => undefined)
      .then(() => {
        if (!live) return
        repaintAll()
        invalidate()
      })
    return () => {
      live = false
    }
  }, [repaintAll, invalidate])
}

export function repaint(tex: CanvasTexture, draw: Draw): void {
  const c = tex.image as HTMLCanvasElement
  const ctx = c.getContext('2d')
  if (!ctx) return
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, c.width, c.height)
  draw(ctx, c.width, c.height)
  tex.needsUpdate = true
}

// A navy glass card with a thin line border and the lit amber top edge, like the cards on the page.
function paperPanel(ctx: CanvasRenderingContext2D, w: number, h: number, inset = 0) {
  ctx.fillStyle = PALETTE.panel
  ctx.fillRect(inset, inset, w - inset * 2, h - inset * 2)
  ctx.strokeStyle = PALETTE.line
  ctx.lineWidth = 4
  ctx.strokeRect(inset + 2, inset + 2, w - inset * 2 - 4, h - inset * 2 - 4)
  ctx.fillStyle = PALETTE.amber
  ctx.fillRect(inset, inset, w - inset * 2, 6)
}

// Shrink a font until the text fits the width.
function fitFont(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, family: string, maxWidth: number, min = 20) {
  ctx.font = `${weight} ${size}px ${family}`
  while (ctx.measureText(text).width > maxWidth && size > min) {
    size -= 4
    ctx.font = `${weight} ${size}px ${family}`
  }
}

// A one-line sign: navy board, light text, cobalt rule.
export function drawSign(ctx: CanvasRenderingContext2D, w: number, h: number, text: string) {
  paperPanel(ctx, w, h)
  const f = fonts()
  ctx.fillStyle = PALETTE.cobalt
  ctx.fillRect(w * 0.08, h * 0.22, w * 0.84, 6)
  ctx.fillStyle = PALETTE.text
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  fitFont(ctx, text, 800, h * 0.42, f.display, w * 0.84)
  ctx.fillText(text, w / 2, h * 0.62)
}

// The garage roller door: ribbed navy metal with the name across the middle in amber.
export function drawDoor(ctx: CanvasRenderingContext2D, w: number, h: number, name: string) {
  ctx.fillStyle = PALETTE.panel2
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  for (let y = 0; y < h; y += h / 12) ctx.fillRect(0, y, w, 4)
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  for (let y = 8; y < h; y += h / 12) ctx.fillRect(0, y, w, 3)
  const f = fonts()
  ctx.fillStyle = PALETTE.amber
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  fitFont(ctx, name, 800, h * 0.2, f.display, w * 0.86)
  ctx.fillText(name, w / 2, h * 0.5)
}

// One chronology card: date in cobalt, provider, wrapped finding, page citation bottom right.
export function drawCard(ctx: CanvasRenderingContext2D, w: number, h: number, card: ChronologyCard) {
  paperPanel(ctx, w, h)
  const f = fonts()
  const pad = w * 0.08
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = PALETTE.amber
  ctx.font = `600 ${h * 0.09}px ${f.body}`
  ctx.fillText(card.date, pad, h * 0.19)
  ctx.fillStyle = PALETTE.text
  fitFont(ctx, card.provider, 800, h * 0.11, f.display, w - pad * 2)
  ctx.fillText(card.provider, pad, h * 0.34)
  ctx.font = `400 ${h * 0.085}px ${f.body}`
  wrapText(card.finding, 26).slice(0, 3).forEach((line, i) => ctx.fillText(line, pad, h * (0.48 + i * 0.11)))
  ctx.textAlign = 'right'
  ctx.fillStyle = PALETTE.muted
  ctx.font = `600 ${h * 0.09}px ${f.body}`
  ctx.fillText(card.page, w - pad, h * 0.88)
  ctx.fillStyle = PALETTE.cobalt
  ctx.fillRect(pad, h * 0.8, w * 0.18, 5)
}

// The closing card: a check mark and one big line.
export function drawLastCard(ctx: CanvasRenderingContext2D, w: number, h: number, text: string) {
  paperPanel(ctx, w, h)
  const f = fonts()
  ctx.fillStyle = PALETTE.amber
  ctx.beginPath()
  ctx.arc(w / 2, h * 0.36, h * 0.13, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = PALETTE.panel2
  ctx.lineWidth = h * 0.03
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(w / 2 - h * 0.06, h * 0.36)
  ctx.lineTo(w / 2 - h * 0.01, h * 0.42)
  ctx.lineTo(w / 2 + h * 0.07, h * 0.29)
  ctx.stroke()
  ctx.fillStyle = PALETTE.text
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `800 ${h * 0.12}px ${f.display}`
  wrapText(text, 14).forEach((line, i) => ctx.fillText(line, w / 2, h * (0.64 + i * 0.14)))
}

// The counter board: title, note, and rows of label plus value.
export function drawBoard(ctx: CanvasRenderingContext2D, w: number, h: number, title: string, note: string, rows: { label: string; value: string }[]) {
  paperPanel(ctx, w, h)
  const f = fonts()
  const pad = w * 0.06
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = PALETTE.text
  ctx.font = `800 ${h * 0.13}px ${f.display}`
  ctx.fillText(title, pad, h * 0.18)
  ctx.fillStyle = PALETTE.muted
  ctx.font = `400 ${h * 0.06}px ${f.body}`
  ctx.fillText(note, pad, h * 0.27)
  rows.forEach((r, i) => {
    const y = h * (0.45 + i * 0.18)
    ctx.fillStyle = PALETTE.panel2
    ctx.fillRect(pad, y - h * 0.11, w - pad * 2, h * 0.15)
    ctx.fillStyle = PALETTE.text
    ctx.textAlign = 'left'
    ctx.font = `500 ${h * 0.065}px ${f.body}`
    ctx.fillText(wrapText(r.label, 34)[0] ?? '', pad * 1.5, y)
    ctx.textAlign = 'right'
    ctx.fillStyle = PALETTE.amber
    ctx.font = `800 ${h * 0.11}px ${f.display}`
    ctx.fillText(r.value, w - pad * 1.5, y + h * 0.01)
  })
}

// A short label for the scanner arch: navy on amber.
export function drawArchLabel(ctx: CanvasRenderingContext2D, w: number, h: number, text: string) {
  ctx.fillStyle = PALETTE.amber
  ctx.fillRect(0, 0, w, h)
  const f = fonts()
  ctx.fillStyle = PALETTE.panel2
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  fitFont(ctx, text, 800, h * 0.5, f.display, w * 0.9)
  ctx.fillText(text, w / 2, h / 2)
}
