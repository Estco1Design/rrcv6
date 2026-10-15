import * as THREE from "three";

// RGB stores normal XY + roughness. Roughness is never the normal's Z.
export const packedClothDefines = { USE_PACKED_NORMALMAP: "" };
/** The paired cloth maps share one texture, UV channel and transform.
 * Sample it once for both fields instead of making two full-resolution reads.
 */
export function patchPackedClothShader(
  shader: THREE.WebGLProgramParametersWithUniforms,
) {
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <roughnessmap_fragment>",
    `
#ifdef USE_NORMALMAP
  vec4 rrcClothSample = texture2D(normalMap, vNormalMapUv);
#endif
float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
  #ifdef USE_NORMALMAP
    roughnessFactor *= rrcClothSample.b;
  #else
    roughnessFactor *= texture2D(roughnessMap, vRoughnessMapUv).b;
  #endif
#endif
`,
  ).replace(
    "#include <normal_fragment_maps>",
    THREE.ShaderChunk.normal_fragment_maps.replaceAll(
      "texture2D( normalMap, vNormalMapUv ).xyz",
      "rrcClothSample.xyz",
    ),
  );
}
