import { Hud } from '@/components/hud/Hud'
import { SceneMount } from '@/components/scene/SceneMount'
import { StopActivator } from '@/components/stops/StopActivator'
import { Stops } from '@/components/stops/Stops'

export default function Page() {
  return (
    <>
      <SceneMount />
      <Hud />
      <StopActivator />
      <Stops />
    </>
  )
}
