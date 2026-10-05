import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import BurgerStack, { scrubRange } from "@/components/burger/BurgerStack";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMapped } from "@/lib/useMapped";
import { toPersianDigits, type BurgerRecipe } from "@/lib/burgerLayers";

interface BurgerAnatomyProps {
  name: string;
  recipe: BurgerRecipe;
}

/**
 * Scroll-driven showcase: a featured burger from the menu is pinned to the
 * screen and comes apart layer by layer as the visitor scrolls, then falls
 * back together before handing over to the menu.
 */
const BurgerAnatomy = ({ name, recipe }: BurgerAnatomyProps) => {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const isMobile = useIsMobile();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  // 0 → 1 (apart) → hold → 0 (together again).
  const raw = useTransform(scrollYProgress, [0.06, 0.46, 0.66, 0.94], [0, 1, 1, 0]);
  const smooth = useSpring(raw, { stiffness: 140, damping: 26, mass: 0.35 });
  const still = useMotionValue(1);
  const explode = reduced ? still : smooth;

  const bgX = useTransform(scrollYProgress, [0, 1], ["-18%", "18%"]);
  const introOpacity = useMapped(scrollYProgress, [0, 0.12], [1, 0]);
  const midOpacity = useMapped(scrollYProgress, [0.36, 0.46, 0.62, 0.7], [0, 1, 1, 0]);
  const outroOpacity = useMapped(scrollYProgress, [0.84, 0.95], [0, 1]);
  const barScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const named = recipe.layers.filter((l) => l.label);
  const n = recipe.layers.length;

  return (
    <section
      id="anatomy"
      ref={ref}
      className={reduced ? "relative" : "relative h-[280vh] md:h-[320vh]"}
    >
      <div
        className={
          reduced
            ? "relative overflow-hidden py-24"
            : "sticky top-0 flex h-[100svh] items-center overflow-hidden"
        }
      >
        {/* glow + drifting outlined name */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/25 blur-[120px]" />
        <motion.div
          aria-hidden="true"
          style={{ x: bgX }}
          className="text-outline pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none whitespace-nowrap text-center font-display text-[26vw] leading-none opacity-40 md:text-[18vw]"
        >
          {name}
        </motion.div>

        <div className="container relative mx-auto grid h-full grid-rows-[auto_1fr] items-center gap-2 px-4 pt-20 md:grid-cols-[1fr_1.1fr] md:grid-rows-1 md:gap-10 md:pt-0">
          {/* copy */}
          <div className="relative z-10 text-center md:text-right">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 font-body text-xs text-gold">
              آناتومی {name}
            </span>
            <h2 className="font-display text-4xl leading-[1.15] text-cream sm:text-5xl md:text-7xl">
              هر لایه،
              <br />
              <span className="text-gradient-fire">یه دلیل داره.</span>
            </h2>

            <div className="relative mt-4 h-7 font-body text-sm text-muted-foreground md:mt-6 md:text-base">
              <motion.p style={{ opacity: reduced ? 0 : introOpacity }} className="absolute inset-0">
                اسکرول کن تا لایه‌ها از هم باز بشن.
              </motion.p>
              <motion.p style={{ opacity: reduced ? 1 : midOpacity }} className="absolute inset-0">
                {toPersianDigits(n)} لایه، روی هم، توی یه گاز.
              </motion.p>
              <motion.p style={{ opacity: reduced ? 0 : outroOpacity }} className="absolute inset-0 text-cream">
                آماده‌ست. حالا نوبت توئه که انتخاب کنی.
              </motion.p>
            </div>

            {/* layer checklist (desktop) */}
            <ol className="mt-8 hidden max-w-sm space-y-1.5 md:block">
              {named.map((l) => {
                const i = recipe.layers.indexOf(l);
                return (
                  <LayerRow
                    key={l.kind}
                    label={l.label}
                    number={named.indexOf(l) + 1}
                    i={i}
                    n={n}
                    explode={explode}
                  />
                );
              })}
            </ol>
          </div>

          {/* burger */}
          <div className="relative flex h-full min-h-0 items-center justify-center md:h-[86svh]">
            <BurgerStack
              recipe={recipe}
              progress={explode}
              viewHeight={460}
              maxGap={40}
              labels={isMobile ? "side" : "alternate"}
              largeLabels
              className={
                isMobile
                  ? "h-[min(58svh,520px)] -translate-x-[18%]"
                  : "h-full max-h-[760px]"
              }
            />
          </div>
        </div>

        {/* progress rail */}
        {!reduced && (
          <div className="absolute bottom-6 left-1/2 h-px w-40 -translate-x-1/2 bg-white/10">
            <motion.div
              style={{ scaleX: barScale }}
              className="h-full origin-right bg-gradient-to-l from-primary to-gold"
            />
          </div>
        )}
      </div>
    </section>
  );
};

function LayerRow({
  label,
  number,
  i,
  n,
  explode,
}: {
  label: string;
  number: number;
  i: number;
  n: number;
  explode: MotionValue<number>;
}) {
  const [, end] = scrubRange(i, n);
  const opacity = useTransform(explode, [end - 0.25, end], [0.3, 1]);
  const x = useTransform(explode, [end - 0.25, end], [0, -8]);
  return (
    <motion.li
      style={{ opacity, x }}
      className="flex items-center gap-3 font-body text-sm text-cream"
    >
      <span className="w-6 font-display text-gold">
        {toPersianDigits(String(number).padStart(2, "0"))}
      </span>
      <span className="h-px w-6 bg-white/20" />
      {label}
    </motion.li>
  );
}

export default BurgerAnatomy;
