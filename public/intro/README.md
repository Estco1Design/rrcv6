# Active entrance resources

The latest approved mobile screenshot is the visual target. `create-reference-cloth.ts` projects the existing text-free `cloth-plate.webp` (1672×941) and `cloth-plate-mobile.webp` (853×1844) onto two independently deformable meshes. Original artwork pixels and baked lighting are deliberately retained. This is not a newly scanned or physically relit wool material.

Silhouette coordinates: `src/components/intro/reference-contours.json`; preparation: `scripts/intro/reference-contours.mjs`. HTML brand title and both entrances stay separate from the image. No lettering is baked into these resources.

Metal uses `titanium-shears*.glb` and `studio-hdr-cubeuv.bin(.gz)`. HDR source and CC0 notice: `studio-hdr-license.json`. Sound and its provenance are under `audio/`.

Previous PBR scans (`suiting-scan-*`, `wool-*`), procedural normal maps and `cloth-rest.bin` are retained as authoring/history resources but are not fetched by the active entrance. Historical reports must not be used as current pixel or performance evidence.

Current implementation and limitations: `docs/reference-cloth-restoration.md`. Commercial-use source records: root `ASSETS.md`. No maximum-resolution or hyperrealism claim is inferred from file names.

Shears have been rebuilt from the newly supplied top-view reference: original Blender source at `scripts/model-source/shears/reference-shears.blend`, generator `scripts/intro/generate-shears.py`. Current views, mechanical checks and timing limits: `docs/shears-reference-update.md`. The GLBs embed authored directional machining microrelief, not painted reflections.
