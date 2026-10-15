"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { measurements, type MeasurementKey } from "@/lib/measurements";

type Form = "male" | "female";
type Hair = "short01" | "bob01" | "ponytail01";
type Viewer = {
  select: (key: MeasurementKey) => void;
  view: (angle: number) => void;
  rotate: (amount: number) => void;
  zoom: (amount: number) => void;
  hair: (style: Hair) => Promise<void>;
  build: (value: number) => void;
};
const control =
  "min-h-11 min-w-11 px-3 py-2 text-xs text-neutral-700 hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rrc-silver";

/** Licensed adult anatomical reference with native morphology and a relaxed rig pose. */
export default function BodyModel({
  selected,
  value,
  ru,
}: {
  selected: MeasurementKey;
  value: number | null;
  ru: boolean;
}) {
  const host = useRef<HTMLDivElement>(null),
    label = useRef<HTMLDivElement>(null),
    viewer = useRef<Viewer | null>(null),
    selection = useRef(selected),
    hairSelection = useRef<Hair>("short01"),
    buildSelection = useRef(0);
  const [hair, setHair] = useState<Hair>("short01"),
    [build, setBuild] = useState(0),
    [hairStatus, setHairStatus] = useState<"loading" | "ready" | "error">("loading");
  const [form, setForm] = useState<Form>("male"),
    [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  selection.current = selected;
  hairSelection.current = hair;
  buildSelection.current = build;
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    const element = container;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch {
      setStatus("fallback");
      return;
    }
    const disposeMaterial=(material:THREE.Material)=>{
      for(const value of Object.values(material))if(value instanceof THREE.Texture){value.dispose();if(typeof ImageBitmap!=="undefined"&&value.image instanceof ImageBitmap)value.image.close();}
      material.dispose();
    };
    const started=performance.now(), loading=new AbortController();
    let hairRequest:AbortController | null=null, hairObject:THREE.Object3D | null=null;
    const bodyMeshes:THREE.Mesh[]=[];
    type Guide={y:number;rx:number;rz:number;z:number};
    let anatomicalGuides:Record<string,Guide>|null=null,morphGuides:Record<string,Record<string,Guide>>|null=null;
    const disposeObject=(object:THREE.Object3D)=>object.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(disposeMaterial);}});
    let alive = true,
      prepared = false,
      frame = 0;
    setStatus("loading");
    setHairStatus("loading");
    element.dataset.bodyHair="";
    delete element.dataset.bodyFirstFrameMs;
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(32, 1, 0.1, 30);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setClearColor(0xffffff, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    element.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("aria-hidden", "true");
    const studio = new RoomEnvironment(),
      pmrem = new THREE.PMREMGenerator(renderer),
      environment = pmrem.fromScene(studio, 0.04);
    scene.environment = environment.texture;
    studio.dispose();
    pmrem.dispose();
    scene.add(new THREE.HemisphereLight(0xffffff, 0xaaaaaa, 0.45));
    const light = new THREE.DirectionalLight(0xfff6ed, 1.8);
    light.position.set(2, 4, 3);
    scene.add(light);
    const rim = new THREE.DirectionalLight(0xffffff, 0.6);
    rim.position.set(-2, 2, -3);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0xffffff, 0.6);
    fill.position.set(-3, 2, 1);
    scene.add(fill);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.73, 0);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.18;
    controls.minDistance = 4.4;
    controls.maxDistance = 8.5;
    controls.rotateSpeed = 0.6;
    controls.zoomSpeed = 0.6;
    controls.minPolarAngle = Math.PI * 0.28;
    controls.maxPolarAngle = Math.PI * 0.7;
    controls.touches.ONE = THREE.TOUCH.ROTATE;
    controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
    camera.position.set(0.35, 1.85, 6.8);
    controls.update();
    const v = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z),
      markings = new Map<MeasurementKey, THREE.Group>(),
      centres = new Map<MeasurementKey, THREE.Vector3>();
    function path(
      key: MeasurementKey,
      points: THREE.Vector3[],
      closed = false,
    ) {
      let group = markings.get(key);
      if (!group) {
        group = new THREE.Group();
        markings.set(key, group);
        scene.add(group);
      }
      const mesh = new THREE.Mesh(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3(points, closed, "centripetal"),
          96,
          0.008,
          8,
          closed,
        ),
        new THREE.MeshBasicMaterial({
          color: 0xc9b9bd,
          transparent: true,
          opacity: 0.12,
          depthTest: false,
          depthWrite: false,
        }),
      );
      mesh.renderOrder = 10;
      group.add(mesh);
    }
    function ring(
      key: MeasurementKey,
      x: number,
      y: number,
      rx: number,
      rz: number,
      z = 0,
    ) {
      path(
        key,
        Array.from({ length: 64 }, (_, i) => {
          const a = (i / 64) * Math.PI * 2;
          return v(x + Math.cos(a) * rx, y, z + Math.sin(a) * rz);
        }),
        true,
      );
    }
    const female = form === "female",
      shoulder = female ? 0.34 : 0.405;
    ring("neck", 0, 2.85, 0.125, 0.127);
    ring(
      "chest",
      0,
      2.43,
      female ? 0.335 : 0.392,
      female ? 0.31 : 0.255,
      0.025,
    );
    ring("waist", 0, 2.06, female ? 0.245 : 0.27, 0.175);
    ring("hips", 0, 1.74, female ? 0.36 : 0.323, 0.245, -0.035);
    ring("upperArm", -(shoulder + 0.08), 2.42, 0.123, 0.129);
    ring("thigh", -0.18, 1.45, 0.18, 0.19);
    ring("calf", -0.21, 0.65, 0.125, 0.13, -0.025);
    path("shoulder", [
      v(-shoulder, 2.65, -0.17),
      v(0, 2.73, -0.19),
      v(shoulder, 2.65, -0.17),
    ]);
    path("sleeve", [
      v(-shoulder, 2.65, 0.13),
      v(-(shoulder + 0.15), 2.13, 0.095),
      v(-(shoulder + 0.24), 1.67, 0.08),
    ]);
    path("inseam", [
      v(-0.04, 1.52, 0.13),
      v(-0.1, 0.9, 0.13),
      v(-0.13, 0.08, 0.13),
    ]);
    path("height", [v(0.85, 0.03), v(0.85, 3.4)]);
    path("height", [v(0.73, 0.03), v(0.97, 0.03)]);
    path("height", [v(0.73, 3.4), v(0.97, 3.4)]);
    markings.forEach((group, key) =>
      centres.set(
        key,
        new THREE.Box3().setFromObject(group).getCenter(new THREE.Vector3()),
      ),
    );
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(0.72, 64),
      new THREE.MeshBasicMaterial({
        color: 0xc3a0a8,
        transparent: true,
        opacity: 0.07,
        side: THREE.DoubleSide,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.012;
    scene.add(floor);
    let orbitClock=performance.now();
    function settleOrbit(){controls.enableDamping=false;controls.update();controls.enableDamping=true;}
    function render() {
      if (!alive || document.hidden) return;
      element.dataset.bodyRenderCount=String(Number(element.dataset.bodyRenderCount||0)+1);
      const now=performance.now(),dt=Math.min(.5,Math.max(1/240,(now-orbitClock)/1000));orbitClock=now;
      // OrbitControls damping is per update; normalize it to wall time so a
      // slow phone does not spend seconds requesting residual orbit frames.
      controls.dampingFactor=1-Math.pow(1-.18,dt*60);
      controls.update();controls.dampingFactor=.18;
      renderer.render(scene, camera);
      element.dataset.bodyIdle=String(frame===0);
      if(bodyMeshes.length&&!element.dataset.bodyFirstFrameMs)element.dataset.bodyFirstFrameMs=(performance.now()-started).toFixed(1);
      const centre = centres.get(selection.current);
      if (label.current) {
        label.current.style.display =
          centre && selection.current !== "weight" ? "block" : "none";
        if (centre) {
          const point = centre.clone().project(camera),
            width = element.clientWidth,
            height = element.clientHeight;
          label.current.style.transform = `translate(${THREE.MathUtils.clamp(((point.x + 1) * width) / 2 + 18, 8, width - 150)}px,${THREE.MathUtils.clamp(((1 - point.y) * height) / 2 - 18, 55, height - 85)}px)`;
        }
      }
    }
    function requestRender() {
      if (alive && !document.hidden && !frame && (prepared || bodyMeshes.length===0))
        {element.dataset.bodyIdle="false";frame = requestAnimationFrame(() => {
          frame = 0;
          render();
        });}
    }
    const select = (key: MeasurementKey) => {
      markings.forEach((group, k) =>
        group.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            const m = object.material as THREE.MeshBasicMaterial;
            m.color.set(k === key ? 0xdf8198 : 0xc9b9bd);
            m.opacity = k === key ? 0.95 : 0.09;
            object.visible = key !== "weight" || k === "height";
          }
        }),
      );
      requestRender();
    };
    function view(angle: number) {
      settleOrbit();
      const distance = camera.position.distanceTo(controls.target);
      camera.position.set(
        Math.sin(angle) * distance,
        1.85,
        Math.cos(angle) * distance,
      );
      controls.update();
      requestRender();
    }
    viewer.current = {
      select,
      view,
      hair: (style) => {
        hairRequest?.abort();hairRequest=new AbortController();const current=hairRequest;
        setHairStatus("loading");element.dataset.bodyHair="";
        return fetch(`/models/hair-${form}-${style}.glb`,{signal:current.signal}).then(r=>{if(!r.ok)throw new Error("Hair unavailable");return r.arrayBuffer();}).then(bytes=>new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes,"/models/")).then(gltf=>{
          if(!alive||current.signal.aborted){disposeObject(gltf.scene);return;}
          if(hairObject){scene.remove(hairObject);disposeObject(hairObject);}
          hairObject=gltf.scene;
          hairObject.traverse(o=>{if(o instanceof THREE.Mesh){for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof THREE.MeshStandardMaterial){m.transparent=false;m.alphaTest=.4;m.alphaToCoverage=true;m.depthWrite=true;m.side=THREE.DoubleSide;m.roughness=.72;m.envMapIntensity=.15;}}});
          scene.add(hairObject);setHairStatus("ready");element.dataset.bodyHair=style;requestRender();
        }).catch(()=>{if(alive&&!current.signal.aborted)setHairStatus("error");});
      },
      build:(amount)=>{
        for(const mesh of bodyMeshes){const d=mesh.morphTargetDictionary,a=mesh.morphTargetInfluences;if(d&&a){if(d.Lean!==undefined)a[d.Lean]=Math.max(0,-amount);if(d.Full!==undefined)a[d.Full]=Math.max(0,amount);}}
        if(anatomicalGuides&&morphGuides){const shape=morphGuides[amount<0?'Lean':'Full'],weight=Math.abs(amount);for(const key of ['neck','chest','waist','hips'] as MeasurementKey[]){const a=anatomicalGuides[key],b=shape?.[key],g=markings.get(key);if(a&&b&&g){g.scale.set(1+(b.rx-a.rx)*weight/(a.rx+.018),1,1+(b.rz-a.rz)*weight/(a.rz+.018));g.position.z=a.z+(b.z-a.z)*weight-a.z*g.scale.z;centres.set(key,v(0,a.y,a.z+(b.z-a.z)*weight));}}}
        element.dataset.bodyBuild=String(amount);requestRender();
      },
      rotate: (amount) => {
        settleOrbit();
        const offset = camera.position
          .clone()
          .sub(controls.target)
          .applyAxisAngle(v(0, 1), amount);
        camera.position.copy(controls.target).add(offset);
        controls.update();
        requestRender();
      },
      zoom: (amount) => {
        settleOrbit();
        const offset = camera.position.clone().sub(controls.target);
        offset.setLength(
          THREE.MathUtils.clamp(offset.length() + amount, 4.4, 8.5),
        );
        camera.position.copy(controls.target).add(offset);
        controls.update();
        requestRender();
      },
    };
    controls.addEventListener("change", requestRender);
    fetch(`/models/fit-${form}.glb`,{signal:loading.signal}).then(r=>{if(!r.ok)throw new Error("Model unavailable");return r.arrayBuffer();}).then(bytes=>{element.dataset.bodyFetchMs=(performance.now()-started).toFixed(1);return new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes,"/models/");}).then(async (gltf) => {
        if (!alive) {
          gltf.scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              object.geometry.dispose();
              const materials = Array.isArray(object.material)
                ? object.material
                : [object.material];
              materials.forEach(disposeMaterial);
            }
          });
          return;
        }
        // Preserve native GLTF material maps and UVs rather than discarding skin.
        gltf.scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            const materials=Array.isArray(object.material)?object.material:[object.material];
            materials.forEach(m=>{if(m instanceof THREE.MeshStandardMaterial)m.envMapIntensity=.3;});
          }
        });
        gltf.scene.traverse((object) => {
          const raw = object.userData.measurementGuides;
          if (!raw) return;
          const guides = typeof raw === "string" ? JSON.parse(raw) : raw;
          anatomicalGuides=guides;
          const morph=object.userData.morphMeasurementGuides;
          morphGuides=typeof morph==='string'?JSON.parse(morph):morph||null;
          for (const key of ["neck", "chest", "waist", "hips"] as MeasurementKey[]) {
            const guide = guides[key];
            if (!guide) continue;
            const group = markings.get(key);
            if (group) {
              group.children.forEach((child) => {
                if (child instanceof THREE.Mesh) {child.geometry.dispose(); child.material.dispose();}
              });
              group.clear();
            }
            ring(key, 0, guide.y, guide.rx + .018, guide.rz + .018, guide.z);
            centres.set(key, v(0, guide.y, guide.z));
          }
        });
        gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh&&o.morphTargetDictionary)bodyMeshes.push(o);});
        scene.add(gltf.scene);
        viewer.current?.build(buildSelection.current);
        await viewer.current?.hair(hairSelection.current);
        if(!alive)return;

        const compileStarted=performance.now();
        await renderer.compileAsync(scene,camera);
        if(!alive)return;
        element.dataset.bodyCompileMs=(performance.now()-compileStarted).toFixed(1);
        render();
        prepared=true;
        element.dataset.bodyReadyMs=(performance.now()-started).toFixed(1);
        setStatus("ready");
        select(selection.current);
      }).catch(() => {if(alive&&!loading.signal.aborted)setStatus("fallback");});
    const resize = () => {
      const { width, height } = element.getBoundingClientRect();
      if (width && height) {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.6,Math.sqrt(750000/(width*height))));
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        requestRender();
      }
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    const visibility=()=>{orbitClock=performance.now();if(document.hidden){cancelAnimationFrame(frame);frame=0;element.dataset.bodyIdle="true";}else requestRender();};
    document.addEventListener("visibilitychange",visibility);
    const lost = (event: Event) => {
      event.preventDefault();
      if (alive) setStatus("fallback");
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    return () => {
      alive = false;
      loading.abort();hairRequest?.abort();
      document.removeEventListener("visibilitychange",visibility);
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.removeEventListener("change", requestRender);
      controls.dispose();
      viewer.current = null;
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach(disposeMaterial);
        }
      });
      environment.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [form]);
  useEffect(() => {
    viewer.current?.select(selected);
  }, [selected]);
  useEffect(()=>{if(status==="ready"&&host.current?.dataset.bodyHair!==hair)void viewer.current?.hair(hair);},[hair,status]);
  useEffect(()=>{viewer.current?.build(build);},[build]);
  return (
    <div className="rrc-fit-viewer bg-white text-neutral-900 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className="text-[10px] text-neutral-500">RRC / ATELIER FORM</span>
        <div
          className="flex gap-1"
          aria-label={ru ? "Форма манекена" : "Mannequin form"}
        >
          {(["male", "female"] as const).map((f) => (
            <button
              type="button"
              key={f}
              aria-pressed={form === f}
              onClick={() => setForm(f)}
              className={`min-h-11 px-4 border-b text-xs transition-colors ${form === f ? "border-black text-black" : "border-transparent text-neutral-500 hover:text-black"}`}
            >
              {f === "male"
                ? ru
                  ? "Мужская"
                  : "Male"
                : ru
                  ? "Женская"
                  : "Female"}
            </button>
          ))}
        </div>
      </div>
      <div className="relative overflow-hidden rounded-[2px] bg-white border border-black/[.06]">
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none bg-white"
        />
        <div
          ref={host}
          data-body-model={status}
          data-body-form={form}
          className={`relative h-[460px] sm:h-[550px] ${status === "fallback" ? "hidden" : ""}`}
          role="img"
          aria-label={
            ru
              ? "Вращаемая 3D-модель с линиями мерок"
              : "Rotatable 3D model with measurement lines"
          }
        />
        <div
          ref={label}
          aria-hidden="true"
          className={`pointer-events-none absolute left-0 top-0 max-w-[145px] border-l border-[#df8198] bg-white/90 px-3 py-2 text-[11px] backdrop-blur-sm ${status === "ready" ? "" : "hidden"}`}
        >
          <span className="block text-neutral-800">
            {ru ? measurements[selected].ru : measurements[selected].en}
          </span>
          <span className="block mt-1 tabular-nums text-[#df8198]">
            {value ?? "—"}{" "}
            {measurements[selected].unit === "kg"
              ? ru
                ? "кг"
                : "kg"
              : ru
                ? "см"
                : "cm"}
          </span>
        </div>
        {status === "loading" && (
          <p
            role="status"
            className="absolute inset-0 flex items-center justify-center text-sm text-neutral-500"
          >
            {ru ? "Загружаем модель…" : "Loading model…"}
          </p>
        )}
        {status === "fallback" && (
          <div className="relative p-5">
            <Image
              src={`/images/atelier/fit-reference-${form}.png`}
              alt={
                ru
                  ? "Концепт мужского и женского манекенов RRC"
                  : "RRC male and female mannequin concept"
              }
              width={576}
              height={896}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="w-full"
            />
            <p className="mt-4 text-xs leading-relaxed text-neutral-500">
              {ru
                ? "3D недоступно на этом устройстве. Инструкции и все поля мерок доступны ниже."
                : "3D is unavailable on this device. All measurement fields and instructions remain available below."}
            </p>
          </div>
        )}
        <p className="absolute bottom-4 inset-x-4 text-center text-[10px] text-neutral-500 pointer-events-none">
          {status === "ready"
            ? ru
              ? "Один палец — поворот · Два — масштаб"
              : "One finger to orbit · Two to zoom"
            : ""}
        </p>
      </div>
      <div hidden={status==="fallback"} className="mt-4 border-b border-black/10 pb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2" aria-label={ru?"Причёска":"Hair style"}>
          {([['short01','Короткая','Short'],['bob01','Каре','Bob'],['ponytail01','Собранные','Tied']] as const).map(([style,ruName,enName])=><button type="button" key={style} aria-pressed={hair===style} onClick={()=>setHair(style)} disabled={status!=="ready"} className={`${control} border-b ${hair===style?'border-black':'border-transparent'}`}>{ru?ruName:enName}</button>)}
          <span className="text-[10px] text-neutral-500" role="status">{hairStatus==='loading'?(ru?'Волосы…':'Loading hair…'):hairStatus==='error'?(ru?'Причёска недоступна':'Hair unavailable'):''}</span>
        </div>
        <label className="flex items-center gap-4 text-xs text-neutral-600">{ru?'Телосложение':'Body build'}<input aria-label={ru?'Телосложение':'Body build'} type="range" min="-0.55" max="0.55" step="0.05" value={build} disabled={status!=="ready"} onChange={e=>setBuild(Number(e.target.value))} className="min-h-11 w-full accent-neutral-700"/></label>
        <p className="text-[10px] text-neutral-500">{ru?'Вариант пропорций для ориентира. Не рассчитывается по вашим меркам.':'Reference proportions. Not calculated from your measurements.'}</p>
      </div>
      <div
        className="flex items-center justify-between flex-wrap gap-1 mt-3 border-b border-black/10 pb-3"
        aria-label={ru ? "Управление моделью" : "Model controls"}
      >
        <button
          type="button"
          className={control}
          disabled={status !== "ready"}
          onClick={() => viewer.current?.view(0)}
        >
          {ru ? "Спереди" : "Front"}
        </button>
        <button
          type="button"
          className={control}
          disabled={status !== "ready"}
          onClick={() => viewer.current?.view(Math.PI)}
        >
          {ru ? "Сзади" : "Back"}
        </button>
        <button
          type="button"
          className={control}
          disabled={status !== "ready"}
          onClick={() => viewer.current?.rotate(-Math.PI / 6)}
          aria-label={ru ? "Повернуть влево" : "Rotate left"}
        >
          ↶
        </button>
        <button
          type="button"
          className={control}
          disabled={status !== "ready"}
          onClick={() => viewer.current?.rotate(Math.PI / 6)}
          aria-label={ru ? "Повернуть вправо" : "Rotate right"}
        >
          ↷
        </button>
        <button
          type="button"
          className={control}
          disabled={status !== "ready"}
          onClick={() => viewer.current?.zoom(-0.6)}
          aria-label={ru ? "Приблизить" : "Zoom in"}
        >
          +
        </button>
        <button
          type="button"
          className={control}
          disabled={status !== "ready"}
          onClick={() => viewer.current?.zoom(0.6)}
          aria-label={ru ? "Отдалить" : "Zoom out"}
        >
          −
        </button>
      </div>
    </div>
  );
}
