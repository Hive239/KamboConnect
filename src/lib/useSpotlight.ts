import * as React from "react";

/**
 * Cursor-follow spotlight. Returns an `onMouseMove` handler that writes the
 * pointer position into `--mx` / `--my` CSS variables on the hovered element.
 * Pair with <Spotlight/> (the radial-gradient overlay) on a `group relative
 * overflow-hidden` parent.
 */
export function useSpotlight() {
  const onMouseMove = React.useCallback((e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, []);
  return { onMouseMove };
}
