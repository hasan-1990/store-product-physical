import { connectDB } from '@/lib/mongodb';
import { buildProductSlug, slugify } from '@/utils/helpers';
import { ObjectId } from 'mongodb';

/*
 * Migration steps:
 * 1. Ensure each product has sequentialId (using counters collection, continuing from max existing or counter)
 * 2. Ensure slug (brand/model enhanced) exists
 * 3. Reconstruct categoryPath if missing (walk parentId chain)
 * 4. Optionally trim obsolete fields
 */
async function rebuildCategoryPath(db: any, categoryId: any) {
  if (!categoryId) return [];
  const cat = await db.categories.findOne({ _id: new ObjectId(categoryId) });
  if (!cat) return [];
  const path: any[] = [];
  async function walk(c: any) {
    if (c.parentId) {
      const parent = await db.categories.findOne({ _id: c.parentId });
      if (parent) await walk(parent);
    }
    path.push({ slug: c.slug, name: c.name, _id: c._id });
  }
  await walk(cat);
  return path;
}

async function main() {
  const db = await connectDB();
  const countersCol = db.getCollection('counters');

  // Determine starting seq based on current counter and max existing
  const counterDoc: any = await countersCol.findOne({ _id: 'product' } as any);
  const maxProduct = await db.products.find({}, { projection: { sequentialId: 1 } }).sort({ sequentialId: -1 }).limit(1).toArray();
  const maxExisting = maxProduct[0]?.sequentialId || 0;
  const currentCounter = counterDoc?.seq || 0;
  let nextSeq = Math.max(maxExisting, currentCounter);

  const cursor = db.products.find({});
  let updated = 0;
  while (await cursor.hasNext()) {
    const p:any = await cursor.next();
    if (!p) continue;
    const update: any = {};
    let needs = false;

    if (!p.sequentialId || typeof p.sequentialId !== 'number') {
      nextSeq += 1;
      update.sequentialId = nextSeq;
      needs = true;
    }

    if (!p.slug || !p.slug.trim()) {
      const brand = p.technicalSpecs?.brand;
      const model = p.technicalSpecs?.model;
      update.slug = buildProductSlug({ name: p.name || 'product', brand, model });
      needs = true;
    } else {
      // normalize existing slug
      update.slug = slugify(p.slug);
    }

    if ((!p.categoryPath || !Array.isArray(p.categoryPath) || p.categoryPath.length === 0) && p.categoryId) {
      update.categoryPath = await rebuildCategoryPath(db, p.categoryId);
      needs = true;
    }

    if (needs) {
      await db.products.updateOne({ _id: p._id }, { $set: update });
      updated += 1;
    }
  }

  // sync counter document
  await countersCol.updateOne(
    { _id: 'product' } as any,
    { $set: { seq: nextSeq || 0 } } as any,
    { upsert: true }
  );

  console.log(`✅ Migration complete. Updated products: ${updated}. Final counter seq=${nextSeq}`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
