'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useDrive } from '@/store/drive'
import { Fallback } from './Fallback'

// The 3D layer is loaded only on the client, after hydration, and only when WebGL 2 is available.
// Three.js r163 and later need WebGL 2, so a WebGL 1-only browser (Safari before 15, old Android
// WebViews) gets the plain content and the fallback note instead of a crash.
// `?scene=off` skips it entirely (used by the end-to-end tests and handy on weak machines).
const Scene = dynamic(() => import('./Scene').then((m) => m.Scene), { ssr: false, loading: () => null })

function probeWebgl2(): boolean {
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2', { failIfMajorPerformanceCaveat: false })
    if (!gl) return false
    const lose = gl.getExtension('WEBGL_lose_context')
    lose?.loseContext()
    return true
  } catch {
    return false
  }
}

function sceneSwitchedOff(): boolean {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('scene') === 'off'
}

export function SceneMount() {
  const webglOk = useDrive((s) => s.webglOk)
  const setWebglOk = useDrive((s) => s.setWebglOk)
  const [off] = useState(sceneSwitchedOff)

  useEffect(() => {
    if (!off) setWebglOk(probeWebgl2())
  }, [off, setWebglOk])

  if (off || webglOk === null) return null
  if (!webglOk) return <Fallback />
  return <Scene />
}
