import { toPersianDigits } from "@/core/format";
import type { MenuItem, MenuSectionData } from "@/core/types";
import { sectionId } from "./util";

interface MenuSectionsProps {
  sections: MenuSectionData[];
  onOpen: (item: MenuItem) => void;
}

/**
 * The menu as numbered sections. Dishes with a description get a photo row
 * that opens the detail sheet; sections with none (toppings, sauces) are a
 * compact price list.
 */
const MenuSections = ({ sections, onOpen }: MenuSectionsProps) => (
  <main className="mx-auto max-w-5xl px-5 pb-6">
    {sections.map((section, i) => {
      const compact = section.items.every((it) => !it.description);
      return (
        <section key={section.category} id={sectionId(section.category)} className="pt-10">
          <header className="mb-2 flex items-end gap-3">
            <span className="paper-display text-4xl leading-none text-primary">
              {toPersianDigits(String(i + 1).padStart(2, "0"))}
            </span>
            <h2 className="paper-display text-3xl leading-none md:text-4xl">{section.title}</h2>
            <span className="mb-1 h-px flex-1 bg-foreground/15" />
            <span className="mb-0.5 text-xs text-muted-foreground">
              {toPersianDigits(section.items.length)} آیتم
            </span>
          </header>

          {compact ? (
            <ul className="grid gap-x-10 sm:grid-cols-2">
              {section.items.map((item) => (
                <li key={item.id} className="paper-dashed flex items-baseline py-3">
                  <span className="text-[15px]">{item.name}</span>
                  <span aria-hidden="true" className="paper-leader" />
                  <Price value={item.price} />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="grid gap-x-10 md:grid-cols-2">
              {section.items.map((item) => (
                <li key={item.id} className="paper-dashed">
                  <ItemRow item={item} onOpen={onOpen} />
                </li>
              ))}
            </ul>
          )}
        </section>
      );
    })}
  </main>
);

const ItemRow = ({ item, onOpen }: { item: MenuItem; onOpen: (item: MenuItem) => void }) => (
  <button
    type="button"
    onClick={() => onOpen(item)}
    className="group flex w-full items-start gap-4 py-4 text-right"
  >
    {item.image && (
      <img
        src={item.image}
        alt={item.imageAlt || item.name}
        loading="lazy"
        decoding="async"
        className="h-20 w-20 shrink-0 rounded-2xl bg-muted object-cover ring-1 ring-border transition-transform duration-300 group-hover:scale-[1.04] md:h-24 md:w-24"
      />
    )}
    <span className="min-w-0 flex-1">
      <span className="flex items-baseline">
        <span className="text-base font-bold">{item.name}</span>
        <span aria-hidden="true" className="paper-leader" />
        <Price value={item.price} />
      </span>
      <span className="mt-1.5 line-clamp-2 block text-[13px] leading-6 text-muted-foreground">
        {item.description}
      </span>
    </span>
  </button>
);

export const Price = ({ value, large }: { value: string; large?: boolean }) => (
  <span className={`paper-display shrink-0 whitespace-nowrap text-primary ${large ? "text-4xl" : "text-xl"}`}>
    {toPersianDigits(value)}
    <span className="mr-1 font-body text-[11px] text-muted-foreground">تومان</span>
  </span>
);

export default MenuSections;
