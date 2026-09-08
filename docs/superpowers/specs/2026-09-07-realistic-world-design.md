# The Drive: realistic world, design

Date: 7 September 2026. Supersedes the "modelled kits, clean look" art direction of `2026-09-07-the-drive-design.md` for the scene only. The HTML layer, content, scroll model and performance rules stay.

## Why

The owner reviewed the live site and said the trees, buildings and car do not look real. He chose "realistic world, staged" over "real light on the current kits": a scene that reads as a real road under a real sky, with a real car, delivered in stages he reviews one at a time. Research (library and asset survey, same date) set the constraints below.

## Budgets, fixed

| Budget | Value | Why |
|---|---|---|
| Frame rate while driving, Intel Iris Xe, dpr 1.25 | 30 fps or better | The current scene runs at 45 to 53 at dpr 1.5; realism costs about a third |
| Frames while idle | 0 | Rendering stays on demand |
| Download at first paint, all stages | under 10 MB, models compressed with meshopt, textures 1k WebP or KTX2 | Job application, often opened on a phone |
| Shader compile | all materials present at mount, compiled by `gl.compileAsync` before the fade | Light count, environment map, tone mapping and shadow type never change at runtime |
| GPU set-up | HDR decode, prefilter, environment assignment, shader compile and the first frame each in their own frame during the warm-up | Doing them in one frame lost the WebGL context on Intel graphics |
| Licences | CC0 preferred, CC-BY allowed with credit in `LICENSE-ASSETS.md` and on the resume page's credits line | No CC-NC, no editorial, no unclear uploads |
| Phones | no post-processing, no soft shadows, dpr 1.25, same assets | The phone camera looks down at the car; the sheet covers half the screen |

## Stages

### Stage 1: real light, real car, real road

- Lighting: one directional sun that follows the car (exists), a CC0 Poly Haven HDRI (`autumn_field_puresky`, 1k) as `scene.environment` for reflections and fill and, unblurred, as the visible sky. Fog in a sky-haze colour hides the seam between the ground plane and the sky photo. (Amended 8 September after review: the photo sky read as far more real than the drawn colour; the partly cloudy Kloofendal HDRI read as grey and was dropped.) Tone mapping set once at Canvas creation (`NeutralToneMapping`); dusk changes only uniforms: `environmentIntensity`, sun colour and intensity, exposure, fog colour.
- Shadows: PCF shadow map, 1536 on desktop (PCFSoft is deprecated in three r185 and falls back to PCF); `ContactShadows` under the car for ground contact. No PCSS patch, no accumulative shadows.
- Materials: road, kerbs, ground and water move to `MeshStandardMaterial` with the environment map. Road gets arc-length UVs and a texture strip painted once in Canvas 2D: tiled asphalt (Poly Haven `aerial_asphalt_01`, colour, normal, roughness), edge lines, centre dashes and light tyre wear. The dash instanced mesh and the four line meshes go away. Kerbs: `concrete_pavement_02`. Ground: `leafy_grass` colour, normal and roughness, its colour map rebuilt at load as sixteen flipped and rotated copies under a soft light-and-shade wash so the repeat sits at 28 m (`aerial_grass_rock` was tried and read as a dry field). Kit scenery stays Lambert until stage 2 replaces it.
- Car: a CC-BY realistic sedan from Sketchfab, downloaded by the owner under his account, compressed with `gltf-transform` (meshopt, 1k WebP) to 2 to 3 MB, body repainted cobalt through the material colour, `MeshPhysicalMaterial` with clearcoat 1 and clearcoat roughness 0.03, glass with transmission off (plain transparent Standard). Wheels found by node name for spin and steer, as today. Headlamps and tail lamps emissive, beam cones stay.
- Post-processing (desktop only): `EffectComposer` with `multisampling={0}`, `SMAA`, `N8AO` at half resolution and performance quality, `Vignette`. One warm-up frame before `onReady`. Measured: 23 fps with the chain against 40 without on Intel Iris Xe, so the chain runs only when the WebGL renderer string is not integrated graphics; `?fx=1` forces it on, `?fx=0` off.
- Sky and clouds: drei `Clouds` with a self-hosted sprite replaces the sphere clouds; the box birds stay until stage 2.

Acceptance: owner review of screenshots at each stop, desktop and phone; `?stats=1` shows 30 fps or better driving on the owner's laptop; e2e green on five engines; no console errors; Lighthouse accessibility and best practices still 100.

### Stage 2: real trees and buildings

- Trees: procedurally generated with the MIT `ez-tree` generator at build time (bark and leaf textures CC0), exported once to GLB and instanced along the road in three or four species. If the generator's output is too heavy, fall back to CC-BY low-poly trees with photo leaf cards.
- Buildings: box and L-shaped masses generated from the placement table with CC0 facade, roof and pavement textures (ambientCG `Facade*`, Poly Haven roofs), window emissive maps that light at dusk, ground-floor variation. This replaces the Kenney suburban, commercial and industrial kits. The windmill, pier, posts and billboards get textured Standard materials.
- Terrain: a displaced plane flattened along the road corridor replaces the sphere hills (the clearance test moves to the terrain sampler).

### Stage 3: motion layer

`motion` (`motion/react`) for panel choreography replacing the CSS stagger, animated counters, hero text reveal, view transition to `/resume`. Native scroll untouched.

## What does not change

`src/content/profile.ts`, the six stops, the scroll model, the HUD, the resume route, the fallback without WebGL 2, the reveal attribute, the demand frame loop, the idle loop, the tests. The design language of the HTML layer (paper, ink, cobalt) stays; the scene becomes photographic under it.

## Risks

- A realistic car among stylised kits looks wrong during stage 1. Accepted: the owner reviews stage 1 knowing stage 2 replaces the kits.
- Sketchfab licences are uploader-declared. Each model is opened, checked for brand lookalikes and ripped geometry, and credited by title, author and URL.
- Download growth. Every asset is listed with its size in `LICENSE-ASSETS.md`; the total is checked by a unit test against the 10 MB budget.
- Frame rate. Each stage lands with a measured before and after in the session report.
