"""Adult CC0 anatomical references with continuous anatomy and native UVs.
Run: blender -b --threads 4 --python scripts/generate-fit-models.py
The mesh and target sources are retained under scripts/model-source (CC0).
"""
import bpy,json,struct
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1];source=root/'scripts/model-source'

def read_source():
 verts=[];uv=[];faces=[];uvfaces=[];group=''
 for line in (source/'base.obj').read_text().splitlines():
  if line.startswith('v '):verts.append(Vector(tuple(float(x) for x in line.split()[1:4])))
  elif line.startswith('vt '):uv.append(tuple(float(x) for x in line.split()[1:3]))
  elif line.startswith('g '):group=line[2:].strip()
  elif line.startswith('f ') and group=='body':
   faces.append(tuple(int(x.split('/')[0])-1 for x in line.split()[1:]));uvfaces.append(tuple(int(x.split('/')[1])-1 for x in line.split()[1:]))
 return verts,faces,uv,uvfaces

def target(verts,name,weight):
 for line in (source/name).read_text().splitlines():
  if not line.strip() or line.startswith('#'):continue
  idx,x,y,z=line.split();verts[int(idx)]+=Vector((float(x)*weight,float(y)*weight,float(z)*weight))

def make(kind):
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 verts,faces,uv,uvfaces=read_source()
 for race in ['african','asian','caucasian']:target(verts,f'{race}-{kind}-young.target',1/3)
 target(verts,f'universal-{kind}-young-averagemuscle-averageweight.target',1)
 if kind=='female':target(verts,'female-young-averagemuscle-averageweight-averagecup-maxfirmness.target',.5)
 used=set(i for face in faces for i in face);low=min(verts[i].y for i in used);high=max(verts[i].y for i in used);scale=3.4/(high-low)
 normalized=[Vector((v.x*scale,(v.y-low)*scale,v.z*scale)) for v in verts]
 # Center the torso, not the forward-reaching toes.
 torso=[v.z for i,v in enumerate(normalized) if i in used and 2.0<v.y<2.7 and abs(v.x)<.4]
 centre=(min(torso)+max(torso))/2
 for v in normalized:v.z-=centre
 def slice_guide(y,max_x=.48):
  points=[normalized[i] for i in used if abs(normalized[i].y-y)<.035 and abs(normalized[i].x)<max_x]
  if not points:return {'y':y,'rx':.3,'rz':.23,'z':0}
  return {'y':y,'rx':max(abs(v.x) for v in points)+.025,'rz':(max(v.z for v in points)-min(v.z for v in points))/2+.025,'z':(max(v.z for v in points)+min(v.z for v in points))/2}
 guides={key:slice_guide(y) for key,y in [('neck',2.92),('chest',2.52),('waist',2.09),('hips',1.76)]}
 # Preserve complete anatomy: removing the old mosaic alone leaves holes.
 mesh=bpy.data.meshes.new(kind+'_anatomy');mesh.from_pydata([(v.x,-v.z,v.y) for v in normalized],[],faces);mesh.update();body=bpy.data.objects.new('RRC_'+kind+'_adult_reference',mesh);bpy.context.collection.objects.link(body)
 layer=mesh.uv_layers.new(name='MakeHuman UV')
 for polygon,indices in zip(mesh.polygons,uvfaces):
  for loop,index in zip(polygon.loop_indices,indices):layer.data[loop].uv=uv[index]
 bpy.context.view_layer.objects.active=body;body.select_set(True)
 # Keep smooth anatomical curvature and the original hands/feet topology.
 sub=body.modifiers.new('Anatomical surface','SUBSURF');sub.levels=1;sub.render_levels=1;bpy.ops.object.modifier_apply(modifier=sub.name)
 for polygon in body.data.polygons:polygon.use_smooth=True
 # Licensed native 2048px skins; no generated skin noise or enlarged images.
 skin=bpy.data.materials.new('CC0 '+kind+' skin');skin.use_nodes=True
 nodes=skin.node_tree.nodes;bsdf=nodes.get('Principled BSDF');tex=nodes.new('ShaderNodeTexImage')
 filename='Aksel_Skin_diffuse.png' if kind=='male' else 'Young_Female_Hairless.png'
 tex.image=bpy.data.images.load(str(source/'skins'/kind/filename));tex.image.pixels[0];tex.image.file_format='JPEG';tex.image.filepath_raw=str(root/'public/models'/f'fit-{kind}-skin.jpg');tex.image.save(quality=92);skin.node_tree.links.new(tex.outputs['Color'],bsdf.inputs['Base Color']);bsdf.inputs['Roughness'].default_value=.68;bsdf.inputs['Specular IOR Level'].default_value=.22;bsdf.inputs['Subsurface Weight'].default_value=.04
 if kind=='male':
  normal=nodes.new('ShaderNodeTexImage');normal.image=bpy.data.images.load(str(source/'skins/male/Aksel_Skin_NRM.png'));normal.image.colorspace_settings.name='Non-Color';normal.image.scale(1024,1024);convert=nodes.new('ShaderNodeNormalMap');convert.inputs['Strength'].default_value=.4;skin.node_tree.links.new(normal.outputs['Color'],convert.inputs['Color']);skin.node_tree.links.new(convert.outputs['Normal'],bsdf.inputs['Normal'])
 body.data.materials.append(skin)
 body['measurementGuides']=json.dumps(guides)
 # Licensed CC0 fitted eyes: barycentric binding follows the adult targets.
 mapping=[];axis_scale={};reading=False
 for line in (source/'eyes/eyes.mhclo').read_text().splitlines():
  if line.startswith(('x_scale','y_scale','z_scale')):
   key,a,b,d=line.split();axis='xyz'.index(key[0]);axis_scale[axis]=abs(verts[int(a)][axis]-verts[int(b)][axis])/float(d)
  elif line.startswith('verts '):reading=True
  elif reading and line and not line.startswith('#'):
   bits=line.split()
   if len(bits)!=9:break
   ids=[int(x) for x in bits[:3]];w=[float(x) for x in bits[3:6]];offset=Vector(tuple(float(bits[6+i])*axis_scale.get(i,1) for i in range(3)))
   point=sum((verts[i]*weight for i,weight in zip(ids,w)),Vector())+offset
   mapping.append((point.x*scale,-(point.z*scale-centre),(point.y-low)*scale))
 eye_uv=[];eye_faces=[];eye_uvfaces=[]
 for line in (source/'eyes/eyes.obj').read_text().splitlines():
  if line.startswith('vt '):eye_uv.append(tuple(float(x) for x in line.split()[1:3]))
  elif line.startswith('f '):
   eye_faces.append(tuple(int(x.split('/')[0])-1 for x in line.split()[1:]));eye_uvfaces.append(tuple(int(x.split('/')[1])-1 for x in line.split()[1:]))
 em=bpy.data.meshes.new('Fitted CC0 eyes');em.from_pydata(mapping,[],eye_faces);em.update();eyes=bpy.data.objects.new('Adult eyes',em);bpy.context.collection.objects.link(eyes)
 layer=em.uv_layers.new(name='Eye UV')
 for polygon,indices in zip(em.polygons,eye_uvfaces):
  polygon.use_smooth=True
  for loop,index in zip(polygon.loop_indices,indices):layer.data[loop].uv=eye_uv[index]
 eye_material=bpy.data.materials.new('CC0 brown eyes');eye_material.use_nodes=True;bsdf=eye_material.node_tree.nodes.get('Principled BSDF');tex=eye_material.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(source/'eyes/brown-eye.png'));eye_material.node_tree.links.new(tex.outputs['Color'],bsdf.inputs['Base Color']);eye_material.node_tree.links.new(tex.outputs['Alpha'],bsdf.inputs['Alpha']);eye_material.surface_render_method='DITHERED';bsdf.inputs['Roughness'].default_value=.23;em.materials.append(eye_material)
 bpy.ops.object.select_all(action='DESELECT');body.select_set(True);eyes.select_set(True)
 dest=root/'public/models'/f'fit-{kind}.glb';bpy.ops.export_scene.gltf(filepath=str(dest),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_extras=True,export_image_format='AUTO',export_jpeg_quality=92)
 # The source eye atlas has zero-alpha cornea UVs. Preserve PNG alpha and
 # cut out that shell: JPEG/opaque export hides the real iris behind blue disks.
 raw=dest.read_bytes();length=struct.unpack_from('<I',raw,12)[0];document=json.loads(raw[20:20+length])
 for item in document.get('materials',[]):
  if 'brown eyes' in item.get('name',''):item['alphaMode']='MASK';item['alphaCutoff']=.1
 encoded=json.dumps(document,separators=(',',':')).encode();encoded+=b' '*((-len(encoded))%4);tail=raw[20+length:]
 dest.write_bytes(struct.pack('<III',0x46546C67,2,20+len(encoded)+len(tail))+struct.pack('<II',len(encoded),0x4E4F534A)+encoded+tail)
 # A white-background fallback uses exactly the same continuous mesh.
 bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.005));floor=bpy.context.object;floor.name='White studio';white=bpy.data.materials.new('White');white.diffuse_color=(1,1,1,1);floor.data.materials.append(white)
 world=bpy.context.scene.world;world.use_nodes=True;world.node_tree.nodes.get('Background').inputs['Color'].default_value=(1,1,1,1);world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.8
 for position,power,size in [((3,-4,5),450,5),((-3,-2,3),250,4),((0,3,5),350,4)]:
  bpy.ops.object.light_add(type='AREA',location=position);light=bpy.context.object;light.data.energy=power;light.data.shape='DISK';light.data.size=size;light.rotation_euler=(Vector((0,0,1.8))-light.location).to_track_quat('-Z','Y').to_euler()
 bpy.ops.object.camera_add(location=(0,-6.8,1.72));camera=bpy.context.object;camera.rotation_euler=(Vector((0,0,1.72))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=55
 scene=bpy.context.scene;scene.camera=camera;scene.render.engine='CYCLES';scene.cycles.samples=64;scene.cycles.use_denoising=False;scene.render.resolution_x=576;scene.render.resolution_y=896;scene.render.resolution_percentage=100;scene.view_settings.view_transform='AgX';scene.render.film_transparent=True;bpy.data.objects.remove(floor,do_unlink=True);scene.render.image_settings.color_mode='RGBA';scene.render.image_settings.file_format='PNG';scene.render.filepath=str(root/'public/images/atelier'/f'fit-reference-{kind}.png');bpy.ops.render.render(write_still=True)
 print(kind,'GLB bytes',dest.stat().st_size,'guides',guides)
for kind in ['male','female']:make(kind)
