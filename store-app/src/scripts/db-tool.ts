import { MongoClient, ObjectId } from 'mongodb';
import { config } from 'dotenv';

config({ path: '.env.local' });

const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017/store-app';
const client = new MongoClient(uri);

async function run() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: npx tsx src/scripts/db-tool.ts <collection> <operation> [query] [options]');
    process.exit(1);
  }

  const collectionName = args[0];
  const operation = args[1];
  const queryStr = args[2] || '{}';
  const optionsStr = args[3] || '{}';

  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection(collectionName);

    let query: any;
    try {
      // Helper to convert ObjectId strings to actual ObjectIds
      const reviver = (key: string, value: any) => {
        if (typeof value === 'string' && value.startsWith('ObjectId(') && value.endsWith(')')) {
          const id = value.substring(9, value.length - 1);
          return new ObjectId(id);
        }
        return value;
      };
      query = JSON.parse(queryStr, reviver);
    } catch (e: any) {
      console.error('Invalid JSON query:', e.message);
      process.exit(1);
    }

    let options: any;
    try {
      options = JSON.parse(optionsStr);
    } catch (e: any) {
      console.error('Invalid JSON options:', e.message);
      process.exit(1);
    }

    let result;
    if (operation === 'find') {
      result = await collection.find(query, options).toArray();
    } else if (operation === 'findOne') {
      result = await collection.findOne(query, options);
    } else if (operation === 'count') {
      result = await collection.countDocuments(query, options);
    } else if (operation === 'aggregate') {
      result = await collection.aggregate(query).toArray(); // query is pipeline array here
    } else if (operation === 'insertOne') {
      result = await collection.insertOne(query);
    } else if (operation === 'updateOne') {
      result = await collection.updateOne(query, options); // options is update doc here
    } else if (operation === 'deleteOne') {
      result = await collection.deleteOne(query);
    } else {
      console.error('Unknown operation:', operation);
      process.exit(1);
    }

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

run();
