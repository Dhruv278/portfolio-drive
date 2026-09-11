'use client'

import { useEffect, useRef } from 'react'

// Road dust over the hero: seventy points in three depth layers on a 2D canvas. They drift slowly and
// stream with scroll velocity. The loop runs only while the hero is on screen and the tab is visible,
// draws one static frame under reduced motion, and costs about one percent of a core.
const COUNT = 70

export function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let dpr = 1
    let raf = 0
    let visible = true
    let lastY = scrollY
    let vel = 0
    const pts = Array.from({ length: COUNT }, (_, i) => ({ x: Math.random(), y: Math.random(), z: 0.35 + (i % 3) * 0.32, t: Math.random() * Math.PI * 2 }))

    const size = () => {
      const r = canvas.getBoundingClientRect()
      dpr = Math.min(1.5, devicePixelRatio || 1)
      w = Math.max(1, Math.round(r.width))
      h = Math.max(1, Math.round(r.height))
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, w, h)
      for (const p of pts) {
        if (!reduced) {
          p.t += dt * 0.6
          p.y += (dt * 0.012 + vel * 0.0009) * p.z
          p.x += Math.sin(p.t) * dt * 0.004 * p.z
          if (p.y > 1.05) p.y -= 1.1
          if (p.y < -0.05) p.y += 1.1
          if (p.x > 1.05) p.x -= 1.1
          if (p.x < -0.05) p.x += 1.1
        }
        const r = 0.6 + p.z * 1.1
        const a = 0.25 + p.z * 0.45
        ctx.fillStyle = p.z > 0.9 ? `rgba(255, 181, 71, ${a * 0.9})` : `rgba(148, 163, 196, ${a})`
        ctx.beginPath()
        ctx.arc(p.x * w, p.y * h, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    let last = performance.now()
    const loop = (now: number) => {
      raf = 0
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const y = scrollY
      vel = vel * 0.9 + (y - lastY) * 0.1
      lastY = y
      draw(dt)
      if (visible && !reduced && document.visibilityState === 'visible') raf = requestAnimationFrame(loop)
    }
    const start = () => {
      if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(loop)
      }
    }

    size()
    draw(0)
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible) start()
    })
    io.observe(canvas)
    const onVis = () => {
      if (document.visibilityState === 'visible' && visible) start()
    }
    const onResize = () => {
      size()
      draw(0)
    }
    document.addEventListener('visibilitychange', onVis)
    addEventListener('resize', onResize)
    if (!reduced) start()
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      removeEventListener('resize', onResize)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return <canvas ref={ref} className="tp-stars" aria-hidden="true" />
}
