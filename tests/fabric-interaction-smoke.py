from playwright.sync_api import sync_playwright,expect
from datetime import datetime,timezone
from pathlib import Path
import json
out=Path(__file__).resolve().parents[1]/'qa';out.mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for w,h in [(1280,720),(390,844)]:
  c=b.new_context(viewport={'width':w,'height':h},is_mobile=w<500,has_touch=w<500);page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  now=datetime(2026,10,14,tzinfo=timezone.utc);page.clock.install(time=now);page.clock.pause_at(now)
  page.goto('http://127.0.0.1:3000');page.wait_for_selector('[data-fabric-scene][data-state="playing"]',timeout=90000);page.clock.run_for(40);page.clock.fast_forward(4600)
  scene=page.locator('[data-fabric-scene]');expect(page.get_by_role('button',name='ВОЙТИ',exact=True)).to_be_enabled();page.screenshot(path=str(out/f'cloth-v2-{w}-final.png'),timeout=90000)
  count=scene.get_attribute('data-render-count');page.clock.fast_forward(1400);assert count==scene.get_attribute('data-render-count')
  page.mouse.move(w*.35,h*.16);page.clock.run_for(120);assert count!=scene.get_attribute('data-render-count');page.screenshot(path=str(out/f'cloth-v2-{w}-pointer.png'),timeout=90000)
  for x in [.4,.6,.8,.2]:page.mouse.move(w*x,h*.8);page.clock.run_for(35)
  page.clock.fast_forward(1600);count=scene.get_attribute('data-render-count');page.clock.fast_forward(1500);assert count==scene.get_attribute('data-render-count')
  expect(page.get_by_role('button',name='Звук: выкл')).to_be_disabled()
  page.get_by_role('button',name='Повторить',exact=True).click();page.wait_for_selector('[data-fabric-scene][data-state="playing"]',timeout=90000);page.clock.run_for(40);page.clock.fast_forward(1850);page.screenshot(path=str(out/f'cloth-v2-{w}-cut.png'),timeout=90000);expect(page.get_by_role('button',name='ВОЙТИ',exact=True)).to_be_disabled()
  page.get_by_role('button',name='Пропустить',exact=True).click();expect(page.get_by_role('button',name='ВОЙТИ',exact=True)).to_be_enabled()
  page.get_by_role('button',name='PRIVATE ACCESS',exact=True).click();page.clock.run_for(250);expect(page.get_by_label('Код доступа',exact=True)).to_be_visible()
  assert not errors,errors;c.close()
 b.close();print('PASS: desktop/mobile geometry, pointer wake/decay/idle, rapid movement, repeat, skip, private input, explicit missing-audio state; no page errors')
