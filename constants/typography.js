/**
 * Plenty — Type Scale Tokens
 *
 * Shared type scale used across all screens. Every screen should
 * consume these tokens rather than using inline fontSize values.
 *
 * Type tokens are NOT theme-dependent (same in light/dark).
 */

export const type = {
  display: { fontSize: 36, fontWeight: "800", lineHeight: 44 },
  title: { fontSize: 28, fontWeight: "700", lineHeight: 36 },
  heading: { fontSize: 22, fontWeight: "700", lineHeight: 28 },
  body: { fontSize: 16, fontWeight: "400", lineHeight: 24 },
  label: { fontSize: 15, fontWeight: "600", lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  small: { fontSize: 12, fontWeight: "400", lineHeight: 16 },
};

export function fontSize(token) {
  if (__DEV__ && !(token in type)) {
    console.warn(`Plenty: type token "${token}" not found in scale`);
  }
  return type[token]?.fontSize;
}

export function lineHeight(token) {
  if (__DEV__ && !(token in type)) {
    console.warn(`Plenty: type token "${token}" not found in scale`);
  }
  return type[token]?.lineHeight;
}
