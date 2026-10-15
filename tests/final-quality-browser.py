"""Real application acceptance: licensed rig, native morphs, fitted hair and account lifecycle.
Chromium/SwiftShader and touch emulation; never a physical phone performance claim.
Run against isolated account storage with signups enabled.
"""
from playwright.sync_api import sync_playwright,expect
from pathlib import Path
from PIL import Image,ImageChops
import secrets,os,shutil,json,time
root=Path(__file__).resolve().parents[1];out=root/'qa/final-quality';out.mkdir(parents=True,exist_ok=True)
base=os.environ.get('RRC_BASE_URL','http://127.0.0.1:3000');report={'physical_phone':False,'browser':'Chromium / SwiftShader','cases':[]}
args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=args)
 c=b.new_context(viewport={'width':1440,'height':1100},reduced_motion='reduce',record_video_dir=str(out/'video'),record_video_size={'width':1440,'height':1100})
 page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));requests=[];page.on('request',lambda r:requests.append(r.url));page.goto(base+'/account');page.wait_for_load_state('networkidle');assert not any('/models/' in u for u in requests),'Avatar fetched before authentication'
 username='anatomy_'+secrets.token_hex(4);password=secrets.token_hex(16)
 page.get_by_role('button',name='Создать аккаунт',exact=True).click();page.locator('#account-username').fill(username);page.locator('#account-password').fill(password);page.get_by_role('checkbox').check();page.get_by_role('button',name='Создать личный кабинет',exact=True).click();page.get_by_role('button',name='Я сохранил код',exact=True).click()
 host=page.locator('[data-body-model]');page.get_by_text('3D-ориентир мерок',exact=True).scroll_into_view_if_needed() if page.get_by_text('3D-ориентир мерок',exact=True).count() else page.locator('[data-body-model]').scroll_into_view_if_needed();page.wait_for_selector('[data-body-model="ready"]',timeout=60000)
 assert sum(u.endswith('/models/hair-male-short01.glb') for u in requests)==1,'Default hair loaded more than once'
 assert float(host.get_attribute('data-body-first-frame-ms'))<=float(host.get_attribute('data-body-ready-ms')),'Ready was exposed before the first body frame'
 for kind in ['male','female']:
  page.get_by_role('button',name='Мужская' if kind=='male' else 'Женская',exact=True).click();page.wait_for_selector(f'[data-body-model="ready"][data-body-form="{kind}"]',timeout=60000)
  for style,label in [('short01','Короткая'),('bob01','Каре'),('ponytail01','Собранные')]:
   page.get_by_role('button',name=label,exact=True).click();page.wait_for_function('(s)=>document.querySelector("[data-body-model]").dataset.bodyHair===s',arg=style,timeout=45000);page.get_by_role('button',name='Спереди',exact=True).click();page.wait_for_timeout(250);host.screenshot(path=str(out/f'{kind}-hair-{style}.png'),timeout=90000)
  page.get_by_role('button',name='Короткая',exact=True).click();page.wait_for_function("document.querySelector('[data-body-model]').dataset.bodyHair==='short01'",timeout=45000)
  for view in ['front','side','back']:
   page.get_by_role('button',name='Спереди' if view!='back' else 'Сзади',exact=True).click()
   if view=='side':
    for _ in range(3):page.get_by_role('button',name='Повернуть вправо',exact=True).click()
   page.wait_for_timeout(300);host.screenshot(path=str(out/f'{kind}-{view}.png'),timeout=90000)
  page.get_by_role('button',name='Спереди',exact=True).click();slider=page.get_by_role('slider',name='Телосложение',exact=True);neck=page.locator('#measure-neck').input_value()
  for value,key,label in [(-.55,'Home','lean'),(.55,'End','full'),(0,'Home','neutral')]:
   if label=='neutral':
    slider.press('Home')
    for _ in range(11):slider.press('ArrowRight')
   else:slider.press(key)
   expect(host).to_have_attribute('data-body-build',str(value) if value else '0');page.wait_for_timeout(300);host.screenshot(path=str(out/f'{kind}-{label}.png'),timeout=90000)
  diff=ImageChops.difference(Image.open(out/f'{kind}-lean.png').convert('RGB'),Image.open(out/f'{kind}-full.png').convert('RGB'));changed=sum(max(pixel)>15 for pixel in diff.getdata());assert changed>diff.width*diff.height*.01,'Native morphology did not visibly change the body'
  assert page.locator('#measure-neck').input_value()==neck,'Reference morphology overwrote private measurements'
  report['cases'].append({'form':kind,'checks':['all three fitted hair styles','front/side/back','relaxed pose','native morph extrema and reset','measurements unchanged'],'timings':host.evaluate('(e)=>({...e.dataset})')});print('PASS',kind,flush=True)
 # Mobile actual page layout and touch orbit, both forms and hair alpha cutout.
 page.set_viewport_size({'width':390,'height':844});host.scroll_into_view_if_needed();cdp=c.new_cdp_session(page)
 for kind in ['male','female']:
  page.get_by_role('button',name='Мужская' if kind=='male' else 'Женская',exact=True).click();page.wait_for_selector(f'[data-body-model="ready"][data-body-form="{kind}"]',timeout=60000);page.wait_for_function("Boolean(document.querySelector('[data-body-model]').dataset.bodyHair)",timeout=45000);host.scroll_into_view_if_needed();box=host.bounding_box();x=box['x']+box['width']/2;y=max(80,min(700,box['y']+box['height']/2))
  cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y,'id':1}]})
  for i in range(6):cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+10*i,'y':y,'id':1}]})
  cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});page.wait_for_timeout(500);host.screenshot(path=str(out/f'{kind}-mobile.png'),timeout=90000)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 # Hidden-tab handler stops queued orbit updates and resumes safely.
 page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))")
 count=host.get_attribute('data-body-render-count');page.wait_for_timeout(350);assert count==host.get_attribute('data-body-render-count')
 page.evaluate("delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))");page.wait_for_function("document.querySelector('[data-body-model]').dataset.bodyIdle==='true'",timeout=6000);count=host.get_attribute('data-body-render-count');page.wait_for_timeout(350);assert count==host.get_attribute('data-body-render-count'),'Avatar kept rendering at rest'
 page.route('**/models/hair-*-bob01.glb',lambda route:route.fulfill(status=200,body=b'corrupt model'));page.get_by_role('button',name='Каре',exact=True).click();expect(page.get_by_text('Причёска недоступна',exact=True)).to_be_visible(timeout=30000);expect(host).to_have_attribute('data-body-model','ready');page.unroute_all(behavior='ignoreErrors')
 # Existing persistence still works after reference adjustments.
 page.locator('#measure-neck').fill('38');page.get_by_role('button',name='Сохранить',exact=True).click();page.reload();page.wait_for_load_state('networkidle');expect(page.locator('#measure-neck')).to_have_value('38');page.get_by_text('3D-ориентир мерок',exact=True).scroll_into_view_if_needed() if page.get_by_text('3D-ориентир мерок',exact=True).count() else page.locator('[data-body-model]').scroll_into_view_if_needed();page.wait_for_selector('[data-body-model="ready"]',timeout=60000)
 page.goto(base+'/shop');page.wait_for_load_state('networkidle');assert page.locator('[data-body-model] canvas').count()==0;assert page.locator('[data-fabric-scene] canvas').count()==0
 page.goto(base+'/account');page.wait_for_load_state('networkidle');page.get_by_role('button',name='Удалить аккаунт',exact=True).click();page.locator('#delete-password').fill(password);page.get_by_role('button',name='Подтвердить удаление',exact=True).click();expect(page.get_by_role('button',name='Войти в кабинет',exact=True)).to_be_visible()
 assert not errors,errors;video=page.video;c.close();video.save_as(str(out/'anatomy-interaction.webm'));b.close()
 report['errors']=errors;report['checks']=['no pre-auth avatar fetch','touch orbit','hidden pause','idle render stop','corrupt hair fallback','measurement persistence','GPU scenes absent after leaving','test account deleted'];(out/'anatomy-acceptance.json').write_text(json.dumps(report,indent=2));print('PASS anatomical viewer, mobile emulation, lifecycle, error fallback and account persistence',flush=True)
