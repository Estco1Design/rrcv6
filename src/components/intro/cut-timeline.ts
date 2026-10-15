/** A finite shot. Four strokes advance the cut at the intersection of the honed edges. */
export const INTRO_DURATION = 4.5;
export const clamp = (n: number) => Math.max(0, Math.min(1, n));
export const smooth = (n: number) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};
const openAngle = 0.158,
  closedAngle = 0.012,
  step = 0.24;
export const bladeContact = (angle: number) =>
  Math.min(1.45, 0.051176 / ((0.0232 + Math.tan(angle)) * Math.cos(angle)));
const minContact = bladeContact(openAngle),
  maxContact = bladeContact(closedAngle);
export const SHEAR_WIDTH_RATIO = (2 * step) / (maxContact - minContact);
export function cutFrame(seconds: number) {
  const t = Math.max(0, seconds),
    cutting = clamp((t - 1.3) / 1.7);
  const cycle = Math.min(3, Math.floor(cutting * 4)),
    phase = cutting >= 1 ? 1 : cutting * 4 - cycle;
  const closing = phase <= 0.64;
  const blade =
    t < 1.3
      ? openAngle * smooth((t - 0.8) / 0.5)
      : t >= 3
        ? openAngle + (closedAngle - openAngle) * smooth((t - 3) / 0.15)
        : closing
          ? openAngle + (closedAngle - openAngle) * smooth(phase / 0.64)
          : closedAngle +
            (openAngle - closedAngle) * smooth((phase - 0.64) / 0.36);
  const contact = bladeContact(blade);
  const stroke = closing
    ? (contact - minContact) / (maxContact - minContact)
    : 1;
  // During reopening, the hinge advances but the cutting intersection stays put.
  const advance = closing
    ? 0
    : (step * (maxContact - contact)) / (maxContact - minContact);
  return {
    seconds: t,
    light: smooth(t / 0.8),
    tool: t >= 0.8 && t < 3.7,
    entry: smooth((t - 0.8) / 0.5),
    cut: t < 1.3 ? -0.1 : t >= 3 ? 1 : 0.04 + step * (cycle + stroke),
    root:
      t >= 3
        ? 1 - (minContact * SHEAR_WIDTH_RATIO) / 2
        : 0.04 + cycle * step + advance - (minContact * SHEAR_WIDTH_RATIO) / 2,
    contact,
    spread: smooth((t - 3) / 0.7),
    blade,
    menu: smooth((t - 3.7) / 0.8),
    done: t >= INTRO_DURATION,
  };
}

export type CutFrame = ReturnType<typeof cutFrame>;
/** Tension follows the cut, then releases across the entire cloth after the tool exits. */
export function cutRelease(shot: CutFrame, u: number) {
  const lag = shot.seconds < 1.3 ? 0 : smooth((shot.cut - u) / 0.17);
  return lag + (1 - lag) * shot.spread;
}
export function clothEdge(
  shot: CutFrame,
  u: number,
  sign: number,
  finalY: number,
  release = cutRelease(shot, u),
) {
  const seam = 0.04 + 0.013 * Math.sin(u * 7) * (1 - shot.spread),
    gap = sign > 0 ? 0.1 : -0.11;
  return seam + release * (gap + (finalY - seam - gap) * shot.spread);
}

/** A small wrist roll gives real moving reflections without moving the cut line.
 * Rotate around the honed contact plane, rather than around the GLB origin.
 */
export function shearPresentation(seconds:number, scale:number, contactY=.04, contactZ=.286) {
  const shot=cutFrame(seconds);
  const exit=smooth((seconds-3)/.7);
  const roll=seconds<1.3 ? .11-.03*shot.entry : seconds>=3 ? .08+.03*exit
    : .08+.01*Math.sin((seconds-1.3)/1.7*8*Math.PI);
  return {roll,y:contactY+.226*scale*Math.sin(roll),z:contactZ-.226*scale*Math.cos(roll)};
}
