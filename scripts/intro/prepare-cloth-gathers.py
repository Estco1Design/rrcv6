"""Retain modest secondary gathers from Microsoft's CC0 Maya cloth simulation.
The source technical-fabric MATERIAL is not used. Only surface positions/UVs
are sampled. Main silhouette and large rolled folds remain authored geometry.
"""
from pathlib import Path
import json,hashlib,urllib.request
import numpy as np
from scipy.interpolate import LinearNDInterpolator,NearestNDInterpolator
from scipy.ndimage import gaussian_filter
root=Path(__file__).resolve().parents[2];cache=Path('/tmp/rrc-licensed-cloth');cache.mkdir(exist_ok=True)
base='https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenCloth/'
for name,path in [('SheenCloth.gltf','glTF/SheenCloth.gltf'),('SheenCloth.bin','glTF/SheenCloth.bin'),('README.md','README.md')]:
 if not (cache/name).exists():
  req=urllib.request.Request(base+path,headers={'User-Agent':'RRC-material-review/1.0'})
  (cache/name).write_bytes(urllib.request.urlopen(req,timeout=30).read())
gltf=json.loads((cache/'SheenCloth.gltf').read_text());binary=(cache/'SheenCloth.bin').read_bytes()
assert len(binary)==gltf['buffers'][0]['byteLength']
def array(index):
 a=gltf['accessors'][index];v=gltf['bufferViews'][a['bufferView']];n={'VEC2':2,'VEC3':3}[a['type']]
 return np.frombuffer(binary,'<f4',count=a['count']*n,offset=v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(-1,n)
primitive=gltf['meshes'][0]['primitives'][0];uv=array(primitive['attributes']['TEXCOORD_0']);pos=array(primitive['attributes']['POSITION'])
n=257;y,x=np.mgrid[:n,:n]/(n-1)
height=LinearNDInterpolator(uv,pos[:,1])(x,y)
missing=np.isnan(height);height[missing]=NearestNDInterpolator(uv,pos[:,1])(x[missing],y[missing])
# Decompose global pole/drape height from secondary folds; no random field/noise.
residual=gaussian_filter(height,1)-gaussian_filter(height,11)
field=(.065*np.tanh(residual*16/.065)).astype('<f4')
output=root/'public/intro/cloth-gathers.bin';output.write_bytes(field.tobytes())
manifest={'source':'https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/SheenCloth','author':'Microsoft','license':'CC0-1.0','source_binary_sha256':hashlib.sha256(binary).hexdigest(),'source_vertices':int(len(pos)),'dimensions':[n,n],'runtime_bytes':output.stat().st_size,'runtime_sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'usage':'Only Maya-simulated shape/UV data; procedural Substance Designer material NOT used. Residual Y gathers resampled in UV space, scaled and bounded to 0.065 scene units.'}
(root/'public/intro/cloth-gathers-license.json').write_text(json.dumps(manifest,indent=2)+'\n');print(manifest)
