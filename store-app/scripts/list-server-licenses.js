const { MongoClient } = require('mongodb');

async function run() {
  const client = new MongoClient(process.env.DATABASE_URL);

  try {
    await client.connect();
    const db = client.db();
    const licenses = await db.collection('licenses').find({}).toArray();

    console.log('Licenses count:', licenses.length);
    for (const license of licenses) {
      console.log(JSON.stringify({
        licenseKey: license.licenseKey,
        domain: license.domain,
        productId: license.productId,
        userId: license.userId,
        createdAt: license.createdAt
      }, null, 2));
    }
  } catch (error) {
    console.error('Error listing licenses:', error);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

run();
