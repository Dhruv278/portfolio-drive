import { describe, expect, it } from 'vitest'
import { parseView, readView, shouldOpenDrive, shouldPulse } from './view'

describe('parseView', () => {
  it('accepts only the two views', () => {
    expect(parseView('2d')).toBe('2d')
    expect(parseView('3d')).toBe('3d')
    expect(parseView('3D')).toBeNull()
    expect(parseView(null)).toBeNull()
    expect(parseView(undefined)).toBeNull()
    expect(parseView('')).toBeNull()
  })
})

describe('shouldOpenDrive', () => {
  it('opens the drive for a returning desktop visitor who last used it', () => {
    expect(shouldOpenDrive('3d', false, false, true)).toBe(true)
  })

  it('never redirects a phone or a browser without WebGL 2', () => {
    expect(shouldOpenDrive('3d', false, true, true)).toBe(false)
    expect(shouldOpenDrive('3d', false, false, false)).toBe(false)
  })

  it('redirects at most once per session, so leaving the drive for the home page sticks', () => {
    expect(shouldOpenDrive('3d', true, false, true)).toBe(false)
  })

  it('stays on the 2D page when the last view was 2D or unknown', () => {
    expect(shouldOpenDrive('2d', false, false, true)).toBe(false)
    expect(shouldOpenDrive(null, false, false, true)).toBe(false)
  })
})

describe('shouldPulse', () => {
  it('draws attention to the 3D side only on the 2D page, and only until the drive has been seen', () => {
    expect(shouldPulse('2d', false)).toBe(true)
    expect(shouldPulse('2d', true)).toBe(false)
    expect(shouldPulse('3d', false)).toBe(false)
  })
})

it('reads no preference when storage is unavailable', () => {
  expect(readView()).toBeNull()
})
