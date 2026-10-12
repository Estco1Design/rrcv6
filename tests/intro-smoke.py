from playwright.sync_api import sync_playwright,expect
import os,shutil
from pathlib import Path
root=Path(__file__).resolve().parents[1]
base=os.environ.get('RRC_BASE_URL','http://127.0.0.1:3000').rstrip('/')
browser_path=os.environ.get('RRC_BROWSER_PATH') or shutil.which('chromium')
launch_options={'executable_path':browser_path} if browser_path else {}
(root/'qa').mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(**launch_options,headless=True,args=['--no-sandbox']);c=b.new_context(viewport={'width':390,'height':844},reduced_motion='no-preference');page=c.new_page();page.goto(base+'/');page.wait_for_load_state('networkidle')
 expect(page.get_by_role('button',name='ВОЙТИ',exact=True)).to_be_visible();expect(page.locator('[data-intro-sculpture]')).to_have_count(0)
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.screenshot(path=str(root/'qa/intro-mobile.png'))
 page.get_by_role('button',name='PRIVATE ACCESS',exact=True).click();expect(page.get_by_label('Код доступа',exact=True)).to_be_visible();page.keyboard.press('Escape');expect(page.get_by_role('button',name='PRIVATE ACCESS',exact=True)).to_be_focused()
 page.get_by_role('button',name='ВОЙТИ',exact=True).click();expect(page.locator('[data-rrc-boot-intro]')).to_have_count(0);assert page.evaluate('document.documentElement.style.overflow')!='hidden'
 expect(page.locator('a[href="/private/home"]')).to_have_count(0)
 handle=page.locator('[data-mobile-menu] button');handle.click();expect(page.get_by_role('navigation',name='Основная навигация')).to_be_visible();expect(page.get_by_role('navigation',name='Основная навигация').get_by_text('PRIVATE ACCESS')).to_have_count(0)
 handle.click();expect(page.get_by_role('navigation',name='Основная навигация')).to_have_count(0)
 box=handle.bounding_box();page.mouse.move(box['x']+40,box['y']+35);page.mouse.down();page.mouse.move(box['x']+40,box['y']-30,steps=8);page.mouse.up();expect(page.get_by_role('navigation',name='Основная навигация')).to_be_visible()
 page.get_by_role('navigation',name='Основная навигация').get_by_role('link',name='Каталог',exact=True).click();page.wait_for_url(base+'/shop');page.wait_for_load_state('networkidle');expect(page.get_by_role('navigation',name='Основная навигация')).to_have_count(0)
 page.locator('a[href="/shop?section=current"]').click();page.wait_for_url(base+'/shop?section=current');page.wait_for_load_state('networkidle')
 card=page.locator('[data-product-card]').first;expect(card).to_be_visible();assert 'pre-order' not in card.inner_text().lower();assert 'предзаказ' not in card.inner_text().lower();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.screenshot(path=str(root/'qa/shop-mobile.png'));b.close();print('PASS: minimal intro, private-only entrance, public navigation hides private link, Escape focus, mobile tap/swipe drawer and route close, minimal product cards, no overflow')
