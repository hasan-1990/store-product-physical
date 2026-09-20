import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createCategorySchema } from '../packages/core-server/src/hub/services/categories';

describe('hub catalog', () => {
  it('validates create category payload', () => {
    const parsed = createCategorySchema.parse({
      name: 'آرایش',
      slug: 'makeup',
      active: true,
      order: 1,
    });
    assert.equal(parsed.slug, 'makeup');
    assert.equal(parsed.level, 0);
  });

  it('rejects short slug', () => {
    assert.throws(() => createCategorySchema.parse({ name: 'x', slug: 'a' }));
  });
});
