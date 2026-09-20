import { Collection, Db, ObjectId, Filter } from 'mongodb';

type IdLike = string | ObjectId;
type DbLike = Db | { categories: Collection };

function toIdString(id: IdLike): string {
  return id instanceof ObjectId ? id.toString() : String(id);
}

function getCategoriesCollection(db: DbLike): Collection {
  if ('categories' in db && db.categories) {
    return db.categories;
  }
  return (db as Db).collection('categories');
}

/** Query that matches _id stored as ObjectId OR string (after JSON restore) */
export function categoryIdFilter(id: IdLike): Filter<any> {
  const str = toIdString(id);
  if (!ObjectId.isValid(str)) {
    return { _id: str } as Filter<any>;
  }
  const oid = new ObjectId(str);
  return { $or: [{ _id: oid }, { _id: str }] } as Filter<any>;
}

/** Query for categoryId / parentId fields that may be ObjectId or string */
export function categoryRefFilter(field: string, id: IdLike) {
  const str = toIdString(id);
  if (!ObjectId.isValid(str)) {
    return { [field]: str };
  }
  const oid = new ObjectId(str);
  return { [field]: { $in: [oid, str] } };
}

export async function findCategoryById(db: DbLike, categoryId: IdLike) {
  return getCategoriesCollection(db).findOne(categoryIdFilter(categoryId));
}

export async function buildCategoryPath(
  db: DbLike,
  categoryId: IdLike
): Promise<Array<{ slug: string; name: string }>> {
  const cat = await findCategoryById(db, categoryId);
  if (!cat) return [];

  let parentPath: Array<{ slug: string; name: string }> = [];
  if (cat.parentId) {
    parentPath = await buildCategoryPath(db, cat.parentId);
  }

  return [...parentPath, { slug: cat.slug, name: cat.name }];
}

export function toObjectId(id: IdLike): ObjectId {
  return id instanceof ObjectId ? id : new ObjectId(toIdString(id));
}
