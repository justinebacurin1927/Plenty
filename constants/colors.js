/**
 * Plenty — Light & Dark Theme Palettes
 *
 * All color tokens used across the app. Every file should import
 * from here via the ThemeContext rather than using raw hex values.
 */

const light = {
  // ── Backgrounds ──
  bg: "#E8F4FD",
  surface: "#FFFFFF",
  surfaceSecondary: "#F5F9FF",
  surfaceTertiary: "#F0F4F8",

  // ── Brand ──
  primary: "#4A90D9",
  primaryLight: "#A0C4E8",
  primaryBg: "#E8F0FE",

  // ── Text ──
  text: "#1A3A5C",
  textSecondary: "#6B8CAB",
  textTertiary: "#A0B8D0",
  textMuted: "#B8D0E8",
  textSection: "#4A6A85",
  textInverse: "#FFFFFF",

  // ── Status ──
  success: "#27AE60",
  successBg: "#F0FFF4",
  successLight: "#E8F8EE",
  warning: "#E67E22",
  warningBg: "#FFF3E0",
  error: "#E8596E",

  // ── Borders ──
  border: "#D6E4F0",
  borderLight: "#E8F0FE",
  borderSuccess: "#A0D8B0",

  // ── Misc ──
  separator: "#D6E4F0",
  goalSuggestionBg: "#FFF8E1",
  goalSuggestionText: "#8D6E00",
  mascotMoodBorder: "#A0D8B0",

  // ── Overlays ──
  overlay: "rgba(0,0,0,0.4)",
  overlayDark: "rgba(0,0,0,0.5)",

  // ── Tab Bar ──
  tabBar: "#FFFFFF",
  tabBarBorder: "#E8F0FE",
  tabActive: "#4A90D9",
  tabInactive: "#B8D0E8",

  // ── Weather banners ──
  warmBg: "#F0A050",
  highBg: "#E67E22",
  extremeBg: "#E8596E",

  // ── Charts ──
  barDefault: "#A0C4E8",
  barToday: "#4A90D9",

  // ── Confetti ──
  confetti: ["#4A90D9", "#E67E22", "#27AE60", "#E8596E", "#F1C40F", "#9B59B6"],

  // ── Switch ──
  switchTrackOff: "#D6E4F0",
  switchTrackOn: "#A0C4E8",
  switchThumbOff: "#f4f3f4",
  switchThumbOn: "#4A90D9",
};

const dark = {
  // ── Backgrounds ──
  bg: "#0D1B2A",
  surface: "#1B2838",
  surfaceSecondary: "#23304A",
  surfaceTertiary: "#1E2D42",

  // ── Brand ──
  primary: "#6BB5FF",
  primaryLight: "#4A7FA8",
  primaryBg: "#1A2D44",

  // ── Text ──
  text: "#E0EAFF",
  textSecondary: "#8A9BB5",
  textTertiary: "#5A6F8A",
  textMuted: "#4A5F7A",
  textSection: "#8A9BB5",
  textInverse: "#FFFFFF",

  // ── Status ──
  success: "#4ADE80",
  successBg: "#0D2E1A",
  successLight: "#0D2E1A",
  warning: "#F0A050",
  warningBg: "#2E1F0D",
  error: "#FF6B6B",

  // ── Borders ──
  border: "#2A3D52",
  borderLight: "#23304A",
  borderSuccess: "#1A4A30",

  // ── Misc ──
  separator: "#2A3D52",
  goalSuggestionBg: "#2E2A0D",
  goalSuggestionText: "#E8C84A",
  mascotMoodBorder: "#4ADE80",

  // ── Overlays ──
  overlay: "rgba(0,0,0,0.6)",
  overlayDark: "rgba(0,0,0,0.7)",

  // ── Tab Bar ──
  tabBar: "#1B2838",
  tabBarBorder: "#2A3D52",
  tabActive: "#6BB5FF",
  tabInactive: "#4A5F7A",

  // ── Weather banners ──
  warmBg: "#8A5A20",
  highBg: "#8A5A20",
  extremeBg: "#8A2020",

  // ── Charts ──
  barDefault: "#2A4A6A",
  barToday: "#6BB5FF",

  // ── Confetti ──
  confetti: ["#6BB5FF", "#F0A050", "#4ADE80", "#FF6B6B", "#F1C40F", "#9B59B6"],

  // ── Switch ──
  switchTrackOff: "#2A3D52",
  switchTrackOn: "#2A4A6A",
  switchThumbOff: "#5A6F8A",
  switchThumbOn: "#6BB5FF",
};

export { light, dark };
