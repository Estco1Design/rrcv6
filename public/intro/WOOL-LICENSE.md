# Wool scan provenance and license

Asset: **Poly Wool Herringbone**, Poly Haven.
Source: https://polyhaven.com/a/poly_wool_herringbone
Photography: colormass. Processing: Rico Cilliers.

The asset is released under **Creative Commons Zero 1.0 Universal (CC0-1.0)**.
Poly Haven's asset license: https://polyhaven.com/license
Legal instrument: https://creativecommons.org/publicdomain/zero/1.0/

CC0 allows commercial use, modification and redistribution without attribution.
Attribution is retained here for traceability. This is a photographed wool/polyester
blend, not procedural yarn noise and not a claim that the material is pure wool.

Native source maps are 4096 × 4181, corresponding to 270.08 × 275.70 mm.
Publisher URLs, MD5 checksums, retained SHA-256 checksums, runtime dimensions and
packing are in wool-scan-manifest.json. Four-kilopixel originals are downloaded and
verified by scripts/intro/prepare-scanned-wool.py; they are not produced by enlarging
a small image. Runtime maps are downsampled from the originals, with normal vectors
renormalized. No macro fold/shadow imagery is added. Black dye is a shader tint.

R/G store OpenGL tangent-normal XY, B stores measured roughness. The renderer
reconstructs positive normal Z and samples roughness from B. Color remains sRGB;
the packed surface map is linear. Original signed components and roughness are
resampled together at the same dimensions; checks validate quantization error.
