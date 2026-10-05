import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import LOGOSmall from "@/assets/LOGO-header.png";
import { Gamepad2 } from "lucide-react";
import { scrollToId, scrollToTop } from "@/lib/smoothScroll";

export interface CategoryNavEntry {
  /** Stable id used as the scroll target (`#id`). */
  id: string;
  /** Persian label shown in the pill. */
  label: string;
}

interface CategoryNavProps {
  categories: CategoryNavEntry[];
}

/**
 * Floating category bar with scroll-spy.
 *
 * - Slides in once the visitor scrolls past the hero.
 * - The active pill's background glides between categories.
 * - On small screens the pills scroll horizontally and the active one is
 *   kept in view.
 */
const CategoryNav = ({ categories }: CategoryNavProps) => {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const pillsRef = useRef<HTMLElement>(null);

  // Show the bar after scrolling a little past the hero.
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll-spy: track which menu section is in the middle of the viewport.
  useEffect(() => {
    if (categories.length === 0) return;
    const targets = categories
      .map((c) => document.getElementById(c.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (targets.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          visibleEntries.sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          );
          setActive(visibleEntries[0].target.id);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [categories]);

  // Keep the active pill visible inside the horizontal scroller.
  useEffect(() => {
    if (!active || !pillsRef.current) return;
    const nav = pillsRef.current;
    const pill = nav.querySelector<HTMLElement>(
      `[data-pill="${CSS.escape(active)}"]`,
    );
    if (!pill) return;
    // Scroll only the pill row, never the page.
    // (Relative scrollBy behaves the same in RTL and LTR.)
    const p = pill.getBoundingClientRect();
    const n = nav.getBoundingClientRect();
    nav.scrollBy({
      left: p.left + p.width / 2 - (n.left + n.width / 2),
      behavior: "smooth",
    });
  }, [active]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -90, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="fixed inset-x-0 top-3 z-50 flex justify-center px-3"
        >
          <div className="flex w-full max-w-3xl items-center gap-2 rounded-full border border-white/10 bg-[hsl(20_14%_8%/0.78)] p-1.5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl">
            <button
              onClick={scrollToTop}
              className="shrink-0 rounded-full transition-transform hover:scale-105"
              aria-label="بازگشت به بالا"
            >
              <img
                src={LOGOSmall}
                alt="برگرد"
                className="h-9 w-9 rounded-full bg-brand object-contain p-1"
              />
            </button>

            <nav
              ref={pillsRef}
              className="no-scrollbar flex flex-1 items-center gap-1 overflow-x-auto"
            >
              {categories.map((c) => {
                const isActive = active === c.id;
                return (
                  <button
                    key={c.id}
                    data-pill={c.id}
                    onClick={() => scrollToId(c.id)}
                    className={`relative shrink-0 rounded-full px-4 py-2 font-body text-sm transition-colors duration-300 ${
                      isActive ? "text-white" : "text-white/55 hover:text-white"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-full bg-brand"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative">{c.label}</span>
                  </button>
                );
              })}
            </nav>

            <button
              onClick={() => scrollToId("entertainment")}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 font-body text-xs text-white/80 transition-colors hover:bg-white/10"
              aria-label="بازی"
            >
              <Gamepad2 className="h-4 w-4 text-gold" />
              <span className="hidden sm:block">بازی</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CategoryNav;
