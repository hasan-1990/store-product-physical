import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { verifyHubToken } from '../packages/core-server/src/hub/auth';

describe('hub auth', () => {
  it('verifies valid JWT', () => {
    process.env.JWT_SECRET = 'test-secret-at-least-32-chars-long!!';
    const token = jwt.sign(
      { userId: 'u1', email: 'a@b.com', role: 'admin' },
      process.env.JWT_SECRET,
    );
    const user = verifyHubToken(token);
    assert.equal(user?.id, 'u1');
    assert.equal(user?.role, 'admin');
  });

  it('rejects invalid token', () => {
    assert.equal(verifyHubToken('invalid'), null);
  });
});
