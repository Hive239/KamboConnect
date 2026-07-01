/**
 * Reveal — scroll-into-view entrance. Fades + rises once, respects reduced motion.
 * Replaces the copy-pasted `initial={{opacity:0,y:20}}` blocks across the app.
 *
 *   <Reveal>…</Reveal>                       // single element
 *   <Reveal stagger>…children…</Reveal>      // container that staggers its children
 *   <Reveal.Item>…</Reveal.Item>             // a staggered child
 */
import * as React from "react";
import { motion, type MotionProps } from "framer-motion";
import { fadeUp, stagger, useReduce } from "@/lib/motion";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Treat as a stagger container for <Reveal.Item> children. */
  stagger?: boolean;
  /** Seconds between staggered children. */
  step?: number;
  /** Delay before starting. */
  delay?: number;
  /** How much must be visible before firing (0–1). */
  amount?: number;
  as?: React.ElementType;
} & Omit<MotionProps, "variants" | "initial" | "whileInView">;

function Reveal({
  children,
  className,
  stagger: isStagger = false,
  step = 0.08,
  delay = 0,
  amount = 0.25,
  as = "div",
  ...rest
}: RevealProps) {
  const { variants } = useReduce();
  const Comp = motion[as as keyof typeof motion] as typeof motion.div;
  const v = isStagger ? stagger(step, delay) : fadeUp;
  return (
    <Comp
      className={cn(className)}
      variants={variants(v as any)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      {...rest}
    >
      {children}
    </Comp>
  );
}

function Item({
  children,
  className,
  as = "div",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
} & MotionProps) {
  const { variants } = useReduce();
  const Comp = motion[as as keyof typeof motion] as typeof motion.div;
  return (
    <Comp className={cn(className)} variants={variants(fadeUp)} {...rest}>
      {children}
    </Comp>
  );
}

Reveal.Item = Item;
export { Reveal };
export default Reveal;
