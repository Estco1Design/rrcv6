"""Offline heavy-suiting drape, Blender 4.3.2. No runtime physics engine.
Run: blender -b --threads 4 --python scripts/intro/bake-cloth-rest.py
"""
import bpy,math,json,struct,sys,argparse
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
from cloth_template import C,R,template
root=Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--output',type=Path,default=root/'scripts/model-source/cloth-rest')
args=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
out=args.output;out.mkdir(parents=True,exist_ok=True)
def bake(name,aspect,sign):
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 scene=bpy.context.scene;scene.frame_set(1);scene.render.fps=24;scene.gravity=(0,0,-4)
 verts=[];target=[];faces=[];pins=[]
 for j in range(R+1):
  v=1-j/R
  for i in range(C+1):
   u=i/C;x,y=template(aspect,sign,u,v)
   verts.append((x*1.12,y*1.08,.42));target.append((x,y,.16))
   if j==0 or i==0 or i==C:pins.append(len(verts)-1)
 for j in range(R):
  for i in range(C):
   a=j*(C+1)+i;f=(a,a+C+1,a+C+2,a+1);faces.append(f if sign==1 else f[::-1])
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();cloth=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(cloth);bpy.context.view_layer.objects.active=cloth;cloth.select_set(True)
 cloth.shape_key_add(name='Rest');key=cloth.shape_key_add(name='Compressed edge supports')
 for p,co in zip(key.data,target):p.co=co
 key.value=0;key.keyframe_insert('value',frame=1);key.value=1;key.keyframe_insert('value',frame=24)
 group=cloth.vertex_groups.new(name='Fixed outer perimeter');group.add(pins,1,'REPLACE')
 mod=cloth.modifiers.new('Heavy suiting drape','CLOTH');s=mod.settings;s.quality=7;s.mass=.35;s.air_damping=8;s.tension_stiffness=30;s.compression_stiffness=20;s.shear_stiffness=15;s.bending_stiffness=.65;s.tension_damping=8;s.compression_damping=8;s.shear_damping=8;s.bending_damping=2;s.vertex_group_mass=group.name;s.pin_stiffness=1
 cs=mod.collision_settings;cs.use_collision=True;cs.collision_quality=3;cs.distance_min=.004;cs.friction=8;cs.use_self_collision=True;cs.self_distance_min=.006;cs.self_friction=8
 mod.point_cache.frame_start=1;mod.point_cache.frame_end=56
 # Rounded studio forms create real contact drape; supports are not exported.
 for x,y,z,sx,sy,sz,angle in [(-.25*aspect,sign*.78,.065,.9*aspect,.075,.085,sign*.16),(.5*aspect,sign*.9,.035,.55*aspect,.07,.08,-sign*.3),(-.55*aspect,sign*.40,.03,.30*aspect,.06,.10,-sign*.5)]:
  bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=24,location=(x,y,z));o=bpy.context.object;o.scale=(sx,sy,sz*min(1,aspect/.9));o.rotation_euler.z=angle;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.modifiers.new('Cloth contact','COLLISION');o.collision.thickness_outer=.003
 for frame in range(1,57):
  scene.frame_set(frame);bpy.context.view_layer.update()
  if frame%14==0:print(name,'frame',frame,flush=True)
 deps=bpy.context.evaluated_depsgraph_get();evaluated=cloth.evaluated_get(deps);data=evaluated.to_mesh();positions=[tuple(v.co) for v in data.vertices];assert len(positions)==len(verts)
 (out/(name+'.bin')).write_bytes(struct.pack('<'+'f'*(len(positions)*3),*(x for v in positions for x in v)))
 evaluated.to_mesh_clear();print('BAKED',name,len(positions),flush=True)
for name,aspect,sign in [('desktop-top',16/9,1),('desktop-bottom',16/9,-1),('mobile-top',390/844,1),('mobile-bottom',390/844,-1)]:bake(name,aspect,sign)
(out/'source.json').write_text(json.dumps({'columns':C,'rows':R,'profiles':{'desktop':16/9,'mobile':390/844},'frames':56,'author':'RRC offline Blender cloth simulation','pins':'outer and side edges','license':'Original project geometry; no third-party model'},indent=2))
