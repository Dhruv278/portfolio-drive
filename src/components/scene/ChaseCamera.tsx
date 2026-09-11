'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Vector3 } from 'three'
import { ARRIVAL_POSE_PHONE, ARRIVAL_POSES, HERO_POSE, INTRO_CAMERA, type CameraPose } from '@/content/route'
import { parkedStop } from '@/lib/scroll'
import { useDrive } from '@/store/drive'
import { frameAt, roadCurve, UP, type Frame } from './roadCurve'
import { readIntro, readRoadT, useIsMobile } from './useDriveFrame'

// Chase poses. Look target raised so the horizon sits about 15 percent down from the top of the
// frame: enough sky for clouds and birds, while the car and road keep the lower two thirds.
const DESKTOP: CameraPose = { back: 15.5, side: -6.5, up: 8.6, lookSide: 1.5, lookAhead: 14, lookY: 2.2 }
const PHONE: CameraPose = { back: 12.5, side: -1.6, up: 12.5, lookSide: 0.3, lookAhead: 1.5, lookY: -4.5 }
const PHONE_HERO: CameraPose = { back: 14, side: -1.6, up: 8.5, lookSide: 0.3, lookAhead: 9, lookY: 0.4 }
// Parked at a stop the camera eases toward the arrival pose; this is how fast.
const ARRIVAL_RATE = 0.045

const scratch: CameraPose = { back: 0, side: 0, up: 0, lookSide: 0, lookAhead: 0, lookY: 0 }
function mixPose(a: CameraPose, b: CameraPose, k: number): CameraPose {
  scratch.back = a.back + (b.back - a.back) * k
  scratch.side = a.side + (b.side - a.side) * k
  scratch.up = a.up + (b.up - a.up) * k
  scratch.lookSide = a.lookSide + (b.lookSide - a.lookSide) * k
  scratch.lookAhead = a.lookAhead + (b.lookAhead - a.lookAhead) * k
  scratch.lookY = a.lookY + (b.lookY - a.lookY) * k
  return scratch
}

export function ChaseCamera() {
  const mobile = useIsMobile()
  const first = useRef(true)
  const arrival = useRef(0) // 0 chase, 1 arrival pose
  const v = useMemo(
    () => ({
      pos: new Vector3(),
      tan: new Vector3(),
      right: new Vector3(),
      desired: new Vector3(),
      look: new Vector3(),
      camPos: new Vector3(),
      camLook: new Vector3(),
      lift: new Vector3(),
      introPos: new Vector3(),
      introLook: new Vector3(),
    }),
    [],
  )
  const origin = useMemo<Frame>(() => frameAt(0), [])

  useFrame(({ camera }) => {
    const { s, t, reduced } = readRoadT()
    const { zones, stopIndex, mode } = useDrive.getState()
    const heroCam = mode === 'hero' || (mobile && zones.length > 1 && s < zones[1].a * 0.6)
    const chase = heroCam ? (mobile ? PHONE_HERO : HERO_POSE) : mobile ? PHONE : DESKTOP

    // Arrival blend: toward 1 while parked at a stop, back to 0 while driving.
    const parked = parkedStop(s, zones)
    const target = parked >= 0 ? 1 : 0
    arrival.current = reduced ? target : arrival.current + (target - arrival.current) * ARRIVAL_RATE
    const arrivalPose = mobile ? ARRIVAL_POSE_PHONE : ARRIVAL_POSES[parked >= 0 ? parked : stopIndex] ?? ARRIVAL_POSES[0]
    const c = mixPose(chase, arrivalPose, arrival.current)

    const curve = roadCurve()
    curve.getPointAt(t, v.pos)
    curve.getTangentAt(t, v.tan).setY(0).normalize()
    v.right.crossVectors(UP, v.tan).normalize()
    v.desired.copy(v.pos).addScaledVector(v.tan, -c.back).addScaledVector(v.right, c.side).add(v.lift.set(0, c.up, 0))
    v.look.copy(v.pos).addScaledVector(v.tan, c.lookAhead).addScaledVector(v.right, c.lookSide).add(v.lift.set(0, c.lookY, 0))

    // Intro: start in front of the garage door, swing into the chase pose.
    const intro = readIntro()
    if (intro.active) {
      const ic = INTRO_CAMERA
      v.introPos.copy(origin.position).addScaledVector(origin.tangent, -ic.back).addScaledVector(origin.right, ic.side).add(v.lift.set(0, ic.up, 0))
      v.introLook.copy(origin.position).addScaledVector(origin.tangent, ic.lookAhead).addScaledVector(origin.right, ic.lookSide).add(v.lift.set(0, ic.lookY, 0))
      v.camPos.copy(v.introPos).lerp(v.desired, intro.camera)
      v.camLook.copy(v.introLook).lerp(v.look, intro.camera)
      first.current = false
    } else if (first.current || reduced) {
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
