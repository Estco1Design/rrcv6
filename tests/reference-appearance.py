"""Pixel comparison against approved source art, not a self-approved new material."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image,ImageChops,ImageStat
import shutil,json
root=Path(__file__).resolve().parents[1];out=root/'qa/reference-cloth';out.mkdir(exist_ok=True);report=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for width,height,name,source in [(1280,720,'desktop','cloth-plate.webp'),(390,664,'mobile-reference','cloth-plate-mobile.webp'),(390,844,'mobile-tall','cloth-plate-mobile.webp')]:
  c=b.new_context(viewport={'width':width,'height':height},device_scale_factor=1,reduced_motion='no-preference');c.add_init_script("sessionStorage.setItem('rrc_cut_played','true')");page=c.new_page();errors=[];requests=[];page.on('request',lambda r:requests.append(r.url));page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:3000');page.wait_for_selector('[data-fabric-scene][data-state="complete"]',timeout=45000);page.wait_for_load_state('networkidle');page.wait_for_timeout(200)
  target=out/(name+'.png');page.screenshot(path=str(target),timeout=90000);actual=Image.open(target).convert('RGB');expected=Image.open(root/'public/intro'/source).convert('RGB').resize((width,height),Image.Resampling.BILINEAR)
  regions=[]
  for top,bottom in [(0,.35),(.60,.94)]:
   box=(0,round(top*height),width,round(bottom*height));difference=ImageChops.difference(actual.crop(box),expected.crop(box));mean=sum(ImageStat.Stat(difference).mean)/3;regions.append(round(mean,3));assert mean<4,f'{name}: approved cloth differs by {mean:.2f}/255'
  type_info=page.locator('.rrc-cut-title h2').evaluate('(e)=>{const r=document.createRange();r.selectNodeContents(e);return {family:getComputedStyle(e).fontFamily,size:getComputedStyle(e).fontSize,width:r.getBoundingClientRect().width}}');ratio=type_info['width']/width;assert (.55<ratio<.66) if width<768 else (.38<ratio<.48),type_info
  assert not any(any(asset in url for asset in ['/intro/suiting-scan-','/intro/wool-','/intro/cloth-rest.bin']) for url in requests),'Inactive PBR assets fetched';assert not errors,errors;report.append({'viewport':[width,height],'source':source,'cloth_region_mean_absolute_error_255':regions,'type':type_info,'errors':errors});print('PASS approved art',name,regions,type_info,flush=True);c.close()
 b.close()
(out/'appearance.json').write_text(json.dumps(report,indent=2))
