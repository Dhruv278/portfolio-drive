import { describe, expect, it } from 'vitest'
import { CatmullRomCurve3, Vector3 } from 'three'
import { buildEdgeGeometry, buildKerbGeometry, buildRoadGeometry, dashMatrices } from './road'

const curve = new CatmullRomCurve3(
  [
    [0, 0, 0], [0, 0, -40], [10, 0, -80], [30, 0, -110],
  ].map((p) => new Vector3(...p)),
  false,
  'centripetal',
  0.6,
)

describe('buildRoadGeometry', () => {
  it('produces two vertices per sample and six indices per segment at the road height', () => {
    const geo = buildRoadGeometry(curve, 3.2, 100, 0.03)
    const pos = geo.getAttribute('position')
    expect(pos.count).toBe(202)
    expect(geo.getIndex()?.count).toBe(600)
    for (let i = 0; i < pos.count; i++) expect(pos.getY(i)).toBeCloseTo(0.03, 6)
    expect(geo.getAttribute('normal')).toBeDefined()
  })
})

describe('buildKerbGeometry', () => {
  it('builds a strip on the requested side just outside the road edge', () => {
    const geo = buildKerbGeometry(curve, 3.2, 0.35, 1, 50, 0.06)
    const pos = geo.getAttribute('position')
    expect(pos.count).toBe(102)
    // first sample: inner edge at +3.2 lateral, outer at +3.55 lateral from the road centre
    const start = curve.getPointAt(0)
    const inner = new Vector3(pos.getX(0), 0, pos.getZ(0)).distanceTo(new Vector3(start.x, 0, start.z))
    const outer = new Vector3(pos.getX(1), 0, pos.getZ(1)).distanceTo(new Vector3(start.x, 0, start.z))
    expect(inner).toBeCloseTo(3.2, 3)
    expect(outer).toBeCloseTo(3.55, 3)
  })
})

describe('dashMatrices', () => {
  it('returns one matrix per dash positioned on the curve', () => {
    const ms = dashMatrices(curve, 20, 0.05)
    expect(ms).toHaveLength(20)
    const p = new Vector3().setFromMatrixPosition(ms[0])
    const c = curve.getPointAt(0)
    expect(p.x).toBeCloseTo(c.x, 6)
    expect(p.z).toBeCloseTo(c.z, 6)
    expect(p.y).toBeCloseTo(0.05, 6)
  })
})

describe('buildEdgeGeometry', () => {
  const straight = new CatmullRomCurve3([new Vector3(0, 0, 0), new Vector3(0, 0, -50), new Vector3(0, 0, -100)])
  it('is a ribbon with a progress attribute running 0 to 1', () => {
    const g = buildEdgeGeometry(straight, 3.2, 0.5, 0.12, 1, 10, 0.05)
    expect(g.getAttribute('position').count).toBe(22)
    const prog = g.getAttribute('progress')
    expect(prog.itemSize).toBe(1)
    expect(prog.getX(0)).toBe(0)
    expect(prog.getX(21)).toBe(1)
  })
  it('sits inside the kerb at the given inset', () => {
    const g = buildEdgeGeometry(straight, 3.2, 0.5, 0.12, 1, 10, 0.05)
    const pos = g.getAttribute('position')
    const x0 = Math.abs(pos.getX(0))
    const x1 = Math.abs(pos.getX(1))
    expect(Math.min(x0, x1)).toBeCloseTo(3.2 - 0.5 - 0.12, 5)
    expect(Math.max(x0, x1)).toBeCloseTo(3.2 - 0.5, 5)
  })
})
