from playwright.sync_api import sync_playwright,expect
import hashlib,os,shutil
from pathlib import Path
root=Path(__file__).resolve().parents[1]
base=os.environ.get('RRC_BASE_URL','http://127.0.0.1:3000').rstrip('/')
browser_path=os.environ.get('RRC_BROWSER_PATH') or shutil.which('chromium')
launch_options={'executable_path':browser_path} if browser_path else {}
(root/'qa').mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(**launch_options,headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']);c=b.new_context(viewport={'width':390,'height':844},reduced_motion='no-preference');page=c.new_page();page.goto(base+'/');page.wait_for_load_state('domcontentloaded');expect(page.get_by_role('button',name='ВОЙТИ НА САЙТ',exact=True)).to_be_visible();scene=page.locator('[data-intro-sculpture]');a=scene.screenshot();page.wait_for_timeout(700);b1=scene.screenshot();assert a!=b1,'Intro animation is static';page.get_by_role('button',name='Остановить движение',exact=True).click();page.wait_for_timeout(1000);a=scene.screenshot();page.wait_for_timeout(500);b1=scene.screenshot();assert a==b1,'Pause did not freeze intro';assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.screenshot(path=str(root/'qa/intro-mobile.png'));page.get_by_role('button',name='ВНУТРЕННИЙ КРУГ',exact=True).click();expect(page.get_by_label('Код доступа',exact=True)).to_be_visible();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.keyboard.press('Escape');expect(page.get_by_role('button',name='ВНУТРЕННИЙ КРУГ',exact=True)).to_be_focused();page.get_by_role('button',name='Пропустить',exact=True).click();expect(page.locator('[data-rrc-boot-intro]')).to_have_count(0);assert page.evaluate('document.documentElement.style.overflow')!='hidden';b.close();print('PASS: mobile animated intro, pause freezes frames, no overflow, code branch/Escape focus, skip releases scroll')
