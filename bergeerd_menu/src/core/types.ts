/** A menu item in the shape the themes render. */
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  imageAlt: string;
  /** Display order within its category; lower first. */
  order?: number;
}

/** One category of a branch's menu, with its visible items in order. */
export interface MenuSectionData {
  /** Category slug; stable when the title is edited. */
  category: string;
  title: string;
  order?: number;
  items: MenuItem[];
}

/** A restaurant branch as the website sees it. Contact fields may be empty. */
export interface Branch {
  slug: string;
  name: string;
  /** Key of the design the branch is shown with (see themes/index.ts). */
  theme: string;
  /** The default branch is the one served at the site root. */
  isDefault: boolean;
  address: string;
  phone: string;
  hours: string;
  mapUrl: string;
  mapEmbedUrl: string;
  instagram: string;
}

export interface BranchMenu {
  branch: Branch;
  sections: MenuSectionData[];
}

/** What every theme (website design) receives. */
export interface ThemeProps {
  menu: BranchMenu;
}
