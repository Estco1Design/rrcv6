"""Actual production intro after replacing GLBs. Virtual clock, not an FPS benchmark."""
from pathlib import Path
from datetime import datetime,timezone
from playwright.sync_api import sync_playwright,expect
import shutil,json
root=Path(__file__).resolve().parents[1];out=root/'docs/media/shears-reference';report=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for mobile,w,h in [(False,1280,720),(True,390,844)]:
  c=b.new_context(viewport={'width':w,'height':h},device_scale_factor=3 if mobile else 1,is_mobile=mobile,has_touch=mobile,reduced_motion='no-preference');page=c.new_page();errors=[];console=[];requests=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda e:console.append(e.text) if e.type=='error' else None);page.on('request',lambda r:requests.append(r.url))
  now=datetime(2026,10,15,tzinfo=timezone.utc);page.clock.install(time=now);page.clock.pause_at(now);page.goto('http://127.0.0.1:3000')
  for _ in range(400):
   page.clock.run_for(16)
   if page.locator('[data-fabric-scene][data-state="playing"]').count():break
   page.wait_for_timeout(25)
  else:raise AssertionError('Scene did not prepare')
  page.clock.run_for(32);host=page.locator('[data-fabric-scene]');elapsed=32
  for ms,name in [(1450,'cut-left'),(2050,'cut-middle'),(2650,'cut-right'),(4650,'final')]:
   page.clock.fast_forward(ms-elapsed);elapsed=ms
   expect(host).to_have_attribute('data-tool','false' if name=='final' else 'true')
   page.screenshot(path=str(out/f'scene-{"mobile" if mobile else "desktop"}-{name}.png'),timeout=90000)
  assert any(('/titanium-shears-mobile.glb' if mobile else '/titanium-shears.glb') in url for url in requests)
  # Native Framer/WAAPI transitions are verified in a fresh, unmodified clock.
  c.close();c=b.new_context(viewport={'width':w,'height':h},is_mobile=mobile,has_touch=mobile);c.add_init_script("sessionStorage.setItem('rrc_cut_played','true')");page=c.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:3000');page.wait_for_selector('[data-fabric-scene][data-state=complete]',timeout=45000)
  page.get_by_role('button',name='PRIVATE ACCESS',exact=True).click();expect(page.get_by_label('Код доступа',exact=True)).to_be_visible();page.get_by_role('button',name='НАЗАД',exact=True).click();page.get_by_role('button',name='ВОЙТИ',exact=True).click();expect(page.locator('[data-rrc-boot-intro]')).to_have_count(0)
  assert not errors,errors;assert not console,console
  report.append({'viewport':[w,h],'mobile_emulation':mobile,'real_phone':False,'errors':errors,'console_errors':console,'entrances':True});c.close()
 b.close()
(out/'scene-check.json').write_text(json.dumps(report,indent=2));print('PASS desktop/mobile cut poses, final and both entrances')
