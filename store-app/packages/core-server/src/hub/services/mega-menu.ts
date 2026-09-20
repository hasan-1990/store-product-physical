import type { Db } from 'mongodb';

type MegaMenuItem = {
  id?: string;
  title?: string;
  href?: string;
  image?: string;
  price?: number;
  discount?: number;
  isNew?: boolean;
  isPopular?: boolean;
  enabled?: boolean;
  order?: number;
};

type MegaMenuGroup = {
  id?: string;
  title?: string;
  slug?: string;
  enabled?: boolean;
  order?: number;
  items?: MegaMenuItem[];
  children?: MegaMenuGroup[];
  groups?: MegaMenuGroup[];
};

function mapItem(it: MegaMenuItem) {
  return {
    id: it?.id,
    title: it?.title,
    href: it?.href || '#',
    image: it?.image,
    price: it?.price,
    discount: it?.discount,
    isNew: it?.isNew,
    isPopular: it?.isPopular,
  };
}

function collectTitlesNeedingSlug(items: MegaMenuGroup[], titles: Set<string>) {
  for (const item of items) {
    if (!item?.slug && typeof item?.title === 'string' && item.title.trim()) {
      titles.add(item.title.trim());
    }
    if (Array.isArray(item?.groups)) collectTitlesNeedingSlug(item.groups, titles);
    if (Array.isArray(item?.children)) collectTitlesNeedingSlug(item.children, titles);
  }
}

function mapGroup(g: MegaMenuGroup, slugByTitle: Map<string, string>): Record<string, unknown> {
  const items = (g?.items || [])
    .filter((it) => it?.enabled !== false)
    .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
    .map(mapItem);

  const children = (g?.children || [])
    .filter((child) => child?.enabled !== false)
    .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
    .map((child) => mapGroup(child, slugByTitle));

  const slug =
    g?.slug ||
    (typeof g?.title === 'string' ? slugByTitle.get(g.title.trim()) : undefined);

  return {
    id: g?.id,
    title: g?.title,
    slug,
    items,
    ...(children.length > 0 ? { children } : {}),
  };
}

export async function buildPublicMegaMenu(db: Db) {
  const doc = await db.collection('megaMenuSettings').findOne({});
  const categoriesSource = Array.isArray(doc?.categories)
    ? doc.categories
    : Array.isArray(doc?.mainCategories)
      ? doc.mainCategories
      : [];

  const enabledCategories = (categoriesSource as MegaMenuGroup[])
    .filter((c) => c?.enabled !== false)
    .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));

  const titlesNeedingSlug = new Set<string>();
  collectTitlesNeedingSlug(enabledCategories, titlesNeedingSlug);

  const slugByTitle = new Map<string, string>();
  if (titlesNeedingSlug.size > 0) {
    const titleArray = Array.from(titlesNeedingSlug);
    const dbCategories = await db
      .collection('categories')
      .find(
        {
          $or: [{ name: { $in: titleArray } }, { title: { $in: titleArray } }],
          slug: { $exists: true, $ne: '' },
        },
        { projection: { name: 1, title: 1, slug: 1 } },
      )
      .toArray();

    for (const cat of dbCategories) {
      const nameKey = typeof cat?.name === 'string' ? cat.name.trim() : '';
      const titleKey = typeof cat?.title === 'string' ? cat.title.trim() : '';
      const slug = typeof cat?.slug === 'string' ? cat.slug : '';
      if (slug) {
        if (nameKey) slugByTitle.set(nameKey, slug);
        if (titleKey) slugByTitle.set(titleKey, slug);
      }
    }
  }

  const mainCategories = enabledCategories.map((c) => ({
    id: c?.id,
    title: c?.title,
    slug:
      c?.slug ||
      (typeof c?.title === 'string' ? slugByTitle.get(c.title.trim()) : undefined),
    groups: (c?.groups || [])
      .filter((g) => g?.enabled !== false)
      .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
      .map((g) => mapGroup(g, slugByTitle)),
  }));

  const previewSections = ((doc?.previewSections as Array<Record<string, unknown>>) || [])
    .filter((ps) => ps?.active !== false)
    .sort((a, b) => ((a?.order as number) ?? 0) - ((b?.order as number) ?? 0))
    .map((ps) => ({
      id: ps?.id || ps?._id,
      title: ps?.title,
      description: ps?.description,
      image: ps?.image,
      buttonText: ps?.buttonText,
      buttonLink: ps?.buttonLink,
      position: ps?.position || 'top',
      order: ps?.order ?? 0,
    }));

  return { success: true, data: mainCategories, previewSections };
}

export async function getAdminMegaMenuSettings(db: Db) {
  const doc = await db.collection('megaMenuSettings').findOne({});
  return {
    categories: doc?.categories || [],
    previewSections: doc?.previewSections || [],
  };
}

function sanitizeItem(it: Record<string, unknown>, fallbackId: string, order: number) {
  return {
    id: it?.id || fallbackId,
    title: String(it?.title || '').trim().slice(0, 100),
    href: it?.href ? String(it.href) : '#',
    image: it?.image || '',
    price: typeof it?.price === 'number' ? it.price : 0,
    discount: typeof it?.discount === 'number' ? it.discount : 0,
    isNew: it?.isNew === true,
    isPopular: it?.isPopular === true,
    description: it?.description || '',
    enabled: it?.enabled !== false,
    order: typeof it?.order === 'number' ? it.order : order,
  };
}

function sanitizeGroup(g: Record<string, unknown>, path: string, idx: number): Record<string, unknown> {
  const groupId = g?.id || `grp_${path}_${idx}_${Date.now()}`;
  const items = Array.isArray(g?.items)
    ? g.items.map((it, iIdx) =>
        sanitizeItem(it as Record<string, unknown>, `itm_${path}_${idx}_${iIdx}_${Date.now()}`, iIdx),
      )
    : [];

  const children = Array.isArray(g?.children)
    ? g.children.map((child, cIdx) =>
        sanitizeGroup(child as Record<string, unknown>, `${path}_${idx}`, cIdx),
      )
    : [];

  return {
    id: groupId,
    title: String(g?.title || '').trim().slice(0, 100),
    description: g?.description || '',
    enabled: g?.enabled !== false,
    order: typeof g?.order === 'number' ? g.order : idx,
    items,
    ...(children.length > 0 ? { children } : {}),
  };
}

export async function updateAdminMegaMenuSettings(db: Db, body: Record<string, unknown>) {
  if (!body || (!Array.isArray(body.categories) && !Array.isArray(body.mainCategories))) {
    throw new Error('INVALID_BODY');
  }

  const categoriesData = (body.categories || body.mainCategories || []) as Array<Record<string, unknown>>;
  const previewSectionsData = (body.previewSections || []) as Array<Record<string, unknown>>;

  const cleanCategories = categoriesData.map((cat, idx) => ({
    id: cat?.id || `cat_${idx}_${Date.now()}`,
    title: String(cat?.title || '').trim().slice(0, 100),
    slug: cat?.slug || `cat-${idx}`,
    icon: cat?.icon || null,
    color: cat?.color || null,
    description: cat?.description || '',
    enabled: cat?.enabled !== false,
    order: typeof cat?.order === 'number' ? cat.order : idx,
    groups: Array.isArray(cat?.groups)
      ? cat.groups.map((g, gIdx) => sanitizeGroup(g as Record<string, unknown>, String(idx), gIdx))
      : [],
  }));

  const cleanPreviewSections = previewSectionsData.map((section, idx) => ({
    id: section.id || `preview_${idx}_${Date.now()}`,
    title: String(section.title || '').trim().slice(0, 100),
    description: String(section.description || '').trim(),
    image: section.image || '',
    buttonText: String(section.buttonText || 'مشاهده جزئیات').trim(),
    buttonLink: section.buttonLink || '#',
    enabled: section.enabled !== false,
    position: section.position === 'right' ? 'right' : 'left',
    order: typeof section.order === 'number' ? section.order : idx,
  }));

  await db.collection('megaMenuSettings').updateOne(
    {},
    {
      $set: {
        categories: cleanCategories,
        previewSections: cleanPreviewSections,
        mainCategories: cleanCategories,
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );

  return { categories: cleanCategories, previewSections: cleanPreviewSections };
}
