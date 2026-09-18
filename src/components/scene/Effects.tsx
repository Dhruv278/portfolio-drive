'use client'

// Desktop post-processing. The effect set never changes at runtime: adding or removing an effect
// rebuilds the merged shader. Off on phones and behind ?fx=0.
import { Bloom, EffectComposer, SMAA, Vignette } from '@react-three/postprocessing'

export function Effects() {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {/* Threshold at one: only lamps, lamp heads and the lit road edges bloom, never lit paint. */}
      <Bloom mipmapBlur intensity={0.45} luminanceThreshold={1} luminanceSmoothing={0.2} />
      <SMAA />
      <Vignette eskil={false} offset={0.22} darkness={0.3} />
    </EffectComposer>
  )
}
