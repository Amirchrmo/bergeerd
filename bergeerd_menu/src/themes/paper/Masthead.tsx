import { Clock, MapPin, Phone } from "lucide-react";
import logo from "@/assets/LOGO-header.png";
import { telHref, toPersianDigits } from "@/core/format";
import type { Branch, MenuSectionData } from "@/core/types";
import { rise } from "./util";

interface MastheadProps {
  branch: Branch;
  sections: MenuSectionData[];
}

/** Awning, brand name with the branch stamp, and the quickest actions. */
const Masthead = ({ branch, sections }: MastheadProps) => {
  const itemCount = sections.reduce((n, s) => n + s.items.length, 0);

  return (
    <header>
      <div className="paper-awning h-9" aria-hidden="true" />
      <div className="paper-awning-edge" aria-hidden="true" />

      <div className="mx-auto max-w-5xl px-5 pb-8 pt-8 md:pt-12">
        <div className="flex items-center gap-4">
          <img
            src={logo}
            alt=""
            className="paper-rise h-16 w-16 shrink-0 rounded-full object-cover ring-4 ring-card md:h-20 md:w-20"
          />
          <h1 className="paper-rise paper-display text-6xl leading-none md:text-8xl" style={rise(60)}>
            برگرد
          </h1>
          <span
            className="paper-rise paper-stamp paper-display mr-auto shrink-0 rounded-xl border-2 border-primary px-3 pb-1 pt-1.5 text-2xl text-primary md:text-4xl"
            style={rise(140)}
          >
            {branch.name}
          </span>
        </div>

        <p
          className="paper-rise mt-5 max-w-md text-[15px] leading-7 text-muted-foreground"
          style={rise(200)}
        >
          یه گرد خوشمزه، حالا تو {branch.name}. منو رو ورق بزن و هر چی دلت خواست انتخاب کن.
        </p>

        <div
          className="paper-rise mt-6 flex flex-wrap gap-2"
          style={rise(260)}
        >
          {branch.address && (
            <a
              href={branch.mapUrl || "#visit"}
              target={branch.mapUrl ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm text-background transition-transform active:scale-95"
            >
              <MapPin className="h-4 w-4" />
              مسیریابی
            </a>
          )}
          {branch.phone && (
            <a
              href={telHref(branch.phone)}
              className="inline-flex items-center gap-2 rounded-full border border-foreground/20 px-4 py-2.5 text-sm transition-transform active:scale-95"
            >
              <Phone className="h-4 w-4" />
              تماس
            </a>
          )}
          {branch.hours && (
            <span className="inline-flex items-center gap-2 rounded-full px-2 py-2.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {branch.hours}
            </span>
          )}
        </div>

        {itemCount > 0 && (
          <div className="mt-8 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-foreground/15" />
            <span>
              {toPersianDigits(sections.length)} دسته · {toPersianDigits(itemCount)} آیتم
            </span>
            <span className="h-px flex-1 bg-foreground/15" />
          </div>
        )}
      </div>
    </header>
  );
};

export default Masthead;
