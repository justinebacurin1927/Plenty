/**
 * Manual mock for react-native-reanimated in test environments.
 *
 * Bypasses the real reanimated module tree to avoid:
 * 1. Native module initialization errors in jsdom/node
 * 2. react-native-worklets version compatibility checks
 * 3. Worklet transformation pipeline
 *
 * Provides lightweight React class components for react-native-svg and
 * synchronous reanimated function mocks.
 */
import React from "react";

// ── SVG components ──

function createSVGComponent(name) {
  return class extends React.Component {
    static displayName = name;
    render() {
      return React.createElement(name, this.props, this.props.children);
    }
    setNativeProps(props) {
      this._props = { ...this._props, ...props };
    }
  };
}

const Svg = createSVGComponent("Svg");
const Path = createSVGComponent("Path");
const Rect = createSVGComponent("Rect");
const Circle = createSVGComponent("Circle");
const G = createSVGComponent("G");
const Line = createSVGComponent("Line");
const Text = createSVGComponent("Text");
const TSpan = createSVGComponent("TSpan");
const TextPath = createSVGComponent("TextPath");
const Defs = createSVGComponent("Defs");
const Stop = createSVGComponent("Stop");
const LinearGradient = createSVGComponent("LinearGradient");
const RadialGradient = createSVGComponent("RadialGradient");
const ClipPath = createSVGComponent("ClipPath");
const Polygon = createSVGComponent("Polygon");
const Polyline = createSVGComponent("Polyline");
const Ellipse = createSVGComponent("Ellipse");
const Use = createSVGComponent("Use");
const Image = createSVGComponent("Image");

// ── Shared value proxy ──

function useSharedValue(init) {
  const ref = { value: init };
  return new Proxy(ref, {
    get(target, prop) {
      if (prop === "value") return target.value;
      if (prop === "get") return () => target.value;
      if (prop === "set")
        return (newVal) => {
          target.value =
            typeof newVal === "function" ? newVal(target.value) : newVal;
        };
      return target[prop];
    },
    set(target, prop, newVal) {
      if (prop === "value") {
        target.value = newVal;
        return true;
      }
      return false;
    },
  });
}

// ── Hooks ──

const NOOP = () => {};

const useAnimatedProps = (factory) => factory();
const useAnimatedStyle = (factory) => factory();
const useDerivedValue = (processor) => ({ value: processor() });
const useAnimatedReaction = NOOP;
const useEvent = () => NOOP;
const useAnimatedRef = () => ({ current: null });
const useAnimatedScrollHandler = () => NOOP;

// ── Animations ──

const withTiming = (toValue, _config, callback) => {
  callback?.(true);
  return toValue;
};
const withSpring = (toValue, _config, callback) => {
  callback?.(true);
  return toValue;
};
const withDecay = (_config, callback) => {
  callback?.(true);
  return 0;
};
const withRepeat = (animation, _count, _reverse) => animation;
const withSequence = (..._animations) => 0;
const withDelay = (_delayMs, nextAnimation) => nextAnimation;
const cancelAnimation = NOOP;

// ── Easing ──

const Easing = {
  linear: (t) => t,
  ease: (t) => t,
  quad: (t) => t * t,
  cubic: (t) => t * t * t,
  poly: (n) => (t) => Math.pow(t, n),
  sin: (t) => 1 - Math.cos((t * Math.PI) / 2),
  circle: (t) => 1 - Math.sqrt(1 - t * t),
  exp: (t) => Math.pow(2, 10 * (t - 1)),
  elastic: (b) => (t) =>
    1 - Math.pow(Math.cos((t * Math.PI) / 2), 3) * Math.cos(t * Math.PI * b),
  back: (s) => (t) => t * t * ((s + 1) * t - s),
  bounce: (t) => t,
  bezier: () => ({ factory: (t) => t }),
  bezierFn: (t) => t,
  steps: (steps, dir) => (t) =>
    dir === "start"
      ? Math.min(1, Math.floor(t * steps + 1) / steps)
      : Math.min(1, Math.ceil(t * steps) / steps),
  in: (easing) => easing,
  out: (easing) => easing,
  inOut: (easing) => easing,
};

// ── Interpolation ──

const Extrapolation = {
  EXTEND: "extend",
  CLAMP: "clamp",
  IDENTITY: "identity",
};

const interpolate = (value, inputRange, outputRange) => {
  const t = (value - inputRange[0]) / (inputRange[1] - inputRange[0]);
  return outputRange[0] + t * (outputRange[1] - outputRange[0]);
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// ── Animated component wrapper ──

const createAnimatedComponent = (Component) => Component;

// ── Layout animations ──

class BaseAnimationMock extends React.Component {
  render() {
    return this.props.children || null;
  }
}

const Layout = BaseAnimationMock;
const LinearTransition = BaseAnimationMock;
const FadingTransition = BaseAnimationMock;
const SequencedTransition = BaseAnimationMock;
const JumpingTransition = BaseAnimationMock;
const CurvedTransition = BaseAnimationMock;
const EntryExitTransition = BaseAnimationMock;

// ── Default Animated export ──

const Animated = {
  View: "AnimatedView",
  Text: "AnimatedText",
  Image: "AnimatedImage",
  ScrollView: "AnimatedScrollView",
  FlatList: "AnimatedFlatList",
  Extrapolate: Extrapolation,
  interpolate,
  interpolateColor: (_value, _input, colors) => colors[0],
  clamp,
  createAnimatedComponent,
  addWhitelistedUIProps: NOOP,
  addWhitelistedNativeProps: NOOP,
};

// ── Named exports ──

export default Animated;

export { useSharedValue };
export { useAnimatedProps };
export { useAnimatedStyle };
export { useDerivedValue };
export { useAnimatedReaction };
export { useEvent };
export { useAnimatedRef };
export { useAnimatedScrollHandler };
export { cancelAnimation };
export { withTiming };
export { withSpring };
export { withDecay };
export { withRepeat };
export { withSequence };
export { withDelay };
export { Easing };
export { Extrapolation };
export { interpolate };
export { clamp };
export { createAnimatedComponent };
export { Layout, LinearTransition, FadingTransition, SequencedTransition, JumpingTransition, CurvedTransition, EntryExitTransition };

// SVG components
export { Svg, Path, Rect, Circle, G, Line, Text, TSpan, TextPath, Defs, Stop, LinearGradient, RadialGradient, ClipPath, Polygon, Polyline, Ellipse, Use, Image };
