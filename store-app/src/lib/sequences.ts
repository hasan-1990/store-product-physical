import { connectDB } from '@/lib/mongodb';

/**
 * Get next auto-increment sequence for a given key (e.g. 'product').
 * Uses a counters collection document with _id = key and a seq field.
 * Ensures atomic increment via findOneAndUpdate. Retries a few times on transient errors.
 */
export async function getNextSequence(key: string, retries = 3): Promise<number> {
  const db = await connectDB();
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res: any = await db.getCollection('counters').findOneAndUpdate(
        { _id: key } as any,
        { $inc: { seq: 1 } } as any,
        { upsert: true, returnDocument: 'after' }
      );
      const seq = res?.value?.seq ?? res?.seq;
      if (typeof seq === 'number') return seq;
      // fallback initialize if somehow missing
      const init: any = await db.getCollection('counters').findOneAndUpdate(
        { _id: key } as any,
        { $setOnInsert: { seq: 1 } } as any,
        { upsert: true, returnDocument: 'after' }
      );
      return init?.value?.seq || 1;
    } catch (e) {
      if (attempt === retries) throw e;
      await new Promise(r => setTimeout(r, 50 * (attempt + 1)));
    }
  }
  return 1; // unreachable ideally
}

/** 
 * Convenience wrapper for product sequential IDs
 * Returns the smallest available ID starting from 1
 * Fills gaps left by deleted products
 */
export async function getNextProductSequence(): Promise<number> {
  try {
    const db = await connectDB();
    
    // Get count of current products
    const count = await db.products.countDocuments();
    
    // If no products exist, start from 1
    if (count === 0) {
      return 1;
    }
    
    // Get all existing sequentialIds to find gaps
    const existingProducts = await db.products
      .find({}, { projection: { sequentialId: 1 } })
      .sort({ sequentialId: 1 })
      .toArray();
    
    // Create a Set of used IDs for fast lookup
    const usedIds = new Set(
      existingProducts
        .map(p => p.sequentialId)
        .filter((id): id is number => typeof id === 'number')
    );
    
    // Find the first available ID starting from 1
    // Loop up to count + 1 to ensure we find a gap or get the next sequential
    for (let i = 1; i <= count + 1; i++) {
      if (!usedIds.has(i)) {
        return i;
      }
    }
    
    // Fallback: return count + 1 (should never reach here in normal cases)
    return count + 1;
  } catch (error) {
    console.error('Error getting next product sequence:', error);
    // Fallback to counter-based sequence if query fails
    return getNextSequence('product');
  }
}
