"""Inspect actual GLB in neutral and entrance lighting, no image-based substitute."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil,json
root=Path(__file__).resolve().parents[1];out=root/'docs/media/shears-reference';out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']);errors=[];report=[]
 for mobile in [False,True]:
  page=b.new_page(viewport={'width':1200,'height':760});page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:3916/scripts/intro/shears-review.html'+('?mobile' if mobile else ''));page.wait_for_function('window.ready',timeout=45000)
  for bg in ['neutral','black']:
   page.evaluate('window.background',bg)
   for pose in ['closed','half','angle']:
    page.evaluate('window.pose',pose);page.screenshot(path=str(out/f'{"mobile-lod" if mobile else "desktop"}-{bg}-{pose}.png'),timeout=90000)
  report.append(page.evaluate('''()=>{let v=0,t=0,m=0;debug.model.traverse(o=>{if(o.isMesh){m++;v+=o.geometry.attributes.position.count;t+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3}});return {meshes:m,vertices:v,triangles:t,renderer:debug.renderer.info.render}}'''));page.close()
 assert not errors,errors;b.close();(out/'inspection.json').write_text(json.dumps({'profiles':report,'errors':errors,'real_phone':False},indent=2));print('PASS 12 actual GLB inspection views')
