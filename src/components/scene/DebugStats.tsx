'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { Vector2 } from 'three'

const size = new Vector2()

declare global {
  interface Window {
    __driveStats?: { fps: number; ms: number; calls: number; triangles: number; geometries: number; textures: number; programs: number; dpr: number; width: number; height: number }
  }
}

// Mounted only with ?stats=1. Publishes renderer counters once a second for measurement scripts.
export function DebugStats() {
  const acc = useRef({ frames: 0, t: 0 })
  useFrame(({ gl, clock }) => {
    const a = acc.current
    a.frames++
    const now = clock.elapsedTime
    if (now - a.t >= 1) {
      const fps = a.frames / (now - a.t)
      gl.getSize(size)
      window.__driveStats = {
        fps: Math.round(fps),
        ms: +(1000 / fps).toFixed(1),
        calls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
        programs: gl.info.programs?.length ?? 0,
        dpr: gl.getPixelRatio(),
        width: size.x,
        height: size.y,
      }
      a.frames = 0
      a.t = now
    }
  })
  return null
}
