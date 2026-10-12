'use client';
import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {measurements,type MeasurementKey} from '@/lib/measurements';

type Viewer = {select:(key:MeasurementKey)=>void;view:(angle:number)=>void;rotate:(amount:number)=>void;zoom:(amount:number)=>void};
const control='min-h-11 border border-rrc-line px-3 py-2 text-xs hover:bg-rrc-panel focus-visible:outline focus-visible:outline-2 focus-visible:outline-rrc-silver';

/** A schematic mannequin, not an estimate of the member's body. Render only on interaction. */
export default function BodyModel({selected,value,ru}:{selected:MeasurementKey;value:number|null;ru:boolean}) {
 const label=useRef<HTMLDivElement>(null);
 const host=useRef<HTMLDivElement>(null),viewer=useRef<Viewer|null>(null),selection=useRef(selected);
 const [status,setStatus]=useState<'loading'|'ready'|'fallback'>('loading');
 selection.current=selected;
 useEffect(()=>{
  const element=host.current;if(!element)return;
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}catch{setStatus('fallback');return;}
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.1,50);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75));renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  element.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden','true');
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.75,0);
  controls.enablePan=false;controls.enableDamping=false;controls.minDistance=4.4;controls.maxDistance=9;
  controls.minPolarAngle=Math.PI*.25;controls.maxPolarAngle=Math.PI*.72;
  controls.rotateSpeed=.65;controls.zoomSpeed=.65;
  // One-finger orbit, two-finger zoom; buttons provide a non-gesture alternative.
  controls.touches.ONE=THREE.TOUCH.ROTATE;controls.touches.TWO=THREE.TOUCH.DOLLY_ROTATE;
  scene.add(new THREE.HemisphereLight(0xf6ece3,0x363039,2.5));
  const keyLight=new THREE.DirectionalLight(0xfff2de,3);keyLight.position.set(3,5,4);scene.add(keyLight);
  const rim=new THREE.DirectionalLight(0xadbcca,2);rim.position.set(-3,3,-3);scene.add(rim);
  const body=new THREE.Group();scene.add(body);
  const clay=new THREE.MeshStandardMaterial({color:0xbdb0a2,roughness:.72,metalness:.12});
  function ellipsoid(x:number,y:number,z:number,sx:number,sy:number,sz:number){const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,32,24),clay);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);body.add(mesh);return mesh;}
  function limb(a:THREE.Vector3,b:THREE.Vector3,r1:number,r2:number){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,a.distanceTo(b),24),clay);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),a.clone().sub(b).normalize());body.add(mesh);}
  const v=(x:number,y:number,z=0)=>new THREE.Vector3(x,y,z);
  const torso=new THREE.Mesh(new THREE.LatheGeometry([[.12,1.53],[.27,1.62],[.34,1.78],[.30,1.94],[.25,2.08],[.27,2.23],[.35,2.40],[.38,2.54],[.40,2.64],[.31,2.73],[.13,2.80]].map(([r,y])=>new THREE.Vector2(r,y)),48),clay);
  torso.scale.z=.68;body.add(torso);
  limb(v(0,2.96),v(0,2.76),.105,.125);ellipsoid(0,3.15,0,.17,.25,.18);
  // Subtle nose makes the front/back orientation legible without facial detail.
  ellipsoid(0,3.17,.16,.035,.055,.05);
  for(const side of [-1,1]){
   ellipsoid(side*.38,2.63,0,.15,.145,.145);
   limb(v(side*.42,2.61),v(side*.57,2.12),.12,.087);ellipsoid(side*.57,2.12,0,.09,.095,.09);
   limb(v(side*.57,2.12),v(side*.68,1.65,.04),.088,.057);ellipsoid(side*.7,1.53,.04,.065,.14,.045);
   ellipsoid(side*.18,1.67,0,.19,.22,.19);
   limb(v(side*.18,1.68),v(side*.20,.92),.165,.10);ellipsoid(side*.20,.92,0,.10,.11,.10);
   limb(v(side*.20,.91),v(side*.21,.18),.105,.06);ellipsoid(side*.205,.66,-.025,.115,.24,.11);
   ellipsoid(side*.21,.095,.095,.085,.095,.19);
  }
  const floor=new THREE.Mesh(new THREE.CircleGeometry(.85,64),new THREE.MeshBasicMaterial({color:0x8e8173,transparent:true,opacity:.12,side:THREE.DoubleSide}));floor.rotation.x=-Math.PI/2;floor.position.y=-.01;scene.add(floor);
  const markings=new Map<MeasurementKey,THREE.Group>();
  function path(key:MeasurementKey,points:THREE.Vector3[],closed=false){let group=markings.get(key);if(!group){group=new THREE.Group();group.name=key;markings.set(key,group);scene.add(group);}const curve=new THREE.CatmullRomCurve3(points,closed,'centripetal');const material=new THREE.MeshBasicMaterial({color:0xd8ccc0,transparent:true,opacity:.25,depthTest:false,depthWrite:false});const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,96,.007,6,closed),material);tube.renderOrder=10;group.add(tube);}
  function ring(key:MeasurementKey,x:number,y:number,rx:number,rz:number){path(key,Array.from({length:48},(_,i)=>{const a=i/48*Math.PI*2;return v(x+Math.cos(a)*rx,y,Math.sin(a)*rz)}),true);}
  ring('neck',0,2.87,.13,.13);ring('chest',0,2.43,.375,.27);ring('waist',0,2.08,.27,.19);ring('hips',0,1.76,.37,.255);
  ring('upperArm',-.48,2.40,.14,.145);ring('thigh',-.19,1.48,.175,.18);ring('calf',-.205,.65,.127,.13);
  path('shoulder',[v(-.40,2.65,-.13),v(0,2.73,-.20),v(.40,2.65,-.13)]);
  path('sleeve',[v(-.43,2.65,.12),v(-.60,2.12,.10),v(-.70,1.65,.10)]);
  path('inseam',[v(-.04,1.54,.12),v(-.10,.90,.12),v(-.12,.08,.12)]);
  path('height',[v(.87,.02),v(.87,3.40)]);path('height',[v(.72,.02),v(1.02,.02)]);path('height',[v(.72,3.40),v(1.02,3.40)]);
  const render=()=>{renderer.render(scene,camera);const group=markings.get(selection.current);if(label.current){label.current.style.display=group&&selection.current!=='weight'?'block':'none';if(group){const point=new THREE.Box3().setFromObject(group).getCenter(new THREE.Vector3()).project(camera);const width=element.clientWidth,height=element.clientHeight;label.current.style.transform=`translate(${THREE.MathUtils.clamp((point.x+1)*width/2+18,8,width-145)}px, ${THREE.MathUtils.clamp((1-point.y)*height/2-15,40,height-80)}px)`;}}};
  const select=(key:MeasurementKey)=>{markings.forEach((group,k)=>group.traverse(object=>{if(object instanceof THREE.Mesh){const m=object.material as THREE.MeshBasicMaterial;m.color.set(k===key?0xf06e8c:0xd8ccc0);m.opacity=k===key?1:.16;object.visible=key!=='weight'||k==='height';}}));render();};
  function view(angle:number){const distance=camera.position.distanceTo(controls.target)||6.6;camera.position.set(Math.sin(angle)*distance,1.85,Math.cos(angle)*distance);controls.update();render();}
  viewer.current={select,view,rotate:(amount)=>{const offset=camera.position.clone().sub(controls.target);offset.applyAxisAngle(v(0,1),amount);camera.position.copy(controls.target).add(offset);controls.update();render();},zoom:(amount)=>{const offset=camera.position.clone().sub(controls.target);offset.setLength(THREE.MathUtils.clamp(offset.length()+amount,4.4,9));camera.position.copy(controls.target).add(offset);controls.update();render();}};
  camera.position.set(0,1.85,6.6);controls.update();select(selection.current);
  controls.addEventListener('change',render);
  const resize=()=>{const {width,height}=element.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();render();};
  const observer=new ResizeObserver(resize);observer.observe(element);resize();setStatus('ready');
  const lost=(event:Event)=>{event.preventDefault();setStatus('fallback');};renderer.domElement.addEventListener('webglcontextlost',lost);
  return()=>{observer.disconnect();controls.removeEventListener('change',render);controls.dispose();viewer.current=null;renderer.domElement.removeEventListener('webglcontextlost',lost);scene.traverse(object=>{if(object instanceof THREE.Mesh){object.geometry.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(material=>material.dispose());}});renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
 },[]);
 useEffect(()=>{viewer.current?.select(selected)},[selected]);
 return <div>
  <div className="relative overflow-hidden border border-rrc-line bg-[#141213]">
   <div ref={host} data-body-model={status} className={`h-[420px] sm:h-[520px] ${status==='fallback'?'hidden':''}`} role="img" aria-label={ru?'Вращаемый 3D-манекен с линиями мерок':'Rotatable 3D mannequin with measurement lines'}/>
   <div ref={label} aria-hidden="true" className={`pointer-events-none absolute left-0 top-0 max-w-[140px] border-l-2 border-[#f06e8c] bg-black/85 px-3 py-2 text-[11px] ${status==='ready'?'':'hidden'}`}><span className="block text-rrc-silver">{ru?measurements[selected].ru:measurements[selected].en}</span><span className="block mt-1 tabular-nums text-[#f06e8c]">{value??'—'} {measurements[selected].unit==='kg'?(ru?'кг':'kg'):(ru?'см':'cm')}</span></div>
   {status==='loading' &&<p role="status" className="absolute inset-0 flex items-center justify-center text-sm text-rrc-off">{ru?'Загружаем модель…':'Loading model…'}</p>}
   {status==='fallback'&&<div className="p-6 text-sm leading-relaxed text-rrc-off"><p>{ru?'3D недоступно на этом устройстве. Все мерки можно заполнить ниже; инструкция для выбранной мерки остаётся доступной.':'3D is unavailable on this device. You can still enter every measurement below and read the selected instructions.'}</p><svg viewBox="0 0 200 300" className="mx-auto mt-6 h-64" aria-hidden="true"><g fill="none" stroke="#bdb0a2" strokeWidth="2"><ellipse cx="100" cy="35" rx="18" ry="25"/><path d="M90 60 L90 70 Q60 72 62 115 L72 172 L67 285 L88 285 L100 190 L112 285 L133 285 L128 172 L138 115 Q140 72 110 70 L110 60 M65 78 L42 175 M135 78 L158 175"/><path stroke="#efb7a0" d="M63 104 H137 M70 138 H130 M71 168 H129"/></g></svg></div>}
   <span aria-hidden="true" className="absolute left-4 top-4 text-[10px] text-rrc-off">RRC / FIT STUDY</span>
   <p className="absolute bottom-4 left-4 right-4 text-center text-[11px] text-rrc-silver">{status==='ready'?(ru?'Потяните модель, чтобы повернуть':'Drag the model to rotate'):''}</p>
  </div>
  <div className="flex flex-wrap gap-2 mt-3" aria-label={ru?'Управление моделью':'Model controls'}>
   <button type="button" className={control} disabled={status!=='ready'} onClick={()=>viewer.current?.view(0)}>{ru?'Спереди':'Front'}</button>
   <button type="button" className={control} disabled={status!=='ready'} onClick={()=>viewer.current?.view(Math.PI)}>{ru?'Сзади':'Back'}</button>
   <button type="button" className={control} disabled={status!=='ready'} onClick={()=>viewer.current?.rotate(-Math.PI/6)} aria-label={ru?'Повернуть влево':'Rotate left'}>↶</button>
   <button type="button" className={control} disabled={status!=='ready'} onClick={()=>viewer.current?.rotate(Math.PI/6)} aria-label={ru?'Повернуть вправо':'Rotate right'}>↷</button>
   <button type="button" className={control} disabled={status!=='ready'} onClick={()=>viewer.current?.zoom(-.6)} aria-label={ru?'Приблизить':'Zoom in'}>+</button>
   <button type="button" className={control} disabled={status!=='ready'} onClick={()=>viewer.current?.zoom(.6)} aria-label={ru?'Отдалить':'Zoom out'}>−</button>
  </div>
 </div>;
}
