"""Create original atelier mannequins. Run: blender -b --python scripts/generate-fit-models.py
The GLB assets are shipped; Blender is only required to edit/regenerate the sculpture.
"""
import bpy,math
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1]

def ellipsoid(name,center,scale):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=20,location=center)
 ob=bpy.context.object;ob.name=name;ob.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return ob

def loft(name,sections):
 # Interpolate the anatomical sections before meshing: no angular chest/waist bands.
 original=sections;sections=[]
 for j in range(len(original)-1):
  a=original[max(j-1,0)];b=original[j];c=original[j+1];d=original[min(j+2,len(original)-1)]
  for k in range(6):
   t=k/6
   sections.append(tuple(.5*((2*b[i])+(-a[i]+c[i])*t+(2*a[i]-5*b[i]+4*c[i]-d[i])*t*t+(-a[i]+3*b[i]-3*c[i]+d[i])*t*t*t) for i in range(5)))
 sections.append(original[-1])
 verts=[];faces=[];n=48
 for x,y,z,rx,rz in sections:
  for i in range(n):
   t=i/n*math.tau;verts.append((x+rx*math.cos(t),y,z+rz*math.sin(t)))
 for j in range(len(sections)-1):
  for i in range(n):faces.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
 faces.append(tuple(range(n-1,-1,-1)));faces.append(tuple((len(sections)-1)*n+i for i in range(n)))
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();ob=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(ob);return ob

def make(kind):
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 female=kind=='female';parts=[]
 shoulder=.34 if female else .405
 torso=[(0,1.48,0,.12,.11),(0,1.60,0,.27,.17),(0,1.74,-.01,.335 if female else .29,.205),(0,1.90,0,.29 if female else .275,.185),(0,2.06,0,.22 if female else .245,.15),(0,2.22,0,.245 if female else .29,.175),(0,2.38,0,.29 if female else .345,.205),(0,2.53,0,.315 if female else .375,.20),(0,2.65,0,shoulder,.18),(0,2.75,0,.25,.13),(0,2.81,0,.115,.105)]
 parts.append(loft('Torso',torso));parts.append(ellipsoid('Neck',(0,2.88,0),(.108,.16,.105)))
 parts.append(ellipsoid('Cranium',(0,3.16,-.005),(.163,.238,.174)))
 parts.append(ellipsoid('Jaw',(0,3.02,.042),(.123,.115,.112)))
 # Featureless couture head: a quiet facial plane, no photorealistic identity.
 parts.append(ellipsoid('Face',(0,3.12,.095),(.119,.175,.10)))
 for side in [-1,1]:
  if female:parts.append(ellipsoid('Chest',(side*.145,2.43,.14),(.14,.15,.09)))
  parts.append(ellipsoid('Scapula',(side*.18,2.48,-.12),(.16,.19,.09)))
  parts.append(ellipsoid('Seat',(side*.145,1.72,-.105),(.19 if female else .16,.205,.17)))
  parts.append(ellipsoid('Deltoid',(side*shoulder,2.60,0),(.13 if female else .15,.17,.135)))
  # Lofted limbs follow the subtle A-pose with tapered elbow/wrist articulation.
  parts.append(loft('Arm',[(side*(shoulder+.01),2.65,0,.115,.115),(side*(shoulder+.065),2.48,0,.11,.115),(side*(shoulder+.12),2.25,.005,.086,.09),(side*(shoulder+.15),2.13,.008,.071,.075),(side*(shoulder+.175),2.00,.015,.082,.083),(side*(shoulder+.21),1.80,.02,.065,.061),(side*(shoulder+.235),1.66,.03,.047,.044)]))
  wrist=shoulder+.235
  parts.append(ellipsoid('Palm',(side*(wrist+.025),1.56,.032),(.066,.115,.04)))
  for i in range(4):
   xx=side*(wrist-.023+i*.032);yy=1.43+(abs(i-1.3)*.018)
   parts.append(ellipsoid('Finger',(xx,yy,.038),(.014,.08-abs(i-1.3)*.009,.014)))
  parts.append(ellipsoid('Thumb',(side*(wrist-.064),1.535,.038),(.033,.065,.027)))
  parts.append(loft('Leg',[(side*.165,1.72,-.005,.17 if female else .155,.17),(side*.17,1.54,0,.169,.176),(side*.19,1.30,.006,.144,.148),(side*.20,1.08,.02,.102,.103),(side*.20,.93,.016,.088,.093),(side*.21,.79,-.025,.107,.11),(side*.215,.63,-.036,.108,.11),(side*.215,.43,-.015,.085,.085),(side*.215,.19,.015,.052,.06)]))
  parts.append(ellipsoid('Patella',(side*.20,.94,.065),(.079,.085,.06)))
  parts.append(ellipsoid('Foot',(side*.215,.105,.10),(.085,.085,.18)))
  for i in range(5):parts.append(ellipsoid('Toe',(side*(.165+i*.022),.075,.235-abs(i)*.01),(.025,.034,.056-i*.004)))
 bpy.ops.object.select_all(action='DESELECT')
 for ob in parts:ob.select_set(True)
 bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();body=bpy.context.object;body.name='RRC_'+kind+'_couture_sculpture'
 # A single watertight remesh removes intersecting primitive seams; smooth is a sculpting pass.
 mod=body.modifiers.new('Continuous anatomy','REMESH');mod.mode='VOXEL';mod.voxel_size=.009;mod.use_smooth_shade=True;bpy.ops.object.modifier_apply(modifier=mod.name)
 mod=body.modifiers.new('Sculpt polish','SMOOTH');mod.factor=.85;mod.iterations=12;bpy.ops.object.modifier_apply(modifier=mod.name)
 mod=body.modifiers.new('Mobile topology','DECIMATE');mod.ratio=.42;bpy.ops.object.modifier_apply(modifier=mod.name)
 for poly in body.data.polygons:poly.use_smooth=True
 # We model with vertical Y for Three.js; GLTF exporter converts Blender's Z up, so rotate geometry.
 for vertex in body.data.vertices:
  x,y,z=vertex.co;vertex.co=(x,-z,y)
 body.data.update()
 mat=bpy.data.materials.new('RRC graphite ceramic');mat.diffuse_color=(.19,.20,.215,1);mat.use_nodes=True
 bsdf=mat.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Base Color'].default_value=(.19,.20,.215,1);bsdf.inputs['Metallic'].default_value=.88;bsdf.inputs['Roughness'].default_value=.24;body.data.materials.append(mat)
 dest=root/'public/models'/f'fit-{kind}.glb';dest.parent.mkdir(parents=True,exist_ok=True)
 bpy.ops.export_scene.gltf(filepath=str(dest),export_format='GLB',use_selection=True,export_apply=True,export_yup=True)
 print(kind,'vertices',len(body.data.vertices),'bytes',dest.stat().st_size)
for kind in ['male','female']:make(kind)
