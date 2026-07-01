/**
 * Magnetic — a subtle pointer-follow wrapper for hero CTAs. The child drifts a few
 * pixels toward the cursor and springs back on leave. Disabled under reduced motion
 * and on touch (no hover). Wrap a single interactive element.
 */
import * as React from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { spring, useReduce } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function Magnetic({
  children,
  className,
  strength = 0.35,
}: {
  children: React.ReactNode;
  className?: string;
  /** 0–1: how far the element drifts toward the cursor. */
  strength?: number;
}) {
  const { reduce } = useReduce();
  const ref = React.useRef<HTMLSpanElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, spring.gentle);
  const sy = useSpring(y, spring.gentle);

  const onMove = (e: React.MouseEvent) => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.span
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ x: sx, y: sy, display: "inline-flex" }}
      className={cn(className)}
    >
      {children}
    </motion.span>
  );
}

export default Magnetic;
