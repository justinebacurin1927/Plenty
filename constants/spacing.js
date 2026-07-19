/**
 * Plenty — Spacing Scale Tokens
 *
 * Shared spacing scale used across all screens. Every screen should
 * consume these tokens rather than using inline margin/padding values.
 *
 * Spacing tokens are NOT theme-dependent (same in light/dark).
 */

export const spacing = {
  xxs: 2,
  xs: 4,
  xsm: 6,
  sm: 8,
  smd: 10,
  md: 12,
  lgm: 14,
  lg: 16,
  lgx: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
};

export function space(token) {
  if (__DEV__ && !(token in spacing)) {
    console.warn(`Plenty: spacing token "${token}" not found in scale`);
  }
  return spacing[token];
}
