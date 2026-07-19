/**
 * Plenty — Type Scale Tokens
 *
 * Shared type scale used across all screens. Every screen should
 * consume these tokens rather than using inline fontSize values.
 *
 * Type tokens are NOT theme-dependent (same in light/dark).
 *
 * Fonts:
 *   Fredoka — rounded, friendly — used for display, title, heading
 *   Poppins — clean, readable — used for body, label, caption, small
 */

export const type = {
  display: { fontSize: 36, fontWeight: "700", lineHeight: 44, fontFamily: "Fredoka-Bold" },
  title: { fontSize: 28, fontWeight: "700", lineHeight: 36, fontFamily: "Fredoka-Bold" },
  heading: { fontSize: 22, fontWeight: "600", lineHeight: 28, fontFamily: "Fredoka-SemiBold" },
  body: { fontSize: 16, fontWeight: "400", lineHeight: 24, fontFamily: "Poppins-Regular" },
  label: { fontSize: 15, fontWeight: "600", lineHeight: 22, fontFamily: "Poppins-SemiBold" },
  caption: { fontSize: 13, fontWeight: "600", lineHeight: 18, fontFamily: "Poppins-SemiBold" },
  small: { fontSize: 12, fontWeight: "400", lineHeight: 16, fontFamily: "Poppins-Regular" },
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
