import { useQuery } from "@tanstack/react-query";

import { FALLBACK_MENU } from "./fallback";
import type { Branch, BranchMenu, MenuItem, MenuSectionData } from "./types";

/**
 * Branch-aware menu data for every theme.
 *
 * The site root (bergeerd.ir/) shows the default branch, which is what the
 * printed QR codes open; bergeerd.ir/<slug> shows any other active branch.
 * Both load GET {VITE_API_URL}/branches/<slug|default>/menu.
 */

// e.g. "/api" in production, "http://localhost:8080/api" in development.
const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

interface ApiMenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  image_url: string;
  image_alt: string;
  order: number;
}

interface ApiSection {
  category: string;
  title: string;
  order: number;
  items: ApiMenuItem[];
}

interface ApiBranch {
  slug: string;
  name: string;
  theme: string;
  is_default: boolean;
  address: string;
  phone: string;
  hours: string;
  map_url: string;
  map_embed_url: string;
  instagram: string;
}

/** The requested branch does not exist (or is not active). */
export class BranchNotFoundError extends Error {}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * The branch a URL path asks for: undefined for the site root (the default
 * branch), null when the path cannot name a branch.
 */
export function branchSlugFromPath(path: string): string | undefined | null {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0 || (parts.length === 1 && parts[0] === "index.html")) {
    return undefined;
  }
  const slug = parts.length === 1 ? parts[0].toLowerCase() : "";
  return SLUG.test(slug) ? slug : null;
}

/** The root, and the default branch's own slug, never show an empty page. */
function hasFallback(slug: string | undefined): boolean {
  return slug === undefined || slug === FALLBACK_MENU.branch.slug;
}

function mapBranch(b: ApiBranch): Branch {
  return {
    slug: b.slug,
    name: b.name,
    theme: b.theme,
    isDefault: b.is_default,
    address: b.address ?? "",
    phone: b.phone ?? "",
    hours: b.hours ?? "",
    mapUrl: b.map_url ?? "",
    mapEmbedUrl: b.map_embed_url ?? "",
    instagram: b.instagram ?? "",
  };
}

function mapItem(it: ApiMenuItem): MenuItem {
  return {
    id: it.id,
    name: it.name,
    description: it.description,
    price: it.price,
    image: it.image_url,
    imageAlt: it.image_alt,
    order: it.order,
  };
}

// The API returns categories and items already in display order.
function mapSections(sections: ApiSection[]): MenuSectionData[] {
  return sections.map((s) => ({
    category: s.category,
    title: s.title || s.category,
    order: s.order,
    items: s.items.map(mapItem),
  }));
}

async function fetchBranchMenu(slug: string | undefined): Promise<BranchMenu> {
  try {
    if (!API_URL) throw new Error("VITE_API_URL is not set");
    // no-store: always hit the network so admin edits show up on refetch.
    const res = await fetch(`${API_URL}/branches/${slug ?? "default"}/menu`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (res.status === 404) throw new BranchNotFoundError(slug);
    if (!res.ok) throw new Error(`menu API returned ${res.status}`);
    const { data } = (await res.json()) as {
      data: { branch: ApiBranch; sections: ApiSection[] };
    };
    const menu = { branch: mapBranch(data.branch), sections: mapSections(data.sections) };
    // As before branches: an empty default menu falls back to the static one.
    if (menu.branch.isDefault && menu.sections.length === 0) {
      return { ...menu, sections: FALLBACK_MENU.sections };
    }
    return menu;
  } catch (err) {
    if (hasFallback(slug)) {
      console.warn("[menu] API unavailable, using static fallback:", err);
      return FALLBACK_MENU;
    }
    throw err;
  }
}

/**
 * Loads a branch's menu. The root renders the static copy instantly while the
 * API loads; staleTime 0 + refetchOnWindowFocus make admin edits appear as
 * soon as the visitor returns to the tab.
 */
export function useBranchMenu(slug: string | undefined) {
  return useQuery({
    queryKey: ["branch-menu", slug ?? "default"],
    queryFn: () => fetchBranchMenu(slug),
    initialData: hasFallback(slug) ? FALLBACK_MENU : undefined,
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: (failures, err) => !(err instanceof BranchNotFoundError) && failures < 1,
  });
}
