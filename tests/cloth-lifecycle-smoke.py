"""Native-clock repeat, extreme input and broken/late texture acceptance."""
from playwright.sync_api import sync_playwright,expect
import shutil
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 context=browser.new_context(viewport={'width':390,'height':844},reduced_motion='no-preference')
 context.add_init_script("sessionStorage.setItem('rrc_cut_played','true')")
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:3000');page.wait_for_selector('[data-fabric-scene][data-state="complete"]',timeout=30000)
 host=page.locator('[data-fabric-scene]');assert host.get_attribute('data-seconds')=='4.500'
 page.wait_for_timeout(400);assert host.get_attribute('data-seconds')=='4.500'
 page.reload();page.wait_for_selector('[data-fabric-scene][data-state="complete"]',timeout=30000)
 for name,y in [('top',150),('bottom',710)]:
  page.mouse.move(195,y);page.mouse.down();expect(host).to_have_attribute('data-grabbed',name)
  for x,z in [(380,820),(-20,-20),(350,60),(195,y+25)]:page.mouse.move(x,z)
  page.wait_for_timeout(300)
  assert float(host.get_attribute('data-'+name+'-motion') or 0)<=.04*(390/844*2)+.0001
  page.mouse.up();expect(host).to_have_attribute('data-grabbed','');page.mouse.move(195,405);page.wait_for_timeout(1500)
  assert host.get_attribute('data-seconds')=='4.500'
 page.get_by_role('button',name='Повторить',exact=True).click()
 page.wait_for_selector('[data-fabric-scene][data-state="playing"]',timeout=30000)
 expect(page.get_by_role('button',name='ВОЙТИ',exact=True)).to_be_disabled()
 page.wait_for_selector('[data-fabric-scene][data-state="complete"]',timeout=30000)
 count=host.get_attribute('data-render-count');page.wait_for_timeout(400);assert count==host.get_attribute('data-render-count')
 page.get_by_role('button',name='PRIVATE ACCESS',exact=True).click();expect(page.get_by_label('Код доступа',exact=True)).to_be_visible()
 assert not errors,errors;context.close()
 # Invalid bytes, rather than just a failed HTTP request, exercise bitmap decoding.
 context=browser.new_context(reduced_motion='no-preference');page=context.new_page()
 page.route('**/intro/wool-scan-surface-*.webp',lambda route:route.fulfill(status=200,content_type='image/png',body=b'invalid image'))
 page.goto('http://127.0.0.1:3000');expect(page.locator('[data-rrc-boot-intro]')).to_have_attribute('data-intro-fallback','true',timeout=15000)
 expect(page.get_by_role('button',name='ВОЙТИ',exact=True)).to_be_enabled();context.close()
 context=browser.new_context(reduced_motion='no-preference');page=context.new_page();held=[]
 page.route('**/intro/titanium-shears*.glb',lambda route:held.append(route))
 page.goto('http://127.0.0.1:3000');expect(page.locator('[data-rrc-boot-intro]')).to_have_attribute('data-intro-fallback','true',timeout=17000)
 expect(page.get_by_role('button',name='PRIVATE ACCESS',exact=True)).to_be_enabled()
 for route in held:route.abort()
 context.close();browser.close()
 print('PASS: stable final pose across reload/wake, rapid/clamped grabs on both sheets, complete replay, private input, corrupt bitmap, bounded loading timeout')
