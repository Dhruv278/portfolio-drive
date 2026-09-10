'use client'

import { useEffect, useRef, useState } from 'react'
import { home, type Proof } from '@/content/profile'
import { counterValue } from '@/lib/pieceMath'

const DURATION_MS = 1600

// Three measured results on an ink band. The numbers count up once when the strip comes into view;
// with reduced motion they show their final values at once.
export function ProofStrip() {
  const ref = useRef<HTMLElement>(null)
  const [k, setK] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let started = false
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started) return
        started = true
        io.disconnect()
        if (reduced) {
          setK(1)
          return
        }
        const t0 = performance.now()
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / DURATION_MS)
          setK(p)
          if (p < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section ref={ref} className="proof" aria-label="Measured results">
      <ul>
        {home.proof.map((p) => (
          <li key={p.label}>
            <b className={p.text ? 'text' : undefined} data-testid="proof-value">
              {format(p, k)}
            </b>
            <span>{p.label}</span>
            <small>{p.source}</small>
          </li>
        ))}
      </ul>
    </section>
  )
}

function format(p: Proof, k: number): string {
  if (p.text) return p.text
  const from = p.from ?? 0
  const to = p.to ?? 0
  const suffix = p.suffix ?? ''
  const now = `${counterValue(from, to, k)}${suffix}`
  return from > 0 ? `${from}${suffix} to ${now}` : now
}
