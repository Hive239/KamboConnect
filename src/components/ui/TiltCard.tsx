import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useReduce } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * TiltCard — pointer-driven 3D tilt for featured / hero tiles. The card leans
 * toward the cursor (spring-eased) and settles flat on leave. Reduced-motion
 * users get a plain, static wrapper. Keep to featured tiles — tilting a whole
 * grid reads janky.
 */
export function TiltCard({
  children,
  className,
  max = 6,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const { reduce } = useReduce();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 220, damping: 30 });
  const sy = useSpring(py, { stiffness: 220, damping: 30 });
  const rotateY = useTransform(sx, [0, 1], [-max, max]);
  const rotateX = useTransform(sy, [0, 1], [max, -max]);

  if (reduce) return <div className={className}>{children}</div>;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => { px.set(0.5); py.set(0.5); };

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX, rotateY, transformPerspective: 900, transformStyle: "preserve-3d" }}
      className={cn("relative", className)}
    >
      {children}
    </motion.div>
  );
}

export default TiltCard;
