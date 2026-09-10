import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CatmullRomCurve3, Vector3 } from 'three'
import { ARRIVAL_POSES, BILLBOARDS, buildPlacements, CAR_LENGTH, GARAGE, HILL_CLEARANCE, HILLS, INTRO_BACK, KERB_WIDTH, MEDCHRON, ROAD_HALF_WIDTH, ROAD_POINTS, T_END, T_STOPS, usedModels } from './route'

function hillCentre(t: number, lateral: number, curve: CatmullRomCurve3): Vector3 {
  const p = curve.getPointAt(t)
  const tan = curve.getTangentAt(t).setY(0).normalize()
  const right = new Vector3().crossVectors(new Vector3(0, 1, 0), tan).normalize()
  return p.clone().addScaledVector(right, lateral)
}

describe('route', () => {
  it('has six stops in increasing order that end before the road does', () => {
    expect(T_STOPS).toHaveLength(6)
    for (let i = 1; i < T_STOPS.length; i++) expect(T_STOPS[i]).toBeGreaterThan(T_STOPS[i - 1])
    expect(T_END).toBeGreaterThan(T_STOPS[5])
    expect(T_END).toBeLessThanOrEqual(1)
  })

  it('places every scenery item on the road and clear of the tarmac', () => {
    for (const p of buildPlacements()) {
      expect(p.t).toBeGreaterThanOrEqual(0)
      expect(p.t).toBeLessThanOrEqual(1)
      expect(Math.abs(p.lateral)).toBeGreaterThan(3.2 + 0.35)
    }
    for (const b of BILLBOARDS) expect(Math.abs(b.lateral)).toBeGreaterThan(3.55)
  })

  it('keeps every hill clear of the road along its whole length', () => {
    const curve = new CatmullRomCurve3(ROAD_POINTS.map((p) => new Vector3(...p)), false, 'centripetal', 0.6)
    const samples = Array.from({ length: 800 }, (_, i) => curve.getPointAt(i / 799))
    for (const h of HILLS) {
      const c = hillCentre(h.t, h.lateral, curve)
      let min = Infinity
      for (const s of samples) min = Math.min(min, Math.hypot(s.x - c.x, s.z - c.z))
      expect(min, `hill at t=${h.t} lateral=${h.lateral} is ${min.toFixed(1)}m from the road centre`).toBeGreaterThan(
        h.r + ROAD_HALF_WIDTH + KERB_WIDTH + HILL_CLEARANCE,
      )
    }
  })

  it('has one arrival pose per stop that sits higher and wider than the chase', () => {
    expect(ARRIVAL_POSES).toHaveLength(T_STOPS.length)
    for (const p of ARRIVAL_POSES) {
      expect(p.up).toBeGreaterThan(8.6)
      expect(p.back).toBeGreaterThan(15.5)
    }
  })

  it('keeps the MedChron piece clear of the tarmac and in order along the road', () => {
    expect(MEDCHRON.conveyorLateral).toBeGreaterThan(ROAD_HALF_WIDTH + KERB_WIDTH + 1)
    expect(MEDCHRON.signLateral).toBeGreaterThan(ROAD_HALF_WIDTH + KERB_WIDTH + 1)
    expect(MEDCHRON.conveyorStart).toBeLessThan(MEDCHRON.archT)
    expect(MEDCHRON.archT).toBeLessThan(MEDCHRON.conveyorEnd)
    expect(MEDCHRON.signTs).toHaveLength(6)
    for (let i = 1; i < MEDCHRON.signTs.length; i++) expect(MEDCHRON.signTs[i]).toBeGreaterThan(MEDCHRON.signTs[i - 1])
    expect(MEDCHRON.signTs[0]).toBeGreaterThan(MEDCHRON.archT)
    expect(MEDCHRON.signTs[5]).toBeLessThan(T_STOPS[1] + 0.045)
  })

  it('no longer ships the two Kenney buildings the records building replaces', () => {
    expect(usedModels()).not.toContain('commercial/building-e')
    expect(usedModels()).not.toContain('commercial/building-skyscraper-a')
    expect(usedModels()).not.toContain('commercial/building-b')
  })

  it('starts the car inside the garage with the door ahead of it, and the garage behind the road origin', () => {
    const carFront = -INTRO_BACK + CAR_LENGTH / 2
    const carBack = -INTRO_BACK - CAR_LENGTH / 2
    expect(GARAGE.doorZ).toBeGreaterThan(carFront)
    expect(GARAGE.centerZ - GARAGE.depth / 2).toBeLessThan(carBack)
    expect(GARAGE.centerZ + GARAGE.depth / 2).toBeLessThanOrEqual(0)
  })

  it('is deterministic between calls', () => {
    expect(buildPlacements()).toEqual(buildPlacements())
  })

  it('matches the copy script allowlist', () => {
    const list = JSON.parse(readFileSync(join(process.cwd(), 'scripts', 'used-models.json'), 'utf8')) as string[]
    expect(list).toEqual(usedModels())
  })

  it('has every referenced model available in design/assets', () => {
    const missing = usedModels().filter((m) => !existsSync(join(process.cwd(), 'design', 'assets', m + '.glb')))
    expect(missing).toEqual([])
  })
})
