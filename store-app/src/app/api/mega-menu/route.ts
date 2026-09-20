import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CacheManager, CACHE_KEYS, CACHE_TTL } from '@/lib/cache-manager';

// Public (frontend) mega menu endpoint
export async function GET() {
  try {
    const cacheKey = `${CACHE_KEYS.SETTINGS}mega-menu`;
    
    // Try to get from cache first
    const cachedMenu = await CacheManager.get(cacheKey);
    if (cachedMenu) {
      console.log('MegaMenu: Serving from cache');
      return NextResponse.json(cachedMenu);
    }

    console.log('MegaMenu: Fetching from database');
    const mongodb = await connectDB();
    const collection = mongodb.megaMenuSettings;
    const doc = await collection.findOne({});

    const categoriesSource = Array.isArray(doc?.categories)
      ? doc.categories
      : (Array.isArray(doc?.mainCategories) ? doc.mainCategories : []);

    const mapItem = (it: any) => ({
      id: it?.id,
      title: it?.title,
      href: it?.href || '#',
      image: it?.image,
      price: it?.price,
      discount: it?.discount,
      isNew: it?.isNew,
      isPopular: it?.isPopular
    });

    const enabledCategories = (categoriesSource || [])
      .filter((c: any) => c?.enabled !== false)
      .sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0));

    // Helper to collect titles recursively
    const titlesNeedingSlug = new Set<string>();
    const collectTitles = (items: any[]) => {
      for (const item of items) {
        if (!item?.slug && typeof item?.title === 'string' && item.title.trim().length > 0) {
          titlesNeedingSlug.add(item.title.trim());
        }
        if (Array.isArray(item?.groups)) collectTitles(item.groups);
        if (Array.isArray(item?.children)) collectTitles(item.children);
      }
    };
    
    collectTitles(enabledCategories);

    const slugByTitle = new Map<string, string>();
    if (titlesNeedingSlug.size > 0) {
      const categoriesCollection = mongodb.categories;
      const titleArray = Array.from(titlesNeedingSlug);
      const dbCategories = await categoriesCollection
        .find(
          {
            $or: [
              { name: { $in: titleArray } },
              { title: { $in: titleArray } }
            ],
            slug: { $exists: true, $ne: '' }
          },
          { projection: { name: 1, title: 1, slug: 1 } }
        )
        .toArray();

      for (const cat of dbCategories as any[]) {
        const nameKey = (typeof cat?.name === 'string' && cat.name.trim()) ? cat.name.trim() : '';
        const titleKey = (typeof cat?.title === 'string' && cat.title.trim()) ? cat.title.trim() : '';
        const slug = typeof cat?.slug === 'string' ? cat.slug : '';
        
        if (slug) {
            if (nameKey) slugByTitle.set(nameKey, slug);
            if (titleKey) slugByTitle.set(titleKey, slug);
        }
      }
    }

    const mapGroup = (g: any): any => {
      const items = (g?.items || [])
        .filter((it: any) => it?.enabled !== false)
        .sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0))
        .map(mapItem);

      const children = (g?.children || [])
        .filter((child: any) => child?.enabled !== false)
        .sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0))
        .map(mapGroup);

      const slug = g?.slug || (typeof g?.title === 'string' ? slugByTitle.get(g.title.trim()) : undefined);

      return {
        id: g?.id,
        title: g?.title,
        slug,
        items,
        ...(children.length > 0 ? { children } : {})
      };
    };

    const mainCategories = enabledCategories.map((c: any) => ({
      id: c?.id,
      title: c?.title,
      slug: c?.slug || (typeof c?.title === 'string' ? slugByTitle.get(c.title.trim()) : undefined),
      groups: (c?.groups || [])
        .filter((g: any) => g?.enabled !== false)
        .sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0))
        .map(mapGroup)
    }));

    // Get active preview sections
    const previewSections = (doc?.previewSections || [])
      .filter((ps: any) => ps?.active !== false)
      .sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0))
      .map((ps: any) => ({
        id: ps?.id || ps?._id,
        title: ps?.title,
        description: ps?.description,
        image: ps?.image,
        buttonText: ps?.buttonText,
        buttonLink: ps?.buttonLink,
        position: ps?.position || 'top',
        order: ps?.order ?? 0
      }));

    const response = { 
      success: true, 
      data: mainCategories,
      previewSections
    };
    
    // Cache for 1 hour
    await CacheManager.set(cacheKey, response, CACHE_TTL.MENU);

    return NextResponse.json(response);
  } catch (e) {
    return NextResponse.json({ success: false, error: 'خطا در دریافت مگامنو' }, { status: 500 });
  }
}
