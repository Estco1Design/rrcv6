"""Prepare calibrated Poly Haven wool maps, never synthesize a textile.

Requires NumPy, Pillow, OpenEXR 3.3.3. Source files remain at their native
4096x4181. Normal XY and roughness B are packed to reduce runtime VRAM/fetches;
Three.js reconstructs the positive tangent Z. This is numerical map conversion,
not generation of photo detail or painting macro folds into the material.
"""
from pathlib import Path
import argparse,hashlib,json,urllib.request,concurrent.futures
import numpy as np
from PIL import Image
import OpenEXR
root=Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--sources',type=Path,required=True);p.add_argument('--download',action='store_true');args=p.parse_args()
asset='poly_wool_herringbone';agent='RRC-material-review/1.0 (https://github.com/Estco1Design/rrcv6)'
def request(url):return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':agent}),timeout=90)
args.sources.mkdir(parents=True,exist_ok=True)
if args.download:
 with request('https://api.polyhaven.com/files/'+asset) as response:catalog=json.load(response)
 items=[('color',catalog['Diffuse']['4k']['jpg']),('normal',catalog['nor_gl']['4k']['exr']),('roughness',catalog['Rough']['4k']['exr'])]
 def download(item):
  name,entry=item;file=args.sources/entry['url'].rsplit('/',1)[-1]
  if not file.exists() or hashlib.md5(file.read_bytes()).hexdigest()!=entry['md5']:
   with request(entry['url']) as response,file.open('wb') as out:
    while data:=response.read(1024*1024):out.write(data)
  data=file.read_bytes();assert len(data)==entry['size'] and hashlib.md5(data).hexdigest()==entry['md5'],'Publisher checksum mismatch'
  return {'map':name,'path':str(file),'url':entry['url'],'publisher_md5':entry['md5'],'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)}
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:rows=list(pool.map(download,items))
 (args.sources/'sources.json').write_text(json.dumps(rows,indent=2))
rows=json.loads((args.sources/'sources.json').read_text())
files={row['map']:args.sources/Path(row['path']).name for row in rows}
for row in rows:
 data=files[row['map']].read_bytes();assert hashlib.md5(data).hexdigest()==row['publisher_md5'] and hashlib.sha256(data).hexdigest()==row['sha256']
color=Image.open(files['color']).convert('RGB');norm=OpenEXR.File(str(files['normal'])).channels()['RGB'].pixels.astype(np.float32)
rough=OpenEXR.File(str(files['roughness'])).channels()['Y'].pixels.astype(np.float32)
assert norm.shape[:2]==rough.shape==color.size[::-1]==(4181,4096)
output=root/'public/intro';runtime=[]
for profile,width in [('desktop',2048),('mobile',1024)]:
 size=(width,round(width*color.height/color.width))
 def resize(channel):return np.asarray(Image.fromarray(channel).resize(size,Image.Resampling.LANCZOS),dtype=np.float32)
 n=np.stack([resize(norm[:,:,axis]) for axis in range(3)],-1)*2-1
 n/=np.maximum(.00001,np.linalg.norm(n,axis=-1,keepdims=True))
 r=np.clip(resize(rough),0,1)
 packed=np.stack([n[:,:,0]*.5+.5,n[:,:,1]*.5+.5,r],-1)
 paths=[output/f'wool-scan-color-{profile}.webp',output/f'wool-scan-surface-{profile}.webp']
 color.resize(size,Image.Resampling.LANCZOS).save(paths[0],quality=93,method=6)
 Image.fromarray(np.uint8(np.clip(packed,0,1)*255+.5)).save(paths[1],lossless=True,method=6)
 for file in paths:runtime.append({'file':file.name,'dimensions':list(size),'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
 # Check channel convention and quantized XY accuracy; there is no roughness-in-G alias.
 decoded=np.asarray(Image.open(paths[1]),dtype=np.float32)/255
 assert np.max(np.abs(decoded[:,:,:2]-packed[:,:,:2]))<=.5/255+1e-6
 assert np.max(np.abs(decoded[:,:,2]-r))<=.5/255+1e-6
manifest={'asset':asset,'origin':'https://polyhaven.com/a/'+asset,'license':'CC0-1.0','license_url':'https://polyhaven.com/license','authors':{'colormass':'Photography','Rico Cilliers':'Processing'},'source_dimensions':[4096,4181],'source_physical_mm':[270.0788548673393,275.70000290870667],'source_maps':[{k:v for k,v in row.items() if k!='path'} for row in rows],'runtime_maps':runtime,'encoding':'Color sRGB; surface R/G OpenGL normal XY, B linear roughness; positive normal Z reconstructed.','black_dye':'Runtime material tint; source color map is unpainted.'}
(output/'wool-scan-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps(runtime,indent=2))
