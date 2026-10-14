# RRC intro resources

The animated cloth uses real deformed geometry and a coordinated original yarn material, not a projected photograph. Photographic plates are limited to loading, reduced motion and failure/skip menus. Neither plate contains text or scissors.

| Resource | Native/runtime size | Use |
| --- | --- | --- |
| cloth-plate.webp | 1672 × 941; 131,688 bytes | Desktop static plate, generated from the approved final composition |
| cloth-plate-mobile.webp | 853 × 1844; 129,566 bytes | Separately generated portrait plate, not a landscape center crop |
| wool-{color,normal,rough}-source.png | Each 2048 × 2048 | Original procedural 2K yarn sources, **not a scan or upscaled 4K texture** |
| wool-color-desktop.webp | 1024²; 55,222 bytes | sRGB albedo |
| wool-normal-desktop.png | 768²; 388,861 bytes | Linear tangent-space normal |
| wool-rough-desktop.png | 768²; 117,114 bytes | Linear roughness |
| wool-color-mobile.webp | 768²; 57,068 bytes | Mobile albedo |
| wool-normal-mobile.png | 512²; 172,300 bytes | Mobile normal |
| wool-rough-mobile.png | 512²; 54,974 bytes | Mobile roughness |
| titanium-shears.glb | 898,096 bytes | Original Blender high-detail shear, common-pivot UpperArm / LowerArm |
| titanium-shears-mobile.glb | 556,916 bytes | Same model and pivot, decimated mobile LOD |
| titanium-normal.png | 256²; 81,755 bytes | Satin metal micro-normal |
| studio-cubeuv.png | 336 × 256; 24,826 bytes | Original softbox environment, prefiltered offline; linear RGB CubeUV |

Color/normal/roughness share UV density. Macro folds and changing lighting come from mesh shape; there is no baked photographic fold lighting in the animated material. The metal has three shared physically based materials: satin bodies, polished cutting edges, bolt. No emissive highlights.

Generators: `scripts/intro/generate-wool.py` (NumPy/Pillow), `generate-shears.py` (Blender), `bake-studio.py` / `studio-bake.html` (local Three.js + Chromium). `generate-textures.py` is retained for the metal normal. No third-party licensed scans or scissor models were added.

Older cloth-intact.webp, wool-albedo*.webp and twill-normal.png are retained as provenance, but are not requested by the current 3D scene. Original photographic/image-generation assets are illustrative resources, not measured PBR material scans.

Audio hooks and the manifest remain unchanged. `audio/manifest.json` has no recordings, so sound is explicitly unavailable; no synthetic replacement or silent autoplay is presented as finished sound design.

Implementation, measurements, acceptance conditions and limitations: [../../docs/intro-design.md](../../docs/intro-design.md).
