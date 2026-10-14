"""Convert ambientCG Fabric083 photographic scan to uniformly black suiting.
Native source normals/displacement: 4096², 16-bit PNG. No generated weave/noise.
Black dye replaces broad check coloration while retaining scanned fine fibers.
Requires NumPy, SciPy, Pillow, PyPNG. Original downloads remain outside repository.
"""
from pathlib import Path
import argparse,json,hashlib
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
import png
root=Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--sources',type=Path,required=True);args=p.parse_args();src=args.sources
files={k:src/f'Fabric083_4K-PNG_{suffix}.png' for k,suffix in [('color','Color'),('normal','NormalGL'),('roughness','Roughness'),('displacement','Displacement')]}
color=np.asarray(Image.open(files['color']).convert('RGB'),dtype=np.float32)/255
linear=np.where(color<=.04045,color/12.92,((color+.055)/1.055)**2.4)
luminance=linear@np.array([.2126,.7152,.0722],dtype=np.float32)
# The original yarns have a broad check pattern. Uniform black dye preserves
# photographed fine fiber variation, not their original white/gray pigment.
local=gaussian_filter(luminance,24,mode='wrap')
fiber=np.clip(luminance/np.maximum(local,.005),.25,2.5)**.45
black=np.clip(.026*fiber,.009,.046)
albedo=np.stack([black*.98,black,black*1.025],-1)
srgb=np.where(albedo<=.0031308,albedo*12.92,1.055*albedo**(1/2.4)-.055)
black_color=Image.fromarray(np.uint8(np.clip(srgb,0,1)*255+.5))
w,h,rows,info=png.Reader(filename=str(files['normal'])).asDirect();assert info['bitdepth']==16
normal=np.vstack([np.asarray(row,dtype=np.uint16) for row in rows]).reshape(h,w,info['planes'])[:,:,:3].astype(np.float32)/65535
assert (w,h)==(4096,4096)
rough=np.asarray(Image.open(files['roughness']),dtype=np.float32)/255
output=root/'public/intro';runtime=[]
for profile,width in [('desktop',2048),('mobile',1024)]:
 size=(width,width)
 def resize(a):return np.asarray(Image.fromarray(a).resize(size,Image.Resampling.LANCZOS),dtype=np.float32)
 n=np.stack([resize(normal[:,:,k]) for k in range(3)],-1)*2-1;n/=np.maximum(.00001,np.linalg.norm(n,axis=-1,keepdims=True))
 r=np.clip(resize(rough),0,1);packed=np.stack([n[:,:,0]*.5+.5,n[:,:,1]*.5+.5,r],-1)
 paths=[output/f'suiting-scan-color-{profile}.webp',output/f'suiting-scan-surface-{profile}.webp']
 black_color.resize(size,Image.Resampling.LANCZOS).save(paths[0],quality=95,method=6)
 Image.fromarray(np.uint8(np.clip(packed,0,1)*255+.5)).save(paths[1],lossless=True,method=6)
 for f in paths:runtime.append({'file':f.name,'dimensions':list(size),'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()})
manifest={'asset':'Fabric083','origin':'https://ambientcg.com/view?id=Fabric083','license':'CC0-1.0','license_url':'https://docs.ambientcg.com/license/','author':'ambientCG / Lennart Demes','creation_method':'PBRMultiAngle (height field photogrammetry)','source_dimensions':[4096,4096],'normal_and_displacement_native_bits':16,'physical_dimensions':'Not specified by provider. Artistic UV calibration uses 0.12m tile; not a measured swatch size.','source_maps':[{'map':k,'file':f.name,'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()} for k,f in files.items()],'source_archive':'https://ambientcg.com/get?file=Fabric083_4K-PNG.zip','runtime_maps':runtime,'black_dye':'Uniform black dye replaces broad check pigment, retaining photographed fine luminance variation. Normal and roughness are the original scan, downsampled and packed, never generated.','encoding':'RGB: OpenGL normal XY + linear roughness B. Reconstruct normal Z with Three USE_PACKED_NORMALMAP.'}
(output/'suiting-scan-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps(runtime,indent=2))
