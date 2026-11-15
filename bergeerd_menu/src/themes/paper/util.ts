import type { CSSProperties } from "react";

/** DOM id of a menu section, used by the category bar's links. */
export const sectionId = (category: string) => `menu-${category}`;

/** Staggers the .paper-rise entrance animation. */
export const rise = (delayMs: number) => ({ "--rise-delay": `${delayMs}ms` }) as CSSProperties;
