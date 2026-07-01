/**
 * Living Earth motion presets — a single source of truth for spring physics and
 * entrance variants. Standardized on the constants already used in Layout.tsx so
 * the whole app feels of one hand.
 */
import { useReducedMotion, type Transition, type Variants } from "framer-motion";

/** Spring presets. `snappy` for pills/toggles, `smooth` for larger surfaces. */
export const spring = {
  snappy: { type: "spring", stiffness: 500, damping: 34 } as Transition,
  smooth: { type: "spring", stiffness: 400, damping: 36 } as Transition,
  gentle: { type: "spring", stiffness: 220, damping: 30 } as Transition,
};

/** Easing curve matching the CSS `fade-up` animation. */
export const easeOutExpo: Transition["ease"] = [0.22, 1, 0.36, 1];

/** Standard entrance — fade + rise. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOutExpo } },
};

/** Container that staggers its children's entrances. */
export const stagger = (staggerChildren = 0.08, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren, delayChildren } },
});

/**
 * Reduced-motion aware flag + a helper that collapses any transition to instant.
 * Use in components that animate via framer JS (the CSS reduced-motion block in
 * index.css only neutralizes CSS animations, not framer springs).
 */
export function useReduce() {
  const reduce = useReducedMotion();
  return {
    reduce: !!reduce,
    t: (transition: Transition): Transition => (reduce ? { duration: 0 } : transition),
    /** Variants with motion stripped when the user prefers reduced motion. */
    variants: (v: Variants): Variants =>
      reduce ? { hidden: { opacity: 1 }, show: { opacity: 1 } } : v,
  };
}
