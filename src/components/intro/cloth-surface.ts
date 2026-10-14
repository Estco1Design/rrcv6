/** Shape helpers only: these do not generate or imitate textile material maps. */
export function clothContour(points: readonly number[], u: number) {
  const x = Math.max(0, Math.min(1, u)) * (points.length - 1);
  const i = Math.min(points.length - 2, Math.floor(x)),
    t = x - i;
  const slope = (k: number) => {
    if (k === 0) return points[1] - points[0];
    if (k === points.length - 1) return points[k] - points[k - 1];
    const before = points[k] - points[k - 1],
      after = points[k + 1] - points[k];
    // Monotone Hermite: shared tangents, no stepped zero-slope joins or overshoot.
    return before * after <= 0 ? 0 : (2 * before * after) / (before + after);
  };
  return (
    (2 * t * t * t - 3 * t * t + 1) * points[i] +
    (t * t * t - 2 * t * t + t) * slope(i) +
    (-2 * t * t * t + 3 * t * t) * points[i + 1] +
    (t * t * t - t * t) * slope(i + 1)
  );
}

/** A fine render surface driven by a small, independent physics lattice.
 * Bicubic interpolation gives continuous slopes without running a spring at
 * every render vertex. All indices/weights/rest buffers are allocated once.
 */
export class ClothSurfaceSampling {
  readonly rest: Float32Array;
  private indices: Uint32Array;
  private weights: Float32Array;
  constructor(
    private columns: number,
    private rows: number,
    private physicsColumns: number,
    private physicsRows: number,
  ) {
    const count = (columns + 1) * (rows + 1);
    this.rest = new Float32Array((physicsColumns + 1) * (physicsRows + 1) * 3);
    this.indices = new Uint32Array(count * 16);
    this.weights = new Float32Array(count * 16);
    const cubic = (t: number) => [
      (-t + 2 * t * t - t * t * t) / 2,
      1 - 2.5 * t * t + 1.5 * t * t * t,
      (t + 4 * t * t - 3 * t * t * t) / 2,
      (-t * t + t * t * t) / 2,
    ];
    for (let j = 0; j <= rows; j++)
      for (let i = 0; i <= columns; i++) {
        const x = (i / columns) * physicsColumns,
          y = (j / rows) * physicsRows;
        const ix = Math.floor(x),
          iy = Math.floor(y),
          wx = cubic(x - ix),
          wy = cubic(y - iy);
        const n = (j * (columns + 1) + i) * 16;
        for (let b = 0; b < 4; b++)
          for (let a = 0; a < 4; a++) {
            this.indices[n + b * 4 + a] =
              (Math.max(0, Math.min(physicsRows, iy + b - 1)) *
                (physicsColumns + 1) +
                Math.max(0, Math.min(physicsColumns, ix + a - 1))) *
              3;
            this.weights[n + b * 4 + a] = wx[a] * wy[b];
          }
      }
  }
  setRest(base: Float32Array) {
    for (let j = 0; j <= this.physicsRows; j++)
      for (let i = 0; i <= this.physicsColumns; i++) {
        const x = (i / this.physicsColumns) * this.columns,
          y = (j / this.physicsRows) * this.rows;
        const a = Math.floor(x),
          b = Math.floor(y),
          tx = x - a,
          ty = y - b;
        const n = (j * (this.physicsColumns + 1) + i) * 3;
        for (let axis = 0; axis < 3; axis++) {
          const at = (dx: number, dy: number) =>
            base[
              (Math.min(this.rows, b + dy) * (this.columns + 1) +
                Math.min(this.columns, a + dx)) *
                3 +
                axis
            ];
          this.rest[n + axis] =
            (at(0, 0) * (1 - tx) + at(1, 0) * tx) * (1 - ty) +
            (at(0, 1) * (1 - tx) + at(1, 1) * tx) * ty;
        }
      }
  }
  deform(
    base: Float32Array,
    offsets: Float32Array,
    output: Float32Array,
    limit: number,
    sign: number,
  ) {
    for (let vertex = 0; vertex < base.length / 3; vertex++) {
      const n = vertex * 3,
        map = vertex * 16,
        row = Math.floor(vertex / (this.columns + 1)),
        col = vertex % (this.columns + 1);
      let dx = 0,
        dy = 0,
        dz = 0;
      if (row !== 0 && col !== 0 && col !== this.columns) {
        for (let k = 0; k < 16; k++) {
          const i = this.indices[map + k],
            w = this.weights[map + k];
          dx += offsets[i] * w;
          dy += offsets[i + 1] * w;
          dz += offsets[i + 2] * w;
        }
        const scale = Math.min(
          1,
          limit / Math.max(0.000001, Math.hypot(dx, dy, dz)),
        );
        dx *= scale;
        dy *= scale;
        dz *= scale;
        if (row === this.rows && dy * sign < 0) dy = 0;
      }
      output[n] = base[n] + dx;
      output[n + 1] = base[n + 1] + dy;
      output[n + 2] = base[n + 2] + dz;
    }
  }
}
