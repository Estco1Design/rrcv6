"""Capture actual production browser frames on a controlled clock.
This checks choreography and appearance, never physical-device frame rate.
"""
from playwright.sync_api import sync_playwright
from pathlib import Path
from datetime import datetime,timezone
import os,shutil,json
root=Path(__file__).resolve().parents[1];out=root/'qa/cloth-film-frames';out.mkdir(parents=True,exist_ok=True)
base=os.environ.get('RRC_BASE_URL','http://127.0.0.1:3000')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 c=b.new_context(viewport={'width':960,'height':540},reduced_motion='no-preference');page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 now=datetime(2026,10,14,tzinfo=timezone.utc);page.clock.install(time=now);page.clock.pause_at(now);page.goto(base)
 for _ in range(360):
  page.clock.run_for(16)
  if page.locator('[data-fabric-scene][data-state="playing"]').count():break
  page.wait_for_timeout(25)
 else:raise AssertionError('Scene not prepared')
 page.evaluate('document.fonts.ready');page.clock.run_for(32);elapsed=32
 for frame in range(112):
  target=32+round(frame*1000/24);page.clock.fast_forward(target-elapsed);elapsed=target
  page.screenshot(path=str(out/f'frame-{frame:03}.png'),timeout=90000)
  if frame%24==0:print('Captured',frame,flush=True)
 assert not errors,errors;c.close();b.close()
 (root/'qa/cloth-film-capture.json').write_text(json.dumps({'kind':'actual production Chromium screenshots, controlled clock','frames':112,'fps':24,'viewport':[960,540],'physical_phone':False,'fps_benchmark':False,'errors':errors},indent=2))
 print('PASS: captured full finite intro; not a hardware FPS measurement')
