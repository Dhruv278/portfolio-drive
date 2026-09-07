'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'
import { useDrive } from '@/store/drive'
import { Fallback } from './Fallback'

// The 3D layer is loaded only on the client, after hydration, and only when WebGL is available.
const Scene = dynamic(() => import('./Scene').then((m) => m.Scene), { ssr: false, loading: () => null })

function probeWebgl(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export function SceneMount() {
  const webglOk = useDrive((s) => s.webglOk)
  const setWebglOk = useDrive((s) => s.setWebglOk)
  useEffect(() => {
    setWebglOk(probeWebgl())
  }, [setWebglOk])

  if (webglOk === null) return null
  if (!webglOk) return <Fallback />
  return <Scene />
}
