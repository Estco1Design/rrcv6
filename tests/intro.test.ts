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
