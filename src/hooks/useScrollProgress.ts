'use client'

import { useEffect } from 'react'
import { currentStop, measureZones } from '@/lib/scroll'
import { useDrive } from '@/store/drive'

// Maps window scroll to the store on every frame. The 3D scene reads the store with getState()
// inside useFrame, so nothing here causes per-frame React renders in the canvas.
export function useScrollProgress(stopSelector = 'section.stop', endSelector = '#end') {
  useEffect(() => {
    const { setScroll, setZones, setReducedMotion } = useDrive.getState()
    const mq = matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onMq = () => setReducedMotion(mq.matches)
    mq.addEventListener('change', onMq)

    let maxScroll = 1
    const measure = () => {
      const sections = [...document.querySelectorAll<HTMLElement>(stopSelector)].map((el) => ({ top: el.offsetTop, height: el.offsetHeight }))
      const end = document.querySelector<HTMLElement>(endSelector)
      maxScroll = Math.max(1, (end ? end.offsetTop : document.body.scrollHeight) - innerHeight * 0.35)
      setZones(measureZones(sections, maxScroll))
    }
    measure()

    let raf = 0
    const tick = () => {
      raf = 0
      const s = Math.min(1, Math.max(0, scrollY / maxScroll))
      setScroll(s, currentStop(s, useDrive.getState().zones))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }
    const onResize = () => {
      measure()
      onScroll()
    }
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onResize)
    tick()
    return () => {
      removeEventListener('scroll', onScroll)
      removeEventListener('resize', onResize)
      mq.removeEventListener('change', onMq)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [stopSelector, endSelector])
}
