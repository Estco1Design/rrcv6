/** Small tethered spring lattice, in world space. No GPU-only deformation.
 * Fixed edge vertices, stretch projection and a Laplacian resist local bending.
 * Both sheets own their state; pointer updates only change scalar targets.
 */
export class ClothDynamics {
  readonly offset: Float32Array;
  private readonly velocity: Float32Array;
  private readonly next: Float32Array;
  private readonly before: Float32Array;
  private readonly pinned: Uint8Array;
  private readonly rest: Float32Array;
  private x = 0;
  private y = 0;
  private tx = 0;
  private ty = 0;
  private tz = 0;
  private hoverAt = -10;
  private releasedAt = -10;
  private dragging = false;
  private radius = 0.25;
  private limit = 0.08;
  private dirty = false;
  constructor(
    private columns: number,
    private rows: number,
    private sign: number,
  ) {
    const count = columns * rows;
    this.offset = new Float32Array(count * 3);
    this.velocity = new Float32Array(count * 3);
    this.next = new Float32Array(count * 3);
    this.before = new Float32Array(count * 3);
    this.rest = new Float32Array(count * 3);
    this.pinned = new Uint8Array(count);
    // PlaneGeometry row zero is the exterior, last row the cut edge.
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < columns; i++)
        this.pinned[j * columns + i] = Number(
          j === 0 || i === 0 || i === columns - 1,
        );
  }
  setRest(positions: ArrayLike<number>, shortWorld: number) {
    this.rest.set(positions);
    this.radius = shortWorld * 0.17;
    this.limit = shortWorld * 0.04;
    this.reset();
  }
  hover(x: number, y: number, speed: number, height: number, time: number) {
    if (this.dragging) return;
    this.x = x;
    this.y = y;
    this.tx = 0;
    this.ty = (this.sign * (8 + Math.min(speed, 1) * 10)) / height;
    this.tz = 12 / height;
    this.hoverAt = time;
    this.dirty = true;
  }
  grab(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.tx = this.ty = this.tz = 0;
    this.dragging = true;
    this.dirty = true;
  }
  pull(dx: number, dy: number) {
    const scale = Math.min(
      1,
      this.limit / Math.max(0.0001, Math.hypot(dx, dy)),
    );
    this.tx = dx * scale;
    this.ty = dy * scale;
    this.tz = Math.min(this.limit * 0.5, Math.hypot(dx, dy) * 0.35);
    this.dirty = true;
  }
  release(time = 0) {
    this.releasedAt = time;
    this.dragging = false;
    this.tx = this.ty = this.tz = 0;
    this.hoverAt = -10;
  }
  reset() {
    this.offset.fill(0);
    this.velocity.fill(0);
    this.release();
    this.dirty = false;
  }
  active() {
    return this.dragging || this.dirty;
  }
  step(dt: number, time: number) {
    if (!this.active()) return;
    const boundedDt = Math.min(1 / 15, Math.max(0, dt)),
      steps = Math.max(1, Math.ceil(boundedDt * 60)),
      h = boundedDt / steps;
    const decay = this.dragging
      ? 1
      : Math.exp(-Math.max(0, time - this.hoverAt) * 8);
    const age = time - (this.ty === 0 ? this.releasedAt : this.hoverAt);
    if (!this.dragging && age >= 1.15) {
      this.offset.fill(0);
      this.velocity.fill(0);
      this.dirty = false;
      return;
    }
    let peak = 0;
    for (let step = 0; step < steps; step++) {
      this.before.set(this.offset);
      for (let j = 0; j < this.rows; j++)
        for (let i = 0; i < this.columns; i++) {
          const n = j * this.columns + i,
            p = n * 3;
          if (this.pinned[n]) continue;
          const dx = this.rest[p] - this.x,
            dy = this.rest[p + 1] - this.y;
          const weight = Math.exp(
            -(dx * dx + dy * dy) / (this.radius * this.radius),
          );
          for (let axis = 0; axis < 3; axis++) {
            const k = p + axis;
            const target =
              weight *
              decay *
              (axis === 0 ? this.tx : axis === 1 ? this.ty : this.tz);
            let sum = 0,
              count = 0;
            if (i > 0) {
              sum += this.offset[k - 3];
              count++;
            }
            if (i + 1 < this.columns) {
              sum += this.offset[k + 3];
              count++;
            }
            if (j > 0) {
              sum += this.offset[k - this.columns * 3];
              count++;
            }
            if (j + 1 < this.rows) {
              sum += this.offset[k + this.columns * 3];
              count++;
            }
            const bend = sum / count - this.offset[k];
            this.velocity[k] +=
              (140 * (target - this.offset[k]) +
                28 * bend -
                25 * this.velocity[k]) *
              h;
            this.next[k] = this.offset[k] + this.velocity[k] * h;
          }
          // Keep the inner silhouette out of the HTML menu aperture.
          if (j === this.rows - 1 && this.next[p + 1] * this.sign < 0) {
            this.next[p + 1] = 0;
            this.velocity[p + 1] = 0;
          }
          const length = Math.hypot(
            this.next[p],
            this.next[p + 1],
            this.next[p + 2],
          );
          if (length > this.limit)
            for (let a = 0; a < 3; a++) this.next[p + a] *= this.limit / length;
        }
      this.offset.set(this.next);
      // Two structural projections per step: local stretch remains bounded.
      for (let pass = 0; pass < 2; pass++)
        for (let j = 0; j < this.rows; j++)
          for (let i = 0; i < this.columns; i++) {
            const n = j * this.columns + i;
            if (i + 1 < this.columns) this.constrain(n, n + 1);
            if (j + 1 < this.rows) this.constrain(n, n + this.columns);
          }
      for (let i = 0; i < this.offset.length; i += 3) {
        const length = Math.sqrt(
          this.offset[i] ** 2 +
            this.offset[i + 1] ** 2 +
            this.offset[i + 2] ** 2,
        );
        if (length > this.limit)
          for (let axis = 0; axis < 3; axis++)
            this.offset[i + axis] *= this.limit / length;
        if (
          i / 3 >= (this.rows - 1) * this.columns &&
          this.offset[i + 1] * this.sign < 0
        ) {
          this.offset[i + 1] = 0;
          this.velocity[i + 1] = 0;
        }
      }
      if (h > 0)
        for (let i = 0; i < this.offset.length; i++)
          this.velocity[i] = (this.offset[i] - this.before[i]) / h;
      this.next.set(this.offset);
    }
    if (!this.dragging && age > 0.5) {
      const u = Math.min(1, (age - 0.5) / 0.65),
        fade = 1 - u * u * (3 - 2 * u);
      for (let i = 0; i < this.offset.length; i++) {
        this.offset[i] *= fade;
        this.velocity[i] *= fade;
      }
      this.next.set(this.offset);
    }
    for (let i = 0; i < this.offset.length; i++)
      peak = Math.max(
        peak,
        Math.abs(this.offset[i]),
        Math.abs(this.velocity[i]) * 0.1,
      );
    this.dirty =
      this.dragging ||
      (decay > 0.005 && Math.abs(this.ty) > 0) ||
      peak > 0.00008;
    if (!this.dirty) {
      this.offset.fill(0);
      this.velocity.fill(0);
    }
  }
  private constrain(a: number, b: number) {
    const ia = a * 3,
      ib = b * 3;
    const rx = this.rest[ib] - this.rest[ia],
      ry = this.rest[ib + 1] - this.rest[ia + 1],
      rz = this.rest[ib + 2] - this.rest[ia + 2];
    const x = rx + this.offset[ib] - this.offset[ia],
      y = ry + this.offset[ib + 1] - this.offset[ia + 1],
      z = rz + this.offset[ib + 2] - this.offset[ia + 2];
    const length = Math.sqrt(x * x + y * y + z * z),
      max = Math.sqrt(rx * rx + ry * ry + rz * rz) * 1.08;
    const wa = 1 - this.pinned[a],
      wb = 1 - this.pinned[b];
    if (length <= max || wa + wb === 0) return;
    const correction = (length - max) / length / (wa + wb);
    this.offset[ia] += x * correction * wa;
    this.offset[ib] -= x * correction * wb;
    this.offset[ia + 1] += y * correction * wa;
    this.offset[ib + 1] -= y * correction * wb;
    this.offset[ia + 2] += z * correction * wa;
    this.offset[ib + 2] -= z * correction * wb;
  }
}
