"""Render the actual relaxed adult + hair reference as a no-WebGL fallback.
Run before Meshopt packing, or set RRC_RAW_MODELS to uncompressed authoring exports.
"""
import bpy,os
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1];models=Path(os.environ.get('RRC_RAW_MODELS',root/'public/models'))
for kind in ['male','female']:
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 for name in [f'fit-{kind}.glb',f'hair-{kind}-short01.glb']:bpy.ops.import_scene.gltf(filepath=str(models/name))
 scene=bpy.context.scene;scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(1,1,1,1);scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.5
 for position,power,size in [((3,-4,5),350,4),((-3,-2,3),160,4),((0,3,5),250,3)]:
  bpy.ops.object.light_add(type='AREA',location=position);o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,1.7))-o.location).to_track_quat('-Z','Y').to_euler()
 bpy.ops.object.camera_add(location=(0,-6,1.7));o=bpy.context.object;o.rotation_euler=(Vector((0,0,1.7))-o.location).to_track_quat('-Z','Y').to_euler();o.data.type='ORTHO';o.data.ortho_scale=3.85;scene.camera=o
 scene.render.engine='CYCLES';scene.cycles.samples=64;scene.cycles.use_denoising=False;scene.render.resolution_x=576;scene.render.resolution_y=896;scene.render.resolution_percentage=100;scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True;scene.render.image_settings.color_mode='RGBA';scene.render.filepath=str(root/'public/images/atelier'/f'fit-reference-{kind}.png');bpy.ops.render.render(write_still=True)
