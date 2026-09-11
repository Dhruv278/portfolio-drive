'use client'

import { useEffect, useRef } from 'react'
import { barCheckpointLengths, barPath, checkpointAt, lengthForScroll, NARROW_QUERY } from '@/lib/track'

// The 2D track. On desktop an SVG road is drawn down the whole page through every checkpoint card
// and a top-down car follows it as the page scrolls. Below 1024 px the same SVG becomes a fixed
// route bar under the header: a horizontal road with ten dots, the car driving left to right, the
// travelled part lit amber, and a caption naming the checkpoint. Native scroll drives everything;
// nothing is hijacked. Geometry is rebuilt from the cards' positions on resize and on content growth.
type Props = { mainId: string; stopSelector: string; cardSelector: string }

const BAR_HEIGHT = 56

export function TrackScene({ mainId, stopSelector, cardSelector }: Props) {
  const svg = useRef<SVGSVGElement>(null)
  const road = useRef<SVGPathElement>(null)
  const kerb = useRef<SVGPathElement>(null)
  const dash = useRef<SVGPathElement>(null)
  const lit = useRef<SVGPathElement>(null)
  const cps = useRef<SVGGElement>(null)
  const bigs = useRef<SVGGElement>(null)
  const car = useRef<SVGGElement>(null)
  const pool = useRef<SVGCircleElement>(null)
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
    if (!main || !svg.current || !road.current) return
    const stops = [...main.querySelectorAll<HTMLElement>(stopSelector)]
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const narrowQuery = matchMedia(NARROW_QUERY)
    let narrow = narrowQuery.matches
    let L = 0
    let cpLen: number[] = []
    let cpScroll: number[] = []
    let heroEnd = 0
    let lead = 60
    let target = 0
    let current = 0
    let raf = 0
    let lastIdx = -1
    let lastTick = 0
    const ticked = new Set<Element>()
    const total = String(stops.length).padStart(2, '0')

    // Count a stat up once when its checkpoint turns on. Reduced motion jumps to the final value.
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

    // Desktop: the road winds down the page through every card's empty side.
    const layoutPage = () => {
      const W = innerWidth
      const H = document.documentElement.scrollHeight
      const s = svg.current!
      s.setAttribute('width', String(W))
      s.setAttribute('height', String(H))
      s.setAttribute('viewBox', `0 0 ${W} ${H}`)
      const points = stops.map((st) => {
        const r = cardOf(st).getBoundingClientRect()
        const y = r.top + scrollY + Math.min(r.height * 0.45, 260)
        const x = st.classList.contains('hero') || st.classList.contains('left') ? W * 0.78 : W * 0.22
        return { x, y }
      })
      const first = points[0]
      const last = points[points.length - 1]
      const pts = [{ x: first.x, y: -80 }, ...points, { x: last.x, y: last.y + 260 }]
      let d = `M${pts[0].x},${pts[0].y}`
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1]
        const b = pts[i]
        const k = (b.y - a.y) * 0.5
        d += ` C${a.x},${a.y + k} ${b.x},${b.y - k} ${b.x},${b.y}`
      }
      for (const p of [kerb.current, road.current, dash.current, lit.current]) p?.setAttribute('d', d)
      L = road.current!.getTotalLength()
      const N = 600
      const samples: DOMPoint[] = []
      for (let i = 0; i <= N; i++) samples.push(road.current!.getPointAtLength((i / N) * L))
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
        return (best / N) * L
      })
      cps.current!.innerHTML = points
        .map((p, i) => `<circle class="tp-cp" cx="${p.x}" cy="${p.y}" r="14" /><text class="tp-cpn" x="${p.x}" y="${p.y + 0.5}">${i + 1}</text>`)
        .join('')
      // Large faint numerals and names beside the road, filling the side the card leaves empty.
      bigs.current!.innerHTML = points
        .map((p, i) => {
          const name = stops[i].dataset.name ?? ''
          const anchor = p.x > W / 2 ? 'start' : 'end'
          const x = p.x > W / 2 ? p.x + 60 : p.x - 60
          return `<text class="tp-big" x="${x}" y="${p.y + 40}" text-anchor="${anchor}">${String(i + 1).padStart(2, '0')}</text><text class="tp-bigname" x="${x}" y="${p.y + 76}" text-anchor="${anchor}">${name}</text>`
        })
        .join('')
    }

    // Phones and tablets: the road is a fixed horizontal bar, checkpoints evenly spaced along it.
    const layoutBar = () => {
      const W = innerWidth
      const s = svg.current!
      s.setAttribute('width', String(W))
      s.setAttribute('height', String(BAR_HEIGHT))
      s.setAttribute('viewBox', `0 0 ${W} ${BAR_HEIGHT}`)
      const d = barPath(W, BAR_HEIGHT, 22)
      for (const p of [kerb.current, road.current, dash.current, lit.current]) p?.setAttribute('d', d)
      L = road.current!.getTotalLength()
      cpLen = barCheckpointLengths(L, stops.length, 0.03)
      cps.current!.innerHTML = cpLen
        .map((l) => {
          const p = road.current!.getPointAtLength(l)
          return `<circle class="tp-cp" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5" />`
        })
        .join('')
      bigs.current!.innerHTML = ''
    }

    const layout = () => {
      narrow = narrowQuery.matches
      svg.current!.classList.toggle('bar', narrow)
      if (narrow) layoutBar()
      else layoutPage()
      lit.current!.style.strokeDasharray = `${L}`
      // Scroll position at which each card sits in the middle of the window.
      cpScroll = stops.map((st, i) => {
        const r = cardOf(st).getBoundingClientRect()
        const centre = r.top + scrollY + r.height / 2 - innerHeight / 2
        return i === 0 ? 0 : Math.max(0, centre)
      })
      // The route bar takes over once the hero's own road has scrolled most of the way out.
      const heroRoad = document.querySelector<HTMLElement>('.tp-heroroad')
      const anchor = heroRoad ?? cardOf(stops[0])
      heroEnd = anchor.getBoundingClientRect().bottom + scrollY - innerHeight * 0.3
      // Wake a card a little before the car stops on its dot, but never so early that two dots flip.
      lead = cpLen.length > 1 ? Math.min(60, (cpLen[1] - cpLen[0]) * 0.45) : 60
      lastIdx = -1
      place(current)
    }

    // Light the checkpoints and cards up to idx, and update the readouts. Runs on scroll, not on frames.
    const setState = (idx: number, len: number) => {
      if (idx !== lastIdx) {
        lastIdx = idx
        stops.forEach((st, i) => {
          const on = i <= idx
          if (on && !st.classList.contains('on')) countUp(st)
          st.classList.toggle('on', on)
        })
        cps.current!.querySelectorAll('.tp-cp').forEach((c, i) => c.classList.toggle('on', i <= idx))
        const name = stops[idx].dataset.name ?? ''
        const count = `${String(idx + 1).padStart(2, '0')} / ${total}`
        if (odoStop.current) odoStop.current.textContent = name
        if (odoCp.current) odoCp.current.textContent = count
        if (capStop.current) capStop.current.textContent = name
        if (capCp.current) capCp.current.textContent = count
      }
      if (odoDist.current) odoDist.current.textContent = `${Math.round(len / 4).toLocaleString('en-US')} m`
      if (bar.current) bar.current.style.width = `${(len / Math.max(1, L)) * 100}%`
    }

    const place = (len: number) => {
      const r = road.current!
      const p = r.getPointAtLength(len)
      const q = r.getPointAtLength(Math.min(L, len + 2))
      const ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI + 90
      const scale = narrow ? (innerWidth < 640 ? 0.36 : 0.5) : 1.25
      car.current!.setAttribute('transform', `translate(${p.x.toFixed(1)},${p.y.toFixed(1)}) rotate(${ang.toFixed(1)}) scale(${scale})`)
      pool.current!.setAttribute('cx', p.x.toFixed(1))
      pool.current!.setAttribute('cy', p.y.toFixed(1))
      lit.current!.style.strokeDashoffset = `${L - len}`
    }

    const tick = (now: number) => {
      raf = 0
      const dt = lastTick ? Math.min(0.1, (now - lastTick) / 1000) : 1 / 60
      lastTick = now
      // Time-based easing: the same feel at any frame rate, and a big catch-up after a paused tab.
      const k = reduced ? 1 : 1 - Math.exp(-dt * 8)
      current += (target - current) * k
      if (Math.abs(target - current) < 0.5) current = target
      place(current)
      if (current !== target) raf = requestAnimationFrame(tick)
      else lastTick = 0
    }

    const onScroll = () => {
      const y = scrollY
      const len = lengthForScroll(y, cpScroll, cpLen)
      target = len
      setState(checkpointAt(len, cpLen, lead), len)
      hint.current?.classList.toggle('gone', y > 40)
      const shown = narrow && y > heroEnd
      svg.current!.classList.toggle('shown', shown)
      cap.current?.classList.toggle('shown', shown)
      barbg.current?.classList.toggle('shown', shown)
      document.querySelector('.tp-heroroad')?.classList.toggle('gone', shown)
      if (!raf) raf = requestAnimationFrame(tick)
    }

    const onResize = () => {
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
      ro.disconnect()
      removeEventListener('resize', onResize)
      narrowQuery.removeEventListener('change', onResize)
      removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [mainId, stopSelector, cardSelector])

  return (
    <>
      <svg ref={svg} className="tp-track" aria-hidden="true" data-testid="track-road">
        <defs>
          <radialGradient id="tp-pool">
            <stop offset="0" stopColor="#ffb547" stopOpacity="0.22" />
            <stop offset="1" stopColor="#ffb547" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="tp-beam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffb547" stopOpacity="0.55" />
            <stop offset="1" stopColor="#ffb547" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g ref={bigs} />
        <path ref={kerb} className="tp-kerb" d="" />
        <path ref={road} className="tp-road" d="" />
        <path ref={dash} className="tp-dash" d="" />
        <path ref={lit} className="tp-lit" d="" />
        <g ref={cps} />
        <circle ref={pool} className="tp-pool" r="150" />
        <g ref={car} className="tp-car" data-testid="track-car">
          <polygon className="beam" points="-26,-150 26,-150 9,-22 -9,-22" />
          <rect className="tyre" x="-15" y="-18" width="6" height="12" rx="2" />
          <rect className="tyre" x="9" y="-18" width="6" height="12" rx="2" />
          <rect className="tyre" x="-15" y="8" width="6" height="12" rx="2" />
          <rect className="tyre" x="9" y="8" width="6" height="12" rx="2" />
          <rect className="body" x="-13" y="-24" width="26" height="48" rx="7" />
          <rect className="roof" x="-9" y="-6" width="18" height="18" rx="3" />
          <rect className="glass" x="-9" y="-13" width="18" height="6" rx="2" />
          <circle className="lamp" cx="-8" cy="-22" r="2.4" />
          <circle className="lamp" cx="8" cy="-22" r="2.4" />
          <rect className="tail" x="-11" y="21" width="6" height="2.5" />
          <rect className="tail" x="5" y="21" width="6" height="2.5" />
        </g>
      </svg>
      <div ref={barbg} className="tp-barbg" aria-hidden="true" />
      <div ref={cap} className="tp-barcap" aria-live="polite" data-testid="track-caption">
        <span>
          checkpoint <b ref={capCp}>01 / 00</b>
        </span>
        <b ref={capStop}>Start</b>
      </div>
      <div className="tp-hud bottom">
        <div className="tp-odo" aria-live="polite" data-testid="track-odometer">
          <div>
            <small>checkpoint</small>
            <b ref={odoCp}>01 / 00</b>
          </div>
          <div>
            <small>stop</small>
            <b ref={odoStop}>Start</b>
          </div>
          <div>
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
