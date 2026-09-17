// The car as an illustration: paint with side highlights, tinted glass with a reflection streak,
// roof panel, door seams, mirrors, headlight wedges and tail lights with glow, a blurred shadow.
// Faces up (negative y), 44 units wide, 96 long, origin at its centre. Server rendered SVG; the
// gradient ids take a prefix so two glyphs can share one document.
export function CarGlyph({ id }: { id: string }) {
  const body = 'M-15,-48 C-20,-48 -22,-44 -22,-39 L-22,39 C-22,44 -19,48 -14,48 L14,48 C19,48 22,44 22,39 L22,-39 C22,-44 20,-48 15,-48 Z'
  return (
    <>
      <defs>
        <filter id={`${id}-glow`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${id}-shadow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <linearGradient id={`${id}-paint`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7f9188" />
          <stop offset=".16" stopColor="#e9efe3" />
          <stop offset=".5" stopColor="#c3cfc3" />
          <stop offset=".84" stopColor="#f1f5ec" />
          <stop offset="1" stopColor="#7b8c83" />
        </linearGradient>
        <linearGradient id={`${id}-paintV`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".38" />
          <stop offset=".45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".22" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3d5964" />
          <stop offset="1" stopColor="#0b1519" />
        </linearGradient>
        <linearGradient id={`${id}-glassHi`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".3" />
          <stop offset=".65" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-roof`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a3b3a9" />
          <stop offset=".5" stopColor="#d6dfd3" />
          <stop offset="1" stopColor="#9dada3" />
        </linearGradient>
      </defs>
      <g className="tp-car-body">
        <ellipse cx="-3" cy="6" rx="25" ry="50" fill="#000" opacity=".55" filter={`url(#${id}-shadow)`} />
        <rect className="tyre" x="-24.5" y="-36" width="7" height="16" rx="2.5" />
        <rect className="tyre" x="17.5" y="-36" width="7" height="16" rx="2.5" />
        <rect className="tyre" x="-24.5" y="20" width="7" height="16" rx="2.5" />
        <rect className="tyre" x="17.5" y="20" width="7" height="16" rx="2.5" />
        <path d={body} fill={`url(#${id}-paint)`} stroke="#f7f9f1" strokeWidth=".7" strokeOpacity=".7" />
        <path d={body} fill={`url(#${id}-paintV)`} />
        <path d="M-9,-42 L-8,-17 M9,-42 L8,-17" stroke="#8a9a90" strokeWidth=".8" fill="none" opacity=".85" />
        <path d="M-17,-16 L17,-16 L14,-3 L-14,-3 Z" fill={`url(#${id}-glass)`} />
        <path d="M-16,-15 L4,-15 L-6,-4 L-13,-4 Z" fill={`url(#${id}-glassHi)`} />
        <rect x="-15" y="-3" width="30" height="24" rx="3" fill={`url(#${id}-roof)`} />
        <path d="M-15,-3 H15" stroke="#eef3e8" strokeWidth=".6" opacity=".6" />
        <path d="M-15,21 L15,21 L12,31 L-12,31 Z" fill={`url(#${id}-glass)`} />
        <path d="M-14,22 L0,22 L-7,30 L-11,30 Z" fill={`url(#${id}-glassHi)`} />
        <path d="M-13,38 H13" stroke="#8a9a90" strokeWidth=".8" opacity=".85" />
        <path d="M-22,-4 V16 M22,-4 V16" stroke="#75857c" strokeWidth=".9" opacity=".8" />
        <rect x="-27.5" y="-10" width="6" height="4" rx="1.5" fill="#c1cdc2" stroke="#33413c" strokeWidth=".5" />
        <rect x="21.5" y="-10" width="6" height="4" rx="1.5" fill="#c1cdc2" stroke="#33413c" strokeWidth=".5" />
        <path className="lamp" d="M-19,-46 L-8,-45 L-8,-42 L-18,-42 Z" filter={`url(#${id}-glow)`} />
        <path className="lamp" d="M19,-46 L8,-45 L8,-42 L18,-42 Z" filter={`url(#${id}-glow)`} />
        <rect x="-7" y="-46" width="14" height="3" rx="1" fill="#141c20" />
        <rect className="tail" x="-20" y="43" width="12" height="3.5" rx="1" filter={`url(#${id}-glow)`} />
        <rect className="tail" x="8" y="43" width="12" height="3.5" rx="1" filter={`url(#${id}-glow)`} />
        <rect x="-5" y="43.5" width="10" height="3" rx=".5" fill="#e9eee6" opacity=".85" />
      </g>
    </>
  )
}
