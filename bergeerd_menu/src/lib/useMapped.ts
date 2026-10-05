import { useMemo } from "react";
import { interpolate, useTransform, type MotionValue } from "motion/react";

/**
 * `useTransform(value, input, output)` computed in JS.
 *
 * Motion hands opacity driven directly by `useScroll` to the browser as a
 * native ViewTimeline animation, and in Chrome those come out with the wrong
 * range (e.g. hero content already 18% faded at scroll 0). Mapping through a
 * function keeps the animation on the JS path, where the offsets are right.
 */
export function useMapped(
  value: MotionValue<number>,
  input: number[],
  output: number[],
): MotionValue<number> {
  const map = useMemo(
    () => interpolate(input, output, { clamp: true }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [input.join(), output.join()],
  );
  return useTransform(value, (v) => map(v));
}
