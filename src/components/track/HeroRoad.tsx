// The road under the name on phones and tablets: a wide S-bend with the car parked at Start. Static
// SVG, server rendered; the track scene fades it out when the fixed route bar takes over. Hidden on
// desktop by the stylesheet, where the page-tall road carries the drive instead.
export function HeroRoad() {
  return (
    <svg className="tp-heroroad" viewBox="0 0 360 90" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <radialGradient id="tp-hero-pool">
          <stop offset="0" stopColor="#ffb547" stopOpacity="0.28" />
          <stop offset="1" stopColor="#ffb547" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="tp-hero-beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffb547" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffb547" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="tp-kerb" d="M-10,58 C80,58 110,30 180,30 S280,60 370,60" />
      <path className="tp-road" d="M-10,58 C80,58 110,30 180,30 S280,60 370,60" />
      <path className="tp-dash" d="M-10,58 C80,58 110,30 180,30 S280,60 370,60" />
      <circle cx="48" cy="57" r="46" fill="url(#tp-hero-pool)" />
      <polygon points="60,49 150,38 150,74 60,64" fill="url(#tp-hero-beam)" opacity="0.9" />
      <g className="tp-car" transform="translate(48,57.5) rotate(90) scale(0.62)">
        <rect className="tyre" x="-15" y="-18" width="6" height="12" rx="2" />
        <rect className="tyre" x="9" y="-18" width="6" height="12" rx="2" />
        <rect className="tyre" x="-15" y="8" width="6" height="12" rx="2" />
        <rect className="tyre" x="9" y="8" width="6" height="12" rx="2" />
        <rect className="body" x="-13" y="-24" width="26" height="48" rx="7" />
        <rect className="roof" x="-9" y="-6" width="18" height="18" rx="3" />
        <rect className="glass" x="-9" y="-13" width="18" height="6" rx="2" />
        <circle className="lamp" cx="-8" cy="-22" r="2.4" />
        <circle className="lamp" cx="8" cy="-22" r="2.4" />
        <rect className="tail" x="-11" y="21" width="6" height="2.5" />
        <rect className="tail" x="5" y="21" width="6" height="2.5" />
      </g>
      {[48, 118, 188, 258, 328].map((x, i) => {
        // dots along the bend: the first is Start and lit, the rest wait ahead
        const y = i === 0 ? 57.5 : i === 1 ? 40 : i === 2 ? 31 : i === 3 ? 44 : 57
        return <circle key={x} className={`tp-cp${i === 0 ? ' on' : ''}`} cx={x} cy={y} r="5" />
      })}
    </svg>
  )
}
