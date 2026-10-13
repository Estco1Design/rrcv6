import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
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
  pointer: (x: number, y: number, strength: number) => void;
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
  const impulses: { time: number; x: number; y: number; strength: number }[] =
    [];
  let pulseTime = -10,
    pulseX = 0,
    pulseY = 0,
    pulseStrength = 0;
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
    const textures = new THREE.TextureLoader(manager);
    const retainTexture = (texture: THREE.Texture) => {
      if (disposed || signal.aborted) {
        texture.dispose();
        throw new DOMException("Aborted", "AbortError");
      }
      resources.push(texture);
      return texture;
    };
    const [intact, twill, brush, gltf] = await Promise.all([
      textures
        .loadAsync(
          host.clientWidth < 768
            ? "/intro/wool-albedo-mobile.webp"
            : "/intro/wool-albedo.webp",
        )
        .then(retainTexture),
      textures.loadAsync("/intro/twill-normal.png").then(retainTexture),
      textures.loadAsync("/intro/titanium-normal.png").then(retainTexture),
      new GLTFLoader(manager)
        .loadAsync("/intro/titanium-shears.glb")
        .then((value) => {
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
        }),
    ]);
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
    twill.repeat.set(30, 22);
    brush.wrapS = brush.wrapT = THREE.RepeatWrapping;
    brush.repeat.set(3, 4);
    // A restrained photographic softbox environment, with no emissive geometry.
    const studioCanvas = document.createElement("canvas");
    studioCanvas.width = 256;
    studioCanvas.height = 128;
    const studioContext = studioCanvas.getContext("2d");
    if (!studioContext) throw new Error("No studio canvas");
    studioContext.fillStyle = "#111111";
    studioContext.fillRect(0, 0, 256, 128);
    const softbox = studioContext.createRadialGradient(186, 44, 1, 186, 44, 46);
    softbox.addColorStop(0, "#c6c3bd");
    softbox.addColorStop(0.3, "#aaa8a3");
    softbox.addColorStop(1, "#111111");
    studioContext.fillStyle = softbox;
    studioContext.fillRect(0, 0, 256, 128);
    const studioTexture = new THREE.CanvasTexture(studioCanvas);
    studioTexture.colorSpace = THREE.SRGBColorSpace;
    studioTexture.mapping = THREE.EquirectangularReflectionMapping;
    const pmrem = new THREE.PMREMGenerator(renderer),
      environment = pmrem.fromEquirectangular(studioTexture);
    studioTexture.dispose();
    pmrem.dispose();
    resources.push(environment);
    scene.environment = environment.texture;
    RectAreaLightUniformsLib.init();
    const softKey = new THREE.RectAreaLight(0xfffaf2, 2, 3, 1.2);
    softKey.position.set(-1.2, 1.8, 2.4);
    softKey.lookAt(0, 0.04, 0);
    scene.add(softKey);
    const ambient = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xfffaf3, 1.4);
    key.position.set(-2, 2, 0.65);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xe8e9ed, 0.3);
    fill.position.set(3, -1, 2);
    scene.add(fill);
    const cloth = new THREE.MeshPhysicalMaterial({
      map: intact,
      normalMap: twill,
      normalScale: new THREE.Vector2(0.07, 0.07),
      color: 0xffffff,
      roughness: 1,
      metalness: 0,
      ior: 1.1,
      specularIntensity: 0.2,
      sheen: 0.65,
      sheenColor: new THREE.Color(0.3, 0.3, 0.3),
      sheenRoughness: 1,
      envMapIntensity: 0.04,
      side: THREE.DoubleSide,
    });
    const panels = [1, -1].map((sign) => {
      const geometry = new THREE.PlaneGeometry(2, 1, 64, 32),
        mesh = new THREE.Mesh(geometry, cloth),
        position = geometry.attributes.position,
        uv = geometry.attributes.uv;
      const coords = Array.from({ length: position.count }, (_, i) => ({
        u: uv.getX(i),
        v: uv.getY(i),
      }));
      uv.needsUpdate = true;
      scene.add(mesh);
      return { sign, geometry, position, uv, coords };
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
    const uncutGeometry = new THREE.PlaneGeometry(2, 2, 64, 32),
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
    gltf.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const original = object.material as THREE.MeshStandardMaterial;
        const replacement = new THREE.MeshPhysicalMaterial({
          color: original.color,
          metalness: 1,
          roughness: original.roughness,
          normalMap: brush,
          normalScale: new THREE.Vector2(0.13, 0.13),
          envMapIntensity: 0.65,
          anisotropy: 0.2,
          anisotropyRotation: 0,
        });
        original.dispose();
        object.material = replacement;
      }
    });
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
      heightPixels = height;
      aspect = width / height;
      intact.repeat.set(aspect * 3, 3);
      camera.left = -aspect;
      camera.right = aspect;
      camera.updateProjectionMatrix();
      // Cap both DPR and total pixels, especially on 3x/4x mobile displays.
      renderer.setPixelRatio(
        Math.min(
          devicePixelRatio,
          width < 768 ? 1.15 : 1.25,
          Math.sqrt(960_000 / (width * height)),
        ),
      );
      renderer.setSize(width, height);
      render(last);
    }
    function deformation(x: number, y: number, pinned: number, clock: number) {
      let displacement = 0;
      for (const impulse of impulses) {
        const age = clock - impulse.time;
        if (age < 0 || age > 1.1) continue;
        const dx = (x - impulse.x) / Math.max(aspect, 0.5),
          dy = y - impulse.y;
        const delay = Math.min(0.15, Math.hypot(dx, dy) * 0.18);
        const t = Math.max(0, age - delay);
        const envelope = (1 - Math.exp(-t * 30)) * Math.exp(-t * 6);
        displacement +=
          impulse.strength * envelope * Math.exp(-dx * dx * 38 - dy * dy * 28);
      }
      return Math.min(18 / heightPixels, displacement) * pinned;
    }
    function foldsAt(u: number, v: number, sign: number) {
      // Spatial folds are geometry, so their normals and illumination follow deformation.
      const ridge = Math.sin(u * 8.7 + v * 4.2 + sign * 0.8);
      return (
        (0.17 * ridge + 0.065 * Math.sin(u * 17.3 - v * 6.1 + sign)) *
        Math.sin(v * Math.PI)
      );
    }
    function render(seconds: number, interaction = performance.now() / 1000) {
      if (disposed || signal.aborted) return;
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
      key.intensity = 3.2 * shot.light;
      fill.intensity = 0.12 * shot.light;
      softKey.intensity = 2 * shot.light;
      cloth.envMapIntensity = 0.04 * shot.light;
      uncutMaterial.envMapIntensity = 0.04 * shot.light;
      const settle = 0.018 * (1 - smooth(seconds / 0.8));
      for (const panel of panels) {
        const { sign, geometry, position, uv, coords } = panel;
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
          const restV = (.04 + (sign * 1.035 - .04) * v + 1) / 2;
          const folds = foldsAt(u, restV, 1);
          const curl =
            0.025 * opened * Math.exp(-v * 14) * (1 - shot.spread * 0.4);
          const currentY = y + settle * Math.sin(u * 7 + v * 3) * v;
          const displacement = deformation((u * 2 - 1) * aspect, currentY,
            Math.sin(v * Math.PI) * Math.sin(u * Math.PI), interaction);
          position.setXYZ(
            i,
            (u * 2 - 1) * aspect,
            currentY + displacement,
            0.018 +
              0.1 * opened *
                Math.exp(
                  -Math.pow((v - 0.12 - 0.035 * Math.sin(u * 9)) / 0.1, 2),
                ) +
              folds +
              curl +
              displacement,
          );
          // Material UVs follow each panel; lighting is evaluated from deformed normals.
          uv.setXY(i, u, restV);
        }
        position.needsUpdate = true;
        uv.needsUpdate = true;
        geometry.computeVertexNormals();
      }
      uncutUniform.value = seconds < 1.3 ? -0.1 : shot.cut;
      uncutMesh.visible = seconds < 3;
      if (uncutMesh.visible) {
        for (let i = 0; i < uncutPosition.count; i++) {
          const { u, v } = uncutCoords[i];
          const fold = foldsAt(u, ((v * 2 - 1) * 1.035 + 1) / 2, 1);
          const currentY =
            (v * 2 - 1) * 1.035 + settle * Math.sin(u * 7 + v * 3);
          const displacement = deformation((u * 2 - 1) * aspect, currentY,
            Math.sin(v * Math.PI) * Math.sin(u * Math.PI), interaction);
          uncutPosition.setXYZ(
            i,
            (u * 2 - 1) * aspect,
            currentY + displacement,
            0.020 +
              fold +
              displacement,
          );
          uncutUv.setXY(i, u, (currentY + 1) / 2);
        }
        uncutPosition.needsUpdate = true;
        uncutUv.needsUpdate = true;
        uncutGeometry.computeVertexNormals();
      }
      const scale = aspect * SHEAR_WIDTH_RATIO;
      // Depth separation prevents folded cloth from clipping the upper blade/handles.
      // Orthographic projection retains the approved XY silhouette.
      shears.scale.set(scale, scale, 6);
      upper.rotation.z = shot.blade;
      lower.rotation.z = -shot.blade;
      const startingX = -aspect - scale * 1.7;
      const initialRoot = 0.04 - (bladeContactOpen() * SHEAR_WIDTH_RATIO) / 2;
      const cuttingX = (shot.root * 2 - 1) * aspect;
      const exit = smooth((seconds - 3) / 0.7);
      shears.rotation.y = Math.sin(seconds * 1.4) * 0.008;
      shears.rotation.x = -0.012;
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
      shadow.position.set(shears.position.x - 0.3 * scale, 0.025, 0.098);
      shadow.scale.setScalar(scale);
      renderer.render(scene, camera);
    }
    resize();
    return {
      render,
      pointer: (x, y, strength) => {
        const now = performance.now() / 1000;
        const nextX = (x * 2 - 1) * aspect,
          nextY = 1 - y * 2;
        const fresh = now - pulseTime > 1.1;
        pulseX = fresh ? nextX : THREE.MathUtils.lerp(pulseX, nextX, 0.45);
        pulseY = fresh ? nextY : THREE.MathUtils.lerp(pulseY, nextY, 0.45);
        pulseTime = now;
        pulseStrength = Math.min(0.045, Math.max(0, strength));
        const recent = impulses[impulses.length - 1];
        // Bounded trail; fast input cannot stack an unbounded number of impulses.
        if (!recent || now - recent.time > 0.05) {
          impulses.push({
            time: now,
            x: pulseX,
            y: pulseY,
            strength: pulseStrength,
          });
          if (impulses.length > 5) impulses.shift();
        } else {
          recent.x = pulseX;
          recent.y = pulseY;
        }
      },
      active: () => performance.now() / 1000 - pulseTime < 1.1,
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
