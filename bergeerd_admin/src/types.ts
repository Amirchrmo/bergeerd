// Shared types mirroring the Go backend models.

/**
 * Website designs a branch can use. Keys must match the themes registered in
 * bergeerd_menu/src/themes/index.ts.
 */
export const THEMES: { value: string; label: string }[] = [
  { value: "ember", label: "طراحی اصلی (تیره و پرانیمیشن، اردبیل)" },
  { value: "paper", label: "طراحی کاغذی (روشن، تهران)" },
];

export interface Branch {
  id: string;
  slug: string;
  name: string;
  theme: string;
  is_default: boolean;
  is_active: boolean;
  order: number;
  address: string;
  phone: string;
  hours: string;
  map_url: string;
  map_embed_url: string;
  instagram: string;
  created_at: string;
  updated_at: string;
}

/** Payload for branch create/update; copy_from is only used on create. */
export interface BranchInput {
  slug?: string;
  name?: string;
  theme?: string;
  is_active?: boolean;
  order?: number;
  address?: string;
  phone?: string;
  hours?: string;
  map_url?: string;
  map_embed_url?: string;
  instagram?: string;
  copy_from?: string;
}

export interface MenuItem {
  id: string;
  branch_id: string;
  name: string;
  description: string;
  price: string;
  image_url: string;
  image_alt: string;
  category: string;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Payload for item create/update; branch_id is only used on create. */
export interface MenuItemInput {
  branch_id?: string;
  name?: string;
  description?: string;
  price?: string;
  image_url?: string;
  image_alt?: string;
  category?: string;
  order?: number;
  is_active?: boolean;
}

export interface Category {
  id: string;
  branch_id: string;
  slug: string;
  title: string;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Payload for category create/update; branch_id is only used on create. */
export interface CategoryInput {
  branch_id?: string;
  slug?: string;
  title?: string;
  order?: number;
  is_active?: boolean;
}

export interface LoginResponse {
  token: string;
  admin: { username: string };
}

export interface UploadResponse {
  url: string;
  object: string;
  size: number;
  mime_type: string;
}

/** Normalized API error returned by the backend. */
export interface ApiError {
  error: string;
  fields?: Record<string, string>;
}
