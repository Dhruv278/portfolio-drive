'use client'

// Desktop post-processing. The effect set never changes at runtime: adding or removing an effect
// rebuilds the merged shader. Off on phones and behind ?fx=0.
import { EffectComposer, N8AO, SMAA, Vignette } from '@react-three/postprocessing'

export function Effects() {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <N8AO halfRes depthAwareUpsampling quality="performance" aoRadius={1.8} distanceFalloff={0.7} intensity={2.4} color="#0b1020" />
      <SMAA />
      <Vignette eskil={false} offset={0.22} darkness={0.5} />
    </EffectComposer>
  )
}
