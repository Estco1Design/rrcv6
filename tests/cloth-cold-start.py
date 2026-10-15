"""Cold resource runs, fresh Chromium processes. Synthetic mobile, never hardware phone FPS."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json,statistics,shutil,hashlib
root=Path(__file__).resolve().parents[1];out=root/'qa';out.mkdir(exist_ok=True)
result={'device':'Linux cloud VM, Intel Xeon Platinum 8573C, 5 visible vCPU; cgroup quota 4 CPU','browser':'Chromium 154, SwiftShader','physical_phone':False,'recording_enabled':False,'runs':[],'mobile_model_sha256':hashlib.sha256((root/'public/intro/titanium-shears-mobile.glb').read_bytes()).hexdigest()}
with sync_playwright() as p:
 for rate,mbps in [(1,None),(4,8)]:
  b=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=3,is_mobile=True,has_touch=True,reduced_motion='no-preference');page=c.new_page();cdp=c.new_cdp_session(page)
  cdp.send('Network.enable');cdp.send('Network.setCacheDisabled',{'cacheDisabled':True});cdp.send('Network.clearBrowserCache');cdp.send('Emulation.setCPUThrottlingRate',{'rate':rate})
  if mbps:cdp.send('Network.emulateNetworkConditions',{'offline':False,'latency':80,'downloadThroughput':mbps*1024*1024/8,'uploadThroughput':1024*1024/8})
  page.goto('http://127.0.0.1:3000');page.wait_for_selector('[data-fabric-scene][data-state="complete"]',timeout=45000);host=page.locator('[data-fabric-scene]')
  data=host.evaluate('(e)=>({...e.dataset})');canvas=host.locator('canvas').evaluate('(c)=>{const g=c.getContext("webgl2");return {width:c.width,height:c.height,context:g.getContextAttributes(),samples:g.getParameter(g.SAMPLES),version:g.getParameter(g.VERSION)}}');run={'cpu_throttle':rate,'network':f'{mbps}Mbps/80ms' if mbps else 'unthrottled localhost','scene':data,'canvas':canvas}
  page.evaluate("window.__bench=[];window.__prev=0;new MutationObserver(()=>{let e=document.querySelector('[data-fabric-scene]'),n=performance.now();if(e.dataset.grabbed){window.__bench.push({cpu:Number(e.dataset.cpuFrameMs),delta:window.__prev?n-window.__prev:0});window.__prev=n}else window.__prev=0}).observe(document.querySelector('[data-fabric-scene]'),{attributes:true,attributeFilter:['data-render-count']})")
  for name,y,dy in [('top',145,35),('bottom',708,-35)]:
   cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':195,'y':y,'id':1}]})
   assert host.get_attribute('data-grabbed')==name, 'Touch did not capture '+name
   page.evaluate('window.__prev=0')
   for i in range(6):cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':195+i*3,'y':y+dy*(i+1)/6,'id':1}]});page.wait_for_timeout(50)
   page.wait_for_timeout(1000);cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});page.wait_for_timeout(1300)
  values=page.evaluate('window.__bench');assert values,'No interaction samples'
  def stats(a):return {'count':len(a),'median_ms':statistics.median(a),'p95_ms':sorted(a)[min(len(a)-1,int(len(a)*.95))]}
  run['samples']=values
  run['cpu_frame']=stats([v['cpu'] for v in values]);run['render_intervals']=stats([v['delta'] for v in values if v['delta']>0]);result['runs'].append(run)
  print('MEASURED',rate,data['timings'],run['cpu_frame'],run['render_intervals'],flush=True);c.close();b.close()
 (out/'cloth-cold-start.json').write_text(json.dumps(result,indent=2))
