'use client'

import { useEffect, useRef, useState } from 'react'
import { SceneMount } from '@/components/scene/SceneMount'
import { cancelIntro } from '@/components/scene/useDriveFrame'
import { useDrive } from '@/store/drive'

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
  cancelIdleCallback?: (id: number) => void
}

// The home page hero: the drive scene in hero mode, mounted after the text has painted, paused once
// the hero has scrolled out of view. Without WebGL the hero stays paper and type.
export function HeroScene() {
  const setMode = useDrive((s) => s.setMode)
  const setHeroInView = useDrive((s) => s.setHeroInView)
  const box = useRef<HTMLDivElement>(null)
  const [mount, setMount] = useState(false)

  useEffect(() => {
    setMode('hero')
    const w = window as IdleWindow
    let timer: ReturnType<typeof setTimeout> | undefined
    let idle: number | undefined
    const go = () => setMount(true)
    if (w.requestIdleCallback) idle = w.requestIdleCallback(go, { timeout: 1500 })
    else timer = setTimeout(go, 600)
    return () => {
      if (timer) clearTimeout(timer)
      if (idle !== undefined && w.cancelIdleCallback) w.cancelIdleCallback(idle)
    }
  }, [setMode])

  useEffect(() => {
    const el = box.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setHeroInView(e.isIntersecting), { threshold: 0.05 })
    io.observe(el)
    // Scrolling the page ends the intro, as it does on the drive.
    const onScroll = () => {
      if (scrollY > 40) cancelIntro()
    }
    addEventListener('scroll', onScroll, { passive: true })
    return () => {
      io.disconnect()
      removeEventListener('scroll', onScroll)
    }
  }, [setHeroInView])

  return (
    <div ref={box} className="hero-canvas" aria-hidden="true">
      {mount && <SceneMount quiet />}
    </div>
  )
}
