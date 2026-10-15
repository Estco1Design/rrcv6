"""Browser release checks. Run against a server using isolated account/private databases."""
import os,secrets,hashlib,shutil
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
base=os.environ.get('RRC_BASE_URL','http://127.0.0.1:3000').rstrip('/')
root=Path(__file__).resolve().parents[1];(root/'qa').mkdir(exist_ok=True)
browser_path=os.environ.get('RRC_BROWSER_PATH') or shutil.which('chromium')
launch_options={'executable_path':browser_path} if browser_path else {}
username='check_'+secrets.token_hex(4);password=secrets.token_hex(16)
with sync_playwright() as p:
 browser=p.chromium.launch(**launch_options,headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 context=browser.new_context(viewport={'width':1440,'height':1000},reduced_motion='reduce');page=context.new_page()
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base+'/private/home');page.wait_for_load_state('networkidle');expect(page).to_have_url(base+'/')
 # Neither a forged private cookie nor an account-cookie-shaped value grants membership.
 context.add_cookies([{'name':'rrc_private_access','value':'f'*64,'url':base},{'name':'rrc_account','value':'f'*64,'url':base}])
 page.goto(base+'/private/home');page.wait_for_load_state('networkidle');expect(page).to_have_url(base+'/');context.clear_cookies()
 page.goto(base+'/');page.wait_for_load_state('networkidle');expect(page.get_by_role('button',name='PRIVATE ACCESS',exact=True)).to_be_visible()
 expect(page.locator('[data-intro-sculpture]')).to_have_count(0);page.screenshot(path=str(root/'qa/intro-v2.png'))
 page.get_by_role('button',name='PRIVATE ACCESS',exact=True).click();page.get_by_role('button',name='НАЗАД',exact=True).click();page.get_by_role('button',name='PRIVATE ACCESS',exact=True).click()
 page.get_by_label('Код доступа',exact=True).fill('wrong-test-code');page.get_by_role('button',name='Войти',exact=True).click();expect(page.locator('[data-rrc-boot-intro] [role=alert]')).to_contain_text('Код не подошёл')
 page.get_by_label('Код доступа',exact=True).fill(os.environ.get('RRC_TEST_PRIVATE_CODE','ESTCO'));page.get_by_role('button',name='Войти',exact=True).click();page.wait_for_url(base+'/private');expect(page.get_by_role('heading')).to_contain_text('Поздравляем');page.get_by_role('link',name='ПРОДОЛЖИТЬ',exact=True).click();page.wait_for_url(base+'/private/home');page.wait_for_load_state('networkidle')
 expect(page.get_by_role('heading',name='PRIVATE ACCESS',exact=True)).to_be_visible();page.screenshot(path=str(root/'qa/inner-circle.png'),full_page=True)
 for section in ['early-access','private-drops','preorder','rewards','archive']:
  page.goto(base+'/private/'+section);page.wait_for_load_state('networkidle');assert page.locator('h1').count()==1;expect(page.get_by_role('link',name='Обсудить с RRC')).to_be_visible()
  if section=='archive':assert page.locator('a[href^="/product/"]').count()==10
  if section=='preorder':assert page.locator('a[href^="/product/"]').count()==15
 page.goto(base+'/account');page.wait_for_load_state('networkidle');expect(page.get_by_role('heading',name='Личный кабинет',exact=True)).to_be_visible()
 page.get_by_role('button',name='Создать аккаунт',exact=True).click();page.locator('#account-username').fill(username);page.locator('#account-password').fill(password);page.get_by_role('checkbox').check();page.get_by_role('button',name='Создать личный кабинет',exact=True).click();page.get_by_role('button',name='Я сохранил код',exact=True).click()
 page.wait_for_selector('[data-body-model="ready"][data-body-form="male"]',timeout=30000)
 page.locator('#measure-neck').fill('38');page.locator('#measure-weight').fill('72');page.locator('#measure-height').fill('180');page.get_by_role('button',name='Обхват шеи',exact=True).click();expect(page.locator('#measurement-instruction')).to_contain_text('основания шеи')
 model=page.locator('[data-body-model]');model.scroll_into_view_if_needed();before=model.screenshot();model.screenshot(path=str(root/'qa/model-male.png'));page.get_by_role('button',name='Сзади',exact=True).click();assert hashlib.sha256(before).digest()!=hashlib.sha256(model.screenshot()).digest()
 page.get_by_role('button',name='Спереди',exact=True).click();box=model.bounding_box();page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2);page.mouse.down();page.mouse.move(box['x']+box['width']/2+80,box['y']+box['height']/2,steps=12);page.mouse.up();assert before!=model.screenshot()
 page.get_by_role('button',name='Женская',exact=True).click();page.wait_for_selector('[data-body-model="ready"][data-body-form="female"]',timeout=30000);model.screenshot(path=str(root/'qa/model-female.png'))
 page.get_by_role('button',name='Сохранить профиль',exact=True).click();expect(page.get_by_role('status').filter(has_text='Сохранено')).to_contain_text('Сохранено');page.reload();page.wait_for_load_state('networkidle');expect(page.locator('#measure-neck')).to_have_value('38');expect(page.locator('#measure-weight')).to_have_value('72')
 page.set_viewport_size({'width':390,'height':844});page.get_by_text('3D-ориентир мерок',exact=True).scroll_into_view_if_needed() if page.get_by_text('3D-ориентир мерок',exact=True).count() else model.scroll_into_view_if_needed();page.wait_for_selector('[data-body-model="ready"]');model.scroll_into_view_if_needed();page.screenshot(path=str(root/'qa/account-mobile.png'),full_page=True);assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
 page.get_by_role('button',name='Повернуть вправо',exact=True).focus();page.keyboard.press('Enter');page.get_by_role('button',name='Следующая мерка',exact=False).click();page.get_by_role('button',name='Сохранить',exact=True).click()
 fallback_browser=p.chromium.launch(**launch_options,headless=True,args=['--no-sandbox','--disable-webgl']);fallback_context=fallback_browser.new_context(viewport={'width':390,'height':844});fallback_context.add_cookies(context.cookies());fallback=fallback_context.new_page();fallback.goto(base+'/account');fallback.wait_for_load_state('networkidle');fallback.get_by_text('3D-ориентир мерок',exact=True).scroll_into_view_if_needed() if fallback.get_by_text('3D-ориентир мерок',exact=True).count() else None;fallback.wait_for_selector('[data-body-model="fallback"]',state='attached');expect(fallback.locator('#measure-neck')).to_have_value('38');fallback_browser.close()
 # Independent private sign-out must revoke the copied token and preserve account authentication.
 cookie=next(c for c in context.cookies() if c['name']=='rrc_private_access');page.goto(base+'/private/home');page.locator('[data-rrc-private-header] button').click();page.wait_for_url(base+'/');page.goto(base+'/private/home');expect(page).to_have_url(base+'/')
 replay=context.request.get(base+'/private/home',headers={'Cookie':'rrc_private_access='+cookie['value']});assert replay.url==base+'/';assert page.evaluate("fetch('/api/account/me',{cache:'no-store'}).then(r=>r.json()).then(d=>d.user!==null)")
 page.goto(base+'/account');page.wait_for_load_state('networkidle');page.get_by_role('button',name='Удалить аккаунт',exact=True).click();page.locator('#delete-password').fill(password);page.get_by_role('button',name='Подтвердить удаление',exact=True).click();expect(page.get_by_role('button',name='Войти в кабинет',exact=True)).to_be_visible()
 assert not errors,errors;browser.close()
 print('PASS: intro code entry, 5 private sections, forged-cookie rejection and revoked-token replay, independent logout, registration, male/female WebGL, pointer and keyboard rotation, optional measurement persistence, 390px mobile/save bar, WebGL fallback, deletion; no browser exceptions')
