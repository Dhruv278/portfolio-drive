// Pure road geometry builders. No React, no renderer, unit tested.
import { BufferGeometry, Float32BufferAttribute, Matrix4, Quaternion, Vector3, type Curve } from 'three'

const UP = new Vector3(0, 1, 0)
const FORWARD = new Vector3(0, 0, 1)

function ribbon(curve: Curve<Vector3>, segments: number, y: number, innerAt: (right: Vector3, p: Vector3) => Vector3, outerAt: (right: Vector3, p: Vector3) => Vector3): BufferGeometry {
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  const right = new Vector3()
  const length = curve.getLength()
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const p = curve.getPointAt(t)
    const tan = curve.getTangentAt(t).setY(0).normalize()
    right.crossVectors(UP, tan).normalize()
    const a = innerAt(right, p)
    const b = outerAt(right, p)
    pos.push(a.x, y, a.z, b.x, y, b.z)
    // u runs across the ribbon, v is the distance along it in metres, so textures tile at world scale
    uv.push(0, t * length, 1, t * length)
    if (i < segments) {
      const k = i * 2
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2)
    }
  }
  const geo = new BufferGeometry()
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3))
  geo.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  geo.setIndex(idx)
  geo.computeVertexNormals()
  return geo
}

export function buildRoadGeometry(curve: Curve<Vector3>, halfWidth: number, segments = 700, y = 0.03): BufferGeometry {
  return ribbon(
    curve,
    segments,
    y,
    (right, p) => p.clone().addScaledVector(right, -halfWidth),
    (right, p) => p.clone().addScaledVector(right, halfWidth),
  )
}

export function buildKerbGeometry(curve: Curve<Vector3>, halfWidth: number, kerbWidth: number, side: 1 | -1, segments = 700, y = 0.06): BufferGeometry {
  return ribbon(
    curve,
    segments,
    y,
    (right, p) => p.clone().addScaledVector(right, side * halfWidth),
    (right, p) => p.clone().addScaledVector(right, side * (halfWidth + kerbWidth)),
  )
}

export function dashMatrices(curve: Curve<Vector3>, count: number, y = 0.05): Matrix4[] {
  const out: Matrix4[] = []
  const q = new Quaternion()
  const one = new Vector3(1, 1, 1)
  for (let i = 0; i < count; i++) {
    const t = i / count
    const p = curve.getPointAt(t)
    const tan = curve.getTangentAt(t).setY(0).normalize()
    q.setFromUnitVectors(FORWARD, tan)
    out.push(new Matrix4().compose(new Vector3(p.x, y, p.z), q, one))
  }
  return out
}
