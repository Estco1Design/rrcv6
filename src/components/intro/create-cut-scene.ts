import * as THREE from "three";
import { ClothDynamics } from "./cloth-dynamics";
import { clothContour, ClothSurfaceSampling } from "./cloth-surface";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  clamp,
  cutFrame,
  smooth,
  SHEAR_WIDTH_RATIO,
  cutRelease,
  clothEdge,
} from "./cut-timeline";

const topEdge = [0.31, 0.29, 0.205, 0.23, 0.3, 0.34, 0.355, 0.37, 0.4];
const bottomEdge = [0.575, 0.585, 0.645, 0.71, 0.735, 0.705, 0.66, 0.62, 0.585];
export type CutScene = {
  render: (seconds: number, interaction?: number) => void;
  hit: (x: number, y: number) => { sheet: string; x: number; y: number } | null;
  hover: (x: number, y: number, speed: number) => string | null;
  grab: (x: number, y: number) => string | null;
  pull: (x: number, y: number) => void;
  release: () => void;
  active: () => boolean;
  resize: () => void;
  dispose: () => void;
};
/** A finite mesh-deformation shot, not a cloth simulation or sequence of reference images. */
export async function createCutScene(
  host: HTMLDivElement,
  signal: AbortSignal,
): Promise<CutScene> {
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  const started = performance.now();
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene(),
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 10);
  camera.position.z = 4;
  const resources: { dispose: () => void }[] = [];
  let disposed = false,
    aspect = 1,
    last = 0,
    heightPixels = 720;
  let physicsClock = 0,
    interactive = false,
    prepared = false;
  const mobile = host.clientWidth < 768;
  const profile = {
    columns: mobile ? 96 : 128,
    rows: mobile ? 40 : 48,
    physicsColumns: 24,
    physicsRows: 20,
    pixels: mobile ? 620_000 : 1_100_000,
    dpr: mobile ? 1.35 : 1.3,
  };
  host.dataset.profile = mobile ? "mobile" : "desktop";
  const timings: Record<string, number> = {};
  timings.contextAndSceneInitMs = performance.now() - started;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        materials.forEach((m) => m.dispose());
      }
    });
    resources.forEach((r) => r.dispose());
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
  signal.addEventListener("abort", dispose, { once: true });
  try {
    const manager = new THREE.LoadingManager();
    const retainTexture = (texture: THREE.Texture) => {
      if (disposed || signal.aborted) {
        texture.dispose();
        throw new DOMException("Aborted", "AbortError");
      }
      resources.push(texture);
      return texture;
    };
    const loadTexture = async (url: string, name: string, flip = true) => {
      const before = performance.now();
      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error(`Missing ${name}`);
      const blob = await response.blob();
      timings[`${name}FetchMs`] = performance.now() - before;
      const decodeStart = performance.now();
      const bitmap = await createImageBitmap(blob, {
        imageOrientation: flip ? "flipY" : "none",
        colorSpaceConversion: "none",
      });
      timings[`${name}DecodeMs`] = performance.now() - decodeStart;
      if (disposed || signal.aborted) {
        bitmap.close();
        throw new DOMException("Aborted", "AbortError");
      }
      resources.push({ dispose: () => bitmap.close() });
      const texture = retainTexture(new THREE.Texture(bitmap));
      texture.flipY = false;
      texture.needsUpdate = true;
      return texture;
    };
    const loadModel = async () => {
      const before = performance.now();
      const response = await fetch(
        mobile
          ? "/intro/titanium-shears-mobile.glb"
          : "/intro/titanium-shears.glb",
        { signal },
      );
      if (!response.ok) throw new Error("Missing shears");
      const data = await response.arrayBuffer();
      timings.modelFetchMs = performance.now() - before;
      const parseStart = performance.now();
      const value = await new GLTFLoader(manager).parseAsync(data, "/intro/");
      timings.modelParseMs = performance.now() - parseStart;
      if (disposed || signal.aborted) {
        value.scene.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            o.geometry.dispose();
            (Array.isArray(o.material) ? o.material : [o.material]).forEach(
              (m) => m.dispose(),
            );
          }
        });
        throw new DOMException("Aborted", "AbortError");
      }
      scene.add(value.scene);
      return value;
    };
    const suffix = mobile ? "mobile" : "desktop";
    const [intact, surface, brush, studio, gltf, gathersBuffer] =
      await Promise.all([
        loadTexture(`/intro/wool-scan-color-${suffix}.webp`, "color"),
        loadTexture(
          `/intro/wool-scan-surface-${suffix}.webp`,
          "normalRoughness",
        ),
        loadTexture("/intro/titanium-normal.png", "metalNormal"),
        loadTexture("/intro/studio-cubeuv.png", "studio", false),
        loadModel(),
        fetch("/intro/cloth-gathers.bin", { signal }).then((r) => {
          if (!r.ok) throw new Error("Missing cloth shape");
          return r.arrayBuffer();
        }),
      ]);
    const gathers = new Float32Array(gathersBuffer);
    if (gathers.length !== 257 * 257) throw new Error("Invalid cloth shape");
    timings.resourcesReadyMs = performance.now() - started;
    const prepareStart = performance.now();
    // A request can finish after unmount; dispose late resources as well.
    if (signal.aborted) {
      gltf.scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            m.dispose(),
          );
        }
      });
      resources.forEach((r) => r.dispose());
      throw new DOMException("Aborted", "AbortError");
    }
    intact.colorSpace = THREE.SRGBColorSpace;
    intact.wrapS = intact.wrapT = THREE.RepeatWrapping;
    intact.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    surface.wrapS = surface.wrapT = THREE.RepeatWrapping;
    surface.anisotropy = intact.anisotropy;
    brush.wrapS = brush.wrapT = THREE.RepeatWrapping;
    brush.repeat.set(3, 4);
    // Original studio lighting prefiltered offline: no PMREM passes at startup.
    studio.mapping = THREE.CubeUVReflectionMapping;
    studio.generateMipmaps = false;
    studio.minFilter = studio.magFilter = THREE.LinearFilter;
    const ambient = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xfffaf3, 1.4);
    key.position.set(-2, 2, 0.65);
    key.castShadow = true;
    key.shadow.mapSize.set(mobile ? 512 : 1024, mobile ? 512 : 1024);
    key.shadow.radius = 3;
    key.shadow.bias = -0.00006;
    key.shadow.normalBias = 0.001;
    key.shadow.camera.near = 0.1;
    key.shadow.camera.far = 8;
    scene.add(key);
    const cloth = new THREE.MeshPhysicalMaterial({
      map: intact,
      normalMap: surface,
      normalScale: new THREE.Vector2(1, 1),
      color: new THREE.Color(0.16, 0.165, 0.2),
      roughness: 1,
      roughnessMap: surface,
      metalness: 0,
      ior: 1.45,
      specularIntensity: 0.25,
      sheen: 0.18,
      sheenColor: new THREE.Color(0.025, 0.025, 0.025),
      sheenRoughness: 1,
      envMapIntensity: 0.04,
      side: THREE.DoubleSide,
    });
    // R/G contain photographed normal XY; B contains measured roughness.
    // Native Three.js reconstructs normal Z for RG maps. The same sampler/UV
    // serves both fields, preventing mismatched density and a third GPU texture.
    cloth.defines = { ...cloth.defines, USE_NORMALMAP_RG: "" };
    const packedWool = (shader: THREE.WebGLProgramParametersWithUniforms) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <roughnessmap_fragment>",
        THREE.ShaderChunk.roughnessmap_fragment.replace(
          "texelRoughness.g",
          "texelRoughness.b",
        ),
      );
    };
    cloth.onBeforeCompile = packedWool;
    cloth.customProgramCacheKey = () => "rrc-scanned-wool-rg-b-v1";
    const panels = [1, -1].map((sign) => {
      const geometry = new THREE.PlaneGeometry(
          2,
          1,
          profile.columns,
          profile.rows,
        ),
        mesh = new THREE.Mesh(geometry, cloth),
        position = geometry.attributes.position,
        uv = geometry.attributes.uv;
      const coords = Array.from({ length: position.count }, (_, i) => ({
        u: uv.getX(i),
        v: uv.getY(i),
      }));
      uv.needsUpdate = true;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      mesh.name = sign === 1 ? "top" : "bottom";
      const dynamics = new ClothDynamics(
        profile.physicsColumns + 1,
        profile.physicsRows + 1,
        sign,
      );
      const base = new Float32Array(position.array.length);
      const sampling = new ClothSurfaceSampling(
        profile.columns,
        profile.rows,
        profile.physicsColumns,
        profile.physicsRows,
      );
      return {
        sign,
        sampling,
        geometry,
        position,
        uv,
        coords,
        mesh,
        dynamics,
        base,
        wasActive: false,
        uvAspect: 0,
        restUV: new Float32Array(position.count * 2),
      };
    });
    // A connected, intact textile surface covers the seam until its cutting contact passes.
    // This prevents a pre-existing slit or two visibly joined panels at the start.
    const uncutUniform = { value: -0.1 },
      uncutMaterial = cloth.clone();
    // A separate raw UV varying keeps contact masking independent of texture tiling.
    uncutMaterial.map = intact;

    uncutMaterial.defines = { ...uncutMaterial.defines, USE_NORMALMAP_RG: "" };
    uncutMaterial.onBeforeCompile = (shader) => {
      packedWool(shader);
      shader.uniforms.uCut = uncutUniform;
      shader.vertexShader =
        "attribute float cutU; varying float vCutU;\n" +
        shader.vertexShader.replace(
          "#include <uv_vertex>",
          "#include <uv_vertex>\nvCutU = cutU;",
        );
      shader.fragmentShader =
        "uniform float uCut; varying float vCutU;\n" +
        shader.fragmentShader.replace(
          "#include <map_fragment>",
          "#include <map_fragment>\nif(vCutU < uCut) discard;",
        );
    };
    uncutMaterial.customProgramCacheKey = () =>
      "rrc-intact-cut-scanned-rg-b-v2";
    const uncutGeometry = new THREE.PlaneGeometry(
        2,
        2,
        profile.columns,
        profile.rows,
      ),
      uncutMesh = new THREE.Mesh(uncutGeometry, uncutMaterial);
    const uncutPosition = uncutGeometry.attributes.position,
      uncutUv = uncutGeometry.attributes.uv;
    const uncutCoords = Array.from({ length: uncutPosition.count }, (_, i) => ({
      u: uncutUv.getX(i),
      v: uncutUv.getY(i),
    }));
    uncutGeometry.setAttribute(
      "cutU",
      new THREE.Float32BufferAttribute(
        uncutCoords.map((p) => p.u),
        1,
      ),
    );
    uncutMesh.renderOrder = -1;
    uncutMesh.receiveShadow = true;
    scene.add(uncutMesh);
    const shears = new THREE.Group();
    shears.add(gltf.scene);
    scene.add(shears);
    const upperNode = gltf.scene.getObjectByName("UpperArm"),
      lowerNode = gltf.scene.getObjectByName("LowerArm");
    if (!upperNode || !lowerNode)
      throw new Error("The two shear arms are missing");
    const upper: THREE.Object3D = upperNode,
      lower: THREE.Object3D = lowerNode;
    const metalMaterials = new Map<string, THREE.MeshPhysicalMaterial>(),
      originals = new Set<THREE.Material>();
    gltf.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;

        const original = object.material as THREE.MeshStandardMaterial;
        originals.add(original);
        let replacement = metalMaterials.get(original.name);
        if (!replacement) {
          replacement = new THREE.MeshPhysicalMaterial({
            color: original.color,
            metalness: 1,
            roughness: original.roughness,
            normalMap: brush,
            normalScale: new THREE.Vector2(0.06, 0.06),
            envMap: studio,
            envMapIntensity: 0.9,
            anisotropy: 0,
            anisotropyRotation: 0,
          });
          metalMaterials.set(original.name, replacement);
        }
        object.material = replacement;
      }
    });
    originals.forEach((material) => material.dispose());
    function bladeContactOpen() {
      return 0.051176 / (0.0232 + Math.tan(0.158)) / Math.cos(0.158);
    }
    function resize() {
      if (disposed) return;
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      release();
      interactive = false;
      heightPixels = height;
      aspect = width / height;
      for (const texture of [intact, surface])
        texture.repeat.set(
          0.25 / 0.2700788548673393,
          0.25 / 0.27570000290870667,
        );
      camera.left = -aspect;
      camera.right = aspect;
      camera.updateProjectionMatrix();
      const extent = Math.hypot(aspect, 1.035) * 1.15;
      key.shadow.camera.left = key.shadow.camera.bottom = -extent;
      key.shadow.camera.right = key.shadow.camera.top = extent;
      key.shadow.camera.updateProjectionMatrix();
      // Cap both DPR and total pixels, especially on 3x/4x mobile displays.
      renderer.setPixelRatio(
        Math.min(
          devicePixelRatio,
          profile.dpr,
          Math.sqrt(profile.pixels / (width * height)),
        ),
      );
      renderer.setSize(width, height);
      if (prepared) render(last);
    }
    function foldsAt(u: number, v: number) {
      // Nonperiodic, broad gathered ridges. The two sides have different fold
      // trajectories; there is no regular sinusoidal sheet or material noise.
      const q = 0.5 + (u - 0.5) * Math.min(1, Math.max(0.5, aspect / 1.5));
      const gaussian = (x: number, center: number, radius: number) =>
        Math.exp(-(((x - center) / radius) ** 2));
      const upper = 0.18 * gaussian(v, 0.8 - 0.13 * q + 0.055 * q * q, 0.1);
      const lower = 0.19 * gaussian(v, 0.17 + 0.16 * q - 0.06 * q * q, 0.09);
      const gatherLeft =
        0.11 * gaussian(q, 0.1 + 0.28 * v, 0.075) * gaussian(v, 0.76, 0.36);
      const gatherRight =
        0.13 * gaussian(q, 0.73 - 0.27 * v, 0.1) * gaussian(v, 0.2, 0.27);
      const valley = 0.065 * gaussian(q, 0.42, 0.27) * gaussian(v, 0.49, 0.2);
      const fx = (0.08 + q * 0.84) * 256,
        fy = (0.08 + v * 0.84) * 256;
      const ix = Math.min(255, Math.floor(fx)),
        iy = Math.min(255, Math.floor(fy)),
        tx = fx - ix,
        ty = fy - iy;
      const at = (a: number, b: number) => gathers[(iy + b) * 257 + ix + a];
      const secondary =
        (at(0, 0) * (1 - tx) + at(1, 0) * tx) * (1 - ty) +
        (at(0, 1) * (1 - tx) + at(1, 1) * tx) * ty;
      return upper + lower + gatherLeft + gatherRight - valley + secondary;
    }
    function render(
      seconds: number,
      interaction = performance.now() / 1000,
      draw = true,
    ) {
      if (disposed || signal.aborted) return;
      const cpuStart = performance.now();
      last = seconds;
      const shot = cutFrame(seconds);
      host.dataset.cut = clamp(shot.cut).toFixed(4);
      host.dataset.blade = shot.blade.toFixed(4);
      host.dataset.seconds = seconds.toFixed(3);
      host.dataset.tool = String(shot.tool);
      host.dataset.renderCount = String(
        Number(host.dataset.renderCount || 0) + 1,
      );
      ambient.intensity = 0.12 * shot.light;
      key.intensity = 4.5 * shot.light;

      cloth.envMapIntensity = 0.04 * shot.light;
      uncutMaterial.envMapIntensity = 0.04 * shot.light;
      const scale = aspect * SHEAR_WIDTH_RATIO;
      const initialRoot = 0.04 - (bladeContactOpen() * SHEAR_WIDTH_RATIO) / 2;
      const exit = smooth((seconds - 3) / 0.7);
      const hingeX =
        seconds < 1.3
          ? THREE.MathUtils.lerp(
              -aspect - scale * 1.7,
              (initialRoot * 2 - 1) * aspect,
              shot.entry,
            )
          : THREE.MathUtils.lerp(
              (shot.root * 2 - 1) * aspect,
              aspect + scale * 1.4,
              exit,
            );
      const press = (u: number, y: number, z: number) => {
        // Only the moving blade footprint exerts pressure, not a viewport-wide slab.
        const xWeight = smooth(
          (0.8 * scale +
            0.025 -
            Math.abs((u * 2 - 1) * aspect - (hingeX + 0.73 * scale))) /
            0.04,
        );
        const yWeight = smooth(
          (0.27 * scale + 0.018 - Math.abs(y - 0.04)) / 0.025,
        );
        const weight =
          smooth(shot.entry * 6) * (1 - shot.spread) * xWeight * yWeight;
        return (
          z +
          (THREE.MathUtils.clamp(
            z,
            0.286 - 0.0003 * aspect * SHEAR_WIDTH_RATIO,
            0.286 + 0.0003 * aspect * SHEAR_WIDTH_RATIO,
          ) -
            z) *
            weight
        );
      };
      const settle = 0.018 * (1 - smooth(seconds / 0.8));
      for (const panel of panels) {
        const { sign, geometry, position, uv, coords } = panel;
        panel.mesh.visible = seconds >= 1.3;
        if (panel.uvAspect !== aspect) {
          panel.uvAspect = aspect;
          const edgeScale = Math.min(1, Math.max(0.4, aspect / 0.95));
          for (let i = 0; i < coords.length; i++) {
            const { u, v } = coords[i];
            const reference = clothContour(
              sign === 1 ? topEdge : bottomEdge,
              u,
            );
            const center = sign === 1 ? 0.315 : 0.66;
            const edge = 1 - 2 * (center + (reference - center) * edgeScale);
            const restV = (0.04 + (sign * 1.035 - 0.04) * v + 1) / 2;
            const k = i * 3;
            panel.base[k] = (u * 2 - 1) * aspect;
            panel.base[k + 1] = THREE.MathUtils.lerp(edge, sign * 1.035, v);
            panel.base[k + 2] =
              0.185 +
              0.065 *
                Math.exp(
                  -Math.pow((v - 0.12 - 0.035 * Math.sin(u * 9)) / 0.1, 2),
                ) +
              foldsAt(u, restV) +
              0.015 * Math.exp(-v * 14);
          }
          // Intrinsic arc-length UVs in scene units, not compressed screen-space
          // half-planes. The photographed weave keeps its physical pitch on mobile.
          for (let j = 0; j <= profile.rows; j++)
            for (let i = 0; i <= profile.columns; i++) {
              const vertex = j * (profile.columns + 1) + i,
                k = vertex * 3;
              const distance = (previous: number) =>
                Math.hypot(
                  panel.base[k] - panel.base[previous * 3],
                  panel.base[k + 1] - panel.base[previous * 3 + 1],
                  panel.base[k + 2] - panel.base[previous * 3 + 2],
                );
              panel.restUV[vertex * 2] = i
                ? panel.restUV[(vertex - 1) * 2] + distance(vertex - 1)
                : 0;
              panel.restUV[vertex * 2 + 1] = j
                ? panel.restUV[(vertex - profile.columns - 1) * 2 + 1] +
                  distance(vertex - profile.columns - 1)
                : 0;
            }
        }
        if (interactive && seconds >= 4.5) {
          if (!panel.dynamics.active() && !panel.wasActive) continue;
          panel.wasActive = panel.dynamics.active();
          panel.dynamics.step(
            Math.min(1 / 15, Math.max(0, interaction - physicsClock)),
            interaction,
          );
          panel.sampling.deform(
            panel.base,
            panel.dynamics.offset,
            position.array as Float32Array,
            Math.min(aspect * 2, 2) * 0.04,
            sign,
          );
          position.needsUpdate = true;
          geometry.computeVertexNormals();
          geometry.computeBoundingSphere();
          host.dataset[sign === 1 ? "topMotion" : "bottomMotion"] = String(
            panel.dynamics.offset.reduce(
              (max, value) => Math.max(max, Math.abs(value)),
              0,
            ),
          );
          continue;
        }
        for (let i = 0; i < coords.length; i++) {
          const { u, v } = coords[i];
          const referenceEdge = clothContour(
            sign === 1 ? topEdge : bottomEdge,
            u,
          );
          const edgeScale = Math.min(1, Math.max(0.4, aspect / 0.95));
          const centerEdge = sign === 1 ? 0.315 : 0.66;
          const finalEdge =
            centerEdge + (referenceEdge - centerEdge) * edgeScale;
          // Cut is propagated spatially, with a short delayed response behind contact.
          const finalY = 1 - 2 * finalEdge;
          const opened = cutRelease(shot, u);
          const y = THREE.MathUtils.lerp(
            clothEdge(shot, u, sign, finalY, opened),
            sign * 1.035,
            v,
          );
          const restV = (0.04 + (sign * 1.035 - 0.04) * v + 1) / 2;
          const folds = foldsAt(u, restV);
          const curl =
            0.025 * opened * Math.exp(-v * 14) * (1 - shot.spread * 0.4);
          const currentY = y + settle * Math.sin(u * 7 + v * 3) * v;
          position.setXYZ(
            i,
            (u * 2 - 1) * aspect,
            currentY,
            0.185 +
              0.065 *
                opened *
                Math.exp(
                  -Math.pow((v - 0.12 - 0.035 * Math.sin(u * 9)) / 0.1, 2),
                ) +
              folds +
              curl,
          );
          position.setZ(i, press(u, position.getY(i), position.getZ(i)));
          // Material UVs follow each panel; lighting is evaluated from deformed normals.
          uv.setXY(i, panel.restUV[i * 2], panel.restUV[i * 2 + 1]);
        }
        position.needsUpdate = true;
        uv.needsUpdate = true;
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();
        if (seconds >= 4.5) {
          panel.wasActive = false;
          host.dataset[sign === 1 ? "topMotion" : "bottomMotion"] = "0";
          panel.base.set(position.array as Float32Array);
          panel.sampling.setRest(panel.base);
          panel.dynamics.setRest(panel.sampling.rest, Math.min(aspect * 2, 2));
        }
      }
      if (seconds >= 4.5) interactive = true;
      physicsClock = interaction;
      uncutUniform.value = seconds < 1.3 ? -0.1 : shot.cut;
      uncutMesh.visible = seconds < 3;
      uncutMesh.castShadow = seconds < 1.3;
      if (uncutMesh.visible) {
        for (let i = 0; i < uncutPosition.count; i++) {
          const { u, v } = uncutCoords[i];
          const fold = foldsAt(u, ((v * 2 - 1) * 1.035 + 1) / 2);
          const currentY =
            (v * 2 - 1) * 1.035 + settle * Math.sin(u * 7 + v * 3);
          uncutPosition.setXYZ(i, (u * 2 - 1) * aspect, currentY, 0.187 + fold);
          uncutPosition.setZ(
            i,
            press(u, currentY, uncutPosition.getZ(i)) + 0.00015,
          );
          uncutUv.setXY(i, u * 2 * aspect, currentY + 1.035);
        }
        uncutPosition.needsUpdate = true;
        uncutUv.needsUpdate = true;
        uncutGeometry.computeVertexNormals();
      }
      // Uniform scale preserves 3D proportions and normals on phones.
      shears.scale.setScalar(scale);
      upper.rotation.z = shot.blade;
      lower.rotation.z = -shot.blade;
      shears.rotation.set(0, 0, 0);
      shears.position.set(hingeX, 0.04, 0.286 - 0.226 * scale);
      shears.visible = shot.tool;
      if (interactive) updateClips();
      if (!draw) return;
      const frameStart = performance.now();
      if (shot.light === 0 && !shot.tool) renderer.clear();
      else renderer.render(scene, camera);
      host.dataset.cpuRenderMs = String(performance.now() - frameStart);
      host.dataset.cpuFrameMs = String(performance.now() - cpuStart);
    }
    const raycaster = new THREE.Raycaster(),
      pointerNdc = new THREE.Vector2();
    const intersections: THREE.Intersection[] = [],
      clothMeshes = panels.map((panel) => panel.mesh);
    const hitValue = { sheet: "", x: 0, y: 0 };
    let grabbed: (typeof panels)[number] | undefined,
      grabX = 0,
      grabY = 0;
    function hit(x: number, y: number) {
      if (!interactive) return null;
      pointerNdc.set(x * 2 - 1, 1 - y * 2);
      camera.updateMatrixWorld();
      scene.updateMatrixWorld();
      raycaster.setFromCamera(pointerNdc, camera);
      intersections.length = 0;
      raycaster.intersectObjects(clothMeshes, false, intersections);
      const first = intersections[0];
      if (!first) return null;
      hitValue.sheet = first.object.name;
      hitValue.x = first.point.x;
      hitValue.y = first.point.y;
      return hitValue;
    }
    function release() {
      panels.forEach((panel) =>
        panel.dynamics.release(performance.now() / 1000),
      );
      grabbed = undefined;
      host.dataset.grabbed = "";
    }
    function updateClips() {
      for (const panel of panels) {
        const points: string[] = [];
        const first = profile.rows * (profile.columns + 1);
        for (let i = 0; i <= profile.columns; i++) {
          const index =
            panel.sign === 1 ? first + profile.columns - i : first + i;
          points.push(
            `${(panel.position.getX(index) / aspect + 1) * 50} ${(1 - panel.position.getY(index)) * 50}`,
          );
        }
        const polygon =
          panel.sign === 1
            ? ["0 0", "100 0", ...points]
            : [...points, "100 100", "0 100"];
        const area = host.querySelector<HTMLElement>(
          `[data-cloth-hit="${panel.mesh.name}"]`,
        );
        if (area) area.setAttribute("d", `M${polygon.join(" L")} Z`);
      }
    }
    // Warm all three surface programs, textures and vertex buffers before motion.
    // Canvas remains hidden behind the still plate during this stage.
    resize();
    render(4.5, performance.now() / 1000, false);
    // Warm the bounded lattice while the loading still is visible; no extra draws.
    for (const panel of panels) {
      panel.dynamics.grab(0, panel.sign * 0.65);
      panel.dynamics.pull(0.015, 0.015);
      for (let i = 0; i < 12; i++) panel.dynamics.step(1 / 60, i / 60);
      panel.dynamics.reset();
      panel.wasActive = false;
    }
    interactive = false;
    render(1.9, performance.now() / 1000, false);
    timings.cpuPreparationMs = performance.now() - prepareStart;
    const waitGpu = async () => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      if (fence) {
        try {
          await new Promise<void>((resolve, reject) => {
            const poll = () => {
              if (signal.aborted) {
                reject(new DOMException("Aborted", "AbortError"));
                return;
              }
              const status = gl.clientWaitSync(fence, 0, 0);
              if (
                status === gl.ALREADY_SIGNALED ||
                status === gl.CONDITION_SATISFIED
              )
                resolve();
              else if (status === gl.WAIT_FAILED)
                reject(new Error("GPU warmup failed"));
              else window.setTimeout(poll, 8);
            };
            poll();
          });
        } finally {
          gl.deleteSync(fence);
        }
      }
    };
    const uploadStart = performance.now();
    for (const texture of [intact, surface, brush, studio])
      renderer.initTexture(texture);
    timings.textureUploadSubmitMs = performance.now() - uploadStart;
    await waitGpu();
    timings.textureUploadCompleteWallMs = performance.now() - uploadStart;
    const compileStart = performance.now();
    await renderer.compileAsync(scene, camera);
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    timings.shaderCompileMs = performance.now() - compileStart;
    const warmStart = performance.now();
    renderer.render(scene, camera);
    await waitGpu();
    timings.gpuWarmupMs = performance.now() - warmStart;
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    render(0);
    prepared = true;
    timings.readyMs = performance.now() - started;
    host.dataset.timings = JSON.stringify(timings);
    host.dataset.pixelCount = String(
      renderer.domElement.width * renderer.domElement.height,
    );
    host.dataset.clothVertices = String(
      panels.reduce((sum, panel) => sum + panel.position.count, 0),
    );
    host.dataset.physicsVertices = String(
      (profile.physicsColumns + 1) * (profile.physicsRows + 1) * 2,
    );
    return {
      render,
      hit,
      hover: (x, y, speed) => {
        const point = hit(x, y);
        if (!point || grabbed) return point?.sheet ?? null;
        panels
          .find((panel) => panel.mesh.name === point.sheet)
          ?.dynamics.hover(
            point.x,
            point.y,
            speed,
            heightPixels,
            performance.now() / 1000,
          );
        return point.sheet;
      },
      grab: (x, y) => {
        const point = hit(x, y);
        if (!point) return null;
        grabbed = panels.find((panel) => panel.mesh.name === point.sheet);
        grabX = point.x;
        grabY = point.y;
        grabbed?.dynamics.grab(grabX, grabY);
        host.dataset.grabbed = point.sheet;
        return point.sheet;
      },
      pull: (x, y) =>
        grabbed?.dynamics.pull((x * 2 - 1) * aspect - grabX, 1 - y * 2 - grabY),
      release,
      active: () => panels.some((panel) => panel.dynamics.active()),
      resize,
      dispose: () => {
        signal.removeEventListener("abort", dispose);
        dispose();
      },
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
