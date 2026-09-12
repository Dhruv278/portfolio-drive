'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { NARROW_QUERY } from '@/lib/track'

// The three rendered shorts. Posters render first; the videos are attached only once the block is
// near the viewport, and never on narrow screens, where the stylesheet hides the block anyway. The
// videos used to download 660 KB on every page load, half the page's transfer.
const CLIPS = [1, 2, 3] as const

const subscribe = (onChange: () => void) => {
  const mq = matchMedia(NARROW_QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}
const useNarrow = () => useSyncExternalStore(subscribe, () => matchMedia(NARROW_QUERY).matches, () => true)

export function Clips() {
  const narrow = useNarrow()
  const box = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    const el = box.current
    if (!el || narrow) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setNear(true)
      },
      { rootMargin: '400px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [narrow])

  if (narrow) return null
  return (
    <div ref={box} className="tp-clips" role="group" aria-label="Three shorts rendered by the pipeline, sound off">
      {CLIPS.map((n) =>
        near ? (
          <video key={n} src={`/media/short-${n}.mp4`} poster={`/media/short-${n}.webp`} muted loop autoPlay playsInline preload="none" />
        ) : (
          <Image key={n} src={`/media/short-${n}.webp`} alt="" width={270} height={480} sizes="180px" />
        ),
      )}
    </div>
  )
}
