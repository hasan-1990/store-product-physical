import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import smsClient from '../src/lib/sms';
import { SMSService } from '../src/lib/sms-service';

describe('SMS unified facade', () => {
  it('sms-service delegates to sms client for mobile validation', () => {
    assert.equal(smsClient.isValidIranianMobile('09123456789'), true);
    assert.equal(smsClient.isValidIranianMobile('invalid'), false);
  });

  it('SMSService exposes static auth API', () => {
    assert.equal(typeof SMSService.sendVerificationCode, 'function');
    assert.equal(typeof SMSService.getCredit, 'function');
  });

  it('formats Iranian mobile for SMS.ir', () => {
    const formatted = smsClient.formatMobileNumber('09123456789');
    assert.ok(formatted.startsWith('98'));
  });
});
