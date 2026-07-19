/**
 * Plenty — Type Scale Tokens
 *
 * Shared type scale used across all screens. Every screen should
 * consume these tokens rather than using inline fontSize values.
 *
 * Type tokens are NOT theme-dependent (same in light/dark).
 *
 * Fonts:
 *   Quicksand — soft, rounded — used for display, title, heading
 *   Nunito — clean, readable — used for body, label, caption, small
 */

export const type = {
  display: { fontSize: 36, fontWeight: "800", lineHeight: 44, fontFamily: "Quicksand-Bold" },
  title: { fontSize: 28, fontWeight: "700", lineHeight: 36, fontFamily: "Quicksand-Bold" },
  heading: { fontSize: 22, fontWeight: "700", lineHeight: 28, fontFamily: "Quicksand-SemiBold" },
  body: { fontSize: 16, fontWeight: "400", lineHeight: 24, fontFamily: "Nunito-Regular" },
  label: { fontSize: 15, fontWeight: "600", lineHeight: 22, fontFamily: "Nunito-SemiBold" },
  caption: { fontSize: 13, fontWeight: "600", lineHeight: 18, fontFamily: "Nunito-SemiBold" },
  small: { fontSize: 12, fontWeight: "400", lineHeight: 16, fontFamily: "Nunito-Regular" },
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

export function fontFamily(token) {
  if (__DEV__ && !(token in type)) {
    console.warn(`Plenty: type token "${token}" not found in scale`);
  }
  return type[token]?.fontFamily;
}
