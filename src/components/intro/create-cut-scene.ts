import {
  packedClothDefines,
  patchPackedClothShader,
} from "./packed-cloth-material";
import * as THREE from "three";
import { ClothDynamics } from "./cloth-dynamics";
import { ClothRest } from "./cloth-rest";
import { clothContour, ClothSurfaceSampling } from "./cloth-surface";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  clamp,
  cutFrame,
  smooth,
  SHEAR_WIDTH_RATIO,
  cutRelease,
  clothEdge,
  shearPresentation,
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
  const mobile = host.clientWidth < 768 ||
    (matchMedia("(pointer: coarse)").matches && Math.min(host.clientWidth,host.clientHeight)<768);
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = !mobile;
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
  const profile = {
    columns: mobile ? 96 : 128,
    rows: mobile ? 40 : 48,
    physicsColumns: 24,
    physicsRows: 20,
    pixels: mobile ? 720_000 : 1_100_000,
    dpr: mobile ? 1.6 : 1.3,
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
    const loadStudio = async () => {
      const before = performance.now();
      let data: ArrayBuffer | undefined;
      if (typeof DecompressionStream !== "undefined") {
        try {
          const response = await fetch("/intro/studio-hdr-cubeuv.bin.gz", {
            signal,
          });
          if (response.ok) {
            const encoded = await response.arrayBuffer();
            timings.studioFetchMs = performance.now() - before;
            const decodeStart = performance.now();
            data = await new Response(
              new Blob([encoded])
                .stream()
                .pipeThrough(new DecompressionStream("gzip")),
            ).arrayBuffer();
            timings.studioInflateMs = performance.now() - decodeStart;
          }
        } catch (error) {
          if (signal.aborted) throw error;
          // Older HTTP stacks/codecs can use the same lossless raw atlas.
        }
      }
      if (!data) {
        const response = await fetch("/intro/studio-hdr-cubeuv.bin", {
          signal,
        });
        if (!response.ok) throw new Error("Missing HDR studio");
        data = await response.arrayBuffer();
      }
      timings.studioFetchMs ??= performance.now() - before;
      if (data.byteLength !== 384 * 512 * 4 * 2)
        throw new Error("Invalid HDR studio");
      const texture = retainTexture(
        new THREE.DataTexture(
          new Uint16Array(data),
          384,
          512,
          THREE.RGBAFormat,
          THREE.HalfFloatType,
        ),
      );
      texture.colorSpace = THREE.LinearSRGBColorSpace;
      texture.mapping = THREE.CubeUVReflectionMapping;
      texture.generateMipmaps = false;
      texture.minFilter = texture.magFilter = THREE.LinearFilter;
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
    const [intact, surface, studio, gltf, drapeBuffer] = await Promise.all([
      loadTexture(`/intro/suiting-scan-color-${suffix}.webp`, "color"),
      loadTexture(
        `/intro/suiting-scan-surface-${suffix}.webp`,
        "normalRoughness",
      ),
      loadStudio(),
      loadModel(),
      fetch("/intro/cloth-rest.bin", { signal }).then((r) => {
        if (!r.ok) throw new Error("Missing cloth shape");
        return r.arrayBuffer();
      }),
    ]);
    const drape = new ClothRest(drapeBuffer);
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
    // Original studio lighting prefiltered offline: no PMREM passes at startup.
    studio.mapping = THREE.CubeUVReflectionMapping;
    studio.generateMipmaps = false;
    studio.minFilter = studio.magFilter = THREE.LinearFilter;
    const ambient = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xfffaf3, 1.4);
    key.position.set(-2, 2, .9);
    key.castShadow = !mobile;
    key.shadow.mapSize.set(mobile ? 512 : 1024, mobile ? 512 : 1024);
    key.shadow.radius = 3;
    key.shadow.bias = -0.00006;
    key.shadow.normalBias = 0.001;
    key.shadow.camera.near = 0.1;
    key.shadow.camera.far = 8;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xf4f6ff, .8);
    fill.position.set(1, -.5, 4);
    scene.add(fill);
    const cloth = new THREE.MeshPhysicalMaterial({
      map: intact,
      normalMap: surface,
      normalScale: new THREE.Vector2(.7, .7),
      color: new THREE.Color(.6, .6, .6),
      roughness: 1,
      roughnessMap: surface,
      metalness: 0,
      ior: 1.45,
      specularIntensity: .35,
      sheen: .35,
      sheenColor: new THREE.Color(.18, .18, .18),
      sheenRoughness: .85,
      envMap: mobile ? null : studio,
      envMapIntensity: mobile ? 0 : 0.4,
      envMapRotation: new THREE.Euler(.35, .6, 0),
      side: THREE.DoubleSide,
    });
    // R/G contain photographed normal XY; B contains measured roughness.
    // Native Three.js reconstructs normal Z for RG maps. The same sampler/UV
    // serves both fields, preventing mismatched density and a third GPU texture.
    cloth.defines = { ...cloth.defines, ...packedClothDefines };
    const packedWool = patchPackedClothShader;
    cloth.onBeforeCompile = packedWool;
    cloth.customProgramCacheKey = () => "rrc-poly-wool-rg-b-hdr-v4";
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
      // The lower sheet reverses the plane's Y parameterization. Keep its
      // front-face winding and shadow bias consistent with the upper sheet.
      if(sign<0){
        const index=geometry.getIndex();
        if(index)for(let i=0;i<index.count;i+=3){
          const b=index.getX(i+1);index.setX(i+1,index.getX(i+2));index.setX(i+2,b);
        }
      }
      uv.needsUpdate = true;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      mesh.name = sign === 1 ? "top" : "bottom";
      // A 1 mm rounded cut cross-section, sharing the photographed material.
      // Not a luminous outline or a transparent copy of the main sheet.
      const edgeGeometry=new THREE.PlaneGeometry(2,.004,profile.columns,4);
      const edgeMesh=new THREE.Mesh(edgeGeometry,cloth);
      edgeMesh.name=mesh.name+" cut thickness";
      edgeMesh.castShadow=false;edgeMesh.receiveShadow=false;
      scene.add(edgeMesh);
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
        edgeGeometry,
        edgeMesh,
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
        foldHeights: new Float32Array(position.count),
        closedHeights: new Float32Array(position.count),
        restOffsets: new Float32Array(position.count*3),
        seamHeights: new Float32Array(position.count),
      };
    });
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
            envMap: studio,
            envMapIntensity: 0.9,
            envMapRotation: new THREE.Euler(.35, .6, 0),
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
        texture.repeat.set(0.25 / .27007885, 0.25 / .2757);
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
      ambient.intensity = .22 * shot.light;
      fill.intensity = .65 * shot.light;
      key.intensity = 3.8 * shot.light;

      cloth.envMapIntensity = mobile ? 0 : 0.4 * shot.light;
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
      const contactU=clamp(shot.cut<0?.04:shot.cut);
      const contactY=.04+.013*Math.sin(contactU*7)*(1-shot.spread);
      const contactZ=shot.tool ? .187+drape.initialHeight(contactU,(contactY+1.035)/2.07,aspect) : .187;
      const press = (u: number, y: number, z: number) => {
        // Only the moving blade footprint exerts pressure, not a viewport-wide slab.
        const xWeight = smooth(
          (0.8 * scale +
            0.025 -
            Math.abs((u * 2 - 1) * aspect - (hingeX + 0.73 * scale))) /
            0.04,
        );
        const yWeight = smooth(
          (0.27 * scale + 0.018 - Math.abs(y - contactY)) / 0.025,
        );
        const weight =
          smooth(shot.entry * 6) * (1 - shot.spread) * xWeight * yWeight;
        return z + THREE.MathUtils.clamp(contactZ-z,-.03,.03)*weight;
      };
      const settle = 0.018 * (1 - smooth(seconds / 0.8));
      for (const panel of panels) {
        const { sign, geometry, position, uv, coords } = panel;
        panel.mesh.visible = true;
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
            const k = i * 3;
            drape.sample(sign,u,v,aspect,panel.restOffsets,k);
            panel.base[k] = (u * 2 - 1) * aspect + panel.restOffsets[k];
            panel.base[k + 1] = THREE.MathUtils.lerp(edge, sign * 1.035, v) + panel.restOffsets[k+1];
            panel.foldHeights[i] = panel.restOffsets[k+2];
            const closedY=THREE.MathUtils.lerp(.04+.013*Math.sin(u*7),sign*1.035,v);
            panel.closedHeights[i]=drape.initialHeight(u,(closedY+1.035)/2.07,aspect);
            panel.seamHeights[i] = edge;
            panel.base[k + 2] = .185 + panel.foldHeights[i]
              + .015*Math.exp(-v*14);
          }
          // One material coordinate system across the closed seam. The UVs
          // stay on the fabric during the cut instead of swapping a full layer.
          for(let i=0;i<coords.length;i++){
            const {u,v}=coords[i];
            const closedY=THREE.MathUtils.lerp(.04+.013*Math.sin(u*7),sign*1.035,v);
            panel.restUV[i*2]=u*2*aspect*1.12;
            panel.restUV[i*2+1]=closedY*1.08+1.035;
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
          const finalY = panel.seamHeights[i];
          const opened = cutRelease(shot, u);
          const y = THREE.MathUtils.lerp(
            clothEdge(shot, u, sign, finalY, opened),
            sign * 1.035,
            v,
          );
          const folds = THREE.MathUtils.lerp(panel.closedHeights[i],panel.foldHeights[i],opened);
          const curl =
            0.025 * opened * Math.exp(-v * 14) * (1 - shot.spread * 0.4);
          const currentY = y + panel.restOffsets[i*3+1]*shot.spread + settle * Math.sin(u * 7 + v * 3) * v;
          position.setXYZ(
            i,
            (u * 2 - 1) * aspect + panel.restOffsets[i*3]*shot.spread,
            currentY,
            0.185 +
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
      for(const panel of panels){
        const p=panel.edgeGeometry.attributes.position,tuv=panel.edgeGeometry.attributes.uv;
        const first=profile.rows*(profile.columns+1);
        panel.edgeMesh.visible=shot.cut>0;
        for(let row=0;row<=4;row++)for(let col=0;col<=profile.columns;col++){
          const i=first+col,k=row*(profile.columns+1)+col,t=row/4,open=cutRelease(shot,col/profile.columns);
          p.setXYZ(k,panel.position.getX(i),panel.position.getY(i)-panel.sign*.002*Math.sin(Math.PI*t)*open,panel.position.getZ(i)-.004*t*open);
          tuv.setXY(k,panel.uv.getX(i),panel.uv.getY(i)+.004*t);
        }
        p.needsUpdate=true;tuv.needsUpdate=true;panel.edgeGeometry.computeVertexNormals();panel.edgeGeometry.computeBoundingSphere();
      }
      if (seconds >= 4.5) interactive = true;
      physicsClock = interaction;
      // Weld the shading of the two touching borders until the cutting
      // contact separates them. There is no full-height cut/reveal plane.
      if(seconds<3.7){
        const top=panels[0].geometry.attributes.normal;
        const bottom=panels[1].geometry.attributes.normal;
        const first=profile.rows*(profile.columns+1);
        for(let col=0;col<=profile.columns;col++){
          const weight=1-smooth(cutRelease(shot,col/profile.columns)/.12);
          if(weight===0)continue;
          const i=first+col;
          let nx=top.getX(i)+bottom.getX(i),ny=top.getY(i)+bottom.getY(i),nz=top.getZ(i)+bottom.getZ(i);
          const length=Math.hypot(nx,ny,nz)||1;nx/=length;ny/=length;nz/=length;
          const tx=top.getX(i)*(1-weight)+nx*weight,ty=top.getY(i)*(1-weight)+ny*weight,tz=top.getZ(i)*(1-weight)+nz*weight;
          const bx=bottom.getX(i)*(1-weight)+nx*weight,by=bottom.getY(i)*(1-weight)+ny*weight,bz=bottom.getZ(i)*(1-weight)+nz*weight;
          const tl=Math.hypot(tx,ty,tz)||1,bl=Math.hypot(bx,by,bz)||1;
          top.setXYZ(i,tx/tl,ty/tl,tz/tl);bottom.setXYZ(i,bx/bl,by/bl,bz/bl);
        }
        top.needsUpdate=true;bottom.needsUpdate=true;
      }
      // Uniform scale preserves 3D proportions and normals on phones.
      shears.scale.setScalar(scale);
      upper.rotation.z = shot.blade;
      lower.rotation.z = -shot.blade;
      const presentation = shearPresentation(seconds, scale, contactY, contactZ);
      shears.rotation.set(presentation.roll, 0, 0);
      shears.position.set(hingeX, presentation.y, presentation.z);
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
    for (const texture of [intact, surface, studio])
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
