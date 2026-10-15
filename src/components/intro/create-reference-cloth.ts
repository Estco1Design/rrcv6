import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ClothDynamics } from "./cloth-dynamics";
import { ClothSurfaceSampling } from "./cloth-surface";
import contours from "./reference-contours.json";
import { clamp, cutFrame, cutRelease, clothEdge, smooth, SHEAR_WIDTH_RATIO, shearPresentation } from "./cut-timeline";
import type { CutScene } from "./create-cut-scene";

/** Two independently deformable projected-art surfaces. Approved pixels and
 * baked lighting are retained deliberately; this is not a new PBR wool scan.
 * CPU geometry drives both rasterization and raycasting, including local grabs.
 */
export async function createCutScene(host:HTMLDivElement,signal:AbortSignal):Promise<CutScene>{
 if(signal.aborted)throw new DOMException('Aborted','AbortError');
 const started=performance.now(),timings:Record<string,number>={};
 const mobile=host.clientWidth<768||(matchMedia('(pointer: coarse)').matches&&Math.min(host.clientWidth,host.clientHeight)<768);
 const profile=mobile?contours.mobile:contours.desktop,C=mobile?112:160,R=mobile?32:40;
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.domElement.setAttribute('aria-hidden','true');host.appendChild(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,.01,10);camera.position.z=4;
 const retained:{dispose:()=>void}[]=[];let disposed=false,aspect=1,height=1,last=0,clock=0,interactive=false;
 host.dataset.profile=mobile?'mobile':'desktop';host.dataset.material='approved-reference';
 const dispose=()=>{if(disposed)return;disposed=true;scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});retained.forEach(r=>r.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
 signal.addEventListener('abort',dispose,{once:true});
 try{
  const loadPhoto=async()=>{
   const start=performance.now(),r=await fetch('/intro/'+profile.file,{signal});if(!r.ok)throw new Error('Approved cloth unavailable');const blob=await r.blob();timings.colorFetchMs=performance.now()-start;
   const decode=performance.now(),bitmap=await createImageBitmap(blob,{imageOrientation:'flipY',colorSpaceConversion:'none'});timings.colorDecodeMs=performance.now()-decode;
   if(signal.aborted){bitmap.close();throw new DOMException('Aborted','AbortError');}
   retained.push({dispose:()=>bitmap.close()});const texture=new THREE.Texture(bitmap);texture.flipY=false;texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=true;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());texture.needsUpdate=true;retained.push(texture);return texture;
  };
  const loadStudio=async()=>{
   const start=performance.now();let data:ArrayBuffer|undefined;
   if(typeof DecompressionStream!=='undefined')try{const r=await fetch('/intro/studio-hdr-cubeuv.bin.gz',{signal});if(r.ok)data=await new Response(new Blob([await r.arrayBuffer()]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();}catch(e){if(signal.aborted)throw e;}
   if(!data||data.byteLength!==384*512*8){const r=await fetch('/intro/studio-hdr-cubeuv.bin',{signal});if(!r.ok)throw new Error('Studio unavailable');data=await r.arrayBuffer();}
   if(data.byteLength!==384*512*8)throw new Error('Invalid studio');
   if(signal.aborted)throw new DOMException('Aborted','AbortError');
   const t=new THREE.DataTexture(new Uint16Array(data),384,512,THREE.RGBAFormat,THREE.HalfFloatType);t.colorSpace=THREE.LinearSRGBColorSpace;t.mapping=THREE.CubeUVReflectionMapping;t.generateMipmaps=false;t.minFilter=t.magFilter=THREE.LinearFilter;t.needsUpdate=true;retained.push(t);timings.studioFetchMs=performance.now()-start;return t;
  };
  const modelStart=performance.now();
  const [photo,studio,gltf]=await Promise.all([loadPhoto(),loadStudio(),fetch('/intro/titanium-shears'+(mobile?'-mobile':'')+'.glb',{signal}).then(async r=>{if(!r.ok)throw new Error('Shears unavailable');const b=await r.arrayBuffer();timings.modelFetchMs=performance.now()-modelStart;const t=performance.now(),model=await new GLTFLoader().parseAsync(b,'/intro/');timings.modelParseMs=performance.now()-t;if(signal.aborted){model.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});throw new DOMException('Aborted','AbortError');}return model;})]);
  if(signal.aborted)throw new DOMException('Aborted','AbortError');
  timings.resourcesReadyMs=performance.now()-started;
  const material=new THREE.MeshBasicMaterial({map:photo,toneMapped:false,side:THREE.DoubleSide});
  const at=(a:number[],u:number)=>{const x=clamp(u)*(a.length-1),i=Math.min(a.length-2,Math.floor(x));return THREE.MathUtils.lerp(a[i],a[i+1],x-i);};
  const panels=[1,-1].map(sign=>{
   const geometry=new THREE.PlaneGeometry(2,1,C,R),position=geometry.attributes.position,uv=geometry.attributes.uv;
   const coords=Array.from({length:position.count},(_,i)=>({u:uv.getX(i),v:uv.getY(i)}));
   const edge=sign>0?profile.top:profile.bottom,hitEdge=new Float32Array(C+1);
   // SVG is a conservative broad phase. Full source-pixel UV bounds decide
   // the real hit, so dark folds and thin ridges are not cut out by a coarse path.
   for(let i=0;i<=C;i++){
    let bound=sign>0?0:1;
    for(let k=Math.max(0,Math.floor((i-1)/C*(edge.length-1)));k<=Math.min(edge.length-1,Math.ceil((i+1)/C*(edge.length-1)));k++)bound=sign>0?Math.max(bound,edge[k]):Math.min(bound,edge[k]);
    hitEdge[i]=bound;
   }
   const mesh=new THREE.Mesh(geometry,material);mesh.name=sign>0?'top':'bottom';scene.add(mesh);
   return {sign,hitEdge,mesh,geometry,position,uv,coords,base:new Float32Array(position.count*3),sampling:new ClothSurfaceSampling(C,R,24,20),dynamics:new ClothDynamics(25,21,sign),wasActive:false};
  });
  const clothMeshes=panels.map(p=>p.mesh);
  const tool=new THREE.Group();tool.add(gltf.scene);scene.add(tool);
  const upper=gltf.scene.getObjectByName('UpperArm'),lower=gltf.scene.getObjectByName('LowerArm');if(!upper||!lower)throw new Error('Shear pivot missing');
  const metal=new Map<string,THREE.MeshPhysicalMaterial>(),oldMaterials=new Set<THREE.Material>();
  gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh){const old=o.material as THREE.MeshStandardMaterial;oldMaterials.add(old);let m=metal.get(old.name);if(!m){m=new THREE.MeshPhysicalMaterial({color:old.color,metalness:1,roughness:old.roughness,normalMap:old.normalMap,normalScale:old.normalScale,envMap:studio,envMapIntensity:.8,envMapRotation:new THREE.Euler(.35,.6,0)});metal.set(old.name,m);}o.material=m;}});oldMaterials.forEach(m=>m.dispose());for(const texture of new Set([...metal.values()].map(m=>m.normalMap).filter((m):m is THREE.Texture=>!!m)))retained.push(texture);
  const light=new THREE.DirectionalLight(0xfffaf3,2);light.position.set(-2,3,3);scene.add(light,new THREE.AmbientLight(0xffffff,.1));
  let grabbed:typeof panels[number]|undefined,grabX=0,grabY=0;
  const release=()=>{for(const p of panels)p.dynamics.release(performance.now()/1000);grabbed=undefined;host.dataset.grabbed='';};
  const borderPoint=(p:typeof panels[number],u:number)=>{
   const source=p.hitEdge[Math.round(clamp(u)*C)],v=p.sign>0?1-source/.46:(source-.54)/.46,row=clamp(1-v)*R,j=Math.min(R-1,Math.floor(row)),col=clamp(u)*C,i=Math.min(C-1,Math.floor(col)),fx=col-i,fy=row-j;
   const sample=(axis:number)=>{const get=(x:number,y:number)=>p.position.array[(y*(C+1)+x)*3+axis];return THREE.MathUtils.lerp(THREE.MathUtils.lerp(get(i,j),get(i+1,j),fx),THREE.MathUtils.lerp(get(i,j+1),get(i+1,j+1),fx),fy);};return {x:sample(0),y:sample(1)};
  };
  const paths=()=>{for(const p of panels){const points=[];for(let i=0;i<=C;i++){const b=borderPoint(p,i/C);points.push(`${(b.x/aspect+1)*50} ${(1-b.y)*50}`);}const polygon=p.sign>0?['0 0','100 0',...points.reverse()]:[...points,'100 100','0 100'];host.querySelector(`[data-cloth-hit="${p.mesh.name}"]`)?.setAttribute('d','M'+polygon.join(' L')+' Z');}};
  const render=(seconds:number,interaction=performance.now()/1000,draw=true)=>{
   if(disposed||signal.aborted)return;const start=performance.now(),shot=cutFrame(seconds);last=seconds;
   material.color.setScalar(shot.light);tool.visible=shot.tool;light.intensity=2*shot.light;
   host.dataset.cut=clamp(shot.cut).toFixed(4);host.dataset.blade=shot.blade.toFixed(4);host.dataset.seconds=seconds.toFixed(3);host.dataset.tool=String(shot.tool);host.dataset.renderCount=String(Number(host.dataset.renderCount||0)+1);
   for(const p of panels){
    if(interactive&&seconds>=4.5){
     if(!p.dynamics.active()&&!p.wasActive)continue;p.wasActive=p.dynamics.active();p.dynamics.step(Math.min(1/15,Math.max(0,interaction-clock)),interaction);p.sampling.deform(p.base,p.dynamics.offset,p.position.array as Float32Array,Math.min(aspect*2,2)*.04,p.sign);
     p.position.needsUpdate=true;p.geometry.computeBoundingSphere();host.dataset[p.sign>0?'topMotion':'bottomMotion']=String(p.dynamics.offset.reduce((a,b)=>Math.max(a,Math.abs(b)),0));continue;
    }
    const cap=p.sign>0?.46:.54;
    for(let i=0;i<p.coords.length;i++){
     const {u,v}=p.coords[i],open=cutRelease(shot,u),sourceCap=THREE.MathUtils.lerp(at(p.sign>0?profile.top:profile.bottom,u),cap,open),sourceY=p.sign>0?sourceCap*(1-v):sourceCap+(1-sourceCap)*v,finalY=1-cap*2;
     const y=THREE.MathUtils.lerp(clothEdge(shot,u,p.sign,finalY,open),p.sign,v);
     const settle=.005*(1-smooth(seconds/.8))*Math.sin(u*6+v*2)*v*(1-v);
     p.position.setXYZ(i,(u*2-1)*aspect,y+settle,.185+.008*open*Math.exp(-v*18)*(1-shot.spread));p.uv.setXY(i,u,1-sourceY);
    }
    p.position.needsUpdate=true;p.uv.needsUpdate=true;p.geometry.computeBoundingSphere();
    if(seconds>=4.5){p.base.set(p.position.array as Float32Array);p.sampling.setRest(p.base);p.dynamics.setRest(p.sampling.rest,Math.min(aspect*2,2));p.wasActive=false;host.dataset[p.sign>0?'topMotion':'bottomMotion']='0';}
   }
   if(seconds>=4.5)interactive=true;clock=interaction;
   const scale=aspect*SHEAR_WIDTH_RATIO,initial=.04-(.051176/(.0232+Math.tan(.158))/Math.cos(.158)*SHEAR_WIDTH_RATIO)/2,exit=smooth((seconds-3)/.7);
   const x=seconds<1.3?THREE.MathUtils.lerp(-aspect-scale*1.7,(initial*2-1)*aspect,shot.entry):THREE.MathUtils.lerp((shot.root*2-1)*aspect,aspect+scale*1.4,exit);
   const pose=shearPresentation(seconds,scale,.04,.185);tool.position.set(x,pose.y,pose.z);tool.scale.setScalar(scale);tool.rotation.set(pose.roll,0,0);upper.rotation.z=shot.blade;lower.rotation.z=-shot.blade;
   if(interactive)paths();if(draw)renderer.render(scene,camera);host.dataset.cpuFrameMs=String(performance.now()-start);
  };
  const resize=()=>{if(disposed)return;release();interactive=false;const box=host.getBoundingClientRect();if(!box.width||!box.height)return;aspect=box.width/box.height;height=box.height;camera.left=-aspect;camera.right=aspect;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.6:1.3,Math.sqrt((mobile?720000:1100000)/(box.width*box.height))));renderer.setSize(box.width,box.height);render(last);host.dataset.pixelCount=String(renderer.domElement.width*renderer.domElement.height);};
  const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),hits:THREE.Intersection[]=[];
  const hit=(x:number,y:number)=>{if(!interactive)return null;ndc.set(x*2-1,1-y*2);scene.updateMatrixWorld();camera.updateMatrixWorld();ray.setFromCamera(ndc,camera);hits.length=0;ray.intersectObjects(clothMeshes,false,hits);const h=hits.find(h=>{if(!h.uv)return false;const sourceY=1-h.uv.y;return h.object.name==='top'?sourceY<=at(profile.top,h.uv.x)+.004:sourceY>=at(profile.bottom,h.uv.x)-.004;});return h?{sheet:h.object.name,x:h.point.x,y:h.point.y}:null;};
  resize();render(4.5,performance.now()/1000,false);interactive=false;render(1.9,performance.now()/1000,false);
  const waitGpu=async()=>{
   const gl=renderer.getContext() as WebGL2RenderingContext,fence=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);gl.flush();if(!fence)return;
   try{await new Promise<void>((resolve,reject)=>{const poll=()=>{if(signal.aborted){reject(new DOMException('Aborted','AbortError'));return;}const state=gl.clientWaitSync(fence,0,0);if(state===gl.ALREADY_SIGNALED||state===gl.CONDITION_SATISFIED)resolve();else if(state===gl.WAIT_FAILED)reject(new Error('GPU preparation failed'));else window.setTimeout(poll,8);};poll();});}finally{gl.deleteSync(fence);}
  };
  const upload=performance.now();renderer.initTexture(photo);renderer.initTexture(studio);timings.textureUploadSubmitMs=performance.now()-upload;await waitGpu();timings.textureUploadCompleteWallMs=performance.now()-upload;
  const compile=performance.now();await renderer.compileAsync(scene,camera);timings.shaderCompileMs=performance.now()-compile;
  const warm=performance.now();renderer.render(scene,camera);await waitGpu();timings.gpuWarmupMs=performance.now()-warm;
  render(0);if(signal.aborted)throw new DOMException('Aborted','AbortError');timings.readyMs=performance.now()-started;host.dataset.timings=JSON.stringify(timings);host.dataset.clothVertices=String(panels.reduce((n,p)=>n+p.position.count,0));host.dataset.physicsVertices='1050';
  return {render,resize,dispose,hit,release,active:()=>panels.some(p=>p.dynamics.active()),hover:(x,y,speed)=>{const h=hit(x,y);if(h&&!grabbed)panels.find(p=>p.mesh.name===h.sheet)?.dynamics.hover(h.x,h.y,speed,height,performance.now()/1000);return h?.sheet||null;},grab:(x,y)=>{const h=hit(x,y);if(!h)return null;grabbed=panels.find(p=>p.mesh.name===h.sheet);grabX=h.x;grabY=h.y;grabbed?.dynamics.grab(grabX,grabY);host.dataset.grabbed=h.sheet;return h.sheet;},pull:(x,y)=>grabbed?.dynamics.pull((x*2-1)*aspect-grabX,1-y*2-grabY)};
 }catch(error){dispose();throw error;}
}
