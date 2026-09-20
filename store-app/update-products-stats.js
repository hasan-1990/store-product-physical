// Connect to MongoDB and update all products with random stats
db = db.getSiblingDB('store_db');

const result = db.products.updateMany(
  {},
  [
    {
      $set: {
        views: { $floor: { $multiply: [{ $rand: {} }, 1000] } },
        soldCount: { $floor: { $multiply: [{ $rand: {} }, 300] } },
        salesCount: { $floor: { $multiply: [{ $rand: {} }, 200] } },
        rating: { $round: [{ $add: [3, { $multiply: [{ $rand: {} }, 2] }] }, 1] },
        ratingCount: { $floor: { $multiply: [{ $rand: {} }, 100] } }
      }
    }
  ]
);

print('✅ Updated', result.modifiedCount, 'products with random stats');

// Show sample products
print('\n📦 Sample products:');
db.products.find({}, {name: 1, views: 1, soldCount: 1, rating: 1, _id: 0}).limit(5).forEach(p => {
  print(JSON.stringify(p));
});
