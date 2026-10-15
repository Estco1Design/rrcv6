"""Offline topology/clearance acceptance of the authored Blender source."""
import bpy,bmesh,json,math
from pathlib import Path
root=Path(__file__).resolve().parents[2]
bpy.ops.wm.open_mainfile(filepath=str(root/'scripts/model-source/shears/reference-shears.blend'))
report={'source':'scripts/model-source/shears/reference-shears.blend','solids':[],'poses':[]}
a=bpy.data.objects['UpperForgedArm'];b=bpy.data.objects['LowerForgedArm'];upper=bpy.data.objects['UpperArm'];lower=bpy.data.objects['LowerArm']
for obj in [a,b,bpy.data.objects['SharedPivot']]:
 bm=bmesh.new();bm.from_mesh(obj.data);pending=set(bm.verts);components=0
 while pending:
  todo=[pending.pop()];components+=1
  while todo:
   v=todo.pop()
   for edge in v.link_edges:
    other=edge.other_vert(v)
    if other in pending:pending.remove(other);todo.append(other)
 record={'object':obj.name,'components':components,'nonmanifold_edges':sum(not e.is_manifold for e in bm.edges),'volume':bm.calc_volume(signed=True),'vertices':len(bm.verts)}
 report['solids'].append(record);bm.free();assert record['volume']>0,record
 assert components==1,record
 assert record['nonmanifold_edges']==0,record
for i in range(17):
 angle=.012+(.158-.012)*i/16;upper.rotation_euler[1]=-angle;lower.rotation_euler[1]=angle;bpy.context.view_layer.update()
 probe=a.copy();probe.data=a.data.copy();bpy.context.collection.objects.link(probe);probe.parent=None;probe.matrix_world=a.matrix_world.copy()
 mod=probe.modifiers.new('Actual arm intersection','BOOLEAN');mod.operation='INTERSECT';mod.solver='EXACT';mod.object=b;bpy.context.view_layer.objects.active=probe;bpy.ops.object.modifier_apply(modifier=mod.name)
 bm=bmesh.new();bm.from_mesh(probe.data);volume=abs(bm.calc_volume(signed=True));bm.free();bpy.data.objects.remove(probe,do_unlink=True)
 report['poses'].append({'half_angle_radians':angle,'intersection_volume':volume});assert volume<1e-7,report['poses'][-1]
(root/'docs/media/shears-reference/mechanical-check.json').write_text(json.dumps(report,indent=2));print('PASS connected manifold solids and 17 mechanical poses')
