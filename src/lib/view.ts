// Which view the visitor uses: the 2D track or the 3D drive. Remembered in localStorage, so the
// home address opens the last view. Pure decisions live here and are unit tested; the browser
// storage calls are wrapped so a blocked storage never throws.

export type View = '2d' | '3d'

const VIEW_KEY = 'drive-view'
const SEEN_KEY = 'drive-view-seen3d'
const REDIRECT_KEY = 'drive-view-redirected'

export function parseView(v: unknown): View | null {
  return v === '2d' || v === '3d' ? v : null
}

// Open the drive from the home address only for a returning desktop visitor whose last view was
// the drive, with WebGL 2, and at most once per session so leaving the drive for the home page holds.
export function shouldOpenDrive(pref: View | null, redirectedThisSession: boolean, phone: boolean, webgl: boolean): boolean {
  return pref === '3d' && !redirectedThisSession && !phone && webgl
}

// The 3D side of the switch beats on the 2D page until the visitor has seen the drive once.
export function shouldPulse(current: View | null, seen: boolean): boolean {
  return current === '2d' && !seen
}

function get(store: 'local' | 'session', key: string): string | null {
  try {
    return (store === 'local' ? localStorage : sessionStorage).getItem(key)
  } catch {
    return null
  }
}

function set(store: 'local' | 'session', key: string, value: string): void {
  try {
    ;(store === 'local' ? localStorage : sessionStorage).setItem(key, value)
  } catch {
    // storage blocked: the site still works, it just forgets the view
  }
}

export function readView(): View | null {
  return parseView(get('local', VIEW_KEY))
}

export function writeView(v: View): void {
  set('local', VIEW_KEY, v)
  if (v === '3d') set('local', SEEN_KEY, '1')
}

export function seen3d(): boolean {
  return get('local', SEEN_KEY) === '1'
}

export function redirectedThisSession(): boolean {
  return get('session', REDIRECT_KEY) === '1'
}

export function markRedirected(): void {
  set('session', REDIRECT_KEY, '1')
}
