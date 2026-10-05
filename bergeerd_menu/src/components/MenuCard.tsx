import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { Heart, Layers } from "lucide-react";
import BurgerStack from "@/components/burger/BurgerStack";
import { useActiveCard } from "@/components/menu/ActiveCardContext";
import { parseBurgerRecipe, toPersianDigits } from "@/lib/burgerLayers";
import { cn } from "@/lib/utils";

export interface MenuCardProps {
  name: string;
  description: string;
  price: string;
  image: string;
  imageAlt: string;
  /** Section title the item belongs to (e.g. "برگرها"). */
  category: string;
  /** Position in its section, used to stagger the entrance. */
  index?: number;
  /** Wide, side-by-side layout (used when a section has a single item). */
  wide?: boolean;
}

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
/** How long the mouse must rest on a card before it opens. */
const HOVER_INTENT_MS = 110;

/**
 * Menu card.
 *
 * Burgers and sandwiches open into an exploded view of their layers:
 * hover with a mouse, tap on touch screens (tap again or outside to close),
 * or Enter/Space from the keyboard. Every card also has a pointer-driven
 * tilt and photo parallax, plus the existing "like" heart.
 */
const MenuCard = ({
  name,
  description,
  price,
  image,
  imageAlt,
  category,
  index = 0,
  wide = false,
}: MenuCardProps) => {
  const uid = useId();
  const recipe = useMemo(() => parseBurgerRecipe(description), [description]);
  const { activeId, setActiveId } = useActiveCard();
  const open = !!recipe && activeId === uid;
  const reduced = useReducedMotion();

  // The burger illustration is only mounted after the first interaction.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  const cardRef = useRef<HTMLElement>(null);
  const inView = useInView(cardRef, { amount: 0.25 });
  // Close when the card scrolls away (mostly matters on touch devices). Only
  // a visible → hidden transition counts, so a card focused from off-screen
  // isn't closed before the observer catches up.
  const wasInView = useRef(inView);
  useEffect(() => {
    if (wasInView.current && !inView) {
      setActiveId((cur) => (cur === uid ? null : cur));
    }
    wasInView.current = inView;
  }, [inView, uid, setActiveId]);

  const [liked, setLiked] = useState(
    () => typeof window !== "undefined" && !!getLikes()[name],
  );
  const toggleLike = () => {
    setLiked((prev) => {
      const next = !prev;
      const likes = getLikes();
      if (next) likes[name] = true;
      else delete likes[name];
      try {
        localStorage.setItem("bergeerd_likes", JSON.stringify(likes));
      } catch {
        /* ignore quota / privacy errors */
      }
      return next;
    });
  };

  /* ---- pointer tilt / parallax (mouse only) ---- */
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spring = { stiffness: 150, damping: 18, mass: 0.6 };
  const sx = useSpring(px, spring);
  const sy = useSpring(py, spring);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-7, 7]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [6, -6]);
  const photoX = useTransform(sx, [-0.5, 0.5], [12, -12]);
  const photoY = useTransform(sy, [-0.5, 0.5], [10, -10]);
  const glowX = useTransform(sx, [-0.5, 0.5], [0, 100]);
  const glowY = useTransform(sy, [-0.5, 0.5], [0, 100]);
  const glare = useMotionTemplate`radial-gradient(420px circle at ${glowX}% ${glowY}%, hsl(0 0% 100% / 0.16), transparent 45%)`;

  /* ---- open / close input handling ---- */
  const pointerType = useRef<string>("mouse");
  const intent = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(intent.current), []);

  const openThis = () => setActiveId(uid);
  const closeThis = () => setActiveId((cur) => (cur === uid ? null : cur));

  const onPointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !recipe) return;
    clearTimeout(intent.current);
    intent.current = setTimeout(openThis, HOVER_INTENT_MS);
  };
  const onPointerLeave = (e: React.PointerEvent) => {
    px.set(0);
    py.set(0);
    if (e.pointerType !== "mouse") return;
    clearTimeout(intent.current);
    closeThis();
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onClick = () => {
    // Touch & pen toggle; a mouse already opened it on hover.
    if (!recipe) return;
    if (pointerType.current === "mouse") openThis();
    else if (open) closeThis();
    else openThis();
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!recipe) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open) closeThis();
      else openThis();
    }
  };

  const layerCount = recipe?.layers.length ?? 0;

  return (
    <motion.article
      ref={cardRef}
      data-card-id={uid}
      initial={{ opacity: 0, y: 56 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.9,
        ease: EASE_OUT_EXPO,
        delay: (index % 3) * 0.09,
      }}
      className={cn(
        "group relative flex h-full flex-col rounded-[28px]",
        wide && "md:flex-row md:items-stretch",
        " border bg-card p-2 transition-[border-color,box-shadow] duration-500",
        open
          ? "border-primary/50 shadow-[0_30px_80px_-30px_hsl(var(--primary)/0.65)]"
          : "border-white/[0.07] shadow-card hover:border-white/15",
      )}
    >
      {/* ---------- stage ---------- */}
      <div
        role={recipe ? "button" : undefined}
        tabIndex={recipe ? 0 : undefined}
        aria-expanded={recipe ? open : undefined}
        aria-label={recipe ? `نمایش لایه‌های ${name}` : undefined}
        onPointerDown={(e) => (pointerType.current = e.pointerType)}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onPointerMove={onPointerMove}
        onClick={onClick}
        onKeyDown={onKeyDown}
        className={cn(
          "relative aspect-square shrink-0 select-none overflow-hidden rounded-[22px] bg-black [perspective:900px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
          recipe && "cursor-pointer",
          wide && "md:w-1/2",
        )}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <motion.div
          className="absolute inset-0"
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        >
          <motion.img
            src={image}
            alt={imageAlt}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="absolute inset-[-14px] h-[calc(100%+28px)] w-[calc(100%+28px)] max-w-none object-cover"
            style={{ x: photoX, y: photoY }}
            animate={{ scale: open ? 1.14 : 1 }}
            transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
          />
        </motion.div>

        {/* bottom scrim (always) */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/25" />

        {/* pointer glare */}
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: glare }}
        />

        {/* darkening + ember glow when open */}
        {recipe && (
          <motion.div
            className="pointer-events-none absolute inset-0"
            initial={false}
            animate={{ opacity: open ? 1 : 0 }}
            transition={{ duration: open ? 0.45 : 0.5, delay: open ? 0 : 0.3 }}
            style={{
              background:
                "radial-gradient(60% 55% at 34% 52%, hsl(8 85% 32% / 0.55), transparent 70%), linear-gradient(hsl(20 30% 4% / 0.82), hsl(20 30% 4% / 0.9))",
            }}
          />
        )}

        {/* exploded burger */}
        {recipe && mounted && (
          <motion.div
            className="pointer-events-none absolute inset-y-[4%] left-[3%]"
            initial={{ opacity: 0, y: 26, scale: 0.88 }}
            animate={
              open
                ? { opacity: 1, y: 0, scale: 1 }
                : { opacity: 0, y: 14, scale: 0.94 }
            }
            transition={
              open
                ? { duration: 0.4, ease: EASE_OUT_EXPO }
                : // Let the layers fall back together before fading out.
                  { duration: 0.35, delay: 0.38, ease: "easeIn" }
            }
          >
            <BurgerStack
              recipe={recipe}
              open={open}
              viewHeight={340}
              maxGap={26}
              labels="side"
              parallax={sx}
              className="h-full"
            />
          </motion.div>
        )}

        {/* category */}
        <span className="pointer-events-none absolute right-3 top-3 rounded-full border border-white/15 bg-black/45 px-3 py-1 font-body text-[11px] font-medium text-cream/90 backdrop-blur-md">
          {category}
        </span>

        {/* like */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleLike();
          }}
          aria-label={liked ? "حذف از علاقه‌مندی" : "افزودن به علاقه‌مندی"}
          aria-pressed={liked}
          className={cn(
            "absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full backdrop-blur-md transition-colors duration-300",
            liked
              ? "bg-primary text-white"
              : "border border-white/15 bg-black/45 text-white/90 hover:bg-black/65",
          )}
        >
          <motion.span
            key={liked ? "on" : "off"}
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 14 }}
          >
            <Heart className={cn("h-4 w-4", liked && "fill-current")} />
          </motion.span>
        </button>

        {/* interaction hint */}
        {recipe && (
          <motion.span
            className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-cream px-3 py-1.5 font-body text-[11px] font-semibold text-ink shadow-lg"
            animate={{ opacity: open ? 0 : 1, y: open ? 8 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping-slow rounded-full bg-primary" />
              <span className="relative h-2 w-2 rounded-full bg-primary" />
            </span>
            <Layers className="h-3.5 w-3.5" />
            <span className="hint-hover">لایه‌ها رو ببین</span>
            <span className="hint-touch">بزن تا باز شه</span>
          </motion.span>
        )}

        {/* close hint on touch */}
        {recipe && (
          <motion.span
            className="hint-touch pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/55 px-3 py-1.5 font-body text-[11px] text-cream/80 backdrop-blur"
            initial={false}
            animate={{ opacity: open ? 1 : 0 }}
            transition={{ duration: 0.3, delay: open ? 0.6 : 0 }}
          >
            دوباره بزن تا جمع شه
          </motion.span>
        )}

        {recipe?.withFries && (
          <span className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-gold/40 bg-black/45 px-2.5 py-1 font-body text-[11px] text-gold backdrop-blur-md">
            + سیب‌زمینی
          </span>
        )}
      </div>

      {/* ---------- body ---------- */}
      <div
        className={cn(
          "flex flex-1 flex-col px-3 pb-3 pt-4",
          wide && "md:justify-center md:px-8 md:py-8",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <h3
            className={cn(
              "font-display text-2xl leading-tight transition-colors duration-300",
              wide && "md:text-4xl",
              open ? "text-gold" : "text-cream",
            )}
          >
            {name}
          </h3>
          {recipe && (
            <span className="mt-1 flex shrink-0 items-center gap-1 rounded-full border border-white/10 px-2 py-0.5 font-body text-[11px] text-muted-foreground">
              <Layers className="h-3 w-3" />
              {toPersianDigits(layerCount)} لایه
            </span>
          )}
        </div>

        {description ? (
          <p
            className={cn(
              "mt-2 font-body text-sm leading-7 text-muted-foreground",
              wide && "md:text-base md:leading-8",
            )}
          >
            {description}
          </p>
        ) : (
          <p className="mt-2 font-body text-sm text-muted-foreground/60">
            افزودنی انتخابی
          </p>
        )}

        <div
          className={cn(
            "mt-auto flex items-end justify-between pt-5",
            wide && "md:mt-8",
          )}
        >
          <span className="h-px flex-1 bg-gradient-to-l from-white/15 to-transparent" />
          <p className="mr-4 flex items-baseline gap-1.5 font-display text-cream">
            <span className="text-3xl leading-none">{price}</span>
            <span className="font-body text-xs text-muted-foreground">
              تومان
            </span>
          </p>
        </div>
      </div>
    </motion.article>
  );
};

/** Helpers for persisting "likes" across the menu. */
export function getLikes(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem("bergeerd_likes") || "{}");
  } catch {
    return {};
  }
}

export default MenuCard;
