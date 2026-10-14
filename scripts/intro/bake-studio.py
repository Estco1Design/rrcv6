"""Offline Three.js LDR studio cube-UV bake. Requires Python Playwright + Chromium.
No runtime PMREM pass; generated PNG stores linear, already-prefiltered texels.
"""
from pathlib import Path
from tempfile import TemporaryDirectory
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from functools import partial
import shutil,base64
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2]
with TemporaryDirectory() as folder:
 target=Path(folder)
 shutil.copy(Path(__file__).with_name('studio-bake.html'),target/'index.html')
 for name in ['three.module.js','three.core.js']:shutil.copy(root/'node_modules/three/build'/name,target/name)
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=folder))
 Thread(target=server.serve_forever,daemon=True).start()
 try:
  with sync_playwright() as p:
   b=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
   page=b.new_page();page.goto(f'http://127.0.0.1:{server.server_port}');page.wait_for_function('window.result',timeout=30000)
   result=page.evaluate('window.result');(root/'public/intro/studio-cubeuv.png').write_bytes(base64.b64decode(result['png'].split(',')[1]));print(result['width'],result['height']);b.close()
 finally:server.shutdown();server.server_close()
