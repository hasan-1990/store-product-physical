import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cdnUrl, uploadsUrl, isCdnEnabled } from '../src/lib/cdn';

describe('CDN helpers', () => {
  const env = { ...process.env };

  it('returns path unchanged when CDN not set', () => {
    delete process.env.CDN_URL;
    delete process.env.NEXT_PUBLIC_CDN_URL;
    assert.equal(cdnUrl('/logo.png'), '/logo.png');
    assert.equal(isCdnEnabled(), false);
  });

  it('prefixes asset path with CDN base', () => {
    process.env.CDN_URL = 'https://cdn.example.com/';
    assert.equal(cdnUrl('/_next/static/chunk.js'), 'https://cdn.example.com/_next/static/chunk.js');
    assert.equal(isCdnEnabled(), true);
  });

  it('builds uploads URL', () => {
    process.env.CDN_UPLOADS_URL = 'https://static.example.com';
    assert.equal(uploadsUrl('products/a.webp'), 'https://static.example.com/uploads/products/a.webp');
  });

  process.env = env;
});
