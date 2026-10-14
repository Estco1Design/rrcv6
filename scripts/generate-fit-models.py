"""Adult CC0 anatomical references, permanently censored before export.
Run: blender -b --threads 4 --python scripts/generate-fit-models.py
The mesh and target sources are retained under scripts/model-source (CC0).
"""
import bpy,math,json,random
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1];source=root/'scripts/model-source'

def read_source():
 verts=[];uv=[];faces=[];group=''
 for line in (source/'base.obj').read_text().splitlines():
  if line.startswith('v '):verts.append(Vector(tuple(float(x) for x in line.split()[1:4])))
  elif line.startswith('vt '):uv.append(tuple(float(x) for x in line.split()[1:3]))
  elif line.startswith('g '):group=line[2:].strip()
  elif line.startswith('f ') and group=='body':faces.append(tuple(int(x.split('/')[0])-1 for x in line.split()[1:]))
 return verts,faces

def target(verts,name,weight):
 for line in (source/name).read_text().splitlines():
  if not line.strip() or line.startswith('#'):continue
  idx,x,y,z=line.split();verts[int(idx)]+=Vector((float(x)*weight,float(y)*weight,float(z)*weight))

def censor_region(v):
 x,y,z=v
 return (y>2.98 and z>-.005) or (2.30<y<2.68 and abs(x)<.49) or (1.32<y<1.92 and abs(x)<.49)

def make(kind):
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 verts,faces=read_source()
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
 # Faces under the mosaic are discarded. Exporting the GLB does not reveal an uncensored mesh.
 visible_faces=[]
 for face in faces:
  centroid=sum((normalized[i] for i in face),Vector())/len(face)
  if not censor_region(centroid):visible_faces.append(face)
 mesh=bpy.data.meshes.new(kind+'_anatomy');mesh.from_pydata([(v.x,-v.z,v.y) for v in normalized],[],visible_faces);mesh.update();body=bpy.data.objects.new('RRC_'+kind+'_adult_reference',mesh);bpy.context.collection.objects.link(body)
 bpy.context.view_layer.objects.active=body;body.select_set(True)
 # Keep smooth anatomical curvature and the original hands/feet topology.
 sub=body.modifiers.new('Anatomical surface','SUBSURF');sub.levels=1;sub.render_levels=1;bpy.ops.object.modifier_apply(modifier=sub.name)
 for polygon in body.data.polygons:polygon.use_smooth=True
 colors=body.data.color_attributes.new(name='Skin',type='FLOAT_COLOR',domain='POINT')
 random.seed(71 if kind=='male' else 92)
 for i,vertex in enumerate(body.data.vertices):
  x,y,z=vertex.co
  variation=.012*math.sin(x*68+z*73)+.008*math.sin(z*157)+random.uniform(-.005,.005)
  # Subtle dermal color variation; no painted identity or uncensored facial texture.
  colors.data[i].color=(.60+variation,.39+variation*.6,.29+variation*.4,1)
 skin=bpy.data.materials.new('Adult reference skin');skin.use_nodes=True
 nodes=skin.node_tree.nodes;bsdf=nodes.get('Principled BSDF');attr=nodes.new('ShaderNodeVertexColor');attr.layer_name='Skin';skin.node_tree.links.new(attr.outputs['Color'],bsdf.inputs['Base Color']);bsdf.inputs['Roughness'].default_value=.67;bsdf.inputs['Subsurface Weight'].default_value=.05;body.data.materials.append(skin)
 body['measurementGuides']=json.dumps(guides)
 # Opaque three-dimensional mosaic shells. All rotations remain covered.
 pixel_verts=[];pixel_faces=[];pixel_colors=[]
 # Voxelize the censored surface rather than wrapping the body in rectangular boxes.
 # One neighboring voxel layer gives conservative opaque coverage at all angles.
 step=.058;occupied=set()
 for face in faces:
  points=[normalized[i] for i in face];centroid=sum(points,Vector())/len(points)
  if not censor_region(centroid):continue
  for point in points+[centroid]:
   cell=tuple(math.floor(coordinate/step) for coordinate in point)
   for dx,dy,dz in [(0,0,0),(1,0,0),(-1,0,0),(0,1,0),(0,-1,0),(0,0,1),(0,0,-1)]:occupied.add((cell[0]+dx,cell[1]+dy,cell[2]+dz))
 for ix,iy,iz in sorted(occupied):
  x,y,z=ix*step,iy*step,iz*step;size=step*1.005;off=len(pixel_verts)
  pixel_verts.extend((x+dx*size,-(z+dz*size),y+dy*size) for dx,dy,dz in [(0,0,0),(1,0,0),(1,1,0),(0,1,0),(0,0,1),(1,0,1),(1,1,1),(0,1,1)])
  shade=random.uniform(.32,.62);pixel_colors.extend([(shade,shade*.97,shade*.94,1)]*8)
  pixel_faces.extend(tuple(off+i for i in face) for face in [(0,3,2,1),(4,5,6,7),(0,1,5,4),(3,7,6,2),(0,4,7,3),(1,2,6,5)])
 pm=bpy.data.meshes.new('Permanent privacy mosaic');pm.from_pydata(pixel_verts,[],pixel_faces);pm.update();pixels=bpy.data.objects.new('PixelPrivacy',pm);bpy.context.collection.objects.link(pixels);pixels['censored']=True
 attr=pm.color_attributes.new(name='Mosaic',type='FLOAT_COLOR',domain='POINT')
 for i,color in enumerate(pixel_colors):attr.data[i].color=color
 mat=bpy.data.materials.new('Opaque privacy pixels');mat.use_nodes=True;n=mat.node_tree.nodes;bsdf=n.get('Principled BSDF');color=n.new('ShaderNodeVertexColor');color.layer_name='Mosaic';mat.node_tree.links.new(color.outputs['Color'],bsdf.inputs['Base Color']);bsdf.inputs['Roughness'].default_value=1;pm.materials.append(mat)
 bpy.ops.object.select_all(action='DESELECT');body.select_set(True);pixels.select_set(True)
 dest=root/'public/models'/f'fit-{kind}.glb';bpy.ops.export_scene.gltf(filepath=str(dest),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_extras=True)
 # A censored white-background fallback uses exactly the same meshes.
 bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.005));floor=bpy.context.object;floor.name='White studio';white=bpy.data.materials.new('White');white.diffuse_color=(1,1,1,1);floor.data.materials.append(white)
 world=bpy.context.scene.world;world.use_nodes=True;world.node_tree.nodes.get('Background').inputs['Color'].default_value=(1,1,1,1);world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.8
 for position,power,size in [((3,-4,5),450,5),((-3,-2,3),250,4),((0,3,5),350,4)]:
  bpy.ops.object.light_add(type='AREA',location=position);light=bpy.context.object;light.data.energy=power;light.data.shape='DISK';light.data.size=size;light.rotation_euler=(Vector((0,0,1.8))-light.location).to_track_quat('-Z','Y').to_euler()
 bpy.ops.object.camera_add(location=(0,-6.8,1.72));camera=bpy.context.object;camera.rotation_euler=(Vector((0,0,1.72))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=55
 scene=bpy.context.scene;scene.camera=camera;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=False;scene.render.resolution_x=576;scene.render.resolution_y=896;scene.render.resolution_percentage=100;scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG';scene.render.filepath=str(root/'public/images/atelier'/f'fit-reference-{kind}.png');bpy.ops.render.render(write_still=True)
 print(kind,'GLB bytes',dest.stat().st_size,'guides',guides)
for kind in ['male','female']:make(kind)
