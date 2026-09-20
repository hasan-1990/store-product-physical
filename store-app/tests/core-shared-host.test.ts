import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeHost, isHubHost, parseHubDomains } from '@core-shared/host';

describe('core-shared host', () => {
  it('normalizeHost strips www and port', () => {
    assert.equal(normalizeHost('WWW.Example.COM:4000'), 'example.com');
    assert.equal(normalizeHost('shop.example.com'), 'shop.example.com');
  });

  it('isHubHost recognizes configured hub domains', () => {
    const hubs = parseHubDomains('localhost,127.0.0.1,example.com');
    assert.equal(isHubHost('localhost', hubs), true);
    assert.equal(isHubHost('www.example.com', hubs), true);
    assert.equal(isHubHost('tenant-shop.ir', hubs), false);
  });
});
