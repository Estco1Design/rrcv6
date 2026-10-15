import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ClothRest} from '../src/components/intro/cloth-rest';
const bytes=readFileSync(new URL('../public/intro/cloth-rest.bin',import.meta.url));
const buffer=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) as ArrayBuffer;
test('baked drapes keep exterior pins, the menu aperture and continuous narrow/wide sampling',()=>{
 const rest=new ClothRest(buffer),out=new Float32Array(3),other=new Float32Array(3);
 for(const aspect of [.4,390/844,.8,1.2,16/9,2])for(const sign of [1,-1]){
  for(const u of [0,.1,.3,.7,.9,1])for(const v of [0,.2,.5,.8,1]){
   rest.sample(sign,u,v,aspect,out);
   assert.ok(out.every(Number.isFinite));assert.ok(Math.abs(out[0])<.2*aspect&&Math.abs(out[1])<.2&&Math.abs(out[2])<.4);
   if(u===0||u===1||v===1)assert.ok(out.every(x=>Math.abs(x)<1e-7),'An exterior pin moved');
   if(v===0)assert.ok(Math.abs(out[1])<1e-7,'Rest drape intrudes into the menu');
  }
  for(const u of [.1,.5,.9]){
   const seam=.5+.02/1.035;
   assert.ok(Math.abs(rest.initialHeight(u,seam-1e-6,aspect)-rest.initialHeight(u,seam+1e-6,aspect))<1e-4,'Closed cloth has a discontinuous seam');
  }
 }
 rest.sample(1,.4,.45,.9,out);rest.sample(-1,.4,.45,.9,other);
 assert.ok(out.some((v,i)=>Math.abs(v-other[i])>.001),'The two drapes are identical');
});
test('damaged offline geometry is rejected before entering the renderer',()=>{
 assert.throws(()=>new ClothRest(new ArrayBuffer(0)));
 const bad=buffer.slice(0);new DataView(bad).setUint32(0,0);assert.throws(()=>new ClothRest(bad));
 const invalid=buffer.slice(0);new Float32Array(invalid,16)[4]=NaN;assert.throws(()=>new ClothRest(invalid));
});
