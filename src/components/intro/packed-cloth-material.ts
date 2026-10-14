import * as THREE from "three";

// RGB stores normal XY + roughness, so the normal's Z must be reconstructed.
// USE_NORMALMAP_RG is not a Three.js flag: it would interpret roughness as Z.
export const packedClothDefines = { USE_PACKED_NORMALMAP: "" };
export function patchPackedClothShader(
  shader: THREE.WebGLProgramParametersWithUniforms,
) {
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <roughnessmap_fragment>",
    THREE.ShaderChunk.roughnessmap_fragment.replace(
      "texelRoughness.g",
      "texelRoughness.b",
    ),
  );
}
