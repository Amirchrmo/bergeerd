import { useRef, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { ArrowDown, Gamepad2, Instagram } from "lucide-react";
import LOGOHeader from "@/assets/bergerd1 tp.gif";
import LOGOTITLE from "@/assets/LOGO-title.png";
import { LAYER_SPECS, LayerDefs } from "@/components/burger/layerArt";
import type { LayerKind } from "@/lib/burgerLayers";
import { scrollToId } from "@/lib/smoothScroll";
import { useMapped } from "@/lib/useMapped";
import { cn } from "@/lib/utils";

interface HeroProps {
  /** True once the intro loader has finished; starts the entrance. */
  ready: boolean;
}

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/** Ingredients floating around the logo (position, size, depth, tilt). */
const FLOATERS: {
  kind: LayerKind;
  className: string;
  depth: number;
  rotate: number;
  delay: number;
  desktopOnly?: boolean;
}[] = [
  { kind: "lettuce", className: "left-[4%] top-[14%] w-28 md:left-[9%] md:top-[18%] md:w-44", depth: 34, rotate: -16, delay: 0 },
  { kind: "tomato", className: "left-[6%] bottom-[18%] w-24 md:left-[14%] md:bottom-[16%] md:w-36", depth: 52, rotate: 12, delay: 1.1 },
  { kind: "cheddar", className: "right-[4%] top-[12%] w-28 md:right-[10%] md:top-[20%] md:w-40", depth: 26, rotate: 14, delay: 0.5 },
  { kind: "pickles", className: "right-[6%] bottom-[20%] w-24 md:right-[13%] md:bottom-[18%] md:w-36", depth: 44, rotate: -10, delay: 1.6 },
  { kind: "bacon", className: "left-[2%] top-[46%] w-36", depth: 60, rotate: 18, delay: 0.8, desktopOnly: true },
  { kind: "jalapeno", className: "right-[3%] top-[48%] w-32", depth: 38, rotate: -20, delay: 2, desktopOnly: true },
];

/**
 * Full-screen brand-red hero: mascot, wordmark, tagline and the two CTAs.
 * Ingredients float around with pointer parallax; on scroll the red panel
 * shrinks into a rounded card while the content drifts away.
 */
const Hero = ({ ready }: HeroProps) => {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const panelScale = useTransform(scrollYProgress, [0, 1], [1, 0.88]);
  const radius = useTransform(scrollYProgress, [0, 0.35], [0, 56]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const contentOpacity = useMapped(scrollYProgress, [0, 0.6], [1, 0]);

  // Pointer parallax (mouse only).
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 60, damping: 18 });
  const sy = useSpring(py, { stiffness: 60, damping: 18 });
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || reduced) return;
    px.set(e.clientX / window.innerWidth - 0.5);
    py.set(e.clientY / window.innerHeight - 0.5);
  };
  const logoX = useTransform(sx, (v) => v * -14);
  const logoY = useTransform(sy, (v) => v * -10);
  const dotsX = useTransform(sx, (v) => v * 20);
  const dotsY = useTransform(sy, (v) => v * 20);

  const show = ready ? "show" : "hidden";

  return (
    <header
      ref={ref}
      onPointerMove={onPointerMove}
      className="relative h-[100svh] min-h-[620px] bg-background"
    >
      <motion.div
        style={{
          scale: panelScale,
          borderBottomLeftRadius: radius,
          borderBottomRightRadius: radius,
        }}
        className="absolute inset-0 origin-top overflow-hidden bg-brand text-white"
      >
        {/* halftone texture (the logo's hand-printed dots) */}
        <motion.div
          aria-hidden="true"
          style={{ x: dotsX, y: dotsY }}
          className="halftone pointer-events-none absolute -inset-10 opacity-60"
        />

        {/* top bar */}
        <motion.nav
          initial={{ opacity: 0, y: -16 }}
          animate={show}
          variants={{ show: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: -16 } }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO, delay: 0.5 }}
          className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-5 md:px-10"
        >
          <div className="flex items-center gap-1 font-body text-sm">
            {[
              ["menu", "منو"],
              ["entertainment", "بازی"],
              ["location", "کجا هستیم"],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => scrollToId(id)}
                className="rounded-full px-3 py-1.5 text-white/85 transition-colors hover:bg-white/10 hover:text-white"
              >
                {label}
              </button>
            ))}
          </div>
          <a
            href="https://instagram.com/bergeerd"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="اینستاگرام برگرد"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/30 text-white transition-colors hover:bg-white hover:text-brand"
          >
            <Instagram className="h-4 w-4" />
          </a>
        </motion.nav>

        {/* floating ingredients */}
        {FLOATERS.map((f, i) => (
          <Floater key={f.kind} {...f} index={i} sx={sx} sy={sy} ready={ready} />
        ))}

        {/* content */}
        <motion.div
          style={{ y: contentY, opacity: contentOpacity }}
          className="relative z-[1] flex h-full flex-col items-center justify-center px-4 pt-10 text-center"
        >
          <motion.div style={{ x: logoX, y: logoY }}>
            <motion.img
              src={LOGOHeader}
              alt="لوگوی برگرد"
              initial={{ scale: 0.4, opacity: 0, rotate: -12 }}
              animate={show}
              variants={{
                show: { scale: 1, opacity: 1, rotate: 0 },
                hidden: { scale: 0.4, opacity: 0, rotate: -12 },
              }}
              transition={{ type: "spring", stiffness: 160, damping: 13, delay: 0.05 }}
              className="h-44 w-44 object-contain sm:h-52 sm:w-52 md:h-60 md:w-60"
            />
          </motion.div>

          <div className="overflow-hidden">
            <motion.img
              src={LOGOTITLE}
              alt="برگرد — Bergeerd"
              initial={{ y: "110%" }}
              animate={show}
              variants={{ show: { y: "0%" }, hidden: { y: "110%" } }}
              transition={{ duration: 1.1, ease: EASE_OUT_EXPO, delay: 0.2 }}
              className="h-24 w-auto md:h-32"
            />
          </div>

          <div className="mt-4 overflow-hidden">
            <motion.p
              initial={{ y: "110%" }}
              animate={show}
              variants={{ show: { y: "0%" }, hidden: { y: "110%" } }}
              transition={{ duration: 1, ease: EASE_OUT_EXPO, delay: 0.35 }}
              className="font-display text-2xl text-white/95 md:text-4xl"
            >
              یه گرد خوشمزه
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={show}
            variants={{ show: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } }}
            transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: 0.5 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <Magnetic>
              <button
                onClick={() => scrollToId("menu")}
                className="group flex items-center gap-2 rounded-full bg-white px-8 py-4 font-body text-base font-bold text-brand shadow-[0_18px_40px_-12px_rgba(0,0,0,0.45)] transition-transform duration-300 active:scale-95"
              >
                مشاهده منو
                <ArrowDown className="h-4 w-4 transition-transform duration-500 group-hover:translate-y-1" />
              </button>
            </Magnetic>
            <button
              onClick={() => scrollToId("entertainment")}
              className="flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-7 py-4 font-body text-base font-bold text-white backdrop-blur transition-colors duration-300 hover:bg-white/20 active:scale-95"
            >
              <Gamepad2 className="h-5 w-5" />
              بازی
            </button>
          </motion.div>
        </motion.div>

        {/* scroll cue */}
        <motion.button
          onClick={() => scrollToId("menu")}
          initial={{ opacity: 0 }}
          animate={show}
          variants={{ show: { opacity: 1 }, hidden: { opacity: 0 } }}
          transition={{ duration: 1, delay: 1 }}
          aria-label="اسکرول به پایین"
          className="absolute bottom-6 left-1/2 z-[1] flex -translate-x-1/2 flex-col items-center gap-2 font-body text-xs text-white/75"
        >
          اسکرول کن
          <span className="relative h-10 w-px overflow-hidden bg-white/25">
            <span className="scroll-cue absolute inset-x-0 top-0 h-1/2 bg-white" />
          </span>
        </motion.button>

        {/* giant outlined wordmark along the bottom edge */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-[3vw] left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-display text-[22vw] leading-none text-transparent opacity-[0.12] [-webkit-text-stroke:2px_white]"
          dir="ltr"
        >
          BERGEERD
        </div>
      </motion.div>
    </header>
  );
};

/** A single illustrated ingredient drifting with the pointer. */
function Floater({
  kind,
  className,
  depth,
  rotate,
  delay,
  desktopOnly,
  index,
  sx,
  sy,
  ready,
}: (typeof FLOATERS)[number] & {
  index: number;
  sx: MotionValue<number>;
  sy: MotionValue<number>;
  ready: boolean;
}) {
  const x = useTransform(sx, (v) => v * depth);
  const y = useTransform(sy, (v) => v * depth);
  const spec = LAYER_SPECS[kind];
  const id = (n: string) => `hero-${kind}-${n}`;
  return (
    <motion.div
      aria-hidden="true"
      style={{ x, y }}
      className={cn(
        "pointer-events-none absolute z-0",
        desktopOnly && "hidden lg:block",
        className,
      )}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0, rotate: rotate - 40 }}
        animate={ready ? { scale: 1, opacity: 1, rotate } : undefined}
        transition={{ type: "spring", stiffness: 120, damping: 12, delay: 0.35 + index * 0.08 }}
      >
        <div
          className="animate-float-soft drop-shadow-[0_24px_24px_rgba(60,0,0,0.45)]"
          style={{ animationDelay: `${delay}s`, animationDuration: `${6 + index}s` }}
        >
          <svg viewBox={`0 ${-spec.top - 4} 240 ${spec.top + spec.bottom + 8}`} className="w-full overflow-visible">
            <LayerDefs id={id} />
            {spec.render(id)}
          </svg>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Pulls its child slightly toward the cursor. */
function Magnetic({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 200, damping: 15 });
  const y = useSpring(0, { stiffness: 200, damping: 15 });
  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * 0.3);
        y.set((e.clientY - (r.top + r.height / 2)) * 0.4);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

export default Hero;
