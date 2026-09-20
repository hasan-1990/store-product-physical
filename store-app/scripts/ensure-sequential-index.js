#!/usr/bin/env node
/**
 * Create a unique index on products.sequentialId if it does not already exist.
 */
const { MongoClient } = require('mongodb');
(async () => {
  const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017/store-app';
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('store-app');
  const indexes = await db.collection('products').indexes();
  const has = indexes.find(i => i.key && i.key.sequentialId === 1);
  if (has) {
    console.log('Index on sequentialId already exists:', has.name);
  } else {
    await db.collection('products').createIndex({ sequentialId: 1 }, { unique: true, name: 'uniq_sequentialId' });
    console.log('Created unique index uniq_sequentialId');
  }
  await client.close();
})();
