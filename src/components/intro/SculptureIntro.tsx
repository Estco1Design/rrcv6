"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { ParametricGeometry } from "three/examples/jsm/geometries/ParametricGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/** A bevelled RRC monogram and an orbiting couture ribbon. No video download. */
export default function SculptureIntro({
  playing,
  reduced,
}: {
  playing: boolean;
  reduced: boolean;
}) {
  const fallback = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null),
    options = useRef({ playing, reduced }),
    resume = useRef<(() => void) | null>(null);
  options.current = { playing, reduced };
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      return;
    }
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(35, 1, 0.1, 30);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    const room = new RoomEnvironment(),
      pmrem = new THREE.PMREMGenerator(renderer),
      environment = pmrem.fromScene(room, 0.03);
    scene.environment = environment.texture;
    room.dispose();
    pmrem.dispose();
    const silver = new THREE.MeshPhysicalMaterial({
      color: 0xc0c4cc,
      metalness: 1,
      roughness: 0.2,
      clearcoat: 0.7,
      clearcoatRoughness: 0.18,
    });
    const wine = new THREE.MeshPhysicalMaterial({
      color: 0x651c34,
      metalness: 0.65,
      roughness: 0.27,
      clearcoat: 1,
    });
    const emblem = new THREE.Group();
    scene.add(emblem);
    function r() {
      const s = new THREE.Shape();
      s.moveTo(0, 0);
      s.lineTo(0.28, 0);
      s.lineTo(0.28, 0.56);
      s.lineTo(0.54, 0.56);
      s.lineTo(0.92, 0);
      s.lineTo(1.25, 0);
      s.lineTo(0.8, 0.64);
      s.bezierCurveTo(1.22, 0.82, 1.18, 1.4, 0.69, 1.4);
      s.lineTo(0, 1.4);
      s.closePath();
      const h = new THREE.Path();
      h.moveTo(0.28, 0.84);
      h.lineTo(0.68, 0.84);
      h.bezierCurveTo(0.97, 0.84, 0.96, 1.15, 0.68, 1.15);
      h.lineTo(0.28, 1.15);
      h.closePath();
      s.holes.push(h);
      return s;
    }
    function c() {
      const s = new THREE.Shape(),
        start = Math.PI / 4,
        end = (Math.PI * 7) / 4;
      for (let i = 0; i <= 48; i++) {
        const a = start + ((end - start) * i) / 48;
        const x = Math.cos(a) * 0.64,
          y = Math.sin(a) * 0.72 + 0.7;
        if (i === 0) s.moveTo(x, y);
        else s.lineTo(x, y);
      }
      for (let i = 48; i >= 0; i--) {
        const a = start + ((end - start) * i) / 48;
        s.lineTo(Math.cos(a) * 0.38, Math.sin(a) * 0.45 + 0.7);
      }
      s.closePath();
      return s;
    }
    const settings = {
      depth: 0.19,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.028,
      bevelThickness: 0.023,
      curveSegments: 20,
    };
    [r(), r(), c()].forEach((shape, i) => {
      const mesh = new THREE.Mesh(
        new THREE.ExtrudeGeometry(shape, settings),
        silver,
      );
      mesh.position.set(i === 2 ? 1.53 : i * 1.4 - 1.95, -0.7, -0.1);
      emblem.add(mesh);
    });
    const ribbon = new THREE.Group();
    scene.add(ribbon);
    wine.side = THREE.DoubleSide;
    const band = new THREE.Mesh(
      new ParametricGeometry(
        (u, v, target) => {
          const t = u * Math.PI * 2,
            fold = (v - 0.5) * 0.28;
          const radius = 2.35 + 0.13 * Math.sin(3 * t);
          target.set(
            Math.cos(t) * radius + fold * Math.cos(t),
            Math.sin(t) * radius * 0.64 + fold * Math.sin(t),
            0.32 * Math.sin(2 * t) + fold * Math.cos(2 * t),
          );
        },
        160,
        12,
      ),
      wine,
    );
    band.rotation.set(0.35, 0.2, -0.15);
    ribbon.add(band);
    scene.add(new THREE.HemisphereLight(0xe4e9fa, 0x130d16, 0.8));
    const light = new THREE.DirectionalLight(0xffffff, 4);
    light.position.set(-3, 4, 3);
    scene.add(light);
    const rim = new THREE.DirectionalLight(0xba5378, 3);
    rim.position.set(3, -1, -3);
    scene.add(rim);
    camera.position.set(0, 0.15, 8.4);
    let budget = 1000/30;
    let frame = 0,
      last = 0,
      elapsed = 0,
      alive = true;
    const pointer = { x: 0, y: 0 };
    const tick = (time: number) => {
      frame = 0;
      if (!alive) return;
      if(options.current.playing&&!options.current.reduced&&time-last<budget){frame=requestAnimationFrame(tick);return;}
      const delta = Math.min((time - last) / 1000, 0.04);
      last = time;
      if (
        options.current.playing &&
        !options.current.reduced &&
        !document.hidden
      )
        elapsed += delta;
      const reveal = options.current.reduced ? 1 : Math.min(elapsed / 2.5, 1);
      emblem.rotation.y = options.current.reduced
        ? -0.08
        : Math.sin(elapsed * 0.34) * 0.22 + pointer.x * 0.14;
      emblem.rotation.x = options.current.reduced
        ? 0
        : Math.cos(elapsed * 0.27) * 0.06 + pointer.y * 0.09;
      emblem.position.y = (1 - reveal) * -0.15;
      ribbon.rotation.y = options.current.reduced ? 0.15 : elapsed * 0.14;
      ribbon.rotation.z = options.current.reduced
        ? 0
        : Math.sin(elapsed * 0.3) * 0.12;
      renderer.render(scene, camera);
      if (fallback.current) fallback.current.style.display="none";
      if (
        options.current.playing &&
        !options.current.reduced &&
        !document.hidden
      )
        frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!frame && alive) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    resume.current = start;
    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.position.z = width < 600 ? 10.2 : 8.4;
      budget=width<600?1000/24:1000/30;
      camera.updateProjectionMatrix();
      start();
    };
    const lost=(event:Event)=>{event.preventDefault();alive=false;cancelAnimationFrame(frame);if(fallback.current)fallback.current.style.display="flex";};
    renderer.domElement.addEventListener("webglcontextlost",lost);
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    const move = (event: PointerEvent) => {
      if (options.current.reduced || !options.current.playing) return;
      const box = container.getBoundingClientRect();
      pointer.x = (event.clientX - box.left) / box.width - 0.5;
      pointer.y = (event.clientY - box.top) / box.height - 0.5;
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("visibilitychange", start);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      resume.current = null;
      observer.disconnect();
      window.removeEventListener("pointermove", move);
      document.removeEventListener("visibilitychange", start);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) object.geometry.dispose();
      });
      silver.dispose();
      wine.dispose();
      environment.dispose();
      renderer.domElement.removeEventListener("webglcontextlost",lost);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);
  useEffect(() => {
    resume.current?.();
  }, [playing, reduced]);
  return (
    <div
      ref={host}
      data-intro-sculpture=""
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
    ><div ref={fallback} className="absolute inset-0 flex items-center justify-center font-display text-[clamp(80px,22vw,280px)] font-medium tracking-tight text-[#b7b3be]">RRC</div></div>
  );
}
