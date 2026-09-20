#!/usr/bin/env node
/**
 * Resequence all products so sequentialId becomes a dense 1..N based on createdAt ascending.
 * Use ONLY if your numbering has gaps you want to remove.
 * Steps:
 * 1. Read products sorted by createdAt
 * 2. Assign new sequentialId starting at 1
 * 3. Bulk write updates
 * 4. Update counters.seq to last value
 *
 * SAFE: Keeps original _id, just updates sequentialId.
 * WARNING: If external references rely on old sequentialId values, DON'T run.
 */
const { MongoClient } = require('mongodb');
(async () => {
  const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017/store-app';
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('store-app');
  const products = await db.collection('products').find({}, { projection:{ _id:1, createdAt:1 } }).sort({ createdAt:1, _id:1 }).toArray();
  let seq = 0; const bulk = [];
  for (const p of products) {
    seq += 1;
    bulk.push({ updateOne: { filter:{ _id: p._id }, update:{ $set:{ sequentialId: seq, updatedAt: new Date() } } } });
  }
  if (bulk.length) {
    const res = await db.collection('products').bulkWrite(bulk);
    console.log('Bulk updated', res.modifiedCount, 'products');
    await db.collection('counters').updateOne({ _id:'product' }, { $set:{ seq } }, { upsert:true });
    console.log('Counter set to', seq);
  } else {
    console.log('No products found.');
  }
  await client.close();
})();
