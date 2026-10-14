"""Native-clock acceptance for two CPU-deformed sheets. Chromium/SwiftShader, not a phone FPS test."""
from playwright.sync_api import sync_playwright,expect
from pathlib import Path
from PIL import Image
import io,json,os,statistics,shutil
root=Path(__file__).resolve().parents[1];out=root/'qa';out.mkdir(exist_ok=True)
base=os.environ.get('RRC_BASE_URL','http://127.0.0.1:3000')
args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']
report={'recording_pointer_aid':os.environ.get('RRC_RECORD_POINTERS')=='1','browser':'Chromium, Linux Xeon 8573C, 5 vCPU, SwiftShader','real_phone':False,'cases':[]}
def brightness(page):
 box=page.locator('.rrc-cut-title').bounding_box();raw=page.screenshot(timeout=90000,caret='initial');page._validated_frame=raw
 image=Image.open(io.BytesIO(raw)).convert('RGB');scale=image.width/page.viewport_size['width'];area=image.crop((int(box['x']*scale),int(box['y']*scale),int((box['x']+box['width'])*scale),int((box['y']+box['height'])*scale)))
 return sum(max(pixel)>115 for pixel in area.getdata())
def wait_rest(page,host):
 page.mouse.move(page.viewport_size['width']*.5,page.viewport_size['height']*.48)
 # A cancelled grab can have zero offsets but still owe its last reset draw.
 # Check the idle invariant after the specified release/hover settling window.
 page.wait_for_timeout(1350)
 page.wait_for_function("(()=>{let e=document.querySelector('[data-fabric-scene]');return Number(e.dataset.topMotion||0)===0&&Number(e.dataset.bottomMotion||0)===0})()",timeout=5000)
 count=host.get_attribute('data-render-count');page.wait_for_timeout(250);assert count==host.get_attribute('data-render-count'),'Idle render loop continued'
def touch(cdp,kind,points):cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':points})
with sync_playwright() as p:
 for mobile,w,h in [(False,1280,720),(True,390,844)]:
  browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=args)
  context=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=3 if mobile else 1,is_mobile=mobile,has_touch=mobile,reduced_motion='no-preference',record_video_dir=str(out/'grab-video'),record_video_size={'width':w,'height':h})
  page=context.new_page();errors=[];console=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda e:console.append(e.text) if e.type=='error' else None)
  cdp=context.new_cdp_session(page);cdp.send('Network.enable');cdp.send('Network.setCacheDisabled',{'cacheDisabled':True});cdp.send('Network.clearBrowserCache')
  page.add_init_script("window.__lastPointer=0;document.addEventListener('pointerdown',e=>{if(e.isPrimary)window.__lastPointer=e.pointerId});")
  page.goto(base);page.wait_for_selector('[data-fabric-scene][data-state="complete"]',timeout=45000);page.wait_for_load_state('networkidle')
  if os.environ.get('RRC_RECORD_POINTERS')=='1':
   # Recording-only pointer aid. This does not exist in the shipped website.
   page.evaluate('''(()=>{const dot=document.createElement('div'),label=document.createElement('div');dot.style.cssText='position:fixed;width:18px;height:18px;border:1px solid #eee;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:1000;display:none';label.style.cssText='position:fixed;bottom:12px;left:50%;transform:translateX(-50%);font:10px monospace;color:#ddd;pointer-events:none;z-index:1000';document.body.append(dot,label);let id=null;document.addEventListener('pointerdown',e=>{const name=document.querySelector('[data-fabric-scene]')?.dataset.grabbed;if(!name)return;id=e.pointerId;dot.style.display='block';dot.style.left=e.clientX+'px';dot.style.top=e.clientY+'px';label.textContent=name.toUpperCase()+' · CAPTURED'});document.addEventListener('pointermove',e=>{if(e.pointerId===id){dot.style.left=e.clientX+'px';dot.style.top=e.clientY+'px'}});for(const name of ['pointerup','pointercancel','lostpointercapture'])document.addEventListener(name,e=>{if(e.pointerId===id){id=null;dot.style.display='none';label.textContent='RELEASED'}},true)})()''')
  host=page.locator('[data-fabric-scene]');baseline=brightness(page);assert baseline>100
  case={'viewport':[w,h],'dpr':3 if mobile else 1,'profile':host.get_attribute('data-profile'),'startup':json.loads(host.get_attribute('data-timings')),'first_shown_navigation_ms':host.get_attribute('data-first-shown-navigation-ms'),'pixel_count':host.get_attribute('data-pixel-count'),'vertices':host.get_attribute('data-cloth-vertices'),'checks':[]}
  title=page.locator('.rrc-cut-title').bounding_box()
  page.evaluate("window.__samples=[];window.__samplePrevious=0;new MutationObserver(()=>{let e=document.querySelector('[data-fabric-scene]'),n=performance.now();if(e.dataset.grabbed){window.__samples.push({cpu:Number(e.dataset.cpuFrameMs),interval:window.__samplePrevious?n-window.__samplePrevious:0});window.__samplePrevious=n}else window.__samplePrevious=0}).observe(document.querySelector('[data-fabric-scene]'),{attributes:true,attributeFilter:['data-render-count']})")
  for name,y,dy in [('top',.18*h,35),('bottom',.84*h,-40)]:
   x=.5*w
   if not mobile:
    page.mouse.move(x-25,y)
    for step in range(8):page.mouse.move(x-25+step*6,y);page.wait_for_timeout(25)
    assert float(host.get_attribute('data-'+name+'-motion') or 0)>.0001,name+' hover did not respond'
    case['checks'].append(name+' hover');wait_rest(page,host)
    page.mouse.move(x,y);page.mouse.down();expect(host).to_have_attribute('data-grabbed',name)
    for step in range(8):page.mouse.move(x+(step+1)*5,y+dy*(step+1)/8);page.wait_for_timeout(35)
   else:
    touch(cdp,'touchStart',[{'x':x,'y':y,'id':101}]);expect(host).to_have_attribute('data-grabbed',name)
    for step in range(8):touch(cdp,'touchMove',[{'x':x+(step+1)*3,'y':y+dy*(step+1)/8,'id':101}]);page.wait_for_timeout(35)
   page.wait_for_timeout(200);assert float(host.get_attribute('data-'+name+'-motion') or 0)>.001,name+' drag did not deform'
   assert brightness(page)>=baseline*.85,'Wordmark disappeared during '+name+' drag'
   after=page.locator('.rrc-cut-title').bounding_box();assert all(abs(after[k]-title[k])<.5 for k in title),'HTML wordmark moved'
   (out/f'grab-{w}-{name}.png').write_bytes(page._validated_frame);case['checks'].append(name+' '+('touch' if mobile else 'mouse')+' drag')
   # Release outside the original cloth, in the stable central aperture.
   if mobile:touch(cdp,'touchMove',[{'x':.55*w,'y':.48*h,'id':101}]);touch(cdp,'touchEnd',[])
   else:page.mouse.move(.55*w,.48*h);page.mouse.up()
   expect(host).to_have_attribute('data-grabbed','');wait_rest(page,host);case['checks'].append(name+' release outside')
  # Cancellation and lost capture must not leave a held sheet.
  if mobile:
   touch(cdp,'touchStart',[{'x':.5*w,'y':.18*h,'id':101}]);expect(host).to_have_attribute('data-grabbed','top')
   touch(cdp,'touchCancel',[]);expect(host).to_have_attribute('data-grabbed','');wait_rest(page,host);case['checks'].append('touch cancellation')
   touch(cdp,'touchStart',[{'x':.5*w,'y':.84*h,'id':101}]);expect(host).to_have_attribute('data-grabbed','bottom')
   touch(cdp,'touchStart',[{'x':.5*w,'y':.84*h,'id':101},{'x':.8*w,'y':.18*h,'id':102}]);assert host.get_attribute('data-grabbed') in ['bottom','']
   touch(cdp,'touchEnd',[]);wait_rest(page,host);case['checks'].append('additional finger')
  else:
   page.mouse.move(.5*w,.18*h);page.mouse.down();page.locator('[data-cloth-hit="top"]').dispatch_event('pointercancel',{'pointerId':1,'pointerType':'mouse','bubbles':True});expect(host).to_have_attribute('data-grabbed','');page.mouse.up();wait_rest(page,host);case['checks'].append('pointercancel')
   page.mouse.move(.5*w,.84*h);page.mouse.down();page.mouse.move(.501*w,.84*h);page.evaluate("document.querySelector('[data-cloth-hit=bottom]').releasePointerCapture(window.__lastPointer)");page.mouse.move(.51*w,.84*h);expect(host).to_have_attribute('data-grabbed','');page.mouse.up();wait_rest(page,host);case['checks'].append('lostpointercapture')
   page.mouse.move(.5*w,.18*h);page.mouse.down();page.set_viewport_size({'width':w-20,'height':h});expect(host).to_have_attribute('data-grabbed','');page.mouse.up();page.set_viewport_size({'width':w,'height':h});wait_rest(page,host);case['checks'].append('resize during capture')
  # Hidden-tab handler releases input and stops drawing; native visibility is not simulated hardware.
  if mobile:touch(cdp,'touchStart',[{'x':.5*w,'y':.18*h,'id':101}])
  else:page.mouse.move(.5*w,.18*h);page.mouse.down()
  page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__hiddenTest===true});window.__hiddenTest=true;document.dispatchEvent(new Event('visibilitychange'))")
  expect(host).to_have_attribute('data-grabbed','');count=host.get_attribute('data-render-count');page.wait_for_timeout(200);assert count==host.get_attribute('data-render-count')
  page.evaluate("window.__hiddenTest=false;document.dispatchEvent(new Event('visibilitychange'))")
  if mobile:touch(cdp,'touchEnd',[])
  else:page.mouse.up()
  wait_rest(page,host);case['checks'].append('hidden handler cancellation/pause')
  samples=page.evaluate('window.__samples');cpu=[v['cpu'] for v in samples];intervals=[v['interval'] for v in samples if v['interval']>0]
  def stats(values):return {'n':len(values),'p50_ms':statistics.median(values),'p95_ms':sorted(values)[min(len(values)-1,int(len(values)*.95))]} if values else None
  case['cpu_frame']=stats(cpu);case['observed_render_interval']=stats(intervals)
  (page.get_by_role('button',name='PRIVATE ACCESS',exact=True).tap() if mobile else page.get_by_role('button',name='PRIVATE ACCESS',exact=True).click());expect(page.get_by_label('Код доступа',exact=True)).to_be_visible();assert host.get_attribute('data-grabbed')=='';page.get_by_role('button',name='НАЗАД',exact=True).click();case['checks'].append('private input after interaction')
  # Replay once, skip, and confirm public entry remains functional.
  page.get_by_role('button',name='Повторить',exact=True).click();expect(page.get_by_role('button',name='Пропустить',exact=True)).to_be_visible();page.get_by_role('button',name='Пропустить',exact=True).click();expect(page.get_by_role('button',name='ВОЙТИ',exact=True)).to_be_enabled();case['checks'].append('replay and skip')
  (page.get_by_role('button',name='ВОЙТИ',exact=True).tap() if mobile else page.get_by_role('button',name='ВОЙТИ',exact=True).click());expect(page.locator('[data-rrc-boot-intro]')).to_have_count(0);case['checks'].append('public entry/unmount')
  assert not errors,errors;assert not console,console
  video=page.video;context.close();video.save_as(str(out/f'cloth-grabs-{w}.webm'));browser.close();report['cases'].append(case);print('PASS',case['viewport'],case['checks'],flush=True)
 (out/'cloth-grab-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
