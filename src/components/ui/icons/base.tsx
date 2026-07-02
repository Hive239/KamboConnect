/**
 * KamboGuide bespoke icon engine. One cohesive language: 24px grid, 1.75 rounded
 * strokes, currentColor, a simplified `weight` prop (regular|bold|fill|duotone)
 * compatible with the old Phosphor call sites (so nothing breaks when swapped in).
 */
import * as React from "react";

export type IconWeight = "regular" | "bold" | "fill" | "duotone";

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, "ref"> {
  weight?: IconWeight;
  size?: number | string;
}

export function makeIcon(
  render: (weight: IconWeight) => React.ReactNode,
  displayName: string,
) {
  const C = React.forwardRef<SVGSVGElement, IconProps>(function Icon(
    { weight = "regular", size, className, style, ...rest }, ref,
  ) {
    return (
      <svg
        ref={ref}
        viewBox="0 0 24 24"
        width={size ?? "1em"}
        height={size ?? "1em"}
        fill="none"
        stroke="currentColor"
        strokeWidth={weight === "bold" ? 2.25 : 1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
        aria-hidden="true"
        {...rest}
      >
        {render(weight)}
      </svg>
    );
  });
  C.displayName = displayName;
  return C;
}

/** Faint filled backdrop layer for duotone/fill weights. */
export function Duo({ d, weight, opacity = 0.2 }: { d: string; weight: IconWeight; opacity?: number }) {
  if (weight !== "duotone" && weight !== "fill") return null;
  return <path d={d} fill="currentColor" stroke="none" opacity={weight === "fill" ? 1 : opacity} />;
}
