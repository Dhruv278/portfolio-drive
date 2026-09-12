import type { Metadata } from 'next'
import { AskBot } from '@/components/bot/AskBot'
import { DriveLoader } from '@/components/hud/DriveLoader'
import { Hud } from '@/components/hud/Hud'
import { SceneMount } from '@/components/scene/SceneMount'
import { StopActivator } from '@/components/stops/StopActivator'
import { Stops } from '@/components/stops/Stops'
import { seo } from '@/content/seo'

export const metadata: Metadata = {
  title: seo.titles.drive,
  description: seo.descriptions.drive,
  alternates: { canonical: '/drive' },
  openGraph: { title: seo.titles.drive, description: seo.descriptions.drive, url: '/drive', type: 'website', images: ['/og.jpg'] },
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
