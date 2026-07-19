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
  withTiming,
  cancelAnimation,
  Easing,
  createAnimatedComponent,
} from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";
import { buildWavePath, LAYER_CONFIG, RIPPLE_CONFIG } from "../utils/wave";
import { useReducedMotion } from "../utils/motion";

const AnimatedPath = createAnimatedComponent(Path);


const WaterFill = forwardRef(function WaterFill({ fill = 0, width = 300, height = 400, clipPathDef }, ref) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();

  // Shared values for UI-thread animation
  const phase1 = useSharedValue(0);


  const animatedFill = useSharedValue(fill);
  const containerWidth = useSharedValue(width);
  const containerHeight = useSharedValue(height);
  const rippleAmplitude = useSharedValue(0);

  // Shimmer shared values for goal-reached celebration
  const shimmerPosition = useSharedValue(0);
  const shimmerOpacity = useSharedValue(0);

  // ── Imperative handle: triggerRipple + triggerGoalCelebration ──
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

    triggerGoalCelebration() {
      if (reducedMotion) return;

      // Overshoot: briefly push fill past 1.0 then spring back
      cancelAnimation(animatedFill);
      animatedFill.value = withTiming(1.05, { duration: 400, easing: Easing.out(Easing.cubic) }, (finished) => {
        if (finished) {
          animatedFill.value = withTiming(1.0, { duration: 400, easing: Easing.inOut(Easing.cubic) });
        }
      });

      // Shimmer: white highlight sweeps left-to-right across the water surface
      cancelAnimation(shimmerPosition);
      cancelAnimation(shimmerOpacity);

      shimmerPosition.value = -containerWidth.value * 1.5;
      shimmerOpacity.value = withTiming(0.3, { duration: 500, easing: Easing.out(Easing.cubic) }, () => {
        shimmerOpacity.value = withTiming(0, { duration: 1000, easing: Easing.in(Easing.cubic) });
      });
      shimmerPosition.value = withTiming(containerWidth.value * 2, { duration: 1500 });
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

  // No continuous wave animation — static surface only.
  // The phase shared values stay at 0 so the wave is flat/stationary.
  // Ripple and goal celebration effects still work below.

  // Cleanup ripple and shimmer animations on unmount
  useEffect(() => {
    return () => {
      cancelAnimation(rippleAmplitude);
      cancelAnimation(shimmerPosition);
      cancelAnimation(shimmerOpacity);
    };
  }, []);

  // Water body rect is intentionally unused in the JSX. The wave layers
  // already fill from the wave surface to the container bottom via
  // buildWavePath's closing edges (L bottom-R, L bottom-L, Z). A separate
  // body rect creates a sharp horizontal-to-diagonal intersection at the
  // glass clip boundary (the "spike" artifact), so we skip it.
  // Hook kept for Reanimated hook-count consistency — not rendered.
  // eslint-disable-next-line react-hooks/rules-of-hooks
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

  // Shimmer overlay — sweeps left-to-right on goal hit
  const shimmerProps = useAnimatedProps(() => ({
    x: shimmerPosition.value,
    y: 0,
    width: containerWidth.value * 0.3,
    height: containerHeight.value,
    opacity: shimmerOpacity.value,
  }));

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <ClipPath id="water-clip">
          {clipPathDef || <Rect x={0} y={0} width={width} height={height} />}
        </ClipPath>
      </Defs>


      {/* Single wave layer — fully opaque. Amplitude=0 so flat, no spikes. */}
      <AnimatedPath
        animatedProps={waveProps1}
        fill={colors.primary}
        opacity={1}
        clipPath="url(#water-clip)"
      />

	      {/* Shimmer overlay -- intentionally not rendered. White AnimatedRect creates vertical spike artifacts at the glass clip-path boundary. Hooks kept for Reanimated hook-count stability. */}
    </Svg>
  );
});

export default WaterFill;
