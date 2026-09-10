// Pure timing and layout helpers for the set pieces, the intro and painted text. No three, no DOM.

export const INTRO_DURATION = 3.5 // seconds
// Door rolls up first, the car rolls out while the door is still finishing, the camera swings last.
const DOOR = [0, 1.2] as const
const CAR = [1.0, 3.3] as const
const CAMERA = [1.4, 3.5] as const

export function easeInOut(x: number): number {
  const t = Math.min(1, Math.max(0, x))
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export function introPhase(elapsed: number): { door: number; car: number; camera: number; done: boolean } {
  return {
    door: smoothstep(DOOR[0], DOOR[1], elapsed),
    car: easeInOut((elapsed - CAR[0]) / (CAR[1] - CAR[0])),
    camera: smoothstep(CAMERA[0], CAMERA[1], elapsed),
    done: elapsed >= INTRO_DURATION,
  }
}

// Position of item i of count along a looping conveyor, 0 at the start, wrapping at 1.
export function conveyorU(i: number, count: number, time: number, speed: number): number {
  const u = (i / count + time * speed) % 1
  return u < 0 ? u + 1 : u
}

export function counterValue(from: number, to: number, k: number): number {
  return Math.round(from + (to - from) * easeInOut(k))
}

// Greedy word wrap by character count. A word longer than the limit stands on its own line.
export function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (!line) line = word
    else if (line.length + 1 + word.length <= maxChars) line += ' ' + word
    else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  return lines
}
