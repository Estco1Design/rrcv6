"""Original bevelled titanium tailor's shears. No external model dependencies.
Blender: blender -b --python scripts/intro/generate-shears.py
Coordinates use Blender XZ plane, converted to Three.js XY by glTF exporter.
The two arm origins coincide at the bolt. Lower cutting blade sits below cloth.
"""
import bpy,math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'public/intro';OUT.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def metal(name,color,rough):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=1;p.inputs['Roughness'].default_value=rough;return m
body=metal('Brushed titanium',(.49,.49,.46),.29);edge=metal('Polished cutting bevel',(.65,.65,.62),.19);bolt=metal('Pivot titanium',(.40,.40,.38),.24)
def group(name):
 obj=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(obj);return obj
upper=group('UpperArm');lower=group('LowerArm')
def mesh(name,verts,faces,mat,parent,bevel=.015):
 # Input XY design mapped to X,-depth,Y: glTF turns it back into XY,depth.
 coords=[(x,-z,y) for x,y,z in verts];data=bpy.data.meshes.new(name+' geometry');data.from_pydata(coords,[],faces);data.update()
 uv=data.uv_layers.new(name='Machining UV')
 for polygon in data.polygons:
  axis=max(range(3),key=lambda i:abs(polygon.normal[i]));axes=[i for i in range(3) if i!=axis]
  for loop_index in polygon.loop_indices:
   vertex=data.vertices[data.loops[loop_index].vertex_index].co
   uv.data[loop_index].uv=(vertex[axes[0]]*.7+.5,vertex[axes[1]]*.7+.5)
 obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);obj.data.materials.append(mat);obj.parent=parent
 if bevel:
  b=obj.modifiers.new('Soft machined edges','BEVEL');b.width=bevel;b.segments=6
  b=obj.modifiers.new('Weighted metal normals','WEIGHTED_NORMAL');b.keep_sharp=True
 for p in data.polygons:p.use_smooth=True
 return obj

def outline(name,points,depth,mat,parent,thick=.045,bevel=.012):
 n=len(points);verts=[(x,y,depth+z) for z in [-thick/2,thick/2] for x,y in points];faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)];return mesh(name,verts,faces,mat,parent,bevel)

def handle(sign,parent):
 n=96;verts=[];angle=-sign*.18
 for depth in [.14,.195]:
  for inner in [False,True]:
   for i in range(n):
    a=2*math.pi*i/n;rx=(.39 if sign>0 else .48) if not inner else (.31 if sign>0 else .395);ry=(.225 if sign>0 else .26) if not inner else (.151 if sign>0 else .185)
    x=rx*math.cos(a);y=ry*math.sin(a)
    verts.append((-.74+x*math.cos(angle)-y*math.sin(angle),sign*.295+x*math.sin(angle)+y*math.cos(angle),depth))
 faces=[]
 for i in range(n):
  j=(i+1)%n
  faces.extend([(i,j,j+n,i+n),(i+2*n,i+3*n,j+3*n,j+2*n),(i,i+2*n,j+2*n,j),(i+n,j+n,j+3*n,i+3*n)])
 mesh(('Upper' if sign>0 else 'Lower')+' ergonomic handle',verts,faces,body,parent,.02)
 neck=[(-.44,.23),(-.33,.12),(-.08,-.07),(.12,-.055),(.10,.14),(-.07,.14),(-.29,.26),(-.41,.37)]
 # Chaikin subdivision removes the polygonal corners without changing the common pivot.
 for _ in range(3):
  neck=[q for i,a in enumerate(neck) for q in [(a[0]*.75+neck[(i+1)%len(neck)][0]*.25,a[1]*.75+neck[(i+1)%len(neck)][1]*.25),(a[0]*.25+neck[(i+1)%len(neck)][0]*.75,a[1]*.25+neck[(i+1)%len(neck)][1]*.75)]]
 outline('Forged neck',[(x,sign*y) for x,y in neck],.162,body,parent,.075,.028)
 blade=[(-.055,-.03),(.18,-.047),(1.43,-.018),(1.48,.006),(.55,.146),(.18,.182),(-.055,.09)]
 depth=.155 if sign>0 else -.065
 obj=outline(('Upper' if sign>0 else 'Lower')+'Blade',[(x,sign*y) for x,y in blade],depth,body,parent,.035,.009)
 outline('Honed cutting edge',[(.17,sign*-.047),(1.43,sign*-.018),(1.48,sign*.006),(.18,sign*-.003)],depth+.019,edge,parent,.005,.002)
 # Spine ridge catches a short sliding reflection without emissive light.
 outline('Blade spine',[(.20,sign*.14),(.58,sign*.115),(1.39,sign*.007),(.56,sign*.148)],depth+.02,edge,parent,.008,.003)
handle(1,upper);handle(-1,lower)
# Bolt axis is the shared pivot, facing camera.
bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=.084,depth=.038,location=(0,-.235,0),rotation=(math.pi/2,0,0));obj=bpy.context.object;obj.name='SharedPivot';obj.data.materials.append(bolt);mod=obj.modifiers.new('Bolt bevel','BEVEL');mod.width=.009;mod.segments=3;obj.modifiers.new('Bolt normals','WEIGHTED_NORMAL')
outline('Pivot slot',[(-.050,-.004),(.050,-.004),(.050,.004),(-.050,.004)],.257,body,None,.003,.001)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(OUT/'titanium-shears.glb'),export_format='GLB',export_apply=True,export_extras=True,export_cameras=False,export_lights=False)
print('Shears:',(OUT/'titanium-shears.glb').stat().st_size,'bytes')
