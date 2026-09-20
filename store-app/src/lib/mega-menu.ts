import { connectDB } from '@/lib/mongodb';

export interface UIMegaMenuItem {
  id: string;
  title: string;
  color?: string;
  enabled: boolean;
  order: number;
  groups: {
    id: string;
    title: string;
    enabled: boolean;
    order: number;
    items: { id: string; title: string; href?: string; enabled: boolean; order: number }[];
  }[];
}

export async function fetchMegaMenuData(): Promise<UIMegaMenuItem[]> {
  try {
    const mongodb = await connectDB();
    const collection = mongodb.megaMenuSettings;
    const doc = await collection.findOne({});
    if (!doc || !Array.isArray(doc.mainCategories)) return [];
    return doc.mainCategories.filter((c: any) => c.enabled !== false).sort((a: any,b: any)=> (a.order??0)-(b.order??0));
  } catch (e) {
    console.error('fetchMegaMenuData error', e);
    return [];
  }
}
