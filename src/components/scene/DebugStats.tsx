'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { Camera, Scene as ThreeScene, Vector2, WebGLRenderer } from 'three'

const size = new Vector2()

declare global {
  interface Window {
    __driveStats?: { fps: number; ms: number; calls: number; triangles: number; geometries: number; textures: number; programs: number; dpr: number; width: number; height: number }
    // Renderer, scene and camera for in-page inspection. Only with ?stats=1.
    __drive?: { gl: WebGLRenderer; scene: ThreeScene; camera: Camera; THREE: typeof THREE }
    // The slowest renders since load: how long gl.render took and what the renderer counted after it.
    __slowFrames?: { at: number; ms: number; textures: number; programs: number; calls: number }[]
  }
}

// Mounted only with ?stats=1. Publishes renderer counters once a second for measurement scripts.
export function DebugStats() {
  const acc = useRef({ frames: 0, t: 0 })
  useFrame(({ gl, scene, camera }) => {
    if (!window.__drive) {
      window.__drive = { gl, scene, camera, THREE }
      // Time every render call and keep the eight slowest, with the counters that explain them.
      window.__slowFrames = []
      const render = gl.render.bind(gl)
      gl.render = (sc, cam) => {
        const t0 = performance.now()
        render(sc, cam)
        const ms = performance.now() - t0
        if (ms > 60) {
          const list = window.__slowFrames!
          list.push({ at: Math.round(t0), ms: Math.round(ms), textures: gl.info.memory.textures, programs: gl.info.programs?.length ?? 0, calls: gl.info.render.calls })
          list.sort((a, b) => b.ms - a.ms)
          if (list.length > 8) list.length = 8
        }
      }
    }
    const a = acc.current
    a.frames++
    // Wall time, not the fiber clock: that clock restarts when the frameloop switches on at ready.
    const now = performance.now() / 1000
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
