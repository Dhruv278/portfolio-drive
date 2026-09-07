import { Hud } from '@/components/hud/Hud'
import { SceneMount } from '@/components/scene/SceneMount'
import { Stops } from '@/components/stops/Stops'

export default function Page() {
  return (
    <>
      <SceneMount />
      <Hud />
      <Stops />
    </>
  )
}
