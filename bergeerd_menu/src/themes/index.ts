import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { ThemeProps } from "@/core/types";

type Theme = LazyExoticComponent<ComponentType<ThemeProps>>;

/**
 * The website designs. Each branch picks one with its `theme` key (set in the
 * admin panel), and each design is a separate chunk, so a visitor downloads
 * only the design of the branch they open.
 *
 * To add a design: create themes/<key>/index.tsx with a default-exported
 * component taking ThemeProps, register it here, and add the key to THEMES in
 * bergeerd_admin/src/types.ts so it can be picked for a branch.
 */
const themes: Record<string, Theme> = {
  // The original dark, motion-heavy design (Ardabil, the site root).
  ember: lazy(() => import("./ember")),
  // Light, printed-menu design (Tehran).
  paper: lazy(() => import("./paper")),
};

/** The design for a theme key; unknown keys get the original design. */
export function themeFor(key: string): Theme {
  return themes[key] ?? themes.ember;
}
