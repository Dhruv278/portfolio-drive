// One definition of "phone layout" for CSS-free code paths. Keep in step with the media query in
// globals.css: portrait screens up to 900 px wide get the bottom sheet and the top-down camera.
// Landscape phones use the desktop layout with short-screen adjustments.
export const MOBILE_QUERY = '(max-width: 900px) and (orientation: portrait)'

export function isMobileSize(width: number, height: number): boolean {
  return height >= width && width <= 900
}
