import { useThree } from '@react-three/fiber'
import { roadT } from '@/lib/scroll'
import { T_END, T_STOPS } from '@/content/route'
import { useDrive } from '@/store/drive'

// Read the current road parameter from the store without causing React renders. Call inside useFrame.
export function readRoadT(): { s: number; t: number; reduced: boolean } {
  const { scroll, zones, reducedMotion } = useDrive.getState()
  const t = zones.length ? roadT(scroll, zones, T_STOPS, T_END) : 0
  return { s: scroll, t, reduced: reducedMotion }
}

export function useIsMobile(): boolean {
  return useThree((s) => s.size.width) < 720
}
