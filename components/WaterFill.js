/**
 * WaterFill — Animated SVG wave component with ripple support.
 *
 * Renders a two-layer sine wave that fills a container based on the `fill` prop.
 * Layer 1 (front): faster, tighter wave, more opaque.
 * Layer 2 (back): slower, wider wave, more transparent — creates depth illusion.
 *
 * Exposes `triggerRipple()` via ref for calling from parent on drink log.
 * The ripple is a Gaussian amplitude bump that decays over ~600ms.
 *
 * Uses react-native-reanimated for 60fps UI-thread animation and react-native-svg
 * for the wave path rendering. Follows AD-11 (Reanimated as single animation layer).
 *
 * Props:
 *   fill     — 0–1, how full the container appears (animated smoothly)
 *   width    — container width in pixels
 *   height   — container height in pixels
 *
 * Ref methods:
 *   triggerRipple() — one-shot amplitude spike, decays to 0 over ~600ms
 */
import React, { useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import Svg, { Path, Rect, ClipPath, Defs } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
  createAnimatedComponent,
} from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";
import { buildWavePath, LAYER_CONFIG, RIPPLE_CONFIG } from "../utils/wave";
import { useReducedMotion, DURATION } from "../utils/motion";

const AnimatedPath = createAnimatedComponent(Path);
const AnimatedRect = createAnimatedComponent(Rect);

const WaterFill = forwardRef(function WaterFill({ fill = 0, width = 300, height = 400 }, ref) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();

  // Shared values for UI-thread animation
  const phase1 = useSharedValue(0);
  const phase2 = useSharedValue(0);
  const animatedFill = useSharedValue(fill);
  const containerWidth = useSharedValue(width);
  const containerHeight = useSharedValue(height);
  const rippleAmplitude = useSharedValue(0);

  // ── Imperative handle: triggerRipple ──
  useImperativeHandle(ref, () => ({
    triggerRipple() {
      if (reducedMotion) return;
      cancelAnimation(rippleAmplitude);
      rippleAmplitude.value = RIPPLE_CONFIG.spikeAmplitude;
      rippleAmplitude.value = withTiming(0, {
        duration: RIPPLE_CONFIG.duration,
        easing: Easing.out(Easing.cubic),
      });
    },
  }), [reducedMotion]);

  // Sync non-animated prop values to shared values
  useEffect(() => {
    containerWidth.value = width;
    containerHeight.value = height;
  }, [width, height]);

  // Smooth fill transitions
  useEffect(() => {
    animatedFill.value = withTiming(fill, {
      duration: reducedMotion ? 0 : 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [fill, reducedMotion]);

  // Continuous wave animation (idle motion)
  useEffect(() => {
    if (reducedMotion) return;

    phase1.value = withRepeat(
      withTiming(2 * Math.PI, {
        duration: DURATION.waveCycle,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    phase2.value = withRepeat(
      withTiming(2 * Math.PI, {
        duration: Math.round(DURATION.waveCycle / 0.7),
        easing: Easing.linear,
      }),
      -1,
      false
    );

    return () => {
      cancelAnimation(phase1);
      cancelAnimation(phase2);
    };
  }, [reducedMotion]);

  // Cleanup ripple animation on unmount
  useEffect(() => {
    return () => {
      cancelAnimation(rippleAmplitude);
    };
  }, []);

  // Water body rect — fills below the wave surface
  const bodyProps = useAnimatedProps(() => {
    const safeFill = Math.max(0, Math.min(1, animatedFill.value));
    const bodyH = containerHeight.value * safeFill;
    const y = containerHeight.value - bodyH;
    return {
      x: 0,
      y,
      width: containerWidth.value,
      height: bodyH,
    };
  });

  // Extract layer config values for worklet-safe access
  const { amplitude: amp1, frequency: freq1 } = LAYER_CONFIG[0];
  const { amplitude: amp2, frequency: freq2 } = LAYER_CONFIG[1];

  // Worklet-compatible gaussian function for the ripple
  const gaussian = useCallback((x, center, amp, sig) => {
    "worklet";
    if (amp < 0.5) return 0;
    return amp * Math.exp(-((x - center) ** 2) / (2 * sig ** 2));
  }, []);

  // Wave layer 1 (front) — faster, sharper, with ripple
  const waveProps1 = useAnimatedProps(() => {
    const ra = rippleAmplitude.value;
    const rc = (phase1.value % (2 * Math.PI)) / (2 * Math.PI) * containerWidth.value;

    const d = buildWavePath(
      containerWidth.value,
      containerHeight.value,
      animatedFill.value,
      amp1,
      freq1,
      phase1.value,
      (x) => gaussian(x, rc, ra, RIPPLE_CONFIG.sigma)
    );
    return { d };
  });

  // Wave layer 2 (back) — slower, wider, with scaled ripple
  const waveProps2 = useAnimatedProps(() => {
    const ra = rippleAmplitude.value;
    const rc = (phase2.value % (2 * Math.PI)) / (2 * Math.PI) * containerWidth.value;

    const d = buildWavePath(
      containerWidth.value,
      containerHeight.value,
      animatedFill.value,
      amp2,
      freq2,
      phase2.value + Math.PI / 2,
      (x) => gaussian(x, rc, ra * 0.7, RIPPLE_CONFIG.sigma * 1.2)
    );
    return { d };
  });

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <ClipPath id="water-clip">
          <Rect x={0} y={0} width={width} height={height} />
        </ClipPath>
      </Defs>

      {/* Water body — solid fill below the wave */}
      <AnimatedRect animatedProps={bodyProps} fill={colors.primary} />

      {/* Layer 2 (back) — wider amplitude, more transparent */}
      <AnimatedPath
        animatedProps={waveProps2}
        fill={colors.primaryLight}
        opacity={LAYER_CONFIG[1].opacity}
        clipPath="url(#water-clip)"
      />

      {/* Layer 1 (front) — tighter, more opaque, the visible surface */}
      <AnimatedPath
        animatedProps={waveProps1}
        fill={colors.primary}
        opacity={LAYER_CONFIG[0].opacity}
        clipPath="url(#water-clip)"
      />
    </Svg>
  );
});

export default WaterFill;
