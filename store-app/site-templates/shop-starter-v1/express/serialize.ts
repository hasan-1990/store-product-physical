export function serializeDoc<T extends Record<string, unknown>>(doc: T): T & { id: string } {
  const { _id, ...rest } = doc;
  const id =
    _id && typeof _id === 'object' && 'toString' in _id
      ? String((_id as { toString(): string }).toString())
      : String(_id ?? '');
  return { ...rest, id } as T & { id: string };
}
