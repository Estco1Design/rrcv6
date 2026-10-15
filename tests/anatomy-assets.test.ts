import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
function glb(name:string){const b=readFileSync(new URL('../public/models/'+name,import.meta.url));assert.equal(b.toString('ascii',0,4),'glTF');return JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)));}
test('adult references retain native morphology, skinning, hands and relaxed arm span',()=>{
 for(const form of ['male','female']){
  const d=glb('fit-'+form+'.glb');assert.equal(d.skins.length,1);assert.ok(d.skins[0].joints.length>100);
  for(const name of ['upperarm01.L','lowerarm01.R','wrist.L','finger3-2.R'])assert.ok(d.nodes.some((n:{name:string})=>n.name===name),name);
  const m=d.meshes.find((m:{extras?:{targetNames?:string[]}})=>m.extras?.targetNames?.includes('Lean'));
  assert.deepEqual(m.extras.targetNames,['Lean','Full']);
  const p=m.primitives[0];assert.ok(p.attributes.JOINTS_0!==undefined&&p.attributes.WEIGHTS_0!==undefined);assert.equal(p.targets.length,2);
  const a=d.accessors[p.attributes.POSITION];assert.ok((a.max[0]-a.min[0])/(a.max[1]-a.min[1])<.7,'T/A pose arm span returned');
  const guides=d.nodes.find((n:{extras?:{morphMeasurementGuides?:string}})=>n.extras?.morphMeasurementGuides);
  assert.ok(guides);const g=JSON.parse(guides.extras.morphMeasurementGuides);assert.ok(g.Full.waist.rx>g.Lean.waist.rx);
 }
});
test('all fitted hair choices contain native-UV card geometry and alpha textures',()=>{
 for(const form of ['male','female'])for(const style of ['short01','bob01','ponytail01']){
  const d=glb(`hair-${form}-${style}.glb`);assert.ok(d.meshes.length>0,'An empty exporter output was accepted');
  const p=d.meshes[0].primitives[0];assert.ok(d.accessors[p.attributes.POSITION].count>100);assert.ok(p.attributes.TEXCOORD_0!==undefined);assert.ok(d.images.length>0);assert.equal(d.materials[0].doubleSided,true);
 }
});
