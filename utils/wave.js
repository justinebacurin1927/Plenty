/**
 * Pure wave math functions for the WaterFill SVG component.
 *
 * All functions are side-effect-free and unit-testable without React.
 *
 * The wave is a sine curve: y = A * sin(2π * f * x + phase) + baseline
 *
 * buildWavePath returns an SVG path string that traces the wave surface
 * across the container width and closes around the bottom, producing a
 * filled water shape suitable for use with <Path d={...} />.
 */

/**
 * Calculate the y-coordinate of a sine wave at a given x position.
 *
 * @param {number} x        — horizontal position in pixels
 * @param {number} amplitude    — wave height in pixels (peak-to-peak / 2)
 * @param {number} frequency    — waves per container width (cycles per unit x)
 * @param {number} phase        — horizontal phase offset in radians
 * @param {number} baseline     — the "resting" y position (top of water surface)
 * @returns {number} the y-coordinate on the wave surface
 */
export function sineY(x, amplitude, frequency, phase, baseline) {
  "worklet";
  return amplitude * Math.sin(2 * Math.PI * frequency * x + phase) + baseline;
}

/**
 * Build an SVG path string for a filled wave shape.
 *
 * The path traces the sine wave surface from left to right, then drops
 * to the bottom of the container, runs left along the bottom, and closes
 * back to the starting point. The resulting shape fills like a body of
 * water whose surface is the sine wave.
 *
 * @param {number} width        — container width in pixels
 * @param {number} height       — container height in pixels
 * @param {number} fillRatio    — 0–1, how full the container is (0=empty, 1=full)
 * @param {number} amplitude    — wave amplitude in pixels
 * @param {number} frequency    — wave frequency
 * @param {number} phase        — phase offset in radians
 * @returns {string} SVG path data string
 */
export function buildWavePath(width, height, fillRatio, amplitude, frequency, phase, rippleFn = () => 0) {
  "worklet";
  const safeWidth = Math.max(width, 1); // prevent degenerate paths from zero-width input
  const baseline = height * (1 - Math.max(0, Math.min(1, fillRatio)));
  const segments = Math.max(Math.round(safeWidth / 4), 8); // one control point every ~4px

  // Build the wave surface curve using quadratic beziers that pass through
  // the sine midpoint at t=0.5 for better curve fidelity
  let prevY = sineY(0, amplitude, frequency, phase, baseline) + rippleFn(0);
  let d = `M0,${prevY}`;
  for (let i = 1; i <= segments; i++) {
    const x1 = (i / segments) * safeWidth;
    const cpx = ((i - 0.5) / segments) * safeWidth;
    const endY = sineY(x1, amplitude, frequency, phase, baseline) + rippleFn(x1);
    const midY = sineY(cpx, amplitude, frequency, phase, baseline) + rippleFn(cpx);
    // Correct control point: Q passes through midY at t=0.5
    const cp1y = 2 * midY - 0.5 * prevY - 0.5 * endY;
    const cp1x = cpx;
    d += ` Q${cp1x},${cp1y} ${x1},${endY}`;
    prevY = endY;
  }

  // Close the shape: right edge down, bottom edge left, left edge up
  d += ` L${safeWidth},${height} L0,${height} Z`;

  return d;
}

/**
 * Configuration for the two wave layers.
 *
 * Layer 0 (front): faster, tighter, more opaque
 * Layer 1 (back):  slower, wider, more transparent — creates depth illusion
 */
export const LAYER_CONFIG = [
  { amplitude: 8, frequency: 1, speed: 1, opacity: 0.85 },
  { amplitude: 12, frequency: 0.6, speed: 0.7, opacity: 0.4 },
];

/**
 * Ripple configuration for the WaterFill wave ripple effect.
 *
 * The ripple is a Gaussian bump added to the wave surface:
 *   rippleY(x) = spikeAmplitude * exp(-(x - center)^2 / (2 * sigma^2))
 *
 * It decays from spikeAmplitude → 0 over `duration` ms.
 *
 * @property {number} spikeAmplitude — peak height of the Gaussian bump (px)
 * @property {number} sigma          — width/spread of the bump (px)
 * @property {number} duration       — decay time from spike to 0 (ms)
 */
export const RIPPLE_CONFIG = {
  spikeAmplitude: 20,
  sigma: 60,
  duration: 600,
};

/**
 * Calculate the Gaussian ripple y-offset at a given x position.
 *
 * Returns the additional y-offset contributed by the ripple at position x.
 * When amplitude is 0 or negligible, returns 0.
 *
 * @param {number} x         — position on the wave surface (px)
 * @param {number} center    — center of the ripple (px)
 * @param {number} amplitude — peak height of the ripple (px)
 * @param {number} [sigma=60] — width/spread of the ripple (px)
 * @returns {number} the ripple y-offset at position x
 */
export function rippleY(x, center, amplitude, sigma = 60) {
  "worklet";
  if (amplitude < 0.5) return 0;
  const safeSigma = Math.max(sigma, 1);
  return amplitude * Math.exp(-((x - center) ** 2) / (2 * safeSigma ** 2));
}
