'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useDrive } from '@/store/drive'
import { Fallback } from './Fallback'

// The 3D layer is loaded only on the client, after hydration, and only when WebGL is available.
// `?scene=off` skips it entirely (used by the end-to-end tests and handy on weak machines).
const Scene = dynamic(() => import('./Scene').then((m) => m.Scene), { ssr: false, loading: () => null })

function probeWebgl(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
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
    if (!off) setWebglOk(probeWebgl())
  }, [off, setWebglOk])

  if (off || webglOk === null) return null
  if (!webglOk) return <Fallback />
  return <Scene />
}
