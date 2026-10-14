"""Original procedural fine worsted twill PBR. Native 2048, not a scan/upscale.
The three maps share yarn geometry, UVs and density. No macroscopic lighting/folds.
"""
from pathlib import Path
import numpy as np
from PIL import Image
out=Path(__file__).resolve().parents[2]/'public/intro'
n=2048; y,x=np.mgrid[:n,:n].astype(np.float32);rng=np.random.default_rng(1409)
pitch=16.; fx=(x%pitch)/pitch;fy=(y%pitch)/pitch
ix=(x//pitch).astype(int);iy=(y//pitch).astype(int)
over=((ix-iy)%4)<2
warp=np.exp(-((fx-.5)/.31)**4);weft=np.exp(-((fy-.5)/.31)**4)
height=np.where(over,.75*warp+.20*weft,.75*weft+.20*warp)
# Independent per-yarn variation avoids a large obvious tiled motif.
w=rng.uniform(.92,1.06,128);v=rng.uniform(.92,1.06,128)
height*=np.where(over,w[ix],v[iy])
fiber=.015*np.sin(x*2.2+y*.08)+.012*np.sin(y*2.1+x*.06)
height+=fiber
albedo=np.clip(40+height*17+np.where(over,w[ix]-1,v[iy]-1)*12,0,255)
rgb=np.stack([albedo*.98,albedo*.99,albedo],-1).astype(np.uint8)
dy,dx=np.gradient(height);normal=np.stack([-dx*1.2,dy*1.2,np.ones_like(height)],-1);normal/=np.linalg.norm(normal,axis=-1,keepdims=True)
rough=np.uint8(np.clip(240-height*16,220,250))
images={'color':Image.fromarray(rgb),'normal':Image.fromarray(np.uint8((normal*.5+.5)*255)),'rough':Image.fromarray(rough)}
for kind,im in images.items():
 # Native originals retained in the resource directory, runtime uses stable mip-friendly sizes.
 im.save(out/f'wool-{kind}-source.png',optimize=True)
 for profile,size in [('desktop',1024 if kind=='color' else 768),('mobile',768 if kind=='color' else 512)]:
  resized=im.resize((size,size),Image.Resampling.LANCZOS)
  if kind=='color':resized.save(out/f'wool-{kind}-{profile}.webp',quality=88)
  else:resized.save(out/f'wool-{kind}-{profile}.png',optimize=True)
print('Wool: original 2048px, desktop 1024/768/768, mobile 768/512/512')
