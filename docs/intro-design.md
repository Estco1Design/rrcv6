# RRC entrance: two-sheet revision, 2026-10-14

Only the entrance scene is changed. Existing Unbounded / IBM Plex Mono fonts, wordmark, public entry, PRIVATE ACCESS server authentication and remaining pages are preserved. No deployment or main-branch merge is part of this revision. frontend-design was not used for this task.

## Causes found

The old deformation was a pointer-driven visual pulse, without a grab state. It did not give each sheet a real captured surface point. Large photographic fold lighting conflicted with moving geometry. Mobile used the same tool/texture costs as desktop; environment filtering and driver work could happen at the start of the film. SVG paths alone did not establish Chrome's mobile touch-action policy, causing vertical drags to become browser pans and cancel capture. The gesture policy now belongs to the hit-path SVG ancestor, outside the central HTML controls.

## Final behavior

One intact mesh covers the split until the blade contact passes. The finite 4.5-second choreography reveals cloth, brings in the same articulated shear, cuts left to right in four strokes, reveals fixed HTML letters only behind contact, exits right and opens the existing menu. Resources, texture uploads, shaders and a hidden first draw are warmed before the clock starts. The preparation plate is quiet and text-free. Timeout is bounded to 12 seconds; skip/error/context loss/reduced motion show working HTML entrances immediately.

After the film, each panel owns a CPU spring lattice, base positions, velocities, pins and grab state. Outer/side vertices are fixed. Local Gaussian targets, neighbor bending resistance and two structural stretch projections per substep distribute motion. Timestep is capped at 1/15 second, with at most four 1/60 substeps. Drag is limited to 4% of the shorter viewport side; hover is approximately 4–9 CSS pixels. The cut edges are prevented from intruding into the central menu. Release has bounded damping and settles within 1.15 seconds.

Pointer Events raycast the **actual updated CPU mesh**. Both panels recalculate normals and bounds after deformation. Transparent hit paths are projected from the current mesh edge, not rectangular half-screen hitboxes. One pointer owns capture; extra touches cannot replace it. Pointerup/cancel/lost capture, missing mouse buttons, blur, visibility, resize and unmount release it. Central HTML controls and sound/skip never start a cloth drag. `touch-action:pinch-zoom` is scoped to the hit SVG; page/viewport zoom is not disabled.

After settling, there is no frame loop. Input wakes rendering; hidden tabs stop it. A session repeat loads the final **interactive** pose without replaying the movie. Completion also synchronizes the internal clock to 4.5 seconds, so a resize/input wake cannot overwrite that pose with time zero. Public entry keeps the existing session behavior. Reduced motion uses only the static plate and HTML, with no Three.js request.

## Material and scissors

Original 2048² procedural yarn maps have matching albedo, micro-normal and roughness. They are not a photographic 4K scan. The animated material contains no baked macro folds/light; folds are mesh shape with recalculated normals. Albedo is sRGB; normal/roughness/environment are linear. Maps repeat at matching density, with mipmaps and bounded anisotropy; normal strength and sheen are restrained.

The Blender tool has asymmetric hollow grips, forged necks with real depth transitions, six-segment machining bevels, thick satin blades with a shallow convex face and thin polished edges. Outward winding is corrected on both grips and the mirrored lower parts. Both arms rotate around one shared bolt. Blade depth is no longer multiplied by an artificial sixfold scale. Local cloth pressure places its surface at depth 0.286, between the flat mating faces (0.2845 / 0.2875 in scene space). Camber is limited to the exterior blade faces; the tool stays in that plane while its arms rotate around Z. This keeps the lower blade beneath the cloth and the upper blade above during contact. An offline prefiltered softbox supplies changing metal reflections; there are no glowing highlights, postprocessing or runtime PMREM passes.

## Fixed quality profiles

| Parameter | Desktop | Mobile (<768 CSS px at preparation) |
| --- | --- | --- |
| Cloth grid per sheet | 64 × 28 segments | 40 × 24 segments |
| Two final-sheet vertices | 3,770 | 2,050 |
| Canvas pixel budget | 1,100,000 | 620,000 |
| DPR ceiling | 1.3 | 1.35 |
| Scheduler ceiling | 30 fps | 24 fps |
| Albedo / normal / roughness | 1024 / 768 / 768 | 768 / 512 / 512 |
| Model bytes | 898,096 | 556,916 |

These are ceilings, not achieved FPS claims. No quality oscillation occurs during interaction. Runtime texture RGBA allocation including ordinary mip chains is approximately 12.0 MiB desktop / 6.33 MiB mobile, excluding framebuffer, MSAA, geometry and CPU bitmaps. WebP saves transfer bytes, not GPU RGBA allocation. KTX2 was not added: this modest resource set does not establish that an additional transcoder and startup pipeline would be faster.

Exact dimensions and file sizes are recorded in `media/cloth-resource-sizes.json` and [the resource manifest](../public/intro/README.md).

## Acceptance

`npm run check`: ESLint, TypeScript, **23/23 unit tests** and production build passed. Three new tests cover model winding plus independent sheets, pinned borders, drag bounds, aperture protection and cancellation/settling. Existing cut/shared-hinge and auth/account tests remain in the suite.

`tests/cloth-grab-smoke.py`: native-clock browser acceptance, separate fresh desktop and touch contexts. Passed upper hover, lower hover, upper/lower mouse grabs, upper/lower touch grabs, release outside original area, pointercancel, real lostpointercapture, resize during capture, additional finger, hidden-handler cancellation/pause, idle-loop stop, stable HTML wordmark, private input after interaction, replay/skip and public entry/unmount. An optional recording-only pointer ring/label identifies which sheet is captured; it is injected by the test, not shipped with the site. Video and automated touch dispatch add overhead; these acceptance timings must not be presented as device performance.

`tests/fabric-interaction-smoke.py` now invokes this acceptance suite; the obsolete shader-pulse/virtual-time check is replaced. `tests/fabric-intro-smoke.py` checks analytic film stages, reveal behind cut, final idle, pixel budget, HTML focus, skip during asset/module load, once/session, reduced motion, failure, visibility pause, no WebGL and short private-form viewport. Its functional frame clock is deliberately separate from native-clock performance runs.

`tests/cloth-lifecycle-smoke.py`: passed native-clock repeat across reload/wake, rapid/clamped input on both panels, a complete replay, private input, corrupt bitmap decode and the 12-second loading timeout. Native keyboard/touch focus checks and ESTCO → welcome → private home → logout also passed against isolated databases.

Raw browser screenshots and native videos are copied into `docs/media`; the review page presents the untouched approved reference beside the actual rendered final. Video demonstrates appearance and behavior; it does not prove mobile hardware performance.

## Measurement method and limitations

Machine: Debian 13 cloud VM, Intel Xeon Platinum 8573C, 5 visible vCPU (cgroup quota: 4 CPU). Browser: Chromium 154.0.8037.57, headless ANGLE/SwiftShader software renderer. Mobile viewport: 390 × 844, emulated DPR3 and touch; the canvas uses its separate capped profile. **No real phone, mobile Safari or hardware mobile GPU was tested.**

Cold tests launch a fresh browser process, clear/disable cache and do not record video. Separate runs use unthrottled localhost and CDP CPU ×4 plus 8 Mbps / 80 ms network. Detailed per-resource fetch/decode, model parse, geometry preparation, upload, compile, GPU warmup and first-frame callback measurements appear below and in `media/cloth-cold-start.json`.

GPU fences measure wall time until completion, **not GPU hardware execution time**. `cpuFrameMs` measures JS scene update and renderer submission, not presentation. Render intervals measure intervals between submitted frames, including software renderer/browser scheduling. `firstShownNavigationMs` is the first prepared requestAnimationFrame callback from navigation, not a physical screen scanout measurement. Tests without video are used for the performance table.

The rendered material/model remain authored CG approximations. They do not equal the photographic reference in weave softness, wrinkle complexity or light response. A measured black suiting PBR scan and a professionally sculpted/validated hero tool would further improve fidelity; simply enlarging these generated maps would not. The loading/fallback photograph and interactive CG pose are visually distinct. Recorded audio assets are absent in the existing manifest; sound is disabled, with the original lifecycle preserved. Do not call this a measured 4K material, real-phone performance certification or a fully sound-designed film.

## Changed files and local preview

Runtime: `src/components/intro/create-cut-scene.ts`, `cloth-dynamics.ts`, `FabricCutScene.tsx`, `RrcBootIntro.tsx`; scoped entrance styles in `src/app/globals.css`.

Resources: new portrait plate, yarn sources/runtime maps, offline CubeUV and mobile shear LOD under `public/intro/`; regenerated desktop shear. Generators under `scripts/intro/`. Tests: extended `intro.test.ts`, `cloth-dynamics.test.ts`, `cloth-grab-smoke.py`, `cloth-cold-start.py`, `fabric-intro-smoke.py`, `fabric-interaction-smoke.py`, `cloth-lifecycle-smoke.py`. Documentation: this report, resource README and review media.

Production preview runs on port 3000 with isolated account/private SQLite databases and media under `/tmp`. User data and `.env.local` were preserved. For your machine: `npm ci`, then `npm run dev`; open `http://localhost:3000` in a fresh/private session. Use “Повторить” for another shot. The published website is unchanged.

## Cold-run results (final code and assets, no video recording)

| Metric (ms) | Localhost, CPU ×1 | 8 Mbps / 80 ms, CPU ×4 |
| --- | ---: | ---: |
| Dynamic module import | 101.9 | 420.1 |
| WebGL context / initial scene | 810.5 | 117.6 |
| Parallel resource phase incl. context | 908.8 | 969.8 |
| Model fetch | 64.4 | 744.1 |
| Model parse | 13.2 | 98.3 |
| Color bitmap decode | 17.7 | 35.0 |
| Normal bitmap decode | 11.9 | 19.2 |
| Roughness bitmap decode | 11.0 | 20.5 |
| Metal-normal bitmap decode | 12.1 | 16.0 |
| Studio bitmap decode | 12.2 | 8.1 |
| CPU geometry/material preparation | 111.3 | 281.6 |
| Texture upload submit | 40.4 | 69.5 |
| Texture completion fence wall time | 167.0 | 213.2 |
| Shader compileAsync | 26.9 | 94.6 |
| Hidden first draw + completion fence | 868.6 | 855.2 |
| Scene factory ready (excl. module import) | 2094.2 | 2471.6 |
| Prepared first RAF from navigation | 2822.2 | 4884.0 |
| Interaction JS/submission median | 2.3 | 28.2 |
| Interaction JS/submission p95 | 18.3 | 106.4 |
| Observed render interval median | 122.9 | 241.9 |
| Observed render interval p95 | 291.7 | 533.5 |

Each column is one fresh-process/cache-disabled run, not a population confidence interval. Interaction sample counts: 40, 44. Both use the mobile profile, 599,114 actual canvas pixels and 2,050 final-sheet vertices. Per-resource fetch times, model hash and raw samples are in `media/cloth-cold-start.json`. Fetches run concurrently; do not sum them.

An earlier series showed severe cloud/software-renderer stalls (unthrottled JS p95 784.3 ms, render-interval p95 18,576.9 ms; CPU ×4 interval p95 680.9 ms). It is retained as `media/cloth-cold-start-first-series.json`. The measurements were repeated to investigate variability, assert capture/reset sample history and verify the final corrected tool. The outlier is not erased or attributed to a proven cause. No result here establishes smooth real-phone rendering.
