import { test } from "node:test";
import assert from "node:assert/strict";
import { ClothDynamics } from "../src/components/intro/cloth-dynamics";
function sheet(sign: number) {
  const columns = 17,
    rows = 11,
    rest = new Float32Array(columns * rows * 3);
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < columns; i++) {
      const p = (j * columns + i) * 3;
      rest[p] = (i / (columns - 1) - 0.5) * 2;
      rest[p + 1] = sign * (1 - (j / (rows - 1)) * 0.6);
    }
  const cloth = new ClothDynamics(columns, rows, sign);
  cloth.setRest(rest, 2);
  return { cloth, rest, columns, rows };
}
test("both sheets respond, independently, with their exterior edges pinned", () => {
  const top = sheet(1),
    bottom = sheet(-1);
  for (const { cloth, columns, rows } of [top, bottom]) {
    const sign = cloth === top.cloth ? 1 : -1;
    cloth.hover(0, sign * 0.62, 0.5, 720, 0);
    for (let i = 0; i < 20; i++) cloth.step(1 / 60, i / 60);
    assert.ok(cloth.offset.some((v) => Math.abs(v) > 0.0001));
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < columns; i++)
        if (j === 0 || i === 0 || i === columns - 1)
          for (let axis = 0; axis < 3; axis++)
            assert.equal(cloth.offset[(j * columns + i) * 3 + axis], 0);
  }
  top.cloth.grab(0, 0.65);
  top.cloth.pull(20, 20);
  const previous = new Float32Array(bottom.cloth.offset);
  for (let i = 0; i < 50; i++) top.cloth.step(1 / 60, i / 60);
  assert.deepEqual(bottom.cloth.offset, previous);
});
test("large drag is bounded, cannot intrude into the menu, and settles after cancellation", () => {
  for (const sign of [1, -1]) {
    const { cloth, rows, columns } = sheet(sign);
    cloth.grab(0, sign * 0.42);
    cloth.pull(100, -sign * 100);
    for (let i = 0; i < 90; i++) cloth.step(1 / 60, i / 60);
    for (let i = 0; i < cloth.offset.length; i += 3)
      assert.ok(
        Math.hypot(cloth.offset[i], cloth.offset[i + 1], cloth.offset[i + 2]) <=
          0.08001,
      );
    for (let i = 0; i < columns; i++)
      assert.ok(cloth.offset[((rows - 1) * columns + i) * 3 + 1] * sign >= 0);
    cloth.release();
    for (let i = 0; i < 240; i++) cloth.step(1 / 60, 2 + i / 60);
    assert.equal(cloth.active(), false);
    assert.ok(cloth.offset.every((v) => v === 0));
    cloth.grab(0, sign * 0.6);
    cloth.pull(0.04, 0.04);
    cloth.step(1 / 30, 7);
    cloth.reset();
    assert.equal(cloth.active(), false);
    assert.ok(cloth.offset.every((v) => v === 0));
  }
});
