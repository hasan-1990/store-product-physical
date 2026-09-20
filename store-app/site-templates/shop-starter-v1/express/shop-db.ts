import type { Collection, Db, Document } from 'mongodb';

export type ShopDb = {
  products: Collection<Document>;
  cartItems: Collection<Document>;
  orders: Collection<Document>;
  admins: Collection<Document>;
  siteContent: Collection<Document>;
  promoCodes: Collection<Document>;
  userProfiles: Collection<Document>;
};

export function getShopDb(db: Db): ShopDb {
  return {
    products: db.collection('products'),
    cartItems: db.collection('cartItems'),
    orders: db.collection('orders'),
    admins: db.collection('admins'),
    siteContent: db.collection('siteContent'),
    promoCodes: db.collection('promoCodes'),
    userProfiles: db.collection('userProfiles'),
  };
}
