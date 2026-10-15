Текущая версия после нового скриншота: [возврат утверждённой ткани](reference-cloth-restoration.md). Ниже — история предыдущего PBR-варианта.

> Текущая версия: [переработка ткани и ножниц](intro-wool-quality.md). Форма заменена четырьмя офлайн-симуляциями Blender; материал — фотографический Poly Haven Poly Wool Herringbone (4096×4181); технические данные Fabric083 ниже относятся к предыдущему проходу.

# RRC — photographic textile and HDR revision, 2026-10-14

Only the entrance is changed. Existing fonts, fixed HTML name, both entrances, PRIVATE ACCESS authorization, skip/session/reduced-motion/failure behavior and the rest of the site remain. No deployment or main merge. frontend-design was not used.

## Concrete defects corrected

The previous implementation mistakenly defined `USE_NORMALMAP_RG`, which Three 0.186 does not recognize. Packed roughness B was therefore interpreted as normal Z. This was our implementation error, not a missing texture. The production material now uses `USE_PACKED_NORMALMAP`. A real WebGL test imports the actual production material helper, renders normal output at two roughness values and confirms identical normals. The broken interpretation is also rendered as a negative control and gives a large difference. This test checks output pixels, not just a string in the shader.

The previous synthetic 8-bit environment clamped reflected radiance. A real photographed HDR studio is now prefiltered offline and retained as RGBA16F, including highlights above 1. Cloth now receives physical environment lighting as well as the soft top-left key. No emissive metal or animated glow. The previous procedural titanium-normal map is no longer loaded; clean satin metal uses the geometric normals and physical roughness under real HDR. Checked clean-metal catalog candidates were procedural or rusty/painted, so none was mislabeled as a titanium scan. The black material is calibrated in the color map, rather than a second excessive black tint hiding the weave.

The old herringbone blend was replaced by a different photographed fine woven scan. UV scale is finer and shared by desktop/portrait, avoiding giant mobile threads. Broad dye pigment was neutralized without generating new weave, random noise or painted fold lighting. Larger irregular shape variations are now retained from the licensed offline cloth drape, reducing the previous uniform rolled bands. Geometry/normals/raycast continue to agree during independent local grabs.

## Search and actual sources

Compared genuine ambientCG scans Fabric085, Fabric083 and Fabric079. Fabric085 is wool but too chunky/knitted for the approved suiting reference; Fabric079 is prominently ribbed. Chosen **Fabric083**, ambientCG / Lennart Demes, CC0 1.0 Universal, creation method PBRMultiAngle / height-field photogrammetry.

Origin: https://ambientcg.com/view?id=Fabric083
License: https://docs.ambientcg.com/license/
Native archive: https://ambientcg.com/get?file=Fabric083_4K-PNG.zip
Sources retained outside repository at `/workspace/rrc-realism-sources/Fabric083-4K`. Native maps: 4096² PNG, **normal and displacement genuinely 16-bit**. These are not upscaled smaller images. PyPNG reads the original 16-bit normals before filtering and renormalization. Roughness is the map supplied with the original photographed PBR set; no independent physical measurement is claimed. The provider does not specify fiber composition or physical dimensions: do not label this certified pure wool. Artistic tile calibration is 0.12 m, not a measured swatch dimension.

Source pigment is gray/white check. Uniform black dye replaces its broad pigment differences while preserving photographed fine luminance variations and original normal/roughness. The processing is documented in `prepare-suiting-scan.py` and `suiting-scan-manifest.json`. Runtime sizes: desktop 2048², mobile 1024². Color is sRGB; surface stores OpenGL normal XY in RG and linear roughness B. Positive normal Z is reconstructed correctly. Mipmaps and anisotropic texture filtering remain; no moving high-frequency noise.

Studio: **Poly Haven Studio Small 09**, Sergej Majboroda, CC0.
https://polyhaven.com/a/studio_small_09 · https://polyhaven.com/license
Native 1K Radiance HDR, 1,615,248 bytes. Offline linear downsampling and PMREM cube128 retain maximum radiance **440.5**. Runtime 384×512 RGBA16F CubeUV atlas. Lossless gzip reduces download from 1,572,864 to 683,373 bytes; raw atlas remains a compatibility fallback. Browser decompression is measured separately from fetch and all radiance bits are preserved. No runtime PMREM compilation/prefilter pass. Checksums and provenance in `studio-hdr-license.json`.

Macro shape: Microsoft CC0 Maya-simulated SheenCloth geometry, not its procedural textile material. The broad and smaller drape components are sampled into a bounded field; geometry, not the color map, creates fold light/shadow. Shape provenance in `cloth-gathers-license.json`.

A candidate scissors repository had **no license**, so its model was not reused. Poly Haven's model catalog offered bolt cutters, not appropriate tailor's shears. The original articulated solid model remains; the genuine HDR materially improves reflections, but its small CAD facets remain a quality limit.

## Runtime resource sizes

| Resource | Bytes |
| --- | ---: |
| suiting-scan-color-desktop.webp | 713076 |
| suiting-scan-surface-desktop.webp | 5910860 |
| suiting-scan-color-mobile.webp | 283834 |
| suiting-scan-surface-mobile.webp | 1846654 |
| studio-hdr-cubeuv.bin | 1572864 |
| studio-hdr-cubeuv.bin.gz | 683373 |
| cloth-gathers.bin | 264196 |
| titanium-shears.glb | 801324 |
| titanium-shears-mobile.glb | 534328 |

WebP reduces download size, **not GPU memory**. Color plus packed surface RGBA+mips occupy approximately 44.7 MB desktop / 11.2 MB mobile; HDR adds 1.57 MB, excluding other assets/shadows. Original source PNG/archive files are not shipped to browsers. Previous material/environment files are retained for provenance but no longer requested.

## Interaction and film

Both sheets own independent bounded spring state (1,050 total physics vertices); bicubic offsets drive real CPU geometry (12,642 desktop / 7,954 mobile surface vertices). Exterior pins, stretch limits, bending resistance and short damping keep local pulls heavy and bounded. Both visible meshes receive raycast; normal/bounds and projected hit paths follow deformation. Pointer capture, release outside, cancel/lost capture, resize/hidden/blur/unmount and extra-touch handling remain. HTML text/buttons are stable and never captured. Rendering stops at rest and in hidden tabs.

The resource-ready finite film remains cloth → shears → left-to-right cut → fixed HTML reveal only behind the contact → shears exit → menu. New UV density does not affect the independent raw cut coordinate. No decorative effects were added. Existing sound behavior is retained; no new audio assets.

## Validation and limits

See `media/cloth-grab-results.json`, `media/cloth-cold-start.json`, browser screenshots and native recordings in `intro-review.html` for final evidence. The real GPU normal test is `tests/packed-cloth-gpu.py`; it imports the production helper and checks pixels. The project check includes lint, typecheck, unit tests and production build.

Measurements use Chromium 154, Linux cloud Xeon VM, ANGLE/SwiftShader. Mobile means 390×844 with emulated DPR3/touch and capped 599,114-pixel canvas, **not a real phone**. Cold runs use fresh browsers, cleared/disabled cache, without recording; localhost and CPU×4 / 8Mbps / 80ms conditions. CPU timings measure update/submission; frame intervals include software driver scheduling; fences measure completion wall time, not hardware execution. This does not establish mobile hardware FPS.

Remaining quality limits: the controlled fold layout is not the photographed reference's exact drape; Fabric083's composition/physical swatch size are unspecified; scissors are authored CAD geometry rather than a premium scanned/artist-prepared hero model; no real phone/Safari/hardware GPU validation. No claim of hyperrealism. The user's original Next “1 Issue” was not reproduced; the opened panel had 0 and the indicator was not hidden.

## Changed files

`create-cut-scene.ts`, new `packed-cloth-material.ts`; `prepare-cloth-gathers.py`, new `prepare-suiting-scan.py` and `bake-hdr-studio.py`; new `suiting-scan-*` and `studio-hdr-*` assets/license notes in `public/intro`; real GPU regression test and updated resource-failure scripts; review/report/native media. Authentication and catalog files are unchanged.

## Final measurements and results

| Condition | Ready ms | First callback from navigation ms | CPU frame median / p95 ms | Render intervals median / p95 ms |
| --- | ---: | ---: | --- | --- |
| CPU ×1; unthrottled localhost | 3737.6 | 4701.9 | 4.8 / 21.1 | 380.2 / 813.5 |
| CPU ×4; 8Mbps/80ms | 6363.5 | 9068.8 | 41.7 / 182.6 | 419.6 / 1266.3 |

Software GPU intervals are slow: this is not a smooth-phone FPS result. No recording, other browser or build ran during the final cold measurements. The HDR fetch and inflate timings are separate in the raw JSON.

`npm run check` passed lint, typecheck, 26 unit tests and production build. Production browser checks passed the full desktop/mobile film, raw left-to-right mask, shared hinge, final render stop, pixel cap, HTML entries/focus, skip, once/session, reduced motion, resource failure, hidden pause and no-WebGL. Native mouse/touch checks passed both captures, both hovers, release outside, cancel/lost capture, resize/hidden, extra finger, replay/skip and both entries after interaction. Rapid/clamped input, complete replay, corrupted bitmap, loading timeout, unavailable/corrupt gzip codec recovery and corrupt HDR fallback all passed. The production-helper WebGL regression also passed; see `media/packed-normal-gpu.json`.
