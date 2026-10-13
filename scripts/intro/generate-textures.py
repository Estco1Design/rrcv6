"""Deterministic original fine twill normal maps. No photographic content."""
from pathlib import Path
import numpy as np
from PIL import Image
out=Path(__file__).resolve().parents[2]/'public/intro';out.mkdir(exist_ok=True)
n=256;y,x=np.mgrid[0:n,0:n];rng=np.random.default_rng(418)
# Subtle two-over-two twill with individual yarns, not coarse sack weave.
yarn=np.sin(x*np.pi/4)*.23+np.sin(y*np.pi/4)*.23
weave=np.sin((x+y)*np.pi/16)*.17
h=yarn+weave+rng.normal(0,.025,(n,n));dy,dx=np.gradient(h)
z=np.ones_like(h);v=np.stack([-dx,-dy,z],axis=-1);v/=np.linalg.norm(v,axis=-1,keepdims=True);Image.fromarray(np.uint8((v*.5+.5)*255)).save(out/'twill-normal.png',optimize=True)
brush=np.sin(y*1.7)*.06+rng.normal(0,.025,(n,n));dy,dx=np.gradient(brush);v=np.stack([-dx,-dy,np.ones_like(dx)],axis=-1);v/=np.linalg.norm(v,axis=-1,keepdims=True);Image.fromarray(np.uint8((v*.5+.5)*255)).save(out/'titanium-normal.png',optimize=True)
