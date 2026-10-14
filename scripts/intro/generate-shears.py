"""Original solid tailor's shears, sculpted CAD geometry, no third-party model.
Blender: blender -b --python scripts/intro/generate-shears.py
Two forged solids with opposite-side grips, one real shared pivot. Honed faces
are material groups within each blade, never floating overlay contours.
"""
import bpy,bmesh,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'public/intro';OUT.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def metal(name,color,rough):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=1;p.inputs['Roughness'].default_value=rough;return m
body=metal('Satin titanium',(.52,.53,.54),.38);edge=metal('Honed titanium',(.57,.58,.60),.24);bolt=metal('Pivot titanium',(.48,.49,.51),.32)
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
def grip(grip_sign,depth,parent):
 rx,ry=(.35,.188) if grip_sign>0 else (.4375,.2225)
 wx,wy=(.040,.037) if grip_sign>0 else (.0425,.0375)
 angle=-grip_sign*.18;around=128;section=16;verts=[]
 for i in range(around):
  a=2*math.pi*i/around;cx=rx*math.cos(a);cy=ry*math.sin(a)
  nx,ny=math.cos(a)/rx,math.sin(a)/ry;l=math.hypot(nx,ny);nx/=l;ny/=l
  w=wx*math.cos(a)**2+wy*math.sin(a)**2
  for j in range(section):
   t=2*math.pi*j/section;x=cx+nx*w*math.cos(t);y=cy+ny*w*math.cos(t)
   verts.append((-.74+x*math.cos(angle)-y*math.sin(angle),grip_sign*.295+x*math.sin(angle)+y*math.cos(angle),depth+.029*math.sin(t)))
 faces=[]
 for i in range(around):
  for j in range(section):
   a=i*section+j;b=((i+1)%around)*section+j;c=((i+1)%around)*section+(j+1)%section;d=i*section+(j+1)%section;faces.append((a,b,c,d))
 obj=mesh(('Upper' if grip_sign>0 else 'Lower')+'Grip',verts,faces,parent);return obj
def blade(sign,depth,parent):
 xs=sorted(set(round(x,7) for x in [-.055,.18,.55,1.43,1.48]+[-.055+1.535*i/48 for i in range(49)]))
 def line(x,knots):
  for (a,ya),(b,yb) in zip(knots,knots[1:]):
   if x<=b:return ya+(yb-ya)*(x-a)/(b-a)
  return knots[-1][1]
 top=[(-.055,.09),(.18,.173 if sign>0 else .158),(.55,.14 if sign>0 else .128),(1.48,-.01484)]
 bottom=[(-.055,-.03),(.18,-.047),(1.43,-.018),(1.48,-.01684)]
 lanes=[0,.035,.12,.28,.48,.68,.86,1];verts=[]
 for side in [-1,1]:
  for x in xs:
   lo,hi=line(x,bottom),line(x,top)
   for v in lanes:
    camber=.0035*math.sin(v*math.pi)*min(1,max(0,(1.48-x)/.2)) if side==sign else 0
    ordinary=depth+side*(.008+camber)
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
 obj=mesh('UpperBlade' if sign>0 else 'LowerBlade',verts,faces,parent,[body,edge])
 for poly,hone in zip(obj.data.polygons,polished):poly.material_index=int(hone)
 rounded(obj,.0012,3);return obj
def union(target,other):
 mod=target.modifiers.new('Continuous forged solid','BOOLEAN');mod.operation='UNION';mod.solver='EXACT';mod.object=other;apply(target,mod);bpy.data.objects.remove(other,do_unlink=True)
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
 grip_sign=-sign;depth=.235 if sign>0 else .217;grip_depth=depth+.020
 instrument=blade(sign,depth,parent)
 # Attach to the outer side of the ring, not its finger opening.
 rx=.35 if grip_sign>0 else .4375;angle=-grip_sign*.18
 anchor=(-.74+rx*math.cos(angle)-.008,grip_sign*.295+rx*math.sin(angle))
 controls=[anchor,(anchor[0]+.12,anchor[1]),(-.15,grip_sign*.015),(.08,0)]
 left=[];right=[]
 for i in range(65):
  t=i/64;q=1-t
  x=q*q*q*controls[0][0]+3*q*q*t*controls[1][0]+3*q*t*t*controls[2][0]+t*t*t*controls[3][0]
  y=q*q*q*controls[0][1]+3*q*q*t*controls[1][1]+3*q*t*t*controls[2][1]+t*t*t*controls[3][1]
  dx=3*q*q*(controls[1][0]-controls[0][0])+6*q*t*(controls[2][0]-controls[1][0])+3*t*t*(controls[3][0]-controls[2][0])
  dy=3*q*q*(controls[1][1]-controls[0][1])+6*q*t*(controls[2][1]-controls[1][1])+3*t*t*(controls[3][1]-controls[2][1])
  l=math.hypot(dx,dy);w=.052+.014*t;nx=-dy/l*w;ny=dx/l*w
  left.append((x+nx,y+ny));right.append((x-nx,y-ny))
 neck=left+right[::-1]
 def forge_depth(x):
  t=max(0,min(1,(-x-.1)/.34));return depth+(grip_depth-depth)*(t*t*(3-2*t))
 shaft=outline('Forged transition',neck,forge_depth,.022,parent);rounded(shaft,.004,4);union(instrument,shaft)
 # The pivot pad is welded into the arm, not a second overlapping plate.
 pad=outline('Pivot pad',[(.132*math.cos(i*math.pi/48),.132*math.sin(i*math.pi/48)) for i in range(96)],depth,.018,parent);rounded(pad,.003,4);union(instrument,pad)
 ring=grip(grip_sign,grip_depth,parent);union(instrument,ring)
 # Both arms are bored around the same axis; the shaft does not intersect solid metal.
 bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=.047,depth=.25,location=(0,-.226,0),rotation=(math.pi/2,0,0));bore=bpy.context.object
 mod=instrument.modifiers.new('Working pivot bore','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=bore;apply(instrument,mod);bpy.data.objects.remove(bore,do_unlink=True)
 rounded(instrument,.002,3)
 clean_solid(instrument)
 for polygon in instrument.data.polygons:polygon.use_smooth=True
 mod=instrument.modifiers.new('Stable satin normals','WEIGHTED_NORMAL');mod.keep_sharp=True;mod.weight=20;apply(instrument,mod)
 machining_uv(instrument)
 instrument.name='UpperForgedArm' if sign>0 else 'LowerForgedArm'
arm(1,upper);arm(-1,lower)
bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=.045,depth=.065,location=(0,-.2375,0),rotation=(math.pi/2,0,0));pivot=bpy.context.object;pivot.name='SharedPivot';pivot.data.materials.append(bolt)
bpy.ops.mesh.primitive_cylinder_add(vertices=96,radius=.072,depth=.017,location=(0,-.2635,0),rotation=(math.pi/2,0,0));head=bpy.context.object;head.data.materials.append(bolt);rounded(head,.0025,4);union(pivot,head)
# A recessed slot removes volume. No floating rectangle atop the screw head.
bpy.ops.mesh.primitive_cube_add(size=1,location=(0,-.271,0));slot=bpy.context.object;slot.scale=(.078,.005,.005);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
mod=pivot.modifiers.new('Recessed driver slot','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=slot;apply(pivot,mod);bpy.data.objects.remove(slot,do_unlink=True)
clean_solid(pivot)
for poly in pivot.data.polygons:poly.use_smooth=True
mod=pivot.modifiers.new('Pivot face normals','WEIGHTED_NORMAL');mod.keep_sharp=True;apply(pivot,mod);machining_uv(pivot)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(OUT/'titanium-shears.glb'),export_format='GLB',export_apply=True,export_extras=True,export_cameras=False,export_lights=False)
for obj in bpy.data.objects:
 if obj.type=='MESH':
  dec=obj.modifiers.new('Mobile solid LOD','DECIMATE');dec.ratio=.65
bpy.ops.export_scene.gltf(filepath=str(OUT/'titanium-shears-mobile.glb'),export_format='GLB',export_apply=True,export_extras=True,export_cameras=False,export_lights=False)
print('Solid shears:',(OUT/'titanium-shears.glb').stat().st_size,(OUT/'titanium-shears-mobile.glb').stat().st_size)
