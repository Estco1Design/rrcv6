import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ClothSurfaceSampling,
  clothContour,
} from "../src/components/intro/cloth-surface";

test("cloth contour has shared tangents and stays within its reference span", () => {
  const curve = [0.31, 0.29, 0.205, 0.23, 0.3, 0.34, 0.355, 0.37, 0.4];
  for (let k = 1; k < curve.length - 1; k++) {
    const u = k / (curve.length - 1),
      h = 1e-6;
    const left = (clothContour(curve, u) - clothContour(curve, u - h)) / h;
    const right = (clothContour(curve, u + h) - clothContour(curve, u)) / h;
    assert.ok(
      Math.abs(left - right) < 0.001,
      `A silhouette corner remained at ${u}`,
    );
  }
  for (let i = 0; i <= 1000; i++)
    assert.ok(
      clothContour(curve, i / 1000) >= 0.205 &&
        clothContour(curve, i / 1000) <= 0.400001,
    );
});
test("fine surface follows a local coarse grab while pins and the HTML aperture remain protected", () => {
  const cols = 96,
    rows = 40,
    pc = 24,
    pr = 20;
  const sampling = new ClothSurfaceSampling(cols, rows, pc, pr),
    base = new Float32Array((cols + 1) * (rows + 1) * 3),
    out = new Float32Array(base.length);
  for (let j = 0; j <= rows; j++)
    for (let i = 0; i <= cols; i++) {
      const n = (j * (cols + 1) + i) * 3;
      base[n] = (i / cols) * 2 - 1;
      base[n + 1] = 1 - (j / rows) * 0.6;
    }
  sampling.setRest(base);
  const coarse = new Float32Array(sampling.rest.length);
  const selected = (10 * (pc + 1) + 12) * 3;
  coarse[selected] = 0.04;
  coarse[selected + 1] = -0.08;
  coarse[selected + 2] = 0.05;
  sampling.deform(base, coarse, out, 0.08, 1);
  assert.ok(out.some((v, i) => Math.abs(v - base[i]) > 0.001));
  for (let j = 0; j <= rows; j++)
    for (let i = 0; i <= cols; i++) {
      const n = (j * (cols + 1) + i) * 3;
      if (j === 0 || i === 0 || i === cols)
        for (let a = 0; a < 3; a++) assert.equal(out[n + a], base[n + a]);
      assert.ok(
        Math.hypot(
          out[n] - base[n],
          out[n + 1] - base[n + 1],
          out[n + 2] - base[n + 2],
        ) <= 0.080001,
      );
      if (j === rows) assert.ok(out[n + 1] >= base[n + 1]);
    }
  assert.equal(
    out[(8 * (cols + 1) + 3) * 3],
    base[(8 * (cols + 1) + 3) * 3],
    "A remote corner moved with the grab",
  );
  coarse.fill(0);
  sampling.deform(base, coarse, out, 0.08, 1);
  assert.deepEqual(out, base);
});
