# RRC textile opening / design plan

Reference 4 is the final composition: fabric ridges above and below, uninterrupted black opening, a small centered wordmark and two restrained entrances.

Palette: void #000000; cloth shadows #080809; cloth ridges #242426; titanium #b3b2ae; wordmark #deddd8. Existing Unbounded 300 for the wordmark, IBM Plex Mono for the small entrances. No new font.

Layout: top cloth / central name / two entrances / bottom cloth. Desktop name approximately 45% of the screen width, around 48% screen height; phone uses the full safe width with smaller type. Two entrances remain side by side.

Motion: one finite 4.5-second shot. Cloth is revealed by light, settles once, then opens only behind the scissor contact. A single split, bevelled 3D shear asset articulates around one pivot and exits right. No idle animation, particles, typing, glow or decorative UI.

Technique: lightweight Three.js, deformable cloth with dedicated material maps; opaque sculpted titanium shears; real HTML wordmark under the canvas, spatially clipped behind contact; HTML buttons fade at the end. No postprocessing or physics simulation. Renderer capped by DPR and total pixels, 30 fps desktop / 24 mobile. Reduced motion and failure use final cloth plate. Shared session key preserves existing entry behavior.

Review: preserve the sparse reference, not a large fashion headline or fullscreen decorative sculpture. The cut is the only narrative event; UI stays quiet. Static assets must contain no text or scissors. No reference slideshow.

## Implementation and repeatability

The shot uses one connected uncut mesh and two split, deforming panels with a shared projected photographic material. The connected mesh is removed spatially at the blade intersection; the panels behind it open with a short delay. Projection keeps distant folds continuous across the front. The final still plate is reserved for reduced motion, loading failure and later refreshes. Name reveal has a small additional safety margin behind the cut; the letters are never animated individually.

The instrument has four strokes. Its hinge advances while reopening; the cut grows during closing at the actual intersection of the honed cutting edges. Shear proportions and materials stay constant. A soft area light and restrained environment provide reflected highlights, never emission.

The 4.5-second clock starts after assets are ready. An 8-second asynchronous loading timeout falls back to the final HTML menu. Animation is marked played on first attempt; refreshing halfway through shows the final still. Entering stores the existing rrc_intro_seen key. Skip shows the final still immediately and does not enter the public site. Reduced motion does not load Three.js, the shear model or normal maps. WebGL loss, asset failure and absent WebGL leave the entrances usable.

Renderer cap: at most 960,000 pixels, maximum DPR 1.25 desktop / 1.15 narrow screens; scheduling capped at 30 / 24 fps. No postprocessing, realtime shadow maps or full physics. No continuous frame loop after completion. Hidden visibility stops the clock and render loop. Resize redraws a final still only when necessary.

Generated photographic cloth supplies fine weave and large folds. The geometry deforms cut edges and shallow folds; it does not reproduce full material physics. This is an intentional lightweight 2.5D technique. Mobile fits the full composition to its viewport; it does not crop the center of a landscape frame.

## Files

Runtime: src/components/intro/RrcBootIntro.tsx; FabricCutScene.tsx; create-cut-scene.ts; cut-timeline.ts; src/app/globals.css.
Resources: public/intro/cloth-intact.webp; cloth-plate.webp; titanium-shears.glb; twill-normal.png; titanium-normal.png; README.md.
Generators: scripts/intro/generate-shears.py; generate-textures.py.
Checks: tests/intro.test.ts; tests/fabric-intro-smoke.py; existing tests/intro-smoke.py and browser-smoke.py.

## Validation — 2026-10-13

- npm run check: ESLint, TypeScript, 20/20 Node tests, production build — passed. Final CSS adjustments were followed by a successful production build (including lint/type validation).
- tests/fabric-intro-smoke.py against the standalone production server — passed: all shot stages at 1280×720 and 390×844/DPR3, cut masking, shared hinge, fixed HTML wordmark (including opening the private form), complete far-right release, final renderer stop, pixel budget, skip during assets and pending dynamic module, session replay behavior, reduced-motion resource avoidance, failed model download, visibility pause/resume, disabled WebGL, short 320×280 form viewport/scroll reset. No unhandled page exceptions or unexpected console errors. The disabled-WebGL probe intentionally emits the renderer's expected context-creation diagnostics.
- Existing tests/browser-smoke.py — passed: original private code entry, greeting, five sections, forged/revoked cookie checks, accounts, both fit models, measurement persistence, mobile layout, fallback and account removal. Existing tests/intro-smoke.py — passed.
- Native-clock follow-up: ESTCO → welcome → private home → sign out; public page has no private link and no repeated intro — passed.
- Emulated native touch: both entrances and Back — passed. Keyboard: Tab, Enter, Escape, focus restoration and public entry — passed.
- Screenshots: qa/fabric-{1280,390}-{black,fabric,entry,cut,cut-right,spread,final,code}.png. Reduced motion: qa/fabric-reduced-320.png.
- Video: qa/intro-preview.mp4, actual browser frames sampled at 12 fps with controlled time, 960×540. This demonstrates appearance, not device throughput. The website runs the WebGL scene, not this video.

The animation is sampled with Playwright's clock. To avoid flooding the software GPU, stage checks fast-forward to analytic poses; navigation is checked with a native clock because mocked performance time across document reloads is incompatible with Motion's native animation exit clock. Visibility checks dispatch synthetic visibility events. These distinctions do not constitute a real-device performance measurement.

Real-phone FPS, mobile Safari and physical on-screen keyboards were not tested. Cloth uses photographic large folds and shallow, controlled geometry; it is not a full volumetric material simulation. The scene clock is 4.5 seconds after assets are ready; network/loading time can precede it. Browser refreshes and skip use the final still.

Preview server: port 3000, bound to 0.0.0.0, with isolated /tmp account/private databases. User data and .env.local are preserved. No deployment or main-branch merge was performed. To see the intro again, use a fresh/private browser session.
