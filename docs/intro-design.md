# RRC textile revision — 2026-10-14

Only the entrance changes. Existing fonts, HTML name, public entry and PRIVATE ACCESS authorization remain. No deployment. frontend-design was not used.

## Diagnosis and corrections

Previous yarn was a procedural grid, not scanned wool. Mobile reduced the silhouette mesh too far; contour interpolation flattened tangents at knots. Lighting and sheen washed out black. Tool XYZ scaling was inconsistent, thin overlapping edge/spine meshes produced duplicate reflections, and same-side grip linkage moved incorrectly. Anisotropic metal without reliable tangent frames also produced extreme reflections; it is now disabled rather than disguised with lighting.

The final cloth uses scanned color, calibrated OpenGL micro-normal and measured roughness. Intrinsic arc-length UVs preserve physical density across portrait and landscape; raw cut coordinates are a separate attribute, so textile UV changes cannot reveal text ahead of the blade. Cubic contours and denser CPU surfaces remove faceted borders. Nonperiodic broad geometric folds incorporate a separately licensed secondary gather shape. Restrained sheen, black dye and a soft directional studio key replace the earlier gray wash. Real shadow maps replace the fake oval tool shadow.

## Provenance and resources

Poly Haven **poly_wool_herringbone**, photographed by colormass, processed by Rico Cilliers. CC0-1.0: https://polyhaven.com/license . Source: https://polyhaven.com/a/poly_wool_herringbone . It is a wool/polyester blend, **not verified pure wool**. Original color/EXR normal/EXR roughness are 4096×4181, physical sample 270.079×275.700 mm. Publisher checksums and source URLs are in `public/intro/wool-scan-manifest.json`; full license note in `WOOL-LICENSE.md`. Sources retained at `/workspace/rrc-material-sources/poly_wool_herringbone`.

Runtime desktop maps: 2048×2090; mobile: 1024×1045. Color is sRGB, normal/roughness linear. Lossless surface map packs normal XY into RG and roughness into B; positive normal Z is reconstructed. No painted macro light, procedural noise or upscaled source. WebP reduces download bytes, **not GPU texture memory**. Estimated combined RGBA texture+mipmap residency: 45.7 MB desktop, 11.4 MB mobile, excluding other resources.

Secondary gather geometry: Microsoft CC0 SheenCloth, from Khronos glTF-Sample-Assets; only geometry was processed, not its procedural fabric material. Attribution/checksums in `cloth-gathers-license.json`. Scissors are original authored Blender solids, not a purchased hero model. One solid per articulated arm plus one hinge; polished facets are material groups, not overlay meshes. Rounded asymmetric grips, corrected lever linkage, mating blade faces and shared pivot are preserved in mobile LOD. Close-up review exposes remaining limitations rather than claiming cinematic asset quality.

| Runtime resource | Bytes |
| --- | ---: |
| wool-scan-color-desktop.webp | 1684042 |
| wool-scan-surface-desktop.webp | 8607238 |
| wool-scan-color-mobile.webp | 481886 |
| wool-scan-surface-mobile.webp | 2396150 |
| cloth-gathers.bin | 264196 |
| titanium-shears.glb | 801324 |
| titanium-shears-mobile.glb | 534328 |

Preparation: `scripts/intro/prepare-scanned-wool.py`, `prepare-cloth-gathers.py`, `generate-shears.py`. The previous procedural wool assets remain as provenance but are no longer requested.

## Interaction and rendering

Each sheet owns an independent 525-vertex bounded spring lattice. Bicubic interpolation drives its actual CPU-rendered surface (desktop 12,642 total vertices, mobile 7,954). Normals and bounds follow deformation; raycast uses this same surface. Exterior pins, stretch projections, bending resistance, capped timestep and 4%-short-side displacement bound prevent spikes and menu intrusion. Local hover and captured pointer drag affect neighboring folds, not the whole sheet. Release, cancellation, capture loss, blur/hidden, resize and unmount settle/release correctly. One touch owns capture. HTML controls remain separate. Rendering stops at rest and resumes on input; the film hands off to the final rest shape.

The finite film remains intact-cloth → tool → left-to-right cut → HTML reveal behind the cutting point → exit → menu. Load/decode/upload/compile/warm-up complete before the clock starts; bounded timeout, skip, reduced motion and resource/WebGL failure preserve the working HTML menu. Existing sound switch remains; no new audio assets or effects were added.

## Verification and limits

See `media/cloth-grab-results.json`, `media/cloth-cold-start.json` and the review page for actual acceptance evidence. Measurements are Chromium 154 on a Linux cloud Xeon VM using ANGLE/SwiftShader. Mobile means 390×844, emulated DPR3 and touch, **not a real phone**. Cold runs use fresh browser processes with disabled cache; one unthrottled localhost run and one CPU×4 / 8 Mbps / 80 ms run. CPU frame values measure update/submission, render intervals include software driver scheduling, fences measure completion wall time, not hardware GPU time. These are not mobile FPS claims.

The user's original Next.js “1 Issue” was not reproduced: opened dev panel reported Issues=0. Catalog image-quality warnings and unsupported parallel shader extension are separate warnings. The indicator was not hidden; the user's exact message is still needed to diagnose their issue.

Limitations: no real iPhone/Android/Safari validation; controlled folds are not identical to the approved photographed arrangement; original CAD shears still lack a premium scanned/artist-authored production model and measured HDR studio reflections. Genuine blend scan is a valid licensed textile resource but not a certified pure black suiting-wool scan. Missing production assets: an artist-authored/scanned tailor-shear model with clean manifold blade bevels and separate common-pivot arms; a closer pure black suiting-wool scan; a calibrated softbox HDR environment. The current authored shear still has imperfect small blade facets in close-up. These resources are needed to claim the approved photographic quality, which this revision does not yet achieve. No claim of hyperrealism.

## Final measurements

| Cold condition | Scene ready ms | First callback from navigation ms | CPU frame median / p95 ms | Render interval median / p95 ms |
| --- | ---: | ---: | --- | --- |
| CPU ×1; unthrottled localhost | 2905.2 | 3777.5 | 4.8 / 15.7 | 246.3 / 543.4 |
| CPU ×4; 8Mbps/80ms | 5800.3 | 9442.2 | 24.0 / 64.3 | 232.9 / 304.2 |

Mobile render: 599,114 pixels, 7,954 surface vertices, 1,050 physics vertices. Software GPU intervals above are slow and do not establish smooth real-phone performance. No recording or concurrent browser/build test ran during these final cold measurements.

Validation: npm run check passed lint, typecheck, 26 unit tests and production build. Final model rechecked with 26 tests after its forged-face triangulation and outward-winding fixes. Browser acceptance passed desktop/mobile film, masking, render stop/caps, public/private entries, keyboard focus, skip/session/reduced/WebGL failure; both hover/mouse captures, both touch captures, release outside, cancellation/lost capture/resize/hidden, extra finger, repeat, corrupted bitmap and timeout. ESTCO server session, welcome, private home and revocation/logout also passed against isolated temporary databases.

## Changed files

- `src/components/intro/create-cut-scene.ts`, new `cloth-surface.ts`: materials, light/shadows, fine CPU geometry, UVs, tool scaling/contact and sampling.
- `scripts/intro/generate-shears.py`, new `prepare-scanned-wool.py`, `prepare-cloth-gathers.py`: reproducible preparation.
- `public/intro/titanium-shears*.glb`, `wool-scan-*.webp`, manifest/license notes, `cloth-gathers.bin` and provenance JSON.
- `tests/intro.test.ts`, new `cloth-surface.test.ts`, `cloth-lifecycle-smoke.py`: geometry/material failure coverage.
- `docs/intro-design.md`, `intro-review.html`, `docs/media/*`, `public/intro/README.md`: actual browser evidence and resource provenance.
