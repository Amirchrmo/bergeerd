import { useId, useMemo } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
} from "motion/react";
import type { BurgerRecipe } from "@/lib/burgerLayers";
import { cn } from "@/lib/utils";
import { LAYER_SPECS, LayerDefs, VB_W, type LayerSpec } from "./layerArt";

type LabelMode = "side" | "alternate" | "none";

interface BurgerStackProps {
  recipe: BurgerRecipe;
  /** Spring mode: animate between stacked (false) and exploded (true). */
  open?: boolean;
  /** Scrub mode: 0 = stacked, 1 = exploded. Takes precedence over `open`. */
  progress?: MotionValue<number>;
  /** Height of the drawing in SVG units (width is always 240). */
  viewHeight?: number;
  /** Largest gap between exploded layers, in SVG units. */
  maxGap?: number;
  labels?: LabelMode;
  /** Larger label pills (for the big showcase). */
  largeLabels?: boolean;
  /** Pointer x in [-0.5, 0.5]; fans the layers sideways for depth. */
  parallax?: MotionValue<number>;
  className?: string;
}

interface Placed {
  spec: LayerSpec;
  label: string;
  stacked: number;
  exploded: number;
}

function layout(recipe: BurgerRecipe, vbH: number, maxGap: number): Placed[] {
  const specs = recipe.layers.map((l) => LAYER_SPECS[l.kind]);
  const n = specs.length;
  const lines: number[] = [];
  let y = 0;
  for (const s of specs) {
    lines.push(y);
    y += s.t;
  }
  const top = -specs[0].top;
  const bottom = lines[n - 1] + specs[n - 1].bottom;
  const gap = Math.max(
    4,
    Math.min(maxGap, (vbH - 24 - (bottom - top)) / Math.max(1, n - 1)),
  );
  const offset = vbH / 2 - (top + bottom) / 2;
  return specs.map((spec, i) => ({
    spec,
    label: recipe.layers[i].label,
    stacked: lines[i] + offset,
    exploded: lines[i] + offset + (i - (n - 1) / 2) * gap,
  }));
}

/** Per-layer scrub window, so layers peel off one after another. */
// eslint-disable-next-line react-refresh/only-export-components
export const scrubRange = (i: number, n: number): [number, number] => {
  const start = (i / n) * 0.35;
  return [start, start + 0.65];
};

/**
 * An illustrated burger built from separate SVG layers that can come apart
 * vertically ("exploded view") and fall back together.
 */
const BurgerStack = ({
  recipe,
  open = false,
  progress,
  viewHeight = 340,
  maxGap = 28,
  labels = "side",
  largeLabels = false,
  parallax,
  className,
}: BurgerStackProps) => {
  const rawId = useId().replace(/:/g, "");
  const id = (name: string) => `bs${rawId}-${name}`;
  const placed = useMemo(
    () => layout(recipe, viewHeight, maxGap),
    [recipe, viewHeight, maxGap],
  );
  const n = placed.length;

  return (
    <div
      className={cn("relative", className)}
      style={{ aspectRatio: `${VB_W} / ${viewHeight}` }}
    >
      <svg
        viewBox={`0 0 ${VB_W} ${viewHeight}`}
        className="absolute inset-0 h-full w-full overflow-visible"
        aria-hidden="true"
      >
        <LayerDefs id={id} />
        {/* Paint bottom-up so upper layers cover the ones beneath. */}
        {placed
          .map((p, i) => (
            <Layer
              key={i}
              placed={p}
              i={i}
              n={n}
              open={open}
              progress={progress}
              parallax={parallax}
              id={id}
            />
          ))
          .reverse()}
      </svg>

      {labels !== "none" &&
        placed.map((p, i) =>
          p.label ? (
            <Label
              key={i}
              placed={p}
              i={i}
              n={n}
              mode={labels}
              open={open}
              progress={progress}
              viewHeight={viewHeight}
              large={largeLabels}
            />
          ) : null,
        )}

      <ul className="sr-only">
        {recipe.layers
          .filter((l) => l.label)
          .map((l, i) => (
            <li key={i}>{l.label}</li>
          ))}
      </ul>
    </div>
  );
};

interface LayerProps {
  placed: Placed;
  i: number;
  n: number;
  open: boolean;
  progress?: MotionValue<number>;
  parallax?: MotionValue<number>;
  id: (name: string) => string;
}

function Layer({ placed, i, n, open, progress, parallax, id }: LayerProps) {
  const zero = useMotionValue(0);
  const [start, end] = scrubRange(i, n);
  const yScrub = useTransform(
    progress ?? zero,
    [start, end],
    [placed.stacked, placed.exploded],
  );
  // Upper layers drift one way, lower layers the other: a subtle 3D fan.
  const depth = i - (n - 1) / 2;
  const x = useTransform(parallax ?? zero, (v) => v * depth * -7);

  const art = placed.spec.render(id);

  if (progress) {
    return <motion.g style={{ y: yScrub, x }}>{art}</motion.g>;
  }

  return (
    <motion.g
      initial={{ y: placed.stacked }}
      animate={{ y: open ? placed.exploded : placed.stacked }}
      transition={
        open
          ? // Opening: top bun lifts first, each layer follows.
            {
              type: "spring",
              stiffness: 170,
              damping: 18,
              mass: 0.9,
              delay: 0.06 + i * 0.045,
            }
          : // Closing: bottom settles first, top bun lands last with a bounce.
            {
              type: "spring",
              stiffness: 280,
              damping: 21,
              delay: (n - 1 - i) * 0.03,
            }
      }
      style={{ x }}
    >
      {art}
    </motion.g>
  );
}

interface LabelProps {
  placed: Placed;
  i: number;
  n: number;
  mode: LabelMode;
  open: boolean;
  progress?: MotionValue<number>;
  viewHeight: number;
  large: boolean;
}

function Label({
  placed,
  i,
  n,
  mode,
  open,
  progress,
  viewHeight,
  large,
}: LabelProps) {
  const zero = useMotionValue(0);
  const [, end] = scrubRange(i, n);
  const opacity = useTransform(progress ?? zero, [end - 0.18, end], [0, 1]);
  const toLeft = mode === "alternate" && i % 2 === 1;
  const slide = useTransform(opacity, [0, 1], [toLeft ? 10 : -10, 0]);

  const top = `${((placed.exploded + placed.spec.labelDy) / viewHeight) * 100}%`;
  const position = toLeft
    ? { right: mode === "alternate" ? "93%" : "88%" }
    : { left: mode === "alternate" ? "93%" : "88%" };

  const content = (
    <span
      dir="ltr"
      className={cn(
        "flex items-center gap-1.5 whitespace-nowrap",
        toLeft && "flex-row-reverse",
      )}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold shadow-[0_0_0_3px_hsl(var(--gold)/0.25)]" />
      <span className="h-px w-3 shrink-0 bg-gold/60 sm:w-5" />
      <span
        dir="rtl"
        className={cn(
          "rounded-full border border-white/10 bg-black/55 font-body font-medium leading-none text-cream backdrop-blur-sm",
          large
            ? "px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm"
            : "px-2.5 py-1 text-[11px] sm:text-xs",
        )}
      >
        {placed.label}
      </span>
    </span>
  );

  const style = { top, ...position, y: "-50%" } as const;

  if (progress) {
    return (
      <motion.div
        className="pointer-events-none absolute"
        style={{ ...style, opacity, x: slide }}
      >
        {content}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="pointer-events-none absolute"
      style={style}
      initial={{ opacity: 0, x: toLeft ? 10 : -10 }}
      animate={open ? { opacity: 1, x: 0 } : { opacity: 0, x: toLeft ? 6 : -6 }}
      transition={
        open
          ? { delay: 0.2 + i * 0.05, duration: 0.45, ease: [0.16, 1, 0.3, 1] }
          : { duration: 0.15 }
      }
    >
      {content}
    </motion.div>
  );
}

export default BurgerStack;
