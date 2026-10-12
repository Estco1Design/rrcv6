import os,secrets,time,hashlib,shutil
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
base=os.environ.get('RRC_BASE_URL','http://127.0.0.1:3000').rstrip('/')
root=Path(__file__).resolve().parents[1]
(root/'qa').mkdir(exist_ok=True)
browser_path=os.environ.get('RRC_BROWSER_PATH') or shutil.which('chromium')
launch_options={'executable_path':browser_path} if browser_path else {}
username='check_'+secrets.token_hex(4);password=secrets.token_hex(16)
with sync_playwright() as p:
 browser=p.chromium.launch(**launch_options,headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 context=browser.new_context(viewport={'width':1440,'height':1000},reduced_motion='reduce')
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base+'/private/home');page.wait_for_load_state('networkidle');expect(page).to_have_url(base+'/access')
 # A forged account cookie must not authorize private content.
 context.add_cookies([{'name':'rrc_account','value':'f'*64,'url':base}]);page.goto(base+'/private/home');page.wait_for_load_state('networkidle');expect(page).to_have_url(base+'/access');context.clear_cookies()
 page.goto(base+'/account');page.wait_for_load_state('networkidle');expect(page.get_by_role('heading',name='Личный кабинет',exact=True)).to_be_visible()
 page.get_by_role('button',name='Создать аккаунт',exact=True).click();page.locator('#account-username').fill(username);page.locator('#account-password').fill(password);page.get_by_role('checkbox').check();page.get_by_role('button',name='Создать личный кабинет',exact=True).click()
 page.get_by_role('button',name='Я сохранил код',exact=True).click();page.wait_for_selector('[data-body-model="ready"]',timeout=30000)
 page.locator('#measure-neck').fill('38');page.locator('#measure-weight').fill('72');page.locator('#measure-height').fill('180');page.get_by_role('button',name='Обхват шеи',exact=True).click()
 expect(page.locator('#measurement-instruction')).to_contain_text('основания шеи')
 model=page.locator('[data-body-model]');model.scroll_into_view_if_needed();before=model.screenshot();page.get_by_role('button',name='Сзади',exact=True).click();after=model.screenshot();assert hashlib.sha256(before).digest()!=hashlib.sha256(after).digest(),'3D rotation did not change render'
 page.get_by_role('button',name='Спереди',exact=True).click();model.screenshot(path=str(root/'qa/model-front.png'));box=model.bounding_box();page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2);page.mouse.down();page.mouse.move(box['x']+box['width']/2+80,box['y']+box['height']/2,steps=12);page.mouse.up();assert before!=model.screenshot(),'Pointer rotation did not change render';page.get_by_role('button',name='Спереди',exact=True).click();page.screenshot(path=str(root/'qa/account-desktop.png'),full_page=True)
 page.get_by_role('button',name='Сохранить профиль',exact=True).click();expect(page.get_by_role('status',name='')).to_contain_text('Сохранено')
 page.reload();page.wait_for_load_state('networkidle');expect(page.locator('#measure-neck')).to_have_value('38');expect(page.locator('#measure-weight')).to_have_value('72')
 page.goto(base+'/private/home');page.wait_for_load_state('networkidle');expect(page.get_by_role('heading',name='Закрытый уровень',exact=True)).to_be_visible();page.screenshot(path=str(root/'qa/closed-level.png'),full_page=True)
 page.goto(base+'/account');page.wait_for_load_state('networkidle');page.set_viewport_size({'width':390,'height':844});page.wait_for_selector('[data-body-model="ready"]');page.get_by_role('button',name='Обхват шеи',exact=True).click();model.scroll_into_view_if_needed();page.screenshot(path=str(root/'qa/account-mobile.png'),full_page=True)
 assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'),'Mobile overflow'
 # Non-gesture rotation remains available with keyboard activation.
 page.get_by_role('button',name='Повернуть вправо',exact=True).focus();page.keyboard.press('Enter')
 cookies=context.cookies()
 fallback_browser=p.chromium.launch(**launch_options,headless=True,args=['--no-sandbox','--disable-webgl'])
 fallback_context=fallback_browser.new_context(viewport={'width':390,'height':844});fallback_context.add_cookies(cookies);fallback=fallback_context.new_page();fallback.goto(base+'/account');fallback.wait_for_load_state('networkidle');fallback.wait_for_selector('[data-body-model="fallback"]',state='attached');expect(fallback.locator('#measure-neck')).to_have_value('38');fallback.get_by_role('button',name='Обхват шеи',exact=True).click();expect(fallback.locator('#measurement-instruction')).to_contain_text('основания шеи');fallback_browser.close()
 page.goto(base+'/private/home');page.get_by_role('button',name='ВЫЙТИ ИЗ АККАУНТА',exact=True).click();page.wait_for_url(base+'/');page.goto(base+'/private/home');page.wait_for_load_state('networkidle');expect(page).to_have_url(base+'/access')
 # Clean up our temporary account through the normal UI.
 page.goto(base+'/account');page.wait_for_load_state('networkidle');page.locator('#account-username').fill(username);page.locator('#account-password').fill(password);page.get_by_role('button',name='Войти в кабинет',exact=True).click();page.get_by_role('button',name='Удалить аккаунт',exact=True).click();page.locator('#delete-password').fill(password);page.get_by_role('button',name='Подтвердить удаление',exact=True).click();expect(page.get_by_role('button',name='Войти в кабинет',exact=True)).to_be_visible()
 assert not errors,errors
 browser.close()
 print('PASS: register, 3D WebGL render and rotation, neck/weight save and reload, private authorization and forged-cookie rejection, logout, mobile overflow, keyboard, WebGL fallback, deletion; no browser exceptions')
