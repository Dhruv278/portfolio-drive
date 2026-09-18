export type TileIconName = 'target' | 'sparkles' | 'cube'

const PATHS: Record<TileIconName, string> = {
  target: 'M12 12m-8.5 0a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0M12 12m-4.2 0a4.2 4.2 0 1 0 8.4 0a4.2 4.2 0 1 0 -8.4 0M12 12l6.5-6.5M16 3.5v4h4',
  sparkles: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8zM5 15.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4L3 17.5l1.4-.6z',
  cube: 'M12 2.8l8 4.4v9.6l-8 4.4-8-4.4V7.2zM4 7.2l8 4.4 8-4.4M12 11.6v9.6',
}

// The hero tile marks: target for the product lead, sparkles for AI you can cite, cube for ships
// end to end. Stroke icons in the current colour, so the stylesheet tints them per tile.
export function TileIcon({ name }: { name: TileIconName }) {
  return (
    <span className="tp-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={PATHS[name]} />
      </svg>
    </span>
  )
}
