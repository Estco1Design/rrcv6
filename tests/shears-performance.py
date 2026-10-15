"""Native-clock render submission samples while the actual tool is visible.
Cloud SwiftShader is not a phone and submit intervals are not display timestamps.
"""
from playwright.sync_api import sync_playwright
from pathlib import Path
import shutil,json,statistics
out=Path(__file__).resolve().parents[1]/'docs/media/shears-reference/native-timing.json';report={'browser':'Chromium 154, Linux Xeon 8573C, SwiftShader, cgroup 4 CPU','real_phone':False,'recording':False,'cache':'fresh browser, HTTP cache disabled, warm production server','runs':[]}
with sync_playwright() as p:
 for mobile,w,h in [(False,1280,720),(True,390,844)]:
  b=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']);c=b.new_context(viewport={'width':w,'height':h},device_scale_factor=3 if mobile else 1,is_mobile=mobile,has_touch=mobile,reduced_motion='no-preference');page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));cdp=c.new_cdp_session(page);cdp.send('Network.enable');cdp.send('Network.setCacheDisabled',{'cacheDisabled':True});cdp.send('Network.clearBrowserCache')
  page.add_init_script('''window.__toolFrames=[];window.__toolPrevious=0;new MutationObserver(records=>{for(const record of records){const e=record.target;if(e.matches?.('[data-fabric-scene]')&&e.dataset.state==='playing'&&e.dataset.tool==='true'){const now=performance.now();window.__toolFrames.push({submitInterval:window.__toolPrevious?now-window.__toolPrevious:0,cpuRender:Number(e.dataset.cpuFrameMs)});window.__toolPrevious=now}}}).observe(document,{subtree:true,attributes:true,attributeFilter:['data-render-count']});''')
  page.goto('http://127.0.0.1:3000');page.wait_for_selector('[data-fabric-scene][data-state=complete]',timeout=45000);host=page.locator('[data-fabric-scene]');samples=page.evaluate('window.__toolFrames');assert len(samples)>5,samples;assert not errors,errors
  def stats(a):return {'n':len(a),'p50_ms':statistics.median(a),'p95_ms':sorted(a)[min(len(a)-1,int(len(a)*.95))]}
  report['runs'].append({'viewport':[w,h],'dpr':3 if mobile else 1,'profile':host.get_attribute('data-profile'),'pixels':int(host.get_attribute('data-pixel-count')),'preparation':json.loads(host.get_attribute('data-timings')),'first_shown_navigation_ms':float(host.get_attribute('data-first-shown-navigation-ms')),'cpu_render':stats([v['cpuRender'] for v in samples]),'submit_interval':stats([v['submitInterval'] for v in samples if v['submitInterval']>0]),'samples':samples,'errors':errors});c.close();b.close();print('MEASURED tool-visible',w,report['runs'][-1]['cpu_render'],report['runs'][-1]['submit_interval'],flush=True)
 out.write_text(json.dumps(report,indent=2))
