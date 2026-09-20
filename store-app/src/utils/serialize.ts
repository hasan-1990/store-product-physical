// Utility to deeply serialize MongoDB documents (ObjectId, Date) to plain JSON-safe primitives
// Avoids Next.js "Only plain objects" serialization errors when passing props to Client Components.

import { ObjectId } from 'mongodb';

export function serializeValue(value: any): any {
  if (value == null) return value;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof ObjectId) return value.toString();
  if (Array.isArray(value)) return value.map(v => serializeValue(v));
  if (typeof value === 'object') {
    // Some objects may expose toJSON that returns non-plain; we ignore and manually rebuild
    const plain: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      plain[k] = serializeValue(v);
    }
    return plain;
  }
  return value;
}

export function serializeDoc<T = any>(doc: any): T {
  return serializeValue(doc) as T;
}

export function serializeDocs<T = any>(docs: any[]): T[] {
  return docs.map(d => serializeDoc<T>(d));
}
