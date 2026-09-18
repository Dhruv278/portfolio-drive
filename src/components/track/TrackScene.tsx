'use client'

import { useEffect, useRef } from 'react'
import { heroArtMarkup } from '@/lib/heroArt'
import { barCheckpointLengths, barPath, checkpointAt, lengthForScroll, NARROW_QUERY, outlinePath, perspective, polylinePath, roadWidthAt, type Sample } from '@/lib/track'
import { CarGlyph } from './CarGlyph'

// The 2D track. On desktop an SVG road enters from a horizon in the hero landscape, widens to full
// size at Start and winds down the whole page through every checkpoint card, while a top-down car
// follows it as the page scrolls. Below 1024 px the same road becomes a fixed route bar under the
// header: a horizontal road with ten dots, the car driving left to right, the travelled part lit,
// and a caption naming the checkpoint. Native scroll drives everything; nothing is hijacked. The
// one exception is the arrival on load, when the car drives in from the horizon once.
//
// Nothing page-tall is repainted per frame. The road SVG is static. The lit edges are a second static
// SVG inside a box whose height (or width, on the bar) follows the car: the box clips a layer that
// was rasterised once. The car is a small SVG moved with a CSS transform, so a frame that moves it is
// compositor work only. Filters and dash offsets on page-tall paths were the first version of this
// and cost more than everything else on the page.
type Props = { mainId: string; stopSelector: string; cardSelector: string }

const BAR_HEIGHT = 56
const ROAD_MIN = 6 // road width at the horizon
const ROAD_MAX = 62 // road width from Start onward
const PAGE_SAMPLES = 600
const BAR_SAMPLES = 160
// A card wakes once this much of the viewport height of it is inside the frame.
const WAKE_FRACTION = 0.04
// The car SVG's box: the glyph is 44 by 96 units, the beams reach 210 ahead, the pool is 150 around.
const CAR_BOX = { w: 400, h: 520, ox: 200, oy: 260 }

export function TrackScene({ mainId, stopSelector, cardSelector }: Props) {
  const art = useRef<SVGSVGElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const litBox = useRef<HTMLDivElement>(null)
  const litSvg = useRef<SVGSVGElement>(null)
  const carSvg = useRef<SVGSVGElement>(null)
  const centre = useRef<SVGPathElement>(null)
  const road = useRef<SVGPathElement>(null)
  const kerb = useRef<SVGPathElement>(null)
  const dash = useRef<SVGPathElement>(null)
  const edgeL = useRef<SVGPathElement>(null)
  const edgeR = useRef<SVGPathElement>(null)
  const litL = useRef<SVGPathElement>(null)
  const litR = useRef<SVGPathElement>(null)
  const glowL = useRef<SVGPathElement>(null)
  const glowR = useRef<SVGPathElement>(null)
  const cps = useRef<SVGGElement>(null)
  const bigs = useRef<SVGGElement>(null)
  const streaks = useRef<SVGGElement>(null)
  const odo = useRef<HTMLDivElement>(null)
  const odoStop = useRef<HTMLElement>(null)
  const odoCp = useRef<HTMLElement>(null)
  const odoDist = useRef<HTMLElement>(null)
  const bar = useRef<HTMLElement>(null)
  const hint = useRef<HTMLDivElement>(null)
  const cap = useRef<HTMLDivElement>(null)
  const barbg = useRef<HTMLDivElement>(null)
  const capCp = useRef<HTMLElement>(null)
  const capStop = useRef<HTMLElement>(null)

  useEffect(() => {
    const main = document.getElementById(mainId)
    if (!main || !svg.current || !litBox.current || !litSvg.current || !carSvg.current || !centre.current) return
    const stops = [...main.querySelectorAll<HTMLElement>(stopSelector)]
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const narrowQuery = matchMedia(NARROW_QUERY)
    let narrow = narrowQuery.matches
    let W = 0
    let H = 0
    let L = 0
    let heroLen = 1
    let cpLen: number[] = []
    let cpScroll: number[] = []
    let wakeY: number[] = []
    let heroEnd = 0
    let lead = 60
    let target = 0
    let current = 0
    let prevLen = 0
    let arrived = false
    let raf = 0
    let lastIdx = -1
    let lastWake = -1
    let lastTick = 0
    let alive = true
    const ticked = new Set<Element>()
    const total = String(stops.length).padStart(2, '0')
    const barItems = () => [svg.current!, litBox.current!, carSvg.current!]

    // Count a stat up once when its card wakes. Reduced motion jumps to the final value.
    const countUp = (stop: HTMLElement) => {
      stop.querySelectorAll<HTMLElement>('.tp-nums b[data-to]').forEach((el) => {
        if (ticked.has(el)) return
        ticked.add(el)
        const from = Number(el.dataset.from ?? 0)
        const to = Number(el.dataset.to ?? 0)
        const suffix = el.dataset.suffix ?? ''
        const fmt = (v: number) => (from ? `${from}${suffix} to ${Math.round(v)}${suffix}` : `${Math.round(v).toLocaleString('en-US')}${suffix}`)
        if (reduced) {
          el.textContent = fmt(to)
          return
        }
        const t0 = performance.now()
        const dur = 1400
        const step = (now: number) => {
          if (!alive) return
          const k = Math.min(1, (now - t0) / dur)
          const e = 1 - Math.pow(1 - k, 3)
          el.textContent = fmt(from + (to - from) * e)
          if (k < 1) requestAnimationFrame(step)
        }
        el.textContent = fmt(from)
        requestAnimationFrame(step)
      })
    }

    const cardOf = (st: HTMLElement) => st.querySelector<HTMLElement>(cardSelector) ?? st

    const sizeSvgs = (w: number, h: number) => {
      for (const s of [svg.current!, litSvg.current!]) {
        s.setAttribute('width', String(w))
        s.setAttribute('height', String(h))
        s.setAttribute('viewBox', `0 0 ${w} ${h}`)
      }
    }

    // Sample the centre line so the road outline, edges and dashes follow it.
    const sampleCentre = (count: number): Sample[] => {
      const out: Sample[] = []
      for (let i = 0; i <= count; i++) {
        const p = centre.current!.getPointAtLength((i / count) * L)
        out.push({ x: p.x, y: p.y, l: (i / count) * L })
      }
      return out
    }

    // Write the road, kerb, dashes, faint edges and lit edges from the samples.
    const drawRoad = (samples: Sample[], halfWidth: (l: number) => number, kerbHalfWidth: (l: number) => number, dashFrom: number) => {
      const roadOut = outlinePath(samples, halfWidth)
      const kerbOut = outlinePath(samples, kerbHalfWidth)
      kerb.current!.setAttribute('d', kerbOut.d)
      road.current!.setAttribute('d', roadOut.d)
      const dL = polylinePath(roadOut.left)
      const dR = polylinePath(roadOut.right)
      edgeL.current!.setAttribute('d', dL)
      edgeR.current!.setAttribute('d', dR)
      for (const p of [litL.current!, glowL.current!]) p.setAttribute('d', dL)
      for (const p of [litR.current!, glowR.current!]) p.setAttribute('d', dR)
      const i0 = Math.max(0, samples.findIndex((sm) => sm.l >= dashFrom))
      dash.current!.setAttribute('d', polylinePath(samples.slice(i0).map((sm) => `${sm.x.toFixed(1)},${sm.y.toFixed(1)}`)))
    }

    // Desktop: the road enters from a horizon in the hero art, widens to full size at Start, then
    // winds down the page through every card's empty side.
    const layoutPage = () => {
      W = innerWidth
      H = document.documentElement.scrollHeight
      sizeSvgs(W, H)
      const heroRect = stops[0].getBoundingClientRect()
      const heroTop = heroRect.top + scrollY
      const heroH = heroRect.height
      const horizonY = heroTop + 150
      const points = stops.map((st, i) => {
        const r = cardOf(st).getBoundingClientRect()
        const y = r.top + scrollY + (i === 0 ? r.height * 0.6 : Math.min(r.height * 0.45, 260))
        const x = st.classList.contains('hero') || st.classList.contains('left') ? W * 0.78 : W * 0.22
        return { x, y }
      })
      const start = points[0]
      const last = points[points.length - 1]
      const pts = [{ x: W * 0.58, y: horizonY }, { x: W * 0.7, y: horizonY + (start.y - horizonY) * 0.55 }, ...points, { x: last.x, y: last.y + 260 }]
      let d = `M${pts[0].x},${pts[0].y}`
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1]
        const b = pts[i]
        const k = (b.y - a.y) * 0.5
        d += ` C${a.x},${a.y + k} ${b.x},${b.y - k} ${b.x},${b.y}`
      }
      centre.current!.setAttribute('d', d)
      L = centre.current!.getTotalLength()
      const samples = sampleCentre(PAGE_SAMPLES)
      cpLen = points.map((p) => {
        let best = 0
        let bd = Infinity
        samples.forEach((sm, i) => {
          const dd = (sm.x - p.x) ** 2 + (sm.y - p.y) ** 2
          if (dd < bd) {
            bd = dd
            best = i
          }
        })
        return samples[best].l
      })
      heroLen = Math.max(1, cpLen[0])
      drawRoad(
        samples,
        (l) => roadWidthAt(l, heroLen, ROAD_MIN, ROAD_MAX) / 2,
        (l) => roadWidthAt(l, heroLen, ROAD_MIN, ROAD_MAX) / 2 + 5 * perspective(l, heroLen),
        heroLen * 0.4,
      )
      // A dot on the road at every checkpoint, plus the landmark beside the road: a node on the
      // outer edge, a connector, a numeral and a label, on the side the card leaves empty.
      cps.current!.innerHTML = points
        .map((p, i) => {
          const dir = p.x > W / 2 ? 1 : -1
          const nx = p.x + dir * (roadWidthAt(cpLen[i], heroLen, ROAD_MIN, ROAD_MAX) / 2 + 12)
          return `<circle class="tp-cp" data-i="${i}" cx="${p.x}" cy="${p.y}" r="7" /><line class="tp-link" data-i="${i}" x1="${nx.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${(p.x + dir * 66).toFixed(1)}" y2="${p.y.toFixed(1)}" /><circle class="tp-node" data-i="${i}" cx="${nx.toFixed(1)}" cy="${p.y.toFixed(1)}" r="6" />`
        })
        .join('')
      bigs.current!.innerHTML = points
        .map((p, i) => {
          const name = stops[i].dataset.name ?? ''
          const right = p.x > W / 2
          const dir = right ? 1 : -1
          const x = p.x + dir * 66
          const anchor = right ? 'start' : 'end'
          return `<text class="tp-big" data-i="${i}" x="${x.toFixed(1)}" y="${(p.y + 46).toFixed(1)}" text-anchor="${anchor}">${String(i + 1).padStart(2, '0')}</text><text class="tp-bigname" data-i="${i}" x="${(x + dir * 6).toFixed(1)}" y="${(p.y + 82).toFixed(1)}" text-anchor="${anchor}">${name}</text>`
        })
        .join('')
      const a = art.current!
      a.setAttribute('width', String(W))
      a.setAttribute('height', String(heroTop + heroH))
      a.setAttribute('viewBox', `0 0 ${W} ${heroTop + heroH}`)
      a.innerHTML = heroArtMarkup(W, heroTop, heroH, horizonY)
    }

    // Phones and tablets: the road is a fixed horizontal bar, checkpoints evenly spaced along it.
    const layoutBar = () => {
      W = innerWidth
      H = BAR_HEIGHT
      sizeSvgs(W, H)
      centre.current!.setAttribute('d', barPath(W, BAR_HEIGHT, 22))
      L = centre.current!.getTotalLength()
      heroLen = 0
      drawRoad(sampleCentre(BAR_SAMPLES), () => 7, () => 8.5, 0)
      cpLen = barCheckpointLengths(L, stops.length, 0.03)
      cps.current!.innerHTML = cpLen
        .map((l, i) => {
          const p = centre.current!.getPointAtLength(l)
          return `<circle class="tp-cp" data-i="${i}" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5" />`
        })
        .join('')
      bigs.current!.innerHTML = ''
      art.current!.innerHTML = ''
    }

    const layout = () => {
      narrow = narrowQuery.matches
      for (const el of barItems()) el.classList.toggle('bar', narrow)
      if (narrow) layoutBar()
      else layoutPage()
      // Scroll position at which each card sits in the middle of the window, and the position at
      // which a slice of it has entered the frame.
      cpScroll = stops.map((st, i) => {
        const r = cardOf(st).getBoundingClientRect()
        const centreY = r.top + scrollY + r.height / 2 - innerHeight / 2
        return i === 0 ? 0 : Math.max(0, centreY)
      })
      wakeY = stops.map((st, i) => {
        const r = cardOf(st).getBoundingClientRect()
        return i === 0 ? 0 : Math.max(0, r.top + scrollY - innerHeight * (1 - WAKE_FRACTION))
      })
      // The route bar takes over once the hero's own road has scrolled most of the way out.
      const heroRoad = document.querySelector<HTMLElement>('.tp-heroroad')
      const anchor = heroRoad ?? cardOf(stops[0])
      heroEnd = anchor.getBoundingClientRect().bottom + scrollY - innerHeight * 0.3
      // Flip the dot a little before the car stops on it, but never so early that two dots flip.
      lead = cpLen.length > 1 ? Math.min(60, (cpLen[1] - cpLen[0]) * 0.45) : 60
      lastIdx = -1
      lastWake = -1
      // On desktop the car arrives from the horizon once, on load. Reduced motion, and the bar
      // layout, start parked at Start.
      if (narrow || reduced || arrived) current = Math.max(current, cpLen[0])
      place(current)
    }

    // Light the checkpoints up to idx and update the readouts. Runs on scroll, not on frames.
    const setState = (idx: number, len: number) => {
      if (idx !== lastIdx) {
        lastIdx = idx
        svg.current!.querySelectorAll<SVGElement>('[data-i]').forEach((c) => c.classList.toggle('on', Number(c.dataset.i) <= idx))
        const name = stops[idx].dataset.name ?? ''
        const count = `${String(idx + 1).padStart(2, '0')} / ${total}`
        if (odoStop.current) odoStop.current.textContent = name
        if (odoCp.current) odoCp.current.textContent = count
        if (capStop.current) capStop.current.textContent = name
        if (capCp.current) capCp.current.textContent = count
      }
      const from = Math.max(0, len - heroLen)
      if (odoDist.current) odoDist.current.textContent = `${Math.round(from / 4).toLocaleString('en-US')} m`
      if (bar.current) bar.current.style.width = `${(from / Math.max(1, L - heroLen)) * 100}%`
    }

    // Wake every card whose top slice is inside the frame. Tall cards used to stay faded until the
    // car reached their centre, which for a long card is well after the reader has started it.
    const wake = (y: number) => {
      let idx = 0
      wakeY.forEach((wy, i) => {
        if (y >= wy) idx = i
      })
      if (idx === lastWake) return
      lastWake = idx
      stops.forEach((st, i) => {
        const on = i <= idx
        if (on && !st.classList.contains('on')) countUp(st)
        st.classList.toggle('on', on)
      })
    }

    const place = (len: number) => {
      const r = centre.current!
      const p = r.getPointAtLength(len)
      const q = r.getPointAtLength(Math.min(L, len + 2))
      const ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI + 90
      const base = narrow ? (innerWidth < 640 ? 0.19 : 0.26) : 0.92
      const scale = base * (narrow ? 1 : 0.16 + 0.84 * perspective(len, heroLen))
      // The car is a small SVG moved by a CSS transform: no repaint of anything page-sized.
      carSvg.current!.style.transform = `translate3d(${(p.x - CAR_BOX.ox).toFixed(1)}px,${(p.y - CAR_BOX.oy).toFixed(1)}px,0) rotate(${ang.toFixed(1)}deg) scale(${scale.toFixed(3)})`
      // The travelled part of the road is everything above the car on the page (the road only ever
      // runs downward) and everything left of it on the bar. The box clips a layer drawn once.
      const b = litBox.current!
      if (narrow) {
        b.style.width = `${p.x.toFixed(1)}px`
        b.style.height = `${H}px`
      } else {
        b.style.width = `${W}px`
        b.style.height = `${p.y.toFixed(1)}px`
      }
    }

    const tick = (now: number) => {
      raf = 0
      if (!alive || !svg.current) return
      const dt = lastTick ? Math.min(0.1, (now - lastTick) / 1000) : 1 / 60
      lastTick = now
      // Time-based easing: the same feel at any frame rate, and a big catch-up after a paused tab.
      // The arrival from the horizon is slower than the scroll response.
      const k = reduced ? 1 : 1 - Math.exp(-dt * (arrived ? 8 : 2.4))
      current += (target - current) * k
      if (Math.abs(target - current) < 0.5) {
        current = target
        arrived = true
      }
      const speed = Math.abs(current - prevLen) / dt
      prevLen = current
      place(current)
      // Tail lights streak with speed, a cheap sense of motion.
      const sl = reduced || narrow ? 0 : Math.min(1, speed / 1500)
      streaks.current!.setAttribute('opacity', (sl * 0.9).toFixed(2))
      streaks.current!.setAttribute('transform', `translate(0,44) scale(1,${(0.25 + sl * 1.5).toFixed(2)}) translate(0,-44)`)
      if (current !== target) raf = requestAnimationFrame(tick)
      else lastTick = 0
    }

    const onScroll = () => {
      if (!alive || !svg.current) return
      const y = scrollY
      const len = lengthForScroll(y, cpScroll, cpLen)
      target = len
      setState(checkpointAt(len, cpLen, lead), len)
      wake(y)
      hint.current?.classList.toggle('gone', y > 40)
      odo.current?.classList.toggle('shown', y > 40)
      const shown = narrow && y > heroEnd
      for (const el of barItems()) el.classList.toggle('shown', shown)
      cap.current?.classList.toggle('shown', shown)
      barbg.current?.classList.toggle('shown', shown)
      document.querySelector('.tp-heroroad')?.classList.toggle('gone', shown)
      if (!raf) raf = requestAnimationFrame(tick)
    }

    const onResize = () => {
      if (!alive || !svg.current) return
      layout()
      onScroll()
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(main)
    addEventListener('resize', onResize)
    narrowQuery.addEventListener('change', onResize)
    addEventListener('scroll', onScroll, { passive: true })
    document.fonts.ready.then(onResize)
    onResize()
    return () => {
      alive = false
      ro.disconnect()
      removeEventListener('resize', onResize)
      narrowQuery.removeEventListener('change', onResize)
      removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [mainId, stopSelector, cardSelector])

  return (
    <>
      <svg ref={art} className="tp-art" aria-hidden="true" />
      <svg ref={svg} className="tp-track" aria-hidden="true" data-testid="track-road">
        <defs>
          <linearGradient id="tp-num" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#d6ed83" stopOpacity="0.95" />
            <stop offset="1" stopColor="#a2c9d3" stopOpacity="0.85" />
          </linearGradient>
        </defs>
        <path ref={centre} fill="none" stroke="none" />
        <g ref={bigs} />
        <path ref={kerb} className="tp-kerb" d="" />
        <path ref={road} className="tp-road" d="" />
        <path ref={dash} className="tp-dash" d="" />
        <path ref={edgeL} className="tp-edge l" d="" />
        <path ref={edgeR} className="tp-edge r" d="" />
        <g ref={cps} />
      </svg>
      <div ref={litBox} className="tp-litbox" aria-hidden="true">
        <svg ref={litSvg} className="tp-litsvg">
          <path ref={glowL} className="tp-lit-glow l" d="" />
          <path ref={glowR} className="tp-lit-glow r" d="" />
          <path ref={litL} className="tp-lit l" d="" />
          <path ref={litR} className="tp-lit r" d="" />
        </svg>
      </div>
      <svg ref={carSvg} className="tp-carsvg" viewBox={`${-CAR_BOX.ox} ${-CAR_BOX.oy} ${CAR_BOX.w} ${CAR_BOX.h}`} width={CAR_BOX.w} height={CAR_BOX.h} aria-hidden="true">
        <defs>
          <radialGradient id="tp-pool">
            <stop offset="0" stopColor="#d6ed83" stopOpacity="0.2" />
            <stop offset="1" stopColor="#d6ed83" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="tp-beam" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#f3f8d9" stopOpacity="0.5" />
            <stop offset="1" stopColor="#f3f8d9" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="tp-streak" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ff6a52" stopOpacity="0.95" />
            <stop offset="1" stopColor="#ff6a52" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle className="tp-pool" r="150" />
        <g className="tp-car" data-testid="track-car">
          <g className="tp-beams">
            <polygon className="beam" points="-18,-44 -8,-44 6,-210 -56,-210" />
            <polygon className="beam" points="8,-44 18,-44 56,-210 -6,-210" />
          </g>
          <g ref={streaks} className="tp-streaks">
            <rect x="-19.5" y="44" width="11" height="60" />
            <rect x="8.5" y="44" width="11" height="60" />
          </g>
          <CarGlyph id="tp-track-car" />
        </g>
      </svg>
      <div ref={barbg} className="tp-barbg" aria-hidden="true" />
      <div ref={cap} className="tp-barcap" data-testid="track-caption">
        <span>
          checkpoint <b ref={capCp}>01 / 00</b>
        </span>
        <b ref={capStop} aria-live="polite">
          Start
        </b>
      </div>
      <div className="tp-hud bottom">
        <div ref={odo} className="tp-odo" data-testid="track-odometer">
          <div>
            <small>checkpoint</small>
            <b ref={odoCp}>01 / 00</b>
          </div>
          <div>
            <small>stop</small>
            <b ref={odoStop} aria-live="polite">
              Start
            </b>
          </div>
          <div aria-hidden="true">
            <small>distance</small>
            <b ref={odoDist}>0 m</b>
          </div>
          <div className="bar">
            <i ref={bar} />
          </div>
        </div>
        <div ref={hint} className="tp-hint">
          Scroll to drive
        </div>
      </div>
    </>
  )
}
