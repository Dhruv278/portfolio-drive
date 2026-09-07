'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Vector3 } from 'three'
import { useDrive } from '@/store/drive'
import { roadCurve, UP } from './roadCurve'
import { readRoadT, useIsMobile } from './useDriveFrame'

// Look target raised so the horizon sits about 15 percent down from the top of the frame: enough
// sky for clouds and birds to live in, while the car and road keep the lower two thirds.
const DESKTOP = { back: 15.5, side: -6.5, up: 8.6, lookSide: 1.5, lookAhead: 14, lookY: 2.2 }
const PHONE = { back: 12.5, side: -1.6, up: 12.5, lookSide: 0.3, lookAhead: 1.5, lookY: -4.5 }
const PHONE_HERO = { back: 14, side: -1.6, up: 8.5, lookSide: 0.3, lookAhead: 9, lookY: 0.4 }

export function ChaseCamera() {
  const mobile = useIsMobile()
  const first = useRef(true)
  const v = useMemo(() => ({ pos: new Vector3(), tan: new Vector3(), right: new Vector3(), desired: new Vector3(), look: new Vector3(), camPos: new Vector3(), camLook: new Vector3(), lift: new Vector3() }), [])

  useFrame(({ camera }) => {
    const { s, t, reduced } = readRoadT()
    const zones = useDrive.getState().zones
    const heroCam = mobile && zones.length > 1 && s < zones[1].a * 0.6
    const c = heroCam ? PHONE_HERO : mobile ? PHONE : DESKTOP

    const curve = roadCurve()
    curve.getPointAt(t, v.pos)
    curve.getTangentAt(t, v.tan).setY(0).normalize()
    v.right.crossVectors(UP, v.tan).normalize()
    v.desired.copy(v.pos).addScaledVector(v.tan, -c.back).addScaledVector(v.right, c.side).add(v.lift.set(0, c.up, 0))
    v.look.copy(v.pos).addScaledVector(v.tan, c.lookAhead).addScaledVector(v.right, c.lookSide).add(v.lift.set(0, c.lookY, 0))

    if (first.current || reduced) {
      v.camPos.copy(v.desired)
      v.camLook.copy(v.look)
      first.current = false
    } else {
      v.camPos.lerp(v.desired, 0.07)
      v.camLook.lerp(v.look, 0.09)
    }
    camera.position.copy(v.camPos)
    camera.lookAt(v.camLook)
  })
  return null
}
