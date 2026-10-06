import { useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { Flame } from "lucide-react";
import Hero from "@/components/Hero";
import IngredientMarquee from "@/components/IngredientMarquee";
import CategoryNav, { type CategoryNavEntry } from "@/components/CategoryNav";
import MenuSection, { slugify } from "@/components/MenuSection";
import GameSection from "@/components/GameSection";
import LocationSection from "@/components/LocationSection";
import Footer from "@/components/Footer";
import { ActiveCardProvider } from "@/components/menu/ActiveCardContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { parseBurgerRecipe } from "@/lib/burgerLayers";
import { useMenu } from "@/lib/menuApi";
import { initSmoothScroll } from "@/lib/smoothScroll";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/**
 * Main page.
 *
 * Loads the menu from the API (with the static fallback) and lays out the
 * experience: Hero → ingredient marquee → sticky category nav + menu
 * sections → entertainment game → location → footer.
 */
const Index = ({ ready }: { ready: boolean }) => {
  const { data: sections = [] } = useMenu();
  useScrollReveal();
  useEffect(() => initSmoothScroll(), []);

  const visibleSections = useMemo(
    () =>
      sections
        .filter((section) => section.items.length > 0)
        .slice()
        .sort(
          (a, b) =>
            (a.order ?? Number.MAX_SAFE_INTEGER) -
            (b.order ?? Number.MAX_SAFE_INTEGER),
        ),
    [sections],
  );

  // The id must match what MenuSection renders.
  const navCategories: CategoryNavEntry[] = useMemo(
    () =>
      visibleSections.map((s) => ({
        id: `section-${slugify(s.title)}`,
        label: s.title,
      })),
    [visibleSections],
  );

  // Collect ingredient names for the marquee.
  const ingredients = useMemo(() => {
    const words = new Set<string>();
    for (const section of visibleSections) {
      for (const item of section.items) {
        parseBurgerRecipe(item.description)?.layers.forEach(
          (l) => l.label && words.add(l.label),
        );
      }
    }
    return [...words];
  }, [visibleSections]);

  return (
    <ActiveCardProvider>
      <div className="grain relative min-h-screen bg-background">
        <Hero ready={ready} />

        <CategoryNav categories={navCategories} />

        <IngredientMarquee words={ingredients} />

        {/* Menu */}
        <main id="menu" className="container mx-auto scroll-mt-24 px-4 pb-10 pt-20 md:pt-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-4 flex flex-col items-center text-center">
              <motion.span
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
                className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-body text-xs text-burger-red-light"
              >
                <Flame className="h-3.5 w-3.5" />
                منوی برگرد
              </motion.span>
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="overflow-hidden pb-2"
              >
                <motion.h2
                  variants={{ hidden: { y: "105%" }, show: { y: "0%" } }}
                  transition={{ duration: 1, ease: EASE_OUT_EXPO }}
                  className="font-display text-5xl text-cream md:text-8xl"
                >
                  چی <span className="text-gradient-fire">می‌خوای</span>؟
                </motion.h2>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="mt-3 max-w-md font-body text-sm leading-7 text-muted-foreground md:text-base"
              >
                <span className="hint-hover">
                  ماوس رو روی هر برگر نگه دار تا لایه‌هاش از هم باز بشن.
                </span>
                <span className="hint-touch">
                  روی عکس هر برگر بزن تا لایه‌هاش از هم باز بشن.
                </span>
              </motion.p>
            </div>

            {visibleSections.map((section, i) => (
              <MenuSection
                key={section.title}
                title={section.title}
                items={section.items}
                index={i}
              />
            ))}
          </div>
        </main>

        {/* Entertainment */}
        <GameSection />

        {/* Location */}
        <LocationSection />

        <Footer />
      </div>
    </ActiveCardProvider>
  );
};

export default Index;
