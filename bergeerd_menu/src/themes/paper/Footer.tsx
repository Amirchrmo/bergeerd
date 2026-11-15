import { ArrowUp, Heart } from "lucide-react";
import { toPersianDigits } from "@/core/format";
import type { Branch } from "@/core/types";

const Footer = ({ branch }: { branch: Branch }) => (
  <footer className="bg-foreground text-background">
    <div className="paper-awning h-2" aria-hidden="true" />
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-5 py-10 text-center sm:flex-row sm:justify-between sm:text-right">
      <div>
        <p className="paper-display text-3xl">برگرد {branch.name}</p>
        <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-background/60 sm:justify-start">
          © {toPersianDigits(1404)} برگرد — ساخته‌شده با
          <Heart className="h-3.5 w-3.5 fill-current" />
          توسط Arisan
        </p>
      </div>
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="inline-flex items-center gap-1.5 rounded-full border border-background/25 px-4 py-2 text-xs transition-colors hover:bg-background/10"
      >
        <ArrowUp className="h-3.5 w-3.5" />
        بالا
      </button>
    </div>
  </footer>
);

export default Footer;
