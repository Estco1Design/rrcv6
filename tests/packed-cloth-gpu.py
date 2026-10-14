"""Real WebGL regression: roughness B cannot change the reconstructed normal."""
from pathlib import Path
from tempfile import TemporaryDirectory
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from functools import partial
import subprocess,shutil,json
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
with TemporaryDirectory() as folder:
 t=Path(folder);(t/'build').symlink_to(root/'node_modules/three/build',target_is_directory=True)
 js=subprocess.check_output(['node','--input-type=module','-e',"import fs from 'node:fs';import ts from 'typescript';process.stdout.write(ts.transpileModule(fs.readFileSync(process.argv[1],'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText)",str(root/'src/components/intro/packed-cloth-material.ts')],cwd=root)
 (t/'material.js').write_bytes(js)
 (t/'index.html').write_text('''<script type="importmap">{"imports":{"three":"/build/three.module.js"}}</script><script type="module">
import * as T from 'three';import {packedClothDefines,patchPackedClothShader} from './material.js';
const renderer=new T.WebGLRenderer(),target=new T.WebGLRenderTarget(8,8),scene=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,.1,5);camera.position.z=2;
const texture=new T.DataTexture(new Uint8Array([153,115,30,255]),1,1,T.RGBAFormat);texture.needsUpdate=true;
const material=new T.MeshPhysicalMaterial({normalMap:texture});material.defines={...packedClothDefines};material.onBeforeCompile=(s)=>{patchPackedClothShader(s);s.fragmentShader=s.fragmentShader.replace('#include <dithering_fragment>','gl_FragColor = vec4(normal * 0.5 + 0.5, 1.0);')};
scene.add(new T.Mesh(new T.PlaneGeometry(2,2),material));
function draw(b){texture.image.data[2]=b;texture.needsUpdate=true;renderer.setRenderTarget(target);renderer.render(scene,camera);const out=new Uint8Array(4);renderer.readRenderTargetPixels(target,4,4,1,1,out);return Array.from(out)}
const low=draw(30),high=draw(240);material.defines={};material.needsUpdate=true;const legacyLow=draw(30),legacyHigh=draw(240);window.result={low,high,legacyLow,legacyHigh,three_revision:T.REVISION};
</script>''')
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=folder));Thread(target=server.serve_forever,daemon=True).start()
 try:
  with sync_playwright() as p:
   b=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']);page=b.new_page();errors=[];page.on('pageerror',lambda e:(errors.append(str(e)),print('PAGEERROR',e,flush=True)));page.on('console',lambda m:print(m.text[:1800],flush=True) if m.type=='error' else None);page.goto(f'http://127.0.0.1:{server.server_port}');page.wait_for_function('window.result');r=page.evaluate('window.result');assert not errors,errors;b.close()
  assert max(abs(a-b) for a,b in zip(r['low'],r['high']))<=1,r
  assert r['low'][2]>240,r
  assert max(abs(a-b) for a,b in zip(r['legacyLow'],r['legacyHigh']))>40,r
  out=root/'qa';out.mkdir(exist_ok=True);(out/'packed-normal-gpu.json').write_text(json.dumps(r,indent=2))
  print('PASS: actual production material shader reconstructs normal Z independently of roughness:',json.dumps(r))
 finally:server.shutdown();server.server_close()
