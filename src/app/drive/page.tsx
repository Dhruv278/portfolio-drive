import type { Metadata } from 'next'
import { AskBot } from '@/components/bot/AskBot'
import { DriveLoader } from '@/components/hud/DriveLoader'
import { Hud } from '@/components/hud/Hud'
import { SceneMount } from '@/components/scene/SceneMount'
import { StopActivator } from '@/components/stops/StopActivator'
import { Stops } from '@/components/stops/Stops'
import { identity } from '@/content/profile'

export const metadata: Metadata = {
  title: `The 3D drive, ${identity.name}`,
  description: 'Six stops down a road at night: the garage, MedChron, the products, the platforms, the skills and the pier. A WebGL scene built to run on a laptop with integrated graphics.',
  alternates: { canonical: '/drive' },
}

export default function Page() {
  return (
    <div className="drive">
      <SceneMount />
      <DriveLoader />
      <Hud />
      <StopActivator />
      <Stops />
      <AskBot page="other" />
    </div>
  )
}
