'use client'

import { useEffect, useRef } from 'react'

// The 2D track: an SVG road drawn through every checkpoint card, a top-down car that follows it as
// the page scrolls, a light pool and headlight beam, the travelled road lit in amber, and a
// telemetry readout. Native scroll drives everything; nothing is hijacked. Geometry is rebuilt from
// the cards' positions on resize and on content growth, so it fits any viewport.
type Props = { mainId: string; stopSelector: string; cardSelector: string }

export function TrackScene({ mainId, stopSelector, cardSelector }: Props) {
  const svg = useRef<SVGSVGElement>(null)
  const road = useRef<SVGPathElement>(null)
  const kerb = useRef<SVGPathElement>(null)
  const dash = useRef<SVGPathElement>(null)
  const lit = useRef<SVGPathElement>(null)
  const cps = useRef<SVGGElement>(null)
  const car = useRef<SVGGElement>(null)
  const pool = useRef<SVGCircleElement>(null)
  const odoStop = useRef<HTMLElement>(null)
  const odoCp = useRef<HTMLElement>(null)
  const odoDist = useRef<HTMLElement>(null)
  const bar = useRef<HTMLElement>(null)
  const hint = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const main = document.getElementById(mainId)
    if (!main || !svg.current || !road.current) return
    const stops = [...main.querySelectorAll<HTMLElement>(stopSelector)]
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    let L = 0
    let cpLen: number[] = []
    let cpScroll: number[] = []
    let target = 0
    let current = 0
    let raf = 0
    let lastIdx = -1
    const ticked = new Set<Element>()

    // Count a stat up once when its checkpoint turns on. Reduced motion jumps to the final value.
    const tickNumbers = (stop: HTMLElement) => {
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

    const layout = () => {
      const W = innerWidth
      const H = document.documentElement.scrollHeight
      const s = svg.current!
      s.setAttribute('width', String(W))
      s.setAttribute('height', String(H))
      s.setAttribute('viewBox', `0 0 ${W} ${H}`)
      const narrow = W < 760
      const points = stops.map((st, i) => {
        const card = st.querySelector<HTMLElement>(cardSelector) ?? st
        const r = card.getBoundingClientRect()
        const y = r.top + scrollY + Math.min(r.height * 0.45, 260)
        let x: number
        if (narrow) x = i % 2 ? W * 0.14 : W * 0.86
        else if (st.classList.contains('hero')) x = W * 0.78
        else x = st.classList.contains('left') ? W * 0.78 : W * 0.22
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
      lit.current!.style.strokeDasharray = `${L}`
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
      cpScroll = stops.map((st, i) => {
        const card = st.querySelector<HTMLElement>(cardSelector) ?? st
        const r = card.getBoundingClientRect()
        const centre = r.top + scrollY + r.height / 2 - innerHeight / 2
        return i === 0 ? 0 : Math.max(0, centre)
      })
      cps.current!.innerHTML = points
        .map((p, i) => `<circle class="tp-cp" cx="${p.x}" cy="${p.y}" r="14" /><text class="tp-cpn" x="${p.x}" y="${p.y + 0.5}">${i + 1}</text>`)
        .join('')
      place(current)
    }

    const place = (len: number) => {
      const r = road.current!
      const p = r.getPointAtLength(len)
      const q = r.getPointAtLength(Math.min(L, len + 2))
      const ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI + 90
      const scale = innerWidth < 760 ? 0.85 : 1.25
      car.current!.setAttribute('transform', `translate(${p.x.toFixed(1)},${p.y.toFixed(1)}) rotate(${ang.toFixed(1)}) scale(${scale})`)
      pool.current!.setAttribute('cx', p.x.toFixed(1))
      pool.current!.setAttribute('cy', p.y.toFixed(1))
      lit.current!.style.strokeDashoffset = `${L - len}`
      let idx = 0
      cpLen.forEach((cl, i) => {
        if (len >= cl - 60) idx = i
      })
      if (idx !== lastIdx) {
        lastIdx = idx
        stops.forEach((st, i) => {
          const on = i <= idx
          if (on && !st.classList.contains('on')) tickNumbers(st)
          st.classList.toggle('on', on)
        })
        cps.current!.querySelectorAll('.tp-cp').forEach((c, i) => c.classList.toggle('on', i <= idx))
        if (odoStop.current) odoStop.current.textContent = stops[idx].dataset.name ?? ''
        if (odoCp.current) odoCp.current.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(stops.length).padStart(2, '0')}`
      }
      if (odoDist.current) odoDist.current.textContent = `${Math.round(len / 4).toLocaleString('en-US')} m`
      if (bar.current) bar.current.style.width = `${(len / L) * 100}%`
    }

    const tick = () => {
      raf = 0
      const k = reduced ? 1 : 0.12
      current += (target - current) * k
      if (Math.abs(target - current) < 0.5) current = target
      place(current)
      if (current !== target) raf = requestAnimationFrame(tick)
    }

    const onScroll = () => {
      const y = scrollY
      let len = cpLen[0] ?? 0
      for (let i = 1; i < cpScroll.length; i++) {
        const a = cpScroll[i - 1]
        const b = cpScroll[i]
        if (y >= b) {
          len = cpLen[i]
          continue
        }
        if (y > a) len = cpLen[i - 1] + (cpLen[i] - cpLen[i - 1]) * ((y - a) / Math.max(1, b - a))
        break
      }
      target = len
      hint.current?.classList.toggle('gone', y > 40)
      if (!raf) raf = requestAnimationFrame(tick)
    }

    const onResize = () => {
      layout()
      onScroll()
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(main)
    addEventListener('resize', onResize)
    addEventListener('scroll', onScroll, { passive: true })
    document.fonts.ready.then(onResize)
    onResize()
    return () => {
      ro.disconnect()
      removeEventListener('resize', onResize)
      removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [mainId, stopSelector, cardSelector])

  return (
    <>
      <svg ref={svg} className="tp-track" aria-hidden="true">
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
        <path ref={kerb} className="tp-kerb" d="" />
        <path ref={road} className="tp-road" d="" />
        <path ref={dash} className="tp-dash" d="" />
        <path ref={lit} className="tp-lit" d="" />
        <g ref={cps} />
        <circle ref={pool} className="tp-pool" r="150" />
        <g ref={car} className="tp-car">
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
