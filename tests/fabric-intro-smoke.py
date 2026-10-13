"""Production textile shot, accessibility and failure checks using a virtual animation clock.
These are functional checks in desktop Chromium, not real-phone FPS measurements.
"""
from playwright.sync_api import sync_playwright,expect
from pathlib import Path
from datetime import datetime,timezone
import os,shutil,json
root=Path(__file__).resolve().parents[1];out=root/'qa';out.mkdir(exist_ok=True)
base=os.environ.get('RRC_BASE_URL','http://127.0.0.1:3000').rstrip('/')
launch={'executable_path':os.environ.get('RRC_BROWSER_PATH') or shutil.which('chromium'),'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
now=datetime(2026,10,13,tzinfo=timezone.utc)
errors=[];console_errors=[]
def watch(page,expected_gl_failure=False):
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('console',lambda message:console_errors.append(message.text) if message.type=='error' and not any(expected in message.text for expected in ['Failed to load resource']+(['Error creating WebGL context','Failed to create WebGL2 context','disabled by enterprise policy or commandline switch'] if expected_gl_failure else [])) else None)
def ready(page):expect(page.locator('[data-rrc-boot-intro]')).to_have_attribute('data-intro-ready','true',timeout=30000)
def no_overflow(page):assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
def clock(page):page.clock.install(time=now);page.clock.pause_at(now)
with sync_playwright() as p:
 browser=p.chromium.launch(**launch)
 for width,height in [(1280,720),(390,844)]:
  context=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=3 if width<768 else 1,reduced_motion='no-preference');page=context.new_page();watch(page);clock(page);page.goto(base+'/');page.wait_for_selector('[data-fabric-scene][data-state="playing"]',timeout=90000)
  scene=page.locator('[data-fabric-scene]');intro=page.locator('[data-rrc-boot-intro]');page.mouse.click(width/2,20);page.clock.run_for(32);elapsed=32
  for target,name in [(100,'black'),(650,'fabric'),(1180,'entry'),(1900,'cut'),(2700,'cut-right'),(3350,'spread'),(4550,'final')]:
   page.clock.fast_forward(target-elapsed);elapsed=target;state=scene.evaluate('(e)=>({...e.dataset})')
   if target<800:assert state['tool']=='false' and float(state['cut'])==0
   if target<3000:expect(page.get_by_role('button',name='ВОЙТИ',exact=True)).to_be_disabled()
   if name=='cut':
    reveal=page.locator('.rrc-cut-title').evaluate('(e)=>getComputedStyle(e).clipPath');assert 'inset' in reveal and .1<float(state['cut'])<.6
   if name=='entry':assert state['tool']=='true' and float(state['blade'])>0
   if name=='final':page.mouse.click(width/2,20)
   page.screenshot(path=str(out/f'fabric-{width}-{name}.png'),timeout=90000);no_overflow(page);print(width,name,state['seconds'],flush=True)
  ready(page);assert scene.get_attribute('data-tool')=='false'
  count=scene.get_attribute('data-render-count');page.clock.run_for(1000);assert scene.get_attribute('data-render-count')==count,'Final renderer did not stop'
  assert page.locator('.rrc-cut-title h2').evaluate('(e)=>e.scrollWidth<=innerWidth')
  canvas=scene.locator('canvas').evaluate('(e)=>({w:e.width,h:e.height})');assert canvas['w']*canvas['h']<=961000
  # Framer Motion may use native WAAPI for dialog exits. Resume the real clock
  # for interactions; the deterministic clock above is only for the WebGL shot.
  page.clock.resume()
  # Private form returns focus with Escape; the exact existing server flow remains intact.
  title_box=page.locator('.rrc-cut-title').bounding_box();page.get_by_role('button',name='PRIVATE ACCESS',exact=True).click();expect(page.get_by_label('Код доступа',exact=True)).to_be_visible();page.screenshot(path=str(out/f'fabric-{width}-code.png'));no_overflow(page);after_box=page.locator('.rrc-cut-title').bounding_box();assert all(abs(after_box[key]-title_box[key])<.5 for key in ['x','y','width','height']), 'The fixed wordmark moved when opening the private form'
  page.keyboard.press('Escape');expect(page.get_by_role('button',name='PRIVATE ACCESS',exact=True)).to_be_focused()
  # Reload before entering must show the final still, rather than replaying the shot.
  page.reload();ready(page);expect(page.locator('[data-fabric-scene]')).to_have_count(0)
  expect(page.get_by_role('button',name='ВОЙТИ',exact=True)).to_be_enabled();context.close()
 # Navigation after reload runs in a separate native-clock context. Mocked performance
 # time across documents is incompatible with Motion's native WAAPI exit clock.
 context=browser.new_context(viewport={'width':390,'height':844},reduced_motion='no-preference');page=context.new_page();watch(page);held=[];page.route('**/intro/titanium-shears.glb',lambda route:held.append(route));page.goto(base+'/');page.wait_for_function("sessionStorage.getItem('rrc_cut_played')==='true'");[route.abort() for route in held];page.unroute_all(behavior='ignoreErrors');page.reload();ready(page);expect(page.locator('[data-fabric-scene]')).to_have_count(0)
 page.get_by_role('button',name='ВОЙТИ',exact=True).click();expect(page.locator('[data-rrc-boot-intro]')).to_have_count(0);assert page.evaluate('document.documentElement.style.overflow')!='hidden';expect(page.locator('a[href="/private/home"]')).to_have_count(0);page.reload();expect(page.locator('[data-rrc-boot-intro]')).to_have_count(0);context.close()
 # Skip while resources are still pending must not wait for them or enter the public site.
 context=browser.new_context(viewport={'width':320,'height':568},reduced_motion='no-preference');page=context.new_page();watch(page);held=[];page.route('**/intro/titanium-shears.glb',lambda route:held.append(route));page.goto(base+'/');page.get_by_role('button',name='Пропустить',exact=True).click();ready(page);expect(page.get_by_role('button',name='ВОЙТИ',exact=True)).to_be_enabled();expect(page.locator('[data-fabric-scene]')).to_have_count(0);no_overflow(page);[route.abort() for route in held];page.unroute_all(behavior='ignoreErrors');context.close()
 # Skip while the dynamic scene module itself is pending, then release the script.
 chunk=next(path.name for path in (root/'.next/static/chunks').glob('*.js') if 'cloth-intact.webp' in path.read_text())
 context=browser.new_context(viewport={'width':390,'height':844},reduced_motion='no-preference');page=context.new_page();watch(page);held=[];requests=[];page.on('request',lambda request:requests.append(request.url))
 def hold_module(route):held.append(route);page.evaluate('window.__sceneModuleHeld=true')
 page.route('**/_next/static/chunks/'+chunk,hold_module);page.goto(base+'/',wait_until='domcontentloaded');page.wait_for_function('window.__sceneModuleHeld===true');page.get_by_role('button',name='Пропустить',exact=True).click();ready(page)
 [route.continue_() for route in held];page.unroute_all(behavior='ignoreErrors');page.wait_for_load_state('networkidle');assert not any(any(asset in url for asset in ['/intro/cloth-intact','/intro/titanium-','/intro/twill-']) for url in requests);expect(page.locator('[data-fabric-scene]')).to_have_count(0);context.close()
 # Reduced motion neither imports Three.js nor requests the model/normal maps.
 context=browser.new_context(viewport={'width':320,'height':568},reduced_motion='reduce');page=context.new_page();watch(page);requests=[];page.on('request',lambda r:requests.append(r.url));page.goto(base+'/');ready(page);page.wait_for_load_state('networkidle');assert not any('/intro/titanium-' in u or '/intro/twill-' in u for u in requests);expect(page.locator('[data-fabric-scene]')).to_have_count(0);page.screenshot(path=str(out/'fabric-reduced-320.png'));context.close()
 # A short viewport approximates the space remaining above an on-screen keyboard.
 context=browser.new_context(viewport={'width':320,'height':280},reduced_motion='reduce');page=context.new_page();watch(page);page.goto(base+'/');ready(page);page.get_by_role('button',name='PRIVATE ACCESS',exact=True).click();expect(page.get_by_label('Код доступа',exact=True)).to_be_visible();back=page.get_by_role('button',name='НАЗАД',exact=True);back.scroll_into_view_if_needed();expect(back).to_be_in_viewport();back.click();expect(page.get_by_role('button',name='PRIVATE ACCESS',exact=True)).to_be_visible();assert page.locator('[data-rrc-boot-intro]').evaluate('(e)=>e.scrollTop')==0;context.close()
 # Failed geometry download produces the usable final HTML menu.
 context=browser.new_context(reduced_motion='no-preference');page=context.new_page();watch(page);page.route('**/intro/titanium-shears.glb',lambda route:route.abort());page.goto(base+'/');ready(page);expect(page.locator('[data-rrc-boot-intro]')).to_have_attribute('data-intro-fallback','true');expect(page.get_by_role('button',name='PRIVATE ACCESS',exact=True)).to_be_enabled();context.close()
 # The visibility handler pauses the timeline (synthetic visibility event, not a physical phone).
 context=browser.new_context(viewport={'width':640,'height':480},reduced_motion='no-preference');page=context.new_page();watch(page);clock(page);page.goto(base+'/');page.wait_for_selector('[data-fabric-scene][data-state="playing"]',timeout=90000);page.clock.run_for(400);scene=page.locator('[data-fabric-scene]');count=scene.get_attribute('data-render-count');seconds=scene.get_attribute('data-seconds')
 page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__testHidden===true});window.__testHidden=true;document.dispatchEvent(new Event('visibilitychange'))");page.clock.run_for(1500);assert scene.get_attribute('data-render-count')==count
 page.evaluate("window.__testHidden=false;document.dispatchEvent(new Event('visibilitychange'))");page.clock.run_for(100);assert float(scene.get_attribute('data-seconds'))-float(seconds)<.15;context.close()
 # No-WebGL is a real browser flag, not an intercepted asset request.
 disabled=p.chromium.launch(executable_path=launch['executable_path'],headless=True,args=['--no-sandbox','--disable-webgl']);context=disabled.new_context(viewport={'width':390,'height':844},reduced_motion='no-preference');page=context.new_page();watch(page,expected_gl_failure=True);page.goto(base+'/');ready(page);expect(page.locator('[data-rrc-boot-intro]')).to_have_attribute('data-intro-fallback','true');expect(page.get_by_role('button',name='ВОЙТИ',exact=True)).to_be_enabled();context.close();disabled.close()
 assert not errors,errors;assert not console_errors,console_errors;browser.close();print('PASS: desktop/mobile shot, left-to-right masking, shared hinge, final stop, render pixel cap, HTML entrances/focus, skip, once/session, reduced motion, load failure, hidden pause, no-WebGL; no page exceptions')
