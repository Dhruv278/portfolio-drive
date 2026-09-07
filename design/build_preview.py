# Assembles preview.html from _shell.html (HTML, CSS, panels) + import map + _scene.js (Three.js scene).
# Run from this folder: python build_preview.py
import pathlib
here = pathlib.Path(__file__).parent
shell = (here / '_shell.html').read_text(encoding='utf-8')
script = (here / '_scene.js').read_text(encoding='utf-8')
shell = shell.replace('<div class="track"><i id="trackFill"></i></div>\n  </div>',
  '<div class="track"><i id="trackFill"></i></div>\n    <div id="loadStatus" style="font-size:11px;color:var(--ink-2);margin-top:4px;min-height:14px"></div>\n  </div>')
shell = shell.replace('<li>The car is built in code: an extruded sedan silhouette with bevelled edges, tinted glass, wheel arches, rims, steering front wheels, body roll and pitch, and headlights that switch on at dusk. If you prefer a different shape, the real build can load a Blender-made model instead, same paper style.</li>\n            <li>Buildings and trees are boxes and cones. The real build gets a designed low-poly set, still no textures.</li>',
  '<li>Buildings, trees, props and the car are now modelled assets from Kenney\'s City, Nature and Car kits (public domain, CC0). The car is repainted cobalt in code and keeps the steering, body roll, exhaust and dusk headlights, driven through the model\'s own wheel nodes.</li>\n            <li>Billboards, the pier, hills and the road are still built in code. The real build gets proper models or textures for these too.</li>')
shell = shell.replace('<p>This preview is the real interaction model: scroll is the only clock, the car idles at each stop while its panel is pinned, the camera follows with a slight lag, and scenery unfolds as you approach. The shapes are placeholder primitives so you can judge palette, motion and reading experience, not final models.</p>',
  '<p>This preview is the real interaction model: scroll is the only clock, the car idles at each stop while its panel is pinned, the camera follows with a slight lag, and scenery unfolds as you approach. Buildings, trees, props and the car are modelled assets, so what you see is close to the final look. Sizing, placement and colour balance are still being tuned.</p>')
importmap = '<script type="importmap">{"imports":{"three":"https://unpkg.com/three@0.170.0/build/three.module.js","three/addons/":"https://unpkg.com/three@0.170.0/examples/jsm/"}}</script>\n'
out = shell + importmap + '<script type="module">\n' + script + '\n</script>\n</body>\n</html>\n'
(here / 'preview.html').write_text(out, encoding='utf-8')
print('preview.html', len(out), 'bytes')
