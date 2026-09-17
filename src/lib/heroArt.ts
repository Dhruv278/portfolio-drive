// The landscape behind the hero road on desktop: a navy sky warming at the horizon, a low sun with
// its path on the water, two ridge lines and two foreground cliffs. Pure string building in page
// coordinates, seeded so every load draws the same picture. Masked and coloured by the stylesheet.

const f = (n: number) => n.toFixed(1)

function seeded(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

export function heroArtMarkup(W: number, heroTop: number, heroH: number, horizonY: number): string {
  const bottom = heroTop + heroH
  const rnd = seeded(7)
  const ridge = (x0: number, x1: number, base: number, amp: number, step: number, color: string) => {
    let d = `M${f(x0)},${f(bottom)} L${f(x0)},${f(base - amp * 0.3)}`
    let x = x0
    while (x < x1) {
      const nx = Math.min(x1, x + step * (0.6 + rnd() * 0.8))
      const ny = base - amp * (0.15 + rnd() * 0.85)
      d += ` Q${f((x + nx) / 2)},${f(ny - amp * 0.3 * rnd())} ${f(nx)},${f(ny)}`
      x = nx
    }
    d += ` L${f(x1)},${f(bottom)} Z`
    return `<path d="${d}" fill="${color}"/>`
  }
  const sunX = W * 0.86
  const sunY = horizonY - 6
  const stars = Array.from(
    { length: 46 },
    () => `<circle cx="${f(W * 0.3 + rnd() * W * 0.72)}" cy="${f(heroTop + rnd() * Math.max(1, horizonY - heroTop - 60))}" r="${f(0.6 + rnd() * 1.1)}" fill="#e6efe9" opacity="${f(0.25 + rnd() * 0.5)}"/>`,
  ).join('')
  const shimmer = Array.from({ length: 14 }, (_, i) => {
    const y = horizonY + 10 + i * 13 * (1 + i * 0.06)
    const w = 20 + rnd() * 90 * (1 + i * 0.12)
    const x = sunX - w / 2 + (rnd() - 0.5) * 70 * (1 + i * 0.1)
    return `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="1.5" fill="#f0c57a" opacity="${f(0.34 - i * 0.02)}"/>`
  }).join('')
  return (
    `<defs>` +
    `<linearGradient id="tp-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0f12"/><stop offset=".5" stop-color="#15222a"/><stop offset=".84" stop-color="#2a3f46"/><stop offset="1" stop-color="#6b5a3e"/></linearGradient>` +
    `<radialGradient id="tp-sunGlow"><stop offset="0" stop-color="#f0c57a" stop-opacity=".6"/><stop offset=".3" stop-color="#e2a95e" stop-opacity=".2"/><stop offset="1" stop-color="#e2a95e" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="tp-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f4850"/><stop offset=".45" stop-color="#17272c"/><stop offset="1" stop-color="#0d1417"/></linearGradient>` +
    `<linearGradient id="tp-sunPath" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0c57a" stop-opacity=".45"/><stop offset="1" stop-color="#f0c57a" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="tp-haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6ed83" stop-opacity="0"/><stop offset="1" stop-color="#d6ed83" stop-opacity=".07"/></linearGradient>` +
    `</defs>` +
    `<rect x="0" y="${f(heroTop)}" width="${f(W)}" height="${f(horizonY - heroTop)}" fill="url(#tp-sky)"/>` +
    stars +
    `<circle cx="${f(sunX)}" cy="${f(sunY)}" r="${f(W * 0.2)}" fill="url(#tp-sunGlow)"/>` +
    `<circle cx="${f(sunX)}" cy="${f(sunY)}" r="34" fill="#f3cf8a"/>` +
    `<rect x="${f(W * 0.5)}" y="${f(horizonY)}" width="${f(W * 0.52)}" height="${f(heroH * 0.5)}" fill="url(#tp-water)"/>` +
    `<rect x="${f(sunX - 36)}" y="${f(horizonY)}" width="72" height="${f(heroH * 0.3)}" fill="url(#tp-sunPath)"/>` +
    shimmer +
    ridge(W * 0.28, W * 1.02, horizonY + 2, 120, 130, '#1b2a30') +
    ridge(W * 0.22, W * 0.92, horizonY + 4, 72, 95, '#111b1f') +
    `<path d="M${f(W * 0.3)},${f(bottom)} C${f(W * 0.36)},${f(horizonY + 130)} ${f(W * 0.5)},${f(horizonY + 100)} ${f(W * 0.56)},${f(horizonY + 190)} C${f(W * 0.6)},${f(horizonY + 260)} ${f(W * 0.56)},${f(bottom)} ${f(W * 0.46)},${f(bottom)} Z" fill="#0f1719"/>` +
    `<path d="M${f(W * 1.02)},${f(horizonY + 70)} C${f(W * 0.96)},${f(horizonY + 130)} ${f(W * 0.92)},${f(horizonY + 240)} ${f(W * 0.95)},${f(bottom)} L${f(W * 1.02)},${f(bottom)} Z" fill="#0e1517"/>` +
    `<rect x="0" y="${f(horizonY - 40)}" width="${f(W)}" height="${f(bottom - horizonY + 40)}" fill="url(#tp-haze)"/>`
  )
}
