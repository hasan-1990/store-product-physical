import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CacheManager, CACHE_KEYS } from '@/lib/cache-manager';

/*
Shape stored in megaMenuSettings collection (single document):
{
  categories: [
    {
      id: string,
      title: string,
      slug: string,
      icon?: string,
      color?: string,
      description?: string,
      enabled: boolean,
      order: number,
      groups: [
        {
          id: string,
          title: string,
          description?: string,
          enabled: boolean,
          order: number,
          items: [
            {
              id: string,
              title: string,
              href?: string,
              image?: string,
              price?: number,
              discount?: number,
              isNew?: boolean,
              isPopular?: boolean,
              description?: string,
              enabled: boolean,
              order: number
            }
          ]
          children?: Array<{
            id: string,
            title: string,
            description?: string,
            enabled: boolean,
            order: number,
            items: Array<{
              id: string,
              title: string,
              href?: string,
              image?: string,
              price?: number,
              discount?: number,
              isNew?: boolean,
              isPopular?: boolean,
              description?: string,
              enabled: boolean,
              order: number
            }>
          }>
        }
      ]
    }
  ],
  previewSections: [
    {
      id: string,
      title: string,
      description: string,
      image: string,
      buttonText: string,
      buttonLink: string,
      enabled: boolean,
      position: 'left' | 'right',
      order: number
    }
  ],
  updatedAt: Date
}
*/

export async function GET() {
  try {
    console.log('🔄 GET /api/admin/mega-menu-settings');
    const mongodb = await connectDB();
    const collection = mongodb.megaMenuSettings;
    const doc = await collection.findOne({});
    
    console.log('📦 Loaded document:', doc ? 'exists' : 'not found');
    
    const result = {
      categories: doc?.categories || [],
      previewSections: doc?.previewSections || []
    };
    
    console.log('✅ Returning:', {
      categoriesCount: result.categories.length,
      previewSectionsCount: result.previewSections.length
    });
    
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error('❌ GET error:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('💾 PUT /api/admin/mega-menu-settings');
    console.log('📦 Received body keys:', Object.keys(body));
    
    // Basic validation
    if (!body || (!Array.isArray(body.categories) && !Array.isArray(body.mainCategories))) {
      console.error('❌ Invalid body - no categories array');
      return NextResponse.json({ success: false, error: 'داده نامعتبر است - categories آرایه نیست' }, { status: 400 });
    }

    // Support both new (categories) and old (mainCategories) format
    const categoriesData = body.categories || body.mainCategories || [];
    const previewSectionsData = body.previewSections || [];
    
    console.log('📊 Processing:', {
      categories: categoriesData.length,
      previewSections: previewSectionsData.length
    });

    const sanitizeItem = (it: any, fallbackId: string, order: number) => ({
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
      order: typeof it?.order === 'number' ? it.order : order
    });

    const sanitizeGroup = (g: any, path: string, idx: number): any => {
      const groupId = g?.id || `grp_${path}_${idx}_${Date.now()}`;
      const items = Array.isArray(g?.items)
        ? g.items.map((it: any, iIdx: number) => sanitizeItem(it, `itm_${path}_${idx}_${iIdx}_${Date.now()}`, iIdx))
        : [];

      const children = Array.isArray(g?.children)
        ? g.children.map((child: any, cIdx: number) => sanitizeGroup(child, `${path}_${idx}`, cIdx))
        : [];

      return {
        id: groupId,
        title: String(g?.title || '').trim().slice(0, 100),
        description: g?.description || '',
        enabled: g?.enabled !== false,
        order: typeof g?.order === 'number' ? g.order : idx,
        items,
        ...(children.length > 0 ? { children } : {})
      };
    };

    // Sanitize categories (supports nested groups via children)
    const cleanCategories = categoriesData.map((cat: any, idx: number) => ({
      id: cat?.id || `cat_${idx}_${Date.now()}`,
      title: String(cat?.title || '').trim().slice(0, 100),
      slug: cat?.slug || `cat-${idx}`,
      icon: cat?.icon || null,
      color: cat?.color || null,
      description: cat?.description || '',
      enabled: cat?.enabled !== false,
      order: typeof cat?.order === 'number' ? cat.order : idx,
      groups: Array.isArray(cat?.groups) ? cat.groups.map((g: any, gIdx: number) => sanitizeGroup(g, String(idx), gIdx)) : []
    }));

    // Sanitize preview sections
    const cleanPreviewSections = previewSectionsData.map((section: any, idx: number) => ({
      id: section.id || `preview_${idx}_${Date.now()}`,
      title: String(section.title || '').trim().slice(0, 100),
      description: String(section.description || '').trim(),
      image: section.image || '',
      buttonText: String(section.buttonText || 'مشاهده جزئیات').trim(),
      buttonLink: section.buttonLink || '#',
      enabled: section.enabled !== false,
      position: section.position === 'right' ? 'right' : 'left',
      order: typeof section.order === 'number' ? section.order : idx
    }));

    console.log('✅ Clean data:', {
      categoriesCount: cleanCategories.length,
      totalGroups: cleanCategories.reduce((sum: number, cat: any) => sum + (cat.groups?.length || 0), 0),
      totalItems: cleanCategories.reduce((sum: number, cat: any) => 
        sum + (cat.groups?.reduce((gSum: number, g: any) => gSum + (g.items?.length || 0), 0) || 0), 0
      ),
      previewSectionsCount: cleanPreviewSections.length
    });

    const mongodb = await connectDB();
    const collection = mongodb.megaMenuSettings;

    // Store both formats for backward compatibility
    const updateResult = await collection.updateOne(
      {},
      { 
        $set: { 
          categories: cleanCategories,
          previewSections: cleanPreviewSections,
          mainCategories: cleanCategories, // For backward compatibility
          updatedAt: new Date() 
        } 
      },
      { upsert: true }
    );

    console.log('💾 Database update result:', {
      matched: updateResult.matchedCount,
      modified: updateResult.modifiedCount,
      upserted: updateResult.upsertedCount
    });

    // Invalidate mega menu cache
    await CacheManager.invalidatePattern(`${CACHE_KEYS.SETTINGS}mega-menu*`);
    console.log('🗑️ Cache invalidated');

    return NextResponse.json({ 
      success: true, 
      data: { 
        categories: cleanCategories,
        previewSections: cleanPreviewSections
      } 
    });
  } catch (err) {
    console.error('❌ MegaMenu PUT error:', err);
    return NextResponse.json({ success: false, error: (err as any)?.message || String(err) }, { status: 500 });
  }
}
