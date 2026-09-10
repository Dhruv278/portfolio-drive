import { CatmullRomCurve3, Quaternion, Vector3 } from 'three'
import { ROAD_POINTS } from '@/content/route'

export const UP = new Vector3(0, 1, 0)

let cached: CatmullRomCurve3 | null = null
export function roadCurve(): CatmullRomCurve3 {
  if (!cached) cached = new CatmullRomCurve3(ROAD_POINTS.map((p) => new Vector3(...p)), false, 'centripetal', 0.6)
  return cached
}

const _tan = new Vector3()
const _right = new Vector3()
const _pos = new Vector3()
const _target = new Vector3()
const _q = new Quaternion()

export type Pose = { position: Vector3; quaternion: Quaternion; tangent: Vector3; right: Vector3 }

// Position and yaw for something standing beside the road at parameter t, lateral metres from the centre.
// Positive lateral faces the road from the left side (camera side), negative from the right.
export function poseAt(t: number, lateral: number, out?: Pose): Pose {
  const curve = roadCurve()
  const o = out ?? { position: new Vector3(), quaternion: new Quaternion(), tangent: new Vector3(), right: new Vector3() }
  curve.getPointAt(t, _pos)
  curve.getTangentAt(t, _tan).setY(0).normalize()
  _right.crossVectors(UP, _tan).normalize()
  o.position.copy(_pos).addScaledVector(_right, lateral)
  o.tangent.copy(_tan)
  o.right.copy(_right)
  // face the road: look from the object toward its own position minus (right * sign(lateral))
  _target.copy(o.position).sub(_right.clone().multiplyScalar(Math.sign(lateral) || 1))
  const dir = _target.sub(o.position).setY(0).normalize()
  _q.setFromUnitVectors(new Vector3(0, 0, 1), dir)
  o.quaternion.copy(_q)
  return o
}

const FORWARD = new Vector3(0, 0, 1)
export type Frame = { position: Vector3; quaternion: Quaternion; tangent: Vector3; right: Vector3 }

// A frame on the road centre at t: local +z points along the road, local +x to the camera side.
export function frameAt(t: number, out?: Frame): Frame {
  const curve = roadCurve()
  const o = out ?? { position: new Vector3(), quaternion: new Quaternion(), tangent: new Vector3(), right: new Vector3() }
  curve.getPointAt(t, o.position)
  curve.getTangentAt(t, o.tangent).setY(0).normalize()
  o.right.crossVectors(UP, o.tangent).normalize()
  o.quaternion.setFromUnitVectors(FORWARD, o.tangent)
  return o
}
