import { ObjectId } from 'mongodb';

export function serializeId(value: unknown): string {
  if (value instanceof ObjectId) return value.toString();
  if (typeof value === 'string') return value;
  return String(value ?? '');
}

export function serializeDoc<T extends Record<string, unknown>>(doc: T): T & { id: string } {
  const { _id, ...rest } = doc;
  return {
    ...rest,
    id: serializeId(_id),
  } as T & { id: string };
}
