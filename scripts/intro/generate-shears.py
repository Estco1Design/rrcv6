"""Original solid tailor's shears, sculpted CAD geometry, no third-party model.
Blender: blender -b --python scripts/intro/generate-shears.py
Two forged solids with opposite-side grips, one real shared pivot. Honed faces
are material groups within each blade, never floating overlay contours.
"""
import bpy,bmesh,math
from mathutils.kdtree import KDTree
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'public/intro';OUT.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def metal(name,color,rough):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=1;p.inputs['Roughness'].default_value=rough;return m
body=metal('Satin titanium',(.54,.55,.56),.36);edge=metal('Honed titanium',(.59,.60,.61),.23);bolt=metal('Pivot titanium',(.48,.49,.51),.31);inner=metal('Recessed grip titanium',(.29,.30,.31),.43)
# Authored machining micro-relief; no baked highlights or source photograph.
# Tiny normal perturbations disappear through mip filtering at phone distance.
finish=bpy.data.images.new('Directional satin microrelief',width=512,height=256,alpha=False);finish.colorspace_settings.name='Non-Color'
pixels=[]
for y in range(256):
 for x in range(512):
  slope=.022*math.sin(y*2.31+.12*math.sin(x*.018))+.012*math.sin(y*1.73+.05*math.sin(x*.031))
  pixels.extend((.5,.5+slope*.5,.9997,1))
finish.pixels.foreach_set(pixels);finish.pack()
for material in [body,bolt]:
 nodes=material.node_tree.nodes;links=material.node_tree.links
 tex=nodes.new('ShaderNodeTexImage');tex.image=finish;tex.interpolation='Linear';tex.extension='REPEAT'
 normal=nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.45
 links.new(tex.outputs['Color'],normal.inputs['Color']);links.new(normal.outputs['Normal'],nodes.get('Principled BSDF').inputs['Normal'])
def group(name):
 obj=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(obj);return obj
upper=group('UpperArm');lower=group('LowerArm')
def mesh(name,verts,faces,parent,materials=None):
 data=bpy.data.meshes.new(name+' geometry');data.from_pydata([(x,-z,y) for x,y,z in verts],[],faces);data.update()
 bm=bmesh.new();bm.from_mesh(data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(data);bm.free();data.update()
 obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);obj.parent=parent
 for mat in materials or [body]:data.materials.append(mat)
 for poly in data.polygons:poly.use_smooth=True
 return obj
def apply(obj,modifier):
 bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=modifier.name)
def rounded(obj,width=.003,segments=4):
 mod=obj.modifiers.new('Machined radius','BEVEL');mod.width=width;mod.segments=segments;mod.angle_limit=.6;apply(obj,mod)
def outline(name,points,depth,thick,parent):
 if sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(points,points[1:]+points[:1]))<0:points=points[::-1]
 n=len(points);verts=[(x,y,(depth(x) if callable(depth) else depth)+z) for z in [-thick/2,thick/2] for x,y in points]
 faces=[tuple(range(n-1,-1,-1)),tuple(range(n,n*2))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
 obj=mesh(name,verts,faces,parent)
 tri=obj.modifiers.new("Planar forged face tessellation","TRIANGULATE");apply(obj,tri)
 return obj
# The approved upper-view image is the proportion authority. Coordinates below
# are manually traced landmarks in its 1280px frame, not a texture or sprite.
# Both hole loops and forged outside contours are independent asymmetric splines.
THUMB_OUT=[(124,119),(133,90),(163,63),(217,48),(265,49),(306,67),(331,96),(351,129),(383,156),(422,178),(470,200),(516,210),(548,212),(563,233),(543,255),(515,253),(478,231),(439,209),(393,190),(353,184),(316,193),(277,201),(235,201),(191,192),(152,174),(131,149)]
THUMB_IN=[(165,116),(178,88),(207,72),(240,69),(271,76),(295,94),(308,119),(307,142),(292,161),(266,173),(231,177),(199,171),(177,156),(166,137)]
FINGER_OUT=[(52,273),(64,244),(89,224),(128,213),(181,208),(245,212),(310,221),(367,233),(409,249),(454,266),(491,277),(530,283),(557,275),(568,289),(545,300),(502,302),(455,311),(416,332),(376,353),(325,369),(266,376),(200,373),(142,363),(96,345),(67,321),(53,296)]
FINGER_IN=[(86,271),(102,247),(137,236),(181,234),(231,237),(282,244),(327,255),(359,271),(375,289),(368,310),(344,326),(303,339),(255,345),(205,344),(157,337),(117,324),(92,304),(83,287)]
def trace(points,steps=8):
 out=[]
 for i in range(len(points)):
  p0,p1,p2,p3=[points[j%len(points)] for j in [i-1,i,i+1,i+2]]
  for j in range(steps):
   t=j/steps;t2=t*t;t3=t2*t
   v=[.5*((2*p1[k])+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t3) for k in range(2)]
   out.append(((v[0]-598)/429,(256-v[1])/429))
 return out

def forged_handle(sign,depth,parent):
 outer,hole=(THUMB_OUT,THUMB_IN) if sign<0 else (FINGER_OUT,FINGER_IN)
 outer,hole=trace(outer),trace(hole)
 def area(a):return sum(p[0]*q[1]-q[0]*p[1] for p,q in zip(a,a[1:]+a[:1]))
 if area(outer)<0:outer.reverse()
 if area(hole)>0:hole.reverse()
 curve=bpy.data.curves.new('Traced forged handle','CURVE');curve.dimensions='2D';curve.resolution_u=1;curve.fill_mode='BOTH';curve.extrude=.012;curve.bevel_depth=.009;curve.bevel_resolution=5;curve.resolution_u=1
 for points in [outer,hole]:
  spline=curve.splines.new('POLY');spline.points.add(len(points)-1)
  for v,(x,y) in zip(spline.points,points):v.co=(x,y,0,1)
  spline.use_cyclic_u=True
 obj=bpy.data.objects.new('Traced ergonomic handle',curve);bpy.context.collection.objects.link(obj);bpy.context.view_layer.objects.active=obj;obj.select_set(True);bpy.ops.object.convert(target='MESH');obj=bpy.context.object
 # Uniform interior topology is essential before bending the forged neck.
 # Bending long triangulated curve caps produced visible diagonal shading bands.
 remesh=obj.modifiers.new('Uniform forged topology','REMESH');remesh.mode='VOXEL';remesh.voxel_size=.003;remesh.use_smooth_shade=True;apply(obj,remesh)
 sm=obj.modifiers.new('Soft forged shoulders','SMOOTH');sm.factor=.7;sm.iterations=3;apply(obj,sm)
 def contour_distance(points):
  tree=KDTree(len(points))
  for i,(x,y) in enumerate(points):tree.insert((x,y,0),i)
  tree.balance()
  def distance(x,y):
   _,i,_=tree.find((x,y,0));result=1e9
   for a,b in [(points[(i-1)%len(points)],points[i]),(points[i],points[(i+1)%len(points)])]:
    dx,dy=b[0]-a[0],b[1]-a[1];t=max(0,min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)))
    result=min(result,math.hypot(x-a[0]-t*dx,y-a[1]-t*dy))
   return result
  return distance
 distance_in,distance_out=contour_distance(hole),contour_distance(outer)
 # Raised finger bows transition into a thin forged neck. The two arms retain
 # separate face depths throughout the crossover; no mirrored overlay shells.
 for v in obj.data.vertices:
  x,y,z=v.co;t=max(0,min(1,(-x-.12)/.55));lift=.050*t*t*(3-2*t)
  di=distance_in(x,y);do=distance_out(x,y)
  crown=.009*math.sin(math.pi*di/max(.0001,di+do))
  z+=math.copysign(crown*min(1,abs(z)/.014),z)
  v.co=(x,-(depth+lift+z),y)
 dec=obj.modifiers.new('Curvature preserving handle LOD','DECIMATE');dec.ratio=.22;apply(obj,dec)
 obj.parent=parent;obj.data.materials.append(body);obj.data.materials.append(edge);obj.data.materials.append(inner)
 for polygon in obj.data.polygons:polygon.use_smooth=True
 obj.data.update()
 for polygon in obj.data.polygons:
  if abs(polygon.normal.y)<.55:
   c=polygon.center;d=min((c.x-x)**2+(c.z-y)**2 for x,y in hole)
   if d<.00030:polygon.material_index=2
 return obj
def blade(sign,depth,parent):
 xs=sorted(set(round(x,7) for x in [-.055,.18,.55,1.43,1.48]+[-.055+1.535*i/48 for i in range(49)]))
 def line(x,knots):
  # C1-continuous forged spine: no faceted piecewise-linear shoulder.
  for i,((a,ya),(b,yb)) in enumerate(zip(knots,knots[1:])):
   if x<=b:
    t=(x-a)/(b-a)
    def slope(k):
     if k==0:return (knots[1][1]-knots[0][1])/(knots[1][0]-knots[0][0])
     if k==len(knots)-1:return (knots[-1][1]-knots[-2][1])/(knots[-1][0]-knots[-2][0])
     return (knots[k+1][1]-knots[k-1][1])/(knots[k+1][0]-knots[k-1][0])
    return (2*t**3-3*t*t+1)*ya+(t**3-2*t*t+t)*(b-a)*slope(i)+(-2*t**3+3*t*t)*yb+(t**3-t*t)*(b-a)*slope(i+1)
  return knots[-1][1]
 top=[(-.055,.09),(.18,.103 if sign>0 else .099),(.55,.088 if sign>0 else .082),(1.48,-.01484)]
 bottom=[(-.055,-.03),(.18,-.047),(1.43,-.018),(1.48,-.01684)]
 lanes=[0,.035,.12,.28,.48,.68,.86,1];verts=[]
 for side in [-1,1]:
  for x in xs:
   lo,hi=line(x,bottom),line(x,top)
   for v in lanes:
    camber=(.008*math.sin(v*math.pi)+.004*math.sin(math.pi*max(0,min(1,(x+.055)/1.535))))*min(1,max(0,(1.48-x)/.2)) if side==sign else 0
    ordinary=depth+side*(.022+camber)
    # Two thin, adjacent cut edges converge at depth .226. The flat mating
    # faces remain .227 / .225; honing is the real surface, not an extra mesh.
    sharp=.226+(sign*.001 if side==sign else 0)
    t=min(1,v/.12);z=sharp*(1-t)+ordinary*t
    tip=max(.06,min(1,(1.48-x)/.065));z=sharp*(1-tip)+z*tip
    verts.append((x,sign*(lo+(hi-lo)*v),z))
 stride=len(lanes);count=len(xs)*stride;faces=[];polished=[]
 for layer in range(2):
  for i in range(len(xs)-1):
   for j in range(stride-1):
    a=layer*count+i*stride+j;quad=(a,a+1,a+stride+1,a+stride);faces.append(quad[::-1] if layer==1 else quad);polished.append(j<2 and xs[i]>=.15)
 for i in range(len(xs)-1):
  a=i*stride;b=a+stride;faces.extend([(a,b,b+count,a+count),(a+stride-1,a+stride-1+count,b+stride-1+count,b+stride-1)]);polished.extend([xs[i]>=.15,False])
 for i in [0,len(xs)-1]:
  for j in range(stride-1):
   a=i*stride+j;quad=(a,a+count,a+count+1,a+1);faces.append(quad if i==0 else quad[::-1]);polished.append(False)
 if sign<0:faces=[p[::-1] for p in faces]
 obj=mesh('UpperBlade' if sign>0 else 'LowerBlade',verts,faces,parent,[body,edge,inner])
 for poly,hone in zip(obj.data.polygons,polished):poly.material_index=int(hone)
 rounded(obj,.0012,3);return obj
def union(target,other):
 mod=target.modifiers.new('Continuous forged solid','BOOLEAN');mod.operation='UNION';mod.solver='EXACT';mod.material_mode='TRANSFER';mod.object=other;apply(target,mod);bpy.data.objects.remove(other,do_unlink=True)
def clean_solid(obj):
 bm=bmesh.new();bm.from_mesh(obj.data)
 bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=0.0000005)
 bmesh.ops.dissolve_degenerate(bm,edges=list(bm.edges),dist=0.0000005)
 bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
 if bm.calc_volume(signed=True)<0:bmesh.ops.reverse_faces(bm,faces=list(bm.faces))
 print("SOLID VOLUME",obj.name,bm.calc_volume(signed=True))
 bm.to_mesh(obj.data);bm.free();obj.data.update()
 tri=obj.modifiers.new('Explicit stable tessellation','TRIANGULATE');tri.keep_custom_normals=True;apply(obj,tri)
def machining_uv(obj):
 uv=obj.data.uv_layers.new(name='Machining UV')
 for polygon in obj.data.polygons:
  axis=max(range(3),key=lambda i:abs(polygon.normal[i]));axes=[i for i in range(3) if i!=axis]
  for loop_index in polygon.loop_indices:
   p=obj.data.vertices[obj.data.loops[loop_index].vertex_index].co;uv.data[loop_index].uv=(p[axes[0]]*.7+.5,p[axes[1]]*.7+.5)
def arm(sign,parent):
 depth=.249 if sign>0 else .203
 instrument=blade(sign,depth,parent)
 handle=forged_handle(sign,depth,parent);union(instrument,handle)
 # A single shoulder belongs to each rigid arm and blends into its blade root.
 pad=outline('Forged pivot shoulder',[(-.22,-.085),(-.10,-.105),(.10,-.105),(.18,-.065),(.18,.095),(-.10,.103),(-.23,.045)],depth,.016,parent);rounded(pad,.006,5);union(instrument,pad)
 # Both arms are bored around the same axis; the shaft does not intersect solid metal.
 bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=.047,depth=.25,location=(0,-.226,0),rotation=(math.pi/2,0,0));bore=bpy.context.object
 mod=instrument.modifiers.new('Working pivot bore','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=bore;apply(instrument,mod);bpy.data.objects.remove(bore,do_unlink=True)
 rounded(instrument,.002,3)
 clean_solid(instrument)
 for polygon in instrument.data.polygons:polygon.use_smooth=True
 group=instrument.vertex_groups.new(name='Machined blade flats');ids=[v.index for v in instrument.data.vertices if v.co.x>-.20];group.add(ids,1,'REPLACE')
 mod=instrument.modifiers.new('Stable satin normals','WEIGHTED_NORMAL');mod.vertex_group=group.name;mod.keep_sharp=True;mod.weight=25;apply(instrument,mod)
 machining_uv(instrument)
 instrument.name='UpperForgedArm' if sign>0 else 'LowerForgedArm'
arm(1,upper);arm(-1,lower)
# Offline mechanical clearance check. Curvature belongs to the outer faces;
# the two mating faces must remain separate through every cutting pose.
a=bpy.data.objects['UpperForgedArm'];b=bpy.data.objects['LowerForgedArm']
for angle in [.012,.075,.158]:
 upper.rotation_euler[1]=-angle;lower.rotation_euler[1]=angle;bpy.context.view_layer.update()
 probe=a.copy();probe.data=a.data.copy();bpy.context.collection.objects.link(probe);probe.parent=None;probe.matrix_world=a.matrix_world.copy()
 mod=probe.modifiers.new('Mechanical clearance','BOOLEAN');mod.operation='INTERSECT';mod.solver='EXACT';mod.object=b;apply(probe,mod)
 bm=bmesh.new();bm.from_mesh(probe.data);volume=abs(bm.calc_volume(signed=True));bm.free();print('ARM INTERSECTION',angle,volume)
 bpy.data.objects.remove(probe,do_unlink=True)
 assert volume<1e-7, 'Forged arms intersect in the cutting pose'
upper.rotation_euler[1]=0;lower.rotation_euler[1]=0;bpy.context.view_layer.update()
bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=.045,depth=.11,location=(0,-.247,0),rotation=(math.pi/2,0,0));pivot=bpy.context.object;pivot.name='SharedPivot';pivot.data.materials.append(bolt)
# Mildly crowned screw head: a true lathed solid, not a flat black disk.
verts=[];rings=12;segments=96
for j in range(rings+1):
 r=.072*max(.001,j/rings);z=.2965+.008+.005*(1-(r/.072)**2)
 for i in range(segments):
  a=i*math.tau/segments;verts.append((r*math.cos(a),r*math.sin(a),z))
faces=[]
for j in range(rings):
 for i in range(segments):
  n=(i+1)%segments;faces.append((j*segments+i,j*segments+n,(j+1)*segments+n,(j+1)*segments+i))
faces.append(tuple(range(segments-1,-1,-1)))
# back cap closes the head against the shaft, leaving a machined outer wall.
base=len(verts)
for i in range(segments):
 a=i*math.tau/segments;verts.append((.072*math.cos(a),.072*math.sin(a),.288))
for i in range(segments):
 n=(i+1)%segments;faces.append((rings*segments+i,base+i,base+n,rings*segments+n))
faces.append(tuple(base+i for i in range(segments)))
head=mesh('Crowned screw head',verts,faces,None,[bolt]);rounded(head,.0015,3);union(pivot,head)
# A recessed slot removes volume. No floating rectangle atop the screw head.
bpy.ops.mesh.primitive_cube_add(size=1,location=(0,-.308,0));slot=bpy.context.object;slot.rotation_euler[1]=.65;slot.scale=(.083,.005,.004);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
mod=pivot.modifiers.new('Recessed driver slot','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=slot;apply(pivot,mod);bpy.data.objects.remove(slot,do_unlink=True)
clean_solid(pivot)
for poly in pivot.data.polygons:poly.use_smooth=True
mod=pivot.modifiers.new('Pivot face normals','WEIGHTED_NORMAL');mod.keep_sharp=True;apply(pivot,mod);machining_uv(pivot)
source=ROOT/'scripts/model-source/shears';source.mkdir(exist_ok=True)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(source/'reference-shears.blend'))
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(OUT/'titanium-shears.glb'),export_format='GLB',export_apply=True,export_extras=True,export_cameras=False,export_lights=False)
for obj in bpy.data.objects:
 if obj.type=='MESH':
  dec=obj.modifiers.new('Mobile solid LOD','DECIMATE');dec.ratio=.48
bpy.ops.export_scene.gltf(filepath=str(OUT/'titanium-shears-mobile.glb'),export_format='GLB',export_apply=True,export_extras=True,export_cameras=False,export_lights=False)
print('Solid shears:',(OUT/'titanium-shears.glb').stat().st_size,(OUT/'titanium-shears-mobile.glb').stat().st_size)
