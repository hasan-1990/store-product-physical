import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { isDevOnlyApiRoute, isDevRouteAllowed } from '../src/lib/dev-routes';
import { getJwtSecret } from '../src/lib/secrets';

describe('dev-routes (auth/security)', () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it('blocks debug and test API paths in production', () => {
    (process.env as any).NODE_ENV = 'production';
    process.env.ALLOW_DEV_ROUTES = 'false';

    assert.equal(isDevOnlyApiRoute('/api/debug/session'), true);
    assert.equal(isDevOnlyApiRoute('/api/test-db'), true);
    assert.equal(isDevOnlyApiRoute('/api/simple-test'), true);
    assert.equal(isDevRouteAllowed(), false);
  });

  it('allows dev routes in development', () => {
    (process.env as any).NODE_ENV = 'development';
    assert.equal(isDevRouteAllowed(), true);
  });
});

describe('JWT secrets', () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    (process.env as any).NODE_ENV = 'test';
    delete process.env.JWT_SECRET;
  });

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it('returns dev fallback when JWT_SECRET unset outside production', () => {
    const secret = getJwtSecret();
    assert.ok(secret.length >= 32);
  });

  it('throws in production without JWT_SECRET', () => {
    (process.env as any).NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    assert.throws(() => getJwtSecret(), /JWT_SECRET/);
  });
});
