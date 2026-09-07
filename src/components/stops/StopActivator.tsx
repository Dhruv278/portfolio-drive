'use client'

import { useEffect } from 'react'
import { useDrive } from '@/store/drive'

// Marks the current stop's section as active so CSS can play the reveal. The sections themselves
// stay server-rendered and fully visible without JavaScript: only sections that carry
// data-active="false" are held back, and that attribute exists only once this has run.
export function StopActivator() {
  const stopIndex = useDrive((s) => s.stopIndex)
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>('section.stop')
    sections.forEach((el, i) => {
      // Once a stop has been seen it stays revealed. Scrolling back up should not hide content.
      const seen = el.dataset.active === 'true'
      el.dataset.active = seen || i <= stopIndex ? 'true' : 'false'
    })
  }, [stopIndex])
  return null
}
