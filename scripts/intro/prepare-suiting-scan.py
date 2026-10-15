"""Prepare a photographed CC0 poly-wool scan, preserving native aspect and scale.
Input: Poly Haven poly_wool_herringbone 4K linear half-float EXRs, API checksums.
Requires OpenEXR, NumPy and Pillow. No generated weave, sharpening or upscaling.
"""
from pathlib import Path
import argparse,json,hashlib
import numpy as np
from PIL import Image
import OpenEXR
root=Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--sources',type=Path,required=True);src=p.parse_args().sources
info=json.loads((src/'info.json').read_text());files=json.loads((src/'files.json').read_text())
assert info['authors'].get('colormass')=='Photography'
def load(name):
 path=src/(name+'.exr');expected=files[name]['4k']['exr'];assert hashlib.md5(path.read_bytes()).hexdigest()==expected['md5']
 with OpenEXR.File(str(path)) as f:return next(iter(f.channels().values())).pixels.astype(np.float32)
color=load('Diffuse');normal=load('nor_gl')*2-1;rough=load('Rough');h,w=color.shape[:2];assert w==4096 and h==4181
normal/=np.maximum(.0001,np.linalg.norm(normal,axis=-1,keepdims=True))
# A uniform black dye multiplier retains photographed yarn and fiber variations.
# There are no baked folds, generated noise or broad pattern-removal filters.
luminance=color@np.array([.2126,.7152,.0722],dtype=np.float32)
albedo=np.clip(color*(.022/float(np.median(luminance))),0,1)
srgb=np.where(albedo<=.0031308,albedo*12.92,1.055*albedo**(1/2.4)-.055)
output=root/'public/intro';runtime=[]
for profile,width in [('desktop',2048),('mobile',1024)]:
 size=(width,round(h*width/w))
 def resize(a):return np.asarray(Image.fromarray(a).resize(size,Image.Resampling.LANCZOS),dtype=np.float32)
 n=np.stack([resize(normal[:,:,k]) for k in range(3)],-1);n/=np.maximum(.0001,np.linalg.norm(n,axis=-1,keepdims=True))
 packed=np.stack([n[:,:,0]*.5+.5,n[:,:,1]*.5+.5,np.clip(resize(rough),0,1)],-1)
 paths=[output/f'suiting-scan-color-{profile}.webp',output/f'suiting-scan-surface-{profile}.webp']
 Image.fromarray(np.uint8(np.clip(srgb,0,1)*255+.5)).resize(size,Image.Resampling.LANCZOS).save(paths[0],quality=94,method=6)
 Image.fromarray(np.uint8(np.clip(packed,0,1)*255+.5)).save(paths[1],lossless=True,method=6)
 for path in paths:runtime.append({'file':path.name,'dimensions':list(size),'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
manifest={'asset':'poly_wool_herringbone','origin':'https://polyhaven.com/a/poly_wool_herringbone','license':'CC0-1.0','license_url':'https://polyhaven.com/license','authors':info['authors'],'source_dimensions':[w,h],'source_encoding':'Linear half-float EXR; native 4K, not upscaled','physical_swatch_mm':info['dimensions'],'source_maps':[{'map':name,'url':files[name]['4k']['exr']['url'],'bytes':(src/(name+'.exr')).stat().st_size,'md5':files[name]['4k']['exr']['md5'],'sha256':hashlib.sha256((src/(name+'.exr')).read_bytes()).hexdigest()} for name in ['Diffuse','nor_gl','Rough']],'runtime_maps':runtime,'black_dye':'Uniform linear multiplier; photographed yarn variations preserved, no invented noise','encoding':'RGB = OpenGL normal XY, roughness B; shader reconstructs normal Z independently of roughness.'}
(output/'suiting-scan-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps(runtime,indent=2))
