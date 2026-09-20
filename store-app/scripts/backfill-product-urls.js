#!/usr/bin/env node
/**
 * Backfill script for products:
 * 1. Ensure every product has a sequentialId (using counters collection if missing)
 * 2. Ensure every product has a slug (slugify name)
 * 3. Build categoryPath recursively if missing but categoryId exists
 * 4. Optionally remove ObjectId based URL cache remnants
 *
 * Usage (PowerShell):
 *   node .\scripts\backfill-product-urls.js
 */

const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

function slugify(str) {
  if (!str) return '';
  return str
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\u200C\u200F]/g, '') // zero-width chars
    .replace(/[^\w\u0600-\u06FF]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

async function buildCategoryPath(db, categoryId) {
  const cat = await db.collection('categories').findOne({ _id: new ObjectId(categoryId) });
  if (!cat) return [];
  const parent = cat.parentId ? await buildCategoryPath(db, cat.parentId) : [];
  return [...parent, { slug: cat.slug, name: cat.name }];
}

(async () => {
  const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017/store-app';
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('store-app');

  const products = await db.collection('products').find({}).toArray();
  let updates = 0;
  for (const p of products) {
    const set = {};

    if (!p.sequentialId) {
      const counter = await db.collection('counters').findOneAndUpdate(
        { _id: 'product' },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' }
      );
      set.sequentialId = counter.value?.seq || counter.seq || 1;
    }

    if (!p.slug && p.name) {
      set.slug = slugify(p.name);
    }

    if ((!p.categoryPath || !Array.isArray(p.categoryPath) || p.categoryPath.length === 0) && p.categoryId) {
      try {
        set.categoryPath = await buildCategoryPath(db, p.categoryId);
      } catch (e) {
        console.warn('Failed building categoryPath for', p._id.toString(), e.message);
      }
    }

    if (Object.keys(set).length > 0) {
      set.updatedAt = new Date();
      await db.collection('products').updateOne({ _id: p._id }, { $set: set });
      updates++;
      console.log('Updated product', p._id.toString(), set);
    }
  }

  console.log(`Backfill complete. Products scanned: ${products.length}, updated: ${updates}`);
  await client.close();
})();
