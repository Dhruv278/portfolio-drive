'use client'

// One WebGL probe at mount: is WebGL 2 there, and does the adapter look like integrated graphics?
// Post-processing is skipped on integrated parts, where it measured 23 fps against 40 without.
export type GpuInfo = { webgl2: boolean; renderer: string; lowEnd: boolean }

const LOW_END = /intel|iris|uhd|mali|adreno|powervr|apple gpu|swiftshader|llvmpipe|software/i

export let gpuInfo: GpuInfo = { webgl2: false, renderer: '', lowEnd: true }

export function probeGpu(): GpuInfo {
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2', { failIfMajorPerformanceCaveat: false })
    if (!gl) return (gpuInfo = { webgl2: false, renderer: '', lowEnd: true })
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER))
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    // Apple silicon reports "Apple GPU" or "Apple M2": fast enough, so only the generic string counts as low end.
    const lowEnd = LOW_END.test(renderer) && !/apple m\d/i.test(renderer)
    return (gpuInfo = { webgl2: true, renderer, lowEnd })
  } catch {
    return (gpuInfo = { webgl2: false, renderer: '', lowEnd: true })
  }
}
