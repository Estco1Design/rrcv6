"""CC0 MakeHuman rigging, real macro morphs and fitted hair-card preparation."""
import bpy,json,math
from mathutils import Vector,Matrix

def rig_and_morph(body,normalized,variants,source,scale,low,centre):
 spec=json.loads((source/'rig/default.mhskel').read_text());weights=json.loads((source/'rig/weights.default.json').read_text())['weights']
 arm=bpy.data.armatures.new('MakeHuman CC0 adult skeleton');rig=bpy.data.objects.new('AdultRig',arm);bpy.context.collection.objects.link(rig)
 bpy.context.view_layer.objects.active=rig;rig.select_set(True);body.select_set(False);bpy.ops.object.mode_set(mode='EDIT')
 def joint(name):
  vs=spec['joints'][name];p=sum((normalized[i] for i in vs),Vector())/len(vs);return Vector((p.x,-p.z,p.y))
 for name,b in spec['bones'].items():
  bone=arm.edit_bones.new(name);bone.head=joint(b['head']);bone.tail=joint(b['tail'])
  if (bone.tail-bone.head).length<.00001:bone.tail.z+=.01
 for name,b in spec['bones'].items():
  if b['parent']:arm.edit_bones[name].parent=arm.edit_bones[b['parent']]
  plane=spec['planes'].get(b.get('rotation_plane'))
  if plane:
   a,c,d=[joint(p) for p in plane];n=(c-a).cross(d-a)
   if n.length>.000001:arm.edit_bones[name].align_roll(n)
 bpy.ops.object.mode_set(mode='OBJECT')
 for name,values in weights.items():
  group=body.vertex_groups.new(name=name)
  for index,weight in values:
   if weight>.00001:group.add([index],weight,'REPLACE')
 # Bounded natural arm clearance, with a small relaxed elbow bend. Pose every
 # variant through the same anatomical weights, not a world-axis mesh scale.
 def pose(angle):
  for pb in rig.pose.bones:pb.rotation_mode='QUATERNION';pb.rotation_quaternion.identity()
  for side,sign in [('L',1),('R',-1)]:
   for name,a,axis in [('upperarm01',sign*angle,'Y'),('lowerarm01',-.055,'X'),('wrist',-.025,'X')]:
    pb=rig.pose.bones[name+'.'+side];basis=pb.bone.matrix_local.to_3x3();rot=Matrix.Rotation(a,3,axis);pb.rotation_quaternion=(basis.inverted()@rot@basis).to_quaternion()
  bpy.context.view_layer.update()
 original=[v.co.copy() for v in body.data.vertices];baked={}
 for name,coords in [('Basis',None)]+list(variants.items()):
  obj=body.copy();obj.data=body.data.copy();bpy.context.collection.objects.link(obj)
  if coords is not None:
   for v,p in zip(obj.data.vertices,coords):v.co=(p.x,-p.z,p.y)
  pose(math.radians(33 if name!='Full' else 28))
  modifier=obj.modifiers.new('Anatomical weighted rest pose','ARMATURE');modifier.object=rig
  sub=obj.modifiers.new('Anatomical surface','SUBSURF');sub.levels=1;sub.render_levels=1
  bpy.context.view_layer.objects.active=obj
  for mod in list(obj.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
  baked[name]=[v.co.copy() for v in obj.data.vertices]
  if name=='Basis':base=obj
  else:bpy.data.objects.remove(obj,do_unlink=True)
 bpy.data.objects.remove(body,do_unlink=True);body=base;body.name='Adult anatomical reference'
 for name,coords in baked.items():
  key=body.shape_key_add(name=name)
  for v,p in zip(key.data,coords):v.co=p
 pose(math.radians(33));bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='POSE');bpy.ops.pose.armature_apply(selected=False);bpy.ops.object.mode_set(mode='OBJECT')
 # Retain a real neutral-rest skeleton and skinning, ready for later poses.
 mod=body.modifiers.new('CC0 anatomy rig','ARMATURE');mod.object=rig
 body.parent=rig;body['morphSource']='MakeHuman native minweight/maxweight adult macro targets; bounded display range'
 return body,rig

def fitted_hair(kind,verts,scale,low,centre,source,destination):
 paths=[]
 for style in ['short01','bob01','ponytail01']:
  folder=source/'hair'/style;mapping=[];scales={};reading=False
  for line in (folder/(style+'.mhclo')).read_text().splitlines():
   if line.startswith(('x_scale','y_scale','z_scale')):
    key,a,b,d=line.split();axis='xyz'.index(key[0]);scales[axis]=abs(verts[int(a)][axis]-verts[int(b)][axis])/float(d)
   elif line.startswith('verts '):reading=True
   elif reading and line and not line.startswith('#'):
    bits=line.split()
    if len(bits)!=9:
     if mapping:break
     continue
    ids=[int(x) for x in bits[:3]];w=[float(x) for x in bits[3:6]];offset=Vector(tuple(float(bits[6+i])*scales.get(i,1) for i in range(3)))
    p=sum((verts[i]*a for i,a in zip(ids,w)),Vector())+offset;mapping.append((p.x*scale,-(p.z*scale-centre),(p.y-low)*scale))
  uv=[];faces=[];uvfaces=[]
  for line in (folder/(style+'.obj')).read_text().splitlines():
   if line.startswith('vt '):uv.append(tuple(float(x) for x in line.split()[1:3]))
   elif line.startswith('f '):
    faces.append(tuple(int(x.split('/')[0])-1 for x in line.split()[1:]));uvfaces.append(tuple(int(x.split('/')[1])-1 for x in line.split()[1:]))
  mesh=bpy.data.meshes.new(style);mesh.from_pydata(mapping,[],faces);mesh.update();obj=bpy.data.objects.new(style,mesh);bpy.context.collection.objects.link(obj)
  layer=mesh.uv_layers.new(name='Native hair UV')
  for polygon,indices in zip(mesh.polygons,uvfaces):
   polygon.use_smooth=True
   for loop,index in zip(polygon.loop_indices,indices):layer.data[loop].uv=uv[index]
  mat=bpy.data.materials.new('CC0 MakeHuman '+style);mat.use_nodes=True;nodes=mat.node_tree.nodes;bsdf=nodes.get('Principled BSDF');tex=nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(folder/(style+'_diffuse.png')));tex.image.scale(1024,1024)
  mat.node_tree.links.new(tex.outputs['Color'],bsdf.inputs['Base Color']);mat.node_tree.links.new(tex.outputs['Alpha'],bsdf.inputs['Alpha']);bsdf.inputs['Roughness'].default_value=.72;bsdf.inputs['Specular IOR Level'].default_value=.2;mat.surface_render_method='DITHERED';mat.use_backface_culling=False;mesh.materials.append(mat)
  bpy.ops.object.select_all(action='DESELECT');obj.select_set(True)
  path=destination/f'hair-{kind}-{style}.glb';bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_yup=True,export_image_format='AUTO');paths.append(path)
  bpy.data.objects.remove(obj,do_unlink=True)
 return paths
