'use client'

// Scene feature switches read once from the URL, for A/B comparison and bisecting on a slow GPU.
// Every feature is on unless its parameter is "0": ?env=0&contact=0&clouds=0&pbr=0
// Post-processing follows the GPU probe unless forced: ?fx=1 or ?fx=0
const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null

export const flags = {
  fx: params?.get('fx') === '1' ? true : params?.get('fx') === '0' ? false : null,
  env: params?.get('env') !== '0',
  contact: params?.get('contact') !== '0',
  clouds: params?.get('clouds') !== '0',
  pbr: params?.get('pbr') !== '0',
  intro: params?.get('intro') !== '0',
  garage: params?.get('garage') !== '0',
  medchron: params?.get('medchron') !== '0',
  stats: params?.get('stats') === '1',
}
