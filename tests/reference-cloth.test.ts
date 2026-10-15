import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import profiles from '../src/components/intro/reference-contours.json';
test('approved artwork silhouettes preserve two distinct cloth areas and a clear HTML aperture',()=>{
 for(const p of Object.values(profiles)){
  assert.equal(p.top.length,p.bottom.length);assert.ok(p.top.length>100);
  assert.ok(p.bottom[Math.floor(p.bottom.length/2)]-p.top[Math.floor(p.top.length/2)]>.3,'The central menu aperture closed');
  assert.ok(readFileSync(new URL('../public/intro/'+p.file,import.meta.url)).byteLength>100000);
  for(let i=0;i<p.top.length;i++){assert.ok(p.top[i]>.1&&p.top[i]<.45);assert.ok(p.bottom[i]>.53&&p.bottom[i]<.8);assert.ok(p.bottom[i]-p.top[i]>.12);}
 }
 assert.notDeepEqual(profiles.mobile.top,profiles.desktop.top,'Mobile must use its approved composition, not a desktop crop');
});
