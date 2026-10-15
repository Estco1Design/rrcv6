import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  cutFrame,
  SHEAR_WIDTH_RATIO,
  clothEdge,
  cutRelease,
} from "../src/components/intro/cut-timeline";

test("cloth is revealed before the tool, the wordmark and the menu", () => {
  for (let t = 0; t < 0.8; t += 0.02) {
    const shot = cutFrame(t);
    assert.equal(shot.tool, false);
    assert.ok(shot.cut < 0);
    assert.equal(shot.menu, 0);
  }
  assert.equal(cutFrame(0).light, 0);
  assert.equal(cutFrame(0.8).light, 1);
  assert.equal(cutFrame(3.7).tool, false);
  assert.equal(cutFrame(4.5).menu, 1);
  assert.equal(cutFrame(4.5).done, true);
});

test("four strokes cut monotonically at the common blade intersection, never at the handle or ahead of contact", () => {
  let previous = 0,
    previousRoot = -1;
  let closures = 0,
    wasClosing = false;
  for (let t = 1.300001; t < 3; t += 0.001) {
    const shot = cutFrame(t),
      contact = shot.root + (shot.contact * SHEAR_WIDTH_RATIO) / 2;
    assert.ok(shot.cut >= previous - 1e-7, `Cut moved backwards at ${t}`);
    assert.ok(
      shot.root >= previousRoot - 1e-7,
      `Hinge moved backwards at ${t}`,
    );
    assert.ok(
      Math.abs(contact - shot.cut) < 1e-6,
      `Reveal differs from edge contact at ${t}`,
    );
    const closing = shot.blade < 0.014;
    if (closing && !wasClosing) closures++;
    wasClosing = closing;
    previous = shot.cut;
    previousRoot = shot.root;
  }
  assert.equal(closures, 4);
  assert.ok(previous > 0.999);
  assert.ok(Math.abs(cutFrame(2.99999).root - cutFrame(3).root) < 1e-6);
});

test("the reusable shear asset has separate common-pivot arms, machined UVs and opaque materials", () => {
  const bytes = readFileSync(
    new URL("../public/intro/titanium-shears.glb", import.meta.url),
  );
  assert.equal(bytes.toString("ascii", 0, 4), "glTF");
  const length = bytes.readUInt32LE(12);
  const gltf = JSON.parse(bytes.toString("utf8", 20, 20 + length));
  for (const name of ["UpperArm", "LowerArm"]) {
    const node = gltf.nodes.find((n: { name: string }) => n.name === name);
    assert.ok(node);
    assert.ok(
      !node.translation || node.translation.every((v: number) => v === 0),
    );
  }
  for (const mesh of gltf.meshes)
    for (const primitive of mesh.primitives)
      assert.ok(
        primitive.attributes.TEXCOORD_0 !== undefined,
        "A normal-mapped metal surface needs UVs",
      );
  assert.ok(
    gltf.materials.every(
      (m: { alphaMode?: string }) => !m.alphaMode || m.alphaMode === "OPAQUE",
    ),
  );
});

test("final cloth edges reach the reference across both sides, including the delayed far-right edge", () => {
  const final = cutFrame(4.5);
  for (const u of [0, 0.25, 0.5, 0.75, 1]) {
    assert.equal(cutRelease(final, u), 1);
    assert.ok(Math.abs(clothEdge(final, u, 1, 0.4) - 0.4) < 1e-9);
    assert.ok(Math.abs(clothEdge(final, u, -1, -0.47) + 0.47) < 1e-9);
  }
  const during = cutFrame(2);
  assert.equal(cutRelease(during, Math.min(1, during.cut + 0.1)), 0);
  assert.equal(cutRelease(cutFrame(0.7), 0), 0);
});

test("desktop and mobile shear surfaces face outward after mirroring", () => {
  for (const asset of ["titanium-shears.glb", "titanium-shears-mobile.glb"]) {
    const bytes = readFileSync(
      new URL(`../public/intro/${asset}`, import.meta.url),
    );
    const jsonLength = bytes.readUInt32LE(12);
    const gltf = JSON.parse(bytes.toString("utf8", 20, 20 + jsonLength));
    const binary = bytes.subarray(28 + jsonLength);
    const values = (index: number): number[][] => {
      const a = gltf.accessors[index],
        view = gltf.bufferViews[a.bufferView];
      const lanes = a.type === "VEC3" ? 3 : 1;
      const width =
        a.componentType === 5121 ? 1 : a.componentType === 5123 ? 2 : 4;
      const stride = view.byteStride ?? lanes * width;
      const start = (view.byteOffset ?? 0) + (a.byteOffset ?? 0);
      return Array.from({ length: a.count }, (_, row) =>
        Array.from({ length: lanes }, (_, lane) => {
          const p = start + row * stride + lane * width;
          if (a.componentType === 5126) return binary.readFloatLE(p);
          if (width === 1) return binary.readUInt8(p);
          return width === 2 ? binary.readUInt16LE(p) : binary.readUInt32LE(p);
        }),
      );
    };
    for (const mesh of gltf.meshes) {
      let signedVolume = 0;
      for (const primitive of mesh.primitives) {
        const positions = values(primitive.attributes.POSITION);
        const indices = values(primitive.indices).flat();
        for (let i = 0; i < indices.length; i += 3) {
          const [a, b, c] = indices
            .slice(i, i + 3)
            .map((index) => positions[index]);
          for (let k = 0; k < 3; k++)
            signedVolume +=
              (a[k] *
                (b[(k + 1) % 3] * c[(k + 2) % 3] -
                  b[(k + 2) % 3] * c[(k + 1) % 3])) /
              6;
        }
      }
      assert.ok(
        signedVolume > 0,
        `${asset}: ${mesh.name} has inverted closed-surface winding`,
      );
    }
  }
});

test("forged shear arms have opposite-side grips that separate when the blades open", () => {
  const bytes = readFileSync(
    new URL("../public/intro/titanium-shears.glb", import.meta.url),
  );
  const length = bytes.readUInt32LE(12),
    gltf = JSON.parse(bytes.toString("utf8", 20, 20 + length)),
    binary = bytes.subarray(28 + length);
  assert.equal(
    gltf.meshes.length,
    3,
    "Floating spine/edge overlay meshes returned",
  );
  const center = (name: string) => {
    const root = gltf.nodes.findIndex((n: { name: string }) => n.name === name);
    let x = 0,
      y = 0,
      count = 0;
    const visit = (index: number) => {
      const node = gltf.nodes[index];
      if (node.mesh !== undefined)
        for (const primitive of gltf.meshes[node.mesh].primitives) {
          const a = gltf.accessors[primitive.attributes.POSITION],
            v = gltf.bufferViews[a.bufferView],
            start = (v.byteOffset ?? 0) + (a.byteOffset ?? 0),
            stride = v.byteStride ?? 12;
          for (let i = 0; i < a.count; i++) {
            const px = binary.readFloatLE(start + i * stride);
            if (px < -0.55) {
              x += px;
              y += binary.readFloatLE(start + i * stride + 4);
              count++;
            }
          }
        }
      for (const child of node.children ?? []) visit(child);
    };
    visit(root);
    assert.ok(count > 100);
    return { x: x / count, y: y / count };
  };
  const upper = center("UpperArm"),
    lower = center("LowerArm");
  assert.ok(upper.y < 0 && lower.y > 0);
  const distance = (angle: number) =>
    Math.abs(
      upper.x * Math.sin(angle) +
        upper.y * Math.cos(angle) -
        (-lower.x * Math.sin(angle) + lower.y * Math.cos(angle)),
    );
  assert.ok(
    distance(0.158) > distance(0.012) + 0.1,
    "Opening the blades closed the handles",
  );
});

// Presentation tilt must never reveal letters ahead of the physical cut.
test("wrist roll keeps the entire blade contact line fixed", async()=>{
  const {shearPresentation}=await import("../src/components/intro/cut-timeline");
  const {Vector3}=await import("three");
  const rolls=new Set<number>();
  for(const seconds of [.8,1,1.3,1.5,1.8,2.4,3,3.4,3.7])
    for(const scale of [.25,.7,1.3]) {
      const pose=shearPresentation(seconds,scale);rolls.add(pose.roll);
      assert.ok(Math.abs(pose.roll)<.3);
      const transform=(y:number,z:number)=>new Vector3(0,y,z).multiplyScalar(scale)
        .applyAxisAngle(new Vector3(1,0,0),pose.roll).add(new Vector3(0,pose.y,pose.z));
      assert.ok(transform(.12,.245).z>.286,"Upper blade slipped under the cloth");
      assert.ok(transform(-.12,.217).z<.286,"Lower blade rose above the cloth");
      for(const x of [0,.3,1.4]) {
        const point=new Vector3(x,0,.226).multiplyScalar(scale)
          .applyAxisAngle(new Vector3(1,0,0),pose.roll)
          .add(new Vector3(.4,pose.y,pose.z));
        assert.ok(Math.abs(point.x-(.4+x*scale))<1e-12);
        assert.ok(Math.abs(point.y-.04)<1e-12);
        assert.ok(Math.abs(point.z-.286)<1e-12);
      }
    }
  const anchored=shearPresentation(1.7,.8,.055,-.03);
  const tip=new Vector3(.7,0,.226).multiplyScalar(.8)
    .applyAxisAngle(new Vector3(1,0,0),anchored.roll)
    .add(new Vector3(0,anchored.y,anchored.z));
  assert.ok(Math.abs(tip.y-.055)<1e-12&&Math.abs(tip.z+.03)<1e-12,
    "The tool ignores the actual draped seam height");
  assert.ok(rolls.size>3,"The instrument never changes its reflection angle");
});
