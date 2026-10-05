import { motion } from "motion/react";
import MenuCard, { type MenuCardProps } from "./MenuCard";
import { toPersianDigits } from "@/lib/burgerLayers";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  imageAlt: string;
  /** Display priority — lower values are higher priority (shown further right). */
  order?: number;
}

interface MenuSectionProps {
  title: string;
  items: MenuItem[];
  /** Stable id used as the scroll-spy target. Defaults to a slug of the title. */
  sectionId?: string;
  /** Index of the section, shown as its number. */
  index?: number;
}

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export const slugify = (s: string) =>
  s
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^؀-ۿ\w-]/g, "");

/**
 * A menu category: editorial heading (number, title, item count, a rule that
 * draws in on scroll) and a responsive RTL grid. Sections whose items have no
 * descriptions (add-ons such as toppings and sauces) use compact tiles.
 */
const MenuSection = ({
  title,
  items,
  sectionId,
  index = 0,
}: MenuSectionProps) => {
  // Ascending by order → first DOM node = highest priority (far right in RTL).
  const sortedItems = [...items].sort((a, b) => {
    const ao = a.order ?? Number.MAX_SAFE_INTEGER;
    const bo = b.order ?? Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
    return a.name.localeCompare(b.name, "fa");
  });

  const id = sectionId || `section-${slugify(title)}`;
  const compact = sortedItems.every((it) => !it.description?.trim());

  return (
    <section id={id} className="scroll-mt-28 py-14 md:py-20">
      {/* Heading — the block is the in-view trigger; children follow. */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.5 }}
        className="mb-10 flex items-end gap-4 md:mb-14 md:gap-6"
      >
        <motion.span
          variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          className="text-outline font-display text-6xl leading-none md:text-8xl"
          aria-hidden="true"
        >
          {toPersianDigits(String(index + 1).padStart(2, "0"))}
        </motion.span>
        <div className="min-w-0 flex-1 pb-1">
          <div className="overflow-hidden pb-1">
            <motion.h2
              variants={{ hidden: { y: "105%" }, show: { y: "0%" } }}
              transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: 0.05 }}
              className="font-display text-4xl leading-tight text-cream md:text-6xl"
            >
              {title}
            </motion.h2>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <motion.span
              variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1 } }}
              transition={{ duration: 1.2, ease: EASE_OUT_EXPO, delay: 0.15 }}
              className="h-px flex-1 origin-right bg-gradient-to-l from-primary via-gold/50 to-transparent"
            />
            <span className="shrink-0 font-body text-xs text-muted-foreground">
              {toPersianDigits(sortedItems.length)} آیتم
            </span>
          </div>
        </div>
      </motion.div>

      {compact ? (
        <div
          dir="rtl"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4"
        >
          {sortedItems.map((item, i) => (
            <CompactItem key={`${item.id}-${i}`} item={item} index={i} />
          ))}
        </div>
      ) : (
        <div
          dir="rtl"
          className={
            sortedItems.length === 1
              ? "mx-auto max-w-4xl"
              : "grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6 xl:grid-cols-3"
          }
        >
          {sortedItems.map((item, i) => (
            <MenuCard
              key={`${item.id}-${i}`}
              name={item.name}
              description={item.description}
              price={item.price}
              image={item.image}
              imageAlt={item.imageAlt}
              category={title}
              index={i}
              wide={sortedItems.length === 1}
            />
          ))}
        </div>
      )}
    </section>
  );
};

/** Small tile for add-ons (no description): thumbnail, name and price. */
function CompactItem({ item, index }: { item: MenuItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: EASE_OUT_EXPO, delay: (index % 4) * 0.06 }}
      whileTap={{ scale: 0.97 }}
      className="group flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-card p-2.5 transition-colors duration-300 hover:border-gold/30 hover:bg-white/[0.04] md:gap-4 md:p-3"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl md:h-16 md:w-16">
        <img
          src={item.image}
          alt={item.imageAlt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:rotate-3 group-hover:scale-110"
        />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 font-display text-base leading-snug text-cream md:text-xl">
          {item.name}
        </h3>
        <p className="mt-0.5 flex items-baseline gap-1 font-display text-gold">
          <span className="text-lg leading-none">{item.price}</span>
          <span className="font-body text-[11px] text-muted-foreground">
            تومان
          </span>
        </p>
      </div>
    </motion.div>
  );
}

export type { MenuCardProps };
export default MenuSection;
