"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { measurements, type MeasurementKey } from "@/lib/measurements";

type Form = "male" | "female";
type Viewer = {
  select: (key: MeasurementKey) => void;
  view: (angle: number) => void;
  rotate: (amount: number) => void;
  zoom: (amount: number) => void;
};
const control =
  "min-h-11 min-w-11 px-3 py-2 text-xs text-rrc-silver hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rrc-silver";

/** Original watertight GLB sculpture; reference proportions, never an inferred personal body. */
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
    selection = useRef(selected);
  const [form, setForm] = useState<Form>("male"),
    [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  selection.current = selected;
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
    let alive = true,
      frame = 0;
    setStatus("loading");
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(32, 1, 0.1, 30);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    element.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("aria-hidden", "true");
    const studio = new RoomEnvironment(),
      pmrem = new THREE.PMREMGenerator(renderer),
      environment = pmrem.fromScene(studio, 0.04);
    scene.environment = environment.texture;
    studio.dispose();
    pmrem.dispose();
    scene.add(new THREE.HemisphereLight(0xe1e3ed, 0x191215, 0.6));
    const light = new THREE.DirectionalLight(0xe9eef7, 3);
    light.position.set(2, 4, 3);
    scene.add(light);
    const rim = new THREE.DirectionalLight(0xb65b73, 2.7);
    rim.position.set(-2, 2, -3);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0xffffff, 1.5);
    fill.position.set(-3, 2, 1);
    scene.add(fill);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x3c3e43,
      metalness: 0.9,
      roughness: 0.3,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2,
      envMapIntensity: 0.8,
    });
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.73, 0);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.14;
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
    function render() {
      if (!alive) return;
      controls.update();
      renderer.render(scene, camera);
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
      if (alive && !frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          render();
        });
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
      rotate: (amount) => {
        const offset = camera.position
          .clone()
          .sub(controls.target)
          .applyAxisAngle(v(0, 1), amount);
        camera.position.copy(controls.target).add(offset);
        controls.update();
        requestRender();
      },
      zoom: (amount) => {
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
    new GLTFLoader().load(
      `/models/fit-${form}.glb`,
      (gltf) => {
        if (!alive) {
          gltf.scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              object.geometry.dispose();
              const materials = Array.isArray(object.material)
                ? object.material
                : [object.material];
              materials.forEach((m) => m.dispose());
            }
          });
          return;
        }
        gltf.scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            const old = Array.isArray(object.material)
              ? object.material
              : [object.material];
            old.forEach((m) => m.dispose());
            object.material = material;
          }
        });
        scene.add(gltf.scene);
        setStatus("ready");
        select(selection.current);
      },
      undefined,
      () => {
        if (alive) setStatus("fallback");
      },
    );
    const resize = () => {
      const { width, height } = element.getBoundingClientRect();
      if (width && height) {
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        requestRender();
      }
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    const lost = (event: Event) => {
      event.preventDefault();
      if (alive) setStatus("fallback");
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    return () => {
      alive = false;
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
          materials.forEach((m) => m.dispose());
        }
      });
      material.dispose();
      environment.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [form]);
  useEffect(() => {
    viewer.current?.select(selected);
  }, [selected]);
  return (
    <div className="rrc-fit-viewer">
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className="text-[10px] text-rrc-off">RRC / ATELIER FORM</span>
        <div
          className="flex bg-white/[.04] p-1 rounded-full"
          aria-label={ru ? "Форма манекена" : "Mannequin form"}
        >
          {(["male", "female"] as const).map((f) => (
            <button
              type="button"
              key={f}
              aria-pressed={form === f}
              onClick={() => setForm(f)}
              className={`min-h-11 px-4 rounded-full text-xs transition-colors ${form === f ? "bg-rrc-white text-rrc-black" : "text-rrc-off hover:text-white"}`}
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
      <div className="relative overflow-hidden rounded-[2px] bg-[#09090b] border border-white/[.08]">
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_35%,#262027_0%,transparent_65%)]"
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
          className={`pointer-events-none absolute left-0 top-0 max-w-[145px] border-l border-[#df8198] bg-black/80 px-3 py-2 text-[11px] backdrop-blur-sm ${status === "ready" ? "" : "hidden"}`}
        >
          <span className="block text-rrc-silver">
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
            className="absolute inset-0 flex items-center justify-center text-sm text-rrc-off"
          >
            {ru ? "Загружаем скульптуру…" : "Loading sculpture…"}
          </p>
        )}
        {status === "fallback" && (
          <div className="relative p-5">
            <Image
              src="/images/atelier/fit-concept.png"
              alt={
                ru
                  ? "Концепт мужского и женского манекенов RRC"
                  : "RRC male and female mannequin concept"
              }
              width={1536}
              height={1024}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="w-full"
            />
            <p className="mt-4 text-xs leading-relaxed text-rrc-off">
              {ru
                ? "3D недоступно на этом устройстве. Инструкции и все поля мерок доступны ниже."
                : "3D is unavailable on this device. All measurement fields and instructions remain available below."}
            </p>
          </div>
        )}
        <p className="absolute bottom-4 inset-x-4 text-center text-[10px] text-rrc-off pointer-events-none">
          {status === "ready"
            ? ru
              ? "Один палец — поворот · Два — масштаб"
              : "One finger to orbit · Two to zoom"
            : ""}
        </p>
      </div>
      <div
        className="flex items-center justify-between flex-wrap gap-1 mt-3 border-b border-white/10 pb-3"
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
