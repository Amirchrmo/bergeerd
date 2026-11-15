import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { MenuItem } from "@/core/types";
import { Price } from "./MenuSections";

/** A dish up close: bottom sheet on phones, dialog on larger screens. */
const ItemSheet = ({ item, onClose }: { item: MenuItem; onClose: () => void }) => {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="paper-backdrop fixed inset-0 z-50 flex items-end justify-center bg-foreground/55 md:items-center md:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="paper-sheet-title"
        onClick={(e) => e.stopPropagation()}
        className="paper-sheet relative max-h-[92svh] w-full max-w-md overflow-y-auto rounded-t-[2rem] bg-card shadow-card md:rounded-[2rem]"
      >
        {item.image && (
          <img
            src={item.image}
            alt={item.imageAlt || item.name}
            className="aspect-[4/3] w-full rounded-t-[2rem] object-cover"
          />
        )}
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="بستن"
          className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-card/90 text-foreground shadow-card"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="p-6 pb-8">
          <h3 id="paper-sheet-title" className="paper-display text-3xl">
            {item.name}
          </h3>
          <div className="mt-3">
            <Price value={item.price} large />
          </div>
          {item.description && (
            <p className="mt-4 text-sm leading-7 text-muted-foreground">{item.description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemSheet;
