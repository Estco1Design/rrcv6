"""Offline CC0 Poly Haven HDR PMREM bake. Preserve linear half-float radiance."""
from pathlib import Path
from tempfile import TemporaryDirectory
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from functools import partial
import shutil,base64,json,hashlib,argparse,gzip
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2];p=argparse.ArgumentParser();p.add_argument('--source',type=Path,required=True);source=p.parse_args().source
with TemporaryDirectory() as folder:
 t=Path(folder);(t/'build').symlink_to(root/'node_modules/three/build',target_is_directory=True);(t/'jsm').symlink_to(root/'node_modules/three/examples/jsm',target_is_directory=True);shutil.copy(source,t/'studio.hdr')
 (t/'index.html').write_text('''<script type="importmap">{"imports":{"three":"/build/three.module.js","three/addons/":"/jsm/"}}</script><script type="module">
import * as T from 'three';import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
const r=new T.WebGLRenderer(),s=await new RGBELoader().loadAsync('/studio.hdr');
const w=s.image.width,h=s.image.height,d=s.image.data;const pixels=new Uint16Array(w/2*h/2*4);
for(let y=0;y<h/2;y++)for(let x=0;x<w/2;x++)for(let k=0;k<4;k++){let v=0;for(let b=0;b<2;b++)for(let a=0;a<2;a++)v+=T.DataUtils.fromHalfFloat(d[((y*2+b)*w+x*2+a)*4+k])/4;pixels[(y*w/2+x)*4+k]=T.DataUtils.toHalfFloat(v)}
const reduced=new T.DataTexture(pixels,w/2,h/2,T.RGBAFormat,T.HalfFloatType);reduced.mapping=T.EquirectangularReflectionMapping;reduced.colorSpace=T.LinearSRGBColorSpace;reduced.needsUpdate=true;
const pm=new T.PMREMGenerator(r),rt=pm.fromEquirectangular(reduced);const raw=new Uint16Array(rt.width*rt.height*4);r.readRenderTargetPixels(rt,0,0,rt.width,rt.height,raw);
let maximum=0;for(let i=0;i<raw.length;i++)if(i%4!==3)maximum=Math.max(maximum,T.DataUtils.fromHalfFloat(raw[i]));
const bytes=new Uint8Array(raw.buffer);let string='';for(let i=0;i<bytes.length;i++)string+=String.fromCharCode(bytes[i]);window.result={data:btoa(string),width:rt.width,height:rt.height,maximum};
</script>''')
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=folder));Thread(target=server.serve_forever,daemon=True).start()
 try:
  with sync_playwright() as p:
   b=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']);page=b.new_page();page.goto(f'http://127.0.0.1:{server.server_port}');page.wait_for_function('window.result',timeout=60000);result=page.evaluate('window.result');b.close()
  data=base64.b64decode(result.pop('data'));out=root/'public/intro/studio-hdr-cubeuv.bin';out.write_bytes(data);compressed=gzip.compress(data,compresslevel=9,mtime=0);out.with_suffix('.bin.gz').write_bytes(compressed)
  manifest={**result,'format':'RGBA16F little-endian, linear sRGB CubeUV, PMREM cube128','source':'https://polyhaven.com/a/studio_small_09','author':'Sergej Majboroda','license':'CC0-1.0','source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'source_bytes':source.stat().st_size,'runtime_bytes':len(data),'download_gzip_bytes':len(compressed),'download_gzip_sha256':hashlib.sha256(compressed).hexdigest(),'runtime_sha256':hashlib.sha256(data).hexdigest(),'hdr_preserved':result['maximum']>1}
  (root/'public/intro/studio-hdr-license.json').write_text(json.dumps(manifest,indent=2));assert manifest['hdr_preserved'];print(manifest)
 finally:server.shutdown();server.server_close()
