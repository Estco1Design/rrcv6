// Install the offline authoring tool outside the project:
// npm install --prefix /tmp/rrc-gltfpack --cache /tmp/rrc-npm-cache gltfpack@0.25.0 --ignore-scripts
// GLTFPACK=/tmp/rrc-gltfpack/node_modules/.bin/gltfpack node scripts/optimize-fit-models.mjs
import {spawnSync} from 'node:child_process';
import {readdirSync,renameSync,statSync} from 'node:fs';
import {join} from 'node:path';
const folder=new URL('../public/models/',import.meta.url).pathname;
for(const name of readdirSync(folder).filter(n=>/^(fit-(male|female)|hair-(male|female)-.+)\.glb$/.test(n))){
 const input=join(folder,name),output=input+'.packed.glb',before=statSync(input).size;
 const result=spawnSync(process.env.GLTFPACK||'gltfpack',['-i',input,'-o',output,'-c','-kn','-km','-ke','-vp','16','-vt','14','-vn','12'],{stdio:'inherit'});
 if(result.status!==0)throw new Error('gltfpack failed: '+name);
 renameSync(output,input);console.log(name,before,'→',statSync(input).size);
}
