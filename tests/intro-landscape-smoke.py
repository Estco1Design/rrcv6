"""A landscape phone must not load the desktop's more expensive profile."""
from playwright.sync_api import sync_playwright,expect
import shutil
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 c=b.new_context(viewport={'width':915,'height':412},device_scale_factor=3,is_mobile=True,has_touch=True,reduced_motion='no-preference');c.add_init_script("sessionStorage.setItem('rrc_cut_played','true')")
 page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:3000');page.wait_for_selector('[data-fabric-scene][data-state="complete"]',timeout=45000)
 host=page.locator('[data-fabric-scene]');expect(host).to_have_attribute('data-profile','mobile');assert int(host.get_attribute('data-pixel-count'))<=720000
 expect(page.get_by_role('button',name='ВОЙТИ',exact=True)).to_be_enabled();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');assert not errors,errors;c.close();b.close();print('PASS: landscape touch device keeps the mobile profile, fitted title, controls and render budget (emulation, not real phone)')
