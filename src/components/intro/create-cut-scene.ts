import * as THREE from "three";
import { ClothDynamics } from "./cloth-dynamics";
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
function edgeAt(points: number[], u: number) {
  const x = clamp(u) * (points.length - 1),
    i = Math.min(points.length - 2, Math.floor(x));
  return THREE.MathUtils.lerp(points[i], points[i + 1], smooth(x - i));
}
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
    columns: mobile ? 40 : 64,
    rows: mobile ? 24 : 28,
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
    const [intact, twill, rough, brush, studio, gltf] = await Promise.all([
      loadTexture(`/intro/wool-color-${suffix}.webp`, "color"),
      loadTexture(`/intro/wool-normal-${suffix}.png`, "normal"),
      loadTexture(`/intro/wool-rough-${suffix}.png`, "roughness"),
      loadTexture("/intro/titanium-normal.png", "metalNormal"),
      loadTexture("/intro/studio-cubeuv.png", "studio", false),
      loadModel(),
    ]);
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
    twill.wrapS = twill.wrapT = THREE.RepeatWrapping;
    rough.wrapS = rough.wrapT = THREE.RepeatWrapping;
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
    scene.add(key);
    const cloth = new THREE.MeshPhysicalMaterial({
      map: intact,
      normalMap: twill,
      normalScale: new THREE.Vector2(0.45, 0.45),
      color: 0xffffff,
      roughness: 0.95,
      roughnessMap: rough,
      metalness: 0,
      ior: 1.45,
      specularIntensity: 0.65,
      sheen: 0.32,
      sheenColor: new THREE.Color(0.14, 0.14, 0.14),
      sheenRoughness: 1,
      envMapIntensity: 0.04,
      side: THREE.DoubleSide,
    });
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
      scene.add(mesh);
      mesh.name = sign === 1 ? "top" : "bottom";
      const dynamics = new ClothDynamics(
        profile.columns + 1,
        profile.rows + 1,
        sign,
      );
      const base = new Float32Array(position.array.length);
      return {
        sign,
        geometry,
        position,
        uv,
        coords,
        mesh,
        dynamics,
        base,
        wasActive: false,
      };
    });
    // A connected, intact textile surface covers the seam until its cutting contact passes.
    // This prevents a pre-existing slit or two visibly joined panels at the start.
    const uncutUniform = { value: -0.1 },
      uncutMaterial = cloth.clone();
    // A separate raw UV varying keeps contact masking independent of texture tiling.
    uncutMaterial.map = intact;

    uncutMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.uCut = uncutUniform;
      shader.vertexShader =
        "varying float vCutU;\n" +
        shader.vertexShader.replace(
          "#include <uv_vertex>",
          "#include <uv_vertex>\nvCutU = uv.x;",
        );
      shader.fragmentShader =
        "uniform float uCut; varying float vCutU;\n" +
        shader.fragmentShader.replace(
          "#include <map_fragment>",
          "#include <map_fragment>\nif(vCutU < uCut) discard;",
        );
    };
    uncutMaterial.customProgramCacheKey = () => "rrc-intact-cut-v1";
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
    uncutMesh.renderOrder = -1;
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
            anisotropy: 0.35,
            anisotropyRotation: 0,
          });
          metalMaterials.set(original.name, replacement);
        }
        object.material = replacement;
      }
    });
    originals.forEach((material) => material.dispose());
    // A soft, feathered contact shadow. One texture, no shadow maps or postprocessing.
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const ctx = shadowCanvas.getContext("2d");
    if (!ctx) throw new Error("No shadow canvas");
    const gradient = ctx.createRadialGradient(64, 64, 3, 64, 64, 60);
    gradient.addColorStop(0, "rgba(0,0,0,.72)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    resources.push(shadowTexture);
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.5, 0.8),
      new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        depthWrite: false,
      }),
    );
    scene.add(shadow);
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
      for (const texture of [intact, twill, rough])
        texture.repeat.set(aspect * 3, 3);
      camera.left = -aspect;
      camera.right = aspect;
      camera.updateProjectionMatrix();
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
    function foldsAt(u: number, v: number, sign: number) {
      // Spatial folds are geometry, so their normals and illumination follow deformation.
      const width = Math.min(1, Math.max(0.48, aspect / 1.5));
      const ridge = Math.sin(u * 8.7 * width + v * 4.2 + sign * 0.8);
      return (
        (0.13 * ridge + 0.048 * Math.sin(u * 17.3 * width - v * 6.1 + sign)) *
        Math.sin(v * Math.PI)
      );
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
      ambient.intensity = 0.22 * shot.light;
      key.intensity = 6 * shot.light;

      cloth.envMapIntensity = 0.04 * shot.light;
      uncutMaterial.envMapIntensity = 0.04 * shot.light;
      const press = (u: number, y: number, z: number) => {
        const xWeight = smooth(
          (0.45 - Math.abs(u - Math.max(0.04, shot.cut))) / 0.12,
        );
        const yWeight = smooth((0.4 - Math.abs(y - 0.04)) / 0.13);
        const weight =
          smooth(shot.entry * 6) * (1 - shot.spread) * xWeight * yWeight;
        return z + (THREE.MathUtils.clamp(z, 0.2855, 0.2865) - z) * weight;
      };
      const settle = 0.018 * (1 - smooth(seconds / 0.8));
      for (const panel of panels) {
        const { sign, geometry, position, uv, coords } = panel;
        if (interactive && seconds >= 4.5) {
          if (!panel.dynamics.active() && !panel.wasActive) continue;
          panel.wasActive = panel.dynamics.active();
          panel.dynamics.step(
            Math.min(1 / 15, Math.max(0, interaction - physicsClock)),
            interaction,
          );
          for (let i = 0; i < position.count; i++) {
            const j = i * 3;
            position.setXYZ(
              i,
              panel.base[j] + panel.dynamics.offset[j],
              panel.base[j + 1] + panel.dynamics.offset[j + 1],
              panel.base[j + 2] + panel.dynamics.offset[j + 2],
            );
          }
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
          const finalEdge = edgeAt(sign === 1 ? topEdge : bottomEdge, u);
          // Cut is propagated spatially, with a short delayed response behind contact.
          const finalY = 1 - 2 * finalEdge;
          const opened = cutRelease(shot, u);
          const y = THREE.MathUtils.lerp(
            clothEdge(shot, u, sign, finalY, opened),
            sign * 1.035,
            v,
          );
          const restV = (0.04 + (sign * 1.035 - 0.04) * v + 1) / 2;
          const folds = foldsAt(u, restV, 1);
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
          uv.setXY(i, u, restV);
        }
        position.needsUpdate = true;
        uv.needsUpdate = true;
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();
        if (seconds >= 4.5) {
          panel.wasActive = false;
          host.dataset[sign === 1 ? "topMotion" : "bottomMotion"] = "0";
          panel.base.set(position.array as Float32Array);
          panel.dynamics.setRest(panel.base, Math.min(aspect * 2, 2));
        }
      }
      if (seconds >= 4.5) interactive = true;
      physicsClock = interaction;
      uncutUniform.value = seconds < 1.3 ? -0.1 : shot.cut;
      uncutMesh.visible = seconds < 3;
      if (uncutMesh.visible) {
        for (let i = 0; i < uncutPosition.count; i++) {
          const { u, v } = uncutCoords[i];
          const fold = foldsAt(u, ((v * 2 - 1) * 1.035 + 1) / 2, 1);
          const currentY =
            (v * 2 - 1) * 1.035 + settle * Math.sin(u * 7 + v * 3);
          uncutPosition.setXYZ(i, (u * 2 - 1) * aspect, currentY, 0.02 + fold);
          uncutPosition.setZ(i, press(u, currentY, uncutPosition.getZ(i)));
          uncutUv.setXY(i, u, (currentY + 1) / 2);
        }
        uncutPosition.needsUpdate = true;
        uncutUv.needsUpdate = true;
        uncutGeometry.computeVertexNormals();
      }
      const scale = aspect * SHEAR_WIDTH_RATIO;
      // Depth separation prevents folded cloth from clipping the upper blade/handles.
      // Orthographic projection retains the approved XY silhouette.
      shears.scale.set(scale, scale, 1);
      upper.rotation.z = shot.blade;
      lower.rotation.z = -shot.blade;
      const startingX = -aspect - scale * 1.7;
      const initialRoot = 0.04 - (bladeContactOpen() * SHEAR_WIDTH_RATIO) / 2;
      const cuttingX = (shot.root * 2 - 1) * aspect;
      const exit = smooth((seconds - 3) / 0.7);
      // The mating blade faces share a fixed depth plane; articulation is at Z.
      shears.rotation.y = 0;
      shears.rotation.x = 0;
      const correctedX =
        cuttingX + shot.contact * scale * (1 - Math.cos(shears.rotation.y));
      shears.position.set(
        seconds < 1.3
          ? THREE.MathUtils.lerp(
              startingX,
              (initialRoot * 2 - 1) * aspect,
              shot.entry,
            )
          : THREE.MathUtils.lerp(correctedX, aspect + scale * 1.4, exit),
        0.04,
        0.06,
      );
      shears.visible = shot.tool;
      shadow.visible = shot.tool;
      shadow.position.set(shears.position.x - 0.3 * scale, 0.025, 0.2869);
      shadow.scale.setScalar(scale);
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
    for (const texture of [intact, twill, rough, brush, studio])
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
