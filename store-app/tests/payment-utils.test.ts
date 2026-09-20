import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getStatusMessage } from '../src/utils/zarinpal-messages';

describe('Zarinpal payment status messages', () => {
  it('returns success message for code 100', () => {
    assert.equal(getStatusMessage(100), 'تراکنش با موفقیت انجام شد');
  });

  it('returns verified message for code 101', () => {
    assert.equal(getStatusMessage(101), 'تراکنش وریفای شده است');
  });

  it('returns known error for invalid authority', () => {
    assert.match(getStatusMessage(-54), /اتوریتی/);
  });

  it('returns fallback for unknown codes', () => {
    assert.match(getStatusMessage(9999), /9999/);
  });
});
