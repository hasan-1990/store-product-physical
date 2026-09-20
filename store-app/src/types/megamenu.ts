// Types for MegaMenu Management System

export interface MegaMenuItem {
  id: string;
  title: string;
  href: string;
  image?: string;
  price?: number;
  discount?: number;
  isNew?: boolean;
  isPopular?: boolean;
  description?: string;
  order: number;
  active: boolean;
}

export interface MegaMenuGroup {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  items: MegaMenuItem[];
  order: number;
  active: boolean;
}

export interface MegaMenuCategory {
  id: string;
  title: string;
  slug: string;
  icon: string;
  color?: string;
  description?: string;
  groups: MegaMenuGroup[];
  order: number;
  active: boolean;
}

export interface MegaMenuPreviewSection {
  _id?: string;
  title: string;
  description: string;
  image: string;
  buttonText: string;
  buttonLink: string;
  active: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
  order: number;
}

export interface MegaMenuSettings {
  _id?: string;
  categories: MegaMenuCategory[];
  previewSections: MegaMenuPreviewSection[];
  popularItemsLimit: number;
  showPopularItems: boolean;
  cacheEnabled: boolean;
  cacheDuration: number;
  updatedAt?: Date;
  createdAt?: Date;
}
