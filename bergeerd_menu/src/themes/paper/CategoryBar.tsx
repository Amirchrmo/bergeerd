import { useEffect, useRef, useState } from "react";
import type { MenuSectionData } from "@/core/types";
import { sectionId } from "./util";

/** Sticky row of category links that follows the section being read. */
const CategoryBar = ({ sections }: { sections: MenuSectionData[] }) => {
  const ids = sections.map((s) => sectionId(s.category));
  const active = useActiveSection(ids);
  const barRef = useRef<HTMLDivElement>(null);

  // Keep the active link visible in the horizontally scrolling bar.
  useEffect(() => {
    const link = barRef.current?.querySelector<HTMLElement>(`[data-target="${active}"]`);
    link?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [active]);

  return (
    <nav
      aria-label="دسته‌های منو"
      className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur"
    >
      <div ref={barRef} className="no-scrollbar mx-auto flex max-w-5xl gap-2 overflow-x-auto px-5 py-3">
        {sections.map((s) => {
          const id = sectionId(s.category);
          const isActive = id === active;
          return (
            <a
              key={id}
              href={`#${id}`}
              data-target={id}
              aria-current={isActive ? "true" : undefined}
              className={`shrink-0 rounded-full px-4 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-foreground text-background"
                  : "bg-card text-foreground/75 ring-1 ring-border hover:text-foreground"
              }`}
            >
              {s.title}
            </a>
          );
        })}
      </div>
    </nav>
  );
};

/** The section crossing a line just below the sticky bar. */
function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState(ids[0] ?? "");
  const key = ids.join(",");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "-30% 0px -65% 0px" },
    );
    for (const id of key.split(",")) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [key]);

  return active;
}

export default CategoryBar;
