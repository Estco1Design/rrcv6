"""Fit physical cloth drapes to the approved aperture; no material/light bake.
Run: python3 scripts/intro/pack-cloth-rest.py [--sources <Blender output>]
Requires NumPy and SciPy. Geometry smoothing removes small paper-like wrinkles.
"""
from pathlib import Path
import argparse,json,struct,hashlib
import numpy as np
from scipy.ndimage import gaussian_filter
from cloth_template import C,R,template
root=Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--sources',type=Path,default=root/'scripts/model-source/cloth-rest')
native=p.parse_args().sources
profiles=[]
for name,aspect,sign in [('desktop-top',16/9,1),('desktop-bottom',16/9,-1),('mobile-top',390/844,1),('mobile-bottom',390/844,-1)]:
 a=np.fromfile(native/(name+'.bin'),dtype='<f4').reshape(R+1,C+1,3).copy()
 for j in range(R+1):
  v=1-j/R;t=min(1,max(0,v/.20));t=t*t*(3-2*t)
  for i in range(C+1):
   u=i/C;x,y=template(aspect,sign,u,v)
   dx=np.clip((a[j,i,0]-x)/aspect,-.08,.08);dy=np.clip(a[j,i,1]-y,-.12,.12)*t;dz=np.clip((a[j,i,2]-.16)*.65,-.38,.28)
   if j==0 or i in [0,C]:dx=0;dy=0;dz=0
   a[j,i]=[dx,dy,dz]
 for axis in range(3):a[:,:,axis]=gaussian_filter(a[:,:,axis],sigma=(.85,1.1),mode='nearest')
 for j in range(R+1):
  v=1-j/R
  for i in range(C+1):
   u=i/C
   def smooth(x):
    t=max(0,min(1,x));return t*t*(3-2*t)
   a[j,i]*=smooth(u/.075)*smooth((1-u)/.075)*smooth((1-v)/.12)
   if j==R:a[j,i,1]=0
 print(name,'range',a.min((0,1)),a.max((0,1)),flush=True);assert np.all(np.isfinite(a));profiles.append(a)
p=root/'public/intro/cloth-rest.bin';p.write_bytes(struct.pack('<4sHHII',b'RRCD',C,R,4,(C+1)*(R+1))+b''.join(a.astype('<f4').tobytes() for a in profiles))
manifest={'author':'RRC','method':'Blender cloth simulation: compressed pinned exterior, gravity, rounded collision forms, self-collision; original geometry, no photographed shading','columns':C,'rows':R,'frames':56,'profiles':['desktop-top','desktop-bottom','mobile-top','mobile-bottom'],'runtime_bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'geometry_smoothing_cells':[.85,1.1],'adaptation':'In-plane offsets fitted to approved aperture; source depth scaled uniformly. Texture UVs and lighting remain independent.'}
(p.parent/'cloth-rest-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
