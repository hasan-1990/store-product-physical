const { MongoClient } = require('mongodb');

async function run() {
  const client = new MongoClient(process.env.DATABASE_URL);

  try {
    await client.connect();
    const db = client.db();
    const licenses = await db.collection('licenses').find({}).toArray();

    console.log(JSON.stringify(licenses, null, 2));
  } catch (error) {
    console.error('Error listing licenses:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();
